const { prisma } = require("../config/database");
const { AppError } = require("../utils/AppError");
const { toDateOnly } = require("../utils/date");
const { toPrismaPage, paginated } = require("../utils/pagination");
const { notify } = require("./notification.service");
const { withDeadline } = require("./submission.service");

const person = { select: { id: true, name: true, email: true } };

const listInclude = {
  faculty: person,
  proposedBy: person,
  teams: { include: { leader: { select: { id: true, name: true } }, members: person } },
  _count: { select: { submissions: true, teams: true } },
};

// Which projects a user can see.
const scopeFor = async (user) => {
  switch (user.role) {
    case "FACULTY":
      return { facultyId: user.id };
    case "HOD":
      return { faculty: { department: user.department } };
    case "ADMIN":
      return {};
    default: {
      const me = await prisma.user.findUnique({ where: { id: user.id }, include: { team: true } });
      return { OR: [{ proposedById: user.id }, ...(me?.team ? [{ id: me.team.projectId }] : [])] };
    }
  }
};

const dateFields = (data) => ({
  ...(data.startDate !== undefined ? { startDate: data.startDate ? toDateOnly(data.startDate) : null } : {}),
  ...(data.deadline !== undefined ? { deadline: data.deadline ? toDateOnly(data.deadline) : null } : {}),
});

const listProjects = async (user, query) => {
  const where = {
    AND: [
      await scopeFor(user),
      query.status ? { status: query.status } : {},
      query.domain ? { domain: query.domain } : {},
      query.facultyId && ["ADMIN", "HOD"].includes(user.role) ? { facultyId: query.facultyId } : {},
      query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { description: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {},
    ],
  };

  const [items, total, domains] = await Promise.all([
    prisma.project.findMany({
      where,
      include: listInclude,
      // Projects without a deadline sort after those with one.
      orderBy: [
        query.sort === "deadline" ? { deadline: { sort: query.order, nulls: "last" } } : { [query.sort]: query.order },
        { createdAt: "desc" },
      ],
      ...toPrismaPage(query),
    }),
    prisma.project.count({ where }),
    prisma.project.findMany({ where: await scopeFor(user), distinct: ["domain"], select: { domain: true } }),
  ]);

  return { ...paginated(items, total, query), domains: domains.map((d) => d.domain).sort() };
};

const getProjectById = async (id, user) => {
  const project = await prisma.project.findFirst({
    where: { AND: [{ id }, await scopeFor(user)] },
    include: {
      ...listInclude,
      submissions: {
        include: { student: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
  if (!project) throw new AppError("Project not found", 404);
  // Students only see their own reports inside a project.
  const submissions = project.submissions
    .filter((s) => user.role !== "STUDENT" || s.studentId === user.id)
    .map((s) => withDeadline({ ...s, project }));
  return { ...project, submissions };
};

const createProject = async (facultyId, data) =>
  prisma.project.create({
    data: {
      title: data.title,
      description: data.description,
      domain: data.domain,
      progressPercentage: data.progressPercentage ?? 0,
      status: "APPROVED",
      facultyId,
      ...dateFields(data),
    },
    include: listInclude,
  });

const proposeProject = async (student, data) => {
  const faculty = await prisma.user.findUnique({ where: { id: data.facultyId } });
  if (!faculty || faculty.role !== "FACULTY" || !faculty.isActive) {
    throw new AppError("Choose an active faculty member", 400);
  }
  const pending = await prisma.project.findFirst({ where: { proposedById: student.id, status: "PROPOSED" } });
  if (pending) throw new AppError("You already have a proposal waiting for review", 409);

  const project = await prisma.project.create({
    data: {
      title: data.title,
      description: data.description,
      domain: data.domain,
      status: "PROPOSED",
      facultyId: faculty.id,
      proposedById: student.id,
      ...dateFields(data),
    },
    include: listInclude,
  });
  await notify(faculty.id, `${student.name} proposed a project: "${project.title}"`, "PROJECT_PROPOSED");
  return project;
};

const findManageable = async (id, user) => {
  const project = await prisma.project.findFirst({
    where: { id, ...(user.role === "FACULTY" ? { facultyId: user.id } : {}) },
  });
  if (!project) throw new AppError("Project not found or access denied", 404);
  return project;
};

// Approving a student's proposal also creates their team with them as leader,
// in one transaction so we never end up with an approved project and no team.
const reviewProposal = async (id, reviewer, { decision, remark }) => {
  const project = await findManageable(id, reviewer);
  if (project.status !== "PROPOSED") throw new AppError("Only proposals waiting for review can be approved or rejected", 400);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.project.update({
      where: { id },
      data: { status: decision, reviewRemark: remark ?? null },
    });

    if (decision === "APPROVED" && project.proposedById) {
      const proposer = await tx.user.findUnique({ where: { id: project.proposedById } });
      if (proposer && !proposer.teamId) {
        const team = await tx.team.create({
          data: { name: `${project.title} Team`, projectId: id, leaderId: proposer.id },
        });
        await tx.user.update({ where: { id: proposer.id }, data: { teamId: team.id } });
      }
    }
    return result;
  });

  await notify(
    project.proposedById,
    decision === "APPROVED"
      ? `Your project "${project.title}" was approved`
      : `Your project "${project.title}" was rejected: ${remark}`,
    "PROJECT_REVIEWED"
  );
  return updated;
};

const updateProject = async (id, user, data) => {
  const project = await findManageable(id, user);
  if (data.status && ["PROPOSED", "REJECTED"].includes(project.status)) {
    throw new AppError("Review the proposal before changing its status", 400);
  }
  const { startDate, deadline, ...rest } = data;
  return prisma.project.update({
    where: { id },
    data: {
      ...rest,
      ...dateFields({ startDate, deadline }),
      ...(data.status === "COMPLETED" ? { progressPercentage: 100 } : {}),
    },
    include: listInclude,
  });
};

const assignFaculty = async (id, facultyId) => {
  const faculty = await prisma.user.findUnique({ where: { id: facultyId } });
  if (!faculty || faculty.role !== "FACULTY" || !faculty.isActive) throw new AppError("Choose an active faculty member", 400);
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new AppError("Project not found", 404);
  const updated = await prisma.project.update({ where: { id }, data: { facultyId }, include: listInclude });
  await notify(facultyId, `You are now the faculty for "${project.title}"`, "PROJECT_ASSIGNED");
  return updated;
};

const deleteProject = async (id, user) => {
  await findManageable(id, user);
  // Students in the project's teams are released before the cascade removes the teams.
  await prisma.$transaction([
    prisma.user.updateMany({ where: { team: { projectId: id } }, data: { teamId: null } }),
    prisma.project.delete({ where: { id } }),
  ]);
  return { message: "Project deleted successfully" };
};

module.exports = {
  listProjects,
  getProjectById,
  createProject,
  proposeProject,
  reviewProposal,
  updateProject,
  assignFaculty,
  deleteProject,
};

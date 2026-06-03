const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  await prisma.attendance.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.user.updateMany({ data: { teamId: null } });
  await prisma.team.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("password123", 12);

  const faculty = await prisma.user.create({
    data: {
      name: "Dr. Jane Faculty",
      email: "faculty@university.edu",
      password,
      role: "FACULTY",
    },
  });

  const student1 = await prisma.user.create({
    data: {
      name: "Alex Student",
      email: "alex@student.edu",
      password,
      role: "STUDENT",
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: "Sam Student",
      email: "sam@student.edu",
      password,
      role: "STUDENT",
    },
  });

  const project = await prisma.project.create({
    data: {
      title: "AI Research Portal",
      description: "Building an intelligent faculty-student project management system.",
      facultyId: faculty.id,
      progressPercentage: 35,
    },
  });

  const team = await prisma.team.create({
    data: {
      name: "Team Alpha",
      projectId: project.id,
    },
  });

  await prisma.user.update({
    where: { id: student1.id },
    data: { teamId: team.id },
  });

  await prisma.user.update({
    where: { id: student2.id },
    data: { teamId: team.id },
  });

  const submission = await prisma.submission.create({
    data: {
      weekNumber: 1,
      title: "Week 1 Progress",
      description: "Completed project setup and initial API design.",
      status: "PENDING",
      studentId: student1.id,
      projectId: project.id,
    },
  });

  await prisma.attendance.create({
    data: {
      studentId: student1.id,
      submissionId: submission.id,
      weekNumber: 1,
      status: "PRESENT",
    },
  });

  console.log("Seed completed:");
  console.log("  Faculty: faculty@university.edu / password123");
  console.log("  Student: alex@student.edu / password123");
  console.log("  Student: sam@student.edu / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

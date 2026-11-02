import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileText,
  FolderKanban,
  GraduationCap,
  Inbox,
  Lightbulb,
  Percent,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import api from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { PageSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRow } from "@/components/ui/list-row";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Table, Th, Td } from "@/components/ui/table";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi("/dashboard");

  if (loading && !data) return <PageSkeleton />;
  if (error || !data) {
    return <EmptyState title="Could not load dashboard" description={error || "Please refresh or try again in a moment."} />;
  }

  const firstName = user?.name?.split(" ").find((part) => !part.endsWith(".")) || user?.name;

  switch (data.role) {
    case "FACULTY":
      return <FacultyDashboard data={data} name={firstName} />;
    case "HOD":
      return <HodDashboard data={data} name={firstName} />;
    case "ADMIN":
      return <AdminDashboard data={data} onChanged={reload} />;
    default:
      return <StudentDashboard data={data} name={firstName} />;
  }
}

/* ---------------- shared pieces ---------------- */

function AttentionLink({ to, icon: Icon, count, label }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-lg border border-border/80 bg-white px-4 py-3 transition-colors hover:border-primary/25 hover:bg-accent-soft/40"
    >
      <span className="flex items-center gap-3 text-sm">
        <Icon className={`h-4 w-4 ${count ? "text-amber-600" : "text-emerald-600"}`} />
        <span className="font-medium text-foreground">{count ? `${count} ${label}` : `No ${label}`}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-muted" />
    </Link>
  );
}

function RecentSubmissions({ items, showStudent = true }) {
  return (
    <Card hover>
      <CardHeader>
        <CardTitle>Recent weekly reports</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {items?.length ? (
          items.map((s) => (
            <ListRow key={s.id}>
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-medium text-foreground">
                  Week {s.weekNumber} · {s.title}
                </p>
                {showStudent && (
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {s.student?.name} · {s.project?.title}
                  </p>
                )}
              </div>
              <StatusBadge status={s.status} />
            </ListRow>
          ))
        ) : (
          <EmptyState icon={Inbox} title="No reports yet" description="Weekly reports will appear here." className="py-10" />
        )}
      </CardContent>
    </Card>
  );
}

function StudentAttendanceTable({ students, showGuide }) {
  if (!students?.length) {
    return <EmptyState icon={GraduationCap} title="No students yet" description="Students appear here once they're assigned." className="py-10" />;
  }
  const sorted = [...students].sort((a, b) => a.attendance.percentage - b.attendance.percentage);
  return (
    <Table>
      <thead>
        <tr>
          <Th>Student</Th>
          {showGuide && <Th>Guide</Th>}
          <Th className="w-56">Attendance</Th>
          <Th>Last report</Th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((s) => (
          <tr key={s.id} className={s.attendance.isLow ? "bg-red-50/40" : undefined}>
            <Td>
              <p className="font-medium">{s.name}</p>
              <p className="text-xs text-muted">{s.internship ? s.internship.company : "No internship added"}</p>
            </Td>
            {showGuide && <Td className="text-muted">{s.guide?.name || "—"}</Td>}
            <Td>
              {s.attendance.workingDays === 0 ? (
                <span className="text-xs text-muted">Not started</span>
              ) : (
                <div className="flex items-center gap-3">
                  <ProgressBar value={s.attendance.percentage} className="flex-1" />
                  <span className={`w-10 text-right text-sm font-semibold tabular-nums ${s.attendance.isLow ? "text-red-600" : "text-primary"}`}>
                    {s.attendance.percentage}%
                  </span>
                </div>
              )}
            </Td>
            <Td className="text-muted">{s.lastReportAt ? formatDate(s.lastReportAt) : "None"}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

/* ---------------- student ---------------- */

function StudentDashboard({ data, name }) {
  const a = data.attendance;
  const today = a.today;
  return (
    <div>
      <PageHeader badge="Student" title={`Hi, ${name}`} description="Your internship attendance, weekly reports and project in one place." />

      {!a.internship ? (
        <Alert tone="info" className="mb-6">
          Add your internship details on the{" "}
          <Link to="/attendance" className="font-semibold underline">
            Attendance page
          </Link>{" "}
          to start marking attendance.
        </Alert>
      ) : (
        !today.record &&
        !today.isWeekend && (
          <Alert tone="warning" className="mb-6 flex items-center justify-between gap-4">
            <span>You haven't marked attendance for today yet.</span>
            <Button asChild size="sm">
              <Link to="/attendance">Mark now</Link>
            </Button>
          </Alert>
        )
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard title="Attendance" value={`${a.percentage}%`} subtitle={a.isLow ? `Below ${a.threshold}%` : `${a.present}/${a.workingDays} days`} icon={Percent} accent />
        <StatCard title="Today" value={today.record ? "Marked" : today.isWeekend ? "Weekend" : "Not yet"} subtitle={today.record ? today.record.status.toLowerCase() : undefined} icon={CalendarCheck} />
        <StatCard title="Reports submitted" value={data.stats.submissionCount} subtitle={`${data.stats.pendingReviews} awaiting review`} icon={FileText} />
        <StatCard title="Team members" value={data.team?.members?.length || 0} icon={Users} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card hover>
          <CardHeader>
            <CardTitle>Internship & guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {a.internship ? (
              <div>
                <p className="text-lg font-semibold text-foreground">{a.internship.company}</p>
                <p className="text-muted">
                  {a.internship.position} · {formatDate(a.internship.startDate)} – {formatDate(a.internship.endDate)}
                </p>
              </div>
            ) : (
              <p className="text-muted">No internship details yet.</p>
            )}
            <div className="rounded-lg bg-background px-3 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Faculty guide</p>
              <p className="mt-0.5 font-medium text-foreground">{data.guide ? `${data.guide.name} · ${data.guide.email}` : "Not assigned yet. The admin assigns guides."}</p>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <CardTitle>My project</CardTitle>
          </CardHeader>
          <CardContent>
            {data.assignedProject ? (
              <div className="text-left">
                <p className="text-lg font-semibold text-foreground">{data.assignedProject.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{data.assignedProject.description}</p>
                <p className="mt-3 text-xs font-medium text-muted">
                  {data.team?.name} · Faculty {data.assignedProject.faculty?.name}
                </p>
                <div className="mt-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-muted">Progress</span>
                    <span className="font-medium tabular-nums text-primary">{data.assignedProject.progressPercentage}%</span>
                  </div>
                  <ProgressBar value={data.assignedProject.progressPercentage} />
                </div>
              </div>
            ) : (
              <EmptyState
                title="No project yet"
                description="Propose your own project to a faculty member, or wait to be added to a team."
                action={
                  <Button asChild size="sm">
                    <Link to="/projects">Go to projects</Link>
                  </Button>
                }
                className="py-8"
              />
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <RecentSubmissions items={data.recentSubmissions} showStudent={false} />
        </div>
      </div>
    </div>
  );
}

/* ---------------- faculty ---------------- */

function FacultyDashboard({ data, name }) {
  const s = data.stats;
  return (
    <div>
      <PageHeader badge="Faculty" title={`Welcome, ${name}`} description="Students you guide, reports to review and your projects." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard title="Guided students" value={s.guidedStudents} icon={GraduationCap} />
        <StatCard title="Their attendance" value={`${s.attendancePercentage}%`} subtitle={`${data.attendanceStats.lowAttendance} below ${data.attendanceStats.threshold}%`} icon={Percent} accent />
        <StatCard title="Projects" value={s.totalProjects} subtitle={`${s.totalTeams} teams`} icon={FolderKanban} />
        <StatCard title="Checked in today" value={data.attendanceStats.checkedInToday} subtitle={`of ${s.guidedStudents}`} icon={CalendarCheck} />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <AttentionLink to="/attendance" icon={Clock} count={s.pendingAttendance} label="attendance records to verify" />
        <AttentionLink to="/submissions" icon={FileText} count={s.pendingReviews} label="reports to review" />
        <AttentionLink to="/projects" icon={Lightbulb} count={s.pendingProposals} label="project proposals" />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>My internship students</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentAttendanceTable students={data.students} />
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <RecentSubmissions items={data.recentSubmissions} />
        <Card hover>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Project progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {data.projectProgress?.length ? (
              data.projectProgress.map((p) => (
                <div key={p.id}>
                  <div className="mb-2 flex justify-between text-sm">
                    <Link to={`/projects/${p.id}`} className="font-medium text-foreground hover:text-primary">
                      {p.title}
                    </Link>
                    <span className="tabular-nums text-muted">{p.progressPercentage}%</span>
                  </div>
                  <ProgressBar value={p.progressPercentage} />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">No projects created yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- HOD ---------------- */

function HodDashboard({ data, name }) {
  const s = data.stats;
  const low = data.students.filter((st) => st.attendance.isLow);
  return (
    <div>
      <PageHeader badge={`HOD · ${data.department}`} title={`Welcome, ${name}`} description="Internship attendance and weekly progress across your department." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard title="Students" value={s.students} subtitle={`${s.facultyCount} faculty`} icon={GraduationCap} />
        <StatCard title="Department attendance" value={`${s.attendancePercentage}%`} icon={Percent} accent />
        <StatCard title="Low attendance" value={s.lowAttendance} subtitle={`Below ${data.attendanceStats.threshold}%`} icon={AlertTriangle} />
        <StatCard title="Reports awaiting review" value={s.pendingReviews} subtitle={`${s.checkedInToday} checked in today`} icon={FileText} />
      </div>

      {low.length > 0 && (
        <Alert tone="warning" className="mt-6">
          <span className="font-semibold">Needs attention:</span> {low.map((st) => `${st.name} (${st.attendance.percentage}%)`).join(", ")}
        </Alert>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Students · lowest attendance first</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentAttendanceTable students={data.students} showGuide />
        </CardContent>
      </Card>

      <div className="mt-8">
        <RecentSubmissions items={data.recentSubmissions} />
      </div>
    </div>
  );
}

/* ---------------- admin ---------------- */

function AdminDashboard({ data, onChanged }) {
  const s = data.stats;
  const approve = async (id) => {
    await api.patch(`/users/${id}`, { isActive: true });
    onChanged();
  };

  return (
    <div>
      <PageHeader badge="Admin" title="Portal overview" description="Accounts, approvals and attendance across all departments." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard title="Students" value={s.students} icon={GraduationCap} />
        <StatCard title="Faculty" value={s.faculty} subtitle={`${s.hods} HOD · ${s.admins} admin`} icon={UserCheck} />
        <StatCard title="Overall attendance" value={`${s.attendancePercentage}%`} icon={Percent} accent />
        <StatCard title="Projects" value={s.totalProjects} icon={FolderKanban} />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <AttentionLink to="/users" icon={ShieldCheck} count={s.pendingFacultyApprovals} label="faculty accounts awaiting approval" />
        <AttentionLink to="/users" icon={Users} count={s.unassignedStudents} label="students without a guide" />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Faculty awaiting approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {data.pendingFaculty.length ? (
            data.pendingFaculty.map((f) => (
              <ListRow key={f.id}>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{f.name}</p>
                  <p className="text-xs text-muted">
                    {f.email} · {f.department} · registered {formatDate(f.createdAt)}
                  </p>
                </div>
                <Button size="sm" onClick={() => approve(f.id)}>
                  Approve
                </Button>
              </ListRow>
            ))
          ) : (
            <EmptyState icon={CheckCircle2} title="No pending approvals" className="py-8" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  FolderKanban,
  Users,
  GraduationCap,
  FileText,
  CalendarCheck,
  TrendingUp,
  Inbox,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRow } from "@/components/ui/list-row";
import { ProgressBar } from "@/components/ui/progress-bar";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;
  if (!data) {
    return (
      <EmptyState
        title="Could not load dashboard"
        description="Please refresh or try again in a moment."
      />
    );
  }

  const isFaculty = user?.role === "FACULTY";

  return (
    <div>
      <PageHeader
        badge={isFaculty ? "Faculty" : "Student"}
        title={isFaculty ? "Dashboard" : "My overview"}
        description={
          isFaculty
            ? "Track projects, teams, submissions, and attendance across your cohort."
            : "Your assigned project, team, and weekly progress in one place."
        }
      />

      {isFaculty ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard title="Projects" value={data.stats.totalProjects} icon={FolderKanban} />
            <StatCard title="Teams" value={data.stats.totalTeams} icon={Users} />
            <StatCard title="Students" value={data.stats.totalStudents} icon={GraduationCap} />
            <StatCard title="Submissions" value={data.stats.totalSubmissions} icon={FileText} />
            <StatCard
              title="Attendance"
              value={`${data.stats.attendancePercentage}%`}
              icon={CalendarCheck}
              accent
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card hover>
              <CardHeader>
                <CardTitle>Recent submissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {data.recentSubmissions?.length === 0 ? (
                  <EmptyState
                    icon={Inbox}
                    title="No submissions yet"
                    description="Student weekly reports will appear here."
                    className="py-10"
                  />
                ) : (
                  data.recentSubmissions?.map((s) => (
                    <ListRow key={s.id}>
                      <div className="min-w-0 text-left">
                        <p className="truncate text-sm font-medium text-foreground">{s.title}</p>
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {s.student?.name} · {s.project?.title}
                        </p>
                      </div>
                      <Badge variant={s.status === "REVIEWED" ? "success" : "warning"}>
                        {s.status}
                      </Badge>
                    </ListRow>
                  ))
                )}
              </CardContent>
            </Card>

            <Card hover>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Project progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {data.projectProgress?.length === 0 ? (
                  <p className="text-sm text-muted">No projects created yet.</p>
                ) : (
                  data.projectProgress?.map((p) => (
                    <div key={p.id}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="font-medium text-foreground">{p.title}</span>
                        <span className="tabular-nums text-muted">{p.progressPercentage}%</span>
                      </div>
                      <ProgressBar value={p.progressPercentage} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Submissions" value={data.stats.submissionCount} icon={FileText} />
            <StatCard
              title="Attendance"
              value={`${data.stats.attendancePercentage}%`}
              icon={CalendarCheck}
              accent
            />
            <StatCard title="Team members" value={data.team?.members?.length || 0} icon={Users} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card hover>
              <CardHeader>
                <CardTitle>My project</CardTitle>
              </CardHeader>
              <CardContent>
                {data.assignedProject ? (
                  <div className="text-left">
                    <p className="text-lg font-semibold text-foreground">
                      {data.assignedProject.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {data.assignedProject.description}
                    </p>
                    <p className="mt-4 text-xs font-medium text-muted">
                      Faculty · {data.assignedProject.faculty?.name}
                    </p>
                    <div className="mt-5">
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-muted">Progress</span>
                        <span className="font-medium tabular-nums text-primary">
                          {data.assignedProject.progressPercentage}%
                        </span>
                      </div>
                      <ProgressBar value={data.assignedProject.progressPercentage} />
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="No project assigned"
                    description="Your faculty will assign you to a team and project."
                    className="py-8"
                  />
                )}
              </CardContent>
            </Card>

            <Card hover>
              <CardHeader>
                <CardTitle>Team</CardTitle>
              </CardHeader>
              <CardContent>
                {data.team ? (
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{data.team.name}</p>
                    <ul className="mt-4 divide-y divide-border rounded-lg border border-border/80">
                      {data.team.members?.map((m) => (
                        <li
                          key={m.id}
                          className="flex items-center justify-between px-3 py-2.5 text-sm"
                        >
                          <span className="font-medium text-foreground">{m.name}</span>
                          <span className="truncate text-xs text-muted">{m.email}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <EmptyState
                    title="Not on a team yet"
                    description="Wait for faculty to add you to a project team."
                    className="py-8"
                  />
                )}
              </CardContent>
            </Card>

            <Card hover className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Weekly submissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {data.recentSubmissions?.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No submissions"
                    description="Submit your first weekly report from the Weekly Reports page."
                    className="py-8"
                  />
                ) : (
                  data.recentSubmissions?.map((s) => (
                    <ListRow key={s.id}>
                      <div className="text-left">
                        <p className="text-sm font-medium">
                          Week {s.weekNumber} · {s.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          Attendance · {s.attendance?.status || "—"}
                        </p>
                      </div>
                      <Badge variant={s.status === "REVIEWED" ? "success" : "warning"}>
                        {s.status}
                      </Badge>
                    </ListRow>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

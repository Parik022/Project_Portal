import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, Crown, FileText, Pencil, Users } from "lucide-react";
import api from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useAuth } from "@/context/AuthContext";
import { deadlineText, daysUntil, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/skeleton";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ProjectForm, ProposalRow } from "./ProjectsPage";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: p, error, loading, reload } = useApi(`/projects/${id}`);
  const isAdmin = user?.role === "ADMIN";
  const canManage = isAdmin || (user?.role === "FACULTY" && p?.faculty?.id === user.id);
  const faculty = useApi("/users/faculty", { skip: !isAdmin });
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState({ tone: "success", text: "" });

  if (loading && !p) return <PageSkeleton />;
  if (error || !p) {
    return <EmptyState title="Project not found" description={error || "It may have been deleted, or you don't have access."} action={<Button asChild variant="secondary"><Link to="/projects">Back to projects</Link></Button>} />;
  }

  const run = async (fn, text) => {
    try {
      await fn();
      setNotice({ tone: "success", text });
      reload();
    } catch (err) {
      setNotice({ tone: "error", text: err.message });
    }
  };

  const days = daysUntil(p.deadline);
  const active = ["APPROVED", "IN_PROGRESS"].includes(p.status);
  const deadlineTone = active && days !== null && days < 0 ? "text-red-600" : active && days !== null && days <= 14 ? "text-amber-700" : "text-foreground";

  return (
    <div>
      <Link to="/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> All projects
      </Link>

      <div className="mb-6 flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={p.status} />
            <Badge variant="muted">{p.domain}</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">{p.title}</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-muted">{p.description}</p>
        </div>
        {canManage && !["PROPOSED", "REJECTED"].includes(p.status) && (
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" onClick={() => setEditing(!editing)}>
              <Pencil className="h-4 w-4" /> {editing ? "Close" : "Edit"}
            </Button>
            <ConfirmButton variant="ghost" size="default" confirmLabel="Delete project" onConfirm={() => api.delete(`/projects/${p.id}`).then(() => navigate("/projects"))}>
              Delete
            </ConfirmButton>
          </div>
        )}
      </div>

      <Alert tone={notice.tone} className="mb-4">{notice.text}</Alert>

      {editing && (
        <ProjectForm
          mode="edit"
          project={p}
          onDone={(text) => {
            setEditing(false);
            setNotice({ tone: "success", text });
            reload();
          }}
          onCancel={() => setEditing(false)}
        />
      )}

      {p.status === "PROPOSED" && (
        <Card className="mb-6 border-amber-200">
          <CardHeader>
            <CardTitle>Waiting for faculty review</CardTitle>
          </CardHeader>
          <CardContent>
            {canManage ? (
              <ProposalRow project={p} onReviewed={(text) => run(async () => {}, text)} />
            ) : (
              <p className="text-sm text-muted">{p.faculty?.name} will approve or reject this proposal. You'll get a notification.</p>
            )}
          </CardContent>
        </Card>
      )}
      {p.status === "REJECTED" && p.reviewRemark && <Alert tone="error" className="mb-6">Rejected: {p.reviewRemark}</Alert>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card hover className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <div className="mb-1.5 flex justify-between">
                <span className="text-muted">Progress</span>
                <span className="font-semibold tabular-nums text-primary">{p.progressPercentage}%</span>
              </div>
              <ProgressBar value={p.progressPercentage} />
            </div>
            <dl className="divide-y divide-border">
              <Row label="Faculty">
                {isAdmin ? (
                  <Select
                    aria-label="Faculty"
                    className="h-8 w-48 text-xs"
                    value={p.faculty?.id}
                    onChange={(e) => run(() => api.patch(`/projects/${p.id}/faculty`, { facultyId: e.target.value }), "Faculty reassigned.")}
                  >
                    {faculty.data?.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </Select>
                ) : (
                  p.faculty?.name
                )}
              </Row>
              {p.proposedBy && <Row label="Proposed by">{p.proposedBy.name}</Row>}
              <Row label="Start">{formatDate(p.startDate)}</Row>
              <Row label="Deadline">
                <span className={`flex flex-col items-end font-medium ${deadlineTone}`}>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <CalendarClock className="h-3.5 w-3.5" /> {formatDate(p.deadline)}
                  </span>
                  {active && p.deadline && <span className="text-xs font-normal">{deadlineText(p.deadline)}</span>}
                </span>
              </Row>
              <Row label="Status">
                {canManage && !["PROPOSED", "REJECTED"].includes(p.status) ? (
                  <Select
                    aria-label="Status"
                    className="h-8 w-40 text-xs"
                    value={p.status}
                    onChange={(e) => run(() => api.patch(`/projects/${p.id}`, { status: e.target.value }), "Status updated.")}
                  >
                    <option value="APPROVED">Approved</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="COMPLETED">Completed</option>
                  </Select>
                ) : (
                  <StatusBadge status={p.status} />
                )}
              </Row>
            </dl>
          </CardContent>
        </Card>

        <Card hover className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            {p.teams.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {p.teams.map((t) => (
                  <div key={t.id} className="rounded-lg border border-border/80 bg-white p-4">
                    <p className="font-semibold text-foreground">{t.name}</p>
                    <ul className="mt-2 space-y-1.5 text-sm">
                      {t.members.length === 0 && <li className="text-muted">No members yet</li>}
                      {t.members.map((m) => (
                        <li key={m.id} className="flex items-center gap-1.5">
                          {t.leader?.id === m.id && <Crown className="h-3.5 w-3.5 text-amber-500" aria-label="Team leader" />}
                          <span className={t.leader?.id === m.id ? "font-medium" : ""}>{m.name}</span>
                          {t.leader?.id === m.id && <span className="text-xs text-muted">· leader</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} title="No teams yet" description={canManage ? "Create a team on the Teams page." : undefined} className="py-8" />
            )}
          </CardContent>
        </Card>

        <Card hover className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Recent weekly reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {p.submissions.length ? (
              p.submissions.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-4 rounded-lg border border-border/80 bg-white px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      Week {s.weekNumber} · {s.title}
                    </p>
                    <p className="text-xs text-muted">
                      {s.student?.name} · submitted {formatDate(s.createdAt)} · due {formatDate(s.dueDate)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {s.isLate && <Badge variant="danger">Late</Badge>}
                    <StatusBadge status={s.status} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState icon={FileText} title="No reports yet" className="py-8" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-right text-sm">{children}</dd>
    </div>
  );
}

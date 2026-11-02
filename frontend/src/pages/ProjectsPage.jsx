import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, FolderKanban, Lightbulb, Plus, Search, Users } from "lucide-react";
import api from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useAuth } from "@/context/AuthContext";
import { DOMAINS, deadlineText, daysUntil, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Alert, FieldError } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Pager } from "@/components/ui/pager";

const DESCRIPTIONS = {
  STUDENT: "Your team's project, and any project you've proposed.",
  FACULTY: "Projects you supervise and proposals waiting for you.",
  HOD: "Projects run by faculty in your department.",
  ADMIN: "All projects across departments.",
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const isFaculty = user?.role === "FACULTY";
  const isStudent = user?.role === "STUDENT";
  const [filters, setFilters] = useState({ search: "", status: "", domain: "", sort: "createdAt", order: "desc" });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null); // "create" | "propose" | null
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearch(filters.search), 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  const query = useMemo(() => {
    const params = new URLSearchParams({ page, limit: 9, sort: filters.sort, order: filters.order });
    if (search) params.set("search", search);
    if (filters.status) params.set("status", filters.status);
    if (filters.domain) params.set("domain", filters.domain);
    return `/projects?${params}`;
  }, [search, filters.status, filters.domain, filters.sort, filters.order, page]);

  const projects = useApi(query);
  const proposals = useApi("/projects?status=PROPOSED&limit=20", { skip: !isFaculty });

  const setFilter = (key) => (e) => {
    setPage(1);
    setFilters({ ...filters, [key]: e.target.value });
  };
  const setSort = (e) => {
    const [sort, order] = e.target.value.split(":");
    setPage(1);
    setFilters({ ...filters, sort, order });
  };

  const reload = () => {
    projects.reload();
    proposals.reload();
  };

  const studentHasProject = isStudent && Boolean(user?.teamId);
  const hasPendingProposal = projects.data?.items.some((p) => p.status === "PROPOSED");

  return (
    <div>
      <PageHeader
        title="Projects"
        description={DESCRIPTIONS[user?.role]}
        action={
          isFaculty ? (
            <Button onClick={() => setForm(form === "create" ? null : "create")}>
              <Plus className="h-4 w-4" /> {form === "create" ? "Close" : "New project"}
            </Button>
          ) : (
            isStudent &&
            !studentHasProject &&
            !hasPendingProposal && (
              <Button onClick={() => setForm(form === "propose" ? null : "propose")}>
                <Lightbulb className="h-4 w-4" /> {form === "propose" ? "Close" : "Propose a project"}
              </Button>
            )
          )
        }
      />

      <Alert tone="success" className="mb-4">{notice}</Alert>

      {form && (
        <ProjectForm
          mode={form}
          onDone={(message) => {
            setForm(null);
            setNotice(message);
            reload();
          }}
        />
      )}

      {isFaculty && proposals.data?.items.length > 0 && (
        <Card className="mb-8 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600" /> Proposals waiting for you ({proposals.data.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {proposals.data.items.map((p) => (
              <ProposalRow key={p.id} project={p} onReviewed={(message) => { setNotice(message); reload(); }} />
            ))}
          </CardContent>
        </Card>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_170px_190px_200px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input className="pl-9" placeholder="Search projects" value={filters.search} onChange={setFilter("search")} />
        </div>
        <Select aria-label="Status" value={filters.status} onChange={setFilter("status")}>
          <option value="">All statuses</option>
          <option value="PROPOSED">Proposals</option>
          <option value="APPROVED">Approved</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
        </Select>
        <Select aria-label="Domain" value={filters.domain} onChange={setFilter("domain")}>
          <option value="">All domains</option>
          {(projects.data?.domains || []).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
        <Select aria-label="Sort" value={`${filters.sort}:${filters.order}`} onChange={setSort}>
          <option value="createdAt:desc">Newest first</option>
          <option value="deadline:asc">Deadline (soonest)</option>
          <option value="title:asc">Title (A–Z)</option>
          <option value="progressPercentage:desc">Most progress</option>
          <option value="progressPercentage:asc">Least progress</option>
        </Select>
      </div>

      <Alert tone="error">{projects.error}</Alert>
      {projects.loading && !projects.data ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : projects.data?.items.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.data.items.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
          <Pager pagination={projects.data.pagination} onPage={setPage} />
        </>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title={search || filters.status || filters.domain ? "No projects match" : "No projects yet"}
          description={
            isStudent
              ? "Propose a project to a faculty member, or wait to be added to a team."
              : isFaculty
                ? "Create a project or review student proposals."
                : "Projects will appear once faculty create them."
          }
        />
      )}
    </div>
  );
}

function ProjectCard({ project: p }) {
  const days = daysUntil(p.deadline);
  const active = !["COMPLETED", "REJECTED", "PROPOSED"].includes(p.status);
  const deadlineTone = !active ? "text-muted" : days !== null && days < 0 ? "text-red-600" : days !== null && days <= 14 ? "text-amber-700" : "text-muted";
  const members = p.teams.reduce((n, t) => n + t.members.length, 0);

  return (
    <Link to={`/projects/${p.id}`} className="group block">
      <Card hover className="flex h-full flex-col transition-colors group-hover:border-primary/30">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-left leading-snug group-hover:text-primary">{p.title}</CardTitle>
            <StatusBadge status={p.status} className="shrink-0" />
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge variant="muted">{p.domain}</Badge>
          </div>
        </CardHeader>
        <CardContent className="mt-auto space-y-3 pt-4 text-left">
          <p className="line-clamp-2 text-sm leading-relaxed text-muted">{p.description}</p>
          <div>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-muted">Progress</span>
              <span className="font-medium tabular-nums text-primary">{p.progressPercentage}%</span>
            </div>
            <ProgressBar value={p.progressPercentage} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted">
            <span>{p.faculty?.name}</span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {members}
              </span>
              <span className={`flex items-center gap-1 font-medium ${deadlineTone}`}>
                <CalendarClock className="h-3.5 w-3.5" /> {active ? deadlineText(p.deadline) : p.deadline ? formatDate(p.deadline) : "—"}
              </span>
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ProposalRow({ project: p, onReviewed }) {
  const [rejecting, setRejecting] = useState(false);
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const review = async (decision) => {
    setSaving(true);
    setError("");
    try {
      await api.patch(`/projects/${p.id}/review`, { decision, ...(remark.trim() ? { remark: remark.trim() } : {}) });
      onReviewed(decision === "APPROVED" ? `Approved "${p.title}". A team was created with ${p.proposedBy?.name} as leader.` : `Rejected "${p.title}".`);
    } catch (err) {
      setError(err.errors?.remark?.[0] || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-border/80 bg-white px-4 py-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{p.title}</p>
          <p className="mt-0.5 text-xs text-muted">
            Proposed by {p.proposedBy?.name} · {p.domain}
            {p.deadline ? ` · deadline ${formatDate(p.deadline)}` : ""}
          </p>
          <p className="mt-1.5 text-sm text-muted">{p.description}</p>
        </div>
        {!rejecting && (
          <div className="flex shrink-0 gap-2">
            <Button size="sm" onClick={() => review("APPROVED")} disabled={saving}>
              Approve
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setRejecting(true)} disabled={saving}>
              Reject
            </Button>
          </div>
        )}
      </div>
      {rejecting && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input autoFocus placeholder="Reason (shown to the student)" value={remark} onChange={(e) => setRemark(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={() => review("REJECTED")} disabled={saving}>
              Reject
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

const toYmd = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export function ProjectForm({ mode, project, onDone, onCancel }) {
  const isPropose = mode === "propose";
  const isEdit = mode === "edit";
  const faculty = useApi("/users/faculty", { skip: !isPropose });
  const [form, setForm] = useState({
    title: project?.title || "",
    description: project?.description || "",
    domain: project?.domain || DOMAINS[0],
    startDate: toYmd(project?.startDate),
    deadline: toYmd(project?.deadline),
    progressPercentage: project?.progressPercentage ?? 0,
    facultyId: "",
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      title: form.title,
      description: form.description,
      domain: form.domain,
      startDate: form.startDate || null,
      deadline: form.deadline || null,
    };
    try {
      if (isPropose) {
        await api.post("/projects/proposals", { ...payload, facultyId: form.facultyId });
        onDone("Proposal sent. You'll get a notification when the faculty member reviews it.");
      } else if (isEdit) {
        await api.patch(`/projects/${project.id}`, { ...payload, progressPercentage: Number(form.progressPercentage) });
        onDone("Project updated.");
      } else {
        await api.post("/projects", { ...payload, progressPercentage: Number(form.progressPercentage) });
        onDone("Project created.");
      }
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{isPropose ? "Propose a project" : isEdit ? "Edit project" : "New project"}</CardTitle>
        {isPropose && <p className="text-sm text-muted">The faculty member you choose approves it, and then your team is created with you as leader.</p>}
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Alert tone="error" className="sm:col-span-2">
            {error && error.message !== "Validation failed" ? error.message : ""}
          </Alert>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pf-title">Title</Label>
            <Input id="pf-title" value={form.title} onChange={set("title")} />
            <FieldError errors={error?.errors} name="title" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pf-desc">Description</Label>
            <Textarea id="pf-desc" rows={3} value={form.description} onChange={set("description")} placeholder="What will be built and why" />
            <FieldError errors={error?.errors} name="description" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pf-domain">Domain</Label>
            <Select id="pf-domain" value={form.domain} onChange={set("domain")}>
              {(DOMAINS.includes(form.domain) ? DOMAINS : [form.domain, ...DOMAINS]).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
          {isPropose ? (
            <div className="space-y-2">
              <Label htmlFor="pf-faculty">Faculty</Label>
              <Select id="pf-faculty" value={form.facultyId} onChange={set("facultyId")}>
                <option value="">Choose faculty</option>
                {faculty.data?.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} · {f.department}
                  </option>
                ))}
              </Select>
              <FieldError errors={error?.errors} name="facultyId" />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="pf-progress">Progress: {form.progressPercentage}%</Label>
              <input
                id="pf-progress"
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.progressPercentage}
                onChange={set("progressPercentage")}
                className="mt-3 w-full accent-[var(--color-primary)]"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="pf-start">Start date</Label>
            <Input id="pf-start" type="date" value={form.startDate} onChange={set("startDate")} />
            <FieldError errors={error?.errors} name="startDate" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pf-deadline">Deadline</Label>
            <Input id="pf-deadline" type="date" value={form.deadline} onChange={set("deadline")} />
            <FieldError errors={error?.errors} name="deadline" />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : isPropose ? "Send proposal" : isEdit ? "Save changes" : "Create project"}
            </Button>
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

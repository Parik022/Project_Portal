import { useMemo, useState } from "react";
import { ExternalLink, FileText, MessageSquare } from "lucide-react";
import api from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/badge";
import { Alert, FieldError } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/skeleton";

const DESCRIPTIONS = {
  STUDENT: "Submit one progress report per week. Your faculty approves it or asks for changes.",
  FACULTY: "Review weekly reports from students on your projects.",
  HOD: "Weekly reports across your department (read-only).",
  ADMIN: "Weekly reports across all departments.",
};

export default function SubmissionsPage() {
  const { user } = useAuth();
  const isStudent = user?.role === "STUDENT";
  const canReview = user?.role === "FACULTY" || user?.role === "ADMIN";
  const { data, error, loading, reload } = useApi("/submissions");
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState(canReview ? "PENDING" : "");

  const submissions = useMemo(
    () => (data || []).filter((s) => !statusFilter || s.status === statusFilter),
    [data, statusFilter]
  );
  const nextWeek = useMemo(() => Math.max(0, ...(data || []).map((s) => s.weekNumber)) + 1, [data]);

  if (loading && !data) return <PageSkeleton />;

  return (
    <div>
      <PageHeader
        title="Weekly Reports"
        description={DESCRIPTIONS[user?.role]}
        action={
          isStudent && (
            <Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "New report"}</Button>
          )
        }
      />

      <Alert tone="error" className="mb-6">{error}</Alert>

      {showForm && isStudent && (
        <ReportForm
          initial={{ weekNumber: nextWeek, title: `Week ${nextWeek}`, description: "", link: "" }}
          onDone={() => {
            setShowForm(false);
            reload();
          }}
        />
      )}

      {!isStudent && (
        <div className="mb-4 flex max-w-xs items-center gap-2">
          <Label htmlFor="statusFilter" className="shrink-0 text-muted">
            Show
          </Label>
          <Select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All reports</option>
            <option value="PENDING">Needs review</option>
            <option value="CHANGES_REQUESTED">Changes requested</option>
            <option value="APPROVED">Approved</option>
          </Select>
        </div>
      )}

      {submissions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={statusFilter === "PENDING" ? "Nothing waiting for review" : "No weekly reports"}
          description={isStudent ? "Submit your first weekly progress report." : "Reports from students will appear here."}
        />
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <ReportCard key={s.id} submission={s} isStudent={isStudent} canReview={canReview} onChanged={reload} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportForm({ initial, submissionId, onDone, onCancel }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const isEdit = Boolean(submissionId);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = { title: form.title, description: form.description, link: form.link?.trim() || (isEdit ? null : undefined) };
    try {
      if (isEdit) await api.patch(`/submissions/${submissionId}`, payload);
      else await api.post("/submissions", { ...payload, weekNumber: Number(form.weekNumber) });
      onDone();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card hover className="mb-8">
      <CardHeader>
        <CardTitle>{isEdit ? `Edit week ${form.weekNumber} report` : "Submit weekly report"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid max-w-2xl gap-4 sm:grid-cols-4">
          <Alert tone="error" className="sm:col-span-4">
            {error && error.message !== "Validation failed" ? error.message : ""}
          </Alert>
          <div className="space-y-2">
            <Label htmlFor="weekNumber">Week</Label>
            <Input id="weekNumber" type="number" min={1} max={52} value={form.weekNumber} onChange={set("weekNumber")} disabled={isEdit} />
            <FieldError errors={error?.errors} name="weekNumber" />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={set("title")} />
            <FieldError errors={error?.errors} name="title" />
          </div>
          <div className="space-y-2 sm:col-span-4">
            <Label htmlFor="description">What did you do this week?</Label>
            <Textarea id="description" rows={5} value={form.description} onChange={set("description")} placeholder="Tasks completed, what's next, any blockers" />
            <FieldError errors={error?.errors} name="description" />
          </div>
          <div className="space-y-2 sm:col-span-4">
            <Label htmlFor="link">Link (optional)</Label>
            <Input id="link" type="url" value={form.link || ""} onChange={set("link")} placeholder="GitHub, Google Drive, demo URL…" />
            <FieldError errors={error?.errors} name="link" />
          </div>
          <div className="flex gap-2 sm:col-span-4">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Resubmit" : "Submit report"}
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

function ReportCard({ submission: s, isStudent, canReview, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const review = async (status) => {
    setSaving(true);
    setError("");
    try {
      await api.patch(`/submissions/${s.id}/review`, { status, ...(feedback.trim() ? { feedback: feedback.trim() } : {}) });
      setReviewing(false);
      setFeedback("");
      onChanged();
    } catch (err) {
      setError(err.errors?.feedback?.[0] || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <ReportForm
        submissionId={s.id}
        initial={{ weekNumber: s.weekNumber, title: s.title, description: s.description, link: s.link || "" }}
        onDone={() => {
          setEditing(false);
          onChanged();
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="rounded-lg border border-border/80 bg-white px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">
              Week {s.weekNumber} · {s.title}
            </span>
            <StatusBadge status={s.status} />
          </div>
          {!isStudent && (
            <p className="mt-1 text-xs text-muted">
              {s.student?.name} {s.student?.registerNo ? `(${s.student.registerNo})` : ""} · {s.project?.title}
            </p>
          )}
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{s.description}</p>
          {s.link && (
            <a href={s.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              <ExternalLink className="h-3 w-3" /> {s.link}
            </a>
          )}
          {s.feedback && (
            <div className="mt-3 flex gap-2 rounded-md bg-accent-soft/60 px-3 py-2 text-sm">
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-foreground">{s.feedback}</p>
                <p className="mt-0.5 text-xs text-muted">Feedback · {formatDateTime(s.reviewedAt)}</p>
              </div>
            </div>
          )}
          <p className="mt-2 text-xs text-muted">Submitted {formatDateTime(s.createdAt)}</p>
        </div>

        <div className="flex shrink-0 gap-2">
          {isStudent && s.status !== "APPROVED" && (
            <Button size="sm" variant={s.status === "CHANGES_REQUESTED" ? "default" : "secondary"} onClick={() => setEditing(true)}>
              {s.status === "CHANGES_REQUESTED" ? "Update & resubmit" : "Edit"}
            </Button>
          )}
          {canReview && !reviewing && s.status === "PENDING" && (
            <Button size="sm" variant="accent" onClick={() => setReviewing(true)}>
              Review
            </Button>
          )}
        </div>
      </div>

      {reviewing && (
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <Label htmlFor={`fb-${s.id}`}>Feedback for the student</Label>
          <Textarea id={`fb-${s.id}`} rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Required when requesting changes" />
          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => review("APPROVED")} disabled={saving}>
              Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => review("CHANGES_REQUESTED")} disabled={saving}>
              Request changes
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setReviewing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from "react";
import { CalendarCheck, CheckCircle2, Clock, Download, Laptop, Building2, XCircle, Briefcase, Percent } from "lucide-react";
import api, { IS_DEMO } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useAuth } from "@/context/AuthContext";
import { formatDate, weekday } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Alert, FieldError } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton, Skeleton } from "@/components/ui/skeleton";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Table, Th, Td } from "@/components/ui/table";
import { Pager } from "@/components/ui/pager";

export default function AttendancePage() {
  const { user } = useAuth();
  return user?.role === "STUDENT" ? <StudentAttendance /> : <StaffAttendance role={user?.role} />;
}

/* ------------------------------------------------------------------ */
/* Student                                                             */
/* ------------------------------------------------------------------ */

function StudentAttendance() {
  const summary = useApi("/attendance/stats");
  const history = useApi("/attendance?limit=60");
  const [editingInternship, setEditingInternship] = useState(false);

  const reloadAll = () => {
    summary.reload();
    history.reload();
  };

  if (summary.loading && !summary.data) return <PageSkeleton />;
  if (summary.error) return <Alert tone="error">{summary.error}</Alert>;

  const s = summary.data;
  const hasInternship = Boolean(s.internship);

  return (
    <div>
      <PageHeader
        badge="Internship attendance"
        title="Attendance"
        description="Mark attendance from wherever you're working. Your guide verifies each day."
      />

      {!hasInternship || editingInternship ? (
        <InternshipForm
          internship={s.internship}
          onSaved={() => {
            setEditingInternship(false);
            reloadAll();
          }}
          onCancel={hasInternship ? () => setEditingInternship(false) : undefined}
        />
      ) : (
        <>
          {s.isLow && (
            <Alert tone="warning" className="mb-6">
              Your attendance is {s.percentage}%, below the required {s.threshold}%. Mark attendance every working day and
              follow up with your guide on pending days.
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard title="Attendance" value={`${s.percentage}%`} subtitle={`${s.workingDays} working days so far`} icon={Percent} accent />
            <StatCard title="Present (verified)" value={s.present} icon={CheckCircle2} />
            <StatCard title="Pending" value={s.pending} subtitle="Awaiting your guide" icon={Clock} />
            <StatCard title="Absent" value={s.absent} subtitle={s.rejected ? `${s.rejected} rejected` : undefined} icon={XCircle} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            <TodayCard today={s.today} onMarked={reloadAll} className="lg:col-span-3" />
            <InternshipCard internship={s.internship} onEdit={() => setEditingInternship(true)} className="lg:col-span-2" />
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              {history.loading && !history.data ? (
                <Skeleton className="h-40" />
              ) : history.data?.items.length ? (
                <Table>
                  <thead>
                    <tr>
                      <Th>Date</Th>
                      <Th>Mode</Th>
                      <Th>Work summary</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.data.items.map((r) => (
                      <tr key={r.id}>
                        <Td className="whitespace-nowrap">
                          <span className="font-medium">{formatDate(r.date)}</span>
                          <span className="ml-1.5 text-xs text-muted">{weekday(r.date)}</span>
                        </Td>
                        <Td>
                          <StatusBadge status={r.mode} />
                        </Td>
                        <Td className="max-w-md text-muted">{r.summary}</Td>
                        <Td>
                          <StatusBadge status={r.status} />
                          {r.remark && <p className="mt-1 text-xs text-muted">“{r.remark}”</p>}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <EmptyState icon={CalendarCheck} title="No attendance yet" description="Your daily check-ins will show here." className="py-10" />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function TodayCard({ today, onMarked, className }) {
  const [form, setForm] = useState({ mode: "REMOTE", summary: "" });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.post("/attendance", form);
      setForm({ mode: "REMOTE", summary: "" });
      onMarked();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card hover className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Today · {formatDate(today.date)}</span>
          {today.record && <StatusBadge status={today.record.status} />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {today.record ? (
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Attendance marked ({today.record.mode === "REMOTE" ? "remote" : "on-site"})
            </p>
            <p className="text-muted">{today.record.summary}</p>
            {today.record.status === "PENDING" && <p className="text-xs text-muted">Your guide will verify it.</p>}
            {today.record.remark && <p className="text-xs text-muted">Remark: “{today.record.remark}”</p>}
          </div>
        ) : today.isWeekend ? (
          <p className="text-sm text-muted">It's the weekend. Attendance is recorded Monday to Friday.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Alert tone="error">{error && error.message !== "Validation failed" ? error.message : ""}</Alert>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "REMOTE", label: "Remote", icon: Laptop },
                { value: "ONSITE", label: "On-site", icon: Building2 },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, mode: value })}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    form.mode === value ? "border-primary bg-accent-soft text-primary" : "border-border text-muted hover:border-primary/30"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">What are you working on today?</Label>
              <Textarea
                id="summary"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="e.g. Built the login API and fixed two validation bugs"
                maxLength={500}
              />
              <FieldError errors={error?.errors} name="summary" />
            </div>
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? "Marking…" : "Mark attendance"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function InternshipCard({ internship, onEdit, className }) {
  return (
    <Card hover className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" /> Internship
          </span>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Edit
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p className="text-lg font-semibold text-foreground">{internship.company}</p>
        <p className="text-muted">{internship.position}</p>
        <p className="pt-2 text-xs text-muted">
          {formatDate(internship.startDate)} – {formatDate(internship.endDate)}
        </p>
        <StatusBadge status={internship.mode} />
      </CardContent>
    </Card>
  );
}

function InternshipForm({ internship, onSaved, onCancel }) {
  const toYmd = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
  const [form, setForm] = useState({
    company: internship?.company || "",
    position: internship?.position || "",
    startDate: toYmd(internship?.startDate),
    endDate: toYmd(internship?.endDate),
    mode: internship?.mode || "REMOTE",
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.put("/internships/me", form);
      onSaved();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{internship ? "Edit internship details" : "Add your internship details"}</CardTitle>
        {!internship && <p className="text-sm text-muted">You need these before you can mark attendance.</p>}
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Alert tone="error" className="sm:col-span-2">
            {error && error.message !== "Validation failed" ? error.message : ""}
          </Alert>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" value={form.company} onChange={set("company")} required />
            <FieldError errors={error?.errors} name="company" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Role / position</Label>
            <Input id="position" value={form.position} onChange={set("position")} required />
            <FieldError errors={error?.errors} name="position" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Start date</Label>
            <Input id="startDate" type="date" value={form.startDate} onChange={set("startDate")} required />
            <FieldError errors={error?.errors} name="startDate" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End date</Label>
            <Input id="endDate" type="date" value={form.endDate} onChange={set("endDate")} required />
            <FieldError errors={error?.errors} name="endDate" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mode">Usual work mode</Label>
            <Select id="mode" value={form.mode} onChange={set("mode")}>
              <option value="REMOTE">Remote</option>
              <option value="ONSITE">On-site</option>
            </Select>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
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

/* ------------------------------------------------------------------ */
/* Faculty / HOD / Admin                                               */
/* ------------------------------------------------------------------ */

const STAFF_COPY = {
  FACULTY: { badge: "Faculty guide", description: "Verify daily check-ins from the students you guide." },
  HOD: { badge: "Department", description: "Attendance across your department. Students below the threshold are flagged." },
  ADMIN: { badge: "Admin", description: "Attendance across all departments." },
};

function StaffAttendance({ role }) {
  const canVerify = role === "FACULTY" || role === "ADMIN";
  const stats = useApi("/attendance/stats");
  const report = useApi("/attendance/report");
  const [filters, setFilters] = useState({ status: canVerify ? "PENDING" : "", studentId: "", from: "", to: "" });
  const [page, setPage] = useState(1);

  const query = useMemo(() => {
    const params = new URLSearchParams({ page, limit: 20 });
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    return `/attendance?${params}`;
  }, [filters, page]);
  const records = useApi(query);

  const setFilter = (key) => (e) => {
    setPage(1);
    setFilters({ ...filters, [key]: e.target.value });
  };

  const refresh = () => {
    records.reload();
    stats.reload();
    report.reload();
  };

  const [csvNotice, setCsvNotice] = useState("");
  const downloadCsv = async () => {
    const res = await api.get("/attendance/report?format=csv", { responseType: "blob" });
    if (IS_DEMO) {
      // Hosted demo pages can't download files, so copy the CSV instead.
      try {
        await navigator.clipboard.writeText(await res.data.text());
        setCsvNotice("CSV copied to your clipboard (downloads are disabled in the demo).");
      } catch {
        setCsvNotice("Your browser blocked the clipboard. In the real app this downloads a CSV file.");
      }
      return;
    }
    const url = URL.createObjectURL(res.data);
    const link = Object.assign(document.createElement("a"), { href: url, download: "attendance-report.csv" });
    link.click();
    URL.revokeObjectURL(url);
  };

  const copy = STAFF_COPY[role] || STAFF_COPY.ADMIN;
  const st = stats.data;

  return (
    <div>
      <PageHeader
        badge={copy.badge}
        title="Attendance"
        description={copy.description}
        action={
          <Button variant="secondary" onClick={downloadCsv}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />
      <Alert tone="info" className="mb-6">{csvNotice}</Alert>

      {st ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard title="Students" value={st.students} icon={CalendarCheck} />
          <StatCard title="Average attendance" value={`${st.percentage}%`} subtitle={`${st.lowAttendance} below ${st.threshold}%`} icon={Percent} accent />
          <StatCard title="Checked in today" value={st.checkedInToday} icon={CheckCircle2} />
          <StatCard title="Pending verification" value={st.pendingVerification} icon={Clock} />
        </div>
      ) : (
        <Skeleton className="h-28" />
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Students</CardTitle>
        </CardHeader>
        <CardContent>
          {report.loading && !report.data ? (
            <Skeleton className="h-32" />
          ) : report.data?.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>Student</Th>
                  <Th>Internship</Th>
                  {role !== "FACULTY" && <Th>Guide</Th>}
                  <Th className="w-56">Attendance</Th>
                  <Th>Pending</Th>
                </tr>
              </thead>
              <tbody>
                {report.data.map((r) => (
                  <tr key={r.id} className={r.attendance.isLow ? "bg-red-50/40" : undefined}>
                    <Td>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted">{r.registerNo}</p>
                    </Td>
                    <Td className="text-muted">{r.internship ? `${r.internship.company} · ${r.internship.position}` : "Not added"}</Td>
                    {role !== "FACULTY" && <Td className="text-muted">{r.guide?.name || <Badge variant="warning">No guide</Badge>}</Td>}
                    <Td>
                      {r.attendance.workingDays === 0 ? (
                        <span className="text-xs text-muted">Not started</span>
                      ) : (
                      <>
                      <div className="flex items-center gap-3">
                        <ProgressBar value={r.attendance.percentage} className="flex-1" />
                        <span className={`w-10 text-right text-sm font-semibold tabular-nums ${r.attendance.isLow ? "text-red-600" : "text-primary"}`}>
                          {r.attendance.percentage}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {r.attendance.present}/{r.attendance.workingDays} days
                      </p>
                      </>
                      )}
                    </Td>
                    <Td>{r.attendance.pending || "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState
              icon={CalendarCheck}
              title="No students yet"
              description={role === "FACULTY" ? "An admin assigns students to you as their guide." : "Students will appear once they register."}
              className="py-10"
            />
          )}
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Daily records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            <Select aria-label="Status" value={filters.status} onChange={setFilter("status")}>
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </Select>
            <Select aria-label="Student" value={filters.studentId} onChange={setFilter("studentId")}>
              <option value="">All students</option>
              {report.data?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
            <Input aria-label="From date" type="date" value={filters.from} onChange={setFilter("from")} />
            <Input aria-label="To date" type="date" value={filters.to} onChange={setFilter("to")} />
          </div>

          <Alert tone="error">{records.error}</Alert>
          {records.loading && !records.data ? (
            <Skeleton className="h-40" />
          ) : records.data?.items.length ? (
            <div className="space-y-2.5">
              {records.data.items.map((r) => (
                <RecordRow key={r.id} record={r} canVerify={canVerify} onChanged={refresh} />
              ))}
              <Pager pagination={records.data.pagination} onPage={setPage} />
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title={filters.status === "PENDING" ? "Nothing to verify" : "No records match"}
              description={filters.status === "PENDING" ? "You're all caught up." : "Try different filters."}
              className="py-10"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RecordRow({ record, canVerify, onChanged }) {
  const [rejecting, setRejecting] = useState(false);
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const verify = async (status) => {
    setSaving(true);
    setError("");
    try {
      await api.patch(`/attendance/${record.id}/verify`, { status, ...(status === "REJECTED" ? { remark } : {}) });
      setRejecting(false);
      onChanged();
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">{record.student.name}</span>
            <span className="text-xs text-muted">
              {weekday(record.date)}, {formatDate(record.date)}
            </span>
            <StatusBadge status={record.mode} />
            <StatusBadge status={record.status} />
          </div>
          <p className="mt-1.5 text-sm text-muted">{record.summary}</p>
          {record.verifiedBy && (
            <p className="mt-1 text-xs text-muted">
              {record.status === "VERIFIED" ? "Verified" : "Reviewed"} by {record.verifiedBy.name}
              {record.remark ? ` · “${record.remark}”` : ""}
            </p>
          )}
        </div>
        {canVerify && !rejecting && (
          <div className="flex shrink-0 gap-2">
            {record.status !== "VERIFIED" && (
              <Button size="sm" onClick={() => verify("VERIFIED")} disabled={saving}>
                Verify
              </Button>
            )}
            {record.status !== "REJECTED" && (
              <Button size="sm" variant="secondary" onClick={() => { setError(""); setRejecting(true); }} disabled={saving}>
                Reject
              </Button>
            )}
          </div>
        )}
      </div>
      {rejecting && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input autoFocus placeholder="Reason for rejecting (shown to the student)" value={remark} onChange={(e) => setRemark(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={() => verify("REJECTED")} disabled={saving}>
              Reject
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setError(""); setRejecting(false); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

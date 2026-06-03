import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRow } from "@/components/ui/list-row";
import { FileText } from "lucide-react";

export default function SubmissionsPage() {
  const { user } = useAuth();
  const isFaculty = user?.role === "FACULTY";
  const isStudent = user?.role === "STUDENT";
  const [submissions, setSubmissions] = useState([]);
  const [form, setForm] = useState({
    weekNumber: 1,
    title: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = () => api.get("/submissions").then((res) => setSubmissions(res.data));

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/submissions", {
        ...form,
        weekNumber: Number(form.weekNumber),
      });
      setForm({ weekNumber: 1, title: "", description: "" });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReview = async (id) => {
    await api.patch(`/submissions/${id}/review`, { status: "REVIEWED" });
    load();
  };

  return (
    <div>
      <PageHeader
        title="Weekly Reports"
        description={
          isStudent
            ? "Submit weekly progress — attendance is marked automatically"
            : "Review student weekly submissions"
        }
        action={
          isStudent && (
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "New submission"}
            </Button>
          )
        }
      />

      {showForm && isStudent && (
        <Card hover className="mb-8">
          <CardHeader>
            <CardTitle>Submit weekly report</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid max-w-lg gap-4">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="space-y-2">
                <Label>Week number</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.weekNumber}
                  onChange={(e) => setForm({ ...form, weekNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              <Button type="submit">Submit & mark attendance</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {submissions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No weekly reports"
          description={
            isStudent
              ? "Submit your first weekly progress report to mark attendance."
              : "Reports from your students will appear here."
          }
        />
      ) : (
        <div className="space-y-2.5">
          {submissions.map((s) => (
            <ListRow key={s.id} className="flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">
                    Week {s.weekNumber} · {s.title}
                  </span>
                  <Badge variant={s.status === "REVIEWED" ? "success" : "warning"}>
                    {s.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-2">
                  {s.description}
                </p>
                {isFaculty && s.student && (
                  <p className="mt-2 text-xs text-muted">
                    {s.student.name} · {s.project?.title}
                  </p>
                )}
                {s.attendance && (
                  <p className="mt-1 text-xs font-medium text-primary">
                    Attendance · {s.attendance.status}
                  </p>
                )}
              </div>
              {isFaculty && s.status === "PENDING" && (
                <Button variant="accent" size="sm" className="shrink-0" onClick={() => handleReview(s.id)}>
                  Mark reviewed
                </Button>
              )}
            </ListRow>
          ))}
        </div>
      )}
    </div>
  );
}

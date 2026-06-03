import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, FolderKanban } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
export default function ProjectsPage() {
  const { user } = useAuth();
  const isFaculty = user?.role === "FACULTY";
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", progressPercentage: 0 });
  const [error, setError] = useState("");

  const load = () => api.get("/projects").then((res) => setProjects(res.data));

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const resetForm = () => {
    setForm({ title: "", description: "", progressPercentage: 0 });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        await api.put(`/projects/${editing.id}`, form);
      } else {
        await api.post("/projects", form);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (project) => {
    setEditing(project);
    setForm({
      title: project.title,
      description: project.description,
      progressPercentage: project.progressPercentage,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this project?")) return;
    await api.delete(`/projects/${id}`);
    load();
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        description={isFaculty ? "Manage your faculty projects" : "Projects assigned to you"}
        action={
          isFaculty && (
            <Button onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus className="h-4 w-4" />
              New project
            </Button>
          )
        }
      />

      {showForm && isFaculty && (
        <Card hover className="mb-8">
          <CardHeader>
            <CardTitle>{editing ? "Edit project" : "Create project"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 max-w-lg">
              {error && <p className="text-sm text-red-600">{error}</p>}
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
              <div className="space-y-2">
                <Label>Progress %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.progressPercentage}
                  onChange={(e) =>
                    setForm({ ...form, progressPercentage: Number(e.target.value) })
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editing ? "Update" : "Create"}</Button>
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description={
            isFaculty
              ? "Create your first project to get started."
              : "You will see assigned projects here once added to a team."
          }
          action={
            isFaculty && (
              <Button onClick={() => { resetForm(); setShowForm(true); }}>
                <Plus className="h-4 w-4" />
                New project
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {projects.map((p) => (
            <Card key={p.id} hover>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <CardTitle className="text-left leading-snug">{p.title}</CardTitle>
                {isFaculty && (
                  <div className="flex shrink-0 gap-0.5">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="text-left">
                <p className="text-sm leading-relaxed text-muted line-clamp-3">{p.description}</p>
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="font-medium text-muted">Progress</span>
                    <span className="tabular-nums text-primary">{p.progressPercentage}%</span>
                  </div>
                  <ProgressBar value={p.progressPercentage} />
                </div>
                {p._count && (
                  <p className="mt-3 text-xs text-muted">
                    {p._count.teams} teams · {p._count.submissions} submissions
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TeamsPage() {
  const { user } = useAuth();
  const isFaculty = user?.role === "FACULTY";
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teamForm, setTeamForm] = useState({ name: "", projectId: "" });
  const [assignForm, setAssignForm] = useState({ studentId: "", teamId: "" });
  const [error, setError] = useState("");

  const loadTeams = async () => {
    const res = await api.get("/teams");
    const data = res.data;
    setTeams(Array.isArray(data) ? data : [data].filter(Boolean));
  };

  useEffect(() => {
    loadTeams().catch(console.error);
    if (isFaculty) {
      api.get("/projects").then((r) => setProjects(r.data));
    }
  }, [isFaculty]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/teams", teamForm);
      setTeamForm({ name: "", projectId: "" });
      loadTeams();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/teams/assign", assignForm);
      setAssignForm({ studentId: "", teamId: "" });
      loadTeams();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Teams"
        description={
          isFaculty ? "Create teams and assign students" : "Your team and teammates"
        }
      />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {isFaculty && (
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <Card hover>
            <CardHeader>
              <CardTitle>Create team</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div className="space-y-2">
                  <Label>Team name</Label>
                  <Input
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project</Label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    value={teamForm.projectId}
                    onChange={(e) => setTeamForm({ ...teamForm, projectId: e.target.value })}
                    required
                  >
                    <option value="">Select project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit">Create team</Button>
              </form>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                Assign student
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssign} className="space-y-4">
                <div className="space-y-2">
                  <Label>Student ID</Label>
                  <Input
                    placeholder="Paste student user ID"
                    value={assignForm.studentId}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, studentId: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Team</Label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    value={assignForm.teamId}
                    onChange={(e) => setAssignForm({ ...assignForm, teamId: e.target.value })}
                    required
                  >
                    <option value="">Select team</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.project?.title})
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" variant="accent">
                  Assign
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {teams.map((t) => (
          <Card key={t.id} hover>
            <CardHeader>
              <CardTitle className="text-left">{t.name}</CardTitle>
              {t.project && (
                <p className="text-sm text-muted text-left">Project: {t.project.title}</p>
              )}
            </CardHeader>
            <CardContent className="text-left">
              <p className="text-xs text-muted mb-2">Members</p>
              <ul className="space-y-1">
                {t.members?.length === 0 && (
                  <li className="text-sm text-muted">No members yet</li>
                )}
                {t.members?.map((m) => (
                  <li key={m.id} className="text-sm">
                    {m.name}{" "}
                    <span className="text-muted text-xs">({m.id.slice(0, 8)}…)</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

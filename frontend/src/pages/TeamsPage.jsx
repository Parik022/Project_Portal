import { useState } from "react";
import { useApi } from "@/lib/useApi";
import { UserPlus, X, Users } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";

export default function TeamsPage() {
  const { user } = useAuth();
  const isFaculty = user?.role === "FACULTY";
  const teamsQuery = useApi("/teams");
  const projectsQuery = useApi("/projects", { skip: !isFaculty });
  const studentsQuery = useApi("/teams/available-students", { skip: !isFaculty });
  const teams = Array.isArray(teamsQuery.data) ? teamsQuery.data : [teamsQuery.data].filter(Boolean);
  const projects = projectsQuery.data || [];
  const students = studentsQuery.data || [];
  const [teamForm, setTeamForm] = useState({ name: "", projectId: "" });
  const [assignForm, setAssignForm] = useState({ studentId: "", teamId: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadTeams = teamsQuery.reload;
  const loadStudents = studentsQuery.reload;

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
      setNotice("Student added to the team.");
      loadTeams();
      loadStudents();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeMember = async (teamId, studentId) => {
    setError("");
    try {
      await api.delete(`/teams/${teamId}/members/${studentId}`);
      loadTeams();
      loadStudents();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Teams"
        description={
          isFaculty
            ? "Create teams (up to 4 students each) and add students to them"
            : user?.role === "STUDENT"
              ? "Your team and teammates"
              : "Teams across your scope (read-only)"
        }
      />

      <Alert tone="error" className="mb-4">{error}</Alert>
      <Alert tone="success" className="mb-4">{notice}</Alert>

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
                  <Label>Student</Label>
                  <Select
                    value={assignForm.studentId}
                    onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })}
                    required
                  >
                    <option value="">{students.length ? "Select student" : "No unassigned students"}</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} · {st.registerNo}
                      </option>
                    ))}
                  </Select>
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

      {teams.length === 0 && (
        <EmptyState icon={Users} title="No teams yet" description={isFaculty ? "Create a team for one of your projects." : "You'll see your team once faculty adds you."} />
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
                  <li key={m.id} className="flex items-center justify-between text-sm">
                    <span>
                      {m.name} <span className="text-xs text-muted">{m.email}</span>
                    </span>
                    {isFaculty && (
                      <button
                        type="button"
                        onClick={() => removeMember(t.id, m.id)}
                        className="rounded p-1 text-muted hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${m.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
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

import { useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Pencil, UserPlus, Users, X } from "lucide-react";
import api from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { EmptyState } from "@/components/ui/empty-state";

export default function TeamsPage() {
  const { user } = useAuth();
  const isFaculty = user?.role === "FACULTY";
  const teamsQuery = useApi("/teams");
  const projectsQuery = useApi("/projects?limit=100", { skip: !isFaculty });
  const studentsQuery = useApi("/teams/available-students", { skip: !isFaculty });

  // A student without a team gets a 404 from /teams; that's an empty state, not an error.
  const teams = Array.isArray(teamsQuery.data) ? teamsQuery.data : [teamsQuery.data].filter(Boolean);
  const projects = (projectsQuery.data?.items || []).filter((p) => ["APPROVED", "IN_PROGRESS"].includes(p.status));
  const students = studentsQuery.data || [];

  const [teamForm, setTeamForm] = useState({ name: "", projectId: "" });
  const [assignForm, setAssignForm] = useState({ studentId: "", teamId: "" });
  const [status, setStatus] = useState({ tone: "success", text: "" });

  const refresh = () => {
    teamsQuery.reload();
    studentsQuery.reload();
  };

  const run = async (fn, text) => {
    setStatus({ tone: "success", text: "" });
    try {
      await fn();
      setStatus({ tone: "success", text });
      refresh();
    } catch (err) {
      setStatus({ tone: "error", text: err.message });
    }
  };

  const createTeam = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post("/teams", teamForm);
      setTeamForm({ name: "", projectId: "" });
    }, "Team created.");
  };

  const assign = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post("/teams/assign", assignForm);
      setAssignForm({ studentId: "", teamId: "" });
    }, "Student added to the team.");
  };

  return (
    <div>
      <PageHeader
        title="Teams"
        description={
          isFaculty
            ? "Create teams (up to 4 students), add students and choose a leader."
            : user?.role === "STUDENT"
              ? "Your team and teammates."
              : "Teams across your scope (read-only)."
        }
      />

      <Alert tone={status.tone} className="mb-4">{status.text}</Alert>
      {teamsQuery.error && teamsQuery.error !== "You are not assigned to a team yet" && (
        <Alert tone="error" className="mb-4">{teamsQuery.error}</Alert>
      )}

      {isFaculty && (
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <Card hover>
            <CardHeader>
              <CardTitle>Create team</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createTeam} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team name</Label>
                  <Input id="team-name" value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-project">Project</Label>
                  <Select id="team-project" value={teamForm.projectId} onChange={(e) => setTeamForm({ ...teamForm, projectId: e.target.value })} required>
                    <option value="">{projects.length ? "Select project" : "No approved projects"}</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button type="submit">Create team</Button>
              </form>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" /> Add student to team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={assign} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="assign-student">Student</Label>
                  <Select id="assign-student" value={assignForm.studentId} onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })} required>
                    <option value="">{students.length ? "Select student" : "No unassigned students"}</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} · {st.registerNo}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assign-team">Team</Label>
                  <Select id="assign-team" value={assignForm.teamId} onChange={(e) => setAssignForm({ ...assignForm, teamId: e.target.value })} required>
                    <option value="">Select team</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.project?.title})
                      </option>
                    ))}
                  </Select>
                </div>
                <Button type="submit" variant="accent">
                  Add to team
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {teams.length === 0 && !teamsQuery.loading ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description={isFaculty ? "Create a team for one of your approved projects." : "You'll see your team once faculty adds you, or once your project proposal is approved."}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {teams.map((t) => (
            <TeamCard key={t.id} team={t} canManage={isFaculty} run={run} />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamCard({ team: t, canManage, run }) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(t.name);

  return (
    <Card hover>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          {renaming ? (
            <form
              className="flex flex-1 gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => api.patch(`/teams/${t.id}`, { name }), "Team renamed.").then(() => setRenaming(false));
              }}
            >
              <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
              <Button size="sm" type="submit">
                Save
              </Button>
            </form>
          ) : (
            <CardTitle className="text-left">{t.name}</CardTitle>
          )}
          {canManage && !renaming && (
            <div className="flex shrink-0 items-center">
              <Button size="icon" variant="ghost" aria-label="Rename team" onClick={() => setRenaming(true)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <ConfirmButton confirmLabel="Delete team" onConfirm={() => run(() => api.delete(`/teams/${t.id}`), `${t.name} deleted.`)}>
                Delete
              </ConfirmButton>
            </div>
          )}
        </div>
        {t.project && (
          <Link to={`/projects/${t.project.id}`} className="text-left text-sm text-muted hover:text-primary">
            Project: {t.project.title}
          </Link>
        )}
      </CardHeader>
      <CardContent className="text-left">
        <p className="mb-2 text-xs text-muted">Members ({t.members?.length || 0}/4)</p>
        <ul className="space-y-1.5">
          {t.members?.length === 0 && <li className="text-sm text-muted">No members yet</li>}
          {t.members?.map((m) => {
            const isLeader = t.leader?.id === m.id;
            return (
              <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-1.5">
                  {isLeader && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="Team leader" />}
                  <span className={isLeader ? "font-medium" : ""}>{m.name}</span>
                  <span className="truncate text-xs text-muted">{isLeader ? "leader" : m.email}</span>
                </span>
                {canManage && (
                  <span className="flex shrink-0 items-center gap-1">
                    {!isLeader && (
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => run(() => api.patch(`/teams/${t.id}`, { leaderId: m.id }), `${m.name} is now team leader.`)}>
                        Make leader
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => run(() => api.delete(`/teams/${t.id}/members/${m.id}`), `${m.name} removed from the team.`)}
                      className="rounded p-1 text-muted hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${m.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

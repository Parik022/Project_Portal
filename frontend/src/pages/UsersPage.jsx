import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, Users } from "lucide-react";
import api from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, FieldError } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, Th, Td } from "@/components/ui/table";
import { Pager } from "@/components/ui/pager";

const ROLE_VARIANT = { STUDENT: "default", FACULTY: "success", HOD: "warning", ADMIN: "danger" };

export default function UsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [filters, setFilters] = useState({ search: "", role: "", isActive: "" });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  const query = useMemo(() => {
    const params = new URLSearchParams({ page, limit: 15 });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filters.role) params.set("role", filters.role);
    if (filters.isActive) params.set("isActive", filters.isActive);
    return `/users?${params}`;
  }, [debouncedSearch, filters.role, filters.isActive, page]);

  const users = useApi(query);
  const faculty = useApi("/users?role=FACULTY&isActive=true&limit=100", { skip: !isAdmin });

  const setFilter = (key) => (e) => {
    setPage(1);
    setFilters({ ...filters, [key]: e.target.value });
  };

  const act = async (fn, success) => {
    setMessage("");
    try {
      await fn();
      setMessage(success);
      users.reload();
      faculty.reload();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const showPending = () => {
    setPage(1);
    setFilters({ search: "", role: "FACULTY", isActive: "false" });
  };

  return (
    <div>
      <PageHeader
        badge={isAdmin ? "Admin" : `HOD · ${user?.department}`}
        title="Users"
        description={isAdmin ? "Approve faculty, assign internship guides, and manage accounts." : "Students and faculty in your department."}
        action={
          isAdmin && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={showPending}>
                Pending approvals
              </Button>
              <Button onClick={() => setShowCreate(!showCreate)}>
                <UserPlus className="h-4 w-4" /> {showCreate ? "Close" : "Add user"}
              </Button>
            </div>
          )
        }
      />

      {showCreate && isAdmin && (
        <CreateUserForm
          onCreated={() => {
            setShowCreate(false);
            setMessage("User created.");
            users.reload();
          }}
        />
      )}

      {message && (
        <Alert tone={message.startsWith("Error") ? "error" : "success"} className="mb-4">
          {message}
        </Alert>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input className="pl-9" placeholder="Search name, email or register number" value={filters.search} onChange={setFilter("search")} />
        </div>
        <Select aria-label="Role" value={filters.role} onChange={setFilter("role")}>
          <option value="">All roles</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select aria-label="Status" value={filters.isActive} onChange={setFilter("isActive")}>
          <option value="">Any status</option>
          <option value="true">Active</option>
          <option value="false">Inactive / pending</option>
        </Select>
      </div>

      <Alert tone="error">{users.error}</Alert>
      {users.loading && !users.data ? (
        <Skeleton className="h-64" />
      ) : users.data?.items.length ? (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th>Department</Th>
                <Th>Guide</Th>
                <Th>Status</Th>
                {isAdmin && <Th className="text-right">Actions</Th>}
              </tr>
            </thead>
            <tbody>
              {users.data.items.map((u) => (
                <tr key={u.id}>
                  <Td>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-muted">
                      {u.email}
                      {u.registerNo ? ` · ${u.registerNo}` : ""}
                    </p>
                  </Td>
                  <Td>
                    {isAdmin && u.id !== user.id ? (
                      <Select
                        aria-label={`Role for ${u.name}`}
                        className="h-8 w-28 text-xs"
                        value={u.role}
                        onChange={(e) => act(() => api.patch(`/users/${u.id}`, { role: e.target.value }), `${u.name} is now ${ROLE_LABELS[e.target.value]}.`)}
                      >
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                    )}
                  </Td>
                  <Td className="text-muted">{u.department || "—"}</Td>
                  <Td>
                    {u.role !== "STUDENT" ? (
                      u.role === "FACULTY" ? (
                        <span className="text-xs text-muted">{u._count.students} students</span>
                      ) : (
                        "—"
                      )
                    ) : isAdmin ? (
                      <Select
                        aria-label={`Guide for ${u.name}`}
                        className="h-8 w-44 text-xs"
                        value={u.guideId || ""}
                        onChange={(e) =>
                          act(() => api.patch(`/users/${u.id}/guide`, { guideId: e.target.value || null }), `Guide updated for ${u.name}.`)
                        }
                      >
                        <option value="">No guide</option>
                        {faculty.data?.items.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      u.guide?.name || <Badge variant="warning">None</Badge>
                    )}
                  </Td>
                  <Td>
                    {u.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="warning">{u.role === "FACULTY" ? "Awaiting approval" : "Inactive"}</Badge>
                    )}
                  </Td>
                  {isAdmin && (
                    <Td className="text-right">
                      {u.id === user.id ? (
                        <span className="text-xs text-muted">You</span>
                      ) : u.isActive ? (
                        <Button size="sm" variant="ghost" onClick={() => act(() => api.delete(`/users/${u.id}`), `${u.name} deactivated.`)}>
                          Deactivate
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => act(() => api.patch(`/users/${u.id}`, { isActive: true }), `${u.name} activated.`)}>
                          {u.role === "FACULTY" ? "Approve" : "Activate"}
                        </Button>
                      )}
                    </Td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
          <Pager pagination={users.data.pagination} onPage={setPage} />
        </>
      ) : (
        <EmptyState icon={Users} title="No users found" description="Try a different search or filter." />
      )}
    </div>
  );
}

function CreateUserForm({ onCreated }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "HOD", department: "CSE", registerNo: "" });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post("/users", { ...form, registerNo: form.role === "STUDENT" ? form.registerNo : undefined });
      onCreated();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add a user</CardTitle>
        <p className="text-sm text-muted">Use this for HOD and admin accounts, which can't self-register.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
          <Alert tone="error" className="sm:col-span-3">
            {error && error.message !== "Validation failed" ? error.message : ""}
          </Alert>
          <div className="space-y-2">
            <Label htmlFor="cu-name">Name</Label>
            <Input id="cu-name" value={form.name} onChange={set("name")} />
            <FieldError errors={error?.errors} name="name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cu-email">Email</Label>
            <Input id="cu-email" type="email" value={form.email} onChange={set("email")} placeholder="name@srmist.edu.in" />
            <FieldError errors={error?.errors} name="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cu-password">Temporary password</Label>
            <Input id="cu-password" type="text" value={form.password} onChange={set("password")} />
            <FieldError errors={error?.errors} name="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cu-role">Role</Label>
            <Select id="cu-role" value={form.role} onChange={set("role")}>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cu-dept">Department</Label>
            <Input id="cu-dept" value={form.department} onChange={set("department")} />
            <FieldError errors={error?.errors} name="department" />
          </div>
          {form.role === "STUDENT" && (
            <div className="space-y-2">
              <Label htmlFor="cu-reg">Register number</Label>
              <Input id="cu-reg" value={form.registerNo} onChange={set("registerNo")} />
              <FieldError errors={error?.errors} name="registerNo" />
            </div>
          )}
          <div className="sm:col-span-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create user"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

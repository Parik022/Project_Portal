import { useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, FieldError } from "@/components/ui/alert";

export default function SettingsPage() {
  const { user, refreshProfile } = useAuth();

  const details = [
    ["Email", user?.email],
    ["Role", ROLE_LABELS[user?.role]],
    ["Department", user?.department],
    ...(user?.role === "STUDENT"
      ? [
          ["Register number", user?.registerNo],
          ["Internship guide", user?.guide ? `${user.guide.name} (${user.guide.email})` : "Not assigned yet"],
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader title="Settings" description="Your profile and password." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card hover>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {details.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
                <span className="text-sm font-medium text-foreground">{value || "—"}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <ProfileForm user={user} onSaved={refreshProfile} />
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}

function ProfileForm({ user, onSaved }) {
  const [form, setForm] = useState({ name: user?.name || "", department: user?.department || "" });
  const [status, setStatus] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus(null);
    try {
      await api.patch("/auth/profile", form);
      await onSaved();
      setStatus({ tone: "success", message: "Profile updated." });
    } catch (err) {
      setStatus({ tone: "error", message: err.message, errors: err.errors });
    }
  };

  return (
    <Card hover>
      <CardHeader>
        <CardTitle>Edit profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <Alert tone={status?.tone}>{status?.message}</Alert>
          <div className="space-y-2">
            <Label htmlFor="p-name">Name</Label>
            <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <FieldError errors={status?.errors} name="name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-dept">Department</Label>
            <Input id="p-dept" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            <FieldError errors={status?.errors} name="department" />
          </div>
          <Button type="submit">Save</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [status, setStatus] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus(null);
    try {
      await api.patch("/auth/password", form);
      setForm({ currentPassword: "", newPassword: "" });
      setStatus({ tone: "success", message: "Password changed." });
    } catch (err) {
      setStatus({ tone: "error", message: err.message, errors: err.errors });
    }
  };

  return (
    <Card hover>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <Alert tone={status?.tone}>{status?.message !== "Validation failed" ? status?.message : ""}</Alert>
          <div className="space-y-2">
            <Label htmlFor="cur">Current password</Label>
            <Input id="cur" type="password" autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new">New password</Label>
            <Input id="new" type="password" autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
            <FieldError errors={status?.errors} name="newPassword" />
          </div>
          <Button type="submit">Change password</Button>
        </form>
      </CardContent>
    </Card>
  );
}

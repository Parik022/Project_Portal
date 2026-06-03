import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fields = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "id", label: "User ID", mono: true },
];

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Your account details for this portal session."
      />
      <Card hover className="max-w-lg">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {fields.map(({ key, label, mono }) => (
            <div key={key} className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                {label}
              </span>
              <span
                className={
                  mono
                    ? "font-mono text-xs text-muted break-all"
                    : "text-sm font-medium text-foreground"
                }
              >
                {user?.[key] ?? "—"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

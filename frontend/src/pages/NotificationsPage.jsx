import { useState } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Pager } from "@/components/ui/pager";

const announce = () => window.dispatchEvent(new Event("notifications:changed"));

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApi(`/notifications?page=${page}&limit=20`);

  const run = async (fn) => {
    await fn();
    reload();
    announce();
  };

  if (loading && !data) return <PageSkeleton />;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={data ? `${data.unreadCount} unread` : undefined}
        action={
          data?.unreadCount > 0 && (
            <Button variant="secondary" onClick={() => run(() => api.patch("/notifications/read-all"))}>
              <Check className="h-4 w-4" /> Mark all read
            </Button>
          )
        }
      />
      <Alert tone="error">{error}</Alert>
      {data?.items.length ? (
        <div className="space-y-2">
          {data.items.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex items-start justify-between gap-4 rounded-lg border px-4 py-3",
                n.isRead ? "border-border/70 bg-white" : "border-primary/20 bg-accent-soft/50"
              )}
            >
              <div className="flex gap-3">
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.isRead ? "bg-transparent" : "bg-primary")} />
                <div>
                  <p className={cn("text-sm", n.isRead ? "text-muted" : "font-medium text-foreground")}>{n.message}</p>
                  <p className="mt-0.5 text-xs text-muted">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {!n.isRead && (
                  <Button size="icon" variant="ghost" aria-label="Mark as read" onClick={() => run(() => api.patch(`/notifications/${n.id}/read`))}>
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => run(() => api.delete(`/notifications/${n.id}`))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Pager pagination={data.pagination} onPage={setPage} />
        </div>
      ) : (
        <EmptyState icon={Bell} title="No notifications" description="Reviews, approvals and check-ins will show up here." />
      )}
    </div>
  );
}

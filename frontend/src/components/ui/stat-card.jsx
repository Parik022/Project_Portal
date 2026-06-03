import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({ title, value, subtitle, icon: Icon, accent = false }) {
  return (
    <Card hover className={cn("overflow-hidden", accent && "ring-1 ring-gold/25")}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-primary">
              {value}
            </p>
            {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
          </div>
          {Icon && (
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                accent
                  ? "bg-gradient-to-br from-gold/25 to-gold/10 text-primary"
                  : "bg-accent-soft text-primary"
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

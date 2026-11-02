import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { statusLabel, statusVariant } from "@/lib/format";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-accent-soft text-primary",
        success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
        warning: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
        danger: "bg-red-50 text-red-700 ring-1 ring-red-200/80",
        muted: "bg-background text-muted ring-1 ring-border",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function StatusBadge({ status, className }) {
  return (
    <Badge variant={statusVariant(status)} className={className}>
      {statusLabel(status)}
    </Badge>
  );
}

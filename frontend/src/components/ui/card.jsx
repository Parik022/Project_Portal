import { cn } from "@/lib/utils";

export function Card({ className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-border/90 bg-card text-foreground",
        "shadow-[var(--shadow-card)]",
        hover && "transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1 p-6 pb-0", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn("text-[15px] font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return <p className={cn("text-sm text-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-6", className)} {...props} />;
}

import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-lg border border-border bg-white px-3.5 text-sm shadow-sm transition-colors hover:border-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15 disabled:opacity-60",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

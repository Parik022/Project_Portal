import { cn } from "@/lib/utils";

export function Input({ className, type = "text", ...props }) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground shadow-sm transition-colors",
        "placeholder:text-muted/70",
        "hover:border-primary/25",
        "focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15",
        "disabled:cursor-not-allowed disabled:bg-background disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

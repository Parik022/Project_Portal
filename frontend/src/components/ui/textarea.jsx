import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "flex min-h-[108px] w-full resize-y rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm transition-colors",
        "placeholder:text-muted/70",
        "hover:border-primary/25",
        "focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

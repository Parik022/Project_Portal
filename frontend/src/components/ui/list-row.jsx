import { cn } from "@/lib/utils";

export function ListRow({ children, className, onClick }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-4 rounded-lg border border-border/80 bg-white px-4 py-3.5 text-left transition-colors",
        onClick && "cursor-pointer hover:border-primary/20 hover:bg-accent-soft/30",
        className
      )}
    >
      {children}
    </Comp>
  );
}

import { cn } from "@/lib/utils";

export function Table({ className, children }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/80 bg-white">
      <table className={cn("w-full min-w-[640px] text-left text-sm", className)}>{children}</table>
    </div>
  );
}

export function Th({ className, children, ...props }) {
  return (
    <th className={cn("border-b border-border bg-background/60 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted", className)} {...props}>
      {children}
    </th>
  );
}

export function Td({ className, children, ...props }) {
  return (
    <td className={cn("border-b border-border/60 px-4 py-3 align-middle", className)} {...props}>
      {children}
    </td>
  );
}

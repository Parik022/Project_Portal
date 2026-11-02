import { cn } from "@/lib/utils";

const tones = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-primary/15 bg-accent-soft text-primary",
};

export function Alert({ tone = "info", className, children }) {
  if (!children) return null;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-lg border px-3.5 py-2.5 text-sm", tones[tone], className)}>
      {children}
    </div>
  );
}

// Shows field-level messages returned by the API's Zod validation.
export function FieldError({ errors, name }) {
  const message = errors?.[name]?.[0];
  if (!message) return null;
  return <p className="text-xs font-medium text-red-600">{message}</p>;
}

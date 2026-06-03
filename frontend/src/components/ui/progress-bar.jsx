export function ProgressBar({ value, className = "" }) {
  const clamped = Math.min(100, Math.max(0, value ?? 0));
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-accent-soft ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-[width] duration-500 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

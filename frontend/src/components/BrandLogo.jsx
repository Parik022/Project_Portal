import { cn } from "@/lib/utils";

/**
 * @param {"seal" | "full"} variant - circular seal or horizontal wordmark
 */
export function BrandLogo({
  className,
  variant = "seal",
  size = "md",
  showSubtitle = true,
}) {
  const sealSizes = {
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const fullSizes = {
    sm: "h-10",
    md: "h-14",
    lg: "h-20",
  };

  if (variant === "full") {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        <img
          src="/srm-logo-full.png"
          alt="SRM Institute of Science and Technology"
          className={cn("w-auto max-w-full object-contain", fullSizes[size] || fullSizes.md)}
        />
        {showSubtitle && (
          <p className="text-center text-sm font-semibold tracking-wide text-primary">
            Faculty Project Portal
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src="/srm-logo-seal-sm.png"
        alt="SRMIST"
        className={cn("shrink-0 object-contain", sealSizes[size] || sealSizes.md)}
      />
      {showSubtitle && (
        <div className="min-w-0 text-left leading-tight">
          <p className="truncate text-sm font-bold">SRMIST</p>
          <p className="truncate text-xs opacity-90">Faculty Project Portal</p>
        </div>
      )}
    </div>
  );
}

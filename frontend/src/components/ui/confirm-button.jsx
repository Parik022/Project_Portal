import { useState } from "react";
import { Button } from "@/components/ui/button";

// Two-step confirm without window.confirm (blocked inside hosted pages).
export function ConfirmButton({ onConfirm, children, confirmLabel = "Confirm", size = "sm", variant = "ghost", ...props }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <Button size={size} variant={variant} onClick={() => setAsking(true)} {...props}>
        {children}
      </Button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <Button
        size={size}
        variant="destructive"
        onClick={async () => {
          await onConfirm();
          setAsking(false);
        }}
      >
        {confirmLabel}
      </Button>
      <Button size={size} variant="ghost" onClick={() => setAsking(false)}>
        Cancel
      </Button>
    </span>
  );
}

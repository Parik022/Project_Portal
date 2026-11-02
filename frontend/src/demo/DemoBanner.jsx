import { resetDemo } from "./mockServer";

// Thin strip shown only in the demo build.
export function DemoBanner() {
  const reset = () => {
    resetDemo();
    localStorage.removeItem("token");
    window.location.reload();
  };
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-gold px-4 py-1.5 text-center text-xs font-medium text-primary">
      <span>Demo mode · data is simulated and stays in this browser</span>
      <button type="button" onClick={reset} className="rounded border border-primary/30 px-2 py-0.5 font-semibold hover:bg-white/40">
        Reset demo data
      </button>
    </div>
  );
}

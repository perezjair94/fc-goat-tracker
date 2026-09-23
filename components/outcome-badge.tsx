import { cn } from "@/lib/utils";
import type { MatchOutcome } from "@/types";

const LABELS: Record<MatchOutcome, string> = {
  win: "WIN",
  draw: "DRAW",
  loss: "LOSS",
};

const STYLES: Record<MatchOutcome, string> = {
  win: "bg-goat-lime/15 text-goat-lime border-goat-lime/30",
  draw: "bg-white/10 text-foreground/70 border-white/15",
  loss: "bg-goat-coral/10 text-goat-coral/80 border-goat-coral/20",
};

export function OutcomeBadge({ outcome, className }: { outcome: MatchOutcome; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide",
        STYLES[outcome],
        className
      )}
    >
      {LABELS[outcome]}
    </span>
  );
}

export function KOBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-goat-coral/40 bg-goat-coral/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-goat-coral",
        className
      )}
    >
      K.O.
    </span>
  );
}

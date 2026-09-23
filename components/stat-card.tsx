import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  accent?: "lime" | "coral" | "default";
  className?: string;
}

const ACCENT_ICON: Record<NonNullable<StatCardProps["accent"]>, string> = {
  lime: "text-goat-lime",
  coral: "text-goat-coral",
  default: "text-foreground/70",
};

export function StatCard({ label, value, icon: Icon, hint, accent = "default", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4 sm:p-5",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {Icon ? <Icon className={cn("size-4", ACCENT_ICON[accent])} /> : null}
      </div>
      <p className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

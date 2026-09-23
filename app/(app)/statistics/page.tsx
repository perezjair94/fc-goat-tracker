"use client";

import { BarChart3, Goal, Swords, Zap } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { PlayerAvatar } from "@/components/player-avatar";
import { EmptyState } from "@/components/empty-state";
import { useFcStore } from "@/hooks/use-fc-store";
import { getMatches, getRanking, getRules } from "@/lib/services/fc-service";

export default function StatisticsPage() {
  const { data: matches, ready } = useFcStore(getMatches);
  const { data: ranking } = useFcStore(getRanking);
  const rules = getRules();

  if (!ready) return null;

  if (!matches || matches.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Estadísticas" description="Métricas agregadas del grupo." />
        <EmptyState icon={BarChart3} title="Sin datos todavía" description="Registra partidos para ver estadísticas agregadas." actionLabel="Registrar partido" actionHref="/matches/new" />
      </div>
    );
  }

  const totalGoals = matches.reduce((sum, m) => sum + m.score1 + m.score2, 0);
  const koMatches = matches.filter((m) => Math.abs(m.score1 - m.score2) >= rules.koGoalDifference && m.score1 !== m.score2);
  const avgGoals = totalGoals / matches.length;

  const byGoals = [...(ranking ?? [])].sort((a, b) => b.goalsFor - a.goalsFor).slice(0, 8);
  const maxGoals = byGoals[0]?.goalsFor ?? 1;

  const byPoints = [...(ranking ?? [])].slice(0, 8);
  const maxPoints = byPoints[0]?.points ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Estadísticas" description="Métricas agregadas de todos los partidos registrados." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Partidos totales" value={matches.length} icon={Swords} />
        <StatCard label="Goles totales" value={totalGoals} icon={Goal} />
        <StatCard label="Goles por partido" value={avgGoals.toFixed(1)} />
        <StatCard label="K.O." value={koMatches.length} icon={Zap} accent="coral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarList title="Puntos GOAT" entries={byPoints.map((e) => ({ player: e.player, value: e.points }))} max={maxPoints} />
        <BarList title="Goles anotados" entries={byGoals.map((e) => ({ player: e.player, value: e.goalsFor }))} max={maxGoals} accent="coral" />
      </div>
    </div>
  );
}

function BarList({
  title,
  entries,
  max,
  accent = "lime",
}: {
  title: string;
  entries: { player: { id: string; name: string; initials: string; color: string }; value: number }[];
  max: number;
  accent?: "lime" | "coral";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="flex flex-col gap-3">
        {entries.map(({ player, value }) => (
          <div key={player.id} className="flex items-center gap-3">
            <PlayerAvatar player={player} size="sm" />
            <span className="w-20 shrink-0 truncate text-sm">{player.name}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${accent === "lime" ? "bg-goat-lime" : "bg-goat-coral"}`}
                style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right font-mono text-sm font-bold">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

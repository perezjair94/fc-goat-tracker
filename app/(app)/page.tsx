"use client";

import Link from "next/link";
import { ArrowRight, Goal, Swords, Trophy, Users, Zap } from "lucide-react";
import { GoatHero } from "@/components/goat-hero";
import { StatCard } from "@/components/stat-card";
import { PlayerAvatar } from "@/components/player-avatar";
import { MatchCard } from "@/components/match-card";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useFcStore } from "@/hooks/use-fc-store";
import { getActivePlayers, getMatches, getPlayers, getRanking, getRules } from "@/lib/services/fc-service";
import { formatWinRate } from "@/types";

export default function DashboardPage() {
  const { data: ranking, ready: rankingReady } = useFcStore(getRanking);
  const { data: matches, ready: matchesReady } = useFcStore(getMatches);
  const { data: players } = useFcStore(getPlayers);
  const { data: activePlayers } = useFcStore(getActivePlayers);
  const rules = getRules();

  const ready = rankingReady && matchesReady;
  const playersById = new Map(players?.map((p) => [p.id, p]) ?? []);

  if (!ready) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!matches || matches.length === 0 || !ranking || ranking.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="Bienvenido a FC GOAT Tracker"
        description="Registra el primer partido del grupo para empezar a construir el ranking GOAT."
        actionLabel="Registrar partido"
        actionHref="/matches/new"
      />
    );
  }

  const leader = ranking[0];
  const totalGoals = matches.reduce((sum, m) => sum + m.score1 + m.score2, 0);
  const koCount = matches.filter((m) => Math.abs(m.score1 - m.score2) >= rules.koGoalDifference && m.score1 !== m.score2).length;
  const top5 = ranking.slice(0, 5);
  const recent = matches.slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <GoatHero entry={leader} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Partidos" value={matches.length} icon={Swords} />
        <StatCard label="Jugadores activos" value={activePlayers?.length ?? 0} icon={Users} />
        <StatCard label="Goles totales" value={totalGoals} icon={Goal} />
        <StatCard label="K.O." value={koCount} icon={Zap} accent="coral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Top 5</h2>
            <Link href="/ranking" className="flex items-center gap-1 text-xs font-medium text-goat-lime hover:underline">
              Ver todo
              <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="flex flex-col gap-1">
            {top5.map((entry) => (
              <Link
                key={entry.player.id}
                href={`/players/${entry.player.id}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/5"
              >
                <span className="w-5 shrink-0 text-center font-mono text-sm text-muted-foreground">
                  {entry.rank}
                </span>
                <PlayerAvatar player={entry.player} size="sm" />
                <span className="flex-1 truncate text-sm font-medium">{entry.player.name}</span>
                <span className="text-xs text-muted-foreground">{formatWinRate(entry.winRate)}</span>
                <span className="font-mono text-sm font-bold text-goat-lime">{entry.points}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Partidos recientes
            </h2>
            <Link href="/history" className="flex items-center gap-1 text-xs font-medium text-goat-lime hover:underline">
              Ver historial
              <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {recent.map((match) => {
              const p1 = playersById.get(match.player1Id);
              const p2 = playersById.get(match.player2Id);
              if (!p1 || !p2) return null;
              return <MatchCard key={match.id} match={match} player1={p1} player2={p2} rules={rules} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

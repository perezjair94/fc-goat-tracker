"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, Layers3 } from "lucide-react";
import { MatchCard } from "@/components/match-card";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFcStore } from "@/hooks/use-fc-store";
import { getMatchesForSession, getPlayers, getRules, getSession } from "@/lib/services/fc-service";
import { formatDay } from "@/lib/format";
import { getWinnerId } from "@/types";

export function SessionDetailView({ id }: { id: string }) {
  const { data: session, ready } = useFcStore(() => getSession(id));
  const { data: matches } = useFcStore(() => getMatchesForSession(id));
  const { data: players } = useFcStore(getPlayers);
  const rules = getRules();

  if (!ready) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!session) {
    return (
      <EmptyState
        icon={Layers3}
        title="Sesión no encontrada"
        actionLabel="Ver sesiones"
        actionHref="/sessions"
      />
    );
  }

  const playersById = new Map(players?.map((p) => [p.id, p]) ?? []);
  const koCount = matches?.filter((m) => Math.abs(m.score1 - m.score2) >= rules.koGoalDifference && m.score1 !== m.score2).length ?? 0;
  const participantIds = new Set(matches?.flatMap((m) => [m.player1Id, m.player2Id]) ?? []);

  const goalsByPlayer = new Map<string, number>();
  matches?.forEach((m) => {
    goalsByPlayer.set(m.player1Id, (goalsByPlayer.get(m.player1Id) ?? 0) + m.score1);
    goalsByPlayer.set(m.player2Id, (goalsByPlayer.get(m.player2Id) ?? 0) + m.score2);
  });
  const winsByPlayer = new Map<string, number>();
  matches?.forEach((m) => {
    const winnerId = getWinnerId(m);
    if (winnerId) winsByPlayer.set(winnerId, (winsByPlayer.get(winnerId) ?? 0) + 1);
  });
  const topScorerId = [...winsByPlayer.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const topScorer = topScorerId ? playersById.get(topScorerId) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/sessions" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        Sesiones
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-xl bg-goat-lime/10 text-goat-lime">
          <CalendarDays className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">{session.name}</h1>
          <p className="text-sm text-muted-foreground">{formatDay(session.date)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Partidos" value={matches?.length ?? 0} />
        <StatCard label="Jugadores" value={participantIds.size} />
        <StatCard label="K.O." value={koCount} accent="coral" />
        <StatCard label="Más victorias" value={topScorer?.name ?? "–"} />
      </div>

      <div className="flex flex-col gap-2">
        {matches && matches.length > 0 ? (
          matches.map((match) => {
            const p1 = playersById.get(match.player1Id);
            const p2 = playersById.get(match.player2Id);
            if (!p1 || !p2) return null;
            return <MatchCard key={match.id} match={match} player1={p1} player2={p2} rules={rules} />;
          })
        ) : (
          <EmptyState
            icon={Layers3}
            title="Sin partidos en esta sesión"
            actionLabel="Registrar partido"
            actionHref="/matches/new"
          />
        )}
      </div>
    </div>
  );
}

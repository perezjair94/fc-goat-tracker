"use client";

import Link from "next/link";
import { ArrowLeft, Swords, Target, Trophy, Zap } from "lucide-react";
import { PlayerAvatar } from "@/components/player-avatar";
import { StatCard } from "@/components/stat-card";
import { MatchCard } from "@/components/match-card";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useFcStore } from "@/hooks/use-fc-store";
import {
  getMatchesForPlayer,
  getPlayer,
  getPlayers,
  getRanking,
  getRules,
} from "@/lib/services/fc-service";
import { formatWinRate } from "@/types";

export function PlayerDetailView({ id }: { id: string }) {
  const { data: player, ready } = useFcStore(() => getPlayer(id));
  const { data: players } = useFcStore(getPlayers);
  const { data: ranking } = useFcStore(getRanking);
  const { data: matches } = useFcStore(() => getMatchesForPlayer(id));
  const rules = getRules();

  if (!ready) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!player) {
    return (
      <EmptyState
        icon={Swords}
        title="Jugador no encontrado"
        description="Puede que el enlace sea incorrecto o el jugador haya sido eliminado."
        actionLabel="Ver jugadores"
        actionHref="/players"
      />
    );
  }

  const entry = ranking?.find((e) => e.player.id === id);
  const playersById = new Map(players?.map((p) => [p.id, p]) ?? []);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/players" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        Jugadores
      </Link>

      <div className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center">
        <PlayerAvatar player={player} size="xl" />
        <div className="flex-1">
          <h1 className="text-2xl font-black tracking-tight">{player.name}</h1>
          <p className="text-sm text-muted-foreground">{player.handle}</p>
        </div>
        {entry ? (
          <div className="flex items-center gap-2 rounded-xl bg-goat-lime/10 px-4 py-2 text-goat-lime">
            <Trophy className="size-4" />
            <span className="font-black">#{entry.rank}</span>
            <span className="text-sm text-goat-lime/80">en el ranking</span>
          </div>
        ) : null}
      </div>

      {entry ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Puntos GOAT" value={entry.points} icon={Trophy} accent="lime" />
          <StatCard label="Partidos" value={entry.played} />
          <StatCard label="Win rate" value={formatWinRate(entry.winRate)} />
          <StatCard label="K.O. logrados" value={entry.koWins} icon={Zap} accent="coral" />
          <StatCard label="Victorias" value={entry.wins} />
          <StatCard label="Empates" value={entry.draws} />
          <StatCard label="Derrotas" value={entry.losses} />
          <StatCard
            label="Dif. de goles"
            value={`${entry.goalDifference > 0 ? "+" : ""}${entry.goalDifference}`}
            icon={Target}
          />
        </div>
      ) : (
        <EmptyState icon={Trophy} title="Sin partidos todavía" description="Este jugador aún no tiene resultados registrados." />
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Últimos partidos
        </h2>
        {matches && matches.length > 0 ? (
          <div className="flex flex-col gap-2">
            {matches.slice(0, 10).map((match) => {
              const p1 = playersById.get(match.player1Id);
              const p2 = playersById.get(match.player2Id);
              if (!p1 || !p2) return null;
              return <MatchCard key={match.id} match={match} player1={p1} player2={p2} rules={rules} />;
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin partidos registrados.</p>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PlayerAvatar } from "@/components/player-avatar";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useFcStore } from "@/hooks/use-fc-store";
import { getPlayers, getRanking } from "@/lib/services/fc-service";
import { formatWinRate } from "@/types";

export default function PlayersPage() {
  const { data: players, ready } = useFcStore(getPlayers);
  const { data: ranking } = useFcStore(getRanking);

  const rankByPlayer = new Map(ranking?.map((entry) => [entry.player.id, entry]) ?? []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Jugadores"
        description="Todos los jugadores del grupo y su rendimiento acumulado."
      />

      {!ready ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : players && players.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => {
            const entry = rankByPlayer.get(player.id);
            return (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-goat-lime/40"
              >
                <PlayerAvatar player={player} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{player.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{player.handle}</p>
                  {entry ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      #{entry.rank} · {entry.points} pts · {formatWinRate(entry.winRate)} win rate
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Users} title="No hay jugadores" description="Añade jugadores desde configuración." />
      )}
    </div>
  );
}

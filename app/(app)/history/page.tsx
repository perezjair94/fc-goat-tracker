"use client";

import { useMemo, useState } from "react";
import { History as HistoryIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { MatchCard } from "@/components/match-card";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFcStore } from "@/hooks/use-fc-store";
import { getMatches, getPlayers, getRules } from "@/lib/services/fc-service";

export default function HistoryPage() {
  const { data: matches, ready } = useFcStore(getMatches);
  const { data: players } = useFcStore(getPlayers);
  const rules = getRules();
  const [playerFilter, setPlayerFilter] = useState("all");

  const playersById = useMemo(() => new Map(players?.map((p) => [p.id, p]) ?? []), [players]);

  const filtered = useMemo(() => {
    if (!matches) return [];
    if (playerFilter === "all") return matches;
    return matches.filter((m) => m.player1Id === playerFilter || m.player2Id === playerFilter);
  }, [matches, playerFilter]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Historial"
        description="Todos los partidos registrados, del más reciente al más antiguo."
        actions={
          <Select value={playerFilter} onValueChange={(value) => setPlayerFilter(value ?? "all")}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Todos los jugadores">
                {(value: string) =>
                  value === "all" ? "Todos los jugadores" : players?.find((p) => p.id === value)?.name ?? "Todos los jugadores"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los jugadores</SelectItem>
              {players?.map((player) => (
                <SelectItem key={player.id} value={player.id}>
                  {player.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {!ready ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="flex flex-col gap-2">
          {filtered.map((match) => {
            const p1 = playersById.get(match.player1Id);
            const p2 = playersById.get(match.player2Id);
            if (!p1 || !p2) return null;
            return <MatchCard key={match.id} match={match} player1={p1} player2={p2} rules={rules} />;
          })}
        </div>
      ) : (
        <EmptyState
          icon={HistoryIcon}
          title="No hay partidos"
          description="Todavía no se ha registrado ningún partido con este filtro."
          actionLabel="Registrar partido"
          actionHref="/matches/new"
        />
      )}
    </div>
  );
}

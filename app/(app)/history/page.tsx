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
import { MATCH_MODES, MATCH_MODE_LABELS, isMatchMode } from "@/types";

export default function HistoryPage() {
  const { data: matches, ready } = useFcStore(getMatches);
  const { data: players } = useFcStore(getPlayers);
  const rules = getRules();
  const [playerFilter, setPlayerFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");

  const playersById = useMemo(() => new Map(players?.map((p) => [p.id, p]) ?? []), [players]);

  const filtered = useMemo(() => {
    if (!matches) return [];
    return matches.filter(
      (m) =>
        (playerFilter === "all" || m.player1Id === playerFilter || m.player2Id === playerFilter) &&
        (modeFilter === "all" || m.mode === modeFilter)
    );
  }, [matches, playerFilter, modeFilter]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Historial"
        description="Todos los partidos registrados, del más reciente al más antiguo."
        actions={
          <div className="flex flex-wrap gap-2">
            <Select value={modeFilter} onValueChange={(value) => setModeFilter(value ?? "all")}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos los tipos">
                  {(value: string) =>
                    isMatchMode(value) ? MATCH_MODE_LABELS[value] : "Todos los tipos"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {MATCH_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {MATCH_MODE_LABELS[mode]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          </div>
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

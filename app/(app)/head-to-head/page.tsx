"use client";

import { useState } from "react";
import { Swords } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PlayerAvatar } from "@/components/player-avatar";
import { MatchCard } from "@/components/match-card";
import { EmptyState } from "@/components/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFcStore } from "@/hooks/use-fc-store";
import { getHeadToHead, getPlayers, getRules } from "@/lib/services/fc-service";

export default function HeadToHeadPage() {
  const { data: players, ready } = useFcStore(getPlayers);
  const rules = getRules();
  const [playerAId, setPlayerAId] = useState<string>("");
  const [playerBId, setPlayerBId] = useState<string>("");

  const { data: h2h } = useFcStore(() =>
    playerAId && playerBId ? getHeadToHead(playerAId, playerBId) : undefined
  );

  const playerA = players?.find((p) => p.id === playerAId);
  const playerB = players?.find((p) => p.id === playerBId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Enfrentamientos" description="Compara el historial directo entre dos jugadores." />

      {ready && players ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <PlayerPicker
            label="Jugador A"
            players={players}
            value={playerAId}
            onChange={setPlayerAId}
            excludeId={playerBId}
          />
          <PlayerPicker
            label="Jugador B"
            players={players}
            value={playerBId}
            onChange={setPlayerBId}
            excludeId={playerAId}
          />
        </div>
      ) : null}

      {!playerA || !playerB ? (
        <EmptyState icon={Swords} title="Elige dos jugadores" description="Selecciona ambos jugadores para ver su historial directo." />
      ) : !h2h || h2h.matches.length === 0 ? (
        <EmptyState icon={Swords} title="Sin enfrentamientos" description={`${playerA.name} y ${playerB.name} todavía no se han enfrentado.`} />
      ) : (
        <>
          <div className="flex items-center justify-center gap-6 rounded-2xl border border-border bg-card p-6 sm:gap-10">
            <SummaryColumn player={playerA} wins={h2h.winsA} goals={h2h.goalsForA} ko={h2h.koWinsA} />
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Empates</span>
              <span className="font-mono text-2xl font-black">{h2h.draws}</span>
            </div>
            <SummaryColumn player={playerB} wins={h2h.winsB} goals={h2h.goalsForB} ko={h2h.koWinsB} align="right" />
          </div>

          <div className="flex flex-col gap-2">
            {h2h.matches
              .slice()
              .reverse()
              .map((match) => (
                <MatchCard key={match.id} match={match} player1={playerA} player2={playerB} rules={rules} />
              ))}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryColumn({
  player,
  wins,
  goals,
  ko,
  align = "left",
}: {
  player: { name: string; initials: string; color: string };
  wins: number;
  goals: number;
  ko: number;
  align?: "left" | "right";
}) {
  return (
    <div className={`flex flex-col items-center gap-2 ${align === "right" ? "" : ""}`}>
      <PlayerAvatar player={player} size="lg" />
      <span className="text-sm font-semibold">{player.name}</span>
      <span className="font-mono text-3xl font-black text-goat-lime">{wins}</span>
      <span className="text-xs text-muted-foreground">victorias</span>
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span>{goals} goles</span>
        {ko > 0 ? <span className="text-goat-coral">{ko} K.O.</span> : null}
      </div>
    </div>
  );
}

function PlayerPicker({
  label,
  players,
  value,
  onChange,
  excludeId,
}: {
  label: string;
  players: { id: string; name: string; initials: string; color: string }[];
  value: string;
  onChange: (id: string) => void;
  excludeId: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecciona un jugador">
            {() => {
              const selected = players.find((p) => p.id === value);
              return selected ? (
                <span className="flex items-center gap-2">
                  <PlayerAvatar player={selected} size="sm" />
                  {selected.name}
                </span>
              ) : (
                "Selecciona un jugador"
              );
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {players.map((player) => (
            <SelectItem key={player.id} value={player.id} disabled={player.id === excludeId}>
              <span className="flex items-center gap-2">
                <PlayerAvatar player={player} size="sm" />
                {player.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

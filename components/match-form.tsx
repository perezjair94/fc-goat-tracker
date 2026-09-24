"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Swords, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlayerAvatar } from "@/components/player-avatar";
import { useFcStore } from "@/hooks/use-fc-store";
import { useCurrentPlayer } from "@/hooks/use-current-player";
import {
  createMatch,
  getActivePlayers,
  getActiveSeason,
  getRules,
  getSessions,
} from "@/lib/services/fc-service";
import { cn } from "@/lib/utils";
import { DEFAULT_MATCH_MODE, MATCH_MODES, MATCH_MODE_LABELS, type MatchMode } from "@/types";

interface MatchFormProps {
  defaultSessionId?: string;
  redirectTo?: string;
}

export function MatchForm({ defaultSessionId, redirectTo = "/history" }: MatchFormProps) {
  const router = useRouter();
  const { data: players, ready } = useFcStore(getActivePlayers);
  const { data: sessions } = useFcStore(getSessions);
  const { currentPlayerId } = useCurrentPlayer();

  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [score1, setScore1] = useState("0");
  const [score2, setScore2] = useState("0");
  const [mode, setMode] = useState<MatchMode>(DEFAULT_MATCH_MODE);
  const [sessionId, setSessionId] = useState(defaultSessionId ?? "none");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rules = getRules();
  const player1 = players?.find((p) => p.id === player1Id);
  const player2 = players?.find((p) => p.id === player2Id);

  const preview = useMemo(() => {
    const s1 = Number(score1);
    const s2 = Number(score2);
    if (!player1 || !player2 || Number.isNaN(s1) || Number.isNaN(s2)) return null;
    const isKO = s1 !== s2 && Math.abs(s1 - s2) >= rules.koGoalDifference;
    if (s1 === s2) return { label: "Empate", winner: null, isKO: false };
    const winner = s1 > s2 ? player1 : player2;
    return { label: `Gana ${winner.name}`, winner, isKO };
  }, [player1, player2, score1, score2, rules]);

  if (!ready) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!player1Id || !player2Id) {
      setError("Selecciona ambos jugadores.");
      return;
    }
    if (player1Id === player2Id) {
      setError("Los dos jugadores deben ser distintos.");
      return;
    }
    const s1 = Number(score1);
    const s2 = Number(score2);
    if (Number.isNaN(s1) || Number.isNaN(s2) || s1 < 0 || s2 < 0) {
      setError("El marcador debe ser un número igual o mayor a cero.");
      return;
    }

    setSubmitting(true);
    try {
      const season = getActiveSeason()?.year ?? new Date().getFullYear();
      await createMatch({
        player1Id,
        player2Id,
        score1: s1,
        score2: s2,
        mode,
        season,
        sessionId: sessionId === "none" ? undefined : sessionId,
        notes: notes.trim() || undefined,
        createdBy: currentPlayerId ?? player1Id,
      });
      toast.success("Partido registrado");
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el partido.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Tipo de partido</legend>
        <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
          {MATCH_MODES.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={mode === option}
              onClick={() => setMode(option)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                mode === option
                  ? "border-goat-lime bg-goat-lime/15 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-goat-lime/40 hover:text-foreground"
              )}
            >
              {MATCH_MODE_LABELS[option]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="player1">Jugador 1</Label>
          <Select value={player1Id} onValueChange={(value) => value && setPlayer1Id(value)}>
            <SelectTrigger id="player1" className="w-full">
              <SelectValue placeholder="Selecciona un jugador">
                {() =>
                  player1 ? (
                    <span className="flex items-center gap-2">
                      <PlayerAvatar player={player1} size="sm" />
                      {player1.name}
                    </span>
                  ) : (
                    "Selecciona un jugador"
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {players?.map((player) => (
                <SelectItem key={player.id} value={player.id} disabled={player.id === player2Id}>
                  <span className="flex items-center gap-2">
                    <PlayerAvatar player={player} size="sm" />
                    {player.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={score1}
            onChange={(e) => setScore1(e.target.value)}
            aria-label="Marcador jugador 1"
            className="text-center text-lg font-bold"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="player2">Jugador 2</Label>
          <Select value={player2Id} onValueChange={(value) => value && setPlayer2Id(value)}>
            <SelectTrigger id="player2" className="w-full">
              <SelectValue placeholder="Selecciona un jugador">
                {() =>
                  player2 ? (
                    <span className="flex items-center gap-2">
                      <PlayerAvatar player={player2} size="sm" />
                      {player2.name}
                    </span>
                  ) : (
                    "Selecciona un jugador"
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {players?.map((player) => (
                <SelectItem key={player.id} value={player.id} disabled={player.id === player1Id}>
                  <span className="flex items-center gap-2">
                    <PlayerAvatar player={player} size="sm" />
                    {player.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={score2}
            onChange={(e) => setScore2(e.target.value)}
            aria-label="Marcador jugador 2"
            className="text-center text-lg font-bold"
          />
        </div>
      </div>

      {preview ? (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
          <Swords className="size-4 text-muted-foreground" />
          <span className="font-medium">{preview.label}</span>
          {preview.isKO ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-goat-coral/40 bg-goat-coral/15 px-2 py-0.5 text-[10px] font-bold text-goat-coral">
              <Zap className="size-3" />
              K.O. · +{rules.koBonusPoints} pts
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="session">Sesión (opcional)</Label>
        <Select value={sessionId} onValueChange={(value) => setSessionId(value ?? "none")}>
          <SelectTrigger id="session" className="w-full">
            <SelectValue placeholder="Sin sesión">
              {(value: string) =>
                value === "none" ? "Sin sesión" : sessions?.find((s) => s.id === value)?.name ?? "Sin sesión"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin sesión</SelectItem>
            {sessions?.map((session) => (
              <SelectItem key={session.id} value={session.id}>
                {session.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Contexto del partido, jugadas destacadas, etc."
          rows={3}
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={submitting}
        className="w-full gap-2 bg-goat-lime text-black hover:bg-goat-lime-2 sm:w-auto"
      >
        {submitting ? "Guardando..." : "Guardar partido"}
      </Button>
    </form>
  );
}

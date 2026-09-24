"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, CalendarClock, Gamepad2, Layers3, StickyNote, Swords, Trash2, Zap } from "lucide-react";
import { PlayerAvatar } from "@/components/player-avatar";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFcStore } from "@/hooks/use-fc-store";
import {
  canEditMatch,
  deleteMatch,
  getMatch,
  getPlayer,
  getRules,
  getSession,
} from "@/lib/services/fc-service";
import { formatDateTime } from "@/lib/format";
import { MATCH_MODE_LABELS, getMatchResults, isKnockout } from "@/types";

export function MatchDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: match, ready } = useFcStore(() => getMatch(id));
  const { data: player1 } = useFcStore(() => (match ? getPlayer(match.player1Id) : undefined));
  const { data: player2 } = useFcStore(() => (match ? getPlayer(match.player2Id) : undefined));
  const { data: session } = useFcStore(() => (match?.sessionId ? getSession(match.sessionId) : undefined));
  const rules = getRules();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!ready) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!match || !player1 || !player2) {
    return (
      <EmptyState
        icon={Swords}
        title="Partido no encontrado"
        description="Puede que el enlace sea incorrecto o el partido haya sido eliminado."
        actionLabel="Ver historial"
        actionHref="/history"
      />
    );
  }

  const [result1, result2] = getMatchResults(match, rules);
  const ko = isKnockout(match, rules);

  async function handleDelete() {
    if (!match) return;
    try {
      await deleteMatch(match.id);
      toast.success("Partido eliminado");
      router.push("/history");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el partido.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/history" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        Historial
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        {ko ? (
          <div className="mb-4 flex items-center gap-1.5 text-goat-coral">
            <Zap className="size-4" />
            <span className="text-xs font-bold uppercase tracking-wide">Knockout</span>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <PlayerRow player={player1} points={result1.points} winner={result1.outcome === "win"} align="left" />
          <div className="flex shrink-0 flex-col items-center gap-1">
            <div className="flex items-center gap-3 font-mono text-4xl font-black tabular-nums sm:text-5xl">
              <span className={result1.outcome === "win" ? "text-goat-lime" : ""}>{match.score1}</span>
              <span className="text-muted-foreground">–</span>
              <span className={result2.outcome === "win" ? "text-goat-lime" : ""}>{match.score2}</span>
            </div>
            {match.score1 === match.score2 ? (
              <span className="text-xs font-medium text-muted-foreground">Empate</span>
            ) : null}
          </div>
          <PlayerRow player={player2} points={result2.points} winner={result2.outcome === "win"} align="right" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm">
          <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-muted-foreground">Jugado</p>
            <p className="font-medium">{formatDateTime(match.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm">
          <Gamepad2 className="size-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-muted-foreground">Tipo de partido</p>
            <p className="font-medium">{MATCH_MODE_LABELS[match.mode]}</p>
          </div>
        </div>
        {session ? (
          <Link
            href={`/sessions/${session.id}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm transition-colors hover:border-goat-lime/40"
          >
            <Layers3 className="size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Sesión</p>
              <p className="font-medium">{session.name}</p>
            </div>
          </Link>
        ) : null}
      </div>

      {match.notes ? (
        <div className="flex gap-3 rounded-xl border border-border bg-card p-4 text-sm">
          <StickyNote className="size-4 shrink-0 text-muted-foreground" />
          <p className="text-foreground/80">{match.notes}</p>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        Reglas aplicadas: victoria {rules.winPoints} pts · empate {rules.drawPoints} pt · derrota{" "}
        {rules.lossPoints} pts · K.O. desde {rules.koGoalDifference} goles de diferencia (bonus +
        {rules.koBonusPoints} pts).
      </div>

      <div className="flex justify-end">
        {!canEditMatch(match) ? null : confirmingDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">¿Eliminar este partido?</span>
            <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1.5">
              <Trash2 className="size-3.5" />
              Confirmar
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setConfirmingDelete(true)}>
            <Trash2 className="size-3.5" />
            Eliminar partido
          </Button>
        )}
      </div>
    </div>
  );
}

function PlayerRow({
  player,
  points,
  winner,
  align,
}: {
  player: { name: string; initials: string; color: string };
  points: number;
  winner: boolean;
  align: "left" | "right";
}) {
  return (
    <div className={`flex flex-1 flex-col items-center gap-2 ${align === "left" ? "sm:items-start" : "sm:items-end"}`}>
      <PlayerAvatar player={player} size="lg" />
      <span className="text-center text-sm font-semibold sm:text-base">{player.name}</span>
      <span className={`text-xs font-medium ${winner ? "text-goat-lime" : "text-muted-foreground"}`}>
        +{points} pts
      </span>
    </div>
  );
}

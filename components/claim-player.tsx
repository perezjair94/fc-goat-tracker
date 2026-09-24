"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogIn, UserCheck, Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PlayerAvatar } from "@/components/player-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentPlayer } from "@/hooks/use-current-player";
import { useFcStore } from "@/hooks/use-fc-store";
import { claimPlayer, getUnclaimedPlayers } from "@/lib/services/fc-service";

export function ClaimPlayer() {
  const router = useRouter();
  const { ready, account, currentPlayerId } = useCurrentPlayer();
  const { data: players } = useFcStore(getUnclaimedPlayers);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  if (!ready) return <Skeleton className="h-48 w-full rounded-2xl" />;

  if (!account) {
    return (
      <EmptyState
        icon={LogIn}
        title="Inicia sesión primero"
        description="Necesitas una cuenta para elegir tu jugador."
        actionLabel="Iniciar sesión"
        actionHref="/login"
      />
    );
  }

  if (currentPlayerId) {
    return (
      <EmptyState
        icon={UserCheck}
        title="Ya tienes jugador"
        description="Tu cuenta ya está vinculada. Si te equivocaste, pide que lo cambien desde la base de datos."
        actionLabel="Ir al dashboard"
        actionHref="/"
      />
    );
  }

  if (!players || players.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No quedan jugadores libres"
        description="Todos los jugadores ya tienen dueño. Pide que te agreguen al grupo."
      />
    );
  }

  async function handleClaim(playerId: string) {
    setClaimingId(playerId);
    try {
      const player = await claimPlayer(playerId);
      toast.success(`Ahora eres ${player.name}`);
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo elegir el jugador.");
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {players.map((player) => (
        <button
          key={player.id}
          type="button"
          disabled={claimingId !== null}
          onClick={() => handleClaim(player.id)}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-goat-lime/40 disabled:opacity-60"
        >
          <PlayerAvatar player={player} />
          <span className="flex flex-col">
            <span className="font-semibold">{player.name}</span>
            <span className="text-xs text-muted-foreground">
              {claimingId === player.id ? "Vinculando..." : player.handle}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

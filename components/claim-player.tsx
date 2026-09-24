"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogIn, UserCheck } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PlayerPicker, isChoiceComplete } from "@/components/player-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentPlayer } from "@/hooks/use-current-player";
import { linkPlayer, type PlayerChoice } from "@/lib/services/fc-service";

export function ClaimPlayer() {
  const router = useRouter();
  const { ready, account, currentPlayerId } = useCurrentPlayer();
  const [choice, setChoice] = useState<PlayerChoice | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isChoiceComplete(choice)) {
      toast.error("Elige tu jugador o escribe tu nombre si eres nuevo.");
      return;
    }
    setSubmitting(true);
    try {
      const player = await linkPlayer(choice);
      toast.success(`Ahora eres ${player.name}`);
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo vincular el jugador.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <PlayerPicker value={choice} onChange={setChoice} disabled={submitting} />
          <Button
            type="submit"
            disabled={submitting || !isChoiceComplete(choice)}
            className="w-full bg-goat-lime text-black hover:bg-goat-lime-2 sm:w-auto sm:self-end"
          >
            {submitting ? "Vinculando..." : "Confirmar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

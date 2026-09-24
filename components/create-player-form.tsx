"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogIn, UserCheck } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { NewPlayerFields, suggestColor, type NewPlayerValue } from "@/components/new-player-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentPlayer } from "@/hooks/use-current-player";
import { useFcStore } from "@/hooks/use-fc-store";
import { createOwnPlayer, getPlayers } from "@/lib/services/fc-service";

/** Para cuentas que quedaron sin jugador: crea el suyo, sin elegir de una lista. */
export function CreatePlayerForm() {
  const router = useRouter();
  const { ready, account, currentPlayerId } = useCurrentPlayer();
  const { data: players } = useFcStore(getPlayers);
  const [value, setValue] = useState<NewPlayerValue>({ name: "", color: "" });
  const [submitting, setSubmitting] = useState(false);

  if (!ready) return <Skeleton className="h-48 w-full rounded-2xl" />;

  if (!account) {
    return (
      <EmptyState
        icon={LogIn}
        title="Inicia sesión primero"
        description="Tu jugador se crea cuando te registras."
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
        description="Cada cuenta tiene un solo jugador."
        actionLabel="Ir al dashboard"
        actionHref="/"
      />
    );
  }

  const fields = { ...value, color: value.color || suggestColor(players?.map((p) => p.color) ?? []) };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fields.name.trim()) {
      toast.error("Escribe tu nombre de jugador.");
      return;
    }
    setSubmitting(true);
    try {
      const player = await createOwnPlayer(fields);
      toast.success(`Bienvenido, ${player.name}`);
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el jugador.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <NewPlayerFields value={fields} onChange={setValue} disabled={submitting} />
          <Button
            type="submit"
            disabled={submitting || !fields.name.trim()}
            className="w-full bg-goat-lime text-black hover:bg-goat-lime-2"
          >
            {submitting ? "Creando..." : "Crear mi jugador"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

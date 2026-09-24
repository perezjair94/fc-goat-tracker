"use client";

import type { ReactNode } from "react";
import { LogIn, UserRoundPlus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useCurrentPlayer } from "@/hooks/use-current-player";

/** Muestra `children` solo si hay sesión con jugador vinculado. */
export function RequirePlayer({ children, action }: { children: ReactNode; action: string }) {
  const { ready, account, currentPlayerId } = useCurrentPlayer();

  if (!ready) return null;

  if (!account) {
    return (
      <EmptyState
        icon={LogIn}
        title="Inicia sesión"
        description={`Necesitas una cuenta del grupo para ${action}.`}
        actionLabel="Iniciar sesión"
        actionHref="/login"
      />
    );
  }

  if (!currentPlayerId) {
    return (
      <EmptyState
        icon={UserRoundPlus}
        title="Crea tu jugador"
        description={`Tu cuenta todavía no tiene jugador. Créalo para ${action}.`}
        actionLabel="Crear jugador"
        actionHref="/onboarding"
      />
    );
  }

  return children;
}

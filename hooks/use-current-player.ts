"use client";

import { useFcStore } from "@/hooks/use-fc-store";
import { getAccount } from "@/lib/services/fc-service";

/**
 * Cuenta con sesión iniciada y su jugador vinculado. `currentPlayerId` es
 * null si no hay sesión o si la cuenta todavía no eligió jugador.
 */
export function useCurrentPlayer() {
  const { data: account, ready } = useFcStore(getAccount);
  return {
    ready,
    account: account ?? null,
    currentPlayerId: account?.playerId ?? null,
  };
}

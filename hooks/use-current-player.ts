"use client";

import { useCallback, useSyncExternalStore } from "react";
import { FC_STORE_EVENT, getActivePlayers } from "@/lib/services/fc-service";

const CURRENT_PLAYER_KEY = "fc-goat-current-player";
const CURRENT_PLAYER_EVENT = "fc-goat:current-player";

/**
 * Sin autenticación todavía, cada navegador recuerda "quién soy" localmente
 * para no depender de un `createdBy` fijo. Es un puente hasta que exista
 * Supabase Auth: la UI nunca debe volver a hardcodear un jugador.
 */
function subscribe(callback: () => void) {
  window.addEventListener(CURRENT_PLAYER_EVENT, callback);
  window.addEventListener(FC_STORE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CURRENT_PLAYER_EVENT, callback);
    window.removeEventListener(FC_STORE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): string | null {
  const stored = window.localStorage.getItem(CURRENT_PLAYER_KEY);
  const players = getActivePlayers();
  if (stored && players.some((p) => p.id === stored)) return stored;
  return players[0]?.id ?? null;
}

function getServerSnapshot(): string | null {
  return null;
}

export function useCurrentPlayer() {
  const currentPlayerId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setCurrentPlayerId = useCallback((id: string) => {
    window.localStorage.setItem(CURRENT_PLAYER_KEY, id);
    window.dispatchEvent(new Event(CURRENT_PLAYER_EVENT));
  }, []);

  return { currentPlayerId, setCurrentPlayerId };
}

"use client";

import { useSyncExternalStore } from "react";
import { FC_STORE_EVENT, isLoaded, loadState } from "@/lib/services/fc-service";

/**
 * Los datos de dominio viven en una instantánea en memoria que el servicio
 * carga desde Supabase. `version` sube cada vez que esa instantánea cambia
 * (carga inicial, escritura propia o recarga al volver a la pestaña), y es
 * lo que observa `useSyncExternalStore`. Mientras no haya datos la
 * instantánea es -1, igual que en el servidor, así que la hidratación no
 * produce mismatch y los componentes muestran su estado de carga.
 */
let version = 0;
let loadError: string | null = null;

function refresh() {
  loadState().then(
    () => {
      loadError = null;
    },
    (error: unknown) => {
      loadError = error instanceof Error ? error.message : "No se pudieron cargar los datos.";
      console.error("[fc-store]", error);
      window.dispatchEvent(new Event(FC_STORE_EVENT));
    }
  );
}

function subscribe(callback: () => void) {
  const handleChange = () => {
    version += 1;
    callback();
  };
  // Otros jugadores pueden haber registrado partidos mientras la pestaña
  // estaba en segundo plano.
  const handleVisible = () => {
    if (document.visibilityState === "visible") refresh();
  };

  window.addEventListener(FC_STORE_EVENT, handleChange);
  document.addEventListener("visibilitychange", handleVisible);
  if (!isLoaded()) refresh();

  return () => {
    window.removeEventListener(FC_STORE_EVENT, handleChange);
    document.removeEventListener("visibilitychange", handleVisible);
  };
}

/** -1: cargando, -2: falló la carga, >= 0: datos listos. */
function getSnapshot() {
  if (isLoaded()) return version;
  return loadError ? -2 : -1;
}

function getServerSnapshot() {
  return -1;
}

export function useFcStore<T>(select: () => T): {
  data: T | undefined;
  ready: boolean;
  error: string | null;
} {
  const storeVersion = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = storeVersion >= 0;
  const data = ready ? select() : undefined;

  return { data, ready, error: storeVersion === -2 ? loadError : null };
}

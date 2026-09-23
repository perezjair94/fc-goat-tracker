"use client";

import { useSyncExternalStore } from "react";
import { FC_STORE_EVENT } from "@/lib/services/fc-service";

/**
 * Los datos de dominio viven en `localStorage`, que es un store externo a
 * React. `version` es la instantánea mínima que expone ese store: un número
 * que sube cada vez que el servicio escribe (misma pestaña vía evento
 * custom, otras pestañas vía `storage`). `useSyncExternalStore` usa
 * `getServerSnapshot` durante la hidratación para no producir un mismatch
 * con el render del servidor, y cambia a `getSnapshot` justo después.
 */
let version = 0;

function subscribe(callback: () => void) {
  const handleChange = () => {
    version += 1;
    callback();
  };
  window.addEventListener(FC_STORE_EVENT, handleChange);
  window.addEventListener("storage", handleChange);
  return () => {
    window.removeEventListener(FC_STORE_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

function getSnapshot() {
  return version;
}

function getServerSnapshot() {
  return -1;
}

export function useFcStore<T>(select: () => T): { data: T | undefined; ready: boolean } {
  const storeVersion = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = storeVersion !== -1;
  const data = ready ? select() : undefined;

  return { data, ready };
}

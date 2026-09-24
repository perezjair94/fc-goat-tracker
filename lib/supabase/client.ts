import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente del navegador con la clave publicable. Guarda la sesión en
 * cookies para que el servidor (Server Actions, proxy) la vea también.
 * `createBrowserClient` ya devuelve siempre la misma instancia.
 */
export function getBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }
  return createBrowserClient(url, key);
}

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con la service role key: ignora RLS. Solo se usa en el servidor
 * (Server Actions). Nunca debe importarse desde un componente cliente.
 */
let client: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }

  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

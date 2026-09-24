import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Cliente de servidor con la sesión del usuario (cookies). Las consultas
 * corren como `authenticated` o `anon`, así que RLS decide qué se permite.
 * Hay que crear uno por petición.
 */
export async function getServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Desde un Server Component no se pueden escribir cookies; el
          // proxy se encarga de refrescar la sesión en cada petición.
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {}
        },
      },
    }
  );
}

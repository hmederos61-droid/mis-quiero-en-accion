import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Cliente Supabase para Server Components / Route Handlers (Next App Router).
 * Exportamos:
 * - createServerSupabaseClient (nombre “viejo” que ya tenías)
 * - createSupabaseServerClient (alias requerido por tus routes actuales)
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // En ciertos contextos (p.ej. Server Components) no se pueden setear cookies.
            // En Route Handlers generalmente sí.
          }
        },
      },
    }
  );
}

/**
 * ✅ Alias para compatibilidad con los imports actuales:
 * import { createSupabaseServerClient } from "@/lib/supabase/server"
 */
export const createSupabaseServerClient = createServerSupabaseClient;

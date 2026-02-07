import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Cliente Supabase para Server Components / Route Handlers (Next App Router).
 * Exportamos:
 * - createServerSupabaseClient (nombre “viejo” que ya tenías)
 * - createSupabaseServerClient (alias requerido por tus routes actuales)
 *
 * NOTA TÉCNICA (Next 16 / App Router):
 * cookies() devuelve Promise<ReadonlyRequestCookies>, por eso
 * getAll/setAll se implementan async y hacen await cookies().
 * Así evitamos cambiar a async la función factory y no rompemos call-sites.
 */
export function createServerSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          const cookieStore = await cookies();
          return cookieStore.getAll();
        },
        async setAll(cookiesToSet) {
          try {
            const cookieStore = await cookies();
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

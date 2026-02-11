// Edge Function CANÓNICA
// create-coachee-auth-and-role
//
// RESPONSABILIDAD ÚNICA:
// - Garantizar que un COACHEE tenga:
//   1) auth.users
//   2) app_users
//   3) user_roles = 'coachee'
//
// NO:
// - No envía mails
// - No crea sesiones
// - No toca passwords
// - No marca tokens
//
// Se ejecuta DESDE:
// - Alta de Coachee (Guardar)
// - Antes del envío de mail
//
// Idempotente: puede llamarse múltiples veces sin romper datos

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* =========================
   ✅ CORS (CANÓNICO)
   - Permitir producción con y sin www
   - Responder OPTIONS (preflight)
========================= */

function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";

  // ✅ Permitimos ambos orígenes de producción
  const allowedOrigins = new Set([
    "https://misquieroenaccion.com",
    "https://www.misquieroenaccion.com",
  ]);

  // Si viene un Origin permitido, lo devolvemos. Si no, devolvemos el principal.
  const allowOrigin = allowedOrigins.has(origin)
    ? origin
    : "https://misquieroenaccion.com";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  };
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  // ✅ Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ ok: false, error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ ok: false, error: "Email requerido" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const normalizedEmail = email.trim().toLowerCase();

    /* ======================================================
       1. BUSCAR / CREAR auth.users
    ====================================================== */

    let authUserId: string | null = null;

    const { data: users, error: listErr } = await supabase.auth.admin.listUsers();

    if (listErr) {
      throw new Error("No se pudo listar auth.users");
    }

    const existingUser = users.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (existingUser) {
      authUserId = existingUser.id;
    } else {
      const { data: created, error: createErr } =
        await supabase.auth.admin.createUser({
          email: normalizedEmail,
          email_confirm: true,
        });

      if (createErr || !created.user) {
        throw new Error("No se pudo crear auth user");
      }

      authUserId = created.user.id;
    }

    /* ======================================================
       2. UPSERT app_users
    ====================================================== */

    const { error: appUserErr } = await supabase
      .from("app_users")
      .upsert(
        {
          auth_user_id: authUserId,
          email: normalizedEmail,
        },
        { onConflict: "auth_user_id" }
      );

    if (appUserErr) {
      throw new Error("No se pudo upsert app_users");
    }

    /* ======================================================
       3. UPSERT user_roles (coachee)
    ====================================================== */

    const { error: roleErr } = await supabase
      .from("user_roles")
      .upsert(
        {
          auth_user_id: authUserId,
          role: "coachee",
        },
        { onConflict: "auth_user_id,role" }
      );

    if (roleErr) {
      throw new Error("Failed to upsert role coachee");
    }

    /* ======================================================
       OK
    ====================================================== */

    return new Response(
      JSON.stringify({
        ok: true,
        auth_user_id: authUserId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Edge Function error",
        details: String(e),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

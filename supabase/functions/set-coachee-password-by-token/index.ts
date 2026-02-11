// supabase/functions/set-coachee-password-by-token/index.ts
// CANÓNICO: setea password del coachee por token y marca used_at SOLO si el password fue seteado OK.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigins = new Set([
    "https://misquieroenaccion.com",
    "https://www.misquieroenaccion.com",
  ]);
  const allowOrigin = allowedOrigins.has(origin)
    ? origin
    : "https://misquieroenaccion.com";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  };
}

type Payload = {
  token: string;
  password: string;
};

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

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

    const body = (await req.json()) as Partial<Payload>;
    const token = (body.token || "").trim();
    const password = body.password || "";

    if (!token) {
      return new Response(
        JSON.stringify({ ok: false, error: "Token requerido" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Password inválida (mínimo 6 caracteres)",
        }),
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

    // 1) Buscar invitación por token
    const { data: inv, error: invErr } = await supabase
      .from("coachee_invitations")
      .select("id, coachee_id, used_at, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (invErr) throw new Error(`DB error invitación: ${invErr.message}`);
    if (!inv) {
      return new Response(
        JSON.stringify({ ok: false, status: "invalid", error: "Link inválido" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2) Validar usado
    if (inv.used_at) {
      // CANÓNICO: si está usado, el frontend debe redirigir a /login
      return new Response(
        JSON.stringify({ ok: false, status: "used", error: "Link utilizado" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3) Validar vencido
    if (inv.expires_at) {
      const exp = new Date(inv.expires_at as unknown as string).getTime();
      if (Number.isFinite(exp) && Date.now() > exp) {
        return new Response(
          JSON.stringify({ ok: false, status: "expired", error: "Link vencido" }),
          {
            status: 410,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // 4) Obtener auth_user_id del coachee
    const { data: coachee, error: cErr } = await supabase
      .from("coachees")
      .select("auth_user_id, email")
      .eq("id", inv.coachee_id)
      .maybeSingle();

    if (cErr) throw new Error(`DB error coachee: ${cErr.message}`);
    const authUserId = coachee?.auth_user_id as string | null;

    if (!authUserId) {
      throw new Error("Coachee sin auth_user_id (estado inválido)");
    }

    // 5) Setear password en auth.users
    const { error: upErr } = await supabase.auth.admin.updateUserById(authUserId, {
      password,
    });

    if (upErr) {
      throw new Error(`No se pudo setear password: ${upErr.message}`);
    }

    // 6) Marcar used_at SOLO después de setear password OK
    const { error: usedErr } = await supabase
      .from("coachee_invitations")
      .update({ used_at: new Date().toISOString() })
      .eq("id", inv.id)
      .is("used_at", null);

    if (usedErr) throw new Error(`No se pudo marcar used_at: ${usedErr.message}`);

    return new Response(
      JSON.stringify({ ok: true, status: "ok", auth_user_id: authUserId }),
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

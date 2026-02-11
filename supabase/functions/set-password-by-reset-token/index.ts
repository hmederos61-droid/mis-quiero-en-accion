// supabase/functions/set-password-by-reset-token/index.ts
// CANÓNICO: setear password por token propio (password_resets) + marcar used_at.
// IMPORTANTE: responde SIEMPRE HTTP 200 y usa status en body.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
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
    "Content-Type": "application/json",
  };
}

type Payload = { token: string; password: string };

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const ok200 = (body: any) =>
    new Response(JSON.stringify(body), { status: 200, headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return ok200({ ok: false, status: "invalid" });
    }

    const { token, password } = (await req.json()) as Partial<Payload>;
    const t = String(token || "").trim();
    const p = String(password || "").trim();

    if (!t) return ok200({ ok: false, status: "invalid" });
    if (!p || p.length < 6) {
      return ok200({ ok: false, status: "invalid", error: "Password inválida (min 6)" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: row, error: rowErr } = await supabase
      .from("password_resets")
      .select("id, auth_user_id, used_at, expires_at")
      .eq("token", t)
      .maybeSingle();

    if (rowErr || !row) return ok200({ ok: false, status: "invalid" });

    if (row.used_at) return ok200({ ok: false, status: "used" });

    if (row.expires_at) {
      const exp = new Date(String(row.expires_at)).getTime();
      if (Number.isFinite(exp) && Date.now() > exp) {
        return ok200({ ok: false, status: "expired" });
      }
    }

    const authUserId = String(row.auth_user_id);

    const { error: upErr } = await supabase.auth.admin.updateUserById(authUserId, {
      password: p,
    });

    if (upErr) return ok200({ ok: false, status: "invalid", error: "No se pudo setear password" });

    const { error: usedErr } = await supabase
      .from("password_resets")
      .update({ used_at: new Date().toISOString() })
      .eq("id", row.id)
      .is("used_at", null);

    if (usedErr) return ok200({ ok: false, status: "invalid", error: "No se pudo marcar used_at" });

    return ok200({ ok: true, status: "ok" });
  } catch {
    return new Response(JSON.stringify({ ok: false, status: "invalid" }), {
      status: 200,
      headers: buildCorsHeaders(req),
    });
  }
});

// supabase/functions/send-password-reset/index.ts
// CANÓNICO: Recovery propio (token propio) + mail por Resend.
// Respuesta SIEMPRE neutra { ok: true } (no revela existencia).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2";

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

type Payload = { email: string };

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const neutralOk = () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: corsHeaders,
    });

  try {
    if (req.method !== "POST") return neutralOk();

    const { email } = (await req.json()) as Partial<Payload>;
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized) return neutralOk();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Buscar usuario por email (sin listar todos)
    const { data: userData, error: userErr } =
      await supabase.auth.admin.getUserByEmail(normalized);

    if (userErr || !userData?.user?.id) {
      return neutralOk();
    }

    const authUserId = userData.user.id;

    // Token seguro: sha256(random + timestamp + email)
    const rand = crypto.getRandomValues(new Uint8Array(32));
    const randHex = Array.from(rand)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const raw = `${randHex}:${Date.now()}:${normalized}`;
    const enc = new TextEncoder().encode(raw);
    const digest = await crypto.subtle.digest("SHA-256", enc);
    const token = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 60 min

    const { error: insErr } = await supabase.from("password_resets").insert({
      auth_user_id: authUserId,
      email: normalized,
      token,
      expires_at: expiresAt,
    });

    if (insErr) return neutralOk();

    const link = `https://misquieroenaccion.com/reset-password?token=${token}`;

    const resend = new Resend(resendKey);

    await resend.emails.send({
      from: "Mis Quiero en Acción <no-reply@misquieroenaccion.com>",
      to: normalized,
      subject: "Recuperación de clave – Mis Quiero en Acción",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2>Recuperación de clave</h2>
          <p>Hacé click en el siguiente botón para definir una nueva clave.</p>
          <p>
            <a href="${link}"
               style="display:inline-block;padding:12px 18px;border-radius:10px;background:#6b4cff;color:#fff;text-decoration:none">
              Cambiar clave
            </a>
          </p>
          <p>Si no solicitaste esto, ignorá este correo.</p>
        </div>
      `,
    });

    return neutralOk();
  } catch {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: buildCorsHeaders(req),
    });
  }
});

// supabase/functions/create-coachee-auth-and-role/index.ts
// Edge Function: crea (o reutiliza) un usuario Auth sin password,
// crea/asegura la identidad en public.app_users,
// y asegura role='coachee' en public.user_roles.
// Devuelve: { ok: true, auth_user_id: string }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

async function findUserIdByEmail(
  supabaseAdmin: ReturnType<typeof createClient>,
  emailLower: string,
): Promise<string | null> {
  const perPage = 1000;

  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;

    const users = data?.users ?? [];
    const found = users.find((u) => (u.email ?? "").toLowerCase() === emailLower);
    if (found?.id) return found.id;

    if (users.length < perPage) break;
  }

  return null;
}

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return json({ ok: false, error: "Use POST." }, 405);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return json(
        { ok: false, error: "Missing env vars SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY." },
        500,
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const payload = await req.json().catch(() => ({}));
    const emailRaw = (payload?.email ?? "").toString().trim();
    const emailLower = emailRaw.toLowerCase();

    if (!emailRaw || !emailRaw.includes("@")) {
      return json({ ok: false, error: "Invalid email. Provide { email }." }, 400);
    }

    // 1) Crear Auth user sin password (si ya existe, reutiliza)
    let authUserId: string | null = null;

    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: emailRaw,
        email_confirm: false,
      });

    if (createErr) {
      const existingId = await findUserIdByEmail(supabaseAdmin, emailLower);
      if (!existingId) {
        return json(
          {
            ok: false,
            error: "Auth create failed and existing user not found by email.",
            details: createErr.message,
          },
          500,
        );
      }
      authUserId = existingId;
    } else {
      authUserId = created.user?.id ?? null;
    }

    if (!authUserId) {
      return json({ ok: false, error: "Could not resolve auth_user_id." }, 500);
    }

    // 2) Asegurar identidad en public.app_users (obligatorio por FK en user_roles)
    //    Usamos upsert para que sea idempotente.
    const { error: appUserErr } = await supabaseAdmin
      .from("app_users")
      .upsert([{ auth_user_id: authUserId }], { onConflict: "auth_user_id" });

    if (appUserErr) {
      return json(
        {
          ok: false,
          error: "Failed to upsert into public.app_users.",
          details: appUserErr.message,
          auth_user_id: authUserId,
        },
        500,
      );
    }

    // 3) Asegurar rol coachee (idempotente)
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert([{ auth_user_id: authUserId, role: "coachee" }], {
        onConflict: "auth_user_id,role",
      });

    if (roleErr) {
      return json(
        {
          ok: false,
          error: "Failed to upsert role coachee.",
          details: roleErr.message,
          auth_user_id: authUserId,
        },
        500,
      );
    }

    return json({ ok: true, auth_user_id: authUserId }, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ ok: false, error: "Unhandled error", details: msg }, 500);
  }
});

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type RegisterLoginEventParams = {
  source?: string;
  pathname?: string;
};

export async function registerLoginEventOnce({
  source = "web",
  pathname,
}: RegisterLoginEventParams = {}) {
  try {
    const storageKey = "mqa_login_event_last_user";
    const tsKey = "mqa_login_event_last_ts";

    const supabase = createSupabaseBrowserClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      return {
        ok: false,
        skipped: true,
        reason: "NO_USER",
      };
    }

    const lastUser = window.sessionStorage.getItem(storageKey);
    const lastTs = window.sessionStorage.getItem(tsKey);

    // blindaje adicional del lado cliente:
    // evita repetir en la misma pestaña para el mismo usuario dentro de 5 min
    if (lastUser === user.id && lastTs) {
      const diff = Date.now() - Number(lastTs);
      const fiveMinutes = 5 * 60 * 1000;

      if (diff < fiveMinutes) {
        return {
          ok: true,
          skipped: true,
          reason: "SESSION_STORAGE_RECENT",
        };
      }
    }

    const { data, error } = await supabase.rpc("register_login_event", {
      p_source: source,
      p_metadata: {
        pathname: pathname ?? window.location.pathname,
        user_agent: navigator.userAgent,
        triggered_at: new Date().toISOString(),
      },
    });

    if (error) {
      console.error("register_login_event error:", error);
      return {
        ok: false,
        skipped: false,
        reason: error.message,
      };
    }

    window.sessionStorage.setItem(storageKey, user.id);
    window.sessionStorage.setItem(tsKey, String(Date.now()));

    return {
      ok: true,
      skipped: false,
      data,
    };
  } catch (err) {
    console.error("registerLoginEventOnce unexpected error:", err);
    return {
      ok: false,
      skipped: false,
      reason: err instanceof Error ? err.message : "UNKNOWN_ERROR",
    };
  }
}
"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   Estética glass — RESET PASSWORD
========================= */
const glassCard: React.CSSProperties = {
  borderRadius: 22,
  padding: 34,
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.16)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  boxShadow: "0 18px 60px rgba(0,0,0,0.23)",
  color: "rgba(255,255,255,0.94)",
  textShadow: "0 1px 2px rgba(0,0,0,0.38)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 18,
  opacity: 0.9,
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.10)",
  color: "rgba(255,255,255,0.96)",
  outline: "none",
  fontSize: 17,
};

const btnBase: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.22)",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 17,
  color: "rgba(255,255,255,0.96)",
  textShadow: "0 1px 2px rgba(0,0,0,0.35)",
};

const btnGuardar: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(30,180,120,0.72), rgba(20,140,95,0.62))",
  border: "1px solid rgba(255,255,255,0.28)",
  boxShadow: "0 18px 70px rgba(0,0,0,0.28)",
};

const btnDisabled: React.CSSProperties = {
  ...btnBase,
  cursor: "not-allowed",
  opacity: 0.48,
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08))",
};

const btnVolver: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(70,120,255,0.55), rgba(40,80,220,0.45))",
};

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [clave1, setClave1] = useState("");
  const [clave2, setClave2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  // 1) Verificar si Supabase ya levantó sesión de recovery desde el link
  useEffect(() => {
    let alive = true;

    async function check() {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setHasSession(Boolean(data.session));
      if (!data.session) {
        setMsg(
          "Link inválido o vencido. Volvé a Login y repetí Olvidé mi clave."
        );
      } else {
        setMsg(null);
      }
    }

    check();
    return () => {
      alive = false;
    };
  }, [supabase]);

  async function onGuardar() {
    setMsg(null);

    const p1 = clave1.trim();
    const p2 = clave2.trim();

    if (p1.length < 6) {
      setMsg("La clave debe tener al menos 6 caracteres.");
      return;
    }
    if (p1 !== p2) {
      setMsg("Las claves no coinciden.");
      return;
    }
    if (!hasSession) {
      setMsg("Link inválido o vencido. Volvé a Login y repetí el proceso.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: p1 });

    if (error) {
      setMsg("No se pudo cambiar la clave. Probá nuevamente.");
      setLoading(false);
      return;
    }

    // Cierre de circuito: logout y volver a login
    await supabase.auth.signOut();
    setLoading(false);
    router.replace("/login");
  }

  function onVolver() {
    router.replace("/login");
  }

  const disabled = loading || !hasSession;

  return (
    <main style={{ minHeight: "100vh", position: "relative" }}>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <section style={{ width: "min(640px, 100%)" }}>
          <div style={glassCard}>
            <h1 style={{ fontSize: 36, margin: 0 }}>Cambiar clave</h1>
            <p style={{ fontSize: 18, marginTop: 10, opacity: 0.95 }}>
              Ingresá tu nueva clave.
            </p>

            {msg && <div style={{ fontSize: 16, marginTop: 12 }}>{msg}</div>}

            <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
              <div>
                <div style={labelStyle}>Nueva clave</div>
                <input
                  style={inputStyle}
                  type="password"
                  value={clave1}
                  onChange={(e) => setClave1(e.target.value)}
                  autoComplete="new-password"
                  disabled={disabled}
                />
              </div>

              <div>
                <div style={labelStyle}>Repetir nueva clave</div>
                <input
                  style={inputStyle}
                  type="password"
                  value={clave2}
                  onChange={(e) => setClave2(e.target.value)}
                  autoComplete="new-password"
                  disabled={disabled}
                />
              </div>

              <button
                type="button"
                onClick={onGuardar}
                style={disabled ? btnDisabled : btnGuardar}
                disabled={disabled}
              >
                Guardar nueva clave
              </button>

              <button
                type="button"
                onClick={onVolver}
                style={btnVolver}
                disabled={loading}
              >
                Volver a Login
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

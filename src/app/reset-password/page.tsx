"use client";

export const dynamic = "force-dynamic";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(180,90,255,0.55), rgba(140,60,220,0.45))",
};

const btnPrimaryDisabled: React.CSSProperties = {
  ...btnBase,
  cursor: "not-allowed",
  opacity: 0.48,
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08))",
};

const btnLogin: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(70,120,255,0.55), rgba(40,80,220,0.45))",
};

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const sp = useSearchParams();

  // ✅ CANÓNICO: token propio (NO code, NO PKCE)
  const token = sp.get("token")?.trim() || "";

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [loading, setLoading] = useState(false);

  const [msg, setMsg] = useState<React.ReactNode>(null);
  const [done, setDone] = useState(false);

  async function onGuardar() {
    setMsg(null);

    const a = p1.trim();
    const b = p2.trim();

    if (!token) {
      setMsg("Link inválido. Pedí uno nuevo desde Login.");
      return;
    }
    if (a.length < 6) {
      setMsg("La clave debe tener al menos 6 caracteres.");
      return;
    }
    if (a !== b) {
      setMsg("Las claves no coinciden.");
      return;
    }

    setLoading(true);

    const { data, error: fnErr } = await supabase.functions.invoke(
      "set-password-by-reset-token",
      {
        body: { token, password: a },
      }
    );

    if (fnErr) {
      setMsg("No se pudo guardar la nueva clave. Pedí un link nuevo.");
      setLoading(false);
      return;
    }

    const status = String((data as any)?.status || "");
    const ok = (data as any)?.ok === true;

    if (ok && status === "ok") {
      setDone(true);
      setMsg("Clave actualizada. Volvé a Login e ingresá con tu nueva clave.");
      setLoading(false);
      return;
    }

    if (status === "used") {
      setMsg("Link ya utilizado. Pedí uno nuevo desde Login.");
      setLoading(false);
      return;
    }

    if (status === "expired") {
      setMsg("Link vencido. Pedí uno nuevo desde Login.");
      setLoading(false);
      return;
    }

    setMsg("Link inválido. Pedí uno nuevo desde Login.");
    setLoading(false);
  }

  function onVolverLogin() {
    router.replace("/login");
  }

  const disableSave = loading || done;

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
        <section style={{ width: "min(980px, 100%)" }}>
          <div style={glassCard}>
            <h1 style={{ fontSize: 38, margin: 0 }}>Cambiar clave</h1>
            <p style={{ fontSize: 18, marginTop: 10, opacity: 0.92 }}>
              Ingresá tu nueva clave.
            </p>

            {msg && <div style={{ fontSize: 16, marginTop: 10 }}>{msg}</div>}

            <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
              <div>
                <div style={labelStyle}>Nueva clave</div>
                <input
                  style={inputStyle}
                  type="password"
                  value={p1}
                  onChange={(e) => setP1(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading || done}
                />
              </div>

              <div>
                <div style={labelStyle}>Repetir nueva clave</div>
                <input
                  style={inputStyle}
                  type="password"
                  value={p2}
                  onChange={(e) => setP2(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading || done}
                />
              </div>

              <button
                type="button"
                onClick={onGuardar}
                disabled={disableSave}
                style={disableSave ? btnPrimaryDisabled : btnPrimary}
              >
                Guardar nueva clave
              </button>

              <button
                type="button"
                onClick={onVolverLogin}
                disabled={loading}
                style={btnLogin}
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

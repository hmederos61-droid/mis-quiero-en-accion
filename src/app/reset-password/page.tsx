"use client";

export const dynamic = "force-dynamic";

import React, { Suspense, useMemo, useState } from "react";
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
  padding: "14px 44px 14px 16px", // espacio para el ojo
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
    "linear-gradient(135deg, rgba(30,180,120,0.65), rgba(20,140,95,0.55))",
};

const btnVolver: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(70,120,255,0.55), rgba(40,80,220,0.45))",
};

const eyeBtn: React.CSSProperties = {
  position: "absolute",
  right: 10,
  top: "50%",
  transform: "translateY(-50%)",
  width: 34,
  height: 34,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.92)",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  userSelect: "none",
};

const MIN_PASSWORD_LEN = 6;

function interpretServerError(raw: unknown): string {
  const s = String(raw || "").toLowerCase();

  // Mensajes explícitos (si el backend los devuelve)
  if (
    s.includes("same password") ||
    s.includes("same as old") ||
    s.includes("previous") ||
    s.includes("no puede repetir") ||
    s.includes("repetir una clave anterior")
  ) {
    return "No podés repetir una clave anterior. Elegí una diferente.";
  }

  if (s.includes("expired") || s.includes("venc")) {
    return "Link vencido. Volvé a Login y repetí Olvidé mi clave.";
  }

  if (s.includes("used") || s.includes("ya fue utilizado") || s.includes("ya usado")) {
    return "Link ya utilizado. Volvé a Login.";
  }

  if (s.includes("invalid") || s.includes("inval")) {
    return "Link inválido. Volvé a Login y repetí Olvidé mi clave.";
  }

  if (s.includes("weak") || s.includes("password")) {
    return `La clave no cumple los requisitos. Usá al menos ${MIN_PASSWORD_LEN} caracteres.`;
  }

  // Fallback
  return "No se pudo cambiar la clave. Probá nuevamente.";
}

function ResetPasswordInner() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const sp = useSearchParams();

  const token = sp.get("token")?.trim() || "";

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onGuardar() {
    setMsg(null);

    if (!token) {
      setMsg("Link inválido. Volvé a Login y repetí Olvidé mi clave.");
      return;
    }

    const a = p1.trim();
    const b = p2.trim();

    if (!a || !b) {
      setMsg("Completá la nueva clave y repetila.");
      return;
    }

    if (a.length < MIN_PASSWORD_LEN) {
      setMsg(`La clave debe tener al menos ${MIN_PASSWORD_LEN} caracteres.`);
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
      setMsg(interpretServerError(fnErr.message || fnErr));
      setLoading(false);
      return;
    }

    const ok = (data as any)?.ok === true;
    if (!ok) {
      const detail = (data as any)?.error || (data as any)?.details || "";
      setMsg(interpretServerError(detail));
      setLoading(false);
      return;
    }

    // éxito
    setMsg("Clave actualizada correctamente. Volvé a Login e ingresá con tu nueva clave.");
    setLoading(false);
  }

  function onVolverLogin() {
    router.replace("/login");
  }

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
            <h1 style={{ fontSize: 42, margin: 0 }}>Cambiar clave</h1>
            <p style={{ fontSize: 18, marginTop: 10, opacity: 0.95 }}>
              Ingresá tu nueva clave.
            </p>

            {msg && <div style={{ fontSize: 16, marginTop: 12 }}>{msg}</div>}

            <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
              <div>
                <div style={labelStyle}>Nueva clave</div>
                <div style={{ position: "relative" }}>
                  <input
                    style={inputStyle}
                    type={show1 ? "text" : "password"}
                    value={p1}
                    onChange={(e) => setP1(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    style={eyeBtn}
                    onClick={() => setShow1((v) => !v)}
                    disabled={loading}
                    aria-label={show1 ? "Ocultar clave" : "Mostrar clave"}
                    title={show1 ? "Ocultar" : "Mostrar"}
                  >
                    {show1 ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div>
                <div style={labelStyle}>Repetir nueva clave</div>
                <div style={{ position: "relative" }}>
                  <input
                    style={inputStyle}
                    type={show2 ? "text" : "password"}
                    value={p2}
                    onChange={(e) => setP2(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    style={eyeBtn}
                    onClick={() => setShow2((v) => !v)}
                    disabled={loading}
                    aria-label={show2 ? "Ocultar clave" : "Mostrar clave"}
                    title={show2 ? "Ocultar" : "Mostrar"}
                  >
                    {show2 ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <button type="button" style={btnGuardar} disabled={loading} onClick={onGuardar}>
                Guardar nueva clave
              </button>

              <button type="button" style={btnVolver} disabled={loading} onClick={onVolverLogin}>
                Volver a Login
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div />}>
      <ResetPasswordInner />
    </Suspense>
  );
}

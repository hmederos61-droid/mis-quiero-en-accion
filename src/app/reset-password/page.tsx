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
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.10)",
  color: "rgba(255,255,255,0.96)",
  outline: "none",
  fontSize: 17,
};

const inputWrap: React.CSSProperties = {
  position: "relative",
  width: "100%",
};

const eyeBtn: React.CSSProperties = {
  position: "absolute",
  right: 10,
  top: "50%",
  transform: "translateY(-50%)",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.10)",
  color: "rgba(255,255,255,0.92)",
  borderRadius: 12,
  padding: "8px 10px",
  cursor: "pointer",
  fontWeight: 700,
  lineHeight: 1,
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

const btnGuardarDisabled: React.CSSProperties = {
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

function ResetPasswordInner() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const sp = useSearchParams();

  // ✅ Token propio (password_resets)
  const token =
    (sp.get("token") || sp.get("t") || sp.get("reset_token") || "").trim();

  // Si quedó algún query viejo de Supabase (otp_expired / access_denied),
  // NO lo usamos para cambiar clave, solo mostramos aviso corto.
  const legacyErr = (sp.get("error") || "").trim();
  const legacyCode = (sp.get("error_code") || "").trim();

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [showP1, setShowP1] = useState(false);
  const [showP2, setShowP2] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const MIN_LEN = 6;

  function onVolverLogin() {
    router.replace("/login");
  }

  function normalizeEdgeErrorText(s: string) {
    const t = (s || "").toLowerCase();
    // Si Supabase devuelve algo tipo: "new password should be different..."
    if (t.includes("different") || t.includes("same") || t.includes("previous")) {
      return "No podés repetir una clave anterior.";
    }
    return "";
  }

  async function onGuardarNuevaClave() {
    setMsg(null);

    // 0) Aviso por query viejo
    if (legacyErr || legacyCode) {
      // No bloqueamos, pero aclaramos que ese link viejo no sirve para este flujo
      // (el usuario puede haber aterrizado con query antiguo).
      // Si además no hay token propio, ahí sí bloqueamos.
    }

    // 1) Validaciones locales
    const a = p1.trim();
    const b = p2.trim();

    if (!token) {
      setMsg("Link inválido o vencido. Volvé a Login y repetí Olvidé mi clave.");
      return;
    }

    if (a.length < MIN_LEN) {
      setMsg(`La clave debe tener al menos ${MIN_LEN} caracteres.`);
      return;
    }

    if (a !== b) {
      setMsg("Las claves no coinciden.");
      return;
    }

    setLoading(true);

    // 2) Edge Function CANÓNICA (HTTP 200 siempre)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(
        "set-password-by-reset-token",
        {
          body: { token, password: a },
        }
      );

      if (fnErr) {
        setMsg("No se pudo cambiar la clave. Probá nuevamente.");
        setLoading(false);
        return;
      }

      const ok = (data as any)?.ok === true;
      const status = String((data as any)?.status || "");
      const errText = String((data as any)?.error || "");

      if (ok && status === "ok") {
        setDone(true);
        setMsg("Se actualizó correctamente tu nueva clave.");
        setLoading(false);
        return;
      }

      // Mensajes por status
      if (status === "used") {
        setMsg("Este link ya fue utilizado. Volvé a Login y repetí Olvidé mi clave.");
        setLoading(false);
        return;
      }

      if (status === "expired") {
        setMsg("Este link venció. Volvé a Login y repetí Olvidé mi clave.");
        setLoading(false);
        return;
      }

      // invalid + error (si viene)
      const normalized = normalizeEdgeErrorText(errText);
      if (normalized) {
        setMsg(normalized);
        setLoading(false);
        return;
      }

      // Si vino un error explícito, lo mostramos (controlado)
      if (errText) {
        // ejemplos: "Password inválida (min 6)" / "No se pudo setear password" / "No se pudo marcar used_at"
        setMsg(errText);
        setLoading(false);
        return;
      }

      setMsg("No se pudo cambiar la clave. Probá nuevamente.");
      setLoading(false);
    } catch {
      setMsg("No se pudo cambiar la clave. Probá nuevamente.");
      setLoading(false);
    }
  }

  const disableGuardar =
    loading || done || !token || p1.trim().length < MIN_LEN || p2.trim().length < MIN_LEN;

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

            {/* Aviso si entró con query legacy de Supabase */}
            {(legacyErr || legacyCode) && (
              <div style={{ fontSize: 16, marginTop: 8, opacity: 0.92 }}>
                Este link anterior de Supabase es inválido o vencido. Usá siempre{" "}
                <b>Olvidé mi clave</b> desde Login para generar un link nuevo.
              </div>
            )}

            {msg && (
              <div style={{ fontSize: 16, marginTop: 12 }}>
                {msg}
              </div>
            )}

            <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
              <div>
                <div style={labelStyle}>Nueva clave</div>

                <div style={inputWrap}>
                  <input
                    style={{ ...inputStyle, paddingRight: 56 }}
                    type={showP1 ? "text" : "password"}
                    value={p1}
                    onChange={(e) => setP1(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading || done}
                  />
                  <button
                    type="button"
                    style={eyeBtn}
                    onClick={() => setShowP1((v) => !v)}
                    disabled={loading || done}
                    aria-label={showP1 ? "Ocultar clave" : "Ver clave"}
                    title={showP1 ? "Ocultar" : "Ver"}
                  >
                    {showP1 ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div>
                <div style={labelStyle}>Repetir nueva clave</div>

                <div style={inputWrap}>
                  <input
                    style={{ ...inputStyle, paddingRight: 56 }}
                    type={showP2 ? "text" : "password"}
                    value={p2}
                    onChange={(e) => setP2(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading || done}
                  />
                  <button
                    type="button"
                    style={eyeBtn}
                    onClick={() => setShowP2((v) => !v)}
                    disabled={loading || done}
                    aria-label={showP2 ? "Ocultar clave" : "Ver clave"}
                    title={showP2 ? "Ocultar" : "Ver"}
                  >
                    {showP2 ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <button
                type="button"
                style={disableGuardar ? btnGuardarDisabled : btnGuardar}
                disabled={disableGuardar}
                onClick={onGuardarNuevaClave}
                title={!token ? "Link inválido o vencido" : undefined}
              >
                Guardar nueva clave
              </button>

              <button type="button" style={btnVolver} onClick={onVolverLogin} disabled={loading}>
                Volver a Login
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   Wrapper: Suspense obligatorio para useSearchParams()
========================================================= */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div />}>
      <ResetPasswordInner />
    </Suspense>
  );
}

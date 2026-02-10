"use client";

export const dynamic = "force-dynamic";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   Estética glass — LOGIN PRIMER INGRESO
   (mismo criterio visual del login canónico)
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

const btnCrearCuenta: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(180,90,255,0.55), rgba(140,60,220,0.45))",
};

const btnCrearCuentaDisabled: React.CSSProperties = {
  ...btnBase,
  cursor: "not-allowed",
  opacity: 0.48,
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08))",
};

const btnAcceder: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(30,180,120,0.72), rgba(20,140,95,0.62))",
  border: "1px solid rgba(255,255,255,0.28)",
  boxShadow: "0 18px 70px rgba(0,0,0,0.28)",
};

const btnAccederDestacado: React.CSSProperties = {
  ...btnAcceder,
  transform: "scale(1.03)",
  boxShadow: "0 22px 85px rgba(0,0,0,0.34)",
  border: "1px solid rgba(255,255,255,0.36)",
};

const btnSalir: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(90,130,255,0.45), rgba(60,90,220,0.35))",
};

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function LoginPrimerIngresoInner() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const sp = useSearchParams();

  const emailFromLink = sp.get("email")?.trim() || "";

  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [msg, setMsg] = useState<React.ReactNode>(null);

  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  // 1) Presentar el mail del coachee en el campo mail
  useEffect(() => {
    if (emailFromLink) setEmail(emailFromLink);
  }, [emailFromLink]);

  // 2) Estado de sesión (para habilitar banner derecho con Acceder/Salir)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
    });
  }, [supabase]);

  // 3) Prefetch para reducir “pantalla fugaz” al ir a /quieros
  useEffect(() => {
    if (hasSession) router.prefetch("/quieros");
  }, [hasSession, router]);

  async function onCrearCuenta() {
    setMsg(null);

    const e = email.trim();
    const p = clave.trim();

    if (!isEmailValid(e) || p.length < 6) {
      setMsg("Completá un email válido y una clave de al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: e,
      password: p,
    });

    if (error) {
      setMsg("No se pudo crear la cuenta. Revisá el email o probá otra clave.");
      setLoading(false);
      return;
    }

    // Refrescar sesión (en prod: Confirm email desactivado)
    const { data } = await supabase.auth.getSession();
    const okSession = Boolean(data.session);
    setHasSession(okSession);

    // 2) Mensaje post-creación (canónico)
    setMsg("Cuenta creada. Ahora hacé un click en Acceder.");

    setLoading(false);
  }

  function onAcceder() {
    // Canon: ir directo a Quieros (sin pasar por menu.tsx)
    // replace reduce el “flash”
    router.replace("/quieros");
  }

  async function onSalir() {
    setLoading(true);
    await supabase.auth.signOut();
    setHasSession(false);
    setClave("");
    setMsg(null);
    setLoading(false);
  }

  const disableCrearCuenta = loading || hasSession;

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
        <section
          style={{
            width: "min(1180px, 100%)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 96,
            alignItems: "stretch",
          }}
        >
          {/* IZQUIERDA */}
          <div style={glassCard}>
            <h1 style={{ fontSize: 42, margin: 0 }}>Mis Quiero en Acción</h1>

            <p style={{ fontSize: 20, marginTop: 10 }}>
              Bienvenido, solo te resta que ingreses una clave, porque tu
              dirección de mail ya te la estás viendo.
            </p>

            {msg && <div style={{ fontSize: 16, marginTop: 12 }}>{msg}</div>}

            <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
              <div>
                <div style={labelStyle}>Email</div>
                <input
                  style={inputStyle}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                />
              </div>

              <div>
                <div style={labelStyle}>Clave</div>
                <input
                  style={inputStyle}
                  type="password"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              {/* 1) Grisado/disabled cuando ya hay sesión */}
              <button
                type="button"
                style={disableCrearCuenta ? btnCrearCuentaDisabled : btnCrearCuenta}
                disabled={disableCrearCuenta}
                onClick={onCrearCuenta}
                title={hasSession ? "Cuenta ya creada. Usá el botón Acceder." : undefined}
              >
                Crear cuenta
              </button>
            </div>
          </div>

          {/* DERECHA (Banner) */}
          <div
            style={{
              ...glassCard,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              padding: 34,
            }}
          >
            {!hasSession ? (
              <div style={{ fontSize: 34, lineHeight: 1.25 }}>
                Vamos, estás a un paso de acceder a una nueva posibilidad de
                cambio…!!!
              </div>
            ) : (
              <>
                <div style={{ fontSize: 30, lineHeight: 1.25 }}>
                  Genial, un primer paso ya logrado… vamos por establecer esos
                  Quiero… empecemos con la acción…!!!!!!!
                </div>

                <div
                  style={{
                    width: "100%",
                    marginTop: 22,
                    display: "grid",
                    gap: 12,
                  }}
                >
                  {/* 3) Acceder destacado */}
                  <button
                    onClick={onAcceder}
                    disabled={loading}
                    style={btnAccederDestacado}
                  >
                    Acceder
                  </button>

                  <button onClick={onSalir} disabled={loading} style={btnSalir}>
                    Salir
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   Wrapper: Suspense obligatorio para useSearchParams()
========================================================= */
export default function LoginPrimerIngresoPage() {
  return (
    <Suspense fallback={<div />}>
      <LoginPrimerIngresoInner />
    </Suspense>
  );
}

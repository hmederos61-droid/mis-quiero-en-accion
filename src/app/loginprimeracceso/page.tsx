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

const btnIngresar: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(30,180,120,0.65), rgba(20,140,95,0.55))",
};

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function claveGuidance() {
  return (
    <>
      Ahora solo colocá la clave que deseas utilizar en este ámbito.
      <br />
      Criterios simples: mínimo 6 caracteres (recomendado 8 a 20). Idealmente
      letras y números. Nada complejo.
    </>
  );
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
    });
  }, [supabase]);

  // 1) Presentar el mail del coachee en el campo mail
  useEffect(() => {
    if (emailFromLink) {
      setEmail(emailFromLink);
      setMsg(claveGuidance());
    } else {
      // Si no viene email, igual mostramos la guía
      setMsg(claveGuidance());
    }
  }, [emailFromLink]);

  async function onCrearCuenta() {
    setMsg(null);

    const e = email.trim();
    const p = clave.trim();

    if (!isEmailValid(e) || p.length < 6) {
      setMsg(
        "Completá un email válido y una clave de al menos 6 caracteres (recomendado 8 a 20)."
      );
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

    // Cuenta creada: pedimos ingresar (o si quedó sesión, lo tomará el getSession)
    setMsg("Cuenta creada. Ahora podés ingresar con tu email y clave.");
    setLoading(false);
  }

  async function onIngresar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const eMail = email.trim();
    const p = clave.trim();

    if (!isEmailValid(eMail) || p.length < 6) {
      setMsg(
        "Completá un email válido y una clave de al menos 6 caracteres (recomendado 8 a 20)."
      );
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: eMail,
      password: p,
    });

    if (error) {
      setMsg("Email o clave incorrectos.");
      setHasSession(false);
    } else {
      setHasSession(true);
      setMsg(null);
    }

    setLoading(false);
  }

  function onAcceder() {
    router.push("/menu");
  }

  async function onSalir() {
    setLoading(true);
    await supabase.auth.signOut();
    setHasSession(false);
    setClave("");
    setMsg(claveGuidance());
    setLoading(false);
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
              Primer ingreso: creá tu cuenta con tu mail y una clave.
            </p>

            {msg && <div style={{ fontSize: 16, marginTop: 12 }}>{msg}</div>}

            <form
              style={{ display: "grid", gap: 14, marginTop: 18 }}
              onSubmit={onIngresar}
            >
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

              {/* 3) Primer botón: Crear cuenta */}
              <button
                type="button"
                style={btnCrearCuenta}
                disabled={loading}
                onClick={onCrearCuenta}
              >
                Crear cuenta
              </button>

              {/* Si ya existe cuenta, puede ingresar */}
              <button type="submit" style={btnIngresar} disabled={loading}>
                Ingresar
              </button>
            </form>
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

                <div style={{ width: "100%", marginTop: 22, display: "grid", gap: 12 }}>
                  <button
                    onClick={onAcceder}
                    disabled={loading}
                    style={{
                      ...btnBase,
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.20), rgba(255,255,255,0.12))",
                    }}
                  >
                    Acceder
                  </button>

                  <button
                    onClick={onSalir}
                    disabled={loading}
                    style={{
                      ...btnBase,
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06))",
                    }}
                  >
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

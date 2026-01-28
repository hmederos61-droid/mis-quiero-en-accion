"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   Estética glass ORIGINAL
   (ajustada +10% columnas / gap +50%)
========================= */
const glassCard: React.CSSProperties = {
  borderRadius: 22,
  padding: 46,
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.16)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  boxShadow: "0 18px 60px rgba(0,0,0,0.23)",
  color: "rgba(255,255,255,0.94)",
  textShadow: "0 1px 2px rgba(0,0,0,0.38)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 28,
  opacity: 0.95,
  marginBottom: 10,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "19px 19px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.10)",
  color: "rgba(255,255,255,0.96)",
  outline: "none",
  fontSize: 23,
};

const btnBase: React.CSSProperties = {
  width: "100%",
  padding: "21px 19px",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.22)",
  cursor: "pointer",
  fontWeight: 850,
  fontSize: 25,
  color: "rgba(255,255,255,0.96)",
  textShadow: "0 1px 2px rgba(0,0,0,0.35)",
};

const btnIngresar = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(30,180,120,0.65), rgba(20,140,95,0.55))",
};

const btnOlvide = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(70,120,255,0.55), rgba(40,80,220,0.45))",
};

const btnCambiarMail = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(255,170,60,0.55), rgba(230,140,20,0.45))",
};

const btnCrearCuenta = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(180,90,255,0.55), rgba(140,60,220,0.45))",
};

/* =========================
   Helpers
========================= */
function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function normalizeNextPath(raw: string | null) {
  const fallback = "/quieros/inicio";
  if (!raw) return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (!trimmed.startsWith("/quieros")) return fallback;
  return trimmed;
}

export default function LoginPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  const CARD_MIN_HEIGHT = 647;

  function getNextPath() {
    const params = new URLSearchParams(window.location.search);
    return normalizeNextPath(params.get("next"));
  }

  function cameFromPostLogin() {
    const params = new URLSearchParams(window.location.search);
    return params.get("post") === "1";
  }

  function isValidLogin() {
    return isEmailValid(email) && clave.trim().length >= 6;
  }

  useEffect(() => {
    let isMounted = true;

    async function check() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (error) {
          setHasSession(false);
          setSessionChecked(true);
          return;
        }

        const active = Boolean(data.session);
        setHasSession(active);
        setSessionChecked(true);

        if (active && cameFromPostLogin()) {
          setMsg("Login exitoso. Cuando estés listo, hacé click en “Comenzar”.");
        }
      } catch {
        if (!isMounted) return;
        setHasSession(false);
        setSessionChecked(true);
      }
    }

    check();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const active = Boolean(session);
      setHasSession(active);
      setSessionChecked(true);

      if (active) {
        setMsg("Login exitoso. Cuando estés listo, hacé click en “Comenzar”.");
      }
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function onIngresar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!isValidLogin()) {
      setMsg("Completá tu email y una clave válida (mínimo 6).");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: clave,
      });

      if (error) {
        setMsg("Email o clave incorrectos, o cuenta no confirmada.");
        return;
      }

      setMsg("Login exitoso. Cuando estés listo, hacé click en “Comenzar”.");
    } catch {
      setMsg("Ocurrió un error inesperado. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  async function onCrearCuenta() {
    setMsg(null);

    if (!isEmailValid(email) || clave.trim().length < 6) {
      setMsg("Ingresá un email válido y una clave de al menos 6 caracteres.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: clave,
      });

      if (error) {
        setMsg("No se pudo crear la cuenta. Tal vez ya exista.");
        return;
      }

      if (!data.session) {
        setMsg("Cuenta creada. Revisá tu email para confirmar.");
        return;
      }

      setMsg("Cuenta creada y login exitoso. Hacé click en “Comenzar”.");
    } catch {
      setMsg("Error inesperado al crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  async function onOlvideClave() {
    setMsg(null);

    if (!isEmailValid(email)) {
      setMsg("Para recuperar tu clave, ingresá tu email primero.");
      return;
    }

    try {
      setLoading(true);

      const redirectTo = `${window.location.origin}/reset`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        setMsg("No pudimos enviar el email de recuperación. Intentá nuevamente.");
        return;
      }

      setMsg("Listo. Te enviamos un email para recuperar tu clave. Abrilo y seguí los pasos.");
    } catch {
      setMsg("Ocurrió un error inesperado. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  const showRightPanelContent = sessionChecked && hasSession;

  return (
    <main style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Fondo */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `url("/welcome.png")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Overlay */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: "linear-gradient(rgba(0,0,0,0.03), rgba(0,0,0,0.06))",
        }}
      />

      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <section
          style={{
            width: "min(1500px, 100%)", // ← expansión simétrica hacia bordes externos
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 228, // ← centro intacto
            alignItems: "stretch",
          }}
        >
          {/* IZQUIERDA */}
          <div style={{ ...glassCard, minHeight: CARD_MIN_HEIGHT }}>
            <h1 style={{ fontSize: 61, margin: 0, lineHeight: 1.05 }}>
              Mis Quiero en Acción
            </h1>

            <p style={{ fontSize: 30, lineHeight: 1.35, marginTop: 14, marginBottom: 22 }}>
              Ingreso con mail y clave.
            </p>

            {msg && <div style={{ fontSize: 21, marginBottom: 16, opacity: 0.95 }}>{msg}</div>}

            <form style={{ display: "grid", gap: 19 }} onSubmit={onIngresar}>
              <div>
                <div style={labelStyle}>Email</div>
                <input
                  style={inputStyle}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                />
              </div>

              <div>
                <div style={labelStyle}>Clave</div>
                <input
                  style={inputStyle}
                  type="password"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Clave"
                />
              </div>

              <button type="submit" style={btnIngresar} disabled={loading}>
                {loading ? "Ingresando..." : "Ingresar"}
              </button>

              <div style={{ display: "grid", gap: 15 }}>
                <button type="button" style={btnOlvide} onClick={onOlvideClave} disabled={loading}>
                  Olvidé mi clave
                </button>

                <button
                  type="button"
                  style={btnCambiarMail}
                  onClick={() => setMsg("Por ahora, podés escribir tu nuevo email y continuar.")}
                  disabled={loading}
                >
                  Cambiar mi email
                </button>

                <button type="button" style={btnCrearCuenta} onClick={onCrearCuenta} disabled={loading}>
                  Crear cuenta
                </button>
              </div>
            </form>
          </div>

          {/* DERECHA */}
          <div
            style={{
              ...glassCard,
              minHeight: CARD_MIN_HEIGHT,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {showRightPanelContent ? (
              <>
                <div>
                  <h2 style={{ fontSize: 44, lineHeight: 1.15, margin: 0 }}>
                    Si ya llegaste hasta acá,
                    <br />
                    estás en el inicio de un
                    <br />
                    nuevo camino.
                  </h2>

                  <p style={{ fontSize: 25, lineHeight: 1.4, marginTop: 16, opacity: 0.96 }}>
                    Vamos: te invito a dar el primer paso.
                  </p>
                </div>

                <div>
                  <button
                    style={{
                      ...btnBase,
                      padding: "21px 19px",
                      fontSize: 25,
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.20), rgba(255,255,255,0.12))",
                    }}
                    type="button"
                    onClick={() => {
                      if (!hasSession) return;
                      window.location.assign(getNextPath());
                    }}
                    disabled={loading || !hasSession}
                  >
                    Comenzar
                  </button>
                </div>
              </>
            ) : (
              <div />
            )}
          </div>
        </section>

        <style jsx>{`
          @media (max-width: 1400px) {
            section {
              width: min(1340px, 100%) !important;
              gap: 134px !important;
            }
          }
          @media (max-width: 980px) {
            section {
              grid-template-columns: 1fr !important;
              gap: 18px !important;
            }
          }
        `}</style>
      </div>
    </main>
  );
}

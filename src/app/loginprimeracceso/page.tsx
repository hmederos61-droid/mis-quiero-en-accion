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

const btnIrLogin: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(70,120,255,0.55), rgba(40,80,220,0.45))",
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
  width: 40,
  height: 40,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.10)",
  color: "rgba(255,255,255,0.92)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

type TokenGate =
  | "checking"
  | "ok"
  | "missing"
  | "invalid"
  | "expired"
  | "used";

function EyeIcon({ off }: { off: boolean }) {
  // SVG simple (sin libs). "off" = ojo tachado.
  return off ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9.88 5.1A11 11 0 0 1 12 5c7 0 10 7 10 7a18.4 18.4 0 0 1-3.02 4.16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.23 6.23A18.6 18.6 0 0 0 2 12s3 7 10 7a11 11 0 0 0 3.11-.44"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function LoginPrimerIngresoInner() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const sp = useSearchParams();

  const token = sp.get("token")?.trim() || "";
  const emailFromLink = sp.get("email")?.trim() || "";

  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [msg, setMsg] = useState<React.ReactNode>(null);

  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  // indica que la clave ya fue creada con éxito (para UX)
  const [passwordCreated, setPasswordCreated] = useState(false);

  // Gating del link (token)
  const [gate, setGate] = useState<TokenGate>("checking");

  // 👁 Mostrar/ocultar clave (unificado con recovery)
  const [showPassword, setShowPassword] = useState(false);

  const PROD_LOGIN_URL = "https://misquieroenaccion.com/login";

  // 1) Presentar el mail del coachee en el campo mail
  useEffect(() => {
    if (emailFromLink) setEmail(emailFromLink);
  }, [emailFromLink]);

  function goToProdLogin() {
    window.location.href = PROD_LOGIN_URL;
  }

  // 2) Estado de sesión
  useEffect(() => {
    let cancel = false;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (cancel) return;

      const sessionExists = Boolean(data.session);
      if (!sessionExists) {
        setHasSession(false);
        return;
      }

      // ✅ CORRECCIÓN CANÓNICA (PUNTO 3):
      // Si el usuario abre el link con una sesión previa (coach/admin en el mismo navegador),
      // eso NO debe bloquear que el coachee ingrese su nueva clave.
      // Entonces: cerramos la sesión previa automáticamente.
      await supabase.auth.signOut();
      if (cancel) return;

      setHasSession(false);
      setMsg(
        <div>
          Se cerró una sesión previa para que puedas activar tu cuenta con este
          link.
        </div>
      );
    }

    checkSession();
    return () => {
      cancel = true;
    };
  }, [supabase]);

  // 3) Prefetch
  useEffect(() => {
    if (hasSession) router.prefetch("/quieros/inicio");
  }, [hasSession, router]);

  // 4) Validación del token (una sola vez por token)
  useEffect(() => {
    let cancel = false;

    async function validateToken() {
      try {
        setMsg(null);

        if (!token) {
          if (!cancel) {
            setGate("missing");
            setMsg(
              <div>
                Link inválido. Para continuar, ingresá en{" "}
                <b>misquieroenaccion.com</b> con tu email y clave.
              </div>
            );
          }
          return;
        }

        const { data, error } = await supabase
          .from("coachee_invitations")
          .select("token, used_at, expires_at")
          .eq("token", token)
          .maybeSingle();

        if (cancel) return;

        if (error || !data) {
          setGate("invalid");
          setMsg(
            <div>
              Link inválido. Para continuar, ingresá en{" "}
              <b>misquieroenaccion.com</b> con tu email y clave.
            </div>
          );
          return;
        }

        const expiresAt = data.expires_at
          ? new Date(String(data.expires_at))
          : null;
        if (expiresAt && Date.now() > expiresAt.getTime()) {
          setGate("expired");
          setMsg(
            <div>
              Este link de acceso venció. Para continuar, contactá a tu coach
              para que te reenvíe un link nuevo.
            </div>
          );
          return;
        }

        if (data.used_at) {
          // CANÓNICO: token ya consumido → ir a login
          setGate("used");
          goToProdLogin();
          return;
        }

        // ✅ CANÓNICO:
        // token válido + used_at NULL → habilitar ingreso de clave SIEMPRE,
        // aunque exista auth.user (y aunque hubiera existido una sesión previa).
        setGate("ok");
      } catch {
        if (!cancel) {
          setGate("invalid");
          setMsg(
            <div>
              Link inválido. Para continuar, ingresá en{" "}
              <b>misquieroenaccion.com</b> con tu email y clave.
            </div>
          );
        }
      }
    }

    validateToken();
    return () => {
      cancel = true;
    };
  }, [supabase, token]);

  async function onCrearCuenta() {
    setMsg(null);
    setPasswordCreated(false);

    if (gate !== "ok") {
      if (gate === "used") {
        goToProdLogin();
        return;
      }
      setMsg(
        <div>
          Este link no es válido. Para continuar, ingresá en{" "}
          <b>misquieroenaccion.com</b> con tu email y clave.
        </div>
      );
      return;
    }

    const e = email.trim();
    const p = clave.trim();

    if (!isEmailValid(e) || p.length < 6) {
      setMsg("Completá un email válido y una clave de al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    // CANÓNICO: el usuario YA existe en Auth (se creó al Guardar coachee).
    // Acá solo se SETEA PASSWORD y se marca used_at (en la Edge Function).
    const { data, error: fnErr } = await supabase.functions.invoke(
      "set-coachee-password-by-token",
      {
        body: {
          token,
          password: p,
        },
      }
    );

    if (fnErr) {
      const st = (data as any)?.status ? String((data as any).status) : "";
      if (st === "used") {
        goToProdLogin();
        return;
      }
      if (st === "expired") {
        setMsg("Este link venció. Contactá a tu coach para reenvío.");
        setLoading(false);
        return;
      }
      setMsg("No se pudo crear la clave. Probá nuevamente.");
      setLoading(false);
      return;
    }

    const status = String((data as any)?.status || "");
    if (status === "used") {
      goToProdLogin();
      return;
    }
    if (status === "expired") {
      setMsg("Este link venció. Contactá a tu coach para reenvío.");
      setLoading(false);
      return;
    }
    if (status === "invalid") {
      setMsg("Link inválido. Ingresá desde producción con tu email y clave.");
      setLoading(false);
      return;
    }

    const ok = (data as any)?.ok === true;
    if (!ok) {
      const detail = (data as any)?.error ? String((data as any).error) : "";
      setMsg(
        detail
          ? `No se pudo crear la clave. ${detail}`
          : "No se pudo crear la clave. Probá nuevamente."
      );
      setLoading(false);
      return;
    }

    // Intentar iniciar sesión con esa clave (para habilitar el panel derecho)
    const { data: signInData, error: signInErr } =
      await supabase.auth.signInWithPassword({
        email: e,
        password: p,
      });

    const okSession = Boolean(signInData.session) && !signInErr;
    setHasSession(okSession);

    setPasswordCreated(true);
    setMsg("Cuenta creada. Ahora hacé un click en Acceder.");

    setLoading(false);
  }

  function onAcceder() {
    router.replace("/quieros/inicio");
  }

  function onIrLogin() {
    goToProdLogin();
  }

  async function onSalir() {
    setLoading(true);
    await supabase.auth.signOut();
    setHasSession(false);
    setPasswordCreated(false);
    setClave("");
    setMsg(null);
    setLoading(false);
  }

  // Si el token está bloqueado y NO hay sesión: pantalla de bloqueo + botón a Login
  const showBlocked =
    !hasSession &&
    (gate === "missing" || gate === "invalid" || gate === "expired" || gate === "used");

  // ✅ CANÓNICO (PUNTO 3):
  // Crear cuenta NO se deshabilita por "hasSession".
  // Si hay sesión, ya la cerramos automáticamente arriba.
  const disableCrearCuenta = loading || gate !== "ok";

  // ✅ CANÓNICO:
  // Inputs se deshabilitan solo si el link está bloqueado o está cargando.
  const disableInputs = showBlocked || loading;

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
              Bienvenido. Ingresá una clave para activar tu cuenta.
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
                  disabled={disableInputs}
                />
              </div>

              <div>
                <div style={labelStyle}>Clave</div>

                <div style={inputWrap}>
                  <input
                    style={{ ...inputStyle, paddingRight: 56 }}
                    type={showPassword ? "text" : "password"}
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    autoComplete="new-password"
                    disabled={disableInputs}
                  />

                  <button
                    type="button"
                    aria-label={showPassword ? "Ocultar clave" : "Mostrar clave"}
                    title={showPassword ? "Ocultar" : "Mostrar"}
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={disableInputs}
                    style={{
                      ...eyeBtn,
                      opacity: disableInputs ? 0.55 : 1,
                      cursor: disableInputs ? "not-allowed" : "pointer",
                    }}
                  >
                    <EyeIcon off={showPassword} />
                  </button>
                </div>
              </div>

              <button
                type="button"
                style={disableCrearCuenta ? btnCrearCuentaDisabled : btnCrearCuenta}
                disabled={disableCrearCuenta}
                onClick={onCrearCuenta}
                title={
                  gate !== "ok"
                    ? "Este link ya no es válido. Ingresá desde el Login."
                    : undefined
                }
              >
                Crear cuenta
              </button>

              {showBlocked && (
                <button
                  type="button"
                  onClick={onIrLogin}
                  disabled={loading}
                  style={btnIrLogin}
                >
                  Ir al Login
                </button>
              )}

              {/* Si la clave fue creada pero no hay sesión, dejamos un botón directo al login */}
              {!hasSession && passwordCreated && !showBlocked && (
                <button
                  type="button"
                  onClick={onIrLogin}
                  disabled={loading}
                  style={btnIrLogin}
                >
                  Ir al Login
                </button>
              )}
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
            {showBlocked ? (
              <>
                <div style={{ fontSize: 28, lineHeight: 1.25 }}>
                  Este link no es válido para crear la clave.
                </div>
                <div
                  style={{
                    fontSize: 18,
                    marginTop: 14,
                    opacity: 0.95,
                    lineHeight: 1.35,
                  }}
                >
                  Para continuar, ingresá en <b>misquieroenaccion.com</b> con tu
                  email y clave.
                </div>

                <div style={{ width: "100%", marginTop: 22 }}>
                  <button
                    type="button"
                    onClick={onIrLogin}
                    disabled={loading}
                    style={btnIrLogin}
                  >
                    Ingresar
                  </button>
                </div>
              </>
            ) : !hasSession ? (
              <div style={{ fontSize: 34, lineHeight: 1.25 }}>
                Vamos, estás a un paso de acceder a una nueva posibilidad de cambio…!!!
              </div>
            ) : (
              <>
                <div style={{ fontSize: 30, lineHeight: 1.25 }}>
                  Genial, un primer paso ya logrado… vamos por establecer esos Quiero… empecemos con la acción…!!!!!!!
                </div>

                <div
                  style={{
                    width: "100%",
                    marginTop: 22,
                    display: "grid",
                    gap: 12,
                  }}
                >
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

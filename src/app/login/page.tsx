"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   Estética glass — LOGIN (criterio correcto)
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

const btnIngresar: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(30,180,120,0.65), rgba(20,140,95,0.55))",
};

const btnOlvide: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(70,120,255,0.55), rgba(40,80,220,0.45))",
};

const btnCambiarMail: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(255,170,60,0.55), rgba(230,140,20,0.45))",
};

const btnCrearCuenta: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(180,90,255,0.55), rgba(140,60,220,0.45))",
};

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Si venimos por invitación:
  // /login?token=...&email=...
  const token = searchParams.get("token")?.trim() || "";
  const emailFromLink = searchParams.get("email")?.trim() || "";
  const isInviteMode = Boolean(token) || Boolean(emailFromLink);

  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
    });
  }, [supabase]);

  // Precargar email si vino por link
  useEffect(() => {
    if (emailFromLink && !email) {
      setEmail(emailFromLink);
    }
    // Mensaje canónico si viene por invitación
    if (isInviteMode) {
      setMsg(
        "Ingresá el mismo email al que te llegó la invitación y definí tu clave. Luego hacé click en “Crear cuenta”."
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailFromLink, isInviteMode]);

  // Estilo "grisado" para botones deshabilitados
  function disabledStyle(base: React.CSSProperties): React.CSSProperties {
    return {
      ...base,
      opacity: 0.35,
      cursor: "not-allowed",
      filter: "grayscale(70%)",
    };
  }

  async function onIngresar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!isEmailValid(email) || clave.trim().length < 6) {
      setMsg("Completá email y clave válida.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: clave,
    });

    if (error) {
      setMsg("Email o clave incorrectos.");
    } else {
      setMsg("Login exitoso. Cuando estés listo, hacé click en “Comenzar”.");
      setHasSession(true);

      // Si venimos por invitación, después de loguear llevamos al link con token
      if (token) {
        setTimeout(() => {
          router.replace(`/acceso/coachee?token=${encodeURIComponent(token)}`);
        }, 450);
      }
    }

    setLoading(false);
  }

  async function onCrearCuenta() {
    setMsg(null);

    const e = email.trim();
    const p = clave;

    if (!isEmailValid(e) || p.trim().length < 6) {
      setMsg("Completá email válido y una clave de al menos 6 caracteres.");
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

    setMsg("Cuenta creada. Continuamos con la activación del acceso...");

    // Canon: si hay token, volvemos al flujo de activación
    if (token) {
      setTimeout(() => {
        router.replace(`/acceso/coachee?token=${encodeURIComponent(token)}`);
      }, 600);
    } else {
      // Si no hay token, queda como alta estándar
      setTimeout(() => {
        router.replace("/menu");
      }, 800);
    }

    setLoading(false);
  }

  function onComenzar() {
    router.push("/menu");
  }

  // Modo invitación: SOLO Crear cuenta habilitado
  const disableIngresar = isInviteMode;
  const disableOlvide = isInviteMode;
  const disableCambiarMail = isInviteMode;

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
              Ingreso con mail y clave.
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
                  readOnly={Boolean(emailFromLink)} // si vino desde invitación, se bloquea
                />
              </div>

              <div>
                <div style={labelStyle}>Clave</div>
                <input
                  style={inputStyle}
                  type="password"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  autoComplete={isInviteMode ? "new-password" : "current-password"}
                />
              </div>

              <button
                type="submit"
                style={disableIngresar ? disabledStyle(btnIngresar) : btnIngresar}
                disabled={loading || disableIngresar}
                title={
                  disableIngresar
                    ? "Para invitación, primero creá la cuenta con el botón “Crear cuenta”."
                    : undefined
                }
              >
                Ingresar
              </button>

              <div style={{ display: "grid", gap: 10 }}>
                <button
                  type="button"
                  style={disableOlvide ? disabledStyle(btnOlvide) : btnOlvide}
                  disabled={disableOlvide}
                >
                  Olvidé mi clave
                </button>

                <button
                  type="button"
                  style={
                    disableCambiarMail
                      ? disabledStyle(btnCambiarMail)
                      : btnCambiarMail
                  }
                  disabled={disableCambiarMail}
                >
                  Cambiar mi email
                </button>

                <button
                  type="button"
                  style={btnCrearCuenta}
                  disabled={loading}
                  onClick={onCrearCuenta}
                >
                  Crear cuenta
                </button>
              </div>
            </form>
          </div>

          {/* DERECHA */}
          <div
            style={{
              ...glassCard,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {hasSession ? (
              <>
                <div>
                  <h2 style={{ fontSize: 32, margin: 0 }}>
                    Si ya llegaste hasta acá,
                    <br />
                    estás en el inicio de un nuevo camino.
                  </h2>
                  <p style={{ fontSize: 18, marginTop: 12 }}>
                    Vamos: te invito a dar el primer paso.
                  </p>
                </div>

                <button
                  onClick={onComenzar}
                  style={{
                    ...btnBase,
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.20), rgba(255,255,255,0.12))",
                  }}
                >
                  Comenzar
                </button>
              </>
            ) : (
              <div />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

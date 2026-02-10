"use client";

export const dynamic = "force-dynamic";

import React, { Suspense, useEffect, useMemo, useState } from "react";
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

/* =========================================================
   Cache mínimo de email para el regreso a /login sin query
========================================================= */
const INV_EMAIL_KEY = "mqa_invite_email_v1";

function readInviteEmail(): string {
  try {
    return (sessionStorage.getItem(INV_EMAIL_KEY) || "").trim();
  } catch {
    return "";
  }
}

function writeInviteEmail(v: string) {
  try {
    const t = (v || "").trim();
    if (t) sessionStorage.setItem(INV_EMAIL_KEY, t);
  } catch {
    // silencio
  }
}

function clearInviteEmail() {
  try {
    sessionStorage.removeItem(INV_EMAIL_KEY);
  } catch {
    // silencio
  }
}

/* =========================================================
   Inner: usa useSearchParams -> DEBE estar dentro de Suspense
========================================================= */
function LoginInner() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token")?.trim() || "";
  const emailFromLink = searchParams.get("email")?.trim() || "";

  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    if (emailFromLink) writeInviteEmail(emailFromLink);

    router.replace(`/acceso/coachee?token=${encodeURIComponent(token)}`);
  }, [token, emailFromLink, router]);

  useEffect(() => {
    if (emailFromLink && !email) {
      setEmail(emailFromLink);
      setMsg(
        "Ingresá el mismo email al que te llegó la invitación. Si ya tenés cuenta, podés ingresar. Si no, creala con “Crear cuenta”."
      );
      return;
    }

    if (!emailFromLink && !email) {
      const cached = readInviteEmail();
      if (cached) {
        setEmail(cached);
        setMsg(
          "Ingresá el mismo email al que te llegó la invitación. Si ya tenés cuenta, podés ingresar. Si no, creala con “Crear cuenta”."
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailFromLink]);

  async function onIngresar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const eMail = email.trim();
    const p = clave.trim();

    if (!isEmailValid(eMail) || p.length < 6) {
      setMsg("Completá email y clave válida.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: eMail,
      password: p,
    });

    if (error) {
      setMsg("Email o clave incorrectos.");
      setLoading(false);
      return;
    }

    clearInviteEmail();
    setMsg(null);

    // ✅ Regla canónica: solo se entra después de click en “Ingresar”
    router.replace("/quieros");
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

    clearInviteEmail();
    setMsg("Cuenta creada. Ahora podés ingresar con tu email y clave.");

    setTimeout(() => {
      router.replace("/login");
    }, 700);

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
                />
              </div>

              <button type="submit" style={btnIngresar} disabled={loading}>
                Ingresar
              </button>

              <div style={{ display: "grid", gap: 10 }}>
                <button type="button" style={btnOlvide} disabled={false}>
                  Olvidé mi clave
                </button>

                <button type="button" style={btnCambiarMail} disabled={false}>
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
            {/* ✅ Sin auto-redirección por sesión.
                La entrada a /quieros se hace SOLO con click en Ingresar. */}
            <div />
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   Wrapper: Suspense obligatorio para useSearchParams()
========================================================= */
export default function LoginPage() {
  return (
    <Suspense fallback={<div />}>
      <LoginInner />
    </Suspense>
  );
}

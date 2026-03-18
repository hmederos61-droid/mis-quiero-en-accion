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
   Hook simple para responsive sin tocar la lógica funcional
========================================================= */
function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [breakpoint]);

  return isMobile;
}

/* =========================================================
   Inner: usa useSearchParams -> DEBE estar dentro de Suspense
========================================================= */
function LoginInner() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const token = searchParams.get("token")?.trim() || "";
  const emailFromLink = searchParams.get("email")?.trim() || "";

  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    if (emailFromLink) writeInviteEmail(emailFromLink);

    router.replace(`/acceso/coachee/carga?token=${encodeURIComponent(token)}`);
  }, [token, emailFromLink, router]);

  useEffect(() => {
    if (emailFromLink && !email) {
      setEmail(emailFromLink);
      setMsg(
        "Ingresá el mismo email al que te llegó la invitación. Si ya tenés cuenta, podés ingresar."
      );
      return;
    }

    if (!emailFromLink && !email) {
      const cached = readInviteEmail();
      if (cached) {
        setEmail(cached);
        setMsg(
          "Ingresá el mismo email al que te llegó la invitación. Si ya tenés cuenta, podés ingresar."
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

    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const user = userRes.user;
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: r1, error: e1 } = await supabase
        .from("user_roles")
        .select("role")
        .eq("auth_user_id", user.id);

      if (e1) throw e1;

      const rs = (Array.isArray(r1) ? r1 : [])
        .map((x: any) => String(x.role || "").toLowerCase())
        .filter(
          (x: string) => x === "admin" || x === "coach" || x === "coachee"
        );

      const unique = Array.from(new Set(rs));
      const hasAdmin = unique.includes("admin");
      const hasCoach = unique.includes("coach");

      if (hasAdmin || hasCoach) {
        router.replace("/menu1");
      } else {
        router.replace("/quieros/inicio");
      }
      return;
    } catch {
      router.replace("/quieros/inicio");
      return;
    }
  }

  async function onOlvideClave() {
    setMsg(null);

    const eMail = email.trim();
    if (!isEmailValid(eMail)) {
      setMsg("Ingresá un email válido y luego hacé click en Olvidé mi clave.");
      return;
    }

    setLoading(true);

    const { error: fnErr } = await supabase.functions.invoke(
      "send-password-reset",
      { body: { email: eMail } }
    );

    if (fnErr) {
      setMsg(
        "Si el email es correcto, recibirás un correo con instrucciones para cambiar tu clave."
      );
      setLoading(false);
      return;
    }

    setMsg(
      "Si el email es correcto, recibirás un correo con instrucciones para cambiar tu clave."
    );
    setLoading(false);
  }

  function onCambiarMail() {
    setMsg("Para cambiar el email, contactá al administrador.");
  }

  const mainCardStyle: React.CSSProperties = {
    ...glassCard,
    width: "100%",
    maxWidth: isMobile ? 420 : "none",
    padding: isMobile ? 22 : 34,
    position: "relative",
    zIndex: 2,
  };

  const secondaryCardStyle: React.CSSProperties = {
    ...glassCard,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  };

  return (
    <main style={{ minHeight: "100vh", position: "relative" }}>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "16px 14px" : 24,
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: 1180,
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? 18 : 96,
            alignItems: "center",
            position: "relative",
          }}
        >
          {isMobile && (
            <div
              style={{
                ...secondaryCardStyle,
                position: "absolute",
                inset: 0,
                width: "100%",
                maxWidth: 420,
                margin: "0 auto",
                minHeight: 520,
                opacity: 0.34,
                filter: "blur(2px)",
                pointerEvents: "none",
                zIndex: 1,
                transform: "translate(26px, 10px)",
              }}
            >
              <div />
            </div>
          )}

          <div style={mainCardStyle}>
            <h1
              style={{
                fontSize: isMobile ? 28 : 42,
                lineHeight: isMobile ? 1.15 : 1.1,
                margin: 0,
                wordBreak: "break-word",
              }}
            >
              Mis Quiero en Acción
            </h1>

            <p
              style={{
                fontSize: isMobile ? 17 : 20,
                marginTop: 10,
                marginBottom: 0,
              }}
            >
              Ingreso con mail y clave.
            </p>

            {msg && (
              <div
                style={{
                  fontSize: isMobile ? 15 : 16,
                  marginTop: 12,
                  lineHeight: 1.4,
                }}
              >
                {msg}
              </div>
            )}

            <form
              style={{
                display: "grid",
                gap: isMobile ? 12 : 14,
                marginTop: 18,
              }}
              onSubmit={onIngresar}
            >
              <div>
                <div
                  style={{
                    ...labelStyle,
                    fontSize: isMobile ? 16 : 18,
                  }}
                >
                  Email
                </div>
                <input
                  style={{
                    ...inputStyle,
                    fontSize: isMobile ? 16 : 17,
                    padding: isMobile ? "13px 14px" : "14px 16px",
                  }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              <div>
                <div
                  style={{
                    ...labelStyle,
                    fontSize: isMobile ? 16 : 18,
                  }}
                >
                  Clave
                </div>
                <input
                  style={{
                    ...inputStyle,
                    fontSize: isMobile ? 16 : 17,
                    padding: isMobile ? "13px 14px" : "14px 16px",
                  }}
                  type="password"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                style={{
                  ...btnIngresar,
                  fontSize: isMobile ? 16 : 17,
                  padding: isMobile ? "13px 14px" : "14px 16px",
                }}
                disabled={loading}
              >
                Ingresar
              </button>

              <div style={{ display: "grid", gap: 10 }}>
                <button
                  type="button"
                  style={{
                    ...btnOlvide,
                    fontSize: isMobile ? 16 : 17,
                    padding: isMobile ? "13px 14px" : "14px 16px",
                  }}
                  disabled={loading}
                  onClick={onOlvideClave}
                >
                  Olvidé mi clave
                </button>

                <button
                  type="button"
                  style={{
                    ...btnCambiarMail,
                    fontSize: isMobile ? 16 : 17,
                    padding: isMobile ? "13px 14px" : "14px 16px",
                  }}
                  disabled={loading}
                  onClick={onCambiarMail}
                >
                  Cambiar mi email
                </button>
              </div>
            </form>
          </div>

          {!isMobile && (
            <div style={secondaryCardStyle}>
              <div />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div />}>
      <LoginInner />
    </Suspense>
  );
}
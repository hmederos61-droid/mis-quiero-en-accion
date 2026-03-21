"use client";

export const dynamic = "force-dynamic";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   Assets de fondo
========================= */
const DESKTOP_BG = "/welcome.png";
const MOBILE_VERTICAL_BG = "/login-mobile.jpg";

/* =========================
   Estética glass — LOGIN
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
   Hook responsive
========================================================= */
function useViewport() {
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    const update = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  const isMobile = width > 0 && width <= 900;
  const isVertical = height > width;
  const isMobileVertical = isMobile && isVertical;
  const isMobileHorizontal = isMobile && !isVertical;

  return {
    width,
    height,
    isMobile,
    isVertical,
    isMobileVertical,
    isMobileHorizontal,
  };
}

/* =========================================================
   Inner
========================================================= */
function LoginInner() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile, isMobileVertical } = useViewport();

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

      /* ==========================================
         CONTROL COACHEE:
         - bloquea baja lógica
         - primer login real => active
      ========================================== */
      const { data: coacheeRow, error: coacheeErr } = await supabase
        .from("coachees")
        .select("id, is_active, status")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (coacheeErr) throw coacheeErr;

      if (coacheeRow) {
        const currentStatus = String(coacheeRow.status || "").toLowerCase();

        if (coacheeRow.is_active === false || currentStatus === "inactive") {
          await supabase.auth.signOut();
          setMsg(
            "Tu acceso ha sido deshabilitado.\nSi necesitás volver a ingresar, por favor contactate con tu coach a través del correo electrónico."
          );
          setLoading(false);
          return;
        }

        if (currentStatus === "pending" || currentStatus === "invited") {
          await supabase
            .from("coachees")
            .update({
              status: "active",
              is_active: true,
            })
            .eq("id", coacheeRow.id)
            .eq("auth_user_id", user.id);
        }
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

      // =============================
      // REGISTRO DE LOGIN (analytics)
      // =============================
      const deviceType = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
        ? "mobile"
        : "web";

      const resolvedRole = hasAdmin
        ? "admin"
        : hasCoach
        ? "coach"
        : "coachee";

      const loginEventPayload = {
        auth_user_id: user.id,
        email: user.email?.trim() || eMail,
        role: resolvedRole,
        device_type: deviceType,
      };

      const { error: loginEventError } = await supabase
        .from("login_events")
        .insert(loginEventPayload);

      if (loginEventError) {
        console.error("MQA login_events insert error:", loginEventError);
        console.error("MQA login_events payload:", loginEventPayload);
      }

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

    setMsg(
      "Si el email es correcto, recibirás un correo con instrucciones para cambiar tu clave."
    );
    setLoading(false);

    if (fnErr) return;
  }

  function onCambiarMail() {
    setMsg("Para cambiar el email, contactá al administrador.");
  }

  const backgroundImage = isMobileVertical ? MOBILE_VERTICAL_BG : DESKTOP_BG;

  const mainStyle: React.CSSProperties = {
    minHeight: "100vh",
    position: "relative",
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundRepeat: "no-repeat",
    overflow: "hidden",
  };

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background: isMobileVertical
      ? "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.12) 22%, rgba(0,0,0,0.16) 100%)"
      : "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.08) 100%)",
    pointerEvents: "none",
  };

  const contentWrapStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: isMobile ? "20px 14px" : 24,
    position: "relative",
    zIndex: 1,
  };

  const sectionStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 1180,
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    gap: isMobile ? 0 : 96,
    alignItems: isMobile ? "center" : "stretch",
    position: "relative",
  };

  const leftColStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: isMobile ? "center" : "stretch",
    alignItems: "stretch",
    height: "100%",
  };

  const leftCardStyle: React.CSSProperties = {
    ...glassCard,
    width: "100%",
    maxWidth: isMobile ? 560 : "none",
    minHeight: isMobile ? "auto" : 520,
    padding: isMobile ? 22 : 34,
    position: "relative",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  };

  const rightCardDesktopStyle: React.CSSProperties = {
    ...glassCard,
    width: "100%",
    minHeight: 520,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignSelf: "stretch",
  };

  const mobileGhostCardStyle: React.CSSProperties = {
    ...glassCard,
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "100%",
    maxWidth: 560,
    minHeight: 520,
    transform: "translate(-50%, -50%)",
    opacity: 0.22,
    filter: "blur(1.4px)",
    pointerEvents: "none",
    zIndex: 1,
    padding: 22,
  };

  return (
    <main style={mainStyle}>
      <div style={overlayStyle} />

      <div style={contentWrapStyle}>
        <section style={sectionStyle}>
          {isMobile && (
            <div style={mobileGhostCardStyle}>
              <div />
            </div>
          )}

          <div style={leftColStyle}>
            <div style={leftCardStyle}>
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
                    whiteSpace: "pre-line",
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
          </div>

          {!isMobile && (
            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                height: "100%",
              }}
            >
              <div style={rightCardDesktopStyle}>
                <div />
              </div>
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
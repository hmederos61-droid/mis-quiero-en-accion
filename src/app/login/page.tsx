"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function check() {
      try {
        const { data } = await supabase.auth.getSession();
        const hasSession = !!data?.session;
        if (!alive) return;

        if (hasSession) {
          router.replace("/quieros/inicio");
          return;
        }
      } finally {
        if (alive) setCheckingSession(false);
      }
    }

    check();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/quieros/inicio");
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, [router, supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setErrorMsg(null);
    setLoading(true);

    try {
      const cleanEmail = (email || "").trim();

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password || "",
      });

      if (error) {
        setErrorMsg("No pudimos ingresar. Revisá tu email y tu clave.");
        return;
      }

      router.replace("/quieros/inicio");
    } catch {
      setErrorMsg("Ocurrió un error inesperado. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="mq-page">
        <div className="mq-bg" aria-hidden="true" />
        <div className="mq-overlay" aria-hidden="true" />
        <section className="mq-shell">
          <div className="mq-loadingCard">
            <div className="mq-loadingTitle">Mis Quiero en Acción</div>
            <div className="mq-loadingText">Cargando…</div>
          </div>
        </section>

        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="mq-page">
      <div className="mq-bg" aria-hidden="true" />
      <div className="mq-overlay" aria-hidden="true" />

      <section className="mq-shell">
        <div className="mq-frame" role="presentation">
          <div className="mq-grid">
            {/* Card izquierda: login */}
            <article className="mq-card mq-cardLogin">
              <header className="mq-cardHeader">
                <h1 className="mq-title">
                  Mis Quiero en
                  <br />
                  Acción
                </h1>

                <p className="mq-subtitle">Ingreso con tu mail y clave.</p>
                <p className="mq-helper">
                  Inicio exitoso. Cuando estés listo, hacé click en “Ingresar”.
                </p>
              </header>

              <form className="mq-form" onSubmit={onSubmit}>
                <label className="mq-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  className="mq-input"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tuemail@dominio.com"
                  required
                />

                <label className="mq-label" htmlFor="password">
                  Clave
                </label>
                <input
                  id="password"
                  className="mq-input"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                {errorMsg ? <div className="mq-error">{errorMsg}</div> : null}

                <button className="mq-btn mq-btnPrimary" type="submit" disabled={loading}>
                  {loading ? "Ingresando…" : "Ingresar"}
                </button>

                <Link className="mq-btn mq-btnSecondary" href="/login/olvide">
                  Olvidé mi clave
                </Link>
              </form>
            </article>

            {/* Card derecha: mensaje */}
            <article className="mq-card mq-cardMessage">
              <div className="mq-messageInner">
                <h2 className="mq-messageTitle">
                  Si ya llegaste hasta acá,
                  <br />
                  estás en el inicio de un
                  <br />
                  nuevo camino.
                </h2>
                <p className="mq-messageText">Vamos: te invito a dar el primer paso.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
/* =========================
   Baseline
========================= */
.mq-page{
  position: relative;
  width: 100%;
  min-height: 100dvh;
  overflow: hidden; /* evita scroll del body en 1366×768 */
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
  color: rgba(255,255,255,0.96);
}

.mq-bg{
  position: absolute;
  inset: 0;
  background-image: url("/welcome.png");
  background-size: cover;
  background-position: center;
  transform: scale(1.02);
  filter: saturate(1.05);
}

.mq-overlay{
  position: absolute;
  inset: 0;
  background:
    radial-gradient(1200px 700px at 25% 35%, rgba(0,0,0,0.20), rgba(0,0,0,0.60)),
    linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.45));
}

.mq-shell{
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100dvh;
  display: grid;
  place-items: center;
  padding: 22px;
}

/* =========================
   Frame & Grid
========================= */
.mq-frame{
  width: min(1080px, calc(100vw - 44px));
}

.mq-grid{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
  align-items: stretch;
}

/* altura objetivo: entra completo en 1366×768 sin scroll */
.mq-card{
  border-radius: 18px;
  background: rgba(20,20,22,0.34);
  border: 1px solid rgba(255,255,255,0.18);
  box-shadow:
    0 18px 46px rgba(0,0,0,0.40),
    inset 0 1px 0 rgba(255,255,255,0.10);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  overflow: hidden;
  min-height: 0;

  /* clave: limitar alto de card para que no genere scroll del body */
  height: min(560px, calc(100dvh - 44px));
}

.mq-cardLogin{
  padding: 22px 22px 18px;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 14px;
}

.mq-cardMessage{
  display: grid;
  place-items: center;
  padding: 22px;
}

.mq-messageInner{
  width: 100%;
  max-width: 420px;
}

/* =========================
   Typography
========================= */
.mq-title{
  margin: 0;
  letter-spacing: -0.02em;
  font-weight: 900;
  line-height: 1.02;
  font-size: 44px; /* base desktop */
  text-shadow: 0 10px 24px rgba(0,0,0,0.35);
}

.mq-subtitle{
  margin: 10px 0 0;
  font-size: 14px;
  color: rgba(255,255,255,0.82);
}

.mq-helper{
  margin: 8px 0 0;
  font-size: 12.5px;
  color: rgba(255,255,255,0.72);
  line-height: 1.35;
}

.mq-messageTitle{
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.12;
  font-size: 26px;
  text-shadow: 0 12px 30px rgba(0,0,0,0.35);
}

.mq-messageText{
  margin: 10px 0 0;
  font-size: 13px;
  color: rgba(255,255,255,0.78);
}

/* =========================
   Form
========================= */
.mq-form{
  display: grid;
  gap: 10px;
  align-content: start;
}

.mq-label{
  font-size: 13px;
  font-weight: 700;
  color: rgba(255,255,255,0.86);
  margin-top: 4px;
}

.mq-input{
  width: 100%;
  height: 42px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.16);
  background: rgba(255,255,255,0.92);
  color: rgba(10,10,12,0.92);
  padding: 0 12px;
  outline: none;
  font-size: 14px;
}

.mq-input:focus{
  border-color: rgba(255,255,255,0.32);
  box-shadow: 0 0 0 3px rgba(255,255,255,0.10);
}

.mq-error{
  border-radius: 10px;
  padding: 10px 12px;
  background: rgba(180, 40, 40, 0.22);
  border: 1px solid rgba(255,255,255,0.18);
  color: rgba(255,255,255,0.92);
  font-size: 13px;
}

.mq-btn{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  border-radius: 12px;
  font-weight: 900;
  font-size: 14px;
  text-decoration: none;
  border: 0;
  cursor: pointer;
  user-select: none;
  transition: transform 120ms ease, filter 120ms ease, opacity 120ms ease;
}

.mq-btn:active{
  transform: translateY(1px);
}

.mq-btnPrimary{
  background: linear-gradient(180deg, rgba(24,156,94,0.96), rgba(16,126,76,0.96));
  color: rgba(255,255,255,0.96);
  box-shadow: 0 14px 34px rgba(0,0,0,0.30);
}

.mq-btnSecondary{
  background: linear-gradient(180deg, rgba(80,102,168,0.96), rgba(56,74,132,0.96));
  color: rgba(255,255,255,0.96);
  box-shadow: 0 14px 34px rgba(0,0,0,0.22);
}

.mq-btn:disabled{
  opacity: 0.72;
  cursor: not-allowed;
}

/* =========================
   Loading card
========================= */
.mq-loadingCard{
  width: min(520px, calc(100vw - 44px));
  border-radius: 18px;
  background: rgba(20,20,22,0.34);
  border: 1px solid rgba(255,255,255,0.18);
  box-shadow:
    0 18px 46px rgba(0,0,0,0.40),
    inset 0 1px 0 rgba(255,255,255,0.10);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 20px 22px;
}

.mq-loadingTitle{
  font-weight: 900;
  letter-spacing: -0.02em;
  font-size: 22px;
  margin: 0;
}

.mq-loadingText{
  margin-top: 10px;
  font-size: 13px;
  color: rgba(255,255,255,0.76);
}

/* =========================
   Responsive scaling (objetivo: 1366×768)
   - mantener dos cards lado a lado
   - evitar scroll vertical del body
========================= */

/* Ajuste específico para notebooks (ancho <= 1400) */
@media (max-width: 1400px){
  .mq-frame{ width: min(980px, calc(100vw - 44px)); }
  .mq-card{ height: min(520px, calc(100dvh - 44px)); }
  .mq-title{ font-size: 40px; }
  .mq-messageTitle{ font-size: 24px; }
}

/* Ajuste por alto de pantalla (<= 800) */
@media (max-height: 800px){
  .mq-shell{ padding: 16px; }
  .mq-grid{ gap: 18px; }
  .mq-card{ height: min(500px, calc(100dvh - 32px)); }
  .mq-cardLogin{ padding: 18px 18px 14px; gap: 12px; }
  .mq-cardMessage{ padding: 18px; }
  .mq-title{ font-size: 38px; }
  .mq-subtitle{ font-size: 13.5px; }
  .mq-helper{ font-size: 12px; }
  .mq-input{ height: 40px; font-size: 13.5px; }
  .mq-btn{ height: 42px; font-size: 13.5px; }
  .mq-messageTitle{ font-size: 23px; }
  .mq-messageText{ font-size: 12.5px; }
}

/* Último “empuje” para 768px de alto exacto */
@media (max-height: 768px){
  .mq-card{ height: min(480px, calc(100dvh - 28px)); }
  .mq-title{ font-size: 36px; }
  .mq-form{ gap: 9px; }
}

/* Si el ancho cae demasiado (no es el foco, pero evita ruptura) */
@media (max-width: 980px){
  .mq-grid{
    grid-template-columns: 1fr;
  }
  .mq-card{
    height: auto;
    min-height: 0;
  }
}
`;

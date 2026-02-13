// src/app/(web)/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

/**
 * DEMO 01 (Web Pública) — Experiencia no tradicional
 * - Umbral: declaración (Quiero...)
 * - Transformación visual (consolidación del Quiero)
 * - Micro-diagnóstico (2 preguntas, segunda adaptativa)
 * - Elección de contexto (Persona / Empresa / Coach)
 * - CTA suave para dejar datos (lead) sin crear cuenta
 *
 * Persistencia (solo sesión):
 * - sessionStorage: guarda session_id, quiero, respuestas, contexto y lead si lo completa
 */

type ContextChoice = "persona" | "empresa" | "coach" | null;

type Q1Choice = "claridad" | "seguimiento" | "conversaciones" | "compromisos" | null;

type Q2Choice =
  | "no_registradas"
  | "no_revisan"
  | "no_cumplen"
  | "se_diluyen"
  | "no_ocurren"
  | "se_evitan"
  | "sin_acuerdos"
  | "sin_seguimiento"
  | null;

type LeadPayload = {
  nombre?: string;
  email: string;
  whatsapp?: string;
  empresa?: string;
  rol?: string;
  mensaje?: string;
  consentimiento: boolean;
};

const SS_KEYS = {
  sessionId: "mqa_web_session_id",
  quiero: "mqa_web_quiero_text",
  q1: "mqa_web_q1_choice",
  q2: "mqa_web_q2_choice",
  context: "mqa_web_context_choice",
  lead: "mqa_web_lead_payload",
  ts: "mqa_web_first_seen_at",
} as const;

function safeGetSessionStorage(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetSessionStorage(key: string, val: string) {
  try {
    window.sessionStorage.setItem(key, val);
  } catch {
    // noop
  }
}

function genSessionId(): string {
  // id aleatorio, no identificable
  return "sess_" + Math.random().toString(36).slice(2) + "_" + Date.now().toString(36);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** ---------- Estilos (corporativo elegante + fondo welcome difuminado) ---------- */

const pageWrap: React.CSSProperties = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
};

const welcomeBg: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage: "url('/welcome.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  filter: "blur(26px)",
  transform: "scale(1.08)",
};

const overlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.82) 35%, rgba(255,255,255,0.90) 100%)",
};

const topBar: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "18px 20px",
  maxWidth: 1120,
  margin: "0 auto",
};

const brand: React.CSSProperties = {
  fontSize: 15,
  letterSpacing: 0.2,
  fontWeight: 700,
  color: "rgba(10,14,20,0.86)",
};

const topActions: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
};

const linkButton: React.CSSProperties = {
  appearance: "none",
  border: "1px solid rgba(10,14,20,0.14)",
  background: "rgba(255,255,255,0.55)",
  borderRadius: 999,
  padding: "10px 14px",
  fontSize: 13,
  cursor: "pointer",
  color: "rgba(10,14,20,0.82)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const primaryButton: React.CSSProperties = {
  ...linkButton,
  border: "1px solid rgba(10,14,20,0.18)",
  background: "rgba(10,14,20,0.88)",
  color: "rgba(255,255,255,0.92)",
};

const centerStage: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  maxWidth: 1120,
  margin: "0 auto",
  padding: "38px 20px 70px",
  display: "flex",
  justifyContent: "center",
};

const card: React.CSSProperties = {
  width: "min(980px, 92vw)",
  borderRadius: 22,
  border: "1px solid rgba(10,14,20,0.10)",
  background: "rgba(255,255,255,0.58)",
  boxShadow: "0 18px 70px rgba(0,0,0,0.10)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  padding: 34,
};

const kicker: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: 1.4,
  textTransform: "uppercase",
  color: "rgba(10,14,20,0.60)",
  marginBottom: 10,
};

const title: React.CSSProperties = {
  fontSize: 32,
  lineHeight: 1.15,
  fontWeight: 800,
  color: "rgba(10,14,20,0.90)",
  margin: 0,
};

const subtitle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 15,
  lineHeight: 1.6,
  color: "rgba(10,14,20,0.74)",
  maxWidth: 780,
};

const divider: React.CSSProperties = {
  height: 1,
  background: "rgba(10,14,20,0.10)",
  margin: "20px 0 18px",
};

const fieldLabel: React.CSSProperties = {
  fontSize: 13,
  color: "rgba(10,14,20,0.72)",
  marginBottom: 8,
};

const inputWrap: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(10,14,20,0.12)",
  background: "rgba(255,255,255,0.70)",
  padding: "14px 16px",
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const input: React.CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: 16,
  color: "rgba(10,14,20,0.90)",
};

const hint: React.CSSProperties = {
  fontSize: 12,
  color: "rgba(10,14,20,0.58)",
  marginTop: 10,
};

const stepRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 16,
};

const stepPillBase: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(10,14,20,0.12)",
  padding: "8px 12px",
  fontSize: 12,
  color: "rgba(10,14,20,0.74)",
  background: "rgba(255,255,255,0.60)",
};

const stepPillActive: React.CSSProperties = {
  ...stepPillBase,
  border: "1px solid rgba(10,14,20,0.22)",
  background: "rgba(10,14,20,0.88)",
  color: "rgba(255,255,255,0.92)",
};

const optionsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
  marginTop: 14,
};

const optionButton: React.CSSProperties = {
  textAlign: "left",
  borderRadius: 16,
  border: "1px solid rgba(10,14,20,0.12)",
  background: "rgba(255,255,255,0.68)",
  padding: "14px 14px",
  cursor: "pointer",
  transition: "transform 120ms ease, border 120ms ease, background 120ms ease",
};

const optionTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "rgba(10,14,20,0.86)",
  margin: 0,
};

const optionDesc: React.CSSProperties = {
  marginTop: 6,
  marginBottom: 0,
  fontSize: 12,
  lineHeight: 1.45,
  color: "rgba(10,14,20,0.68)",
};

const rowActions: React.CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 18,
  alignItems: "center",
  flexWrap: "wrap",
};

const ghostButton: React.CSSProperties = {
  ...linkButton,
  background: "rgba(255,255,255,0.62)",
};

const wantBox: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid rgba(10,14,20,0.12)",
  background: "rgba(255,255,255,0.64)",
  padding: "16px 16px",
  marginTop: 14,
};

const wantLabel: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  color: "rgba(10,14,20,0.58)",
  marginBottom: 8,
};

const wantText: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: "rgba(10,14,20,0.90)",
  margin: 0,
  lineHeight: 1.25,
};

const smallMeta: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  color: "rgba(10,14,20,0.62)",
};

const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  zIndex: 50,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 18,
};

const modalCard: React.CSSProperties = {
  width: "min(780px, 96vw)",
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.92)",
  boxShadow: "0 18px 90px rgba(0,0,0,0.22)",
  padding: 22,
};

const modalTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  color: "rgba(10,14,20,0.90)",
};

const modalSub: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 0,
  fontSize: 13,
  lineHeight: 1.55,
  color: "rgba(10,14,20,0.70)",
};

const formGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
  marginTop: 16,
};

const formRowFull: React.CSSProperties = {
  gridColumn: "1 / -1",
};

const formField: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(10,14,20,0.12)",
  background: "rgba(255,255,255,0.96)",
  padding: "12px 12px",
  outline: "none",
  fontSize: 14,
  color: "rgba(10,14,20,0.88)",
};

const checkboxRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
  marginTop: 12,
};

const checkboxText: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.45,
  color: "rgba(10,14,20,0.68)",
};

type Stage = 0 | 1 | 2 | 3; // 0=Umbral, 1=MicroQ1, 2=MicroQ2, 3=Context + CTA

export default function WebPublicDemo01Page() {
  const [stage, setStage] = useState<Stage>(0);

  const [quieroText, setQuieroText] = useState<string>("");
  const [q1, setQ1] = useState<Q1Choice>(null);
  const [q2, setQ2] = useState<Q2Choice>(null);
  const [contextChoice, setContextChoice] = useState<ContextChoice>(null);

  const [leadOpen, setLeadOpen] = useState(false);
  const [lead, setLead] = useState<LeadPayload>({
    nombre: "",
    email: "",
    whatsapp: "",
    empresa: "",
    rol: "",
    mensaje: "",
    consentimiento: false,
  });

  const [toast, setToast] = useState<string | null>(null);

  // Init session id + restore state
  useEffect(() => {
    const existingId = safeGetSessionStorage(SS_KEYS.sessionId);
    if (!existingId) {
      safeSetSessionStorage(SS_KEYS.sessionId, genSessionId());
      safeSetSessionStorage(SS_KEYS.ts, new Date().toISOString());
    }

    const savedQuiero = safeGetSessionStorage(SS_KEYS.quiero);
    const savedQ1 = safeGetSessionStorage(SS_KEYS.q1);
    const savedQ2 = safeGetSessionStorage(SS_KEYS.q2);
    const savedCtx = safeGetSessionStorage(SS_KEYS.context);
    const savedLead = safeGetSessionStorage(SS_KEYS.lead);

    if (savedQuiero) setQuieroText(savedQuiero);
    if (savedQ1) setQ1(savedQ1 as Q1Choice);
    if (savedQ2) setQ2(savedQ2 as Q2Choice);
    if (savedCtx) setContextChoice(savedCtx as ContextChoice);

    if (savedLead) {
      try {
        const parsed = JSON.parse(savedLead) as LeadPayload;
        setLead((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore
      }
    }

    // si ya había recorrido parte del flujo, avanzamos de forma segura
    if (savedQuiero && savedQ1 && savedQ2) setStage(3);
    else if (savedQuiero && savedQ1) setStage(2);
    else if (savedQuiero) setStage(1);
  }, []);

  // Persist
  useEffect(() => {
    if (quieroText) safeSetSessionStorage(SS_KEYS.quiero, quieroText);
  }, [quieroText]);

  useEffect(() => {
    if (q1) safeSetSessionStorage(SS_KEYS.q1, q1);
  }, [q1]);

  useEffect(() => {
    if (q2) safeSetSessionStorage(SS_KEYS.q2, q2);
  }, [q2]);

  useEffect(() => {
    if (contextChoice) safeSetSessionStorage(SS_KEYS.context, contextChoice);
  }, [contextChoice]);

  const q1Options = useMemo(
    () =>
      [
        {
          id: "claridad" as const,
          title: "Falta claridad",
          desc: "El siguiente paso no está definido con precisión.",
        },
        {
          id: "seguimiento" as const,
          title: "Falta seguimiento",
          desc: "Las acciones se definen, pero no se sostienen en el tiempo.",
        },
        {
          id: "conversaciones" as const,
          title: "Conversaciones pendientes",
          desc: "Lo que hace falta decir no se está diciendo (o se evita).",
        },
        {
          id: "compromisos" as const,
          title: "Compromisos no sostenidos",
          desc: "Hay acuerdos, pero no se convierten en hechos consistentes.",
        },
      ] as const,
    []
  );

  const q2Options = useMemo(() => {
    // Adaptativa según Q1
    if (q1 === "conversaciones") {
      return [
        {
          id: "no_ocurren" as const,
          title: "No ocurren",
          desc: "Se postergan o se reemplazan por supuestos.",
        },
        {
          id: "se_evitan" as const,
          title: "Se evitan",
          desc: "Hay costo emocional o político para abrirlas.",
        },
        {
          id: "sin_acuerdos" as const,
          title: "Ocurren, pero sin acuerdos",
          desc: "Se habla, pero no se declara ni se coordina.",
        },
        {
          id: "sin_seguimiento" as const,
          title: "Hay acuerdos, sin seguimiento",
          desc: "No hay revisiones ni trazabilidad.",
        },
      ] as const;
    }

    // Default: acciones
    return [
      {
        id: "no_registradas" as const,
        title: "No quedan registradas",
        desc: "Se definen, pero quedan en la conversación.",
      },
      {
        id: "no_revisan" as const,
        title: "No se revisan",
        desc: "No hay instancia clara de revisión y ajuste.",
      },
      {
        id: "no_cumplen" as const,
        title: "No se cumplen",
        desc: "Se pierden por contexto, urgencias o energía.",
      },
      {
        id: "se_diluyen" as const,
        title: "Se diluyen",
        desc: "Empiezan fuerte y luego se van apagando.",
      },
    ] as const;
  }, [q1]);

  const stagePills = useMemo(() => {
    const labels = [
      { n: 0, t: "Umbral" },
      { n: 1, t: "Reflexión 1" },
      { n: 2, t: "Reflexión 2" },
      { n: 3, t: "Contexto" },
    ] as const;

    return labels.map((x) => ({
      ...x,
      active: stage === x.n,
      done: stage > x.n,
    }));
  }, [stage]);

  function notify(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }

  function hardReset() {
    try {
      window.sessionStorage.removeItem(SS_KEYS.quiero);
      window.sessionStorage.removeItem(SS_KEYS.q1);
      window.sessionStorage.removeItem(SS_KEYS.q2);
      window.sessionStorage.removeItem(SS_KEYS.context);
      window.sessionStorage.removeItem(SS_KEYS.lead);
    } catch {
      // noop
    }
    setQuieroText("");
    setQ1(null);
    setQ2(null);
    setContextChoice(null);
    setStage(0);
    notify("Reinicio realizado.");
  }

  function proceedFromUmbral() {
    const t = quieroText.trim();
    if (t.length < 6) {
      notify("Escribí una declaración un poco más completa.");
      return;
    }
    // Normalización ligera: si no empieza con "Quiero", lo aceptamos igual (no imponemos)
    safeSetSessionStorage(SS_KEYS.quiero, t);
    setStage(1);
  }

  function proceedQ1(choice: Q1Choice) {
    setQ1(choice);
    setStage(2);
  }

  function proceedQ2(choice: Q2Choice) {
    setQ2(choice);
    setStage(3);
  }

  function openLead() {
    setLeadOpen(true);
  }

  function closeLead() {
    setLeadOpen(false);
  }

  function saveLead() {
    const email = (lead.email || "").trim();
    if (!email || !email.includes("@")) {
      notify("Ingresá un email válido.");
      return;
    }
    if (!lead.consentimiento) {
      notify("Necesitás aceptar el consentimiento para que te contacten.");
      return;
    }

    const payload: LeadPayload = {
      nombre: (lead.nombre || "").trim() || undefined,
      email,
      whatsapp: (lead.whatsapp || "").trim() || undefined,
      empresa: (lead.empresa || "").trim() || undefined,
      rol: (lead.rol || "").trim() || undefined,
      mensaje: (lead.mensaje || "").trim() || undefined,
      consentimiento: true,
    };

    safeSetSessionStorage(SS_KEYS.lead, JSON.stringify(payload));
    setLeadOpen(false);
    notify("Datos guardados. Gracias.");
  }

  const reflectionSummary = useMemo(() => {
    // Resumen breve (elegante, sin saturar)
    const parts: string[] = [];
    if (q1) {
      const map: Record<Exclude<Q1Choice, null>, string> = {
        claridad: "claridad del siguiente paso",
        seguimiento: "seguimiento",
        conversaciones: "conversaciones pendientes",
        compromisos: "sostén de compromisos",
      };
      parts.push(map[q1]);
    }
    if (q2) {
      const map: Record<Exclude<Q2Choice, null>, string> = {
        no_registradas: "registro",
        no_revisan: "revisión",
        no_cumplen: "cumplimiento",
        se_diluyen: "continuidad",
        no_ocurren: "apertura",
        se_evitan: "valentía conversacional",
        sin_acuerdos: "declaración de acuerdos",
        sin_seguimiento: "seguimiento de acuerdos",
      };
      parts.push(map[q2]);
    }
    if (!parts.length) return null;
    const base = parts.join(" + ");
    return `Hoy el foco parece estar en: ${base}.`;
  }, [q1, q2]);

  const computedCardPadding = useMemo(() => {
    // Leve ajuste por viewport bajo sin “gigantismo”
    const vh = typeof window !== "undefined" ? window.innerHeight : 900;
    const p = clamp(Math.round(vh / 26), 24, 38);
    return { ...card, padding: p };
  }, []);

  return (
    <div style={pageWrap}>
      <div style={welcomeBg} />
      <div style={overlay} />

      {/* Top Bar */}
      <div style={topBar}>
        <div style={brand}>MisQuieroEnAcción</div>
        <div style={topActions}>
          <button
            style={linkButton}
            onClick={() => {
              // “Explorar” vuelve al inicio pero no borra lo escrito
              setStage(0);
              notify("Volviste al umbral.");
            }}
            type="button"
          >
            Explorar
          </button>
          <a href="/login" style={{ textDecoration: "none" }}>
            <button style={primaryButton} type="button">
              Acceso Plataforma
            </button>
          </a>
        </div>
      </div>

      {/* Center */}
      <main style={centerStage}>
        <section style={computedCardPadding}>
          <div style={kicker}>Experiencia Demo 01 • Coaching Ontológico</div>
          <h1 style={title}>Entrás a un proceso, no a una página.</h1>
          <p style={subtitle}>
            Este recorrido transforma una declaración en una estructura mínima: reflexión breve, contexto y una puerta
            real a conversación inicial. Sin registro automático. Sin precios. Sin ruido.
          </p>

          <div style={divider} />

          {/* Pills */}
          <div style={stepRow} aria-label="progreso">
            {stagePills.map((p) => (
              <span key={p.n} style={p.active ? stepPillActive : stepPillBase}>
                {p.t}
              </span>
            ))}
          </div>

          {/* “Quiero” Box visible a partir de la etapa 1 */}
          {stage >= 1 && quieroText.trim() && (
            <div style={wantBox}>
              <div style={wantLabel}>Tu declaración</div>
              <p style={wantText}>{quieroText.trim()}</p>
              {reflectionSummary && <div style={smallMeta}>{reflectionSummary}</div>}
            </div>
          )}

          {/* Stage 0: Umbral */}
          {stage === 0 && (
            <>
              <div style={{ marginTop: 18 }}>
                <div style={fieldLabel}>Todo proceso comienza con una declaración.</div>
                <div style={inputWrap}>
                  <input
                    style={input}
                    value={quieroText}
                    placeholder="¿Qué querés transformar?"
                    onChange={(e) => setQuieroText(e.target.value)}
                    maxLength={180}
                    aria-label="quiero"
                  />
                </div>
                <div style={hint}>
                  Tip: escribí una frase concreta. Ej.: “Quiero mejorar la coordinación en mi equipo.” (máx 180)
                </div>
              </div>

              <div style={rowActions}>
                <button style={primaryButton} onClick={proceedFromUmbral} type="button">
                  Continuar proceso →
                </button>
                <button style={ghostButton} onClick={hardReset} type="button">
                  Reiniciar
                </button>
              </div>
            </>
          )}

          {/* Stage 1: Micro Q1 */}
          {stage === 1 && (
            <>
              <div style={{ marginTop: 18 }}>
                <div style={fieldLabel}>Reflexión 1</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "rgba(10,14,20,0.88)" }}>
                  Hoy, lo que más frena tu declaración es…
                </div>

                <div style={optionsGrid}>
                  {q1Options.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      style={{
                        ...optionButton,
                        border:
                          q1 === o.id ? "1px solid rgba(10,14,20,0.28)" : "1px solid rgba(10,14,20,0.12)",
                        background: q1 === o.id ? "rgba(10,14,20,0.88)" : "rgba(255,255,255,0.68)",
                        transform: q1 === o.id ? "translateY(-1px)" : "translateY(0)",
                      }}
                      onClick={() => proceedQ1(o.id)}
                      onMouseEnter={(e) => {
                        (e.currentTarget.style.transform = "translateY(-1px)");
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget.style.transform = q1 === o.id ? "translateY(-1px)" : "translateY(0)");
                      }}
                    >
                      <p
                        style={{
                          ...optionTitle,
                          color: q1 === o.id ? "rgba(255,255,255,0.94)" : "rgba(10,14,20,0.86)",
                        }}
                      >
                        {o.title}
                      </p>
                      <p
                        style={{
                          ...optionDesc,
                          color: q1 === o.id ? "rgba(255,255,255,0.78)" : "rgba(10,14,20,0.68)",
                        }}
                      >
                        {o.desc}
                      </p>
                    </button>
                  ))}
                </div>

                <div style={hint}>Elegí una opción. La experiencia se adapta en la siguiente pregunta.</div>
              </div>

              <div style={rowActions}>
                <button
                  style={ghostButton}
                  onClick={() => {
                    setStage(0);
                    notify("Volviste al umbral.");
                  }}
                  type="button"
                >
                  ← Volver
                </button>
              </div>
            </>
          )}

          {/* Stage 2: Micro Q2 */}
          {stage === 2 && (
            <>
              <div style={{ marginTop: 18 }}>
                <div style={fieldLabel}>Reflexión 2</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "rgba(10,14,20,0.88)" }}>
                  En la práctica, lo que suele ocurrir es…
                </div>

                <div style={optionsGrid}>
                  {q2Options.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      style={{
                        ...optionButton,
                        border:
                          q2 === o.id ? "1px solid rgba(10,14,20,0.28)" : "1px solid rgba(10,14,20,0.12)",
                        background: q2 === o.id ? "rgba(10,14,20,0.88)" : "rgba(255,255,255,0.68)",
                        transform: q2 === o.id ? "translateY(-1px)" : "translateY(0)",
                      }}
                      onClick={() => proceedQ2(o.id)}
                    >
                      <p
                        style={{
                          ...optionTitle,
                          color: q2 === o.id ? "rgba(255,255,255,0.94)" : "rgba(10,14,20,0.86)",
                        }}
                      >
                        {o.title}
                      </p>
                      <p
                        style={{
                          ...optionDesc,
                          color: q2 === o.id ? "rgba(255,255,255,0.78)" : "rgba(10,14,20,0.68)",
                        }}
                      >
                        {o.desc}
                      </p>
                    </button>
                  ))}
                </div>

                <div style={hint}>Elegí una opción para terminar la reflexión mínima (2 preguntas).</div>
              </div>

              <div style={rowActions}>
                <button
                  style={ghostButton}
                  onClick={() => {
                    setStage(1);
                    notify("Volviste a Reflexión 1.");
                  }}
                  type="button"
                >
                  ← Volver
                </button>
              </div>
            </>
          )}

          {/* Stage 3: Context + CTA */}
          {stage === 3 && (
            <>
              <div style={{ marginTop: 18 }}>
                <div style={fieldLabel}>Elegí tu contexto</div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                  {[
                    {
                      id: "persona" as const,
                      title: "Desarrollo Personal",
                      desc: "Proceso individual orientado a claridad, compromiso y sostén de acción entre sesiones.",
                    },
                    {
                      id: "empresa" as const,
                      title: "Equipos & Empresas",
                      desc: "Procesos para cultura, conversaciones y coordinación con seguimiento real de compromisos.",
                    },
                    {
                      id: "coach" as const,
                      title: "Soy Coach",
                      desc: "Profesionalización: estructura, trazabilidad y métricas para acompañar procesos sin fricción.",
                    },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      style={{
                        ...optionButton,
                        padding: "16px 16px",
                        border:
                          contextChoice === c.id
                            ? "1px solid rgba(10,14,20,0.28)"
                            : "1px solid rgba(10,14,20,0.12)",
                        background: contextChoice === c.id ? "rgba(10,14,20,0.88)" : "rgba(255,255,255,0.68)",
                      }}
                      onClick={() => {
                        setContextChoice(c.id);
                        notify("Contexto seleccionado.");
                      }}
                    >
                      <p
                        style={{
                          ...optionTitle,
                          fontSize: 15,
                          color: contextChoice === c.id ? "rgba(255,255,255,0.94)" : "rgba(10,14,20,0.86)",
                        }}
                      >
                        {c.title}
                      </p>
                      <p
                        style={{
                          ...optionDesc,
                          fontSize: 12,
                          color: contextChoice === c.id ? "rgba(255,255,255,0.78)" : "rgba(10,14,20,0.68)",
                        }}
                      >
                        {c.desc}
                      </p>
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.55, color: "rgba(10,14,20,0.72)" }}>
                  {contextChoice === "coach" ? (
                    <>
                      <strong>Nota operativa:</strong> el acceso a la aplicación lo inicia el coach luego de la
                      entrevista inicial. El coachee ingresa por invitación vía email (token).
                    </>
                  ) : (
                    <>
                      Si esta experiencia resonó con tu declaración, podés dejar tus datos para iniciar una conversación
                      inicial (sin compromiso).
                    </>
                  )}
                </div>
              </div>

              <div style={rowActions}>
                <button
                  style={primaryButton}
                  onClick={() => {
                    if (!contextChoice) {
                      notify("Seleccioná un contexto para continuar.");
                      return;
                    }
                    openLead();
                  }}
                  type="button"
                >
                  {contextChoice === "coach" ? "Solicitar demo privada" : "Iniciar conversación"}
                </button>

                <button style={ghostButton} onClick={() => setStage(0)} type="button">
                  ← Volver al umbral
                </button>

                <button
                  style={ghostButton}
                  onClick={() => {
                    // Debug visible para vos: ver lo que queda guardado
                    const sid = safeGetSessionStorage(SS_KEYS.sessionId);
                    const q = safeGetSessionStorage(SS_KEYS.quiero);
                    const a1 = safeGetSessionStorage(SS_KEYS.q1);
                    const a2 = safeGetSessionStorage(SS_KEYS.q2);
                    const cx = safeGetSessionStorage(SS_KEYS.context);
                    notify(
                      `Guardado (sesión): ${sid ? "OK" : "NO"} • quiero:${q ? "OK" : "NO"} • q1:${a1 ? "OK" : "NO"} • q2:${a2 ? "OK" : "NO"} • ctx:${cx ? "OK" : "NO"}`
                    );
                  }}
                  type="button"
                >
                  Ver estado
                </button>
              </div>
            </>
          )}

          {/* Toast */}
          {toast && (
            <div
              style={{
                marginTop: 18,
                borderRadius: 14,
                border: "1px solid rgba(10,14,20,0.12)",
                background: "rgba(255,255,255,0.70)",
                padding: "10px 12px",
                fontSize: 13,
                color: "rgba(10,14,20,0.78)",
              }}
            >
              {toast}
            </div>
          )}
        </section>
      </main>

      {/* Lead Modal */}
      {leadOpen && (
        <div
          style={modalOverlay}
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLead();
          }}
        >
          <div style={modalCard}>
            <h2 style={modalTitle}>
              {contextChoice === "coach" ? "Solicitar demo privada" : "Iniciar conversación inicial"}
            </h2>
            <p style={modalSub}>
              Este paso <strong>no crea cuenta</strong>. Si luego de la entrevista el coach inicia el proceso, el acceso
              a la aplicación se habilita por invitación vía email.
            </p>

            <div style={formGrid}>
              <div>
                <div style={fieldLabel}>Nombre (opcional)</div>
                <input
                  style={formField}
                  value={lead.nombre || ""}
                  onChange={(e) => setLead((p) => ({ ...p, nombre: e.target.value }))}
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <div style={fieldLabel}>Email</div>
                <input
                  style={formField}
                  value={lead.email || ""}
                  onChange={(e) => setLead((p) => ({ ...p, email: e.target.value }))}
                  placeholder="nombre@dominio.com"
                />
              </div>

              <div>
                <div style={fieldLabel}>WhatsApp (opcional)</div>
                <input
                  style={formField}
                  value={lead.whatsapp || ""}
                  onChange={(e) => setLead((p) => ({ ...p, whatsapp: e.target.value }))}
                  placeholder="+54 ..."
                />
              </div>

              <div>
                <div style={fieldLabel}>Empresa (opcional)</div>
                <input
                  style={formField}
                  value={lead.empresa || ""}
                  onChange={(e) => setLead((p) => ({ ...p, empresa: e.target.value }))}
                  placeholder="Organización"
                />
              </div>

              <div>
                <div style={fieldLabel}>Rol (opcional)</div>
                <input
                  style={formField}
                  value={lead.rol || ""}
                  onChange={(e) => setLead((p) => ({ ...p, rol: e.target.value }))}
                  placeholder="Ej.: Coach / Líder / RRHH"
                />
              </div>

              <div style={formRowFull}>
                <div style={fieldLabel}>Mensaje (opcional)</div>
                <textarea
                  style={{ ...formField, minHeight: 86, resize: "vertical" }}
                  value={lead.mensaje || ""}
                  onChange={(e) => setLead((p) => ({ ...p, mensaje: e.target.value }))}
                  placeholder="Si querés, dejá una nota breve."
                />
              </div>
            </div>

            <div style={checkboxRow}>
              <input
                type="checkbox"
                checked={!!lead.consentimiento}
                onChange={(e) => setLead((p) => ({ ...p, consentimiento: e.target.checked }))}
                style={{ marginTop: 3 }}
              />
              <div style={checkboxText}>
                Acepto que me contacten por este medio para coordinar una conversación inicial.
              </div>
            </div>

            <div style={{ ...rowActions, justifyContent: "flex-end", marginTop: 16 }}>
              <button style={ghostButton} onClick={closeLead} type="button">
                Cancelar
              </button>
              <button style={primaryButton} onClick={saveLead} type="button">
                Guardar datos
              </button>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "rgba(10,14,20,0.56)" }}>
              Nota: por ahora esto se guarda en <strong>sessionStorage</strong>. En el próximo paso lo conectamos a
              Supabase para persistir leads y trazabilidad.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

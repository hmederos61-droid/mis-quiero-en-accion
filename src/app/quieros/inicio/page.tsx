import React from "react";
import Link from "next/link";

/* =========================
   PATRÓN MAESTRO (LOGIN)
   - Fondo welcome.png + overlay suave
   - Glass card: blur + transparencia
   - Tipografía y jerarquía similar a Login
   - Botones SIEMPRE en color (gradientes)
========================= */

/* =========================
   Fondo
========================= */
const bgLayer: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundImage: `url("/welcome.png")`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  zIndex: 0,
};

// Overlay más claro, alineado a Login (sin apagar el fondo)
const overlayLayer: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "linear-gradient(rgba(0,0,0,0.08), rgba(0,0,0,0.10))",
  zIndex: 1,
};

const pageWrap: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 28,
};

/* =========================
   Glass Card (mismo espíritu que Login)
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

/* =========================
   Botones base (mismo criterio Login)
========================= */
const btnBase: React.CSSProperties = {
  display: "inline-block",
  padding: "14px 18px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.22)",
  cursor: "pointer",
  fontWeight: 850,
  fontSize: 18,
  color: "rgba(255,255,255,0.96)",
  textShadow: "0 1px 2px rgba(0,0,0,0.35)",
  textDecoration: "none",
  boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
};

const btnVolverLogin: React.CSSProperties = {
  ...btnBase,
  fontSize: 16,
  padding: "12px 16px",
  background: "linear-gradient(135deg, rgba(70,120,255,0.55), rgba(40,80,220,0.45))",
};

/* =========================
   Header (tamaño/jerarquía tipo Login)
========================= */
const titleStyle: React.CSSProperties = {
  fontSize: 52,
  margin: 0,
  lineHeight: 1.05,
  fontWeight: 500, // sin negrita exagerada (criterio unificado)
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 22,
  lineHeight: 1.35,
  marginTop: 14,
  marginBottom: 0,
  opacity: 0.96,
  fontWeight: 400,
};

/* =========================
   Acciones (filas con color/gradiente)
========================= */
const sectionTitle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 500, // no negrita (solo botones)
  marginTop: 28,
  marginBottom: 14,
  opacity: 0.98,
};

const listWrap: React.CSSProperties = {
  display: "grid",
  gap: 16,
};

const rowBase: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 18,
  padding: "18px 18px",
  borderRadius: 18,
  textDecoration: "none",
  color: "rgba(255,255,255,0.98)",
  border: "1px solid rgba(255,255,255,0.16)",
  boxShadow: "0 12px 30px rgba(0,0,0,0.20)",
};

const iconBox: React.CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,0.18)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const rowTitle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 850, // fuerte solo en acciones/botones
};

const rowHint: React.CSSProperties = {
  fontSize: 16,
  opacity: 0.95,
  fontWeight: 400,
};

function Chevron() {
  return <span style={{ fontSize: 28, opacity: 0.85 }}>›</span>;
}

function ActionRow({
  href,
  title,
  hint,
  background,
  icon,
}: {
  href: string;
  title: string;
  hint: string;
  background: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} style={{ ...rowBase, background }}>
      <div style={iconBox}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={rowTitle}>{title}</div>
        <div style={rowHint}>{hint}</div>
      </div>
      <Chevron />
    </Link>
  );
}

export default function QuierosInicioPage() {
  return (
    <main style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <div style={bgLayer} aria-hidden />
      <div style={overlayLayer} aria-hidden />

      <div style={pageWrap}>
        <section
          style={{
            ...glassCard,
            width: "min(1100px, 100%)", // escala similar a Login (patrón maestro)
          }}
        >
          {/* Header superior: título a la izquierda, botón volver a la derecha */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 260 }}>
              <h1 style={titleStyle}>Mis Quieros</h1>
              <p style={subtitleStyle}>
                Elegí con cuál seguir hoy. Este listado es tu punto de retorno.
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Link href="/login?post=1" style={btnVolverLogin}>
                Volver al Login
              </Link>
            </div>
          </div>

          {/* Acciones */}
          <div style={sectionTitle}>Acciones</div>

          <div style={listWrap}>
            <ActionRow
              href="/quieros/nuevo"
              title="Nuevo Quiero"
              hint="Iniciá un nuevo compromiso con vos."
              background="linear-gradient(135deg, rgba(70,120,255,0.55), rgba(40,80,220,0.45))"
              icon={<span style={{ fontSize: 22, fontWeight: 900 }}>+</span>}
            />
            <ActionRow
              href="/quieros"
              title="Mis Quieros"
              hint="Volvé a tu lista y elegí con cuál reflexionar."
              background="linear-gradient(135deg, rgba(30,180,120,0.65), rgba(20,140,95,0.55))"
              icon={<span style={{ fontSize: 20, fontWeight: 900 }}>≡</span>}
            />
          </div>

          {/* Respiración inferior (clave para patrón maestro) */}
          <div style={{ height: 10 }} />
        </section>
      </div>
    </main>
  );
}

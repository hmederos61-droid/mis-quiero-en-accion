"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   Estética glass (patrón LOGIN)
========================= */
const glassCard: React.CSSProperties = {
  borderRadius: 22,
  padding: 42,
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.16)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  boxShadow: "0 18px 60px rgba(0,0,0,0.23)",
  color: "rgba(255,255,255,0.94)",
  textShadow: "0 1px 2px rgba(0,0,0,0.38)",
  width: "92%", // ✅ antes 92vw
  maxWidth: 980,
};

const titleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 600, // ✅ antes 900 (bajamos énfasis según canónico)
  opacity: 0.88,   // ✅ antes 0.95 (menos contraste)
  marginBottom: 10,
};

const subStyle: React.CSSProperties = {
  fontSize: 16,
  opacity: 0.9,
  lineHeight: 1.4,
  marginBottom: 18,
};

const btnBase: React.CSSProperties = {
  width: "100%",
  padding: "14px 18px",
  borderRadius: 14,
  border: "none",
  fontSize: 18,
  fontWeight: 900,
  cursor: "pointer",
  color: "#fff",
  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
};

const btnPrimario: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(120,160,255,0.95), rgba(160,120,255,0.95))",
};

const btnSec: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(90,200,140,0.95), rgba(60,170,120,0.95))",
};

const btnInicio: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(110,140,180,0.90), rgba(90,110,150,0.90))",
};

const LS_KEY = "mqa_acceso_coachee_datos_draft_v1";

export default function CoachMenuPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  async function handleSalir() {
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
    }
  }

  function handleAltaCoachee() {
    // Alta debe arrancar vacía: limpiamos el borrador previo
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      // si el navegador bloquea LS por alguna razón, igual navegamos
    }
    router.push("/acceso/coachee/carga");
  }

  return (
    <>
      <style jsx global>{`
        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          min-height: 100% !important;
          background: url("/welcome.png") center center / cover no-repeat fixed !important;
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          width: "100%", // ✅ antes 100vw (corrige descentrado)
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "36px 0",
        }}
      >
        <div style={glassCard}>
          <div style={titleStyle}>Menú Coach</div>

          <div style={subStyle}>
            Accedé a las funciones operativas del coach.
            <br />
            Elegí una opción para continuar.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <button style={btnPrimario} onClick={handleAltaCoachee} title="Alta de coachee (carga de datos)">
              Alta de Coachee
            </button>

            <button
              style={btnSec}
              onClick={() => router.push("/coach/coachee/buscar")}
              title="Buscar y seleccionar un coachee para modificar"
            >
              Modificar Coachee
            </button>

            <button style={btnInicio} onClick={() => router.push("/menu")} title="Volver al menú principal">
              Inicio
            </button>

            <button style={btnInicio} onClick={handleSalir} title="Cerrar sesión">
              Salir
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

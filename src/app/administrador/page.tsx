"use client";

import React from "react";

/* =========================
   Estética glass — MENÚ ADMINISTRADOR
   (idéntica al menú existente)
========================= */
const glassCard: React.CSSProperties = {
  borderRadius: 22,
  padding: 36,
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.16)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  boxShadow: "0 18px 60px rgba(0,0,0,0.23)",
  color: "rgba(255,255,255,0.94)",
  textShadow: "0 1px 2px rgba(0,0,0,0.38)",
};

const btnBase: React.CSSProperties = {
  width: "100%",
  padding: "16px 18px",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.22)",
  cursor: "default",
  fontWeight: 600,
  fontSize: 18,
  color: "rgba(255,255,255,0.96)",
  textShadow: "0 1px 2px rgba(0,0,0,0.35)",
};

const btnAltaCoach = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(120,140,255,0.55), rgba(90,110,230,0.45))",
};

const btnFondo = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(255,185,90,0.55), rgba(230,155,40,0.45))",
};

const btnFactura = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(120,200,150,0.55), rgba(90,170,120,0.45))",
};

const btnReportes = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(180,140,220,0.55), rgba(150,110,190,0.45))",
};

export default function MenuAdministradorPage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <section style={{ width: "min(980px, 100%)" }}>
        <div style={glassCard}>
          <h1 style={{ fontSize: 34, margin: 0 }}>Menú Administrador</h1>

          <p style={{ fontSize: 18, marginTop: 10, opacity: 0.9 }}>
            Accedé a las funciones administrativas del sistema.
            Elegí una opción para continuar.
          </p>

          <div style={{ display: "grid", gap: 18, marginTop: 28 }}>
            {/* 1. Alta de nuevo Coach */}
            <button style={btnAltaCoach}>
              Alta de nuevo Coach
              <div style={{ fontSize: 14, marginTop: 6, opacity: 0.85 }}>
                Permite dar de alta un nuevo Coach con los mismos datos que un Coachee,
                incluyendo el envío de mail de acceso.
                (Definición del layout del mail pendiente)
              </div>
            </button>

            {/* 2. Fondo personalizado */}
            <button style={btnFondo}>
              Insertar / Administrar fondo del Coach
              <div style={{ fontSize: 14, marginTop: 6, opacity: 0.85 }}>
                Cada Coach podrá definir su propio fondo visual,
                reemplazando el actual <em>welcome.png</em>.
              </div>
            </button>

            {/* 3. Facturación */}
            <button style={btnFactura}>
              Generar Factura
              <div style={{ fontSize: 14, marginTop: 6, opacity: 0.85 }}>
                Acceso a la generación de comprobantes de facturación
                según los acuerdos comerciales vigentes.
              </div>
            </button>

            {/* 4. Reportes */}
            <button style={btnReportes}>
              Reportes de gestión
              <div style={{ fontSize: 14, marginTop: 6, opacity: 0.85 }}>
                Reportes operativos y de gestión,
                por ejemplo cantidad de Coachees activos por Coach,
                según el criterio de cobro acordado.
              </div>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

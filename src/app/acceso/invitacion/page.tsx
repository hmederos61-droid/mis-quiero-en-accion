"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/* =========================
   Estética glass (patrón)
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
  width: "92vw",
  maxWidth: 980,
};

const titleStyle: React.CSSProperties = {
  fontSize: 26,
  opacity: 0.95,
  marginBottom: 12,
};

const textStyle: React.CSSProperties = {
  fontSize: 18,
  opacity: 0.9,
  lineHeight: 1.5,
};

const buttonStyle: React.CSSProperties = {
  marginTop: 28,
  width: "100%",
  padding: "14px 18px",
  borderRadius: 14,
  border: "none",
  fontSize: 18,
  fontWeight: 600,
  cursor: "pointer",
  color: "#fff",
  background:
    "linear-gradient(135deg, rgba(120,160,255,0.95), rgba(160,120,255,0.95))",
  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
};

const secondaryButtonStyle: React.CSSProperties = {
  marginTop: 14,
  width: "100%",
  padding: "12px 18px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.35)",
  fontSize: 16,
  fontWeight: 500,
  cursor: "pointer",
  color: "#fff",
  background: "rgba(255,255,255,0.08)",
};

function InvitacionInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const token = sp.get("token") || "";
  const email = sp.get("email") || "";

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Pantalla NUEVA: no hace RPC, no activa nada.
    // Solo valida presencia de token para poder continuar.
    if (!token) {
      setError("Enlace inválido o incompleto. Solicitá un nuevo enlace.");
    } else {
      setError(null);
    }
  }, [token]);

  function goNext() {
    // Pasamos token/email al login NUEVO (minimal)
    const dest = new URL("/login/invitado", window.location.origin);
    dest.searchParams.set("token", token);
    if (email) dest.searchParams.set("email", email);

    router.replace(dest.pathname + dest.search);
  }

  return (
    <>
      {/* Fondo global welcome.png */}
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
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "22px 0",
        }}
      >
        <div style={glassCard}>
          <div style={titleStyle}>Bienvenido a tu proceso</div>

          <div style={textStyle}>
            {!error ? (
              <>
                Recibiste un enlace de invitación.
                <br />
                Para continuar, avanzá al inicio de sesión de activación.
              </>
            ) : (
              <span style={{ color: "#ffb4b4" }}>{error}</span>
            )}
          </div>

          {!error ? (
            <button style={buttonStyle} onClick={goNext}>
              Continuar
            </button>
          ) : (
            <button
              style={secondaryButtonStyle}
              onClick={() => router.replace("/login")}
            >
              Ir al login
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default function InvitacionPage() {
  return (
    <Suspense>
      <InvitacionInner />
    </Suspense>
  );
}

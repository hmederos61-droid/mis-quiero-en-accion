"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   Estética glass (LOGIN)
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

const labelStyle: React.CSSProperties = {
  fontSize: 25,
  opacity: 0.95,
  marginBottom: 10,
};

const textStyle: React.CSSProperties = {
  fontSize: 18,
  opacity: 0.9,
  lineHeight: 1.5,
};

const buttonStyle: React.CSSProperties = {
  marginTop: 30,
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

function AccesoCoacheeInner() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const email = searchParams.get("email"); // si viene, lo preservamos para /carga

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =========================================================
  // CANÓNICO (según tu pedido):
  // - Esta pantalla NO debe ser una "pantalla previa" visible.
  // - Si llega con token => redirige directo a /acceso/coachee/carga
  // - NO toca /login
  // - NO toca el mail
  // - NO activa automáticamente nada (no RPC acá)
  // =========================================================
  useEffect(() => {
    if (!token) {
      setError(
        "No se pudo activar el acceso. Pedile a tu coach un nuevo enlace."
      );
      return;
    }

    const dest = new URL("/acceso/coachee/carga", window.location.origin);
    dest.searchParams.set("token", token);
    if (email) dest.searchParams.set("email", email);

    // replace para que no vuelva atrás a esta pantalla
    router.replace(dest.pathname + dest.search);
  }, [token, email, router]);

  return (
    <>
      {/* Fondo global welcome.png, sin franjas */}
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
          <div style={labelStyle}>Bienvenido a tu proceso</div>

          <div style={textStyle}>
            {token && !error && (
              <>Cargando…</>
            )}
            {error && <span style={{ color: "#ffb4b4" }}>{error}</span>}
          </div>

          {error && (
            <>
              <button
                style={buttonStyle}
                onClick={() => router.replace("/login")}
                disabled={loading}
              >
                {loading ? "Cargando..." : "Ir al login"}
              </button>

              <button
                style={secondaryButtonStyle}
                onClick={() => router.replace("/login")}
              >
                Salir
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function AccesoCoacheePage() {
  return (
    <Suspense>
      <AccesoCoacheeInner />
    </Suspense>
  );
}

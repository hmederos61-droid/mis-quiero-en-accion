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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean>(false);

  useEffect(() => {
    if (!token) {
      setError(
        "No se pudo activar el acceso. Pedile a tu coach un nuevo enlace."
      );
    }
  }, [token]);

  async function handleActivate() {
    if (!token) return;

    setLoading(true);
    setError(null);

    const { data, error } = await supabase.rpc("activate_coachee_by_token", {
      p_token: token,
    });

    if (error || !data?.ok) {
      setError(
        "No se pudo activar el acceso. Pedile a tu coach un nuevo enlace."
      );
      setLoading(false);
      return;
    }

    setOk(true);
    setLoading(false);

    setTimeout(() => {
      router.replace("/login");
    }, 1500);
  }

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
          <div style={labelStyle}>
            {ok ? "Acceso habilitado" : "Bienvenido a tu proceso"}
          </div>

          <div style={textStyle}>
            {ok && (
              <>
                Tu acceso fue activado correctamente.
                <br />
                En instantes serás redirigido para iniciar sesión.
              </>
            )}

            {!ok && !error && (
              <>
                Un coach te invitó a iniciar un proceso de acompañamiento.
                <br />
                Este espacio es personal, confidencial y está diseñado para
                acompañarte paso a paso.
              </>
            )}

            {error && <span style={{ color: "#ffb4b4" }}>{error}</span>}
          </div>

          {!ok && (
            <>
              <button
                style={buttonStyle}
                onClick={handleActivate}
                disabled={loading}
              >
                {loading ? "Activando..." : "Comenzar"}
              </button>

              {error && (
                <button
                  style={secondaryButtonStyle}
                  onClick={() => router.replace("/login")}
                >
                  Salir
                </button>
              )}
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

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

function AccesoCoacheeInner() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);
  const [coachName, setCoachName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchCoachNameFromAppSettings(): Promise<string | null> {
    // CANÓNICO (según tu instrucción): tomar el nombre desde app_settings.coach_name
    // Asumimos una sola fila de settings. Si hay más, tomamos la primera.
    const { data, error } = await supabase
      .from("app_settings")
      .select("coach_name")
      .limit(1)
      .maybeSingle();

    if (error) return null;
    const name = (data as any)?.coach_name;
    return name ? String(name) : null;
  }

  useEffect(() => {
    if (!token) {
      // Sin token: no mostramos mensajes (evitamos textos fuera de regla) y volvemos a login.
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setOk(false);

      // 1) Intento de activación (sin tocar /login)
      const { data, error: rpcError } = await supabase.rpc(
        "activate_coachee_by_token",
        { p_token: token }
      );

      if (cancelled) return;

      // 2) Si falla: mostrar mensaje SOLO con nombre del coach (desde app_settings)
      if (rpcError || !(data as any)?.ok) {
        const name = await fetchCoachNameFromAppSettings();
        if (cancelled) return;

        if (!name) {
          // Si por algún motivo no podemos obtener el nombre, volvemos a login (sin romper reglas).
          router.replace("/login");
          return;
        }

        setCoachName(name);
        setError(
          `No se pudo activar el acceso. Por favor, solicitale a ${name} un nuevo enlace.`
        );
        setLoading(false);
        return;
      }

      // 3) Si OK: redirección a /login (sin modificar /login)
      setOk(true);
      setLoading(false);

      setTimeout(() => {
        router.replace("/login");
      }, 1200);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [token, router, supabase]);

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
            {loading && !error && !ok && <>Verificando y activando tu invitación…</>}

            {ok && (
              <>
                Tu acceso fue activado correctamente.
                <br />
                En instantes serás redirigido para iniciar sesión.
              </>
            )}

            {/* Mensajes SOLO con nombre del coach (cuando esté disponible) */}
            {!loading && !ok && !error && coachName && (
              <>
                {coachName} te invitó a iniciar un proceso de acompañamiento.
                <br />
                Este espacio es personal, confidencial y está diseñado para
                acompañarte paso a paso.
              </>
            )}

            {error && <span style={{ color: "#ffb4b4" }}>{error}</span>}
          </div>

          {error && (
            <button style={buttonStyle} onClick={() => router.replace("/login")}>
              Salir
            </button>
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

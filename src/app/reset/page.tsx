"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

/* =========================
   Estética glass (coherente con login)
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
  width: "min(920px, 100%)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 26,
  opacity: 0.95,
  marginBottom: 10,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "18px 18px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.10)",
  color: "rgba(255,255,255,0.96)",
  outline: "none",
  fontSize: 22,
};

const btnBase: React.CSSProperties = {
  width: "100%",
  padding: "20px 18px",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.22)",
  cursor: "pointer",
  fontWeight: 850,
  fontSize: 24,
  color: "rgba(255,255,255,0.96)",
  textShadow: "0 1px 2px rgba(0,0,0,0.35)",
};

const btnGuardar = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(30,180,120,0.65), rgba(20,140,95,0.55))",
};

const btnVolver = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(70,120,255,0.55), rgba(40,80,220,0.45))",
};

export default function ResetPage() {
  const router = useRouter();

  const [nueva, setNueva] = useState("");
  const [repite, setRepite] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        setHasSession(!!data.session);
      } catch {
        setHasSession(false);
      }
    }
    check();
  }, []);

  function isValid() {
    return nueva.trim().length >= 6 && nueva === repite;
  }

  async function onGuardar() {
    setMsg(null);

    if (!hasSession) {
      setMsg("Abrí esta pantalla desde el link del email de recuperación.");
      return;
    }

    if (nueva.trim().length < 6) {
      setMsg("La nueva clave debe tener al menos 6 caracteres.");
      return;
    }

    if (nueva !== repite) {
      setMsg("Las claves no coinciden.");
      return;
    }

    try {
      setLoading(true);

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        password: nueva.trim(),
      });

      if (error) {
        setMsg("No pudimos actualizar tu clave. Intentá nuevamente.");
        return;
      }

      setMsg("Listo. Tu clave fue actualizada.");
    } catch {
      setMsg("Ocurrió un error inesperado. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  async function onVolver() {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // no bloquea
    }
    router.push("/login");
  }

  return (
    <main style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Fondo */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `url("/welcome.png")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: "linear-gradient(rgba(0,0,0,0.10), rgba(0,0,0,0.12))",
        }}
      />

      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 28,
        }}
      >
        <section style={glassCard}>
          <h1 style={{ fontSize: 52, margin: 0, lineHeight: 1.05 }}>
            Recuperar tu clave
          </h1>

          <p style={{ fontSize: 26, lineHeight: 1.35, marginTop: 18 }}>
            Elegí una nueva clave para continuar tu camino.
          </p>

          {hasSession === false && (
            <div style={{ fontSize: 20, marginTop: 14, opacity: 0.95 }}>
              Abrí esta pantalla desde el link que te llegó por email.
            </div>
          )}

          {msg && (
            <div style={{ fontSize: 20, marginTop: 18, opacity: 0.95 }}>
              {msg}
            </div>
          )}

          <div style={{ display: "grid", gap: 22, marginTop: 26 }}>
            <div>
              <div style={labelStyle}>Nueva clave</div>
              <input
                style={inputStyle}
                type="password"
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <div style={labelStyle}>Repetir nueva clave</div>
              <input
                style={inputStyle}
                type="password"
                value={repite}
                onChange={(e) => setRepite(e.target.value)}
                autoComplete="new-password"
                placeholder="Repetí la nueva clave"
              />
            </div>

            <button
              style={btnGuardar}
              onClick={onGuardar}
              disabled={!isValid() || loading}
            >
              {loading ? "Guardando..." : "Guardar nueva clave"}
            </button>

            <button style={btnVolver} onClick={onVolver} disabled={loading}>
              Volver al login
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}


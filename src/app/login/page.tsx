"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   Estética glass — LOGIN (criterio correcto)
========================= */
const glassCard: React.CSSProperties = {
  borderRadius: 22,
  padding: 34,
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.16)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  boxShadow: "0 18px 60px rgba(0,0,0,0.23)",
  color: "rgba(255,255,255,0.94)",
  textShadow: "0 1px 2px rgba(0,0,0,0.38)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 18,
  opacity: 0.9,
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.10)",
  color: "rgba(255,255,255,0.96)",
  outline: "none",
  fontSize: 17,
};

const btnBase: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.22)",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 17,
  color: "rgba(255,255,255,0.96)",
  textShadow: "0 1px 2px rgba(0,0,0,0.35)",
};

const btnIngresar = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(30,180,120,0.65), rgba(20,140,95,0.55))",
};

const btnOlvide = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(70,120,255,0.55), rgba(40,80,220,0.45))",
};

const btnCambiarMail = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(255,170,60,0.55), rgba(230,140,20,0.45))",
};

const btnCrearCuenta = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(180,90,255,0.55), rgba(140,60,220,0.45))",
};

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
    });
  }, [supabase]);

  async function onIngresar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!isEmailValid(email) || clave.trim().length < 6) {
      setMsg("Completá email y clave válida.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: clave,
    });

    if (error) {
      setMsg("Email o clave incorrectos.");
    } else {
      setMsg("Login exitoso. Cuando estés listo, hacé click en “Comenzar”.");
      setHasSession(true);
    }
    setLoading(false);
  }

  function onComenzar() {
    router.push("/menu");
  }

  return (
    <main style={{ minHeight: "100vh", position: "relative" }}>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <section
          style={{
            width: "min(1180px, 100%)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 96,
            alignItems: "stretch",
          }}
        >
          {/* IZQUIERDA */}
          <div style={glassCard}>
            <h1 style={{ fontSize: 42, margin: 0 }}>Mis Quiero en Acción</h1>

            <p style={{ fontSize: 20, marginTop: 10 }}>
              Ingreso con mail y clave.
            </p>

            {msg && <div style={{ fontSize: 16, marginTop: 12 }}>{msg}</div>}

            <form style={{ display: "grid", gap: 14, marginTop: 18 }} onSubmit={onIngresar}>
              <div>
                <div style={labelStyle}>Email</div>
                <input
                  style={inputStyle}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                />
              </div>

              <div>
                <div style={labelStyle}>Clave</div>
                <input
                  style={inputStyle}
                  type="password"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                />
              </div>

              <button type="submit" style={btnIngresar} disabled={loading}>
                Ingresar
              </button>

              <div style={{ display: "grid", gap: 10 }}>
                <button type="button" style={btnOlvide}>Olvidé mi clave</button>
                <button type="button" style={btnCambiarMail}>Cambiar mi email</button>
                <button type="button" style={btnCrearCuenta}>Crear cuenta</button>
              </div>
            </form>
          </div>

          {/* DERECHA */}
          <div
            style={{
              ...glassCard,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {hasSession ? (
              <>
                <div>
                  <h2 style={{ fontSize: 32, margin: 0 }}>
                    Si ya llegaste hasta acá,
                    <br />
                    estás en el inicio de un nuevo camino.
                  </h2>
                  <p style={{ fontSize: 18, marginTop: 12 }}>
                    Vamos: te invito a dar el primer paso.
                  </p>
                </div>

                <button
                  onClick={onComenzar}
                  style={{
                    ...btnBase,
                    background: "linear-gradient(135deg, rgba(255,255,255,0.20), rgba(255,255,255,0.12))",
                  }}
                >
                  Comenzar
                </button>
              </>
            ) : (
              <div />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

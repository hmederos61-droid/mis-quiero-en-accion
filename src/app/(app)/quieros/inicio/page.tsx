"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   QUIEROS / INICIO
   - ESCALA CANÓNICA
   - SIN FONDO LOCAL (criterio global)
   - Alineado a Login + Menú + /quieros
   - BLINDAJE: si no hay sesión -> /login (sin ?next)
========================= */

const pageWrap: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 28,
};

/* =========================
   Glass Card — escala canónica
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
  width: "min(980px, 100%)",
};

/* =========================
   Header — jerarquía contenida
========================= */
const titleStyle: React.CSSProperties = {
  fontSize: 36,
  margin: 0,
  lineHeight: 1.1,
  fontWeight: 500,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 18,
  lineHeight: 1.4,
  marginTop: 10,
  marginBottom: 0,
  opacity: 0.96,
  fontWeight: 400,
};

/* =========================
   Botón volver
========================= */
const btnVolver: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.22)",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14,
  color: "rgba(255,255,255,0.96)",
  textDecoration: "none",
  background:
    "linear-gradient(135deg, rgba(70,120,255,0.55), rgba(40,80,220,0.45))",
  boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
};

/* =========================
   Acciones
========================= */
const sectionTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 500,
  marginTop: 24,
  marginBottom: 12,
  opacity: 0.98,
};

const listWrap: React.CSSProperties = {
  display: "grid",
  gap: 14,
};

const rowBase: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "14px 16px",
  borderRadius: 16,
  textDecoration: "none",
  color: "rgba(255,255,255,0.98)",
  border: "1px solid rgba(255,255,255,0.16)",
  boxShadow: "0 12px 30px rgba(0,0,0,0.20)",
};

const iconBox: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,0.18)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const rowTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
};

const rowHint: React.CSSProperties = {
  fontSize: 14,
  opacity: 0.95,
  fontWeight: 400,
};

function Chevron() {
  return <span style={{ fontSize: 22, opacity: 0.85 }}>›</span>;
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
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  // Blindaje: hasta chequear sesión no mostramos nada (evita exposición).
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancel = false;

    async function checkAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancel) return;

        const hasSession = !!data.session;

        if (!hasSession) {
          router.replace("/login");
          return;
        }

        setAuthChecked(true);
      } catch {
        if (!cancel) router.replace("/login");
      }
    }

    checkAuth();
    return () => {
      cancel = true;
    };
  }, [supabase, router]);

  if (!authChecked) return <div />;

  return (
    <main>
      <div style={pageWrap}>
        <section style={glassCard}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 260 }}>
              <h1 style={titleStyle}>Mis Quieros</h1>
              <p style={subtitleStyle}>
                Elegí con cuál seguir hoy. Este listado es tu punto de retorno.
              </p>
            </div>

            <Link href="/login?post=1" style={btnVolver}>
              Volver al Login
            </Link>
          </div>

          <div style={sectionTitle}>Acciones</div>

          <div style={listWrap}>
            <ActionRow
              href="/quieros/nuevo"
              title="Nuevo Quiero"
              hint="Iniciá un nuevo compromiso con vos."
              background="linear-gradient(135deg, rgba(70,120,255,0.55), rgba(40,80,220,0.45))"
              icon={<span style={{ fontSize: 18, fontWeight: 900 }}>+</span>}
            />
            <ActionRow
              href="/quieros"
              title="Mis Quieros"
              hint="Volvé a tu lista y elegí con cuál reflexionar."
              background="linear-gradient(135deg, rgba(30,180,120,0.65), rgba(20,140,95,0.55))"
              icon={<span style={{ fontSize: 16, fontWeight: 900 }}>≡</span>}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

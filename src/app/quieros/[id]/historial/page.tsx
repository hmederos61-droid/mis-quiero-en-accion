"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   Tipos
========================= */
type Plazo = "corto" | "mediano" | "largo";

type Quiero = {
  id: string;
  title: string | null;
  created_at: string | null;
  due_date: string | null;
};

type HistItem = {
  title: string;
  tsISO: string;
};

/* =========================
   Helpers
========================= */
function safeText(v?: string | null) {
  return (v ?? "").toString().trim();
}

function formatFechaHora(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function formatFechaCorta(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

/* =========================
   Estética – criterios generales unificados
========================= */
const bgLayer: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundImage: `url("/welcome.png")`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  zIndex: 0,
};

const overlayLayer: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "linear-gradient(rgba(0,0,0,0.16), rgba(0,0,0,0.24))",
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

const glassPanel: React.CSSProperties = {
  width: "min(1040px, 100%)",
  borderRadius: 26,
  padding: 36,
  background: "rgba(255,255,255,0.075)",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  boxShadow: "0 18px 65px rgba(0,0,0,0.38)",
  color: "rgba(255,255,255,0.95)",
};

/* =========================
   Tipografía (alineada a historial0)
========================= */
const pageTitle: React.CSSProperties = {
  fontSize: 42,
  fontWeight: 400,
  marginBottom: 22,
};

const bannerBox: React.CSSProperties = {
  padding: "18px 22px",
  borderRadius: 20,
  background: "rgba(0,0,0,0.22)",
  border: "1px solid rgba(255,255,255,0.14)",
};

const quieroTitle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 400,
};

const sectionTitle: React.CSSProperties = {
  marginTop: 26,
  marginBottom: 12,
  fontSize: 18,
  fontWeight: 400,
  opacity: 0.9,
};

/* =========================
   Historial
========================= */
const listWrap: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const card: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.14)",
};

const itemTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 400,
};

const itemTs: React.CSSProperties = {
  marginTop: 6,
  fontSize: 13,
  opacity: 0.75,
};

/* =========================
   Botones (alineados a referencia)
========================= */
const actionsRow: React.CSSProperties = {
  marginTop: 26,
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 16,
};

const btnBase: React.CSSProperties = {
  padding: "18px 16px",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.20)",
  textDecoration: "none",
  fontSize: 16,
  fontWeight: 500,
  color: "rgba(255,255,255,0.96)",
  textAlign: "center",
};

const btnBlue = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(80,120,255,0.55), rgba(40,80,220,0.45))",
};

const btnGreen = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(30,180,120,0.65), rgba(20,140,95,0.55))",
};

const btnGold = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(240,170,70,0.65), rgba(200,130,40,0.45))",
};

/* =========================
   Page
========================= */
export default function QuieroHistorialPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [quiero, setQuiero] = useState<Quiero | null>(null);
  const [historial, setHistorial] = useState<HistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;

    async function load() {
      const { data } = await supabase
        .from("quieros")
        .select("id,title,created_at,due_date")
        .eq("id", id)
        .single();

      if (cancel) return;

      setQuiero(data);
      const now = new Date().toISOString();
      setHistorial([
        { title: "Se creó el Quiero", tsISO: data.created_at ?? now },
        {
          title: `Horizonte definido · ${formatFechaCorta(data.due_date)}`,
          tsISO: now,
        },
      ]);
      setLoading(false);
    }

    load();
    return () => {
      cancel = true;
    };
  }, [id, supabase]);

  if (loading) {
    return (
      <main>
        <div style={bgLayer} />
        <div style={overlayLayer} />
        <div style={pageWrap}>Cargando…</div>
      </main>
    );
  }

  return (
    <main>
      <div style={bgLayer} />
      <div style={overlayLayer} />

      <div style={pageWrap}>
        <section style={glassPanel}>
          <div style={pageTitle}>Consulta de tu Quiero</div>

          <div style={bannerBox}>
            <div style={quieroTitle}>
              {safeText(quiero?.title) || "Quiero sin título"}
            </div>
          </div>

          <div style={sectionTitle}>Historial</div>

          <div style={listWrap}>
            {historial.map((h, i) => (
              <div key={i} style={card}>
                <div style={itemTitle}>{h.title}</div>
                <div style={itemTs}>{formatFechaHora(h.tsISO)}</div>
              </div>
            ))}
          </div>

          <div style={actionsRow}>
            <Link href={`/quieros/${id}/historial0`} style={btnBlue}>
              Historial del Quiero
            </Link>

            <Link href={`/quieros/${id}/historial1`} style={btnGreen}>
              Historial de habilitantes e inhabilitantes
            </Link>

            <Link href={`/quieros/${id}/edit`} style={btnGold}>
              Modificar Quiero
            </Link>

            <Link href="/quieros" style={btnBase}>
              Volver a la lista
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

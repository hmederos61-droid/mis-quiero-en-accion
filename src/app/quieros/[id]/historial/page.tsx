"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Plazo = "corto" | "mediano" | "largo";

type Quiero = {
  id: string;
  title: string | null;
  created_at: string | null;
  due_date: string | null;
  status: string | null;
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

function formatFechaCorta(value?: string | null) {
  if (!value) return "—";
  const s = String(value);
  const iso = s.length >= 10 ? s.slice(0, 10) : s;
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

function formatFechaHora(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function diffDays(fromISO: string, toYYYYMMDD: string) {
  const from = new Date(fromISO);
  const to = new Date(toYYYYMMDD + "T00:00:00");
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function plazoFromCreatedAtAndDueDate(
  createdAtISO?: string | null,
  dueDateYYYYMMDD?: string | null
): Plazo {
  if (!createdAtISO || !dueDateYYYYMMDD) return "mediano";
  const days = diffDays(createdAtISO, dueDateYYYYMMDD);
  if (days <= 30) return "corto";
  if (days <= 180) return "mediano";
  return "largo";
}

function labelPlazo(p: Plazo) {
  if (p === "corto") return "Corto plazo";
  if (p === "mediano") return "Mediano plazo";
  return "Largo plazo";
}

/* =========================
   Estética (mismo lenguaje visual)
========================= */
const bgLayer: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundImage: `url("/welcome.png")`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  zIndex: 0,
};

const overlayLayer: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "linear-gradient(rgba(0,0,0,0.18), rgba(0,0,0,0.26))",
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
  padding: 34,
  background: "rgba(255,255,255,0.075)",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  boxShadow: "0 18px 65px rgba(0,0,0,0.38)",
  color: "rgba(255,255,255,0.95)",
  textShadow: "0 1px 2px rgba(0,0,0,0.38)",
};

const pageTitle: React.CSSProperties = {
  margin: 0,
  marginBottom: 14,
  fontSize: 30,
  lineHeight: 1.08,
  fontWeight: 500, // unificado: sin negrita fuerte
  opacity: 0.95,
};

const headerBox: React.CSSProperties = {
  padding: "18px 18px",
  borderRadius: 18,
  background: "rgba(0,0,0,0.22)",
  border: "1px solid rgba(255,255,255,0.14)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 38,
  lineHeight: 1.06,
  fontWeight: 500, // unificado: sin negrita fuerte
  letterSpacing: 0.2,
};

const sectionTitle: React.CSSProperties = {
  marginTop: 20,
  marginBottom: 10,
  fontSize: 18,
  fontWeight: 500, // unificado
  opacity: 0.92,
};

const listWrap: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const card: React.CSSProperties = {
  padding: "16px 16px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.14)",
  boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
};

const itemTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  fontWeight: 500, // unificado
  opacity: 0.96,
};

const itemTs: React.CSSProperties = {
  marginTop: 6,
  marginBottom: 0,
  fontSize: 12,
  opacity: 0.78,
  fontWeight: 500,
};

const actionsGrid: React.CSSProperties = {
  marginTop: 18,
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 12,
};

const btnBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px 16px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.20)",
  textDecoration: "none",
  fontWeight: 650,
  fontSize: 15,
  color: "rgba(255,255,255,0.96)",
  boxShadow: "0 10px 26px rgba(0,0,0,0.20)",
  textAlign: "center",
};

const btnHistQuiero: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(70,120,255,0.55), rgba(40,80,220,0.45))",
};

const btnHistHI: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(30,180,120,0.65), rgba(20,140,95,0.55))",
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(240,170,70,0.65), rgba(200,130,40,0.40))",
};

const btnSecondary: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.10))",
};

/* =========================
   Page
========================= */
export default function QuieroHistorialPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [quiero, setQuiero] = useState<Quiero | null>(null);

  // Historial MOCK por ahora (hasta que definamos tabla real). Mantiene el diseño.
  const [historial, setHistorial] = useState<HistItem[]>([]);

  useEffect(() => {
    let cancel = false;

    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);

        if (!id) {
          setErrorMsg("No encontramos el Quiero.");
          setQuiero(null);
          setHistorial([]);
          return;
        }

        const { data, error } = await supabase
          .from("quieros")
          .select("id,title,created_at,due_date,status")
          .eq("id", id)
          .maybeSingle();

        if (cancel) return;

        if (error || !data) {
          setErrorMsg("No pudimos cargar este Quiero. Volvé e intentá nuevamente.");
          setQuiero(null);
          setHistorial([]);
          return;
        }

        // Objeto seguro (ya no trabajamos con `data` fuera del narrowing)
        const q: Quiero = {
          id: data.id,
          title: data.title ?? null,
          created_at: data.created_at ?? null,
          due_date: data.due_date ?? null,
          status: data.status ?? null,
        };

        setQuiero(q);

        const now = new Date().toISOString();
        const createdISO = q.created_at ?? now;

        const dueRaw = q.due_date ? String(q.due_date) : null;
        const due = dueRaw ? dueRaw.slice(0, 10) : null;

        const p = plazoFromCreatedAtAndDueDate(createdISO, due);
        const horizonte = due
          ? `${labelPlazo(p)} · ${formatFechaCorta(due)}`
          : `${labelPlazo(p)} · sin fecha definida`;

        // Historial (visualización/reflexión)
        setHistorial([
          { title: `Se creó el Quiero · ${horizonte}`, tsISO: createdISO },
          { title: "Se revisó el horizonte", tsISO: now },
        ]);
      } catch {
        if (!cancel) {
          setErrorMsg("Ocurrió un error inesperado al cargar.");
          setQuiero(null);
          setHistorial([]);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    load();
    return () => {
      cancel = true;
    };
  }, [supabase, id]);

  const titulo = safeText(quiero?.title) || "Quiero sin título";

  return (
    <main style={{ position: "relative", minHeight: "100vh" }}>
      <div aria-hidden style={bgLayer} />
      <div aria-hidden style={overlayLayer} />

      <div style={pageWrap}>
        <section style={glassPanel}>
          {/* TÍTULO FUERA del banner (pedido) */}
          <h2 style={pageTitle}>Consulta de tu quiero</h2>

          {loading ? (
            <div style={{ fontSize: 16, opacity: 0.9 }}>Cargando…</div>
          ) : errorMsg ? (
            <div style={{ fontSize: 16, opacity: 0.95 }}>
              {errorMsg}
              <div style={{ marginTop: 14 }}>
                <Link href="/quieros" style={btnSecondary}>
                  Volver a Mis Quieros
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Banner SOLO con el título del Quiero (sin plazo ahí) */}
              <div style={headerBox}>
                <h1 style={titleStyle}>{titulo}</h1>
              </div>

              <div style={sectionTitle}>Historial</div>

              <div style={listWrap}>
                {historial.length === 0 ? (
                  <div style={card}>
                    <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>
                      Todavía no hay movimientos registrados para este Quiero.
                    </p>
                  </div>
                ) : (
                  historial
                    .slice()
                    .sort((a, b) => (a.tsISO < b.tsISO ? 1 : -1))
                    .map((it, idx) => (
                      <div key={`${it.tsISO}-${idx}`} style={card}>
                        <p style={itemTitle}>{it.title}</p>
                        <p style={itemTs}>{formatFechaHora(it.tsISO)}</p>
                      </div>
                    ))
                )}
              </div>

              {/* 4 botones mismo ancho, un poquito más grandes, mismo orden */}
              <div style={actionsGrid}>
                <Link href={`/quieros/${id}/historial0`} style={btnHistQuiero}>
                  Historial del Quiero
                </Link>

                <Link href={`/quieros/${id}/historial1`} style={btnHistHI}>
                  Historial de habilitantes e inhabilitantes
                </Link>

                <Link href={`/quieros/${id}/edit`} style={btnPrimary}>
                  Modificar Quiero
                </Link>

                <Link href="/quieros" style={btnSecondary}>
                  Volver a Mis Quieros
                </Link>
              </div>

              <style jsx>{`
                @media (max-width: 980px) {
                  section {
                    padding: 26px !important;
                  }
                  h1 {
                    font-size: 34px !important;
                  }
                  h2 {
                    font-size: 26px !important;
                  }
                  div[style*="grid-template-columns: repeat(4"] {
                    grid-template-columns: 1fr !important;
                  }
                }
              `}</style>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Plazo = "corto" | "mediano" | "largo";

type Quiero = {
  id: string;
  title: string | null;
  purpose: string | null;
  domain: string | null;
  status: string | null;
  priority: number | null;
  created_at: string | null;
  due_date: string | null; // YYYY-MM-DD o ISO (si llega con hora, cortamos)
};

/* =========================
   Helpers
========================= */
function safeText(v?: string | null) {
  return (v ?? "").toString().trim();
}

function diffDays(fromISO: string, toYYYYMMDD: string) {
  const from = new Date(fromISO);
  const to = new Date(toYYYYMMDD + "T00:00:00");
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function plazoFromCreatedAtAndDueDate(createdAtISO?: string | null, dueDateYYYYMMDD?: string | null): Plazo {
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

function buildHorizonte(q: Quiero) {
  const created = q.created_at ?? null;
  const dueRaw = q.due_date ? String(q.due_date) : null;
  const due = dueRaw ? dueRaw.slice(0, 10) : null;

  const p = plazoFromCreatedAtAndDueDate(created, due);
  if (due) return `${labelPlazo(p)} · ${due}`;
  return `${labelPlazo(p)} · sin fecha definida`;
}

/* =========================
   Estética base (glass + fondo)
   Criterios generales (tipografía + fondo)
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
  background: "linear-gradient(rgba(0,0,0,0.10), rgba(0,0,0,0.12))",
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

const glassCard: React.CSSProperties = {
  width: "min(1320px, 100%)",
  borderRadius: 26,
  padding: 30,
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.16)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  boxShadow: "0 18px 60px rgba(0,0,0,0.23)",
  color: "rgba(255,255,255,0.94)",
  textShadow: "0 1px 2px rgba(0,0,0,0.38)",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 52,
  lineHeight: 1.05,
  fontWeight: 500, // criterio general: no negrita exagerada
};

const subtitleStyle: React.CSSProperties = {
  marginTop: 14,
  marginBottom: 0,
  fontSize: 22,
  opacity: 0.96,
  lineHeight: 1.35,
  maxWidth: 860,
  fontWeight: 400,
};

const actionsWrap: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

/* Botones grandes (Inicio / Nuevo Quiero) */
const btnBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "18px 20px",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.22)",
  color: "rgba(255,255,255,0.96)",
  textDecoration: "none",
  fontWeight: 850,
  fontSize: 20,
  textShadow: "0 1px 2px rgba(0,0,0,0.35)",
  boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
};

const btnSecondary: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.10))",
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(70,120,255,0.55), rgba(40,80,220,0.45))",
};

const topToolsRow: React.CSSProperties = {
  marginTop: 18,
  display: "flex",
  gap: 12,
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
};

const inputStyle: React.CSSProperties = {
  width: "min(520px, 100%)",
  padding: "14px 14px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.16)",
  color: "rgba(255,255,255,0.96)",
  outline: "none",
  fontSize: 16,
};

const chipsWrap: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const chip: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.10)",
  fontSize: 13,
  fontWeight: 850,
  opacity: 0.92,
};

const divider: React.CSSProperties = {
  marginTop: 18,
  height: 1,
  background: "rgba(255,255,255,0.14)",
};

const listWrap: React.CSSProperties = {
  display: "grid",
  gap: 12,
  marginTop: 18,
};

const itemRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  padding: "18px 18px",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.14)",
  color: "rgba(255,255,255,0.94)",
  textDecoration: "none",
  boxShadow: "0 10px 26px rgba(0,0,0,0.18)",
};

const itemTitle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 500, // criterio general: título NO en negrita
  lineHeight: 1.15,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const emptyBox: React.CSSProperties = {
  marginTop: 18,
  padding: 18,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.14)",
  boxShadow: "0 10px 26px rgba(0,0,0,0.18)",
};

const emptyTitle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 950,
  margin: 0,
};

const emptyText: React.CSSProperties = {
  marginTop: 10,
  marginBottom: 0,
  fontSize: 16,
  opacity: 0.85,
  lineHeight: 1.4,
};

/* =========================
   Page
========================= */
export default function QuierosListadoPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [items, setItems] = useState<Quiero[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancel = false;

    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);

        let data: any[] | null = null;
        let err: any = null;

        const r1 = await supabase
          .from("quieros")
          .select("id,title,purpose,domain,status,priority,created_at,due_date")
          .order("created_at", { ascending: false });

        data = r1.data as any[] | null;
        err = r1.error;

        if (err) {
          const r2 = await supabase
            .from("quieros")
            .select("id,title,purpose,domain,status,priority,created_at")
            .order("created_at", { ascending: false });

          data = r2.data as any[] | null;
          err = r2.error;
        }

        if (cancel) return;

        if (err) {
          setErrorMsg("No pudimos cargar tus Quieros. Intentá nuevamente.");
          setItems([]);
          return;
        }

        const normalized = ((data ?? []) as any[]).map((x) => ({
          id: x.id,
          title: x.title ?? null,
          purpose: x.purpose ?? null,
          domain: x.domain ?? null,
          status: x.status ?? null,
          priority: x.priority ?? null,
          created_at: x.created_at ?? null,
          due_date: x.due_date ?? null,
        })) as Quiero[];

        setItems(normalized.filter(Boolean));
      } catch {
        if (!cancel) {
          setErrorMsg("Ocurrió un error inesperado al cargar.");
          setItems([]);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    load();
    return () => {
      cancel = true;
    };
  }, [supabase]);

  const total = items.length;

  const filtered = useMemo(() => {
    const q = safeText(query).toLowerCase();
    if (!q) return items;

    return items.filter((it) => {
      const t = safeText(it.title).toLowerCase();
      const p = safeText(it.purpose).toLowerCase();
      const d = safeText(it.domain).toLowerCase();
      const s = safeText(it.status).toLowerCase();
      return t.includes(q) || p.includes(q) || d.includes(q) || s.includes(q);
    });
  }, [items, query]);

  const shown = filtered.length;

  return (
    <main style={{ minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      <div aria-hidden style={bgLayer} />
      <div aria-hidden style={overlayLayer} />

      <div style={pageWrap}>
        <section style={glassCard}>
          <div style={headerRow}>
            <div style={{ minWidth: 0 }}>
              <h1 style={titleStyle}>Mis Quieros</h1>
              <p style={subtitleStyle}>
                Elegí con cuál seguir hoy, o creá uno nuevo. Este listado es tu punto de retorno.
              </p>
            </div>

            <div style={actionsWrap}>
              <Link href="/quieros/inicio" style={btnSecondary}>
                Inicio
              </Link>
              <Link href="/quieros/nuevo" style={btnPrimary}>
                + Nuevo Quiero
              </Link>
            </div>
          </div>

          <div style={topToolsRow}>
            <input
              style={inputStyle}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título, propósito, ámbito o estado…"
              aria-label="Buscar Quieros"
            />

            <div style={chipsWrap}>
              <span style={chip}>Total: {total}</span>
              <span style={chip}>Mostrando: {shown}</span>
            </div>
          </div>

          <div style={divider} />

          {loading ? (
            <div style={{ marginTop: 18, fontSize: 16, opacity: 0.85 }}>Cargando…</div>
          ) : errorMsg ? (
            <div style={{ marginTop: 18, fontSize: 16, opacity: 0.92 }}>{errorMsg}</div>
          ) : total === 0 ? (
            <div style={emptyBox}>
              <h2 style={emptyTitle}>Todavía no tenés Quieros</h2>
              <p style={emptyText}>
                Creá tu primer Quiero para comenzar. No hace falta que esté perfecto: alcanza con que sea honesto.
              </p>
              <div style={{ marginTop: 16 }}>
                <Link href="/quieros/nuevo" style={btnPrimary}>
                  + Crear mi primer Quiero
                </Link>
              </div>
            </div>
          ) : shown === 0 ? (
            <div style={emptyBox}>
              <h2 style={emptyTitle}>No encontramos coincidencias</h2>
              <p style={emptyText}>Probá con otra palabra o borrá el texto de búsqueda.</p>
              <div style={{ marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  style={{ ...btnSecondary, cursor: "pointer", fontWeight: 950 }}
                >
                  Limpiar búsqueda
                </button>
              </div>
            </div>
          ) : (
            <div style={listWrap}>
              {filtered.map((q) => {
                const titulo = safeText(q.title) || "Quiero sin título";

                // Se calcula pero NO se muestra (experiencia libre / solo títulos)
                void buildHorizonte(q);

                return (
                  <Link
                    key={q.id}
                    href={`/quieros/${q.id}/historial`}
                    style={itemRow}
                    title="Abrir historial del Quiero"
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={itemTitle}>{titulo}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <style jsx>{`
            @media (max-width: 980px) {
              h1 {
                font-size: 40px !important;
              }
            }
          `}</style>
        </section>
      </div>
    </main>
  );
}

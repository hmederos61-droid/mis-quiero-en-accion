"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   Estética CANÓNICA (historial)
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
  fontWeight: 500,
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
  fontSize: 34,
  lineHeight: 1.06,
  fontWeight: 500,
  letterSpacing: 0.2,
  opacity: 0.96,
};

const subtitleStyle: React.CSSProperties = {
  marginTop: 10,
  marginBottom: 0,
  fontSize: 14,
  opacity: 0.82,
  fontWeight: 500,
};

const divider: React.CSSProperties = {
  height: 1,
  background: "rgba(255,255,255,0.12)",
  marginTop: 14,
  marginBottom: 12,
};

const sectionTitle: React.CSSProperties = {
  marginTop: 18,
  marginBottom: 10,
  fontSize: 18,
  fontWeight: 500,
  opacity: 0.92,
};

const itemCard: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.12)",
  padding: 18,
  display: "grid",
  gap: 12,
  overflow: "hidden",
  boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
};

const fieldLabel: React.CSSProperties = {
  fontSize: 14,
  opacity: 0.92,
  marginBottom: 6,
  fontWeight: 500,
};

const boxBase: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.10)",
  color: "rgba(255,255,255,0.96)",
  outline: "none",
  fontSize: 15,
  display: "block",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  lineHeight: 1.25,
};

const metaLabelStyle: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.78,
  marginBottom: 6,
  fontWeight: 500,
};

const metaBoxStyle: React.CSSProperties = {
  ...boxBase,
  fontSize: 13,
  padding: "10px 12px",
  opacity: 0.96,
};

const metaBoxFechaResaltada: React.CSSProperties = {
  ...metaBoxStyle,
  border: "1px solid rgba(255,255,255,0.28)",
  background: "rgba(255,255,255,0.085)",
  boxShadow: "0 10px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.10)",
};

const badgeBase: React.CSSProperties = {
  fontSize: 12,
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.90)",
  whiteSpace: "nowrap",
  opacity: 0.95,
  fontWeight: 500,
};

const badgeHab: React.CSSProperties = {
  ...badgeBase,
  background: "linear-gradient(135deg, rgba(30,180,120,0.20), rgba(0,0,0,0.08))",
};

const badgeInh: React.CSSProperties = {
  ...badgeBase,
  background: "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(0,0,0,0.08))",
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
  cursor: "pointer",
};

const btnGreen: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(30,180,120,0.65), rgba(20,140,95,0.55))",
};

const btnViolet: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(168,85,247,0.55), rgba(99,102,241,0.45))",
};

const btnBlue: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(70,120,255,0.55), rgba(40,80,220,0.45))",
};

const btnGray: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.10))",
};

/* =========================
   Tipos (DB existente)
========================= */
type ActionDB = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  quiero_id: string | null;

  title: string;
  tipo: string;
  ambito: string;
  estado_item: string;

  due_date: string | null;
  is_done: boolean | null;
  otros_detalle: string | null;
};

function safeText(v?: string | null) {
  return (v ?? "").toString().trim();
}

function formatFechaHora(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function formatFechaSoloDia(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

function formatBool(v: boolean | null) {
  if (v === null || v === undefined) return "—";
  return v ? "Sí" : "No";
}

function norm(s: string | null | undefined) {
  return (s ?? "").trim().toLowerCase();
}

export default function Historial1Page() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const params = useParams() as { id?: string | string[] };
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ActionDB[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;

    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);

        if (!id) {
          if (!cancel) {
            setItems([]);
            setLoading(false);
          }
          return;
        }

        // Orden por actualizado: MÁS ANTIGUA PRIMERO
        const { data, error } = await supabase
          .from("actions")
          .select(
            "id,created_at,updated_at,user_id,quiero_id,title,tipo,ambito,estado_item,due_date,is_done,otros_detalle"
          )
          .eq("quiero_id", id)
          .order("updated_at", { ascending: true });

        if (cancel) return;

        if (error) {
          setItems([]);
          setErrorMsg(error.message ?? "Error al cargar habilitantes/inhabilitantes.");
          setLoading(false);
          return;
        }

        setItems((data as ActionDB[]) ?? []);
        setLoading(false);
      } catch {
        if (!cancel) {
          setItems([]);
          setErrorMsg("Ocurrió un error inesperado al cargar.");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancel = true;
    };
  }, [id, supabase]);

  const habilitantes = items.filter((a) => norm(a.tipo) === "habilitante");
  const inhabilitantes = items.filter((a) => norm(a.tipo) === "inhabilitante");

  function Seccion({
    titulo,
    lista,
    kind,
  }: {
    titulo: string;
    lista: ActionDB[];
    kind: "habilitantes" | "inhabilitantes";
  }) {
    if (lista.length === 0) {
      return (
        <div style={{ ...itemCard, gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={kind === "habilitantes" ? badgeHab : badgeInh}>
              {kind === "habilitantes" ? "habilitantes" : "inhabilitantes"}
            </span>
            <div style={{ fontSize: 15, fontWeight: 500, opacity: 0.92 }}>{titulo}</div>
          </div>
          <div style={{ fontSize: 14, opacity: 0.86 }}>
            Todavía no hay elementos registrados en esta sección.
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={kind === "habilitantes" ? badgeHab : badgeInh}>
            {kind === "habilitantes" ? "habilitantes" : "inhabilitantes"}
          </span>
          <div style={{ fontSize: 15, fontWeight: 500, opacity: 0.92 }}>{titulo}</div>
        </div>

        {lista.map((a) => (
          <div key={a.id} style={itemCard}>
            <div>
              <div style={fieldLabel}>Título</div>
              <div style={boxBase}>{safeText(a.title) || "—"}</div>
            </div>

            {safeText(a.otros_detalle) ? (
              <div>
                <div style={fieldLabel}>Detalle</div>
                <div style={{ ...boxBase, minHeight: 80 }}>{safeText(a.otros_detalle)}</div>
              </div>
            ) : null}

            <div
              className="metaGrid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <div>
                <div style={metaLabelStyle}>Ámbito</div>
                <div style={metaBoxStyle}>{safeText(a.ambito) || "—"}</div>
              </div>

              <div>
                <div style={metaLabelStyle}>Estado</div>
                <div style={metaBoxStyle}>{safeText(a.estado_item) || "—"}</div>
              </div>

              <div>
                <div style={metaLabelStyle}>Hecho</div>
                <div style={metaBoxStyle}>{formatBool(a.is_done)}</div>
              </div>

              <div>
                <div style={metaLabelStyle}>Fecha objetivo</div>
                <div style={metaBoxFechaResaltada}>
                  {a.due_date ? formatFechaSoloDia(a.due_date) : "—"}
                </div>
              </div>

              <div>
                <div style={metaLabelStyle}>Creado</div>
                <div style={metaBoxStyle}>{formatFechaHora(a.created_at)}</div>
              </div>

              <div>
                <div style={metaLabelStyle}>Actualizado</div>
                <div style={metaBoxStyle}>{formatFechaHora(a.updated_at)}</div>
              </div>
            </div>

            <style jsx>{`
              @media (max-width: 980px) {
                .metaGrid {
                  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                }
              }
              @media (max-width: 640px) {
                .metaGrid {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>
          </div>
        ))}
      </div>
    );
  }

  return (
    <main style={{ position: "relative", minHeight: "100vh" }}>
      <div aria-hidden style={bgLayer} />
      <div aria-hidden style={overlayLayer} />

      <div style={pageWrap}>
        <section style={glassPanel} className="panelMQA">
          <h2 style={pageTitle}>Historial de habilitantes e inhabilitantes</h2>

          {loading ? (
            <div style={{ fontSize: 16, opacity: 0.9 }}>Cargando…</div>
          ) : errorMsg ? (
            <div style={{ fontSize: 16, opacity: 0.95 }}>
              {errorMsg}
              <div style={{ marginTop: 14 }}>
                <button type="button" style={btnGray} onClick={() => router.push("/quieros")}>
                  Volver a Mis Quieros
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={headerBox}>
                <h1 style={titleStyle}>Habilitantes e inhabilitantes</h1>
                <p style={subtitleStyle}>Tomate tu tiempo para revisar estos puntos.</p>
              </div>

              <div style={divider} />

              {items.length === 0 ? (
                <div style={itemCard}>
                  <div style={{ fontSize: 14, opacity: 0.9 }}>
                    Todavía no hay habilitantes o inhabilitantes cargados para este Quiero.
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 18 }}>
                  <Seccion titulo="Habilitantes" lista={habilitantes} kind="habilitantes" />
                  <Seccion titulo="Inhabilitantes" lista={inhabilitantes} kind="inhabilitantes" />
                </div>
              )}

              <div style={divider} />

              <div style={actionsGrid} className="actionsGrid">
                <button
                  type="button"
                  style={btnGreen}
                  onClick={() => router.push(`/quieros/${id}/actions`)}
                >
                  Ir a modificar habilitantes e inhabilitantes
                </button>

                <button
                  type="button"
                  style={btnViolet}
                  onClick={() => router.push(`/quieros/${id}/historial0`)}
                >
                  Volver al Quiero
                </button>

                <button
                  type="button"
                  style={btnBlue}
                  onClick={() => router.push(`/quieros/${id}/historial`)}
                >
                  Volver al historial general
                </button>

                <button type="button" style={btnGray} onClick={() => router.push("/quieros")}>
                  Volver a la lista
                </button>
              </div>

              <style jsx>{`
                @media (max-width: 980px) {
                  .panelMQA {
                    padding: 26px !important;
                  }
                  .actionsGrid {
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

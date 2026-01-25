"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   Estética glass ORIGINAL
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
  display: "flex",
  alignItems: "center",
};

const textWrapBox: React.CSSProperties = {
  ...inputStyle,
  display: "block",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  lineHeight: 1.25,
};

/* =========================
   Segunda línea (25% más chica)
========================= */
const metaLabelStyle: React.CSSProperties = {
  fontSize: 20,
  opacity: 0.95,
  marginBottom: 8,
};

const metaBoxStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 14px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.10)",
  color: "rgba(255,255,255,0.96)",
  outline: "none",
  fontSize: 16.5,
  display: "block",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  lineHeight: 1.25,
};

const metaBoxFechaResaltada: React.CSSProperties = {
  ...metaBoxStyle,
  border: "3px solid rgba(255,255,255,0.42)", // ✅ borde más gruesito
  background: "rgba(255,255,255,0.085)", // ✅ un poco más claro
  boxShadow:
    "0 10px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.12)", // ✅ relieve
};

/* =========================
   Títulos de secciones con color (sin “dashboard”)
========================= */
const sectionTitleBase: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 650,
  opacity: 0.98,
  padding: "10px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.10)",
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
};

const sectionHabilitantes: React.CSSProperties = {
  ...sectionTitleBase,
  color: "rgba(230,255,245,0.98)",
  background:
    "linear-gradient(135deg, rgba(30,180,120,0.20), rgba(0,0,0,0.10))",
};

const sectionInhabilitantes: React.CSSProperties = {
  ...sectionTitleBase,
  color: "rgba(255,245,235,0.98)",
  background:
    "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(0,0,0,0.10))",
};

/* =========================
   Botones (mismos que Historial0)
========================= */
const btnBase: React.CSSProperties = {
  width: "100%",
  padding: "20px 18px",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.22)",
  cursor: "pointer",
  fontWeight: 850,
  fontSize: 24,
  color: "rgba(255,255,255,0.96)",
};

const btnPrimario = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(30,180,120,0.65), rgba(20,140,95,0.55))",
};

const btnVioleta = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(168,85,247,0.55), rgba(99,102,241,0.45))",
};

const btnAzul = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(70,120,255,0.55), rgba(40,80,220,0.45))",
};

const btnNeutro = {
  ...btnBase,
  background: "rgba(0,0,0,0.16)",
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

function formatFechaHora(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString() + " " + d.toLocaleTimeString();
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
    async function load() {
      setLoading(true);
      setErrorMsg(null);

      if (!id) {
        setItems([]);
        setLoading(false);
        return;
      }

      // ✅ Orden por actualizado: MÁS ANTIGUA PRIMERO
      const { data, error } = await supabase
        .from("actions")
        .select(
          "id,created_at,updated_at,user_id,quiero_id,title,tipo,ambito,estado_item,due_date,is_done,otros_detalle"
        )
        .eq("quiero_id", id)
        .order("updated_at", { ascending: true });

      if (error) {
        setItems([]);
        setErrorMsg(error.message ?? "Error al cargar habilitantes/inhabilitantes.");
        setLoading(false);
        return;
      }

      setItems((data as ActionDB[]) ?? []);
      setLoading(false);
    }

    load();
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
    if (lista.length === 0) return null;

    const titleStyle =
      kind === "habilitantes" ? sectionHabilitantes : sectionInhabilitantes;

    return (
      <div style={{ display: "grid", gap: 18 }}>
        <div style={titleStyle}>{titulo}</div>

        {lista.map((a) => (
          <div
            key={a.id}
            style={{
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(0,0,0,0.12)",
              padding: 18,
              display: "grid",
              gap: 14,
              overflow: "hidden",
            }}
          >
            <div>
              <div style={labelStyle}>Título</div>
              <div style={textWrapBox}>{a.title || "—"}</div>
            </div>

            {a.otros_detalle ? (
              <div>
                <div style={labelStyle}>Detalle</div>
                <div style={{ ...textWrapBox, minHeight: 110 }}>
                  {a.otros_detalle}
                </div>
              </div>
            ) : null}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                gap: 18,
              }}
            >
              <div>
                <div style={metaLabelStyle}>Ámbito</div>
                <div style={metaBoxStyle}>{a.ambito || "—"}</div>
              </div>

              <div>
                <div style={metaLabelStyle}>Estado</div>
                <div style={metaBoxStyle}>{a.estado_item || "—"}</div>
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
          </div>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", position: "relative" }}>
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundImage: `url("/welcome.png")`,
            backgroundSize: "cover",
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
          <section style={{ width: "min(1584px, 100%)" }}>
            <div style={glassCard}>
              <h1 style={{ fontSize: 60, marginBottom: 20 }}>
                Habilitantes e inhabilitantes
              </h1>
              <div style={{ fontSize: 24, opacity: 0.9 }}>Cargando…</div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", position: "relative" }}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `url("/welcome.png")`,
          backgroundSize: "cover",
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
        <section style={{ width: "min(1584px, 100%)" }}>
          <div style={glassCard}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 20,
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <h1 style={{ fontSize: 60, margin: 0 }}>
                Habilitantes e inhabilitantes
              </h1>
              <div style={{ fontSize: 22, opacity: 0.92 }}>
                Tomate tu tiempo para revisar estos puntos
              </div>
            </div>

            {errorMsg ? (
              <div style={{ ...textWrapBox, background: "rgba(120,0,0,0.18)" }}>
                {errorMsg}
              </div>
            ) : null}

            <div style={{ display: "grid", gap: 28 }}>
              {items.length === 0 ? (
                <div>
                  <div style={labelStyle}>Listado</div>
                  <div style={textWrapBox}>
                    Todavía no hay habilitantes o inhabilitantes cargados para este Quiero.
                  </div>
                </div>
              ) : (
                <>
                  <Seccion
                    titulo="Habilitantes"
                    lista={habilitantes}
                    kind="habilitantes"
                  />
                  <Seccion
                    titulo="Inhabilitantes"
                    lista={inhabilitantes}
                    kind="inhabilitantes"
                  />
                </>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 18,
                  marginTop: 10,
                }}
              >
                <button
                  type="button"
                  style={btnPrimario}
                  onClick={() => router.push(`/quieros/${id}/actions`)}
                >
                  Ir a modificar habilitantes e inhabilitantes
                </button>

                <button
                  type="button"
                  style={btnVioleta}
                  onClick={() => router.push(`/quieros/${id}/historial0`)}
                >
                  Volver al Quiero
                </button>

                <button
                  type="button"
                  style={btnAzul}
                  onClick={() => router.push(`/quieros/${id}/historial`)}
                >
                  Volver al historial general
                </button>

                <button
                  type="button"
                  style={btnNeutro}
                  onClick={() => router.push("/quieros")}
                >
                  Volver a la lista
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

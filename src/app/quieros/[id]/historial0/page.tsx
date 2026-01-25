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

type EstadoQuiero =
  | "activo"
  | "cumplido"
  | "pausado"
  | "no_relevante"
  | "reformulado";

type QuieroDB = {
  title: string | null;
  purpose: string | null;
  status: EstadoQuiero | null;
  priority: number | null;
  due_date: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function formatFechaHora(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString();
}

export default function Historial0QuieroPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const params = useParams() as { id?: string | string[] };
  const id = Array.isArray(params?.id) ? params.id[0] : params.id;

  const [q, setQ] = useState<QuieroDB | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;

      const { data } = await supabase
        .from("quieros")
        .select("title,purpose,status,priority,due_date,created_at,updated_at")
        .eq("id", id)
        .single();

      setQ(data as QuieroDB);
    }

    load();
  }, [id, supabase]);

  if (!q) return null;

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
                Historial del Quiero
              </h1>
              <div style={{ fontSize: 22, opacity: 0.92 }}>
                Tomate tu tiempo para reflexionar sobre este Quiero
              </div>
            </div>

            <div style={{ display: "grid", gap: 22 }}>
              <div>
                <div style={labelStyle}>Título</div>
                <div style={inputStyle}>{q.title}</div>
              </div>

              <div>
                <div style={labelStyle}>Propósito</div>
                <div style={{ ...inputStyle, minHeight: 110 }}>
                  {q.purpose}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 18,
                }}
              >
                <div>
                  <div style={labelStyle}>Estado</div>
                  <div style={inputStyle}>{q.status}</div>
                </div>

                <div>
                  <div style={labelStyle}>Prioridad</div>
                  <div style={inputStyle}>{q.priority}</div>
                </div>

                <div>
                  <div style={labelStyle}>Fecha objetivo</div>
                  <div style={inputStyle}>
                    {q.due_date?.slice(0, 10)}
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>Creado</div>
                  <div style={inputStyle}>
                    {formatFechaHora(q.created_at ?? "")}
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>Actualizado</div>
                  <div style={inputStyle}>
                    {formatFechaHora(q.updated_at ?? "")}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 18,
                  marginTop: 10,
                }}
              >
                <button
                  style={btnPrimario}
                  onClick={() => router.push(`/quieros/${id}/edit`)}
                >
                  Ir a modificar Quiero
                </button>

                <button
                  style={btnVioleta}
                  onClick={() =>
                    router.push(`/quieros/${id}/historial1`)
                  }
                >
                  Ir a ver habilitantes e inhabilitantes
                </button>

                <button
                  style={btnAzul}
                  onClick={() =>
                    router.push(`/quieros/${id}/historial`)
                  }
                >
                  Volver al historial general
                </button>

                <button
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

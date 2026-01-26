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
};

/* ===== SELECT con indicador ✓ ===== */
const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  paddingRight: 56,
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'><path d='M7 10l5 5 5-5z'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 18px center",
  backgroundSize: "18px",
};

const optionStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.92)",
  color: "rgba(255,255,255,0.96)",
};

const hintStyle: React.CSSProperties = {
  fontSize: 18,
  opacity: 0.92,
  marginTop: 10,
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

const btnGuardar = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(30,180,120,0.65), rgba(20,140,95,0.55))",
};

const btnCancelar = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(70,120,255,0.55), rgba(40,80,220,0.45))",
};

/* =========================
   Tipos
========================= */
type EstadoQuiero =
  | "activo"
  | "cumplido"
  | "pausado"
  | "no_relevante"
  | "reformulado";

type QuieroDB = {
  id: string;
  title: string | null;
  purpose: string | null;
  status: EstadoQuiero | null;
  priority: number | null;
  due_date: string | null;
};

/* =========================
   Página
========================= */
export default function EditQuieroPaso1Page() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const params = useParams() as { id?: string | string[] };

  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");

  const [status, setStatus] = useState<EstadoQuiero>("activo");
  const [priority, setPriority] = useState<number>(3);
  const [dueDate, setDueDate] = useState<string>("");

  const isReformulado = status === "reformulado";

  useEffect(() => {
    async function load() {
      if (!id) return;

      const { data } = await supabase
        .from("quieros")
        .select("title,purpose,status,priority,due_date")
        .eq("id", id)
        .single();

      const q = data as QuieroDB;

      setTitle(q?.title ?? "");
      setPurpose(q?.purpose ?? "");
      setStatus(q?.status ?? "activo");
      setPriority(q?.priority ?? 3);
      setDueDate(q?.due_date ? q.due_date.slice(0, 10) : "");

      setLoading(false);
    }

    load();
  }, [id, supabase]);

  useEffect(() => {
    if (status === "reformulado") {
      setPriority(5);
    }
  }, [status]);

  async function onGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;

    setSaving(true);

    await supabase
      .from("quieros")
      .update({
        status,
        priority,
        due_date: dueDate,
      })
      .eq("id", id);

    router.push(`/quieros/${id}/edit1`);
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
            <h1 style={{ fontSize: 60, marginBottom: 20 }}>
              Modificar tu Quiero
            </h1>

            <form onSubmit={onGuardar} style={{ display: "grid", gap: 22 }}>
              <div>
                <div style={labelStyle}>Título</div>
                <input style={inputStyle} value={title} disabled />
                <div style={hintStyle}>
                  El texto original del Quiero no se modifica.
                </div>
              </div>

              <div>
                <div style={labelStyle}>Propósito</div>
                <textarea
                  style={{ ...inputStyle, minHeight: 110 }}
                  value={purpose}
                  disabled
                />
                <div style={hintStyle}>
                  El propósito original no se modifica.
                </div>
              </div>

              <div>
                <div style={labelStyle}>Estado</div>
                <select
                  style={selectStyle}
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as EstadoQuiero)
                  }
                >
                  <option value="activo" style={optionStyle}>activo</option>
                  <option value="pausado" style={optionStyle}>pausado</option>
                  <option value="cumplido" style={optionStyle}>cumplido</option>
                  <option value="no_relevante" style={optionStyle}>no relevante</option>
                  <option value="reformulado" style={optionStyle}>reformulado</option>
                </select>
              </div>

              <div>
                <div style={labelStyle}>Prioridad</div>
                <select
                  style={selectStyle}
                  value={priority}
                  disabled={isReformulado}
                  onChange={(e) => setPriority(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n} style={optionStyle}>
                      {n}
                    </option>
                  ))}
                </select>
                {isReformulado && (
                  <div style={hintStyle}>
                    En un Quiero reformulado la prioridad se fija en 5.
                  </div>
                )}
              </div>

              <div>
                <div style={labelStyle}>Fecha objetivo</div>
                <input
                  type="date"
                  style={inputStyle}
                  value={dueDate}
                  disabled={isReformulado}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <button type="submit" style={btnGuardar} disabled={saving}>
                Guardar (ir al paso 2)
              </button>

              <button
                type="button"
                style={btnCancelar}
                onClick={() => router.push("/quieros")}
              >
                Cancelar
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

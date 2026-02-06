"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   QUIEROS / NUEVO
   ESCALA CANÓNICA — VALIDACIÓN + DATOS EN UNA FILA
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
  fontSize: 14,
  opacity: 0.95,
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.10)",
  color: "rgba(255,255,255,0.96)",
  outline: "none",
  fontSize: 15,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  paddingRight: 44,
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'><path d='M7 10l5 5 5-5z'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
  backgroundSize: "14px",
};

const optionStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.92)",
  color: "rgba(255,255,255,0.96)",
};

const btnBase: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.22)",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 16,
  color: "rgba(255,255,255,0.96)",
};

const btnGuardar: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(30,180,120,0.65), rgba(20,140,95,0.55))",
};

const btnCancelar: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(70,120,255,0.55), rgba(40,80,220,0.45))",
};

const msgStyle: React.CSSProperties = {
  fontSize: 14,
  marginBottom: 12,
  opacity: 0.96,
};

/* =========================
   DB
========================= */
const TABLE_QUIEROS = "quieros";

type EstadoQuiero =
  | "activo"
  | "cumplido"
  | "pausado"
  | "no_relevante"
  | "reformulado";

type Plazo = "corto" | "mediano" | "largo";

function toISODateOrNull(input: string) {
  if (!input) return null;
  const d = new Date(input + "T00:00:00.000Z");
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function NuevoQuieroPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [domain, setDomain] = useState("otros");
  const [status, setStatus] = useState<EstadoQuiero>("activo");
  const [priority, setPriority] = useState(3);
  const [term, setTerm] = useState<Plazo>("mediano");
  const [dueDate, setDueDate] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isReformulado = status === "reformulado";

  useEffect(() => {
    if (status === "reformulado") setPriority(5);
  }, [status]);

  async function onGuardar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    // Validación mínima
    if (!title.trim() || !dueDate) {
      setMsg("Ingresá los datos de tu Quiero.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from(TABLE_QUIEROS)
        .insert({
          title: title.trim(),
          titulo: title.trim(),
          purpose: purpose.trim() || null,
          domain,
          status,
          priority,
          term,
          due_date: toISODateOrNull(dueDate),
        })
        .select("id")
        .single();

      if (error || !data?.id) {
        setMsg("No se pudo guardar el Quiero. Intentá nuevamente.");
        return;
      }

      router.push(`/quieros/nuevo1?quiero=${encodeURIComponent(String(data.id))}`);
    } catch {
      setMsg("Ocurrió un error al guardar el Quiero.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 28,
        }}
      >
        <section style={{ ...glassCard, width: "min(980px, 100%)" }}>
          <h1 style={{ fontSize: 32, margin: 0 }}>Nuevo Quiero</h1>

          <form onSubmit={onGuardar} style={{ marginTop: 16 }}>
            {msg && <div style={msgStyle}>{msg}</div>}

            <div>
              <div style={labelStyle}>Título</div>
              <input
                style={inputStyle}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={labelStyle}>Propósito</div>
              <textarea
                style={{ ...inputStyle, minHeight: 90 }}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>

            {/* DATOS DEL QUIERO — UNA SOLA FILA */}
            <div
              className="datosQuieroGrid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 14,
                marginTop: 18,
              }}
            >
              <div>
                <div style={labelStyle}>Ámbito</div>
                <select
                  style={selectStyle}
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                >
                  <option value="otros" style={optionStyle}>otros</option>
                  <option value="salud" style={optionStyle}>salud</option>
                  <option value="trabajo" style={optionStyle}>trabajo</option>
                  <option value="finanzas" style={optionStyle}>finanzas</option>
                </select>
              </div>

              <div>
                <div style={labelStyle}>Estado</div>
                <select
                  style={selectStyle}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EstadoQuiero)}
                >
                  <option value="activo" style={optionStyle}>activo</option>
                  <option value="pausado" style={optionStyle}>pausado</option>
                  <option value="cumplido" style={optionStyle}>cumplido</option>
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
                  {[1, 2, 3, 4, 5].map((v) => (
                    <option key={v} value={v} style={optionStyle}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={labelStyle}>Plazo</div>
                <select
                  style={selectStyle}
                  value={term}
                  onChange={(e) => setTerm(e.target.value as Plazo)}
                >
                  <option value="corto" style={optionStyle}>corto</option>
                  <option value="mediano" style={optionStyle}>mediano</option>
                  <option value="largo" style={optionStyle}>largo</option>
                </select>
              </div>

              <div>
                <div style={labelStyle}>Fecha de realización</div>
                <input
                  type="date"
                  style={inputStyle}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
              <button type="submit" style={btnGuardar} disabled={loading}>
                Guardar
              </button>

              <button
                type="button"
                style={btnCancelar}
                onClick={() => router.push("/quieros")}
              >
                Cancelar
              </button>
            </div>
          </form>

          {/* Responsive */}
          <style jsx>{`
            @media (max-width: 1200px) {
              .datosQuieroGrid {
                grid-template-columns: repeat(3, 1fr);
              }
            }
            @media (max-width: 980px) {
              .datosQuieroGrid {
                grid-template-columns: 1fr;
              }
            }
          `}</style>
        </section>
      </div>
    </main>
  );
}

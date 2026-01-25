"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   Estética glass ORIGINAL (alineada a login)
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

const btnBase: React.CSSProperties = {
  width: "100%",
  padding: "20px 18px",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.22)",
  cursor: "pointer",
  fontWeight: 850,
  fontSize: 24,
  color: "rgba(255,255,255,0.96)",
  textShadow: "0 1px 2px rgba(0,0,0,0.35)",
};

const btnGuardar: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(30,180,120,0.65), rgba(20,140,95,0.55))",
};

const btnCancelar: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(70,120,255,0.55), rgba(40,80,220,0.45))",
};

const hintStyle: React.CSSProperties = {
  fontSize: 18,
  opacity: 0.92,
  marginTop: 10,
};

const msgBox: React.CSSProperties = {
  fontSize: 20,
  marginTop: 14,
  opacity: 0.96,
};

const divider: React.CSSProperties = {
  marginTop: 24,
  marginBottom: 8,
  height: 1,
  background: "rgba(255,255,255,0.14)",
};

/* =========================
   DB (mínimo y seguro)
   Nota: mandamos title y también titulo (si existe),
   sin inventar columnas nuevas.
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
  // input viene como YYYY-MM-DD
  const d = new Date(input + "T00:00:00.000Z");
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function humanizeSaveError(raw: string) {
  const s = (raw || "").toLowerCase();

  if (s.includes("row-level security") || s.includes("rls")) {
    return "No pudimos guardar por permisos (RLS). Verificá que estés logueado y que las políticas permitan insertar tu propio Quiero.";
  }

  if (s.includes("violates not-null") && s.includes("titulo")) {
    return "La base exige el campo 'titulo'. Ya estamos enviándolo; si persiste, revisamos constraints/políticas.";
  }

  return raw || "No se pudo guardar el Quiero.";
}

export default function NuevoQuieroPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");

  const [domain, setDomain] = useState<string>("otros");
  const [status, setStatus] = useState<EstadoQuiero>("activo");
  const [priority, setPriority] = useState<number>(3);
  const [term, setTerm] = useState<Plazo>("mediano");

  const [dueDate, setDueDate] = useState<string>("");

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isReformulado = status === "reformulado";

  // Regla tipo EDIT: si es reformulado, prioridad fija en 5
  useEffect(() => {
    if (status === "reformulado") {
      setPriority(5);
    }
  }, [status]);

  const titleOK = title.trim().length > 0;
  const dueOK = !!dueDate;
  const canSave = titleOK && dueOK && !loading;

  async function onGuardar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!titleOK) {
      setMsg("Completá el título.");
      return;
    }
    if (!dueOK) {
      setMsg("Completá la fecha objetivo (obligatoria).");
      return;
    }

    try {
      setLoading(true);

      // Feedback inmediato (UX): el usuario entiende que está guardando.
      setMsg("Guardando tu Quiero…");

      // Nos aseguramos de tener sesión (si falla, igual seguirá y mostrará error)
      await supabase.auth.getUser().catch(() => null);

      const payload: Record<string, any> = {
        // Columna “nueva” (inglés)
        title: title.trim(),

        // Columna “vieja” (español) si existe; si no existe, Postgres lo reportaría.
        // En tu caso existe, y antes era NOT NULL: esto evita futuros choques.
        titulo: title.trim(),

        purpose: purpose.trim() || null,
        domain: domain || null,
        status,
        priority,
        term,
        due_date: toISODateOrNull(dueDate),
      };

      const { data, error } = await supabase
        .from(TABLE_QUIEROS)
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        setMsg(humanizeSaveError(error.message));
        return;
      }

      const newId = data?.id ? encodeURIComponent(String(data.id)) : "";
      router.push(`/quieros/nuevo1?quiero=${newId}`);
    } catch (e: any) {
      setMsg(humanizeSaveError(e?.message));
    } finally {
      setLoading(false);
    }
  }

  function onCancelar() {
    router.push("/quieros");
  }

  return (
    <main style={{ minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      {/* Fondo (idéntico al login) */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `url("/welcome.png")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: "linear-gradient(rgba(0,0,0,0.10), rgba(0,0,0,0.12))",
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 28,
        }}
      >
        <section
          style={{
            width: "min(1584px, 100%)",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 18,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              ...glassCard,
              opacity: loading ? 0.96 : 1,
              transition: "opacity 120ms ease",
            }}
          >
            {/* Encabezado */}
            <h1 style={{ fontSize: 60, margin: 0, lineHeight: 1.05 }}>
              Nuevo Quiero
            </h1>

            <p
              style={{
                fontSize: 26,
                lineHeight: 1.35,
                marginTop: 18,
                marginBottom: 18,
                opacity: 0.96,
              }}
            >
              Paso 1 de 2: definí tu Quiero. Al guardar, pasás a habilitantes e inhabilitantes.
            </p>

            {msg && <div style={msgBox}>{msg}</div>}

            <form style={{ display: "grid", gap: 22, marginTop: 10 }} onSubmit={onGuardar}>
              {/* Núcleo: Título + Propósito */}
              <div>
                <div style={labelStyle}>Título</div>
                <input
                  style={inputStyle}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Escribí el nombre de tu Quiero…"
                  disabled={loading}
                />
                <div style={hintStyle}>
                  Poné un título simple y honesto. Si después querés afinarlo, lo hacemos con el proceso.
                </div>
              </div>

              <div>
                <div style={labelStyle}>Propósito</div>
                <textarea
                  style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="¿Para qué es importante esto para vos?"
                  disabled={loading}
                />
                <div style={hintStyle}>
                  Si no te sale perfecto, no pasa nada: escribí una idea inicial. Podés ampliarlo más adelante.
                </div>
              </div>

              <div style={divider} />

              {/* Datos del Quiero */}
              <div>
                <div
                  style={{
                    fontSize: 30,
                    marginTop: 6,
                    marginBottom: 6,
                    opacity: 0.96,
                    fontWeight: 900,
                  }}
                >
                  Datos del Quiero
                </div>

                <div style={{ fontSize: 18, opacity: 0.90, lineHeight: 1.35 }}>
                  Elegí estos datos para darle forma. Si algo no te cierra, lo ajustamos después sin dramatizar.
                </div>

                <div
                  className="fiveGrid"
                  style={{
                    marginTop: 16,
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: 18,
                  }}
                >
                  <div>
                    <div style={labelStyle}>Dominio</div>
                    <select
                      style={inputStyle}
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      disabled={loading}
                    >
                      <option value="otros">otros</option>
                      <option value="salud">salud</option>
                      <option value="trabajo">trabajo</option>
                      <option value="finanzas">finanzas</option>
                      <option value="familia">familia</option>
                      <option value="pareja">pareja</option>
                      <option value="amistades">amistades</option>
                      <option value="desarrollo_personal">desarrollo personal</option>
                    </select>
                  </div>

                  <div>
                    <div style={labelStyle}>Estado</div>
                    <select
                      style={inputStyle}
                      value={status}
                      onChange={(e) => setStatus(e.target.value as EstadoQuiero)}
                      disabled={loading}
                    >
                      <option value="activo">activo</option>
                      <option value="pausado">pausado</option>
                      <option value="cumplido">cumplido</option>
                      <option value="no_relevante">no relevante</option>
                      <option value="reformulado">reformulado</option>
                    </select>
                    <div style={hintStyle}>
                      “Reformulado” significa: este Quiero cambió de forma respecto a una idea previa.
                    </div>
                  </div>

                  <div>
                    <div style={labelStyle}>Prioridad</div>
                    <select
                      style={inputStyle}
                      value={priority}
                      disabled={loading || isReformulado}
                      onChange={(e) => setPriority(Number(e.target.value))}
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                    </select>
                    {isReformulado && (
                      <div style={hintStyle}>
                        En un Quiero reformulado la prioridad se fija automáticamente en 5.
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={labelStyle}>Plazo</div>
                    <select
                      style={inputStyle}
                      value={term}
                      onChange={(e) => setTerm(e.target.value as Plazo)}
                      disabled={loading}
                    >
                      <option value="corto">corto</option>
                      <option value="mediano">mediano</option>
                      <option value="largo">largo</option>
                    </select>
                    <div style={hintStyle}>Corto / Mediano / Largo plazo.</div>
                  </div>

                  <div>
                    <div style={labelStyle}>Fecha objetivo</div>
                    <input
                      style={inputStyle}
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      disabled={loading}
                    />
                    <div style={hintStyle}>
                      Obligatoria. Elegí una fecha objetivo realista (después la podés recalibrar).
                    </div>
                    {!dueOK && <div style={{ ...hintStyle, opacity: 0.98 }}>Te falta completar este dato.</div>}
                  </div>
                </div>
              </div>

              {/* Botonera */}
              <div style={{ display: "grid", gap: 16, marginTop: 4 }}>
                <button
                  type="submit"
                  style={{
                    ...btnGuardar,
                    opacity: canSave ? 1 : 0.58,
                    cursor: canSave ? "pointer" : "not-allowed",
                  }}
                  disabled={!canSave}
                >
                  {loading ? "Guardando…" : "Guardar (ir al paso 2)"}
                </button>

                <button
                  type="button"
                  style={{
                    ...btnCancelar,
                    opacity: loading ? 0.70 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                  onClick={onCancelar}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </form>

            {/* micro-feedback visual (no invasivo) */}
            {loading && (
              <div
                aria-hidden
                style={{
                  marginTop: 16,
                  fontSize: 18,
                  opacity: 0.92,
                }}
              >
                Un momento… estamos creando tu Quiero.
              </div>
            )}
          </div>
        </section>

        {/* Responsive (patrón del login) */}
        <style jsx>{`
          @media (max-width: 1400px) {
            section {
              width: min(1320px, 100%) !important;
            }
          }
          @media (max-width: 1200px) {
            .fiveGrid {
              grid-template-columns: repeat(3, 1fr) !important;
            }
          }
          @media (max-width: 980px) {
            .fiveGrid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </main>
  );
}

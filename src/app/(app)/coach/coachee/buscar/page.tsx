// src/app/(app)/coach/coachee/buscar/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   CONSULTAR / MODIFICAR CLIENTE
   - búsqueda flexible: nombre / apellido / email
   - filtra por coach_id del usuario logueado
   - seleccionar => carga draft en localStorage
   - redirige a /acceso/coachee/carga
   - responsive contemplado desde origen
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
  width: "92vw",
  maxWidth: 1180,
};

const titleStyle: React.CSSProperties = {
  fontSize: 30,
  opacity: 0.95,
  margin: 0,
};

const helperStyle: React.CSSProperties = {
  fontSize: 16,
  opacity: 0.9,
  lineHeight: 1.35,
};

const labelStyle: React.CSSProperties = {
  fontSize: 17,
  opacity: 0.9,
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.18)",
  outline: "none",
  background: "rgba(0,0,0,0.18)",
  color: "rgba(255,255,255,0.95)",
  fontSize: 17,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
};

const btnBase: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 14,
  border: "none",
  fontSize: 17,
  fontWeight: 800,
  cursor: "pointer",
  color: "#fff",
  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
};

const btnBuscar: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(90,200,140,0.95), rgba(60,170,120,0.95))",
};

const btnSeleccionar: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(120,160,255,0.95), rgba(160,120,255,0.95))",
  fontSize: 16,
  padding: "10px 14px",
};

const btnVolver: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(255,170,90,0.95), rgba(255,130,90,0.95))",
};

const btnSalir: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(110,140,180,0.90), rgba(90,110,150,0.90))",
};

const btnDisabled: React.CSSProperties = {
  opacity: 0.55,
  cursor: "default",
};

const divider: React.CSSProperties = {
  height: 1,
  background: "rgba(255,255,255,0.12)",
  margin: "18px 0 16px",
};

const resultCard: React.CSSProperties = {
  borderRadius: 18,
  padding: 18,
  background: "rgba(0,0,0,0.16)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
};

const LS_KEY = "mqa_acceso_coachee_datos_draft_v1";

type Draft = {
  coach_id?: string;
  coachee_id?: string;
  nombre: string;
  apellido: string;
  whatsapp: string;
  email: string;
  fechaNacimiento: string;
  calle: string;
  numero: string;
  piso: string;
  dpto: string;
  codigoPostal: string;
  direccionAclaracion: string;
  ciudad: string;
  pais: string;
  tipoDocumento: string;
  nroDocumento: string;
  cuitCuil: string;
  emiteFactura: "SI" | "NO";
};

type CoacheeRow = {
  id: string;
  coach_id: string;
  full_name?: string | null;
  email?: string | null;
  dni?: string | null;
  cuit_cuil?: string | null;
  address?: string | null;
  postal_code?: string | null;
  birth_date?: string | null;

  whatsapp?: string | null;
  phone?: string | null;
  mobile?: string | null;
  celular?: string | null;
  telefono?: string | null;
  whatsapp_number?: string | null;

  ciudad?: string | null;
  city?: string | null;

  pais?: string | null;
  country?: string | null;

  direccion_aclaracion?: string | null;
  address_extra?: string | null;
};

function clean(s: string | null | undefined) {
  return (s || "").trim();
}

function onlyDigits(s: string | null | undefined) {
  return (s || "").replace(/[^\d]/g, "");
}

function isoToDdmmyyyy(v: string | null | undefined) {
  const t = clean(v);
  if (!t) return "";
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function formatCuitMask(raw: string) {
  const d = onlyDigits(raw).slice(0, 11);
  const a = d.slice(0, 2);
  const b = d.slice(2, 10);
  const c = d.slice(10, 11);

  let out = "";
  if (a) out += a;
  if (b) out += (out ? "/" : "") + b;
  if (c) out += (out ? "-" : "") + c;
  return out;
}

function splitFullName(fullName: string) {
  const t = clean(fullName);
  if (!t) return { nombre: "", apellido: "" };

  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { nombre: parts[0], apellido: "" };

  return {
    nombre: parts.slice(0, -1).join(" "),
    apellido: parts.slice(-1).join(" "),
  };
}

function pickFirst(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const v = clean(value);
    if (v) return v;
  }
  return "";
}

function parseAddress(address: string) {
  const out = {
    calle: "",
    numero: "",
    piso: "",
    dpto: "",
    direccionAclaracion: "",
    ciudad: "",
    pais: "",
  };

  const raw = clean(address);
  if (!raw) return out;

  const parts = raw.split("|").map((x) => x.trim()).filter(Boolean);

  const linea1 = parts[0] || "";
  const linea2 = parts[1] || "";
  const linea3 = parts[2] || "";
  const linea4 = parts[3] || "";

  if (linea1) {
    const m = linea1.match(/^(.*?)(?:\s+(\d+))?$/);
    out.calle = clean(m?.[1] || linea1);
    out.numero = clean(m?.[2] || "");
  }

  if (linea2) {
    const chunks = linea2.split(" - ").map((x) => x.trim()).filter(Boolean);
    for (const c of chunks) {
      if (/^Piso\s+/i.test(c)) {
        out.piso = clean(c.replace(/^Piso\s+/i, ""));
      } else if (/^Dpto\s+/i.test(c)) {
        out.dpto = clean(c.replace(/^Dpto\s+/i, ""));
      } else {
        out.direccionAclaracion = c;
      }
    }
  }

  if (linea3) {
    const chunks = linea3.split(" - ").map((x) => x.trim()).filter(Boolean);
    if (chunks.length >= 2) {
      out.ciudad = clean(chunks[0] || "");
      out.pais = clean(chunks[1] || "");
    } else {
      out.ciudad = clean(chunks[0] || "");
    }
  }

  if (linea4 && !out.pais) {
    out.pais = clean(linea4);
  }

  return out;
}

function buildDraftFromRow(row: CoacheeRow): Draft {
  const nameParts = splitFullName(clean(row.full_name));
  const addr = parseAddress(clean(row.address));
  const dniDigits = onlyDigits(row.dni);

  return {
    coach_id: row.coach_id,
    coachee_id: row.id,
    nombre: nameParts.nombre,
    apellido: nameParts.apellido,
    whatsapp: pickFirst(
      row.whatsapp,
      row.phone,
      row.mobile,
      row.celular,
      row.telefono,
      row.whatsapp_number
    ),
    email: clean(row.email),
    fechaNacimiento: isoToDdmmyyyy(row.birth_date),
    calle: addr.calle,
    numero: addr.numero,
    piso: addr.piso,
    dpto: addr.dpto,
    codigoPostal: clean(row.postal_code),
    direccionAclaracion: pickFirst(
      row.direccion_aclaracion,
      row.address_extra,
      addr.direccionAclaracion
    ),
    ciudad: pickFirst(row.ciudad, row.city, addr.ciudad),
    pais: pickFirst(row.pais, row.country, addr.pais),
    tipoDocumento: "DNI",
    nroDocumento: dniDigits,
    cuitCuil: formatCuitMask(clean(row.cuit_cuil)),
    emiteFactura: clean(row.cuit_cuil) ? "SI" : "NO",
  };
}

export default function CoachCoacheeBuscarPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(false);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");

  const [coachId, setCoachId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CoacheeRow[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        const authUser = authData?.user;

        if (authErr || !authUser?.id) {
          router.replace("/login");
          return;
        }

        const { data: coachRow, error: coachErr } = await supabase
          .from("coaches")
          .select("id")
          .eq("auth_user_id", authUser.id)
          .maybeSingle();

        if (coachErr || !coachRow?.id) {
          router.replace("/login");
          return;
        }

        if (alive) setCoachId(coachRow.id as string);
      } catch {
        router.replace("/login");
      } finally {
        if (alive) setCheckingSession(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, supabase]);

  async function handleBuscar() {
    setError(null);
    setSearched(true);
    setResults([]);

    const n = clean(nombre);
    const a = clean(apellido);
    const e = clean(email).toLowerCase();

    if (!n && !a && !e) {
      setError("Ingresá al menos un criterio de búsqueda.");
      return;
    }

    if (!coachId) {
      setError("No se pudo resolver el coach logueado. Volvé a ingresar.");
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from("coachees")
        .select("*")
        .eq("coach_id", coachId)
        .order("full_name", { ascending: true });

      if (e) {
        query = query.ilike("email", `%${e}%`);
      }
      if (n) {
        query = query.ilike("full_name", `%${n}%`);
      }
      if (a) {
        query = query.ilike("full_name", `%${a}%`);
      }

      const { data, error: qErr } = await query;

      if (qErr) {
        setError(`No fue posible realizar la búsqueda: ${qErr.message || "sin detalle"}`);
        return;
      }

      setResults(Array.isArray(data) ? (data as CoacheeRow[]) : []);
    } catch {
      setError("No fue posible realizar la búsqueda. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleSeleccionar(row: CoacheeRow) {
    try {
      const draft = buildDraftFromRow(row);
      localStorage.setItem(LS_KEY, JSON.stringify(draft));
      router.push("/acceso/coachee/carga");
    } catch {
      setError("No fue posible preparar los datos del cliente seleccionado.");
    }
  }

  async function handleSalir() {
    try {
      await supabase.auth.signOut();
    } catch {
      // silencio
    } finally {
      router.replace("/login");
    }
  }

  const topGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
    gap: 12,
  };

  const bottomGrid: React.CSSProperties = {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
    gap: 12,
  };

  return (
    <>
      <style jsx global>{`
        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          min-height: 100% !important;
          background: url("/welcome.png") center center / cover no-repeat fixed !important;
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "18px 10px" : "26px 0",
        }}
      >
        <div style={{ ...glassCard, padding: isMobile ? 22 : 34 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1.2fr",
              gap: 16,
              alignItems: "start",
            }}
          >
            <div style={titleStyle}>Consultar / Modificar Cliente</div>
            <div style={helperStyle}>
              Ingresá uno o más criterios de búsqueda.
              <br />
              Luego seleccioná el cliente para abrir su ficha y modificar sus datos.
            </div>
          </div>

          <div style={divider} />

          <div style={topGrid}>
            <div>
              <div style={labelStyle}>Nombre</div>
              <input
                style={inputStyle}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={loading || checkingSession}
                maxLength={60}
              />
            </div>

            <div>
              <div style={labelStyle}>Apellido</div>
              <input
                style={inputStyle}
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                disabled={loading || checkingSession}
                maxLength={60}
              />
            </div>

            <div>
              <div style={labelStyle}>Email</div>
              <input
                style={inputStyle}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || checkingSession}
                inputMode="email"
                maxLength={120}
              />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <button
              style={{
                ...btnBuscar,
                ...(loading || checkingSession ? btnDisabled : {}),
              }}
              onClick={handleBuscar}
              disabled={loading || checkingSession}
            >
              Buscar
            </button>
          </div>

          {error && (
            <div
              style={{
                marginTop: 12,
                fontSize: 15,
                color: "#ffb4b4",
                opacity: 0.98,
                whiteSpace: "pre-line",
              }}
            >
              {error}
            </div>
          )}

          <div style={divider} />

          <div style={{ fontSize: 18, fontWeight: 700, opacity: 0.95 }}>
            Resultados
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            {!searched ? (
              <div style={{ ...helperStyle, opacity: 0.88 }}>
                Todavía no realizaste una búsqueda.
              </div>
            ) : results.length === 0 ? (
              <div style={{ ...helperStyle, opacity: 0.88 }}>
                No se encontraron clientes con los criterios ingresados.
              </div>
            ) : (
              results.map((row) => {
                const fullName = clean(row.full_name) || "Sin nombre";
                const emailTxt = clean(row.email) || "Sin email";
                const dniTxt = clean(row.dni) || "Sin DNI";

                return (
                  <div
                    key={row.id}
                    style={{
                      ...resultCard,
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr 0.8fr 180px",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{fullName}</div>
                      {isMobile && (
                        <div style={{ marginTop: 6, ...helperStyle }}>
                          <div>Email: {emailTxt}</div>
                          <div>DNI: {dniTxt}</div>
                        </div>
                      )}
                    </div>

                    {!isMobile && <div style={helperStyle}>Email: {emailTxt}</div>}
                    {!isMobile && <div style={helperStyle}>DNI: {dniTxt}</div>}

                    <div>
                      <button
                        style={btnSeleccionar}
                        onClick={() => handleSeleccionar(row)}
                        disabled={loading || checkingSession}
                      >
                        Seleccionar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={bottomGrid}>
            <button
              style={{ ...btnVolver, ...(loading || checkingSession ? btnDisabled : {}) }}
              onClick={() => router.replace("/coach")}
              disabled={loading || checkingSession}
            >
              Volver
            </button>

            <button
              style={{ ...btnSalir, ...(loading || checkingSession ? btnDisabled : {}) }}
              onClick={handleSalir}
              disabled={loading || checkingSession}
            >
              Salir
            </button>

            {!isMobile ? <div /> : null}
          </div>
        </div>
      </div>
    </>
  );
}
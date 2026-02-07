"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   Estética glass (patrón LOGIN)
   + Compactación vertical (para que entre en 1 pantalla)
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
  fontSize: 25,
  opacity: 0.95,
};

const helperStyle: React.CSSProperties = {
  fontSize: 16,
  opacity: 0.9,
  lineHeight: 1.35,
};

const headerRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1.2fr",
  gap: 16,
  alignItems: "start",
  marginBottom: 14,
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

const inputInvalidStyle: React.CSSProperties = {
  border: "1px solid rgba(255,120,120,0.90)",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 3px rgba(255,120,120,0.18)",
};

const disabledFieldWrap: React.CSSProperties = {
  opacity: 0.6,
  filter: "grayscale(60%)",
};

const row2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

const row3: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 12,
};

// Línea 3: Calle | Nro | Piso | Dpto | CP
const rowAddr5: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 0.8fr 0.8fr 0.9fr 1fr",
  gap: 12,
};

// Línea 4: Aclaración | Ciudad | País
const rowAddr3: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr",
  gap: 12,
};

// Línea 5: Tipo doc | Nro doc | CUIT/CUIL | Emite factura
const rowDoc4: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "0.8fr 1.2fr 1.3fr 0.9fr",
  gap: 12,
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

const btnGuardar: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(90,200,140,0.95), rgba(60,170,120,0.95))",
};

const btnEnviar: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(120,160,255,0.95), rgba(160,120,255,0.95))",
};

const btnModificar: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(255,170,90,0.95), rgba(255,130,90,0.95))",
};

const btnVolver: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(110,140,180,0.90), rgba(90,110,150,0.90))",
};

const btnDisabled: React.CSSProperties = {
  opacity: 0.55,
  cursor: "default",
};

function clean(s: string) {
  return (s || "").trim();
}

function onlyDigits(s: string) {
  return (s || "").replace(/[^\d]/g, "");
}

function isValidEmail(v: string) {
  const t = clean(v);
  if (!t) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

function isValidPhone(s: string) {
  const t = clean(s);
  const digits = t.replace(/[^\d]/g, "");
  if (digits.length < 8) return false;
  return /^[\d+\-\s()]+$/.test(t);
}

/* =========================
   Máscara Fecha: dd/mm/aaaa
========================= */
function formatDateMask(raw: string) {
  const d = onlyDigits(raw).slice(0, 8);
  const dd = d.slice(0, 2);
  const mm = d.slice(2, 4);
  const yyyy = d.slice(4, 8);

  let out = "";
  if (dd) out += dd;
  if (mm) out += (out ? "/" : "") + mm;
  if (yyyy) out += (out ? "/" : "") + yyyy;
  return out;
}

function isValidDateMask(v: string) {
  const t = clean(v);
  if (!t) return false;
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(t)) return false;

  const [ddS, mmS, yyS] = t.split("/");
  const dd = Number(ddS);
  const mm = Number(mmS);
  const yy = Number(yyS);

  if (yy < 1900 || yy > 2100) return false;
  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 31) return false;

  return true;
}

function ddmmyyyyToIsoDate(v: string) {
  const t = clean(v);
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(t)) return null;
  const [ddS, mmS, yyS] = t.split("/");
  const dd = Number(ddS);
  const mm = Number(mmS);
  const yy = Number(yyS);
  if (!yy || mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;

  const mm2 = String(mm).padStart(2, "0");
  const dd2 = String(dd).padStart(2, "0");
  return `${yy}-${mm2}-${dd2}`; // date ISO (YYYY-MM-DD)
}

/* =========================
   CUIT/CUIL máscara: 99/99999999-9
========================= */
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

function isValidCuitMask(v: string) {
  const t = clean(v);
  if (!t) return true; // opcional
  return /^\d{2}\/\d{8}-\d{1}$/.test(t);
}

/* =========================
   Selector Tipo Doc compacto
========================= */
const selectWrap: React.CSSProperties = { position: "relative" };

const selectCompact: React.CSSProperties = {
  ...inputStyle,
  background: "rgba(0,0,0,0.55)",
  border: "1px solid rgba(255,255,255,0.20)",
  paddingRight: 44,
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
};

const selectArrow: React.CSSProperties = {
  position: "absolute",
  right: 14,
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none",
  fontSize: 18,
  opacity: 0.9,
};

/* =========================
   Emite factura SI/NO compacto
========================= */
const ynWrap: React.CSSProperties = {
  display: "inline-flex",
  gap: 10,
  alignItems: "center",
  padding: "6px 8px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.18)",
  width: "fit-content",
};

const ynBtn: React.CSSProperties = {
  minWidth: 44,
  padding: "7px 10px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.92)",
  fontSize: 16,
  fontWeight: 900,
  cursor: "pointer",
};

const ynBtnActive: React.CSSProperties = {
  ...ynBtn,
  background:
    "linear-gradient(135deg, rgba(120,160,255,0.85), rgba(160,120,255,0.85))",
  border: "1px solid rgba(255,255,255,0.22)",
  color: "#fff",
  boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
};

/* =========================================================
   extractFunctionErrorDetail()
========================================================= */
async function extractFunctionErrorDetail(fnErr: any): Promise<string> {
  try {
    if (!fnErr) return "Error desconocido (sin detalle).";

    const name = fnErr?.name ? String(fnErr.name) : "EdgeFunctionError";
    const message = fnErr?.message ? String(fnErr.message) : "Sin mensaje";

    const status =
      fnErr?.context?.status ??
      fnErr?.status ??
      fnErr?.context?.response?.status ??
      null;

    let bodyText: string | null = null;

    const resp: Response | undefined = fnErr?.context?.response;
    if (resp && typeof resp.text === "function") {
      try {
        bodyText = await resp.text();
      } catch {
        bodyText = null;
      }
    }

    if (!bodyText && fnErr?.context?.body) {
      try {
        bodyText =
          typeof fnErr.context.body === "string"
            ? fnErr.context.body
            : JSON.stringify(fnErr.context.body);
      } catch {
        bodyText = String(fnErr.context.body);
      }
    }

    const parts: string[] = [];
    parts.push(`${name}: ${message}`);
    if (status !== null && status !== undefined) parts.push(`status: ${status}`);
    if (bodyText) parts.push(`body: ${bodyText}`);

    if (parts.length === 1) {
      try {
        parts.push(`raw: ${JSON.stringify(fnErr)}`);
      } catch {
        // silencio
      }
    }

    return parts.join("\n");
  } catch {
    return "No fue posible extraer detalle del error de la Edge Function.";
  }
}

/* =========================================================
   upsertInvitation() según uq_coachee_inv (coach_id + coachee_id)

   AJUSTE EXACTO (según constraint de BD):
   - NO existe "pending" en la BD
   - status debe ser uno de: sent | used | expired | revoked
   - Por lo tanto: usamos "sent" al crear/actualizar la invitación

========================================================= */
async function upsertInvitation(params: {
  supabase: any;
  coach_id: string;
  coachee_id: string;
  email: string;
  expires_at: string;
}): Promise<{ invitation_id: string; token: string; operation: "update" | "insert" }> {
  const { supabase, coach_id, coachee_id, email, expires_at } = params;

  // 1) Buscar por la UNIQUE REAL: (coach_id + coachee_id)
  const { data: existing, error: exErr } = await supabase
    .from("coachee_invitations")
    .select("id")
    .eq("coach_id", coach_id)
    .eq("coachee_id", coachee_id)
    .limit(1)
    .maybeSingle();

  if (exErr) {
    throw new Error(
      `No fue posible validar invitación existente: ${exErr.message || "sin detalle"}`,
    );
  }

  // Token NUEVO en cada envío
  const token = crypto.randomUUID();

  // 2) Si existe => UPDATE
  if (existing?.id) {
    const { error: updErr } = await supabase
      .from("coachee_invitations")
      .update({
        email,
        token,
        status: "sent",
        expires_at,
      })
      .eq("id", existing.id);

    if (updErr) {
      throw new Error(
        `No fue posible actualizar invitación existente: ${updErr.message || "sin detalle"}`,
      );
    }

    return {
      invitation_id: existing.id as string,
      token,
      operation: "update",
    };
  }

  // 3) Si no existe => INSERT
  const { data: insData, error: insErr } = await supabase
    .from("coachee_invitations")
    .insert({
      coach_id,
      coachee_id,
      email,
      token,
      status: "sent",
      expires_at,
    })
    .select("id")
    .single();

  if (insErr || !insData?.id) {
    throw new Error(
      `No fue posible crear la invitación en BD: ${insErr?.message || "sin detalle"}`,
    );
  }

  return { invitation_id: insData.id as string, token, operation: "insert" };
}

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

type IssueKey =
  | "nombre"
  | "apellido"
  | "whatsapp"
  | "email"
  | "fechaNacimiento"
  | "calle"
  | "numero"
  | "codigoPostal"
  | "pais"
  | "nroDocumento"
  | "cuitCuil";

type Issue = { key: IssueKey; label: string; detail: string };

const LS_KEY = "mqa_acceso_coachee_datos_draft_v1";

export default function AccesoCoacheeCargaPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [editing, setEditing] = useState(true);
  const [savedOnce, setSavedOnce] = useState(false);

  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [invalidKeys, setInvalidKeys] = useState<Set<IssueKey>>(new Set());

  const [coachId, setCoachId] = useState<string | null>(null);
  const [coacheeId, setCoacheeId] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");

  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");

  const [calle, setCalle] = useState("");
  const [numero, setNumero] = useState("");
  const [piso, setPiso] = useState("");
  const [dpto, setDpto] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");

  const [direccionAclaracion, setDireccionAclaracion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [pais, setPais] = useState("");

  const [tipoDocumento, setTipoDocumento] = useState("DNI");
  const [nroDocumento, setNroDocumento] = useState("");
  const [cuitCuil, setCuitCuil] = useState("");
  const [emiteFactura, setEmiteFactura] = useState<"SI" | "NO">("NO");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = !editing || loading;

  function validate(): Issue[] {
    const issues: Issue[] = [];

    if (clean(nombre).length <= 1) {
      issues.push({ key: "nombre", label: "Nombre", detail: "completá al menos 2 caracteres" });
    }
    if (clean(apellido).length <= 1) {
      issues.push({ key: "apellido", label: "Apellido", detail: "completá al menos 2 caracteres" });
    }
    if (!isValidPhone(whatsapp)) {
      issues.push({ key: "whatsapp", label: "WhatsApp", detail: "ingresá un número válido (mínimo 8 dígitos)" });
    }
    if (!isValidEmail(email)) {
      issues.push({ key: "email", label: "Email", detail: "ingresá un email válido" });
    }
    if (!isValidDateMask(fechaNacimiento)) {
      issues.push({ key: "fechaNacimiento", label: "Fecha de nacimiento", detail: "formato válido dd/mm/aaaa (día 01-31, mes 01-12)" });
    }
    if (clean(calle).length <= 1) {
      issues.push({ key: "calle", label: "Calle", detail: "completá este campo" });
    }
    if (clean(numero).length <= 0) {
      issues.push({ key: "numero", label: "Número", detail: "completá este campo" });
    }
    if (clean(codigoPostal).length <= 1) {
      issues.push({ key: "codigoPostal", label: "Código Postal", detail: "completá este campo" });
    }
    if (clean(pais).length <= 1) {
      issues.push({ key: "pais", label: "País", detail: "completá este campo" });
    }

    const nro = onlyDigits(nroDocumento);
    if (clean(nroDocumento).length <= 4 || !/^\d+$/.test(nro) || nro.length <= 4) {
      issues.push({ key: "nroDocumento", label: "Nro de documento", detail: "ingresá solo números (mínimo 5 dígitos)" });
    }

    if (!isValidCuitMask(cuitCuil)) {
      issues.push({ key: "cuitCuil", label: "CUIT/CUIL", detail: "formato válido 99/99999999-9 (o dejalo vacío)" });
    }

    return issues;
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const d: Draft = JSON.parse(raw);

      const hasIds = Boolean(d.coach_id && d.coachee_id);

      setCoachId(d.coach_id || null);
      setCoacheeId(d.coachee_id || null);

      setNombre(d.nombre || "");
      setApellido(d.apellido || "");
      setWhatsapp(d.whatsapp || "");
      setEmail(d.email || "");
      setFechaNacimiento(d.fechaNacimiento || "");

      setCalle(d.calle || "");
      setNumero(d.numero || "");
      setPiso(d.piso || "");
      setDpto(d.dpto || "");
      setCodigoPostal(d.codigoPostal || "");

      setDireccionAclaracion(d.direccionAclaracion || "");
      setCiudad(d.ciudad || "");
      setPais(d.pais || "");

      setTipoDocumento(d.tipoDocumento || "DNI");
      setNroDocumento(d.nroDocumento || "");
      setCuitCuil(d.cuitCuil || "");

      setEmiteFactura(d.emiteFactura || "NO");

      setSavedOnce(hasIds);
      setEditing(!hasIds);
    } catch {
      // silencio
    }
  }, []);

  function buildDraft(extra?: Partial<Draft>): Draft {
    return {
      coach_id: extra?.coach_id ?? coachId ?? undefined,
      coachee_id: extra?.coachee_id ?? coacheeId ?? undefined,

      nombre: clean(nombre),
      apellido: clean(apellido),
      whatsapp: clean(whatsapp),
      email: clean(email),
      fechaNacimiento: clean(fechaNacimiento),

      calle: clean(calle),
      numero: clean(numero),
      piso: clean(piso),
      dpto: clean(dpto),
      codigoPostal: clean(codigoPostal),

      direccionAclaracion: direccionAclaracion || "",
      ciudad: clean(ciudad),
      pais: clean(pais),

      tipoDocumento,
      nroDocumento: clean(nroDocumento),
      cuitCuil: clean(cuitCuil),

      emiteFactura,
    };
  }

  function buildAddressString(d: Draft) {
    const parts: string[] = [];
    const linea1 = [d.calle, d.numero].filter(Boolean).join(" ").trim();
    if (linea1) parts.push(linea1);

    const linea2 = [
      d.piso ? `Piso ${d.piso}` : "",
      d.dpto ? `Dpto ${d.dpto}` : "",
      d.direccionAclaracion ? d.direccionAclaracion : "",
    ]
      .filter(Boolean)
      .join(" - ")
      .trim();
    if (linea2) parts.push(linea2);

    const linea3 = [d.ciudad, d.pais].filter(Boolean).join(" - ").trim();
    if (linea3) parts.push(linea3);

    return parts.join(" | ");
  }

  async function resolveCoachIdOrFail(): Promise<string | null> {
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const authUser = authData?.user;
    if (authErr || !authUser?.id) return null;

    const { data: coachRow, error: coachErr } = await supabase
      .from("coaches")
      .select("id")
      .eq("auth_user_id", authUser.id)
      .maybeSingle();

    if (coachErr || !coachRow?.id) return null;
    return coachRow.id as string;
  }

  async function handleGuardar() {
    setError(null);
    setSubmitAttempted(true);

    const issues = validate();
    setInvalidKeys(new Set(issues.map((x) => x.key)));

    if (issues.length > 0) {
      const msg =
        "Faltan o están inválidos estos campos:\n" +
        issues.map((i) => `• ${i.label}: ${i.detail}`).join("\n");
      setError(msg);
      return;
    }

    setLoading(true);
    try {
      const resolvedCoachId = await resolveCoachIdOrFail();
      if (!resolvedCoachId) {
        setError("No se pudo resolver el Coach (sesión/coach_id). Volvé a iniciar sesión e intentá nuevamente.");
        return;
      }

      const draft = buildDraft({ coach_id: resolvedCoachId });

      const fullName = clean(`${draft.nombre} ${draft.apellido}`);
      const birthIso = ddmmyyyyToIsoDate(draft.fechaNacimiento);
      if (!birthIso) {
        setError("Fecha de nacimiento inválida. Corrigila (dd/mm/aaaa) y guardá nuevamente.");
        return;
      }

      const dniDigits = onlyDigits(draft.nroDocumento);
      const cuitDigits = onlyDigits(draft.cuitCuil);

      const payload: any = {
        coach_id: resolvedCoachId,
        full_name: fullName,
        email: clean(draft.email).toLowerCase(),
        dni: dniDigits,
        cuit_cuil: cuitDigits || "",
        address: buildAddressString(draft),
        postal_code: draft.codigoPostal,
        birth_date: birthIso,
        status: "pending",
      };

      let finalCoacheeId: string | null = null;

      if (coacheeId) {
        const { data: upd, error: updErr } = await supabase
          .from("coachees")
          .update(payload)
          .eq("id", coacheeId)
          .select("id")
          .single();

        if (updErr || !upd?.id) {
          setError(`No fue posible guardar en BBDD (update coachees): ${updErr?.message || "sin detalle"}`);
          return;
        }
        finalCoacheeId = upd.id as string;
      } else {
        const { data: ins, error: insErr } = await supabase
          .from("coachees")
          .insert(payload)
          .select("id")
          .single();

        if (insErr || !ins?.id) {
          setError(`No fue posible guardar en BBDD (insert coachees): ${insErr?.message || "sin detalle"}`);
          return;
        }
        finalCoacheeId = ins.id as string;
      }

      setCoachId(resolvedCoachId);
      setCoacheeId(finalCoacheeId);

      const draftWithIds = buildDraft({
        coach_id: resolvedCoachId,
        coachee_id: finalCoacheeId,
      });
      localStorage.setItem(LS_KEY, JSON.stringify(draftWithIds));

      setSavedOnce(true);
      setEditing(false);
    } catch {
      setError("No fue posible guardar. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnviarMail() {
    setError(null);
    if (!savedOnce || editing) return;

    setLoading(true);
    try {
      const toEmail = clean(email).toLowerCase();
      if (!isValidEmail(toEmail)) {
        setError("Email inválido. Volvé a Modificar y corregilo.");
        return;
      }

      if (!coachId) {
        setError("No se detectó coach_id. Volvé a Guardar y luego enviá.");
        return;
      }

      if (!coacheeId) {
        setError("No se detectó coachee_id. Volvé a Guardar y luego enviá.");
        return;
      }

      const coacheeNombre = clean(`${nombre} ${apellido}`) || "Coachee";

      let coachNombre = "Tu coach";
      try {
        const { data: coachRow } = await supabase
          .from("coaches")
          .select("full_name")
          .eq("id", coachId)
          .maybeSingle();
        coachNombre = clean((coachRow as any)?.full_name) || coachNombre;
      } catch {
        // silencio
      }

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { invitation_id, token } = await upsertInvitation({
        supabase,
        coach_id: coachId,
        coachee_id: coacheeId,
        email: toEmail,
        expires_at: expiresAt,
      });

      const { data, error: fnErr } = await supabase.functions.invoke("send-coachee-invite", {
        body: {
          email: toEmail,
          coachee_id: coacheeId,
          token,
          invitation_id,
          to_email: toEmail,
          coachee_nombre: coacheeNombre,
          coach_nombre: coachNombre,
        },
      });

      if (fnErr) {
        try {
          await supabase.from("coachee_invitations").update({ status: "revoked" }).eq("id", invitation_id);
        } catch {
          // silencio
        }

        const detail = await extractFunctionErrorDetail(fnErr);
        setError(`No fue posible enviar el mail (Edge Function).\n${detail}`);
        return;
      }

      const ok = (data as any)?.ok;
      if (ok === false) {
        try {
          await supabase.from("coachee_invitations").update({ status: "revoked" }).eq("id", invitation_id);
        } catch {
          // silencio
        }
        setError(`No fue posible enviar el mail.\nbody: ${String((data as any)?.error || "sin detalle")}`);
        return;
      }

      setError(`✅ Mail enviado a ${toEmail}. Revisá Gmail.`);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "No fue posible enviar el mail. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleModificar() {
    setError(null);
    setEditing(true);
    setSubmitAttempted(false);
    setInvalidKeys(new Set());
  }

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
          padding: "22px 0",
        }}
      >
        <div style={glassCard}>
          <div style={headerRow}>
            <div style={titleStyle}>Datos del Coachee</div>
            <div style={helperStyle}>
              {editing ? "Completá los datos y guardá." : "Datos guardados en BBDD. Podés enviar el mail o modificar."}
            </div>
          </div>

          <div style={row2}>
            <div style={disabled ? disabledFieldWrap : undefined}>
              <div style={labelStyle}>Nombre</div>
              <input
                style={submitAttempted && invalidKeys.has("nombre") ? { ...inputStyle, ...inputInvalidStyle } : inputStyle}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={disabled}
                maxLength={60}
              />
            </div>

            <div style={disabled ? disabledFieldWrap : undefined}>
              <div style={labelStyle}>Apellido</div>
              <input
                style={submitAttempted && invalidKeys.has("apellido") ? { ...inputStyle, ...inputInvalidStyle } : inputStyle}
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                disabled={disabled}
                maxLength={60}
              />
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div style={row3}>
            <div style={disabled ? disabledFieldWrap : undefined}>
              <div style={labelStyle}>WhatsApp</div>
              <input
                style={submitAttempted && invalidKeys.has("whatsapp") ? { ...inputStyle, ...inputInvalidStyle } : inputStyle}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                disabled={disabled}
                maxLength={24}
              />
            </div>

            <div style={disabled ? disabledFieldWrap : undefined}>
              <div style={labelStyle}>Email</div>
              <input
                style={submitAttempted && invalidKeys.has("email") ? { ...inputStyle, ...inputInvalidStyle } : inputStyle}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={disabled}
                inputMode="email"
                maxLength={120}
              />
            </div>

            <div style={disabled ? disabledFieldWrap : undefined}>
              <div style={labelStyle}>Fecha de nacimiento</div>
              <input
                style={
                  submitAttempted && invalidKeys.has("fechaNacimiento")
                    ? { ...inputStyle, ...inputInvalidStyle }
                    : inputStyle
                }
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(formatDateMask(e.target.value))}
                disabled={disabled}
                inputMode="numeric"
                maxLength={10}
              />
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div style={rowAddr5}>
            <div style={disabled ? disabledFieldWrap : undefined}>
              <div style={labelStyle}>Calle</div>
              <input
                style={submitAttempted && invalidKeys.has("calle") ? { ...inputStyle, ...inputInvalidStyle } : inputStyle}
                value={calle}
                onChange={(e) => setCalle(e.target.value)}
                disabled={disabled}
                maxLength={80}
              />
            </div>

            <div style={disabled ? disabledFieldWrap : undefined}>
              <div style={labelStyle}>Nro</div>
              <input
                style={submitAttempted && invalidKeys.has("numero") ? { ...inputStyle, ...inputInvalidStyle } : inputStyle}
                value={numero}
                onChange={(e) => setNumero(onlyDigits(e.target.value).slice(0, 6))}
                disabled={disabled}
                inputMode="numeric"
                maxLength={6}
              />
            </div>

            <div style={disabled ? disabledFieldWrap : undefined}>
              <div style={labelStyle}>Piso</div>
              <input
                style={inputStyle}
                value={piso}
                onChange={(e) => setPiso(e.target.value.slice(0, 6))}
                disabled={disabled}
                maxLength={6}
              />
            </div>

            <div style={disabled ? disabledFieldWrap : undefined}>
              <div style={labelStyle}>Dpto</div>
              <input
                style={inputStyle}
                value={dpto}
                onChange={(e) => setDpto(e.target.value.slice(0, 10))}
                disabled={disabled}
                maxLength={10}
              />
            </div>

            <div style={disabled ? disabledFieldWrap : undefined}>
              <div style={labelStyle}>Código Postal</div>
              <input
                style={
                  submitAttempted && invalidKeys.has("codigoPostal")
                    ? { ...inputStyle, ...inputInvalidStyle }
                    : inputStyle
                }
                value={codigoPostal}
                onChange={(e) => setCodigoPostal(e.target.value.slice(0, 10))}
                disabled={disabled}
                maxLength={10}
              />
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div style={rowAddr3}>
            <div style={disabled ? disabledFieldWrap : undefined}>
              <div style={labelStyle}>Aclaración de dirección (opcional)</div>
              <input
                style={inputStyle}
                value={direccionAclaracion}
                onChange={(e) => setDireccionAclaracion(e.target.value)}
                disabled={disabled}
                placeholder="Barrio, torre, entre calles, etc."
                maxLength={160}
              />
            </div>

            <div style={disabled ? disabledFieldWrap : undefined}>
              <div style={labelStyle}>Ciudad</div>
              <input
                style={inputStyle}
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value.slice(0, 60))}
                disabled={disabled}
                maxLength={60}
              />
            </div>

            <div style={disabled ? disabledFieldWrap : undefined}>
              <div style={labelStyle}>País</div>
              <input
                style={submitAttempted && invalidKeys.has("pais") ? { ...inputStyle, ...inputInvalidStyle } : inputStyle}
                value={pais}
                onChange={(e) => setPais(e.target.value.slice(0, 60))}
                disabled={disabled}
                maxLength={60}
                autoComplete="country-name"
              />
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div style={rowDoc4}>
            <div style={disabled ? disabledFieldWrap : undefined}>
              <div style={labelStyle}>Tipo doc</div>
              <div style={selectWrap}>
                <select
                  style={selectCompact}
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  disabled={disabled}
                >
                  <option value="DNI">DNI</option>
                  <option value="PAS">PAS</option>
                  <option value="LC">LC</option>
                  <option value="LE">LE</option>
                </select>
                <div style={selectArrow}>▼</div>
              </div>
            </div>

            <div style={disabled ? disabledFieldWrap : undefined}>
              <div style={labelStyle}>Nro de documento</div>
              <input
                style={
                  submitAttempted && invalidKeys.has("nroDocumento")
                    ? { ...inputStyle, ...inputInvalidStyle }
                    : inputStyle
                }
                value={nroDocumento}
                onChange={(e) => setNroDocumento(onlyDigits(e.target.value).slice(0, 12))}
                disabled={disabled}
                inputMode="numeric"
                maxLength={12}
              />
            </div>

            <div style={disabled ? disabledFieldWrap : undefined}>
              <div style={labelStyle}>CUIT/CUIL (opcional)</div>
              <input
                style={submitAttempted && invalidKeys.has("cuitCuil") ? { ...inputStyle, ...inputInvalidStyle } : inputStyle}
                value={cuitCuil}
                onChange={(e) => setCuitCuil(formatCuitMask(e.target.value))}
                disabled={disabled}
                inputMode="numeric"
                maxLength={13}
              />
            </div>

            <div style={disabled ? disabledFieldWrap : undefined}>
              <div style={labelStyle}>Emite factura</div>
              <div style={ynWrap}>
                <button
                  type="button"
                  style={emiteFactura === "NO" ? ynBtnActive : ynBtn}
                  onClick={() => setEmiteFactura("NO")}
                  disabled={disabled}
                >
                  NO
                </button>
                <button
                  type="button"
                  style={emiteFactura === "SI" ? ynBtnActive : ynBtn}
                  onClick={() => setEmiteFactura("SI")}
                  disabled={disabled}
                >
                  SI
                </button>
              </div>
            </div>
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

          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button
              style={{ ...btnGuardar, ...(loading ? btnDisabled : {}) }}
              onClick={handleGuardar}
              disabled={loading || (!editing && savedOnce)}
              title={!editing && savedOnce ? "Usá Modificar para editar" : ""}
            >
              Guardar
            </button>

            <button
              style={{ ...btnEnviar, ...(loading || !savedOnce || editing ? btnDisabled : {}) }}
              onClick={handleEnviarMail}
              disabled={loading || !savedOnce || editing}
              title={!savedOnce ? "Primero guardá los datos" : editing ? "Guardá antes de enviar" : ""}
            >
              Enviar mail
            </button>

            <button
              style={{ ...btnModificar, ...(loading || editing ? btnDisabled : {}) }}
              onClick={handleModificar}
              disabled={loading || editing}
              title={editing ? "Ya estás editando" : ""}
            >
              Modificar
            </button>

            <button
              style={{ ...btnVolver, ...(loading ? btnDisabled : {}) }}
              onClick={() => router.replace("/login")}
              disabled={loading}
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

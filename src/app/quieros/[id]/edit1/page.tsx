"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   Helpers
========================= */
function getParamId(raw: string | string[] | undefined) {
  if (!raw) return "";
  return Array.isArray(raw) ? raw[0] : raw;
}

function isUUID(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    (v || "").trim()
  );
}

function cleanText(s: string) {
  return (s || "").trim();
}

function normalizeTipo(v: string | null | undefined) {
  const t = (v ?? "").trim().toLowerCase();
  if (t.includes("inhab")) return "inhabilitante";
  if (t.includes("hab")) return "habilitante";
  return "otro";
}

function normalizeAmbito(v: string | null | undefined) {
  const t = (v ?? "").trim();
  return t || "General";
}

/* =========================
   Tipos
========================= */
type QuieroDB = {
  id: string;
  status: string | null;
};

type ActionDB = {
  id: string;
  user_id: string | null;
  quiero_id: string | null;
  title: string | null;
  tipo: string | null;
  ambito: string | null;
  otros_detalle: string | null;
  estado_item: string | null;
  created_at: string | null;
};

const AMBITOS = ["Salud", "Pareja", "Familia", "Trabajo", "Finanzas", "Amigos", "Otros"] as const;

/* =========================
   Estética CANÓNICA
   - SIN fondo local (lo da layout.tsx + globals.css)
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

const titleStyle: React.CSSProperties = {
  fontSize: 30,
  margin: 0,
  lineHeight: 1.15,
  fontWeight: 550,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 16,
  lineHeight: 1.4,
  marginTop: 10,
  marginBottom: 0,
  opacity: 0.92,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 22,
  lineHeight: 1.2,
  margin: "18px 0 8px 0",
  fontWeight: 550,
};

const sectionHint: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.35,
  margin: "0 0 12px 0",
  opacity: 0.92,
};

const btnBase: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.22)",
  cursor: "pointer",
  fontWeight: 850,
  color: "rgba(255,255,255,0.96)",
  textShadow: "0 1px 2px rgba(0,0,0,0.35)",
  boxShadow: "0 10px 26px rgba(0,0,0,0.25)",
};

const btnGreen: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(30,180,120,0.65), rgba(20,140,95,0.55))",
};

const btnBlue: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(70,120,255,0.55), rgba(40,80,220,0.45))",
};

const btnGray: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, rgba(255,255,255,0.20), rgba(255,255,255,0.12))",
};

export default function Edit1HabilitantesInhabilitantesPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const params = useParams();
  const router = useRouter();

  const quieroId = useMemo(() => getParamId((params as any)?.id), [params]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [quieroStatus, setQuieroStatus] = useState<string | null>(null);
  const bloqueado = (quieroStatus ?? "").toLowerCase() === "reformulado";

  // Inputs
  const [inhInput, setInhInput] = useState("");
  const [habInput, setHabInput] = useState("");

  // Ámbito + detalle
  const [inhAmbito, setInhAmbito] = useState<(typeof AMBITOS)[number]>("Salud");
  const [inhOtrosDetalle, setInhOtrosDetalle] = useState("");

  const [habAmbito, setHabAmbito] = useState<(typeof AMBITOS)[number]>("Salud");
  const [habOtrosDetalle, setHabOtrosDetalle] = useState("");

  const [inhabilitantes, setInhabilitantes] = useState<ActionDB[]>([]);
  const [habilitantes, setHabilitantes] = useState<ActionDB[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  async function loadAll() {
    setErrorMsg(null);

    const id = cleanText(quieroId);
    if (!id) {
      setLoading(false);
      setErrorMsg("Falta el identificador del Quiero en la URL.");
      return;
    }
    if (!isUUID(id)) {
      setLoading(false);
      setErrorMsg(`El identificador del Quiero no es válido (UUID). Valor: "${id}"`);
      return;
    }

    setLoading(true);

    // 1) status del quiero
    const qRes = await supabase.from("quieros").select("id,status").eq("id", id).maybeSingle();

    if (qRes.error) {
      setLoading(false);
      setErrorMsg(`No se pudo leer el Quiero (quieros). Error: ${qRes.error.message}`);
      return;
    }

    const q = qRes.data as QuieroDB | null;
    setQuieroStatus(q?.status ?? null);

    // 2) actions del quiero
    const aRes = await supabase
      .from("actions")
      .select("id,user_id,quiero_id,title,tipo,ambito,otros_detalle,estado_item,created_at")
      .eq("quiero_id", id)
      .order("created_at", { ascending: true });

    if (aRes.error) {
      setLoading(false);
      setErrorMsg(`No se pudieron leer ítems (actions). Error: ${aRes.error.message}`);
      return;
    }

    const rows = (aRes.data ?? []) as ActionDB[];
    const inh: ActionDB[] = [];
    const hab: ActionDB[] = [];

    for (const r of rows) {
      const nt = normalizeTipo(r.tipo);
      if (nt === "inhabilitante") inh.push(r);
      else if (nt === "habilitante") hab.push(r);
    }

    setInhabilitantes(inh);
    setHabilitantes(hab);

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quieroId]);

  function validateAmbitoDetalle(ambito: string, otrosDetalle: string) {
    if (ambito === "Otros") {
      const v = cleanText(otrosDetalle);
      if (!v) return "Elegiste 'Otros': tenés que completar el detalle.";
    }
    return null;
  }

  async function addItem(tipo: "inhabilitante" | "habilitante") {
    if (bloqueado) return;

    setErrorMsg(null);

    const id = cleanText(quieroId);
    if (!isUUID(id)) {
      setErrorMsg("No se puede agregar: el id del Quiero no es UUID válido.");
      return;
    }

    const raw = tipo === "inhabilitante" ? inhInput : habInput;
    const title = cleanText(raw);
    if (!title) {
      setErrorMsg(
        tipo === "inhabilitante"
          ? "Escribí un inhabilitante antes de agregar."
          : "Escribí un habilitante antes de agregar."
      );
      return;
    }

    const ambito = tipo === "inhabilitante" ? inhAmbito : habAmbito;
    const otrosDetalle = tipo === "inhabilitante" ? inhOtrosDetalle : habOtrosDetalle;

    const ambErr = validateAmbitoDetalle(ambito, otrosDetalle);
    if (ambErr) {
      setErrorMsg(ambErr);
      return;
    }

    setSaving(true);

    const uRes = await supabase.auth.getUser();
    const user = uRes.data.user;
    if (!user) {
      setSaving(false);
      setErrorMsg("No se detecta usuario logueado. Cerrá sesión y volvé a iniciar sesión.");
      return;
    }

    const payload: any = {
      quiero_id: id,
      user_id: user.id,
      title,
      tipo,
      ambito,
    };

    if (ambito === "Otros") {
      payload.otros_detalle = cleanText(otrosDetalle);
    } else {
      payload.otros_detalle = null;
    }

    const ins = await supabase.from("actions").insert(payload);

    if (ins.error) {
      setSaving(false);
      setErrorMsg(`No se pudo agregar (${tipo}). Error: ${ins.error.message}`);
      return;
    }

    if (tipo === "inhabilitante") {
      setInhInput("");
      setInhAmbito("Salud");
      setInhOtrosDetalle("");
    } else {
      setHabInput("");
      setHabAmbito("Salud");
      setHabOtrosDetalle("");
    }

    await loadAll();
    setSaving(false);
  }

  function startEdit(it: ActionDB) {
    if (bloqueado) return;
    setEditingId(it.id);
    setEditingValue(it.title ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingValue("");
  }

  async function saveEdit() {
    if (bloqueado) return;
    if (!editingId) return;

    const v = cleanText(editingValue);
    if (!v) {
      setErrorMsg("El texto no puede quedar vacío.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const upd = await supabase.from("actions").update({ title: v }).eq("id", editingId);
    if (upd.error) {
      setSaving(false);
      setErrorMsg(`No se pudo modificar. Error: ${upd.error.message}`);
      return;
    }

    cancelEdit();
    await loadAll();
    setSaving(false);
  }

  async function removeItem(id: string) {
    if (bloqueado) return;

    const ok = window.confirm("¿Seguro que querés quitar este ítem?");
    if (!ok) return;

    setSaving(true);
    setErrorMsg(null);

    const del = await supabase.from("actions").delete().eq("id", id);
    if (del.error) {
      setSaving(false);
      setErrorMsg(`No se pudo quitar. Error: ${del.error.message}`);
      return;
    }

    await loadAll();
    setSaving(false);
  }

  // Enter agrega; Alt+Enter deja salto de línea
  function handleEnterToAdd(e: React.KeyboardEvent<HTMLTextAreaElement>, tipo: "inhabilitante" | "habilitante") {
    if (e.key !== "Enter") return;
    if (e.altKey) return;
    e.preventDefault();
    addItem(tipo);
  }

  /* =========================
     Styles canónicos (compacto)
  ========================= */
  const wrapText: React.CSSProperties = {
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    lineHeight: 1.25,
  };

  const label: React.CSSProperties = {
    fontSize: 14,
    opacity: 0.95,
    marginBottom: 6,
  };

  const textarea: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.10)",
    color: "rgba(255,255,255,0.96)",
    outline: "none",
    fontSize: 15,
    resize: "vertical",
    minHeight: 52,
    ...wrapText,
  };

  const select: React.CSSProperties = {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.10)",
    color: "rgba(255,255,255,0.96)",
    outline: "none",
    fontSize: 15,
    width: 190,
    appearance: "none",
    paddingRight: 44,
    backgroundImage:
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'><path d='M7 10l5 5 5-5z'/></svg>\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    backgroundSize: "18px",
  };

  const optionStyle: React.CSSProperties = {
    background: "rgba(0,0,0,0.92)",
    color: "rgba(255,255,255,0.96)",
  };

  const itemBox: React.CSSProperties = {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  };

  const badge: React.CSSProperties = {
    fontSize: 12,
    padding: "3px 9px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.90)",
    whiteSpace: "nowrap",
    opacity: 0.95,
  };

  const listEmpty: React.CSSProperties = {
    ...itemBox,
    justifyContent: "flex-start",
    color: "rgba(255,255,255,0.86)",
    fontSize: 14,
  };

  const divider: React.CSSProperties = {
    height: 1,
    background: "rgba(255,255,255,0.12)",
    marginTop: 14,
    marginBottom: 12,
  };

  const bottomRow: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: 16,
  };

  return (
    <main>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: 28,
        }}
      >
        <section style={{ width: "min(980px, 100%)" }}>
          <div style={{ ...glassCard, opacity: saving ? 0.96 : 1, transition: "opacity 120ms ease" }}>
            <h1 style={titleStyle}>Modificar habilitantes e inhabilitantes</h1>
            <p style={subtitleStyle}>
              Paso 2 de 2. Podés agregar, modificar o quitar ítems.
              {bloqueado ? " (Bloqueado por estado reformulado.)" : ""}
            </p>

            {bloqueado && (
              <div
                style={{
                  marginTop: 14,
                  padding: "12px 14px",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,120,120,0.14)",
                  color: "rgba(255,255,255,0.92)",
                  fontSize: 14,
                  opacity: 0.98,
                }}
              >
                Este Quiero está en estado <b style={{ fontWeight: 650 }}>reformulado</b>. No se puede agregar, modificar ni
                quitar nada.
              </div>
            )}

            {errorMsg && (
              <div
                style={{
                  marginTop: 14,
                  padding: "12px 14px",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,80,80,0.16)",
                  color: "rgba(255,255,255,0.92)",
                  fontSize: 14,
                  whiteSpace: "pre-wrap",
                  opacity: 0.98,
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* ========================= INHABILITANTES ========================= */}
            <div style={divider} />
            <h2 style={sectionTitle}>Inhabilitantes</h2>
            <p style={sectionHint}>Lo que hoy te frena. (Enter agrega / Alt+Enter deja salto de línea)</p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 12,
                alignItems: "end",
                marginBottom: 12,
              }}
            >
              <div>
                <div style={label}>Nuevo inhabilitante</div>
                <textarea
                  style={textarea}
                  placeholder="Escribí y agregá... (Enter agrega / Alt+Enter nueva línea)"
                  value={inhInput}
                  onChange={(e) => setInhInput(e.target.value)}
                  onKeyDown={(e) => handleEnterToAdd(e, "inhabilitante")}
                  disabled={saving || bloqueado}
                />
              </div>

              <div>
                <div style={label}>Ámbito</div>
                <select
                  style={select}
                  value={inhAmbito}
                  onChange={(e) => setInhAmbito(e.target.value as any)}
                  disabled={saving || bloqueado}
                >
                  {AMBITOS.map((a) => (
                    <option key={a} value={a} style={optionStyle}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {inhAmbito === "Otros" && (
              <div style={{ marginBottom: 12 }}>
                <div style={label}>Detalle (obligatorio en “Otros”)</div>
                <textarea
                  style={textarea}
                  placeholder="Ej.: Otros: tema específico... (Alt+Enter para saltos)"
                  value={inhOtrosDetalle}
                  onChange={(e) => setInhOtrosDetalle(e.target.value)}
                  disabled={saving || bloqueado}
                />
              </div>
            )}

            <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
              {loading ? (
                <div style={{ fontSize: 14, opacity: 0.9 }}>Cargando…</div>
              ) : inhabilitantes.length === 0 ? (
                <div style={listEmpty}>Todavía no registraste inhabilitantes.</div>
              ) : (
                inhabilitantes.map((it) => {
                  const isEditing = editingId === it.id;
                  const amb = normalizeAmbito(it.ambito);
                  return (
                    <div key={it.id} style={itemBox}>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        {isEditing ? (
                          <textarea
                            style={textarea}
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            disabled={saving || bloqueado}
                          />
                        ) : (
                          <div style={{ fontSize: 15, opacity: 0.98, ...wrapText }}>{it.title ?? "—"}</div>
                        )}

                        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <span style={badge}>inhabilitante</span>
                          <span style={badge}>ámbito: {amb}</span>
                          {amb === "Otros" && <span style={badge}>detalle: {cleanText(it.otros_detalle ?? "—")}</span>}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              style={{ ...btnBlue, padding: "10px 14px", fontSize: 14, opacity: saving ? 0.75 : 1 }}
                              onClick={saveEdit}
                              disabled={saving || bloqueado}
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              style={{ ...btnGray, padding: "10px 14px", fontSize: 14, opacity: saving ? 0.75 : 1 }}
                              onClick={cancelEdit}
                              disabled={saving}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              style={{ ...btnBlue, padding: "10px 14px", fontSize: 14, opacity: saving ? 0.75 : 1 }}
                              onClick={() => startEdit(it)}
                              disabled={saving || bloqueado}
                            >
                              Modificar
                            </button>
                            <button
                              type="button"
                              style={{ ...btnGray, padding: "10px 14px", fontSize: 14, opacity: saving ? 0.75 : 1 }}
                              onClick={() => removeItem(it.id)}
                              disabled={saving || bloqueado}
                            >
                              Quitar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              type="button"
              style={{
                ...btnGreen,
                width: "100%",
                padding: "14px 16px",
                fontSize: 16,
                opacity: saving ? 0.75 : 1,
              }}
              onClick={() => addItem("inhabilitante")}
              disabled={saving || bloqueado}
            >
              Agregar inhabilitante
            </button>

            {/* ========================= HABILITANTES ========================= */}
            <div style={divider} />
            <h2 style={sectionTitle}>Habilitantes</h2>
            <p style={sectionHint}>Lo que te ayuda a avanzar. (Enter agrega / Alt+Enter deja salto de línea)</p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 12,
                alignItems: "end",
                marginBottom: 12,
              }}
            >
              <div>
                <div style={label}>Nuevo habilitante</div>
                <textarea
                  style={textarea}
                  placeholder="Escribí y agregá... (Enter agrega / Alt+Enter nueva línea)"
                  value={habInput}
                  onChange={(e) => setHabInput(e.target.value)}
                  onKeyDown={(e) => handleEnterToAdd(e, "habilitante")}
                  disabled={saving || bloqueado}
                />
              </div>

              <div>
                <div style={label}>Ámbito</div>
                <select
                  style={select}
                  value={habAmbito}
                  onChange={(e) => setHabAmbito(e.target.value as any)}
                  disabled={saving || bloqueado}
                >
                  {AMBITOS.map((a) => (
                    <option key={a} value={a} style={optionStyle}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {habAmbito === "Otros" && (
              <div style={{ marginBottom: 12 }}>
                <div style={label}>Detalle (obligatorio en “Otros”)</div>
                <textarea
                  style={textarea}
                  placeholder="Ej.: Otros: tema específico... (Alt+Enter para saltos)"
                  value={habOtrosDetalle}
                  onChange={(e) => setHabOtrosDetalle(e.target.value)}
                  disabled={saving || bloqueado}
                />
              </div>
            )}

            <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
              {loading ? (
                <div style={{ fontSize: 14, opacity: 0.9 }}>Cargando…</div>
              ) : habilitantes.length === 0 ? (
                <div style={listEmpty}>Todavía no registraste habilitantes.</div>
              ) : (
                habilitantes.map((it) => {
                  const isEditing = editingId === it.id;
                  const amb = normalizeAmbito(it.ambito);
                  return (
                    <div key={it.id} style={itemBox}>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        {isEditing ? (
                          <textarea
                            style={textarea}
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            disabled={saving || bloqueado}
                          />
                        ) : (
                          <div style={{ fontSize: 15, opacity: 0.98, ...wrapText }}>{it.title ?? "—"}</div>
                        )}

                        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <span style={badge}>habilitante</span>
                          <span style={badge}>ámbito: {amb}</span>
                          {amb === "Otros" && <span style={badge}>detalle: {cleanText(it.otros_detalle ?? "—")}</span>}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              style={{ ...btnBlue, padding: "10px 14px", fontSize: 14, opacity: saving ? 0.75 : 1 }}
                              onClick={saveEdit}
                              disabled={saving || bloqueado}
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              style={{ ...btnGray, padding: "10px 14px", fontSize: 14, opacity: saving ? 0.75 : 1 }}
                              onClick={cancelEdit}
                              disabled={saving}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              style={{ ...btnBlue, padding: "10px 14px", fontSize: 14, opacity: saving ? 0.75 : 1 }}
                              onClick={() => startEdit(it)}
                              disabled={saving || bloqueado}
                            >
                              Modificar
                            </button>
                            <button
                              type="button"
                              style={{ ...btnGray, padding: "10px 14px", fontSize: 14, opacity: saving ? 0.75 : 1 }}
                              onClick={() => removeItem(it.id)}
                              disabled={saving || bloqueado}
                            >
                              Quitar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              type="button"
              style={{
                ...btnGreen,
                width: "100%",
                padding: "14px 16px",
                fontSize: 16,
                opacity: saving ? 0.75 : 1,
              }}
              onClick={() => addItem("habilitante")}
              disabled={saving || bloqueado}
            >
              Agregar habilitante
            </button>

            {/* ===== FILA DE CIERRE ===== */}
            <div style={bottomRow}>
              <button
                type="button"
                style={{
                  ...btnBlue,
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: 16,
                  opacity: saving ? 0.75 : 1,
                }}
                onClick={() => router.push(`/quieros/${quieroId}/edit`)}
                disabled={saving}
              >
                Volver a modificar mi Quiero
              </button>

              <button
                type="button"
                style={{
                  ...btnGray,
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: 16,
                  opacity: saving ? 0.75 : 1,
                }}
                onClick={() => router.push("/quieros")}
                disabled={saving}
              >
                Ya terminé
              </button>
            </div>

            {/* ID (micro) */}
            {quieroId ? (
              <div style={{ marginTop: 12, fontSize: 12, opacity: 0.82 }}>
                Quiero actual: <span style={{ opacity: 0.95 }}>{quieroId}</span>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

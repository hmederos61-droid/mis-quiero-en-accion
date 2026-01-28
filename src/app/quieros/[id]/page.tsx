"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type QuieroRow = {
  id: string;
  created_at: string;

  user_id: string | null;

  // NOT NULL
  title: string;
  purpose: string;
  domain: string;
  titulo: string;

  // opcionales
  priority: number | null;
  status: string | null;
  due_date: string | null;

  descripcion: string | null;
  estado: string | null;
  prioridad: number | null;
  fecha_objetivo: string | null;

  updated_at: string | null;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatFecha(ts: string | null | undefined) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

function labelDomain(d: string | null | undefined) {
  const v = (d ?? "").trim();
  if (!v) return "ÔÇö";
  const map: Record<string, string> = {
    salud: "Salud",
    familia: "Familia",
    pareja: "Pareja",
    trabajo: "Trabajo",
    finanzas: "Finanzas",
    amistades: "Amistades",
    desarrollo_personal: "Desarrollo personal",
    ocio: "Ocio",
    otros: "Otros",
  };
  return map[v] ?? v;
}

function getTitulo(q: QuieroRow) {
  const t = (q.titulo ?? "").trim();
  if (t) return t;
  const en = (q.title ?? "").trim();
  if (en) return en;
  return "Quiero sin t├¡tulo";
}

function getPurpose(q: QuieroRow) {
  const p = (q.purpose ?? "").trim();
  if (p) return p;
  const d = (q.descripcion ?? "").trim();
  return d ? d : "";
}

function getEstado(q: QuieroRow) {
  return ((q.estado ?? q.status ?? "activo") as string).trim() || "activo";
}

function getPrioridad(q: QuieroRow) {
  const v = q.prioridad ?? q.priority;
  return typeof v === "number" ? v : null;
}

function getFechaObjetivo(q: QuieroRow) {
  return (q.fecha_objetivo ?? q.due_date ?? null) as string | null;
}

export default function QuieroDetallePage() {
  const router = useRouter();
  const params = useParams();

  const quieroId = useMemo(() => {
    const raw = (params as any)?.id;
    return typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [q, setQ] = useState<QuieroRow | null>(null);

  // Mensaje "Guardado"
  const [showSaved, setShowSaved] = useState(false);

  async function loadOne() {
    setLoading(true);
    setErrorMsg(null);

    try {
      if (!quieroId) {
        setErrorMsg("ID inv├ílido.");
        setQ(null);
        return;
      }

      const supabase = createSupabaseBrowserClient();

      const { data, error } = await supabase
        .from("quieros")
        .select(
          [
            "id",
            "created_at",
            "user_id",
            "title",
            "purpose",
            "domain",
            "priority",
            "status",
            "due_date",
            "updated_at",
            "titulo",
            "descripcion",
            "estado",
            "prioridad",
            "fecha_objetivo",
          ].join(",")
        )
        .eq("id", quieroId)
        .single();

      if (error) throw error;

      setQ(data as unknown as QuieroRow);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "No se pudo cargar el Quiero.");
      setQ(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOne();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quieroId]);

  // Mostrar ÔÇ£GuardadoÔÇØ si venimos de editar (sessionStorage o ?saved=1)
  useEffect(() => {
    let shouldShow = false;

    // 1) sessionStorage (preferido)
    try {
      const savedId = sessionStorage.getItem("mq_saved_quiero_id");
      const ts = Number(sessionStorage.getItem("mq_saved_ts") || "0");

      const isThis = savedId && savedId === quieroId;
      const fresh = ts > 0 && Date.now() - ts < 60_000; // 1 minuto

      if (isThis && fresh) {
        shouldShow = true;
        sessionStorage.removeItem("mq_saved_quiero_id");
        sessionStorage.removeItem("mq_saved_ts");
      }
    } catch {
      // noop
    }

    // 2) fallback: query param ?saved=1 (por si alguna versi├│n lo usa)
    try {
      const u = new URL(window.location.href);
      if (u.searchParams.get("saved") === "1") {
        shouldShow = true;
        // limpiamos la URL sin recargar
        u.searchParams.delete("saved");
        window.history.replaceState({}, "", u.pathname + (u.search ? u.search : "") + u.hash);
      }
    } catch {
      // noop
    }

    if (!shouldShow) return;

    setShowSaved(true);
    const t = window.setTimeout(() => setShowSaved(false), 2500);
    return () => window.clearTimeout(t);
  }, [quieroId]);

  // ESC vuelve
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") router.push("/quieros");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  // ===== Est├®tica =====
  const wrap = "min-h-screen w-full bg-[url('/welcome.png')] bg-cover bg-center bg-fixed";
  const card =
    "mx-auto w-full max-w-5xl rounded-[26px] border border-white/20 bg-white/[0.08] backdrop-blur-[18px] shadow-[0_26px_90px_rgba(0,0,0,0.45)]";
  const inner = "p-9 md:p-12 text-white/90";
  const btn =
    "rounded-xl border border-white/20 bg-white/[0.08] px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/[0.12] active:bg-white/[0.16] transition";
  const btnPrimary =
    "rounded-xl border border-white/25 bg-white/[0.14] px-4 py-2 text-sm font-semibold text-white hover:bg-white/[0.18] active:bg-white/[0.22] transition";
  const divider = "border-t border-white/10";

  const toastSaved =
    "mb-5 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm text-white/90";

  return (
    <div className={wrap}>
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.62))",
        }}
      />

      <div className="relative px-6 py-10 md:py-14">
        <div className={card}>
          <div className={inner}>
            {showSaved ? (
              <div className={toastSaved}>
                <span className="font-semibold">Guardado.</span>{" "}
                <span className="text-white/70">Los cambios se actualizaron correctamente.</span>
              </div>
            ) : null}

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[34px] md:text-[38px] font-semibold tracking-tight">
                  Ver Quiero
                </div>
                <div className="mt-2 text-base text-white/70">
                  Pantalla de lectura. Sin tableros. Sin ruido.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className={btn} onClick={() => router.push("/quieros")} type="button">
                  Volver
                </button>
                <button className={btnPrimary} onClick={loadOne} type="button" disabled={loading}>
                  {loading ? "Actualizando..." : "Actualizar"}
                </button>
              </div>
            </div>

            <div className={cx("mt-8", divider)} />

            {errorMsg ? (
              <div className="mt-6 rounded-xl border border-red-200/20 bg-red-500/12 px-4 py-3 text-sm text-white/90">
                {errorMsg}
              </div>
            ) : null}

            {loading ? (
              <div className="mt-6 text-white/65 text-sm">Cargando el Quiero...</div>
            ) : !q ? (
              <div className="mt-6 text-white/70 text-sm">No encontramos este Quiero.</div>
            ) : (
              <div className="mt-6 grid gap-6">
                <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-6">
                  <div className="text-white/90 text-xl font-semibold">{getTitulo(q)}</div>
                  <div className="mt-2 text-white/75 text-sm">{getPurpose(q)}</div>

                  <div className="mt-4 text-xs text-white/55">
                    Creado: {formatFecha(q.created_at)}{" "}
                    {q.updated_at ? `┬À Actualizado: ${formatFecha(q.updated_at)}` : ""}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5">
                    <div className="text-xs text-white/55">├ümbito</div>
                    <div className="mt-1 text-white/90 font-semibold">{labelDomain(q.domain)}</div>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5">
                    <div className="text-xs text-white/55">Estado</div>
                    <div className="mt-1 text-white/90 font-semibold">{getEstado(q)}</div>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5">
                    <div className="text-xs text-white/55">Prioridad</div>
                    <div className="mt-1 text-white/90 font-semibold">
                      {getPrioridad(q) ?? "ÔÇö"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5">
                    <div className="text-xs text-white/55">Fecha objetivo</div>
                    <div className="mt-1 text-white/90 font-semibold">
                      {getFechaObjetivo(q) ?? "ÔÇö"}
                    </div>
                  </div>
                </div>

                <div className={divider} />

                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/55">
                    ID: <span className="text-white/75">{q.id}</span>
                  </div>

                  <button
                    className={btn}
                    onClick={() => router.push(`/quieros/${q.id}/edit`)}
                    type="button"
                  >
                    Editar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

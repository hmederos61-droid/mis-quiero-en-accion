"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

function getParamId(raw: string | string[] | undefined) {
  if (!raw) return "";
  return Array.isArray(raw) ? raw[0] : raw;
}

function isUUID(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export default function NuevaAccionPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const params = useParams();
  const router = useRouter();

  const quieroId = getParamId((params as any)?.id);
  const idValido = isUUID(quieroId);

  const [title, setTitle] = useState("");
  const [tipo, setTipo] = useState<"habilitante" | "inhabilitante">("habilitante");
  const [ambito, setAmbito] = useState<"Personal" | "Laboral" | "Familiar" | "Social" | "Otros">("Personal");
  const [otrosDetalle, setOtrosDetalle] = useState("");
  const [estadoItem, setEstadoItem] = useState<"pendiente" | "en_progreso" | "cumplido">("pendiente");

  const [estado, setEstado] = useState("");
  const [detalle, setDetalle] = useState("");

  async function guardar(e: React.FormEvent) {
    e.preventDefault();

    if (!idValido) {
      setEstado("ID inválido");
      setDetalle(`El ID del Quiero no es válido.\nID recibido: "${quieroId}"`);
      return;
    }

    setEstado("Guardando...");
    setDetalle("");

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      setEstado("Error de sesión");
      setDetalle(userError.message);
      return;
    }

    if (!userData?.user) {
      setEstado("No hay usuario logueado");
      setDetalle("Andá a /login e ingresá.");
      return;
    }

    if (!title.trim()) {
      setEstado("Falta el título");
      return;
    }

    if (ambito === "Otros" && !otrosDetalle.trim()) {
      setEstado("Falta el detalle de 'Otros'");
      return;
    }

    // IMPORTANTE: usamos los nombres de columnas reales que el detalle está leyendo:
    // actions: quiero_id, title, tipo, ambito, otros_detalle, estado_item
    const payload = {
      quiero_id: quieroId,
      title: title.trim(),
      tipo,
      ambito,
      otros_detalle: ambito === "Otros" ? otrosDetalle.trim() : null,
      estado_item: estadoItem,
    };

    const { error } = await supabase.from("actions").insert(payload);

    if (error) {
      setEstado("Error al guardar");
      setDetalle(error.message);
      return;
    }

    router.push(`/quieros/${quieroId}`);
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Nueva acción</h1>

          <div className="flex items-center gap-3">
            <Link href={idValido ? `/quieros/${quieroId}` : "/quieros"} className="glass-button no-underline">
              ← Volver
            </Link>
          </div>
        </div>

        {!idValido ? (
          <div className="glass-panel mt-4 p-4">
            <b>Atención:</b> el ID del Quiero en la URL no es válido.
            <div className="mt-2 text-sm opacity-80">ID recibido: "{quieroId}"</div>
            <div className="mt-3">
              <Link href="/quieros" className="glass-button no-underline">
                Ir a /quieros
              </Link>
            </div>
          </div>
        ) : null}

        <form onSubmit={guardar} className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm opacity-80">Título</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input"
              placeholder="Ej: Preparar agenda semanal"
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm opacity-80">Tipo</span>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as any)} className="glass-input">
              <option value="habilitante">Habilitante</option>
              <option value="inhabilitante">Inhabilitante</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm opacity-80">Ámbito</span>
            <select value={ambito} onChange={(e) => setAmbito(e.target.value as any)} className="glass-input">
              <option value="Personal">Personal</option>
              <option value="Laboral">Laboral</option>
              <option value="Familiar">Familiar</option>
              <option value="Social">Social</option>
              <option value="Otros">Otros</option>
            </select>
          </label>

          {ambito === "Otros" ? (
            <label className="grid gap-2">
              <span className="text-sm opacity-80">Detalle (Otros)</span>
              <textarea
                value={otrosDetalle}
                onChange={(e) => setOtrosDetalle(e.target.value)}
                className="glass-input"
                rows={3}
                placeholder="Especificá el ámbito..."
              />
            </label>
          ) : null}

          <label className="grid gap-2">
            <span className="text-sm opacity-80">Estado</span>
            <select value={estadoItem} onChange={(e) => setEstadoItem(e.target.value as any)} className="glass-input">
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En progreso</option>
              <option value="cumplido">Cumplido</option>
            </select>
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" className="glass-button">
              Guardar acción
            </button>

            <Link href={`/quieros/${quieroId}`} className="glass-button no-underline">
              Cancelar
            </Link>
          </div>
        </form>

        <p className="mt-5 glass-help">
          <b>Estado:</b> {estado || "-"}
        </p>

        {detalle ? (
          <pre className="glass-panel mt-3 p-4 whitespace-pre-wrap text-sm">{detalle}</pre>
        ) : null}
      </div>
    </main>
  );
}

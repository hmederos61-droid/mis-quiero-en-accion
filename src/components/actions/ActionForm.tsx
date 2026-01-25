"use client";

import React, { useState } from "react";

export type ActionTipo = "habilitante" | "inhabilitante";
export type ActionAmbito = "Personal" | "Laboral" | "Familiar" | "Social" | "Otros";
export type ActionEstadoItem = "pendiente" | "en_progreso" | "cumplido";

export type ActionFormValues = {
  title: string;
  tipo: ActionTipo;
  ambito: ActionAmbito;
  otrosDetalle: string;
  estadoItem: ActionEstadoItem;
};

type ActionFormProps = {
  initialValues?: Partial<ActionFormValues>;
  onSubmit: (values: ActionFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
};

const DEFAULT_VALUES: ActionFormValues = {
  title: "",
  tipo: "habilitante",
  ambito: "Personal",
  otrosDetalle: "",
  estadoItem: "pendiente",
};

export default function ActionForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Guardar acción",
}: ActionFormProps) {
  const [values, setValues] = useState<ActionFormValues>({
    ...DEFAULT_VALUES,
    ...(initialValues ?? {}),
  });

  const [loading, setLoading] = useState(false);

  function setField<K extends keyof ActionFormValues>(key: K, value: ActionFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(values);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-5">
      <div>
        <label className="glass-label block mb-1">Título</label>
        <input
          value={values.title}
          onChange={(e) => setField("title", e.target.value)}
          className="glass-input"
          placeholder="Ej: Llamar y pedir turno"
          required
        />
      </div>

      <div>
        <label className="glass-label block mb-1">Tipo</label>
        <select
          value={values.tipo}
          onChange={(e) => setField("tipo", e.target.value as ActionTipo)}
          className="glass-input"
        >
          <option value="habilitante">Habilitante</option>
          <option value="inhabilitante">Inhabilitante</option>
        </select>
      </div>

      <div>
        <label className="glass-label block mb-1">Ámbito</label>
        <select
          value={values.ambito}
          onChange={(e) => {
            const amb = e.target.value as ActionAmbito;
            setField("ambito", amb);
            // Si cambia a algo distinto de "Otros", limpiamos el detalle para evitar basura guardada
            if (amb !== "Otros") setField("otrosDetalle", "");
          }}
          className="glass-input"
        >
          <option value="Personal">Personal</option>
          <option value="Laboral">Laboral</option>
          <option value="Familiar">Familiar</option>
          <option value="Social">Social</option>
          <option value="Otros">Otros</option>
        </select>
      </div>

      {values.ambito === "Otros" && (
        <div>
          <label className="glass-label block mb-1">Detalle (Otros)</label>
          <textarea
            value={values.otrosDetalle}
            onChange={(e) => setField("otrosDetalle", e.target.value)}
            className="glass-input min-h-[80px]"
            placeholder="Escribí el detalle…"
            required
          />
        </div>
      )}

      <div>
        <label className="glass-label block mb-1">Estado</label>
        <select
          value={values.estadoItem}
          onChange={(e) => setField("estadoItem", e.target.value as ActionEstadoItem)}
          className="glass-input"
        >
          <option value="pendiente">Pendiente</option>
          <option value="en_progreso">En progreso</option>
          <option value="cumplido">Cumplido</option>
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="glass-button" disabled={loading}>
          {loading ? "Guardando…" : submitLabel}
        </button>

        {onCancel && (
          <button type="button" className="glass-button" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

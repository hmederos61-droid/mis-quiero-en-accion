"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function PruebaCrearActionPage() {
  const [estado, setEstado] = useState("Listo");
  const [detalle, setDetalle] = useState("");

  async function crearAction() {
    setEstado("Creando action...");
    setDetalle("");

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      setEstado("No hay usuario logueado");
      setDetalle("Andá a /login e ingresá.");
      return;
    }

    // Tomamos el último quiero del usuario
    const { data: q, error: qErr } = await supabase
      .from("quieros")
      .select("id, title")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (qErr) {
      setEstado("Error leyendo quieros");
      setDetalle(qErr.message);
      return;
    }
    if (!q) {
      setEstado("No hay quieros para vincular");
      setDetalle("Creá uno en /prueba-crear-quiero.");
      return;
    }

    const payload = {
      user_id: userData.user.id,
      quiero_id: q.id,
      title: "Habilitante de prueba",
      due_date: null as string | null,
      is_done: false,
      tipo: "habilitante",
      ambito: "Otros",
      otros_detalle: "Detalle Otros (prueba)",
      estado_item: "pendiente",
    };

    const { data, error } = await supabase
      .from("actions")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      setEstado("Error al insertar action");
      setDetalle(error.message);
      return;
    }

    setEstado("Insert action OK");
    setDetalle(JSON.stringify({ quiero: q, action: data }, null, 2));
  }

  async function listar() {
    setEstado("Listando actions...");
    setDetalle("");

    const { data, error } = await supabase
      .from("actions")
      .select("id, title, tipo, ambito, otros_detalle, estado_item, quiero_id, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      setEstado("Error al leer actions");
      setDetalle(error.message);
      return;
    }

    setEstado("Lectura OK");
    setDetalle(JSON.stringify(data, null, 2));
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Prueba crear Action</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button onClick={crearAction} style={{ padding: 10 }}>
          Crear 1 Action
        </button>
        <button onClick={listar} style={{ padding: 10 }}>
          Listar
        </button>
      </div>

      <p>
        <b>Estado:</b> {estado}
      </p>

      <pre style={{ whiteSpace: "pre-wrap", background: "#f5f5f5", padding: 12, borderRadius: 8 }}>
        {detalle}
      </pre>
    </main>
  );
}

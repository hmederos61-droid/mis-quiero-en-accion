"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function PruebaCrearQuieroPage() {
  const [estado, setEstado] = useState("Listo para crear");
  const [detalle, setDetalle] = useState("");

  async function crear() {
    setEstado("Creando...");
    setDetalle("");

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      setEstado("Error leyendo usuario");
      setDetalle(userError.message);
      return;
    }
    if (!userData?.user) {
      setEstado("No hay usuario logueado");
      setDetalle("Andá a /login e ingresá.");
      return;
    }

    // Campos obligatorios en tu tabla: title, purpose, domain (NO NULL)
    const payload = {
      user_id: userData.user.id,
      title: "Quiero de prueba",
      purpose: "Propósito de prueba",
      domain: "Personal",
      status: "activo",
      priority: 1,
      due_date: null as string | null,
    };

    const { data, error } = await supabase
      .from("quieros")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      setEstado("Error al insertar");
      setDetalle(error.message);
      return;
    }

    setEstado("Insert OK");
    setDetalle(JSON.stringify(data, null, 2));
  }

  async function listar() {
    setEstado("Leyendo...");
    setDetalle("");

    const { data, error } = await supabase
      .from("quieros")
      .select("id, title, purpose, domain, status, priority, due_date, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      setEstado("Error al leer");
      setDetalle(error.message);
      return;
    }

    setEstado("Lectura OK");
    setDetalle(JSON.stringify(data, null, 2));
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Prueba crear Quiero</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button onClick={crear} style={{ padding: 10 }}>
          Crear 1 Quiero
        </button>
        <button onClick={listar} style={{ padding: 10 }}>
          Listar
        </button>
      </div>

      <p>
        <b>Estado:</b> {estado}
      </p>

      <pre
        style={{
          whiteSpace: "pre-wrap",
          background: "#f5f5f5",
          padding: 12,
          borderRadius: 8,
        }}
      >
        {detalle}
      </pre>
    </main>
  );
}

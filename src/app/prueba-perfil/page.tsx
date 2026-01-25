"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function PruebaPerfilPage() {
  const [estado, setEstado] = useState("Cargando...");
  const [detalle, setDetalle] = useState("");

  useEffect(() => {
    async function run() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setEstado("No hay usuario logueado");
        setDetalle("Andá a /login e ingresá.");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, rol, nombre, apellido, alias, coach_id")
        .limit(10);

      if (error) {
        setEstado("Error al leer profiles");
        setDetalle(error.message);
        return;
      }

      setEstado("OK");
      setDetalle(JSON.stringify(data, null, 2));
    }

    run();
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Prueba Perfil (RLS)</h1>
      <p><b>Estado:</b> {estado}</p>
      <pre style={{ whiteSpace: "pre-wrap", background: "#f5f5f5", padding: 12, borderRadius: 8 }}>
        {detalle}
      </pre>
    </main>
  );
}

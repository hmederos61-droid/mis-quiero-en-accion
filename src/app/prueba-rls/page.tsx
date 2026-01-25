"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function PruebaRlsPage() {
  const [estado, setEstado] = useState("Probando RLS...");
  const [detalle, setDetalle] = useState("");

  useEffect(() => {
    async function run() {
      const { data, error } = await supabase.from("quieros").select("*").limit(1);

      if (error) {
        setEstado("RLS bloqueó o devolvió error (esperable sin login)");
        setDetalle(error.message);
        return;
      }

      setEstado("Consulta ejecutó (sin login)");
      setDetalle(JSON.stringify(data, null, 2));
    }

    run();
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Prueba RLS</h1>
      <p><b>Estado:</b> {estado}</p>
      <pre style={{ whiteSpace: "pre-wrap", background: "#f5f5f5", padding: 12, borderRadius: 8 }}>
        {detalle}
      </pre>
    </main>
  );
}

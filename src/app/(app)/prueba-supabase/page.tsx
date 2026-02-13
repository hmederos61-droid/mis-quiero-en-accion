"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function PruebaSupabasePage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [estado, setEstado] = useState<string>("Probando conexión...");
  const [detalle, setDetalle] = useState<string>("");

  useEffect(() => {
    async function test() {
      try {
        const { data, error } = await supabase
          .from("app_settings")
          .select("*")
          .limit(1);

        if (error) {
          setEstado("Conectó, pero hubo error en la consulta");
          setDetalle(`${error.message}`);
          return;
        }

        setEstado("Conexión OK + consulta OK");
        setDetalle(JSON.stringify(data, null, 2));
      } catch (e: any) {
        setEstado("Falló la conexión o el código");
        setDetalle(e?.message ?? String(e));
      }
    }

    test();
  }, [supabase]);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Prueba Supabase</h1>
      <p>
        <b>Estado:</b> {estado}
      </p>
      <pre style={{ whiteSpace: "pre-wrap", background: "#f5f5f5", padding: 12, borderRadius: 8 }}>
        {detalle}
      </pre>
    </main>
  );
}

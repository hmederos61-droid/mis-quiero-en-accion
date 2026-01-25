"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type QuieroRow = {
  id: string;
  title: string;
  purpose: string;
  domain: string;
  status: string | null;
  priority: number | null;
  due_date: string | null;
  created_at: string;
};

function isUUID(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export default function QuierosPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [estado, setEstado] = useState("Cargando...");
  const [detalle, setDetalle] = useState("");
  const [items, setItems] = useState<QuieroRow[]>([]);

  async function cargar() {
    setEstado("Cargando...");
    setDetalle("");

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      setEstado("Error de sesión");
      setDetalle(userError.message);
      setItems([]);
      return;
    }

    if (!userData?.user) {
      setEstado("No hay usuario logueado");
      setDetalle("Andá a /login e ingresá.");
      setItems([]);
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("quieros")
      .select("id, title, purpose, domain, status, priority, due_date, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setEstado("Error al leer quieros");
      setDetalle(error.message);
      setItems([]);
      return;
    }

    // Blindaje: nunca mostramos filas con id vacío/no-uuid
    const safe = (data ?? []).filter((q: any) => q?.id && isUUID(q.id));
    setItems(safe as QuieroRow[]);
    setEstado("OK");
  }

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Quieros</h1>
            <p className="glass-help mt-1">
              <b>LISTADO ACTIVO</b> (si ves esto, estás en <code>/quieros</code> correctamente)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/inicio" className="glass-button no-underline">
              ← Inicio
            </Link>

            <button type="button" onClick={() => void cargar()} className="glass-button">
              Recargar
            </button>
          </div>
        </div>

        <p className="mt-4 glass-help">
          <b>Estado:</b> {estado}
        </p>

        {detalle ? (
          <pre className="glass-panel mt-3 p-4 whitespace-pre-wrap text-sm">
            {detalle}
          </pre>
        ) : null}

        <div className="mt-6 grid gap-3">
          {items.length === 0 ? (
            <div className="glass-panel p-4">No hay quieros todavía.</div>
          ) : (
            items.map((q) => (
              <Link
                key={q.id}
                href={`/quieros/${q.id}`}
                className="glass-panel p-4 no-underline text-inherit"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{q.title}</div>
                    <div className="text-sm opacity-80">{q.purpose}</div>
                    <div className="text-xs opacity-70 mt-2">
                      Ámbito: {q.domain} · Estado: {q.status ?? "-"} · Prioridad: {q.priority ?? "-"}
                    </div>
                  </div>

                  <div className="text-xs opacity-70 whitespace-nowrap">
                    {new Date(q.created_at).toLocaleString()}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

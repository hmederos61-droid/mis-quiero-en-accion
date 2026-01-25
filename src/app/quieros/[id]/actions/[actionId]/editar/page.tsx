// src/app/quieros/[id]/actions/[actionId]/editar/page.tsx

import { createServerSupabaseClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string; actionId: string }>;
};

export default async function EditActionPage({ params }: Props) {
  const { id, actionId } = await params;

  const supabase = await createServerSupabaseClient();

  // 1) Debug: usuario autenticado
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const userId = userData?.user?.id ?? null;

  // 2) Traer acción
  const { data: action, error } = await supabase
    .from("actions")
    .select("*")
    .eq("id", actionId)
    .eq("quiero_id", id)
    .maybeSingle();

  // Debug controlado
  if (error || !action) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Editar acción</h1>
        <p style={{ marginTop: 12 }}>No se pudo cargar la acción.</p>

        <pre style={{ marginTop: 16, background: "#111", color: "#f55", padding: 16 }}>
          {JSON.stringify(
            {
              quieroId: id,
              actionId,
              auth: {
                userId,
                userError: userError ?? null,
              },
              query: {
                error: error ?? null,
                action: action ?? null,
              },
            },
            null,
            2
          )}
        </pre>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Editar acción</h1>

      <pre style={{ marginTop: 16, background: "#111", color: "#0f0", padding: 16 }}>
        {JSON.stringify(
          {
            auth: { userId, userError: userError ?? null },
            action,
          },
          null,
          2
        )}
      </pre>
    </div>
  );
}


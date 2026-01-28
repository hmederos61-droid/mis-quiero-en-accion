"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   Estética glass (coherente)
========================= */
const glassCard: React.CSSProperties = {
  borderRadius: 22,
  padding: 46,
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.16)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  boxShadow: "0 18px 60px rgba(0,0,0,0.23)",
  color: "rgba(255,255,255,0.94)",
  textShadow: "0 1px 2px rgba(0,0,0,0.38)",
  width: "min(920px, 100%)",
};

export default function LogoutPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Cerrando sesión…");

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        if (!mounted) return;

        setMsg("Listo. Volvemos al inicio…");
        router.replace("/login");
      } catch {
        if (!mounted) return;
        setMsg("No pudimos cerrar sesión. Intentá nuevamente.");
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <main style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Fondo */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `url("/welcome.png")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: "linear-gradient(rgba(0,0,0,0.10), rgba(0,0,0,0.12))",
        }}
      />

      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 28,
        }}
      >
        <section style={glassCard}>
          <h1 style={{ fontSize: 52, margin: 0, lineHeight: 1.05 }}>
            Salir
          </h1>

          <p style={{ fontSize: 26, lineHeight: 1.35, marginTop: 18 }}>
            {msg}
          </p>

          <p style={{ fontSize: 18, opacity: 0.85, marginTop: 14 }}>
            Si la pantalla no avanza, volv&eacute; manualmente a <b>/login</b>.
          </p>
        </section>
      </div>
    </main>
  );
}

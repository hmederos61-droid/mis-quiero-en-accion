// src/app/menu1/page.tsx
"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   MENU1 — CANÓNICO
   - Solo Admin + Coach
   - Selector visual: Administrador / Coach
   - Estética glass + fondo welcome.png
   - Sin pantallas intermedias ni mensajes raros
========================= */

const pageWrap: React.CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "28px 18px",
};

const glassCard: React.CSSProperties = {
  width: "min(1180px, 92vw)",
  borderRadius: 22,
  padding: "34px 38px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.16)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  boxShadow: "0 18px 60px rgba(0,0,0,0.25)",
  color: "rgba(255,255,255,0.94)",
  textShadow: "0 1px 2px rgba(0,0,0,0.36)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 44,
  letterSpacing: 0.2,
};

const subStyle: React.CSSProperties = {
  marginTop: 10,
  marginBottom: 0,
  fontSize: 18,
  opacity: 0.92,
  lineHeight: 1.5,
};

const sectionLabel: React.CSSProperties = {
  marginTop: 18,
  fontSize: 18,
  opacity: 0.95,
  fontWeight: 700,
};

const btnBase: React.CSSProperties = {
  width: "100%",
  padding: "16px 18px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.22)",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 18,
  color: "rgba(255,255,255,0.96)",
  textShadow: "0 1px 2px rgba(0,0,0,0.35)",
  boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
  transition: "transform 140ms ease, filter 140ms ease",
};

const btnAdmin: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(255,160,80,0.85), rgba(255,110,90,0.82))",
};

const btnCoach: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(120,160,255,0.85), rgba(160,120,255,0.85))",
};

const btnSalir: React.CSSProperties = {
  ...btnBase,
  background: "rgba(120,140,165,0.55)",
};

const hintBlock: React.CSSProperties = {
  marginTop: 14,
  fontSize: 14,
  opacity: 0.9,
  lineHeight: 1.5,
};

const divider: React.CSSProperties = {
  height: 1,
  background: "rgba(255,255,255,0.12)",
  margin: "18px 0 14px",
};

export default function Menu1Page() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [checking, setChecking] = useState(true);

  // Guard canónico: /menu1 solo para Admin+Coach
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;

        const user = userRes.user;
        if (!user) {
          router.replace("/login");
          return;
        }

        const { data: r1, error: e1 } = await supabase
          .from("user_roles")
          .select("role")
          .eq("auth_user_id", user.id);

        if (e1) throw e1;

        const roles = (Array.isArray(r1) ? r1 : [])
          .map((x: any) => String(x.role || "").toLowerCase())
          .filter((x: string) => x === "admin" || x === "coach" || x === "coachee");

        const unique = Array.from(new Set(roles));
        const hasAdmin = unique.includes("admin");
        const hasCoach = unique.includes("coach");

        // Canónico:
        // - Admin+Coach => /menu1 (OK)
        // - Solo Admin => /administrador
        // - Solo Coach => /coach
        // - Coachee => /quieros/inicio
        if (hasAdmin && hasCoach) {
          // OK: se queda acá
        } else if (hasAdmin) {
          router.replace("/administrador");
          return;
        } else if (hasCoach) {
          router.replace("/coach");
          return;
        } else {
          router.replace("/quieros/inicio");
          return;
        }
      } catch {
        router.replace("/login");
        return;
      } finally {
        if (alive) setChecking(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, supabase]);

  async function onSalir() {
    try {
      await supabase.auth.signOut();
    } catch {
      // silencio
    } finally {
      router.replace("/login");
    }
  }

  function hoverOn(e: React.MouseEvent<HTMLButtonElement>) {
    e.currentTarget.style.transform = "translateY(-1px)";
    e.currentTarget.style.filter = "brightness(1.03)";
  }
  function hoverOff(e: React.MouseEvent<HTMLButtonElement>) {
    e.currentTarget.style.transform = "translateY(0px)";
    e.currentTarget.style.filter = "none";
  }

  return (
    <>
      {/* Fondo global welcome.png, sin franjas */}
      <style jsx global>{`
        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          min-height: 100% !important;
          background: url("/welcome.png") center center / cover no-repeat fixed !important;
        }
      `}</style>

      <main style={pageWrap}>
        <section style={glassCard} aria-busy={checking}>
          <h1 style={titleStyle}>Menú principal</h1>

          <p style={subStyle}>
            Este menú se adapta automáticamente a tu perfil.
            <br />
            Vas a ver solo las opciones habilitadas por tu rol.
          </p>

          <div style={divider} />

          <div style={sectionLabel}>¿Cómo querés ingresar?</div>

          <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
            <button
              type="button"
              style={btnAdmin}
              onMouseEnter={hoverOn}
              onMouseLeave={hoverOff}
              onClick={() => router.replace("/administrador")}
              disabled={checking}
            >
              Ingresar como Administrador
            </button>

            <button
              type="button"
              style={btnCoach}
              onMouseEnter={hoverOn}
              onMouseLeave={hoverOff}
              onClick={() => router.replace("/coach")}
              disabled={checking}
            >
              Ingresar como Coach
            </button>
          </div>

          <div style={hintBlock}>
            <div>
              <strong>Administrador</strong>: gestión global · control de accesos ·
              alta de coaches · auditoría
            </div>
            <div>
              <strong>Coach</strong>: alta de coachee · gestión de quieros ·
              seguimiento
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <button
              type="button"
              style={btnSalir}
              onMouseEnter={hoverOn}
              onMouseLeave={hoverOff}
              onClick={onSalir}
              disabled={checking}
            >
              Salir
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

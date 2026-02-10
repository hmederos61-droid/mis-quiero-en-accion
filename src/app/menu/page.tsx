"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   Estética glass (patrón LOGIN)
========================= */
const glassCard: React.CSSProperties = {
  borderRadius: 22,
  padding: 42,
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.16)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  boxShadow: "0 18px 60px rgba(0,0,0,0.23)",
  color: "rgba(255,255,255,0.94)",
  textShadow: "0 1px 2px rgba(0,0,0,0.38)",
  width: "92%",
  maxWidth: 980,
};

const titleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 600,
  opacity: 0.88,
  marginBottom: 8,
};

const subStyle: React.CSSProperties = {
  fontSize: 16,
  opacity: 0.9,
  lineHeight: 1.4,
  marginBottom: 18,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  opacity: 0.88,
  marginTop: 16,
  marginBottom: 10,
};

const btnBase: React.CSSProperties = {
  width: "100%",
  padding: "14px 18px",
  borderRadius: 14,
  border: "none",
  fontSize: 18,
  fontWeight: 900,
  cursor: "pointer",
  color: "#fff",
  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
};

const btnAdmin: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(255,170,90,0.95), rgba(255,130,90,0.95))",
};

const btnCoach: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(120,160,255,0.95), rgba(160,120,255,0.95))",
};

const btnSalir: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(110,140,180,0.90), rgba(90,110,150,0.90))",
};

const btnDisabled: React.CSSProperties = {
  opacity: 0.55,
  cursor: "default",
};

type Role = "admin" | "coach" | "coachee";

export default function MenuPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);

  // Control de intentos: evita loops infinitos si hay error persistente.
  const attemptsRef = useRef(0);
  const mountedRef = useRef(true);

  async function safeExitToLogin() {
    try {
      await supabase.auth.signOut();
    } catch {
      // silencio
    } finally {
      router.replace("/login");
    }
  }

  async function loadRoles() {
    // Mientras no haya resolución confiable -> SOLO "Cargando..."
    setLoading(true);

    try {
      // 1) Sesión válida
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const user = userRes.user;
      if (!user) {
        router.replace("/login");
        return;
      }

      // 2) Debe existir en app_users (regla: si no está, no pasa)
      const { data: u0, error: e0 } = await supabase
        .from("app_users")
        .select("auth_user_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (e0) throw e0;

      // Si falta perfil en la app: salida controlada (sin pantalla de error)
      if (!u0?.auth_user_id) {
        await safeExitToLogin();
        return;
      }

      // 3) Roles reales: user_roles(auth_user_id, role)
      const { data: r1, error: e1 } = await supabase
        .from("user_roles")
        .select("role")
        .eq("auth_user_id", user.id);

      if (e1) throw e1;

      const rs = (Array.isArray(r1) ? r1 : [])
        .map((x: any) => String(x.role || "").toLowerCase())
        .filter(
          (x: string) => x === "admin" || x === "coach" || x === "coachee"
        ) as Role[];

      const unique = Array.from(new Set(rs));

      const hasAdmin = unique.includes("admin");
      const hasCoach = unique.includes("coach");

      // ✅ CANÓNICO: Coachee NO usa /menu nunca.
      if (!hasAdmin && !hasCoach) {
        router.replace("/quieros/inicio");
        return;
      }

      // Admin/Coach -> menú (selector si aplica)
      setRoles(unique);
      setLoading(false);
    } catch {
      // ✅ Regla canónica: NUNCA mostrar pantalla de error.
      // Reintento breve por latencia/timing.
      attemptsRef.current += 1;

      if (attemptsRef.current <= 2) {
        setTimeout(() => {
          if (mountedRef.current) loadRoles();
        }, 350);
        return;
      }

      // Persistente -> salida controlada a /login
      await safeExitToLogin();
      return;
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    loadRoles();

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAdmin = roles.includes("admin");
  const isCoach = roles.includes("coach");
  const showSelector = isAdmin && isCoach;

  async function handleSalir() {
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
    }
  }

  return (
    <>
      <style jsx global>{`
        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          min-height: 100% !important;
          background: url("/welcome.png") center center / cover no-repeat fixed !important;
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "36px 0",
        }}
      >
        <div style={glassCard}>
          <div style={titleStyle}>Menú principal</div>

          <div style={subStyle}>
            Este menú se adapta automáticamente a tu perfil.
            <br />
            Vas a ver solo las opciones habilitadas por tu rol.
          </div>

          {loading ? (
            <div style={{ fontSize: 16, opacity: 0.9 }}>Cargando perfil…</div>
          ) : (
            <>
              {showSelector ? (
                <>
                  <div style={sectionTitle}>¿Cómo querés ingresar?</div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: 12,
                    }}
                  >
                    <button
                      style={btnAdmin}
                      onClick={() => router.push("/administrador")}
                      title="Ingresar como Administrador"
                    >
                      Ingresar como Administrador
                    </button>

                    <button
                      style={btnCoach}
                      onClick={() => router.push("/coach")}
                      title="Ingresar como Coach"
                    >
                      Ingresar como Coach
                    </button>
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      fontSize: 15,
                      opacity: 0.9,
                      lineHeight: 1.35,
                    }}
                  >
                    <b>Administrador</b>: gestión global · control de accesos · alta
                    de coaches · auditoría
                    <br />
                    <b>Coach</b>: alta de coachee · gestión de quieros · seguimiento
                  </div>
                </>
              ) : (
                <>
                  {isAdmin && (
                    <>
                      <div style={sectionTitle}>Administrador</div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr",
                          gap: 12,
                        }}
                      >
                        <button
                          style={btnAdmin}
                          onClick={() => router.push("/administrador")}
                          title="Acceder como Administrador"
                        >
                          Acceder como Administrador
                        </button>
                      </div>
                    </>
                  )}

                  {isCoach && (
                    <>
                      <div style={sectionTitle}>Coach</div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr",
                          gap: 12,
                        }}
                      >
                        <button
                          style={btnCoach}
                          onClick={() => router.push("/coach")}
                          title="Acceder como Coach"
                        >
                          Acceder como Coach
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}

              <div
                style={{
                  marginTop: 18,
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 12,
                }}
              >
                <button
                  style={{ ...btnSalir, ...(loading ? btnDisabled : {}) }}
                  onClick={handleSalir}
                  disabled={loading}
                  title="Cerrar sesión"
                >
                  Salir
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

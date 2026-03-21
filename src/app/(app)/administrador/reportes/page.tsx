// src/app/(app)/admin/reportes/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   REPORTES DE GESTIÓN
   - Menú de reportes
   - Reporte 1: Detalle de clientes
   - Visualización en pantalla
   - Descarga para Excel
========================= */

const glassCard: React.CSSProperties = {
  borderRadius: 22,
  padding: 34,
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.16)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  boxShadow: "0 18px 60px rgba(0,0,0,0.23)",
  color: "rgba(255,255,255,0.94)",
  textShadow: "0 1px 2px rgba(0,0,0,0.38)",
  width: "92vw",
  maxWidth: 1320,
};

const titleStyle: React.CSSProperties = {
  fontSize: 30,
  opacity: 0.96,
  margin: 0,
};

const helperStyle: React.CSSProperties = {
  fontSize: 16,
  opacity: 0.9,
  lineHeight: 1.35,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  opacity: 0.96,
  margin: 0,
};

const divider: React.CSSProperties = {
  height: 1,
  background: "rgba(255,255,255,0.12)",
  margin: "18px 0 16px",
};

const btnBase: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 14,
  border: "none",
  fontSize: 17,
  fontWeight: 800,
  cursor: "pointer",
  color: "#fff",
  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
};

const btnGenerar: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(90,200,140,0.95), rgba(60,170,120,0.95))",
};

const btnExcel: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(120,160,255,0.95), rgba(160,120,255,0.95))",
};

const btnVolver: React.CSSProperties = {
  ...btnBase,
  background:
    "linear-gradient(135deg, rgba(255,170,90,0.95), rgba(255,130,90,0.95))",
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

const reportCardBase: React.CSSProperties = {
  borderRadius: 18,
  padding: 18,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.16)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
  transition: "all 160ms ease",
};

const tableWrap: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.14)",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 1080,
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 14px",
  fontSize: 14,
  fontWeight: 800,
  letterSpacing: 0.2,
  color: "rgba(255,255,255,0.96)",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  position: "sticky",
  top: 0,
  zIndex: 1,
};

const tdStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 14,
  color: "rgba(255,255,255,0.93)",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  verticalAlign: "top",
};

type ReportKey = "clientes";

type CoacheeReportRow = {
  id: string;
  created_at: string | null;
  full_name: string | null;
  email: string | null;
  whatsapp: string | null;
  ciudad: string | null;
  pais: string | null;
  dni: string | null;
  cuit_cuil: string | null;
  is_active: boolean | null;
  status: string | null;
};

function clean(v: string | null | undefined) {
  return (v || "").trim();
}

function fmtDateTime(v: string | null | undefined) {
  const t = clean(v);
  if (!t) return "";
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return t;
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function normalizeEstado(row: CoacheeReportRow) {
  if (row.is_active === false) return "DADO DE BAJA";

  const status = clean(row.status).toUpperCase();
  if (status === "PENDING") return "PENDIENTE";
  if (status === "ACTIVE") return "ACTIVO";
  if (status) return status;

  return row.is_active ? "ACTIVO" : "SIN DEFINIR";
}

function escapeHtml(v: string) {
  return v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildExcelHtml(rows: CoacheeReportRow[]) {
  const headers = [
    "Fecha alta",
    "Cliente",
    "Email",
    "WhatsApp",
    "Ciudad",
    "País",
    "DNI",
    "CUIT/CUIL",
    "Estado",
    "Status BD",
  ];

  const body = rows
    .map((row) => {
      const values = [
        fmtDateTime(row.created_at),
        clean(row.full_name),
        clean(row.email),
        clean(row.whatsapp),
        clean(row.ciudad),
        clean(row.pais),
        clean(row.dni),
        clean(row.cuit_cuil),
        normalizeEstado(row),
        clean(row.status),
      ];

      return `<tr>${values
        .map((v) => `<td>${escapeHtml(v || "")}</td>`)
        .join("")}</tr>`;
    })
    .join("");

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Clientes</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </body>
    </html>
  `;
}

export default function AdminReportesPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportKey>("clientes");
  const [error, setError] = useState<string | null>(null);
  const [rowsClientes, setRowsClientes] = useState<CoacheeReportRow[]>([]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        const authUser = authData?.user;

        if (authErr || !authUser?.id) {
          router.replace("/login");
          return;
        }

        if (alive) setCheckingSession(false);
      } catch {
        router.replace("/login");
      } finally {
        if (alive) setCheckingSession(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, supabase]);

  async function handleGenerarReporte() {
    setError(null);
    setLoading(true);

    try {
      if (selectedReport === "clientes") {
        const { data, error: qErr } = await supabase
          .from("coachees")
          .select(
            "id, created_at, full_name, email, whatsapp, ciudad, pais, dni, cuit_cuil, is_active, status"
          )
          .order("created_at", { ascending: false });

        if (qErr) {
          setError(
            `No fue posible generar el reporte: ${qErr.message || "sin detalle"}`
          );
          return;
        }

        setRowsClientes(Array.isArray(data) ? (data as CoacheeReportRow[]) : []);
      }
    } catch {
      setError("No fue posible generar el reporte. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleDescargarExcel() {
    setError(null);

    if (selectedReport !== "clientes") return;
    if (!rowsClientes.length) {
      setError("Primero generá el reporte para poder descargarlo.");
      return;
    }

    try {
      const html = buildExcelHtml(rowsClientes);
      const blob = new Blob([html], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const hoy = new Date();
      const yyyy = hoy.getFullYear();
      const mm = String(hoy.getMonth() + 1).padStart(2, "0");
      const dd = String(hoy.getDate()).padStart(2, "0");

      a.href = url;
      a.download = `reporte_clientes_${yyyy}-${mm}-${dd}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("No fue posible descargar el archivo Excel.");
    }
  }

  async function handleSalir() {
    try {
      await supabase.auth.signOut();
    } catch {
      // silencio
    } finally {
      router.replace("/login");
    }
  }

  const cardStyle: React.CSSProperties = {
    ...glassCard,
    padding: isMobile ? 16 : 34,
    width: isMobile ? "96vw" : "92vw",
    borderRadius: isMobile ? 18 : 22,
    marginTop: isMobile ? 8 : 0,
  };

  const headerGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1.2fr",
    gap: isMobile ? 10 : 16,
    alignItems: "start",
  };

  const reportGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    gap: 12,
  };

  const actionsGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr 1fr",
    gap: 12,
    marginTop: 14,
  };

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
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "center",
          padding: isMobile ? "14px 8px 22px" : "26px 0",
        }}
      >
        <div style={cardStyle}>
          <div style={headerGrid}>
            <div style={{ ...titleStyle, fontSize: isMobile ? 24 : 30 }}>
              Reportes de Gestión
            </div>
            <div style={{ ...helperStyle, fontSize: isMobile ? 15 : 16 }}>
              Desde esta pantalla podés seleccionar distintos reportes de gestión,
              visualizarlos en pantalla y descargar su contenido para Excel.
            </div>
          </div>

          <div style={divider} />

          <div style={sectionTitle}>Menú de reportes</div>

          <div style={{ height: 12 }} />

          <div style={reportGrid}>
            <button
              type="button"
              onClick={() => setSelectedReport("clientes")}
              disabled={loading || checkingSession}
              style={{
                ...reportCardBase,
                cursor: loading || checkingSession ? "default" : "pointer",
                textAlign: "left",
                border:
                  selectedReport === "clientes"
                    ? "1px solid rgba(120,160,255,0.70)"
                    : reportCardBase.border,
                boxShadow:
                  selectedReport === "clientes"
                    ? "0 10px 30px rgba(80,120,255,0.22)"
                    : reportCardBase.boxShadow,
                opacity: loading || checkingSession ? 0.7 : 1,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
                1. Detalle de clientes
              </div>
              <div style={{ ...helperStyle, fontSize: 15 }}>
                Trae todos los clientes existentes en la base, ordenados por fecha
                de alta, con sus datos principales y estado correspondiente.
              </div>
            </button>

            <div
              style={{
                ...reportCardBase,
                opacity: 0.72,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
                2. Ingresos a la aplicación
              </div>
              <div style={{ ...helperStyle, fontSize: 15 }}>
                Próximamente. Este reporte requerirá registrar eventos de acceso
                para poder informar fecha, hora y canal de ingreso.
              </div>
            </div>
          </div>

          <div style={actionsGrid}>
            <button
              style={{
                ...btnGenerar,
                ...(loading || checkingSession ? btnDisabled : {}),
              }}
              onClick={handleGenerarReporte}
              disabled={loading || checkingSession}
            >
              {loading ? "Generando..." : "Generar reporte"}
            </button>

            <button
              style={{
                ...btnExcel,
                ...(loading || checkingSession ? btnDisabled : {}),
              }}
              onClick={handleDescargarExcel}
              disabled={loading || checkingSession}
            >
              Descargar Excel
            </button>

            <button
              style={{
                ...btnVolver,
                ...(loading || checkingSession ? btnDisabled : {}),
              }}
              onClick={() => router.replace("/admin")}
              disabled={loading || checkingSession}
            >
              Volver
            </button>

            <button
              style={{
                ...btnSalir,
                ...(loading || checkingSession ? btnDisabled : {}),
              }}
              onClick={handleSalir}
              disabled={loading || checkingSession}
            >
              Salir
            </button>
          </div>

          {error && (
            <div
              style={{
                marginTop: 12,
                fontSize: 15,
                color: "#ffb4b4",
                opacity: 0.98,
                whiteSpace: "pre-line",
              }}
            >
              {error}
            </div>
          )}

          <div style={divider} />

          <div style={sectionTitle}>Resultado</div>

          <div style={{ height: 12 }} />

          {selectedReport === "clientes" && rowsClientes.length === 0 ? (
            <div style={helperStyle}>
              Todavía no generaste el reporte de clientes.
            </div>
          ) : null}

          {selectedReport === "clientes" && rowsClientes.length > 0 ? (
            <div style={tableWrap}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Fecha alta</th>
                    <th style={thStyle}>Cliente</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>WhatsApp</th>
                    <th style={thStyle}>Ciudad</th>
                    <th style={thStyle}>País</th>
                    <th style={thStyle}>DNI</th>
                    <th style={thStyle}>CUIT/CUIL</th>
                    <th style={thStyle}>Estado</th>
                    <th style={thStyle}>Status BD</th>
                  </tr>
                </thead>
                <tbody>
                  {rowsClientes.map((row) => (
                    <tr key={row.id}>
                      <td style={tdStyle}>{fmtDateTime(row.created_at) || "-"}</td>
                      <td style={tdStyle}>{clean(row.full_name) || "-"}</td>
                      <td style={tdStyle}>{clean(row.email) || "-"}</td>
                      <td style={tdStyle}>{clean(row.whatsapp) || "-"}</td>
                      <td style={tdStyle}>{clean(row.ciudad) || "-"}</td>
                      <td style={tdStyle}>{clean(row.pais) || "-"}</td>
                      <td style={tdStyle}>{clean(row.dni) || "-"}</td>
                      <td style={tdStyle}>{clean(row.cuit_cuil) || "-"}</td>
                      <td style={tdStyle}>{normalizeEstado(row)}</td>
                      <td style={tdStyle}>{clean(row.status) || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
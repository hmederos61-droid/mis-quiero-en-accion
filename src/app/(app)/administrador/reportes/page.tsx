"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/* =========================
   REPORTES DE GESTIÓN
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
  maxWidth: 1380,
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
  minWidth: 1180,
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

const selectWrap: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  outline: "none",
  background: "rgba(0,0,0,0.18)",
  color: "rgba(255,255,255,0.95)",
  fontSize: 15,
};

type ReportKey = "clientes" | "accesos";
type SortDir = "asc" | "desc";

type SortClienteKey =
  | "created_at"
  | "full_name"
  | "email"
  | "whatsapp"
  | "ciudad"
  | "pais"
  | "dni"
  | "cuit_cuil"
  | "estado"
  | "status";

type SortAccessKey =
  | "fecha"
  | "usuario"
  | "email"
  | "rol"
  | "origen"
  | "cantidad"
  | "auth_user_id";

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

type LoginEventRow = {
  id: string;
  auth_user_id: string;
  email_snapshot: string | null;
  full_name_snapshot: string | null;
  role_snapshot: string | null;
  source: string | null;
  created_at: string | null;
};

type LoginAccessSummaryRow = {
  auth_user_id: string;
  email_snapshot: string | null;
  full_name_snapshot: string | null;
  role_snapshot: string | null;
  source: string | null;
  access_count: number;
  last_access_at: string | null;
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
  if (status === "INVITED") return "INVITED";
  if (status === "ACTIVE") return "ACTIVO";
  if (status === "INACTIVE") return "INACTIVO";
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

function normalizeSource(v: string | null | undefined) {
  const source = clean(v).toLowerCase();

  if (!source) return "";
  if (source.includes("mobile")) return "Mobile";
  if (source.includes("web")) return "Web";

  return source;
}

function summarizeAccessRows(rows: LoginEventRow[]): LoginAccessSummaryRow[] {
  const map = new Map<string, LoginAccessSummaryRow>();

  for (const row of rows) {
    const key = clean(row.auth_user_id);
    if (!key) continue;

    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        auth_user_id: row.auth_user_id,
        email_snapshot: row.email_snapshot,
        full_name_snapshot: row.full_name_snapshot,
        role_snapshot: row.role_snapshot,
        source: row.source,
        access_count: 1,
        last_access_at: row.created_at,
      });
      continue;
    }

    existing.access_count += 1;

    if (!clean(existing.full_name_snapshot) && clean(row.full_name_snapshot)) {
      existing.full_name_snapshot = row.full_name_snapshot;
    }

    if (!clean(existing.email_snapshot) && clean(row.email_snapshot)) {
      existing.email_snapshot = row.email_snapshot;
    }

    if (!clean(existing.role_snapshot) && clean(row.role_snapshot)) {
      existing.role_snapshot = row.role_snapshot;
    }

    if (!clean(existing.source) && clean(row.source)) {
      existing.source = row.source;
    }

    const existingTs = clean(existing.last_access_at);
    const currentTs = clean(row.created_at);

    if (currentTs && (!existingTs || new Date(currentTs) > new Date(existingTs))) {
      existing.last_access_at = row.created_at;
      if (clean(row.source)) existing.source = row.source;
      if (clean(row.role_snapshot)) existing.role_snapshot = row.role_snapshot;
    }
  }

  return Array.from(map.values());
}

function compareText(a: string, b: string, dir: SortDir) {
  return dir === "asc" ? a.localeCompare(b) : b.localeCompare(a);
}

function compareNumber(a: number, b: number, dir: SortDir) {
  return dir === "asc" ? a - b : b - a;
}

function compareDateText(a: string, b: string, dir: SortDir) {
  return dir === "asc" ? a.localeCompare(b) : b.localeCompare(a);
}

function sortClientesRows(
  rows: CoacheeReportRow[],
  sortBy: SortClienteKey,
  sortDir: SortDir
): CoacheeReportRow[] {
  const clone = [...rows];

  clone.sort((a, b) => {
    if (sortBy === "created_at") {
      return compareDateText(clean(a.created_at), clean(b.created_at), sortDir);
    }

    if (sortBy === "estado") {
      return compareText(
        normalizeEstado(a).toLowerCase(),
        normalizeEstado(b).toLowerCase(),
        sortDir
      );
    }

    const valueA = clean((a as Record<string, unknown>)[sortBy] as string | null)
      .toLowerCase();
    const valueB = clean((b as Record<string, unknown>)[sortBy] as string | null)
      .toLowerCase();

    return compareText(valueA, valueB, sortDir);
  });

  return clone;
}

function sortAccessSummaryRows(
  rows: LoginAccessSummaryRow[],
  sortBy: SortAccessKey,
  sortDir: SortDir
): LoginAccessSummaryRow[] {
  const clone = [...rows];

  clone.sort((a, b) => {
    if (sortBy === "cantidad") {
      return compareNumber(a.access_count, b.access_count, sortDir);
    }

    if (sortBy === "fecha") {
      return compareDateText(
        clean(a.last_access_at),
        clean(b.last_access_at),
        sortDir
      );
    }

    if (sortBy === "usuario") {
      return compareText(
        clean(a.full_name_snapshot).toLowerCase(),
        clean(b.full_name_snapshot).toLowerCase(),
        sortDir
      );
    }

    if (sortBy === "email") {
      return compareText(
        clean(a.email_snapshot).toLowerCase(),
        clean(b.email_snapshot).toLowerCase(),
        sortDir
      );
    }

    if (sortBy === "rol") {
      return compareText(
        clean(a.role_snapshot).toLowerCase(),
        clean(b.role_snapshot).toLowerCase(),
        sortDir
      );
    }

    if (sortBy === "origen") {
      return compareText(
        normalizeSource(a.source).toLowerCase(),
        normalizeSource(b.source).toLowerCase(),
        sortDir
      );
    }

    return compareText(
      clean(a.auth_user_id).toLowerCase(),
      clean(b.auth_user_id).toLowerCase(),
      sortDir
    );
  });

  return clone;
}

function sortAccessDetailRows(
  rows: LoginEventRow[],
  sortBy: SortAccessKey,
  sortDir: SortDir
): LoginEventRow[] {
  const clone = [...rows];

  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = clean(row.auth_user_id);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  clone.sort((a, b) => {
    if (sortBy === "cantidad") {
      return compareNumber(
        counts.get(clean(a.auth_user_id)) || 0,
        counts.get(clean(b.auth_user_id)) || 0,
        sortDir
      );
    }

    if (sortBy === "fecha") {
      return compareDateText(clean(a.created_at), clean(b.created_at), sortDir);
    }

    if (sortBy === "usuario") {
      return compareText(
        clean(a.full_name_snapshot).toLowerCase(),
        clean(b.full_name_snapshot).toLowerCase(),
        sortDir
      );
    }

    if (sortBy === "email") {
      return compareText(
        clean(a.email_snapshot).toLowerCase(),
        clean(b.email_snapshot).toLowerCase(),
        sortDir
      );
    }

    if (sortBy === "rol") {
      return compareText(
        clean(a.role_snapshot).toLowerCase(),
        clean(b.role_snapshot).toLowerCase(),
        sortDir
      );
    }

    if (sortBy === "origen") {
      return compareText(
        normalizeSource(a.source).toLowerCase(),
        normalizeSource(b.source).toLowerCase(),
        sortDir
      );
    }

    return compareText(
      clean(a.auth_user_id).toLowerCase(),
      clean(b.auth_user_id).toLowerCase(),
      sortDir
    );
  });

  return clone;
}

function buildClientesExcelHtml(rows: CoacheeReportRow[]) {
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

function buildAccesosExcelHtml(
  summaryRows: LoginAccessSummaryRow[],
  detailRows: LoginEventRow[]
) {
  const summaryHeaders = [
    "Usuario",
    "Email",
    "Rol",
    "Origen",
    "Cantidad de accesos",
    "Último acceso",
    "Auth User ID",
  ];

  const summaryBody = summaryRows
    .map((row) => {
      const values = [
        clean(row.full_name_snapshot),
        clean(row.email_snapshot),
        clean(row.role_snapshot),
        normalizeSource(row.source),
        String(row.access_count || 0),
        fmtDateTime(row.last_access_at),
        clean(row.auth_user_id),
      ];

      return `<tr>${values
        .map((v) => `<td>${escapeHtml(v || "")}</td>`)
        .join("")}</tr>`;
    })
    .join("");

  const detailHeaders = [
    "Fecha y hora",
    "Usuario",
    "Email",
    "Rol",
    "Origen",
    "Auth User ID",
  ];

  const detailBody = detailRows
    .map((row) => {
      const values = [
        fmtDateTime(row.created_at),
        clean(row.full_name_snapshot),
        clean(row.email_snapshot),
        clean(row.role_snapshot),
        normalizeSource(row.source),
        clean(row.auth_user_id),
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
      </head>
      <body>
        <table border="1">
          <thead>
            <tr><th colspan="${summaryHeaders.length}">Resumen por usuario</th></tr>
            <tr>${summaryHeaders.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
          </thead>
          <tbody>${summaryBody}</tbody>
        </table>

        <br /><br />

        <table border="1">
          <thead>
            <tr><th colspan="${detailHeaders.length}">Detalle completo de accesos</th></tr>
            <tr>${detailHeaders.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
          </thead>
          <tbody>${detailBody}</tbody>
        </table>
      </body>
    </html>
  `;
}

function downloadExcel(filename: string, html: string) {
  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminReportesPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportKey>("clientes");

  const [clienteSortBy, setClienteSortBy] =
    useState<SortClienteKey>("created_at");
  const [clienteSortDir, setClienteSortDir] = useState<SortDir>("desc");

  const [accessSortBy, setAccessSortBy] = useState<SortAccessKey>("fecha");
  const [accessSortDir, setAccessSortDir] = useState<SortDir>("desc");

  const [error, setError] = useState<string | null>(null);
  const [rowsClientes, setRowsClientes] = useState<CoacheeReportRow[]>([]);
  const [rowsAccesos, setRowsAccesos] = useState<LoginEventRow[]>([]);

  const sortedClientesRows = useMemo(() => {
    return sortClientesRows(rowsClientes, clienteSortBy, clienteSortDir);
  }, [rowsClientes, clienteSortBy, clienteSortDir]);

  const accessSummaryRows = useMemo(() => {
    return sortAccessSummaryRows(
      summarizeAccessRows(rowsAccesos),
      accessSortBy,
      accessSortDir
    );
  }, [rowsAccesos, accessSortBy, accessSortDir]);

  const accessDetailRows = useMemo(() => {
    return sortAccessDetailRows(rowsAccesos, accessSortBy, accessSortDir);
  }, [rowsAccesos, accessSortBy, accessSortDir]);

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
        return;
      }

      if (selectedReport === "accesos") {
        const { data, error: qErr } = await supabase
          .from("login_events")
          .select(
            "id, auth_user_id, email_snapshot, full_name_snapshot, role_snapshot, source, created_at"
          )
          .eq("event_type", "login")
          .order("created_at", { ascending: false });

        if (qErr) {
          setError(
            `No fue posible generar el reporte: ${qErr.message || "sin detalle"}`
          );
          return;
        }

        setRowsAccesos(Array.isArray(data) ? (data as LoginEventRow[]) : []);
      }
    } catch {
      setError("No fue posible generar el reporte. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleDescargarExcel() {
    setError(null);

    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, "0");
    const dd = String(hoy.getDate()).padStart(2, "0");

    try {
      if (selectedReport === "clientes") {
        if (!sortedClientesRows.length) {
          setError("Primero generá el reporte para poder descargarlo.");
          return;
        }

        downloadExcel(
          `reporte_clientes_${yyyy}-${mm}-${dd}.xls`,
          buildClientesExcelHtml(sortedClientesRows)
        );
        return;
      }

      if (selectedReport === "accesos") {
        if (!accessSummaryRows.length) {
          setError("Primero generá el reporte para poder descargarlo.");
          return;
        }

        downloadExcel(
          `reporte_accesos_${yyyy}-${mm}-${dd}.xls`,
          buildAccesosExcelHtml(accessSummaryRows, accessDetailRows)
        );
      }
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
    gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr",
    gap: 12,
  };

  const filterGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(220px, 280px))",
    gap: 12,
    marginTop: 14,
  };

  const stickyActionsWrap: React.CSSProperties = {
    position: "sticky",
    top: 10,
    zIndex: 30,
    marginTop: 16,
    marginBottom: 16,
    padding: isMobile ? 10 : 12,
    borderRadius: 18,
    background: "rgba(0,0,0,0.20)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    boxShadow: "0 10px 28px rgba(0,0,0,0.24)",
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
                Trae todos los clientes existentes en la base, ordenados y
                filtrables por distintas columnas, con sus datos principales y
                estado correspondiente.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedReport("accesos")}
              disabled={loading || checkingSession}
              style={{
                ...reportCardBase,
                cursor: loading || checkingSession ? "default" : "pointer",
                textAlign: "left",
                border:
                  selectedReport === "accesos"
                    ? "1px solid rgba(120,160,255,0.70)"
                    : reportCardBase.border,
                boxShadow:
                  selectedReport === "accesos"
                    ? "0 10px 30px rgba(80,120,255,0.22)"
                    : reportCardBase.boxShadow,
                opacity: loading || checkingSession ? 0.7 : 1,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
                2. Detalle de ingresos a la aplicación
              </div>
              <div style={{ ...helperStyle, fontSize: 15 }}>
                Muestra un resumen por usuario y el detalle completo de todos los
                accesos, con orden configurable por distintas columnas.
              </div>
            </button>
          </div>

          {selectedReport === "clientes" && (
            <div style={filterGrid}>
              <div style={selectWrap}>
                <div style={{ fontSize: 15, fontWeight: 700, opacity: 0.94 }}>
                  Ordenar Reporte 1 por
                </div>
                <select
                  value={clienteSortBy}
                  onChange={(e) =>
                    setClienteSortBy(e.target.value as SortClienteKey)
                  }
                  style={selectStyle}
                  disabled={loading || checkingSession}
                >
                  <option value="created_at">Fecha alta</option>
                  <option value="full_name">Cliente</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="ciudad">Ciudad</option>
                  <option value="pais">País</option>
                  <option value="dni">DNI</option>
                  <option value="cuit_cuil">CUIT/CUIL</option>
                  <option value="estado">Estado</option>
                  <option value="status">Status BD</option>
                </select>
              </div>

              <div style={selectWrap}>
                <div style={{ fontSize: 15, fontWeight: 700, opacity: 0.94 }}>
                  Dirección
                </div>
                <select
                  value={clienteSortDir}
                  onChange={(e) => setClienteSortDir(e.target.value as SortDir)}
                  style={selectStyle}
                  disabled={loading || checkingSession}
                >
                  <option value="asc">Ascendente</option>
                  <option value="desc">Descendente</option>
                </select>
              </div>
            </div>
          )}

          {selectedReport === "accesos" && (
            <div style={filterGrid}>
              <div style={selectWrap}>
                <div style={{ fontSize: 15, fontWeight: 700, opacity: 0.94 }}>
                  Ordenar Reporte 2 por
                </div>
                <select
                  value={accessSortBy}
                  onChange={(e) => setAccessSortBy(e.target.value as SortAccessKey)}
                  style={selectStyle}
                  disabled={loading || checkingSession}
                >
                  <option value="fecha">Fecha / Último acceso</option>
                  <option value="usuario">Usuario</option>
                  <option value="email">Email</option>
                  <option value="rol">Rol</option>
                  <option value="origen">Origen</option>
                  <option value="cantidad">Cantidad de accesos</option>
                  <option value="auth_user_id">Auth User ID</option>
                </select>
              </div>

              <div style={selectWrap}>
                <div style={{ fontSize: 15, fontWeight: 700, opacity: 0.94 }}>
                  Dirección
                </div>
                <select
                  value={accessSortDir}
                  onChange={(e) => setAccessSortDir(e.target.value as SortDir)}
                  style={selectStyle}
                  disabled={loading || checkingSession}
                >
                  <option value="asc">Ascendente</option>
                  <option value="desc">Descendente</option>
                </select>
              </div>
            </div>
          )}

          <div style={stickyActionsWrap}>
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
                onClick={() => router.replace("/administrador")}
                disabled={loading || checkingSession}
              >
                Volver al menú
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

          {selectedReport === "clientes" && sortedClientesRows.length === 0 ? (
            <div style={helperStyle}>
              Todavía no generaste el reporte de clientes.
            </div>
          ) : null}

          {selectedReport === "clientes" && sortedClientesRows.length > 0 ? (
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
                  {sortedClientesRows.map((row) => (
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

          {selectedReport === "accesos" && accessSummaryRows.length === 0 ? (
            <div style={helperStyle}>
              Todavía no generaste el reporte de accesos.
            </div>
          ) : null}

          {selectedReport === "accesos" && accessSummaryRows.length > 0 ? (
            <>
              <div style={{ ...sectionTitle, fontSize: 18, marginBottom: 10 }}>
                Resumen por usuario
              </div>

              <div style={tableWrap}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Usuario</th>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Rol</th>
                      <th style={thStyle}>Origen</th>
                      <th style={thStyle}>Cantidad de accesos</th>
                      <th style={thStyle}>Último acceso</th>
                      <th style={thStyle}>Auth User ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessSummaryRows.map((row) => (
                      <tr key={row.auth_user_id}>
                        <td style={tdStyle}>
                          {clean(row.full_name_snapshot) || "-"}
                        </td>
                        <td style={tdStyle}>
                          {clean(row.email_snapshot) || "-"}
                        </td>
                        <td style={tdStyle}>
                          {clean(row.role_snapshot) || "-"}
                        </td>
                        <td style={tdStyle}>
                          {normalizeSource(row.source) || "-"}
                        </td>
                        <td style={tdStyle}>{row.access_count}</td>
                        <td style={tdStyle}>
                          {fmtDateTime(row.last_access_at) || "-"}
                        </td>
                        <td style={tdStyle}>{clean(row.auth_user_id) || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ height: 22 }} />

              <div style={{ ...sectionTitle, fontSize: 18, marginBottom: 10 }}>
                Detalle completo de accesos
              </div>

              <div style={tableWrap}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Fecha y hora</th>
                      <th style={thStyle}>Usuario</th>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Rol</th>
                      <th style={thStyle}>Origen</th>
                      <th style={thStyle}>Auth User ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessDetailRows.map((row) => (
                      <tr key={row.id}>
                        <td style={tdStyle}>{fmtDateTime(row.created_at) || "-"}</td>
                        <td style={tdStyle}>
                          {clean(row.full_name_snapshot) || "-"}
                        </td>
                        <td style={tdStyle}>
                          {clean(row.email_snapshot) || "-"}
                        </td>
                        <td style={tdStyle}>
                          {clean(row.role_snapshot) || "-"}
                        </td>
                        <td style={tdStyle}>
                          {normalizeSource(row.source) || "-"}
                        </td>
                        <td style={tdStyle}>{clean(row.auth_user_id) || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
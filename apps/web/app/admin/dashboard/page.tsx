"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { api } from "@/lib/api";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 5, exams: 1, live: 1, incidents: 0 });

  useEffect(() => {
    api<typeof stats>("/dashboard")
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <PortalShell role="MASTER_ADMIN">
      <div style={{ marginBottom: "2rem" }}>
        <h1>Master Admin Control Center</h1>
        <p>
          Global management console for Kaizentrix Global Solutions examination infrastructure.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="cards" style={{ marginBottom: "2.5rem" }}>
        <article className="card card-hover">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Total Accounts</span>
            <span className="chip chip-info">Directory</span>
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--primary)", margin: "0.5rem 0" }}>
            {stats.users}
          </div>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>Candidates, Invigilators & Admins</p>
        </article>

        <article className="card card-hover">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Exams Built</span>
            <span className="chip chip-success">Configured</span>
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--action)", margin: "0.5rem 0" }}>
            {stats.exams}
          </div>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>Aptitude, MCQ, and Coding Batches</p>
        </article>

        <article className="card card-hover">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Live Active Sessions</span>
            <span className="chip chip-warning">Online</span>
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--warning)", margin: "0.5rem 0" }}>
            {stats.live}
          </div>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>Concurrent authenticated attempts</p>
        </article>

        <article className="card card-hover">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Proctor Incidents</span>
            <span className="chip chip-error">Review</span>
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--error)", margin: "0.5rem 0" }}>
            {stats.incidents}
          </div>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>Third-warning escalations awaiting action</p>
        </article>
      </div>

      {/* Institutional College Reports & Management Banner */}
      <div
        className="card"
        style={{
          padding: "1.35rem 1.6rem",
          marginBottom: "2rem",
          background: "linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)",
          border: "1.5px solid #86EFAC",
          borderRadius: "12px",
          boxShadow: "0 4px 16px rgba(34, 197, 94, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.2rem" }}>🏛️</span>
            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#166534", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Institutional Analytics & College Reports
            </span>
          </div>
          <div style={{ fontSize: "0.86rem", color: "#15803D", marginTop: "0.25rem" }}>
            Review institutional performance metrics, pass percentages, and download candidate marks in Excel format separated by College Code.
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <Link
            href="/admin/colleges"
            className="btn btn-outline btn-sm"
            style={{ fontWeight: 700, textDecoration: "none", borderColor: "#86EFAC", color: "#166534", background: "white" }}
          >
            🏛️ College Management
          </Link>
          <Link
            href="/admin/college-reports"
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 700, textDecoration: "none", background: "#16A34A", borderColor: "#16A34A", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            📊 College Wise Reports & Excel &rarr;
          </Link>
        </div>
      </div>

      {/* Grid: Quick Actions and System Health */}
      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="card" style={{ padding: "2rem" }}>
          <h3>Executive Quick Operations</h3>
          <p style={{ fontSize: "0.9rem" }}>Direct workflows for examination design and governance:</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1.25rem" }}>
            <Link href="/admin/college-reports" className="btn btn-primary" style={{ justifyContent: "flex-start", background: "#16A34A", borderColor: "#16A34A", color: "white" }}>
              📊 College Wise Reports
            </Link>
            <Link href="/admin/colleges" className="btn btn-outline" style={{ justifyContent: "flex-start" }}>
              🏛️ College Management
            </Link>
            <Link href="/admin/questions" className="btn btn-primary" style={{ justifyContent: "flex-start" }}>
              📚 Question Bank Sets
            </Link>
            <Link href="/admin/results" className="btn btn-outline" style={{ justifyContent: "flex-start" }}>
              🏆 Results Review & Release
            </Link>
            <Link href="/admin/monitoring" className="btn btn-outline" style={{ justifyContent: "flex-start" }}>
              📡 Global Live Monitoring
            </Link>
            <Link href="/admin/audit-logs" className="btn btn-outline" style={{ justifyContent: "flex-start" }}>
              🔒 Security Audit Trail
            </Link>
          </div>
        </div>

        <div className="card" style={{ padding: "2rem" }}>
          <h3>Core Infrastructure Health</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
              <div>
                <strong>PostgreSQL State Store</strong>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Authoritative database & schema migrations</div>
              </div>
              <span className="chip chip-success">Healthy</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
              <div>
                <strong>Realtime WebSocket Gateway</strong>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Live proctor alerts & batch broadcasting</div>
              </div>
              <span className="chip chip-success">Connected</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>Coding Runner Sandbox</strong>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Isolated container execution environment</div>
              </div>
              <span className="chip chip-info">Standby</span>
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

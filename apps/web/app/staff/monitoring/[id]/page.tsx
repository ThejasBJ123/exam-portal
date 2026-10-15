"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { api } from "@/lib/api";
import Link from "next/link";

type Session = {
  id: string;
  studentId: string;
  status: string;
  warningCount: number;
  incidents: { id: string; summary: string }[];
};

export default function StaffMonitoringPage() {
  const { id } = useParams<{ id: string }>();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [toast, setToast] = useState("");

  async function load() {
    try {
      const data = await api<Session[]>(`/exams/${id}/lobby`);
      setSessions(data);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
  }, [id]);

  function sendNote(sessionId: string) {
    setToast(`Advisory message dispatched to candidate session ${sessionId.slice(0, 8)}`);
    setTimeout(() => setToast(""), 4000);
  }

  return (
    <PortalShell role="STAFF">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1>Live Invigilation & Proctoring Grid</h1>
          <p>
            Real-time multi-candidate oversight. Monitor camera feeds, AI telemetry warnings, and escalated incidents.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href={`/staff/exams/${id}/lobby`} className="btn btn-outline btn-sm">
            &larr; Return to Lobby
          </Link>
          <Link href="/staff/incidents" className="btn btn-navy btn-sm">
            Incident Management &rarr;
          </Link>
        </div>
      </div>

      {toast ? <div className="alert alert-ok">{toast}</div> : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        {sessions.map((s) => {
          const warnings = s.warningCount ?? 0;
          const isCritical = warnings >= 3;
          return (
            <div
              key={s.id}
              className="card"
              style={{
                border: isCritical ? "2px solid var(--error)" : warnings > 0 ? "1.5px solid var(--warning)" : "1px solid var(--border)",
                padding: "1.25rem",
              }}
            >
              {/* Candidate Video HUD Simulation */}
              <div
                style={{
                  height: "160px",
                  background: "#0F172A",
                  borderRadius: "8px",
                  overflow: "hidden",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "0.5rem",
                  color: "white",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <span className="status-dot active" /> STREAM ACTIVE
                  </span>
                  <span>ID: {s.studentId.slice(0, 8)}</span>
                </div>

                <div style={{ margin: "auto", textAlign: "center", color: "#64748B" }}>
                  <div style={{ fontSize: "2rem" }}>👤</div>
                  <div style={{ fontSize: "0.75rem" }}>Face Verified & Centered</div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem" }}>
                  <span>GAZE: CENTER</span>
                  <span style={{ color: isCritical ? "#EF4444" : "#4ADE80" }}>
                    {isCritical ? "INCIDENT FLAGGED" : "NORMAL"}
                  </span>
                </div>
              </div>

              {/* Status and Action Controls */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div>
                  <strong style={{ fontSize: "0.95rem", display: "block" }}>{s.studentId}</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Status: {s.status}</span>
                </div>
                <span className={`chip ${isCritical ? "chip-error" : warnings > 0 ? "chip-warning" : "chip-success"}`}>
                  Warnings: {warnings} / 3
                </span>
              </div>

              {s.incidents && s.incidents.length > 0 ? (
                <div style={{ background: "var(--error-bg)", color: "var(--error)", padding: "0.5rem 0.75rem", borderRadius: "6px", fontSize: "0.78rem", marginBottom: "0.75rem" }}>
                  🚨 Incident ticket opened: Review required before result release.
                </div>
              ) : null}

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => sendNote(s.id)}
                >
                  💬 Send Advisory
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => alert(`Detailed telemetry log opened for session ${s.id}`)}
                >
                  🔍 Inspect Logs
                </button>
              </div>
            </div>
          );
        })}

        {sessions.length === 0 ? (
          <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem" }}>
            <p>No candidate sessions currently live in this examination.</p>
          </div>
        ) : null}
      </div>
    </PortalShell>
  );
}

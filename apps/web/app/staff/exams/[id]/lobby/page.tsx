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
  readinessOk: boolean;
  consentAt: string | null;
  warningCount?: number;
};

export default function StaffLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [message, setMessage] = useState("");
  const [starting, setStarting] = useState(false);

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

  async function startExam() {
    setStarting(true);
    await api(`/exams/${id}/start`, { method: "POST" });
    setMessage("Authorized batch start successfully recorded on server. The official deadline is now ticking.");
    setStarting(false);
    load();
  }

  return (
    <PortalShell role="STAFF">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1>Candidate Lobby & Batch Start</h1>
          <p>
            Verify candidate readiness checks and consent status before releasing the live examination.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-navy" onClick={startExam} disabled={starting}>
            {starting ? "Recording Start…" : "⚡ Authorized Batch Start"}
          </button>
          <Link href={`/staff/monitoring/${id}`} className="btn btn-primary">
            Open Live Monitoring Grid &rarr;
          </Link>
        </div>
      </div>

      {message ? <div className="alert alert-ok">{message}</div> : null}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Session ID</th>
              <th>Candidate ID</th>
              <th>Hardware Readiness</th>
              <th>Consent Agreement</th>
              <th>Live Status</th>
              <th>Warnings</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{s.id.slice(0, 12)}…</td>
                <td>{s.studentId}</td>
                <td>
                  <span className={`chip ${s.readinessOk ? "chip-success" : "chip-warning"}`}>
                    {s.readinessOk ? "Verified OK" : "Pending Hardware"}
                  </span>
                </td>
                <td>
                  <span className={`chip ${s.consentAt ? "chip-success" : "chip-warning"}`}>
                    {s.consentAt ? "Agreed" : "Pending Sign"}
                  </span>
                </td>
                <td>
                  <span className="chip chip-info">{s.status}</span>
                </td>
                <td>
                  <span className="chip chip-neutral">{s.warningCount ?? 0} / 3</span>
                </td>
              </tr>
            ))}
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
                  No candidate sessions currently connected to this lobby.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </PortalShell>
  );
}

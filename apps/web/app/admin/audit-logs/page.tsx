"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { api } from "@/lib/api";

type Log = {
  id: string;
  action: string;
  entity: string;
  createdAt: string;
  actor?: { email: string } | null;
  metadata?: any;
};

export default function AuditPage() {
  const [rows, setRows] = useState<Log[]>([]);

  useEffect(() => {
    api<Log[]>("/audit-logs")
      .then(setRows)
      .catch(() => {});
  }, []);

  return (
    <PortalShell role="MASTER_ADMIN">
      <div style={{ marginBottom: "1.5rem" }}>
        <h1>Immutable Audit Logs</h1>
        <p>
          Append-only security log tracking all administrative interventions, exam starts, warning escalations, and result publications.
        </p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor Identity</th>
              <th>Security Action</th>
              <th>Target Entity</th>
              <th>Integrity Hash</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
                <td>
                  <strong>{r.actor?.email ?? "system"}</strong>
                </td>
                <td>
                  <span className="chip chip-info">{r.action}</span>
                </td>
                <td>{r.entity}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--muted)" }}>
                  {r.id.slice(0, 16)}…
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
                  No security audit records logged yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </PortalShell>
  );
}

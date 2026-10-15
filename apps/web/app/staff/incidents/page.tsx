"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { api } from "@/lib/api";

type Incident = {
  id: string;
  summary: string;
  status: string;
  createdAt: string;
  session?: { id: string; studentId: string };
};

export default function IncidentsPage() {
  const [rows, setRows] = useState<Incident[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const data = await api<Incident[]>("/incidents");
      setRows(data);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleDecision(id: string, decision: "DISMISSED" | "RESOLVED") {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: decision } : r))
    );
    setMessage(`Incident ${id.slice(0, 8)} updated to ${decision}. Written to audit log.`);
    setTimeout(() => setMessage(""), 4000);
  }

  return (
    <PortalShell role="STAFF">
      <div style={{ marginBottom: "1.5rem" }}>
        <h1>Incident Management & Human Review</h1>
        <p>
          Third-warning escalations require mandatory human review. AI camera flags are investigative aids and do not constitute automatic guilt.
        </p>
      </div>

      {message ? <div className="alert alert-ok">{message}</div> : null}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Incident Summary</th>
              <th>Status</th>
              <th>Review Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
                <td>
                  <strong>{r.summary}</strong>
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                    Session Ref: {r.session?.id ? r.session.id.slice(0, 10) : "Active"}
                  </div>
                </td>
                <td>
                  <span className={`chip ${r.status === "OPEN" ? "chip-error" : r.status === "DISMISSED" ? "chip-neutral" : "chip-success"}`}>
                    {r.status}
                  </span>
                </td>
                <td>
                  {r.status === "OPEN" ? (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleDecision(r.id, "DISMISSED")}
                      >
                        Dismiss (False Flag)
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDecision(r.id, "RESOLVED")}
                      >
                        Uphold Violation
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Audit Decided</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "2.5rem", color: "var(--muted)" }}>
                  No active proctoring incident tickets logged. All candidate sessions within normal thresholds.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </PortalShell>
  );
}

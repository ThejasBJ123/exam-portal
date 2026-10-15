"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { api } from "@/lib/api";

type Exam = {
  id: string;
  title: string;
  status: string;
  durationMinutes: number;
  kind?: string;
  accessCode?: string;
  code?: string;
  totalQuestions?: number;
};

export default function StaffExamsPage() {
  const [rows, setRows] = useState<Exam[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    api<Exam[]>("/exams").then(setRows).catch(() => {});
  }, []);

  function copyCode(code: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  }

  return (
    <PortalShell role="STAFF">
      <div style={{ marginBottom: "1.5rem" }}>
        <h1>Assigned Examination Roster</h1>
        <p>Examinations and Question Paper Sets where you are assigned as the official invigilator or proctor.</p>
      </div>

      {copiedCode && (
        <div className="alert alert-ok" style={{ marginBottom: "1.25rem", fontWeight: 600 }}>
          📋 Access Code '{copiedCode}' copied to clipboard! Share with candidate batch.
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Examination Title</th>
              <th>Question Set Access Code</th>
              <th>Assessment Kind</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Invigilation Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e, idx) => {
              const paperCode = e.accessCode || e.code || (idx === 0 ? "KGS-2026" : idx === 1 ? "SET-DEV-2026" : "SET-APT-2026");
              return (
                <tr key={e.id}>
                  <td style={{ fontWeight: 600 }}>{e.title}</td>
                  <td>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                      <code
                        style={{
                          background: "#EFF6FF",
                          color: "#1D4ED8",
                          border: "1px solid #BFDBFE",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "6px",
                          fontWeight: 900,
                          fontSize: "0.88rem",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {paperCode}
                      </code>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => copyCode(paperCode)}
                        style={{ padding: "0.2rem 0.45rem", fontSize: "0.75rem", fontWeight: 700 }}
                        title="Copy code"
                      >
                        📋 Copy
                      </button>
                    </div>
                  </td>
                  <td><span className="chip chip-info">{e.kind ?? "OBJECTIVE_MCQ"}</span></td>
                  <td>{e.durationMinutes} Minutes</td>
                  <td><span className="chip chip-success">{e.status}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Link href={`/staff/exams/${e.id}/lobby`} className="btn btn-navy btn-sm" style={{ fontWeight: 700 }}>
                        Open Lobby
                      </Link>
                      <Link href={`/staff/monitoring/${e.id}`} className="btn btn-outline btn-sm" style={{ fontWeight: 700 }}>
                        Live Grid
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PortalShell>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { api, type Me } from "@/lib/api";

type Row = {
  exam: {
    id: string;
    title: string;
    durationMinutes: number;
    kind: string;
    description?: string;
  };
  session?: {
    id: string;
    status: string;
    score?: { total: number; maxTotal: number };
  };
};

export default function StudentDashboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    api<Me>("/auth/me").then(setMe).catch(() => {});
    api<Row[]>("/student/exams")
      .then((data) => {
        setRows(data);
        setLoading(false);
      })
      .catch(() => {
        setRows([]);
        setLoading(false);
      });
  }, []);

  return (
    <PortalShell role="STUDENT">
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1>Assigned Examinations</h1>
            <p>
              Assessments allocated to your candidate profile. Complete hardware readiness checks and consent before batch commencement.
            </p>
          </div>
          {me?.collegeName ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#EFF6FF",
                border: "1px solid #BFDBFE",
                borderRadius: "8px",
                padding: "0.5rem 0.85rem",
                fontSize: "0.85rem",
                color: "#1E40AF",
                fontWeight: 600,
              }}
            >
              <span>🏛️ Enrolled College:</span>
              <strong style={{ color: "#1D4ED8" }}>{me.collegeName}</strong>
              <span
                style={{
                  background: "#DBEAFE",
                  color: "#1E40AF",
                  borderRadius: "4px",
                  padding: "2px 6px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.78rem",
                  letterSpacing: "0.05em",
                }}
              >
                {me.collegeCode}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {loading ? (
        <p>Loading assigned assessments…</p>
      ) : rows.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <p>No published examinations currently assigned to your account.</p>
        </div>
      ) : (
        <>
          {rows.some((r) => r.session?.status === "TERMINATED") ? (
          <div
            style={{
              background: "#FEF2F2",
              border: "2px solid #EF4444",
              borderRadius: "12px",
              padding: "1.25rem 1.5rem",
              marginBottom: "2rem",
              display: "flex",
              gap: "1rem",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "2.2rem" }}>⛔</span>
            <div>
              <strong style={{ color: "#991B1B", fontSize: "1.1rem", display: "block" }}>
                Examination Terminated — Access Permanently Locked (3 Warnings Exceeded)
              </strong>
              <p style={{ color: "#7F1D1D", margin: "0.25rem 0 0", fontSize: "0.92rem", lineHeight: 1.5 }}>
                Your sitting was automatically terminated and exited due to exceeding 3 proctoring policy warnings. In accordance with examination security policy, you are stopped from re-attempting and you do NOT have access to any next exams.
              </p>
            </div>
          </div>
        ) : null}

        <div className="cards">
          {rows.map((row) => {
            const isTerminated = row.session?.status === "TERMINATED";
            const isSubmitted = row.session?.status === "SUBMITTED" || row.session?.status === "TIMED_OUT";
            const isCompleted = isTerminated || isSubmitted;
            const score = row.session?.score;
            const hasAnyTerminated = rows.some((r) => r.session?.status === "TERMINATED");

            return (
              <article
                className="card card-hover"
                key={row.exam.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  border: isTerminated
                    ? "2px solid #EF4444"
                    : isSubmitted
                      ? "1px solid #86EFAC"
                      : "1px solid var(--border)",
                  boxShadow: isTerminated ? "0 4px 14px rgba(239, 68, 68, 0.12)" : undefined,
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <span className="chip chip-info">{row.exam.kind}</span>
                    {isTerminated ? (
                      <span className="chip chip-error">TERMINATED / DISQUALIFIED</span>
                    ) : isSubmitted ? (
                      <span className="chip chip-success">Completed & Evaluated</span>
                    ) : (
                      <span style={{ fontSize: "0.82rem", color: "var(--muted)", fontWeight: 600 }}>
                        {row.exam.durationMinutes} Minutes
                      </span>
                    )}
                  </div>

                  <h2 style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>{row.exam.title}</h2>
                  <p style={{ fontSize: "0.9rem" }}>
                    {row.exam.description ?? "Standard recruitment aptitude and technical screen."}
                  </p>

                  {isTerminated ? (
                    <div
                      style={{
                        background: "#FEF2F2",
                        border: "1px solid #FCA5A5",
                        padding: "0.9rem 1rem",
                        borderRadius: "8px",
                        margin: "1rem 0",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.85rem", color: "#991B1B", fontWeight: 700 }}>
                          Recorded Score:
                        </span>
                        <strong style={{ fontSize: "1.1rem", color: "#B91C1C" }}>
                          {score?.total ?? 0} / {score?.maxTotal ?? 20} Marks
                        </strong>
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "#991B1B", marginTop: "0.35rem", fontWeight: 600 }}>
                        Status: DISQUALIFIED (3/3 Warnings Exceeded) • Stopped
                      </div>
                    </div>
                  ) : isSubmitted ? (
                    <div
                      style={{
                        background: "#F0FDF4",
                        border: "1px solid #BBF7D0",
                        padding: "0.9rem 1rem",
                        borderRadius: "8px",
                        margin: "1rem 0",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.85rem", color: "#166534", fontWeight: 700 }}>
                          Official Score:
                        </span>
                        <strong style={{ fontSize: "1.1rem", color: "#15803D" }}>
                          {score?.total ?? 0} / {score?.maxTotal ?? 20} Marks
                        </strong>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#166534", marginTop: "0.25rem" }}>
                        Status: <strong>SUBMITTED & EVALUATED</strong> • Proctoring Inactive
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: "var(--light)", padding: "0.75rem 1rem", borderRadius: "8px", margin: "1rem 0", fontSize: "0.85rem" }}>
                      <div style={{ color: "var(--primary)", fontWeight: 600 }}>Rules & Proctoring:</div>
                      <div style={{ color: "var(--muted)" }}>&bull; AI Camera monitoring active</div>
                      <div style={{ color: "var(--muted)" }}>&bull; 3-Warning escalation policy</div>
                      <div style={{ color: "var(--muted)" }}>&bull; Server-enforced countdown</div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                  {isTerminated ? (
                    <Link
                      className="btn btn-outline"
                      href={`/student/exams/${row.exam.id}/submitted?terminated=true&warnings=3`}
                      style={{ width: "100%", justifyContent: "center", borderColor: "#DC2626", color: "#DC2626", fontWeight: 700 }}
                    >
                      View Disciplinary Scorecard &rarr;
                    </Link>
                  ) : isSubmitted ? (
                    <Link
                      className="btn btn-primary"
                      href={`/student/results/${row.exam.id}`}
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      View Result & Scorecard &rarr;
                    </Link>
                  ) : hasAnyTerminated ? (
                    <button
                      className="btn btn-outline"
                      disabled
                      style={{ width: "100%", justifyContent: "center", opacity: 0.6, cursor: "not-allowed", borderColor: "#DC2626", color: "#DC2626" }}
                    >
                      ⛔ Access Revoked (Terminated for Violations)
                    </button>
                  ) : (
                    <Link
                      className="btn btn-primary"
                      href={`/student/exams/${row.exam.id}`}
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      Enter Exam Station &rarr;
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        </>
      )}
    </PortalShell>
  );
}

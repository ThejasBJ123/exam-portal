
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { api } from "@/lib/api";

type Exam = {
  id: string;
  title: string;
  status: string;
  durationMinutes?: number;
  passPercent?: number;
  kind?: string;
  accessCode?: string;
  code?: string;
  totalQuestions?: number;
  description?: string;
};

export default function StaffDashboard() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyNotification, setCopyNotification] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<Exam[]>("/exams").catch(() => []),
      api<any[]>("/colleges").catch(() => []),
    ]).then(([examsData, collegesData]) => {
      setExams(examsData);
      setColleges(collegesData);
      setLoading(false);
    });
  }, []);

  function copyCode(code: string, paperTitle?: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopyNotification(`Access code '${code}'${paperTitle ? ` for ${paperTitle}` : ""} copied to clipboard! Share with candidate batch.`);
    setTimeout(() => setCopyNotification(null), 4000);
  }

  return (
    <PortalShell role="STAFF">
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem" }}>
          <span className="kicker" style={{ color: "var(--primary)", fontWeight: 800 }}>INVIGILATOR WORKSPACE</span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.2rem 0.6rem",
              borderRadius: "999px",
              background: "#DCFCE7",
              color: "#166534",
              fontSize: "0.72rem",
              fontWeight: 800,
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16A34A" }} />
            SECURE SESSION ACTIVE
          </span>
        </div>
        <h1 style={{ margin: "0.2rem 0 0.4rem 0", fontSize: "1.9rem" }}>Invigilator Dashboard</h1>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Active and upcoming examination batches assigned to your invigilation roster. Monitor attendance, authorize batch start, and review real-time candidate proctoring alerts.
        </p>
      </div>

      {copyNotification && (
        <div
          className="alert alert-ok"
          style={{
            marginBottom: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 600,
          }}
        >
          <span>📋 {copyNotification}</span>
          <button
            type="button"
            onClick={() => setCopyNotification(null)}
            style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* INSTITUTIONAL COLLEGE MANAGEMENT & CODES CARD */}
      <div
        className="card"
        style={{
          padding: "1.35rem 1.6rem",
          marginBottom: "1.75rem",
          background: "linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)",
          border: "1.5px solid #86EFAC",
          borderRadius: "12px",
          boxShadow: "0 4px 16px rgba(34, 197, 94, 0.08)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.1rem" }}>🏛️</span>
              <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#166534", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                COLLEGE MANAGEMENT & INSTITUTIONAL CODES
              </span>
            </div>
            <div style={{ fontSize: "0.86rem", color: "#15803D", marginTop: "0.2rem" }}>
              Registered institutions and unique College Codes required for candidate student intake.
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "#166534", fontWeight: 700, background: "#DCFCE7", padding: "0.25rem 0.65rem", borderRadius: "999px" }}>
              {colleges.length} Colleges Configured
            </span>
            <Link
              href="/staff/colleges"
              className="btn btn-sm btn-outline"
              style={{ fontWeight: 700, textDecoration: "none" }}
            >
              College Management
            </Link>
            <Link
              href="/staff/college-reports"
              className="btn btn-sm btn-primary"
              style={{ fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
            >
              📊 College Wise Reports &rarr;
            </Link>
          </div>
        </div>

        {/* Colleges quick roster */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.75rem" }}>
          {colleges.map((col) => (
            <div
              key={col.id}
              style={{
                background: "white",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "1px solid #BBF7D0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {col.name}
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--muted)", marginTop: "0.15rem" }}>
                  {(col.assignedPaperIds || []).length} Paper Set(s) Allocated
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyCode(col.code, col.name)}
                title="Click to copy College Code"
                style={{
                  background: "#EFF6FF",
                  border: "1px solid #93C5FD",
                  color: "#1D4ED8",
                  padding: "0.3rem 0.65rem",
                  borderRadius: "6px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                }}
              >
                {col.code} 📋
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* QUESTION PAPER SETS & ACCESS CODE DIRECTORY (ROSTER) */}
      <div
        className="card"
        style={{
          padding: "1.25rem 1.5rem",
          marginBottom: "2rem",
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              🔑 QUESTION PAPER SETS & ACCESS CODES DIRECTORY
            </span>
            <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.15rem" }}>
              Announce or share these unique access codes with candidate batches prior to exam intake.
            </div>
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600 }}>
            {exams.length} Question Paper Sets Active
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "0.75rem" }}>
          {exams.map((exam, idx) => {
            const paperCode = exam.accessCode || exam.code || (idx === 0 ? "KGS-2026" : idx === 1 ? "SET-DEV-2026" : "SET-APT-2026");
            return (
              <div
                key={exam.id}
                style={{
                  background: "white",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {exam.title}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.15rem" }}>
                    {exam.durationMinutes ?? 30} mins &bull; {exam.totalQuestions ?? 6} Questions
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
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
                    onClick={() => copyCode(paperCode, exam.title)}
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", fontWeight: 700 }}
                    title="Copy code to clipboard"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ASSIGNED EXAMINATIONS CARDS */}
      <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.3rem", margin: 0 }}>Assigned Examination Batches</h2>
        <span style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 }}>
          {exams.length} Examination Roster Units
        </span>
      </div>

      <div className="cards">
        {loading ? (
          <p>Loading assigned examinations…</p>
        ) : (
          exams.map((exam, idx) => {
            const paperCode = exam.accessCode || exam.code || (idx === 0 ? "KGS-2026" : idx === 1 ? "SET-DEV-2026" : "SET-APT-2026");

            return (
              <article
                className="card card-hover"
                key={exam.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderTop: "4px solid var(--primary)",
                }}
              >
                <div>
                  {/* Top Chips Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.4rem" }}>
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                      <span className="chip chip-info" style={{ fontWeight: 700 }}>{exam.kind ?? "OBJECTIVE_MCQ"}</span>
                      <span className={`chip ${exam.status === "PUBLISHED" ? "chip-success" : "chip-neutral"}`} style={{ fontWeight: 700 }}>
                        {exam.status}
                      </span>
                    </div>

                    {/* Prominent Access Code Badge in Card Header */}
                    <code
                      style={{
                        background: "#EFF6FF",
                        color: "#1D4ED8",
                        border: "1px solid #BFDBFE",
                        padding: "0.2rem 0.55rem",
                        borderRadius: "6px",
                        fontWeight: 900,
                        fontSize: "0.82rem",
                        letterSpacing: "0.06em",
                      }}
                      title="Access Code for this Question Paper Set"
                    >
                      🔑 {paperCode}
                    </code>
                  </div>

                  <h3 style={{ fontSize: "1.2rem", marginBottom: "0.4rem", lineHeight: 1.3 }}>{exam.title}</h3>

                  <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.75rem" }}>
                    {exam.durationMinutes ?? 30} minutes duration &bull; AI 3-warning monitoring active
                  </p>

                  {/* Dedicated Access Code Box with Copy Button */}
                  <div
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "8px",
                      padding: "0.6rem 0.85rem",
                      marginBottom: "0.75rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>
                        Question Set Access Code
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "1.05rem",
                          fontWeight: 900,
                          color: "#1E40AF",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {paperCode}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => copyCode(paperCode, exam.title)}
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        padding: "0.3rem 0.65rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <span>📋 Copy</span>
                    </button>
                  </div>

                  <div style={{ fontSize: "0.78rem", color: "var(--muted)", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <span>Questions: <strong>{exam.totalQuestions ?? 6}</strong></span>
                    <span>&bull;</span>
                    <span>Cutoff: <strong>{exam.passPercent ?? 50}%</strong></span>
                    <span>&bull;</span>
                    <span>Mode: <strong>Single Sitting</strong></span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
                  <Link href={`/staff/exams/${exam.id}/lobby`} className="btn btn-navy btn-sm" style={{ flex: 1, textAlign: "center", fontWeight: 700 }}>
                    Open Exam Lobby
                  </Link>
                  <Link href={`/staff/monitoring/${exam.id}`} className="btn btn-outline btn-sm" style={{ flex: 1, textAlign: "center", fontWeight: 700 }}>
                    Live Grid
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </div>
    </PortalShell>
  );
}

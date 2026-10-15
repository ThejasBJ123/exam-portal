"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

type BreakdownItem = {
  questionId: string;
  number: number;
  stem: string;
  type: string;
  adminMarks: number;
  earnedMarks: number;
  verdict: string;
  isCorrect: boolean;
};

type ResultResponse = {
  available: boolean;
  result?: {
    session: {
      id: string;
      status: string;
      score: {
        total: number;
        maxTotal: number;
        percentage?: number;
        objective?: number;
        maxObjective?: number;
        coding?: number;
        maxCoding?: number;
        correctCount?: number;
        totalQuestions?: number;
        breakdown?: BreakdownItem[];
      };
      examRun: { exam: { title: string; passPercent?: number } };
    };
  };
};

export default function StudentResultPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "exam-gas-2026";
  const [data, setData] = useState<ResultResponse | null>(null);

  useEffect(() => {
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices) {
        document.querySelectorAll("video").forEach((video) => {
          if (video.srcObject) {
            const stream = video.srcObject as MediaStream;
            stream.getTracks().forEach((track) => {
              track.stop();
              track.enabled = false;
            });
            video.srcObject = null;
          }
        });
      }
    } catch {
      // ignore
    }

    api<ResultResponse>(`/student/results/${id}`).then(setData);
  }, [id]);

  if (!data) return <p style={{ padding: "4rem", textAlign: "center" }}>Loading official scores…</p>;

  if (!data.available) {
    return (
      <div className="container" style={{ padding: "4rem 0 6rem", maxWidth: "680px" }}>
        <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
          <span className="chip chip-warning">Embargoed</span>
          <h1 style={{ fontSize: "2rem", marginTop: "1rem", marginBottom: "0.5rem" }}>Results Under Review</h1>
          <p style={{ color: "var(--muted)", maxWidth: "480px", margin: "0 auto 1.5rem" }}>
            The examining authority and Master Admin are currently conducting scoring validation and proctoring integrity clearance.
          </p>
          <div className="alert alert-info">
            Results will become visible here once officially published. You will also receive an email notification.
          </div>
          <Link href="/student/dashboard" className="btn btn-outline" style={{ marginTop: "1.5rem" }}>
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const rawScore = data.result!.session.score;
  const breakdown = rawScore.breakdown ?? [];
  const correctCount = rawScore.correctCount ?? breakdown.filter((b: any) => b.isCorrect).length;
  const totalQuestions = rawScore.totalQuestions ?? breakdown.length;
  const score = {
    total: rawScore.total ?? 0,
    maxTotal: rawScore.maxTotal ?? 12,
    percentage: rawScore.percentage ?? (rawScore.maxTotal ? Math.round((rawScore.total / rawScore.maxTotal) * 100) : 0),
    correctCount,
    totalQuestions,
    breakdown,
  };

  const exam = data.result!.session.examRun.exam;
  const passed = score.percentage >= Number(exam.passPercent ?? 50);

  return (
    <div className="container" style={{ padding: "3.5rem 0 6rem", maxWidth: "860px" }}>
      <div className="card" style={{ padding: "3rem", boxShadow: "0 10px 30px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <span className="chip chip-success">Officially Verified & Published</span>
          <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Authoritative Result Card</span>
        </div>

        <h1 style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>{exam.title}</h1>
        <p style={{ color: "var(--muted)" }}>Official Performance & Assessment Statement (Evaluated as per Admin Marks)</p>

        {/* Score Header Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: "1.5rem",
            margin: "2rem 0",
            background: passed ? "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)" : "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)",
            border: passed ? "1px solid #86EFAC" : "1px solid #FCA5A5",
            padding: "1.75rem",
            borderRadius: "14px",
            alignItems: "center",
          }}
        >
          <div>
            <span style={{ fontSize: "0.85rem", color: "#475569", textTransform: "uppercase", fontWeight: 700 }}>
              Total Aptitude Score
            </span>
            <div style={{ fontSize: "2.8rem", fontWeight: 900, color: passed ? "#166534" : "#991B1B" }}>
              {score.total} <span style={{ fontSize: "1.3rem", color: "#64748B", fontWeight: 600 }}>/ {score.maxTotal} Marks</span>
            </div>
            <div style={{ fontSize: "1rem", color: "#334155", marginTop: "0.25rem", fontWeight: 600 }}>
              Performance: <strong>{score.percentage}%</strong>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <span
              style={{
                display: "inline-block",
                padding: "0.55rem 1.3rem",
                borderRadius: "999px",
                fontSize: "0.95rem",
                fontWeight: 800,
                background: passed ? "#16A34A" : "#DC2626",
                color: "#FFFFFF",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {passed ? "QUALIFIED / PASSED" : "NOT QUALIFIED"}
            </span>
            <div style={{ fontSize: "0.82rem", color: "#64748B", marginTop: "0.5rem" }}>
              Admin Pass Threshold: {String(exam.passPercent ?? 50)}%
            </div>
          </div>
        </div>

        {/* Sectional Breakdown Calculated as per Admin Marks */}
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.85rem", color: "#1E293B" }}>
            Performance Breakdown & Question Accuracy
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ padding: "1rem 1.25rem", background: "#F8FAFC", borderRadius: "10px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 }}>Total Marks Scored</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0F172A", marginTop: "0.35rem" }}>
                {score.total} <span style={{ fontSize: "0.95rem", color: "var(--muted)", fontWeight: 500 }}>/ {score.maxTotal} Marks</span>
              </div>
            </div>
            <div style={{ padding: "1rem 1.25rem", background: "#F8FAFC", borderRadius: "10px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 }}>Correct Questions Accuracy</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0F172A", marginTop: "0.35rem" }}>
                {score.correctCount} <span style={{ fontSize: "0.95rem", color: "var(--muted)", fontWeight: 500 }}>/ {score.totalQuestions} Correct</span>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Question-Wise Performance Roster */}
        {score.breakdown && score.breakdown.length > 0 ? (
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.85rem", color: "#1E293B" }}>
              Itemized Question-Wise Evaluation Roster
            </h3>
            <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
              <table style={{ width: "100%", fontSize: "0.88rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                    <th style={{ padding: "0.65rem 0.85rem" }}>Q#</th>
                    <th style={{ padding: "0.65rem 0.85rem" }}>Question Stem / Topic</th>
                    <th style={{ padding: "0.65rem 0.85rem" }}>Type</th>
                    <th style={{ padding: "0.65rem 0.85rem" }}>Admin Marks</th>
                    <th style={{ padding: "0.65rem 0.85rem" }}>Verdict</th>
                    <th style={{ padding: "0.65rem 0.85rem", textAlign: "right" }}>Earned Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {score.breakdown.map((item, bIdx) => (
                    <tr
                      key={item.questionId || bIdx}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background: bIdx % 2 === 0 ? "white" : "#FAFBFD",
                      }}
                    >
                      <td style={{ padding: "0.65rem 0.85rem", fontWeight: 700 }}>Q{item.number}</td>
                      <td style={{ padding: "0.65rem 0.85rem", maxWidth: "260px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.stem}
                      </td>
                      <td style={{ padding: "0.65rem 0.85rem" }}>
                        <span className={`chip ${item.type === "CODING" ? "chip-warning" : "chip-info"}`} style={{ fontSize: "0.72rem" }}>
                          {item.type === "CODING" ? "Coding" : "MCQ"}
                        </span>
                      </td>
                      <td style={{ padding: "0.65rem 0.85rem", fontWeight: 600 }}>{item.adminMarks} Marks</td>
                      <td style={{ padding: "0.65rem 0.85rem" }}>
                        <span style={{ color: item.isCorrect ? "#16A34A" : item.earnedMarks > 0 ? "#D97706" : "#DC2626", fontWeight: 600 }}>
                          {item.verdict}
                        </span>
                      </td>
                      <td style={{ padding: "0.65rem 0.85rem", textAlign: "right", fontWeight: 800 }}>
                        {item.earnedMarks} / {item.adminMarks}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: "#F1F5F9", fontWeight: 800 }}>
                    <td colSpan={5} style={{ padding: "0.75rem 0.85rem", textAlign: "right" }}>
                      Authoritative Total Marks:
                    </td>
                    <td style={{ padding: "0.75rem 0.85rem", textAlign: "right", color: "var(--primary)", fontSize: "1.05rem" }}>
                      {score.total} / {score.maxTotal}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Proctoring Clearance Stamp */}
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "10px", padding: "1rem 1.25rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span style={{ color: "var(--success)", fontSize: "1.4rem" }}>🛡️</span>
          <div>
            <strong style={{ color: "var(--success)", fontSize: "0.95rem" }}>Proctoring Integrity Clearance: APPROVED</strong>
            <div style={{ fontSize: "0.85rem", color: "#166534" }}>AI telemetry and invigilator audit logs cleared without integrity violations.</div>
          </div>
        </div>

        <div style={{ marginTop: "2.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/student/dashboard" className="btn btn-primary">
            Return to Dashboard
          </Link>
          <button className="btn btn-outline" onClick={() => window.print()}>
            Print Score Statement
          </button>
          <Link href={`/student/exams/${id}/submitted`} className="btn btn-outline">
            View Submission Scorecard
          </Link>
        </div>
      </div>
    </div>
  );
}

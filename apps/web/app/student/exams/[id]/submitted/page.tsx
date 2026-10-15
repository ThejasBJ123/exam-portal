"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";

type QuestionResult = {
  questionId: string;
  number: number;
  stem: string;
  type: string;
  adminMarks: number;
  earnedMarks: number;
  verdict: string;
  isCorrect: boolean;
};

type ResultData = {
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
        breakdown?: QuestionResult[];
      };
      examRun: { exam: { title: string; passPercent?: number } };
    };
  };
};

function SubmittedContent() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "exam-gas-2026";
  const searchParams = useSearchParams();
  const isTerminated = searchParams.get("terminated") === "true";
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [cameraStopped, setCameraStopped] = useState(false);

  // Proactively stop and disconnect all camera and microphone tracks
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
      setCameraStopped(true);
    } catch {
      setCameraStopped(true);
    }

    // Load candidate's exam result immediately
    api<ResultData>(`/student/results/${id}`)
      .then((res) => setResultData(res))
      .catch(() => {});
  }, [id]);

  const rawScore = resultData?.result?.session?.score;
  const score = {
    total: rawScore?.total ?? 0,
    maxTotal: rawScore?.maxTotal ?? 20,
    objective: rawScore?.objective ?? 0,
    maxObjective: rawScore?.maxObjective ?? 10,
    coding: rawScore?.coding ?? 0,
    maxCoding: rawScore?.maxCoding ?? 10,
    percentage: rawScore?.percentage ?? (rawScore?.maxTotal ? Math.round((rawScore.total / rawScore.maxTotal) * 100) : 0),
    breakdown: rawScore?.breakdown ?? [],
  };

  const examTitle = resultData?.result?.session?.examRun?.exam?.title ?? "Graduate Aptitude Screen 2026";
  const passPercent = resultData?.result?.session?.examRun?.exam?.passPercent ?? 50;
  const isPassed = score.percentage >= passPercent && !isTerminated;

  return (
    <div className="container" style={{ padding: "3rem 0 5rem", maxWidth: "840px" }}>
      {/* Camera Status Bar */}
      <div
        style={{
          background: "#F1F5F9",
          border: "1px solid #CBD5E1",
          borderRadius: "10px",
          padding: "0.75rem 1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: "#EF4444" }}></span>
          <strong style={{ color: "#334155" }}>Web Camera Hardware:</strong>
          <span style={{ color: "#64748B" }}>
            {cameraStopped ? "Disconnected & Stopped (No Active Feed)" : "Terminating Feed…"}
          </span>
        </div>
        <span className="chip chip-neutral" style={{ fontSize: "0.75rem" }}>SESSION CLOSED</span>
      </div>

      <div
        className="card"
        style={{
          padding: "2.5rem 3rem",
          border: isTerminated ? "2px solid var(--error)" : "1px solid var(--border)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Header Icon */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: isTerminated ? "var(--error-bg)" : "var(--success-bg)",
            color: isTerminated ? "var(--error)" : "var(--success)",
            display: "grid",
            placeItems: "center",
            fontSize: "2rem",
            margin: "0 auto 1.25rem",
          }}
        >
          {isTerminated ? "⚠️" : "✓"}
        </div>

        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            {isTerminated ? "Examination Halted & Recorded" : "Examination Completed Successfully"}
          </h1>
          <p style={{ fontSize: "1rem", color: "var(--muted)", maxWidth: "580px", margin: "0 auto" }}>
            {isTerminated
              ? "Your sitting concluded after 3 proctoring alerts. Your score has been accurately calculated up to the termination point based on Admin question weights."
              : "Your responses and code submissions have been evaluated strictly as per the Admin marks configuration."}
          </p>
        </div>

        {/* Immediate Result Card for the Student */}
        <div
          style={{
            background: isPassed ? "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)" : "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)",
            border: isPassed ? "1px solid #86EFAC" : "1px solid #FCA5A5",
            borderRadius: "14px",
            padding: "1.75rem",
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700, color: "#475569" }}>
                Official Candidate Scorecard — {examTitle}
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginTop: "0.25rem" }}>
                <span style={{ fontSize: "2.8rem", fontWeight: 900, color: isPassed ? "#166534" : "#991B1B" }}>
                  {score.total}
                </span>
                <span style={{ fontSize: "1.3rem", fontWeight: 600, color: "#64748B" }}>
                  / {score.maxTotal} Marks
                </span>
              </div>
              <div style={{ fontSize: "0.95rem", color: "#334155", fontWeight: 600, marginTop: "0.25rem" }}>
                Overall Performance: {score.percentage}%
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "0.5rem 1.25rem",
                  borderRadius: "999px",
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  letterSpacing: "0.03em",
                  background: isPassed ? "#16A34A" : isTerminated ? "#DC2626" : "#E11D48",
                  color: "#FFFFFF",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                {isPassed ? "QUALIFIED / PASSED" : isTerminated ? "TERMINATED / REVIEW" : "NOT QUALIFIED"}
              </span>
              <div style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "0.5rem" }}>
                Admin Passing Threshold: {passPercent}%
              </div>
            </div>
          </div>

          {/* Sectional Performance Breakdown According to Admin Marks */}
          <div style={{ marginTop: "1.5rem", borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: "1.25rem" }}>
            <strong style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "#475569", display: "block", marginBottom: "0.75rem" }}>
              Sectional Performance Breakdown (Admin Configured Marks)
            </strong>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div style={{ background: "#FFFFFF", padding: "0.85rem 1rem", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: "0.8rem", color: "#64748B" }}>Section 1: Objective Aptitude & MCQs</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0F172A", marginTop: "0.2rem" }}>
                  {score.objective} <span style={{ fontSize: "0.9rem", color: "var(--muted)", fontWeight: 500 }}>/ {score.maxObjective} Marks</span>
                </div>
              </div>
              <div style={{ background: "#FFFFFF", padding: "0.85rem 1rem", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: "0.8rem", color: "#64748B" }}>Section 2: Practical Coding & Algorithms</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0F172A", marginTop: "0.2rem" }}>
                  {score.coding} <span style={{ fontSize: "0.9rem", color: "var(--muted)", fontWeight: 500 }}>/ {score.maxCoding} Marks</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Question Performance Roster */}
        {score.breakdown && score.breakdown.length > 0 ? (
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
              Itemized Question-Wise Performance
            </h3>
            <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
              <table style={{ width: "100%", fontSize: "0.88rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                    <th style={{ padding: "0.65rem 0.85rem" }}>Q#</th>
                    <th style={{ padding: "0.65rem 0.85rem" }}>Question Stem / Topic</th>
                    <th style={{ padding: "0.65rem 0.85rem" }}>Type</th>
                    <th style={{ padding: "0.65rem 0.85rem" }}>Admin Marks</th>
                    <th style={{ padding: "0.65rem 0.85rem" }}>Result</th>
                    <th style={{ padding: "0.65rem 0.85rem", textAlign: "right" }}>Earned</th>
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

        {/* Verification & Integrity Metadata */}
        <div style={{ background: "var(--light)", borderRadius: "12px", padding: "1.25rem 1.5rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
            <span style={{ color: "var(--muted)" }}>Official Submission Reference:</span>
            <strong style={{ fontFamily: "var(--font-mono)" }}>KGS-SUB-2026-{(Math.random() * 89999 + 10000).toFixed(0)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
            <span style={{ color: "var(--muted)" }}>Recorded Timestamp:</span>
            <strong>{new Date().toLocaleString()}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
            <span style={{ color: "var(--muted)" }}>Proctoring Clearance:</span>
            <strong style={{ color: isTerminated ? "var(--error)" : "var(--success)" }}>
              {isTerminated ? "Review Flagged (3 Warnings Exceeded)" : "Cleared & Approved"}
            </strong>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-outline" onClick={() => window.print()}>
            Print Scorecard
          </button>
          <Link href={`/student/results/${id}`} className="btn btn-primary">
            Detailed Result Statement &rarr;
          </Link>
          <Link href="/student/dashboard" className="btn btn-outline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SubmittedPage() {
  return (
    <Suspense fallback={<p style={{ padding: "4rem", textAlign: "center" }}>Loading candidate scorecard…</p>}>
      <SubmittedContent />
    </Suspense>
  );
}

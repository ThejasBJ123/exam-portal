"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { PortalShell } from "@/components/PortalShell";
import { api, type QuestionPaper } from "@/lib/api";

type CandidateResult = {
  id: string;
  status: string;
  session: {
    id: string;
    studentId?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    rollNumber?: string;
    paperCode?: string;
    paperTitle?: string;
    warningCount?: number;
    isTerminated?: boolean;
    score: {
      total: number;
      maxTotal: number;
      percentage?: number;
      correctCount?: number;
      totalQuestions?: number;
    } | null;
    examRun: {
      exam: {
        title: string;
        passPercent?: number;
      };
    };
  };
};

export default function ReportsPage() {
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>("ALL");
  const [downloaded, setDownloaded] = useState(false);
  const [message, setMessage] = useState("");

  // Clear Exam Data with Code Permission Modal State
  const [showClearModal, setShowClearModal] = useState(false);
  const [modalTargetCode, setModalTargetCode] = useState<string>("KGS-2026");
  const [confirmInput, setConfirmInput] = useState("");
  const [clearing, setClearing] = useState(false);

  async function loadData() {
    try {
      const [papersData, resultsData] = await Promise.all([
        api<QuestionPaper[]>("/papers"),
        api<CandidateResult[]>("/results"),
      ]);
      setPapers(papersData);
      setResults(resultsData);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter results strictly as per the selected Candidate Access Code
  const filteredResults = useMemo(() => {
    if (selectedCode === "ALL") return results;
    return results.filter((r) => {
      const pCode = String(r.session?.paperCode || "").trim().toUpperCase();
      return pCode === selectedCode.trim().toUpperCase();
    });
  }, [results, selectedCode]);

  // Aggregate Metrics computed dynamically as per the selected code
  const metrics = useMemo(() => {
    const total = filteredResults.length;
    if (total === 0) {
      return { passRate: 0, avgScore: 0, maxScore: 12, avgPct: 0, integrityRate: 100, total: 0 };
    }

    const passedCount = filteredResults.filter((r) => {
      const pct = r.session.score?.percentage ?? 0;
      const passPct = r.session.examRun?.exam?.passPercent ?? 50;
      return !r.session.isTerminated && pct >= passPct;
    }).length;

    const totalScore = filteredResults.reduce((sum, r) => sum + (r.session.score?.total ?? 0), 0);
    const maxScore = filteredResults[0]?.session.score?.maxTotal || 12;
    const avgScore = Number((totalScore / total).toFixed(1));
    const avgPct = maxScore > 0 ? Number(((avgScore / maxScore) * 100).toFixed(1)) : 0;
    const passRate = Number(((passedCount / total) * 100).toFixed(1));

    const cleanSessions = filteredResults.filter((r) => (r.session.warningCount ?? 0) === 0 && !r.session.isTerminated).length;
    const integrityRate = Number(((cleanSessions / total) * 100).toFixed(1));

    return { passRate, avgScore, maxScore, avgPct, integrityRate, total };
  }, [filteredResults]);

  // Target code for clear operation
  const targetClearCode = selectedCode === "ALL" ? (papers[0]?.code || "KGS-2026") : selectedCode;

  function openClearModal(codeToTarget?: string) {
    const target = codeToTarget || targetClearCode;
    setModalTargetCode(target);
    setConfirmInput(target); // Pre-fill with the code so the confirm button is immediately ready
    setShowClearModal(true);
  }

  // Handle Clear Exam Data with Permission Code
  async function handleClearData() {
    setClearing(true);
    try {
      await api("/exams/clear-data", {
        method: "POST",
        body: JSON.stringify({ code: modalTargetCode }),
      });
      setMessage(`All examination data and candidate attempts for code '${modalTargetCode}' have been deleted successfully. The test is ready for fresh candidate intake.`);
      setShowClearModal(false);
      setConfirmInput("");
      await loadData();
      setTimeout(() => setMessage(""), 6000);
    } catch {
      setMessage("Error clearing assessment data.");
    } finally {
      setClearing(false);
    }
  }

  // Export CSV Report as per the selected code (Pure Aptitude, No Coding)
  function exportCSV() {
    const headers = [
      "Candidate Name",
      "Email Address",
      "Roll Number",
      "Candidate Access Code",
      "Examination Paper",
      "Aptitude Score",
      "Max Marks",
      "Percentage",
      "Result Status",
      "Proctor Warnings",
      "Integrity Status",
    ];

    const csvRows = [headers.join(",")];

    filteredResults.forEach((r) => {
      const s = r.session;
      const pct = s.score?.percentage ?? 0;
      const passPct = s.examRun?.exam?.passPercent ?? 50;
      const isPassed = !s.isTerminated && pct >= passPct;
      const verdict = s.isTerminated ? "DISQUALIFIED (3/3 WARNINGS)" : isPassed ? "QUALIFIED" : "BELOW CUTOFF";

      csvRows.push([
        `"${s.fullName || s.studentId || "Candidate"}"`,
        `"${s.email || "N/A"}"`,
        `"${s.rollNumber || "N/A"}"`,
        `"${s.paperCode || "KGS-2026"}"`,
        `"${s.paperTitle || s.examRun?.exam?.title || "Graduate Aptitude Screen 2026"}"`,
        s.score?.total ?? 0,
        s.score?.maxTotal ?? 12,
        `"${pct}%"`,
        `"${verdict}"`,
        `"${s.warningCount ?? 0} / 3"`,
        `"${s.isTerminated ? "TERMINATED" : (s.warningCount ?? 0) > 0 ? "UNDER_REVIEW" : "NOMINAL"}"`,
      ].join(","));
    });

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `KGS_Report_${selectedCode}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  }

  return (
    <PortalShell role="MASTER_ADMIN">
      {/* Top Header & Report Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ marginBottom: "0.25rem" }}>Assessment Reports & Institutional Analytics</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Examine candidate performance, filter score reports by Candidate Access Code, and manage post-exam data lifecycle.
          </p>
        </div>

        {/* Clear Data & Export Actions */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <Link
            href="/admin/college-reports"
            className="btn btn-outline"
            style={{
              borderColor: "#86EFAC",
              background: "#F0FDF4",
              color: "#166534",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              textDecoration: "none",
            }}
          >
            <span>📊 College Wise Reports & Excel</span>
          </Link>

          {/* CLEAR EXAM DATA WITH PERMISSION BUTTON */}
          <button
            type="button"
            className="btn btn-outline"
            style={{
              borderColor: "#EF4444",
              color: "#DC2626",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
            }}
            onClick={() => openClearModal()}
            title="Clear and reset candidate examination data with code permission"
          >
            <span>🗑️ Clear Exam Data ({targetClearCode})</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            style={{ fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.45rem" }}
            onClick={exportCSV}
          >
            <span>📥 Export Official CSV Report</span>
          </button>
        </div>
      </div>

      {downloaded ? <div className="alert alert-ok" style={{ marginBottom: "1.25rem" }}>CSV Report downloaded successfully as per code '{selectedCode}'.</div> : null}
      {message ? <div className="alert alert-ok" style={{ marginBottom: "1.25rem" }}>{message}</div> : null}

      {/* FILTER AS PER CODE BAR */}
      <div
        className="card"
        style={{
          padding: "1rem 1.25rem",
          marginBottom: "1.75rem",
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
            🔑 Filter Report As Per Code:
          </span>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className={`btn btn-sm ${selectedCode === "ALL" ? "btn-primary" : "btn-outline"}`}
              style={{ fontSize: "0.82rem", fontWeight: 700, padding: "0.35rem 0.85rem" }}
              onClick={() => setSelectedCode("ALL")}
            >
              All Assessment Codes
            </button>

            {papers.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`btn btn-sm ${selectedCode === p.code ? "btn-primary" : "btn-outline"}`}
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  padding: "0.35rem 0.85rem",
                  fontFamily: "var(--font-mono)",
                }}
                onClick={() => setSelectedCode(p.code)}
              >
                {p.code}
              </button>
            ))}
          </div>
        </div>

        <span style={{ fontSize: "0.82rem", color: "var(--primary)", fontWeight: 700 }}>
          Active Filter: {selectedCode === "ALL" ? "All Codes" : `Code: ${selectedCode}`} ({filteredResults.length} Candidates)
        </span>
      </div>

      {/* DYNAMIC KPI METRIC CARDS (AS PER CODE) */}
      <div className="cards" style={{ marginBottom: "2rem" }}>
        <article className="card" style={{ borderLeft: "4px solid #10B981" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Pass Rate</span>
          <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--success)", margin: "0.4rem 0" }}>
            {metrics.passRate}%
          </div>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>Candidates meeting 50% cutoff for code</p>
        </article>

        <article className="card" style={{ borderLeft: "4px solid #3B82F6" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Average Score</span>
          <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--primary)", margin: "0.4rem 0" }}>
            {metrics.avgScore} / {metrics.maxScore}
          </div>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
            Mean aptitude marks ({metrics.avgPct}%) across candidates
          </p>
        </article>

        <article className="card" style={{ borderLeft: "4px solid #8B5CF6" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Proctor Integrity</span>
          <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--action)", margin: "0.4rem 0" }}>
            {metrics.integrityRate}%
          </div>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>Clean sessions with zero disciplinary alerts</p>
        </article>
      </div>

      {/* RESULTS DATA TABLE (AS PER CODE - PURE APTITUDE, NO CODING SANDBOX) */}
      <div className="card" style={{ padding: "1.75rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <h3 style={{ margin: 0 }}>
            Batch Score Summary: {selectedCode === "ALL" ? "All Paper Sets" : `Candidate Access Code: ${selectedCode}`}
          </h3>
          <span style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 }}>
            {filteredResults.length} Results Recorded
          </span>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Roll Number</th>
                <th>Candidate Access Code</th>
                <th>Aptitude (MCQ)</th>
                <th>Total Score</th>
                <th>Result Status</th>
                <th>Proctor Warnings</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((r) => {
                const s = r.session;
                const score = s.score;
                const pct = score?.percentage ?? 0;
                const passPct = s.examRun?.exam?.passPercent ?? 50;
                const isPassed = !s.isTerminated && pct >= passPct;
                const isDisqualified = s.isTerminated || (s.warningCount ?? 0) >= 3;

                return (
                  <tr key={r.id}>
                    <td>
                      <strong style={{ display: "block", fontSize: "0.95rem" }}>
                        {s.fullName || s.studentId || "Candidate"}
                      </strong>
                      <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                        {s.email}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                      {s.rollNumber || "N/A"}
                    </td>
                    <td>
                      <code
                        style={{
                          background: "#EFF6FF",
                          color: "#1D4ED8",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "6px",
                          fontWeight: 800,
                          fontSize: "0.88rem",
                          border: "1px solid #BFDBFE",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {s.paperCode || "KGS-2026"}
                      </code>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {score?.correctCount ?? 0} / {score?.totalQuestions ?? 6} Correct
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: "1.05rem", color: isDisqualified ? "#EF4444" : isPassed ? "#16A34A" : "#D97706" }}>
                        {score ? `${score.total} / ${score.maxTotal}` : "0 / 12"} Marks ({pct}%)
                      </strong>
                    </td>
                    <td>
                      <span
                        className={`chip ${
                          isDisqualified ? "chip-error" : isPassed ? "chip-success" : "chip-warning"
                        }`}
                        style={{ fontWeight: 800 }}
                      >
                        {isDisqualified ? "DISQUALIFIED" : isPassed ? "QUALIFIED" : "BELOW CUTOFF"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: (s.warningCount ?? 0) >= 3 ? "#DC2626" : (s.warningCount ?? 0) > 0 ? "#D97706" : "#16A34A",
                        }}
                      >
                        {s.warningCount ?? 0} / 3
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--muted)" }}>
                    No candidate results recorded for code '{selectedCode}'.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: SECURITY PERMISSION TO CLEAR EXAM DATA BY CODE NUMBER */}
      {showClearModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "540px",
              padding: "2rem",
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              borderTop: "5px solid #EF4444",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <span className="kicker" style={{ color: "#DC2626", fontWeight: 800 }}>
                  ADMIN SECURITY ACTION
                </span>
                <h3 style={{ margin: "0.2rem 0 0 0", fontSize: "1.25rem" }}>
                  Clear Assessment Data for Code
                </h3>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowClearModal(false)}
                disabled={clearing}
              >
                ✕
              </button>
            </div>

            {/* Target Code Selector Pills */}
            <div style={{ marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", display: "block", marginBottom: "0.35rem" }}>
                Select Assessment Code to Clear:
              </span>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {papers.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`btn btn-sm ${modalTargetCode === p.code ? "btn-primary" : "btn-outline"}`}
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 800,
                      padding: "0.25rem 0.65rem",
                      fontFamily: "var(--font-mono)",
                    }}
                    onClick={() => {
                      setModalTargetCode(p.code);
                      setConfirmInput(p.code);
                    }}
                  >
                    {p.code}
                  </button>
                ))}
                <button
                  type="button"
                  className={`btn btn-sm ${modalTargetCode === "ALL" ? "btn-primary" : "btn-outline"}`}
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    padding: "0.25rem 0.65rem",
                  }}
                  onClick={() => {
                    setModalTargetCode("ALL");
                    setConfirmInput("ALL");
                  }}
                >
                  ALL CODES
                </button>
              </div>
            </div>

            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "10px", padding: "1rem", marginBottom: "1.25rem" }}>
              <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.88rem", color: "#991B1B", lineHeight: 1.4 }}>
                <strong>Warning:</strong> This action will permanently erase candidate submissions, scores, answers, and proctoring warnings for:
              </p>
              <div style={{ textAlign: "center", margin: "0.75rem 0" }}>
                <button
                  type="button"
                  onClick={() => setConfirmInput(modalTargetCode)}
                  title="Click to copy into confirmation box"
                  style={{
                    background: "white",
                    padding: "0.45rem 1.25rem",
                    borderRadius: "8px",
                    border: "2px solid #EF4444",
                    fontSize: "1.35rem",
                    fontWeight: 900,
                    color: "#DC2626",
                    letterSpacing: "0.08em",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>{modalTargetCode}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600 }}>⚡ (Click to fill)</span>
                </button>
              </div>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#B91C1C", textAlign: "center" }}>
                Clearing data allows a fresh batch of candidates to take the exam under this access code.
              </p>
            </div>

            {/* Permission Input: Pre-filled, verified, and supports Enter key */}
            <div className="field" style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <label style={{ fontWeight: 700, fontSize: "0.88rem", margin: 0 }}>
                  To authorize deletion, confirm code <span style={{ color: "#DC2626", fontWeight: 800 }}>{modalTargetCode}</span> below:
                </label>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: "#DC2626", fontWeight: 700, fontSize: "0.78rem", padding: "0.15rem 0.4rem" }}
                  onClick={() => setConfirmInput(modalTargetCode)}
                >
                  ⚡ Auto-Fill Code
                </button>
              </div>

              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  autoFocus
                  placeholder={`Type ${modalTargetCode} to confirm...`}
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleClearData();
                    }
                  }}
                  style={{
                    fontWeight: 800,
                    fontSize: "1.05rem",
                    letterSpacing: "0.06em",
                    paddingRight: "2.5rem",
                    borderColor:
                      confirmInput.trim().toUpperCase() === modalTargetCode.trim().toUpperCase()
                        ? "#16A34A"
                        : "var(--border)",
                  }}
                />
                {confirmInput.trim().toUpperCase() === modalTargetCode.trim().toUpperCase() && (
                  <span
                    style={{
                      position: "absolute",
                      right: "0.85rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#16A34A",
                      fontWeight: 800,
                      fontSize: "1.2rem",
                    }}
                    title="Code Verified"
                  >
                    ✓
                  </span>
                )}
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.3rem", display: "block" }}>
                Press <strong>Enter</strong> or click the red button below to execute deletion immediately.
              </span>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  flex: 1,
                  background: "#DC2626",
                  borderColor: "#B91C1C",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  padding: "0.85rem",
                  fontSize: "0.95rem",
                  cursor: clearing ? "wait" : "pointer",
                  boxShadow: "0 4px 14px rgba(220, 38, 38, 0.35)",
                }}
                disabled={clearing}
                onClick={handleClearData}
              >
                {clearing ? "Clearing Data..." : `🗑️ Confirm & Clear Data (${modalTargetCode})`}
              </button>

              <button
                type="button"
                className="btn btn-outline"
                disabled={clearing}
                onClick={() => setShowClearModal(false)}
                style={{ fontWeight: 600 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  );
}

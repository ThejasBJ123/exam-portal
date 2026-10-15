"use client";

import { useEffect, useState, useMemo } from "react";
import { PortalShell } from "@/components/PortalShell";
import { api } from "@/lib/api";

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

type Result = {
  id: string;
  status: string;
  publishedAt?: string | null;
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
      objective?: number;
      maxObjective?: number;
      coding?: number;
      maxCoding?: number;
      correctCount?: number;
      totalQuestions?: number;
      breakdown?: BreakdownItem[];
    } | null;
    examRun: {
      exam: {
        title: string;
        passPercent?: number;
      };
    };
  };
};

export default function ResultsPage() {
  const [rows, setRows] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);

  async function load() {
    try {
      const data = await api<Result[]>("/results");
      setRows(data);
      setLoading(false);
      if (selectedResult) {
        const updated = data.find((r) => r.id === selectedResult.id);
        if (updated) setSelectedResult(updated);
      }
    } catch {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    try {
      await api(`/results/${id}/approve`, { method: "POST" });
      setMessage("Result approved by Master Admin. Ready for publication release.");
      load();
      setTimeout(() => setMessage(""), 4000);
    } catch {
      // ignore
    }
  }

  async function publish(id: string) {
    try {
      await api(`/results/${id}/publish`, { method: "POST" });
      setMessage("Official score published! Result is now accessible on the candidate's dashboard.");
      load();
      setTimeout(() => setMessage(""), 4000);
    } catch {
      // ignore
    }
  }

  async function approveAll() {
    try {
      await api("/results/approve-all", { method: "POST" });
      setMessage("All candidate results verified and approved successfully.");
      load();
      setTimeout(() => setMessage(""), 4000);
    } catch {
      // ignore
    }
  }

  async function publishAll() {
    try {
      await api("/results/publish-all", { method: "POST" });
      setMessage("All approved results published! Scores are now visible across student portals.");
      load();
      setTimeout(() => setMessage(""), 4000);
    } catch {
      // ignore
    }
  }

  // Export Results to Excel / CSV format
  function exportToExcel() {
    if (rows.length === 0) return;

    const headers = [
      "Candidate Name",
      "Roll Number / Unique ID",
      "Email Address",
      "Phone Number",
      "Question Paper Set Code",
      "Examination Title",
      "Marks Obtained",
      "Maximum Marks",
      "Score Percentage (%)",
      "Result Verdict",
      "Warnings Logged",
      "Integrity Status",
      "Publication State",
    ];

    const csvRows = [headers.join(",")];

    rows.forEach((r) => {
      const s = r.session;
      const passPercent = s.examRun?.exam?.passPercent ?? 50;
      const score = s.score?.total ?? 0;
      const maxScore = s.score?.maxTotal ?? 12;
      const pct = s.score?.percentage ?? Math.round((score / (maxScore || 1)) * 100);
      const isPassed = !s.isTerminated && pct >= passPercent;
      const verdict = s.isTerminated ? "DISQUALIFIED (3 WARNINGS)" : isPassed ? "PASS" : "FAIL";

      const values = [
        `"${s.fullName || s.studentId || "Candidate"}"`,
        `"${s.rollNumber || "N/A"}"`,
        `"${s.email || "N/A"}"`,
        `"${s.phone || "N/A"}"`,
        `"${s.paperCode || "KGS-2026"}"`,
        `"${s.examRun?.exam?.title || "Graduate Aptitude Screen 2026"}"`,
        score,
        maxScore,
        `${pct}%`,
        `"${verdict}"`,
        `"${s.warningCount ?? 0} / 3"`,
        `"${s.isTerminated ? "TERMINATED" : (s.warningCount ?? 0) > 0 ? "UNDER_REVIEW" : "NOMINAL"}"`,
        `"${r.status}"`,
      ];
      csvRows.push(values.join(","));
    });

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Kaizentrix_Exam_Results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Filter and search
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const q = search.toLowerCase();
      const s = r.session;
      const matchSearch =
        !q ||
        (s.fullName && s.fullName.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
        (s.paperCode && s.paperCode.toLowerCase().includes(q)) ||
        s.examRun?.exam?.title.toLowerCase().includes(q);

      if (!matchSearch) return false;

      const pct = s.score?.percentage ?? 0;
      const passPct = s.examRun?.exam?.passPercent ?? 50;

      if (statusFilter === "PUBLISHED") return r.status === "PUBLISHED";
      if (statusFilter === "APPROVED") return r.status === "APPROVED";
      if (statusFilter === "PENDING") return r.status === "PENDING" || r.status === "REVIEW";
      if (statusFilter === "PASSED") return !s.isTerminated && pct >= passPct;
      if (statusFilter === "FAILED") return s.isTerminated || pct < passPct;

      return true;
    });
  }, [rows, search, statusFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = rows.length;
    const published = rows.filter((r) => r.status === "PUBLISHED").length;
    const approved = rows.filter((r) => r.status === "APPROVED").length;
    const passed = rows.filter((r) => {
      const pct = r.session.score?.percentage ?? 0;
      const passPct = r.session.examRun?.exam?.passPercent ?? 50;
      return !r.session.isTerminated && pct >= passPct;
    }).length;

    const avgPct =
      total > 0
        ? Math.round(
            rows.reduce((sum, r) => sum + (r.session.score?.percentage ?? 0), 0) / total
          )
        : 0;

    return { total, published, approved, passed, avgPct };
  }, [rows]);

  return (
    <PortalShell role="MASTER_ADMIN">
      {/* Top Banner & Governance Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ marginBottom: "0.25rem" }}>Results Verification & Controlled Release</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Review candidate performance, verify authoritative marks, enforce disciplinary flags, and control official release to student dashboards.
          </p>
        </div>

        {/* Action Buttons: Export to Excel, Approve All, Publish All */}
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontWeight: 700, borderColor: "#10B981", color: "#059669", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            onClick={exportToExcel}
            title="Download authoritative score results in Excel / CSV format"
          >
            <span>📥 Download Excel / CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-outline"
            style={{ fontWeight: 700 }}
            onClick={approveAll}
          >
            ✓ Approve All
          </button>

          <button
            type="button"
            className="btn btn-primary"
            style={{ fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            onClick={publishAll}
          >
            <span>🚀 Publish All to Students</span>
          </button>
        </div>
      </div>

      {message ? <div className="alert alert-ok" style={{ marginBottom: "1.25rem" }}>{message}</div> : null}

      {/* KPI Metric Summary Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
        <div className="card" style={{ padding: "1.1rem", borderLeft: "4px solid #3B82F6" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Total Candidates</div>
          <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#1E293B", marginTop: "0.2rem" }}>{metrics.total}</div>
        </div>

        <div className="card" style={{ padding: "1.1rem", borderLeft: "4px solid #10B981" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Qualified / Passed</div>
          <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#059669", marginTop: "0.2rem" }}>
            {metrics.passed} <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted)" }}>({metrics.total > 0 ? Math.round((metrics.passed / metrics.total) * 100) : 0}%)</span>
          </div>
        </div>

        <div className="card" style={{ padding: "1.1rem", borderLeft: "4px solid #8B5CF6" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Average Batch Score</div>
          <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#7C3AED", marginTop: "0.2rem" }}>{metrics.avgPct}%</div>
        </div>

        <div className="card" style={{ padding: "1.1rem", borderLeft: "4px solid #22C55E" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Published & Released</div>
          <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#16A34A", marginTop: "0.2rem" }}>{metrics.published}</div>
        </div>

        <div className="card" style={{ padding: "1.1rem", borderLeft: "4px solid #F59E0B" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Approved (Embargoed)</div>
          <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#D97706", marginTop: "0.2rem" }}>{metrics.approved}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", flex: 1 }}>
          <input
            type="text"
            placeholder="🔍 Search candidate name, roll number, email, mobile, or access code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: "440px", padding: "0.5rem 0.85rem", fontSize: "0.88rem" }}
          />

          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: "All Candidates" },
              { id: "PUBLISHED", label: "🚀 Published" },
              { id: "APPROVED", label: "🔒 Approved (Embargoed)" },
              { id: "PASSED", label: "✓ Passed" },
              { id: "FAILED", label: "✕ Failed / Disqualified" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                className={`btn btn-sm ${statusFilter === f.id ? "btn-primary" : "btn-outline"}`}
                style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
                onClick={() => setStatusFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <span style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 }}>
          Showing {filteredRows.length} of {rows.length} records
        </span>
      </div>

      {/* RESULTS TABLE */}
      <div className="card" style={{ padding: "0", overflow: "hidden", marginBottom: "2rem" }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Candidate Details</th>
                <th>Roll No / Access Code</th>
                <th>Question Paper Set</th>
                <th>Calculated Score (Aptitude)</th>
                <th>Proctor Integrity</th>
                <th>Approval State</th>
                <th style={{ textAlign: "right" }}>Publication Governance</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => {
                const s = r.session;
                const score = s.score;
                const passPercent = s.examRun?.exam?.passPercent ?? 50;
                const pct = score?.percentage ?? Math.round(((score?.total ?? 0) / (score?.maxTotal || 1)) * 100);
                const isPassed = !s.isTerminated && pct >= passPercent;
                const warnings = s.warningCount ?? 0;
                const isDisqualified = s.isTerminated || warnings >= 3;

                return (
                  <tr key={r.id}>
                    {/* Candidate Details */}
                    <td>
                      <strong style={{ fontSize: "0.95rem", display: "block" }}>
                        {s.fullName || s.studentId || "Candidate"}
                      </strong>
                      <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                        {s.email} • {s.phone || "N/A"}
                      </span>
                    </td>

                    {/* Roll Number & Candidate Access Code */}
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--primary)", display: "block" }}>
                        {s.rollNumber || "N/A"}
                      </span>
                      <span className="chip chip-neutral" style={{ fontSize: "0.72rem", padding: "0.1rem 0.45rem" }}>
                        {s.paperCode || "KGS-2026"}
                      </span>
                    </td>

                    {/* Paper Title */}
                    <td style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1E293B", maxWidth: "230px" }}>
                      {s.paperTitle || s.examRun?.exam?.title || "Graduate Aptitude Screen"}
                    </td>

                    {/* Calculated Score - Pure Aptitude, No Coding */}
                    <td>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <strong style={{ fontSize: "1.1rem", color: isDisqualified ? "#EF4444" : isPassed ? "#16A34A" : "#D97706" }}>
                            {score ? `${score.total} / ${score.maxTotal} Marks` : "0 / 12 Marks"}
                          </strong>
                          <span
                            className={`chip ${isDisqualified ? "chip-error" : isPassed ? "chip-success" : "chip-warning"}`}
                            style={{ fontSize: "0.72rem", padding: "0.1rem 0.45rem", fontWeight: 800 }}
                          >
                            {isDisqualified ? "DISQUALIFIED" : isPassed ? "PASS" : "FAIL"}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                          Aptitude MCQs: {score?.correctCount ?? 0}/{score?.totalQuestions ?? 6} Correct ({pct}%)
                        </div>
                      </div>
                    </td>

                    {/* Proctor Integrity */}
                    <td>
                      {isDisqualified ? (
                        <span style={{ color: "#DC2626", fontWeight: 700, fontSize: "0.82rem" }}>
                          ⛔ Terminated (3 Warnings)
                        </span>
                      ) : warnings > 0 ? (
                        <span style={{ color: "#D97706", fontWeight: 600, fontSize: "0.82rem" }}>
                          ⚠️ {warnings} / 3 Warnings Logged
                        </span>
                      ) : (
                        <span style={{ color: "#16A34A", fontWeight: 600, fontSize: "0.82rem" }}>
                          ✓ Cleared (Nominal)
                        </span>
                      )}
                    </td>

                    {/* Approval State */}
                    <td>
                      <span
                        className={`chip ${
                          r.status === "PUBLISHED"
                            ? "chip-success"
                            : r.status === "APPROVED"
                              ? "chip-info"
                              : "chip-warning"
                        }`}
                        style={{ fontWeight: 700 }}
                      >
                        {r.status === "PUBLISHED" ? "PUBLISHED" : r.status === "APPROVED" ? "APPROVED (EMBARGOED)" : "PENDING"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.45rem", alignItems: "center" }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: "0.78rem" }}
                          onClick={() => setSelectedResult(r)}
                        >
                          🔍 Scorecard
                        </button>

                        {r.status === "PENDING" || r.status === "REVIEW" ? (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: "0.78rem" }}
                            onClick={() => approve(r.id)}
                          >
                            ✓ Approve
                          </button>
                        ) : null}

                        {r.status === "APPROVED" ? (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: "0.78rem" }}
                            onClick={() => publish(r.id)}
                          >
                            🚀 Publish
                          </button>
                        ) : null}

                        {r.status === "PUBLISHED" ? (
                          <span style={{ color: "var(--success)", fontSize: "0.82rem", fontWeight: 700 }}>
                            ✓ Released
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
                    {loading ? "Loading examination results..." : "No candidate results matching the selected filter."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED SCORECARD & BREAKDOWN MODAL */}
      {selectedResult && (
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
            padding: "1.5rem",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "800px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
              <div>
                <span className="kicker" style={{ color: "var(--primary)", fontWeight: 700 }}>
                  AUTHORITATIVE CANDIDATE SCORECARD
                </span>
                <h2 style={{ margin: "0.2rem 0 0.3rem 0", fontSize: "1.35rem" }}>
                  {selectedResult.session.fullName || selectedResult.session.studentId}
                </h2>
                <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                  Roll No: <strong>{selectedResult.session.rollNumber || "N/A"}</strong> • Email: <strong>{selectedResult.session.email}</strong> • Mobile: <strong>{selectedResult.session.phone || "N/A"}</strong>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: "1.1rem" }}
                onClick={() => setSelectedResult(null)}
              >
                ✕
              </button>
            </div>

            {/* Scorecard Hero Strip */}
            <div
              style={{
                background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
                color: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                marginBottom: "1.5rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "1rem",
              }}
            >
              <div>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#94A3B8", fontWeight: 700 }}>Total Marks</div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#38BDF8" }}>
                  {selectedResult.session.score?.total ?? 0} / {selectedResult.session.score?.maxTotal ?? 12}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#94A3B8", fontWeight: 700 }}>Percentage</div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#34D399" }}>
                  {selectedResult.session.score?.percentage ?? 0}%
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#94A3B8", fontWeight: 700 }}>Official Verdict</div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, marginTop: "0.25rem" }}>
                  {selectedResult.session.isTerminated ? (
                    <span style={{ color: "#EF4444" }}>DISQUALIFIED</span>
                  ) : (selectedResult.session.score?.percentage ?? 0) >= (selectedResult.session.examRun?.exam?.passPercent ?? 50) ? (
                    <span style={{ color: "#4ADE80" }}>PASSED ✓</span>
                  ) : (
                    <span style={{ color: "#F87171" }}>FAILED ✕</span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#94A3B8", fontWeight: 700 }}>Paper Set Code</div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#FBBF24", marginTop: "0.25rem", fontFamily: "var(--font-mono)" }}>
                  {selectedResult.session.paperCode || "KGS-2026"}
                </div>
              </div>
            </div>

            {/* Question Breakdown Table */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ fontSize: "0.95rem", marginBottom: "0.75rem" }}>
                Aptitude & Reasoning Question Breakdown
              </h4>
              <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
                <table style={{ margin: 0 }}>
                  <thead style={{ background: "#F8FAFC" }}>
                    <tr>
                      <th style={{ width: "50px" }}>#</th>
                      <th>Question Stem</th>
                      <th>Admin Marks</th>
                      <th>Verdict</th>
                      <th>Marks Awarded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedResult.session.score?.breakdown && selectedResult.session.score.breakdown.length > 0 ? (
                      selectedResult.session.score.breakdown.map((item, idx) => (
                        <tr key={item.questionId || idx}>
                          <td style={{ fontWeight: 700 }}>Q{item.number || idx + 1}</td>
                          <td style={{ fontSize: "0.85rem" }}>{item.stem}</td>
                          <td style={{ fontWeight: 600 }}>{item.adminMarks} Marks</td>
                          <td>
                            <span
                              className={`chip ${item.isCorrect ? "chip-success" : "chip-error"}`}
                              style={{ fontSize: "0.72rem", padding: "0.15rem 0.5rem" }}
                            >
                              {item.verdict}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: item.isCorrect ? "#16A34A" : "#DC2626" }}>
                            {item.earnedMarks > 0 ? `+${item.earnedMarks}` : "0"} Marks
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "1.5rem", color: "var(--muted)" }}>
                          No question breakdown logged for this attempt.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                Publication Status: <strong>{selectedResult.status}</strong>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                {selectedResult.status !== "PUBLISHED" ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      publish(selectedResult.id);
                      setSelectedResult((prev) => (prev ? { ...prev, status: "PUBLISHED" } : null));
                    }}
                  >
                    🚀 Publish Result to Candidate
                  </button>
                ) : (
                  <span style={{ color: "var(--success)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                    ✓ Published & Visible to Candidate
                  </span>
                )}

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSelectedResult(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  );
}

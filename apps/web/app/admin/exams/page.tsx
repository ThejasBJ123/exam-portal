"use client";

import { FormEvent, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { PortalShell } from "@/components/PortalShell";
import { api } from "@/lib/api";

type Exam = {
  id: string;
  title: string;
  status: string;
  durationMinutes: number;
  minDurationMinutes?: number;
  passPercent?: number;
  kind: string;
  accessCode?: string;
  description?: string;
  totalQuestions?: number;
  isLive?: boolean;
  startedAt?: string | null;
};

export default function ExamsPage() {
  const [rows, setRows] = useState<Exam[]>([]);
  const [message, setMessage] = useState("");
  const [copyToast, setCopyToast] = useState("");
  const [showBuilder, setShowBuilder] = useState(false);
  const [search, setSearch] = useState("");
  const [lastCreated, setLastCreated] = useState<{ id: string; title: string; code: string } | null>(null);

  // New Exam Form State
  const [newTitle, setNewTitle] = useState("");
  const [newKind, setNewKind] = useState("APTITUDE");
  const [newAccessCode, setNewAccessCode] = useState("");
  const [newDuration, setNewDuration] = useState(60);
  const [newMinDuration, setNewMinDuration] = useState(30);
  const [newPassPercent, setNewPassPercent] = useState(50);
  const [newDescription, setNewDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Timing Modal State
  const [timingModalExam, setTimingModalExam] = useState<Exam | null>(null);
  const [editDuration, setEditDuration] = useState(60);
  const [editMinDuration, setEditMinDuration] = useState(30);

  async function load() {
    try {
      const data = await api<Exam[]>("/exams");
      setRows(data);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load();
    generateFreshCode();
  }, []);

  function generateFreshCode() {
    const prefixes = ["KGS", "APT", "SET", "CORE", "EVAL"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    const code = `${prefix}-${num}`;
    setNewAccessCode(code);
    return code;
  }

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    try {
      const cleanCode = (newAccessCode || generateFreshCode()).toUpperCase().trim();
      const dur = Number(newDuration) || 60;
      const minDur = Number(newMinDuration) > 0 ? Number(newMinDuration) : Math.min(dur, 30);
      const res: any = await api("/exams", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle.trim(),
          kind: newKind,
          accessCode: cleanCode,
          durationMinutes: dur,
          minDurationMinutes: minDur,
          passPercent: Number(newPassPercent) || 50,
          description: newDescription.trim(),
        }),
      });

      setLastCreated({
        id: res?.id || `paper-set-${Date.now()}`,
        title: newTitle.trim(),
        code: cleanCode,
      });

      setMessage(`Examination '${newTitle}' configured with Code '${cleanCode}' (Duration: ${dur}m, Min Limit: ${minDur}m).`);
      setShowBuilder(false);
      setNewTitle("");
      setNewDescription("");
      await load();
      setTimeout(() => setMessage(""), 6000);
    } catch {
      setMessage("Error creating examination.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleExamLive(exam: Exam) {
    try {
      const res: any = await api(`/exams/${exam.id}/toggle-live`, { method: "POST" });
      const isLive = res?.isLive;
      setMessage(
        isLive
          ? `🚀 Live Examination Batch Started & Authorized for '${exam.title}'! Official countdown is ticking.`
          : `⏸️ Examination Batch Paused for '${exam.title}'. Candidates are held in waiting lobby.`
      );
      await load();
      setTimeout(() => setMessage(""), 5000);
    } catch {
      setMessage("Failed to update exam live status.");
    }
  }

  function handleOpenTimingModal(exam: Exam) {
    setTimingModalExam(exam);
    setEditDuration(exam.durationMinutes || 60);
    setEditMinDuration(exam.minDurationMinutes || Math.min(exam.durationMinutes || 60, 30));
  }

  async function saveExamTiming(e: FormEvent) {
    e.preventDefault();
    if (!timingModalExam) return;
    try {
      await api(`/exams/${timingModalExam.id}/timing`, {
        method: "POST",
        body: JSON.stringify({
          durationMinutes: Number(editDuration),
          minDurationMinutes: Number(editMinDuration),
        }),
      });
      setMessage(`Timing policy updated for '${timingModalExam.title}': Max ${editDuration}m, Min compulsory ${editMinDuration}m.`);
      setTimingModalExam(null);
      await load();
      setTimeout(() => setMessage(""), 5000);
    } catch {
      setMessage("Failed to update exam timing.");
    }
  }

  async function publish(id: string) {
    try {
      await api(`/exams/${id}/publish`, { method: "POST" });
      setMessage("Exam published. Configuration snapshotted & frozen for active candidate runs.");
      await load();
      setTimeout(() => setMessage(""), 4000);
    } catch {
      // ignore
    }
  }

  async function deleteExam(id: string, title: string) {
    if (!confirm(`Are you sure you wish to delete examination '${title}'? This action cannot be undone.`)) {
      return;
    }
    try {
      await api(`/exams/${id}`, { method: "DELETE" });
      setMessage(`Examination '${title}' deleted successfully.`);
      await load();
      setTimeout(() => setMessage(""), 4000);
    } catch {
      // ignore
    }
  }

  function copyCode(code?: string) {
    if (!code) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopyToast(`Candidate Access Code '${code}' copied to clipboard! Share this with candidates.`);
    setTimeout(() => setCopyToast(""), 4000);
  }

  const filtered = useMemo(() => {
    return rows.filter((e) => {
      const q = search.toLowerCase();
      return (
        !q ||
        e.title.toLowerCase().includes(q) ||
        (e.accessCode && e.accessCode.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    });
  }, [rows, search]);

  return (
    <PortalShell role="MASTER_ADMIN">
      {/* Top Banner and Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ marginBottom: "0.25rem" }}>Exam Builder & Section Architecture</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Configure assessments, specify Candidate Access Codes, negative marks, and publish to freeze configurations.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ fontWeight: 700 }}
          onClick={() => {
            if (!showBuilder) {
              generateFreshCode();
              setNewTitle("");
              setNewDescription("");
            }
            setShowBuilder(!showBuilder);
          }}
        >
          {showBuilder ? "Cancel" : "+ Build New Examination"}
        </button>
      </div>

      {/* Copy Code Toast Notification */}
      {copyToast ? (
        <div className="alert alert-ok" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <span>📋 {copyToast}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCopyToast("")}>✕</button>
        </div>
      ) : null}

      {/* General Success Toast */}
      {message ? (
        <div className="alert alert-ok" style={{ marginBottom: "1.25rem" }}>
          {message}
        </div>
      ) : null}

      {/* Newly Created Assessment Banner */}
      {lastCreated ? (
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)",
            border: "1.5px solid #86EFAC",
            borderRadius: "12px",
            padding: "1.25rem 1.5rem",
            marginBottom: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            boxShadow: "0 4px 15px rgba(22, 101, 52, 0.08)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "1.2rem" }}>🎉</span>
              <strong style={{ color: "#166534", fontSize: "1.05rem" }}>
                Assessment Batch '{lastCreated.title}' Successfully Activated!
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#15803D" }}>
              Official Candidate Access Code:{" "}
              <strong style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", color: "#166534", background: "white", padding: "0.15rem 0.5rem", borderRadius: "5px", border: "1px solid #BBF7D0", letterSpacing: "0.05em" }}>
                {lastCreated.code}
              </strong>
              . Candidates can now enter this code on the student login portal.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => copyCode(lastCreated.code)}
              style={{ background: "white", borderColor: "#86EFAC", color: "#166534", fontWeight: 700 }}
            >
              📋 Copy Access Code
            </button>
            <Link
              href={`/admin/questions/${lastCreated.id}`}
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 700 }}
            >
              📂 Manage Questions →
            </Link>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: "#15803D" }}
              onClick={() => setLastCreated(null)}
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}

      {/* Admin Candidate Access Code Distribution Banner */}
      <div
        style={{
          background: "#EFF6FF",
          border: "1px solid #BFDBFE",
          borderRadius: "10px",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <strong style={{ color: "#1E40AF" }}>🔑 Candidate Access Code Distribution:</strong>
          <span style={{ color: "#3B82F6", marginLeft: "0.5rem" }}>
            Share these official codes with candidates to allow them to register and log in to their assigned assessment.
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: 600 }}>Active Codes:</span>
          {rows.map((r) => (
            <button
              key={r.id}
              type="button"
              className="btn btn-sm"
              onClick={() => copyCode(r.accessCode)}
              style={{
                background: "white",
                padding: "0.3rem 0.65rem",
                borderRadius: "6px",
                border: "1px solid #93C5FD",
                fontWeight: 800,
                fontSize: "0.92rem",
                color: "#1D4ED8",
                letterSpacing: "0.05em",
                fontFamily: "var(--font-mono)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                cursor: "pointer",
              }}
              title={`Click to copy ${r.accessCode} for ${r.title}`}
            >
              <span>{r.accessCode || "KGS-2026"}</span>
              <span style={{ fontSize: "0.75rem", color: "#60A5FA" }}>📋</span>
            </button>
          ))}
        </div>
      </div>

      {/* INLINE BUILDER FORM: CONFIGURE NEW ASSESSMENT BATCH */}
      {showBuilder ? (
        <form
          className="card"
          onSubmit={create}
          style={{
            marginBottom: "2rem",
            padding: "2rem",
            border: "2px solid var(--primary)",
            borderRadius: "14px",
            boxShadow: "0 10px 30px rgba(37, 99, 235, 0.08)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.25rem" }}>Configure New Assessment Batch</h3>
            <span className="chip chip-info" style={{ fontWeight: 700 }}>Pure Aptitude & Reasoning</span>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Examination Title *</label>
              <input
                required
                placeholder="e.g. Campus Recruitment 2026 Batch B"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Assessment Kind</label>
              <select
                value={newKind}
                onChange={(e) => setNewKind(e.target.value)}
                style={{ fontWeight: 600, color: "var(--primary)" }}
              >
                <option value="APTITUDE">APTITUDE (Quantitative & Logical Reasoning)</option>
                <option value="OBJECTIVE_MCQ">OBJECTIVE MCQ (General Aptitude & Verbal Ability)</option>
              </select>
            </div>

            <div className="field">
              <label style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Candidate Access Code (Given to Students to Log In) *</span>
                <button
                  type="button"
                  style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.75rem", cursor: "pointer", padding: 0, fontWeight: 700 }}
                  onClick={generateFreshCode}
                >
                  ⚡ Auto-Generate Code
                </button>
              </label>
              <input
                required
                value={newAccessCode}
                onChange={(e) => setNewAccessCode(e.target.value.toUpperCase())}
                placeholder="e.g. KGS-9281"
                style={{ textTransform: "uppercase", fontWeight: 800, color: "var(--primary)", letterSpacing: "0.06em" }}
              />
            </div>

            <div className="field">
              <label>Total Exam Duration (Minutes) *</label>
              <input
                type="number"
                min={10}
                max={240}
                value={newDuration}
                onChange={(e) => {
                  const d = Number(e.target.value);
                  setNewDuration(d);
                  if (newMinDuration > d) setNewMinDuration(Math.min(d, 30));
                }}
                required
              />
              <span style={{ fontSize: "0.74rem", color: "var(--muted)", display: "block", marginTop: "0.2rem" }}>
                Auto-submits strictly at {newDuration} minutes
              </span>
            </div>

            <div className="field">
              <label>Minimum Attendance Time Limit (Minutes) *</label>
              <input
                type="number"
                min={1}
                max={newDuration}
                value={newMinDuration}
                onChange={(e) => setNewMinDuration(Math.min(newDuration, Math.max(1, Number(e.target.value))))}
                required
              />
              <span style={{ fontSize: "0.74rem", color: "#B45309", display: "block", marginTop: "0.2rem" }}>
                🔒 Compulsory attendance: candidate cannot submit before {newMinDuration} minutes
              </span>
            </div>

            <div className="field">
              <label>Passing Percentage (%) *</label>
              <input
                type="number"
                min={20}
                max={100}
                value={newPassPercent}
                onChange={(e) => setNewPassPercent(Number(e.target.value))}
                required
              />
            </div>

            <div className="field" style={{ gridColumn: "span 2" }}>
              <label>Description & Scope</label>
              <textarea
                rows={2}
                placeholder="Brief assessment summary, aptitude topics covered, or screening guidelines..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1.25rem" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !newTitle.trim()}
              style={{ fontWeight: 700, padding: "0.65rem 1.5rem" }}
            >
              {submitting ? "Configuring Exam..." : "Create Draft Exam & Activate Code"}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowBuilder(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {/* Search Bar & Direct Quick Links */}
      <div
        className="card"
        style={{
          padding: "0.85rem 1.25rem",
          marginBottom: "1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <input
          type="text"
          placeholder="🔍 Search examinations by title, code, or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: "420px", padding: "0.45rem 0.8rem", fontSize: "0.88rem" }}
        />
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <Link href="/admin/questions" className="btn btn-outline btn-sm" style={{ textDecoration: "none", fontWeight: 600 }}>
            📂 Question Bank
          </Link>
          <Link href="/admin/monitoring" className="btn btn-outline btn-sm" style={{ textDecoration: "none", fontWeight: 600 }}>
            👁️ Live Monitor
          </Link>
          <span style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600, marginLeft: "0.5rem" }}>
            {filtered.length} Assessment Papers
          </span>
        </div>
      </div>

      {/* EXAMINATIONS TABLE */}
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "2.5rem" }}>
        <div className="table-container" style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ minWidth: "960px", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ width: "30%" }}>Title</th>
                <th style={{ width: "14%" }}>Assessment Kind</th>
                <th style={{ width: "18%" }}>Candidate Access Code</th>
                <th style={{ width: "13%" }}>Allocated Time</th>
                <th style={{ width: "10%" }}>Status</th>
                <th style={{ width: "15%", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  {/* Title & Description */}
                  <td>
                    <Link
                      href={`/admin/questions/${e.id}`}
                      style={{
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        color: "var(--primary)",
                        textDecoration: "none",
                        display: "block",
                        marginBottom: "0.2rem",
                      }}
                    >
                      {e.title}
                    </Link>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.3 }}>
                      {e.description || "Aptitude and reasoning screening assessment configured for candidate evaluations."}
                    </div>
                  </td>

                  {/* Assessment Kind */}
                  <td>
                    <span className="chip chip-info" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                      {e.kind || "OBJECTIVE_MCQ"}
                    </span>
                  </td>

                  {/* Candidate Access Code with 1-Click Copy */}
                  <td>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                      <code
                        style={{
                          background: "#EFF6FF",
                          color: "#1D4ED8",
                          padding: "0.28rem 0.65rem",
                          borderRadius: "6px",
                          fontWeight: 800,
                          fontSize: "0.95rem",
                          border: "1px solid #BFDBFE",
                          letterSpacing: "0.05em",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {e.accessCode || "KGS-2026"}
                      </code>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ padding: "0.22rem 0.45rem", fontSize: "0.72rem" }}
                        onClick={() => copyCode(e.accessCode)}
                        title="Copy access code for students"
                      >
                        📋 Copy
                      </button>
                    </div>
                  </td>

                  {/* Duration & Passing */}
                  <td>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1E3A8A" }}>
                      ⏱️ {e.durationMinutes} Mins (Total)
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "#B45309", fontWeight: 700, marginTop: "0.2rem" }}>
                      🔒 Min Limit: {e.minDurationMinutes ?? Math.min(e.durationMinutes, 30)} Mins
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.15rem" }}>
                      Passing: {e.passPercent ?? 50}% • {e.totalQuestions ?? 4} MCQs
                    </div>
                  </td>

                  {/* Status & Live Start Permission */}
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <span
                        className={`chip ${e.status === "PUBLISHED" ? "chip-success" : "chip-neutral"}`}
                        style={{ fontWeight: 700, fontSize: "0.72rem" }}
                      >
                        {e.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT"}
                      </span>
                      {e.isLive ?? true ? (
                        <span
                          className="chip"
                          style={{
                            background: "#DCFCE7",
                            color: "#166534",
                            border: "1px solid #86EFAC",
                            fontSize: "0.7rem",
                            padding: "0.15rem 0.45rem",
                            fontWeight: 700,
                          }}
                        >
                          🟢 LIVE BATCH
                        </span>
                      ) : (
                        <span
                          className="chip"
                          style={{
                            background: "#FEF3C7",
                            color: "#B45309",
                            border: "1px solid #FCD34D",
                            fontSize: "0.7rem",
                            padding: "0.15rem 0.45rem",
                            fontWeight: 700,
                          }}
                        >
                          ⏸️ WAITING
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Management Actions */}
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.35rem", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "0.22rem 0.5rem",
                          borderColor: (e.isLive ?? true) ? "#FCA5A5" : "#86EFAC",
                          color: (e.isLive ?? true) ? "#B91C1C" : "#166534",
                          background: (e.isLive ?? true) ? "#FEF2F2" : "#F0FDF4",
                          cursor: "pointer",
                        }}
                        onClick={() => toggleExamLive(e)}
                        title={(e.isLive ?? true) ? "Click to pause exam batch" : "Click to grant permission and start live batch"}
                      >
                        {(e.isLive ?? true) ? "⏸️ Pause Batch" : "🚀 Start Batch"}
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: "0.75rem", padding: "0.22rem 0.5rem", color: "#1E40AF", borderColor: "#BFDBFE", background: "#EFF6FF", fontWeight: 600 }}
                        onClick={() => handleOpenTimingModal(e)}
                        title="Configure total duration and minimum attendance time limit"
                      >
                        ⏱️ Timing
                      </button>

                      <Link
                        href={`/admin/questions/${e.id}`}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: "0.75rem", textDecoration: "none", fontWeight: 700, padding: "0.22rem 0.5rem" }}
                        title="Open Questions for this assessment"
                      >
                        📂 Questions
                      </Link>

                      <Link
                        href="/admin/monitoring"
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: "0.75rem", textDecoration: "none", padding: "0.22rem 0.5rem" }}
                        title="Live Monitor"
                      >
                        👁️ Monitor
                      </Link>

                      {rows.length > 1 ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: "#EF4444", fontSize: "0.85rem", padding: "0.2rem 0.4rem" }}
                          onClick={() => deleteExam(e.id, e.title)}
                          title="Delete examination"
                        >
                          🗑️
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem", color: "var(--muted)" }}>
                    No examinations found matching your search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* TIMING CONFIGURATION MODAL */}
      {timingModalExam && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 540,
              width: "100%",
              padding: "2rem",
              background: "#FFFFFF",
              borderRadius: "14px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ margin: 0, color: "#1E3A8A", fontSize: "1.25rem" }}>
                  ⏱️ Configure Exam Timing Policy
                </h3>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
                  Assessment: <strong>{timingModalExam.title}</strong>
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setTimingModalExam(null)}
                style={{ fontSize: "1.1rem" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveExamTiming}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1E293B", marginBottom: "0.3rem" }}>
                    Total Exam Duration (Mins) *
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={360}
                    required
                    value={editDuration}
                    onChange={(e) => {
                      const d = Number(e.target.value);
                      setEditDuration(d);
                      if (editMinDuration > d) setEditMinDuration(Math.min(d, 30));
                    }}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.95rem", fontWeight: 600 }}
                  />
                  <span style={{ fontSize: "0.72rem", color: "var(--muted)", display: "block", marginTop: "0.25rem" }}>
                    Auto-submits strictly at {editDuration}m
                  </span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1E293B", marginBottom: "0.3rem" }}>
                    Minimum Time Limit (Mins) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={editDuration}
                    required
                    value={editMinDuration}
                    onChange={(e) => setEditMinDuration(Math.min(editDuration, Math.max(1, Number(e.target.value))))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.95rem", fontWeight: 600 }}
                  />
                  <span style={{ fontSize: "0.72rem", color: "#B45309", display: "block", marginTop: "0.25rem" }}>
                    🔒 Candidate cannot submit before {editMinDuration}m
                  </span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ marginBottom: "1.25rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.4rem" }}>
                  Quick Presets:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {[
                    { label: "1 Hour Exam (30m Min / 60m Max)", min: 30, max: 60 },
                    { label: "90 Mins (45m Min / 90m Max)", min: 45, max: 90 },
                    { label: "2 Hours (60m Min / 120m Max)", min: 60, max: 120 },
                    { label: "30 Mins Quiz (15m Min / 30m Max)", min: 15, max: 30 },
                    { label: "15 Mins Test (5m Min / 15m Max)", min: 5, max: 15 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setEditMinDuration(preset.min);
                        setEditDuration(preset.max);
                      }}
                      className="btn btn-outline btn-sm"
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.55rem",
                        background: editDuration === preset.max && editMinDuration === preset.min ? "#1E40AF" : "#F8FAFC",
                        color: editDuration === preset.max && editMinDuration === preset.min ? "white" : "#1E40AF",
                        borderColor: "#93C5FD",
                        fontWeight: 600,
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  borderRadius: "8px",
                  padding: "0.85rem",
                  fontSize: "0.82rem",
                  color: "#1E40AF",
                  marginBottom: "1.5rem",
                  lineHeight: 1.45,
                }}
              >
                <strong>Policy Enforcement:</strong> Candidates are strictly locked from submitting their answers until at least <strong>{editMinDuration} minutes</strong> have elapsed from their start time. Once the <strong>{editDuration} minute</strong> timer expires, answers will auto-submit automatically.
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setTimingModalExam(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  Save Timing Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalShell>
  );
}

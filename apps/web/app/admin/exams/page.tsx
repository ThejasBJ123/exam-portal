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
  passPercent?: number;
  kind: string;
  accessCode?: string;
  description?: string;
  totalQuestions?: number;
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
  const [newDuration, setNewDuration] = useState(30);
  const [newPassPercent, setNewPassPercent] = useState(50);
  const [newDescription, setNewDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      const res: any = await api("/exams", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle.trim(),
          kind: newKind,
          accessCode: cleanCode,
          durationMinutes: Number(newDuration) || 30,
          passPercent: Number(newPassPercent) || 50,
          description: newDescription.trim(),
        }),
      });

      setLastCreated({
        id: res?.id || `paper-set-${Date.now()}`,
        title: newTitle.trim(),
        code: cleanCode,
      });

      setMessage(`Examination '${newTitle}' successfully configured with Candidate Access Code '${cleanCode}'.`);
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
              <label>Duration (Minutes) *</label>
              <input
                type="number"
                min={10}
                max={240}
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                required
              />
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
                    <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>
                      ⏱️ {e.durationMinutes} Minutes
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.15rem" }}>
                      Passing: {e.passPercent ?? 50}% • {e.totalQuestions ?? 4} MCQs
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <span
                      className={`chip ${e.status === "PUBLISHED" ? "chip-success" : "chip-neutral"}`}
                      style={{ fontWeight: 700, fontSize: "0.75rem" }}
                    >
                      {e.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT"}
                    </span>
                  </td>

                  {/* Management Actions */}
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center", justifyContent: "flex-end" }}>
                      <Link
                        href={`/admin/questions/${e.id}`}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: "0.78rem", textDecoration: "none", fontWeight: 700 }}
                        title="Open Questions for this assessment"
                      >
                        📂 Questions
                      </Link>

                      <Link
                        href="/admin/monitoring"
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: "0.78rem", textDecoration: "none" }}
                        title="Live Monitor"
                      >
                        👁️ Monitor
                      </Link>

                      {rows.length > 1 ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: "#EF4444", fontSize: "0.85rem", padding: "0.25rem 0.5rem" }}
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
    </PortalShell>
  );
}

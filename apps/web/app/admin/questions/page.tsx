"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { PortalShell } from "@/components/PortalShell";
import { api, type QuestionPaper } from "@/lib/api";

type Q = {
  id: string;
  paperId?: string;
  stem: string;
  type: string;
  marks: number;
  negativeMarks?: number;
  bank?: { name: string };
  options?: { id?: string; label: string; text: string; isCorrect: boolean }[];
};

type PaperWithMetrics = QuestionPaper & {
  questionCount?: number;
  totalMarks?: number;
  mcqCount?: number;
};

export default function QuestionsPage() {
  const [papers, setPapers] = useState<PaperWithMetrics[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState<string>("paper-set-1");
  const [rows, setRows] = useState<Q[]>([]);
  const [filterType, setFilterType] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showNewPaperModal, setShowNewPaperModal] = useState(false);
  const [message, setMessage] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");

  // Edit Question Modal State
  const [editingQuestion, setEditingQuestion] = useState<Q | null>(null);
  const [editStem, setEditStem] = useState("");
  const [editType, setEditType] = useState<"SINGLE_MCQ" | "MULTI_SELECT" | "NUMERICAL">("SINGLE_MCQ");
  const [editMarks, setEditMarks] = useState(2);
  const [editNegativeMarks, setEditNegativeMarks] = useState(0.5);
  const [editOptA, setEditOptA] = useState("");
  const [editOptB, setEditOptB] = useState("");
  const [editOptC, setEditOptC] = useState("");
  const [editOptD, setEditOptD] = useState("");
  const [editCorrect, setEditCorrect] = useState("A");

  // New Paper form state
  const [newPaperTitle, setNewPaperTitle] = useState("");
  const [newPaperCode, setNewPaperCode] = useState("");
  const [newPaperDuration, setNewPaperDuration] = useState(30);
  const [newPaperPassPercent, setNewPaperPassPercent] = useState(50);
  const [newPaperDesc, setNewPaperDesc] = useState("");

  // Question form state (Pure Aptitude)
  const [formType, setFormType] = useState<"SINGLE_MCQ" | "MULTI_SELECT" | "NUMERICAL">("SINGLE_MCQ");

  async function loadData() {
    try {
      const [paperData, questionData] = await Promise.all([
        api<PaperWithMetrics[]>("/papers"),
        api<Q[]>("/questions"),
      ]);

      setPapers(paperData);
      setRows(questionData);

      if (paperData.length > 0 && !paperData.some((p) => p.id === selectedPaperId)) {
        setSelectedPaperId(paperData[0].id);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const activePaper = papers.find((p) => p.id === selectedPaperId) || papers[0];

  // Filter rows belonging to the active Question Paper (Pure Aptitude)
  const paperQuestions = rows.filter((q) => (!q.paperId || q.paperId === activePaper?.id) && q.type !== "CODING");

  // Dynamic calculations for the active paper
  const activePaperMarks = paperQuestions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  // Filter and search
  const filtered = paperQuestions.filter((q) => {
    const matchesType = filterType === "ALL" || q.type === filterType;
    const matchesSearch = q.stem.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  function copyCodeToClipboard(code: string) {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopyFeedback(`Candidate Access Code '${code}' copied! Share this code with students before they log in.`);
    setTimeout(() => setCopyFeedback(""), 5000);
  }

  function generateRandomCode() {
    const prefixes = ["SET-APT", "SET-LOGIC", "SET-NUM", "SET-CORE", "KGS-APT"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    setNewPaperCode(`${prefix}-${num}`);
  }

  async function handleCreatePaper(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newPaperTitle.trim()) {
      alert("Please provide a title for the Question Paper set.");
      return;
    }
    const cleanCode = (newPaperCode || `SET-${papers.length + 1}`).trim().toUpperCase();

    try {
      const created = await api<PaperWithMetrics>("/papers", {
        method: "POST",
        body: JSON.stringify({
          title: newPaperTitle.trim(),
          code: cleanCode,
          durationMinutes: Number(newPaperDuration) || 30,
          passPercent: Number(newPaperPassPercent) || 50,
          description: newPaperDesc.trim() || "Configured aptitude and reasoning assessment paper set.",
        }),
      });

      setMessage(`Question Paper Set '${created.title}' created successfully! You can now assign it to colleges in College Management.`);
      setShowNewPaperModal(false);
      setNewPaperTitle("");
      setNewPaperCode("");
      setNewPaperDesc("");
      setSelectedPaperId(created.id);
      loadData();
      setTimeout(() => setMessage(""), 5000);
    } catch (err: any) {
      alert(err.message || "Failed to create Question Paper.");
    }
  }

  async function handleDeletePaper(paperId: string, paperTitle: string) {
    if (papers.length <= 1) {
      alert("Cannot delete the only remaining Question Paper set. At least one Question Paper set must exist.");
      return;
    }
    if (!confirm(`Are you sure you want to delete Question Paper Set '${paperTitle}' and all of its associated questions?`)) {
      return;
    }

    try {
      await api(`/papers/${paperId}`, { method: "DELETE" });
      setMessage(`Question Paper Set '${paperTitle}' was deleted.`);
      const remaining = papers.filter((p) => p.id !== paperId);
      if (remaining.length > 0) {
        setSelectedPaperId(remaining[0].id);
      }
      loadData();
      setTimeout(() => setMessage(""), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to delete Question Paper.");
    }
  }

  async function handleDeleteQuestion(qId: string) {
    if (!confirm("Are you sure you want to delete this question from this paper set?")) return;
    try {
      await api(`/questions/${qId}`, { method: "DELETE" });
      setMessage("Question removed from active aptitude paper set.");
      loadData();
      setTimeout(() => setMessage(""), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to delete question.");
    }
  }

  function openEditModal(q: Q) {
    setEditingQuestion(q);
    setEditStem(q.stem || "");
    setEditType((q.type as any) || "SINGLE_MCQ");
    setEditMarks(Number(q.marks) || 2);
    setEditNegativeMarks(Number(q.negativeMarks) || 0);

    const opts = q.options || [];
    const optA = opts.find((o) => o.label === "A")?.text || opts[0]?.text || "";
    const optB = opts.find((o) => o.label === "B")?.text || opts[1]?.text || "";
    const optC = opts.find((o) => o.label === "C")?.text || opts[2]?.text || "";
    const optD = opts.find((o) => o.label === "D")?.text || opts[3]?.text || "";
    setEditOptA(optA);
    setEditOptB(optB);
    setEditOptC(optC);
    setEditOptD(optD);

    const correct = opts.find((o) => o.isCorrect)?.label || "A";
    setEditCorrect(correct);
  }

  async function handleUpdateQuestion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingQuestion) return;
    if (!editStem.trim()) {
      alert("Question prompt cannot be empty.");
      return;
    }

    try {
      const payload = {
        stem: editStem.trim(),
        type: editType,
        marks: Number(editMarks) || 2,
        negativeMarks: Number(editNegativeMarks) || 0,
        options: [
          { id: `opt-${editingQuestion.id}-a`, label: "A", text: editOptA.trim() || "Option A", isCorrect: editCorrect === "A" },
          { id: `opt-${editingQuestion.id}-b`, label: "B", text: editOptB.trim() || "Option B", isCorrect: editCorrect === "B" },
          { id: `opt-${editingQuestion.id}-c`, label: "C", text: editOptC.trim() || "Option C", isCorrect: editCorrect === "C" },
          { id: `opt-${editingQuestion.id}-d`, label: "D", text: editOptD.trim() || "Option D", isCorrect: editCorrect === "D" },
        ],
      };

      await api(`/questions/${editingQuestion.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setMessage(`Question #${editingQuestion.id.slice(-4)} updated successfully!`);
      setEditingQuestion(null);
      loadData();
      setTimeout(() => setMessage(""), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to update question.");
    }
  }

  async function createQuestion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const stem = String(form.get("stem"));
    const type = formType;
    const marks = Number(form.get("marks"));
    const negativeMarks = Number(form.get("negativeMarks") ?? 0);

    const qTime = Date.now();
    const payload: any = {
      paperId: activePaper?.id || "paper-set-1",
      bankId: "11111111-1111-1111-1111-111111111111",
      type,
      stem,
      marks,
      negativeMarks,
      bank: { name: activePaper?.title || "Aptitude Assessment" },
      options: [
        { id: `opt-${qTime}-a`, label: "A", text: String(form.get("optA")), isCorrect: form.get("correct") === "A" },
        { id: `opt-${qTime}-b`, label: "B", text: String(form.get("optB")), isCorrect: form.get("correct") === "B" },
        { id: `opt-${qTime}-c`, label: "C", text: String(form.get("optC")), isCorrect: form.get("correct") === "C" },
        { id: `opt-${qTime}-d`, label: "D", text: String(form.get("optD")), isCorrect: form.get("correct") === "D" },
      ],
    };

    await api("/questions", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setMessage(`New Aptitude MCQ question successfully added to '${activePaper?.title}'!`);
    setShowAddForm(false);
    loadData();
    setTimeout(() => setMessage(""), 5000);
  }

  return (
    <PortalShell role="MASTER_ADMIN">
      {/* Top Banner and Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ marginBottom: "0.25rem" }}>Aptitude & Reasoning Question Bank</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Configure <strong>Question Paper Sets</strong> and manage quantitative, logical, and verbal aptitude MCQs. Candidate access codes are created and assigned to colleges in <strong>College Management</strong>.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            className="btn btn-outline"
            style={{ fontWeight: 600, borderColor: "var(--primary)", color: "var(--primary)" }}
            onClick={() => {
              setShowNewPaperModal(true);
            }}
          >
            + Create New Question Paper Set
          </button>
        </div>
      </div>

      {/* General Success Toast */}
      {message ? (
        <div className="alert alert-ok" style={{ marginBottom: "1rem" }}>
          {message}
        </div>
      ) : null}

      {/* SECTION 1: QUESTION PAPER SETS SELECTOR CARDS */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <label style={{ margin: 0, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", fontWeight: 700 }}>
            Question Paper Sets ({papers.length}) &mdash; Select Set to View Questions
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: "1rem" }}>
          {papers.map((p, idx) => {
            const isSelected = p.id === (activePaper?.id || selectedPaperId);
            const pQuestions = rows.filter((q) => q.paperId === p.id && q.type !== "CODING");
            const pMarks = pQuestions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPaperId(p.id)}
                style={{
                  background: isSelected ? "#F8FAFC" : "white",
                  border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "1.25rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 8px 24px rgba(37, 99, 235, 0.12)" : "0 2px 6px rgba(0,0,0,0.03)",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: isSelected ? "var(--primary)" : "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Set {idx + 1}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {isSelected ? (
                      <span className="chip chip-ok" style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem" }}>
                        ✓ Active Set
                      </span>
                    ) : null}
                    {papers.length > 1 ? (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: "0.1rem 0.4rem", color: "var(--muted)", fontSize: "0.85rem" }}
                        title="Delete Question Paper"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePaper(p.id, p.title);
                        }}
                      >
                        🗑️
                      </button>
                    ) : null}
                  </div>
                </div>

                <div style={{ fontWeight: 700, fontSize: "1rem", color: "#0F172A", marginBottom: "0.5rem", lineHeight: 1.3 }}>
                  {p.title}
                </div>

                {/* Aggregate details */}
                <div style={{ display: "flex", gap: "0.6rem", fontSize: "0.78rem", color: "var(--muted)", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                  <span>📝 <strong>{pQuestions.length}</strong> Aptitude MCQs</span>
                  <span>•</span>
                  <span>🎯 <strong>{pMarks}</strong> Marks</span>
                  <span>•</span>
                  <span>⏱️ <strong>{p.durationMinutes ?? 30}</strong> Mins</span>
                </div>

                {/* Direct Links to Dedicated Question Page & Live Monitoring */}
                <div style={{ paddingTop: "0.75rem", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  <Link
                    href={`/admin/questions/${p.id}`}
                    className="btn btn-primary btn-sm"
                    style={{
                      width: "100%",
                      textAlign: "center",
                      textDecoration: "none",
                      fontWeight: 700,
                      fontSize: "0.84rem",
                      padding: "0.5rem 0.75rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.35rem",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    📂 Open & Manage Questions &rarr;
                  </Link>

                  <Link
                    href={`/admin/monitoring?paperId=${p.id}&code=${p.code}`}
                    className="btn btn-outline btn-sm"
                    style={{
                      width: "100%",
                      textAlign: "center",
                      textDecoration: "none",
                      fontWeight: 600,
                      fontSize: "0.82rem",
                      padding: "0.45rem 0.75rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.35rem",
                      background: "#EFF6FF",
                      borderColor: "#BFDBFE",
                      color: "#1D4ED8",
                    }}
                    onClick={(e) => e.stopPropagation()}
                    title="Monitor live candidate video feeds for this assessment"
                  >
                    📹 Live Video Monitoring
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: ACTIVE QUESTION PAPER SPOTLIGHT & CANDIDATE ACCESS CODE DISTRIBUTION */}
      {activePaper ? (
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
            color: "#F8FAFC",
            borderRadius: "14px",
            padding: "1.75rem",
            marginBottom: "2rem",
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.2)",
            border: "1px solid #334155",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
            <div style={{ maxWidth: "600px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
                <span style={{ background: "#3B82F6", color: "white", padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
                  Selected Question Paper
                </span>
                <span style={{ fontSize: "0.85rem", color: "#94A3B8" }}>
                  Duration: {activePaper.durationMinutes ?? 30} Minutes • Passing: {activePaper.passPercent ?? 50}%
                </span>
              </div>
              <h2 style={{ color: "white", margin: "0 0 0.5rem 0", fontSize: "1.45rem", fontWeight: 700 }}>
                {activePaper.title}
              </h2>
              <p style={{ color: "#CBD5E1", fontSize: "0.9rem", margin: 0, lineHeight: 1.4 }}>
                {activePaper.description || "Aptitude assessment paper configured for candidate evaluation."}
              </p>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
                <div style={{ background: "rgba(255,255,255,0.08)", padding: "0.4rem 0.8rem", borderRadius: "6px", fontSize: "0.82rem" }}>
                  Total Questions: <strong style={{ color: "#60A5FA" }}>{paperQuestions.length} MCQs</strong>
                </div>
                <div style={{ background: "rgba(255,255,255,0.08)", padding: "0.4rem 0.8rem", borderRadius: "6px", fontSize: "0.82rem" }}>
                  Total Maximum Marks: <strong style={{ color: "#34D399" }}>{activePaperMarks} Marks</strong>
                </div>
                <div style={{ background: "rgba(255,255,255,0.08)", padding: "0.4rem 0.8rem", borderRadius: "6px", fontSize: "0.82rem" }}>
                  Evaluation Type: <strong style={{ color: "#FBBF24" }}>Objective Aptitude & Reasoning</strong>
                </div>
              </div>
            </div>

            {/* Institutional Allocation & Actions Box */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "12px",
                padding: "1.25rem 1.5rem",
                minWidth: "290px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#94A3B8", fontWeight: 700, marginBottom: "0.6rem" }}>
                INSTITUTIONAL PAPER ACCESS
              </div>

              <Link
                href="/admin/colleges"
                className="btn btn-primary"
                style={{
                  width: "100%",
                  padding: "0.65rem 1rem",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                }}
              >
                🏛️ Assign to Colleges &rarr;
              </Link>

              <Link
                href={`/admin/questions/${activePaper.id}`}
                className="btn btn-outline"
                style={{
                  width: "100%",
                  padding: "0.55rem",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  marginTop: "0.5rem",
                  color: "#38BDF8",
                  borderColor: "#38BDF8",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                }}
              >
                📂 Manage {paperQuestions.length} MCQs &rarr;
              </Link>

              <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "0.65rem", lineHeight: 1.4 }}>
                Candidate access codes are managed under <strong>College Management</strong>. Students log in using their unique College Code.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* CREATE NEW QUESTION PAPER MODAL */}
      {showNewPaperModal ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
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
              borderRadius: "14px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Create New Question Paper Set</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowNewPaperModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePaper}>
              <div className="field">
                <label>Question Paper Set Title *</label>
                <input
                  value={newPaperTitle}
                  onChange={(e) => setNewPaperTitle(e.target.value)}
                  placeholder="e.g. Set 4: Verbal Ability & Comprehension"
                  required
                />
              </div>

              <div className="grid-2">
                <div className="field">
                  <label>Duration (Minutes) *</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={newPaperDuration}
                    onChange={(e) => setNewPaperDuration(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="field">
                  <label>Passing Percentage (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newPaperPassPercent}
                    onChange={(e) => setNewPaperPassPercent(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label>Paper Description / Syllabus Notes</label>
                <textarea
                  rows={3}
                  value={newPaperDesc}
                  onChange={(e) => setNewPaperDesc(e.target.value)}
                  placeholder="Describe aptitude syllabus, topics covered, or screening target..."
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: "0.75rem" }}>
                  Create Paper & Generate Access Code &rarr;
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowNewPaperModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* CREATE NEW APTITUDE QUESTION FORM */}
      {showAddForm ? (
        <form
          className="card"
          onSubmit={createQuestion}
          style={{
            marginBottom: "2rem",
            padding: "2rem",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            border: "1px solid var(--primary)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
              borderBottom: "1px solid var(--border)",
              paddingBottom: "1rem",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>Add Aptitude Question to: {activePaper?.title}</h3>
              <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                This question will belong to Question Paper Set: <strong style={{ color: "var(--primary)" }}>{activePaper?.code}</strong>
              </div>
            </div>
            <span className="chip chip-info">Aptitude MCQ</span>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Aptitude Question Type *</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                style={{ fontWeight: 600, color: "var(--primary)" }}
              >
                <option value="SINGLE_MCQ">🔘 Single-Choice Objective MCQ</option>
                <option value="MULTI_SELECT">☑️ Multi-Select MCQ</option>
                <option value="NUMERICAL">🔢 Numerical Reasoning</option>
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="field">
                <label>Allocated Marks</label>
                <input name="marks" type="number" defaultValue={2} min={1} required />
              </div>
              <div className="field">
                <label>Negative Marks</label>
                <input name="negativeMarks" type="number" step="0.25" defaultValue={0.5} min={0} required />
              </div>
            </div>
          </div>

          <div className="field">
            <label>Question Stem / Problem Prompt *</label>
            <textarea
              name="stem"
              rows={3}
              required
              placeholder="e.g. A train travels 120 km in 2 hours. What is its average velocity in km/h?"
              defaultValue=""
            />
          </div>

          {/* MCQ OPTIONS SECTION */}
          <div style={{ background: "#F8FAFC", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
            <label style={{ marginBottom: "0.75rem", fontWeight: 700 }}>Aptitude Answer Options & Correct Key</label>
            <div className="grid-2" style={{ gap: "1rem" }}>
              <div className="field"><label>Option A *</label><input name="optA" required placeholder="Option A text..." defaultValue="Option 1" /></div>
              <div className="field"><label>Option B *</label><input name="optB" required placeholder="Option B text..." defaultValue="Option 2" /></div>
              <div className="field"><label>Option C *</label><input name="optC" required placeholder="Option C text..." defaultValue="Option 3" /></div>
              <div className="field"><label>Option D *</label><input name="optD" required placeholder="Option D text..." defaultValue="Option 4" /></div>
            </div>
            <div className="field" style={{ maxWidth: "260px", marginTop: "0.5rem" }}>
              <label>Designate Correct Answer Key *</label>
              <select name="correct" defaultValue="A" style={{ fontWeight: 600, color: "var(--primary)" }}>
                <option value="A">Option A is Correct</option>
                <option value="B">Option B is Correct</option>
                <option value="C">Option C is Correct</option>
                <option value="D">Option D is Correct</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button type="submit" className="btn btn-primary" style={{ padding: "0.85rem 1.5rem" }}>
              Save & Add Question to {activePaper?.code} &rarr;
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {/* FILTER AND SEARCH BAR FOR CURRENT PAPER */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "1rem", flex: 1, minWidth: "300px" }}>
          <input
            style={{ flex: 1 }}
            placeholder={`Search questions in ${activePaper?.code || "active paper"} by keyword…`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            style={{ width: "200px" }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">All Question Types</option>
            <option value="SINGLE_MCQ">🔘 Single-Choice MCQ</option>
            <option value="MULTI_SELECT">☑️ Multi-Select MCQ</option>
            <option value="NUMERICAL">🔢 Numerical</option>
          </select>
        </div>

        <div style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 }}>
          Showing {filtered.length} of {paperQuestions.length} questions in <strong>{activePaper?.code}</strong>
        </div>
      </div>

      {/* QUESTIONS TABLE */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: "40px" }}>#</th>
              <th>Stem / Aptitude Question Prompt</th>
              <th>Question Type</th>
              <th>Evaluation Engine</th>
              <th>Marks</th>
              <th>Negative</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((q, idx) => (
              <tr key={q.id}>
                <td style={{ color: "var(--muted)", fontWeight: 600 }}>{idx + 1}</td>
                <td style={{ maxWidth: "480px", fontWeight: 600 }}>{q.stem}</td>
                <td>
                  <span className="chip chip-info">
                    {q.type}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: "0.82rem", color: "var(--muted)", fontWeight: 600 }}>
                    Standard Answer Key
                  </span>
                </td>
                <td><strong>{String(q.marks)}</strong></td>
                <td>{String(q.negativeMarks ?? 0)}</td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center" }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: "0.82rem", fontWeight: 600, padding: "0.25rem 0.6rem" }}
                      onClick={() => openEditModal(q)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ color: "var(--error)", fontSize: "0.82rem", padding: "0.25rem 0.5rem" }}
                      onClick={() => handleDeleteQuestion(q.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--muted)" }}>
                  No questions in this Question Paper Set matching filter criteria. Click <strong>+ Add Question to {activePaper?.code}</strong> above to add aptitude MCQs.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* EDIT QUESTION MODAL */}
      {editingQuestion ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 650,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              background: "white",
              borderRadius: "14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.35rem" }}>
                Edit Question &mdash; #{editingQuestion.id.slice(-6)}
              </h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setEditingQuestion(null)}
                style={{ fontSize: "1.1rem", padding: "0.2rem 0.5rem" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateQuestion}>
              <div className="field" style={{ marginBottom: "1rem" }}>
                <label>Question Type *</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as any)}
                  style={{ width: "100%", padding: "0.6rem" }}
                >
                  <option value="SINGLE_MCQ">Single Choice MCQ</option>
                  <option value="MULTI_SELECT">Multi-Select MCQ</option>
                  <option value="NUMERICAL">Numerical Aptitude Question</option>
                </select>
              </div>

              <div className="field" style={{ marginBottom: "1rem" }}>
                <label>Question Prompt / Stem *</label>
                <textarea
                  required
                  rows={3}
                  value={editStem}
                  onChange={(e) => setEditStem(e.target.value)}
                  style={{ width: "100%", padding: "0.65rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div className="field">
                  <label>Marks Awarded *</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    step={1}
                    required
                    value={editMarks}
                    onChange={(e) => setEditMarks(Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label>Negative Marks</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.25}
                    value={editNegativeMarks}
                    onChange={(e) => setEditNegativeMarks(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700 }}>
                  Multiple Choice Options & Answer Key
                </label>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="radio"
                      name="edit-correct"
                      checked={editCorrect === "A"}
                      onChange={() => setEditCorrect("A")}
                      id="edit-opt-a-radio"
                    />
                    <label htmlFor="edit-opt-a-radio" style={{ margin: 0, fontWeight: 700, width: "70px", fontSize: "0.85rem" }}>
                      Option A:
                    </label>
                    <input
                      type="text"
                      required
                      value={editOptA}
                      onChange={(e) => setEditOptA(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="radio"
                      name="edit-correct"
                      checked={editCorrect === "B"}
                      onChange={() => setEditCorrect("B")}
                      id="edit-opt-b-radio"
                    />
                    <label htmlFor="edit-opt-b-radio" style={{ margin: 0, fontWeight: 700, width: "70px", fontSize: "0.85rem" }}>
                      Option B:
                    </label>
                    <input
                      type="text"
                      required
                      value={editOptB}
                      onChange={(e) => setEditOptB(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="radio"
                      name="edit-correct"
                      checked={editCorrect === "C"}
                      onChange={() => setEditCorrect("C")}
                      id="edit-opt-c-radio"
                    />
                    <label htmlFor="edit-opt-c-radio" style={{ margin: 0, fontWeight: 700, width: "70px", fontSize: "0.85rem" }}>
                      Option C:
                    </label>
                    <input
                      type="text"
                      required
                      value={editOptC}
                      onChange={(e) => setEditOptC(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="radio"
                      name="edit-correct"
                      checked={editCorrect === "D"}
                      onChange={() => setEditCorrect("D")}
                      id="edit-opt-d-radio"
                    />
                    <label htmlFor="edit-opt-d-radio" style={{ margin: 0, fontWeight: 700, width: "70px", fontSize: "0.85rem" }}>
                      Option D:
                    </label>
                    <input
                      type="text"
                      required
                      value={editOptD}
                      onChange={(e) => setEditOptD(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.5rem" }}>
                  💡 Select the correct answer option radio button for automatic assessment grading.
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditingQuestion(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: "0.6rem 1.5rem" }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </PortalShell>
  );
}

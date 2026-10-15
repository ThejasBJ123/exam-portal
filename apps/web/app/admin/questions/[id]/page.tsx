"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { api, type QuestionPaper } from "@/lib/api";

type Option = {
  id?: string;
  label: string;
  text: string;
  isCorrect: boolean;
};

type Question = {
  id: string;
  paperId?: string;
  stem: string;
  type: string;
  marks: number;
  negativeMarks?: number;
  bank?: { name: string };
  options?: Option[];
};

type PaperWithMetrics = QuestionPaper & {
  questionCount?: number;
  totalMarks?: number;
  mcqCount?: number;
};

export default function PaperQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const paperId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "paper-set-1";

  const [paper, setPaper] = useState<PaperWithMetrics | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  // Feedback notifications
  const [message, setMessage] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showEditPaperModal, setShowEditPaperModal] = useState(false);

  // Add Question Form State
  const [addType, setAddType] = useState<"SINGLE_MCQ" | "MULTI_SELECT" | "NUMERICAL">("SINGLE_MCQ");
  const [addStem, setAddStem] = useState("");
  const [addMarks, setAddMarks] = useState(2);
  const [addNegativeMarks, setAddNegativeMarks] = useState(0.5);
  const [addOptA, setAddOptA] = useState("");
  const [addOptB, setAddOptB] = useState("");
  const [addOptC, setAddOptC] = useState("");
  const [addOptD, setAddOptD] = useState("");
  const [addCorrect, setAddCorrect] = useState("A");

  // Edit Question Form State
  const [editStem, setEditStem] = useState("");
  const [editType, setEditType] = useState<"SINGLE_MCQ" | "MULTI_SELECT" | "NUMERICAL">("SINGLE_MCQ");
  const [editMarks, setEditMarks] = useState(2);
  const [editNegativeMarks, setEditNegativeMarks] = useState(0.5);
  const [editOptA, setEditOptA] = useState("");
  const [editOptB, setEditOptB] = useState("");
  const [editOptC, setEditOptC] = useState("");
  const [editOptD, setEditOptD] = useState("");
  const [editCorrect, setEditCorrect] = useState("A");

  // Edit Paper Set Form State
  const [paperTitle, setPaperTitle] = useState("");
  const [paperCode, setPaperCode] = useState("");
  const [paperDuration, setPaperDuration] = useState(30);
  const [paperPassPercent, setPaperPassPercent] = useState(50);
  const [paperDesc, setPaperDesc] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      const [papersList, allQuestions] = await Promise.all([
        api<PaperWithMetrics[]>("/papers"),
        api<Question[]>("/questions"),
      ]);

      const matchedPaper = papersList.find((p) => p.id === paperId) || papersList[0];
      if (matchedPaper) {
        setPaper(matchedPaper);
        setPaperTitle(matchedPaper.title);
        setPaperCode(matchedPaper.code);
        setPaperDuration(matchedPaper.durationMinutes || 30);
        setPaperPassPercent(matchedPaper.passPercent || 50);
        setPaperDesc(matchedPaper.description || "");

        const pQuestions = allQuestions.filter(
          (q) => (!q.paperId || q.paperId === matchedPaper.id) && q.type !== "CODING"
        );
        setQuestions(pQuestions);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [paperId]);

  function copyCode(code: string) {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopyFeedback(`Candidate Access Code '${code}' copied!`);
    setTimeout(() => setCopyFeedback(""), 4000);
  }

  function openEditModal(q: Question) {
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

  async function handleAddQuestion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!addStem.trim()) {
      alert("Please enter question stem / prompt.");
      return;
    }

    try {
      const qTime = Date.now();
      const payload = {
        paperId: paper?.id || paperId,
        bankId: "bank-apt-1",
        bank: { name: paper?.title || "Aptitude Assessment" },
        type: addType,
        stem: addStem.trim(),
        marks: Number(addMarks) || 2,
        negativeMarks: Number(addNegativeMarks) || 0,
        options: [
          { id: `opt-${qTime}-a`, label: "A", text: addOptA.trim() || "Option A", isCorrect: addCorrect === "A" },
          { id: `opt-${qTime}-b`, label: "B", text: addOptB.trim() || "Option B", isCorrect: addCorrect === "B" },
          { id: `opt-${qTime}-c`, label: "C", text: addOptC.trim() || "Option C", isCorrect: addCorrect === "C" },
          { id: `opt-${qTime}-d`, label: "D", text: addOptD.trim() || "Option D", isCorrect: addCorrect === "D" },
        ],
      };

      await api("/questions", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setMessage("New question successfully added to this Question Paper Set!");
      setShowAddModal(false);
      // Reset form
      setAddStem("");
      setAddOptA("");
      setAddOptB("");
      setAddOptC("");
      setAddOptD("");
      setAddCorrect("A");
      loadData();
      setTimeout(() => setMessage(""), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to add question.");
    }
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

  async function handleDeleteQuestion(qId: string) {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await api(`/questions/${qId}`, { method: "DELETE" });
      setMessage("Question removed from paper set.");
      loadData();
      setTimeout(() => setMessage(""), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to delete question.");
    }
  }

  async function handleSavePaperDetails(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!paper) return;

    try {
      const cleanCode = paperCode.trim().toUpperCase();
      await api(`/papers/${paper.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: paperTitle.trim(),
          code: cleanCode,
          durationMinutes: Number(paperDuration) || 30,
          passPercent: Number(paperPassPercent) || 50,
          description: paperDesc.trim(),
        }),
      });

      setMessage("Question Paper details updated successfully!");
      setShowEditPaperModal(false);
      loadData();
      setTimeout(() => setMessage(""), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to update paper details.");
    }
  }

  // Filtered questions
  const filteredQuestions = questions.filter((q) => {
    const matchesType = filterType === "ALL" || q.type === filterType;
    const matchesSearch =
      q.stem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.options || []).some((o) => o.text.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const totalPaperMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  return (
    <PortalShell role="MASTER_ADMIN">
      {/* Top Breadcrumb & Actions */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
          <Link href="/admin/questions" style={{ color: "var(--primary)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
            &larr; Back to All Question Paper Sets
          </Link>
          <span style={{ color: "var(--muted)" }}>/</span>
          <span style={{ color: "var(--muted)", fontWeight: 500 }}>{paper?.title || "Question Set"}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: "1.85rem" }}>{paper?.title || "Question Paper Set"}</h1>
              {paper?.code ? (
                <span
                  style={{
                    background: "#EFF6FF",
                    color: "#1E40AF",
                    border: "1px solid #BFDBFE",
                    padding: "0.25rem 0.65rem",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.05em",
                  }}
                >
                  CODE: {paper.code}
                </span>
              ) : null}
            </div>
            <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.92rem" }}>
              {paper?.description || "Dedicated question bank and test paper setup for aptitude screening."}
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              className="btn btn-outline"
              onClick={() => setShowEditPaperModal(true)}
              style={{ fontWeight: 600 }}
            >
              ⚙️ Set Configuration
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
              style={{ fontWeight: 700, padding: "0.6rem 1.25rem" }}
            >
              + Add Question to this Set
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {copyFeedback ? (
        <div className="alert alert-ok" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <span>📋 {copyFeedback}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setCopyFeedback("")}>✕</button>
        </div>
      ) : null}

      {message ? (
        <div className="alert alert-ok" style={{ marginBottom: "1rem" }}>
          {message}
        </div>
      ) : null}

      {/* Overview Metric Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          color: "white",
          borderRadius: "14px",
          padding: "1.5rem",
          marginBottom: "2rem",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div>
          <span style={{ fontSize: "0.78rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
            Paper Identifier
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.25rem" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "#60A5FA",
                letterSpacing: "0.08em",
              }}
            >
              {paper?.code || "SET-1"}
            </div>
          </div>
          <span style={{ fontSize: "0.74rem", color: "#94A3B8", marginTop: "0.2rem", display: "block" }}>
            Assigned in College Management
          </span>
        </div>

        <div>
          <span style={{ fontSize: "0.78rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
            Total Questions
          </span>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#38BDF8", marginTop: "0.25rem" }}>
            {questions.length} Aptitude MCQs
          </div>
        </div>

        <div>
          <span style={{ fontSize: "0.78rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
            Total Maximum Marks
          </span>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#4ADE80", marginTop: "0.25rem" }}>
            {totalPaperMarks} Marks
          </div>
        </div>

        <div>
          <span style={{ fontSize: "0.78rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
            Duration & Passing
          </span>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#FBBF24", marginTop: "0.25rem" }}>
            {paper?.durationMinutes ?? 30} Mins &bull; {paper?.passPercent ?? 50}%
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 280, maxWidth: 500 }}>
          <input
            type="search"
            placeholder="Search questions or answer options in this set..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "0.65rem 1rem" }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <label style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 }}>Filter:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: "0.6rem 0.9rem", borderRadius: "8px" }}
          >
            <option value="ALL">All Types ({questions.length})</option>
            <option value="SINGLE_MCQ">Single Choice MCQ</option>
            <option value="MULTI_SELECT">Multi-Select MCQ</option>
            <option value="NUMERICAL">Numerical Aptitude</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
          <p>Loading questions for {paper?.title}...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="card" style={{ padding: "3.5rem 2rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📝</div>
          <h3 style={{ marginBottom: "0.5rem" }}>No Questions Found</h3>
          <p style={{ color: "var(--muted)", maxWidth: 450, margin: "0 auto 1.5rem" }}>
            {searchTerm
              ? `No questions matching "${searchTerm}". Try a different keyword.`
              : "This question paper set does not have any questions yet. Add your first aptitude question to get started."}
          </p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Add First Question
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredQuestions.map((q, idx) => {
            const correctOpt = (q.options || []).find((o) => o.isCorrect);

            return (
              <div
                key={q.id}
                className="card card-hover"
                style={{
                  padding: "1.5rem",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  background: "white",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {/* Question Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", flex: 1 }}>
                    <span
                      style={{
                        background: "#F1F5F9",
                        color: "#334155",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: "1.08rem", fontWeight: 600, color: "#0F172A", lineHeight: 1.5 }}>
                        {q.stem}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.35rem", flexWrap: "wrap" }}>
                        <span className="chip chip-info" style={{ fontSize: "0.72rem" }}>
                          {q.type.replace("_", " ")}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                          +{q.marks} Mark{q.marks > 1 ? "s" : ""}
                        </span>
                        {q.negativeMarks && q.negativeMarks > 0 ? (
                          <span style={{ fontSize: "0.8rem", color: "#DC2626" }}>
                            (-{q.negativeMarks} Negative)
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => openEditModal(q)}
                      style={{ fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDeleteQuestion(q.id)}
                      style={{ color: "#DC2626", fontWeight: 600 }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                {/* Options Grid */}
                {q.options && q.options.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: "0.6rem",
                      background: "#F8FAFC",
                      padding: "0.85rem 1rem",
                      borderRadius: "8px",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    {q.options.map((opt) => (
                      <div
                        key={opt.label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.45rem 0.65rem",
                          borderRadius: "6px",
                          background: opt.isCorrect ? "#ECFDF5" : "white",
                          border: opt.isCorrect ? "1.5px solid #10B981" : "1px solid #E2E8F0",
                          fontSize: "0.88rem",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            color: opt.isCorrect ? "#047857" : "var(--muted)",
                            width: "20px",
                          }}
                        >
                          {opt.label}.
                        </span>
                        <span style={{ color: opt.isCorrect ? "#065F46" : "#334155", flex: 1, fontWeight: opt.isCorrect ? 600 : 400 }}>
                          {opt.text}
                        </span>
                        {opt.isCorrect ? (
                          <span
                            style={{
                              background: "#10B981",
                              color: "white",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              padding: "0.1rem 0.4rem",
                              borderRadius: "4px",
                            }}
                          >
                            ✓ Correct
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD QUESTION TO THIS PAPER */}
      {showAddModal ? (
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
                Add New Question to &lsquo;{paper?.code}&rsquo;
              </h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowAddModal(false)}
                style={{ fontSize: "1.1rem", padding: "0.2rem 0.5rem" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddQuestion}>
              <div className="field" style={{ marginBottom: "1rem" }}>
                <label>Question Type *</label>
                <select
                  value={addType}
                  onChange={(e) => setAddType(e.target.value as any)}
                  style={{ width: "100%", padding: "0.6rem" }}
                >
                  <option value="SINGLE_MCQ">Single Choice MCQ (One Correct Option)</option>
                  <option value="MULTI_SELECT">Multi-Select MCQ</option>
                  <option value="NUMERICAL">Numerical Aptitude Question</option>
                </select>
              </div>

              <div className="field" style={{ marginBottom: "1rem" }}>
                <label>Question Prompt / Problem Stem *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. A train travels 360 km at a uniform speed of 60 km/h. How many hours will it take?"
                  value={addStem}
                  onChange={(e) => setAddStem(e.target.value)}
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
                    value={addMarks}
                    onChange={(e) => setAddMarks(Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label>Negative Marks (Penalty)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.25}
                    value={addNegativeMarks}
                    onChange={(e) => setAddNegativeMarks(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700 }}>
                  Multiple Choice Options & Answer Key
                </label>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {[
                    { key: "A", val: addOptA, set: setAddOptA, placeholder: "e.g. 5 hours" },
                    { key: "B", val: addOptB, set: setAddOptB, placeholder: "e.g. 6 hours (Correct)" },
                    { key: "C", val: addOptC, set: setAddOptC, placeholder: "e.g. 7 hours" },
                    { key: "D", val: addOptD, set: setAddOptD, placeholder: "e.g. 8 hours" },
                  ].map((opt) => {
                    const isCorrect = addCorrect === opt.key;
                    return (
                      <div
                        key={opt.key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "0.45rem 0.75rem",
                          borderRadius: "10px",
                          background: isCorrect ? "#F0FDF4" : "#F8FAFC",
                          border: isCorrect ? "1.5px solid #22C55E" : "1px solid #E2E8F0",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <input
                          type="radio"
                          name="add-correct"
                          checked={isCorrect}
                          onChange={() => setAddCorrect(opt.key)}
                          id={`add-opt-${opt.key.toLowerCase()}-radio`}
                          style={{
                            width: "20px",
                            height: "20px",
                            margin: 0,
                            flexShrink: 0,
                            cursor: "pointer",
                            accentColor: "#16A34A",
                          }}
                        />
                        <label
                          htmlFor={`add-opt-${opt.key.toLowerCase()}-radio`}
                          style={{
                            margin: 0,
                            fontWeight: 800,
                            fontSize: "0.88rem",
                            color: isCorrect ? "#166534" : "var(--primary)",
                            minWidth: "75px",
                            flexShrink: 0,
                            cursor: "pointer",
                          }}
                        >
                          Option {opt.key}:
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={opt.placeholder}
                          value={opt.val}
                          onChange={(e) => opt.set(e.target.value)}
                          style={{
                            flex: 1,
                            width: "100%",
                            padding: "0.55rem 0.85rem",
                            borderRadius: "8px",
                            border: isCorrect ? "1.5px solid #16A34A" : "1px solid #CBD5E1",
                            background: "white",
                            fontSize: "0.92rem",
                          }}
                        />
                        {isCorrect ? (
                          <span
                            style={{
                              background: "#DCFCE7",
                              color: "#166534",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              padding: "0.2rem 0.5rem",
                              borderRadius: "4px",
                              flexShrink: 0,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.2rem",
                            }}
                          >
                            ✓ Correct Key
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.5rem" }}>
                  💡 Select the radio button corresponding to the correct answer for automated grading.
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: "0.6rem 1.5rem" }}>
                  Save & Add Question
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* MODAL 2: EDIT EXISTING QUESTION */}
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
                  {[
                    { key: "A", val: editOptA, set: setEditOptA },
                    { key: "B", val: editOptB, set: setEditOptB },
                    { key: "C", val: editOptC, set: setEditOptC },
                    { key: "D", val: editOptD, set: setEditOptD },
                  ].map((opt) => {
                    const isCorrect = editCorrect === opt.key;
                    return (
                      <div
                        key={opt.key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "0.45rem 0.75rem",
                          borderRadius: "10px",
                          background: isCorrect ? "#F0FDF4" : "#F8FAFC",
                          border: isCorrect ? "1.5px solid #22C55E" : "1px solid #E2E8F0",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <input
                          type="radio"
                          name="edit-correct"
                          checked={isCorrect}
                          onChange={() => setEditCorrect(opt.key)}
                          id={`edit-opt-${opt.key.toLowerCase()}-radio`}
                          style={{
                            width: "20px",
                            height: "20px",
                            margin: 0,
                            flexShrink: 0,
                            cursor: "pointer",
                            accentColor: "#16A34A",
                          }}
                        />
                        <label
                          htmlFor={`edit-opt-${opt.key.toLowerCase()}-radio`}
                          style={{
                            margin: 0,
                            fontWeight: 800,
                            fontSize: "0.88rem",
                            color: isCorrect ? "#166534" : "var(--primary)",
                            minWidth: "75px",
                            flexShrink: 0,
                            cursor: "pointer",
                          }}
                        >
                          Option {opt.key}:
                        </label>
                        <input
                          type="text"
                          required
                          value={opt.val}
                          onChange={(e) => opt.set(e.target.value)}
                          style={{
                            flex: 1,
                            width: "100%",
                            padding: "0.55rem 0.85rem",
                            borderRadius: "8px",
                            border: isCorrect ? "1.5px solid #16A34A" : "1px solid #CBD5E1",
                            background: "white",
                            fontSize: "0.92rem",
                          }}
                        />
                        {isCorrect ? (
                          <span
                            style={{
                              background: "#DCFCE7",
                              color: "#166534",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              padding: "0.2rem 0.5rem",
                              borderRadius: "4px",
                              flexShrink: 0,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.2rem",
                            }}
                          >
                            ✓ Correct Key
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
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

      {/* MODAL 3: EDIT PAPER SET DETAILS */}
      {showEditPaperModal && paper ? (
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
              maxWidth: 550,
              width: "100%",
              padding: "2rem",
              background: "white",
              borderRadius: "14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.35rem" }}>Set Configuration Details</h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowEditPaperModal(false)}
                style={{ fontSize: "1.1rem", padding: "0.2rem 0.5rem" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePaperDetails}>
              <div className="field" style={{ marginBottom: "1rem" }}>
                <label>Question Paper Title *</label>
                <input
                  type="text"
                  required
                  value={paperTitle}
                  onChange={(e) => setPaperTitle(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div className="field">
                  <label>Duration (Minutes) *</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    required
                    value={paperDuration}
                    onChange={(e) => setPaperDuration(Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label>Pass Percentage (%) *</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    required
                    value={paperPassPercent}
                    onChange={(e) => setPaperPassPercent(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="field" style={{ marginBottom: "1.25rem" }}>
                <label>Description</label>
                <textarea
                  rows={2}
                  value={paperDesc}
                  onChange={(e) => setPaperDesc(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditPaperModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Paper Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </PortalShell>
  );
}

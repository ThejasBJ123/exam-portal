"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { PortalShell } from "@/components/PortalShell";
import { api } from "@/lib/api";

type Exam = { id: string; title: string; accessCode?: string; durationMinutes?: number };
type Student = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  rollNumber?: string;
  paperCode?: string;
  paperTitle?: string;
};

export default function AssignmentsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");

  async function loadData() {
    try {
      const [examsData, studentsData] = await Promise.all([
        api<Exam[]>("/exams"),
        api<Student[]>("/users?role=STUDENT"),
      ]);
      setExams(examsData);
      if (examsData[0] && !selectedExamId) {
        setSelectedExamId(examsData[0].id);
      }
      setStudents(studentsData);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  async function handleBatchAssign() {
    if (!selectedExamId || selectedStudentIds.length === 0) return;
    setLoading(true);
    try {
      const targetExam = exams.find((e) => e.id === selectedExamId);
      await api("/assignments", {
        method: "POST",
        body: JSON.stringify({
          examId: selectedExamId,
          studentIds: selectedStudentIds,
        }),
      });

      setMessage(
        `✅ Successfully assigned ${selectedStudentIds.length} candidate(s) to '${targetExam?.title || "Assessment"}' (Code: ${
          targetExam?.accessCode || "KGS-2026"
        }).`
      );
      setSelectedStudentIds([]);
      await loadData();
      setTimeout(() => setMessage(""), 5000);
    } catch {
      setMessage("Error allocating candidates.");
    } finally {
      setLoading(false);
    }
  }

  function copyCode(code?: string) {
    if (!code) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopyFeedback(`Candidate Access Code '${code}' copied!`);
    setTimeout(() => setCopyFeedback(""), 3000);
  }

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = search.toLowerCase();
      return (
        !q ||
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
        (s.paperCode && s.paperCode.toLowerCase().includes(q))
      );
    });
  }, [students, search]);

  const targetExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  return (
    <PortalShell role="MASTER_ADMIN">
      {/* Header with Navigation Shortcuts */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ marginBottom: "0.25rem" }}>Candidate Batch Allocation & Roster</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Assign registered students to specific Question Paper Sets, or distribute direct Candidate Access Codes for self-enrollment.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link href="/admin/students" className="btn btn-outline btn-sm" style={{ fontWeight: 600 }}>
            👥 Student Directory
          </Link>
          <Link href="/admin/exams" className="btn btn-outline btn-sm" style={{ fontWeight: 600 }}>
            📋 Exam Builder
          </Link>
          <Link href="/admin/questions" className="btn btn-outline btn-sm" style={{ fontWeight: 600 }}>
            📂 Question Bank
          </Link>
        </div>
      </div>

      {/* Copy Toast */}
      {copyFeedback ? (
        <div className="alert alert-ok" style={{ marginBottom: "1.25rem" }}>
          📋 {copyFeedback}
        </div>
      ) : null}

      {/* Success Notification */}
      {message ? (
        <div className="alert alert-ok" style={{ marginBottom: "1.25rem" }}>
          {message}
        </div>
      ) : null}

      {/* Candidate Access Code Direct Distribution Strip */}
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
          <strong style={{ color: "#1E40AF" }}>🔑 Direct Access Code Model:</strong>
          <span style={{ color: "#3B82F6", marginLeft: "0.5rem" }}>
            Candidates can also self-register and log in directly using the official Candidate Access Code without prior manual assignment.
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: 600 }}>Active Codes:</span>
          {exams.map((e) => (
            <button
              key={e.id}
              type="button"
              className="btn btn-sm"
              onClick={() => copyCode(e.accessCode)}
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
              title={`Click to copy ${e.accessCode} for ${e.title}`}
            >
              <span>{e.accessCode || "KGS-2026"}</span>
              <span style={{ fontSize: "0.75rem", color: "#60A5FA" }}>📋</span>
            </button>
          ))}
        </div>
      </div>

      {/* Allocation Action Bar */}
      <div
        className="card"
        style={{
          padding: "1.25rem 1.5rem",
          marginBottom: "1.5rem",
          background: "white",
          border: "1.5px solid #BFDBFE",
          borderRadius: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", flex: 1 }}>
          <div style={{ minWidth: "280px" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "0.3rem" }}>
              Target Assessment Paper:
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              style={{
                width: "100%",
                padding: "0.55rem 0.85rem",
                borderRadius: "8px",
                borderColor: "#93C5FD",
                fontWeight: 700,
                color: "var(--primary)",
                background: "#F8FAFC",
              }}
            >
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} &mdash; [Code: {e.accessCode || "KGS-2026"}]
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: "220px", flex: 1 }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: "0.3rem" }}>
              Search Roster:
            </label>
            <input
              type="text"
              placeholder="🔍 Search name, roll no, mobile, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "0.5rem 0.85rem", fontSize: "0.88rem" }}
            />
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          disabled={loading || selectedStudentIds.length === 0}
          onClick={handleBatchAssign}
          style={{
            fontWeight: 700,
            padding: "0.65rem 1.5rem",
            boxShadow: selectedStudentIds.length > 0 ? "0 4px 14px rgba(37, 99, 235, 0.3)" : "none",
          }}
        >
          {loading
            ? "Allocating Candidates..."
            : `Confirm & Allocate (${selectedStudentIds.length} Selected)`}
        </button>
      </div>

      {/* Interactive Candidate Allocation Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "2.5rem" }}>
        <div className="table-container" style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ minWidth: "960px", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ width: "40px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={
                      filteredStudents.length > 0 &&
                      selectedStudentIds.length === filteredStudents.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    title="Select / Deselect All Candidates"
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th>Candidate Name</th>
                <th>Roll Number</th>
                <th>Mobile Number</th>
                <th>Currently Assigned Assessment</th>
                <th>Assigned Code</th>
                <th style={{ textAlign: "right" }}>Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => {
                const isSelected = selectedStudentIds.includes(s.id);
                const assignedCode = s.paperCode || "KGS-2026";
                const isTargetMatch =
                  s.paperCode === targetExam?.accessCode ||
                  (!s.paperCode && targetExam?.accessCode === "KGS-2026");

                return (
                  <tr
                    key={s.id}
                    style={{
                      background: isSelected ? "#EFF6FF" : "transparent",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleStudent(s.id)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>
                      <strong style={{ color: "var(--primary)", display: "block" }}>
                        {s.fullName}
                      </strong>
                      <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{s.email}</span>
                    </td>
                    <td>
                      <code
                        style={{
                          background: "#F1F5F9",
                          padding: "0.2rem 0.45rem",
                          borderRadius: "4px",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                        }}
                      >
                        {s.rollNumber || "KGS-2026-001"}
                      </code>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{s.phone || "—"}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#334155" }}>
                        {s.paperTitle || "Graduate Aptitude Screen 2026"}
                      </span>
                    </td>
                    <td>
                      <span
                        className="chip"
                        style={{
                          background: isTargetMatch ? "#ECFDF5" : "#EFF6FF",
                          color: isTargetMatch ? "#15803D" : "#1D4ED8",
                          border: isTargetMatch ? "1px solid #86EFAC" : "1px solid #BFDBFE",
                          fontWeight: 800,
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {assignedCode}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: "0.78rem", fontWeight: 600 }}
                        onClick={async () => {
                          await api("/assignments", {
                            method: "POST",
                            body: JSON.stringify({
                              examId: selectedExamId,
                              studentIds: [s.id],
                            }),
                          });
                          setMessage(
                            `Allocated ${s.fullName} to ${targetExam?.title || "Assessment"}.`
                          );
                          await loadData();
                          setTimeout(() => setMessage(""), 3000);
                        }}
                      >
                        ⚡ Assign to {targetExam?.accessCode || "KGS-2026"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "var(--muted)" }}>
                    No candidates found matching your search.
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

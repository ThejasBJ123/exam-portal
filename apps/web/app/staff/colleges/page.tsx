"use client";

import { FormEvent, useEffect, useState, useMemo } from "react";
import { PortalShell } from "@/components/PortalShell";
import { api, ApiError, type College, type QuestionPaper } from "@/lib/api";
import { downloadExcel } from "@/lib/excelExport";

interface CollegeWithMeta extends College {
  assignedPapers?: QuestionPaper[];
  studentCount?: number;
}

export default function CollegesPage() {
  const [colleges, setColleges] = useState<CollegeWithMeta[]>([]);
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copyToast, setCopyToast] = useState("");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTimingModal, setShowTimingModal] = useState(false);
  const [showApprovalsModal, setShowApprovalsModal] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<CollegeWithMeta | null>(null);

  // Timing & Approval configuration state
  const [timingMinDuration, setTimingMinDuration] = useState(30);
  const [timingMaxDuration, setTimingMaxDuration] = useState(60);
  const [timingRequireLoginApproval, setTimingRequireLoginApproval] = useState(true);
  const [timingExamConfigs, setTimingExamConfigs] = useState<Record<string, { minDurationMinutes: number; maxDurationMinutes: number; requireLoginApproval?: boolean }>>({});

  // Student Login Approvals state
  const [approvalsCollege, setApprovalsCollege] = useState<CollegeWithMeta | null>(null);
  const [collegeStudents, setCollegeStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState("");

  // Create form state
  const [createName, setCreateName] = useState("");
  const [createCode, setCreateCode] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createAssignedPaperIds, setCreateAssignedPaperIds] = useState<string[]>([]);
  const [createMinDuration, setCreateMinDuration] = useState(30);
  const [createMaxDuration, setCreateMaxDuration] = useState(60);
  const [createRequireLoginApproval, setCreateRequireLoginApproval] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Assign modal state
  const [editAssignedPaperIds, setEditAssignedPaperIds] = useState<string[]>([]);

  // Edit college info state
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMinDuration, setEditMinDuration] = useState(30);
  const [editMaxDuration, setEditMaxDuration] = useState(60);
  const [editRequireLoginApproval, setEditRequireLoginApproval] = useState(true);

  async function loadData() {
    try {
      setLoading(true);
      const [collegesData, papersData] = await Promise.all([
        api<CollegeWithMeta[]>("/colleges"),
        api<QuestionPaper[]>("/papers"),
      ]);
      setColleges(collegesData);
      setPapers(papersData);
    } catch (err: any) {
      setErrorMessage(err instanceof ApiError ? err.message : err.message || "Failed to load college data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Helper to generate a unique college code based on name or institutional prefix
  function generateUniqueCollegeCode(nameHint?: string) {
    const base = nameHint && nameHint.trim().length > 0
      ? nameHint
          .trim()
          .split(/\s+/)
          .map((word) => word.replace(/[^a-zA-Z]/g, "")[0])
          .filter(Boolean)
          .join("")
          .slice(0, 4)
          .toUpperCase()
      : ["KITS", "APEX", "NGA", "RIOT", "TECH", "INST", "UNIV"][Math.floor(Math.random() * 7)];

    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    // Combine base with year or random number
    const proposed = `${base || "COL"}-${year}`;
    
    // Check if collision exists in loaded colleges
    const exists = colleges.some((c) => c.code.toUpperCase() === proposed.toUpperCase());
    const finalCode = exists ? `${base || "COL"}-${randomSuffix}` : proposed;
    return finalCode;
  }

  function handleOpenCreateModal() {
    const code = generateUniqueCollegeCode("");
    setCreateName("");
    setCreateCode(code);
    setCreateDescription("");
    setCreateMinDuration(30);
    setCreateMaxDuration(60);
    setCreateRequireLoginApproval(true);
    // Default to the first available paper if present
    setCreateAssignedPaperIds(papers.length > 0 ? [papers[0].id] : []);
    setErrorMessage("");
    setShowCreateModal(true);
  }

  function handleAutoGenerateInModal() {
    const code = generateUniqueCollegeCode(createName);
    setCreateCode(code);
  }

  function handleToggleCreatePaper(paperId: string) {
    setCreateAssignedPaperIds((prev) =>
      prev.includes(paperId) ? prev.filter((id) => id !== paperId) : [...prev, paperId]
    );
  }

  function handleToggleEditPaper(paperId: string) {
    setEditAssignedPaperIds((prev) =>
      prev.includes(paperId) ? prev.filter((id) => id !== paperId) : [...prev, paperId]
    );
  }

  async function handleCreateCollege(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    setMessage("");

    if (!createName.trim()) {
      setErrorMessage("Please enter a valid College Name.");
      return;
    }
    if (!createCode.trim()) {
      setErrorMessage("Please enter or generate a unique College Code.");
      return;
    }
    if (createMinDuration <= 0) {
      setErrorMessage("Minimum exam duration must be at least 1 minute.");
      return;
    }
    if (createMaxDuration <= 0) {
      setErrorMessage("Maximum exam duration must be at least 1 minute.");
      return;
    }
    if (createMinDuration > createMaxDuration) {
      setErrorMessage("Minimum exam duration cannot be greater than Maximum exam duration.");
      return;
    }
    if (createAssignedPaperIds.length === 0) {
      setErrorMessage("Please allocate at least one Question Paper Set to this college.");
      return;
    }

    try {
      setSubmitting(true);
      await api<College>("/colleges", {
        method: "POST",
        body: JSON.stringify({
          name: createName.trim(),
          code: createCode.trim().toUpperCase(),
          description: createDescription.trim(),
          assignedPaperIds: createAssignedPaperIds,
          minDurationMinutes: Number(createMinDuration),
          maxDurationMinutes: Number(createMaxDuration),
          requireLoginApproval: Boolean(createRequireLoginApproval),
        }),
      });

      setMessage(`College '${createName.trim()}' successfully created with Code ${createCode.trim().toUpperCase()}! (Exam Window: Min ${createMinDuration}m / Max ${createMaxDuration}m)`);
      setShowCreateModal(false);
      await loadData();
      setTimeout(() => setMessage(""), 5000);
    } catch (err: any) {
      setErrorMessage(err instanceof ApiError ? err.message : err.message || "Failed to create college.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenAssignModal(college: CollegeWithMeta) {
    setSelectedCollege(college);
    setEditAssignedPaperIds(college.assignedPaperIds || []);
    setErrorMessage("");
    setShowAssignModal(true);
  }

  async function handleSavePaperAssignment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedCollege) return;
    setErrorMessage("");
    setMessage("");

    if (editAssignedPaperIds.length === 0) {
      setErrorMessage("Every college must have at least one assigned question paper.");
      return;
    }

    try {
      setSubmitting(true);
      await api(`/colleges/${selectedCollege.id}/assign-papers`, {
        method: "POST",
        body: JSON.stringify({ paperIds: editAssignedPaperIds }),
      });

      setMessage(`Question papers updated successfully for ${selectedCollege.name}!`);
      setShowAssignModal(false);
      await loadData();
      setTimeout(() => setMessage(""), 5000);
    } catch (err: any) {
      setErrorMessage(err instanceof ApiError ? err.message : err.message || "Failed to update assigned papers.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenEditModal(college: CollegeWithMeta) {
    setSelectedCollege(college);
    setEditName(college.name);
    setEditCode(college.code);
    setEditDescription(college.description || "");
    setEditMinDuration(college.minDurationMinutes ?? 30);
    setEditMaxDuration(college.maxDurationMinutes ?? 60);
    setEditRequireLoginApproval(college.requireLoginApproval ?? true);
    setErrorMessage("");
    setShowEditModal(true);
  }

  async function handleSaveCollegeEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedCollege) return;
    setErrorMessage("");
    setMessage("");

    if (!editName.trim()) {
      setErrorMessage("College name cannot be empty.");
      return;
    }
    if (!editCode.trim()) {
      setErrorMessage("College code cannot be empty.");
      return;
    }
    if (editMinDuration <= 0) {
      setErrorMessage("Minimum exam duration must be at least 1 minute.");
      return;
    }
    if (editMaxDuration <= 0) {
      setErrorMessage("Maximum exam duration must be at least 1 minute.");
      return;
    }
    if (editMinDuration > editMaxDuration) {
      setErrorMessage("Minimum exam duration cannot be greater than Maximum exam duration.");
      return;
    }

    try {
      setSubmitting(true);
      await api(`/colleges/${selectedCollege.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editName.trim(),
          code: editCode.trim().toUpperCase(),
          description: editDescription.trim(),
          minDurationMinutes: Number(editMinDuration),
          maxDurationMinutes: Number(editMaxDuration),
          requireLoginApproval: Boolean(editRequireLoginApproval),
        }),
      });

      setMessage(`College '${editName.trim()}' details updated successfully.`);
      setShowEditModal(false);
      await loadData();
      setTimeout(() => setMessage(""), 5000);
    } catch (err: any) {
      setErrorMessage(err instanceof ApiError ? err.message : err.message || "Failed to update college.");
    } finally {
      setSubmitting(false);
    }
  }

  // --- Dedicated Timing & Approval Settings Handlers ---
  function handleOpenTimingModal(college: CollegeWithMeta) {
    setSelectedCollege(college);
    setTimingMinDuration(college.minDurationMinutes ?? 30);
    setTimingMaxDuration(college.maxDurationMinutes ?? 60);
    setTimingRequireLoginApproval(college.requireLoginApproval ?? true);
    setTimingExamConfigs(college.examConfigs ?? {});
    setErrorMessage("");
    setShowTimingModal(true);
  }

  async function handleSaveTimingSettings(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedCollege) return;
    setErrorMessage("");
    setMessage("");

    if (timingMinDuration <= 0) {
      setErrorMessage("Minimum exam duration must be at least 1 minute.");
      return;
    }
    if (timingMaxDuration <= 0) {
      setErrorMessage("Maximum exam duration must be at least 1 minute.");
      return;
    }
    if (timingMinDuration > timingMaxDuration) {
      setErrorMessage("Minimum exam duration cannot be greater than Maximum exam duration.");
      return;
    }

    try {
      setSubmitting(true);
      await api(`/colleges/${selectedCollege.id}/timing-settings`, {
        method: "POST",
        body: JSON.stringify({
          minDurationMinutes: Number(timingMinDuration),
          maxDurationMinutes: Number(timingMaxDuration),
          requireLoginApproval: Boolean(timingRequireLoginApproval),
          examConfigs: timingExamConfigs,
        }),
      });

      setMessage(`Timing and login approval policy updated successfully for ${selectedCollege.name} (Min: ${timingMinDuration}m, Max: ${timingMaxDuration}m)!`);
      setShowTimingModal(false);
      await loadData();
      setTimeout(() => setMessage(""), 5000);
    } catch (err: any) {
      setErrorMessage(err instanceof ApiError ? err.message : err.message || "Failed to update exam timing settings.");
    } finally {
      setSubmitting(false);
    }
  }

  // --- Dedicated Student Approvals Modal Handlers ---
  async function handleOpenApprovalsModal(college: CollegeWithMeta) {
    setApprovalsCollege(college);
    setShowApprovalsModal(true);
    setApprovalMessage("");
    try {
      setLoadingStudents(true);
      const students = await api<any[]>(`/colleges/${college.id}/students`);
      setCollegeStudents(students);
    } catch {
      setCollegeStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }

  async function handleApproveStudent(studentId: string) {
    if (!approvalsCollege) return;
    try {
      await api(`/colleges/${approvalsCollege.id}/approve-student`, {
        method: "POST",
        body: JSON.stringify({ studentId }),
      });
      setApprovalMessage("Student login approved successfully!");
      const updated = await api<any[]>(`/colleges/${approvalsCollege.id}/students`);
      setCollegeStudents(updated);
      await loadData();
      setTimeout(() => setApprovalMessage(""), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to approve student.");
    }
  }

  async function handleApproveAllStudents() {
    if (!approvalsCollege) return;
    try {
      const res = await api<{ approvedCount: number }>(`/colleges/${approvalsCollege.id}/approve-all-students`, {
        method: "POST",
      });
      setApprovalMessage(`Successfully approved all ${res.approvedCount || 0} candidate logins!`);
      const updated = await api<any[]>(`/colleges/${approvalsCollege.id}/students`);
      setCollegeStudents(updated);
      await loadData();
      setTimeout(() => setApprovalMessage(""), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to approve all students.");
    }
  }

  async function handleRevokeStudent(studentId: string) {
    if (!approvalsCollege) return;
    try {
      await api(`/colleges/${approvalsCollege.id}/revoke-student`, {
        method: "POST",
        body: JSON.stringify({ studentId }),
      });
      setApprovalMessage("Student login approval turned OFF (reset to Pending).");
      const updated = await api<any[]>(`/colleges/${approvalsCollege.id}/students`);
      setCollegeStudents(updated);
      await loadData();
      setTimeout(() => setApprovalMessage(""), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to turn OFF student approval.");
    }
  }

  async function handleRevokeAllStudents() {
    if (!approvalsCollege) return;
    try {
      const res = await api<{ revokedCount: number }>(`/colleges/${approvalsCollege.id}/revoke-all-students`, {
        method: "POST",
      });
      setApprovalMessage(`Successfully turned OFF approval for all ${res.revokedCount || 0} candidate logins!`);
      const updated = await api<any[]>(`/colleges/${approvalsCollege.id}/students`);
      setCollegeStudents(updated);
      await loadData();
      setTimeout(() => setApprovalMessage(""), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to turn OFF all student approvals.");
    }
  }

  async function handleDeleteCollege(college: CollegeWithMeta) {
    if (!confirm(`Are you sure you want to delete '${college.name}' (${college.code})? Candidates enrolled under this code will lose access.`)) {
      return;
    }

    try {
      await api(`/colleges/${college.id}`, { method: "DELETE" });
      setMessage(`College '${college.name}' removed.`);
      await loadData();
      setTimeout(() => setMessage(""), 5000);
    } catch (err: any) {
      setErrorMessage(err instanceof ApiError ? err.message : err.message || "Failed to delete college.");
    }
  }

  function handleCopyCode(code: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopyToast(`Copied College Code: ${code}`);
    setTimeout(() => setCopyToast(""), 3000);
  }

  function exportCollegesExcel() {
    downloadExcel(
      `Kaizentrix_Colleges_Directory_${new Date().toISOString().split("T")[0]}`,
      colleges,
      [
        { key: "name", label: "College Name" },
        { key: "code", label: "Unique College Code" },
        {
          key: "assignedPaperIds",
          label: "Assigned Papers Count",
          format: (v) => `${(v || []).length} Paper(s)`,
        },
        {
          key: "assignedPapers",
          label: "Assigned Paper Titles & Codes",
          format: (v, r) =>
            (r.assignedPapers || [])
              .map((p: QuestionPaper) => `${p.code} (${p.title})`)
              .join("; ") || "None",
        },
        {
          key: "studentCount",
          label: "Enrolled Students",
          format: (v) => String(v || 0),
        },
        { key: "description", label: "Department / Campus Info", format: (v) => v || "Main Campus" },
        { key: "status", label: "Institutional Status" },
        {
          key: "createdAt",
          label: "Created On",
          format: (v) => (v ? new Date(v).toLocaleDateString() : "N/A"),
        },
      ]
    );
  }

  const filteredColleges = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return colleges;
    return colleges.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [colleges, search]);

  const totalPaperAllocations = useMemo(() => {
    return colleges.reduce((sum, c) => sum + (c.assignedPaperIds?.length || 0), 0);
  }, [colleges]);

  const totalEnrolledStudents = useMemo(() => {
    return colleges.reduce((sum, c) => sum + (c.studentCount || 0), 0);
  }, [colleges]);

  return (
    <PortalShell role="STAFF">
      {/* Header section */}
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
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🏛️</span> College Management & Paper Allocations
          </h1>
          <p style={{ maxWidth: "750px", marginTop: "0.25rem" }}>
            Provision participating colleges, issue unique college access codes, and allocate existing question papers separately to each institution. Students are restricted to their college&apos;s assigned papers only.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={exportCollegesExcel}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <span>📊</span> Export Directory
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenCreateModal}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontWeight: 600 }}
          >
            <span>+</span> Create New College
          </button>
        </div>
      </div>

      {/* Copy Toast */}
      {copyToast && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            background: "#1E3A8A",
            color: "#FFFFFF",
            padding: "0.75rem 1.25rem",
            borderRadius: "8px",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            fontWeight: 600,
            fontSize: "0.9rem",
            border: "1px solid #60A5FA",
          }}
        >
          <span>📋</span> {copyToast}
        </div>
      )}

      {/* Feedback Messages */}
      {message && (
        <div
          className="alert alert-ok"
          style={{
            background: "#ECFDF5",
            border: "1px solid #10B981",
            borderRadius: "8px",
            padding: "0.85rem 1.25rem",
            marginBottom: "1.25rem",
            color: "#065F46",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>✅</span>
          <span>{message}</span>
        </div>
      )}

      {errorMessage && (
        <div
          className="alert alert-error"
          style={{
            background: "#FEF2F2",
            border: "1px solid #DC2626",
            borderRadius: "8px",
            padding: "0.85rem 1.25rem",
            marginBottom: "1.25rem",
            color: "#991B1B",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>⛔</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Cards in Blue and White Palette */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          className="card"
          style={{
            padding: "1.25rem",
            background: "#FFFFFF",
            borderLeft: "4px solid #2563EB",
          }}
        >
          <span style={{ fontSize: "0.82rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Participating Colleges
          </span>
          <div style={{ fontSize: "1.85rem", fontWeight: 700, color: "#1E3A8A", marginTop: "0.35rem" }}>
            {colleges.length}
          </div>
          <span style={{ fontSize: "0.78rem", color: "#2563EB", marginTop: "0.2rem", display: "block" }}>
            Active campus registrations
          </span>
        </div>

        <div
          className="card"
          style={{
            padding: "1.25rem",
            background: "#FFFFFF",
            borderLeft: "4px solid #0284C7",
          }}
        >
          <span style={{ fontSize: "0.82rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Available Question Papers
          </span>
          <div style={{ fontSize: "1.85rem", fontWeight: 700, color: "#0369A1", marginTop: "0.35rem" }}>
            {papers.length} Sets
          </div>
          <span style={{ fontSize: "0.78rem", color: "#0284C7", marginTop: "0.2rem", display: "block" }}>
            Ready for institution allocation
          </span>
        </div>

        <div
          className="card"
          style={{
            padding: "1.25rem",
            background: "#FFFFFF",
            borderLeft: "4px solid #059669",
          }}
        >
          <span style={{ fontSize: "0.82rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Total Allocations
          </span>
          <div style={{ fontSize: "1.85rem", fontWeight: 700, color: "#065F46", marginTop: "0.35rem" }}>
            {totalPaperAllocations}
          </div>
          <span style={{ fontSize: "0.78rem", color: "#059669", marginTop: "0.2rem", display: "block" }}>
            Papers mapped across colleges
          </span>
        </div>

        <div
          className="card"
          style={{
            padding: "1.25rem",
            background: "#FFFFFF",
            borderLeft: "4px solid #7C3AED",
          }}
        >
          <span style={{ fontSize: "0.82rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Enrolled Students
          </span>
          <div style={{ fontSize: "1.85rem", fontWeight: 700, color: "#5B21B6", marginTop: "0.35rem" }}>
            {totalEnrolledStudents}
          </div>
          <span style={{ fontSize: "0.78rem", color: "#7C3AED", marginTop: "0.2rem", display: "block" }}>
            Candidates mapped by college code
          </span>
        </div>

        <div
          className="card"
          style={{
            padding: "1.25rem",
            background: "#FFFFFF",
            borderLeft: "4px solid #0F766E",
          }}
        >
          <span style={{ fontSize: "0.82rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Timing & Approvals
          </span>
          <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0F766E", marginTop: "0.45rem" }}>
            30m Min / 60m Max
          </div>
          <span style={{ fontSize: "0.78rem", color: "#0D9488", marginTop: "0.25rem", display: "block" }}>
            🛡️ Strict server-enforced windows
          </span>
        </div>
      </div>

      {/* Main Roster Card */}
      <div className="card" style={{ padding: "1.5rem" }}>
        {/* Search and filter toolbar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div style={{ position: "relative", minWidth: 300, flex: 1 }}>
            <input
              type="text"
              placeholder="Search colleges by name, code, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "0.55rem 0.85rem",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                fontSize: "0.9rem",
              }}
            />
          </div>
          <span style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 500 }}>
            Showing {filteredColleges.length} of {colleges.length} colleges
          </span>
        </div>

        {/* Colleges Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
            Loading colleges and paper allocation rosters…
          </div>
        ) : filteredColleges.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3.5rem 1rem", border: "1px dashed var(--border)", borderRadius: "8px" }}>
            <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>🏛️</span>
            <h3 style={{ margin: 0, color: "#1E3A8A" }}>No Colleges Found</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "0.5rem 0 1.25rem" }}>
              {search ? "No colleges match your current search query." : "No partner colleges have been registered yet."}
            </p>
            <button type="button" className="btn btn-primary" onClick={handleOpenCreateModal}>
              + Create First College
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                  <th style={{ padding: "0.85rem 1rem", color: "#1E3A8A", fontWeight: 700 }}>College / Institution</th>
                  <th style={{ padding: "0.85rem 1rem", color: "#1E3A8A", fontWeight: 700 }}>Unique College Code</th>
                  <th style={{ padding: "0.85rem 1rem", color: "#1E3A8A", fontWeight: 700 }}>Exam Duration Window</th>
                  <th style={{ padding: "0.85rem 1rem", color: "#1E3A8A", fontWeight: 700, textAlign: "center" }}>Login Approval</th>
                  <th style={{ padding: "0.85rem 1rem", color: "#1E3A8A", fontWeight: 700 }}>Assigned Question Papers</th>
                  <th style={{ padding: "0.85rem 1rem", color: "#1E3A8A", fontWeight: 700, textAlign: "center" }}>Students</th>
                  <th style={{ padding: "0.85rem 1rem", color: "#1E3A8A", fontWeight: 700, textAlign: "center" }}>Status</th>
                  <th style={{ padding: "0.85rem 1rem", color: "#1E3A8A", fontWeight: 700, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredColleges.map((college) => {
                  const assignedList = (college.assignedPapers || papers.filter((p) => college.assignedPaperIds?.includes(p.id)));

                  return (
                    <tr
                      key={college.id}
                      style={{
                        borderBottom: "1px solid #E2E8F0",
                        transition: "background 0.15s ease",
                      }}
                    >
                      {/* Name & Description */}
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: 700, color: "#1E293B", fontSize: "0.95rem" }}>
                          {college.name}
                        </div>
                        {college.description ? (
                          <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                            {college.description}
                          </div>
                        ) : null}
                      </td>

                      {/* Unique College Code */}
                      <td style={{ padding: "1rem" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontWeight: 700,
                              fontSize: "0.88rem",
                              letterSpacing: "0.06em",
                              background: "#EFF6FF",
                              color: "#1E40AF",
                              border: "1px solid #BFDBFE",
                              padding: "0.25rem 0.6rem",
                              borderRadius: "6px",
                            }}
                          >
                            {college.code}
                          </span>
                          <button
                            type="button"
                            title="Copy College Code"
                            onClick={() => handleCopyCode(college.code)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "4px",
                              color: "#64748B",
                              fontSize: "0.9rem",
                            }}
                          >
                            📋
                          </button>
                        </div>
                      </td>

                      {/* Exam Duration Window */}
                      <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0F766E" }}>
                              ⏱️ {college.minDurationMinutes ?? 30}m – {college.maxDurationMinutes ?? 60}m
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                            <span
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: 600,
                                background: "#FEF3C7",
                                color: "#92400E",
                                padding: "1px 5px",
                                borderRadius: "3px",
                              }}
                              title="Submission locked until minimum duration has elapsed"
                            >
                              🔒 Min: {college.minDurationMinutes ?? 30}m
                            </span>
                            <span
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: 600,
                                background: "#FEE2E2",
                                color: "#991B1B",
                                padding: "1px 5px",
                                borderRadius: "3px",
                              }}
                              title="Automatically submitted when maximum duration expires"
                            >
                              ⌛ Auto: {college.maxDurationMinutes ?? 60}m
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Student Login Approval Status */}
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            padding: "0.25rem 0.55rem",
                            borderRadius: "12px",
                            background: college.requireLoginApproval !== false ? "#F0FDF4" : "#F8FAFC",
                            color: college.requireLoginApproval !== false ? "#166534" : "#64748B",
                            border: college.requireLoginApproval !== false ? "1px solid #BBF7D0" : "1px solid #E2E8F0",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          {college.requireLoginApproval !== false ? "🛡️ Required" : "⚡ Direct"}
                        </span>
                      </td>

                      {/* Assigned Question Papers */}
                      <td style={{ padding: "1rem", maxWidth: "340px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
                          {assignedList.length === 0 ? (
                            <span style={{ fontSize: "0.8rem", color: "#DC2626", fontStyle: "italic" }}>
                              ⚠️ No papers assigned
                            </span>
                          ) : (
                            assignedList.map((paper) => (
                              <span
                                key={paper.id}
                                title={`${paper.title} (${paper.durationMinutes} mins)`}
                                style={{
                                  fontSize: "0.76rem",
                                  fontWeight: 600,
                                  background: "#F0FDF4",
                                  color: "#166534",
                                  border: "1px solid #BBF7D0",
                                  padding: "0.2rem 0.5rem",
                                  borderRadius: "4px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                }}
                              >
                                <span>📄</span>
                                <strong style={{ fontFamily: "var(--font-mono)" }}>{paper.code}</strong>
                              </span>
                            ))
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(college)}
                            style={{
                              background: "none",
                              border: "1px dashed #2563EB",
                              color: "#2563EB",
                              fontSize: "0.72rem",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            ⚙️ Manage
                          </button>
                        </div>
                      </td>

                      {/* Enrolled Students */}
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "0.92rem",
                            color: (college.studentCount || 0) > 0 ? "#1E3A8A" : "#94A3B8",
                          }}
                        >
                          {college.studentCount || 0}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <span
                          className="chip"
                          style={{
                            background: college.status === "ACTIVE" ? "#DCFCE7" : "#F1F5F9",
                            color: college.status === "ACTIVE" ? "#166534" : "#64748B",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "0.2rem 0.55rem",
                            borderRadius: "12px",
                          }}
                        >
                          {college.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.35rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenTimingModal(college)}
                            title="Configure Exam Min/Max Duration & Login Approval Settings"
                            style={{
                              fontSize: "0.78rem",
                              padding: "0.3rem 0.6rem",
                              color: "#0F766E",
                              borderColor: "#99F6E4",
                              fontWeight: 600,
                              background: "#F0FDFA",
                            }}
                          >
                            ⏱️ Duration & Approval
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenApprovalsModal(college)}
                            title="Manage Student Login Approvals"
                            style={{
                              fontSize: "0.78rem",
                              padding: "0.3rem 0.6rem",
                              color: "#0F766E",
                              borderColor: "#99F6E4",
                              fontWeight: 600,
                              background: "#F0FDFA",
                            }}
                          >
                            👥 Approvals
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenAssignModal(college)}
                            title="Assign Question Papers Separately"
                            style={{ fontSize: "0.78rem", padding: "0.3rem 0.65rem", color: "#2563EB", borderColor: "#BFDBFE" }}
                          >
                            Assign Papers
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleOpenEditModal(college)}
                            title="Edit College Information"
                            style={{ fontSize: "0.78rem", padding: "0.3rem 0.5rem" }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDeleteCollege(college)}
                            title="Delete College"
                            style={{ fontSize: "0.78rem", padding: "0.3rem 0.5rem", color: "#DC2626" }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW COLLEGE WITH CODE GENERATOR & SEPARATE PAPER ALLOCATION */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
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
              maxWidth: 580,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #BFDBFE",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ margin: 0, color: "#1E3A8A", fontSize: "1.35rem" }}>
                  🏛️ Create Partner College
                </h2>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
                  Enter the college name, generate a unique access code, and assign question papers.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowCreateModal(false)}
                style={{ fontSize: "1.2rem", padding: "0.2rem 0.5rem" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCollege}>
              {/* College Name */}
              <div className="field" style={{ marginBottom: "1rem" }}>
                <label htmlFor="create-college-name" style={{ fontWeight: 600, color: "#1E293B" }}>
                  College / Institution Name *
                </label>
                <input
                  id="create-college-name"
                  type="text"
                  required
                  placeholder="e.g. Bangalore Institute of Technology"
                  value={createName}
                  onChange={(e) => {
                    setCreateName(e.target.value);
                  }}
                  style={{ width: "100%", padding: "0.6rem 0.85rem" }}
                />
              </div>

              {/* Unique College Code with Auto-Generator */}
              <div
                className="field"
                style={{
                  background: "#EFF6FF",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid #BFDBFE",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.35rem" }}>
                  <label htmlFor="create-college-code" style={{ fontWeight: 700, color: "#1E40AF" }}>
                    Unique College Code * (Candidate Exam Access Key)
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateInModal}
                    style={{
                      background: "#DBEAFE",
                      border: "1px solid #93C5FD",
                      color: "#1E40AF",
                      cursor: "pointer",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      borderRadius: "4px",
                      padding: "3px 8px",
                    }}
                  >
                    ⚡ Auto-Generate Unique Code
                  </button>
                </div>
                <input
                  id="create-college-code"
                  type="text"
                  required
                  placeholder="e.g. BIT-2026"
                  value={createCode}
                  onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                  style={{
                    width: "100%",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    background: "white",
                    borderColor: "#93C5FD",
                    padding: "0.6rem 0.85rem",
                  }}
                />
                <span style={{ fontSize: "0.78rem", color: "#3B82F6", display: "block", marginTop: "0.35rem" }}>
                  This is the single code students enter on the login page to access all exams assigned to this college.
                </span>
              </div>

              {/* Description / Campus */}
              <div className="field" style={{ marginBottom: "1.25rem" }}>
                <label htmlFor="create-college-desc" style={{ fontWeight: 600, color: "#1E293B" }}>
                  Department / Campus Description (Optional)
                </label>
                <input
                  id="create-college-desc"
                  type="text"
                  placeholder="e.g. Department of Computer Science & Engineering"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.85rem" }}
                />
              </div>

              {/* Exam Timing & Login Approval Configuration */}
              <div
                style={{
                  background: "#F0FDFA",
                  border: "1px solid #99F6E4",
                  borderRadius: "8px",
                  padding: "1rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>⏱️</span>
                  <strong style={{ fontSize: "0.92rem", color: "#0F766E" }}>
                    Exam Duration & Login Approval Settings
                  </strong>
                </div>
                <p style={{ margin: "0 0 0.85rem", fontSize: "0.78rem", color: "#115E59" }}>
                  Enforce institutional minimum and maximum exam completion windows. Submissions are strictly locked until minimum duration has elapsed.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.85rem" }}>
                  <div>
                    <label htmlFor="staff-create-min-dur" style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#134E4A", marginBottom: "0.25rem" }}>
                      Min Duration (Mins) *
                    </label>
                    <input
                      id="staff-create-min-dur"
                      type="number"
                      min={1}
                      max={createMaxDuration}
                      required
                      value={createMinDuration}
                      onChange={(e) => setCreateMinDuration(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.88rem" }}
                    />
                    <span style={{ fontSize: "0.72rem", color: "#0D9488", display: "block", marginTop: "0.2rem" }}>
                      Lock submissions until
                    </span>
                  </div>
                  <div>
                    <label htmlFor="staff-create-max-dur" style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#134E4A", marginBottom: "0.25rem" }}>
                      Max Duration (Mins) *
                    </label>
                    <input
                      id="staff-create-max-dur"
                      type="number"
                      min={createMinDuration}
                      max={480}
                      required
                      value={createMaxDuration}
                      onChange={(e) => setCreateMaxDuration(Math.max(createMinDuration, parseInt(e.target.value) || 60))}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.88rem" }}
                    />
                    <span style={{ fontSize: "0.72rem", color: "#0D9488", display: "block", marginTop: "0.2rem" }}>
                      Auto-submit on expiry
                    </span>
                  </div>
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.5rem 0.75rem",
                    background: "#CCFBF1",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={createRequireLoginApproval}
                    onChange={(e) => setCreateRequireLoginApproval(e.target.checked)}
                  />
                  <div style={{ fontSize: "0.8rem", color: "#0F766E" }}>
                    <strong>Require Invigilator / Staff Login Approval</strong>
                    <div style={{ fontSize: "0.72rem", color: "#115E59" }}>
                      Students must be approved by Staff or Admin before they can start the exam
                    </div>
                  </div>
                </label>
              </div>

              {/* Assign Existing Question Papers Separately */}
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  padding: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.6rem" }}>
                  <div>
                    <label style={{ fontWeight: 700, color: "#1E293B", fontSize: "0.92rem", display: "block" }}>
                      📚 Assign Question Papers Separately to this College *
                    </label>
                    <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                      Candidates will ONLY see and take the question papers checked below.
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button
                      type="button"
                      onClick={() => setCreateAssignedPaperIds(papers.map((p) => p.id))}
                      style={{ background: "none", border: "none", color: "#2563EB", cursor: "pointer", fontSize: "0.75rem", textDecoration: "underline" }}
                    >
                      Select All
                    </button>
                    <span style={{ color: "#CBD5E1" }}>|</span>
                    <button
                      type="button"
                      onClick={() => setCreateAssignedPaperIds([])}
                      style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "0.75rem", textDecoration: "underline" }}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {papers.length === 0 ? (
                  <div style={{ fontSize: "0.85rem", color: "var(--muted)", fontStyle: "italic" }}>
                    No question papers found in the bank. Please create question papers first.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {papers.map((paper) => {
                      const isChecked = createAssignedPaperIds.includes(paper.id);
                      return (
                        <label
                          key={paper.id}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.75rem",
                            padding: "0.65rem 0.85rem",
                            borderRadius: "6px",
                            background: isChecked ? "#EFF6FF" : "#FFFFFF",
                            border: isChecked ? "1px solid #93C5FD" : "1px solid #E2E8F0",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleCreatePaper(paper.id)}
                            style={{ marginTop: "0.2rem" }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <strong style={{ fontSize: "0.88rem", color: isChecked ? "#1E3A8A" : "#1E293B" }}>
                                {paper.title}
                              </strong>
                              <span
                                style={{
                                  fontFamily: "var(--font-mono)",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  background: isChecked ? "#DBEAFE" : "#F1F5F9",
                                  color: isChecked ? "#1E40AF" : "#475569",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                }}
                              >
                                {paper.code}
                              </span>
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                              Duration: {paper.durationMinutes} mins • Pass: {paper.passPercent}%
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ fontWeight: 700, minWidth: 150 }}
                >
                  {submitting ? "Creating College…" : "Save & Register College →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ASSIGN EXISTING QUESTION PAPERS SEPARATELY TO SELECTED COLLEGE */}
      {/* ========================================================================= */}
      {showAssignModal && selectedCollege && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
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
              maxWidth: 560,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #BFDBFE",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ margin: 0, color: "#1E3A8A", fontSize: "1.35rem" }}>
                  📑 Assign Question Papers
                </h2>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
                  Configure paper access separately for <strong>{selectedCollege.name}</strong> ({selectedCollege.code}).
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowAssignModal(false)}
                style={{ fontSize: "1.2rem", padding: "0.2rem 0.5rem" }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                background: "#EFF6FF",
                border: "1px solid #BFDBFE",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                fontSize: "0.83rem",
                color: "#1E40AF",
                marginBottom: "1.25rem",
                lineHeight: 1.45,
              }}
            >
              <strong>🔒 Strict Institutional Partition:</strong> Students registered under College Code <code>{selectedCollege.code}</code> will only have access to view and solve the question papers selected below. Other portal papers remain strictly inaccessible.
            </div>

            <form onSubmit={handleSavePaperAssignment}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1E293B" }}>
                  Select Papers ({editAssignedPaperIds.length} of {papers.length} selected):
                </span>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button
                    type="button"
                    onClick={() => setEditAssignedPaperIds(papers.map((p) => p.id))}
                    style={{ background: "none", border: "none", color: "#2563EB", cursor: "pointer", fontSize: "0.75rem", textDecoration: "underline" }}
                  >
                    Select All
                  </button>
                  <span style={{ color: "#CBD5E1" }}>|</span>
                  <button
                    type="button"
                    onClick={() => setEditAssignedPaperIds([])}
                    style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "0.75rem", textDecoration: "underline" }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {papers.map((paper) => {
                  const isChecked = editAssignedPaperIds.includes(paper.id);
                  return (
                    <label
                      key={paper.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.75rem",
                        padding: "0.75rem 0.85rem",
                        borderRadius: "6px",
                        background: isChecked ? "#EFF6FF" : "#FFFFFF",
                        border: isChecked ? "1px solid #93C5FD" : "1px solid #E2E8F0",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleEditPaper(paper.id)}
                        style={{ marginTop: "0.2rem" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: "0.9rem", color: isChecked ? "#1E3A8A" : "#1E293B" }}>
                            {paper.title}
                          </strong>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              background: isChecked ? "#DBEAFE" : "#F1F5F9",
                              color: isChecked ? "#1E40AF" : "#475569",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {paper.code}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                          {paper.description || "Aptitude screen test set."}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#2563EB", marginTop: "0.25rem" }}>
                          ⏱️ {paper.durationMinutes} Minutes • Pass Threshold: {paper.passPercent}%
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowAssignModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ fontWeight: 700 }}
                >
                  {submitting ? "Updating Allocation…" : "Save Paper Allocation →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT COLLEGE NAME / UNIQUE CODE / DESCRIPTION */}
      {/* ========================================================================= */}
      {showEditModal && selectedCollege && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
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
              maxWidth: 520,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #BFDBFE",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ margin: 0, color: "#1E3A8A", fontSize: "1.35rem" }}>
                  ✏️ Edit College Details
                </h2>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
                  Update the college name, unique code, or campus description.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowEditModal(false)}
                style={{ fontSize: "1.2rem", padding: "0.2rem 0.5rem" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCollegeEdit}>
              <div className="field" style={{ marginBottom: "1rem" }}>
                <label htmlFor="edit-college-name" style={{ fontWeight: 600 }}>
                  College Name *
                </label>
                <input
                  id="edit-college-name"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.85rem" }}
                />
              </div>

              <div className="field" style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.25rem" }}>
                  <label htmlFor="edit-college-code" style={{ fontWeight: 600 }}>
                    Unique College Code *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const c = generateUniqueCollegeCode(editName);
                      setEditCode(c);
                    }}
                    style={{ background: "none", border: "none", color: "#2563EB", cursor: "pointer", fontSize: "0.75rem", textDecoration: "underline" }}
                  >
                    ⚡ Regenerate Code
                  </button>
                </div>
                <input
                  id="edit-college-code"
                  type="text"
                  required
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                  style={{
                    width: "100%",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "0.6rem 0.85rem",
                  }}
                />
              </div>

              <div className="field" style={{ marginBottom: "1.25rem" }}>
                <label htmlFor="staff-edit-college-desc" style={{ fontWeight: 600 }}>
                  Department / Campus Description
                </label>
                <input
                  id="staff-edit-college-desc"
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.85rem" }}
                />
              </div>

              {/* Exam Duration & Login Approval Settings */}
              <div
                style={{
                  background: "#F0FDFA",
                  border: "1px solid #99F6E4",
                  borderRadius: "8px",
                  padding: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>⏱️</span>
                  <strong style={{ fontSize: "0.92rem", color: "#0F766E" }}>
                    Exam Duration & Login Approval Policy
                  </strong>
                </div>
                <p style={{ margin: "0 0 0.85rem", fontSize: "0.78rem", color: "#115E59" }}>
                  Enforce strict institutional exam windows. Students cannot submit before minimum duration and will be auto-submitted at maximum duration.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.85rem" }}>
                  <div>
                    <label htmlFor="staff-edit-min-dur" style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#134E4A", marginBottom: "0.25rem" }}>
                      Min Duration (Mins) *
                    </label>
                    <input
                      id="staff-edit-min-dur"
                      type="number"
                      min={1}
                      max={editMaxDuration}
                      required
                      value={editMinDuration}
                      onChange={(e) => setEditMinDuration(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.88rem" }}
                    />
                    <span style={{ fontSize: "0.72rem", color: "#0D9488", display: "block", marginTop: "0.2rem" }}>
                      Early submission blocked
                    </span>
                  </div>
                  <div>
                    <label htmlFor="staff-edit-max-dur" style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#134E4A", marginBottom: "0.25rem" }}>
                      Max Duration (Mins) *
                    </label>
                    <input
                      id="staff-edit-max-dur"
                      type="number"
                      min={editMinDuration}
                      max={480}
                      required
                      value={editMaxDuration}
                      onChange={(e) => setEditMaxDuration(Math.max(editMinDuration, parseInt(e.target.value) || 60))}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.88rem" }}
                    />
                    <span style={{ fontSize: "0.72rem", color: "#0D9488", display: "block", marginTop: "0.2rem" }}>
                      Auto-submit timer
                    </span>
                  </div>
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.5rem 0.75rem",
                    background: "#CCFBF1",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editRequireLoginApproval}
                    onChange={(e) => setEditRequireLoginApproval(e.target.checked)}
                  />
                  <div style={{ fontSize: "0.8rem", color: "#0F766E" }}>
                    <strong>Require Invigilator / Staff Login Approval</strong>
                    <div style={{ fontSize: "0.72rem", color: "#115E59" }}>
                      Enforce manual or batch approval before candidates enter the exam lobby
                    </div>
                  </div>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowEditModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ fontWeight: 700 }}
                >
                  {submitting ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DEDICATED EXAM DURATION & LOGIN APPROVAL CONFIGURATION MODAL     */}
      {/* ========================================================================= */}
      {showTimingModal && selectedCollege && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(5px)",
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
              maxWidth: 680,
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
              border: "1px solid #99F6E4",
              background: "#FFFFFF",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.4rem" }}>⏱️</span>
                  <h2 style={{ margin: 0, color: "#0F766E", fontSize: "1.35rem" }}>
                    Configure Exam Timing & Student Login Approval
                  </h2>
                </div>
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
                  Institutional Policy for <strong>{selectedCollege.name}</strong> (<code>{selectedCollege.code}</code>)
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowTimingModal(false)}
                style={{ fontSize: "1.2rem", padding: "0.2rem 0.5rem" }}
              >
                ✕
              </button>
            </div>

            {/* Institutional Lifecycle Simulation Card (matching user specification) */}
            <div
              style={{
                background: "linear-gradient(135deg, #0F766E 0%, #115E59 100%)",
                borderRadius: "10px",
                padding: "1.25rem",
                color: "#FFFFFF",
                marginBottom: "1.5rem",
                boxShadow: "0 4px 12px rgba(15, 118, 110, 0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1rem" }}>📋</span>
                <strong style={{ fontSize: "0.95rem", letterSpacing: "0.02em" }}>
                  Institutional Timing Workflow
                </strong>
              </div>
              <p style={{ margin: "0 0 0.75rem", fontSize: "0.82rem", opacity: 0.9, lineHeight: 1.45 }}>
                Timer starts from <strong>actual server-recorded exam start time</strong> (not login time alone). Submissions are strictly locked until minimum duration has passed.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: "0.5rem",
                  background: "rgba(255, 255, 255, 0.12)",
                  borderRadius: "8px",
                  padding: "0.75rem",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.72rem", opacity: 0.8, textTransform: "uppercase" }}>1. Login Time</div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>1:00 PM</div>
                  <div style={{ fontSize: "0.68rem", opacity: 0.75 }}>Enters Lobby</div>
                </div>
                <div style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.2)" }}>
                  <div style={{ fontSize: "0.72rem", opacity: 0.8, textTransform: "uppercase" }}>2. Approval</div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Staff / Admin</div>
                  <div style={{ fontSize: "0.68rem", opacity: 0.75 }}>One-click verify</div>
                </div>
                <div style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.2)" }}>
                  <div style={{ fontSize: "0.72rem", opacity: 0.8, textTransform: "uppercase" }}>3. Exam Starts</div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>1:00 PM</div>
                  <div style={{ fontSize: "0.68rem", opacity: 0.75 }}>Server timer starts</div>
                </div>
                <div style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.2)" }}>
                  <div style={{ fontSize: "0.72rem", opacity: 0.8, textTransform: "uppercase" }}>4. Min Allowed</div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#FDE047" }}>1:30 PM (30m)</div>
                  <div style={{ fontSize: "0.68rem", opacity: 0.75 }}>Earliest Submit</div>
                </div>
                <div style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.2)" }}>
                  <div style={{ fontSize: "0.72rem", opacity: 0.8, textTransform: "uppercase" }}>5. Max Duration</div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#FCA5A5" }}>2:00 PM (60m)</div>
                  <div style={{ fontSize: "0.68rem", opacity: 0.75 }}>Auto-submits</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveTimingSettings}>
              {/* Quick Preset Buttons */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1E293B", marginBottom: "0.4rem" }}>
                  ⚡ Quick Duration Presets:
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {[
                    { label: "Standard (30m Min / 60m Max)", min: 30, max: 60 },
                    { label: "Medium (45m Min / 90m Max)", min: 45, max: 90 },
                    { label: "Full Session (60m Min / 120m Max)", min: 60, max: 120 },
                    { label: "Quick Quiz (15m Min / 30m Max)", min: 15, max: 30 },
                    { label: "Fast Test (5m Min / 15m Max)", min: 5, max: 15 },
                  ].map((preset) => {
                    const isSelected = timingMinDuration === preset.min && timingMaxDuration === preset.max;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setTimingMinDuration(preset.min);
                          setTimingMaxDuration(preset.max);
                        }}
                        style={{
                          background: isSelected ? "#0F766E" : "#F0FDFA",
                          color: isSelected ? "#FFFFFF" : "#0F766E",
                          border: isSelected ? "1px solid #0F766E" : "1px solid #99F6E4",
                          padding: "0.35rem 0.65rem",
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Inputs: Min & Max Duration */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  padding: "1rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div>
                  <label htmlFor="staff-timing-min-duration" style={{ display: "block", fontWeight: 700, color: "#1E293B", fontSize: "0.88rem", marginBottom: "0.3rem" }}>
                    Minimum Exam Duration (Minutes) *
                  </label>
                  <input
                    id="staff-timing-min-duration"
                    type="number"
                    min={1}
                    max={timingMaxDuration}
                    required
                    value={timingMinDuration}
                    onChange={(e) => setTimingMinDuration(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: "100%", padding: "0.6rem 0.85rem", fontSize: "1rem", fontWeight: 600 }}
                  />
                  <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginTop: "0.3rem" }}>
                    🔒 Candidate <strong>cannot</strong> submit before {timingMinDuration} minutes have elapsed.
                  </span>
                </div>

                <div>
                  <label htmlFor="staff-timing-max-duration" style={{ display: "block", fontWeight: 700, color: "#1E293B", fontSize: "0.88rem", marginBottom: "0.3rem" }}>
                    Maximum Exam Duration (Minutes) *
                  </label>
                  <input
                    id="staff-timing-max-duration"
                    type="number"
                    min={timingMinDuration}
                    max={480}
                    required
                    value={timingMaxDuration}
                    onChange={(e) => setTimingMaxDuration(Math.max(timingMinDuration, parseInt(e.target.value) || 60))}
                    style={{ width: "100%", padding: "0.6rem 0.85rem", fontSize: "1rem", fontWeight: 600 }}
                  />
                  <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginTop: "0.3rem" }}>
                    ⌛ Candidate's exam is <strong>automatically submitted</strong> after {timingMaxDuration} minutes.
                  </span>
                </div>
              </div>

              {/* Student Login Approval Toggle */}
              <div
                style={{
                  background: timingRequireLoginApproval ? "#F0FDF4" : "#FFFBEB",
                  border: timingRequireLoginApproval ? "1px solid #BBF7D0" : "1px solid #FDE68A",
                  borderRadius: "8px",
                  padding: "1rem",
                  marginBottom: "1.25rem",
                }}
              >
                <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={timingRequireLoginApproval}
                    onChange={(e) => setTimingRequireLoginApproval(e.target.checked)}
                    style={{ marginTop: "0.25rem", width: 18, height: 18 }}
                  />
                  <div>
                    <strong style={{ fontSize: "0.92rem", color: timingRequireLoginApproval ? "#166534" : "#92400E" }}>
                      Require Student Login Approval by Admin or Staff
                    </strong>
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: timingRequireLoginApproval ? "#15803D" : "#B45309", lineHeight: 1.45 }}>
                      When enabled, newly registered or logged-in candidates under this college remain in <em>Pending Approval</em> state. They cannot start an examination session until an Admin or Staff invigilator approves their login.
                    </p>
                  </div>
                </label>
              </div>

              {/* Dynamic Calculation Summary */}
              <div
                style={{
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  borderRadius: "8px",
                  padding: "0.85rem 1rem",
                  fontSize: "0.82rem",
                  color: "#1E40AF",
                  marginBottom: "1.5rem",
                  lineHeight: 1.45,
                }}
              >
                <strong>📊 Active Policy Summary:</strong> For a student beginning an exam session at <strong>1:00 PM</strong>, submission will be unlocked at <strong>1:{timingMinDuration < 10 ? `0${timingMinDuration}` : timingMinDuration} PM</strong> ({timingMinDuration} mins), and auto-submission will execute strictly at <strong>{Math.floor(1 + timingMaxDuration / 60)}:{(timingMaxDuration % 60) < 10 ? `0${timingMaxDuration % 60}` : (timingMaxDuration % 60)} PM</strong> ({timingMaxDuration} mins). Answers are autosaved continually.
              </div>

              {/* Modal Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowTimingModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{
                    fontWeight: 700,
                    background: "#0F766E",
                    borderColor: "#0F766E",
                    padding: "0.6rem 1.25rem",
                  }}
                >
                  {submitting ? "Saving Policy…" : "Save Timing & Approval Policy →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: STUDENT LOGIN APPROVALS ROSTER                                   */}
      {/* ========================================================================= */}
      {showApprovalsModal && approvalsCollege && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(5px)",
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
              maxWidth: 760,
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
              border: "1px solid #99F6E4",
              background: "#FFFFFF",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.4rem" }}>👥</span>
                  <h2 style={{ margin: 0, color: "#0F766E", fontSize: "1.35rem" }}>
                    Student Login Approvals Roster
                  </h2>
                </div>
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
                  Review and authorize student logins for <strong>{approvalsCollege.name}</strong> (<code>{approvalsCollege.code}</code>)
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowApprovalsModal(false)}
                style={{ fontSize: "1.2rem", padding: "0.2rem 0.5rem" }}
              >
                ✕
              </button>
            </div>

            {/* Notification message */}
            {approvalMessage && (
              <div
                style={{
                  background: "#ECFDF5",
                  border: "1px solid #A7F3D0",
                  color: "#065F46",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>✅</span>
                <span>{approvalMessage}</span>
              </div>
            )}

            {/* Approval Controls Toolbar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#F0FDFA",
                border: "1px solid #CCFBF1",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                marginBottom: "1.25rem",
              }}
            >
              <div>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0F766E" }}>
                  Enrolled Students ({collegeStudents.length})
                </span>
                <span style={{ fontSize: "0.78rem", color: "#115E59", marginLeft: "0.5rem" }}>
                  • {collegeStudents.filter((s) => s.loginApproved).length} Approved • {collegeStudents.filter((s) => !s.loginApproved).length} Pending
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={handleApproveAllStudents}
                  disabled={collegeStudents.filter((s) => !s.loginApproved).length === 0}
                  style={{
                    background: "#0F766E",
                    color: "#FFFFFF",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    padding: "0.35rem 0.75rem",
                  }}
                  title="Turn ON approval for all pending students"
                >
                  ✓ Turn ALL ON ({collegeStudents.filter((s) => !s.loginApproved).length})
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={handleRevokeAllStudents}
                  disabled={collegeStudents.filter((s) => s.loginApproved).length === 0}
                  style={{
                    background: "#FEF2F2",
                    color: "#DC2626",
                    border: "1px solid #FCA5A5",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    padding: "0.35rem 0.75rem",
                  }}
                  title="Turn OFF approval for all students"
                >
                  ✕ Turn ALL OFF ({collegeStudents.filter((s) => s.loginApproved).length})
                </button>
              </div>
            </div>

            {/* Students List */}
            {loadingStudents ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
                Loading enrolled students…
              </div>
            ) : collegeStudents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", background: "#F8FAFC", borderRadius: "8px", border: "1px dashed #CBD5E1" }}>
                <p style={{ margin: 0, fontWeight: 600, color: "#64748B" }}>
                  No students currently registered under college code <code>{approvalsCollege.code}</code>.
                </p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#94A3B8" }}>
                  When students register or log in with this code, they will appear here for verification.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: 400, overflowY: "auto" }}>
                {collegeStudents.map((student) => {
                  const isApproved = Boolean(student.loginApproved);
                  return (
                    <div
                      key={student.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.75rem 1rem",
                        borderRadius: "8px",
                        background: isApproved ? "#FFFFFF" : "#FEF3C7",
                        border: isApproved ? "1px solid #E2E8F0" : "1px solid #FCD34D",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: isApproved ? "#DCFCE7" : "#FEE2E2",
                            color: isApproved ? "#15803D" : "#991B1B",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "0.88rem",
                          }}
                        >
                          {student.name ? student.name[0].toUpperCase() : "S"}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <strong style={{ fontSize: "0.9rem", color: "#1E293B" }}>
                              {student.name}
                            </strong>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: isApproved ? "#DCFCE7" : "#FEE2E2",
                                color: isApproved ? "#166534" : "#991B1B",
                              }}
                            >
                              {isApproved ? "✓ APPROVED (ON)" : "⏳ PENDING (OFF)"}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.15rem" }}>
                            {student.email} • Roll: <code>{student.rollNumber || "N/A"}</code>
                          </div>
                        </div>
                      </div>

                      {/* Interactive ON / OFF Switch and Actions */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <button
                          type="button"
                          onClick={() => (isApproved ? handleRevokeStudent(student.id) : handleApproveStudent(student.id))}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            background: isApproved ? "#ECFDF5" : "#F1F5F9",
                            border: isApproved ? "1.5px solid #10B981" : "1.5px solid #CBD5E1",
                            borderRadius: "9999px",
                            padding: "3px 8px 3px 5px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          title={isApproved ? "Approval is ON — Click to switch OFF (Revoke)" : "Approval is OFF — Click to switch ON (Approve)"}
                        >
                          <div
                            style={{
                              width: "34px",
                              height: "18px",
                              borderRadius: "9999px",
                              background: isApproved ? "#16A34A" : "#94A3B8",
                              position: "relative",
                              transition: "background 0.2s ease",
                            }}
                          >
                            <div
                              style={{
                                width: "14px",
                                height: "14px",
                                borderRadius: "50%",
                                background: "#FFFFFF",
                                position: "absolute",
                                top: "2px",
                                left: isApproved ? "18px" : "2px",
                                transition: "left 0.2s ease",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 800,
                              letterSpacing: "0.04em",
                              color: isApproved ? "#15803D" : "#64748B",
                            }}
                          >
                            {isApproved ? "ON" : "OFF"}
                          </span>
                        </button>

                        {isApproved ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleRevokeStudent(student.id)}
                            style={{ fontSize: "0.75rem", color: "#DC2626", borderColor: "#FCA5A5", padding: "0.25rem 0.55rem" }}
                            title="Turn OFF approval for this student"
                          >
                            Turn OFF
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleApproveStudent(student.id)}
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              background: "#059669",
                              borderColor: "#059669",
                              padding: "0.25rem 0.65rem",
                            }}
                            title="Turn ON approval for this student"
                          >
                            Turn ON
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowApprovalsModal(false)}
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  );
}

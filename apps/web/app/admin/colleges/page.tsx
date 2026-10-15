"use client";

import { FormEvent, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { PortalShell } from "@/components/PortalShell";
import { api, ApiError, type College, type QuestionPaper } from "@/lib/api";
import { downloadExcel } from "@/lib/excelExport";

interface CollegeWithMeta extends College {
  assignedPapers?: QuestionPaper[];
  studentCount?: number;
  approvedStudentCount?: number;
  pendingStudentCount?: number;
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
  const [showControlModal, setShowControlModal] = useState(false);
  const [controlModalTab, setControlModalTab] = useState<"timing" | "approvals" | "details">("timing");
  const [selectedCollege, setSelectedCollege] = useState<CollegeWithMeta | null>(null);

  // Timing & Approval configuration state in modal
  const [timingMinDuration, setTimingMinDuration] = useState(30);
  const [timingMaxDuration, setTimingMaxDuration] = useState(60);
  const [timingRequireLoginApproval, setTimingRequireLoginApproval] = useState(true);
  const [timingExamStarted, setTimingExamStarted] = useState(true);

  // Edit details inside modal
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Enrolled students for selected college
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
    const proposed = `${base || "COL"}-${year}`;
    const exists = colleges.some((c) => c.code.toUpperCase() === proposed.toUpperCase());
    return exists ? `${base || "COL"}-${randomSuffix}` : proposed;
  }

  function handleOpenCreateModal() {
    const code = generateUniqueCollegeCode("");
    setCreateName("");
    setCreateCode(code);
    setCreateDescription("");
    setCreateMinDuration(30);
    setCreateMaxDuration(60);
    setCreateRequireLoginApproval(true);
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
      setErrorMessage("Minimum exam duration cannot be greater than maximum exam duration.");
      return;
    }
    if (createAssignedPaperIds.length === 0) {
      setErrorMessage("Please allocate at least one Question Paper set to this college.");
      return;
    }

    try {
      setSubmitting(true);
      await api("/colleges", {
        method: "POST",
        body: JSON.stringify({
          name: createName.trim(),
          code: createCode.trim().toUpperCase(),
          description: createDescription.trim(),
          assignedPaperIds: createAssignedPaperIds,
          minDurationMinutes: createMinDuration,
          maxDurationMinutes: createMaxDuration,
          requireLoginApproval: createRequireLoginApproval,
        }),
      });

      setMessage(`College '${createName.trim()}' registered successfully with code '${createCode.trim().toUpperCase()}'.`);
      setShowCreateModal(false);
      await loadData();
      setTimeout(() => setMessage(""), 5000);
    } catch (err: any) {
      setErrorMessage(err instanceof ApiError ? err.message : err.message || "Failed to create college.");
    } finally {
      setSubmitting(false);
    }
  }

  // Open the unified College Control Modal (Timing, Student Approvals, Edit Details)
  async function handleOpenControlModal(college: CollegeWithMeta, tab: "timing" | "approvals" | "details" = "timing") {
    setSelectedCollege(college);
    setControlModalTab(tab);
    setTimingMinDuration(college.minDurationMinutes ?? 30);
    setTimingMaxDuration(college.maxDurationMinutes ?? 60);
    setTimingRequireLoginApproval(college.requireLoginApproval ?? true);
    setTimingExamStarted(college.examStarted ?? true);
    setEditName(college.name);
    setEditCode(college.code);
    setEditDescription(college.description || "");
    setApprovalMessage("");
    setShowControlModal(true);

    // Fetch students enrolled for this college
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

  // Quick 1-Click Toggle: Start or Pause Exam (Direct from table or modal)
  async function handleToggleExamStartPermission(college: CollegeWithMeta) {
    try {
      const res = await api<{ examStarted: boolean; approvedCount?: number }>(`/colleges/${college.id}/toggle-start`, {
        method: "POST",
      });
      const newState = res.examStarted;
      if (newState) {
        setMessage(`🚀 Exam started! Permissions granted and all enrolled students approved for ${college.name}.`);
      } else {
        setMessage(`⏸️ Exam paused for ${college.name}. New candidates held in lobby.`);
      }
      await loadData();
      if (selectedCollege && selectedCollege.id === college.id) {
        setTimingExamStarted(newState);
        const updated = await api<any[]>(`/colleges/${college.id}/students`);
        setCollegeStudents(updated);
      }
      setTimeout(() => setMessage(""), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to toggle exam start permission.");
    }
  }

  // Quick 1-Click Approve All Students for a college (Direct from table row!)
  async function handleQuickApproveAll(college: CollegeWithMeta) {
    try {
      const res = await api<{ approvedCount: number }>(`/colleges/${college.id}/approve-all-students`, {
        method: "POST",
      });
      setMessage(`✅ Approved all ${res.approvedCount || 0} candidate logins for ${college.name}! Their exam access is unlocked.`);
      await loadData();
      if (selectedCollege && selectedCollege.id === college.id) {
        const updated = await api<any[]>(`/colleges/${college.id}/students`);
        setCollegeStudents(updated);
      }
      setTimeout(() => setMessage(""), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to approve students.");
    }
  }

  // Save Timing & Policy from Modal
  async function handleSaveTimingPolicy(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedCollege) return;
    if (timingMinDuration <= 0) {
      setErrorMessage("Minimum duration must be at least 1 minute.");
      return;
    }
    if (timingMaxDuration <= 0) {
      setErrorMessage("Maximum duration must be at least 1 minute.");
      return;
    }
    if (timingMinDuration > timingMaxDuration) {
      setErrorMessage("Minimum exam duration cannot be greater than maximum exam duration.");
      return;
    }

    try {
      setSubmitting(true);
      await api(`/colleges/${selectedCollege.id}/timing-settings`, {
        method: "POST",
        body: JSON.stringify({
          minDurationMinutes: timingMinDuration,
          maxDurationMinutes: timingMaxDuration,
          requireLoginApproval: timingRequireLoginApproval,
          examStarted: timingExamStarted,
        }),
      });

      setMessage(`Timing and login policies updated for ${selectedCollege.name}.`);
      setShowControlModal(false);
      await loadData();
      setTimeout(() => setMessage(""), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save timing policy.");
    } finally {
      setSubmitting(false);
    }
  }

  // Save College details from Modal
  async function handleSaveDetails(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedCollege) return;
    if (!editName.trim()) {
      setErrorMessage("College Name cannot be blank.");
      return;
    }
    if (!editCode.trim()) {
      setErrorMessage("College Code cannot be blank.");
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
        }),
      });

      setMessage(`Details updated for ${editName.trim()}.`);
      setShowControlModal(false);
      await loadData();
      setTimeout(() => setMessage(""), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update college details.");
    } finally {
      setSubmitting(false);
    }
  }

  // Individual student approval inside modal
  async function handleApproveStudent(studentId: string) {
    if (!selectedCollege) return;
    try {
      await api(`/colleges/${selectedCollege.id}/approve-student`, {
        method: "POST",
        body: JSON.stringify({ studentId }),
      });
      setApprovalMessage("Student login approved successfully!");
      const updated = await api<any[]>(`/colleges/${selectedCollege.id}/students`);
      setCollegeStudents(updated);
      await loadData();
      setTimeout(() => setApprovalMessage(""), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to approve student.");
    }
  }

  async function handleRevokeStudent(studentId: string) {
    if (!selectedCollege) return;
    try {
      await api(`/colleges/${selectedCollege.id}/revoke-student`, {
        method: "POST",
        body: JSON.stringify({ studentId }),
      });
      setApprovalMessage("Student login approval revoked.");
      const updated = await api<any[]>(`/colleges/${selectedCollege.id}/students`);
      setCollegeStudents(updated);
      await loadData();
      setTimeout(() => setApprovalMessage(""), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to revoke student approval.");
    }
  }

  function handleOpenAssignModal(college: CollegeWithMeta) {
    setSelectedCollege(college);
    setEditAssignedPaperIds(college.assignedPaperIds || []);
    setShowAssignModal(true);
  }

  async function handleSavePaperAssignment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedCollege) return;
    if (editAssignedPaperIds.length === 0) {
      setErrorMessage("Please select at least one question paper set for this college.");
      return;
    }

    try {
      setSubmitting(true);
      await api(`/colleges/${selectedCollege.id}/assign-papers`, {
        method: "POST",
        body: JSON.stringify({ paperIds: editAssignedPaperIds }),
      });

      setMessage(`Updated paper allocations for ${selectedCollege.name}.`);
      setShowAssignModal(false);
      await loadData();
      setTimeout(() => setMessage(""), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to assign papers.");
    } finally {
      setSubmitting(false);
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
      setErrorMessage(err.message || "Failed to delete college.");
    }
  }

  function handleCopyCode(code: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopyToast(`Copied College Code: ${code}`);
    setTimeout(() => setCopyToast(""), 3000);
  }

  function applyPreset(minM: number, maxM: number) {
    setTimingMinDuration(minM);
    setTimingMaxDuration(maxM);
  }

  function exportCollegesExcel() {
    downloadExcel(
      `Kaizentrix_Colleges_Directory_${new Date().toISOString().split("T")[0]}`,
      colleges,
      [
        { key: "name", label: "College Name" },
        { key: "code", label: "Unique College Code" },
        { key: "studentCount", label: "Enrolled Students", format: (v) => String(v || 0) },
        { key: "minDurationMinutes", label: "Min Attendance (Mins)", format: (v) => String(v || 30) },
        { key: "maxDurationMinutes", label: "Total Duration (Mins)", format: (v) => String(v || 60) },
        { key: "examStarted", label: "Start Permission Granted", format: (v) => (v ? "YES (LIVE)" : "NO (PAUSED)") },
        { key: "status", label: "Status" },
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
    <PortalShell role="MASTER_ADMIN">
      {/* Top Header */}
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
          <h1 style={{ fontSize: "1.75rem", margin: "0 0 0.35rem", color: "#0F172A", fontWeight: 800 }}>
            🏛️ College Management & Exam Control
          </h1>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.92rem", maxWidth: "750px", lineHeight: 1.5 }}>
            Configure college timing limits, grant start permission, approve student logins with 1-click, and manage question paper allocations.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={exportCollegesExcel}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}
          >
            📊 Export Directory
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenCreateModal}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "#2563EB",
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
            }}
          >
            <span>+ Create New College</span>
          </button>
        </div>
      </div>

      {/* Toast & Alert banners */}
      {message && (
        <div className="alert alert-success" style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{message}</span>
          <button type="button" onClick={() => setMessage("")} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>✕</button>
        </div>
      )}
      {errorMessage && (
        <div className="alert alert-error" style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage("")} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>✕</button>
        </div>
      )}
      {copyToast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#1E293B",
            color: "white",
            padding: "0.6rem 1.25rem",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
            zIndex: 9999,
            fontSize: "0.88rem",
            fontWeight: 600,
          }}
        >
          {copyToast}
        </div>
      )}

      {/* KPI Stats Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid #2563EB" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>Participating Colleges</span>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#1E3A8A", marginTop: "0.25rem" }}>{colleges.length}</div>
          <span style={{ fontSize: "0.78rem", color: "#2563EB" }}>Active registered campuses</span>
        </div>

        <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid #0284C7" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>Question Paper Sets</span>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0369A1", marginTop: "0.25rem" }}>{papers.length} Sets</div>
          <span style={{ fontSize: "0.78rem", color: "#0284C7" }}>Ready for college allocation</span>
        </div>

        <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid #059669" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>Allocated Papers</span>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#065F46", marginTop: "0.25rem" }}>{totalPaperAllocations}</div>
          <span style={{ fontSize: "0.78rem", color: "#059669" }}>Papers mapped to colleges</span>
        </div>

        <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid #7C3AED" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>Enrolled Candidates</span>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#5B21B6", marginTop: "0.25rem" }}>{totalEnrolledStudents}</div>
          <span style={{ fontSize: "0.78rem", color: "#7C3AED" }}>Mapped across all college codes</span>
        </div>

        <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid #F59E0B" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>Default Timing Rule</span>
          <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#B45309", marginTop: "0.25rem" }}>30m Min / 60m Max</div>
          <span style={{ fontSize: "0.78rem", color: "#D97706" }}>Locked early submission</span>
        </div>
      </div>

      {/* Main Roster Card */}
      <div className="card" style={{ padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border)" }}>
        {/* Search & Filter Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ position: "relative", minWidth: 320, flex: 1 }}>
            <input
              type="text"
              placeholder="Search colleges by name, code, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem 0.9rem",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                fontSize: "0.9rem",
              }}
            />
          </div>
          <span style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 }}>
            Showing {filteredColleges.length} of {colleges.length} colleges
          </span>
        </div>

        {/* Colleges Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
            Loading colleges and exam status…
          </div>
        ) : filteredColleges.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3.5rem 1rem", border: "1px dashed var(--border)", borderRadius: "8px" }}>
            <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>🏛️</span>
            <h3 style={{ margin: 0, color: "#1E3A8A" }}>No Colleges Found</h3>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "0.5rem 0 1.25rem" }}>
              {search ? "No colleges match your search query." : "No colleges registered yet."}
            </p>
            <button type="button" className="btn btn-primary" onClick={handleOpenCreateModal}>
              + Create First College
            </button>
          </div>
        ) : (
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table className="table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                  <th style={{ padding: "0.9rem 1rem", color: "#1E3A8A", fontWeight: 700, minWidth: "220px" }}>College & Access Code</th>
                  <th style={{ padding: "0.9rem 1rem", color: "#1E3A8A", fontWeight: 700, minWidth: "150px" }}>Exam Timing Policy</th>
                  <th style={{ padding: "0.9rem 1rem", color: "#1E3A8A", fontWeight: 700, minWidth: "160px" }}>Assigned Papers</th>
                  <th style={{ padding: "0.9rem 1rem", color: "#1E3A8A", fontWeight: 700, minWidth: "180px" }}>Students & Approvals</th>
                  <th style={{ padding: "0.9rem 1rem", color: "#1E3A8A", fontWeight: 700, minWidth: "210px", textAlign: "right" }}>Exam Control & Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredColleges.map((college) => {
                  const assignedList = college.assignedPapers || papers.filter((p) => college.assignedPaperIds?.includes(p.id));
                  const minDur = college.minDurationMinutes ?? 30;
                  const maxDur = college.maxDurationMinutes ?? 60;
                  const isLive = college.examStarted ?? true;
                  const studentCount = college.studentCount ?? 0;
                  const pendingCount = college.pendingStudentCount ?? 0;
                  const approvedCount = college.approvedStudentCount ?? Math.max(0, studentCount - pendingCount);

                  return (
                    <tr
                      key={college.id}
                      style={{
                        borderBottom: "1px solid #E2E8F0",
                        transition: "background 0.15s ease",
                      }}
                    >
                      {/* Column 1: College Name & Code */}
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: 800, color: "#0F172A", fontSize: "0.96rem", lineHeight: 1.3 }}>
                          {college.name}
                        </div>
                        {college.description ? (
                          <div style={{ fontSize: "0.78rem", color: "var(--muted)", margin: "0.2rem 0 0.4rem" }}>
                            {college.description}
                          </div>
                        ) : (
                          <div style={{ height: "0.3rem" }} />
                        )}
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontWeight: 700,
                              fontSize: "0.82rem",
                              letterSpacing: "0.06em",
                              background: "#EFF6FF",
                              color: "#1E40AF",
                              border: "1px solid #BFDBFE",
                              padding: "0.15rem 0.5rem",
                              borderRadius: "4px",
                            }}
                          >
                            {college.code}
                          </span>
                          <button
                            type="button"
                            title="Copy Code"
                            onClick={() => handleCopyCode(college.code)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "2px",
                              color: "#64748B",
                              fontSize: "0.85rem",
                            }}
                          >
                            📋
                          </button>
                        </div>
                      </td>

                      {/* Column 2: Timing Policy */}
                      <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                          <span
                            style={{
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              color: "#065F46",
                              background: "#ECFDF5",
                              border: "1px solid #A7F3D0",
                              padding: "0.2rem 0.55rem",
                              borderRadius: "5px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              width: "fit-content",
                            }}
                            title="Total exam duration before auto-submission"
                          >
                            <span>⌛</span>
                            <span>Total: <strong>{maxDur}m</strong></span>
                          </span>

                          <span
                            style={{
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              color: "#92400E",
                              background: "#FEF3C7",
                              border: "1px solid #FCD34D",
                              padding: "0.2rem 0.55rem",
                              borderRadius: "5px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              width: "fit-content",
                            }}
                            title="Compulsory minimum attendance before candidate can submit"
                          >
                            <span>🔒</span>
                            <span>Min Lock: <strong>{minDur}m</strong></span>
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Assigned Papers */}
                      <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", alignItems: "center" }}>
                          {assignedList.length === 0 ? (
                            <span style={{ fontSize: "0.78rem", color: "#DC2626", fontStyle: "italic" }}>
                              ⚠️ No papers
                            </span>
                          ) : (
                            assignedList.map((paper) => (
                              <span
                                key={paper.id}
                                title={paper.title}
                                style={{
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  background: "#F1F5F9",
                                  color: "#334155",
                                  border: "1px solid #CBD5E1",
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: "4px",
                                  fontFamily: "var(--font-mono)",
                                }}
                              >
                                {paper.code}
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
                            + Assign
                          </button>
                        </div>
                      </td>

                      {/* Column 4: Students & Approvals */}
                      <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E293B" }}>
                            👥 {studentCount} Enrolled
                          </div>

                          {studentCount === 0 ? (
                            <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>No students yet</span>
                          ) : pendingCount > 0 ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                              <span
                                style={{
                                  fontSize: "0.74rem",
                                  fontWeight: 700,
                                  color: "#B45309",
                                  background: "#FEF3C7",
                                  border: "1px solid #FCD34D",
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: "4px",
                                }}
                              >
                                ⏳ {pendingCount} Pending
                              </span>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => handleQuickApproveAll(college)}
                                style={{
                                  fontSize: "0.72rem",
                                  padding: "0.15rem 0.5rem",
                                  background: "#ECFDF5",
                                  color: "#065F46",
                                  borderColor: "#6EE7B7",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                                title="Approve all waiting students for this college now"
                              >
                                ⚡ Approve All
                              </button>
                            </div>
                          ) : (
                            <span
                              style={{
                                fontSize: "0.74rem",
                                fontWeight: 700,
                                color: "#065F46",
                                background: "#ECFDF5",
                                border: "1px solid #A7F3D0",
                                padding: "0.15rem 0.45rem",
                                borderRadius: "4px",
                                width: "fit-content",
                              }}
                            >
                              ✅ {approvedCount} Approved
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 5: Exam Control & Actions */}
                      <td style={{ padding: "1rem", textAlign: "right", verticalAlign: "middle" }}>
                        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem" }}>
                          {/* Live / Start Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleExamStartPermission(college)}
                            className="btn btn-sm"
                            style={{
                              fontSize: "0.8rem",
                              fontWeight: 800,
                              padding: "0.4rem 0.85rem",
                              borderRadius: "8px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              background: isLive ? "#FEF2F2" : "linear-gradient(135deg, #10B981, #059669)",
                              color: isLive ? "#B91C1C" : "#FFFFFF",
                              border: isLive ? "1.5px solid #FCA5A5" : "none",
                              boxShadow: isLive ? "none" : "0 3px 10px rgba(16, 185, 129, 0.35)",
                            }}
                            title={isLive ? "Click to Pause Exam (holds students in lobby)" : "Click to Start Exam & Authorize all waiting students"}
                          >
                            {isLive ? (
                              <>
                                <span>⏸️</span>
                                <span>Exam Live (Pause)</span>
                              </>
                            ) : (
                              <>
                                <span>🚀</span>
                                <span>Start Exam for Students</span>
                              </>
                            )}
                          </button>

                          {/* Secondary actions */}
                          <div style={{ display: "inline-flex", gap: "0.3rem", alignItems: "center" }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => handleOpenControlModal(college, "timing")}
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.25rem 0.55rem",
                                color: "#1E40AF",
                                borderColor: "#93C5FD",
                                background: "#EFF6FF",
                                fontWeight: 700,
                              }}
                              title="Configure timing limits, approvals roster, and details"
                            >
                              ⚙️ Timing & Control
                            </button>

                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleOpenControlModal(college, "details")}
                              title="Edit College Information"
                              style={{ fontSize: "0.75rem", padding: "0.25rem 0.45rem" }}
                            >
                              ✏️
                            </button>

                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleDeleteCollege(college)}
                              title="Delete College"
                              style={{ fontSize: "0.75rem", padding: "0.25rem 0.45rem", color: "#DC2626" }}
                            >
                              🗑️
                            </button>
                          </div>
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
      {/* UNIFIED MODAL: INSTITUTIONAL EXAM CONTROL & TIMING POLICY CENTER */}
      {/* ========================================================================= */}
      {showControlModal && selectedCollege && (
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
              maxWidth: 680,
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              border: "1px solid #BFDBFE",
              borderRadius: "14px",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ margin: 0, color: "#1E3A8A", fontSize: "1.35rem", fontWeight: 800 }}>
                  ⚙️ {selectedCollege.name}
                </h2>
                <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                  Institutional Code: <strong style={{ fontFamily: "var(--font-mono)", color: "#1E40AF" }}>{selectedCollege.code}</strong>
                </span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowControlModal(false)}
                style={{ fontSize: "1.2rem", padding: "0.2rem 0.5rem" }}
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                borderBottom: "1px solid var(--border)",
                marginBottom: "1.5rem",
              }}
            >
              <button
                type="button"
                onClick={() => setControlModalTab("timing")}
                style={{
                  padding: "0.6rem 1rem",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  borderBottom: controlModalTab === "timing" ? "3px solid #2563EB" : "3px solid transparent",
                  color: controlModalTab === "timing" ? "#2563EB" : "var(--muted)",
                }}
              >
                ⏱️ Exam Timing & Policy
              </button>
              <button
                type="button"
                onClick={() => setControlModalTab("approvals")}
                style={{
                  padding: "0.6rem 1rem",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  borderBottom: controlModalTab === "approvals" ? "3px solid #2563EB" : "3px solid transparent",
                  color: controlModalTab === "approvals" ? "#2563EB" : "var(--muted)",
                }}
              >
                👥 Enrolled Candidates ({collegeStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setControlModalTab("details")}
                style={{
                  padding: "0.6rem 1rem",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  borderBottom: controlModalTab === "details" ? "3px solid #2563EB" : "3px solid transparent",
                  color: controlModalTab === "details" ? "#2563EB" : "var(--muted)",
                }}
              >
                📝 College Details
              </button>
            </div>

            {/* TAB 1: TIMING & POLICY */}
            {controlModalTab === "timing" && (
              <form onSubmit={handleSaveTimingPolicy}>
                {/* Visual Workflow Banner */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #0F766E 0%, #065F46 100%)",
                    color: "white",
                    borderRadius: "10px",
                    padding: "1.25rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: "0.95rem", marginBottom: "0.3rem" }}>
                    📋 Institutional Timing & Submission Lock
                  </div>
                  <div style={{ fontSize: "0.82rem", opacity: 0.9, lineHeight: 1.5 }}>
                    Timer starts from actual server-recorded exam start time. Submissions are strictly locked until minimum duration has elapsed.
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "0.5rem",
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: "8px",
                      padding: "0.75rem",
                      marginTop: "0.75rem",
                      textAlign: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.7rem", opacity: 0.8, textTransform: "uppercase" }}>Exam Starts</div>
                      <strong style={{ fontSize: "0.95rem" }}>1:00 PM</strong>
                    </div>
                    <div style={{ borderLeft: "1px solid rgba(255,255,255,0.2)", borderRight: "1px solid rgba(255,255,255,0.2)" }}>
                      <div style={{ fontSize: "0.7rem", opacity: 0.8, textTransform: "uppercase" }}>Earliest Submit</div>
                      <strong style={{ fontSize: "0.95rem", color: "#FDE68A" }}>1:{timingMinDuration.toString().padStart(2, "0")} PM ({timingMinDuration}m)</strong>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.7rem", opacity: 0.8, textTransform: "uppercase" }}>Auto-Submits At</div>
                      <strong style={{ fontSize: "0.95rem" }}>2:00 PM ({timingMaxDuration}m)</strong>
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: "0.4rem" }}>
                    ⚡ Quick Duration Presets:
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => applyPreset(30, 60)}
                      style={{ fontSize: "0.78rem", fontWeight: 700, background: timingMinDuration === 30 && timingMaxDuration === 60 ? "#EFF6FF" : "white" }}
                    >
                      Standard (30m Min / 60m Max)
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => applyPreset(45, 90)}
                      style={{ fontSize: "0.78rem", fontWeight: 700, background: timingMinDuration === 45 && timingMaxDuration === 90 ? "#EFF6FF" : "white" }}
                    >
                      Medium (45m Min / 90m Max)
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => applyPreset(60, 120)}
                      style={{ fontSize: "0.78rem", fontWeight: 700, background: timingMinDuration === 60 && timingMaxDuration === 120 ? "#EFF6FF" : "white" }}
                    >
                      Full 2-Hour (60m Min / 120m Max)
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => applyPreset(15, 30)}
                      style={{ fontSize: "0.78rem", fontWeight: 700, background: timingMinDuration === 15 && timingMaxDuration === 30 ? "#EFF6FF" : "white" }}
                    >
                      Quick Quiz (15m Min / 30m Max)
                    </button>
                  </div>
                </div>

                {/* Inputs for Min and Max Duration */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div>
                    <label htmlFor="modal-min-dur" style={{ fontWeight: 700, color: "#92400E", fontSize: "0.88rem" }}>
                      Minimum Time Limit (Minutes) *
                    </label>
                    <input
                      id="modal-min-dur"
                      type="number"
                      min={1}
                      max={timingMaxDuration}
                      required
                      value={timingMinDuration}
                      onChange={(e) => setTimingMinDuration(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ width: "100%", padding: "0.6rem 0.85rem", fontSize: "1rem", fontWeight: 700 }}
                    />
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginTop: "0.25rem" }}>
                      🔒 Candidate cannot submit before {timingMinDuration} minutes.
                    </span>
                  </div>

                  <div>
                    <label htmlFor="modal-max-dur" style={{ fontWeight: 700, color: "#065F46", fontSize: "0.88rem" }}>
                      Maximum Total Duration (Minutes) *
                    </label>
                    <input
                      id="modal-max-dur"
                      type="number"
                      min={timingMinDuration}
                      max={480}
                      required
                      value={timingMaxDuration}
                      onChange={(e) => setTimingMaxDuration(Math.max(timingMinDuration, parseInt(e.target.value) || 60))}
                      style={{ width: "100%", padding: "0.6rem 0.85rem", fontSize: "1rem", fontWeight: 700 }}
                    />
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginTop: "0.25rem" }}>
                      ⌛ Exam is automatically submitted after {timingMaxDuration} minutes.
                    </span>
                  </div>
                </div>

                {/* Exam Start Permission Toggle */}
                <div
                  style={{
                    background: timingExamStarted ? "#F0FDF4" : "#FFFBEB",
                    border: timingExamStarted ? "1.5px solid #86EFAC" : "1.5px solid #FCD34D",
                    borderRadius: "10px",
                    padding: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={timingExamStarted}
                      onChange={(e) => setTimingExamStarted(e.target.checked)}
                      style={{ width: "20px", height: "20px", accentColor: "#10B981" }}
                    />
                    <div>
                      <strong style={{ fontSize: "0.92rem", color: timingExamStarted ? "#15803D" : "#B45309" }}>
                        🚀 Grant Exam Start Permission (Live Batch)
                      </strong>
                      <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.15rem" }}>
                        When enabled, candidates can immediately enter the live exam station from the lobby. If paused, candidates wait in lobby.
                      </div>
                    </div>
                  </label>
                </div>

                {/* Require Login Approval Toggle */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    padding: "1rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={timingRequireLoginApproval}
                      onChange={(e) => setTimingRequireLoginApproval(e.target.checked)}
                      style={{ width: "20px", height: "20px" }}
                    />
                    <div>
                      <strong style={{ fontSize: "0.92rem", color: "#1E293B" }}>
                        🛡️ Require Student Login Approval by Admin/Staff
                      </strong>
                      <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.15rem" }}>
                        Candidates must be approved before they can enter. Uncheck to allow instant entry upon registration.
                      </div>
                    </div>
                  </label>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowControlModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting} style={{ fontWeight: 700, padding: "0.65rem 1.5rem" }}>
                    {submitting ? "Saving Policy…" : "Save Timing & Policy →"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: ENROLLED CANDIDATES ROSTER */}
            {controlModalTab === "approvals" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#1E293B" }}>Enrolled Student Logins</h3>
                    <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                      {collegeStudents.length} candidates registered under {selectedCollege.code}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleQuickApproveAll(selectedCollege)}
                    style={{ background: "#059669", fontWeight: 700 }}
                  >
                    ✓ Approve All Students ({collegeStudents.filter((s) => !s.loginApproved).length} Pending)
                  </button>
                </div>

                {approvalMessage && (
                  <div className="alert alert-success" style={{ marginBottom: "1rem", fontSize: "0.85rem" }}>
                    {approvalMessage}
                  </div>
                )}

                {loadingStudents ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
                    Loading enrolled candidate roster…
                  </div>
                ) : collegeStudents.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2.5rem 1rem", border: "1px dashed var(--border)", borderRadius: "8px" }}>
                    <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
                      No students have logged in or registered under college code <strong>{selectedCollege.code}</strong> yet.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: "360px", overflowY: "auto" }}>
                    {collegeStudents.map((student) => (
                      <div
                        key={student.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "0.75rem 1rem",
                          borderRadius: "8px",
                          background: student.loginApproved ? "#F0FDF4" : "#FFFBEB",
                          border: student.loginApproved ? "1px solid #BBF7D0" : "1px solid #FDE68A",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0F172A" }}>
                            {student.fullName || "Candidate"}
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                            Roll: <code>{student.rollNumber || "N/A"}</code> • {student.email} • {student.phone}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          {student.loginApproved ? (
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#166534", background: "#DCFCE7", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                              ✓ APPROVED
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#B45309", background: "#FEF3C7", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                              ⏳ PENDING
                            </span>
                          )}

                          {student.loginApproved ? (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => handleRevokeStudent(student.id)}
                              style={{ fontSize: "0.72rem", color: "#DC2626", borderColor: "#FCA5A5" }}
                            >
                              Revoke
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleApproveStudent(student.id)}
                              style={{ fontSize: "0.72rem", background: "#10B981" }}
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowControlModal(false)}>
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: DETAILS */}
            {controlModalTab === "details" && (
              <form onSubmit={handleSaveDetails}>
                <div className="field" style={{ marginBottom: "1rem" }}>
                  <label htmlFor="edit-col-name" style={{ fontWeight: 600 }}>College / Institution Name *</label>
                  <input
                    id="edit-col-name"
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem 0.85rem" }}
                  />
                </div>

                <div className="field" style={{ marginBottom: "1rem" }}>
                  <label htmlFor="edit-col-code" style={{ fontWeight: 600 }}>Unique College Code * (Candidate Access Key)</label>
                  <input
                    id="edit-col-code"
                    type="text"
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    style={{ width: "100%", padding: "0.6rem 0.85rem", fontFamily: "var(--font-mono)", fontWeight: 700 }}
                  />
                </div>

                <div className="field" style={{ marginBottom: "1.5rem" }}>
                  <label htmlFor="edit-col-desc" style={{ fontWeight: 600 }}>Department / Campus Description</label>
                  <input
                    id="edit-col-desc"
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem 0.85rem" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowControlModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? "Saving…" : "Update Details →"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE COLLEGE */}
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
                  Enter the college name, unique access code, and allocate question papers.
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
                  onChange={(e) => setCreateName(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.85rem" }}
                />
              </div>

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
                    Unique College Code * (Candidate Access Key)
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
                    ⚡ Auto-Generate Code
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
              </div>

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

              {/* Timing settings */}
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
                    Exam Duration & Submission Lock Limits
                  </strong>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.85rem" }}>
                  <div>
                    <label htmlFor="create-min-dur" style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#134E4A", marginBottom: "0.25rem" }}>
                      Min Duration (Mins) *
                    </label>
                    <input
                      id="create-min-dur"
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
                    <label htmlFor="create-max-dur" style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#134E4A", marginBottom: "0.25rem" }}>
                      Max Duration (Mins) *
                    </label>
                    <input
                      id="create-max-dur"
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
                  </div>
                </label>
              </div>

              {/* Assign Papers */}
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  padding: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <label style={{ fontWeight: 700, color: "#1E293B", fontSize: "0.88rem", display: "block", marginBottom: "0.5rem" }}>
                  📚 Assign Question Papers *
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "160px", overflowY: "auto" }}>
                  {papers.map((paper) => {
                    const isChecked = createAssignedPaperIds.includes(paper.id);
                    return (
                      <label
                        key={paper.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.6rem",
                          padding: "0.4rem 0.6rem",
                          borderRadius: "4px",
                          background: isChecked ? "#EFF6FF" : "white",
                          border: isChecked ? "1px solid #93C5FD" : "1px solid #E2E8F0",
                          cursor: "pointer",
                          fontSize: "0.84rem",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCreatePaper(paper.id)}
                        />
                        <span style={{ flex: 1, fontWeight: 600 }}>{paper.title} ({paper.code})</span>
                        <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{paper.durationMinutes}m</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ fontWeight: 700 }}>
                  {submitting ? "Creating…" : "Save & Register College →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN PAPERS */}
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
              maxWidth: 540,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #BFDBFE",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ margin: 0, color: "#1E3A8A", fontSize: "1.3rem" }}>
                📑 Assign Question Papers
              </h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowAssignModal(false)}
                style={{ fontSize: "1.2rem", padding: "0.2rem 0.5rem" }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--muted)" }}>
              Manage assigned question paper sets for <strong>{selectedCollege.name}</strong> ({selectedCollege.code}).
            </p>

            <form onSubmit={handleSavePaperAssignment}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {papers.map((paper) => {
                  const isChecked = editAssignedPaperIds.includes(paper.id);
                  return (
                    <label
                      key={paper.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "6px",
                        background: isChecked ? "#EFF6FF" : "white",
                        border: isChecked ? "1px solid #93C5FD" : "1px solid #E2E8F0",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleEditPaper(paper.id)}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <strong style={{ fontSize: "0.88rem" }}>{paper.title}</strong>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", fontWeight: 700, color: "#1E40AF" }}>
                            {paper.code}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                          {paper.durationMinutes} Minutes • Pass {paper.passPercent}%
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving…" : "Save Allocation →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalShell>
  );
}

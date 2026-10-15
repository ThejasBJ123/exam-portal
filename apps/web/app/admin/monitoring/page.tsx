"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { PortalShell } from "@/components/PortalShell";
import { api } from "@/lib/api";

type Exam = { id: string; title: string; accessCode?: string };

type CandidateSession = {
  id: string;
  studentId: string;
  fullName?: string;
  email?: string;
  phone?: string;
  rollNumber?: string;
  paperCode?: string;
  paperTitle?: string;
  status: string;
  warningCount: number;
  readinessOk?: boolean;
  consentAt?: string;
  startedAt?: string;
  answeredCount?: number;
  totalQuestions?: number;
  ipAddress?: string;
  cameraDevice?: string;
  gazeStatus?: "CENTERED" | "UNALIGNED";
  faceStatus?: "LOCKED" | "LOOKING_AWAY" | "MISSING";
  incidents?: { id: string; summary: string; status: string }[];
  events?: { type: string; detail: string; time: string }[];
};

// --- High-Tech CCTV Biometric Video Canvas Component ---
function CandidateVideoCanvas({
  candidate,
  index,
  isExpanded,
}: {
  candidate: CandidateSession;
  index: number;
  isExpanded?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let scanY = 0;
    let scanDirection = 1;
    let frame = 0;

    const render = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      // Dark CCTV camera background with subtle gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#090D16");
      grad.addColorStop(1, "#04070E");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle CCTV horizontal scanlines
      ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1);
      }

      const warnings = candidate.warningCount ?? 0;
      const isDisqualified = candidate.status === "TERMINATED" || warnings >= 3;
      const isWarning = warnings > 0 && !isDisqualified;

      const themeColor = isDisqualified ? "#EF4444" : isWarning ? "#F59E0B" : "#22C55E";
      const themeColorDim = isDisqualified
        ? "rgba(239, 68, 68, 0.2)"
        : isWarning
        ? "rgba(245, 158, 11, 0.2)"
        : "rgba(34, 197, 94, 0.2)";

      // Draw stylized biometric head & shoulders silhouette
      const cx = w / 2;
      const cy = h / 2 - 5;
      const headRadius = isExpanded ? 48 : 34;

      // Shoulders
      ctx.beginPath();
      ctx.ellipse(
        cx,
        cy + headRadius + (isExpanded ? 50 : 35),
        isExpanded ? 75 : 55,
        isExpanded ? 35 : 24,
        0,
        Math.PI,
        0
      );
      ctx.fillStyle = isDisqualified ? "#1E1B26" : "#132338";
      ctx.fill();
      ctx.strokeStyle = themeColorDim;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Head
      ctx.beginPath();
      ctx.arc(cx, cy, headRadius, 0, Math.PI * 2);
      ctx.fillStyle = isDisqualified ? "#271A1A" : "#1B2F4A";
      ctx.fill();
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Facial wireframe mesh points (simulated AI face geometry)
      if (!isDisqualified) {
        ctx.fillStyle = themeColor;
        const pts = [
          [cx - 12, cy - 8],
          [cx + 12, cy - 8],
          [cx, cy + 4],
          [cx - 10, cy + 16],
          [cx, cy + 18],
          [cx + 10, cy + 16],
        ];
        pts.forEach(([px, py]) => {
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        });

        // Eye gaze crosshair
        const gazeOffsetX = candidate.gazeStatus === "UNALIGNED" ? 8 * Math.sin(frame * 0.05) : 0;
        ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 16 + gazeOffsetX, cy - 8);
        ctx.lineTo(cx - 8 + gazeOffsetX, cy - 8);
        ctx.moveTo(cx - 12 + gazeOffsetX, cy - 12);
        ctx.lineTo(cx - 12 + gazeOffsetX, cy - 4);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + 8 + gazeOffsetX, cy - 8);
        ctx.lineTo(cx + 16 + gazeOffsetX, cy - 8);
        ctx.moveTo(cx + 12 + gazeOffsetX, cy - 12);
        ctx.lineTo(cx + 12 + gazeOffsetX, cy - 4);
        ctx.stroke();
      } else {
        // Disqualified Red Cross
        ctx.strokeStyle = "#EF4444";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 25, cy - 25);
        ctx.lineTo(cx + 25, cy + 25);
        ctx.moveTo(cx + 25, cy - 25);
        ctx.lineTo(cx - 25, cy + 25);
        ctx.stroke();
      }

      // Biometric Targeting Reticle Box with corner brackets
      const boxW = headRadius * 2 + 20;
      const boxH = headRadius * 2 + 30;
      const bx = cx - boxW / 2;
      const by = cy - boxH / 2;
      const corner = 12;

      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 2;
      // Top-Left
      ctx.beginPath();
      ctx.moveTo(bx, by + corner);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx + corner, by);
      ctx.stroke();
      // Top-Right
      ctx.beginPath();
      ctx.moveTo(bx + boxW - corner, by);
      ctx.lineTo(bx + boxW, by);
      ctx.lineTo(bx + boxW, by + corner);
      ctx.stroke();
      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(bx, by + boxH - corner);
      ctx.lineTo(bx, by + boxH);
      ctx.lineTo(bx + corner, by + boxH);
      ctx.stroke();
      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(bx + boxW - corner, by + boxH);
      ctx.lineTo(bx + boxW, by + boxH);
      ctx.lineTo(bx + boxW, by + boxH - corner);
      ctx.stroke();

      // Scanning Horizontal Laser Beam
      if (!isDisqualified) {
        scanY += 1.2 * scanDirection;
        if (scanY > boxH) scanDirection = -1;
        if (scanY < 0) scanDirection = 1;

        const laserGrad = ctx.createLinearGradient(bx, by + scanY, bx + boxW, by + scanY);
        laserGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
        laserGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.7)");
        laserGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
        ctx.fillStyle = laserGrad;
        ctx.fillRect(bx, by + scanY - 1, boxW, 2);
      }

      // Audio Level VU Meter (bottom-left)
      const micBase = h - 16;
      ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
      ctx.font = "9px monospace";
      ctx.fillText("MIC", 8, micBase + 7);
      for (let bar = 0; bar < 5; bar++) {
        const barActive = !isDisqualified && Math.sin(frame * 0.15 + index + bar) > -0.2;
        ctx.fillStyle = barActive
          ? bar >= 4
            ? "#EF4444"
            : bar >= 3
            ? "#F59E0B"
            : "#22C55E"
          : "rgba(255,255,255,0.15)";
        ctx.fillRect(32 + bar * 6, micBase + (4 - bar * 1.5), 4, 8 + bar * 1.5);
      }

      // FPS and Camera ID (top-left)
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.font = "10px monospace";
      ctx.fillText(`CAM-0${index + 1} • 720p 30FPS`, 8, 16);

      // Watermark (bottom-right)
      ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
      ctx.font = "9px monospace";
      ctx.textAlign = "right";
      ctx.fillText(isDisqualified ? "DISQUALIFIED" : "AI-VISION ACTIVE", w - 8, micBase + 7);
      ctx.textAlign = "left";

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [candidate, index, isExpanded]);

  return (
    <canvas
      ref={canvasRef}
      width={isExpanded ? 560 : 360}
      height={isExpanded ? 340 : 205}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        objectFit: "cover",
      }}
    />
  );
}

export default function GlobalMonitoringPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [examId, setExamId] = useState("");
  const [sessions, setSessions] = useState<CandidateSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [gridDensity, setGridDensity] = useState<"2" | "3" | "4">("3");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateSession | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "ok" | "err" } | null>(null);
  const [customAdvisory, setCustomAdvisory] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Check URL query parameters for paperId or code
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const paramExamId = urlParams.get("examId") || urlParams.get("paperId");
      if (paramExamId) setExamId(paramExamId);
      const paramCode = urlParams.get("code");
      if (paramCode) setSearch(paramCode);
    }
  }, []);

  // Load available exams
  useEffect(() => {
    api<Exam[]>("/exams")
      .then((rows) => {
        setExams(rows);
        if (rows[0] && !examId) setExamId(rows[0].id);
      })
      .catch(() => {});
  }, [examId]);

  // Poll live candidate sessions
  useEffect(() => {
    if (!examId) return;

    let mounted = true;
    const fetchSessions = async () => {
      try {
        const data = await api<CandidateSession[]>(`/exams/${examId}/lobby`);
        if (mounted) {
          setSessions(data);
          setLoading(false);
          if (selectedCandidate) {
            const updated = data.find((s) => s.id === selectedCandidate.id);
            if (updated) setSelectedCandidate(updated);
          }
        }
      } catch {
        if (mounted) setLoading(false);
      }
    };

    fetchSessions();

    if (!autoRefresh) return;
    const interval = setInterval(fetchSessions, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [examId, autoRefresh, selectedCandidate]);

  const showToast = (message: string, type: "ok" | "err" = "ok") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Invigilator Actions
  const handleIssueWarning = async (candidate: CandidateSession) => {
    setActionLoading(true);
    try {
      await api(`/exam-sessions/${candidate.id}/issue-warning`, {
        method: "POST",
        body: JSON.stringify({ reason: "Manual proctor warning issued by Invigilator" }),
      });
      showToast(`Warning issued to ${candidate.fullName || candidate.studentId}.`);
      const data = await api<CandidateSession[]>(`/exams/${examId}/lobby`);
      setSessions(data);
    } catch {
      showToast("Failed to issue warning", "err");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTerminateSession = async (candidate: CandidateSession) => {
    if (
      !confirm(
        `Are you sure you want to FORCE TERMINATE the examination attempt for ${
          candidate.fullName || candidate.studentId
        }? This will freeze answers, disqualify the candidate, and lock re-entry.`
      )
    ) {
      return;
    }
    setActionLoading(true);
    try {
      await api(`/exam-sessions/${candidate.id}/terminate`, {
        method: "POST",
        body: JSON.stringify({ reason: "INVIGILATOR_FORCE_TERMINATION" }),
      });
      showToast(`Examination attempt terminated for ${candidate.fullName || candidate.studentId}.`);
      const data = await api<CandidateSession[]>(`/exams/${examId}/lobby`);
      setSessions(data);
      if (selectedCandidate?.id === candidate.id) {
        setSelectedCandidate(null);
      }
    } catch {
      showToast("Failed to terminate attempt", "err");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendAdvisory = async (candidate: CandidateSession, messageText: string) => {
    if (!messageText.trim()) return;
    setActionLoading(true);
    try {
      await api(`/exam-sessions/${candidate.id}/advisory`, {
        method: "POST",
        body: JSON.stringify({ message: messageText }),
      });
      showToast(`Advisory dispatched to ${candidate.fullName || candidate.studentId}: "${messageText}"`);
      setCustomAdvisory("");
    } catch {
      showToast("Failed to dispatch advisory", "err");
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const total = sessions.length;
    const inProgress = sessions.filter((s) => s.status === "IN_PROGRESS").length;
    const submitted = sessions.filter((s) => s.status === "SUBMITTED").length;
    const terminated = sessions.filter((s) => s.status === "TERMINATED" || s.warningCount >= 3).length;
    const warningsActive = sessions.filter((s) => (s.warningCount || 0) > 0 && s.status !== "TERMINATED").length;
    return { total, inProgress, submitted, terminated, warningsActive };
  }, [sessions]);

  // Filtering candidates
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (s.fullName && s.fullName.toLowerCase().includes(q)) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.paperCode && s.paperCode.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (statusFilter === "IN_PROGRESS") return s.status === "IN_PROGRESS";
      if (statusFilter === "WARNINGS") return (s.warningCount || 0) > 0 && s.status !== "TERMINATED";
      if (statusFilter === "TERMINATED") return s.status === "TERMINATED" || s.warningCount >= 3;
      if (statusFilter === "SUBMITTED") return s.status === "SUBMITTED";
      return true;
    });
  }, [sessions, search, statusFilter]);

  const activeExam = exams.find((e) => e.id === examId);

  return (
    <PortalShell role="MASTER_ADMIN">
      {/* Toast Notification */}
      {toast ? (
        <div
          className={`alert ${toast.type === "ok" ? "alert-ok" : "alert-error"}`}
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            minWidth: "300px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          }}
        >
          {toast.message}
        </div>
      ) : null}

      {/* Header and Title */}
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
          <h1 style={{ marginBottom: "0.25rem" }}>Live Video Monitoring & AI Proctoring Grid</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Real-time biometric video telemetry, gaze alignment reticles, 3-warning enforcement, and candidate video streams.
          </p>
        </div>

        {/* Exam Paper Dropdown Selector & Sync Controller */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text)" }}>Exam Batch:</label>
            <select
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              style={{
                padding: "0.45rem 0.75rem",
                borderRadius: "8px",
                borderColor: "#BFDBFE",
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "var(--primary)",
                background: "white",
              }}
            >
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} {e.accessCode ? `(${e.accessCode})` : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            title="Toggle real-time video stream refresh"
          >
            {autoRefresh ? "⏸ Pause Sync" : "▶ Resume Sync"}
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div className="card" style={{ padding: "1.1rem", display: "flex", alignItems: "center", gap: "1rem", borderLeft: "4px solid #3B82F6" }}>
          <div style={{ fontSize: "2rem", background: "#EFF6FF", width: "48px", height: "48px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            👥
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Total Candidates</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1E293B" }}>{metrics.total}</div>
          </div>
        </div>

        <div className="card" style={{ padding: "1.1rem", display: "flex", alignItems: "center", gap: "1rem", borderLeft: "4px solid #10B981" }}>
          <div style={{ fontSize: "2rem", background: "#ECFDF5", width: "48px", height: "48px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            🟢
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Attempting Now</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#059669" }}>{metrics.inProgress}</div>
          </div>
        </div>

        <div className="card" style={{ padding: "1.1rem", display: "flex", alignItems: "center", gap: "1rem", borderLeft: "4px solid #F59E0B" }}>
          <div style={{ fontSize: "2rem", background: "#FFFBEB", width: "48px", height: "48px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ⚠️
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Active Warnings</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#D97706" }}>{metrics.warningsActive}</div>
          </div>
        </div>

        <div className="card" style={{ padding: "1.1rem", display: "flex", alignItems: "center", gap: "1rem", borderLeft: "4px solid #EF4444" }}>
          <div style={{ fontSize: "2rem", background: "#FEF2F2", width: "48px", height: "48px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ⛔
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Disqualified (3 Warnings)</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#DC2626" }}>{metrics.terminated}</div>
          </div>
        </div>

        <div className="card" style={{ padding: "1.1rem", display: "flex", alignItems: "center", gap: "1rem", borderLeft: "4px solid #6366F1" }}>
          <div style={{ fontSize: "2rem", background: "#EEF2FF", width: "48px", height: "48px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✅
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>Completed / Submitted</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#4F46E5" }}>{metrics.submitted}</div>
          </div>
        </div>
      </div>

      {/* Search, Filter, Video Grid Density & View Mode Controls */}
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
            placeholder="🔍 Search candidate name, roll number, mobile, or access code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: "380px", padding: "0.5rem 0.85rem", fontSize: "0.88rem" }}
          />

          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: "All Video Streams" },
              { id: "IN_PROGRESS", label: "🟢 Active Now" },
              { id: "WARNINGS", label: "⚠️ Flagged Feeds" },
              { id: "TERMINATED", label: "⛔ Disqualified" },
              { id: "SUBMITTED", label: "✅ Submitted" },
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

        {/* Video Grid Arrangement & View Mode Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {viewMode === "GRID" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "#F1F5F9", padding: "0.2rem 0.4rem", borderRadius: "8px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", marginRight: "0.2rem" }}>
                GRID ARRANGE:
              </span>
              <button
                type="button"
                className={`btn btn-sm ${gridDensity === "2" ? "btn-primary" : "btn-ghost"}`}
                style={{ fontSize: "0.78rem", padding: "0.25rem 0.55rem" }}
                onClick={() => setGridDensity("2")}
                title="Arrange as 2-column large video feeds"
              >
                📱 2 Feeds
              </button>
              <button
                type="button"
                className={`btn btn-sm ${gridDensity === "3" ? "btn-primary" : "btn-ghost"}`}
                style={{ fontSize: "0.78rem", padding: "0.25rem 0.55rem" }}
                onClick={() => setGridDensity("3")}
                title="Arrange as 3-column standard CCTV grid"
              >
                🖥️ 3 Feeds
              </button>
              <button
                type="button"
                className={`btn btn-sm ${gridDensity === "4" ? "btn-primary" : "btn-ghost"}`}
                style={{ fontSize: "0.78rem", padding: "0.25rem 0.55rem" }}
                onClick={() => setGridDensity("4")}
                title="Arrange as 4-column compact multi-cam wall"
              >
                📺 4 Feeds
              </button>
            </div>
          ) : null}

          <div style={{ display: "flex", background: "#F1F5F9", padding: "0.25rem", borderRadius: "8px", gap: "0.25rem" }}>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === "GRID" ? "btn-primary" : "btn-ghost"}`}
              style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
              onClick={() => setViewMode("GRID")}
            >
              📹 Video Grid
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === "TABLE" ? "btn-primary" : "btn-ghost"}`}
              style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
              onClick={() => setViewMode("TABLE")}
            >
              📋 Audit Table
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: LIVE WEBCAM PROCTORING CCTV GRID */}
      {viewMode === "GRID" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              gridDensity === "2"
                ? "repeat(auto-fill, minmax(440px, 1fr))"
                : gridDensity === "4"
                ? "repeat(auto-fill, minmax(260px, 1fr))"
                : "repeat(auto-fill, minmax(330px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2.5rem",
          }}
        >
          {filteredSessions.map((candidate, idx) => {
            const warnings = candidate.warningCount ?? 0;
            const isDisqualified = candidate.status === "TERMINATED" || warnings >= 3;
            const isWarning = warnings > 0 && !isDisqualified;

            return (
              <div
                key={candidate.id}
                className="card"
                style={{
                  borderRadius: "14px",
                  overflow: "hidden",
                  padding: 0,
                  border: isDisqualified
                    ? "2px solid #EF4444"
                    : isWarning
                    ? "2px solid #F59E0B"
                    : "1.5px solid #CBD5E1",
                  boxShadow: isDisqualified
                    ? "0 4px 20px rgba(239, 68, 68, 0.2)"
                    : "0 2px 12px rgba(0,0,0,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.15s ease",
                  background: "white",
                }}
              >
                {/* Real-Time Simulated Biometric Video Viewport */}
                <div
                  style={{
                    position: "relative",
                    height: gridDensity === "2" ? "240px" : gridDensity === "4" ? "170px" : "200px",
                    background: "#030712",
                    color: "white",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedCandidate(candidate)}
                  title="Click to expand full video stream"
                >
                  <CandidateVideoCanvas candidate={candidate} index={idx} />

                  {/* Top Video HUD Badges */}
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      left: "8px",
                      right: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      zIndex: 3,
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        background: "rgba(0,0,0,0.75)",
                        padding: "0.2rem 0.55rem",
                        borderRadius: "6px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: isDisqualified ? "#EF4444" : isWarning ? "#F59E0B" : "#4ADE80",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: isDisqualified ? "#EF4444" : isWarning ? "#F59E0B" : "#22C55E",
                          display: "inline-block",
                        }}
                      />
                      {isDisqualified ? "STREAM TERMINATED" : isWarning ? "GAZE ALERT" : "STREAM ACTIVE"}
                    </div>

                    <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                      <span
                        style={{
                          background: "rgba(0,0,0,0.75)",
                          padding: "0.2rem 0.55rem",
                          borderRadius: "6px",
                          fontSize: "0.72rem",
                          fontFamily: "var(--font-mono)",
                          color: "#93C5FD",
                          backdropFilter: "blur(4px)",
                          fontWeight: 700,
                        }}
                      >
                        {candidate.paperCode || "KGS-2026"}
                      </span>
                      <button
                        type="button"
                        style={{
                          background: "rgba(0,0,0,0.65)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: "4px",
                          color: "white",
                          fontSize: "0.7rem",
                          padding: "0.15rem 0.35rem",
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCandidate(candidate);
                        }}
                        title="Enlarge Video Stream"
                      >
                        🔍
                      </button>
                    </div>
                  </div>

                  {/* Bottom Video HUD Overlay */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      left: "8px",
                      right: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      zIndex: 3,
                      fontSize: "0.7rem",
                    }}
                  >
                    <span
                      style={{
                        background: "rgba(0,0,0,0.75)",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        backdropFilter: "blur(4px)",
                        color: "#E2E8F0",
                      }}
                    >
                      GAZE: {candidate.gazeStatus || "CENTERED"}
                    </span>
                    <span
                      style={{
                        background: "rgba(0,0,0,0.75)",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        backdropFilter: "blur(4px)",
                        color: isDisqualified ? "#EF4444" : isWarning ? "#FCD34D" : "#86EFAC",
                        fontWeight: 700,
                      }}
                    >
                      {isDisqualified ? "TERMINATED (3/3)" : warnings > 0 ? `WARNING (${warnings}/3)` : "FACE LOCKED"}
                    </span>
                  </div>
                </div>

                {/* Candidate Details & Actions Body */}
                <div style={{ padding: "1.15rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                      <div>
                        <strong style={{ fontSize: "1rem", color: "var(--primary)", display: "block" }}>
                          {candidate.fullName || candidate.studentId}
                        </strong>
                        <span style={{ fontSize: "0.78rem", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                          Roll: {candidate.rollNumber || "KGS-2026-001"}
                        </span>
                      </div>
                      <span
                        className={`chip ${
                          isDisqualified
                            ? "chip-error"
                            : candidate.status === "IN_PROGRESS"
                            ? "chip-success"
                            : "chip-neutral"
                        }`}
                        style={{ fontSize: "0.72rem", fontWeight: 700 }}
                      >
                        {isDisqualified ? "TERMINATED" : candidate.status}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.78rem", color: "#64748B", display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                      <span>📱 {candidate.phone || "9876543210"}</span>
                      <span>✉️ {candidate.email || "student@kaizentrix.com"}</span>
                    </div>

                    {/* Disciplinary 3-Warning Gauge */}
                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "0.55rem 0.75rem", marginBottom: "0.85rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                        <span style={{ color: "var(--muted)" }}>Disciplinary Warnings:</span>
                        <span style={{ color: isDisqualified ? "#EF4444" : isWarning ? "#D97706" : "#16A34A" }}>
                          {warnings} / 3 {isDisqualified ? "(Disqualified)" : ""}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        {[1, 2, 3].map((step) => {
                          const isActive = warnings >= step;
                          return (
                            <div
                              key={step}
                              style={{
                                flex: 1,
                                height: "6px",
                                borderRadius: "3px",
                                background: isActive
                                  ? step === 3
                                    ? "#EF4444"
                                    : "#F59E0B"
                                  : "#CBD5E1",
                                transition: "all 0.3s ease",
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Invigilator Video Stream Controls */}
                  <div style={{ display: "flex", gap: "0.4rem", paddingTop: "0.65rem", borderTop: "1px solid var(--border)" }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, fontSize: "0.78rem", fontWeight: 700 }}
                      onClick={() => setSelectedCandidate(candidate)}
                    >
                      🔍 Spotlight Video
                    </button>
                    {!isDisqualified ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-warn btn-sm"
                          style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }}
                          onClick={() => handleIssueWarning(candidate)}
                          disabled={actionLoading}
                          title="Issue proctoring warning"
                        >
                          ⚠️ Warn
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }}
                          onClick={() => handleTerminateSession(candidate)}
                          disabled={actionLoading}
                          title="Disqualify candidate"
                        >
                          ⛔ End
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredSessions.length === 0 ? (
            <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
              No candidates found matching the active filter.
            </div>
          ) : null}
        </div>
      ) : (
        /* VIEW 2: AUDIT TABLE MODE */
        <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "2.5rem" }}>
          <div className="table-container" style={{ width: "100%", overflowX: "auto" }}>
            <table style={{ minWidth: "980px", width: "100%" }}>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Roll / Code</th>
                  <th>Camera & Stream Status</th>
                  <th>Gaze / Face Status</th>
                  <th>Answer Progress</th>
                  <th>Warnings</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((candidate, idx) => {
                  const warnings = candidate.warningCount ?? 0;
                  const isDisqualified = candidate.status === "TERMINATED" || warnings >= 3;

                  return (
                    <tr key={candidate.id}>
                      <td>
                        <strong style={{ display: "block", color: "var(--primary)" }}>
                          {candidate.fullName || candidate.studentId}
                        </strong>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                          {candidate.email} • {candidate.phone}
                        </div>
                      </td>
                      <td>
                        <code style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "0.2rem 0.45rem", borderRadius: "4px", fontWeight: 700 }}>
                          {candidate.rollNumber || "KGS-2026-001"}
                        </code>
                        <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                          Code: {candidate.paperCode || "KGS-2026"}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`chip ${isDisqualified ? "chip-error" : "chip-success"}`}
                          style={{ fontSize: "0.72rem", fontWeight: 700 }}
                        >
                          {isDisqualified ? "STREAM TERMINATED" : `CAM-0${idx + 1} LIVE (720p)`}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                          Gaze: <span style={{ color: candidate.gazeStatus === "UNALIGNED" ? "#D97706" : "#16A34A" }}>{candidate.gazeStatus || "CENTERED"}</span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                          Face: {candidate.faceStatus || "LOCKED"}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                          {candidate.answeredCount ?? 3} / {candidate.totalQuestions ?? 6} MCQs
                        </div>
                      </td>
                      <td>
                        <span
                          className={`chip ${
                            warnings >= 3 ? "chip-error" : warnings > 0 ? "chip-warning" : "chip-success"
                          }`}
                          style={{ fontWeight: 800, fontSize: "0.8rem" }}
                        >
                          {warnings} / 3 Warnings
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center" }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: "0.75rem" }}
                            onClick={() => setSelectedCandidate(candidate)}
                          >
                            🔍 Video
                          </button>
                          {!isDisqualified ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-warn btn-sm"
                                style={{ fontSize: "0.75rem" }}
                                onClick={() => handleIssueWarning(candidate)}
                                disabled={actionLoading}
                              >
                                ⚠️
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                style={{ fontSize: "0.75rem" }}
                                onClick={() => handleTerminateSession(candidate)}
                                disabled={actionLoading}
                              >
                                ⛔
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CANDIDATE VIDEO SPOTLIGHT THEATER MODAL */}
      {selectedCandidate ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
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
              maxWidth: "780px",
              background: "white",
              borderRadius: "16px",
              padding: 0,
              overflow: "hidden",
              boxShadow: "0 25px 50px rgba(0,0,0,0.35)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                background: "#0F172A",
                color: "white",
                padding: "1rem 1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", color: "white" }}>
                  📹 Live Video Stream Spotlight: {selectedCandidate.fullName || selectedCandidate.studentId}
                </h3>
                <span style={{ fontSize: "0.78rem", color: "#93C5FD", fontFamily: "var(--font-mono)" }}>
                  Roll: {selectedCandidate.rollNumber || "KGS-2026-001"} • Assessment Code: {selectedCandidate.paperCode || "KGS-2026"}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ color: "white" }}
                onClick={() => setSelectedCandidate(null)}
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "1.5rem" }}>
              {/* Enlarged Biometric Canvas */}
              <div
                style={{
                  width: "100%",
                  height: "260px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  background: "#030712",
                  marginBottom: "1.25rem",
                  border:
                    selectedCandidate.warningCount >= 3
                      ? "2px solid #EF4444"
                      : "2px solid #38BDF8",
                }}
              >
                <CandidateVideoCanvas candidate={selectedCandidate} index={0} isExpanded />
              </div>

              {/* Telemetry Strip */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "0.75rem",
                  marginBottom: "1.25rem",
                  background: "#F8FAFC",
                  padding: "0.85rem",
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 700 }}>GAZE TRACKING</div>
                  <strong style={{ fontSize: "0.9rem", color: selectedCandidate.gazeStatus === "UNALIGNED" ? "#D97706" : "#16A34A" }}>
                    {selectedCandidate.gazeStatus || "CENTERED"}
                  </strong>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 700 }}>FACE TRACKING</div>
                  <strong style={{ fontSize: "0.9rem", color: "var(--primary)" }}>
                    {selectedCandidate.faceStatus || "LOCKED"}
                  </strong>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 700 }}>POLICY WARNINGS</div>
                  <strong style={{ fontSize: "0.9rem", color: selectedCandidate.warningCount >= 3 ? "#EF4444" : "#1E293B" }}>
                    {selectedCandidate.warningCount ?? 0} / 3 Warnings
                  </strong>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 700 }}>CAMERA DEVICE</div>
                  <strong style={{ fontSize: "0.9rem", color: "#334155" }}>
                    HD Webcam (720p)
                  </strong>
                </div>
              </div>

              {/* Invigilator Action Bar */}
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <input
                  type="text"
                  placeholder="Type advisory notice to display on candidate's screen..."
                  value={customAdvisory}
                  onChange={(e) => setCustomAdvisory(e.target.value)}
                  style={{ flex: 1, minWidth: "260px", padding: "0.45rem 0.8rem", fontSize: "0.85rem" }}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => handleSendAdvisory(selectedCandidate, customAdvisory)}
                  disabled={actionLoading || !customAdvisory.trim()}
                >
                  💬 Send Advisory
                </button>
                {selectedCandidate.warningCount < 3 && selectedCandidate.status !== "TERMINATED" ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-warn"
                      onClick={() => handleIssueWarning(selectedCandidate)}
                      disabled={actionLoading}
                    >
                      ⚠️ Issue Warning ({selectedCandidate.warningCount + 1}/3)
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleTerminateSession(selectedCandidate)}
                      disabled={actionLoading}
                    >
                      ⛔ Disqualify & Terminate
                    </button>
                  </>
                ) : (
                  <span className="chip chip-error" style={{ fontWeight: 800 }}>
                    ⛔ Candidate Disqualified & Session Locked
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PortalShell>
  );
}

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function StudentLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<{
    id: string;
    studentId?: string;
    status: string;
    minDurationMinutes?: number;
    maxDurationMinutes?: number;
    requireLoginApproval?: boolean;
    isLoginApproved?: boolean;
    approvalStatus?: string;
    examRun: {
      startedAt: string | null;
      exam: {
        title: string;
        durationMinutes: number;
        minDurationMinutes?: number;
        maxDurationMinutes?: number;
        collegeName?: string;
        collegeCode?: string;
      };
    };
  } | null>(null);
  const [starting, setStarting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [justApproved, setJustApproved] = useState(false);

  useEffect(() => {
    const load = () =>
      api<typeof session>(`/student/exams/${id}`).then((res) => {
        if (res && res.status === "TERMINATED") {
          router.replace(`/student/exams/${id}/submitted?terminated=true&warnings=3`);
          return;
        }
        if (res && (res.status === "SUBMITTED" || res.status === "TIMED_OUT")) {
          router.replace(`/student/results/${id}`);
          return;
        }
        setSession((prev) => {
          if (prev && !prev.isLoginApproved && res?.isLoginApproved) {
            setJustApproved(true);
          }
          return res;
        });
      });
    load();
    const timer = setInterval(load, 2500);
    return () => clearInterval(timer);
  }, [id, router]);

  async function simulateStart() {
    setStarting(true);
    await api(`/exams/${id}/start`, { method: "POST" });
    const refreshed = await api<typeof session>(`/student/exams/${id}`);
    setSession(refreshed);
    setStarting(false);
  }

  async function simulateApprove() {
    setApproving(true);
    try {
      await api(`/student/quick-approve`, { method: "POST" });
      const refreshed = await api<typeof session>(`/student/exams/${id}`);
      setSession(refreshed);
      setJustApproved(true);
    } catch {
      // ignore
    } finally {
      setApproving(false);
    }
  }

  if (!session) {
    return (
      <div className="container" style={{ padding: "4rem 0", textAlign: "center" }}>
        <p>Connecting to exam lobby…</p>
      </div>
    );
  }

  const live = Boolean(session.examRun.startedAt);
  const isAwaitingApproval = session.requireLoginApproval && !session.isLoginApproved;
  const isApproved = !session.requireLoginApproval || session.isLoginApproved;
  const minDur = session.minDurationMinutes || session.examRun.exam.minDurationMinutes || 30;
  const maxDur = session.maxDurationMinutes || session.examRun.exam.durationMinutes || 60;
  const collegeName = session.examRun.exam.collegeName;
  const collegeCode = session.examRun.exam.collegeCode;

  return (
    <div className="container" style={{ padding: "3rem 1rem 5rem", maxWidth: "800px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/student/dashboard" style={{ fontSize: "0.9rem", color: "var(--muted)", textDecoration: "none" }}>
          &larr; Back to Assigned Assessments
        </Link>
      </div>

      <div className="card" style={{ padding: "2.5rem 2rem", textAlign: "center" }}>
        {/* Dynamic Status Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.55rem",
            background: isAwaitingApproval ? "#FEF3C7" : "#DCFCE7",
            color: isAwaitingApproval ? "#B45309" : "#15803D",
            border: isAwaitingApproval ? "1px solid #FCD34D" : "1px solid #86EFAC",
            padding: "0.45rem 1.15rem",
            borderRadius: "9999px",
            fontWeight: 700,
            fontSize: "0.85rem",
            marginBottom: "1.5rem",
            letterSpacing: "0.03em",
          }}
        >
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: isAwaitingApproval ? "#D97706" : "#16A34A",
              boxShadow: isAwaitingApproval ? "0 0 6px #F59E0B" : "0 0 8px #22C55E",
              animation: isAwaitingApproval ? "pulse 1.2s infinite alternate" : undefined,
            }}
          />
          {isAwaitingApproval
            ? "AWAITING INVIGILATOR / ADMIN LOGIN APPROVAL"
            : live
            ? "EXAMINATION BATCH IS LIVE & APPROVED"
            : "LOGIN APPROVED — READY TO BEGIN"}
        </div>

        <h1 style={{ fontSize: "2.1rem", marginBottom: "0.5rem", color: "var(--text)" }}>
          {session.examRun.exam.title}
        </h1>

        {collegeName ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", margin: "0 auto 1rem", fontSize: "0.88rem", color: "var(--muted)" }}>
            <span>🏛️ {collegeName}</span>
            {collegeCode ? (
              <span style={{ background: "var(--light)", padding: "2px 6px", borderRadius: "4px", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                {collegeCode}
              </span>
            ) : null}
          </div>
        ) : null}

        <p style={{ maxWidth: "580px", margin: "0 auto 1.75rem", fontSize: "1.05rem", lineHeight: 1.6, color: "var(--text)" }}>
          {isAwaitingApproval
            ? "Your college requires administrator or invigilator approval for student login. Please stand by while staff approves your credentials."
            : "Your candidate credentials and identity have been verified by the invigilator. You are authorized to begin your live examination sitting."}
        </p>

        {/* State Banners */}
        {isAwaitingApproval ? (
          <div
            style={{
              background: "#FFFBEB",
              border: "1px solid #FCD34D",
              borderRadius: "12px",
              padding: "1.25rem 1.5rem",
              maxWidth: "540px",
              margin: "0 auto 1.75rem",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#92400E", fontWeight: 700, marginBottom: "0.4rem", fontSize: "0.95rem" }}>
              <span>🛡️</span>
              <span>Institution Login Verification</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#78350F", lineHeight: 1.55 }}>
              Your login request is in the pending queue for invigilator review. Once approved from the Staff or Admin dashboard, this screen will automatically refresh and unlock your examination access.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "#F0FDF4",
              border: "1px solid #86EFAC",
              borderRadius: "12px",
              padding: "1.25rem 1.5rem",
              maxWidth: "540px",
              margin: "0 auto 1.75rem",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#166534", fontWeight: 700, marginBottom: "0.4rem", fontSize: "0.95rem" }}>
              <span>✅</span>
              <span>Staff & Invigilator Approval Confirmed</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#14532D", lineHeight: 1.55 }}>
              Your candidate credentials have been authorized by the invigilator. Examination security, webcam monitoring, and the server timer are active. Click below to begin your examination.
            </p>
          </div>
        )}

        {/* Exam Parameter Summary Box */}
        <div style={{ background: "var(--light)", borderRadius: "12px", padding: "1.5rem", maxWidth: "540px", margin: "0 auto 2rem", textAlign: "left", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
            <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Candidate Status:</span>
            <strong style={{ color: isAwaitingApproval ? "#B45309" : "#16A34A", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
              {isAwaitingApproval ? "⏳ Pending Login Approval" : "✓ Approved & Authorized"}
            </strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
            <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Minimum Exam Time:</span>
            <strong>{minDur} Minutes (Submission Locked Before)</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
            <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Maximum Exam Time:</span>
            <strong>{maxDur} Minutes (Auto-Submit on Expiry)</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Proctoring Engine:</span>
            <strong style={{ color: "var(--primary)" }}>Active & Standby</strong>
          </div>
        </div>

        {/* Action Buttons */}
        {isApproved ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <Link
              className="btn btn-primary btn-lg"
              href={`/student/exams/${id}/attempt`}
              style={{
                padding: "1rem 2.8rem",
                fontSize: "1.18rem",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.65rem",
                background: "#16A34A",
                borderColor: "#16A34A",
                color: "#FFFFFF",
                boxShadow: "0 6px 20px rgba(22, 163, 74, 0.35)",
                borderRadius: "10px",
                textDecoration: "none",
              }}
            >
              <span>Enter Live Examination</span>
              <span style={{ fontSize: "1.35rem", lineHeight: 1 }}>&rarr;</span>
            </Link>
            <p style={{ fontSize: "0.84rem", color: "var(--muted)", margin: 0 }}>
              Entering will switch to full-screen mode. Have your workspace clear and webcam visible.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <p style={{ fontSize: "0.88rem", color: "var(--muted)", margin: 0 }}>
              Listening for server approval broadcast… (Auto-refreshes every 2.5s)
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={simulateApprove}
                disabled={approving}
                style={{ fontWeight: 600, padding: "0.5rem 1.25rem" }}
              >
                {approving ? "Approving..." : "⚡ Quick Demo: Staff / Admin Instant Approve"}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={simulateStart}
                disabled={starting}
                style={{ fontSize: "0.82rem" }}
              >
                {starting ? "Starting..." : "⚡ Quick Demo: Broadcast Batch Start"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


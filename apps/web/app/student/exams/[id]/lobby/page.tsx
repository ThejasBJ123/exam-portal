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
    status: string;
    minDurationMinutes?: number;
    maxDurationMinutes?: number;
    requireLoginApproval?: boolean;
    isLoginApproved?: boolean;
    isExamStartPermitted?: boolean;
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
        isExamStartPermitted?: boolean;
      };
    };
  } | null>(null);
  const [starting, setStarting] = useState(false);

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
        setSession(res);
      });
    load();
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
  }, [id, router]);

  async function simulateStart() {
    setStarting(true);
    await api(`/exams/${id}/start`, { method: "POST" });
    const refreshed = await api<typeof session>(`/student/exams/${id}`);
    setSession(refreshed);
    setStarting(false);
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
  const isStartPermitted = session.isExamStartPermitted !== false;
  const canEnterExam = live && !isAwaitingApproval && isStartPermitted;

  const minDur = session.minDurationMinutes || session.examRun.exam.minDurationMinutes || 30;
  const maxDur = session.maxDurationMinutes || session.examRun.exam.durationMinutes || 60;
  const collegeName = session.examRun.exam.collegeName || "Institutional Assessment";
  const collegeCode = session.examRun.exam.collegeCode || "DEFAULT";

  return (
    <div className="container" style={{ padding: "3.5rem 0 5rem", maxWidth: "840px" }}>
      <div className="card" style={{ padding: "2.75rem", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.06)" }}>
        {/* Top Status Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: isAwaitingApproval
              ? "#FEF3C7"
              : !isStartPermitted
              ? "#F3E8FF"
              : live
              ? "var(--success-bg)"
              : "var(--warning-bg)",
            color: isAwaitingApproval
              ? "#B45309"
              : !isStartPermitted
              ? "#6B21A8"
              : live
              ? "var(--success)"
              : "var(--warning)",
            padding: "0.45rem 1.2rem",
            borderRadius: "9999px",
            fontWeight: 700,
            fontSize: "0.86rem",
            marginBottom: "1.5rem",
            letterSpacing: "0.02em",
          }}
        >
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "currentColor",
              animation: "pulse 1s infinite alternate",
            }}
          />
          {isAwaitingApproval
            ? "AWAITING STUDENT LOGIN APPROVAL (ADMIN / STAFF)"
            : !isStartPermitted
            ? "WAITING FOR ADMIN / STAFF EXAM START PERMISSION"
            : live
            ? "EXAMINATION BATCH IS LIVE & PERMITTED"
            : "WAITING FOR INVIGILATOR AUTHORIZATION"}
        </div>

        <h1 style={{ fontSize: "2.1rem", marginBottom: "0.4rem", fontWeight: 800 }}>{session.examRun.exam.title}</h1>
        <div style={{ color: "var(--muted)", fontSize: "0.92rem", marginBottom: "1.5rem" }}>
          Affiliation: <strong>{collegeName}</strong> ({collegeCode})
        </div>

        <p style={{ maxWidth: "620px", margin: "0 auto 2rem", fontSize: "1.02rem", color: "var(--text)", lineHeight: 1.6 }}>
          {isAwaitingApproval
            ? "Your college requires administrator or invigilator approval for candidate login. Please stand by while staff approves your credentials."
            : !isStartPermitted
            ? "Your login is verified. Please stand by in this lobby while the Administrator or assigned Staff invigilator grants official start permission for your examination batch."
            : live
            ? "Your invigilator has authorized the batch on the server. The timer has started. Click below to enter your live examination."
            : "Your hardware readiness and proctoring consent are verified. Please stand by while the assigned invigilator authorizes the batch."}
        </p>

        {/* Informational Alerts */}
        {isAwaitingApproval && (
          <div
            style={{
              background: "#FFFBEB",
              border: "1px solid #FCD34D",
              borderRadius: "10px",
              padding: "1.25rem",
              maxWidth: "580px",
              margin: "0 auto 1.75rem",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#92400E", fontWeight: 700, marginBottom: "0.4rem" }}>
              <span>🛡️</span>
              <span>Step 1: Student Login Verification Required</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#78350F", lineHeight: 1.5 }}>
              Your login request is in the pending approval queue. Once an Admin or Staff invigilator approves your login from the roster, this screen will automatically refresh.
            </p>
          </div>
        )}

        {!isAwaitingApproval && !isStartPermitted && (
          <div
            style={{
              background: "#FAF5FF",
              border: "1px solid #D8B4FE",
              borderRadius: "10px",
              padding: "1.25rem",
              maxWidth: "580px",
              margin: "0 auto 1.75rem",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#6B21A8", fontWeight: 700, marginBottom: "0.4rem" }}>
              <span>⏸️</span>
              <span>Step 2: Awaiting Exam Start Permission from Admin / Staff</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#581C87", lineHeight: 1.5 }}>
              Your login is approved, but the invigilator has not yet issued the official Start Permission for this college batch. Once granted in the portal, your examination will automatically unlock.
            </p>
          </div>
        )}

        {/* Policy Summary Card */}
        <div style={{ background: "var(--light)", borderRadius: "12px", padding: "1.5rem", maxWidth: "580px", margin: "0 auto 2rem", textAlign: "left", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: "1rem" }}>
            Institutional Exam Timing & Policy
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem", fontSize: "0.92rem" }}>
            <span style={{ color: "var(--muted)" }}>Candidate Login Status:</span>
            <strong style={{ color: isAwaitingApproval ? "#B45309" : "var(--success)" }}>
              {isAwaitingApproval ? "⏳ Pending Approval" : "✅ Approved"}
            </strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem", fontSize: "0.92rem" }}>
            <span style={{ color: "var(--muted)" }}>Exam Start Permission:</span>
            <strong style={{ color: isStartPermitted ? "var(--success)" : "#7C3AED" }}>
              {isStartPermitted ? "🟢 Permitted (Live)" : "⏸️ Waiting Invigilator Start"}
            </strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem", fontSize: "0.92rem" }}>
            <span style={{ color: "var(--muted)" }}>Total Exam Duration:</span>
            <strong>{maxDur} Minutes (Auto-submit on expiry)</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem", fontSize: "0.92rem" }}>
            <span style={{ color: "var(--muted)" }}>Compulsory Minimum Time:</span>
            <strong style={{ color: "#B45309" }}>{minDur} Minutes (Submission Locked Before)</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.92rem", paddingTop: "0.5rem", borderTop: "1px dashed var(--border)" }}>
            <span style={{ color: "var(--muted)" }}>Proctoring Engine:</span>
            <strong style={{ color: "var(--primary)" }}>Active & Standby (Max 3 Warnings)</strong>
          </div>
        </div>

        {/* Enter Exam or Wait */}
        {canEnterExam ? (
          <div>
            <Link
              className="btn btn-primary btn-lg"
              href={`/student/exams/${id}/attempt`}
              style={{
                padding: "1rem 2.75rem",
                fontSize: "1.15rem",
                boxShadow: "0 4px 14px rgba(27, 42, 74, 0.25)",
              }}
            >
              Enter Live Examination &rarr;
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <p style={{ fontSize: "0.88rem", color: "var(--muted)", margin: 0 }}>
              Listening for server start broadcast… (Auto-refreshes every 3s)
            </p>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={simulateStart}
              disabled={starting || isAwaitingApproval}
              title="Convenience trigger for demonstration & automated testing"
            >
              {starting ? "Starting..." : "⚡ Quick Demo: Grant Start Permission & Begin"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

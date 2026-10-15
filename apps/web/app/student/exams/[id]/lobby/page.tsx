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
    examRun: { startedAt: string | null; exam: { title: string; durationMinutes: number; minDurationMinutes?: number; maxDurationMinutes?: number } };
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
  const minDur = session.minDurationMinutes || session.examRun.exam.minDurationMinutes || 30;
  const maxDur = session.maxDurationMinutes || session.examRun.exam.durationMinutes || 60;

  return (
    <div className="container" style={{ padding: "3.5rem 0 5rem", maxWidth: "800px" }}>
      <div className="card" style={{ padding: "2.5rem", textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: isAwaitingApproval ? "#FEF3C7" : live ? "var(--success-bg)" : "var(--warning-bg)",
            color: isAwaitingApproval ? "#B45309" : live ? "var(--success)" : "var(--warning)",
            padding: "0.4rem 1rem",
            borderRadius: "9999px",
            fontWeight: 700,
            fontSize: "0.85rem",
            marginBottom: "1.5rem",
          }}
        >
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "currentColor", animation: "pulse 1s infinite alternate" }} />
          {isAwaitingApproval
            ? "AWAITING INVIGILATOR / ADMIN LOGIN APPROVAL"
            : live
            ? "EXAMINATION BATCH IS LIVE"
            : "WAITING FOR INVIGILATOR AUTHORIZATION"}
        </div>

        <h1 style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>{session.examRun.exam.title}</h1>
        <p style={{ maxWidth: "560px", margin: "0 auto 2rem", fontSize: "1.05rem" }}>
          {isAwaitingApproval
            ? "Your college requires administrator or invigilator approval for student login. Please stand by while staff approves your credentials."
            : live
            ? "Your invigilator has authorized the batch on the server. The official deadline is now ticking. Click below to enter your live examination."
            : "Your hardware readiness and proctoring consent are verified. Please stand by while the assigned invigilator verifies attendance and starts the batch."}
        </p>

        {isAwaitingApproval && (
          <div
            style={{
              background: "#FFFBEB",
              border: "1px solid #FCD34D",
              borderRadius: "10px",
              padding: "1.25rem",
              maxWidth: "520px",
              margin: "0 auto 1.5rem",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#92400E", fontWeight: 700, marginBottom: "0.4rem" }}>
              <span>🛡️</span>
              <span>Institution Login Verification</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#78350F", lineHeight: 1.5 }}>
              Your login request is in the pending queue for invigilator review. Once approved from the Staff / Admin dashboard, this screen will automatically refresh and unlock your examination access.
            </p>
          </div>
        )}

        <div style={{ background: "var(--light)", borderRadius: "12px", padding: "1.5rem", maxWidth: "520px", margin: "0 auto 2rem", textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Candidate Status:</span>
            <strong style={{ color: isAwaitingApproval ? "#B45309" : "var(--success)" }}>
              {isAwaitingApproval ? "Pending Login Approval" : "Readiness & Consent OK"}
            </strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Minimum Exam Time:</span>
            <strong>{minDur} Minutes (Submission Locked Before)</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Maximum Exam Time:</span>
            <strong>{maxDur} Minutes (Auto-Submit on Expiry)</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Proctoring Engine:</span>
            <strong style={{ color: "var(--primary)" }}>Active & Standby</strong>
          </div>
        </div>

        {live && !isAwaitingApproval ? (
          <div>
            <Link className="btn btn-primary btn-lg" href={`/student/exams/${id}/attempt`} style={{ padding: "1rem 2.5rem", fontSize: "1.15rem" }}>
              Enter Live Examination &rarr;
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <p style={{ fontSize: "0.88rem", color: "var(--muted)", margin: 0 }}>
              Listening for server start broadcast… (Auto-refreshes every 3s)
            </p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={simulateStart} disabled={starting || isAwaitingApproval}>
              {starting ? "Starting..." : "⚡ Quick Demo: Trigger Authorized Start"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

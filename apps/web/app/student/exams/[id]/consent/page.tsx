"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

const POLICY_TEXT = `KAIZENTRIX PROCTORING & INTEGRITY DISCLOSURE:
1. Monitoring Scope: During this examination, the platform processes camera frames to detect face presence, multiple individuals in view, sustained head posture/gaze deviation, and phone-like objects. Browser window blur and tab switching are actively logged.
2. Privacy & Data Safeguards: Structured event telemetry is stored alongside your exam attempt record. Raw biometric face templates are never sold or shared. All records are purged according to the organizational retention schedule.
3. Due Process & Non-Automatic Penalties: AI detection models produce potential anomaly signals and advisory warnings. They DO NOT have the authority to automatically fail or disqualify any candidate. Any flagged session undergoes mandatory review by an authorized human invigilator.
4. Three-Warning Guarantee: You will receive explicit warnings on screen upon repeated irregularities. Only after three recorded escalations is an incident ticket opened for post-exam review.`;

export default function ConsentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ id: string; status: string }>(`/student/exams/${id}`)
      .then((res) => {
        if (res.status === "TERMINATED") {
          router.replace(`/student/exams/${id}/submitted?terminated=true&warnings=3`);
        } else if (res.status === "SUBMITTED" || res.status === "TIMED_OUT") {
          router.replace(`/student/results/${id}`);
        }
      })
      .catch(() => {});
  }, [id, router]);

  async function accept() {
    if (!agreed) {
      setError("You must check the consent acknowledgment box before proceeding.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const session = await api<{ id: string }>(`/student/exams/${id}`);
      await api(`/exam-sessions/${session.id}/consent`, {
        method: "POST",
        body: JSON.stringify({ policyText: POLICY_TEXT }),
      });
      router.push(`/student/exams/${id}/lobby`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Consent could not be recorded");
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ padding: "3.5rem 0 5rem", maxWidth: "840px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href={`/student/exams/${id}/readiness`} style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
          &larr; Back to Readiness Check
        </Link>
      </div>

      <div className="card" style={{ padding: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span className="chip chip-info">Step 2 of 2</span>
          <span style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 }}>Legal & Privacy Notice</span>
        </div>

        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Proctoring Consent & Integrity Agreement</h1>
        <p>
          Please review the examination proctoring policy below. Your explicit consent is required to participate in this assessment session.
        </p>

        {error ? <div className="alert alert-error">{error}</div> : null}

        <div style={{ background: "var(--light)", border: "1px solid var(--border)", borderRadius: "10px", padding: "1.5rem", margin: "1.5rem 0", maxHeight: "280px", overflowY: "auto", fontSize: "0.9rem", lineHeight: 1.7, color: "var(--text)" }}>
          <div style={{ fontWeight: 700, color: "var(--primary)", marginBottom: "0.5rem" }}>
            EXAMINATION PROCTORING CONSENT & DATA PRIVACY AGREEMENT
          </div>
          <div style={{ whiteSpace: "pre-line", fontFamily: "inherit" }}>{POLICY_TEXT}</div>
        </div>

        <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer", margin: "1.5rem 0", padding: "1rem", background: "#F8FAFC", borderRadius: "8px", border: "1px solid var(--border)" }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ width: "18px", height: "18px", marginTop: "0.2rem", cursor: "pointer" }}
          />
          <span style={{ fontSize: "0.92rem", color: "var(--text)" }}>
            I have read and agree to the <strong>Kaizentrix Proctoring & Integrity Agreement</strong>. I consent to webcam and session monitoring during my attempt and understand the 3-warning protocol.
          </span>
        </label>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary btn-lg" onClick={accept} disabled={!agreed || submitting}>
            {submitting ? "Recording Consent…" : "I Consent & Enter Waiting Lobby &rarr;"}
          </button>
        </div>
      </div>
    </div>
  );
}

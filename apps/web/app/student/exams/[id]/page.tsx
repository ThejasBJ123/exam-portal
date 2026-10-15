"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function ExamDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<{
    id: string;
    status: string;
    readinessOk?: boolean;
    consentAt?: string | null;
    examRun: {
      exam: {
        title: string;
        durationMinutes: number;
        kind: string;
        description?: string;
      };
      startedAt?: string | null;
    };
  } | null>(null);

  useEffect(() => {
    api<typeof session>(`/student/exams/${id}`).then(setSession);
  }, [id]);

  if (!session) return <p style={{ padding: "3rem", textAlign: "center" }}>Loading examination details…</p>;

  const exam = session.examRun.exam;
  const isTerminated = session.status === "TERMINATED";
  const isSubmitted = session.status === "SUBMITTED" || session.status === "TIMED_OUT";

  return (
    <div className="container" style={{ padding: "3.5rem 0 5rem", maxWidth: "800px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/student/dashboard" style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
          &larr; Back to Assigned Examinations
        </Link>
      </div>

      <div className="card" style={{ padding: "2.5rem", border: isTerminated ? "2px solid #EF4444" : "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <span className="chip chip-info">{exam.kind}</span>
          <span className={`chip ${isTerminated ? "chip-error" : isSubmitted ? "chip-success" : "chip-neutral"}`}>
            Status: {session.status}
          </span>
        </div>

        <h1 style={{ fontSize: "2.2rem", marginBottom: "0.75rem" }}>{exam.title}</h1>
        <p style={{ fontSize: "1.05rem" }}>
          {exam.description ?? "Timed assessment for internship screening and technical competency verification."}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem", margin: "2rem 0" }}>
          <div style={{ background: "var(--light)", padding: "1rem", borderRadius: "10px", textAlign: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Duration</span>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--primary)" }}>{exam.durationMinutes} Mins</div>
          </div>
          <div style={{ background: "var(--light)", padding: "1rem", borderRadius: "10px", textAlign: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Deadline Mode</span>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--action)" }}>Server Locked</div>
          </div>
          <div style={{ background: "var(--light)", padding: "1rem", borderRadius: "10px", textAlign: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Proctoring</span>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--warning)" }}>3-Warning AI</div>
          </div>
        </div>

        {isTerminated ? (
          <div className="alert alert-error" style={{ marginTop: "1.5rem" }}>
            <strong>Examination Terminated:</strong> Your sitting was automatically terminated and exited after 3 proctoring alerts. Under examination integrity rules, you cannot re-enter, retake, or proceed with this assessment.
          </div>
        ) : isSubmitted ? (
          <div className="alert alert-success" style={{ marginTop: "1.5rem" }}>
            You have already completed and submitted this examination. Your answers have been recorded and your score is available.
          </div>
        ) : (
          <div className="alert alert-info">
            Before taking this exam, you must complete the 2-step verification: Hardware Readiness Test (camera & microphone check) followed by Proctoring Consent acknowledgment.
          </div>
        )}

        <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
          {isTerminated ? (
            <Link className="btn btn-outline btn-lg" href={`/student/exams/${id}/submitted?terminated=true&warnings=3`} style={{ borderColor: "#DC2626", color: "#DC2626", fontWeight: 700 }}>
              View Terminated Scorecard &rarr;
            </Link>
          ) : isSubmitted ? (
            <Link className="btn btn-primary btn-lg" href={`/student/results/${id}`}>
              View Examination Result &rarr;
            </Link>
          ) : (
            <Link className="btn btn-primary btn-lg" href={`/student/exams/${id}/readiness`}>
              Begin Readiness Check &rarr;
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

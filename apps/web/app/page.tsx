import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";

export default function HomePage() {
  return (
    <>
      <PublicHeader />
      <section className="hero">
        <div className="container grid-2">
          <div>
            <div className="kicker">Enterprise Examination Portal</div>
            <h1 style={{ fontSize: "2.85rem", lineHeight: 1.15, marginBottom: "1.2rem" }}>
              Secure, server-controlled assessments for hiring and campus recruitment.
            </h1>
            <p style={{ fontSize: "1.1rem", marginBottom: "1.75rem", maxWidth: "560px" }}>
              Kaizentrix Global Solutions conducts high-stakes aptitude, technical MCQ, and isolated coding
              examinations with synchronized server deadlines, AI camera monitoring, a 3-warning policy, and
              Admin-approved official results.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link href="/student/login" className="btn btn-primary btn-lg">
                Candidate Exam Portal &rarr;
              </Link>
              <Link href="/company/login" className="btn btn-navy btn-lg">
                Admin & Invigilator Portal
              </Link>
            </div>
            <div style={{ display: "flex", gap: "2rem", marginTop: "2.5rem", alignItems: "center" }}>
              <div>
                <strong style={{ fontSize: "1.4rem", color: "var(--primary)", display: "block" }}>100%</strong>
                <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>Server-Enforced Timing</span>
              </div>
              <div style={{ width: "1px", height: "30px", background: "var(--border)" }} />
              <div>
                <strong style={{ fontSize: "1.4rem", color: "var(--action)", display: "block" }}>3-Warning</strong>
                <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>Escalating AI Oversight</span>
              </div>
              <div style={{ width: "1px", height: "30px", background: "var(--border)" }} />
              <div>
                <strong style={{ fontSize: "1.4rem", color: "var(--success)", display: "block" }}>Zero</strong>
                <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>Automatic Failures</span>
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: "2rem", background: "white", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span className="chip chip-info">Authoritative Flow</span>
              <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>5-Stage Lifecycle</span>
            </div>
            <h2 style={{ fontSize: "1.35rem", marginBottom: "1rem" }}>Exam-Day Orchestration</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--light)", color: "var(--action)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 }}>1</span>
                <div>
                  <strong style={{ fontSize: "0.95rem" }}>Candidate Readiness & Consent</strong>
                  <p style={{ margin: 0, fontSize: "0.85rem" }}>Hardware camera verification, network check, and disclosed proctoring consent.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--light)", color: "var(--action)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 }}>2</span>
                <div>
                  <strong style={{ fontSize: "0.95rem" }}>Authorized Batch Start</strong>
                  <p style={{ margin: 0, fontSize: "0.85rem" }}>Invigilator initiates the exam session on the backend. The start timestamp is locked.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--light)", color: "var(--action)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 }}>3</span>
                <div>
                  <strong style={{ fontSize: "0.95rem" }}>Autosaved Live Attempt</strong>
                  <p style={{ margin: 0, fontSize: "0.85rem" }}>Answers persist continuously against server countdown. Refreshing device clock has zero impact.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--light)", color: "var(--action)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 }}>4</span>
                <div>
                  <strong style={{ fontSize: "0.95rem" }}>3-Warning Escalation with Human Review</strong>
                  <p style={{ margin: 0, fontSize: "0.85rem" }}>AI flags (look-away, phone presence) escalate to human invigilators — never instant rejection.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--light)", color: "var(--action)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 }}>5</span>
                <div>
                  <strong style={{ fontSize: "0.95rem" }}>Admin-Approved Official Results</strong>
                  <p style={{ margin: 0, fontSize: "0.85rem" }}>Results remain confidential until Master Admin signs off and writes the publication audit.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: "4rem 0" }}>
        <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 3rem" }}>
          <div className="kicker">Assessment Capabilities</div>
          <h2>Mixed Assessment Architecture</h2>
          <p>
            Build composite assessments that combine general reasoning, domain-specific technical questions, and practical coding environments under a single unified sitting.
          </p>
        </div>
        <div className="cards">
          <article className="card card-hover">
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "var(--light)", color: "var(--action)", display: "grid", placeItems: "center", fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>
              #1
            </div>
            <h3>Aptitude & Quantitative</h3>
            <p>
              Numerical problem solving, logical deduction, and verbal aptitude with customizable negative marking rules and question randomization.
            </p>
            <span className="chip chip-neutral">Automatic Scoring</span>
          </article>
          <article className="card card-hover">
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "var(--light)", color: "var(--action)", display: "grid", placeItems: "center", fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>
              #2
            </div>
            <h3>Technical MCQs</h3>
            <p>
              Single-choice and multi-select items snapshotted from a versioned question bank to guarantee audit stability during live attempts.
            </p>
            <span className="chip chip-info">Versioned Bank</span>
          </article>
          <article className="card card-hover">
            <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "var(--light)", color: "var(--action)", display: "grid", placeItems: "center", fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>
              #3
            </div>
            <h3>Coding Sandbox</h3>
            <p>
              Full code editor with sample and hidden test case verification. Student code execution is queued strictly outside the API process for security.
            </p>
            <span className="chip chip-warning">Isolated Runner</span>
          </article>
        </div>
      </section>

      <section style={{ background: "white", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "4rem 0" }}>
        <div className="container">
          <div className="grid-2">
            <div>
              <div className="kicker">Integrity Guarantee</div>
              <h2>Proctoring That Respects Fairness and Due Process</h2>
              <p>
                Our AI proctoring uses lightweight computer vision models to identify suspicious patterns, but always preserves the human invigilator as the ultimate decision-maker.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1.5rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ color: "var(--success)", fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: "0.95rem" }}>Event deduplication prevents alert spam from continuous frames.</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ color: "var(--success)", fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: "0.95rem" }}>Co-existing cooldown timers distinguish glances from sustained distraction.</span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ color: "var(--success)", fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: "0.95rem" }}>Third warning flags session for staff review — never automatic disqualification.</span>
                </div>
              </div>
            </div>
            <div className="card" style={{ background: "var(--primary)", color: "white", padding: "2rem" }}>
              <h3 style={{ color: "white" }}>3-Warning Escalation Policy</h3>
              <p style={{ color: "#BFDBFE" }}>How the portal reacts to detected irregularities:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div style={{ background: "rgba(255,255,255,0.08)", padding: "0.75rem 1rem", borderRadius: "8px" }}>
                  <strong style={{ color: "#FDE68A" }}>Warning 1: Advisory Notice</strong>
                  <div style={{ fontSize: "0.85rem", color: "#E2E8F0" }}>Alerts the student to return focus to the exam window.</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.08)", padding: "0.75rem 1rem", borderRadius: "8px" }}>
                  <strong style={{ color: "#FCA5A5" }}>Warning 2: Serious Notice</strong>
                  <div style={{ fontSize: "0.85rem", color: "#E2E8F0" }}>Notifies assigned invigilator and highlights session in live grid.</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.08)", padding: "0.75rem 1rem", borderRadius: "8px" }}>
                  <strong style={{ color: "#EF4444" }}>Warning 3: Incident Logged</strong>
                  <div style={{ fontSize: "0.85rem", color: "#E2E8F0" }}>Opens a formal incident ticket for human review upon submission.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  );
}

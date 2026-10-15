import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import Link from "next/link";

export default function AssessmentsPage() {
  return (
    <>
      <PublicHeader />
      <div className="container" style={{ padding: "3.5rem 0 5rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <span className="chip chip-info">Assessment Catalog</span>
          <h1 style={{ marginTop: "0.75rem", fontSize: "2.4rem" }}>Standardized Assessment Formats</h1>
          <p style={{ fontSize: "1.1rem" }}>
            The Kaizentrix platform supports modular, multi-section assessments combining aptitude reasoning, technical knowledge MCQs, and hands-on coding challenges in a single seamless sitting.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginTop: "2.5rem" }}>
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <span className="kicker">Format A</span>
                  <h3 style={{ margin: 0 }}>General & Quantitative Aptitude</h3>
                </div>
                <span className="chip chip-success">Objective Auto-Scored</span>
              </div>
              <p>
                Engineered for rapid cognitive screening. Supports numerical reasoning, logical flow charts, data interpretation, and pattern matching. Features configurable negative marking penalties and question shuffling to prevent collaboration.
              </p>
              <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.88rem", color: "var(--muted)" }}>
                <span>&bull; Single-choice MCQs</span>
                <span>&bull; Multi-select matrices</span>
                <span>&bull; Optional section timers</span>
              </div>
            </div>

            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <span className="kicker">Format B</span>
                  <h3 style={{ margin: 0 }}>Technical MCQ & Domain Knowledge</h3>
                </div>
                <span className="chip chip-info">Version-Controlled</span>
              </div>
              <p>
                In-depth assessment for software engineering, system architecture, database design, and cloud principles. Questions are selected from the central question bank and frozen upon exam publication to preserve auditing integrity.
              </p>
              <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.88rem", color: "var(--muted)" }}>
                <span>&bull; Code snippet analysis</span>
                <span>&bull; Negative marking support</span>
                <span>&bull; Randomized option order</span>
              </div>
            </div>

            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <span className="kicker">Format C</span>
                  <h3 style={{ margin: 0 }}>Hands-on Coding Assessment</h3>
                </div>
                <span className="chip chip-warning">Isolated Sandbox</span>
              </div>
              <p>
                Practical programming evaluations in Python, JavaScript, Java, and C++. Candidates write source code directly in an integrated web editor with immediate syntax feedback, public test-case execution, and hidden rubric evaluations.
              </p>
              <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.88rem", color: "var(--muted)" }}>
                <span>&bull; Visible & hidden test cases</span>
                <span>&bull; Resource-limited containers</span>
                <span>&bull; Zero API execution risk</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "3rem" }}>
            <Link href="/instructions" className="btn btn-primary btn-lg">
              View Candidate Exam Instructions &rarr;
            </Link>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}

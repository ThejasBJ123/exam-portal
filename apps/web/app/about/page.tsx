import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import Link from "next/link";

export default function AboutPage() {
  return (
    <>
      <PublicHeader />
      <div className="container" style={{ padding: "3.5rem 0 5rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <span className="chip chip-info">Corporate Profile</span>
          <h1 style={{ marginTop: "0.75rem", fontSize: "2.4rem" }}>About Kaizentrix Global Solutions</h1>
          <p style={{ fontSize: "1.1rem", lineHeight: 1.7 }}>
            Kaizentrix Global Solutions delivers enterprise-grade assessment technology engineered specifically for corporate recruitment, university entrance examinations, internship screens, and technical aptitude certifications.
          </p>

          <div className="card" style={{ margin: "2rem 0", background: "var(--light)", borderColor: "#BFDBFE" }}>
            <h3 style={{ color: "var(--primary)" }}>The Kaizentrix Core Philosophy</h3>
            <p style={{ margin: 0, color: "var(--text)" }}>
              &ldquo;The frontend displays the examination; the backend controls it. The database records the authoritative state. No high-stakes examination rule should depend only on browser-side JavaScript.&rdquo;
            </p>
          </div>

          <h2>Key Structural Commitments</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", margin: "1.5rem 0 2.5rem" }}>
            <div className="card">
              <h4>Server-Controlled Timing</h4>
              <p style={{ fontSize: "0.9rem" }}>
                Exam countdowns and deadlines are maintained strictly by the central backend. Tampering with client clocks has zero impact on submission cutoffs.
              </p>
            </div>
            <div className="card">
              <h4>Three-Warning Escalation</h4>
              <p style={{ fontSize: "0.9rem" }}>
                AI camera monitoring flags events for human invigilation, providing transparent advisory notices before an incident is registered.
              </p>
            </div>
            <div className="card">
              <h4>Isolated Coding Sandbox</h4>
              <p style={{ fontSize: "0.9rem" }}>
                Untrusted code execution is sandboxed in disposable runners without access to the host API, production secrets, or internal network.
              </p>
            </div>
            <div className="card">
              <h4>Controlled Result Release</h4>
              <p style={{ fontSize: "0.9rem" }}>
                Scores remain strictly embargoed until officially reviewed, verified, and published by Master Admin authorization.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <Link href="/assessments" className="btn btn-primary">Explore Assessments</Link>
            <Link href="/student/login" className="btn btn-ghost">Candidate Portal</Link>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}

import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import Link from "next/link";

export default function InstructionsPage() {
  return (
    <>
      <PublicHeader />
      <div className="container" style={{ padding: "3.5rem 0 5rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <span className="chip chip-info">Candidate Guidelines</span>
          <h1 style={{ marginTop: "0.75rem", fontSize: "2.4rem" }}>Examination Rules & Guidelines</h1>
          <p style={{ fontSize: "1.1rem" }}>
            Please read these requirements carefully prior to your scheduled examination. All candidates must complete readiness checks before entering the exam lobby.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "2rem" }}>
            <div className="card">
              <h3>1. Technical Prerequisites</h3>
              <ul style={{ paddingLeft: "1.25rem", margin: "0.5rem 0 0", color: "var(--muted)", lineHeight: 1.8 }}>
                <li>Desktop or laptop computer running Google Chrome, Mozilla Firefox, or Microsoft Edge.</li>
                <li>Functional webcam and microphone enabled throughout the session.</li>
                <li>Stable broadband internet connection (minimum 1 Mbps upload/download).</li>
                <li>Single display monitor configuration (dual screens are strictly prohibited).</li>
              </ul>
            </div>

            <div className="card">
              <h3>2. Server-Enforced Deadline</h3>
              <ul style={{ paddingLeft: "1.25rem", margin: "0.5rem 0 0", color: "var(--muted)", lineHeight: 1.8 }}>
                <li>The examination timer is maintained by the central server, not your local device clock.</li>
                <li>Refreshing your browser or closing the window will NOT pause or extend your time.</li>
                <li>Answers are automatically autosaved upon selection or typing.</li>
                <li>When the server deadline expires, the attempt will freeze and finalize automatically.</li>
              </ul>
            </div>

            <div className="card">
              <h3>3. AI Monitoring & 3-Warning Protocol</h3>
              <ul style={{ paddingLeft: "1.25rem", margin: "0.5rem 0 0", color: "var(--muted)", lineHeight: 1.8 }}>
                <li><strong>Warning 1:</strong> An advisory notification appears if you look away repeatedly or switch browser tabs.</li>
                <li><strong>Warning 2:</strong> A serious notice appears and your live session is highlighted for the invigilator.</li>
                <li><strong>Warning 3:</strong> The session is flagged for post-exam human review. You may continue, but the incident will be examined before results are cleared.</li>
                <li><em>Important:</em> AI detections never automatically fail a candidate. All flagged behavior is audited by human invigilators.</li>
              </ul>
            </div>

            <div className="card">
              <h3>4. Authorized Invigilator Start</h3>
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.8 }}>
                Once you complete your readiness check and consent form, you will enter the Waiting Lobby. The examination will commence only when authorized staff trigger the batch start on the server.
              </p>
            </div>
          </div>

          <div style={{ marginTop: "3rem", display: "flex", gap: "1rem" }}>
            <Link href="/student/login" className="btn btn-primary btn-lg">
              Proceed to Student Login &rarr;
            </Link>
            <Link href="/support" className="btn btn-outline btn-lg">
              Need Help? Contact Support
            </Link>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}

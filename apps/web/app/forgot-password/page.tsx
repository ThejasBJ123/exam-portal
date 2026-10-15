import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <>
      <PublicHeader />
      <div className="container" style={{ padding: "4rem 0 5rem", maxWidth: "600px" }}>
        <div className="card" style={{ padding: "2.5rem" }}>
          <span className="chip chip-warning">Security Protected</span>
          <h1 style={{ fontSize: "1.8rem", marginTop: "0.75rem" }}>Examination Account Recovery</h1>
          <p>
            To maintain strict testing integrity, candidate and staff accounts are provisioned and credentialed directly by Master Admin or authorized institutional partners.
          </p>
          <div className="alert alert-info">
            Self-service public password resets are disabled during live assessment testing cycles to prevent credential interception and duplicate attempts.
          </div>
          <h4>Steps to Recover Your Access:</h4>
          <ol style={{ paddingLeft: "1.25rem", color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.8 }}>
            <li>Locate your official examination invitation email containing your temporary credentials.</li>
            <li>If your invitation has expired or your password is not functioning, contact your test administrator or institution coordinator.</li>
            <li>Alternatively, email our helpdesk at <strong>support@kaizentrix.com</strong> quoting your Candidate ID and registered institution name.</li>
          </ol>
          <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
            <Link href="/student/login" className="btn btn-primary">
              Return to Student Login
            </Link>
            <Link href="/company/login" className="btn btn-outline">
              Admin Login
            </Link>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}

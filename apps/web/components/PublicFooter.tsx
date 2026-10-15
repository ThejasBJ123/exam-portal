import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{ marginBottom: "0.75rem" }}>
              <span className="brand-mark">KG</span>
              <span>Kaizentrix Global Solutions</span>
            </div>
            <p style={{ fontSize: "0.88rem" }}>
              Next-generation online examination portal designed for verified enterprise hiring, university testing, and campus recruitment.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: "0.95rem", marginBottom: "0.75rem", color: "var(--text)" }}>Portals & Access</h4>
            <p style={{ margin: "0.4rem 0" }}><Link href="/student/login">Student Login</Link></p>
            <p style={{ margin: "0.6rem 0" }}>
              <Link
                href="/company/login"
                className="btn btn-outline btn-sm"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  letterSpacing: "0.03em",
                  color: "var(--primary)",
                  borderColor: "var(--primary)",
                  padding: "0.4rem 0.85rem",
                  borderRadius: "6px",
                  background: "#EFF6FF"
                }}
              >
                🔒 ADMIN LOGIN
              </Link>
            </p>
            <p style={{ margin: "0.4rem 0" }}><Link href="/forgot-password">Account Recovery</Link></p>
          </div>
          <div>
            <h4 style={{ fontSize: "0.95rem", marginBottom: "0.75rem", color: "var(--text)" }}>Information</h4>
            <p style={{ margin: "0.35rem 0" }}><Link href="/instructions">Instruction</Link></p>
            <p style={{ margin: "0.35rem 0" }}><Link href="/about">About Kaizentrix</Link></p>
            <p style={{ margin: "0.35rem 0" }}><Link href="/assessments">Assessment Types</Link></p>
          </div>
          <div>
            <h4 style={{ fontSize: "0.95rem", marginBottom: "0.75rem", color: "var(--text)" }}>Contact & Support</h4>
            <p style={{ margin: "0.35rem 0" }}><Link href="/support">Help Desk & Contact</Link></p>
            <p style={{ margin: "0.35rem 0", color: "var(--muted)", fontSize: "0.85rem" }}>support@kaizentrix.com</p>
            <p style={{ margin: "0.35rem 0", color: "var(--muted)", fontSize: "0.85rem" }}>+91 (0) 80 4455 6677</p>
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <span>&copy; {new Date().getFullYear()} Kaizentrix Global Solutions Pvt. Ltd. All rights reserved.</span>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            <Link href="/company/login" style={{ color: "var(--primary)", fontWeight: 700, fontSize: "0.85rem" }}>
              🔒 ADMIN LOGIN &rarr;
            </Link>
            <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>ISO 27001 Assessment Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="public-header">
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" className="brand">
          <span className="brand-mark">KG</span>
          <div>
            <div style={{ color: "var(--primary)", lineHeight: 1.1 }}>Kaizentrix</div>
            <div style={{ fontSize: "0.68rem", color: "var(--muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Global Solutions
            </div>
          </div>
        </Link>
        <nav className="nav">
          <Link href="/" style={{ fontWeight: 600, letterSpacing: "0.03em" }}>HOME</Link>
          <Link href="/instructions" style={{ fontWeight: 600, letterSpacing: "0.03em" }}>INSTRUCTION</Link>
          <Link href="/about" style={{ fontWeight: 600, letterSpacing: "0.03em" }}>ABOUT</Link>
          <Link href="/support" style={{ fontWeight: 600, letterSpacing: "0.03em" }}>CONTACTUS</Link>
          <div style={{ width: "1px", height: "20px", background: "var(--border)", margin: "0 0.5rem" }} />
          <Link href="/student/login" className="btn btn-primary btn-sm" style={{ fontWeight: 700, letterSpacing: "0.04em", padding: "0.45rem 1rem" }}>
            STUDENT LOGIN
          </Link>
        </nav>
      </div>
    </header>
  );
}

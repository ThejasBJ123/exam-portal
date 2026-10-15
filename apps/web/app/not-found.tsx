import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";

export default function NotFound() {
  return (
    <>
      <PublicHeader />
      <main style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: "4rem 1rem" }}>
        <div className="card" style={{ maxWidth: 540, textAlign: "center", padding: "3rem 2rem" }}>
          <span className="chip chip-warning">404 — Page Not Found</span>
          <h1 style={{ fontSize: "2.2rem", marginTop: "1rem", marginBottom: "0.5rem" }}>
            Resource Not Located
          </h1>
          <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
            The requested assessment page or portal URL does not exist or has been relocated to maintain testing security.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/" className="btn btn-primary">
              Return to Homepage
            </Link>
            <Link href="/student/login" className="btn btn-outline">
              Candidate Portal
            </Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}

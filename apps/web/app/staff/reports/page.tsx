"use client";

import Link from "next/link";
import { PortalShell } from "@/components/PortalShell";

export default function StaffReportsPage() {
  return (
    <PortalShell role="STAFF">
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span className="kicker" style={{ color: "var(--primary)", fontWeight: 800 }}>POST-EXAM AUDITING</span>
          <h1 style={{ margin: "0.2rem 0 0.4rem 0" }}>Invigilator Session Reports</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Post-examination summaries for sessions assigned to your roster. Formal result approvals are conducted by Master Admin.
          </p>
        </div>
        <Link
          href="/staff/college-reports"
          className="btn btn-primary"
          style={{ fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.45rem" }}
        >
          📊 College Wise Reports & Excel Export &rarr;
        </Link>
      </div>

      <div className="cards" style={{ marginBottom: "2rem" }}>
        <article className="card">
          <span style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Attendance Rate</span>
          <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--success)", margin: "0.4rem 0" }}>100%</div>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>All assigned candidates checked in</p>
        </article>

        <article className="card">
          <span style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Avg. Completion Time</span>
          <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--primary)", margin: "0.4rem 0" }}>24.2 Mins</div>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>Out of 30 allocated minutes</p>
        </article>

        <article className="card">
          <span style={{ fontSize: "0.85rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Incidents Escalated</span>
          <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--warning)", margin: "0.4rem 0" }}>1</div>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>Third warning ticket pending review</p>
        </article>
      </div>

      <div className="card" style={{ padding: "2rem" }}>
        <h3>Completed Session Log: Graduate Aptitude Screen 2026</h3>
        <p style={{ fontSize: "0.9rem" }}>Official invigilation record filed by Exam Invigilator.</p>
        <div style={{ background: "var(--light)", padding: "1.25rem", borderRadius: "8px", marginTop: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span>Authoritative Start:</span>
            <strong>{new Date().toLocaleDateString()} &bull; 10:00:00 AM IST</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span>Batch Status:</span>
            <strong style={{ color: "var(--success)" }}>Concluded & Frozen</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Invigilator Sign-Off:</span>
            <strong>Verified & Transmitted to Master Admin</strong>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

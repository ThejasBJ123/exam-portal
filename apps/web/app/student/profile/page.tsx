"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { api, type Me } from "@/lib/api";

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    api<Me>("/auth/me").then(setMe).catch(() => {});
  }, []);

  return (
    <PortalShell role="STUDENT">
      <div style={{ marginBottom: "1.5rem" }}>
        <h1>Candidate Profile & Enrollment</h1>
        <p>
          Your official institutional assessment profile. Registration credentials are administered by authorized staff.
        </p>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="card" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--light)", color: "var(--primary)", display: "grid", placeItems: "center", fontSize: "1.5rem", fontWeight: 800 }}>
              {me?.fullName?.charAt(0) ?? "S"}
            </div>
            <div>
              <h2 style={{ fontSize: "1.3rem", margin: 0 }}>{me?.fullName ?? "Asha Rao"}</h2>
              <span className="chip chip-info" style={{ marginTop: "0.25rem" }}>Verified Candidate</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase" }}>Registered Email</span>
              <div style={{ fontWeight: 600 }}>{me?.email ?? "student@kaizentrix.com"}</div>
            </div>
            <div style={{ paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase" }}>Institutional Roll Number</span>
              <div style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>KGS-2026-001</div>
            </div>
            <div style={{ paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase" }}>Batch Roster</span>
              <div style={{ fontWeight: 600 }}>Campus Recruitment Drive 2026</div>
            </div>
            <div>
              <span style={{ fontSize: "0.8rem", color: "var(--muted)", textTransform: "uppercase" }}>Hardware Status</span>
              <div style={{ fontWeight: 600, color: "var(--success)" }}>Webcam & Audio Ready</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: "2rem" }}>
          <h3>Assessment Security & Policy</h3>
          <p style={{ fontSize: "0.9rem" }}>
            Candidate profiles are bound to specific exam assignments. Dual sessions or simultaneous sign-ins from multiple devices are strictly prohibited.
          </p>
          <div className="alert alert-info" style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
            If any profile details (such as roll number or legal spelling) need adjustment, contact support@kaizentrix.com prior to batch start.
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { api } from "@/lib/api";
import Link from "next/link";

type User = {
  id: string;
  email: string;
  fullName: string;
  status: string;
  password?: string;
  staffProfile?: { designation?: string };
  designation?: string;
};

export default function StaffPage() {
  const [rows, setRows] = useState<User[]>([]);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState("ChangeMe_123");

  async function load() {
    try {
      const data = await api<User[]>("/users?role=STAFF");
      setRows(data);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "").trim();
    const fullName = String(form.get("fullName") || "").trim();
    const designation = String(form.get("designation") || "Invigilator").trim();

    try {
      await api("/users", {
        method: "POST",
        body: JSON.stringify({
          email,
          password: password || "ChangeMe_123",
          fullName,
          role: "STAFF",
          designation,
        }),
      });

      setMessage(`Authorized Staff Account for '${fullName}' successfully provisioned! Credentials: ${email} / ${password || "ChangeMe_123"}`);
      setShowAdd(false);
      load();
      setTimeout(() => setMessage(""), 8000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create staff account.");
      setTimeout(() => setErrorMessage(""), 6000);
    }
  }

  function copyStaffCredentials(u: User) {
    const pwd = u.password || "ChangeMe_123";
    const text = `Kaizentrix Staff Login Credentials:\nPortal: ${typeof window !== "undefined" ? window.location.origin : ""}/staff/login\nEmail: ${u.email}\nTemporary Password: ${pwd}\nRole: Staff Invigilator (${u.staffProfile?.designation || u.designation || "Invigilator"})`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setMessage(`Login credentials for ${u.fullName} (${u.email}) copied to clipboard! Provide these to the staff member.`);
    setTimeout(() => setMessage(""), 5000);
  }

  async function toggleStatus(u: User) {
    const nextStatus = u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api("/users", {
        method: "PATCH",
        body: JSON.stringify({ id: u.id, status: nextStatus }),
      });
      setMessage(`Staff account ${u.email} status updated to ${nextStatus}.`);
      load();
      setTimeout(() => setMessage(""), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update status.");
    }
  }

  async function handleResetPassword(userId: string) {
    if (!newPasswordValue.trim()) return;
    try {
      await api("/users", {
        method: "PATCH",
        body: JSON.stringify({ id: userId, password: newPasswordValue.trim() }),
      });
      setMessage(`Password successfully updated to '${newPasswordValue.trim()}'.`);
      setResettingUserId(null);
      setNewPasswordValue("ChangeMe_123");
      load();
      setTimeout(() => setMessage(""), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reset password.");
    }
  }

  return (
    <PortalShell role="MASTER_ADMIN">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1>Invigilator & Staff Management</h1>
          <p>
            Provision authorized proctors and chief invigilators with exam-day monitoring privileges. Staff members can only log in using credentials created here.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/staff/login" target="_blank" className="btn btn-outline" style={{ fontSize: "0.85rem" }}>
            Test Staff Login ↗
          </Link>
          <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? "Cancel" : "+ Provision New Invigilator"}
          </button>
        </div>
      </div>

      {/* Security Guidance Banner */}
      <div
        style={{
          background: "#EFF6FF",
          border: "1px solid #BFDBFE",
          borderLeft: "5px solid #2563EB",
          borderRadius: "8px",
          padding: "1rem 1.25rem",
          marginBottom: "1.75rem",
          fontSize: "0.9rem",
          color: "#1E40AF",
          lineHeight: 1.5,
        }}
      >
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>🛡️</span>
          <div>
            <strong style={{ display: "block", color: "#1E3A8A", marginBottom: "0.25rem", fontSize: "0.95rem" }}>
              Admin-Governed Invigilator Access Policy
            </strong>
            <p style={{ margin: 0, color: "#1E40AF" }}>
              Staff invigilators <strong>cannot publicly register</strong>. Every staff account must be created directly by the Master Admin below.
              Invigilators use their institutional email and initial password to access the Staff Workspace at <strong>/staff/login</strong> or <strong>/company/login</strong>.
            </p>
          </div>
        </div>
      </div>

      {message ? <div className="alert alert-ok" style={{ marginBottom: "1.5rem" }}>{message}</div> : null}
      {errorMessage ? <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>{errorMessage}</div> : null}

      {showAdd ? (
        <form className="card" onSubmit={create} style={{ marginBottom: "2rem", padding: "2rem", border: "2px solid #2563EB" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ margin: 0 }}>Create Authorized Staff Account</h3>
            <span className="chip chip-primary">Credential Provisioning</span>
          </div>

          <p style={{ fontSize: "0.88rem", color: "var(--muted)", marginBottom: "1.5rem" }}>
            The credentials entered below will be strictly verified when the staff member signs into the portal.
          </p>

          <div className="grid-2">
            <div className="field">
              <label>Full Name *</label>
              <input name="fullName" required placeholder="e.g. Dr. Rajesh Kumar" />
            </div>
            <div className="field">
              <label>Institutional Email *</label>
              <input name="email" type="email" required placeholder="e.g. rajesh@kaizentrix.com" />
            </div>
            <div className="field">
              <label>Initial Temporary Password *</label>
              <input name="password" minLength={8} required defaultValue="ChangeMe_123" />
              <span style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem", display: "block" }}>
                Minimum 8 characters. Default is <code>ChangeMe_123</code>.
              </span>
            </div>
            <div className="field">
              <label>Designation / Role Title</label>
              <input name="designation" placeholder="e.g. Senior Invigilator" defaultValue="Invigilator" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button type="submit" className="btn btn-primary">Provision Staff Account</button>
            <button type="button" className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </form>
      ) : null}

      {/* Password Reset Modal / Inline Form */}
      {resettingUserId && (
        <div className="card" style={{ marginBottom: "2rem", padding: "1.5rem", background: "#FEF3C7", border: "1px solid #F59E0B" }}>
          <h4 style={{ color: "#92400E", marginBottom: "0.5rem" }}>Reset Staff Temporary Password</h4>
          <p style={{ fontSize: "0.85rem", color: "#B45309", marginBottom: "1rem" }}>
            Set a new temporary password for this staff member. They will need this password to log in.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <input
              type="text"
              value={newPasswordValue}
              onChange={(e) => setNewPasswordValue(e.target.value)}
              placeholder="New password (min 8 chars)"
              style={{ maxWidth: 300 }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleResetPassword(resettingUserId)}
            >
              Save Password
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setResettingUserId(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Login Email</th>
              <th>Designation</th>
              <th>Status</th>
              <th>Login Password</th>
              <th>Credential Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.fullName}</td>
                <td>
                  <code style={{ background: "#F1F5F9", padding: "0.2rem 0.4rem", borderRadius: "4px", fontSize: "0.85rem" }}>
                    {r.email}
                  </code>
                </td>
                <td>{r.staffProfile?.designation ?? r.designation ?? "Invigilator"}</td>
                <td>
                  <span className={`chip ${r.status === "ACTIVE" ? "chip-success" : "chip-danger"}`}>
                    {r.status}
                  </span>
                </td>
                <td>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#64748B" }}>
                    {r.password ? r.password : "ChangeMe_123"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => copyStaffCredentials(r)}
                      title="Copy email & password to clipboard"
                      style={{ fontSize: "0.78rem", padding: "0.3rem 0.6rem" }}
                    >
                      📋 Copy Credentials
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setResettingUserId(r.id);
                        setNewPasswordValue(r.password || "ChangeMe_123");
                      }}
                      style={{ fontSize: "0.78rem", padding: "0.3rem 0.6rem" }}
                    >
                      🔑 Reset Password
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${r.status === "ACTIVE" ? "btn-ghost" : "btn-outline"}`}
                      onClick={() => toggleStatus(r)}
                      style={{ fontSize: "0.78rem", padding: "0.3rem 0.6rem", color: r.status === "ACTIVE" ? "#DC2626" : "#059669" }}
                    >
                      {r.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PortalShell>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { api, ApiError, type Me } from "@/lib/api";
import Link from "next/link";

type PortalType = "student" | "company" | "admin" | "staff";

function LoginFormInner({
  portal,
  defaultRole,
}: {
  portal: PortalType;
  defaultRole?: "MASTER_ADMIN" | "STAFF";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode: for student portal, default to "intake" (Pre-login registration)
  const [mode, setMode] = useState<"intake" | "login">(portal === "student" ? "intake" : "login");

  // Determine active management role tab (Master Admin vs Staff Invigilator)
  const initialRole: "MASTER_ADMIN" | "STAFF" =
    defaultRole ??
    (portal === "staff"
      ? "STAFF"
      : portal === "admin"
      ? "MASTER_ADMIN"
      : searchParams?.get("role") === "staff"
      ? "STAFF"
      : "MASTER_ADMIN");

  const [activeRole, setActiveRole] = useState<"MASTER_ADMIN" | "STAFF">(initialRole);

  // Pre-login intake fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [intakeEmail, setIntakeEmail] = useState("");
  const [collegeCode, setCollegeCode] = useState("");

  // Existing credentials login fields
  const [email, setEmail] = useState(
    portal === "student"
      ? ""
      : initialRole === "STAFF"
      ? "staff@kaizentrix.com"
      : "admin@kaizentrix.com"
  );
  const [password, setPassword] = useState("ChangeMe_123");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  // Provisioned staff list fetched from backend/store to show admin-created accounts
  const [provisionedStaff, setProvisionedStaff] = useState<Array<{ id: string; email: string; fullName: string; designation?: string }>>([]);

  useEffect(() => {
    if (portal !== "student") {
      api<any[]>("/users?role=STAFF")
        .then((staffUsers) => {
          if (Array.isArray(staffUsers)) {
            setProvisionedStaff(staffUsers);
          }
        })
        .catch(() => {});
    }
  }, [portal]);

  // Handle switching management tabs (Master Admin vs Staff)
  function switchRoleTab(role: "MASTER_ADMIN" | "STAFF") {
    setActiveRole(role);
    setError("");
    setSuccess("");
    if (role === "MASTER_ADMIN") {
      setEmail("admin@kaizentrix.com");
      setPassword("ChangeMe_123");
    } else {
      setEmail("staff@kaizentrix.com");
      setPassword("ChangeMe_123");
    }
  }

  // Submit candidate pre-login intake data with College Code as the sole exam access key
  async function onIntakeSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setPending(true);

    try {
      const cleanPhone = phone.trim();
      const cleanEmail = intakeEmail.trim();
      const cleanName = fullName.trim();
      const cleanCollege = collegeCode.trim().toUpperCase();

      if (!cleanName) throw new Error("Please enter candidate full name.");
      if (!cleanPhone || cleanPhone.length < 8) {
        throw new Error("Please enter a valid unique phone/mobile number (minimum 8 digits).");
      }
      if (!cleanEmail || !cleanEmail.includes("@")) {
        throw new Error("Please enter a valid email address.");
      }
      if (!cleanCollege) {
        throw new Error("Please enter the College Code provided by your institution (e.g. KITS-2026, APEX-2026, NGA-2026).");
      }

      const result = await api<{ user: Me }>("/auth/student/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
          collegeCode: cleanCollege,
        }),
      });

      setSuccess(`Access verified for ${result.user.collegeName || cleanCollege}! Roll Number: ${result.user.rollNumber ?? "Assigned"}. Entering exam portal...`);
      setTimeout(() => {
        router.push("/student/dashboard");
      }, 800);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : err.message || "Failed to submit candidate intake data.");
    } finally {
      setPending(false);
    }
  }

  // Submit existing login credentials
  async function onLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setPending(true);

    try {
      if (portal === "student") {
        const cleanCollege = collegeCode.trim().toUpperCase();
        const cleanIdentifier = email.trim();

        if (!cleanCollege) throw new Error("Please enter your registered College Code (e.g. KITS-2026, APEX-2026, NGA-2026).");
        if (!cleanIdentifier) throw new Error("Please enter your registered email address or mobile number.");

        const result = await api<{ user: Me }>("/auth/student/login", {
          method: "POST",
          body: JSON.stringify({
            email: cleanIdentifier,
            phone: cleanIdentifier,
            collegeCode: cleanCollege,
          }),
        });
        setSuccess(`College Code verified for ${result.user.collegeName || cleanCollege}! Welcome, ${result.user.fullName}. Redirecting to exam station...`);
        setTimeout(() => {
          router.push("/student/dashboard");
        }, 800);
      } else {
        // Management (Admin / Staff) Login: strictly requires valid credentials created/authorized by Admin
        const result = await api<{ user: Me }>("/auth/company/login", {
          method: "POST",
          body: JSON.stringify({
            email: email.trim(),
            password,
            expectedRole: activeRole,
          }),
        });

        const roleTitle = result.user.role === "MASTER_ADMIN" ? "Master Admin" : "Staff Invigilator";
        setSuccess(`Authentication successful! Welcome, ${result.user.fullName} (${roleTitle}). Opening workspace...`);

        setTimeout(() => {
          if (result.user.role === "MASTER_ADMIN") {
            router.push("/admin/dashboard");
          } else if (result.user.role === "STAFF") {
            router.push("/staff/dashboard");
          } else {
            router.push("/student/dashboard");
          }
        }, 600);
      }
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : err.message || "Unable to sign in. Please verify your credentials.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ padding: "3rem 1rem 5rem" }}>
      <div className="card" style={{ maxWidth: 520, margin: "0 auto", padding: "2.5rem" }}>
        {/* Top Header Badge & Version Indicator */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <span className={`chip ${portal === "student" ? "chip-info" : activeRole === "MASTER_ADMIN" ? "chip-primary" : "chip-success"}`}>
            {portal === "student"
              ? mode === "intake"
                ? "Candidate Pre-Exam Intake"
                : "Student Code Login"
              : activeRole === "MASTER_ADMIN"
              ? "Master Admin Control Center"
              : "Staff & Proctor Portal"}
          </span>
          <span style={{ fontSize: "0.78rem", color: "var(--muted)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
            KGS-AUTH v2.2
          </span>
        </div>

        {/* Role Switcher Tabs for Admin & Staff Portal */}
        {portal !== "student" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.4rem",
              background: "#F1F5F9",
              padding: "0.35rem",
              borderRadius: "10px",
              marginBottom: "1.75rem",
              border: "1px solid var(--border)",
            }}
          >
            <button
              type="button"
              onClick={() => switchRoleTab("MASTER_ADMIN")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.45rem",
                padding: "0.6rem 0.75rem",
                borderRadius: "7px",
                border: "none",
                fontSize: "0.88rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
                background: activeRole === "MASTER_ADMIN" ? "#123B70" : "transparent",
                color: activeRole === "MASTER_ADMIN" ? "#FFFFFF" : "#64748B",
                boxShadow: activeRole === "MASTER_ADMIN" ? "0 2px 4px rgba(18,59,112,0.2)" : "none",
              }}
            >
              <span>🛡️</span>
              <span>Master Admin</span>
            </button>
            <button
              type="button"
              onClick={() => switchRoleTab("STAFF")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.45rem",
                padding: "0.6rem 0.75rem",
                borderRadius: "7px",
                border: "none",
                fontSize: "0.88rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
                background: activeRole === "STAFF" ? "#047857" : "transparent",
                color: activeRole === "STAFF" ? "#FFFFFF" : "#64748B",
                boxShadow: activeRole === "STAFF" ? "0 2px 4px rgba(4,120,87,0.2)" : "none",
              }}
            >
              <span>👤</span>
              <span>Staff Invigilator</span>
            </button>
          </div>
        )}

        {portal === "student" && mode === "intake" ? (
          <>
            <h1 style={{ fontSize: "1.75rem", marginBottom: "0.4rem" }}>
              Student Examination Intake
            </h1>
            <p style={{ fontSize: "0.9rem", marginBottom: "1.5rem", color: "var(--muted)" }}>
              Enter your candidate details along with the official <strong>College Code</strong> provided by your institution.
            </p>

            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.83rem", color: "#991B1B", marginBottom: "1.25rem", lineHeight: 1.45 }}>
              <strong>🛡️ Proctoring & Single-Attempt Policy:</strong> Each candidate is registered with their unique mobile number and email ID. If any student is exited due to reaching 3 proctoring warnings, their access is permanently stopped and they cannot log in or re-register for the exam using that email ID or phone number.
            </div>

            {error ? (
              <div
                className="alert alert-error"
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #DC2626",
                  borderLeft: "6px solid #DC2626",
                  borderRadius: "8px",
                  padding: "0.85rem 1rem",
                  marginBottom: "1.25rem",
                  color: "#991B1B",
                  fontSize: "0.88rem",
                  lineHeight: 1.5,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                  <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>⛔</span>
                  <div>
                    <strong style={{ display: "block", color: "#7F1D1D", marginBottom: "0.2rem" }}>
                      {error.includes("TERMINATED") || error.includes("Access Revoked") || error.includes("warnings") || error.includes("Restriction")
                        ? "Disciplinary Access Restriction"
                        : "Registration Error"}
                    </strong>
                    <span>{error}</span>
                  </div>
                </div>
              </div>
            ) : null}
            {success ? <div className="alert alert-ok">{success}</div> : null}

            <form onSubmit={onIntakeSubmit}>
              <div className="field">
                <label htmlFor="intake-name">Candidate Full Name *</label>
                <input
                  id="intake-name"
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <label htmlFor="intake-phone">Mobile / Phone Number *</label>
                  <span style={{ fontSize: "0.75rem", color: "var(--action)", fontWeight: 600 }}>
                    Must be unique
                  </span>
                </div>
                <input
                  id="intake-phone"
                  type="tel"
                  required
                  pattern="[0-9+ -]{8,18}"
                  placeholder="e.g. 08217464429"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="intake-email">Registered Email ID *</label>
                <input
                  id="intake-email"
                  type="email"
                  required
                  placeholder="e.g. thejasbj666@gmail.com"
                  value={intakeEmail}
                  onChange={(e) => setIntakeEmail(e.target.value)}
                />
              </div>

              {/* Single Code to Access the Exam: College Code */}
              <div className="field" style={{ background: "#F0FDF4", padding: "1.1rem", borderRadius: "10px", border: "2px solid #86EFAC", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.3rem" }}>
                  <label htmlFor="intake-college-code" style={{ color: "#166534", fontWeight: 700, fontSize: "0.95rem" }}>
                    🏛️ College Code * (Institutional Access Code)
                  </label>
                  <span style={{ fontSize: "0.75rem", color: "#15803D", fontWeight: 700 }}>
                    Required
                  </span>
                </div>
                <input
                  id="intake-college-code"
                  type="text"
                  required
                  placeholder="e.g. KITS-2026"
                  value={collegeCode}
                  onChange={(e) => setCollegeCode(e.target.value.toUpperCase())}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    background: "white",
                    borderColor: "#86EFAC",
                    fontSize: "1.05rem",
                    padding: "0.65rem 0.85rem",
                  }}
                />
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={pending}
                style={{ width: "100%", padding: "0.85rem", fontSize: "1rem", fontWeight: 700, marginTop: "0.5rem" }}
              >
                {pending ? "Verifying College Code & Submitting…" : "Enter Exam Portal with College Code →"}
              </button>
            </form>

            <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border)", textAlign: "center" }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setError("");
                  setMode("login");
                }}
                style={{ fontSize: "0.85rem", color: "var(--primary)" }}
              >
                Already have an access code? Sign in with Code &rarr;
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: "1.75rem", marginBottom: "0.4rem" }}>
              {portal === "student"
                ? "Student Examination Login"
                : activeRole === "MASTER_ADMIN"
                ? "Master Admin Login"
                : "Staff & Invigilator Login"}
            </h1>
            <p style={{ fontSize: "0.9rem", marginBottom: "1.25rem", color: "var(--muted)" }}>
              {portal === "student"
                ? "Enter your Admin-Issued Exam Code and your email or phone number to access your examination."
                : activeRole === "MASTER_ADMIN"
                ? "Authorized master platform administrators and institutional assessment directors."
                : "Authorized examination proctors and session invigilators."}
            </p>

            {/* Strict Notice for Staff: Credential Creation Policy */}
            {portal !== "student" && activeRole === "STAFF" && (
              <div
                style={{
                  background: "#ECFDF5",
                  border: "1px solid #A7F3D0",
                  borderLeft: "5px solid #059669",
                  borderRadius: "8px",
                  padding: "0.85rem 1rem",
                  fontSize: "0.84rem",
                  color: "#065F46",
                  marginBottom: "1.25rem",
                  lineHeight: 1.5,
                }}
              >
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>🔑</span>
                  <div>
                    <strong style={{ display: "block", color: "#064E3B", marginBottom: "0.15rem" }}>
                      Admin-Provisioned Credentials Only
                    </strong>
                    <span>
                      Staff accounts cannot self-register. Invigilators can only sign in using credentials created and provisioned by the <strong>Master Admin</strong> in the Admin Control Center.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Strict Notice for Master Admin */}
            {portal !== "student" && activeRole === "MASTER_ADMIN" && (
              <div
                style={{
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  borderLeft: "5px solid #2563EB",
                  borderRadius: "8px",
                  padding: "0.85rem 1rem",
                  fontSize: "0.84rem",
                  color: "#1E40AF",
                  marginBottom: "1.25rem",
                  lineHeight: 1.5,
                }}
              >
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>🛡️</span>
                  <div>
                    <strong style={{ display: "block", color: "#1E3A8A", marginBottom: "0.15rem" }}>
                      High-Privilege Control Center
                    </strong>
                    <span>
                      Full administrative access to question banks, college reports, exam configs, and staff provisioning.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {portal === "student" ? (
              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.83rem", color: "#166534", marginBottom: "1.25rem", lineHeight: 1.45 }}>
                <strong>🎓 Candidate Examination Station:</strong> Sign in with your registered College Code and your registered Email ID or Mobile Number to access your examination station and dashboard.
              </div>
            ) : null}

            {error ? (
              <div
                className="alert alert-error"
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #DC2626",
                  borderLeft: "6px solid #DC2626",
                  borderRadius: "8px",
                  padding: "0.85rem 1rem",
                  marginBottom: "1.25rem",
                  color: "#991B1B",
                  fontSize: "0.88rem",
                  lineHeight: 1.5,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                  <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>⛔</span>
                  <div>
                    <strong style={{ display: "block", color: "#7F1D1D", marginBottom: "0.2rem" }}>
                      Authentication Alert
                    </strong>
                    <span>{error}</span>
                  </div>
                </div>
              </div>
            ) : null}
            {success ? <div className="alert alert-ok">{success}</div> : null}

            <form onSubmit={onLoginSubmit}>
              {portal === "student" ? (
                <>
                  {/* Single Exam Access Key: College Code */}
                  <div className="field" style={{ background: "#F0FDF4", padding: "1.1rem", borderRadius: "10px", border: "2px solid #86EFAC", marginBottom: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.3rem" }}>
                      <label htmlFor="login-college-code" style={{ color: "#166534", fontWeight: 700, fontSize: "0.95rem" }}>
                        🏛️ College Code * (Institutional Access Code)
                      </label>
                      <span style={{ fontSize: "0.75rem", color: "#15803D", fontWeight: 700 }}>
                        Required
                      </span>
                    </div>
                    <input
                      id="login-college-code"
                      type="text"
                      required
                      placeholder="e.g. KITS-2026"
                      value={collegeCode}
                      onChange={(e) => setCollegeCode(e.target.value.toUpperCase())}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        background: "white",
                        borderColor: "#86EFAC",
                        fontSize: "1.05rem",
                        padding: "0.65rem 0.85rem",
                      }}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="student-identifier">Registered Email ID or Mobile Number *</label>
                    <input
                      id="student-identifier"
                      type="text"
                      required
                      placeholder="e.g. thejasbj666@gmail.com or 08217464429"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Admin / Staff Credentials Login */}
                  <div className="field">
                    <label htmlFor="email">
                      {activeRole === "MASTER_ADMIN" ? "Registered Admin Email" : "Admin-Issued Staff Email"}
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="username"
                      placeholder={activeRole === "MASTER_ADMIN" ? "admin@kaizentrix.com" : "staff@kaizentrix.com"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                      <label htmlFor="password" style={{ margin: 0 }}>
                        {activeRole === "MASTER_ADMIN" ? "Password" : "Temporary or Provisioned Password"}
                      </label>
                      <Link href="/forgot-password" style={{ fontSize: "0.82rem", color: "var(--action)", fontWeight: 600 }}>
                        Forgot password?
                      </Link>
                    </div>
                    <div style={{ position: "relative" }}>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ paddingRight: "2.75rem" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? "Hide password" : "Show password"}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        style={{
                          position: "absolute",
                          right: "0.65rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#64748B",
                          padding: "0.25rem",
                          fontSize: "1rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                className={`btn ${portal === "student" ? "btn-primary" : activeRole === "MASTER_ADMIN" ? "btn-primary" : "btn-success"}`}
                type="submit"
                disabled={pending}
                style={{
                  width: "100%",
                  padding: "0.85rem",
                  fontWeight: 700,
                  fontSize: "1rem",
                  marginTop: "0.5rem",
                  background: portal !== "student" && activeRole === "STAFF" ? "#047857" : undefined,
                  borderColor: portal !== "student" && activeRole === "STAFF" ? "#047857" : undefined,
                  color: "#FFFFFF",
                }}
              >
                {pending
                  ? "Verifying Credentials…"
                  : portal === "student"
                  ? "Verify Code & Enter Exam Station →"
                  : activeRole === "MASTER_ADMIN"
                  ? "Sign In as Master Admin →"
                  : "Sign In as Staff Invigilator →"}
              </button>
            </form>

            {portal === "student" ? (
              <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setError("");
                    setMode("intake");
                  }}
                  style={{ fontSize: "0.85rem", color: "var(--primary)" }}
                >
                  &larr; New Candidate? Register Pre-Exam Intake Data
                </button>
              </div>
            ) : null}

            {portal !== "student" && (
              <div style={{ marginTop: "1.75rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.65rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Quick Demo Credentials (Pre-configured):
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Click to Autofill</span>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeRole === "MASTER_ADMIN" ? "btn-primary" : "btn-outline"}`}
                    onClick={() => {
                      switchRoleTab("MASTER_ADMIN");
                      setEmail("admin@kaizentrix.com");
                      setPassword("ChangeMe_123");
                    }}
                    style={{ fontSize: "0.82rem" }}
                  >
                    🛡️ Master Admin
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeRole === "STAFF" ? "btn-success" : "btn-outline"}`}
                    onClick={() => {
                      switchRoleTab("STAFF");
                      setEmail("staff@kaizentrix.com");
                      setPassword("ChangeMe_123");
                    }}
                    style={{
                      fontSize: "0.82rem",
                      background: activeRole === "STAFF" ? "#047857" : undefined,
                      borderColor: activeRole === "STAFF" ? "#047857" : undefined,
                      color: activeRole === "STAFF" ? "#FFFFFF" : undefined,
                    }}
                  >
                    👤 Staff Invigilator
                  </button>
                </div>

                {/* Display any newly provisioned staff accounts created by Admin */}
                {provisionedStaff.filter((s) => s.email !== "staff@kaizentrix.com").length > 0 && (
                  <div style={{ marginTop: "0.5rem", background: "#F8FAFC", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px dashed var(--border)" }}>
                    <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600, marginBottom: "0.4rem" }}>
                      Admin-Provisioned Staff Accounts:
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      {provisionedStaff
                        .filter((s) => s.email !== "staff@kaizentrix.com")
                        .map((staffUser) => (
                          <button
                            key={staffUser.id}
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              switchRoleTab("STAFF");
                              setEmail(staffUser.email);
                              setPassword("ChangeMe_123");
                            }}
                            style={{ fontSize: "0.78rem", padding: "0.25rem 0.6rem" }}
                          >
                            👤 {staffUser.fullName} ({staffUser.email})
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {portal !== "student" && (
          <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.85rem", color: "var(--muted)" }}>
            <Link href="/student/login" style={{ color: "var(--action)", fontWeight: 600 }}>
              Are you a Candidate? Switch to Student Login &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function LoginForm(props: {
  portal: PortalType;
  defaultRole?: "MASTER_ADMIN" | "STAFF";
}) {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "4rem 1rem", textAlign: "center", color: "var(--muted)" }}>
          Loading authentication station…
        </div>
      }
    >
      <LoginFormInner {...props} />
    </Suspense>
  );
}

"use client";

import { FormEvent, useEffect, useState, useMemo } from "react";
import { PortalShell } from "@/components/PortalShell";
import { api, ApiError, type College } from "@/lib/api";
import { downloadExcel } from "@/lib/excelExport";

type User = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  rollNumber?: string;
  phone?: string;
  accessCode?: string;
  collegeCode?: string;
  collegeName?: string;
  registeredAt?: string;
  createdAt?: string;
};

export default function StudentsPage() {
  const [rows, setRows] = useState<User[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollegeCode, setSelectedCollegeCode] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  async function load() {
    try {
      const [studentsData, collegesData] = await Promise.all([
        api<User[]>("/users?role=STUDENT"),
        api<College[]>("/colleges").catch(() => []),
      ]);
      setRows(studentsData);
      setColleges(collegesData);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Compute unique college codes statistics
  const collegeCodeStats = useMemo(() => {
    const map = new Map<string, { code: string; name: string; count: number }>();

    colleges.forEach((c) => {
      const upper = String(c.code).trim().toUpperCase();
      map.set(upper, { code: upper, name: c.name, count: 0 });
    });

    rows.forEach((r) => {
      const code = String(r.collegeCode || r.accessCode || "KITS-2026").trim().toUpperCase();
      const existing = map.get(code);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(code, {
          code,
          name: r.collegeName || "Institutional Assessment Batch",
          count: 1,
        });
      }
    });

    return Array.from(map.values());
  }, [colleges, rows]);

  // Filter candidates based on search & selected college
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const cCode = String(r.collegeCode || r.accessCode || "KITS-2026").trim().toUpperCase();
      if (selectedCollegeCode !== "ALL" && cCode !== selectedCollegeCode) {
        return false;
      }
      if (!q) return true;
      const matchName = r.fullName?.toLowerCase().includes(q);
      const matchEmail = r.email?.toLowerCase().includes(q);
      const matchPhone = r.phone?.toLowerCase().includes(q);
      const matchRoll = r.rollNumber?.toLowerCase().includes(q);
      const matchCode = cCode.toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchRoll || matchCode;
    });
  }, [rows, selectedCollegeCode, search]);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    setMessage("");
    const form = new FormData(e.currentTarget);
    const chosenCollegeCode = String(form.get("collegeCode") || "KITS-2026").trim().toUpperCase();
    const matchedCollege = colleges.find((c) => c.code.toUpperCase() === chosenCollegeCode);

    try {
      await api("/users", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          fullName: form.get("fullName"),
          phone: form.get("phone"),
          accessCode: chosenCollegeCode,
          collegeCode: chosenCollegeCode,
          collegeName: matchedCollege?.name || "Kaizentrix Institute of Technology & Science",
          role: "STUDENT",
          rollNumber: form.get("rollNumber"),
          registeredAt: new Date().toISOString(),
        }),
      });
      setMessage(`Candidate record provisioned and assigned to College '${chosenCollegeCode}'.`);
      setShowInvite(false);
      load();
      setTimeout(() => setMessage(""), 5000);
    } catch (err: any) {
      setErrorMessage(err instanceof ApiError ? err.message : err.message || "Failed to create candidate.");
    }
  }

  function exportExcel() {
    const filenameSuffix = selectedCollegeCode === "ALL" ? "All_Colleges" : selectedCollegeCode;
    downloadExcel(
      `Kaizentrix_Candidate_Roster_${filenameSuffix}_${new Date().toISOString().split("T")[0]}`,
      filteredRows,
      [
        { key: "fullName", label: "Candidate Name" },
        {
          key: "collegeCode",
          label: "College Access Code",
          format: (v, r) => v || r.accessCode || "KITS-2026",
        },
        {
          key: "collegeName",
          label: "Institution Name",
          format: (v, r) => {
            if (v) return v;
            const code = String(r.collegeCode || r.accessCode || "KITS-2026").toUpperCase();
            const col = colleges.find((c) => c.code === code);
            return col?.name || "Kaizentrix Institute of Technology & Science";
          },
        },
        { key: "phone", label: "Unique Mobile Number", format: (v) => v || "N/A" },
        { key: "email", label: "Email Address" },
        { key: "rollNumber", label: "Roll Number / Candidate ID", format: (v) => v || "Pending" },
        {
          key: "registeredAt",
          label: "Registration Timestamp",
          format: (v, r) => (v ? new Date(v).toLocaleString() : r.createdAt ? new Date(r.createdAt).toLocaleString() : new Date().toLocaleDateString()),
        },
        { key: "status", label: "Account Status" },
      ]
    );
  }

  return (
    <PortalShell role="MASTER_ADMIN">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Candidate Management & Intake Rosters</h1>
          <p>
            Registered student profiles, unique phone verification, and College Code wise candidate rosters.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#ECFDF5",
              borderColor: "#10B981",
              color: "#065F46",
              fontWeight: 700,
              padding: "0.55rem 1.1rem",
              boxShadow: "0 1px 3px rgba(16, 185, 129, 0.15)",
            }}
            onClick={exportExcel}
            title="Download Candidate Intake Data in Excel / CSV format"
          >
            <span style={{ fontSize: "1.1rem" }}>📥</span> Download in Excel (.xlsx / .csv)
          </button>
          <button className="btn btn-primary" onClick={() => setShowInvite(!showInvite)}>
            {showInvite ? "Cancel" : "+ Enroll New Candidate"}
          </button>
        </div>
      </div>

      {message ? <div className="alert alert-ok">{message}</div> : null}
      {errorMessage ? <div className="alert alert-error">{errorMessage}</div> : null}

      {/* College Code Wise Filter Bar */}
      <div
        className="card"
        style={{
          padding: "1.25rem 1.5rem",
          marginBottom: "1.75rem",
          background: "linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)",
          border: "1.5px solid #E2E8F0",
          borderRadius: "12px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              SEPARATE BY COLLEGE CODE
            </span>
            <span style={{ fontSize: "0.82rem", color: "var(--muted)", marginLeft: "0.6rem" }}>
              Filter registered candidates by their assigned institution access code.
            </span>
          </div>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--muted)" }}>
            Showing <strong>{filteredRows.length}</strong> of {rows.length} Candidate(s)
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setSelectedCollegeCode("ALL")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.45rem 1rem",
              borderRadius: "999px",
              border: selectedCollegeCode === "ALL" ? "2px solid var(--action)" : "1px solid #CBD5E1",
              background: selectedCollegeCode === "ALL" ? "var(--action)" : "white",
              color: selectedCollegeCode === "ALL" ? "white" : "#334155",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: selectedCollegeCode === "ALL" ? "0 2px 8px rgba(37, 99, 235, 0.25)" : "none",
            }}
          >
            🏢 All Colleges
            <span
              style={{
                background: selectedCollegeCode === "ALL" ? "rgba(255,255,255,0.25)" : "#F1F5F9",
                color: selectedCollegeCode === "ALL" ? "white" : "#475569",
                padding: "1px 7px",
                borderRadius: "999px",
                fontSize: "0.75rem",
                fontWeight: 800,
              }}
            >
              {rows.length}
            </span>
          </button>

          {collegeCodeStats.map((col) => {
            const isSelected = selectedCollegeCode === col.code;
            return (
              <button
                key={col.code}
                type="button"
                onClick={() => setSelectedCollegeCode(col.code)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.45rem 1rem",
                  borderRadius: "999px",
                  border: isSelected ? "2px solid #16A34A" : "1px solid #CBD5E1",
                  background: isSelected ? "#16A34A" : "white",
                  color: isSelected ? "white" : "#1E293B",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  boxShadow: isSelected ? "0 2px 8px rgba(22, 163, 74, 0.25)" : "none",
                }}
              >
                🏛️ {col.code}
                <span
                  style={{
                    background: isSelected ? "rgba(255,255,255,0.25)" : "#DCFCE7",
                    color: isSelected ? "white" : "#166534",
                    padding: "1px 7px",
                    borderRadius: "999px",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                  }}
                >
                  {col.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Real-time search */}
        <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid #E2E8F0" }}>
          <input
            type="text"
            placeholder="🔍 Search candidate name, mobile, email, roll number, or college code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.6rem 0.9rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              fontSize: "0.88rem",
              background: "white",
            }}
          />
        </div>
      </div>

      {showInvite ? (
        <form className="card" onSubmit={create} style={{ marginBottom: "2rem", padding: "2rem" }}>
          <h3 style={{ marginBottom: "1.25rem" }}>Enroll Examination Candidate</h3>
          <div className="grid-2">
            <div className="field">
              <label>Full Candidate Name *</label>
              <input name="fullName" required placeholder="e.g. Ramesh Kumar" />
            </div>
            <div className="field">
              <label>Unique Mobile / Phone Number *</label>
              <input name="phone" type="tel" required pattern="[0-9+ -]{8,18}" placeholder="e.g. 9876543210" />
            </div>
            <div className="field">
              <label>Email Address *</label>
              <input name="email" type="email" required placeholder="candidate@example.com" />
            </div>
            <div className="field">
              <label>College Access Code *</label>
              <select name="collegeCode" defaultValue="KITS-2026" style={{ padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--border)", fontWeight: 700 }}>
                {colleges.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Temporary Password</label>
              <input name="password" minLength={8} required defaultValue="ChangeMe_123" />
            </div>
            <div className="field">
              <label>Roll Number / Registration ID</label>
              <input name="rollNumber" placeholder="KGS-2026-004" defaultValue={`KGS-2026-${Math.floor(Math.random() * 899 + 100)}`} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button type="submit" className="btn btn-primary">Enroll Candidate</button>
            <button type="button" className="btn btn-outline" onClick={() => setShowInvite(false)}>Cancel</button>
          </div>
        </form>
      ) : null}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Candidate Name</th>
              <th>College Code</th>
              <th>Unique Number</th>
              <th>Email Address</th>
              <th>Roll Number</th>
              <th>Intake Registered At</th>
              <th>Status</th>
              <th>Portal Access</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => {
              const cCode = r.collegeCode || r.accessCode || "KITS-2026";
              return (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.fullName}</td>
                  <td>
                    <code style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", padding: "0.2rem 0.6rem", borderRadius: "4px", fontWeight: 800, fontSize: "0.85rem" }}>
                      {cCode}
                    </code>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--primary)" }}>
                      {r.phone ?? "Not Registered"}
                    </span>
                  </td>
                  <td>{r.email}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                    {r.rollNumber ?? "KGS-2026-001"}
                  </td>
                  <td style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                    {r.registeredAt ? new Date(r.registeredAt).toLocaleString() : r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Active Session"}
                  </td>
                  <td>
                    <span className="chip chip-success">{r.status}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>Verified Candidate</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PortalShell>
  );
}

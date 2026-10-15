"use client";

import { useEffect, useState, useMemo } from "react";
import { PortalShell } from "@/components/PortalShell";
import { api, type College } from "@/lib/api";
import { downloadExcel } from "@/lib/excelExport";

type CandidateUser = {
  id: string;
  fullName: string;
  email: string;
  status: string;
  rollNumber?: string;
  phone?: string;
  collegeId?: string;
  collegeCode?: string;
  collegeName?: string;
  accessCode?: string;
  paperId?: string;
  paperTitle?: string;
  registeredAt?: string;
  createdAt?: string;
};

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateUser[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollegeCode, setSelectedCollegeCode] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("grouped");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api<CandidateUser[]>("/users?role=STUDENT").catch(() => []),
      api<College[]>("/colleges").catch(() => []),
    ])
      .then(([usersData, collegesData]) => {
        setCandidates(usersData);
        setColleges(collegesData);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Compute unique college codes present in enrolled candidates or colleges directory
  const collegeCodeStats = useMemo(() => {
    const map = new Map<string, { code: string; name: string; count: number }>();

    // Seed from colleges directory
    colleges.forEach((c) => {
      const upper = String(c.code).trim().toUpperCase();
      map.set(upper, { code: upper, name: c.name, count: 0 });
    });

    // Count students
    candidates.forEach((cand) => {
      const code = String(cand.collegeCode || cand.accessCode || "KITS-2026").trim().toUpperCase();
      const existing = map.get(code);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(code, {
          code,
          name: cand.collegeName || "Institutional Assessment Batch",
          count: 1,
        });
      }
    });

    return Array.from(map.values());
  }, [colleges, candidates]);

  // Filter candidates based on search & selected college
  const filteredCandidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidates.filter((cand) => {
      const candCode = String(cand.collegeCode || cand.accessCode || "KITS-2026").trim().toUpperCase();
      if (selectedCollegeCode !== "ALL" && candCode !== selectedCollegeCode) {
        return false;
      }
      if (!q) return true;
      const matchName = cand.fullName?.toLowerCase().includes(q);
      const matchEmail = cand.email?.toLowerCase().includes(q);
      const matchPhone = cand.phone?.toLowerCase().includes(q);
      const matchRoll = cand.rollNumber?.toLowerCase().includes(q);
      const matchCode = candCode.toLowerCase().includes(q);
      const matchCollege = cand.collegeName?.toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchRoll || matchCode || matchCollege;
    });
  }, [candidates, selectedCollegeCode, search]);

  // Group filtered candidates by College Code for grouped view
  const groupedCandidates = useMemo(() => {
    const groups: Record<string, { college: { code: string; name: string }; students: CandidateUser[] }> = {};

    filteredCandidates.forEach((cand) => {
      const code = String(cand.collegeCode || cand.accessCode || "KITS-2026").trim().toUpperCase();
      if (!groups[code]) {
        const foundCol = colleges.find((c) => c.code && c.code.toUpperCase() === code);
        groups[code] = {
          college: {
            code,
            name: foundCol?.name || cand.collegeName || "Institutional Assessment Batch",
          },
          students: [],
        };
      }
      groups[code].students.push(cand);
    });

    return Object.values(groups);
  }, [filteredCandidates, colleges]);

  function exportExcel() {
    const exportData = filteredCandidates;
    const filenameSuffix = selectedCollegeCode === "ALL" ? "All_Colleges" : selectedCollegeCode;
    downloadExcel(
      `Kaizentrix_Candidates_${filenameSuffix}_${new Date().toISOString().split("T")[0]}`,
      exportData,
      [
        { key: "fullName", label: "Candidate Name" },
        {
          key: "collegeCode",
          label: "College Access Code",
          format: (v, r) => v || r.accessCode || "KITS-2026",
        },
        {
          key: "collegeName",
          label: "Institution / College Name",
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
          format: (v, r) =>
            v ? new Date(v).toLocaleString() : r.createdAt ? new Date(r.createdAt).toLocaleString() : new Date().toLocaleDateString(),
        },
        { key: "status", label: "Roster Status" },
      ]
    );
  }

  return (
    <PortalShell role="STAFF">
      {/* Header Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "1.3rem" }}>🏛️</span>
            <h1 style={{ margin: 0 }}>Candidate Attendance Roster</h1>
          </div>
          <p style={{ margin: 0, color: "var(--muted)", maxWidth: "700px" }}>
            View and separate candidate attendance data by <strong>College Code</strong>. Check enrolled students, roll numbers, and readiness check-ins before opening examination batches.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* View Mode Toggle */}
          <div style={{ display: "flex", background: "#E2E8F0", padding: "3px", borderRadius: "8px" }}>
            <button
              type="button"
              onClick={() => setViewMode("grouped")}
              style={{
                border: "none",
                background: viewMode === "grouped" ? "white" : "transparent",
                color: viewMode === "grouped" ? "var(--primary)" : "var(--muted)",
                fontWeight: 700,
                fontSize: "0.82rem",
                padding: "0.35rem 0.8rem",
                borderRadius: "6px",
                cursor: "pointer",
                boxShadow: viewMode === "grouped" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              📑 Grouped by College
            </button>
            <button
              type="button"
              onClick={() => setViewMode("flat")}
              style={{
                border: "none",
                background: viewMode === "flat" ? "white" : "transparent",
                color: viewMode === "flat" ? "var(--primary)" : "var(--muted)",
                fontWeight: 700,
                fontSize: "0.82rem",
                padding: "0.35rem 0.8rem",
                borderRadius: "6px",
                cursor: "pointer",
                boxShadow: viewMode === "flat" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              📋 Unified Table
            </button>
          </div>

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
              padding: "0.55rem 1.15rem",
              boxShadow: "0 1px 3px rgba(16, 185, 129, 0.15)",
            }}
            onClick={exportExcel}
            title="Download Candidate Intake Data in Excel / CSV format"
          >
            <span style={{ fontSize: "1.1rem" }}>📥</span> Download in Excel (.xlsx / .csv)
          </button>
        </div>
      </div>

      {/* College Code Wise Filter Bar (Pills & Statistics) */}
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
              FILTER BY COLLEGE CODE
            </span>
            <span style={{ fontSize: "0.82rem", color: "var(--muted)", marginLeft: "0.6rem" }}>
              Click any college code to view that institution&apos;s candidates exclusively.
            </span>
          </div>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--muted)" }}>
            Showing <strong>{filteredCandidates.length}</strong> of {candidates.length} Candidate(s)
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
              transition: "all 0.15s ease",
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
              {candidates.length}
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
                  transition: "all 0.15s ease",
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

        {/* Real-time Search Input */}
        <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid #E2E8F0" }}>
          <input
            type="text"
            placeholder="🔍 Search by candidate name, unique mobile, email, roll number, or college code..."
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

      {loading ? (
        <p style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>Loading candidate attendance records…</p>
      ) : filteredCandidates.length === 0 ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📋</div>
          <h3 style={{ margin: 0, color: "var(--primary)" }}>No Candidates Found for this College Code</h3>
          <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>
            {selectedCollegeCode !== "ALL"
              ? `No registered students currently associated with College Code '${selectedCollegeCode}'.`
              : "No students matching your search criteria."}
          </p>
          {selectedCollegeCode !== "ALL" ? (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ marginTop: "0.5rem" }}
              onClick={() => setSelectedCollegeCode("ALL")}
            >
              Reset Filter to All Colleges
            </button>
          ) : null}
        </div>
      ) : viewMode === "grouped" ? (
        /* ========================================================================= */
        /* MODE 1: SEPARATED GROUP VIEW (EACH COLLEGE CODE HAS ITS OWN DISTINCT TABLE) */
        /* ========================================================================= */
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {groupedCandidates.map((group) => (
            <div
              key={group.college.code}
              className="card"
              style={{
                padding: "0",
                overflow: "hidden",
                border: "1.5px solid #CBD5E1",
                borderRadius: "12px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
              }}
            >
              {/* College Header Banner */}
              <div
                style={{
                  background: "linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%)",
                  borderBottom: "1.5px solid #BFDBFE",
                  padding: "1rem 1.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <code
                      style={{
                        background: "#1E40AF",
                        color: "white",
                        padding: "0.3rem 0.75rem",
                        borderRadius: "6px",
                        fontWeight: 900,
                        fontSize: "0.95rem",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {group.college.code}
                    </code>
                    <h2 style={{ margin: 0, fontSize: "1.15rem", color: "#0F172A", fontWeight: 800 }}>
                      {group.college.name}
                    </h2>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                    Official institution access code: <strong>{group.college.code}</strong> &bull; Examination batch
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span
                    style={{
                      background: "#DCFCE7",
                      color: "#166534",
                      border: "1px solid #86EFAC",
                      padding: "0.3rem 0.8rem",
                      borderRadius: "999px",
                      fontSize: "0.82rem",
                      fontWeight: 800,
                    }}
                  >
                    👥 {group.students.length} Student(s) Enrolled
                  </span>
                </div>
              </div>

              {/* Candidates Table for this College */}
              <div className="table-container" style={{ margin: 0, border: "none" }}>
                <table>
                  <thead>
                    <tr style={{ background: "#F8FAFC" }}>
                      <th>Candidate Name</th>
                      <th>College Code</th>
                      <th>Unique Mobile</th>
                      <th>Email Address</th>
                      <th>Roll Number</th>
                      <th>Registered At</th>
                      <th>Roster Status</th>
                      <th>Hardware Ready</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.students.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 700, color: "#0F172A" }}>
                          {r.fullName}
                        </td>
                        <td>
                          <code
                            style={{
                              background: "#EFF6FF",
                              color: "#1D4ED8",
                              border: "1px solid #BFDBFE",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontWeight: 800,
                              fontSize: "0.82rem",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {r.collegeCode || r.accessCode || group.college.code}
                          </code>
                        </td>
                        <td>
                          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--primary)" }}>
                            {r.phone ?? "Not Registered"}
                          </span>
                        </td>
                        <td>{r.email}</td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 600 }}>
                          {r.rollNumber ?? "KGS-2026-001"}
                        </td>
                        <td style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                          {r.registeredAt ? new Date(r.registeredAt).toLocaleString() : r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Active Sitting"}
                        </td>
                        <td>
                          <span className="chip chip-success">{r.status}</span>
                        </td>
                        <td>
                          <span className="chip chip-info">Ready for Start</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE 2: UNIFIED TABLE VIEW WITH DEDICATED COLLEGE CODE COLUMN */
        /* ========================================================================= */
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>College Code & Institution</th>
                <th>Unique Number</th>
                <th>Email Address</th>
                <th>Roll Number</th>
                <th>Registered At</th>
                <th>Roster Status</th>
                <th>Hardware Ready</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((r) => {
                const cCode = r.collegeCode || r.accessCode || "KITS-2026";
                const cName = r.collegeName || colleges.find((c) => c.code === cCode)?.name || "Main Campus";
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700, color: "#0F172A" }}>{r.fullName}</td>
                    <td>
                      <div>
                        <code
                          style={{
                            background: "#EFF6FF",
                            color: "#1D4ED8",
                            border: "1px solid #BFDBFE",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontWeight: 800,
                            fontSize: "0.82rem",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {cCode}
                        </code>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                          {cName}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--primary)" }}>
                        {r.phone ?? "Not Registered"}
                      </span>
                    </td>
                    <td>{r.email}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 600 }}>
                      {r.rollNumber ?? "KGS-2026-001"}
                    </td>
                    <td style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                      {r.registeredAt ? new Date(r.registeredAt).toLocaleString() : r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Active Session"}
                    </td>
                    <td>
                      <span className="chip chip-success">{r.status}</span>
                    </td>
                    <td>
                      <span className="chip chip-info">Ready for Start</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PortalShell>
  );
}

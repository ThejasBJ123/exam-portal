"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { api, type Me } from "@/lib/api";

const PortalContext = createContext<boolean>(false);

const NAV = {
  MASTER_ADMIN: [
    ["/admin/dashboard", "Overview"],
    ["/admin/colleges", "College Management"],
    ["/admin/college-reports", "College Wise Reports"],
    ["/admin/staff", "Staff Management"],
    ["/admin/students", "Student Management"],
    ["/admin/questions", "Question Bank"],
    ["/admin/exams", "Exam Builder"],
    ["/admin/monitoring", "Live Monitoring"],
    ["/admin/results", "Results Review"],
    ["/admin/reports", "Reports & Analytics"],
    ["/admin/audit-logs", "Audit Logs"],
    ["/admin/settings", "Platform Settings"],
  ],
  STAFF: [
    ["/staff/dashboard", "Invigilator Dashboard"],
    ["/staff/colleges", "College Management"],
    ["/staff/college-reports", "College Wise Reports"],
    ["/staff/exams", "Assigned Exams"],
    ["/staff/candidates", "Candidate Attendance"],
    ["/staff/incidents", "Incident Management"],
    ["/staff/reports", "Session Reports"],
  ],
  STUDENT: [
    ["/student/dashboard", "Assigned Examinations"],
    ["/student/profile", "Candidate Profile"],
  ],
} as const;

export function PortalShell({
  role,
  children,
}: {
  role: keyof typeof NAV;
  children: React.ReactNode;
}) {
  const isInsidePortal = useContext(PortalContext);
  const path = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    if (isInsidePortal) return;
    api<Me>("/auth/me")
      .then((user) => {
        if (user.role !== role) router.replace(homeFor(user.role));
        else setMe(user);
      })
      .catch(() => router.replace(role === "STUDENT" ? "/student/login" : "/company/login"));
  }, [role, router]);

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    router.replace("/");
  }

  if (isInsidePortal) {
    return <>{children}</>;
  }

  if (!me) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "#F8FAFC" }}>
        <div style={{ textAlign: "center" }}>
          <div className="brand-mark" style={{ margin: "0 auto 1rem", width: "48px", height: "48px", fontSize: "1.2rem" }}>
            KG
          </div>
          <p style={{ fontWeight: 600 }}>Loading secure portal session…</p>
        </div>
      </div>
    );
  }

  return (
    <PortalContext.Provider value={true}>
      <div className="portal">
        <aside className="sidebar">
          <div className="sidebar-header">
            <Link href="/" className="sidebar-brand">
              <span className="brand-mark">KG</span>
              <div>
                <div style={{ fontSize: "1rem", lineHeight: 1.1 }}>Kaizentrix</div>
                <div style={{ fontSize: "0.65rem", color: "#BFDBFE", fontWeight: 600, textTransform: "uppercase" }}>
                  {role === "MASTER_ADMIN" ? "Master Admin" : role === "STAFF" ? "Staff Invigilator" : "Student Portal"}
                </div>
              </div>
            </Link>
          </div>

          <nav>
            {NAV[role].map(([href, label]) => {
              const isActive = path === href || (href !== "/admin/dashboard" && href !== "/staff/dashboard" && href !== "/student/dashboard" && path.startsWith(href));
              return (
                <Link key={href} href={href} className={isActive ? "active" : ""}>
                  {label}
                </Link>
              );
            })}
          </nav>

          <div style={{ marginTop: "auto", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "0.9rem" }}>
                {me.fullName.charAt(0)}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                  {me.fullName}
                </div>
                <div style={{ fontSize: "0.74rem", color: "#BFDBFE", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                  {me.email}
                </div>
              </div>
            </div>
            <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.15)", color: "white" }} onClick={logout}>
              Sign Out
            </button>
          </div>
        </aside>

        <main className="content">
          <div className="content-header">
            <div>
              <span className="kicker">
                {role === "MASTER_ADMIN" ? "Control Center" : role === "STAFF" ? "Invigilator Workspace" : "Candidate Workspace"}
              </span>
              <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                Session active &bull; Authenticated via {me.email}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <span className="chip chip-success">Secure Session Active</span>
            </div>
          </div>
          {children}
        </main>
      </div>
    </PortalContext.Provider>
  );
}

function homeFor(role: string) {
  if (role === "MASTER_ADMIN") return "/admin/dashboard";
  if (role === "STAFF") return "/staff/dashboard";
  return "/student/dashboard";
}

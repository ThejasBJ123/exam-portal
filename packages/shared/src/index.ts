export const API_PREFIX = "/api/v1";

export const ROLES = ["MASTER_ADMIN", "STAFF", "STUDENT"] as const;
export type Role = (typeof ROLES)[number];

export const SESSION_STATUSES = [
  "PENDING",
  "READY",
  "IN_PROGRESS",
  "SUBMITTED",
  "TIMED_OUT",
  "VOIDED",
] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const PROCTORING_EVENT_TYPES = [
  "FACE_MISSING",
  "MULTIPLE_FACES",
  "GAZE_AWAY",
  "PHONE_DETECTED",
  "IDENTITY_MISMATCH",
  "TAB_BLUR",
  "FULLSCREEN_EXIT",
  "NETWORK_DROP",
  "CAMERA_FAILURE",
  "LOW_LIGHT",
] as const;
export type ProctoringEventType = (typeof PROCTORING_EVENT_TYPES)[number];

export const TECHNICAL_EVENTS = new Set<ProctoringEventType>([
  "CAMERA_FAILURE",
  "LOW_LIGHT",
  "NETWORK_DROP",
]);

export const ROUTES = {
  public: {
    home: "/",
    about: "/about",
    assessments: "/assessments",
    instructions: "/instructions",
    studentLogin: "/student/login",
    companyLogin: "/company/login",
    forgotPassword: "/forgot-password",
    support: "/support",
  },
  admin: {
    dashboard: "/admin/dashboard",
    staff: "/admin/staff",
    students: "/admin/students",
    questions: "/admin/questions",
    exams: "/admin/exams",
    assignments: "/admin/assignments",
    monitoring: "/admin/monitoring",
    results: "/admin/results",
    reports: "/admin/reports",
    auditLogs: "/admin/audit-logs",
    settings: "/admin/settings",
  },
  staff: {
    dashboard: "/staff/dashboard",
    exams: "/staff/exams",
    candidates: "/staff/candidates",
    incidents: "/staff/incidents",
    reports: "/staff/reports",
  },
  student: {
    dashboard: "/student/dashboard",
    profile: "/student/profile",
  },
} as const;

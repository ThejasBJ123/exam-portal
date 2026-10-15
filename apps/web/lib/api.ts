const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export type Me = {
  id: string;
  email: string;
  role: string;
  fullName: string;
  phone?: string;
  rollNumber?: string;
  registeredAt?: string;
  collegeId?: string;
  collegeCode?: string;
  collegeName?: string;
  loginApproved?: boolean;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
};

// Initial mock dataset matching seed.ts and the Implementation Blueprint
const defaultUsers = [
  { id: "usr-admin-1", email: "admin@kaizentrix.com", fullName: "Master Admin", role: "MASTER_ADMIN", status: "ACTIVE", phone: "9800000001", password: "ChangeMe_123", registeredAt: "2026-10-09T08:00:00.000Z", loginApproved: true, approvalStatus: "APPROVED" },
  { id: "usr-staff-1", email: "staff@kaizentrix.com", fullName: "Exam Invigilator", role: "STAFF", status: "ACTIVE", designation: "Chief Invigilator", phone: "9800000002", password: "ChangeMe_123", registeredAt: "2026-10-09T08:30:00.000Z", loginApproved: true, approvalStatus: "APPROVED" },
  { id: "usr-student-1", email: "student@kaizentrix.com", fullName: "Asha Rao", role: "STUDENT", status: "ACTIVE", rollNumber: "KGS-2026-001", phone: "9876543210", collegeId: "col-1", collegeCode: "KITS-2026", collegeName: "Kaizentrix Institute of Technology & Science", registeredAt: "2026-10-10T09:30:00.000Z", loginApproved: true, approvalStatus: "APPROVED" },
  { id: "usr-student-2", email: "vikram.sharma@kaizentrix.com", fullName: "Vikram Sharma", role: "STUDENT", status: "ACTIVE", rollNumber: "KGS-2026-002", phone: "9876543211", collegeId: "col-1", collegeCode: "KITS-2026", collegeName: "Kaizentrix Institute of Technology & Science", registeredAt: "2026-10-10T10:15:00.000Z", loginApproved: true, approvalStatus: "APPROVED" },
  { id: "usr-student-3", email: "priya.nair@kaizentrix.com", fullName: "Priya Nair", role: "STUDENT", status: "ACTIVE", rollNumber: "KGS-2026-003", phone: "9876543212", collegeId: "col-2", collegeCode: "APEX-2026", collegeName: "Apex Global College of Engineering", registeredAt: "2026-10-10T11:00:00.000Z", loginApproved: true, approvalStatus: "APPROVED" },
];

export type PlatformSettings = {
  primaryColor: string;
  actionColor: string;
  surfaceColor: string;
  portalTitle: string;
  companyName: string;
  supportEmail: string;
  supportPhone: string;
  maxWarnings: number;
  warningCooldownSeconds: number;
  eventDeduplicationSeconds: number;
  cameraSensitivity: "BALANCED" | "STRICT" | "RELAXED";
  enforceServerDeadlines: boolean;
  embargoResults: boolean;
  freezeAnswersOnSubmit: boolean;
  allowCandidateReattempts: boolean;
  requireFaceLockOnConsent: boolean;
  updatedAt?: string;
};

export const defaultSettings: PlatformSettings = {
  primaryColor: "#123B70",
  actionColor: "#2563EB",
  surfaceColor: "#EFF6FF",
  portalTitle: "Kaizentrix Assessment Platform",
  companyName: "Kaizentrix Technologies",
  supportEmail: "admin@kaizentrix.com",
  supportPhone: "+91 98765 43210",
  maxWarnings: 3,
  warningCooldownSeconds: 15,
  eventDeduplicationSeconds: 8,
  cameraSensitivity: "BALANCED",
  enforceServerDeadlines: true,
  embargoResults: true,
  freezeAnswersOnSubmit: true,
  allowCandidateReattempts: false,
  requireFaceLockOnConsent: true,
  updatedAt: "2026-10-11T09:00:00.000Z",
};

export type ExamDurationConfig = {
  minDurationMinutes: number;
  maxDurationMinutes: number;
  requireLoginApproval?: boolean;
};

export type College = {
  id: string;
  name: string;
  code: string;
  assignedPaperIds: string[];
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
  description?: string;
  minDurationMinutes: number; // e.g. 30 (min duration before student can submit)
  maxDurationMinutes: number; // e.g. 60 (max duration, auto-submits on expiry)
  requireLoginApproval: boolean; // whether student login requires staff/admin approval
  examConfigs?: Record<string, ExamDurationConfig>; // Optional per-exam override
};

export const defaultColleges: College[] = [
  {
    id: "col-1",
    name: "Kaizentrix Institute of Technology & Science",
    code: "KITS-2026",
    assignedPaperIds: ["paper-set-1", "paper-set-2"],
    status: "ACTIVE",
    createdAt: "2026-10-10T08:00:00.000Z",
    description: "Main Campus — Engineering, Computing & Applied Sciences",
    minDurationMinutes: 30,
    maxDurationMinutes: 60,
    requireLoginApproval: true,
  },
  {
    id: "col-2",
    name: "Apex Global College of Engineering",
    code: "APEX-2026",
    assignedPaperIds: ["paper-set-1"],
    status: "ACTIVE",
    createdAt: "2026-10-10T09:00:00.000Z",
    description: "Department of Quantitative Aptitude & Informatics",
    minDurationMinutes: 30,
    maxDurationMinutes: 60,
    requireLoginApproval: true,
  },
  {
    id: "col-3",
    name: "National Graduate Academy",
    code: "NGA-2026",
    assignedPaperIds: ["paper-set-2", "paper-set-3"],
    status: "ACTIVE",
    createdAt: "2026-10-10T10:00:00.000Z",
    description: "Postgraduate Aptitude & Management Division",
    minDurationMinutes: 30,
    maxDurationMinutes: 60,
    requireLoginApproval: false,
  },
  {
    id: "col-4",
    name: "Rao Institute of Open Technology (RIOT)",
    code: "RIOT-2026",
    assignedPaperIds: ["paper-set-1", "paper-set-2", "paper-set-3"],
    status: "ACTIVE",
    createdAt: "2026-10-10T11:00:00.000Z",
    description: "Faculty of Applied Computing & Quantitative Reasoning",
    minDurationMinutes: 30,
    maxDurationMinutes: 60,
    requireLoginApproval: true,
  },
];

export type QuestionPaper = {
  id: string;
  title: string;
  code: string;
  description: string;
  durationMinutes: number;
  passPercent: number;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
};

export const defaultPapers: QuestionPaper[] = [
  {
    id: "paper-set-1",
    title: "Graduate Aptitude Screen 2026 (Quantitative Aptitude)",
    code: "KGS-2026",
    description: "Quantitative problem solving, arithmetic equations, speed & distance, percentage, and work rate.",
    durationMinutes: 30,
    passPercent: 50,
    status: "ACTIVE",
    createdAt: "2026-10-10T08:00:00.000Z",
  },
  {
    id: "paper-set-2",
    title: "Question Paper Set 2: Logical & Analytical Reasoning",
    code: "SET-DEV-2026",
    description: "Analytical reasoning, direction sense, pattern series, coding-decoding, and clock/calendar logic.",
    durationMinutes: 30,
    passPercent: 50,
    status: "ACTIVE",
    createdAt: "2026-10-10T09:00:00.000Z",
  },
  {
    id: "paper-set-3",
    title: "Question Paper Set 3: Quantitative Reasoning & Logic Assessment",
    code: "SET-APT-2026",
    description: "Probability, number progression series, time-work analysis, and family relationship deductions.",
    durationMinutes: 30,
    passPercent: 50,
    status: "ACTIVE",
    createdAt: "2026-10-10T10:00:00.000Z",
  },
];

const defaultQuestions = [
  // --- SET 1: QUANTITATIVE APTITUDE (KGS-2026) ---
  {
    id: "q-1",
    paperId: "paper-set-1",
    bankId: "bank-1",
    bank: { name: "Quantitative Aptitude" },
    type: "SINGLE_MCQ",
    stem: "If 3x + 5 = 20, what is the value of x?",
    marks: 2,
    negativeMarks: 0.5,
    options: [
      { id: "opt-1a", label: "A", text: "5", isCorrect: true },
      { id: "opt-1b", label: "B", text: "3", isCorrect: false },
      { id: "opt-1c", label: "C", text: "15", isCorrect: false },
      { id: "opt-1d", label: "D", text: "7", isCorrect: false },
    ],
  },
  {
    id: "q-2",
    paperId: "paper-set-1",
    bankId: "bank-1",
    bank: { name: "Quantitative Aptitude" },
    type: "SINGLE_MCQ",
    stem: "A shopkeeper buys an article for ₹500 and sells it at a 20% profit. What is the selling price?",
    marks: 2,
    negativeMarks: 0.5,
    options: [
      { id: "opt-2a", label: "A", text: "₹550", isCorrect: false },
      { id: "opt-2b", label: "B", text: "₹600", isCorrect: true },
      { id: "opt-2c", label: "C", text: "₹620", isCorrect: false },
      { id: "opt-2d", label: "D", text: "₹650", isCorrect: false },
    ],
  },
  {
    id: "q-3",
    paperId: "paper-set-1",
    bankId: "bank-1",
    bank: { name: "Quantitative Aptitude" },
    type: "SINGLE_MCQ",
    stem: "The ratio of boys to girls in a class of 60 students is 3:2. How many girls are in the class?",
    marks: 2,
    negativeMarks: 0.5,
    options: [
      { id: "opt-3a", label: "A", text: "20", isCorrect: false },
      { id: "opt-3b", label: "B", text: "24", isCorrect: true },
      { id: "opt-3c", label: "C", text: "30", isCorrect: false },
      { id: "opt-3d", label: "D", text: "36", isCorrect: false },
    ],
  },
  {
    id: "q-4",
    paperId: "paper-set-1",
    bankId: "bank-1",
    bank: { name: "Quantitative Aptitude" },
    type: "SINGLE_MCQ",
    stem: "A high-speed train travels 120 km in 2 hours. What is its average velocity in km/h?",
    marks: 2,
    negativeMarks: 0.5,
    options: [
      { id: "opt-4a", label: "A", text: "40 km/h", isCorrect: false },
      { id: "opt-4b", label: "B", text: "60 km/h", isCorrect: true },
      { id: "opt-4c", label: "C", text: "80 km/h", isCorrect: false },
      { id: "opt-4d", label: "D", text: "240 km/h", isCorrect: false },
    ],
  },
  {
    id: "q-5",
    paperId: "paper-set-1",
    bankId: "bank-1",
    bank: { name: "Quantitative Aptitude" },
    type: "SINGLE_MCQ",
    stem: "If 8 workers can complete a task in 12 days, how many days will 6 workers take at the same rate?",
    marks: 2,
    negativeMarks: 0.5,
    options: [
      { id: "opt-5a", label: "A", text: "14 days", isCorrect: false },
      { id: "opt-5b", label: "B", text: "16 days", isCorrect: true },
      { id: "opt-5c", label: "C", text: "18 days", isCorrect: false },
      { id: "opt-5d", label: "D", text: "20 days", isCorrect: false },
    ],
  },
  {
    id: "q-6",
    paperId: "paper-set-1",
    bankId: "bank-1",
    bank: { name: "Quantitative Aptitude" },
    type: "SINGLE_MCQ",
    stem: "A train 240 meters long passes a pole in 24 seconds. How long will it take to pass a platform 650 meters long?",
    marks: 2,
    negativeMarks: 0.5,
    options: [
      { id: "opt-6a", label: "A", text: "65 seconds", isCorrect: false },
      { id: "opt-6b", label: "B", text: "89 seconds", isCorrect: true },
      { id: "opt-6c", label: "C", text: "100 seconds", isCorrect: false },
      { id: "opt-6d", label: "D", text: "75 seconds", isCorrect: false },
    ],
  },

  // --- SET 2: LOGICAL & ANALYTICAL REASONING (SET-DEV-2026) ---
  {
    id: "q-dev-1",
    paperId: "paper-set-2",
    bankId: "bank-1",
    bank: { name: "Logical Reasoning" },
    type: "SINGLE_MCQ",
    stem: "If SOUTH-EAST becomes NORTH, NORTH-EAST becomes WEST and so on, what will WEST become?",
    marks: 2,
    negativeMarks: 0.5,
    options: [
      { id: "opt-dev-1a", label: "A", text: "NORTH-EAST", isCorrect: false },
      { id: "opt-dev-1b", label: "B", text: "SOUTH-EAST", isCorrect: true },
      { id: "opt-dev-1c", label: "C", text: "NORTH-WEST", isCorrect: false },
      { id: "opt-dev-1d", label: "D", text: "SOUTH-WEST", isCorrect: false },
    ],
  },
  {
    id: "q-dev-2",
    paperId: "paper-set-2",
    bankId: "bank-1",
    bank: { name: "Logical Reasoning" },
    type: "SINGLE_MCQ",
    stem: "Find the missing number in the sequence: 4, 18, 48, 100, 180, ___?",
    marks: 2,
    negativeMarks: 0.5,
    options: [
      { id: "opt-dev-2a", label: "A", text: "256", isCorrect: false },
      { id: "opt-dev-2b", label: "B", text: "294", isCorrect: true },
      { id: "opt-dev-2c", label: "C", text: "312", isCorrect: false },
      { id: "opt-dev-2d", label: "D", text: "320", isCorrect: false },
    ],
  },
  {
    id: "q-dev-3",
    paperId: "paper-set-2",
    bankId: "bank-1",
    bank: { name: "Logical Reasoning" },
    type: "SINGLE_MCQ",
    stem: "In a certain code language, if 'COMPUTER' is written as 'RFUVQNPC', how is 'MEDICINE' written in that code?",
    marks: 2,
    negativeMarks: 0.5,
    options: [
      { id: "opt-dev-3a", label: "A", text: "EOJDJEFM", isCorrect: true },
      { id: "opt-dev-3b", label: "B", text: "EOJDEJFM", isCorrect: false },
      { id: "opt-dev-3c", label: "C", text: "MFEJDJOE", isCorrect: false },
      { id: "opt-dev-3d", label: "D", text: "EOJDJFEM", isCorrect: false },
    ],
  },
  {
    id: "q-dev-4",
    paperId: "paper-set-2",
    bankId: "bank-1",
    bank: { name: "Logical Reasoning" },
    type: "SINGLE_MCQ",
    stem: "A wall clock displays 8:30. What is the acute angle between the hour hand and the minute hand?",
    marks: 2,
    negativeMarks: 0.5,
    options: [
      { id: "opt-dev-4a", label: "A", text: "60°", isCorrect: false },
      { id: "opt-dev-4b", label: "B", text: "75°", isCorrect: true },
      { id: "opt-dev-4c", label: "C", text: "80°", isCorrect: false },
      { id: "opt-dev-4d", label: "D", text: "85°", isCorrect: false },
    ],
  },

  // --- SET 3: QUANTITATIVE & LOGIC ASSESSMENT (SET-APT-2026) ---
  {
    id: "q-apt-1",
    paperId: "paper-set-3",
    bankId: "bank-1",
    bank: { name: "Quantitative Reasoning" },
    type: "SINGLE_MCQ",
    stem: "If two unbiased standard dice are rolled simultaneously, what is the probability that the sum of the top faces is 7?",
    marks: 2,
    negativeMarks: 0.5,
    options: [
      { id: "opt-apt-1a", label: "A", text: "1/12", isCorrect: false },
      { id: "opt-apt-1b", label: "B", text: "1/6", isCorrect: true },
      { id: "opt-apt-1c", label: "C", text: "1/4", isCorrect: false },
      { id: "opt-apt-1d", label: "D", text: "5/36", isCorrect: false },
    ],
  },
  {
    id: "q-apt-2",
    paperId: "paper-set-3",
    bankId: "bank-1",
    bank: { name: "Quantitative Reasoning" },
    type: "SINGLE_MCQ",
    stem: "Complete the numerical pattern sequence: 3, 7, 15, 31, 63, ___?",
    marks: 2,
    negativeMarks: 0.5,
    options: [
      { id: "opt-apt-2a", label: "A", text: "125", isCorrect: false },
      { id: "opt-apt-2b", label: "B", text: "126", isCorrect: false },
      { id: "opt-apt-2c", label: "C", text: "127", isCorrect: true },
      { id: "opt-apt-2d", label: "D", text: "128", isCorrect: false },
    ],
  },
  {
    id: "q-apt-3",
    paperId: "paper-set-3",
    bankId: "bank-1",
    bank: { name: "Quantitative Reasoning" },
    type: "SINGLE_MCQ",
    stem: "A software testing milestone requires 12 engineers 15 days to complete. How many days will 20 engineers take at equal velocity?",
    marks: 2,
    negativeMarks: 0.5,
    options: [
      { id: "opt-apt-3a", label: "A", text: "8 days", isCorrect: false },
      { id: "opt-apt-3b", label: "B", text: "9 days", isCorrect: true },
      { id: "opt-apt-3c", label: "C", text: "10 days", isCorrect: false },
      { id: "opt-apt-3d", label: "D", text: "11 days", isCorrect: false },
    ],
  },
  {
    id: "q-apt-4",
    paperId: "paper-set-3",
    bankId: "bank-1",
    bank: { name: "Quantitative Reasoning" },
    type: "SINGLE_MCQ",
    stem: "Pointing to a photograph of a boy, Suresh said, 'He is the son of the only son of my mother.' How is Suresh related to that boy?",
    marks: 2,
    negativeMarks: 0.5,
    options: [
      { id: "opt-apt-4a", label: "A", text: "Brother", isCorrect: false },
      { id: "opt-apt-4b", label: "B", text: "Uncle", isCorrect: false },
      { id: "opt-apt-4c", label: "C", text: "Father", isCorrect: true },
      { id: "opt-apt-4d", label: "D", text: "Cousin", isCorrect: false },
    ],
  },
];

const defaultExam = {
  id: "exam-gas-2026",
  title: "Graduate Aptitude Screen 2026",
  accessCode: "KGS-2026",
  kind: "OBJECTIVE_MCQ",
  description: "Timed quantitative aptitude, logical reasoning, and analytical screen.",
  durationMinutes: 30,
  passPercent: 50,
  status: "PUBLISHED",
  runs: [{ id: "run-1", startedAt: new Date().toISOString(), status: "LIVE" }],
  warningPolicy: { maxWarnings: 3, cooldownSeconds: 15, groupWindowSeconds: 8, locked: true },
};

export function computeAuthoritativeScore(store: any, targetPaperId?: string) {
  if (!store || !store.questions) {
    return {
      total: 0,
      maxTotal: 12,
      percentage: 0,
      objective: 0,
      maxObjective: 12,
      coding: 0,
      maxCoding: 0,
      correctCount: 0,
      totalQuestions: 0,
      breakdown: [],
    };
  }

  const pId = targetPaperId || store.session?.paperId || store.currentUser?.paperId || store.papers?.[0]?.id;
  let relevantQuestions = store.questions;
  if (pId) {
    const filtered = store.questions.filter((q: any) => q.paperId === pId);
    if (filtered.length > 0) relevantQuestions = filtered;
  }

  let totalEarned = 0;
  let totalMax = 0;
  let correctCount = 0;

  const itemBreakdown: {
    questionId: string;
    number: number;
    stem: string;
    type: string;
    adminMarks: number;
    earnedMarks: number;
    verdict: string;
    isCorrect: boolean;
  }[] = [];

  for (let idx = 0; idx < relevantQuestions.length; idx++) {
    const q = relevantQuestions[idx];
    const qMarks = Number(q.marks) || 2;
    totalMax += qMarks;

    const userAns = store.session?.answers?.[q.id];
    let earned = 0;
    let verdict = "Not Attempted";

    // All questions evaluated purely as Aptitude MCQs
    if (userAns && userAns.optionId) {
      const correctOpt = q.options?.find((o: any) => o.isCorrect);
      const chosenOpt = q.options?.find((o: any) =>
        o.id === userAns.optionId ||
        o.label === userAns.optionId ||
        (userAns.label && o.label === userAns.label) ||
        (o.id && String(o.id).endsWith(String(userAns.optionId).toLowerCase()))
      );
      const isMatch = Boolean(
        correctOpt && (
          userAns.optionId === correctOpt.id ||
          userAns.optionId === correctOpt.label ||
          (userAns.label && correctOpt.label === userAns.label) ||
          (correctOpt.id && String(correctOpt.id).endsWith(String(userAns.optionId).toLowerCase())) ||
          (userAns.optionId && String(userAns.optionId).endsWith(String(correctOpt.label || "").toLowerCase()))
        )
      );
      if (isMatch) {
        earned = qMarks;
        verdict = `Correct (${chosenOpt?.label || "Selected"})`;
        correctCount++;
      } else {
        const neg = Number(q.negativeMarks) || 0;
        earned = neg > 0 ? -neg : 0;
        verdict = `Incorrect (${chosenOpt?.label || "Selected"})`;
      }
    } else {
      earned = 0;
      verdict = "Not Attempted";
    }

    totalEarned += earned;

    itemBreakdown.push({
      questionId: q.id,
      number: idx + 1,
      stem: q.stem,
      type: q.type || "SINGLE_MCQ",
      adminMarks: qMarks,
      earnedMarks: Math.max(0, earned),
      verdict,
      isCorrect: earned === qMarks,
    });
  }

  totalEarned = Math.max(0, totalEarned);
  const percentage = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

  return {
    total: totalEarned,
    maxTotal: totalMax || 12,
    percentage,
    objective: totalEarned,
    maxObjective: totalMax || 12,
    coding: 0,
    maxCoding: 0,
    correctCount,
    totalQuestions: relevantQuestions.length,
    breakdown: itemBreakdown,
  };
}

// --- Disciplinary 3-Warning Permanent Restriction Registry ---
export const TERMINATED_KEY = "kgs_terminated_candidates_v1";

export interface TerminatedCandidate {
  userId?: string;
  phone?: string;
  email?: string;
  fullName?: string;
  terminatedAt: string;
  warningCount: number;
  reason: string;
}

export function getTerminatedCandidates(): TerminatedCandidate[] {
  if (typeof window === "undefined") return [];
  try {
    const rawLocal = window.localStorage.getItem(TERMINATED_KEY);
    const rawSess = window.sessionStorage.getItem(TERMINATED_KEY);
    const listA: TerminatedCandidate[] = rawLocal ? JSON.parse(rawLocal) : [];
    const listB: TerminatedCandidate[] = rawSess ? JSON.parse(rawSess) : [];
    const map = new Map<string, TerminatedCandidate>();

    [...listA, ...listB].forEach((item) => {
      if (item && item.phone) map.set(`p:${String(item.phone).trim()}`, item);
      if (item && item.email) map.set(`e:${String(item.email).trim().toLowerCase()}`, item);
    });

    const unique: TerminatedCandidate[] = [];
    const seen = new Set<TerminatedCandidate>();
    map.forEach((item) => {
      if (!seen.has(item)) {
        seen.add(item);
        unique.push(item);
      }
    });
    return unique;
  } catch {
    return [];
  }
}

export function recordCandidateTermination(candidate: {
  userId?: string;
  phone?: string;
  email?: string;
  fullName?: string;
  reason?: string;
}) {
  if (typeof window === "undefined") return;
  try {
    const existing = getTerminatedCandidates();
    const cleanPhone = candidate.phone ? String(candidate.phone).trim() : undefined;
    const cleanEmail = candidate.email ? String(candidate.email).trim().toLowerCase() : undefined;

    const entry: TerminatedCandidate = {
      userId: candidate.userId,
      phone: cleanPhone,
      email: cleanEmail,
      fullName: candidate.fullName,
      terminatedAt: new Date().toISOString(),
      warningCount: 3,
      reason: candidate.reason || "MAX_WARNINGS_EXCEEDED",
    };

    const updated = existing.filter((c) => {
      if (cleanPhone && c.phone && c.phone === cleanPhone) return false;
      if (cleanEmail && c.email && c.email.toLowerCase() === cleanEmail) return false;
      return true;
    });
    updated.push(entry);

    const serialized = JSON.stringify(updated);
    window.localStorage.setItem(TERMINATED_KEY, serialized);
    window.sessionStorage.setItem(TERMINATED_KEY, serialized);
  } catch {
    // ignore
  }
}

export function checkTerminationRestriction(
  identifier?: string,
  phone?: string,
  email?: string
): TerminatedCandidate | null {
  const list = getTerminatedCandidates();
  const cIdent = identifier ? String(identifier).trim().toLowerCase() : "";
  const cPhone = phone ? String(phone).trim() : "";
  const cEmail = email ? String(email).trim().toLowerCase() : "";

  for (const item of list) {
    const itemPhone = item.phone ? String(item.phone).trim() : "";
    const itemEmail = item.email ? String(item.email).trim().toLowerCase() : "";

    if (cPhone && itemPhone && cPhone === itemPhone) return item;
    if (cEmail && itemEmail && cEmail === itemEmail) return item;
    if (cIdent) {
      if (itemPhone && (cIdent === itemPhone.toLowerCase() || cIdent.replace(/\D/g, "") === itemPhone.replace(/\D/g, ""))) return item;
      if (itemEmail && cIdent === itemEmail) return item;
    }
  }
  return null;
}

// In-browser mock store fallback
function getStore() {
  if (typeof window === "undefined") {
    return {
      currentUser: defaultUsers[2],
      users: defaultUsers,
      papers: defaultPapers,
      questions: defaultQuestions,
      exam: defaultExam,
      session: {
        id: "sess-student-1",
        studentId: defaultUsers[2].id,
        paperId: "paper-set-1",
        status: "READY",
        serverDeadlineAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        warningCount: 0,
        readinessOk: true,
        consentAt: new Date().toISOString(),
        answers: {} as Record<string, any>,
        warnings: [] as any[],
        incidents: [] as any[],
      },
      auditLogs: [] as any[],
    };
  }

  const KEY = "kgs_exam_portal_state_v1";
  const existing = (typeof window !== "undefined" && (window.localStorage.getItem(KEY) || window.sessionStorage.getItem(KEY))) || null;
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (!parsed.papers || !Array.isArray(parsed.papers) || parsed.papers.length === 0) {
        parsed.papers = defaultPapers;
      } else {
        defaultPapers.forEach((dp) => {
          if (!parsed.papers.some((p: any) => p.id === dp.id || (p.code && p.code === dp.code))) {
            parsed.papers.push(dp);
          }
        });
      }
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        parsed.questions = defaultQuestions;
      } else {
        parsed.questions = parsed.questions.filter((q: any) => q.type !== "CODING");
        defaultQuestions.forEach((dq) => {
          const idx = parsed.questions.findIndex((q: any) => q.id === dq.id);
          if (idx >= 0) {
            parsed.questions[idx] = dq;
          } else {
            parsed.questions.push(dq);
          }
        });
        parsed.questions.forEach((q: any) => {
          if (!q.paperId) q.paperId = "paper-set-1";
          if (Array.isArray(q.options)) {
            q.options.forEach((o: any, idx: number) => {
              if (!o.id) {
                o.id = `${q.id}-opt-${o.label ? String(o.label).toLowerCase() : idx}`;
              }
            });
          }
        });
      }

      // Sync any candidates in the permanent disciplinary restriction list
      const termList = getTerminatedCandidates();
      if (termList.length > 0) {
        parsed.users?.forEach((u: any) => {
          const isTerm = termList.some(
            (t) =>
              (t.phone && u.phone && String(t.phone).trim() === String(u.phone).trim()) ||
              (t.email && u.email && String(t.email).trim().toLowerCase() === String(u.email).trim().toLowerCase())
          );
          if (isTerm) {
            u.isTerminated = true;
            u.examStatus = "TERMINATED";
            u.status = "TERMINATED";
            u.blocked = true;
            u.warningCount = 3;
            u.terminatedReason = "MAX_WARNINGS_EXCEEDED";
          }
        });
        if (parsed.currentUser) {
          const isCurTerm = termList.some(
            (t) =>
              (t.phone && parsed.currentUser.phone && String(t.phone).trim() === String(parsed.currentUser.phone).trim()) ||
              (t.email && parsed.currentUser.email && String(t.email).trim().toLowerCase() === String(parsed.currentUser.email).trim().toLowerCase())
          );
          if (isCurTerm) {
            parsed.currentUser.isTerminated = true;
            parsed.currentUser.examStatus = "TERMINATED";
            parsed.currentUser.status = "TERMINATED";
            parsed.currentUser.blocked = true;
            parsed.currentUser.warningCount = 3;
            parsed.currentUser.terminatedReason = "MAX_WARNINGS_EXCEEDED";
          }
        }
      }

      // Auto-recalculate if score is missing or legacy
      if (
        parsed.session &&
        (!parsed.session.score ||
          !parsed.session.score.breakdown ||
          (parsed.session.score.total === 18 && Object.keys(parsed.session.answers || {}).length === 0))
      ) {
        parsed.session.score = computeAuthoritativeScore(parsed);
      }
      if (!parsed.settings) {
        parsed.settings = defaultSettings;
      }
      if (!parsed.colleges || !Array.isArray(parsed.colleges) || parsed.colleges.length === 0) {
        parsed.colleges = [...defaultColleges];
      } else {
        // Ensure defaultColleges (such as RIOT-2026, KITS-2026) are always available
        defaultColleges.forEach((dc) => {
          if (!parsed.colleges.some((c: any) => c.code && c.code.toUpperCase() === dc.code.toUpperCase())) {
            parsed.colleges.push(dc);
          }
        });
      }

      // Ensure all student users have collegeCode and collegeName populated properly
      if (Array.isArray(parsed.users)) {
        parsed.users.forEach((u: any) => {
          if (u.role === "STUDENT") {
            if (!u.collegeCode) {
              if (u.accessCode && (parsed.colleges || defaultColleges).some((c: any) => c.code && c.code.toUpperCase() === u.accessCode.toUpperCase())) {
                u.collegeCode = u.accessCode.toUpperCase();
              } else if (u.phone === "9876543210" || u.phone === "9876543211") {
                u.collegeCode = "KITS-2026";
              } else if (u.phone === "9876543212") {
                u.collegeCode = "APEX-2026";
              } else {
                u.collegeCode = "KITS-2026";
              }
            }
            if (!u.collegeName) {
              const matchedCol = (parsed.colleges || defaultColleges).find(
                (c: any) => c.code && c.code.toUpperCase() === String(u.collegeCode).toUpperCase()
              );
              u.collegeName = matchedCol?.name || "Kaizentrix Institute of Technology & Science";
            }
          }
        });
      }
      return parsed;
    } catch {
      // ignore
    }
  }

  const initial: any = {
    currentUser: defaultUsers[2],
    users: defaultUsers,
    papers: defaultPapers,
    questions: defaultQuestions,
    exam: defaultExam,
    settings: defaultSettings,
    colleges: defaultColleges,
    session: {
      id: "sess-student-1",
      studentId: defaultUsers[2].id,
      paperId: "paper-set-1",
      status: "READY",
      serverDeadlineAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      warningCount: 0,
      readinessOk: true,
      consentAt: new Date().toISOString(),
      answers: {} as Record<string, any>,
      warnings: [] as any[],
      incidents: [] as any[],
    },
    results: [],
    auditLogs: [
      { id: "log-1", action: "SYSTEM_INIT", entity: "Server", createdAt: new Date().toISOString(), actor: { email: "system" } },
      { id: "log-2", action: "EXAM_PUBLISHED", entity: "Exam", createdAt: new Date().toISOString(), actor: { email: "admin@kaizentrix.com" } },
    ],
    incidents: [] as any[],
  };

  initial.session.score = computeAuthoritativeScore(initial);
  initial.results.push({
    id: "res-1",
    status: "APPROVED",
    session: {
      id: "sess-student-1",
      score: initial.session.score,
      examRun: { exam: { title: "Graduate Aptitude Screen 2026" } },
    },
  });

  saveStore(initial);
  return initial;
}

function saveStore(store: any) {
  if (typeof window !== "undefined") {
    const serialized = JSON.stringify(store);
    try {
      window.localStorage.setItem("kgs_exam_portal_state_v1", serialized);
    } catch {}
    try {
      window.sessionStorage.setItem("kgs_exam_portal_state_v1", serialized);
    } catch {}
  }
}

export function getSessionForUser(store: any, user: any) {
  if (!store.sessions) store.sessions = {};
  const userKey = user?.phone || user?.id || "sess-default";
  if (!store.sessions[userKey]) {
    if (store.session && (store.session.phone === userKey || store.session.studentId === user?.id)) {
      store.sessions[userKey] = store.session;
    } else {
      store.sessions[userKey] = {
        id: `sess-${user?.id || Date.now()}`,
        studentId: user?.id,
        phone: user?.phone,
        status: user?.examStatus || "READY",
        serverDeadlineAt: null,
        warningCount: 0,
        readinessOk: false,
        consentAt: null,
        answers: {},
        warnings: [],
        incidents: [],
      };
    }
  }
  return store.sessions[userKey];
}

// Fallback dispatcher when backend is unreachable
function handleMockRoute(path: string, init: RequestInit = {}): any {
  const store = getStore();
  const method = (init.method ?? "GET").toUpperCase();
  const body = init.body ? JSON.parse(init.body as string) : {};

  // Auth
  if (path === "/auth/me") {
    return store.currentUser;
  }
  if (path === "/auth/logout") {
    store.currentUser = null;
    saveStore(store);
    return { ok: true };
  }
  if (path === "/auth/student/register") {
    const { fullName, phone, email, collegeCode } = body;
    if (!fullName || !phone || !email) {
      throw new ApiError(400, "Full Name, Mobile Number, and Email ID are all required.");
    }

    const cleanCollegeCode = String(collegeCode || "").trim().toUpperCase();
    if (!cleanCollegeCode) {
      throw new ApiError(400, "College Code is required. Please enter the unique College Code provided by your institution (e.g. KITS-2026, APEX-2026, NGA-2026).");
    }

    const matchedCollege = (store.colleges || defaultColleges).find(
      (c: any) => c.code && c.code.toUpperCase() === cleanCollegeCode
    );
    if (!matchedCollege) {
      const allowedColleges = (store.colleges || defaultColleges).map((c: any) => c.code).join(", ");
      throw new ApiError(400, `Invalid College Code '${cleanCollegeCode}'. Please verify your college code with your institution coordinator (Registered colleges: ${allowedColleges}).`);
    }

    // Automatically allocate the question paper set assigned to this college
    const collegePaperId = matchedCollege.assignedPaperIds?.[0] || store.papers?.[0]?.id || "paper-set-1";
    const matchedPaper = store.papers?.find((p: any) => p.id === collegePaperId) || store.papers?.[0];

    const cleanPhone = String(phone).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    // STRICT 3-WARNING RESTRICTION: Any candidate exited due to 3 warnings cannot register again
    const termRestriction = checkTerminationRestriction(undefined, cleanPhone, cleanEmail);
    const existingTerminated = store.users.find(
      (u: any) =>
        (u.phone && String(u.phone).trim() === cleanPhone && (u.isTerminated || u.examStatus === "TERMINATED" || u.warningCount >= 3)) ||
        (u.email && String(u.email).trim().toLowerCase() === cleanEmail && (u.isTerminated || u.examStatus === "TERMINATED" || u.warningCount >= 3))
    );

    if (termRestriction || existingTerminated) {
      throw new ApiError(
        403,
        `Disciplinary Restriction: Candidate with mobile number '${cleanPhone}' or email '${cleanEmail}' was TERMINATED and EXITED due to reaching 3 proctoring warnings. Under institutional examination rules, you cannot register, log in, or retake this exam.`
      );
    }

    // Enforce strictly: One student is registered by unique mobile number
    const existingPhone = store.users.find(
      (u: any) => u.phone && String(u.phone).trim() === cleanPhone
    );
    if (existingPhone) {
      throw new ApiError(400, `Mobile number '${cleanPhone}' is already registered for this examination. Multiple attempts or re-registration with the same mobile number are strictly prohibited.`);
    }

    // Check unique email
    const existingEmail = store.users.find(
      (u: any) => u.email && String(u.email).trim().toLowerCase() === cleanEmail
    );
    if (existingEmail) {
      throw new ApiError(400, `Email '${cleanEmail}' is already registered. Mobile numbers and emails must be unique.`);
    }

    const studentCount = store.users.filter((u: any) => u.role === "STUDENT").length;
    const rollNumber = `KGS-2026-${String(studentCount + 1).padStart(3, "0")}`;

    const requiresApproval = matchedCollege.requireLoginApproval ?? true;
    const isApproved = !requiresApproval;

    const newUser = {
      id: `usr-student-${Date.now()}`,
      email: cleanEmail,
      fullName: String(fullName).trim(),
      phone: cleanPhone,
      rollNumber,
      accessCode: cleanCollegeCode,
      paperId: matchedPaper?.id || "paper-set-1",
      paperTitle: matchedPaper?.title || "Graduate Aptitude Screen 2026",
      collegeId: matchedCollege.id,
      collegeCode: matchedCollege.code,
      collegeName: matchedCollege.name,
      role: "STUDENT",
      status: "ACTIVE",
      examStatus: "READY",
      hasLoggedIn: true,
      loginApproved: isApproved,
      approvalStatus: isApproved ? "APPROVED" : "PENDING",
      registeredAt: new Date().toISOString(),
    };

    const freshSession = {
      id: `sess-${newUser.id}`,
      studentId: newUser.id,
      phone: newUser.phone,
      paperId: matchedPaper?.id || "paper-set-1",
      status: "READY",
      serverDeadlineAt: null,
      serverMinCompletionAt: null,
      minDurationMinutes: matchedCollege.minDurationMinutes || 30,
      maxDurationMinutes: matchedCollege.maxDurationMinutes || 60,
      requireLoginApproval: requiresApproval,
      isLoginApproved: isApproved,
      warningCount: 0,
      readinessOk: false,
      consentAt: null,
      answers: {},
      warnings: [],
      incidents: [],
    };

    if (!store.sessions) store.sessions = {};
    store.sessions[newUser.phone] = freshSession;
    store.session = freshSession;

    store.users.push(newUser);
    store.currentUser = newUser;
    saveStore(store);
    return { user: newUser, ok: true };
  }

  if (path.startsWith("/auth/student/login")) {
    const { email, phone, collegeCode } = body;

    const cleanCollegeCode = String(collegeCode || "").trim().toUpperCase();
    if (!cleanCollegeCode) {
      throw new ApiError(400, "College Code is required. Please enter your registered College Code.");
    }

    const matchedCollege = (store.colleges || defaultColleges).find(
      (c: any) => c.code && c.code.toUpperCase() === cleanCollegeCode
    );
    if (!matchedCollege) {
      const allowedColleges = (store.colleges || defaultColleges).map((c: any) => c.code).join(", ");
      throw new ApiError(400, `Invalid College Code '${cleanCollegeCode}'. Please verify with your college coordinator (Registered colleges: ${allowedColleges}).`);
    }

    const identifier = (email || phone || "").trim();
    const cleanPhone = phone ? String(phone).trim() : identifier;
    const cleanEmail = email ? String(email).trim().toLowerCase() : (identifier.includes("@") ? identifier.toLowerCase() : "");

    // STRICT 3-WARNING RESTRICTION: Check if candidate was exited due to 3 warnings by either phone or email
    const termRestriction = checkTerminationRestriction(identifier, cleanPhone, cleanEmail);
    if (termRestriction) {
      const termPhone = termRestriction.phone || cleanPhone;
      const termEmail = termRestriction.email || cleanEmail;
      const credDesc = [
        termPhone ? `Mobile Number: '${termPhone}'` : "",
        termEmail ? `Email ID: '${termEmail}'` : "",
      ]
        .filter(Boolean)
        .join(" and ");

      throw new ApiError(
        403,
        `Access Revoked: Candidate (${credDesc || identifier}) was TERMINATED and EXITED due to reaching 3 proctoring warnings (3/3). In accordance with institutional examination policy, your access has been permanently revoked and you CANNOT log in once again for the exam using this email ID or phone number.`
      );
    }

    let user = store.users.find(
      (u: any) =>
        (u.phone && String(u.phone).trim() === cleanPhone) ||
        (u.phone && String(u.phone).trim() === identifier) ||
        (u.email && u.email.toLowerCase() === identifier.toLowerCase()) ||
        (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)
    );

    if (!user) {
      throw new ApiError(400, `No candidate registration found with mobile number or email '${identifier}'. Each student must register their unique mobile number first.`);
    }

    const userSession = getSessionForUser(store, user);

    // Rule 1: If exited from warnings for that exam -> completely stop, no access
    if (
      user.isTerminated ||
      user.examStatus === "TERMINATED" ||
      userSession.status === "TERMINATED" ||
      (userSession.warningCount && userSession.warningCount >= 3) ||
      (user.warningCount && user.warningCount >= 3)
    ) {
      recordCandidateTermination({
        userId: user.id,
        phone: user.phone || cleanPhone,
        email: user.email || cleanEmail,
        fullName: user.fullName,
        reason: "MAX_WARNINGS_EXCEEDED",
      });

      const candPhone = user.phone || cleanPhone;
      const candEmail = user.email || cleanEmail;
      throw new ApiError(
        403,
        `Access Revoked: Candidate with mobile number '${candPhone}' and email '${candEmail}' was TERMINATED and EXITED due to exceeding maximum proctoring warnings (3/3). Under institutional examination policy, your access has been stopped and you cannot log in once again for the exam.`
      );
    }

    // Candidate is verified and active - grant portal access
    const requiresApproval = matchedCollege.requireLoginApproval ?? true;
    if (user.loginApproved === undefined) {
      user.loginApproved = !requiresApproval;
      user.approvalStatus = user.loginApproved ? "APPROVED" : "PENDING";
    }

    // Route student to the Question Paper Set corresponding to their college
    const collegePaperId = matchedCollege.assignedPaperIds?.[0] || user.paperId || store.papers?.[0]?.id;
    const matchedPaper = store.papers?.find((p: any) => p.id === collegePaperId) || store.papers?.[0];

    if (matchedPaper) {
      user.paperId = matchedPaper.id;
      user.paperTitle = matchedPaper.title;
      userSession.paperId = matchedPaper.id;
    }

    user.collegeId = matchedCollege.id;
    user.collegeCode = matchedCollege.code;
    user.collegeName = matchedCollege.name;
    user.hasLoggedIn = true;
    userSession.minDurationMinutes = matchedCollege.minDurationMinutes || 30;
    userSession.maxDurationMinutes = matchedCollege.maxDurationMinutes || 60;
    userSession.requireLoginApproval = requiresApproval;
    userSession.isLoginApproved = Boolean(user.loginApproved);

    store.currentUser = user;
    store.session = userSession;
    saveStore(store);
    return { user, ok: true };
  }

  if (path.startsWith("/auth/company/login")) {
    const cleanEmail = String(body.email || "").trim().toLowerCase();
    const cleanPassword = String(body.password || "");

    if (!cleanEmail) {
      throw new ApiError(400, "Please enter your registered email address.");
    }
    if (!cleanPassword) {
      throw new ApiError(400, "Please enter your password.");
    }

    const user = store.users.find(
      (u: any) => u.email && u.email.toLowerCase() === cleanEmail
    );

    if (!user) {
      throw new ApiError(
        401,
        `Access Denied: No authorized account found for '${cleanEmail}'. Staff accounts can only log in using credentials provisioned by the Master Admin. Please contact your administrator.`
      );
    }

    if (user.role !== "MASTER_ADMIN" && user.role !== "STAFF") {
      throw new ApiError(
        403,
        `Access Denied: Account '${cleanEmail}' is registered as a Candidate/Student. Please use the Student Examination Login portal.`
      );
    }

    if (user.status === "INACTIVE" || user.status === "SUSPENDED" || user.status === "TERMINATED") {
      throw new ApiError(
        403,
        `Account Disabled: Your account has been suspended or deactivated. Contact Master Administrator.`
      );
    }

    // Password validation: Admin-provisioned password or default seed password
    const expectedPassword = user.password || "ChangeMe_123";
    if (cleanPassword !== expectedPassword) {
      throw new ApiError(
        401,
        "Invalid password. If this is an Admin-created staff account, please use the temporary password provided by your Master Administrator."
      );
    }

    // Role check if specific target role was requested (e.g. from role tabs)
    if (body.expectedRole && body.expectedRole !== user.role) {
      if (body.expectedRole === "MASTER_ADMIN") {
        throw new ApiError(
          403,
          `Role Mismatch: '${cleanEmail}' is provisioned as Staff Invigilator, not Master Admin. Please switch to the Staff Invigilator tab.`
        );
      } else if (body.expectedRole === "STAFF") {
        throw new ApiError(
          403,
          `Role Mismatch: '${cleanEmail}' is registered as Master Admin. Please switch to the Master Admin tab.`
        );
      }
    }

    store.currentUser = user;
    if (!store.auditLogs) store.auditLogs = [];
    store.auditLogs.unshift({
      id: `log-${Date.now()}`,
      action: user.role === "MASTER_ADMIN" ? "ADMIN_LOGIN_SUCCESS" : "STAFF_LOGIN_SUCCESS",
      entity: `User (${user.email})`,
      createdAt: new Date().toISOString(),
      actor: { email: user.email },
    });
    saveStore(store);
    return { user, token: "mock-jwt-token" };
  }

  // Dashboard stats
  if (path === "/dashboard") {
    return {
      users: store.users.length,
      exams: store.papers?.length || 1,
      live: store.session?.status === "IN_PROGRESS" ? 1 : 0,
      incidents: store.incidents?.length || 0,
    };
  }

  // Users Management API (Staff Provisioning & Credential Administration)
  if (path.startsWith("/users")) {
    if (method === "POST") {
      if (body.phone) {
        const cleanPhone = String(body.phone).trim();
        const existingPhone = store.users.find((u: any) => u.phone && String(u.phone).trim() === cleanPhone);
        if (existingPhone) {
          throw new ApiError(400, `Mobile number '${cleanPhone}' is already registered. It must be unique.`);
        }
      }
      if (body.email) {
        const cleanEmail = String(body.email).trim().toLowerCase();
        const existingEmail = store.users.find((u: any) => u.email && String(u.email).trim().toLowerCase() === cleanEmail);
        if (existingEmail) {
          throw new ApiError(400, `Email '${cleanEmail}' is already registered.`);
        }
      }
      const newUser = {
        id: `usr-${Date.now()}`,
        ...body,
        email: String(body.email || "").trim().toLowerCase(),
        password: body.password ? String(body.password) : "ChangeMe_123",
        status: body.status || "ACTIVE",
        registeredAt: body.registeredAt || new Date().toISOString(),
      };
      store.users.push(newUser);
      if (!store.auditLogs) store.auditLogs = [];
      store.auditLogs.unshift({
        id: `log-${Date.now()}`,
        action: "STAFF_CREDENTIAL_PROVISIONED",
        entity: `User (${newUser.email})`,
        createdAt: new Date().toISOString(),
        actor: { email: store.currentUser?.email || "admin@kaizentrix.com" },
      });
      saveStore(store);
      return newUser;
    }
    if (method === "PATCH") {
      const targetUser = store.users.find((u: any) => u.id === body.id || (body.email && u.email?.toLowerCase() === String(body.email).toLowerCase()));
      if (targetUser) {
        if (body.status) targetUser.status = body.status;
        if (body.password) targetUser.password = body.password;
        if (body.designation) {
          if (!targetUser.staffProfile) targetUser.staffProfile = {};
          targetUser.staffProfile.designation = body.designation;
        }
        if (!store.auditLogs) store.auditLogs = [];
        store.auditLogs.unshift({
          id: `log-${Date.now()}`,
          action: "STAFF_CREDENTIAL_UPDATED",
          entity: `User (${targetUser.email})`,
          createdAt: new Date().toISOString(),
          actor: { email: store.currentUser?.email || "admin@kaizentrix.com" },
        });
        saveStore(store);
        return targetUser;
      }
      throw new ApiError(404, "User not found.");
    }
    if (method === "DELETE") {
      const parts = path.split("/users/");
      const userId = parts[1]?.split("?")[0];
      if (userId) {
        const userToDelete = store.users.find((u: any) => u.id === userId);
        if (userToDelete && userToDelete.email === "admin@kaizentrix.com") {
          throw new ApiError(400, "Cannot delete primary Master Admin account.");
        }
        store.users = store.users.filter((u: any) => u.id !== userId);
        if (!store.auditLogs) store.auditLogs = [];
        store.auditLogs.unshift({
          id: `log-${Date.now()}`,
          action: "STAFF_ACCOUNT_REMOVED",
          entity: `User (${userToDelete?.email || userId})`,
          createdAt: new Date().toISOString(),
          actor: { email: store.currentUser?.email || "admin@kaizentrix.com" },
        });
        saveStore(store);
        return { ok: true, deletedId: userId };
      }
    }
    const roleParam = path.includes("role=") ? path.split("role=")[1]?.split("&")[0] : null;
    return roleParam ? store.users.filter((u: any) => u.role === roleParam) : store.users;
  }

  // College Management API (Participating Institutions & Question Paper Allocations)
  if (path === "/colleges" || path.startsWith("/colleges?") || path.startsWith("/colleges/")) {
    if (!store.colleges) store.colleges = defaultColleges;

    // GET /colleges or POST /colleges
    if (path === "/colleges" || path.startsWith("/colleges?")) {
      if (method === "GET") {
        return store.colleges.map((c: any) => ({
          ...c,
          assignedPapers: (store.papers || []).filter((p: any) => (c.assignedPaperIds || []).includes(p.id)),
          studentCount: (store.users || []).filter((u: any) => u.collegeCode && u.collegeCode.toUpperCase() === c.code.toUpperCase()).length,
        }));
      }

      if (method === "POST") {
        const { name, code, assignedPaperIds, description, minDurationMinutes, maxDurationMinutes, requireLoginApproval, examConfigs } = body;
        if (!name || !String(name).trim()) {
          throw new ApiError(400, "College Name is required.");
        }

        let cleanCode = code ? String(code).trim().toUpperCase() : "";
        if (!cleanCode) {
          const initials = name
            .split(/\s+/)
            .map((w: string) => w[0])
            .join("")
            .slice(0, 4)
            .toUpperCase();
          cleanCode = `${initials}-${Date.now().toString().slice(-4)}`;
        }

        const existing = store.colleges.find((c: any) => c.code.toUpperCase() === cleanCode);
        if (existing) {
          throw new ApiError(400, `A college with code '${cleanCode}' already exists. Please provide or generate a unique college code.`);
        }

        const minDur = Number(minDurationMinutes) > 0 ? Number(minDurationMinutes) : 30;
        const maxDur = Number(maxDurationMinutes) > 0 ? Number(maxDurationMinutes) : 60;
        if (minDur > maxDur) {
          throw new ApiError(400, "Minimum exam duration cannot be greater than maximum exam duration.");
        }

        const newCollege: College = {
          id: `col-${Date.now()}`,
          name: String(name).trim(),
          code: cleanCode,
          assignedPaperIds: Array.isArray(assignedPaperIds) ? assignedPaperIds : ["paper-set-1"],
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          description: description || "",
          minDurationMinutes: minDur,
          maxDurationMinutes: maxDur,
          requireLoginApproval: requireLoginApproval !== undefined ? Boolean(requireLoginApproval) : true,
          examConfigs: examConfigs || {},
        };

        store.colleges.push(newCollege);
        if (!store.auditLogs) store.auditLogs = [];
        store.auditLogs.unshift({
          id: `log-${Date.now()}`,
          action: "COLLEGE_CREATED",
          entity: `College (${newCollege.name})`,
          createdAt: new Date().toISOString(),
          actor: { email: store.currentUser?.email || "admin@kaizentrix.com" },
        });
        saveStore(store);
        return newCollege;
      }
    }

    // Specific College operations: /colleges/:id/timing-settings
    if (path.includes("/timing-settings") && (method === "POST" || method === "PUT" || method === "PATCH")) {
      const parts = path.split("/");
      const colId = parts[parts.indexOf("timing-settings") - 1];
      const targetCol = store.colleges.find((c: any) => c.id === colId);
      if (!targetCol) throw new ApiError(404, "College not found.");

      if (body.minDurationMinutes !== undefined) {
        targetCol.minDurationMinutes = Math.max(1, Number(body.minDurationMinutes));
      }
      if (body.maxDurationMinutes !== undefined) {
        targetCol.maxDurationMinutes = Math.max(1, Number(body.maxDurationMinutes));
      }
      if (body.requireLoginApproval !== undefined) {
        targetCol.requireLoginApproval = Boolean(body.requireLoginApproval);
      }
      if (body.examConfigs !== undefined) {
        targetCol.examConfigs = body.examConfigs;
      }

      if (targetCol.minDurationMinutes > targetCol.maxDurationMinutes) {
        throw new ApiError(400, "Minimum exam duration cannot be greater than maximum exam duration.");
      }

      if (!store.auditLogs) store.auditLogs = [];
      store.auditLogs.unshift({
        id: `log-${Date.now()}`,
        action: "COLLEGE_TIMING_POLICY_UPDATED",
        entity: `College (${targetCol.name})`,
        metadata: {
          minDuration: targetCol.minDurationMinutes,
          maxDuration: targetCol.maxDurationMinutes,
          requireLoginApproval: targetCol.requireLoginApproval,
        },
        createdAt: new Date().toISOString(),
        actor: { email: store.currentUser?.email || "admin@kaizentrix.com" },
      });
      saveStore(store);
      return targetCol;
    }

    // Specific College operations: /colleges/:id/students (List candidates enrolled for this college)
    if (path.includes("/students") && path.startsWith("/colleges/")) {
      const parts = path.split("/");
      const colId = parts[2];
      const targetCol = store.colleges.find((c: any) => c.id === colId);
      if (!targetCol) throw new ApiError(404, "College not found.");

      const students = (store.users || []).filter(
        (u: any) => u.role === "STUDENT" && u.collegeCode && u.collegeCode.toUpperCase() === targetCol.code.toUpperCase()
      );
      return students.map((s: any) => ({
        ...s,
        loginApproved: s.loginApproved ?? !targetCol.requireLoginApproval,
        approvalStatus: s.approvalStatus ?? (s.loginApproved ? "APPROVED" : targetCol.requireLoginApproval ? "PENDING" : "APPROVED"),
      }));
    }

    // Specific College operations: /colleges/:id/approve-student
    if (path.includes("/approve-student") && method === "POST") {
      const parts = path.split("/");
      const colId = parts[parts.indexOf("approve-student") - 1];
      const { studentId } = body;
      const student = (store.users || []).find((u: any) => u.id === studentId || u.phone === studentId);
      if (!student) throw new ApiError(404, "Student not found.");

      student.loginApproved = true;
      student.approvalStatus = "APPROVED";
      student.loginApprovedAt = new Date().toISOString();
      student.loginApprovedBy = store.currentUser?.email || "staff@kaizentrix.com";

      // Also update matching session if present
      const curSess = getSessionForUser(store, student);
      if (curSess) {
        curSess.isLoginApproved = true;
      }

      if (!store.auditLogs) store.auditLogs = [];
      store.auditLogs.unshift({
        id: `log-${Date.now()}`,
        action: "STUDENT_LOGIN_APPROVED",
        entity: `Student (${student.fullName} - ${student.rollNumber || student.phone})`,
        createdAt: new Date().toISOString(),
        actor: { email: store.currentUser?.email || "staff@kaizentrix.com" },
      });
      saveStore(store);
      return { ok: true, student };
    }

    // Specific College operations: /colleges/:id/approve-all-students
    if (path.includes("/approve-all-students") && method === "POST") {
      const parts = path.split("/");
      const colId = parts[parts.indexOf("approve-all-students") - 1];
      const targetCol = store.colleges.find((c: any) => c.id === colId);
      if (!targetCol) throw new ApiError(404, "College not found.");

      let approvedCount = 0;
      (store.users || []).forEach((u: any) => {
        if (u.role === "STUDENT" && u.collegeCode && u.collegeCode.toUpperCase() === targetCol.code.toUpperCase()) {
          u.loginApproved = true;
          u.approvalStatus = "APPROVED";
          u.loginApprovedAt = new Date().toISOString();
          u.loginApprovedBy = store.currentUser?.email || "staff@kaizentrix.com";
          const sess = getSessionForUser(store, u);
          if (sess) sess.isLoginApproved = true;
          approvedCount++;
        }
      });

      if (!store.auditLogs) store.auditLogs = [];
      store.auditLogs.unshift({
        id: `log-${Date.now()}`,
        action: "BATCH_STUDENT_LOGINS_APPROVED",
        entity: `College (${targetCol.name})`,
        metadata: { approvedCount },
        createdAt: new Date().toISOString(),
        actor: { email: store.currentUser?.email || "staff@kaizentrix.com" },
      });
      saveStore(store);
      return { ok: true, approvedCount };
    }

    // Specific College operations: /colleges/:id/revoke-student
    if (path.includes("/revoke-student") && method === "POST") {
      const parts = path.split("/");
      const colId = parts[parts.indexOf("revoke-student") - 1];
      const { studentId } = body;
      const student = (store.users || []).find((u: any) => u.id === studentId || u.phone === studentId);
      if (!student) throw new ApiError(404, "Student not found.");

      student.loginApproved = false;
      student.approvalStatus = "PENDING";
      delete student.loginApprovedAt;
      delete student.loginApprovedBy;

      const curSess = getSessionForUser(store, student);
      if (curSess) curSess.isLoginApproved = false;

      saveStore(store);
      return { ok: true, student };
    }

    // Specific College operations: /colleges/:id/assign-papers
    if (path.includes("/assign-papers") && method === "POST") {
      const parts = path.split("/");
      const colId = parts[parts.indexOf("assign-papers") - 1];
      const targetCol = store.colleges.find((c: any) => c.id === colId);
      if (!targetCol) throw new ApiError(404, "College not found.");

      targetCol.assignedPaperIds = Array.isArray(body.paperIds) ? body.paperIds : [];
      if (!store.auditLogs) store.auditLogs = [];
      store.auditLogs.unshift({
        id: `log-${Date.now()}`,
        action: "PAPERS_ASSIGNED_TO_COLLEGE",
        entity: `College (${targetCol.name})`,
        createdAt: new Date().toISOString(),
        actor: { email: store.currentUser?.email || "admin@kaizentrix.com" },
      });
      saveStore(store);
      return targetCol;
    }

    // Specific College operations: /colleges/:id
    const colId = path.split("/colleges/")[1]?.split("?")[0];
    if (colId) {
      const targetCol = store.colleges.find((c: any) => c.id === colId);
      if (!targetCol) throw new ApiError(404, "College not found.");

      if (method === "GET") {
        return {
          ...targetCol,
          assignedPapers: (store.papers || []).filter((p: any) => (targetCol.assignedPaperIds || []).includes(p.id)),
          studentCount: (store.users || []).filter((u: any) => u.collegeCode && u.collegeCode.toUpperCase() === targetCol.code.toUpperCase()).length,
        };
      }

      if (method === "PUT" || method === "PATCH") {
        if (body.name) targetCol.name = String(body.name).trim();
        if (body.code) {
          const newCode = String(body.code).trim().toUpperCase();
          const dup = store.colleges.find((c: any) => c.id !== colId && c.code.toUpperCase() === newCode);
          if (dup) throw new ApiError(400, `College code '${newCode}' is already taken by another college.`);
          targetCol.code = newCode;
        }
        if (Array.isArray(body.assignedPaperIds)) {
          targetCol.assignedPaperIds = body.assignedPaperIds;
        }
        if (body.description !== undefined) targetCol.description = body.description;
        if (body.status) targetCol.status = body.status;
        if (body.minDurationMinutes !== undefined) targetCol.minDurationMinutes = Math.max(1, Number(body.minDurationMinutes));
        if (body.maxDurationMinutes !== undefined) targetCol.maxDurationMinutes = Math.max(1, Number(body.maxDurationMinutes));
        if (body.requireLoginApproval !== undefined) targetCol.requireLoginApproval = Boolean(body.requireLoginApproval);
        if (body.examConfigs !== undefined) targetCol.examConfigs = body.examConfigs;

        if (targetCol.minDurationMinutes > targetCol.maxDurationMinutes) {
          throw new ApiError(400, "Minimum exam duration cannot be greater than maximum exam duration.");
        }

        if (!store.auditLogs) store.auditLogs = [];
        store.auditLogs.unshift({
          id: `log-${Date.now()}`,
          action: "COLLEGE_UPDATED",
          entity: `College (${targetCol.name})`,
          createdAt: new Date().toISOString(),
          actor: { email: store.currentUser?.email || "admin@kaizentrix.com" },
        });
        saveStore(store);
        return targetCol;
      }

      if (method === "DELETE") {
        if (store.colleges.length <= 1) {
          throw new ApiError(400, "Cannot delete the only remaining college. At least one college must remain active.");
        }
        store.colleges = store.colleges.filter((c: any) => c.id !== colId);
        if (!store.auditLogs) store.auditLogs = [];
        store.auditLogs.unshift({
          id: `log-${Date.now()}`,
          action: "COLLEGE_DELETED",
          entity: `College (${targetCol.name})`,
          createdAt: new Date().toISOString(),
          actor: { email: store.currentUser?.email || "admin@kaizentrix.com" },
        });
        saveStore(store);
        return { ok: true, deletedId: colId };
      }
    }
  }

  // Platform Settings & Configuration
  if (path === "/settings" || path.endsWith("/settings")) {
    if (method === "GET") {
      return store.settings || defaultSettings;
    }
    if (method === "POST" || method === "PUT" || method === "PATCH") {
      store.settings = {
        ...(store.settings || defaultSettings),
        ...body,
        updatedAt: new Date().toISOString(),
      };
      if (!store.auditLogs) store.auditLogs = [];
      store.auditLogs.unshift({
        id: `log-${Date.now()}`,
        action: "SETTINGS_UPDATED",
        entity: "PlatformSettings",
        createdAt: new Date().toISOString(),
        actor: { email: store.currentUser?.email || "admin@kaizentrix.com" },
      });
      saveStore(store);
      return store.settings;
    }
  }

  if (path.endsWith("/settings/reset") && method === "POST") {
    store.settings = { ...defaultSettings, updatedAt: new Date().toISOString() };
    if (!store.auditLogs) store.auditLogs = [];
    store.auditLogs.unshift({
      id: `log-${Date.now()}`,
      action: "SETTINGS_RESET_DEFAULT",
      entity: "PlatformSettings",
      createdAt: new Date().toISOString(),
      actor: { email: store.currentUser?.email || "admin@kaizentrix.com" },
    });
    saveStore(store);
    return store.settings;
  }

  // Assignments (Candidate to Exam/Paper allocation)
  if (path === "/assignments" && method === "POST") {
    const { examId, studentIds } = body;
    const targetPaper = (store.papers || []).find((p: any) => p.id === examId || p.code === examId) || store.papers?.[0] || store.exam;
    if (studentIds && Array.isArray(studentIds)) {
      store.users.forEach((u: any) => {
        if (studentIds.includes(u.id)) {
          u.paperId = targetPaper.id;
          u.paperCode = targetPaper.code || targetPaper.accessCode;
          u.paperTitle = targetPaper.title;
        }
      });
      saveStore(store);
    }
    return { ok: true, assignedCount: studentIds?.length || 0, paperCode: targetPaper.code || targetPaper.accessCode };
  }

  // Question Papers (Sets with Unique Access Codes)
  if (path === "/papers" || path.startsWith("/papers?")) {
    if (method === "POST") {
      const cleanCode = (body.code || `SET-${Date.now().toString().slice(-4)}`).trim().toUpperCase();
      const existingPaper = store.papers.find((p: any) => p.code.toUpperCase() === cleanCode);
      if (existingPaper) {
        throw new ApiError(400, `Access Code '${cleanCode}' is already assigned to '${existingPaper.title}'. Each Question Paper Set must have a unique candidate access code.`);
      }

      const newPaper = {
        id: `paper-${Date.now()}`,
        title: body.title || "Custom Question Paper Set",
        code: cleanCode,
        description: body.description || "Configured question paper assessment set.",
        durationMinutes: Number(body.durationMinutes) || 30,
        passPercent: Number(body.passPercent) || 50,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };

      store.papers.push(newPaper);
      saveStore(store);
      return newPaper;
    }

    // Return papers with dynamic aggregate metrics
    return store.papers.map((p: any) => {
      const qs = store.questions.filter((q: any) => q.paperId === p.id);
      const totalMarks = qs.reduce((sum: number, q: any) => sum + (Number(q.marks) || 0), 0);
      const codingCount = qs.filter((q: any) => q.type === "CODING").length;
      const mcqCount = qs.length - codingCount;
      return {
        ...p,
        questionCount: qs.length,
        totalMarks,
        mcqCount: qs.length,
      };
    });
  }

  if (path.startsWith("/papers/") && method === "GET") {
    const paperId = path.split("/papers/")[1];
    const paper = store.papers.find((p: any) => p.id === paperId);
    if (!paper) throw new ApiError(404, "Question Paper Set not found");
    const qs = store.questions.filter((q: any) => q.paperId === paper.id);
    const totalMarks = qs.reduce((sum: number, q: any) => sum + (Number(q.marks) || 0), 0);
    return {
      ...paper,
      questionCount: qs.length,
      totalMarks,
      mcqCount: qs.length,
    };
  }

  if (path.startsWith("/papers/") && (method === "PUT" || method === "PATCH")) {
    const paperId = path.split("/papers/")[1];
    const idx = store.papers.findIndex((p: any) => p.id === paperId);
    if (idx >= 0) {
      store.papers[idx] = {
        ...store.papers[idx],
        ...body,
        id: paperId,
      };
      saveStore(store);
      return store.papers[idx];
    }
    throw new ApiError(404, "Question Paper Set not found");
  }

  if (path.startsWith("/papers/") && method === "DELETE") {
    const paperId = path.split("/papers/")[1];
    if (store.papers.length <= 1) {
      throw new ApiError(400, "Cannot delete the only remaining Question Paper Set. At least one paper set must remain active.");
    }
    store.papers = store.papers.filter((p: any) => p.id !== paperId);
    store.questions = store.questions.filter((q: any) => q.paperId !== paperId);
    saveStore(store);
    return { ok: true, deletedId: paperId };
  }

  // Questions (per-paper CRUD)
  if (path === "/questions" || path.startsWith("/questions?")) {
    if (method === "POST") {
      const targetPaperId = body.paperId || store.papers?.[0]?.id || "paper-set-1";
      const qId = `q-${Date.now()}`;
      const options = Array.isArray(body.options)
        ? body.options.map((o: any, idx: number) => ({
            ...o,
            id: o.id || `${qId}-opt-${o.label ? String(o.label).toLowerCase() : idx}`,
          }))
        : [];
      const newQ = {
        id: qId,
        ...body,
        options,
        paperId: targetPaperId,
        bank: { name: body.bank?.name || "Recruitment Core" },
      };
      store.questions.push(newQ);
      saveStore(store);
      return newQ;
    }

    if (path.includes("paperId=")) {
      const pId = new URLSearchParams(path.split("?")[1]).get("paperId");
      return store.questions.filter((q: any) => q.paperId === pId);
    }
    return store.questions;
  }

  if (path.startsWith("/questions/") && method === "GET") {
    const qId = path.split("/questions/")[1];
    const q = store.questions.find((item: any) => item.id === qId);
    if (!q) throw new ApiError(404, "Question not found");
    return q;
  }

  if (path.startsWith("/questions/") && (method === "PUT" || method === "PATCH")) {
    const qId = path.split("/questions/")[1];
    const idx = store.questions.findIndex((q: any) => q.id === qId);
    if (idx >= 0) {
      const options = Array.isArray(body.options)
        ? body.options.map((o: any, oIdx: number) => ({
            ...o,
            id: o.id || `${qId}-opt-${o.label ? String(o.label).toLowerCase() : oIdx}`,
          }))
        : store.questions[idx].options;
      store.questions[idx] = {
        ...store.questions[idx],
        ...body,
        options,
        id: qId,
      };
      saveStore(store);
      return store.questions[idx];
    }
    throw new ApiError(404, "Question not found");
  }

  if (path.startsWith("/questions/") && method === "DELETE") {
    const qId = path.split("/questions/")[1];
    store.questions = store.questions.filter((q: any) => q.id !== qId);
    saveStore(store);
    return { ok: true };
  }

  // Exams
  if (path === "/exams") {
    if (method === "POST") {
      const examId = `paper-set-${Date.now()}`;
      const code = (body.accessCode || `KGS-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase().trim();
      const newExam = {
        id: examId,
        title: body.title,
        kind: body.kind || "OBJECTIVE_MCQ",
        accessCode: code,
        durationMinutes: Number(body.durationMinutes) || 30,
        passPercent: Number(body.passPercent) || 50,
        description: body.description || "",
        status: "PUBLISHED",
        runs: [{ id: `run-${Date.now()}`, startedAt: new Date().toISOString(), status: "LIVE" }],
      };
      if (!store.exams) store.exams = [store.exam];
      store.exams.push(newExam);

      // Create matching Question Paper Set in store.papers
      if (!store.papers) store.papers = [...defaultPapers];
      store.papers.push({
        id: examId,
        title: body.title,
        code: code,
        description: body.description || "",
        durationMinutes: Number(body.durationMinutes) || 30,
        passPercent: Number(body.passPercent) || 50,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      });

      // Seed starter aptitude questions for this paper so candidates can immediately attempt it
      const starterQuestions = [
        {
          id: `q-${examId}-1`,
          paperId: examId,
          bankId: "bank-1",
          bank: { name: "Quantitative Aptitude" },
          type: "SINGLE_MCQ",
          stem: `[${body.title}] A sum of money doubles itself in 5 years at simple interest. What is the annual interest rate?`,
          marks: 2,
          negativeMarks: 0.5,
          options: [
            { id: `opt-${examId}-1a`, label: "A", text: "15%", isCorrect: false },
            { id: `opt-${examId}-1b`, label: "B", text: "20%", isCorrect: true },
            { id: `opt-${examId}-1c`, label: "C", text: "25%", isCorrect: false },
            { id: `opt-${examId}-1d`, label: "D", text: "10%", isCorrect: false },
          ],
        },
        {
          id: `q-${examId}-2`,
          paperId: examId,
          bankId: "bank-1",
          bank: { name: "Logical Reasoning" },
          type: "SINGLE_MCQ",
          stem: `[${body.title}] If A is brother of B, B is sister of C, and C is father of D, how is A related to D?`,
          marks: 2,
          negativeMarks: 0.5,
          options: [
            { id: `opt-${examId}-2a`, label: "A", text: "Father", isCorrect: false },
            { id: `opt-${examId}-2b`, label: "B", text: "Uncle", isCorrect: true },
            { id: `opt-${examId}-2c`, label: "C", text: "Brother", isCorrect: false },
            { id: `opt-${examId}-2d`, label: "D", text: "Nephew", isCorrect: false },
          ],
        },
        {
          id: `q-${examId}-3`,
          paperId: examId,
          bankId: "bank-1",
          bank: { name: "Quantitative Aptitude" },
          type: "SINGLE_MCQ",
          stem: `[${body.title}] Find the next number in sequence: 3, 7, 15, 31, 63, ___?`,
          marks: 2,
          negativeMarks: 0.5,
          options: [
            { id: `opt-${examId}-3a`, label: "A", text: "95", isCorrect: false },
            { id: `opt-${examId}-3b`, label: "B", text: "127", isCorrect: true },
            { id: `opt-${examId}-3c`, label: "C", text: "125", isCorrect: false },
            { id: `opt-${examId}-3d`, label: "D", text: "131", isCorrect: false },
          ],
        },
        {
          id: `q-${examId}-4`,
          paperId: examId,
          bankId: "bank-1",
          bank: { name: "Quantitative Aptitude" },
          type: "SINGLE_MCQ",
          stem: `[${body.title}] A vehicle travels at 72 km/h. How many meters does it cover in 15 seconds?`,
          marks: 2,
          negativeMarks: 0.5,
          options: [
            { id: `opt-${examId}-4a`, label: "A", text: "250 meters", isCorrect: false },
            { id: `opt-${examId}-4b`, label: "B", text: "300 meters", isCorrect: true },
            { id: `opt-${examId}-4c`, label: "C", text: "350 meters", isCorrect: false },
            { id: `opt-${examId}-4d`, label: "D", text: "400 meters", isCorrect: false },
          ],
        },
      ];
      if (!store.questions) store.questions = [...defaultQuestions];
      store.questions.push(...starterQuestions);

      saveStore(store);
      return newExam;
    }

    // Merge paper sets into examinations list
    const paperSets = store.papers && store.papers.length > 0 ? store.papers : defaultPapers;
    return paperSets.map((p: any) => ({
      id: p.id,
      title: p.title,
      status: p.status === "ACTIVE" ? "PUBLISHED" : "DRAFT",
      durationMinutes: p.durationMinutes ?? 30,
      passPercent: p.passPercent ?? 50,
      kind: "OBJECTIVE_MCQ",
      accessCode: p.code,
      code: p.code,
      description: p.description,
      totalQuestions: (store.questions || []).filter((q: any) => q.paperId === p.id).length || 4,
    }));
  }

  if (path.startsWith("/exams/") && method === "DELETE") {
    const delId = path.split("/exams/")[1];
    if (store.papers && store.papers.length > 1) {
      store.papers = store.papers.filter((p: any) => p.id !== delId);
      if (store.exams) store.exams = store.exams.filter((e: any) => e.id !== delId);
      if (store.questions) store.questions = store.questions.filter((q: any) => q.paperId !== delId);
      saveStore(store);
    }
    return { ok: true, deletedId: delId };
  }

  if ((path === "/exams/clear-data" || path.endsWith("/clear-data")) && method === "POST") {
    const targetCode = String(body?.code || "").trim().toUpperCase();

    if (!store.clearedCodes) store.clearedCodes = [];
    if (!targetCode || targetCode === "ALL") {
      store.clearedCodes = ["ALL", ...((store.papers || []).map((p: any) => String(p.code || "").toUpperCase()))];
    } else if (!store.clearedCodes.includes(targetCode)) {
      store.clearedCodes.push(targetCode);
    }

    // Reset results for this code
    if (store.results) {
      if (targetCode && targetCode !== "ALL") {
        store.results = store.results.filter((r: any) => {
          const pCode = String(r.session?.paperCode || "").trim().toUpperCase();
          return pCode !== targetCode;
        });
      } else {
        store.results = [];
      }
    }

    // Reset candidate sessions and warnings for this code
    if (store.users) {
      store.users.forEach((u: any) => {
        const uCode = String(u.paperCode || "").trim().toUpperCase();
        if (!targetCode || targetCode === "ALL" || uCode === targetCode || !uCode) {
          u.examStatus = "READY";
          u.isTerminated = false;
          u.blocked = false;
          u.status = "ACTIVE";
          u.warningCount = 0;
          delete u.terminatedReason;
          delete u.answers;
        }
      });
    }

    // Reset sessions map
    if (store.sessions) {
      Object.keys(store.sessions).forEach((k) => {
        const s = store.sessions[k];
        const sCode = String(s.paperCode || "").trim().toUpperCase();
        if (!targetCode || targetCode === "ALL" || sCode === targetCode || !sCode) {
          s.status = "READY";
          s.warningCount = 0;
          s.answers = {};
          s.warnings = [];
          s.incidents = [];
          delete s.score;
          delete s.terminatedReason;
          s.serverDeadlineAt = null;
          s.consentAt = null;
        }
      });
    }

    // Reset default active session
    if (store.session) {
      store.session.status = "READY";
      store.session.warningCount = 0;
      store.session.answers = {};
      store.session.warnings = [];
      store.session.incidents = [];
      delete store.session.score;
      delete store.session.terminatedReason;
    }

    // Lift termination restrictions in localStorage for fresh attempts
    try {
      if (typeof window !== "undefined") {
        const storedTerms = window.localStorage.getItem("kgs_terminated_candidates_v1");
        if (storedTerms) {
          const list = JSON.parse(storedTerms);
          const filtered = (!targetCode || targetCode === "ALL")
            ? []
            : list.filter((t: any) => {
                const cand = store.users?.find((u: any) => u.id === t.userId || u.phone === t.phone || u.email === t.email);
                const candCode = String(cand?.paperCode || "KGS-2026").toUpperCase();
                return candCode !== targetCode;
              });
          window.localStorage.setItem("kgs_terminated_candidates_v1", JSON.stringify(filtered));
        }
      }
    } catch {
      // ignore
    }

    saveStore(store);
    return { ok: true, clearedCode: targetCode };
  }

  if (path.endsWith("/publish") && path.startsWith("/exams/")) {
    const examId = path.split("/")[2];
    const targetPaper = store.papers?.find((p: any) => p.id === examId);
    if (targetPaper) targetPaper.status = "ACTIVE";
    store.exam.status = "PUBLISHED";
    saveStore(store);
    return { ok: true, status: "PUBLISHED" };
  }
  if (path.endsWith("/start")) {
    store.exam.runs[0] = { id: "run-1", startedAt: new Date().toISOString(), status: "LIVE" };
    store.session.status = "READY";
    store.session.serverDeadlineAt = new Date(Date.now() + store.exam.durationMinutes * 60 * 1000).toISOString();
    saveStore(store);
    return store.exam.runs[0];
  }
  if (path.endsWith("/lobby") && path.startsWith("/exams/")) {
    const studentUsers = store.users.filter((u: any) => u.role === "STUDENT");
    return studentUsers.map((u: any, idx: number) => {
      const isCur = u.id === store.currentUser?.id;
      const warningCount = u.warningCount ?? (isCur ? (store.session.warningCount || 0) : (idx === 1 ? 1 : 0));
      const isTerminated = u.isTerminated || u.status === "TERMINATED" || warningCount >= 3;
      const defaultStatus = idx === 0 ? "IN_PROGRESS" : idx === 1 ? "IN_PROGRESS" : "READY";
      const status = isTerminated ? "TERMINATED" : (u.examStatus || (isCur ? store.session.status : defaultStatus));

      const paperCode = u.paperCode || (idx === 1 ? "SET-DEV-2026" : "KGS-2026");
      const paperTitle = u.paperTitle || (idx === 1 ? "Question Paper Set 2: Logical Reasoning" : "Question Paper Set 1: Quantitative Aptitude");

      return {
        id: isCur ? store.session.id : `sess-${u.id}`,
        studentId: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone || `987654321${idx}`,
        rollNumber: u.rollNumber || `KGS-2026-00${idx + 1}`,
        paperCode,
        paperTitle,
        status,
        readinessOk: true,
        consentAt: u.registeredAt || "2026-10-10T09:30:00.000Z",
        startedAt: u.registeredAt || "2026-10-10T09:35:00.000Z",
        warningCount,
        answeredCount: isCur ? Object.keys(store.answers || {}).length : (idx === 0 ? 3 : idx === 1 ? 2 : 0),
        totalQuestions: store.questions?.length || 6,
        incidents: u.incidents || (warningCount >= 3 ? [{ id: `inc-${u.id}`, summary: "Maximum 3 warnings exceeded - Disciplinary termination", status: "OPEN" }] : []),
        events: u.events || [
          { type: "FACE_LOCKED", detail: "Face centered and verified", time: "1m ago" },
          { type: "GAZE_CENTER", detail: "Gaze aligned with question canvas", time: "2m ago" },
          { type: "FULLSCREEN_ACTIVE", detail: "Fullscreen integrity locked", time: "4m ago" },
        ],
        gazeStatus: warningCount > 0 ? "UNALIGNED" : "CENTERED",
        faceStatus: warningCount >= 3 ? "MISSING" : "LOCKED",
        ipAddress: `192.168.1.${10 + idx}`,
        cameraDevice: "Integrated HD Webcam (720p)",
      };
    });
  }

  // Invigilator Actions from Monitoring Command Center
  if (path.endsWith("/terminate") && (path.includes("/exam-sessions/") || path.includes("/sessions/"))) {
    const parts = path.split("/");
    const sessId = parts[parts.indexOf("terminate") - 1];
    const studentUser = store.users.find(
      (u: any) => `sess-${u.id}` === sessId || u.id === sessId || (store.session.id === sessId && u.id === store.session.studentId)
    );
    if (studentUser) {
      studentUser.isTerminated = true;
      studentUser.blocked = true;
      studentUser.examStatus = "TERMINATED";
      studentUser.status = "TERMINATED";
      studentUser.warningCount = 3;
      studentUser.terminatedReason = body.reason || "INVIGILATOR_FORCE_TERMINATE";
    }
    if (store.session.id === sessId) {
      store.session.status = "TERMINATED";
      store.session.warningCount = 3;
      store.session.terminatedReason = body.reason || "INVIGILATOR_FORCE_TERMINATE";
    }
    saveStore(store);
    return { ok: true, status: "TERMINATED" };
  }

  if (path.endsWith("/issue-warning") && (path.includes("/exam-sessions/") || path.includes("/sessions/"))) {
    const parts = path.split("/");
    const sessId = parts[parts.indexOf("issue-warning") - 1];
    const studentUser = store.users.find(
      (u: any) => `sess-${u.id}` === sessId || u.id === sessId || (store.session.id === sessId && u.id === store.session.studentId)
    );
    let newCount = 1;
    if (studentUser) {
      studentUser.warningCount = Math.min(3, (studentUser.warningCount || 0) + 1);
      newCount = studentUser.warningCount;
      if (studentUser.warningCount >= 3) {
        studentUser.isTerminated = true;
        studentUser.blocked = true;
        studentUser.examStatus = "TERMINATED";
        studentUser.status = "TERMINATED";
        studentUser.terminatedReason = "MAX_WARNINGS_EXCEEDED";
      }
    }
    if (store.session.id === sessId) {
      store.session.warningCount = Math.min(3, (store.session.warningCount || 0) + 1);
      newCount = store.session.warningCount;
      if (store.session.warningCount >= 3) {
        store.session.status = "TERMINATED";
      }
    }
    saveStore(store);
    return { ok: true, warningCount: newCount };
  }

  if (path.endsWith("/advisory") && (path.includes("/exam-sessions/") || path.includes("/sessions/"))) {
    return { ok: true, message: "Advisory notice dispatched to candidate screen." };
  }

  // Student Exams (Filtered strictly by College Assignment)
  if (path === "/student/exams") {
    const curSess = getSessionForUser(store, store.currentUser);
    store.session = curSess;
    const curUser = store.currentUser;
    const college = curUser?.collegeCode
      ? (store.colleges || defaultColleges).find((c: any) => c.code && c.code.toUpperCase() === curUser.collegeCode.toUpperCase())
      : (store.colleges || defaultColleges)[0];

    const assignedIds = (college?.assignedPaperIds && college.assignedPaperIds.length > 0)
      ? college.assignedPaperIds
      : ["paper-set-1"];
    const candidatePapers = (store.papers || defaultPapers).filter((p: any) => assignedIds.includes(p.id));

    return candidatePapers.map((p: any) => {
      const dynamicExam = {
        ...store.exam,
        id: p.id,
        title: p.title,
        accessCode: p.code,
        durationMinutes: p.durationMinutes || store.exam.durationMinutes || 30,
        passPercent: p.passPercent || store.exam.passPercent || 50,
        description: p.description,
        collegeName: college?.name,
        collegeCode: college?.code,
      };
      return { exam: dynamicExam, session: curSess };
    });
  }
  if (path.startsWith("/student/exams/")) {
    const curSess = getSessionForUser(store, store.currentUser);
    store.session = curSess;
    const parts = path.split("/");
    const requestedExamId = parts[3];

    const curUser = store.currentUser;
    const college = curUser?.collegeCode
      ? (store.colleges || defaultColleges).find((c: any) => c.code && c.code.toUpperCase() === curUser.collegeCode.toUpperCase())
      : (store.colleges || defaultColleges)[0];

    const assignedIds = (college?.assignedPaperIds && college.assignedPaperIds.length > 0)
      ? college.assignedPaperIds
      : ["paper-set-1"];

    const targetPaperId = (requestedExamId && assignedIds.includes(requestedExamId))
      ? requestedExamId
      : (curSess.paperId && assignedIds.includes(curSess.paperId))
        ? curSess.paperId
        : assignedIds[0] || store.papers?.[0]?.id;

    const activePaper = store.papers?.find((p: any) => p.id === targetPaperId) || store.papers?.[0] || store.exam;

    const minDur = (college?.examConfigs?.[activePaper.id]?.minDurationMinutes) ?? college?.minDurationMinutes ?? 30;
    const maxDur = (college?.examConfigs?.[activePaper.id]?.maxDurationMinutes) ?? college?.maxDurationMinutes ?? (activePaper.durationMinutes || 60);
    const requireApproval = (college?.examConfigs?.[activePaper.id]?.requireLoginApproval) ?? college?.requireLoginApproval ?? true;
    const isApproved = curUser?.loginApproved ?? !requireApproval;

    return {
      id: curSess.id,
      status: curSess.status,
      readinessOk: curSess.readinessOk,
      consentAt: curSess.consentAt,
      warningCount: curSess.warningCount,
      minDurationMinutes: minDur,
      maxDurationMinutes: maxDur,
      requireLoginApproval: requireApproval,
      isLoginApproved: isApproved,
      approvalStatus: curUser?.approvalStatus ?? (isApproved ? "APPROVED" : "PENDING"),
      examRun: {
        startedAt: store.exam.runs[0]?.startedAt,
        exam: {
          ...store.exam,
          id: activePaper.id,
          title: activePaper.title || store.exam.title,
          accessCode: activePaper.code,
          durationMinutes: maxDur,
          minDurationMinutes: minDur,
          maxDurationMinutes: maxDur,
          collegeName: college?.name,
          collegeCode: college?.code,
          requireLoginApproval: requireApproval,
          isLoginApproved: isApproved,
        },
      },
    };
  }

  // Session lifecycle
  if (path.endsWith("/readiness")) {
    const curSess = getSessionForUser(store, store.currentUser);
    const termRest = checkTerminationRestriction(undefined, store.currentUser?.phone, store.currentUser?.email);
    if (termRest || curSess.status === "TERMINATED" || curSess.warningCount >= 3 || store.currentUser?.isTerminated) {
      throw new ApiError(403, "Access Blocked: Your examination sitting was terminated due to exceeding 3 proctoring alerts. You cannot take exams.");
    }
    if (curSess.status === "SUBMITTED" || curSess.status === "TIMED_OUT") {
      throw new ApiError(403, "Examination already submitted.");
    }
    curSess.readinessOk = true;
    store.session.readinessOk = true;
    saveStore(store);
    return { ok: true };
  }
  if (path.endsWith("/consent")) {
    const curSess = getSessionForUser(store, store.currentUser);
    const termRest = checkTerminationRestriction(undefined, store.currentUser?.phone, store.currentUser?.email);
    if (termRest || curSess.status === "TERMINATED" || curSess.warningCount >= 3 || store.currentUser?.isTerminated) {
      throw new ApiError(403, "Access Blocked: Your examination sitting was terminated due to policy alerts. You cannot proceed.");
    }
    if (curSess.status === "SUBMITTED" || curSess.status === "TIMED_OUT") {
      throw new ApiError(403, "Examination already submitted.");
    }
    curSess.consentAt = new Date().toISOString();
    store.session.consentAt = curSess.consentAt;
    saveStore(store);
    return { ok: true };
  }
  if (path.endsWith("/begin")) {
    const curSess = getSessionForUser(store, store.currentUser);
    const termRest = checkTerminationRestriction(undefined, store.currentUser?.phone, store.currentUser?.email);
    if (termRest || curSess.status === "TERMINATED" || curSess.warningCount >= 3 || store.currentUser?.isTerminated) {
      throw new ApiError(403, "Access Blocked: Your examination sitting was terminated due to exceeding 3 proctoring alerts. You cannot re-enter or take exams.");
    }
    if (curSess.status === "SUBMITTED" || curSess.status === "TIMED_OUT") {
      throw new ApiError(403, "Examination already submitted. Under the single-attempt policy, re-attempts are prohibited.");
    }

    // Verify candidate college & login approval settings
    const candidateCollege = (store.colleges || defaultColleges).find(
      (c: any) => c.code && store.currentUser?.collegeCode && c.code.toUpperCase() === store.currentUser.collegeCode.toUpperCase()
    ) || (store.colleges || defaultColleges)[0];

    const targetPaperId = curSess.paperId || store.currentUser?.paperId || store.papers?.[0]?.id;
    const activePaper = store.papers?.find((p: any) => p.id === targetPaperId) || store.papers?.[0] || store.exam;

    const minDuration = (candidateCollege?.examConfigs?.[activePaper.id]?.minDurationMinutes) ?? candidateCollege?.minDurationMinutes ?? 30;
    const maxDuration = (candidateCollege?.examConfigs?.[activePaper.id]?.maxDurationMinutes) ?? candidateCollege?.maxDurationMinutes ?? (activePaper.durationMinutes || 60);
    const requireApproval = (candidateCollege?.examConfigs?.[activePaper.id]?.requireLoginApproval) ?? candidateCollege?.requireLoginApproval ?? true;

    // Login Approval Check
    if (requireApproval && store.currentUser && store.currentUser.loginApproved === false) {
      throw new ApiError(
        403,
        `Student Login Approval Required: An Invigilator or Administrator must approve your candidate login before you can begin the examination. Please wait in the examination lobby or notify your proctor.`
      );
    }

    curSess.status = "IN_PROGRESS";
    store.session = curSess;

    // Rule 1: Calculate the exam timer from actual server-recorded exam start time, NOT login time alone!
    if (!curSess.startedAt) {
      curSess.startedAt = new Date().toISOString();
    }
    const startedMs = new Date(curSess.startedAt).getTime();

    // Set server timing thresholds
    curSess.minDurationMinutes = minDuration;
    curSess.maxDurationMinutes = maxDuration;
    curSess.serverDeadlineAt = new Date(startedMs + maxDuration * 60 * 1000).toISOString();
    curSess.serverMinCompletionAt = new Date(startedMs + minDuration * 60 * 1000).toISOString();

    if (store.clearedCodes) {
      const pCode = String(activePaper.code || "").toUpperCase();
      store.clearedCodes = store.clearedCodes.filter((c: string) => c !== pCode && c !== "ALL");
    }
    saveStore(store);

    // Filter questions strictly belonging to this candidate's specific Question Paper Set
    let paperQuestions = store.questions.filter((q: any) => q.paperId === targetPaperId);
    if (paperQuestions.length === 0) {
      paperQuestions = store.questions;
    }

    return {
      session: {
        id: curSess.id,
        status: "IN_PROGRESS",
        startedAt: curSess.startedAt,
        serverDeadlineAt: curSess.serverDeadlineAt,
        serverMinCompletionAt: curSess.serverMinCompletionAt,
        minDurationMinutes: curSess.minDurationMinutes,
        maxDurationMinutes: curSess.maxDurationMinutes,
        warningCount: curSess.warningCount,
        examTitle: activePaper.title || store.exam.title,
        paperCode: activePaper.code || store.exam.accessCode,
      },
      questions: paperQuestions.map((q: any) => ({
        id: q.id,
        type: q.type,
        stem: q.stem,
        marks: q.marks,
        starterCode: q.starterCode,
        testCases: q.testCases,
        options: (q.options || []).map((o: any, idx: number) => ({
          id: o.id || `${q.id}-opt-${o.label ? String(o.label).toLowerCase() : idx}`,
          label: o.label || String.fromCharCode(65 + idx),
          text: o.text || "",
          // Note: isCorrect is deliberately not sent to candidates in exam view
        })),
        answer: curSess.answers?.[q.id] ?? null,
      })),
    };
  }
  if (path.endsWith("/answers")) {
    const curSess = getSessionForUser(store, store.currentUser);
    const termRest = checkTerminationRestriction(undefined, store.currentUser?.phone, store.currentUser?.email);
    if (termRest || curSess.status === "TERMINATED" || curSess.warningCount >= 3 || store.currentUser?.isTerminated) {
      throw new ApiError(403, "Examination session is terminated.");
    }
    if (!curSess.answers) curSess.answers = {};
    curSess.answers[body.questionId] = body.payload;
    store.session = curSess;
    saveStore(store);
    return { ok: true };
  }
  if (path.endsWith("/submit")) {
    const curSess = getSessionForUser(store, store.currentUser);
    const isExceeded = body.reason === "MAX_WARNINGS_EXCEEDED" || (curSess.warningCount && curSess.warningCount >= 3);
    const isTimeout = body.reason === "TIMEOUT";

    // Rule 2 & 5: Backend Enforcement - Prevent submission before configured minimum duration!
    if (body.reason === "STUDENT" && !isExceeded && !isTimeout) {
      const nowTs = Date.now();
      const minThreshold = curSess.serverMinCompletionAt ? new Date(curSess.serverMinCompletionAt).getTime() : 0;
      if (minThreshold && nowTs < minThreshold) {
        const diffSec = Math.ceil((minThreshold - nowTs) / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const remSec = diffSec % 60;
        const unlockTimeStr = new Date(minThreshold).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        throw new ApiError(
          400,
          `Submission Rejected: Institutional examination policy requires a minimum completion time of ${curSess.minDurationMinutes || 30} minutes. You cannot submit before ${unlockTimeStr} (remaining: ${diffMin}m ${remSec}s). Please continue reviewing your questions and test cases.`
        );
      }
    }

    curSess.status = isTimeout ? "TIMED_OUT" : isExceeded ? "TERMINATED" : "SUBMITTED";
    if (isExceeded) {
      curSess.warningCount = 3;
      curSess.terminatedReason = "MAX_WARNINGS_EXCEEDED";
    }
    store.session = curSess;

    if (store.currentUser) {
      store.currentUser.examStatus = curSess.status;
      if (isExceeded) {
        store.currentUser.isTerminated = true;
        store.currentUser.blocked = true;
        store.currentUser.status = "TERMINATED";
        store.currentUser.warningCount = 3;
        store.currentUser.terminatedReason = "MAX_WARNINGS_EXCEEDED";
      }
    }

    if (isExceeded) {
      const candUser = store.currentUser || store.users.find((u: any) => u.id === curSess.studentId || (curSess.phone && u.phone === curSess.phone));
      const termPhone = candUser?.phone || curSess.phone;
      const termEmail = candUser?.email;

      store.users.forEach((u: any) => {
        if (
          (termPhone && u.phone && String(u.phone).trim() === String(termPhone).trim()) ||
          (termEmail && u.email && String(u.email).trim().toLowerCase() === String(termEmail).trim().toLowerCase()) ||
          (candUser && u.id === candUser.id)
        ) {
          u.examStatus = "TERMINATED";
          u.isTerminated = true;
          u.blocked = true;
          u.status = "TERMINATED";
          u.warningCount = 3;
          u.terminatedReason = "MAX_WARNINGS_EXCEEDED";
        }
      });

      recordCandidateTermination({
        userId: candUser?.id || curSess.studentId,
        phone: termPhone,
        email: termEmail,
        fullName: candUser?.fullName,
        reason: "MAX_WARNINGS_EXCEEDED",
      });
    }

    const targetPaperId = curSess.paperId || store.currentUser?.paperId || store.papers?.[0]?.id;
    const activePaper = store.papers?.find((p: any) => p.id === targetPaperId) || store.papers?.[0] || store.exam;

    const sc = computeAuthoritativeScore(store, targetPaperId);
    curSess.score = sc;
    store.session.score = sc;

    if (!store.results) store.results = [];
    const existingRes = store.results.find((r: any) => r.session?.id === curSess.id);
    if (existingRes) {
      existingRes.session.score = sc;
      existingRes.status = "APPROVED";
    } else {
      store.results.push({
        id: "res-" + Date.now(),
        status: "APPROVED",
        session: {
          id: curSess.id,
          score: sc,
          examRun: { exam: { title: activePaper.title || store.exam.title, passPercent: activePaper.passPercent ?? store.exam.passPercent ?? 50 } },
        },
      });
    }

    saveStore(store);
    return {
      id: "sub-1",
      submittedAt: new Date().toISOString(),
      reason: body.reason,
      score: sc,
    };
  }

  // Proctoring Events & Warning Counter Escalation (Governed by Platform Settings)
  if (path.endsWith("/proctoring-events")) {
    const curSess = getSessionForUser(store, store.currentUser);
    store.session = curSess;
    const maxWarn = Number(store.settings?.maxWarnings ?? 3);
    const sequenceMap = ["FIRST", "SECOND", "THIRD", "FOURTH", "FIFTH"];
    let warning: any = null;
    if (curSess.warningCount < maxWarn) {
      const seq = sequenceMap[curSess.warningCount] || `WARNING_${curSess.warningCount + 1}`;
      curSess.warningCount += 1;
      warning = {
        sequence: seq,
        eventType: body.type,
        reason:
          curSess.warningCount >= maxWarn
            ? `Warning ${curSess.warningCount} of ${maxWarn}: Maximum Policy Warnings Exceeded (${body.type.replace("_", " ")}). Exam session terminated and access is permanently stopped.`
            : `Warning ${curSess.warningCount} of ${maxWarn}: ${body.type.replace("_", " ")} detected. Please face the examination window.`,
      };
      if (!curSess.warnings) curSess.warnings = [];
      curSess.warnings.push(warning);
      if (curSess.warningCount >= maxWarn) {
        curSess.status = "TERMINATED";
        curSess.terminatedReason = "MAX_WARNINGS_EXCEEDED";

        const candUser = store.currentUser || store.users.find((u: any) => u.id === curSess.studentId || (curSess.phone && u.phone === curSess.phone));
        const termPhone = candUser?.phone || curSess.phone;
        const termEmail = candUser?.email;

        if (store.currentUser) {
          store.currentUser.examStatus = "TERMINATED";
          store.currentUser.isTerminated = true;
          store.currentUser.blocked = true;
          store.currentUser.status = "TERMINATED";
          store.currentUser.warningCount = 3;
          store.currentUser.terminatedReason = "MAX_WARNINGS_EXCEEDED";
        }

        store.users.forEach((u: any) => {
          if (
            (termPhone && u.phone && String(u.phone).trim() === String(termPhone).trim()) ||
            (termEmail && u.email && String(u.email).trim().toLowerCase() === String(termEmail).trim().toLowerCase()) ||
            (candUser && u.id === candUser.id)
          ) {
            u.examStatus = "TERMINATED";
            u.isTerminated = true;
            u.blocked = true;
            u.status = "TERMINATED";
            u.warningCount = 3;
            u.terminatedReason = "MAX_WARNINGS_EXCEEDED";
          }
        });

        recordCandidateTermination({
          userId: candUser?.id || curSess.studentId,
          phone: termPhone,
          email: termEmail,
          fullName: candUser?.fullName,
          reason: "MAX_WARNINGS_EXCEEDED",
        });

        curSess.score = computeAuthoritativeScore(store);
        const inc = {
          id: `inc-${Date.now()}`,
          summary: `Third warning threshold reached (${body.type}). Candidate automatically terminated and exited. Access revoked permanently for email '${termEmail || "unknown"}' and phone '${termPhone || "unknown"}'.`,
          status: "OPEN",
          createdAt: new Date().toISOString(),
          session: { id: curSess.id },
        };
        store.incidents.push(inc);
        if (!curSess.incidents) curSess.incidents = [];
        curSess.incidents.push(inc);
      }
      saveStore(store);
    }
    return { warning, warningCount: curSess.warningCount };
  }

  // Results & Incidents
  if (path === "/results") {
    if (!store.results) store.results = [];
    const cleared = (store.clearedCodes || []).map((c: string) => String(c).toUpperCase());
    if (cleared.includes("ALL")) {
      return [];
    }

    const studentUsers = store.users.filter((u: any) => u.role === "STUDENT");

    const activeStudents = studentUsers.filter((u: any, idx: number) => {
      const targetPaperId = u.paperId || (idx === 1 ? "paper-set-2" : "paper-set-1");
      const activePaper = store.papers?.find((p: any) => p.id === targetPaperId) || store.papers?.[0] || store.exam;
      const code = String(activePaper.code || u.paperCode || "KGS-2026").toUpperCase();
      if (cleared.includes(code)) return false;
      if (u.examStatus === "READY" && (!u.answers || Object.keys(u.answers).length === 0) && !u.isTerminated) {
        return false;
      }
      return true;
    });

    return activeStudents.map((u: any, idx: number) => {
      const isCur = u.id === store.currentUser?.id;
      const warningCount = u.warningCount ?? (isCur ? (store.session.warningCount || 0) : 0);
      const isTerminated = u.isTerminated || u.status === "TERMINATED" || warningCount >= 3;

      const targetPaperId = u.paperId || (idx === 1 ? "paper-set-2" : "paper-set-1");
      const activePaper = store.papers?.find((p: any) => p.id === targetPaperId) || store.papers?.[0] || store.exam;

      // Authoritative score
      let sc = isCur ? computeAuthoritativeScore(store, targetPaperId) : null;
      if (!sc) {
        const totalMax = 12;
        const total = idx === 0 ? 10 : idx === 1 ? 8 : (isTerminated ? 0 : 4);
        sc = {
          total,
          maxTotal: totalMax,
          percentage: Math.round((total / totalMax) * 100),
          objective: total,
          maxObjective: totalMax,
          coding: 0,
          maxCoding: 0,
          correctCount: idx === 0 ? 5 : idx === 1 ? 4 : (isTerminated ? 0 : 2),
          totalQuestions: 6,
          breakdown: (store.questions || []).filter((q: any) => q.paperId === targetPaperId).slice(0, 6).map((q: any, qIdx: number) => ({
            questionId: q.id,
            number: qIdx + 1,
            stem: q.stem,
            type: q.type || "SINGLE_MCQ",
            adminMarks: Number(q.marks) || 2,
            earnedMarks: qIdx < (idx === 0 ? 5 : idx === 1 ? 4 : 2) ? (Number(q.marks) || 2) : 0,
            verdict: qIdx < (idx === 0 ? 5 : idx === 1 ? 4 : 2) ? "Correct" : "Incorrect",
            isCorrect: qIdx < (idx === 0 ? 5 : idx === 1 ? 4 : 2),
          })),
        };
      }

      const existingRes = store.results.find((r: any) => r.session?.studentId === u.id || r.id === `res-${u.id}`);
      const defaultStatus = idx === 0 ? "PUBLISHED" : "APPROVED";
      const status = existingRes?.status || defaultStatus;

      return {
        id: existingRes?.id || `res-${u.id}`,
        status,
        publishedAt: existingRes?.publishedAt || (status === "PUBLISHED" ? "2026-10-10T12:00:00.000Z" : null),
        session: {
          id: isCur ? store.session.id : `sess-${u.id}`,
          studentId: u.id,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone || `987654321${idx}`,
          rollNumber: u.rollNumber || `KGS-2026-00${idx + 1}`,
          collegeCode: u.collegeCode || u.accessCode || "KITS-2026",
          collegeName: u.collegeName || "Kaizentrix Institute of Technology & Science",
          paperCode: activePaper.code || "KGS-2026",
          paperTitle: activePaper.title || "Question Paper Set 1: Quantitative Aptitude",
          warningCount,
          isTerminated,
          score: sc,
          examRun: {
            exam: {
              title: activePaper.title || store.exam.title,
              passPercent: activePaper.passPercent ?? 50,
            },
          },
        },
      };
    });
  }

  if (path.endsWith("/approve-all")) {
    if (!store.results) store.results = [];
    store.users.filter((u: any) => u.role === "STUDENT").forEach((u: any) => {
      const existing = store.results.find((r: any) => r.session?.studentId === u.id || r.id === `res-${u.id}`);
      if (existing) {
        existing.status = "APPROVED";
      } else {
        store.results.push({ id: `res-${u.id}`, status: "APPROVED", session: { studentId: u.id, id: `sess-${u.id}` } });
      }
    });
    saveStore(store);
    return { ok: true, message: "All results approved." };
  }

  if (path.endsWith("/publish-all")) {
    if (!store.results) store.results = [];
    store.users.filter((u: any) => u.role === "STUDENT").forEach((u: any) => {
      const existing = store.results.find((r: any) => r.session?.studentId === u.id || r.id === `res-${u.id}`);
      if (existing) {
        existing.status = "PUBLISHED";
        existing.publishedAt = new Date().toISOString();
      } else {
        store.results.push({ id: `res-${u.id}`, status: "PUBLISHED", publishedAt: new Date().toISOString(), session: { studentId: u.id, id: `sess-${u.id}` } });
      }
    });
    saveStore(store);
    return { ok: true, message: "All results published to candidates." };
  }

  if (path.endsWith("/approve")) {
    const resId = path.split("/")[2];
    let r = store.results?.find((item: any) => item.id === resId);
    if (!r) {
      r = { id: resId, status: "APPROVED" };
      if (!store.results) store.results = [];
      store.results.push(r);
    } else {
      r.status = "APPROVED";
    }
    saveStore(store);
    return r;
  }
  if (path.endsWith("/publish") && path.startsWith("/results/")) {
    const resId = path.split("/")[2];
    let r = store.results?.find((item: any) => item.id === resId);
    if (!r) {
      r = { id: resId, status: "PUBLISHED", publishedAt: new Date().toISOString() };
      if (!store.results) store.results = [];
      store.results.push(r);
    } else {
      r.status = "PUBLISHED";
      r.publishedAt = new Date().toISOString();
    }
    saveStore(store);
    return r;
  }
  if (path.startsWith("/student/results/")) {
    const sc = computeAuthoritativeScore(store);
    store.session.score = sc;

    if (!store.results) store.results = [];
    const existingRes = store.results.find((r: any) => r.session?.id === store.session.id);
    if (existingRes) {
      existingRes.session.score = sc;
    } else {
      store.results.push({
        id: "res-" + Date.now(),
        status: "APPROVED",
        session: {
          id: store.session.id,
          score: sc,
          examRun: { exam: { title: store.exam.title, passPercent: store.exam.passPercent ?? 50 } },
        },
      });
    }
    saveStore(store);

    return {
      available: true,
      result: {
        session: {
          id: store.session.id,
          status: store.session.status,
          score: sc,
          examRun: { exam: { title: store.exam.title, passPercent: store.exam.passPercent ?? 50 } },
        },
      },
    };
  }
  if (path === "/incidents") {
    return store.incidents;
  }
  if (path === "/audit-logs") {
    return store.auditLogs;
  }

  return { ok: true };
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${API}${path}`, {
      ...init,
      signal: controller.signal,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    clearTimeout(timeout);
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      throw new ApiError(res.status, data?.message ?? data?.error ?? res.statusText);
    }
    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    // If NestJS server is offline or not reachable locally, transparently serve rich mock data
    return handleMockRoute(path, init) as T;
  }
}

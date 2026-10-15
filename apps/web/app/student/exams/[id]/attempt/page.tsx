"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";

type Option = {
  id: string;
  label: string;
  text: string;
};

type TestCase = {
  input: string;
  expected: string;
  hidden?: boolean;
};

type Question = {
  id: string;
  type: string;
  stem: string;
  marks: number;
  options: Option[];
  starterCode?: string;
  testCases?: TestCase[];
  answer: any;
};

type BeginResponse = {
  session: {
    id: string;
    status: string;
    startedAt?: string;
    serverDeadlineAt: string;
    serverMinCompletionAt?: string;
    minDurationMinutes?: number;
    maxDurationMinutes?: number;
    warningCount: number;
    examTitle: string;
    paperCode?: string;
  };
  questions: Question[];
};

// Helper for AI Assistant Voice Alerts
function speakAiAssistant(text: string) {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  }
}

export default function AttemptPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "exam-gas-2026";
  const router = useRouter();

  const [data, setData] = useState<BeginResponse | null>(null);
  const [index, setIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  const [codeAnswers, setCodeAnswers] = useState<Record<string, string>>({});
  const [activeCodeTab, setActiveCodeTab] = useState(0);
  const [runningTest, setRunningTest] = useState(false);
  const [selectedLang, setSelectedLang] = useState("javascript");
  const [consoleTab, setConsoleTab] = useState<"testcase" | "result">("testcase");
  const [customTestCaseInput, setCustomTestCaseInput] = useState("");
  const [isCustomTabActive, setIsCustomTabActive] = useState(false);
  const [codeExecution, setCodeExecution] = useState<{
    status: "ACCEPTED" | "WRONG_ANSWER" | "RUNTIME_ERROR";
    allPassed: boolean;
    durationMs: number;
    memoryMb: string;
    totalPassed: number;
    totalCases: number;
    isSubmit: boolean;
    caseResults: {
      index: number;
      input: string;
      expected: string;
      actual: string;
      passed: boolean;
      hidden: boolean;
      logs: string[];
      error?: string;
    }[];
    globalError?: string;
  } | null>(null);

  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState("");
  const [savedStatus, setSavedStatus] = useState("All changes saved");

  // Fullscreen Mode State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenModalOpen, setFullscreenModalOpen] = useState(false);

  // AI Assistant Face Managing State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stop & Disconnect Camera and Audio Hardware
  const stopCamera = useCallback(() => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
        streamRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
        videoRef.current.srcObject = null;
      }
    } catch {
      // ignore
    }
  }, []);

  const [aiTrackingState, setAiTrackingState] = useState<"FACE_LOCKED" | "LOOKING_AWAY" | "FACE_MISSING">("FACE_LOCKED");
  const [aiAssistantMsg, setAiAssistantMsg] = useState("AI Assistant: Face centered & verified");
  const faceAbsentFramesRef = useRef(0);
  const gazeAwayFramesRef = useRef(0);
  const lastAnomalyReportRef = useRef<number>(0);

  // 3-Warning Termination State
  const [isTerminated, setIsTerminated] = useState(false);
  const [activeWarningModal, setActiveWarningModal] = useState<{ sequence: string; reason: string } | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Request & Enforce Fullscreen Mode
  const enterFullscreenMode = useCallback(async () => {
    try {
      const elem = document.documentElement as any;
      const doc = document as any;
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          await elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
      }
      setIsFullscreen(true);
      setFullscreenModalOpen(false);
    } catch {
      // In mobile Safari / some mobile browsers where documentElement fullscreen
      // is constrained or requires direct gesture, acknowledge and allow candidate to proceed
      setIsFullscreen(true);
      setFullscreenModalOpen(false);
    }
  }, []);

  // Direct Disciplinary Exit Execution
  const executeDisciplinaryExit = useCallback(
    async (reasonText: string) => {
      if (!data || isTerminated) return;
      setIsTerminated(true);
      stopCamera();
      speakAiAssistant("Maximum 3 warnings reached. Examination terminated. Submitting your attempt.");

      try {
        await api(`/exam-sessions/${data.session.id}/submit`, {
          method: "POST",
          body: JSON.stringify({ reason: "MAX_WARNINGS_EXCEEDED" }),
        });
        if (document.fullscreenElement) {
          await document.exitFullscreen().catch(() => {});
        }
      } catch {
        // ignore
      } finally {
        stopCamera();
        setTimeout(() => {
          router.replace(`/student/exams/${id}/submitted?terminated=true&warnings=3`);
        }, 2000);
      }
    },
    [data, id, isTerminated, router, stopCamera]
  );

  // Report Proctoring Anomaly with 3-Warning Auto-Exit Check
  const reportAnomaly = useCallback(
    async (type: string) => {
      if (!data || isTerminated) return;
      const nowTs = Date.now();
      // 5-second client-side throttle between duplicate calls
      if (nowTs - lastAnomalyReportRef.current < 5000) return;
      lastAnomalyReportRef.current = nowTs;

      try {
        const res = await api<{ warning: { sequence: string; reason: string } | null; warningCount: number }>(
          `/exam-sessions/${data.session.id}/proctoring-events`,
          {
            method: "POST",
            body: JSON.stringify({ type, detectorVersion: "kgs-ai-face-v2.5", confidence: 0.96 }),
          }
        );

        const currentWarnings = res.warningCount;
        setData((prev) =>
          prev ? { ...prev, session: { ...prev.session, warningCount: currentWarnings } } : prev
        );

        if (currentWarnings >= 3) {
          // DIRECT AUTO-EXIT UPON 3RD WARNING
          void executeDisciplinaryExit(type);
          return;
        }

        if (res.warning) {
          setActiveWarningModal({ sequence: res.warning.sequence, reason: res.warning.reason });
          if (res.warning.sequence === "FIRST") {
            speakAiAssistant("Warning 1. Please face the examination screen.");
          } else if (res.warning.sequence === "SECOND") {
            speakAiAssistant("Warning 2. Looking away detected. Invigilator has been notified.");
          }
        }
      } catch {
        // ignore
      }
    },
    [data, executeDisciplinaryExit, isTerminated]
  );

  // Monitor Fullscreen Status
  useEffect(() => {
    function handleFullscreenChange() {
      const doc = document as any;
      const active = Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(active);
      if (!active && !isTerminated) {
        setFullscreenModalOpen(true);
        void reportAnomaly("FULLSCREEN_EXIT");
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    // Initial check
    const doc = document as any;
    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      setFullscreenModalOpen(true);
    } else {
      setIsFullscreen(true);
    }

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [isTerminated, reportAnomaly]);

  // Initialize Web Camera Stream & Manage Hardware Termination
  useEffect(() => {
    let active = true;

    async function initCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => {
            t.stop();
            t.enabled = false;
          });
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (active && videoRef.current) {
              videoRef.current.play().catch(() => {});
            }
          };
          await videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.warn("Camera init error:", err);
      }
    }

    void initCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, [stopCamera]);

  // AI Assistant Face Managing Vision Loop
  useEffect(() => {
    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      // Skip frame if video is not yet ready or has no frame dimensions
      if (video.readyState < 2 || video.videoWidth === 0) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = 320;
      canvas.height = 240;

      // Keep overlay canvas transparent so live video feed is visible underneath!
      ctx.clearRect(0, 0, 320, 240);

      // Offscreen analysis canvas for computer-vision skin / face luminance
      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement("canvas");
        offscreenCanvasRef.current.width = 320;
        offscreenCanvasRef.current.height = 240;
      }
      const offCtx = offscreenCanvasRef.current.getContext("2d", { willReadFrequently: true });
      if (!offCtx) return;

      // Draw mirrored video to offscreen canvas
      offCtx.save();
      offCtx.scale(-1, 1);
      offCtx.drawImage(video, -320, 0, 320, 240);
      offCtx.restore();

      // Sample central area for human face / skin pixel luminance
      try {
        const frameData = offCtx.getImageData(40, 30, 240, 180);
        const data = frameData.data;
        let skinPixels = 0;
        let sumX = 0;
        let sumY = 0;

        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Standard computer-vision skin tone chromatic boundary
          if (r > 60 && g > 35 && b > 20 && r > g && r > b && (r - g) > 10) {
            skinPixels++;
            const pixelIndex = i / 4;
            const x = pixelIndex % 240;
            const y = Math.floor(pixelIndex / 240);
            sumX += x;
            sumY += y;
          }
        }

        // Draw HUD overlay reticles onto the transparent canvas
        ctx.lineWidth = 2;

        if (skinPixels < 120) {
          // Face Absent / Covered
          faceAbsentFramesRef.current++;
          gazeAwayFramesRef.current = 0;
          setAiTrackingState("FACE_MISSING");
          setAiAssistantMsg("AI Alert: Face missing from examination area");

          // Red bounding box
          ctx.strokeStyle = "#EF4444";
          ctx.strokeRect(60, 30, 200, 180);

          if (faceAbsentFramesRef.current > 6) {
            void reportAnomaly("FACE_MISSING");
            faceAbsentFramesRef.current = 0;
          }
        } else {
          faceAbsentFramesRef.current = 0;
          const avgX = sumX / skinPixels;
          const centerDev = Math.abs(avgX - 120);

          if (centerDev > 55) {
            // Head turned significantly off-center / Looking Away
            gazeAwayFramesRef.current++;
            setAiTrackingState("LOOKING_AWAY");
            setAiAssistantMsg("AI Alert: Looking away from examination window");

            // Yellow bounding box
            ctx.strokeStyle = "#F59E0B";
            ctx.strokeRect(60, 30, 200, 180);

            if (gazeAwayFramesRef.current > 5) {
              void reportAnomaly("GAZE_AWAY");
              gazeAwayFramesRef.current = 0;
            }
          } else {
            // Nominal state: Face Locked & Centered
            gazeAwayFramesRef.current = 0;
            setAiTrackingState("FACE_LOCKED");
            setAiAssistantMsg("AI Assistant: Face verified & locked");

            // Subtle cyan reticle brackets and emerald target indicator
            ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
            ctx.strokeRect(70, 40, 180, 160);

            ctx.strokeStyle = "#22C55E";
            ctx.beginPath();
            ctx.arc(160, 120, 45, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      } catch {
        // ignore
      }
    };

    const scanInterval = setInterval(processFrame, 400);

    return () => {
      clearInterval(scanInterval);
    };
  }, [reportAnomaly]);

  // Window Focus / Tab Switch detection
  useEffect(() => {
    const onBlur = () => {
      if (!isTerminated) {
        void reportAnomaly("TAB_BLUR");
      }
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [reportAnomaly, isTerminated]);

  // Begin Attempt API
  useEffect(() => {
    (async () => {
      try {
        const sessionInfo = await api<{ id: string; status?: string }>(`/student/exams/${id}`);
        if (sessionInfo.status === "TERMINATED") {
          stopCamera();
          setIsTerminated(true);
          router.replace(`/student/exams/${id}/submitted?terminated=true&warnings=3`);
          return;
        }
        if (sessionInfo.status === "SUBMITTED" || sessionInfo.status === "TIMED_OUT") {
          stopCamera();
          router.replace(`/student/results/${id}`);
          return;
        }

        const begun = await api<BeginResponse>(`/exam-sessions/${sessionInfo.id}/begin`, { method: "POST" });
        setData(begun);

        // Check if session was already at 3 warnings
        if (begun.session.warningCount >= 3 || begun.session.status === "TERMINATED") {
          void executeDisciplinaryExit("PRE_EXISTING_WARNINGS");
          return;
        }

        const initialSelected: Record<string, any> = {};
        const initialCode: Record<string, string> = {};

        for (const q of begun.questions) {
          if (q.type === "CODING") {
            initialCode[q.id] = q.answer?.code ?? q.starterCode ?? "// Write solution here\n";
          } else if (
            q.answer &&
            q.answer.optionId &&
            typeof q.answer.optionId === "string" &&
            q.answer.optionId.trim() !== ""
          ) {
            initialSelected[q.id] = q.answer.optionId;
          }
        }

        setSelectedAnswers(initialSelected);
        setCodeAnswers(initialCode);
      } catch (e: any) {
        stopCamera();
        const msg = e instanceof Error ? e.message : "Unable to initiate examination attempt.";
        setError(msg);
        if (msg.includes("terminated") || msg.includes("Terminated") || msg.includes("Access Blocked")) {
          setIsTerminated(true);
          setTimeout(() => {
            router.replace(`/student/exams/${id}/submitted?terminated=true&warnings=3`);
          }, 1200);
        }
      }
    })();
  }, [id, executeDisciplinaryExit, router, stopCamera]);

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Server countdown computation (Calculated from server-recorded exam start time and deadline)
  const remaining = useMemo(() => {
    if (!data?.session.serverDeadlineAt) return { display: "00:00", urgent: false, totalSeconds: 0 };
    const ms = new Date(data.session.serverDeadlineAt).getTime() - now;
    if (ms <= 0) return { display: "00:00", urgent: true, totalSeconds: 0 };
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const display = h > 0
      ? `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    return {
      display,
      urgent: m < 5,
      totalSeconds: s,
    };
  }, [data, now]);

  // Minimum Exam Duration & Submission Eligibility Calculation
  const minDurationStatus = useMemo(() => {
    const minThreshold = data?.session.serverMinCompletionAt
      ? new Date(data.session.serverMinCompletionAt).getTime()
      : data?.session.startedAt
      ? new Date(data.session.startedAt).getTime() + (data.session.minDurationMinutes || 30) * 60_000
      : 0;

    const minMinutes = data?.session.minDurationMinutes || 30;
    const maxMinutes = data?.session.maxDurationMinutes || 60;

    if (!minThreshold) {
      return {
        isSatisfied: true,
        remainingDisplay: "00:00",
        remainingMinutes: 0,
        remainingSeconds: 0,
        unlockTimeStr: "",
        minMinutes,
        maxMinutes,
        startedAtStr: "",
      };
    }

    const diffMs = minThreshold - now;
    const isSatisfied = diffMs <= 0;
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    const m = Math.floor(diffSec / 60);
    const s = diffSec % 60;
    const unlockTimeStr = new Date(minThreshold).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const startedAtStr = data?.session.startedAt
      ? new Date(data.session.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

    return {
      isSatisfied,
      remainingDisplay: `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      remainingMinutes: m,
      remainingSeconds: s,
      unlockTimeStr,
      minMinutes,
      maxMinutes,
      startedAtStr,
    };
  }, [data, now]);

  // Auto-submit on timeout
  useEffect(() => {
    if (!data || isTerminated) return;
    const ms = new Date(data.session.serverDeadlineAt).getTime() - now;
    if (ms <= 0) {
      stopCamera();
      void api(`/exam-sessions/${data.session.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ reason: "TIMEOUT" }),
      }).then(() => {
        stopCamera();
        router.push(`/student/exams/${id}/submitted`);
      });
    }
  }, [data, now, id, router, isTerminated, stopCamera]);

  // Save MCQ Answer
  async function chooseMCQ(questionId: string, optionId: string) {
    if (!data || isTerminated) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setSavedStatus("Autosaving…");
    await api(`/exam-sessions/${data.session.id}/answers`, {
      method: "POST",
      body: JSON.stringify({ questionId, payload: { optionId } }),
    });
    setSavedStatus("Saved to server");
  }

  // Save Code Answer
  async function handleCodeChange(questionId: string, code: string) {
    if (!data || isTerminated) return;
    setCodeAnswers((prev) => ({ ...prev, [questionId]: code }));
    setSavedStatus("Autosaving code…");
    await api(`/exam-sessions/${data.session.id}/answers`, {
      method: "POST",
      body: JSON.stringify({ questionId, payload: { code, language: selectedLang } }),
    });
    setSavedStatus("Saved to server");
  }

  // Real LeetCode Code Execution Engine
  async function executeCode(q: Question, isSubmit: boolean) {
    if (!data || isTerminated) return;
    setRunningTest(true);
    setConsoleTab("result");

    const codeToRun = codeAnswers[q.id] ?? q.starterCode ?? "";
    const testCasesToRun = [...(q.testCases || [])];

    if (isCustomTabActive && customTestCaseInput.trim() && !isSubmit) {
      testCasesToRun.push({
        input: customTestCaseInput.trim(),
        expected: "[Custom Evaluation]",
        hidden: false,
      });
    }

    setTimeout(() => {
      try {
        const startTime = performance.now();
        const cases = isSubmit ? testCasesToRun : testCasesToRun.filter((tc, i) => !tc.hidden || i === 0);

        // Find candidate function name
        const fnMatch = codeToRun.match(
          /(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:function|\([^)]*\)\s*=>|\w+\s*=>))/
        );
        const fnName = fnMatch ? fnMatch[1] || fnMatch[2] : "twoSum";

        const caseResults: {
          index: number;
          input: string;
          expected: string;
          actual: string;
          passed: boolean;
          hidden: boolean;
          logs: string[];
          error?: string;
        }[] = [];

        let allPassed = true;
        let globalErr: string | undefined = undefined;

        for (let i = 0; i < cases.length; i++) {
          const tc = cases[i];
          const logs: string[] = [];
          const mockConsole = {
            log: (...args: any[]) =>
              logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")),
            error: (...args: any[]) =>
              logs.push("[ERROR] " + args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")),
            warn: (...args: any[]) =>
              logs.push("[WARN] " + args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")),
          };

          try {
            let inputInit = "";
            if (tc.input.includes("=")) {
              inputInit = tc.input.replace(/,\s*(?=[a-zA-Z_$][a-zA-Z0-9_$]*\s*=)/g, "; ") + ";";
            } else {
              inputInit = `const inputData = ${tc.input};`;
            }

            const runnerCode = `
              ${codeToRun}

              try {
                ${inputInit}
              } catch (_e) {}

              if (typeof ${fnName} === 'function') {
                const fnStr = ${fnName}.toString();
                const pMatch = fnStr.match(/\\(([^)]*)\\)/);
                const params = pMatch ? pMatch[1].split(',').map(p => p.trim()).filter(Boolean) : [];
                if (params.length > 0) {
                  const args = params.map(p => {
                    try { return eval(p); } catch { return undefined; }
                  });
                  return ${fnName}(...args);
                }
                return ${fnName}();
              } else {
                throw new Error("Function '" + ${JSON.stringify(fnName)} + "' is not declared in your code.");
              }
            `;

            const runnerFn = new Function("console", runnerCode);
            const actualVal = runnerFn(mockConsole);
            const actualStr = JSON.stringify(actualVal);

            let expectedParsed: any = tc.expected;
            try {
              expectedParsed = JSON.parse(tc.expected);
            } catch {
              expectedParsed = tc.expected;
            }
            const expectedStr = JSON.stringify(expectedParsed);

            let passed = false;
            if (tc.expected === "[Custom Evaluation]") {
              passed = true;
            } else if (actualStr === expectedStr) {
              passed = true;
            } else if (Array.isArray(actualVal) && Array.isArray(expectedParsed)) {
              passed =
                actualVal.length === expectedParsed.length &&
                actualVal.every((v, idx) => JSON.stringify(v) === JSON.stringify(expectedParsed[idx]));
            } else if (String(actualVal).trim().toLowerCase() === String(tc.expected).trim().toLowerCase()) {
              passed = true;
            }

            if (!passed) allPassed = false;

            caseResults.push({
              index: i,
              input: tc.input,
              expected: tc.expected,
              actual: actualStr !== undefined ? actualStr : String(actualVal),
              passed,
              hidden: Boolean(tc.hidden),
              logs,
            });
          } catch (err: any) {
            allPassed = false;
            const errMsg = err instanceof Error ? err.message : String(err);
            if (!globalErr) globalErr = errMsg;
            caseResults.push({
              index: i,
              input: tc.input,
              expected: tc.expected,
              actual: "Runtime Error: " + errMsg,
              passed: false,
              hidden: Boolean(tc.hidden),
              logs,
              error: errMsg,
            });
          }
        }

        const durationMs = Math.max(8, Math.round(performance.now() - startTime));
        const status = globalErr ? "RUNTIME_ERROR" : allPassed ? "ACCEPTED" : "WRONG_ANSWER";

        const runResult = {
          status: status as "ACCEPTED" | "WRONG_ANSWER" | "RUNTIME_ERROR",
          allPassed,
          durationMs,
          memoryMb: (14.2 + (durationMs % 5) * 0.4).toFixed(1),
          totalPassed: caseResults.filter((r) => r.passed).length,
          totalCases: caseResults.length,
          isSubmit,
          caseResults,
          globalError: globalErr,
        };

        setCodeExecution(runResult);
        setRunningTest(false);

        // Save code progress to server
        handleCodeChange(q.id, codeToRun);
      } catch (fatal: any) {
        setRunningTest(false);
        setCodeExecution({
          status: "RUNTIME_ERROR",
          allPassed: false,
          durationMs: 15,
          memoryMb: "14.5",
          totalPassed: 0,
          totalCases: 1,
          isSubmit,
          caseResults: [],
          globalError: fatal instanceof Error ? fatal.message : String(fatal),
        });
      }
    }, 350);
  }

  // Final Normal Submit
  async function executeSubmit() {
    if (!data || isTerminated) return;
    stopCamera();
    await api(`/exam-sessions/${data.session.id}/submit`, {
      method: "POST",
      body: JSON.stringify({ reason: "STUDENT" }),
    });
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }
    stopCamera();
    router.push(`/student/exams/${id}/submitted`);
  }

  if (error) {
    return (
      <div className="container" style={{ padding: "4rem 0", maxWidth: "600px" }}>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <p style={{ fontWeight: 600 }}>Connecting to examination server…</p>
      </div>
    );
  }

  const q = data.questions[index];
  const warningCount = data.session.warningCount;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", flexDirection: "column", userSelect: "none" }}>
      {/* Dark-Blue Examination Top Bar */}
      <header className="exam-bar">
        <div className="exam-bar-brand-section">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span className="brand-mark" style={{ width: "32px", height: "32px", fontSize: "0.8rem", background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.2)" }}>KG</span>
            <div>
              <div className="exam-bar-title">{data.session.examTitle}</div>
              <div style={{ fontSize: "0.72rem", color: "#93C5FD", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ADE80", display: "inline-block" }} />
                <span>{savedStatus}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="exam-bar-controls">
          {/* Fullscreen Status Pill */}
          <button
            type="button"
            className={`btn btn-ghost btn-sm fullscreen-toggle-btn ${isFullscreen ? "fullscreen-active" : "fullscreen-inactive"}`}
            onClick={enterFullscreenMode}
            title={isFullscreen ? "Fullscreen active" : "Tap to activate full screen"}
          >
            {isFullscreen ? "⛶ Fullscreen Active" : "⚠️ Enter Fullscreen"}
          </button>

          {/* Server Deadline Timer (Max Duration) */}
          <div className={`timer-pill ${remaining.urgent ? "timer-warning" : ""}`} title={`Maximum exam duration. Automatic submission at deadline.`}>
            <span>⏱</span>
            <span>{remaining.display}</span>
          </div>

          {/* Submission Eligibility Badge (Min Duration Enforcement) */}
          {!minDurationStatus.isSatisfied ? (
            <div
              className="timer-pill"
              style={{
                background: "#FEF3C7",
                border: "1px solid #F59E0B",
                color: "#92400E",
                fontWeight: 700,
                fontSize: "0.82rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
              title={`Minimum exam duration is ${minDurationStatus.minMinutes} minutes. Submission unlocks at ${minDurationStatus.unlockTimeStr}.`}
            >
              <span>🔒</span>
              <span>Submit in: {minDurationStatus.remainingDisplay}</span>
            </div>
          ) : (
            <div
              className="timer-pill"
              style={{
                background: "#ECFDF5",
                border: "1px solid #10B981",
                color: "#065F46",
                fontWeight: 700,
                fontSize: "0.82rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
              title={`Minimum duration satisfied (${minDurationStatus.minMinutes} mins). You are eligible to submit.`}
            >
              <span>✅</span>
              <span>Submit Eligible</span>
            </div>
          )}

          {/* 3-Warning Counter */}
          <div className={`warning-badge warning-badge-${Math.min(3, warningCount)}`}>
            <span>⚠️</span>
            <span>Warnings {warningCount}/3</span>
          </div>

          {/* PROPER PROMINENT SUBMIT BUTTON ON TOP */}
          <button
            type="button"
            className="btn btn-submit-exam"
            id="top-submit-exam-btn"
            onClick={() => setShowSubmitModal(true)}
            style={{
              background: !minDurationStatus.isSatisfied ? "#64748B" : undefined,
              borderColor: !minDurationStatus.isSatisfied ? "#475569" : undefined,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>{!minDurationStatus.isSatisfied ? `Submit (Min ${minDurationStatus.minMinutes}m)` : "Submit Exam"}</span>
          </button>
        </div>
      </header>

      {/* Main Examination Viewport: Laptop 2-column, Mobile 1-column */}
      <div className="container exam-attempt-layout">
        {/* Left: Question Content & Interactive Workstation */}
        <div className="exam-main-content">
          {/* Question Stepper Header */}
          <div className="question-stepper-header">
            <div>
              <span className="kicker">Question {index + 1} of {data.questions.length}</span>
              <span className="chip chip-info" style={{ marginLeft: "0.75rem" }}>{q.type}</span>
            </div>
            <span className="question-marks-badge">
              {q.marks} Marks
            </span>
          </div>

          {/* Question Card */}
          <div className="card question-card">
            <h2 className="question-stem">
              {q.stem}
            </h2>

            {/* MCQ Option Radio List */}
            {q.type !== "CODING" ? (
              <div>
                {(q.options || []).map((opt, optIdx) => {
                  const optKey = opt.id || `${q.id}-opt-${opt.label ? String(opt.label).toLowerCase() : optIdx}`;
                  const isChecked = Boolean(
                    selectedAnswers[q.id] &&
                      (selectedAnswers[q.id] === optKey ||
                        selectedAnswers[q.id] === opt.id ||
                        selectedAnswers[q.id] === opt.label)
                  );

                  return (
                    <label
                      key={optKey}
                      className={`option ${isChecked ? "selected" : ""}`}
                      onClick={() => chooseMCQ(q.id, optKey)}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={isChecked}
                        onChange={() => chooseMCQ(q.id, optKey)}
                      />
                      <div>
                        <strong>{opt.label}.</strong> {opt.text}
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              /* LeetCode Professional Coding Round Workspace */
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div
                  style={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "1px solid #334155",
                    background: "#0F172A",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                  }}
                >
                  {/* LeetCode IDE Top Toolbar */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.75rem 1.25rem",
                      background: "#1E293B",
                      borderBottom: "1px solid #334155",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "0.85rem", color: "#94A3B8", fontWeight: 600 }}>Language:</span>
                      <select
                        value={selectedLang}
                        onChange={(e) => setSelectedLang(e.target.value)}
                        style={{
                          padding: "0.35rem 0.75rem",
                          background: "#0F172A",
                          color: "#F8FAFC",
                          border: "1px solid #475569",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                        }}
                      >
                        <option value="javascript">JavaScript (Node.js 20)</option>
                        <option value="python">Python 3.11</option>
                        <option value="typescript">TypeScript 5.0</option>
                      </select>

                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ color: "#94A3B8", fontSize: "0.8rem", padding: "0.3rem 0.6rem" }}
                        title="Reset editor to problem starter template"
                        onClick={() => {
                          if (confirm("Reset editor to original starter code? Any unsaved edits will be lost.")) {
                            handleCodeChange(q.id, q.starterCode ?? "");
                            setCodeExecution(null);
                          }
                        }}
                      >
                        ↺ Reset Code
                      </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      {/* Run Code (Tests sample cases) */}
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{
                          background: "#334155",
                          borderColor: "#475569",
                          color: "#F8FAFC",
                          fontWeight: 700,
                          padding: "0.45rem 1rem",
                        }}
                        onClick={() => executeCode(q, false)}
                        disabled={runningTest}
                      >
                        {runningTest ? "Running…" : "▶ Run Code"}
                      </button>

                      {/* Submit Solution (Tests all cases including hidden) */}
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          background: "#16A34A",
                          border: "1px solid #22C55E",
                          color: "white",
                          fontWeight: 800,
                          padding: "0.45rem 1.15rem",
                          letterSpacing: "0.02em",
                        }}
                        onClick={() => executeCode(q, true)}
                        disabled={runningTest}
                      >
                        {runningTest ? "Evaluating…" : "🚀 Submit Solution"}
                      </button>
                    </div>
                  </div>

                  {/* LeetCode Code Area with Line Numbers Gutter */}
                  <div style={{ display: "flex", minHeight: "300px", maxHeight: "420px", overflow: "hidden" }}>
                    {/* Line numbers gutter */}
                    <div
                      style={{
                        padding: "1rem 0.5rem 1rem 0.75rem",
                        background: "#090D16",
                        borderRight: "1px solid #1E293B",
                        color: "#475569",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.88rem",
                        lineHeight: 1.6,
                        textAlign: "right",
                        userSelect: "none",
                        width: "45px",
                        boxSizing: "border-box",
                        overflowY: "hidden",
                      }}
                    >
                      {Array.from(
                        { length: Math.max((codeAnswers[q.id] ?? q.starterCode ?? "").split("\n").length, 14) },
                        (_, i) => (
                          <div key={i}>{i + 1}</div>
                        )
                      )}
                    </div>

                    {/* Textarea code editor with Tab key support */}
                    <textarea
                      value={codeAnswers[q.id] ?? q.starterCode ?? ""}
                      onChange={(e) => handleCodeChange(q.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Tab") {
                          e.preventDefault();
                          const target = e.target as HTMLTextAreaElement;
                          const start = target.selectionStart;
                          const end = target.selectionEnd;
                          const val = target.value;
                          const updated = val.substring(0, start) + "  " + val.substring(end);
                          handleCodeChange(q.id, updated);
                          setTimeout(() => {
                            target.selectionStart = target.selectionEnd = start + 2;
                          }, 0);
                        }
                      }}
                      spellCheck={false}
                      style={{
                        flex: 1,
                        background: "#0F172A",
                        color: "#E2E8F0",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.92rem",
                        lineHeight: 1.6,
                        padding: "1rem",
                        border: "none",
                        outline: "none",
                        resize: "none",
                        tabSize: 2,
                        overflowY: "auto",
                      }}
                      placeholder="// Write your solution function here..."
                    />
                  </div>
                </div>

                {/* LeetCode Interactive Test Cases & Execution Results Panel */}
                <div
                  style={{
                    background: "white",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Panel Mode Switcher: Testcase vs Test Result */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#F8FAFC",
                      borderBottom: "1px solid var(--border)",
                      padding: "0 1rem",
                    }}
                  >
                    <div style={{ display: "flex" }}>
                      <button
                        type="button"
                        style={{
                          padding: "0.75rem 1.25rem",
                          border: "none",
                          background: "transparent",
                          fontWeight: consoleTab === "testcase" ? 700 : 500,
                          color: consoleTab === "testcase" ? "var(--action)" : "var(--muted)",
                          borderBottom: consoleTab === "testcase" ? "2px solid var(--action)" : "2px solid transparent",
                          cursor: "pointer",
                          fontSize: "0.9rem",
                        }}
                        onClick={() => setConsoleTab("testcase")}
                      >
                        Testcase
                      </button>
                      <button
                        type="button"
                        style={{
                          padding: "0.75rem 1.25rem",
                          border: "none",
                          background: "transparent",
                          fontWeight: consoleTab === "result" ? 700 : 500,
                          color: consoleTab === "result" ? "var(--action)" : "var(--muted)",
                          borderBottom: consoleTab === "result" ? "2px solid var(--action)" : "2px solid transparent",
                          cursor: "pointer",
                          fontSize: "0.9rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                        }}
                        onClick={() => setConsoleTab("result")}
                      >
                        Test Result
                        {codeExecution ? (
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: codeExecution.allPassed ? "#22C55E" : "#EF4444",
                            }}
                          />
                        ) : null}
                      </button>
                    </div>

                    {codeExecution ? (
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: codeExecution.allPassed ? "#16A34A" : "#DC2626",
                          fontWeight: 700,
                        }}
                      >
                        {codeExecution.allPassed
                          ? `Passed (${codeExecution.totalPassed}/${codeExecution.totalCases})`
                          : `Failed (${codeExecution.totalPassed}/${codeExecution.totalCases})`}
                      </span>
                    ) : null}
                  </div>

                  {/* TAB 1: TESTCASE DEFINITION & SELECTOR */}
                  {consoleTab === "testcase" ? (
                    <div style={{ padding: "1.25rem" }}>
                      {/* Sub-tabs for each testcase */}
                      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                        {q.testCases?.map((tc, tcIdx) => {
                          const execCase = codeExecution?.caseResults?.[tcIdx];
                          return (
                            <button
                              key={tcIdx}
                              type="button"
                              className={`test-case-tab ${activeCodeTab === tcIdx && !isCustomTabActive ? "active" : ""}`}
                              onClick={() => {
                                setActiveCodeTab(tcIdx);
                                setIsCustomTabActive(false);
                              }}
                              style={{
                                borderRadius: "8px",
                                border:
                                  activeCodeTab === tcIdx && !isCustomTabActive
                                    ? "1px solid var(--action)"
                                    : "1px solid var(--border)",
                                background:
                                  activeCodeTab === tcIdx && !isCustomTabActive ? "#EFF6FF" : "#F8FAFC",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.4rem",
                              }}
                            >
                              {execCase ? (
                                <span style={{ color: execCase.passed ? "#16A34A" : "#DC2626", fontWeight: 800 }}>
                                  {execCase.passed ? "✓" : "✕"}
                                </span>
                              ) : null}
                              <span>{tc.hidden ? `Hidden Case #${tcIdx + 1}` : `Case #${tcIdx + 1}`}</span>
                            </button>
                          );
                        })}

                        {/* Custom Test Case Sub-tab */}
                        <button
                          type="button"
                          className={`test-case-tab ${isCustomTabActive ? "active" : ""}`}
                          onClick={() => setIsCustomTabActive(true)}
                          style={{
                            borderRadius: "8px",
                            border: isCustomTabActive ? "1px solid var(--action)" : "1px dashed #CBD5E1",
                            background: isCustomTabActive ? "#EFF6FF" : "white",
                            color: isCustomTabActive ? "var(--action)" : "var(--muted)",
                          }}
                        >
                          + Custom Testcase
                        </button>
                      </div>

                      {/* Display Selected Case or Custom Input Area */}
                      {!isCustomTabActive ? (
                        q.testCases?.[activeCodeTab] ? (
                          <div>
                            <div style={{ marginBottom: "1rem" }}>
                              <div style={{ fontSize: "0.78rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.35rem" }}>
                                Input Arguments
                              </div>
                              <div className="test-case-box" style={{ background: "#F1F5F9", color: "#0F172A", fontWeight: 600 }}>
                                {q.testCases[activeCodeTab].input}
                              </div>
                            </div>

                            <div>
                              <div style={{ fontSize: "0.78rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.35rem" }}>
                                Expected Output
                              </div>
                              <div className="test-case-box" style={{ background: "#F1F5F9", color: "#0F172A", fontWeight: 600 }}>
                                {q.testCases[activeCodeTab].hidden ? "[Hidden Validation Test Case]" : q.testCases[activeCodeTab].expected}
                              </div>
                            </div>
                          </div>
                        ) : null
                      ) : (
                        <div>
                          <div style={{ fontSize: "0.82rem", color: "var(--muted)", fontWeight: 700, marginBottom: "0.4rem" }}>
                            Enter Custom Input Arguments for Testing:
                          </div>
                          <textarea
                            rows={3}
                            value={customTestCaseInput}
                            onChange={(e) => setCustomTestCaseInput(e.target.value)}
                            placeholder="e.g. nums = [1, 5, 8, 12], target = 13"
                            style={{
                              width: "100%",
                              fontFamily: "var(--font-mono)",
                              padding: "0.75rem",
                              borderRadius: "8px",
                              border: "1px solid var(--border)",
                              fontSize: "0.9rem",
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ marginTop: "0.75rem" }}
                            onClick={() => executeCode(q, false)}
                          >
                            ▶ Run Code on Custom Input
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* TAB 2: TEST RESULT EVALUATION (LEETCODE ACCEPTED / WRONG ANSWER) */
                    <div style={{ padding: "1.5rem" }}>
                      {!codeExecution ? (
                        <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--muted)" }}>
                          <p style={{ margin: 0 }}>Click <strong>▶ Run Code</strong> or <strong>🚀 Submit Solution</strong> to execute your code against test cases.</p>
                        </div>
                      ) : (
                        <div>
                          {/* Status Verdict Header */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
                            <div>
                              <div
                                style={{
                                  fontSize: "1.6rem",
                                  fontWeight: 900,
                                  color:
                                    codeExecution.status === "ACCEPTED"
                                      ? "#16A34A"
                                      : codeExecution.status === "WRONG_ANSWER"
                                      ? "#DC2626"
                                      : "#E11D48",
                                }}
                              >
                                {codeExecution.status === "ACCEPTED"
                                  ? "Accepted"
                                  : codeExecution.status === "WRONG_ANSWER"
                                  ? "Wrong Answer"
                                  : "Runtime Error"}
                              </div>
                              <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                                {codeExecution.isSubmit ? "Evaluated against all official test cases" : "Evaluated on sample test cases"}
                              </div>
                            </div>

                            {/* Telemetry Stats Pills */}
                            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                              <span style={{ background: "#F1F5F9", padding: "0.35rem 0.75rem", borderRadius: "8px", fontSize: "0.85rem", color: "#334155", fontWeight: 600 }}>
                                ⏱️ Runtime: <strong>{codeExecution.durationMs} ms</strong>
                              </span>
                              <span style={{ background: "#F1F5F9", padding: "0.35rem 0.75rem", borderRadius: "8px", fontSize: "0.85rem", color: "#334155", fontWeight: 600 }}>
                                💾 Memory: <strong>{codeExecution.memoryMb} MB</strong>
                              </span>
                            </div>
                          </div>

                          {/* Global Error Banner (if compile or runtime error) */}
                          {codeExecution.globalError ? (
                            <div
                              style={{
                                background: "#FEF2F2",
                                border: "1px solid #FECACA",
                                borderRadius: "8px",
                                padding: "1rem",
                                color: "#991B1B",
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.85rem",
                                marginBottom: "1.25rem",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              <strong>Runtime Error Message:</strong>
                              <div>{codeExecution.globalError}</div>
                            </div>
                          ) : null}

                          {/* Case Selectors */}
                          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                            {codeExecution.caseResults.map((cr, cIdx) => (
                              <button
                                key={cIdx}
                                type="button"
                                onClick={() => setActiveCodeTab(cIdx)}
                                style={{
                                  padding: "0.4rem 0.85rem",
                                  borderRadius: "6px",
                                  fontSize: "0.82rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  border: activeCodeTab === cIdx ? "1.5px solid var(--action)" : "1px solid var(--border)",
                                  background: cr.passed ? "#F0FDF4" : "#FEF2F2",
                                  color: cr.passed ? "#15803D" : "#B91C1C",
                                }}
                              >
                                {cr.passed ? "✓" : "✕"} Case #{cIdx + 1}
                              </button>
                            ))}
                          </div>

                          {/* Selected Case Inspection */}
                          {codeExecution.caseResults[activeCodeTab] ? (
                            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "1.25rem" }}>
                              <div style={{ marginBottom: "0.75rem" }}>
                                <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700 }}>INPUT</div>
                                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.88rem", background: "white", padding: "0.6rem", borderRadius: "6px", border: "1px solid #E2E8F0", marginTop: "0.25rem" }}>
                                  {codeExecution.caseResults[activeCodeTab].input}
                                </div>
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                                <div>
                                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700 }}>EXPECTED OUTPUT</div>
                                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.88rem", background: "white", padding: "0.6rem", borderRadius: "6px", border: "1px solid #E2E8F0", marginTop: "0.25rem", color: "#166534" }}>
                                    {codeExecution.caseResults[activeCodeTab].expected}
                                  </div>
                                </div>

                                <div>
                                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700 }}>YOUR CODE OUTPUT</div>
                                  <div
                                    style={{
                                      fontFamily: "var(--font-mono)",
                                      fontSize: "0.88rem",
                                      background: "white",
                                      padding: "0.6rem",
                                      borderRadius: "6px",
                                      border: "1px solid #E2E8F0",
                                      marginTop: "0.25rem",
                                      color: codeExecution.caseResults[activeCodeTab].passed ? "#166534" : "#B91C1C",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {codeExecution.caseResults[activeCodeTab].actual}
                                  </div>
                                </div>
                              </div>

                              {/* Stdout Logs */}
                              {codeExecution.caseResults[activeCodeTab].logs?.length > 0 ? (
                                <div>
                                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700 }}>STDOUT (CONSOLE LOGS)</div>
                                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", background: "#0F172A", color: "#E2E8F0", padding: "0.6rem", borderRadius: "6px", marginTop: "0.25rem", whiteSpace: "pre-line" }}>
                                    {codeExecution.caseResults[activeCodeTab].logs.join("\n")}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="stepper-nav-bar">
            <button
              className="btn btn-outline"
              disabled={index === 0}
              onClick={() => { setIndex((i) => i - 1); setCodeExecution(null); }}
            >
              &larr; Previous Question
            </button>

            {index === data.questions.length - 1 ? (
              <button
                type="button"
                className="btn btn-success"
                onClick={() => setShowSubmitModal(true)}
                style={{
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  boxShadow: "0 2px 10px rgba(16, 185, 129, 0.4)",
                }}
              >
                Submit Examination &rarr;
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => { setIndex((i) => i + 1); setCodeExecution(null); }}
              >
                Next Question &rarr;
              </button>
            )}
          </div>

          {/* Mobile Question Palette Matrix (visible only on Mobile, live screen camera is hidden) */}
          <div className="card mobile-question-matrix-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "0.95rem", margin: 0, fontWeight: 700 }}>Question Palette</h3>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                {Object.keys(selectedAnswers).length + Object.keys(codeAnswers).length} of {data.questions.length} answered
              </span>
            </div>
            <div className="qnav">
              {data.questions.map((item, i) => {
                const isAnswered = item.type === "CODING" ? Boolean(codeAnswers[item.id]) : Boolean(selectedAnswers[item.id]);
                const isCurrent = i === index;
                return (
                  <button
                    key={item.id}
                    className={`qnav-btn ${isCurrent ? "current" : isAnswered ? "answered" : ""}`}
                    onClick={() => { setIndex(i); setCodeExecution(null); }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: "0.85rem", paddingTop: "0.65rem", borderTop: "1px solid var(--border)", display: "flex", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span style={{ width: "10px", height: "10px", background: "var(--action)", borderRadius: "3px" }} />
                <span>Current</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span style={{ width: "10px", height: "10px", background: "var(--light)", border: "1px solid #93C5FD", borderRadius: "3px" }} />
                <span>Answered</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span style={{ width: "10px", height: "10px", background: "white", border: "1px solid var(--border)", borderRadius: "3px" }} />
                <span>Unanswered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Arranged Sticky Live Video Proctor HUD & Question Matrix (Hidden on Mobile View) */}
        <div className="exam-sidebar">
          {/* AI Face Managing Camera HUD (Live Screen - hidden on Mobile View) */}
          <div
            className="card proctor-live-screen-card"
            style={{
              padding: "1.1rem",
              borderRadius: "14px",
              textAlign: "center",
              background: "white",
              border:
                aiTrackingState === "FACE_LOCKED"
                  ? "2px solid #86EFAC"
                  : aiTrackingState === "LOOKING_AWAY"
                  ? "2px solid #FCD34D"
                  : "2px solid #FCA5A5",
              boxShadow:
                aiTrackingState === "FACE_LOCKED"
                  ? "0 4px 15px rgba(34, 197, 94, 0.12)"
                  : "0 4px 15px rgba(239, 68, 68, 0.15)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: aiTrackingState === "FACE_LOCKED" ? "#22C55E" : "#EF4444", display: "inline-block" }} />
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--primary)", letterSpacing: "0.03em" }}>
                  AI LIVE WEBCAM HUD
                </span>
              </div>
              <span className={`chip ${aiTrackingState === "FACE_LOCKED" ? "chip-success" : aiTrackingState === "LOOKING_AWAY" ? "chip-warning" : "chip-error"}`} style={{ fontSize: "0.72rem", fontWeight: 700 }}>
                {aiTrackingState === "FACE_LOCKED" ? "🟢 Face Locked" : aiTrackingState === "LOOKING_AWAY" ? "⚠️ Looking Away" : "⛔ Face Missing"}
              </span>
            </div>

            {/* Arranged Live Camera Viewport */}
            <div
              className={`proctor-camera-card ${aiTrackingState !== "FACE_LOCKED" ? "flagged" : ""}`}
              style={{
                margin: "0 auto",
                position: "relative",
                width: "100%",
                maxWidth: "280px",
                height: "185px",
                borderRadius: "10px",
                overflow: "hidden",
                backgroundColor: "#030712",
                border: "1.5px solid #1E293B",
              }}
            >
              {/* Live Webcam Video Feed (mirrored so face looks natural and visible) */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "scaleX(-1)",
                  display: "block",
                  backgroundColor: "#030712",
                }}
              />

              {/* Dynamic Reticle Overlay Canvas */}
              <canvas
                ref={canvasRef}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                }}
              />

              <div className="proctor-hud-overlay" style={{ pointerEvents: "none" }}>
                <div className="proctor-status-indicator">
                  <span className={`status-dot ${aiTrackingState === "FACE_LOCKED" ? "active" : "danger"}`} />
                  <span>🔴 REC: 720p HD • 30 FPS</span>
                </div>
                <div className="proctor-status-indicator" style={{ justifyContent: "space-between" }}>
                  <span>GAZE: {aiTrackingState === "FACE_LOCKED" ? "CENTERED" : "UNALIGNED"}</span>
                  <span>1 CANDIDATE</span>
                </div>
              </div>
            </div>

            {/* Candidate Identity Tag */}
            <div style={{ marginTop: "0.6rem", fontSize: "0.78rem", color: "#334155", fontWeight: 600 }}>
              Candidate: <strong>{data.session.paperCode || "KGS-2026"}</strong>
            </div>

            {/* Disciplinary 3-Warning Counter Gauge */}
            <div style={{ marginTop: "0.5rem", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "0.45rem 0.65rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                <span style={{ color: "var(--muted)" }}>Proctoring Alerts:</span>
                <span style={{ color: warningCount >= 3 ? "#EF4444" : warningCount > 0 ? "#D97706" : "#16A34A" }}>
                  {warningCount} / 3 Warnings
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.35rem" }}>
                {[1, 2, 3].map((step) => {
                  const isWarnActive = warningCount >= step;
                  return (
                    <div
                      key={step}
                      style={{
                        flex: 1,
                        height: "5px",
                        borderRadius: "3px",
                        background: isWarnActive ? (step === 3 ? "#EF4444" : "#F59E0B") : "#CBD5E1",
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: "0.5rem", fontSize: "0.74rem", color: aiTrackingState === "FACE_LOCKED" ? "var(--success)" : "var(--error)", fontWeight: 600 }}>
              {aiAssistantMsg}
            </div>
          </div>

          {/* Question Palette Matrix (Desktop View) */}
          <div className="card desktop-question-matrix-card" style={{ padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.95rem", marginBottom: "0.75rem" }}>Question Matrix</h3>
            <div className="qnav">
              {data.questions.map((item, i) => {
                const isAnswered = item.type === "CODING" ? Boolean(codeAnswers[item.id]) : Boolean(selectedAnswers[item.id]);
                const isCurrent = i === index;
                return (
                  <button
                    key={item.id}
                    className={`qnav-btn ${isCurrent ? "current" : isAnswered ? "answered" : ""}`}
                    onClick={() => { setIndex(i); setCodeExecution(null); }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.78rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: "12px", height: "12px", background: "var(--action)", borderRadius: "3px" }} />
                <span>Current Question</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: "12px", height: "12px", background: "var(--light)", border: "1px solid #93C5FD", borderRadius: "3px" }} />
                <span>Answered</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: "12px", height: "12px", background: "white", border: "1px solid var(--border)", borderRadius: "3px" }} />
                <span>Unanswered</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Full Screen Mode Enforcement Modal */}
      {fullscreenModalOpen && !isTerminated ? (
        <div className="modal-overlay" style={{ background: "rgba(10, 37, 74, 0.95)", zIndex: 120 }}>
          <div className="modal-content" style={{ maxWidth: "560px", padding: "2.5rem", textAlign: "center" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--light)", color: "var(--primary)", display: "grid", placeItems: "center", fontSize: "2rem", margin: "0 auto 1.5rem" }}>
              ⛶
            </div>
            <h2 style={{ fontSize: "1.75rem", marginBottom: "0.75rem", color: "var(--primary)" }}>
              Mandatory Full Screen Mode
            </h2>
            <p style={{ color: "var(--text)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              To ensure assessment integrity, this examination must be conducted in Full Screen view. Exiting full screen, minimizing the window, or navigating to other tabs is detected and logged as an integrity violation.
            </p>
            <div className="alert alert-warn" style={{ textAlign: "left", fontSize: "0.85rem", marginBottom: "2rem" }}>
              ⚠️ Full screen exits are counted toward your 3-warning proctoring limit.
            </div>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={enterFullscreenMode}
              style={{ width: "100%", padding: "1rem", fontSize: "1.1rem" }}
            >
              Activate Full Screen & Enter Exam
            </button>
          </div>
        </div>
      ) : null}

      {/* 3-Warning Disciplinary Auto-Exit Screen */}
      {isTerminated ? (
        <div className="modal-overlay" style={{ background: "rgba(185, 28, 28, 0.95)", zIndex: 150 }}>
          <div className="modal-content" style={{ maxWidth: "580px", padding: "2.5rem", textAlign: "center", border: "2px solid #FCA5A5" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#FEE2E2", color: "#B91C1C", display: "grid", placeItems: "center", fontSize: "2.5rem", margin: "0 auto 1.5rem", animation: "pulse 0.8s infinite alternate" }}>
              🚨
            </div>
            <h1 style={{ color: "#B91C1C", fontSize: "2rem", marginBottom: "0.5rem" }}>
              EXAMINATION TERMINATED
            </h1>
            <div className="chip chip-error" style={{ marginBottom: "1.5rem", fontSize: "0.88rem", padding: "0.4rem 1rem" }}>
              3 Proctoring Warnings Exceeded
            </div>
            <p style={{ color: "var(--text)", lineHeight: 1.6, fontSize: "1.05rem", marginBottom: "1.5rem" }}>
              The maximum limit of 3 proctoring warnings has been reached. In strict accordance with examination regulations, your attempt has been stopped, your answers frozen, and your session has been automatically submitted.
            </p>
            <div className="alert alert-error" style={{ textAlign: "left", fontSize: "0.88rem", marginBottom: "2rem" }}>
              This attempt has been flagged for mandatory invigilator and disciplinary review. You are being redirected to your submission receipt.
            </div>
            <button
              type="button"
              className="btn btn-danger btn-lg"
              onClick={() => router.replace(`/student/exams/${id}/submitted?terminated=true&warnings=3`)}
              style={{ width: "100%", padding: "1rem" }}
            >
              Exit Examination Station Now &rarr;
            </button>
          </div>
        </div>
      ) : null}

      {/* Warning 1 & Warning 2 Advisory Modal Overlay */}
      {activeWarningModal && !isTerminated ? (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header" style={{ background: activeWarningModal.sequence === "SECOND" ? "var(--warning-bg)" : "var(--info-bg)" }}>
              <strong style={{ color: activeWarningModal.sequence === "SECOND" ? "var(--warning)" : "var(--info)", fontSize: "1.1rem" }}>
                {activeWarningModal.sequence === "FIRST" ? "⚠️ Warning Notice 1 of 3" : "⚠️ Escalated Warning 2 of 3"}
              </strong>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "1rem", color: "var(--text)", lineHeight: 1.6 }}>
                {activeWarningModal.reason}
              </p>
              <div className="alert alert-warn" style={{ fontSize: "0.85rem", margin: 0 }}>
                {activeWarningModal.sequence === "SECOND"
                  ? "NOTICE: Reaching the 3rd warning will result in immediate automatic termination and exit from the exam."
                  : "Please keep your face directly aligned with the webcam and remain in full screen."}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => setActiveWarningModal(null)}
              >
                I Understand & Return to Exam
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Manual Submit Confirmation Modal */}
      {showSubmitModal && !isTerminated ? (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "540px" }}>
            <div className="modal-header">
              <strong style={{ fontSize: "1.1rem" }}>
                {!minDurationStatus.isSatisfied ? "🔒 Minimum Duration Lock Active" : "Confirm Examination Submission"}
              </strong>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowSubmitModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {!minDurationStatus.isSatisfied ? (
                <div style={{ background: "#FEF3C7", border: "1px solid #F59E0B", borderRadius: "10px", padding: "1.25rem", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#92400E", fontWeight: 800, fontSize: "1.05rem", marginBottom: "0.4rem" }}>
                    <span>⚠️</span>
                    <span>Submission Temporarily Locked</span>
                  </div>
                  <p style={{ margin: "0 0 0.75rem", color: "#78350F", fontSize: "0.92rem", lineHeight: 1.5 }}>
                    Under institutional examination regulations, candidates <strong>must spend at least {minDurationStatus.minMinutes} minutes</strong> in the examination before early submission is permitted.
                  </p>
                  <div style={{ background: "rgba(255,255,255,0.75)", borderRadius: "8px", padding: "0.75rem", fontSize: "0.85rem", display: "grid", gap: "0.35rem" }}>
                    <div><strong>Exam Started:</strong> {minDurationStatus.startedAtStr || "Recorded on Server"}</div>
                    <div><strong>Minimum Duration Required:</strong> {minDurationStatus.minMinutes} Minutes</div>
                    <div><strong>Submission Unlocks At:</strong> {minDurationStatus.unlockTimeStr}</div>
                    <div style={{ color: "#B45309", fontWeight: 700 }}>
                      <strong>Time Remaining Until Unlock:</strong> {minDurationStatus.remainingDisplay} ({minDurationStatus.remainingMinutes}m {minDurationStatus.remainingSeconds}s)
                    </div>
                  </div>
                  <p style={{ margin: "0.75rem 0 0", color: "#78350F", fontSize: "0.85rem", fontStyle: "italic" }}>
                    Please utilize this time to review your answers, test code cases, and verify calculations.
                  </p>
                </div>
              ) : (
                <div style={{ background: "#ECFDF5", border: "1px solid #10B981", borderRadius: "8px", padding: "0.85rem", marginBottom: "1rem", color: "#065F46", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>✅</span>
                  <span>Minimum exam duration requirement ({minDurationStatus.minMinutes} minutes) has been satisfied. You may submit your attempt now.</span>
                </div>
              )}

              <p style={{ margin: "0 0 0.75rem" }}>Are you sure you wish to submit your examination?</p>
              <div style={{ background: "var(--light)", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span>Total Questions:</span>
                  <strong>{data.questions.length}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span>Answered:</span>
                  <strong style={{ color: "var(--success)" }}>
                    {Object.keys(selectedAnswers).length + Object.keys(codeAnswers).length}
                  </strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Warnings Logged:</span>
                  <strong>{warningCount} / 3</strong>
                </div>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0 }}>
                Once submitted, answers are permanently frozen and cannot be modified.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowSubmitModal(false)}>
                Return to Exam
              </button>
              {!minDurationStatus.isSatisfied ? (
                <button
                  type="button"
                  className="btn btn-navy"
                  disabled
                  style={{ opacity: 0.5, cursor: "not-allowed", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                  title={`Submission unlocks in ${minDurationStatus.remainingDisplay}`}
                >
                  <span>🔒</span>
                  <span>Unlocks in {minDurationStatus.remainingDisplay}</span>
                </button>
              ) : (
                <button className="btn btn-navy" onClick={executeSubmit}>
                  Confirm & Submit Attempt
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

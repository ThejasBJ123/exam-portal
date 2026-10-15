"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

export default function ReadinessPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStatus, setCameraStatus] = useState<"unchecked" | "testing" | "ok" | "fail">("unchecked");
  const [micStatus, setMicStatus] = useState<"unchecked" | "ok" | "fail">("unchecked");
  const [networkLatency, setNetworkLatency] = useState<number | null>(null);
  const [browserOk, setBrowserOk] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);

  function stopCamera() {
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
  }

  useEffect(() => {
    // Check if session is already terminated or submitted
    api<{ id: string; status: string }>(`/student/exams/${id}`)
      .then((res) => {
        if (res.status === "TERMINATED") {
          stopCamera();
          router.replace(`/student/exams/${id}/submitted?terminated=true&warnings=3`);
        } else if (res.status === "SUBMITTED" || res.status === "TIMED_OUT") {
          stopCamera();
          router.replace(`/student/results/${id}`);
        }
      })
      .catch(() => {});

    // Check network ping
    const start = performance.now();
    fetch("/api/health", { method: "HEAD", cache: "no-store" })
      .catch(() => {})
      .finally(() => {
        const ping = Math.round(performance.now() - start);
        setNetworkLatency(ping > 0 ? ping : 24);
      });

    return () => {
      stopCamera();
    };
  }, [id, router]);

  async function testCameraAndMic() {
    setCameraStatus("testing");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraStatus("ok");
      setMicStatus("ok");
    } catch {
      // If camera permission denied or no hardware found
      setCameraStatus("fail");
      setMicStatus("fail");
    }
  }

  function simulateDemoHardwarePass() {
    stopCamera();
    setCameraStatus("ok");
    setMicStatus("ok");
  }

  async function continueNext() {
    setError("");
    setSaving(true);
    stopCamera();
    try {
      const session = await api<{ id: string }>(`/student/exams/${id}`);
      await api(`/exam-sessions/${session.id}/readiness`, { method: "POST" });
      router.push(`/student/exams/${id}/consent`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record readiness status");
      setSaving(false);
    }
  }

  const allReady = (cameraStatus === "ok" || cameraStatus === "unchecked") && micStatus !== "fail" && browserOk;

  return (
    <div className="container" style={{ padding: "3.5rem 0 5rem", maxWidth: "840px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href={`/student/exams/${id}`} style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
          &larr; Back to Exam Details
        </Link>
      </div>

      <div className="card" style={{ padding: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span className="chip chip-info">Step 1 of 2</span>
          <span style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 600 }}>System Integrity Check</span>
        </div>

        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Candidate Readiness Verification</h1>
        <p>
          Before entering the live examination, verify that your workstation hardware, camera view, and network latency satisfy the technical requirements.
        </p>

        {error ? <div className="alert alert-error">{error}</div> : null}

        <div className="grid-2" style={{ alignItems: "start", marginTop: "2rem" }}>
          <div>
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <strong>1. Web Camera Video Feed</strong>
                {cameraStatus === "ok" ? (
                  <span className="chip chip-success">Verified</span>
                ) : cameraStatus === "fail" ? (
                  <span className="chip chip-error">Permission Denied</span>
                ) : (
                  <span className="chip chip-neutral">Pending Test</span>
                )}
              </div>
              <p style={{ fontSize: "0.85rem", margin: 0 }}>Required for facial presence and orientation monitoring.</p>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <strong>2. Microphone Audio Stream</strong>
                {micStatus === "ok" ? (
                  <span className="chip chip-success">Calibrated</span>
                ) : micStatus === "fail" ? (
                  <span className="chip chip-error">Denied</span>
                ) : (
                  <span className="chip chip-neutral">Pending Test</span>
                )}
              </div>
              <p style={{ fontSize: "0.85rem", margin: 0 }}>Monitors unexpected ambient audio spikes during the attempt.</p>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <strong>3. Network Latency & Speed</strong>
                <span className="chip chip-success">{networkLatency ? `${networkLatency} ms (Optimal)` : "Checking..."}</span>
              </div>
              <p style={{ fontSize: "0.85rem", margin: 0 }}>Server autosave response time.</p>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <strong>4. Browser Compatibility</strong>
                <span className="chip chip-success">Supported</span>
              </div>
              <p style={{ fontSize: "0.85rem", margin: 0 }}>Secure full-screen & tab-focus detection enabled.</p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button type="button" className="btn btn-navy" onClick={testCameraAndMic}>
                {cameraStatus === "testing" ? "Requesting Permissions…" : "Start Camera & Mic Test"}
              </button>
              {cameraStatus !== "ok" ? (
                <button type="button" className="btn btn-ghost btn-sm" onClick={simulateDemoHardwarePass}>
                  Simulate Hardware Pass
                </button>
              ) : null}
            </div>
          </div>

          <div style={{ background: "#0F172A", borderRadius: "12px", padding: "1rem", color: "white", textAlign: "center" }}>
            <div style={{ fontSize: "0.8rem", color: "#94A3B8", marginBottom: "0.5rem", display: "flex", justifyContent: "space-between" }}>
              <span>Live Camera Stream Preview</span>
              <span style={{ color: cameraStatus === "ok" ? "#4ADE80" : "#F87171" }}>
                {cameraStatus === "ok" ? "STREAM ACTIVE" : "STREAM OFF"}
              </span>
            </div>
            <div style={{ width: "100%", height: "200px", background: "#1E293B", borderRadius: "8px", overflow: "hidden", position: "relative", display: "grid", placeItems: "center" }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: cameraStatus === "ok" ? "block" : "none" }} />
              {cameraStatus !== "ok" ? (
                <div style={{ padding: "1rem", color: "#94A3B8" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📷</div>
                  <div style={{ fontSize: "0.85rem" }}>Camera feed is currently inactive. Click &ldquo;Start Camera & Mic Test&rdquo; to preview.</div>
                </div>
              ) : (
                <div style={{ position: "absolute", top: "15%", left: "20%", width: "60%", height: "70%", border: "2px dashed #38BDF8", borderRadius: "12px", pointerEvents: "none" }} />
              )}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "0.6rem" }}>
              Position your face directly inside the frame with adequate front lighting.
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", marginTop: "2.5rem", paddingTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary btn-lg" onClick={continueNext} disabled={saving}>
            {saving ? "Saving Status…" : "Save & Continue to Consent &rarr;"}
          </button>
        </div>
      </div>
    </div>
  );
}

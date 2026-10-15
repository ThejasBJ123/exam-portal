"use client";

import { PortalShell } from "@/components/PortalShell";
import { useEffect, useState } from "react";
import { api, type PlatformSettings, defaultSettings } from "@/lib/api";

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Load active settings from API / Store
  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await api<PlatformSettings>("/settings");
        setSettings(data);
        if (data.updatedAt) {
          setLastSaved(new Date(data.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        }
      } catch {
        setMessage({ type: "error", text: "Failed to load platform settings from server. Using local defaults." });
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Save Settings to API / Store
  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const updated = await api<PlatformSettings>("/settings", {
        method: "POST",
        body: JSON.stringify(settings),
      });
      setSettings(updated);
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastSaved(timeStr);
      setMessage({
        type: "ok",
        text: `Platform settings successfully saved and propagated to all active proctoring engines and candidate sessions at ${timeStr}.`,
      });
      setTimeout(() => setMessage(null), 6000);
    } catch {
      setMessage({ type: "error", text: "Error saving platform settings. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  // Reset to Factory Defaults
  async function handleReset() {
    if (!confirm("Are you sure you want to reset all platform settings and thresholds to factory defaults?")) {
      return;
    }
    setResetting(true);
    setMessage(null);

    try {
      const reset = await api<PlatformSettings>("/settings/reset", {
        method: "POST",
      });
      setSettings(reset);
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastSaved(timeStr);
      setMessage({
        type: "ok",
        text: "Platform settings successfully reset to factory defaults.",
      });
      setTimeout(() => setMessage(null), 6000);
    } catch {
      setMessage({ type: "error", text: "Failed to reset settings to defaults." });
    } finally {
      setResetting(false);
    }
  }

  return (
    <PortalShell role="MASTER_ADMIN">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem" }}>
            <span className="kicker" style={{ color: "var(--primary)", fontWeight: 800 }}>CONTROL CENTER</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.2rem 0.6rem",
                borderRadius: "999px",
                background: "#DCFCE7",
                color: "#166534",
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.04em",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16A34A" }} />
              SECURE SESSION ACTIVE • LIVE SYNC
            </span>
          </div>
          <h1 style={{ margin: "0.2rem 0 0.4rem 0", fontSize: "1.9rem" }}>Platform Settings & Policies</h1>
          <p style={{ margin: 0, color: "var(--muted)", maxWidth: "680px" }}>
            Configure enterprise branding tokens, AI proctoring camera sensitivity thresholds, and global security policies across the institutional portal.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleReset}
            disabled={saving || resetting || loading}
            style={{ fontWeight: 600 }}
          >
            {resetting ? "Resetting..." : "↺ Reset Defaults"}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSave()}
            disabled={saving || resetting || loading}
            style={{ fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "0.45rem", minWidth: "160px", justifyContent: "center" }}
          >
            {saving ? "Saving Changes..." : "💾 Save Settings"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`alert ${message.type === "ok" ? "alert-ok" : "alert-error"}`}
          style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "1rem" }}
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
          <div className="brand-mark" style={{ margin: "0 auto 1rem", width: "40px", height: "40px", fontSize: "1rem" }}>
            KG
          </div>
          <p style={{ fontWeight: 600 }}>Loading active platform settings from server…</p>
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* SECTION 1: CORPORATE IDENTITY & DESIGN TOKENS */}
          <div className="card" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <h3 style={{ margin: 0 }}>Corporate Identity & Design Tokens</h3>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)", fontWeight: 700 }}>THEME PALETTE & BRANDING</span>
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--muted)", margin: "0 0 1.25rem 0" }}>
              Customize institutional color swatches and enterprise contact information displayed across candidate and administrative screens.
            </p>

            {/* Interactive Color Palettes with Live Pickers */}
            <div className="grid-3" style={{ marginBottom: "1.75rem" }}>
              {/* Primary Blue */}
              <div
                style={{
                  background: settings.primaryColor,
                  color: "white",
                  padding: "1.25rem",
                  borderRadius: "10px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  transition: "background 0.2s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <div style={{ fontWeight: 800 }}>Primary Brand Color</div>
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    style={{ width: "32px", height: "32px", padding: 0, border: "2px solid white", borderRadius: "6px", cursor: "pointer" }}
                    title="Choose primary color"
                  />
                </div>
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.4)",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.85rem",
                    padding: "0.3rem 0.6rem",
                    width: "100%",
                  }}
                />
              </div>

              {/* Action Blue */}
              <div
                style={{
                  background: settings.actionColor,
                  color: "white",
                  padding: "1.25rem",
                  borderRadius: "10px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  transition: "background 0.2s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <div style={{ fontWeight: 800 }}>Action Accent Color</div>
                  <input
                    type="color"
                    value={settings.actionColor}
                    onChange={(e) => setSettings({ ...settings, actionColor: e.target.value })}
                    style={{ width: "32px", height: "32px", padding: 0, border: "2px solid white", borderRadius: "6px", cursor: "pointer" }}
                    title="Choose action color"
                  />
                </div>
                <input
                  type="text"
                  value={settings.actionColor}
                  onChange={(e) => setSettings({ ...settings, actionColor: e.target.value })}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.4)",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.85rem",
                    padding: "0.3rem 0.6rem",
                    width: "100%",
                  }}
                />
              </div>

              {/* Light Blue Surface */}
              <div
                style={{
                  background: settings.surfaceColor,
                  color: settings.primaryColor,
                  border: `2px solid #BFDBFE`,
                  padding: "1.25rem",
                  borderRadius: "10px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  transition: "background 0.2s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <div style={{ fontWeight: 800 }}>Surface Background</div>
                  <input
                    type="color"
                    value={settings.surfaceColor}
                    onChange={(e) => setSettings({ ...settings, surfaceColor: e.target.value })}
                    style={{ width: "32px", height: "32px", padding: 0, border: "2px solid #94A3B8", borderRadius: "6px", cursor: "pointer" }}
                    title="Choose surface color"
                  />
                </div>
                <input
                  type="text"
                  value={settings.surfaceColor}
                  onChange={(e) => setSettings({ ...settings, surfaceColor: e.target.value })}
                  style={{
                    background: "white",
                    color: settings.primaryColor,
                    border: "1px solid #BFDBFE",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.85rem",
                    padding: "0.3rem 0.6rem",
                    width: "100%",
                  }}
                />
              </div>
            </div>

            {/* Enterprise Branding Fields */}
            <div className="grid-2" style={{ gap: "1rem" }}>
              <div className="field">
                <label style={{ fontWeight: 700, fontSize: "0.88rem" }}>Platform Portal Title</label>
                <input
                  type="text"
                  value={settings.portalTitle}
                  onChange={(e) => setSettings({ ...settings, portalTitle: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label style={{ fontWeight: 700, fontSize: "0.88rem" }}>Institution / Organization Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label style={{ fontWeight: 700, fontSize: "0.88rem" }}>Official Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label style={{ fontWeight: 700, fontSize: "0.88rem" }}>Helpdesk Contact Phone</label>
                <input
                  type="text"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: AI CAMERA MONITORING & 3-WARNING ENGINE */}
          <div className="card" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <h3 style={{ margin: 0 }}>AI Camera Monitoring & 3-Warning Engine</h3>
              <span style={{ fontSize: "0.78rem", color: "#DC2626", fontWeight: 800 }}>PROCTORING SENSITIVITY</span>
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--muted)", margin: "0 0 1.25rem 0" }}>
              Configure automatic warning triggers, cooldown intervals between warnings, and threshold for disciplinary exam termination.
            </p>

            <div className="grid-3" style={{ gap: "1.25rem", marginBottom: "1.5rem" }}>
              {/* Max Warnings (Threshold) */}
              <div className="field">
                <label style={{ fontWeight: 700, fontSize: "0.88rem" }}>Maximum Warnings (Threshold)</label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setSettings({ ...settings, maxWarnings: Math.max(1, settings.maxWarnings - 1) })}
                    style={{ fontWeight: 800, padding: "0.4rem 0.8rem" }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={settings.maxWarnings}
                    min={1}
                    max={5}
                    onChange={(e) => setSettings({ ...settings, maxWarnings: Number(e.target.value) || 3 })}
                    style={{ textAlign: "center", fontWeight: 800, fontSize: "1.1rem" }}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setSettings({ ...settings, maxWarnings: Math.min(5, settings.maxWarnings + 1) })}
                    style={{ fontWeight: 800, padding: "0.4rem 0.8rem" }}
                  >
                    +
                  </button>
                </div>
                <span style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.3rem", display: "block" }}>
                  Auto-disqualifies candidate upon reaching this limit.
                </span>
              </div>

              {/* Warning Cooldown */}
              <div className="field">
                <label style={{ fontWeight: 700, fontSize: "0.88rem" }}>
                  Warning Cooldown: <strong style={{ color: "var(--primary)" }}>{settings.warningCooldownSeconds}s</strong>
                </label>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={settings.warningCooldownSeconds}
                  onChange={(e) => setSettings({ ...settings, warningCooldownSeconds: Number(e.target.value) })}
                  style={{ width: "100%", margin: "0.6rem 0" }}
                />
                <span style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block" }}>
                  Minimum time between consecutive audio/visual alerts.
                </span>
              </div>

              {/* Deduplication Window */}
              <div className="field">
                <label style={{ fontWeight: 700, fontSize: "0.88rem" }}>
                  Deduplication Window: <strong style={{ color: "var(--primary)" }}>{settings.eventDeduplicationSeconds}s</strong>
                </label>
                <input
                  type="range"
                  min={2}
                  max={30}
                  step={1}
                  value={settings.eventDeduplicationSeconds}
                  onChange={(e) => setSettings({ ...settings, eventDeduplicationSeconds: Number(e.target.value) })}
                  style={{ width: "100%", margin: "0.6rem 0" }}
                />
                <span style={{ fontSize: "0.78rem", color: "var(--muted)", display: "block" }}>
                  Combines sustained suspicious frames into a single alert.
                </span>
              </div>
            </div>

            {/* AI Proctoring Sensitivity Selector */}
            <div className="field">
              <label style={{ fontWeight: 700, fontSize: "0.88rem" }}>Biometric Analysis Strictness Level</label>
              <select
                value={settings.cameraSensitivity}
                onChange={(e) => setSettings({ ...settings, cameraSensitivity: e.target.value as any })}
                style={{ fontWeight: 600 }}
              >
                <option value="BALANCED">Balanced (Standard enterprise threshold - Recommended for general aptitude screens)</option>
                <option value="STRICT">Strict (Zero tolerance for head movement or secondary face detection)</option>
                <option value="RELAXED">Relaxed (Permits mild head movements without immediate warning alerts)</option>
              </select>
            </div>
          </div>

          {/* SECTION 3: EXAMINATION SECURITY & COMPLIANCE */}
          <div className="card" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <h3 style={{ margin: 0 }}>Security & Submission Compliance</h3>
              <span style={{ fontSize: "0.78rem", color: "#16A34A", fontWeight: 800 }}>INTEGRITY ENFORCEMENT</span>
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--muted)", margin: "0 0 1.25rem 0" }}>
              Active rules governing exam deadlines, score release workflows, and prevention of multi-device session fraud.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <label style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", cursor: "pointer", padding: "0.5rem", borderRadius: "8px", background: settings.enforceServerDeadlines ? "#F0FDF4" : "#F8FAFC" }}>
                <input
                  type="checkbox"
                  checked={settings.enforceServerDeadlines}
                  onChange={(e) => setSettings({ ...settings, enforceServerDeadlines: e.target.checked })}
                  style={{ width: "20px", height: "20px", marginTop: "2px", cursor: "pointer" }}
                />
                <div>
                  <strong style={{ fontSize: "0.95rem" }}>Enforce Server-Controlled Deadlines</strong>
                  <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                    Calculates time remaining via authoritative server clock, preventing candidates from spoofing system time to gain extra duration.
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", cursor: "pointer", padding: "0.5rem", borderRadius: "8px", background: settings.embargoResults ? "#F0FDF4" : "#F8FAFC" }}>
                <input
                  type="checkbox"
                  checked={settings.embargoResults}
                  onChange={(e) => setSettings({ ...settings, embargoResults: e.target.checked })}
                  style={{ width: "20px", height: "20px", marginTop: "2px", cursor: "pointer" }}
                />
                <div>
                  <strong style={{ fontSize: "0.95rem" }}>Embargo Results Until Master Admin Approval</strong>
                  <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                    Keeps official percentile ranks and breakdown reports confidential until approved by the Master Admin on the Results Review dashboard.
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", cursor: "pointer", padding: "0.5rem", borderRadius: "8px", background: settings.freezeAnswersOnSubmit ? "#F0FDF4" : "#F8FAFC" }}>
                <input
                  type="checkbox"
                  checked={settings.freezeAnswersOnSubmit}
                  onChange={(e) => setSettings({ ...settings, freezeAnswersOnSubmit: e.target.checked })}
                  style={{ width: "20px", height: "20px", marginTop: "2px", cursor: "pointer" }}
                />
                <div>
                  <strong style={{ fontSize: "0.95rem" }}>Automatic Answer Freezing on Submission</strong>
                  <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                    Locks selected options upon final submission or timer expiration. Ensures submitted answers are immutable.
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", cursor: "pointer", padding: "0.5rem", borderRadius: "8px", background: !settings.allowCandidateReattempts ? "#F0FDF4" : "#F8FAFC" }}>
                <input
                  type="checkbox"
                  checked={!settings.allowCandidateReattempts}
                  onChange={(e) => setSettings({ ...settings, allowCandidateReattempts: !e.target.checked })}
                  style={{ width: "20px", height: "20px", marginTop: "2px", cursor: "pointer" }}
                />
                <div>
                  <strong style={{ fontSize: "0.95rem" }}>Strict Single-Sitting Policy (Re-attempts Blocked)</strong>
                  <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                    Disallows candidate registration reusing an already submitted or terminated mobile number and email address.
                  </div>
                </div>
              </label>

              <label style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", cursor: "pointer", padding: "0.5rem", borderRadius: "8px", background: settings.requireFaceLockOnConsent ? "#F0FDF4" : "#F8FAFC" }}>
                <input
                  type="checkbox"
                  checked={settings.requireFaceLockOnConsent}
                  onChange={(e) => setSettings({ ...settings, requireFaceLockOnConsent: e.target.checked })}
                  style={{ width: "20px", height: "20px", marginTop: "2px", cursor: "pointer" }}
                />
                <div>
                  <strong style={{ fontSize: "0.95rem" }}>Mandatory Biometric Face-Centering on Consent</strong>
                  <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                    Requires green face bounding box lock and webcam permission grant before candidate can access examination questions.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* FOOTER SAVE BAR */}
          <div
            className="card"
            style={{
              padding: "1.25rem 2rem",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--foreground)" }}>
                Configuration Status: <span style={{ color: "#16A34A" }}>● Synchronized</span>
              </span>
              <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                {lastSaved ? `Last synchronized at ${lastSaved}` : "Ready to save configuration updates"}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleReset}
                disabled={saving || resetting}
                style={{ fontWeight: 600 }}
              >
                Reset Defaults
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={saving || resetting}
                style={{
                  fontWeight: 800,
                  padding: "0.75rem 2rem",
                  fontSize: "1rem",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
                }}
              >
                {saving ? "Saving Settings..." : "Save Platform Settings"}
              </button>
            </div>
          </div>
        </form>
      )}
    </PortalShell>
  );
}

"use client";

import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { useState } from "react";

export default function SupportPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <PublicHeader />
      <div className="container" style={{ padding: "3.5rem 0 5rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <span className="chip chip-info">Assistance Desk</span>
          <h1 style={{ marginTop: "0.75rem", fontSize: "2.4rem" }}>Technical Support & Help</h1>
          <p style={{ fontSize: "1.1rem" }}>
            Experiencing difficulties before or during your scheduled assessment? Our operations and invigilation desk is available to assist you.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", margin: "2rem 0" }}>
            <div className="card">
              <span className="chip chip-neutral">Urgent Hotline</span>
              <h3 style={{ margin: "0.5rem 0 0.25rem" }}>+91 (0) 80 4455 6677</h3>
              <p style={{ fontSize: "0.88rem" }}>Active during scheduled batch windows. Priority queue for active examination issues.</p>
            </div>
            <div className="card">
              <span className="chip chip-neutral">Email Support</span>
              <h3 style={{ margin: "0.5rem 0 0.25rem" }}>support@kaizentrix.com</h3>
              <p style={{ fontSize: "0.88rem" }}>Responses within 15 minutes. Include your registered email and examination title.</p>
            </div>
          </div>

          <div className="card" style={{ padding: "2rem" }}>
            <h3>Submit an Incident or Support Request</h3>
            {submitted ? (
              <div className="alert alert-ok" style={{ marginTop: "1rem" }}>
                Thank you. Your support ticket has been logged and forwarded to the chief invigilator.
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                style={{ marginTop: "1rem" }}
              >
                <div className="grid-2" style={{ gap: "1rem", marginBottom: "0" }}>
                  <div className="field">
                    <label>Full Name</label>
                    <input required placeholder="e.g. Asha Rao" />
                  </div>
                  <div className="field">
                    <label>Registered Email</label>
                    <input type="email" required placeholder="student@kaizentrix.com" />
                  </div>
                </div>
                <div className="field">
                  <label>Examination Title / Code</label>
                  <input required defaultValue="Graduate Aptitude Screen 2026" />
                </div>
                <div className="field">
                  <label>Describe the Technical Issue</label>
                  <textarea rows={4} required placeholder="Describe what occurred (e.g. webcam permissions, network disconnection, browser crash)..." />
                </div>
                <button type="submit" className="btn btn-primary">Submit Support Request</button>
              </form>
            )}
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}

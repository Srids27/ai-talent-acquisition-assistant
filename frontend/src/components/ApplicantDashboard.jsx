import { useState, useEffect } from "react";
import * as api from "../utils/api";
import { S, statusColor, statusLabel } from "../constants";
import GlowBg from "./ui/GlowBg";
import Logo from "./ui/Logo";
import Btn from "./ui/Btn";
import NotificationBell from "./NotificationBell";
import "./ApplicantDashboard.css";

export default function ApplicantDashboard({ googleId, googleUser, onHome }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!googleId) return;
    api.getMyProfile(googleId).then(data => { setProfile(data); setLoading(false); }).catch(() => setLoading(false));
    const iv = setInterval(() => {
      api.getMyProfile(googleId).then(setProfile).catch(() => {});
    }, 10000);
    return () => clearInterval(iv);
  }, [googleId]);

  if (loading) {
    return (
      <div className="applicant-loading">
        <GlowBg />
        <div className="applicant-loading__inner">
          <Logo size="lg" />
          <p className="applicant-loading__text">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="applicant-loading">
        <GlowBg />
        <div className="applicant-loading__inner applicant-loading__inner--wide">
          <Logo size="lg" />
          <p className="applicant-loading__text applicant-loading__text--spaced">Profile not found. You may not have submitted an application yet.</p>
          <Btn onClick={onHome}>← Back to Home</Btn>
        </div>
      </div>
    );
  }

  const p = profile;
  const statusSteps = ["applied", "engaged", "shortlisted", "interview_scheduled"];
  const statusStepLabels = { applied: "Applied", engaged: "Engaged", shortlisted: "Shortlisted", interview_scheduled: "Scheduled" };
  const currentStepIndex = statusSteps.indexOf(p.status);

  const scoreCards = [
    { label: "Resume Match", value: p.match_score, unit: "%", color: S.blue, icon: "📄" },
    { label: "Engagement", value: p.engagement_score, unit: "%", color: "#F59E0B", icon: "💬" },
    { label: "Final Score", value: p.final_score, unit: "%", color: S.cyan, icon: "⭐" },
    { label: "Psychology", value: p.psychology_rating, unit: "/10", color: "#10B981", icon: "🧠" },
  ];

  return (
    <div className="applicant">
      <GlowBg />

      {/* Top bar */}
      <div className="applicant__topbar">
        <Logo size="sm" />
        <span className="applicant__portal-label">Applicant Portal</span>
        <div className="applicant__spacer" />
        <NotificationBell googleId={googleId} />
        <div className="applicant__user">
          {googleUser?.picture && <img src={googleUser.picture} alt="" className="applicant__avatar" />}
          <div>
            <p className="applicant__user-name">{p.name}</p>
            <p className="applicant__user-email">{p.google_email}</p>
          </div>
        </div>
        <button onClick={onHome} className="applicant__signout">Sign Out</button>
      </div>

      {/* Main content */}
      <div className="applicant__main">
        <div className="applicant__welcome">
          <h1 className="applicant__welcome-title">Welcome back, {p.name.split(" ")[0]}! 👋</h1>
          <p className="applicant__welcome-sub">
            {p.role_applied ? `Applied for ${p.role_applied}` : "Application submitted"} · {p.college || ""} · Status: <span style={{ color: statusColor[p.status] || "var(--muted)", fontWeight: 600 }}>{statusLabel[p.status] || p.status}</span>
          </p>
        </div>

        {/* Confirmed interview banner */}
        {p.confirmed_interview_date && (
          <div className="applicant__interview-banner">
            <div className="applicant__interview-icon">📅</div>
            <div>
              <p className="applicant__interview-title">Interview Scheduled!</p>
              <p className="applicant__interview-date">{p.confirmed_interview_date}</p>
              <p className="applicant__interview-note">Please be prepared and arrive 10 minutes early</p>
            </div>
          </div>
        )}

        {/* Score cards */}
        <div className="applicant__scores">
          {scoreCards.map(sc => {
            const hasValue = sc.value != null;
            const displayValue = hasValue ? (sc.unit === "/10" ? sc.value.toFixed(1) : Math.round(sc.value)) : "—";
            const pct = hasValue ? (sc.unit === "/10" ? (sc.value / 10) * 100 : sc.value) : 0;
            return (
              <div key={sc.label} className="applicant__score-card">
                <div className="applicant__score-bar-track">
                  <div className="applicant__score-bar-fill" style={{ width: `${pct}%`, background: sc.color, boxShadow: `0 0 12px ${sc.color}55` }} />
                </div>
                <div className="applicant__score-header">
                  <span className="applicant__score-icon">{sc.icon}</span>
                  <span className="applicant__score-label">{sc.label}</span>
                </div>
                <div className="applicant__score-value-row">
                  <span className={`applicant__score-value ${!hasValue ? "applicant__score-value--pending" : ""}`}>{displayValue}</span>
                  {hasValue && <span className="applicant__score-unit" style={{ color: sc.color }}>{sc.unit}</span>}
                </div>
                {!hasValue && <p className="applicant__score-pending">Pending</p>}
              </div>
            );
          })}
        </div>

        {/* Two-column: status + skills */}
        <div className="applicant__two-col">
          <div className="applicant__panel">
            <p className="applicant__section-title">Application Progress</p>
            <div className="applicant__timeline">
              {statusSteps.map((step, i) => {
                const isActive = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                const isLast = i === statusSteps.length - 1;
                return (
                  <div key={step}>
                    <div className="applicant__timeline-step">
                      <div className={`applicant__timeline-dot ${isCurrent ? "applicant__timeline-dot--current" : isActive ? "applicant__timeline-dot--active" : "applicant__timeline-dot--inactive"}`}>
                        {isActive ? <span className={`applicant__timeline-check ${isCurrent ? "applicant__timeline-check--current" : "applicant__timeline-check--done"}`}>✓</span> : <span className="applicant__timeline-num">{i + 1}</span>}
                      </div>
                      <div>
                        <p className={`applicant__timeline-label ${isActive ? "applicant__timeline-label--active" : "applicant__timeline-label--inactive"} ${isCurrent ? "applicant__timeline-label--current" : ""}`}>{statusStepLabels[step]}</p>
                        {isCurrent && <p className="applicant__timeline-current-tag">Current</p>}
                      </div>
                    </div>
                    {!isLast && (
                      <div className={`applicant__timeline-connector ${isActive && i < currentStepIndex ? "applicant__timeline-connector--active" : "applicant__timeline-connector--inactive"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="applicant__panel">
            <p className="applicant__section-title">Detected Skills</p>
            {(p.skills || []).length > 0 ? (
              <div className="applicant__skills-list">
                {p.skills.map((s, i) => (
                  <span key={i} className="applicant__skill-tag">{s}</span>
                ))}
              </div>
            ) : (
              <p className="applicant__skills-empty">Skills will appear after resume analysis</p>
            )}

            <div className="applicant__resume-section">
              <p className="applicant__resume-section-title">Resume Overview</p>
              {p.resume_analysis && (p.resume_analysis.summary || p.resume_analysis.strengths?.length || p.resume_analysis.education?.length) ? (
                <>
                  {p.resume_analysis.summary && <p className="applicant__resume-summary">{p.resume_analysis.summary}</p>}
                  {p.resume_analysis.experience_years != null && (
                    <div className="applicant__resume-exp-tags">
                      <span className="applicant__resume-exp-tag">🕒 {p.resume_analysis.experience_years}+ years exp</span>
                    </div>
                  )}
                  {(p.resume_analysis.strengths || []).length > 0 && (
                    <div className="applicant__resume-group">
                      <p className="applicant__resume-group-title applicant__resume-group-title--strengths">✦ Key Strengths</p>
                      <div className="applicant__resume-strength-tags">
                        {p.resume_analysis.strengths.map((s, i) => <span key={i} className="applicant__resume-strength-tag">{s}</span>)}
                      </div>
                    </div>
                  )}
                  {(p.resume_analysis.education || []).length > 0 && (
                    <div className="applicant__resume-group">
                      <p className="applicant__resume-group-title applicant__resume-group-title--education">🎓 Education</p>
                      {p.resume_analysis.education.map((ed, i) => <p key={i} className="applicant__resume-item">• {typeof ed === "string" ? ed : (ed.degree || ed.institution || JSON.stringify(ed))}</p>)}
                    </div>
                  )}
                  {(p.resume_analysis.key_projects || []).length > 0 && (
                    <div className="applicant__resume-group">
                      <p className="applicant__resume-group-title applicant__resume-group-title--projects">🚀 Notable Projects</p>
                      {p.resume_analysis.key_projects.map((proj, i) => <p key={i} className="applicant__resume-item">• {typeof proj === "string" ? proj : (proj.name || proj.title || JSON.stringify(proj))}</p>)}
                    </div>
                  )}
                </>
              ) : (
                <p className="applicant__resume-empty">Resume analysis in progress or unavailable for this document.</p>
              )}
            </div>
          </div>
        </div>

        {/* Score breakdown bars */}
        {(p.match_score != null || p.engagement_score != null) && (
          <div className="applicant__breakdown">
            <p className="applicant__section-title">Score Breakdown</p>
            {[
              { label: "Resume Match", value: p.match_score, max: 100, color: S.blue },
              { label: "Engagement Score", value: p.engagement_score, max: 100, color: "#F59E0B" },
              { label: "Final Score", value: p.final_score, max: 100, color: S.cyan },
              { label: "Psychology Rating", value: p.psychology_rating, max: 10, color: "#10B981" },
            ].filter(b => b.value != null).map(b => (
              <div key={b.label} className="applicant__breakdown-item">
                <div className="applicant__breakdown-header">
                  <span className="applicant__breakdown-label">{b.label}</span>
                  <span className="applicant__breakdown-value" style={{ color: b.color }}>{b.max === 10 ? b.value.toFixed(1) : Math.round(b.value)}{b.max === 10 ? "/10" : "%"}</span>
                </div>
                <div className="applicant__breakdown-track">
                  <div className="applicant__breakdown-fill" style={{ background: b.color, width: `${(b.value / b.max) * 100}%`, boxShadow: `0 0 8px ${b.color}66` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="applicant__footer">
          <p className="applicant__footer-text">Your profile is continuously evaluated. Check back for updates! 🚀</p>
        </div>
      </div>
    </div>
  );
}

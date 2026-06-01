import { useState, useEffect, useRef } from "react";
import * as api from "../utils/api";
import { S, statusColor, statusLabel, now } from "../constants";
import Logo from "./ui/Logo";
import Btn from "./ui/Btn";
import "./HRDashboard.css";

export default function HRDashboard({ onHome }) {
  const [tab, setTab] = useState("overview");
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [slots, setSlots] = useState([]);
  const [confirmedInterviews, setConfirmedInterviews] = useState([]);
  const [scheduleCandidate, setScheduleCandidate] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef();

  const [jobs, setJobs] = useState([]);
  const [selectedJobFilter, setSelectedJobFilter] = useState("");
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobDesc, setNewJobDesc] = useState("");
  const [newJobSkills, setNewJobSkills] = useState("");
  const [newJobNice, setNewJobNice] = useState("");
  const [newJobExp, setNewJobExp] = useState("");
  const [newJobLoc, setNewJobLoc] = useState("");
  const [jobError, setJobError] = useState("");

  const refreshSlots = () => {
    api.listSlots().then(setSlots).catch(() => {});
    api.listConfirmedInterviews().then(setConfirmedInterviews).catch(() => {});
  };
  useEffect(() => { refreshSlots(); }, [tab]);

  const refreshJobs = () => {
    api.listJobs().then(data => setJobs(data || [])).catch(() => {});
  };
  useEffect(() => { refreshJobs(); }, []);

  const refreshCandidates = () => {
    api.listApplicants(selectedJobFilter || null).then(data => {
      if (data?.length) {
        const normalized = data.map(a => ({
          id: a.id, name: a.name, role: a.role_applied || "Applicant",
          score: a.match_score || 0, engagement_score: a.engagement_score,
          final_score: a.final_score, psychology_rating: a.psychology_rating,
          skills: a.skills || [], status: a.status || "applied",
          avatar: a.name?.substring(0, 2).toUpperCase(), email: a.google_email,
          college: a.college, dob: a.dob, chat_completed: a.chat_completed,
          chat_session_id: a.chat_session_id, chat_report: a.chat_report,
          resume_analysis: a.resume_analysis, interview_slot_id: a.interview_slot_id,
          preferred_dates: a.preferred_dates || [],
          confirmed_interview_date: a.confirmed_interview_date || null,
          job_id: a.job_id, created_at: a.created_at,
          lastMsg: a.chat_completed ? "Chat assessment completed" : "Application submitted",
          lastTime: new Date(a.created_at).toLocaleDateString(), unread: 0,
        }));
        setCandidates(normalized);
      } else { setCandidates([]); }
    }).catch(() => {});
  };

  useEffect(() => { refreshCandidates(); setLoading(false); }, [tab, selectedJobFilter]);

  const handleStatusChange = async (candidateId, newStatus) => {
    const doUpdate = async () => { await api.updateApplicantStatus(candidateId, newStatus); refreshCandidates(); };
    try { await doUpdate(); } catch (e) {
      if (e.message === "Failed to fetch" || e.message?.includes("fetch")) {
        try { await new Promise(r => setTimeout(r, 1000)); await doUpdate(); } catch (e2) { alert(`Network error: ${e2.message}`); }
      } else { alert(`Error updating status: ${e.message}`); }
    }
  };

  const handleDeleteCandidate = async (candidateId, candidateName) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete ${candidateName}? This will remove them from the platform and MongoDB Atlas with a cascading effect.`)) return;
    try {
      await api.deleteApplicant(candidateId);
      alert(`${candidateName} has been deleted successfully.`);
      if (selectedCandidate?.id === candidateId) {
        setSelectedCandidate(null);
      }
      refreshCandidates();
      refreshSlots();
    } catch (e) {
      alert(`Error deleting candidate: ${e.message}`);
    }
  };

  const handleBookSlot = async () => {
    if (!scheduleCandidate || !selectedSlotId) return;
    try {
      const res = await api.bookSlot(scheduleCandidate.id, selectedSlotId);
      alert(res.message); setScheduleCandidate(null); setSelectedSlotId(null); refreshSlots(); refreshCandidates();
    } catch (e) { alert(e.message); }
  };

  useEffect(() => {
    if (!selectedCandidate?.chat_session_id) return;
    if (chatMessages[selectedCandidate.id]) return;
    api.getChatSession(selectedCandidate.chat_session_id).then(session => {
      if (session?.messages?.length) setChatMessages(prev => ({ ...prev, [selectedCandidate.id]: session.messages }));
    }).catch(() => {});
  }, [selectedCandidate]);

  const getMsgs = (id) => chatMessages[id] || [];
  const totalUnread = candidates.reduce((a, c) => a + (c.unread || 0), 0);

  const sendHRMsg = () => {
    if (!chatInput.trim() || !selectedCandidate) return;
    const msg = { role: "hr", text: chatInput, time: now() };
    setChatMessages(p => ({ ...p, [selectedCandidate.id]: [...getMsgs(selectedCandidate.id), msg] }));
    setChatInput("");
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "⬡" },
    { id: "candidates", label: "Candidates", icon: "◈" },
    { id: "jobs", label: "Jobs", icon: "💼" },
    { id: "messages", label: "Messages", icon: "◻", badge: totalUnread },
    { id: "schedule", label: "Schedule", icon: "◷" },
  ];

  const JDFilterBar = () => {
    if (jobs.length === 0) return null;
    const selectedJob = jobs.find(j => j.id === selectedJobFilter);
    return (
      <div className="hr__filter">
        <span className="hr__filter-label">Filter by JD</span>
        <select value={selectedJobFilter} onChange={e => setSelectedJobFilter(e.target.value)} className="hr__filter-select">
          <option value="" style={{ background: "#0d1117" }}>All Positions</option>
          {jobs.map(j => <option key={j.id} value={j.id} style={{ background: "#0d1117" }}>{j.title}</option>)}
        </select>
        {selectedJob && <span className="hr__filter-count">{candidates.length} applicant{candidates.length !== 1 ? "s" : ""}</span>}
      </div>
    );
  };

  // ── OVERVIEW ──
  const Overview = () => (
    <div className="hr__page">
      <h2 className="hr__page-title">Recruitment Overview</h2>
      <p className="hr__page-desc hr__page-desc--wide">Real-time pipeline status · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
      <JDFilterBar />
      <div className="hr__overview-grid">
        {[
          { label: "Total Applicants", value: candidates.length, delta: `+${candidates.length} total`, color: S.blue },
          { label: "Engaged", value: candidates.filter(c => ["engaged","shortlisted","interview_scheduled"].includes(c.status)).length, delta: "Chat done", color: "#F59E0B" },
          { label: "Shortlisted", value: candidates.filter(c => ["shortlisted","interview_scheduled"].includes(c.status)).length, delta: "By HR", color: S.cyan },
          { label: "Interviews", value: candidates.filter(c => c.status === "interview_scheduled").length, delta: "Booked", color: "#10B981" },
        ].map(m => (
          <div key={m.label} className="hr__overview-card">
            <div className="hr__overview-bar" style={{ background: m.color }} />
            <p className="hr__overview-label">{m.label}</p>
            <p className="hr__overview-value">{m.value}</p>
            <p className="hr__overview-delta" style={{ color: m.color }}>{m.delta}</p>
          </div>
        ))}
      </div>
      <div className="hr__chart">
        <p className="hr__section-label">Resume · Engagement · Final Score</p>
        <div className="hr__chart-headers" style={{ paddingLeft: 48+14+120+14 }}>
          <span className="hr__chart-hdr" style={{ flex: 1, textAlign: "center" }}>Final Score</span>
          <span className="hr__chart-hdr" style={{ width: 60, textAlign: "center" }}>Resume</span>
          <span className="hr__chart-hdr" style={{ width: 60, textAlign: "center" }}>Engage</span>
          <span style={{ width: 80 }} />
        </div>
        {[...candidates].sort((a, b) => (b.final_score || b.score || 0) - (a.final_score || a.score || 0)).map(c => (
          <div key={c.id} className="hr__chart-row">
            <div className="hr__chart-avatar" style={{ background: `${(statusColor[c.status] || S.muted)}22`, color: statusColor[c.status] || S.muted }}>{c.avatar}</div>
            <span className="hr__chart-name">{c.name}</span>
            <div className="hr__chart-bar-track">
              <div className="hr__chart-bar-fill" style={{ width: `${c.final_score || c.score || 0}%`, background: `linear-gradient(90deg, ${S.blue}, ${(c.final_score || c.score || 0) > 70 ? S.cyan : "#F59E0B"})` }} />
            </div>
            <span className="hr__chart-score">{c.score || "—"}%</span>
            <span className="hr__chart-score" style={{ color: c.engagement_score != null ? "#F59E0B" : S.dim }}>{c.engagement_score != null ? `${c.engagement_score}%` : "—"}</span>
            <div className="hr__status-badge" style={{ background: `${(statusColor[c.status] || S.muted)}18`, border: `1px solid ${(statusColor[c.status] || S.muted)}44` }}>
              <span className="hr__status-text" style={{ color: statusColor[c.status] || S.muted }}>{statusLabel[c.status] || c.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── CANDIDATES ──
  const Candidates = () => (
    <div className="hr__page">
      <h2 className="hr__page-title">Candidate Pool</h2>
      <p className="hr__page-desc">AI-ranked by final score (60% resume + 40% engagement)</p>
      <JDFilterBar />
      <div className="hr__cand-list">
        {[...candidates].sort((a, b) => (b.final_score || b.score || 0) - (a.final_score || a.score || 0)).map((c, i) => (
          <div key={c.id} className="hr__cand-card">
            <span className="hr__cand-rank">#{i + 1}</span>
            <div className="hr__cand-avatar" style={{ background: `${(statusColor[c.status] || S.muted)}22`, color: statusColor[c.status] || S.muted }}>{c.avatar}</div>
            <div className="hr__cand-info">
              <p className="hr__cand-name">{c.name}</p>
              <p className="hr__cand-role">{c.role} · {c.college || ""}</p>
            </div>
            <div className="hr__cand-skills">
              {(c.skills || []).slice(0, 3).map(s => <span key={s} className="hr__skill-tag">{s}</span>)}
            </div>
            <div className="hr__cand-scores">
              <div className="hr__cand-score">
                <p className="hr__cand-score-value" style={{ color: "#60a5fa" }}>{c.score || "—"}<span className="hr__cand-score-unit">%</span></p>
                <p className="hr__cand-score-label">resume</p>
              </div>
              <div className="hr__cand-score">
                <p className="hr__cand-score-value" style={{ color: c.engagement_score != null ? "#F59E0B" : S.dim }}>{c.engagement_score != null ? c.engagement_score : "—"}<span className="hr__cand-score-unit">%</span></p>
                <p className="hr__cand-score-label">engage</p>
              </div>
              <div className="hr__cand-score">
                <p className="hr__cand-score-value" style={{ fontSize: 18, color: (c.final_score || 0) > 70 ? S.cyan : (c.final_score || 0) > 50 ? "#F59E0B" : "#94a3b8" }}>{c.final_score != null ? c.final_score : "—"}<span className="hr__cand-score-unit">%</span></p>
                <p className="hr__cand-score-label">final</p>
              </div>
            </div>
            <div className="hr__status-badge hr__status-badge--sm" style={{ background: `${(statusColor[c.status] || S.muted)}18`, border: `1px solid ${(statusColor[c.status] || S.muted)}44` }}>
              <span className="hr__status-text" style={{ color: statusColor[c.status] || S.muted }}>{statusLabel[c.status] || c.status}</span>
            </div>
            {(c.preferred_dates?.length > 0) && (
              <div className="hr__cand-dates">
                {c.preferred_dates.map((d, j) => <span key={j} className="hr__cand-date-tag">📅 {d}</span>)}
              </div>
            )}
            <div className="hr__cand-actions">
              {c.status === "engaged" && (
                <>
                  <button onClick={() => handleStatusChange(c.id, "shortlisted")} className="hr__action-btn hr__action-btn--shortlist">✓ Shortlist</button>
                  <button onClick={() => handleStatusChange(c.id, "rejected")} className="hr__action-btn hr__action-btn--reject">✗ Reject</button>
                </>
              )}
              {c.status === "shortlisted" && (
                <button onClick={() => { setScheduleCandidate(c); setTab("schedule"); }} className="hr__action-btn hr__action-btn--schedule">📅 Schedule</button>
              )}
              <button onClick={() => { setSelectedCandidate(c); setTab("messages"); }} className="hr__action-btn hr__action-btn--chat">Chat</button>
              <button onClick={() => handleDeleteCandidate(c.id, c.name)} className="hr__action-btn hr__action-btn--delete">🗑 Delete</button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );

  // ── MESSAGES ──
  const Messages = () => (
    <div className="hr__msg-layout">
      <div className="hr__msg-sidebar">
        <div className="hr__msg-sidebar-header">
          <p className="hr__msg-sidebar-title">Messages</p>
          <p className="hr__msg-sidebar-count">{candidates.length} conversations</p>
        </div>
        {candidates.map(c => (
          <div key={c.id} onClick={() => setSelectedCandidate(c)} className={`hr__msg-item ${selectedCandidate?.id === c.id ? "hr__msg-item--active" : "hr__msg-item--inactive"}`}>
            <div className="hr__msg-item-row">
              <div className="hr__msg-avatar-wrap">
                <div className="hr__msg-avatar" style={{ background: `${statusColor[c.status]}33`, color: statusColor[c.status] }}>{c.avatar || c.name?.substring(0, 2).toUpperCase()}</div>
                {(c.unread || 0) > 0 && <div className="hr__msg-unread-dot">{c.unread}</div>}
              </div>
              <div className="hr__msg-item-info">
                <div className="hr__msg-item-top">
                  <span className="hr__msg-item-name">{c.name}</span>
                  <span className="hr__msg-item-time">{c.lastTime || ""}</span>
                </div>
                <p className="hr__msg-item-preview">{c.lastMsg || "No messages yet"}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedCandidate ? (
        <div className="hr__chat">
          <div className="hr__chat-header">
            <div className="hr__chat-avatar" style={{ background: `${statusColor[selectedCandidate.status]}33`, color: statusColor[selectedCandidate.status] }}>{selectedCandidate.avatar || selectedCandidate.name?.substring(0, 2).toUpperCase()}</div>
            <div>
              <p className="hr__chat-name">{selectedCandidate.name}</p>
              <p className="hr__chat-meta">{selectedCandidate.role} · {selectedCandidate.score}% match{selectedCandidate.psychology_rating != null ? ` · 🧠 ${selectedCandidate.psychology_rating}/10` : ""}</p>
            </div>
            <div className="hr__chat-actions">
              <button onClick={() => setTab("schedule")} className="hr__chat-schedule-btn">📅 Schedule</button>
              <div className="hr__status-badge hr__status-badge--sm" style={{ background: `${statusColor[selectedCandidate.status]}18`, border: `1px solid ${statusColor[selectedCandidate.status]}44` }}>
                <span className="hr__status-text" style={{ color: statusColor[selectedCandidate.status] }}>{statusLabel[selectedCandidate.status]}</span>
              </div>
            </div>
          </div>
          <div className="hr__chat-messages">
            {getMsgs(selectedCandidate.id).map((m, i) => (
              <div key={i} className={`hr__chat-msg ${m.role === "hr" ? "hr__chat-msg--hr" : "hr__chat-msg--other"}`}>
                {m.role !== "hr" && <div className="hr__chat-msg-avatar" style={{ background: m.role === "ai" ? `linear-gradient(135deg, ${S.blue}, ${S.cyan})` : `${statusColor[selectedCandidate.status]}33`, color: m.role === "ai" ? S.bg : statusColor[selectedCandidate.status] }}>{m.role === "ai" ? "A" : selectedCandidate.avatar}</div>}
                <div className="hr__chat-msg-content">
                  {m.role !== "hr" && <p className="hr__chat-msg-sender">{m.role === "ai" ? "ARIA (AI)" : selectedCandidate.name}</p>}
                  <div className={`hr__chat-msg-bubble ${m.role === "hr" ? "hr__chat-msg-bubble--hr" : "hr__chat-msg-bubble--other"}`}>{m.text}</div>
                  <p className="hr__chat-msg-time" style={{ textAlign: m.role === "hr" ? "right" : "left" }}>{m.time}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="hr__chat-input-bar">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendHRMsg()} placeholder={`Message ${selectedCandidate.name}…`} className="hr__chat-input" />
            <button onClick={sendHRMsg} className="hr__chat-send">➤</button>
          </div>
        </div>
      ) : (
        <div className="hr__chat-empty">
          <div className="hr__chat-empty-icon">💬</div>
          <p className="hr__chat-empty-text">Select a candidate to view conversation</p>
        </div>
      )}
    </div>
  );

  // ── SCHEDULE ──
  const schedulableCandidates = candidates.filter(c => ["shortlisted", "interview_scheduled"].includes(c.status));
  const dateConflictMap = {};
  schedulableCandidates.forEach(c => {
    (c.preferred_dates || []).forEach(d => {
      if (!dateConflictMap[d]) dateConflictMap[d] = [];
      dateConflictMap[d].push(c.name);
    });
  });

  const handleConfirmDate = async (candidateId, date) => {
    try { await api.confirmInterviewDate(candidateId, date); refreshCandidates(); } catch (e) { alert(e.message); }
  };

  const Schedule = () => (
    <div className="hr__page">
      <h2 className="hr__page-title">Interview Scheduling</h2>
      <p className="hr__page-desc">Review preferred dates · Detect conflicts · Confirm interviews</p>
      <div className="hr__schedule-grid">
        <div className="hr__schedule-panel">
          <p className="hr__section-label hr__section-label--tight">Shortlisted Candidates & Preferences</p>
          {schedulableCandidates.length === 0 ? (
            <p className="hr__empty-text" style={{ padding: 20, textAlign: "center" }}>No shortlisted candidates yet. Shortlist from the Candidates tab first.</p>
          ) : schedulableCandidates.map(c => {
            const isScheduled = c.status === "interview_scheduled";
            return (
              <div key={c.id} className="hr__schedule-card" style={{ background: isScheduled ? "rgba(79,255,227,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${isScheduled ? "rgba(79,255,227,0.2)" : "var(--border)"}` }}>
                <div className="hr__schedule-card-header">
                  <div className="hr__schedule-avatar" style={{ background: "rgba(79,255,227,0.13)", color: "var(--cyan)" }}>{c.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <p className="hr__schedule-name">{c.name}</p>
                    <p className="hr__schedule-score">Final: {c.final_score || c.score}%</p>
                  </div>
                  {isScheduled && <span style={{ padding: "4px 10px", borderRadius: 20, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981", fontSize: 10, fontWeight: 700 }}>✓ {c.confirmed_interview_date}</span>}
                </div>
                <div className="hr__schedule-dates">
                  {(c.preferred_dates || []).length === 0 ? (
                    <span style={{ color: "var(--dim)", fontSize: 12 }}>No preferred dates submitted</span>
                  ) : (c.preferred_dates || []).map((d, j) => {
                    const hasConflict = (dateConflictMap[d] || []).length > 1;
                    const isConfirmed = c.confirmed_interview_date === d;
                    return (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="hr__schedule-date" style={{ background: hasConflict ? "rgba(239,68,68,0.12)" : isConfirmed ? "rgba(79,255,227,0.12)" : "rgba(0,112,243,0.1)", border: `1px solid ${hasConflict ? "rgba(239,68,68,0.35)" : isConfirmed ? "rgba(79,255,227,0.35)" : "rgba(0,112,243,0.25)"}`, color: hasConflict ? "#f87171" : isConfirmed ? "var(--cyan)" : "#60a5fa" }}>
                          {hasConflict ? "⚠️" : "📅"} {d}
                        </span>
                        {!isScheduled && <button onClick={() => handleConfirmDate(c.id, d)} className="hr__action-btn hr__action-btn--confirm">Confirm</button>}
                      </div>
                    );
                  })}
                </div>
                {(c.preferred_dates || []).some(d => (dateConflictMap[d] || []).length > 1) && (
                  <p className="hr__schedule-conflict">⚠️ Date conflict — {(c.preferred_dates || []).filter(d => (dateConflictMap[d] || []).length > 1).map(d => `${d}: ${dateConflictMap[d].filter(n => n !== c.name).join(", ")}`).join("; ")}</p>
                )}
              </div>
            );
          })}
        </div>

        <div>
          <div className="hr__schedule-panel" style={{ marginBottom: 20 }}>
            <p className="hr__section-label hr__section-label--tight">Confirmed Interviews ({candidates.filter(c => c.status === "interview_scheduled").length})</p>
            {candidates.filter(c => c.status === "interview_scheduled").length === 0 ? (
              <div className="hr__empty"><p className="hr__empty-text">No confirmed interviews yet</p></div>
            ) : candidates.filter(c => c.status === "interview_scheduled").map(c => (
              <div key={c.id} className="hr__confirmed-card">
                <div className="hr__confirmed-row">
                  <span className="hr__confirmed-name">{c.name}</span>
                  <span className="hr__confirmed-status">✓ Confirmed</span>
                </div>
                <p className="hr__confirmed-date">📅 {c.confirmed_interview_date}</p>
              </div>
            ))}
          </div>

          {Object.entries(dateConflictMap).filter(([, names]) => names.length > 1).length > 0 && (
            <div className="hr__conflict-panel">
              <p className="hr__conflict-title">⚠️ Date Conflicts</p>
              {Object.entries(dateConflictMap).filter(([, names]) => names.length > 1).map(([date, names]) => (
                <div key={date} className="hr__conflict-item">
                  <p className="hr__conflict-date">📅 {date}</p>
                  <p className="hr__conflict-names">{names.join(", ")} — HR must reschedule one</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── JOBS ──
  const handleCreateJob = async () => {
    if (!newJobTitle.trim() || !newJobDesc.trim()) { setJobError("Title and description are required."); return; }
    setJobError("");
    try {
      await api.createJob({ title: newJobTitle.trim(), description: newJobDesc.trim(), requiredSkills: newJobSkills.split(",").map(s => s.trim()).filter(Boolean), niceToHave: newJobNice.split(",").map(s => s.trim()).filter(Boolean), experienceYears: newJobExp ? parseInt(newJobExp) : null, location: newJobLoc.trim() || null });
      setNewJobTitle(""); setNewJobDesc(""); setNewJobSkills(""); setNewJobNice(""); setNewJobExp(""); setNewJobLoc("");
      refreshJobs();
    } catch (e) { setJobError(e.message); }
  };

  const handleDeactivateJob = async (jobId) => {
    if (!window.confirm("Deactivate this job posting?")) return;
    try { await api.deleteJob(jobId); refreshJobs(); } catch (e) { alert(e.message); }
  };

  const jobsContent = (
    <div className="hr__page">
      <h2 className="hr__page-title">Job Descriptions</h2>
      <p className="hr__page-desc">Create and manage job postings · Applicants see these positions when applying</p>
      <div className="hr__jobs-grid">
        <div className="hr__jobs-form">
          <p className="hr__section-label hr__section-label--tight">Post New Position</p>
          <div className="hr__jobs-form-fields">
            <div>
              <span className="hr__jobs-form-label">Job Title *</span>
              <input value={newJobTitle} onChange={e => setNewJobTitle(e.target.value)} placeholder="e.g. Senior React Developer" className="hr__jobs-input" />
            </div>
            <div>
              <span className="hr__jobs-form-label">Description *</span>
              <textarea value={newJobDesc} onChange={e => setNewJobDesc(e.target.value)} placeholder="Detailed job description…" rows={5} className="hr__jobs-textarea" />
            </div>
            <div>
              <span className="hr__jobs-form-label">Required Skills (comma-separated)</span>
              <input value={newJobSkills} onChange={e => setNewJobSkills(e.target.value)} placeholder="React, Node.js, TypeScript" className="hr__jobs-input" />
            </div>
            <div>
              <span className="hr__jobs-form-label">Nice to Have (comma-separated)</span>
              <input value={newJobNice} onChange={e => setNewJobNice(e.target.value)} placeholder="AWS, Docker, GraphQL" className="hr__jobs-input" />
            </div>
            <div className="hr__jobs-row">
              <div>
                <span className="hr__jobs-form-label">Experience (years)</span>
                <input type="number" value={newJobExp} onChange={e => setNewJobExp(e.target.value)} placeholder="3" className="hr__jobs-input" />
              </div>
              <div>
                <span className="hr__jobs-form-label">Location</span>
                <input value={newJobLoc} onChange={e => setNewJobLoc(e.target.value)} placeholder="Remote / Kolkata" className="hr__jobs-input" />
              </div>
            </div>
            {jobError && <p className="hr__jobs-error">{jobError}</p>}
            <button onClick={handleCreateJob} className="hr__jobs-submit">Post Job Description</button>
          </div>
        </div>

        <div className="hr__jobs-list">
          <div className="hr__jobs-list-panel">
            <p className="hr__section-label hr__section-label--tight">Active Positions ({jobs.length})</p>
            {jobs.length === 0 ? (
              <div className="hr__empty">
                <div className="hr__empty-icon">💼</div>
                <p className="hr__empty-text">No job descriptions posted yet</p>
                <p className="hr__empty-sub">Create one to start receiving applications</p>
              </div>
            ) : jobs.map(j => (
              <div key={j.id} className="hr__job-card">
                <div className="hr__job-card-header">
                  <div className="hr__job-card-info">
                    <p className="hr__job-title">{j.title}</p>
                    <p className="hr__job-meta">{j.location || "No location"} {j.experience_years ? `· ${j.experience_years}+ years` : ""}</p>
                  </div>
                  <div className="hr__job-card-actions">
                    <button onClick={() => { setSelectedJobFilter(j.id); setTab("candidates"); }} className="hr__job-action-btn hr__job-action-btn--view">View Rankings</button>
                    <button onClick={() => handleDeactivateJob(j.id)} className="hr__job-action-btn hr__job-action-btn--deactivate">Deactivate</button>
                  </div>
                </div>
                <p className="hr__job-desc">{j.description?.substring(0, 120)}{j.description?.length > 120 ? "…" : ""}</p>
                {j.required_skills?.length > 0 && (
                  <div className="hr__job-skills">
                    {j.required_skills.map(s => <span key={s} className="hr__skill-tag">{s}</span>)}
                  </div>
                )}
                <p className="hr__job-posted">Posted {new Date(j.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="hr">
      <div className="hr__sidebar">
        <div className="hr__sidebar-header">
          <Logo size="sm" />
          <p className="hr__sidebar-label">HR Portal</p>
        </div>
        <div className="hr__sidebar-nav">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`hr__sidebar-tab ${tab === t.id ? "hr__sidebar-tab--active" : ""}`}>
              <span className="hr__sidebar-tab-icon">{t.icon}</span>
              {t.label}
              {t.badge > 0 && <span className="hr__sidebar-tab-badge">{t.badge}</span>}
            </button>
          ))}
        </div>
        <div className="hr__sidebar-footer">
          <div className="hr__user">
            <div className="hr__user-avatar">👤</div>
            <div>
              <p className="hr__user-name">HR Admin</p>
              <p className="hr__user-email">hr@company.com</p>
            </div>
          </div>
          <button onClick={onHome} className="hr__signout">← Sign Out</button>
        </div>
      </div>

      <div className={`hr__content ${tab === "messages" ? "hr__content--noscroll" : "hr__content--scroll"}`}>
        {tab === "overview" && <Overview />}
        {tab === "candidates" && <Candidates />}
        {tab === "jobs" && jobsContent}
        {tab === "messages" && <Messages />}
        {tab === "schedule" && <Schedule />}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import * as api from "../utils/api";
import { S, KOLKATA_COLLEGES, GOOGLE_CLIENT_ID } from "../constants";
import GlowBg from "./ui/GlowBg";
import Logo from "./ui/Logo";
import Btn from "./ui/Btn";
import Input from "./ui/Input";
import "./HomeScreen.css";

export default function HomeScreen({ onApplicant, onHR, onApplicantReturn }) {
  const [mode, setMode] = useState("applicant");
  const [step, setStep] = useState(1);
  const [googleUser, setGoogleUser] = useState(null);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [college, setCollege] = useState("");
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [preferredDate1, setPreferredDate1] = useState("");
  const [preferredDate2, setPreferredDate2] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [availableJobs, setAvailableJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [hrEmail, setHrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    api.listJobs().then(jobs => {
      setAvailableJobs(jobs || []);
      if (jobs?.length === 1) setSelectedJobId(jobs[0].id);
      setJobsLoading(false);
    }).catch(() => setJobsLoading(false));
  }, []);

  useEffect(() => {
    if (mode !== "applicant" || step !== 1) return;
    const timer = setTimeout(() => {
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "filled_black", size: "large", width: 380, text: "signin_with", shape: "pill",
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [mode, step]);

  const handleGoogleResponse = async (response) => {
    setError(""); setLoading(true);
    try {
      const res = await api.verifyGoogleToken(response.credential);
      localStorage.setItem("aria_token", res.access_token);
      const gUser = { google_id: res.google_id, email: res.email, name: res.name, picture: res.picture };
      try {
        const existing = await api.getMyProfile(res.google_id);
        if (existing && existing.id) { onApplicantReturn(gUser); return; }
      } catch (_) {}
      setGoogleUser(gUser);
      setName(res.name || "");
      setStep(2);
      setLoading(false);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const handleSubmitProfile = async () => {
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!dob) { setError("Please enter your date of birth."); return; }
    if (!college) { setError("Please select your college."); return; }
    if (!file) { setError("Please upload your resume."); return; }
    if (availableJobs.length > 0 && !selectedJobId) { setError("Please select a position to apply for."); return; }
    setError(""); setLoading(true);
    try {
      const selectedJob = availableJobs.find(j => j.id === selectedJobId);
      const result = await api.submitApplication({
        googleId: googleUser.google_id, googleEmail: googleUser.email,
        name, dob, college, jobId: selectedJobId || null,
        roleApplied: selectedJob?.title || null, preferredDate1, preferredDate2, resumeFile: file,
      });
      onApplicant({ applicantId: result.applicant_id, email: googleUser.email, matchScore: result.match_score, questions: result.questions || [] });
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const handleHRLogin = async () => {
    if (!hrEmail || !password) { setError("Please fill in all fields."); return; }
    setError(""); setLoading(true);
    try {
      const res = await api.hrLogin(hrEmail, password);
      localStorage.setItem("aria_token", res.access_token);
      onHR();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  if (loading && mode === "applicant" && step === 2) return null;

  return (
    <div className="home">
      <GlowBg />
      <div className="home__container">
        <div className="home__branding">
          <Logo size="lg" />
          <p className="home__tagline">AI Recruitment Intelligence Assistant</p>
        </div>

        {/* Toggle */}
        <div className="home__toggle">
          {[["applicant", "🙋 Apply for a Job"], ["hr", "🏢 HR Dashboard"]].map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m); setError(""); setStep(1); }} className={`home__toggle-btn ${mode === m ? "home__toggle-btn--active" : "home__toggle-btn--inactive"}`}>{label}</button>
          ))}
        </div>

        <div className="home__card">
          {mode === "applicant" ? (
            step === 1 ? (
              <>
                <h2 className="home__heading">Start your application</h2>
                <p className="home__desc">Sign in with Google to begin the AI-powered screening</p>

                {!jobsLoading && availableJobs.length === 0 ? (
                  <div className="home__no-vacancy">
                    <div className="home__no-vacancy-icon">🚫</div>
                    <h3 className="home__no-vacancy-title">No Job Vacancies Available</h3>
                    <p className="home__no-vacancy-text">There are currently no open positions. Please check back later when HR posts new job descriptions.</p>
                  </div>
                ) : (
                  <>
                    <div className="home__steps">
                      {[1, 2].map(s => (
                        <div key={s} className="home__step-bar" style={{ background: s <= step ? `linear-gradient(90deg, ${S.blue}, ${S.cyan})` : "rgba(255,255,255,0.08)" }} />
                      ))}
                    </div>
                    <p className="home__step-label">Step 1 of 2 — Verify your identity</p>

                    <div className="home__google-wrap">
                      <div ref={googleBtnRef} />
                    </div>

                    {!window.google && (
                      <p className="home__google-loading">Loading Google Sign-In...</p>
                    )}
                  </>
                )}

                {error && <p className="home__error">{error}</p>}
              </>
            ) : (
              <>
                <div className="home__profile-header">
                  {googleUser?.picture && <img src={googleUser.picture} alt="" className="home__profile-avatar" />}
                  <div>
                    <p className="home__profile-name">{googleUser?.name}</p>
                    <p className="home__profile-email">{googleUser?.email}</p>
                  </div>
                  <div className="home__verified-badge">
                    <span className="home__verified-text">Verified</span>
                  </div>
                </div>

                <h2 className="home__heading">Complete your profile</h2>
                <p className="home__desc home__desc--tight">Fill in your details and upload your resume</p>

                <div className="home__steps">
                  {[1, 2].map(s => (
                    <div key={s} className="home__step-bar" style={{ background: s <= step ? `linear-gradient(90deg, ${S.blue}, ${S.cyan})` : "rgba(255,255,255,0.08)" }} />
                  ))}
                </div>
                <p className="home__step-label">Step 2 of 2 — Your details</p>

                <div className="home__form-fields">
                  {availableJobs.length > 0 && (
                    <label className="home__label">
                      <span className="home__label-text">Position Applying For *</span>
                      <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)} className="home__select">
                        <option value="" disabled>Select a position</option>
                        {availableJobs.map(j => <option key={j.id} value={j.id} style={{ background: "#1a1a2e" }}>{j.title}{j.location ? ` · ${j.location}` : ""}</option>)}
                      </select>
                      {selectedJobId && (() => {
                        const job = availableJobs.find(j => j.id === selectedJobId);
                        return job ? (
                          <div className="home__job-preview">
                            <p className="home__job-preview-desc">{job.description?.substring(0, 150)}{job.description?.length > 150 ? "…" : ""}</p>
                            {job.required_skills?.length > 0 && (
                              <div className="home__job-skills">
                                {job.required_skills.slice(0, 5).map(s => <span key={s} className="home__skill-tag">{s}</span>)}
                              </div>
                            )}
                          </div>
                        ) : null;
                      })()}
                    </label>
                  )}
                  <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" />
                  <label className="home__label">
                    <span className="home__label-text">Date of Birth</span>
                    <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="home__date-input" />
                  </label>
                  <label className="home__label">
                    <span className="home__label-text">College</span>
                    <select value={college} onChange={e => setCollege(e.target.value)} className="home__select">
                      <option value="" disabled>Select your college</option>
                      {KOLKATA_COLLEGES.map(c => <option key={c} value={c} style={{ background: "#1a1a2e" }}>{c}</option>)}
                    </select>
                  </label>
                </div>

                <div className="home__dropzone"
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); setFile(e.dataTransfer.files[0]); }}
                  onClick={() => document.getElementById("resume-input").click()}
                  style={{ border: `2px dashed ${dragOver ? "var(--cyan)" : file ? "var(--blue)" : "var(--border)"}`, background: dragOver ? "rgba(79,255,227,0.04)" : file ? "rgba(0,112,243,0.06)" : "rgba(255,255,255,0.02)" }}>
                  <input id="resume-input" type="file" accept=".pdf" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
                  <div className="home__dropzone-icon">{file ? "📄" : "☁️"}</div>
                  {file ? <><p className="home__dropzone-file-name">{file.name}</p><p className="home__dropzone-hint">Click to change</p></> : <><p className="home__dropzone-placeholder">Drop your resume here</p><p className="home__dropzone-sub">PDF · Max 10MB</p></>}
                </div>

                <div className="home__dates-card">
                  <p className="home__dates-title">📅 Preferred Interview Dates (optional)</p>
                  <p className="home__dates-hint">Select up to 2 dates when you'd be available for an interview if shortlisted</p>
                  <div className="home__dates-row">
                    <label className="home__date-label">
                      <span className="home__date-label-text">Choice 1</span>
                      <input type="date" value={preferredDate1} onChange={e => setPreferredDate1(e.target.value)} className="home__date-input" />
                    </label>
                    <label className="home__date-label">
                      <span className="home__date-label-text">Choice 2</span>
                      <input type="date" value={preferredDate2} onChange={e => setPreferredDate2(e.target.value)} className="home__date-input" />
                    </label>
                  </div>
                </div>

                {error && <p className="home__error">{error}</p>}
                <Btn onClick={handleSubmitProfile} disabled={!name || !dob || !college || !file || (availableJobs.length > 0 && !selectedJobId)} style={{ width: "100%", padding: "14px 0" }}>
                  {name && dob && college && file && (availableJobs.length === 0 || selectedJobId) ? "Submit Application →" : "Fill in all details to continue"}
                </Btn>
                <button onClick={() => { setStep(1); setGoogleUser(null); setError(""); }} className="home__back-btn">← Back to Sign In</button>
              </>
            )
          ) : (
            <>
              <h2 className="home__heading">HR Portal</h2>
              <p className="home__desc">Sign in to access the recruitment dashboard</p>
              <div className="home__hr-fields">
                <Input label="Email" value={hrEmail} onChange={e => setHrEmail(e.target.value)} placeholder="hr@company.com" type="email" />
                <Input label="Password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" type="password" />
              </div>
              {error && <p className="home__error">{error}</p>}
              <Btn onClick={handleHRLogin} style={{ width: "100%", padding: "14px 0" }}>Sign In →</Btn>
              <p className="home__hr-hint">Use your HR credentials to sign in</p>
            </>
          )}
        </div>
        <p className="home__footer">Powered by FastAPI · MongoDB · React</p>
      </div>
    </div>
  );
}

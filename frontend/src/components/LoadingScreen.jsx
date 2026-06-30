import { useState, useEffect } from "react";
import { S } from "../constants";
import "./LoadingScreen.css";

export default function LoadingScreen({ matchScore, onDone }) {
  const [step, setStep] = useState(0);
  const steps = [
    { label: "Parsing resume structure", icon: "📄" },
    { label: "Extracting skills & experience", icon: "🔍" },
    { label: "Running semantic analysis", icon: "🧠" },
    { label: "Scoring against job profile", icon: "📊" },
    { label: "Preparing your interview", icon: "✅" },
  ];

  useEffect(() => {
    if (step < steps.length) {
      const t = setTimeout(() => setStep(s => s + 1), 900);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(onDone, 1200);
      return () => clearTimeout(t);
    }
  }, [step]);

  const done = step >= steps.length;
  const score = matchScore != null ? matchScore : 0;

  return (
    <div className="loading-screen">
      <div className="loading-screen__orb">
        <div className="loading-screen__orb-bg" />
        <div className="loading-screen__orb-ring" />
        <div className="loading-screen__orb-content">
          {done ? (
            <>
              <span className="loading-screen__score">{score}<span className="loading-screen__score-unit">/100</span></span>
              <span className="loading-screen__score-label">MATCH</span>
            </>
          ) : (
            <span className="loading-screen__icon">{steps[Math.max(0, step - 1)]?.icon}</span>
          )}
        </div>
      </div>

      {done && (
        <div className="loading-screen__badge" style={{ background: score >= 80 ? "rgba(79,255,227,0.1)" : "rgba(0,112,243,0.1)", border: `1px solid ${score >= 80 ? "rgba(79,255,227,0.3)" : "rgba(0,112,243,0.3)"}` }}>
          <span className="loading-screen__badge-text" style={{ color: score >= 80 ? S.cyan : "#60a5fa" }}>
            {score >= 80 ? "🎉 Strong Match!" : score >= 60 ? "✅ Good Match" : "🔄 Partial Match"}
          </span>
        </div>
      )}

      <h2 className="loading-screen__heading">
        {done ? "Analysis complete" : "ARIA is analyzing your profile"}
      </h2>

      <div className="loading-screen__steps">
        {steps.map((s, i) => (
          <div key={i} className={`loading-screen__step ${i < step ? "loading-screen__step--done" : "loading-screen__step--pending"}`}>
            <div className={`loading-screen__step-dot ${i < step ? "loading-screen__step-dot--done" : "loading-screen__step-dot--pending"}`}>
              {i < step ? "✓" : ""}
            </div>
            <span className={`loading-screen__step-label ${i < step ? "loading-screen__step-label--done" : "loading-screen__step-label--pending"}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="loading-screen__progress">
        <div className="loading-screen__progress-bar" style={{ width: `${(step / steps.length) * 100}%` }} />
      </div>
    </div>
  );
}

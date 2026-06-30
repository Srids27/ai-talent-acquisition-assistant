import { S } from "../constants";
import GlowBg from "./ui/GlowBg";
import Logo from "./ui/Logo";
import Btn from "./ui/Btn";
import "./PerformanceReport.css";

export default function PerformanceReport({ report, matchScore, onHome }) {
  const r = report || { psychology_rating: 7.4, communication_score: 6.8, confidence_score: 7.8, clarity_score: 7.1, total_responses: 5, avg_response_length: 24, strengths: ["Clear communication", "Technical depth", "Enthusiasm"], improvements: ["Provide more specific examples", "Expand on leadership experience"], summary: "The candidate demonstrated good communication skills with consistent and thoughtful responses. Overall a strong profile for further consideration." };

  const rating = r.psychology_rating;
  const pct = (rating / 10) * 100;

  const bars = [
    { label: "Communication", score: r.communication_score, color: S.blue },
    { label: "Confidence", score: r.confidence_score, color: S.cyan },
    { label: "Clarity", score: r.clarity_score, color: "#F59E0B" },
    { label: "Overall Rating", score: rating, color: "#10B981" },
  ];

  return (
    <div className="perf-report">
      <GlowBg />
      <div className="perf-report__container">
        <div className="perf-report__header">
          <Logo size="md" />
          <h1 className="perf-report__title">Your Interview Report</h1>
          <p className="perf-report__subtitle">Here's how you performed in the AI screening</p>
        </div>

        <div className="perf-report__ring-wrap">
          <div className="perf-report__ring">
            <svg width="160" height="160">
              <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle cx="80" cy="80" r="68" fill="none" stroke="url(#grad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 68}`} strokeDashoffset={`${2 * Math.PI * 68 * (1 - pct / 100)}`} style={{ transition: "stroke-dashoffset 1.5s ease" }} />
              <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={S.blue} /><stop offset="100%" stopColor={S.cyan} /></linearGradient></defs>
            </svg>
            <div className="perf-report__ring-label">
              <span className="perf-report__ring-value">{rating.toFixed(1)}</span>
              <span className="perf-report__ring-sub">out of 10</span>
            </div>
          </div>
        </div>

        <div className="perf-report__badges">
          <div className="perf-report__badge perf-report__badge--match">
            Resume Match: {matchScore != null ? matchScore : 0}/100
          </div>
          <div className="perf-report__badge perf-report__badge--responses">
            Responses: {r.total_responses} questions
          </div>
        </div>

        <div className="perf-report__bars-card">
          <p className="perf-report__section-label">Score Breakdown</p>
          {bars.map(b => (
            <div key={b.label} className="perf-report__bar-item">
              <div className="perf-report__bar-header">
                <span className="perf-report__bar-label">{b.label}</span>
                <span className="perf-report__bar-value" style={{ color: b.color }}>{b.score.toFixed(1)}/10</span>
              </div>
              <div className="perf-report__bar-track">
                <div className="perf-report__bar-fill" style={{ background: b.color, width: `${(b.score / 10) * 100}%`, boxShadow: `0 0 8px ${b.color}66` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="perf-report__grid">
          <div className="perf-report__list-card perf-report__list-card--strengths">
            <p className="perf-report__list-title perf-report__list-title--strengths">✦ Strengths</p>
            {r.strengths.map((s, i) => (
              <div key={i} className="perf-report__list-item">
                <div className="perf-report__bullet perf-report__bullet--cyan" />
                <span className="perf-report__list-text">{s}</span>
              </div>
            ))}
          </div>
          <div className="perf-report__list-card perf-report__list-card--improve">
            <p className="perf-report__list-title perf-report__list-title--improve">△ Areas to Improve</p>
            {r.improvements.map((s, i) => (
              <div key={i} className="perf-report__list-item">
                <div className="perf-report__bullet perf-report__bullet--amber" />
                <span className="perf-report__list-text">{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="perf-report__summary-card">
          <p className="perf-report__summary-label">Summary</p>
          <p className="perf-report__summary-text">{r.summary}</p>
        </div>

        <div className="perf-report__actions">
          <Btn onClick={onHome} style={{ padding: "14px 48px", fontSize: 15 }}>← Back to Home</Btn>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import * as api from "../utils/api";
import { DEFAULT_QUESTIONS, now } from "../constants";
import GlowBg from "./ui/GlowBg";
import "./ApplicantChat.css";

export default function ApplicantChat({ applicantId, email, sessionId, questions: propQuestions, onComplete }) {
  const questions = propQuestions?.length ? propQuestions : DEFAULT_QUESTIONS;
  const [messages, setMessages] = useState([{ role: "ai", text: questions[0], time: now() }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [lastScore, setLastScore] = useState(null);
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const send = () => {
    if (!input.trim() || completed) return;
    const userMsg = { role: "user", text: input, time: now() };
    const updated = [...messages, userMsg];
    const currentQuestion = questions[qIndex];
    const answerText = input;
    setMessages(updated);
    setInput("");
    setTyping(true);
    setLastScore(null);

    if (sessionId) api.saveMessages(sessionId, updated).catch(() => {});

    if (sessionId) {
      api.scoreResponse(sessionId, currentQuestion, answerText)
        .then(res => setLastScore(res.score))
        .catch(() => {});
    }

    setTimeout(async () => {
      setTyping(false);
      const next = qIndex + 1;
      if (next < questions.length) {
        const aiMsg = { role: "ai", text: questions[next], time: now() };
        setMessages(m => [...m, aiMsg]);
        setQIndex(next);
      } else {
        const finalMsg = { role: "ai", text: "Thank you so much for your responses! 🎉 I've completed the assessment. Our HR team will review your full profile and be in touch soon. Best of luck!", time: now() };
        const finalMsgs = [...updated, finalMsg];
        setMessages(finalMsgs);
        setCompleted(true);

        let report = null;
        if (sessionId) {
          try { const res = await api.completeChat(sessionId, finalMsgs); report = res.report; } catch (_) {}
        }
        setTimeout(() => onComplete(report), 2500);
      }
    }, 1800);
  };

  const progress = ((qIndex + (completed ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="applicant-chat">
      <GlowBg />
      <div className="applicant-chat__container">
        {/* Header */}
        <div className="applicant-chat__header">
          <div className="applicant-chat__avatar">A</div>
          <div className="applicant-chat__header-info">
            <p className="applicant-chat__header-name">ARIA · AI Recruitment Assistant</p>
            <div className="applicant-chat__status">
              <div className="applicant-chat__status-dot" style={{ background: completed ? "#F59E0B" : "var(--cyan)" }} />
              <span className="applicant-chat__status-text" style={{ color: completed ? "#F59E0B" : "var(--cyan)" }}>{completed ? "Assessment complete" : "Screening in progress"}</span>
            </div>
          </div>
          <div className="applicant-chat__progress-wrap">
            <p className="applicant-chat__progress-label">Question {Math.min(qIndex + 1, questions.length)} of {questions.length}</p>
            <div className="applicant-chat__progress-track">
              <div className="applicant-chat__progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Score feedback */}
        {lastScore && (
          <div className="applicant-chat__score-feedback">
            <span className="applicant-chat__score-value">✓ Response scored: {lastScore.overall}/10</span>
            <div className="applicant-chat__score-spacer" />
            <span className="applicant-chat__score-details">Relevance {lastScore.relevance} · Depth {lastScore.depth} · Clarity {lastScore.communication}</span>
          </div>
        )}

        {/* Chat */}
        <div className="applicant-chat__window">
          <div className="applicant-chat__messages">
            {messages.map((m, i) => (
              <div key={i} className={`applicant-chat__msg-row ${m.role === "user" ? "applicant-chat__msg-row--user" : "applicant-chat__msg-row--ai"}`}>
                {m.role === "ai" && <div className="applicant-chat__msg-avatar">A</div>}
                <div className="applicant-chat__msg-content">
                  <div className={`applicant-chat__msg-bubble ${m.role === "user" ? "applicant-chat__msg-bubble--user" : "applicant-chat__msg-bubble--ai"}`}>{m.text}</div>
                  <p className={`applicant-chat__msg-time ${m.role === "user" ? "applicant-chat__msg-time--user" : "applicant-chat__msg-time--ai"}`}>{m.time}</p>
                </div>
              </div>
            ))}
            {typing && (
              <div className="applicant-chat__typing">
                <div className="applicant-chat__msg-avatar">A</div>
                <div className="applicant-chat__typing-bubble">
                  {[0, 1, 2].map(i => <div key={i} className="applicant-chat__typing-dot" style={{ animation: `bounce 1.2s ${i * 0.2}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="applicant-chat__input-bar">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} disabled={completed}
              placeholder={completed ? "Assessment completed — generating your report…" : "Type your response and press Enter…"}
              className={`applicant-chat__input ${completed ? "applicant-chat__input--disabled" : ""}`} />
            <button onClick={send} disabled={completed} className={`applicant-chat__send-btn ${completed ? "applicant-chat__send-btn--disabled" : ""}`}>→</button>
          </div>
        </div>
      </div>
    </div>
  );
}

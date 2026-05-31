// ─── CONSTANTS ────────────────────────────────────────────────────────────────
export const DEFAULT_QUESTIONS = [
  "Hi there! I'm ARIA, your AI recruitment assistant. Could you start by telling me about yourself and your career so far?",
  "Can you walk me through a challenging project you've worked on?",
  "How do you handle tight deadlines or high-pressure situations?",
  "What motivates you most in your work?",
  "Where do you see yourself professionally in the next 3 years?",
];

export const KOLKATA_COLLEGES = [
  "Jadavpur University",
  "University of Calcutta",
  "Presidency University",
  "IIT Kharagpur",
  "IEM Kolkata",
  "IIEST Shibpur",
  "St. Xavier's College",
  "Heritage Institute of Technology",
  "Techno Main Salt Lake",
  "MAKAUT (Maulana Abul Kalam Azad University of Technology)",
  "Techno India University",
  "Brainware University",
  "Sister Nivedita University",
  "Narula Institute of Technology",
  "Academy of Technology",
  "JIS University",
  "Adamas University",
  "University of Engineering and Management (UEM)",
];

export const GOOGLE_CLIENT_ID = "675529892898-thelsnkavtprj8uopau67vqckk5svss1.apps.googleusercontent.com";

export function now() { return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

export const S = {
  bg: "#080C14",
  surface: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
  blue: "#0070F3",
  cyan: "#4FFFE3",
  text: "#e2e8f0",
  muted: "#64748b",
  dim: "#2d3748",
};

export const statusColor = { applied: S.muted, engaged: "#F59E0B", in_review: "#F59E0B", shortlisted: S.cyan, interview_scheduled: "#10B981", pending: S.muted, rejected: "#f87171" };
export const statusLabel = { applied: "Applied", engaged: "Engaged", in_review: "In Review", shortlisted: "Shortlisted", interview_scheduled: "Scheduled", pending: "Pending", rejected: "Rejected" };

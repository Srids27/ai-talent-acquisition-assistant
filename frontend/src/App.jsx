import { useState } from "react";
import * as api from "./utils/api";
import HomeScreen from "./components/HomeScreen";
import LoadingScreen from "./components/LoadingScreen";
import ApplicantChat from "./components/ApplicantChat";
import PerformanceReport from "./components/PerformanceReport";
import HRDashboard from "./components/HRDashboard";
import ApplicantDashboard from "./components/ApplicantDashboard";

export default function App() {
  // screen: "home" | "loading" | "chat" | "report" | "hr" | "applicant_dashboard"
  const [screen, setScreen] = useState("home");
  const [applicantData, setApplicantData] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [report, setReport] = useState(null);
  const [googleUser, setGoogleUser] = useState(null);
  const [applicantQuestions, setApplicantQuestions] = useState([]);

  const handleApplicantStart = async (data) => {
    setApplicantData(data);
    setApplicantQuestions(data.questions || []);
    setScreen("loading");
    try {
      const sess = await api.startChatSession(data.applicantId, data.email);
      setSessionId(sess.session_id);
    } catch (_) { setSessionId(null); }
  };

  const handleApplicantReturn = (gUser) => {
    setGoogleUser(gUser);
    setScreen("applicant_dashboard");
  };

  const handleLoadingDone = () => setScreen("chat");

  const handleChatComplete = (reportData) => {
    setReport(reportData);
    setScreen("report");
  };

  const goHome = () => {
    setScreen("home");
    setApplicantData(null);
    setSessionId(null);
    setReport(null);
    setGoogleUser(null);
    setApplicantQuestions([]);
    localStorage.removeItem("aria_token");
  };

  return (
    <>
      {screen === "home" && <HomeScreen onApplicant={handleApplicantStart} onHR={() => setScreen("hr")} onApplicantReturn={handleApplicantReturn} />}
      {screen === "loading" && <LoadingScreen matchScore={applicantData?.matchScore} onDone={handleLoadingDone} />}
      {screen === "chat" && <ApplicantChat applicantId={applicantData?.applicantId} email={applicantData?.email} sessionId={sessionId} questions={applicantQuestions} onComplete={handleChatComplete} />}
      {screen === "report" && <PerformanceReport report={report} matchScore={applicantData?.matchScore} onHome={goHome} />}
      {screen === "hr" && <HRDashboard onHome={goHome} />}
      {screen === "applicant_dashboard" && <ApplicantDashboard googleId={googleUser?.google_id} googleUser={googleUser} onHome={goHome} />}
    </>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import LogoutOverlay from "../components/LogoutOverlay";
import { getSessionReview } from "../../utils/api";

const ReviewPage = () => {
  const navigate = useNavigate();
  const { session_id } = useParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentNum, setCurrentNum] = useState(1);
  const [reviewData, setReviewData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const readingContextRef = useRef(null);
  const readingBoxRef = useRef(null);

  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        const response = await getSessionReview(session_id);
        setReviewData(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        alert("Failed to load details: " + error.message);
        navigate("/history");
      } finally {
        setIsLoading(false);
      }
    };
    if (session_id) fetchReviewData();
  }, [session_id, navigate]);

  if (isLoading) return <div className="p-10 text-center">Loading review data...</div>;
  if (reviewData.length === 0) return <div className="p-10 text-center">Review data not found.</div>;

  const currentQuiz = reviewData[currentNum - 1];
  const currentOptions = typeof currentQuiz.options === "string" ? JSON.parse(currentQuiz.options) : (currentQuiz.options || []);
  const letterToIndex = { A: 0, B: 1, C: 2, D: 3 };
  const userAnswerIndex = letterToIndex[currentQuiz.user_answer?.toUpperCase()];

  const scrollToContext = () => {
    if (readingContextRef.current) {
      readingContextRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    if (readingBoxRef.current) {
      readingBoxRef.current.scrollTop = 0;
    }
  };

  return (
    <div className="hp-wrapper">
      <main className="at-content-container" >
      
        <div ref={readingContextRef} className="rv-question-card rv-reading-context-card">
          <div className="qz-header-row">
            <h2 className="qz-context-title">
              Reading Context
            </h2>
            <div className="rv-context-info">
              <span className="rv-current-theta">
                Theta Score (<i>θ</i>) : {currentQuiz.theta_score}
              </span>
              <span className="rv-current-ability">
                Ability (<i>b</i>) : {currentQuiz.b_parameter}
              </span>
              <span className={`rv-difficulty-badge ${currentQuiz.difficulty_level?.toLowerCase()}`}>
                Level : {currentQuiz.difficulty_level?.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="qz-context-body">
            <p className="qz-review-mode-warning">
              *Mode Review: You are currently viewing the review of completed practice questions.
            </p>

            <div 
              ref={readingBoxRef}
              className="rv-reading-box-spec"
              style={{ maxHeight: "300px", overflowY: "auto" }}
            >
              {currentQuiz.reading_context ? (
                currentQuiz.reading_context.split("\n").map((paragraph, index) => {
                  if (paragraph.trim() === "") return null;
                  return (
                    <p key={index} style={{ margin: 0, marginBottom: "12px", lineHeight: "1.6", textAlign: "justify", fontSize: "16px" }}>
                      {paragraph}
                    </p>
                  );
                })
              ) : (
                <p style={{ margin: 0 }}>No reading text available for this question.</p>
              )}
            </div>
          </div>
        </div>

        <div className="at-bottom-layout-wrapper" style={{ display: "flex", gap: "30px", alignItems: "flex-start", width: "100%" }}>
          
          <div className="rv-question-card" style={{ flex: 1, margin: 0, width: "100%" }}>
            <h3 className="rv-question-text" style={{ fontWeight: "600", marginBottom: "20px", fontSize: "15px" }}>
              {currentNum}. {currentQuiz.question_text}
            </h3>
            
            <div className="rv-options-list">
              {currentOptions.map((option, idx) => {
                const isUserChoice = userAnswerIndex === idx;
                const isCorrectAnswer = option.trim().toLowerCase() === currentQuiz.correct_answer.trim().toLowerCase();
                return (
                  <div key={idx} className={`rv-option-item ${isUserChoice ? "selected" : ""}`}
                    style={{
                      borderColor: isCorrectAnswer ? "#10b981" : isUserChoice && !currentQuiz.is_correct ? "#ef4444" : "#e2e8f0",
                      backgroundColor: isCorrectAnswer ? "#f0fdf4" : isUserChoice && !currentQuiz.is_correct ? "#fef2f2" : "transparent"
                    }}>
                    <input
                      type="radio"
                      name={`review-question-${currentNum}`}
                      checked={isUserChoice}
                      readOnly
                    />
                    <div className={`rv-dot ${isUserChoice ? "active" : ""}`} />
                    <span style={{ fontSize: "15px", fontWeight: isCorrectAnswer ? "600" : "normal" }}>{option}</span>
                  </div>
                );
              })}
            </div>

            <div className="rv-correct-banner" style={{ borderLeft: `4px solid ${currentQuiz.is_correct ? "#10b981" : "#ef4444"}`, backgroundColor: currentQuiz.is_correct ? "#f0fdf4" : "#fef2f2", marginTop: "24px", padding: "16px", borderRadius: "8px" }}>
              <div className="rv-banner-title" style={{ color: currentQuiz.is_correct ? "#15803d" : "#b91c1c", display: "flex", alignItems: "center", gap: "8px", fontWeight: "700" }}>
                {currentQuiz.is_correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                <span>{currentQuiz.is_correct ? "Your Answer is Correct!" : "Your Answer is Incorrect"}</span>
              </div>
              <p className="mt-2 text-sm" style={{ margin: "8px 0 0 0", fontSize: "14px" }}>Correct Answer: <strong>{currentQuiz.correct_answer}</strong></p>
            </div>
          </div>

          <div className="rv-sidebar-right" style={{ width: "320px", flexShrink: 0, position: "static", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="rv-grid-container" style={{ margin: 0, width: "100%" }}>
              {reviewData.map((item, i) => (
                <button 
                  key={i} 
                  className={`rv-grid-item ${i + 1 === currentNum ? "current" : "completed"}`}
                  onClick={() => {
                    setCurrentNum(i + 1);
                    scrollToContext(); 
                  }} 
                  style={{ borderBottom: `3px solid ${item.is_correct ? "#10b981" : "#ef4444"}` }}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <div className="rv-nav-controls" style={{ display: "flex", gap: "12px", width: "100%" }}>
              <button 
                className="rv-nav-prev-button" 
                disabled={currentNum === 1} 
                onClick={() => {
                  setCurrentNum(p => p - 1);
                  scrollToContext(); 
                }}
                style={{ flex: 1 }}
              >
                <ChevronLeft size={20} /> Previous
              </button>
              <button 
                className="rv-nav-next-button" 
                disabled={currentNum === reviewData.length} 
                onClick={() => {
                  setCurrentNum(p => p + 1);
                  scrollToContext(); 
                }}
                style={{ flex: 1 }}
              >
                Next <ChevronRight size={20} />
              </button>
            </div>

            <button className="rv-back-home-btn" onClick={() => navigate("/history")} style={{ width: "100%" }}>
              Back to Practice History
            </button>
          </div>
        </div> 
      </main>
      <LogoutOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};

export default ReviewPage;
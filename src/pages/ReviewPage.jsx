import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, BookOpen } from "lucide-react";
import LogoutOverlay from "../components/LogoutOverlay";
import { getSessionReview } from "../../utils/api";

const ReviewPage = () => {
  const navigate = useNavigate();
  const { session_id } = useParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentNum, setCurrentNum] = useState(1);
  const [reviewData, setReviewData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="hp-wrapper">
      <main className="hp-container rv-main-layout">
        <div className="rv-content-left">
          <div className="rv-question-card rv-reading-context-card">
            <div className="qz-header-row">
              <h2 className="qz-context-title" style={{ margin: 0 }}>
                Reading Context
              </h2>
              <span className="qz-difficulty-badge">
                Level: {currentQuiz.difficulty_level?.toUpperCase()}
              </span>
            </div>

            <div className="qz-context-body">
              <p className="qz-review-mode-warning">
                *Mode Review: You are currently viewing the review of completed practice questions.
              </p>

              <div className="rv-reading-box-spec">
                {currentQuiz.reading_context ? (
                  currentQuiz.reading_context.split("\n").map((paragraph, index) => {
                    if (paragraph.trim() === "") return null;
                    return (
                      <p key={index}>
                        {paragraph}
                      </p>
                    );
                  })
                ) : (
                  <p>No reading text available for this question.</p>
                )}
              </div>
            </div>
          </div>

          <div className="rv-question-card">
            <h3 className="rv-question-text">{currentQuiz.question_text}</h3>
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
                    {/* Tambahkan elemen input di bawah ini untuk mengikat manipulasi sembunyi di CSS */}
                    <input
                      type="radio"
                      name={`review-question-${currentNum}`}
                      checked={isUserChoice}
                      readOnly
                    />
                    <div className={`rv-dot ${isUserChoice ? "active" : ""}`} />
                    <span style={{ fontWeight: isCorrectAnswer ? "600" : "normal" }}>{option}</span>
                  </div>
                );
              })}
            </div>

            <div className="rv-correct-banner" style={{ borderLeft: `4px solid ${currentQuiz.is_correct ? "#10b981" : "#ef4444"}`, backgroundColor: currentQuiz.is_correct ? "#f0fdf4" : "#fef2f2" }}>
              <div className="rv-banner-title" style={{ color: currentQuiz.is_correct ? "#15803d" : "#b91c1c" }}>
                {currentQuiz.is_correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                <span>{currentQuiz.is_correct ? "Your Answer is Correct!" : "Your Answer is Incorrect"}</span>
              </div>
              <p className="mt-2 text-sm">Correct Answer: <strong>{currentQuiz.correct_answer}</strong></p>
            </div>
          </div>
        </div>

        <div className="rv-sidebar-right">
          <div className="rv-grid-container">
            {reviewData.map((item, i) => (
              <button key={i} className={`rv-grid-item ${i + 1 === currentNum ? "current" : "completed"}`}
                onClick={() => setCurrentNum(i + 1)} style={{ borderBottom: `3px solid ${item.is_correct ? "#10b981" : "#ef4444"}` }}>
                {i + 1}
              </button>
            ))}
          </div>
          <div className="rv-nav-controls">
            <button className="rv-nav-prev-button" disabled={currentNum === 1} onClick={() => setCurrentNum(p => p - 1)}>
              <ChevronLeft size={20} /> Previous
            </button>
            <button className="rv-nav-next-button" disabled={currentNum === reviewData.length} onClick={() => setCurrentNum(p => p + 1)}>
              Next <ChevronRight size={20} />
            </button>
          </div>
          <button className="rv-back-home-btn" onClick={() => navigate("/history")}>Back to Practice History</button>
        </div>
      </main>
      <LogoutOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};

export default ReviewPage;
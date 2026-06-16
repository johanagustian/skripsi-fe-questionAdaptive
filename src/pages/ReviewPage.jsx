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
        alert("Gagal memuat detail pembahasan: " + error.message);
        navigate("/history");
      } finally {
        setIsLoading(false);
      }
    };
    if (session_id) fetchReviewData();
  }, [session_id, navigate]);

  if (isLoading) return <div className="p-10 text-center">Memuat data pembahasan...</div>;
  if (reviewData.length === 0) return <div className="p-10 text-center">Data pembahasan tidak ditemukan.</div>;

  const currentQuiz = reviewData[currentNum - 1];
  const currentOptions = typeof currentQuiz.options === "string" ? JSON.parse(currentQuiz.options) : (currentQuiz.options || []);
  const letterToIndex = { A: 0, B: 1, C: 2, D: 3 };
  const userAnswerIndex = letterToIndex[currentQuiz.user_answer?.toUpperCase()];

  return (
    <div className="hp-wrapper">
      <main className="hp-container rv-main-layout">
        <div className="rv-content-left">
          <div className="rv-question-card rv-reading-context-card">
            <div className="rv-reading-header">
              <BookOpen size={18} className="text-blue-600" />
              <h3 className="m-0 text-base">Konteks Bacaan</h3>
              <span className="rv-difficulty-tag">Tingkat: {currentQuiz.difficulty_level?.toUpperCase()}</span>
            </div>
            <p className="rv-reading-text">
              {currentQuiz.reading_context || "Tidak ada teks bacaan untuk soal ini."}
            </p>
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
                    <div className={`rv-dot ${isUserChoice ? "active" : ""}`} />
                    <span style={{ fontWeight: isCorrectAnswer ? "600" : "normal" }}>{option}</span>
                  </div>
                );
              })}
            </div>

            <div className="rv-correct-banner" style={{ borderLeft: `4px solid ${currentQuiz.is_correct ? "#10b981" : "#ef4444"}`, backgroundColor: currentQuiz.is_correct ? "#f0fdf4" : "#fef2f2" }}>
              <div className="rv-banner-title" style={{ color: currentQuiz.is_correct ? "#15803d" : "#b91c1c" }}>
                {currentQuiz.is_correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                <span>{currentQuiz.is_correct ? "Jawaban Anda Benar!" : "Jawaban Anda Kurang Tepat"}</span>
              </div>
              <p className="mt-2 text-sm">Kunci Jawaban: <strong>{currentQuiz.correct_answer}</strong></p>
            </div>
          </div>
        </div>

        <div className="rv-sidebar-right">
          <div className="rv-grid-container">
            {reviewData.map((item, i) => (
              <button key={i} className={`rv-grid-item ${i + 1 === currentNum ? "current" : "completed"}`}
                onClick={() => setCurrentNum(i + 1)} style={{ borderBottom: `2px solid ${item.is_correct ? "#10b981" : "#ef4444"}` }}>
                {i + 1}
              </button>
            ))}
          </div>
          <div className="rv-nav-controls">
            <button className="rv-nav-button" disabled={currentNum === 1} onClick={() => setCurrentNum(p => p - 1)}>
              <ChevronLeft size={20} /> Sebelumnya
            </button>
            <button className="rv-nav-button" disabled={currentNum === reviewData.length} onClick={() => setCurrentNum(p => p + 1)}>
              Selanjutnya <ChevronRight size={20} />
            </button>
          </div>
          <button className="rv-back-home-btn" onClick={() => navigate("/history")}>Kembali ke Riwayat Latihan</button>
        </div>
      </main>
      <LogoutOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};

export default ReviewPage;
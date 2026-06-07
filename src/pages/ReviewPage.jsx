import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  BookOpen,
} from "lucide-react";
import LogoutOverlay from "../components/LogoutOverlay";
import logoApta from "../assets/icon1.jpg";
import { getSessionReview } from "../../utils/api";

const ReviewPage = () => {
  const navigate = useNavigate();
  const { session_id } = useParams(); // Mengambil ID sesi dari URL

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentNum, setCurrentNum] = useState(1);

  const [reviewData, setReviewData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        const response = await getSessionReview(session_id);
        // Memastikan data yang diterima adalah array
        const dataArray = Array.isArray(response?.data) ? response.data : [];
        setReviewData(dataArray);
      } catch (error) {
        alert("Gagal memuat detail pembahasan: " + error.message);
        navigate("/history");
      } finally {
        setIsLoading(false);
      }
    };

    if (session_id) fetchReviewData();
  }, [session_id, navigate]);

  if (isLoading)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Memuat data pembahasan...
      </div>
    );
  if (reviewData.length === 0)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Data pembahasan tidak ditemukan.
      </div>
    );

  const currentQuiz = reviewData[currentNum - 1];

  // Parsing opsi dari string JSON (jika dari database berupa string)
  const currentOptions =
    typeof currentQuiz.options === "string"
      ? JSON.parse(currentQuiz.options)
      : currentQuiz.options || [];

  // Mengkonversi huruf jawaban user (A, B, C, D) ke Index (0, 1, 2, 3) untuk visualisasi UI
  const letterToIndex = { A: 0, B: 1, C: 2, D: 3 };
  const userAnswerIndex = letterToIndex[currentQuiz.user_answer?.toUpperCase()];

  const handleNext = () => {
    if (currentNum < reviewData.length) setCurrentNum(currentNum + 1);
  };

  const handlePrev = () => {
    if (currentNum > 1) setCurrentNum(currentNum - 1);
  };

  return (
    <div className="hp-wrapper">
      <nav className="hp-navbar">
        <div className="hp-nav-content">
          <img src={logoApta} alt="Logo" style={{ height: "40px" }} />
          <button
            className="hp-menu-btn-new"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>

      <main className="hp-container rv-main-layout">
        {/* KIRI: DETAIL SOAL & PEMBAHASAN */}
        <div className="rv-content-left">
          
          {/* BAGIAN BARU: KONTEKS BACAAN */}
          <div className="rv-question-card" style={{ marginBottom: '20px', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <BookOpen size={18} className="text-blue-600" />
                <h3 style={{ margin: 0, fontSize: '16px' }}>Konteks Bacaan</h3>
                <span
              style={{
                marginLeft: "auto",
                fontSize: "12px",
                background: "#e2e8f0",
                padding: "4px 8px",
                borderRadius: "4px",
                fontWeight: "bold",
              }}
            >
              Tingkat: {currentQuiz.difficulty_level?.toUpperCase()}
            </span>
            </div>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#475569', textAlign: 'justify' }}>
                {currentQuiz.reading_context || "Tidak ada teks bacaan untuk soal ini."}
            </p>
          </div>

          <div className="rv-question-card">
            <h3 className="rv-question-text">{currentQuiz.question_text}</h3>

            <div className="rv-options-list">
              {currentOptions.map((option, idx) => {
                const isUserChoice = userAnswerIndex === idx;
                const isCorrectAnswer =
                  option.trim().toLowerCase() ===
                  currentQuiz.correct_answer.trim().toLowerCase();

                return (
                  <div
                    key={idx}
                    className={`rv-option-item ${isUserChoice ? "selected" : ""}`}
                    style={{
                      borderColor: isCorrectAnswer
                        ? "#10b981"
                        : isUserChoice && !currentQuiz.is_correct
                        ? "#ef4444"
                        : "#e2e8f0",
                      backgroundColor: isCorrectAnswer
                        ? "#f0fdf4"
                        : isUserChoice && !currentQuiz.is_correct
                        ? "#fef2f2"
                        : "transparent",
                      cursor: "default",
                    }}
                  >
                    <div
                      className={`rv-dot ${isUserChoice ? "active" : ""}`}
                      style={{
                        backgroundColor: isUserChoice
                          ? "#1e293b"
                          : "transparent",
                      }}
                    ></div>
                    <span
                      style={{
                        fontWeight: isCorrectAnswer ? "600" : "normal",
                        color: "#1e293b",
                      }}
                    >
                      {option}
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              className="rv-correct-banner"
              style={{
                backgroundColor: currentQuiz.is_correct ? "#f0fdf4" : "#fef2f2",
                borderLeft: currentQuiz.is_correct
                  ? "4px solid #10b981"
                  : "4px solid #ef4444",
              }}
            >
              <div
                className="rv-banner-title"
                style={{
                  color: currentQuiz.is_correct ? "#15803d" : "#b91c1c",
                }}
              >
                {currentQuiz.is_correct ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <XCircle size={18} />
                )}
                <span>
                  {currentQuiz.is_correct
                    ? "Jawaban Anda Benar!"
                    : "Jawaban Anda Kurang Tepat"}
                </span>
              </div>
              <p className="rv-banner-text" style={{ marginTop: "8px" }}>
                Kunci Jawaban: <strong>{currentQuiz.correct_answer}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* KANAN: SIDEBAR NAVIGASI */}
        <div className="rv-sidebar-right">
          <div className="rv-grid-container">
            {reviewData.map((item, i) => (
              <button
                key={i}
                className={`rv-grid-item ${
                  i + 1 === currentNum ? "current" : "completed"
                }`}
                onClick={() => setCurrentNum(i + 1)}
                style={{
                  borderBottom: item.is_correct
                    ? "2px solid #10b981"
                    : "2px solid #ef4444",
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="rv-nav-controls">
            <button
              className="rv-round-btn"
              disabled={currentNum === 1}
              onClick={handlePrev}
              style={{
                opacity: currentNum === 1 ? 0.5 : 1,
                cursor: currentNum === 1 ? "not-allowed" : "pointer",
              }}
            >
              <ChevronLeft size={24} />
              <span style={{ fontWeight: "600", fontSize: "14px" }}>
                Sebelumnya
              </span>
            </button>

            <button
              className="rv-round-btn active"
              disabled={currentNum === reviewData.length}
              onClick={handleNext}
              style={{
                opacity: currentNum === reviewData.length ? 0.5 : 1,
                cursor:
                  currentNum === reviewData.length ? "not-allowed" : "pointer",
              }}
            >
              <span style={{ fontWeight: "600", fontSize: "14px" }}>
                Selanjutnya
              </span>
              <ChevronRight size={24} />
            </button>
          </div>

          <button
            className="rv-back-home-btn"
            onClick={() => navigate("/history")}
          >
            Kembali ke Riwayat Latihan
          </button>
        </div>
      </main>

      <LogoutOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};

export default ReviewPage;
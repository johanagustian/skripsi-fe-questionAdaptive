import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { submitAbilityTest } from "../../utils/api";

const AbilityTestPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Menangkap data dari navigasi LoginPage
  const testData = location.state?.testData;
  console.log("Data tes yang diterima:", testData);
  const questions = testData?.questions || [];
  const sessionId = testData?.session_id;
  // const readingContext = testData?.questions.reading_context || "Teks bacaan tidak tersedia.";

  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk Modal Hasil
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState(null);

  // Cek jika halaman diakses langsung tanpa lewat login
  useEffect(() => {
    if (!testData || questions.length === 0) {
      navigate("/login");
    }
  }, [testData, questions.length, navigate]);

  if (!testData || questions.length === 0) return <div>Memuat soal...</div>;

  const currentReadingContext = questions[currentQuestion - 1]?.reading_context;
  const currentQuiz = questions[currentQuestion - 1];
  const readingContext = currentQuiz?.reading_context || "Teks bacaan tidak tersedia.";
  const totalAnswered = Object.keys(answers).length;
  const isAllQuestionsAnswered = totalAnswered === questions.length;

  const handleSelectOption = (index) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: index }));
  };

  const isNextDisabled =
    currentQuestion === questions.length && !isAllQuestionsAnswered;

  // Fungsi Submit Jawaban ke Backend
  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Konversi UI (0, 1, 2, 3) ke format Backend (A, B, C, D)
    const indexToLetter = { 0: "A", 1: "B", 2: "C", 3: "D" };

    const formattedAnswers = questions.map((q, idx) => ({
      question_id: q.item_id,
      user_answer: indexToLetter[answers[idx + 1]], // idx + 1 karena currentQuestion dimulai dari 1
    }));

    try {
      const response = await submitAbilityTest({
        session_id: sessionId,
        answers: formattedAnswers,
      });

      if (response.status === "success") {
        setResultData(response.data);
        setShowResultModal(true); // Munculkan pop-up hasil
      }
    } catch (error) {
      alert("Gagal mengirim jawaban: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Parsing options dengan aman (jaga-jaga jika backend mengirim string JSON)
  const currentOptions =
    typeof currentQuiz.options === "string"
      ? JSON.parse(currentQuiz.options)
      : currentQuiz.options;

  return (
    <div className="qz-page-wrapper at-wrapper">
      <div className="qz-content-container">
        {/* Konten Kiri (Teks Bacaan & Soal) */}
        <div className="qz-main-content">
          <article className="qz-context-card">
            <div className="at-card-badge">
              Level : {currentQuiz.difficulty.toUpperCase()}
            </div>
            <h2 className="qz-context-title">English Reading Comprehension</h2>

            <div
              className="qz-context-body"
              style={{
                maxHeight: "250px",
                overflowY: "auto",
                paddingRight: "10px",
              }}
            >
              <p className="at-note-text" style={{ marginBottom: "16px" }}>
                * <b>Instruksi:</b> Bacalah teks di bawah ini. Anda bebas
                melompati nomor soal, namun{" "}
                <b>seluruh {questions.length} soal wajib dijawab</b> untuk
                menyelesaikan tes.
              </p>
              <div className="context-reading-text">
                {readingContext.split("\n").map((paragraph, index) => {
                  if (paragraph.trim() === "") return null;
                  return (
                    <p
                      key={index}
                      style={{
                        marginBottom: "12px",
                        lineHeight: "1.6",
                        textAlign: "justify",
                      }}
                    >
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </div>
          </article>

          <section className="qz-question-section">
            <p
              className="qz-question-text"
              style={{ fontWeight: "600", marginBottom: "20px" }}
            >
              {currentQuiz.question_text}
            </p>
            <div className="qz-options-list">
              {currentOptions.map((option, index) => {
                const isSelected = answers[currentQuestion] === index;
                return (
                  <div
                    key={index}
                    onClick={() => handleSelectOption(index)}
                    className={`qz-option-item at-option-clickable ${isSelected ? "active" : ""}`}
                  >
                    <div
                      className={`qz-radio-circle ${isSelected ? "active" : ""}`}
                    />
                    <span className="qz-option-label">{option}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Sidebar Kanan (Navigasi Nomor) */}
        <aside className="qz-sidebar-layout-vertical">
          <div className="qz-sidebar-layout-vertical">
            <div className="qz-numbers-card">
              <div className="qz-number-grid">
                {questions.map((q, idx) => {
                  const qNumber = idx + 1;
                  const isAnswered = answers[qNumber] !== undefined;
                  const isCurrent = qNumber === currentQuestion;
                  return (
                    <div
                      key={q.item_id}
                      className={`qz-number-item at-option-clickable ${isAnswered ? "filled" : ""} ${isCurrent ? "current" : ""}`}
                      onClick={() => setCurrentQuestion(qNumber)}
                    >
                      {qNumber}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="at-sidebar-nav-container">
              <div className="at-btn-flex-row">
                <button
                  className="qz-nav-btn prev at-btn-prev-state"
                  disabled={currentQuestion === 1}
                  onClick={() =>
                    setCurrentQuestion((prev) => Math.max(1, prev - 1))
                  }
                  style={{ opacity: currentQuestion === 1 ? 0.5 : 1 }}
                >
                  <ChevronLeft size={18} />
                  <span>Sebelumnya</span>
                </button>

                <button
                  className={`qz-nav-btn next at-btn-next-state ${isNextDisabled ? "disabled" : "active"}`}
                  disabled={isNextDisabled || isSubmitting}
                  onClick={() => {
                    if (currentQuestion === questions.length) {
                      handleSubmit();
                    } else {
                      setCurrentQuestion((prev) =>
                        Math.min(questions.length, prev + 1),
                      );
                    }
                  }}
                >
                  <span>
                    {isSubmitting
                      ? "Memproses..."
                      : currentQuestion === questions.length
                        ? "Selesai"
                        : "Selanjutnya"}
                  </span>
                  {!isSubmitting && currentQuestion !== questions.length && (
                    <ChevronRight size={18} />
                  )}
                </button>
              </div>

              {isNextDisabled && (
                <p
                  className="at-error-progress"
                  style={{
                    marginTop: "12px",
                    fontSize: "13px",
                    color: "#e74c3c",
                  }}
                >
                  * Belum bisa selesai. Baru menjawab {totalAnswered} dari{" "}
                  {questions.length} soal.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL HASIL TEST */}
      {showResultModal && (
        <div style={styles.overlay}>
          <div style={styles.modalCard}>
            <h2 style={styles.modalTitle}>Kemampuan Awal Terukur!</h2>
            <div
              style={{
                margin: "20px 0",
                padding: "16px",
                background: "#f8f9fa",
                borderRadius: "8px",
              }}
            >
              <p style={{ ...styles.modalText, marginBottom: "8px" }}>
                Jawaban Benar:{" "}
                <strong style={{ color: "#27ae60", fontSize: "18px" }}>
                  {resultData?.jumlah_benar}
                </strong>{" "}
                / {resultData?.total_soal}
              </p>
              <p style={{ ...styles.modalText }}>
                Skor Kemampuan (Theta):{" "}
                <strong style={{ color: "#2980b9", fontSize: "18px" }}>
                  {resultData?.theta_awal}
                </strong>
              </p>
            </div>
            <p
              style={{
                fontSize: "14px",
                color: "#7f8c8d",
                marginBottom: "20px",
              }}
            >
              Skor ini akan digunakan oleh sistem adaptif untuk menyesuaikan
              tingkat kesulitan latihan Anda selanjutnya.
            </p>
            <button
              onClick={() => navigate("/home")}
              className="btn-login-black"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                fontWeight: "bold",
              }}
            >
              Masuk ke Dashboard Utama
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// CSS untuk Modal Hasil
const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: "20px",
  },
  modalCard: {
    background: "#fff",
    padding: "32px",
    borderRadius: "16px",
    maxWidth: "420px",
    width: "100%",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
  },
  modalTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "800",
    color: "#2c3e50",
  },
  modalText: { fontSize: "16px", margin: 0, color: "#34495e" },
};

export default AbilityTestPage;

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { submitAbilityTest } from "../../utils/api";

const AbilityTestPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const testData = location.state?.testData;
  const questions = testData?.questions || [];
  const sessionId = testData?.session_id;

  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    if (!testData || questions.length === 0) {
      navigate("/login");
    }
  }, [testData, questions.length, navigate]);

  if (!testData || questions.length === 0)
    return <div className="p-10 text-center">Loading questions...</div>;

  const currentQuiz = questions[currentQuestion - 1];
  const readingContext =
    currentQuiz?.reading_context || "No reading text available.";
  const totalAnswered = Object.keys(answers).length;
  const isAllQuestionsAnswered = totalAnswered === questions.length;

  const handleSelectOption = (index) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: index }));
  };

  const isNextDisabled =
    currentQuestion === questions.length && !isAllQuestionsAnswered;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const indexToLetter = { 0: "A", 1: "B", 2: "C", 3: "D" };

    const formattedAnswers = questions.map((q, idx) => ({
      question_id: q.item_id,
      user_answer: indexToLetter[answers[idx + 1]],
    }));

    try {
      const response = await submitAbilityTest({
        session_id: sessionId,
        answers: formattedAnswers,
      });

      if (response.status === "success") {
        setResultData(response.data);
        setShowResultModal(true);
      }
    } catch (error) {
      alert("Gagal mengirim jawaban: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
              {/* 1. KOTAK BADGE LEVEL DAN JUDUL YANG SUDAH DISAMAKAN DENNGAN QUIZ */}
              <div className="qz-header-row">
                <h2 className="qz-context-title" style={{ margin: 0 }}>
                  English Reading Comprehension
                </h2>
                <span className="qz-difficulty-badge">
                  Level : {currentQuiz.difficulty.toUpperCase()}
                </span>
              </div>

              <div className="qz-context-body">
                <p
                  className="at-note-text"
                  style={{
                    marginBottom: "16px",
                    fontStyle: "italic",
                    fontSize: "13px",
                    color: "#64748b",
                  }}
                >
                  * <b>Instructions:</b> Please read the text below. You are
                  free to skip questions, but{" "}
                  <b>all {questions.length} questions must be answered</b> to
                  complete the test.
                </p>

                {/* 2. MENGGUNAKAN qz-reading-box AGAR LATAR BELAKANG ABU-ABU DAN BORDER BIRU MUNCUL KONSISTEN */}
                <div className="qz-reading-box at-context-body-scroll">
                  <div className="context-reading-text">
                    {readingContext.split("\n").map((paragraph, index) => {
                      if (paragraph.trim() === "") return null;
                      return (
                        <p
                          key={index}
                          style={{
                            margin: 0,
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
              </div>
            </article>

            <section className="qz-question-section">
              <p className="qz-question-text at-question-text-bold">
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
                      <input
                        type="radio"
                        name={`test-question-${currentQuestion}`}
                        checked={isSelected}
                        readOnly
                      />
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
          <div className="qz-sidebar-sticky-wrapper">
            <div className="qz-numbers-card">
              <div className="qz-number-grid">
                {questions.map((q, idx) => {
                  const qNumber = idx + 1;
                  const isAnswered = answers[qNumber] !== undefined;
                  const isCurrent = qNumber === currentQuestion;

                  let testNumStatus = "num-default";
                  if (isAnswered) testNumStatus = "num-answered";
                  else if (isCurrent) testNumStatus = "num-current";

                  return (
                    <div
                      key={q.item_id}
                      className={`qz-number-item qz-num-item-flex at-option-clickable ${testNumStatus}`}
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
                  className={`qz-nav-btn prev ${currentQuestion === 1 ? "btn-prev-disabled" : "btn-prev-active"}`}
                  disabled={currentQuestion === 1}
                  onClick={() =>
                    setCurrentQuestion((prev) => Math.max(1, prev - 1))
                  }
                >
                  <ChevronLeft size={18} />
                  <span className="qz-nav-btn-text">Previously</span>
                </button>

                <button
                  className={`qz-nav-btn next ${isNextDisabled ? "btn-next-disabled" : "btn-next-active"}`}
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
                  <span className="qz-nav-btn-text">
                    {isSubmitting
                      ? "Processing..."
                      : currentQuestion === questions.length
                        ? "Finish"
                        : "Next"}
                  </span>
                  {!isSubmitting && currentQuestion !== questions.length && (
                    <ChevronRight size={18} />
                  )}
                </button>
              </div>

              {isNextDisabled && (
                <p className="at-error-progress-text">
                  * Not yet complete. Only {totalAnswered} out of{" "}
                  {questions.length} questions answered.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL HASIL TEST */}
      {showResultModal && (
        <div className="at-modal-overlay">
          <div className="at-modal-card">
            <h2 className="at-modal-title">
              Initial Ability Assessment Complete!
            </h2>
            <div className="at-modal-summary-box">
              <p className="at-modal-text-row-margin">
                Correct Answers:{" "}
                <strong style={{ color: "#27ae60", fontSize: "18px" }}>
                  {resultData?.jumlah_benar}
                </strong>{" "}
                / {resultData?.total_soal}
              </p>
              <p className="at-modal-text-row">
                Initial Ability Score (Theta):{" "}
                <strong style={{ color: "#2980b9", fontSize: "18px" }}>
                  {resultData?.theta_awal}
                </strong>
              </p>
            </div>
            <p className="at-modal-desc-muted">
              This score will be used by the adaptive system to adjust the
              difficulty level of your next practice sessions.
            </p>
            <button
              onClick={() => navigate("/home")}
              className="btn-login-black at-modal-submit-btn"
            >
              Go to Home Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbilityTestPage;

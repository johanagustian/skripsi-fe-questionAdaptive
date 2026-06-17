import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, ChevronRight, ChevronLeft, CheckSquare } from "lucide-react";
import LogoApta from "../assets/icon1.jpg";
import LogoutOverlay from "../components/LogoutOverlay";
import { submitSessionAnswer, fetchNextQuestion } from "../../utils/api";

const QuizEngine = ({ type = "quiz" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const initData = location.state?.quizData;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sessionId] = useState(initData?.session_id);
  const [documentId] = useState(initData?.document_id);
  const [questionsList, setQuestionsList] = useState(initData ? [initData] : []);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answersHistory, setAnswersHistory] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [selectedFlags, setSelectedFlags] = useState({});
  const isBackNavigationHandled = useRef(false);

  const questionNumbers = Array.from(
    { length: questionsList.length },
    (_, i) => i + 1,
  );

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue =
        "Sesi latihan tidak akan tersimpan jika Anda keluar sekarang. Yakin ingin mengakhiri?";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const handlePopState = (event) => {
      if (isBackNavigationHandled.current) return;
      
      const hasUnsubmittedAnswers = Object.keys(selectedFlags).length > 0;
      const hasSelectedCurrent = selectedOption !== null && !isPastQuestion();
      const hasAnyAnswer = hasUnsubmittedAnswers || hasSelectedCurrent || Object.keys(answersHistory).length > 0;
      
      let message = "";
      if (hasAnyAnswer) {
        message = "Anda memiliki jawaban yang sudah dipilih.\n\nApakah Anda yakin ingin keluar dari sesi latihan?\n\n⚠️ PERINGATAN:\n• Jawaban yang sudah tersimpan akan tetap tersimpan\n• Jawaban yang belum dikirim akan HILANG\n• Skor akhir tidak akan dihitung jika keluar sekarang\n\nKlik 'OK' untuk keluar, atau 'Batal' untuk melanjutkan latihan.";
      } else {
        message = "Anda BELUM menjawab soal apapun.\n\nApakah Anda yakin ingin keluar dari sesi latihan?\n\nSesi ini akan berakhir dan Anda harus memulai dari awal.\n\nKlik 'OK' untuk keluar, atau 'Batal' untuk melanjutkan latihan.";
      }
      
      const isConfirmed = window.confirm(message);
      
      if (!isConfirmed) {
        isBackNavigationHandled.current = true;
        window.history.pushState(null, "", window.location.href);
        setTimeout(() => {
          isBackNavigationHandled.current = false;
        }, 500);
        return;
      }
      
      isBackNavigationHandled.current = true;
      setTimeout(() => {
        isBackNavigationHandled.current = false;
      }, 500);
    };
    
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [selectedFlags, selectedOption, answersHistory]);

  const isPastQuestion = () => currentQuestion < questionsList.length;

  if (questionsList.length === 0)
    return (
      <div className="p-10 text-center">Memuat soal...</div>
    );

  const currentQuestionData = questionsList[currentQuestion - 1];
  
  const activeOptionToShow = isPastQuestion()
    ? answersHistory[currentQuestion]
    : (selectedOption !== null ? selectedOption : null);

  const currentOptions =
    typeof currentQuestionData.options === "string"
      ? JSON.parse(currentQuestionData.options)
      : currentQuestionData.options || [];

  const isQuestionAnswered = (questionNum) => {
    if (answersHistory[questionNum] !== undefined) return true;
    if (selectedFlags[questionNum] !== undefined) return true;
    return false;
  };

  const handleSelectOption = (index) => {
    if (isPastQuestion()) return;
    if (isEnding) return;
    
    setSelectedOption(index);
    setSelectedFlags((prev) => ({
      ...prev,
      [currentQuestion]: index,
    }));
  };

  const handlePrev = () => {
    if (isEnding) return;
    setCurrentQuestion((prev) => Math.max(1, prev - 1));
  };

  const handleNext = async () => {
    if (isPastQuestion()) {
      setCurrentQuestion((prev) => prev + 1);
      return;
    }

    if (selectedOption === null) return;

    setIsLoading(true);
    const indexToLetter = { 0: "A", 1: "B", 2: "C", 3: "D" };

    try {
      await submitSessionAnswer({
        session_id: sessionId,
        question_id: currentQuestionData.question_id,
        user_answer: indexToLetter[selectedOption],
      });

      setAnswersHistory((prev) => ({
        ...prev,
        [currentQuestion]: selectedOption,
      }));
      
      setSelectedFlags((prev) => {
        const newFlags = { ...prev };
        delete newFlags[currentQuestion];
        return newFlags;
      });

      const nextQResponse = await fetchNextQuestion({
        session_id: sessionId,
        document_id: documentId,
      });

      setQuestionsList((prev) => [...prev, nextQResponse.data]);
      setCurrentQuestion((prev) => prev + 1);
      setSelectedOption(null);
    } catch (error) {
      alert("Gagal memproses soal: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (isEnding) return;
    
    const hasUnsubmittedAnswers = Object.keys(selectedFlags).length > 0;
    const hasSubmittedAnswers = Object.keys(answersHistory).length > 0;
    
    let message = "";
    if (hasUnsubmittedAnswers) {
      message = "Anda memiliki jawaban yang belum tersimpan.\n\nApakah Anda yakin ingin mengakhiri sesi latihan ini?\n\nSkor dan evaluasi kemampuan (Theta) Anda akan segera dikalkulasi.";
    } else if (hasSubmittedAnswers) {
      message = "Apakah Anda yakin ingin mengakhiri sesi latihan ini?\n\nSkor dan evaluasi kemampuan (Theta) Anda akan segera dikalkulasi.";
    } else {
      message = "Sesi masih kosong. Keluar sekarang akan membatalkan sesi ini secara permanen. Yakin?";
    }
    
    const isConfirmed = window.confirm(message);
    if (!isConfirmed) return;
    
    setIsEnding(true);
    
    try {
      const indexToLetter = { 0: "A", 1: "B", 2: "C", 3: "D" };
      const unsubmittedQuestions = Object.keys(selectedFlags);
      
      for (const qNum of unsubmittedQuestions) {
        const questionIndex = parseInt(qNum);
        const questionData = questionsList[questionIndex - 1];
        const selectedOpt = selectedFlags[questionIndex];
        
        if (questionData && selectedOpt !== undefined) {
          await submitSessionAnswer({
            session_id: sessionId,
            question_id: questionData.question_id,
            user_answer: indexToLetter[selectedOpt],
          });
          
          setAnswersHistory((prev) => ({
            ...prev,
            [questionIndex]: selectedOpt,
          }));
        }
      }
      
      if (!isPastQuestion() && selectedOption !== null && selectedFlags[currentQuestion] === undefined) {
        await submitSessionAnswer({
          session_id: sessionId,
          question_id: currentQuestionData.question_id,
          user_answer: indexToLetter[selectedOption],
        });
        
        setAnswersHistory((prev) => ({
          ...prev,
          [currentQuestion]: selectedOption,
        }));
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate(`/sessions/${sessionId}/summary`);
      
    } catch (error) {
      alert("Gagal menyimpan jawaban: " + error.message);
      setIsEnding(false);
    }
  };

  return (
    <div className="qz-page-wrapper">
      <nav className="hp-navbar">
        <div className="hp-nav-logo-container">
          <img src={LogoApta} alt="Logo Apta" />
        </div>
        <button className="hp-menu-btn-new" onClick={() => setIsMenuOpen(true)}>
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>

      <div className="qz-content-container">
        <div className="qz-main-content">
          <article className="qz-context-card">
            {type === "ability-test" && (
              <div className="qz-card-number">{currentQuestion}</div>
            )}

            <div className="qz-header-row">
              <h2 className="qz-context-title" style={{ margin: 0 }}>
                Konteks Bacaan
              </h2>
              <span className="qz-difficulty-badge">
                Tingkat: {currentQuestionData.difficulty_level?.toUpperCase()}
              </span>
            </div>

            <div className="qz-context-body">
              {isPastQuestion() ? (
                <p className="qz-review-mode-warning">
                  *Mode Review: Anda sedang melihat soal sebelumnya. Jawaban telah dikunci permanen.
                </p>
              ) : (
                <p className="qz-adaptive-mode-info">
                  *Sistem Adaptif: AI terus menyesuaikan tingkat kesulitan. Anda dapat mengakhiri sesi kapan saja.
                </p>
              )}

              <div className="qz-reading-box">
                <p>
                  {currentQuestionData.reading_context || "Tidak ada teks bacaan."}
                </p>
              </div>
            </div>
          </article>

          <section className="qz-question-section">
            <p className="qz-question-text">
              {currentQuestionData.question_text}
            </p>

            <div className="qz-options-list">
              {currentOptions.map((option, index) => {
                const isSelected = activeOptionToShow === index;
                return (
                  <div
                    key={index}
                    onClick={() => handleSelectOption(index)}
                    className={`qz-option-item ${isSelected ? "active" : ""}`}
                    style={{
                      cursor: isPastQuestion() || isEnding ? "not-allowed" : "pointer",
                      opacity: (isPastQuestion() || isEnding) && !isSelected ? 0.6 : 1,
                    }}
                  >
                    <input 
                      type="radio" 
                      name={`question-${currentQuestion}`} 
                      checked={isSelected} 
                      readOnly 
                    />
                    <div className={`qz-radio-circle ${isSelected ? "active" : ""}`} />
                    <span className="qz-option-label">{option}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="qz-sidebar-layout-vertical">
          <div className="qz-sidebar-layout-vertical">
            <div className="qz-numbers-card">
              <div className="qz-number-grid">
                {questionNumbers.map((num) => {
                  const isAnswered = isQuestionAnswered(num);
                  const isCurrent = num === currentQuestion;

                  let numberStatusClass = "num-default";
                  if (isAnswered) numberStatusClass = "num-answered";
                  else if (isCurrent) numberStatusClass = "num-current";

                  return (
                    <div
                      key={num}
                      className={`qz-number-item qz-num-item-flex ${numberStatusClass} ${isEnding ? "qz-freeze-opacity" : ""}`}
                      onClick={() => !isEnding && setCurrentQuestion(num)}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="qz-sidebar-bottom-actions">
              <div className="qz-sidebar-nav-btn-container">
                <button
                  className={`qz-nav-btn prev ${
                    currentQuestion === 1 || isLoading || isEnding 
                      ? "btn-prev-disabled" 
                      : "btn-prev-active"
                  }`}
                  disabled={currentQuestion === 1 || isLoading || isEnding}
                  onClick={handlePrev}
                >
                  <ChevronLeft size={18} />
                  <span className="qz-nav-btn-text">Sebelumnya</span>
                </button>

                <button
                  className={`qz-nav-btn next ${
                    selectedOption === null || isLoading || isEnding 
                      ? "btn-next-disabled" 
                      : "btn-next-active"
                  }`}
                  onClick={handleNext}
                  disabled={selectedOption === null || isLoading || isEnding}
                >
                  <span className="qz-nav-btn-text">{isLoading ? "Memproses..." : "Selanjutnya"}</span>
                  {!isLoading && <ChevronRight size={18} />}
                </button>
              </div>

              <button
                onClick={handleEndSession}
                disabled={isEnding}
                className={`qz-btn-submit-action ${
                  isEnding ? "btn-end-disabled" : "btn-end-active"
                }`}
              >
                <CheckSquare size={18} />
                <span>{isEnding ? "Menyimpan Jawaban..." : "Akhiri Sesi Latihan"}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      <LogoutOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};

export default QuizEngine;
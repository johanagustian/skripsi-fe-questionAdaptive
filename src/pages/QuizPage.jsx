import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronRight, ChevronLeft, CheckSquare } from "lucide-react";
import LogoutOverlay from "../components/LogoutOverlay";
import { submitSessionAnswer, fetchNextQuestion } from "../../utils/api";

const QuizEngine = ({ type = "quiz" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const initData = location.state?.quizData;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sessionId] = useState(initData?.session_id);
  const [documentId] = useState(initData?.document_id);
  const [questionsList, setQuestionsList] = useState(
    initData ? [initData] : [],
  );
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answersHistory, setAnswersHistory] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [selectedFlags, setSelectedFlags] = useState({});
  const isBackNavigationHandled = useRef(false);

  const readingContextRef = useRef(null);
  const readingBoxRef = useRef(null);

  const questionNumbers = Array.from(
    { length: questionsList.length },
    (_, i) => i + 1,
  );

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue =
        "Your practice session will not be saved if you leave now. Are you sure you want to exit?";
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
      const hasAnyAnswer =
        hasUnsubmittedAnswers ||
        hasSelectedCurrent ||
        Object.keys(answersHistory).length > 0;

      let message = "";
      if (hasAnyAnswer) {
        message =
          "You have selected answers.\n\nAre you sure you want to leave this practice session?\n\n⚠️ WARNING:\n• Submitted answers will remain saved\n• Unsubmitted answers will be LOST\n• Your final score will not be calculated if you leave now\n\nClick 'OK' to leave or 'Cancel' to continue.";
      } else {
        message =
          "You have not answered any questions yet.\n\nAre you sure you want to leave this practice session?\n\nThis session will end and you will need to start over.\n\nClick 'OK' to leave or 'Cancel' to continue.";
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

  const isPastQuestion = () => currentQuestion < questionsList.length;

  if (questionsList.length === 0)
    return <div className="p-10 text-center">Loading questions...</div>;

  const currentQuestionData = questionsList[currentQuestion - 1];

  const activeOptionToShow = isPastQuestion()
    ? answersHistory[currentQuestion]
    : selectedOption !== null
      ? selectedOption
      : null;

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
    scrollToContext();
  };

  const handleNext = async () => {
    if (isPastQuestion()) {
      setCurrentQuestion((prev) => prev + 1);
      scrollToContext();
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

      console.log("Next question response:", nextQResponse);

      setQuestionsList((prev) => [...prev, nextQResponse.data]);
      setCurrentQuestion((prev) => prev + 1);
      setSelectedOption(null);
      scrollToContext();
    } catch (error) {
      alert("Failed to process question: " + error.message);
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
      message =
        "You have unsubmitted answers.\n\nAre you sure you want to end this practice session?\n\nYour score and ability evaluation (Theta) will be calculated shortly.";
    } else if (hasSubmittedAnswers) {
      message =
        "Are you sure you want to end this practice session?\n\nYour score and ability evaluation (Theta) will be calculated immediately.";
    } else {
      message =
        "This session is still empty. Leaving now will permanently cancel this session. Are you sure?";
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

      if (
        !isPastQuestion() &&
        selectedOption !== null &&
        selectedFlags[currentQuestion] === undefined
      ) {
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

      await new Promise((resolve) => setTimeout(resolve, 500));
      navigate(`/sessions/${sessionId}/summary`);
    } catch (error) {
      alert("Failed to save answers: " + error.message);
      setIsEnding(false);
    }
  };

  return (
    <div className="qz-page-wrapper">
      <div className="qz-content-container">
        <article ref={readingContextRef} className="qz-context-card">
          <div className="qz-header-row">
            <h2 className="qz-context-title" style={{ margin: 0 }}>
              Reading Context
            </h2>
            <div className="qz-context-info">
              <span className="qz-current-theta">
                Theta (<i>θ</i>) : {Number(currentQuestionData.current_theta).toFixed(2)}
              </span>
              <span className="qz-current-ability">
                difficulty (<i>b</i>) : {currentQuestionData.b_parameter}
              </span>
              <span className={`qz-difficulty-badge ${currentQuestionData.difficulty_level?.toLowerCase()}`}>
                Level: {currentQuestionData.difficulty_level?.toUpperCase()} 
              </span>
            </div>
          </div>

          <div className="qz-context-body">
            {isPastQuestion() ? (
              <p className="qz-review-mode-warning">
                *Review Mode: You are currently viewing a previous question.
                Your answer is permanently locked.
              </p>
            ) : (
              <p className="qz-adaptive-mode-info">
                *Adaptive System: AI continuously adjusts the difficulty level.
                You can end the session at any time.
              </p>
            )}

            <div ref={readingBoxRef} className="qz-reading-box">
              {currentQuestionData.reading_context ? (
                currentQuestionData.reading_context
                  .split("\n")
                  .map((paragraph, index) => {
                    if (paragraph.trim() === "") return null;
                    return <p key={index}>{paragraph}</p>;
                  })
              ) : (
                <p>No reading text available.</p>
              )}
            </div>
          </div>
        </article>

        <div className="qz-bottom-layout-wrapper">
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
                      cursor:
                        isPastQuestion() || isEnding
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        (isPastQuestion() || isEnding) && !isSelected ? 0.6 : 1,
                    }}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
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

          <aside className="qz-sidebar-layout-vertical">
            <div className="qz-sidebar-right">
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
                        onClick={() => {
                          if (!isEnding) {
                            setCurrentQuestion(num);
                            scrollToContext();
                          }
                        }}
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
                    <span className="qz-nav-btn-text">Previously</span>
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
                    <span className="qz-nav-btn-text">
                      {isLoading ? "Processing..." : "Next"}
                    </span>
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
                  <span>
                    {isEnding ? "Saving Answers..." : "End Practice Session"}
                  </span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <LogoutOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};

export default QuizEngine;

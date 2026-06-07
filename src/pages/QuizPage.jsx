import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, ChevronRight, ChevronLeft, CheckSquare } from 'lucide-react';
import LogoApta from '../assets/icon1.jpg';
import LogoutOverlay from '../components/LogoutOverlay';
import { submitSessionAnswer, fetchNextQuestion } from '../../utils/api';

const QuizEngine = ({ type = 'quiz' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const initData = location.state?.quizData;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sessionId] = useState(initData?.session_id);
  const [documentId] = useState(initData?.document_id);
  
  // STATE DINAMIS
  const [questionsList, setQuestionsList] = useState(initData ? [initData] : []); 
  const [currentQuestion, setCurrentQuestion] = useState(1); 
  const [selectedOption, setSelectedOption] = useState(null); 
  const [answersHistory, setAnswersHistory] = useState({}); 
  const [isLoading, setIsLoading] = useState(false);
  
  // Karena unlimited, nomor soal menyesuaikan jumlah soal yang sudah di-generate AI
  const questionNumbers = Array.from({ length: questionsList.length }, (_, i) => i + 1);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      // Menampilkan dialog konfirmasi bawaan browser
      event.preventDefault();
      event.returnValue = "Sesi latihan tidak akan tersimpan jika Anda keluar sekarang. Yakin ingin mengakhiri?";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  if (questionsList.length === 0) return <div style={{ padding: '20px', textAlign: 'center' }}>Memuat soal...</div>;

  const currentQuestionData = questionsList[currentQuestion - 1];
  const isPastQuestion = currentQuestion < questionsList.length; 
  const activeOptionToShow = isPastQuestion ? answersHistory[currentQuestion] : selectedOption;

  const currentOptions = typeof currentQuestionData.options === 'string' 
    ? JSON.parse(currentQuestionData.options) 
    : currentQuestionData.options || [];

  const handleSelectOption = (index) => {
    if (isPastQuestion) return; 
    setSelectedOption(index);
  };

  const handlePrev = () => {
    setCurrentQuestion(prev => Math.max(1, prev - 1));
  };

  const handleNext = async () => {
    if (isPastQuestion) {
      setCurrentQuestion(prev => prev + 1);
      return;
    }

    if (selectedOption === null) return; 

    setIsLoading(true);
    const indexToLetter = { 0: 'A', 1: 'B', 2: 'C', 3: 'D' };

    try {
      await submitSessionAnswer({
        session_id: sessionId,
        question_id: currentQuestionData.question_id,
        user_answer: indexToLetter[selectedOption]
      });

      setAnswersHistory(prev => ({ ...prev, [currentQuestion]: selectedOption }));

      // Minta soal baru dari AI tanpa batas
      const nextQResponse = await fetchNextQuestion({
        session_id: sessionId,
        document_id: documentId
      });

      setQuestionsList(prev => [...prev, nextQResponse.data]);
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption(null); 

    } catch (error) {
      alert("Gagal memproses soal: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // HANDLER BARU: Mengakhiri Sesi secara Manual
  const handleEndSession = () => {
    // Menambahkan validasi apakah sesi sudah ada jawaban atau belum
    const hasAnswers = Object.keys(answersHistory).length > 0;
    
    const message = hasAnswers 
      ? "Apakah Anda yakin ingin mengakhiri sesi latihan ini?\n\nSkor dan evaluasi kemampuan (Theta) Anda akan segera dikalkulasi."
      : "Sesi masih kosong. Keluar sekarang akan membatalkan sesi ini secara permanen. Yakin?";
      
    const isConfirmed = window.confirm(message);
    
    if (isConfirmed) {
      // Jika sesi kosong (belum ada jawaban), opsional: panggil API hapus sesi di sini
      navigate(`/sessions/${sessionId}/summary`);
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
        
        {/* SISI KIRI: SOAL & BACAAN */}
        <div className="qz-main-content">
          <article className="qz-context-card">
            {type === 'ability-test' && (
              <div className="qz-card-number">{currentQuestion}</div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 className="qz-context-title" style={{ margin: 0 }}>Konteks Bacaan</h2>
                <span style={{ fontSize: '12px', background: '#e2e8f0', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                    Tingkat: {currentQuestionData.difficulty_level?.toUpperCase()}
                </span>
            </div>

            <div className="qz-context-body">
              {isPastQuestion ? (
                <p style={{ fontStyle: 'italic', color: '#ef4444', fontSize: '13px', marginBottom: '12px', fontWeight: '600' }}>
                  *Mode Review: Anda sedang melihat soal sebelumnya. Jawaban telah dikunci permanen.
                </p>
              ) : (
                <p style={{ fontStyle: 'italic', color: '#64748b', fontSize: '13px', marginBottom: '12px' }}>
                  *Sistem Adaptif: AI terus menyesuaikan tingkat kesulitan. Anda dapat mengakhiri sesi kapan saja.
                </p>
              )}
              
              <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                  <p style={{ lineHeight: '1.6', textAlign: 'justify' }}>
                    {currentQuestionData.reading_context || "Tidak ada teks bacaan."}
                  </p>
              </div>
            </div>
          </article>

          <section className="qz-question-section">
            <p className="qz-question-text">{currentQuestionData.question_text}</p>
            
            <div className="qz-options-list">
              {currentOptions.map((option, index) => {
                const isSelected = activeOptionToShow === index;
                return (
                  <div
                    key={index}
                    onClick={() => handleSelectOption(index)}
                    className={`qz-option-item ${isSelected ? 'active' : ''}`}
                    style={{ 
                      cursor: isPastQuestion ? 'not-allowed' : 'pointer',
                      opacity: (isPastQuestion && !isSelected) ? 0.6 : 1 
                    }}
                  >
                    <div className={`qz-radio-circle ${isSelected ? 'active' : ''}`} />
                    <span className="qz-option-label">{option}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* SISI KANAN: NAVIGASI SIDEBAR */}
        <aside className="qz-sidebar-layout-vertical">
          <div className="qz-sidebar-layout-vertical">
            
            <div className="qz-numbers-card">
              <div className="qz-number-grid">
                {questionNumbers.map((num) => {
                  const isAnswered = answersHistory[num] !== undefined;
                  const isCurrent = num === currentQuestion;

                  return (
                    <div 
                      key={num} 
                      className={`qz-number-item ${isAnswered ? 'filled' : ''} ${isCurrent ? 'current' : ''}`}
                      onClick={() => setCurrentQuestion(num)}
                      style={{
                         cursor: 'pointer',
                         display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AREA TOMBOL BAWAH */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
              
              {/* Grup Tombol Navigasi Prev / Next */}
              <div className="qz-sidebar-nav-bottom" style={{ display: 'flex', gap: '8px', padding: 0, border: 'none', background: 'transparent' }}>
                <button
                  className="qz-nav-btn prev"
                disabled={currentQuestion === 1 || isLoading}
                onClick={handlePrev}
                style={{ 
                  flex: 1, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px', // Memberi jarak antara icon panah dan tulisan
                  backgroundColor: (currentQuestion === 1 || isLoading) ? '#f8f9fa' : '#ffffff', // Latar abu-abu pucat jika di soal 1
                  color: (currentQuestion === 1 || isLoading) ? '#cbd5e1' : '#1e293b', // Teks abu-abu jika di soal 1, hitam jika aktif
                  border: (currentQuestion === 1 || isLoading) ? '1px solid #e2e8f0' : '1px solid #cbd5e1',
                  cursor: (currentQuestion === 1 || isLoading) ? 'not-allowed' : 'pointer',
                  padding: '12px 0',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                  }}
                > 
                  <ChevronLeft size={18} /> 
                  {/* Teks dimunculkan kembali dengan efek transisi warna */}
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>
                    Sebelumnya
                  </span>
                </button>

                <button
                  className="qz-nav-btn next"
                  onClick={handleNext}
                  disabled={(activeOptionToShow === null) || isLoading}
                  style={{ 
                      flex: 2,
                      backgroundColor: ((activeOptionToShow === null) || isLoading) ? '#9ca3af' : '#111827',
                      cursor: ((activeOptionToShow === null) || isLoading) ? 'not-allowed' : 'pointer',
                      justifyContent: 'center',
                      padding: '12px 0'
                  }}
                >
                  <span>{isLoading ? 'Memproses...' : 'Selanjutnya'}</span>
                  {!isLoading && <ChevronRight size={18} />}
                </button>
              </div>

              {/* Tombol Selesai Sesi */}
              <button
                onClick={handleEndSession}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#ef4444', // Warna Merah (Tailwind red-500)
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
              >
                <CheckSquare size={18} />
                Akhiri Sesi Latihan
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
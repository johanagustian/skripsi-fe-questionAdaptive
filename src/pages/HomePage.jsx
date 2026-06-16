import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, FileText, Calendar, X, Inbox, Loader2 } from "lucide-react";
import LogoutOverlay from "../components/LogoutOverlay";
import LogoApta from "../assets/icon1.jpg";
import logopdf from "../assets/LogoPDF.svg";
import {
  getCurrentUser,
  getHistorySessions,
  uploadDocumentAndGenerate,
} from "../../utils/api";

const HomePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [username, setUsername] = useState("");
  const [historyData, setHistoryData] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState("Mempersiapkan...");
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userResult = await getCurrentUser();
        const name = userResult?.data?.userData?.full_name || userResult?.data?.full_name || userResult?.full_name || "Pengguna";
        setUsername(name);
      } catch (err) {
        setUsername("Guest");
      }

      try {
        const historyResult = await getHistorySessions();
        setHistoryData(Array.isArray(historyResult?.data) ? historyResult.data : []);
      } catch (err) {
        setHistoryData([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleButtonClick = () => fileInputRef.current.click();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === "application/pdf") setUploadedFile(file);
      else alert("Silakan unggah dokumen dengan format PDF!");
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleStartSession = async () => {
    if (!uploadedFile) return;
    
    // Create AbortController for timeout
    abortControllerRef.current = new AbortController();
    
    try {
      setIsGeneratingQuiz(true);
      setLoadingProgress(0);
      setLoadingStatus("Membaca file PDF...");
      
      // Simulasi progress stages
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 300);
      
      // Update status berdasarkan progress
      const statusTimer = setTimeout(() => {
        setLoadingStatus("Mengekstrak teks dari dokumen...");
      }, 1000);
      
      const statusTimer2 = setTimeout(() => {
        setLoadingStatus("AI sedang merumuskan soal...");
      }, 2500);
      
      const statusTimer3 = setTimeout(() => {
        setLoadingStatus("Hampir selesai, menyiapkan sesi...");
      }, 4000);
      
      const response = await uploadDocumentAndGenerate(uploadedFile);
      
      clearInterval(progressInterval);
      clearTimeout(statusTimer);
      clearTimeout(statusTimer2);
      clearTimeout(statusTimer3);
      
      setLoadingProgress(100);
      setLoadingStatus("Selesai! Mengalihkan...");
      
      setTimeout(() => {
        navigate("/quiz", { state: { quizData: response.data } });
      }, 500);
      
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan saat memproses dokumen: " + error.message);
      setIsGeneratingQuiz(false);
      setLoadingProgress(0);
    } finally {
      // Cleanup
      if (abortControllerRef.current) {
        abortControllerRef.current = null;
      }
    }
  };

  return (
    <div className="hp-wrapper">
      {/* Loading Overlay dengan Progress */}
      {isGeneratingQuiz && (
        <div className="hp-loading-overlay">
          <div className="hp-loading-card">
            <div className="hp-spinner-container">
              <div className="hp-spinner"></div>
            </div>
            
            <div className="hp-progress-container">
              <div className="hp-progress-bar">
                <div 
                  className="hp-progress-fill" 
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <span className="hp-progress-percent">{loadingProgress}%</span>
            </div>
            
            <p className="hp-loading-status">{loadingStatus}</p>
            
            <div className="hp-loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}

      <nav className="hp-navbar">
        <div className="hp-nav-logo-container">
          <img src={LogoApta} alt="Logo Apta" />
        </div>
        <button className="hp-menu-btn-new" onClick={() => setIsMenuOpen(true)}>
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="application/pdf" 
        style={{ display: "none" }} 
      />

      <main className="hp-container">
        <header className="hp-header-card">
          <span className="hp-welcome">Hallo...</span>
          <h1 className="hp-user-name">{username || "Memuat..."}</h1>
          <p className="hp-subtitle">Apakah kamu siap latihan hari ini?</p>
        </header>

        <section className="hp-section">
          <div className="hp-section-title">
            <h2>Mulai sesi latihan</h2>
            <p>Unggah dokumen untuk memulai sesi latihan!</p>
          </div>

          {!uploadedFile ? (
            <div className="hp-upload-card">
              <div className="hp-upload-icon-box">
                <FileText className="text-gray-400" size={65} />
              </div>
              <p className="hp-upload-text">unggah dokumen tipe pdf</p>
              <button onClick={handleButtonClick} className="hp-btn-upload">Unggah Dokumen</button>
            </div>
          ) : (
            <div className="hp-upload-card active">
              <button 
                onClick={handleRemoveFile} 
                className="hp-remove-file-btn" 
                disabled={isGeneratingQuiz}
              >
                <X size={20} />
              </button>
              <div className="up-file-card up-file-card-home">
                <div className="up-file-icon">
                  <img src={logopdf} alt="PDF Icon" className="pdf-logo-img" />
                </div>
                <div className="up-file-info">
                  <p className="up-file-name">{uploadedFile.name}</p>
                  <span className="up-file-status">*Materi latihan akan dibuat secara otomatis</span>
                </div>
              </div>
              <p className="hp-upload-text success">✓ dokumen berhasil diunggah</p>
              <button 
                onClick={handleStartSession} 
                className="lp-button-primary" 
                disabled={isGeneratingQuiz}
              >
                {isGeneratingQuiz ? "AI Sedang Mengekstrak..." : "Mulai Sesi Sekarang"}
              </button>
            </div>
          )}
        </section>

        <section className="hp-section">
          <div className="hp-section-title hp-title-container">
            <div>
              <h2>Riwayat sesi latihan</h2>
              <p>lihat sesi latihan sebelumnya</p>
            </div>
            {historyData.length > 0 && (
              <button onClick={() => navigate("/history")} className="btn-see-more">
                Lihat Selengkapnya
              </button>
            )}
          </div>

          <div className="hist-list">
            {isLoadingHistory ? (
              <div className="hp-history-loading">
                <p>Memuat data riwayat...</p>
              </div>
            ) : historyData.length === 0 ? (
              <div className="hp-history-empty">
                <Inbox size={40} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
                <p className="hp-history-empty-text">Belum ada sesi latihan.</p>
              </div>
            ) : (
              historyData.slice(0, 3).map((item) => (
                <div key={item.session_id} className="hist-card">
                  <div className="hist-card-main">
                    <div className="hist-doc-wrapper">
                      <FileText size={18} className="text-gray-600" />
                      <h3 className="hist-exercise-title">
                        {item.file_name || item.document_name || "Sesi Latihan"}
                      </h3>
                    </div>
                    <div className="hist-meta">
                      <span className="meta-item">
                        <Calendar size={14} />
                        {new Date(item.created_at).toLocaleDateString("id-ID", { 
                          day: "numeric", 
                          month: "long", 
                          year: "numeric" 
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="hist-card-stats">
                    <div className="stat-box">
                      <span className="stat-label">Skor</span>
                      <span className="stat-value text-green">{item.score ?? 0}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Kemampuan</span>
                      <span className="ability-up">{item.theta_increase ?? "0.00"}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">Soal</span>
                      <span className="stat-value">{item.total_soal ?? 0}</span>
                    </div>
                    <button 
                      className="btn-detail" 
                      onClick={() => navigate(`/sessions/${item.session_id}/summary`)}
                    >
                      Detail
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
      
      <LogoutOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};

export default HomePage;
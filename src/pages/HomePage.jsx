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

  // UI States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Data States
  const [username, setUsername] = useState("");
  const [historyData, setHistoryData] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // 1. Ambil Nama User
      try {
        const userResult = await getCurrentUser();
        const name =
          userResult?.data?.userData?.full_name ||
          userResult?.data?.full_name ||
          userResult?.full_name ||
          "Pengguna";
        setUsername(name);
      } catch (err) {
        console.error("Gagal mengambil data user:", err);
        setUsername("Guest");
      }

      // 2. Ambil Riwayat Sesi
      try {
        const historyResult = await getHistorySessions();
        const historyArray = Array.isArray(historyResult?.data)
          ? historyResult.data
          : [];
        setHistoryData(historyArray);
      } catch (err) {
        console.warn("Gagal memuat history:", err.message);
        setHistoryData([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === "application/pdf") {
        setUploadedFile(file);
      } else {
        alert("Silakan unggah dokumen dengan format PDF!");
      }
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleStartSession = async () => {
    if (!uploadedFile) return;

    try {
      setIsGeneratingQuiz(true);
      const response = await uploadDocumentAndGenerate(uploadedFile);
      navigate("/quiz", { state: { quizData: response.data } });
    } catch (error) {
      alert("Terjadi kesalahan saat memproses dokumen: " + error.message);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  return (
    <div className="hp-wrapper">
      {/* Loading Overlay */}
      {isGeneratingQuiz && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(255,255,255,0.95)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
          <p className="font-semibold text-lg">
            AI Sedang Mengekstrak Konsep & Soal...
          </p>
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
              <button onClick={handleButtonClick} className="hp-btn-upload">
                Unggah Dokumen
              </button>
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
                  <span className="up-file-status">
                    *Materi latihan akan dibuat secara otomatis berdasarkan
                    dokumen ini
                  </span>
                </div>
              </div>
              <p className="hp-upload-text success">
                ✓ dokumen berhasil diunggah
              </p>
              <button
                onClick={handleStartSession}
                className="lp-button-primary"
                disabled={isGeneratingQuiz}
                style={{
                  opacity: isGeneratingQuiz ? 0.7 : 1,
                  cursor: isGeneratingQuiz ? "wait" : "pointer",
                }}
              >
                {isGeneratingQuiz
                  ? "AI Sedang Mengekstrak..."
                  : "Mulai Sesi Sekarang"}
              </button>
            </div>
          )}
        </section>

        {/* RIWAYAT SESI - Dibuat selalu muncul */}
        <section className="hp-section">
          <div className="hp-section-title hp-title-container">
            <div>
              <h2>Riwayat sesi latihan</h2>
              <p>lihat sesi latihan sebelumnya</p>
            </div>

            {historyData.length > 0 && (
              <button
                onClick={() => navigate("/history")}
                className="btn-see-more"
              >
                Lihat Selengkapnya
              </button>
            )}
          </div>

          <div className="hist-list">
            {isLoadingHistory ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "#7f8c8d",
                }}
              >
                <p>Memuat data riwayat...</p>
              </div>
            ) : historyData.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  background: "#f8f9fa",
                  borderRadius: "12px",
                  border: "1px dashed #cbd5e1",
                }}
              >
                <Inbox
                  size={40}
                  color="#94a3b8"
                  style={{ margin: "0 auto 12px" }}
                />
                <p style={{ color: "#64748b", fontWeight: "500" }}>
                  Belum ada sesi latihan.
                </p>
              </div>
            ) : (
              // Ganti bagian map historyData ini
              historyData.slice(0, 3).map((item, index) => {
                console.log("ISI DATA ITEM:", item)
                const shortSessionId = item.session_id
                  ? item.session_id.split("-")[1]?.substring(0, 6)
                  : "Baru";
                const cardStyle =
                  index === 2
                    ? {
                        opacity: 0.6,
                        transform: "scale(0.98)",
                        pointerEvents: "none",
                      }
                    : {};

                return (
                  <div
                    key={item.session_id}
                    className="hist-card"
                    style={cardStyle}
                  >
                    <div className="hist-card-main">
                      <div className="hist-doc-wrapper">
                        <FileText size={18} className="text-gray-600" />
                        <h3 className="hist-exercise-title">
                          {/* PERUBAHAN DI SINI: Gunakan item.file_name sesuai query backend */}
                          {item.file_name ||
                            item.document_name ||
                            `Latihan (${shortSessionId})`}
                        </h3>
                      </div>

                      <div className="hist-meta">
                        <span className="meta-item">
                          <Calendar size={14} />
                          {new Date(item.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    </div>

                    {/* ... bagian stat tetap sama ... */}
                    <div className="hist-card-stats">
                      <div className="stat-box">
                        <span className="stat-label">Skor</span>
                        <span className="stat-value text-green">
                          {item.score ?? 0}
                        </span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-label">Kemampuan</span>
                        <span className="ability-up">
                          {item.theta_increase ?? "0.00"}
                        </span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-label">Soal</span>
                        <span className="stat-value">
                          {item.total_soal ?? 0}
                        </span>
                      </div>
                      <button
                        className="btn-detail"
                        onClick={() =>
                          navigate(`/sessions/${item.session_id}/summary`)
                        }
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      <LogoutOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};

export default HomePage;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoIcon from "../assets/boy2.jpg";
import { login, checkUserStatus, startAbilityTest } from "../../utils/api";

const LoginPage = () => {
  const navigate = useNavigate();

  // Modal & Loading state
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isGeneratingSoal, setIsGeneratingSoal] = useState(false); // State baru untuk loading AI

  // Form state Login
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Message state
  const [message, setMessage] = useState({
    text: "",
    type: "",
  });

  // Handle input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 1. Helper function: HANYA CEK STATUS (Proses Sangat Cepat)
  const checkIfNeedsAbilityTest = async () => {
    try {
      // Memanggil endpoint GET yang ringan, BUKAN menembak AI
      await checkUserStatus();
      return true; // Jika berhasil (201), berarti dia user baru
    } catch (error) {
      if (error.message.includes("sudah pernah") || error.message.includes("403")) {
        return false; // Jika ditolak karena sudah pernah tes
      }
      throw error; 
    }
  };

  // 2. Fungsi Utama Login
  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    try {
      setMessage({ text: "Memproses...", type: "alert" });

      // Eksekusi Login
      await login({ email, password });

      // Cek status kewajiban tes (Langsung responsif!)
      const needsAbilityTest = await checkIfNeedsAbilityTest();

      if (needsAbilityTest) {
        setShowGuideModal(true); // Modal langsung muncul tanpa nunggu AI
      } else {
        setMessage({ text: "Login berhasil", type: "success" });
        navigate("/home");
      }

    } catch (err) {
      setMessage({
        text: err.message || "Login gagal, periksa kembali email dan kata sandimu.",
        type: "error",
      });
    }
  };

  // 3. Modal lanjut: PROSES AI BERADA DI SINI
  const handleNextToTestAbility = async () => {
    try {
      setIsGeneratingSoal(true); // Ubah tombol jadi "AI sedang menyiapkan..."

      // Memanggil endpoint POST yang menembak T5 (butuh waktu beberapa detik)
      const testResponse = await startAbilityTest(); 
      
      setShowGuideModal(false); 
      
      // Bawa data soal yang berhasil di-generate ke halaman ujian
      navigate("/test-kemampuan-awal", { 
        state: { testData: testResponse.data } 
      });
      
    } catch (err) {
      alert("Gagal menyiapkan soal ujian: " + err.message);
    } finally {
      setIsGeneratingSoal(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="auth-card-wrapper">
        {/* Header */}
        <div className="login-header">
          <img src={logoIcon} alt="Apta Logo" className="login-logo-img" />
        </div>

        {/* Content */}
        <div className="login-content">
          <h1 className="login-title font-lobster">Login</h1>

          <div className="login-card-light">
            {/* Message */}
            {message.text && (
              <div className={`register-message ${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin}>
              {/* Email */}
              <div className="input-group">
                <label>Masukkan Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Masukkan Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Password */}
              <div className="input-group">
                <label>Masukkan Kata Sandi</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Masukkan Kata Sandi"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Button */}
              <button type="submit" className="btn-login-black">
                Masuk
              </button>
            </form>

            {/* Footer */}
            <div className="signup-footer">
              <p>
                Belum punya akun?{" "}
                <span
                  onClick={() => navigate("/register")}
                  style={{ color: "blue", cursor: "pointer" }}
                >
                  Daftar sekarang
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showGuideModal && (
        <div style={styles.overlay}>
          <div style={styles.modalCard}>
            <h2 style={styles.modalTitle}>Petunjuk Ability Test</h2>

            <p style={styles.modalText}>
              Sebelum masuk ke aplikasi utama, Anda diwajibkan mengikuti
              <strong> Tes Kemampuan Awal </strong>
              terlebih dahulu.
            </p>

            <button
              onClick={handleNextToTestAbility}
              className="btn-register-black"
              disabled={isGeneratingSoal} // Matikan tombol saat nunggu AI
              style={{ 
                marginTop: "16px", 
                opacity: isGeneratingSoal ? 0.7 : 1, 
                cursor: isGeneratingSoal ? "wait" : "pointer" 
              }}
            >
              {isGeneratingSoal ? "AI Sedang Menyiapkan Tes..." : "Mulai Sekarang"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: "20px",
  },
  modalCard: {
    background: "#fff",
    padding: "32px",
    borderRadius: "14px",
    maxWidth: "450px",
    width: "100%",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  modalTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "700",
  },
  modalText: {
    fontSize: "15px",
    lineHeight: "1.6",
  },
};

export default LoginPage;
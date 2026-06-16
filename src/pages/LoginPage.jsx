import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoIcon from "../assets/boy2.jpg";
import { login, checkUserStatus, startAbilityTest } from "../../utils/api";

const LoginPage = () => {
  const navigate = useNavigate();

  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isGeneratingSoal, setIsGeneratingSoal] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState({
    text: "",
    type: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const checkIfNeedsAbilityTest = async () => {
    try {
      await checkUserStatus();
      return true;
    } catch (error) {
      if (error.message.includes("sudah pernah") || error.message.includes("403")) {
        return false;
      }
      throw error;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    try {
      setMessage({ text: "Memproses...", type: "alert" });
      await login({ email, password });
      const needsAbilityTest = await checkIfNeedsAbilityTest();

      if (needsAbilityTest) {
        setShowGuideModal(true);
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

  const handleNextToTestAbility = async () => {
    try {
      setIsGeneratingSoal(true);
      const testResponse = await startAbilityTest();
      setShowGuideModal(false);
      navigate("/test-kemampuan-awal", {
        state: { testData: testResponse.data },
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
        <div className="login-header">
          <img src={logoIcon} alt="Apta Logo" className="login-logo-img" />
        </div>

        <div className="login-content">
          <h1 className="login-title font-lobster">Login</h1>

          <div className="login-card-light">
            {message.text && (
              <div className={`register-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleLogin}>
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

              <button type="submit" className="btn-login-black">
                Masuk
              </button>
            </form>

            <div className="signup-footer">
              <p>
                Belum punya akun?{" "}
                <span
                  onClick={() => navigate("/register")}
                  className="reg-link-style"
                >
                  Daftar sekarang
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {showGuideModal && (
        <div className="login-modal-overlay">
          <div className="login-modal-card">
            <h2 className="login-modal-title">Petunjuk Ability Test</h2>
            <p className="login-modal-text">
              Sebelum masuk ke aplikasi utama, Anda diwajibkan mengikuti
              <strong> Tes Kemampuan Awal </strong>
              terlebih dahulu.
            </p>

            <button
              onClick={handleNextToTestAbility}
              className="btn-register-black login-modal-btn"
              disabled={isGeneratingSoal}
            >
              {isGeneratingSoal ? "AI Sedang Menyiapkan Tes..." : "Mulai Sekarang"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
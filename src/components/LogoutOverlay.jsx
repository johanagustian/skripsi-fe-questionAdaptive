import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, LogOut, User } from 'lucide-react';
import { getCurrentUser } from '../../utils/api'; 

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State untuk menyimpan data dinamis
  const [userName, setUserName] = useState("Memuat...");
  const [userLevel, setUserLevel] = useState("Memuat...");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const result = await getCurrentUser();
        
        // Parsing nama menggunakan logika yang sama dengan HomePage
        const name = result?.data?.userData?.full_name 
                  || result?.data?.full_name 
                  || result?.full_name 
                  || "Pengguna";
        
        // Jika backend-mu nantinya mengirimkan konversi level dari Theta, tangkap di sini.
        // Sementara kita beri default "Middle" jika field belum ada.
        const theta_score = result?.data?.userData?.theta_score 
                 || result?.data?.theta_score
                 || "-"; 

        const formatTheta = theta_score.toFixed(2);
        setUserName(name);

        if (formatTheta >= 0.5){
          setUserLevel(`Level: Hight (${formatTheta})`);
        } else{
          setUserLevel(`Level: Middle (${formatTheta})`);
        }
        
      } catch (error) {
        console.error("Gagal memuat data profil navbar:", error);
        setUserName("Guest");
        setUserLevel("Level: -");
      }
    };

    fetchUserProfile();
  }, []);

  // Fungsi Logout yang benar (Menghapus token sebelum pindah halaman)
  const handleLogout = () => {
    const isConfirmed = window.confirm("Apakah Anda yakin ingin keluar?");
    
    if (isConfirmed) {
      // Hapus token di localStorage/sessionStorage sesuai konfigurasi aplikasimu
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // Jika aplikasimu menggunakan penamaan key yang berbeda, ganti string di atas,
      // atau gunakan fungsi removeAccessToken() dari utils/api.jsx jika ada.

      navigate('/login');
    }
  };

  return (
    <nav className="hp-navbar">
      <div className="hp-nav-container-flex">
        
        {/* SISI KIRI: MENU NAVIGASI */}
        <div className="hp-nav-links-group">
          <button 
            onClick={() => navigate('/home')} 
            className={`nav-inline-btn ${location.pathname === '/home' ? 'active' : ''}`}
          >
            <Home size={18} />
            <span>Home</span>
          </button>
        </div>

        {/* SISI KANAN: PROFIL & LOGOUT */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          
          {/* Info Akun & Level (Dinamis) */}
          <div className="hp-nav-profile-section">
            <div className="hp-nav-profile-info">
              <span className="hp-nav-profile-name">{userName}</span>
              <span className="hp-nav-profile-level">{userLevel}</span>
            </div>
            <div 
              style={{ 
                width: '32px', 
                height: '32px', 
                background: '#374151', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#9ca3af'
              }}
            >
              <User size={16} />
            </div>
          </div>

          {/* Tombol Logout */}
          <button className="nav-inline-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Log out</span>
          </button>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import logoIcon from '../assets/boy2.jpg';
import { registry } from '../../utils/api';

const RegisterPage = () => {
    const navigate = useNavigate();

    // Password visibility
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Modal state
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [showLevelModal, setShowLevelModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPass: ''
    });

    // Message state
    const [message, setMessage] = useState({
        text: '',
        type: ''
    });

    // Handle input change
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Handle submit register
    const handleFormSubmit = async (e) => {
        e.preventDefault();

        const { full_name, email, password, confirmPass } = formData;

        // Validasi password
        if (password !== confirmPass) {
            return setMessage({
                text: 'Pastikan konfirmasi password sama dengan password',
                type: 'error'
            });
        }

        try {
            setMessage({
                text: 'Memproses...',
                type: 'alert'
            });

            // Request ke backend
            await registry({
                full_name,
                email,
                password
            });

            setMessage({
                text: 'Pendaftaran berhasil',
                type: 'success'
            });

            // Langsung Navigasi ke login
            navigate("/login")

        } catch (err) {
            setMessage({
                text: err.message || 'Terjadi kesalahan',
                type: 'error'
            });
        }
    };

    return (
        <div className="register-wrapper" style={{ position: 'relative' }}>
            <div className="auth-card-wrapper">

                <div className="register-header">
                    <img
                        src={logoIcon}
                        alt="Apta Logo"
                        className="register-logo-img"
                    />
                </div>

                <div className="register-content">
                    <h1 className="register-title">Register</h1>

                    <div className="register-card-light">

                        {/* Message */}
                        {message.text && (
                            <div className={`register-message ${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleFormSubmit}>

                            {/* Username */}
                            <div className="input-group">
                                <label>Masukkan Username</label>

                                <input
                                    type="text"
                                    name="full_name"
                                    placeholder="Masukkan Username"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

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

                                <div className="password-wrapper">

                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        name="password"
                                        placeholder="Masukkan Kata Sandi"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPass(!showPass)}
                                    >
                                        {showPass ? (
                                            <EyeOff size={20} />
                                        ) : (
                                            <Eye size={20} />
                                        )}
                                    </button>

                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="input-group">
                                <label>Konfirmasi Kata Sandi</label>

                                <div className="password-wrapper">

                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        name="confirmPass"
                                        placeholder="Konfirmasi Kata Sandi"
                                        value={formData.confirmPass}
                                        onChange={handleChange}
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                    >
                                        {showConfirm ? (
                                            <EyeOff size={20} />
                                        ) : (
                                            <Eye size={20} />
                                        )}
                                    </button>

                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                className="btn-register-black"
                            >
                                Daftar
                            </button>

                        </form>

                        <div className="signup-footer">
                            <p style={{ fontSize: '14px' }}>
                                Sudah punya akun?{' '}
                                <Link to="/login">
                                    Login di sini
                                </Link>
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

// Modal Styles
const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '20px'
    },

    modalCard: {
        background: '#fff',
        padding: '32px',
        borderRadius: '14px',
        maxWidth: '450px',
        width: '100%',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },

    modalTitle: {
        margin: 0,
        fontSize: '22px',
        fontWeight: '700'
    },

    modalText: {
        fontSize: '15px',
        lineHeight: '1.6'
    },

    btnGroup: {
        display: 'flex',
        gap: '12px',
        marginTop: '12px',
        width: '100%'
    },

    levelBtn: {
        flex: 1
    }
};

export default RegisterPage;
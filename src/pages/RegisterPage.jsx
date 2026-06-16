import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import logoIcon from '../assets/boy2.jpg';
import { registry } from '../../utils/api';

const RegisterPage = () => {
    const navigate = useNavigate();

    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPass: ''
    });

    const [message, setMessage] = useState({
        text: '',
        type: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const { full_name, email, password, confirmPass } = formData;

        if (password !== confirmPass) {
            return setMessage({
                text: 'Pastikan konfirmasi password sama dengan password',
                type: 'error'
            });
        }

        try {
            setMessage({ text: 'Memproses...', type: 'alert' });
            await registry({ full_name, email, password });
            setMessage({ text: 'Pendaftaran berhasil', type: 'success' });
            navigate("/login");
        } catch (err) {
            setMessage({
                text: err.message || 'Terjadi kesalahan',
                type: 'error'
            });
        }
    };

    return (
        <div className="register-wrapper">
            <div className="auth-card-wrapper">
                <div className="register-header">
                    <img src={logoIcon} alt="Apta Logo" className="register-logo-img" />
                </div>

                <div className="register-content">
                    <h1 className="register-title">Register</h1>

                    <div className="register-card-light">
                        {message.text && (
                            <div className={`register-message ${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleFormSubmit}>
                            <div className="input-group">
                                <label>Masukkan Username</label>
                                <input type="text" name="full_name" placeholder="Masukkan Username" value={formData.full_name} onChange={handleChange} required />
                            </div>

                            <div className="input-group">
                                <label>Masukkan Email</label>
                                <input type="email" name="email" placeholder="Masukkan Email" value={formData.email} onChange={handleChange} required />
                            </div>

                            <div className="input-group">
                                <label>Masukkan Kata Sandi</label>
                                <div className="password-wrapper">
                                    <input type={showPass ? 'text' : 'password'} name="password" placeholder="Masukkan Kata Sandi" value={formData.password} onChange={handleChange} required />
                                    <button type="button" className="password-toggle" onClick={() => setShowPass(!showPass)}>
                                        {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Konfirmasi Kata Sandi</label>
                                <div className="password-wrapper">
                                    <input type={showConfirm ? 'text' : 'password'} name="confirmPass" placeholder="Konfirmasi Kata Sandi" value={formData.confirmPass} onChange={handleChange} required />
                                    <button type="button" className="password-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                                        {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="btn-register-black">Daftar</button>
                        </form>

                        <div className="signup-footer">
                            <p style={{ fontSize: '14px' }}>
                                Sudah punya akun? <Link to="/login">Login di sini</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
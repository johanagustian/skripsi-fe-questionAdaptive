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
                text: 'Password confirmation must match the password',
                type: 'error'
            });
        }

        try {
            setMessage({ 
                text: 'Processing...', 
                type: 'alert' 
            });

            await registry({ full_name, email, password });

            setMessage({ 
                text: 'Registration successful', 
                type: 'success' 
            });

            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (err) {
            setMessage({
                text: err.message || 'An error occurred',
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
                                <label>Username</label>
                                <input type="text" name="full_name" placeholder="Enter Username" value={formData.full_name} onChange={handleChange} required />
                            </div>

                            <div className="input-group">
                                <label>Email</label>
                                <input type="email" name="email" placeholder="Enter Email" value={formData.email} onChange={handleChange} required />
                            </div>

                            <div className="input-group">
                                <label>Password</label>
                                <div className="password-wrapper">
                                    <input type={showPass ? 'text' : 'password'} name="password" placeholder="Enter Password" value={formData.password} onChange={handleChange} required />
                                    <button type="button" className="password-toggle" onClick={() => setShowPass(!showPass)}>
                                        {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Confirm Password</label>
                                <div className="password-wrapper">
                                    <input type={showConfirm ? 'text' : 'password'} name="confirmPass" placeholder="Confirm Password" value={formData.confirmPass} onChange={handleChange} required />
                                    <button type="button" className="password-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                                        {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="btn-register-black">Register</button>
                        </form>

                        <div className="signup-footer">
                            <p style={{ fontSize: '14px' }}>
                                Already have an account? <Link to="/login">Login here</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
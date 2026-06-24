import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoApta from '../assets/boy2.jpg';

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="lp-container">

      {/* 1. NAVBAR SECTION */}
      <header className="lp-header">
        <div className="hp-navbar">
          <div className="hp-nav-logo-container">
            {/* <img src={LogoApta} alt="Logo Apta" /> */}
          </div>
          <div className="lp-nav-actions">
            <button onClick={() => { navigate('/login') }} className="lp-btn-login">Login</button>
            <button onClick={() => { navigate('/Register') }} className="lp-btn-regiset">Register</button>
          </div>
        </div>
      </header>

      {/* 2. CENTERED HERO ARCHITECTURE */}
      <section className="lp-hero">
        <div className="lp-visual-container">
          <img src={logoApta} alt="AI Neural Brain" className="lp-brain-img" />
        </div>
        <h1 className="lp-title">Personalize Your Learning with <br /><span className="lp-title-gradient">Adaptive Artificial Intelligence</span></h1>
        <p className="lp-description">Instantly transform your text documents into multiple-choice quizzes. 
    Learn more effectively with difficulty levels that automatically adapt 
    to your skill and performance.</p>
      </section>
    </div>
  );
};

export default LandingPage;
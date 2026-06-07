import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage'; 
import QuizPage from './pages/QuizPage';
import EvaluationPage from './pages/EvaluationPage';
import ReviewPage from './pages/ReviewPage';
import HistoryPage from './pages/HistoryPage';
import TesKemampuanAwal from './pages/TestKemampuanAwal'
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/test-kemampuan-awal" element={<TesKemampuanAwal/>} />
        <Route path="/home" element={<HomePage />} /> 
        <Route path="/quiz" element={<QuizPage />} />
        
        {/* --- RUTE DINAMIS BARU --- */}
        <Route path="/sessions/:session_id/summary" element={<EvaluationPage />} />
        <Route path="/sessions/:session_id/review" element={<ReviewPage />} />
        
        <Route path="/history" element={<HistoryPage />} />
        
        {/* Fallback route untuk URL yang tidak ditemukan */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
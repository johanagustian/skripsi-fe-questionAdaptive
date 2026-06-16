import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, FileText, Inbox } from 'lucide-react';
import LogoutOverlay from '../components/LogoutOverlay';
import { getHistorySessions } from '../../utils/api';

const HistoryPage = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const historyResult = await getHistorySessions();
                const historyArray = Array.isArray(historyResult?.data) ? historyResult.data : [];
                setHistoryData(historyArray);
            } catch (err) {
                console.warn("Gagal memuat history:", err.message);
                setHistoryData([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="hist-page-wrapper">
            <div className="hist-container">
                <header className="hist-header">
                    <button className="btn-back" onClick={() => navigate('/home')}>
                        <ChevronLeft size={20} /> Kembali
                    </button>
                    <h1 className="hist-title">Semua Riwayat Latihan</h1>
                    <p className="hist-subtitle">
                        Pantau seluruh perkembangan hasil belajar kamu dari awal hingga saat ini.
                    </p>
                </header>

                <div className="hist-list">
                    {isLoading ? (
                        <div className="hist-loading-state">
                            <p>Memuat seluruh data riwayat...</p>
                        </div>
                    ) : historyData.length === 0 ? (
                        <div className="hist-empty-state">
                            <Inbox size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                            <p className="hist-empty-title">Belum ada sesi latihan.</p>
                            <p className="hist-empty-subtitle">
                                Semua sesi latihan yang sudah kamu selesaikan akan muncul di sini.
                            </p>
                        </div>
                    ) : (
                        historyData.map((item) => {
                            const shortSessionId = item.session_id ? item.session_id.split('-')[1]?.substring(0, 6) : 'Baru';
                            return (
                                <div key={item.session_id} className="hist-card">
                                    <div className="hist-card-main">
                                        <div className="hist-doc-wrapper">
                                            <FileText size={18} className="text-gray-600" />
                                            <h3 className="hist-exercise-title">
                                                {item.document_name || `Sesi Latihan (${shortSessionId})`}
                                            </h3>
                                        </div>
                                        <div className="hist-meta">
                                            <span className="meta-item">
                                                <Calendar size={14} />
                                                {new Date(item.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric', month: 'long', year: 'numeric'
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
                            );
                        })
                    )}
                </div>
            </div>

            <LogoutOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </div>
    );
};

export default HistoryPage;
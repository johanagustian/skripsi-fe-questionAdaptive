import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Menu, FileText, ChevronRight } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import LogoPDF from "../assets/LogoPDF.svg";
import LogoutOverlay from "../components/LogoutOverlay";
import { getSessionSummary } from "../../utils/api";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.step === 0) return null;
    return (
      <div
        style={{
          background: "#fff",
          padding: "12px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          border: "1px solid #e2e8f0",
        }}
      >
        <p
          style={{ margin: "0 0 8px 0", fontWeight: "bold", fontSize: "14px" }}
        >
          Soal Ke-{data.step}
        </p>
        <p style={{ margin: "4px 0", fontSize: "13px", color: "#475569" }}>
          Theta:{" "}
          <strong style={{ color: "#0f172a" }}>{data.theta_score}</strong>
        </p>
        <p
          style={{
            margin: "4px 0",
            fontSize: "13px",
            color: data.is_correct ? "#10b981" : "#ef4444",
          }}
        >
          <strong>{data.is_correct ? "Jawaban Benar" : "Jawaban Salah"}</strong>
        </p>
      </div>
    );
  }
  return null;
};

const EvaluationPage = () => {
  const navigate = useNavigate();
  const { session_id } = useParams();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await getSessionSummary(session_id);
        setSummaryData(response.data.summary);

        const rawChartData = Array.isArray(response.data.history_chart)
          ? response.data.history_chart
          : [];
        let formattedChartData = rawChartData.map((item) => ({
          step: Number(item.step),
          theta_score: Number(Number(item.theta_score).toFixed(3)),
          is_correct: item.is_correct,
        }));

        if (formattedChartData.length > 0 && formattedChartData[0].step !== 0) {
          formattedChartData = [
            { step: 0, theta_score: 0, is_correct: null },
            ...formattedChartData,
          ];
        }
        setChartData(formattedChartData);
      } catch (error) {
        alert("Gagal memuat hasil evaluasi: " + error.message);
        navigate("/home");
      } finally {
        setIsLoading(false);
      }
    };

    if (session_id) fetchSummary();
  }, [session_id, navigate]);

  if (isLoading)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Menghitung kalkulasi IRT...
      </div>
    );
  if (!summaryData) return null;

  return (
    <div className="hp-wrapper !justify-start !p-0">
      <main className="hp-container !pt-6">
        <div className="up-file-card">
          <div className="up-file-icon">
            <img src={LogoPDF} alt="PDF Icon" className="pdf-logo-img" />
          </div>
          <div className="up-file-info">
            <p className="up-file-name" style={{ fontSize: "14px" }}>
              Sesi Latihan Adaptif ({session_id.split("-")[1]?.substring(0, 8)})
            </p>
            <span className="up-file-status">Latihan Selesai</span>
          </div>
        </div>

        <section className="ev-score-section">
          <div className="hp-section-title text-center">
            <h2>Hasil Latihan</h2>
            <p>evaluasi jawaban latihan soal</p>
          </div>

          <div className="ev-score-grid">
            <div className="ev-score-card success">
              <span className="ev-score-value">
                {summaryData.total_correct}
              </span>
              <span className="ev-score-label">BENAR</span>
            </div>
            <div className="ev-score-card danger">
              <span className="ev-score-value">{summaryData.total_wrong}</span>
              <span className="ev-score-label">SALAH</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "16px",
            }}
          >
            <button
              onClick={() => navigate(`/sessions/${session_id}/review`)}
              style={{
                background: "transparent",
                border: "none",
                color: "#3b82f6",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                padding: "0",
              }}
            >
              Lihat detail jawaban <ChevronRight size={16} />
            </button>
          </div>
        </section>

        <section className="ev-graph-section">
          <div className="hp-section-title">
            <h2>Performa Grafik</h2>
            <p>
              Perubahan Kemampuan:{" "}
              <strong
                style={{
                  color:
                    summaryData.theta_delta > 0
                      ? "#10b981"
                      : summaryData.theta_delta < 0
                        ? "#ef4444"
                        : "#64748b",
                }}
              >
                {summaryData.theta_delta > 0
                  ? `+${summaryData.theta_delta}`
                  : summaryData.theta_delta}
              </strong>
            </p>
          </div>

          <div
            className="ev-chart-container"
            style={{
              marginTop: "16px",
              background: "#fff",
              padding: "20px",
              borderRadius: "16px",
            }}
          >
            {chartData.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <LineChart
                  width={600}
                  height={300}
                  data={chartData}
                  margin={{ top: 10, right: 30, left: -20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="step"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  >
                    {/* Menambahkan label sumbu X */}
                    <text
                      x="50%"
                      y="300"
                      textAnchor="middle"
                      fill="#6b7280"
                      fontSize="14"
                      fontWeight="bold"
                    >
                      Nomor Soal
                    </text>
                  </XAxis>

                  <YAxis
                    domain={[-3, 3]}
                    ticks={[-1, 0, 1]}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: "Estimasi Theta",
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle", fill: "#6b7280" },
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="theta_score"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{
                      r: 5,
                      fill: "#3b82f6",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </div>
            ) : (
              <p style={{ textAlign: "center", color: "#94a3b8" }}>
                Data grafik tidak tersedia
              </p>
            )}
          </div>
        </section>

        <button
          onClick={() => navigate("/home")}
          className="lp-button-primary !mt-8"
          style={{
            width: "100%",
            marginTop: "30px",
            marginBottom: "50px",
          }}
        >
          Kembali ke Halaman Utama
        </button>
      </main>

      <LogoutOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};

export default EvaluationPage;

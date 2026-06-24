import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Chart from "react-apexcharts";
import LogoPDF from "../assets/LogoPDF.svg";
import LogoutOverlay from "../components/LogoutOverlay";
import { getSessionSummary } from "../../utils/api";

const EvaluationPage = () => {
  const navigate = useNavigate();
  const { session_id } = useParams();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fileName, setFileName] = useState(null);
  const [chartSeries, setChartSeries] = useState([]);
  const [chartOptions, setChartOptions] = useState({
    chart: {
      type: "line",
      toolbar: { show: false },
      animations: { enabled: true, speed: 500 },
      zoom: { enabled: false },
      background: "transparent",
    },
    stroke: { curve: "monotoneCubic", width: 3 },
    colors: ["#3b82f6"], // Warna garis utama grafik (Biru)
    xaxis: {
      title: { text: "Question -", style: { fontSize: "12px", fontWeight: 500 } },
      labels: { style: { fontSize: "12px", colors: "#6b7280" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: {
        text: "Theta Score",
        style: { fontSize: "12px", fontWeight: 500 },
      },
      min: -3,
      max: 3,
      labels: { style: { fontSize: "12px", colors: "#6b7280" } },
    },
    markers: {
      size: 6,
      strokeWidth: 2,
      strokeColors: "#fff",
      hover: { size: 8 },
      // markers.discrete diisi dinamis agar ApexCharts dipaksa mengganti warna per titik kuis
      discrete: [], 
    },
    tooltip: {
      custom: ({ seriesIndex, dataPointIndex, w }) => {
        const data = w.config.series[seriesIndex].data[dataPointIndex];
        if (!data || data.step === 0) return null;
        return `<div style="padding: 10px 14px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
            <strong style="display: block; margin-bottom: 6px; font-size: 14px;">Question Number-${data.step}</strong>
            <div style="font-size: 13px; margin-bottom: 4px;">Theta: <strong>${Number(data.theta_score).toFixed(3)}</strong></div>
            <div style="font-size: 13px; color: ${data.is_correct ? "#10b981" : "#ef4444"};">${data.is_correct ? "✓ Correct Answer" : "✗ Incorrect Answer"}</div>
          </div>`;
      },
    },
    grid: { borderColor: "#e5e7eb", strokeDashArray: 3, position: "back" },
    legend: { show: false },
  });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await getSessionSummary(session_id);
        setSummaryData(response.data.summary);
        setFileName(response.data.fileName);
        
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

  // Logika perbaikan menggunakan penanda diskrit (discrete markers)
  useEffect(() => {
    if (chartData.length > 0) {
      const validData = chartData.filter((d) => d.step !== 0);
      if (validData.length === 0) return;
      
      const formattedSeriesData = validData.map((d) => ({
        x: d.step,
        y: d.theta_score,
        step: d.step,
        theta_score: d.theta_score,
        is_correct: d.is_correct,
      }));

      setChartSeries([
        {
          name: "Theta Score",
          data: formattedSeriesData,
        },
      ]);

      // Membuat array berisi penanda khusus untuk setiap indeks titik kuis
      const discreteMarkersArray = validData.map((d, index) => ({
        seriesIndex: 0,
        dataPointIndex: index,
        fillColor: d.is_correct ? "#10b981" : "#ef4444", // Hijau jika benar, Merah jika salah
        strokeColor: "#ffffff",
        size: 6
      }));

      setChartOptions((prev) => ({
        ...prev,
        markers: {
          ...prev.markers,
          discrete: discreteMarkersArray, // Masukkan ke dalam opsi discrete kustom
        },
      }));
    }
  }, [chartData]);

  if (isLoading)
    return (
      <div className="ev-loading-container">Calculating IRT results...</div>
    );
  if (!summaryData) return null;

  return (
    <div className="hp-wrapper !justify-start !p-0">
      <main className="hp-container !pt-6">
        <button className="btn-back" onClick={() => navigate("/history")}>
          <ChevronLeft size={20} /> Back
        </button>
        <div className="up-file-card">
          <div className="up-file-icon">
            <img src={LogoPDF} alt="PDF Icon" className="pdf-logo-img" />
          </div>
          <div className="up-file-info">
            <p className="up-file-name ev-file-name-display">{fileName}</p>
            <span className="up-file-status">Practice Completed</span>
          </div>
        </div>

        <section className="ev-score-section">
          <div className="hp-section-title text-center">
            <h2>Practice Results</h2>
            <p>Evaluation of your practice answers</p>
          </div>
          <div className="ev-score-grid">
            <div className="ev-score-card success">
              <span className="ev-score-value">
                {summaryData.total_correct}
              </span>
              <span className="ev-score-label">CORRECT</span>
            </div>
            <div className="ev-score-card danger">
              <span className="ev-score-value">{summaryData.total_wrong}</span>
              <span className="ev-score-label">WRONG</span>
            </div>
          </div>
          <div className="ev-detail-button-wrapper">
            <button
              className="ev-detail-link"
              onClick={() => navigate(`/sessions/${session_id}/review`)}
            >
              View Answer Details <ChevronRight size={16} />
            </button>
          </div>
        </section>

        <section className="ev-graph-section">
          <div className="hp-section-title">
            <h2>Performance Chart</h2>
            <p>
              Ability Change:{" "}
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
                {summaryData.theta_delta > 0 && !String(summaryData.theta_delta).startsWith('+')
                  ? `+${summaryData.theta_delta}`
                  : summaryData.theta_delta}
              </strong>
            </p>
          </div>
          <div className="ev-chart-wrapper">
            {chartSeries.length > 0 && chartSeries[0].data.length > 0 ? (
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="line"
                width="100%"
                height="100%"
              />
            ) : (
              <div className="ev-chart-empty-state">
                Chart data is unavailable
              </div>
            )}
          </div>
        </section>

        <button
          onClick={() => navigate("/home")}
          className="lp-button-primary ev-full-width-btn"
        >
          Back to Home
        </button>
      </main>
      <LogoutOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};

export default EvaluationPage;
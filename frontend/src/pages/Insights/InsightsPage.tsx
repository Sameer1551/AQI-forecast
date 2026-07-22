import { useState } from 'react';
import { useInsights } from '@/hooks/useInsights';
import Card from '@/components/ui/Card';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import ResearchModePanel from './ResearchModePanel';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle, AlertTriangle, Cpu, Calendar, Database, Leaf } from 'lucide-react';
import styles from './InsightsPage.module.css';

const RMSE_COLORS = ['hsl(190,90%,55%)', 'hsl(215,80%,60%)', 'hsl(28,96%,53%)', 'hsl(142,71%,45%)', 'hsl(265,70%,65%)', 'hsl(0,72%,51%)'];

export default function InsightsPage() {
  const { data: insights, isLoading } = useInsights();
  const [researchMode, setResearchMode] = useState(false);

  if (isLoading || !insights) {
    return (
      <div className={styles.loading}>
        <SkeletonLoader width="100%" height="100px" />
        <SkeletonLoader width="100%" height="200px" />
      </div>
    );
  }

  const rmseData = Object.entries(insights.rmse_by_pollutant).map(([name, value]) => ({
    name: name.toUpperCase(),
    value,
  }));

  const horizons = [
    { key: '1h', label: '1h', data: insights.coverage_by_horizon['1h'] },
    { key: '6h', label: '6h', data: insights.coverage_by_horizon['6h'] },
    { key: '24h', label: '24h', data: insights.coverage_by_horizon['24h'] },
    { key: '168h', label: '168h', data: insights.coverage_by_horizon['168h'] },
  ];

  return (
    <div className={styles.page}>
      <Card className={styles.modelCard}>
        <div className={styles.modelHeader}>
          <h2>MAADG Transformer v{insights.model_version}</h2>
          <span className={styles.archBadge}>GATv2 + Pre-LN Transformer + CQR Conformal Calibration</span>
        </div>
        <div className={styles.modelInfo}>
          <div className={styles.infoItem}>
            <Calendar size={14} />
            <span>Training: {insights.dataset_period}</span>
          </div>
          <div className={styles.infoItem}>
            <Database size={14} />
            <span>{insights.n_cities} cities · {insights.n_stations} stations</span>
          </div>
          <div className={styles.infoItem}>
            <Cpu size={14} />
            <span>~4.2 GPU-hours (NVIDIA T4)</span>
          </div>
          <div className={styles.infoItem}>
            <Leaf size={14} />
            <span>~0.18 kg CO₂e (codecarbon)</span>
          </div>
        </div>
      </Card>

      <Card className={styles.coverageCard}>
        <h3>90% Prediction Interval Coverage</h3>
        <table className={styles.coverageTable}>
          <thead>
            <tr>
              <th>Horizon</th>
              <th>Nominal</th>
              <th>Empirical</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {horizons.map((h) => {
              const diff = h.data.empirical - h.data.nominal;
              const below = diff < -0.01;
              return (
                <tr key={h.key}>
                  <td className={styles.monoCell}>{h.label}</td>
                  <td className={styles.monoCell}>{(h.data.nominal * 100).toFixed(0)}%</td>
                  <td className={styles.monoCell}>{(h.data.empirical * 100).toFixed(1)}%</td>
                  <td>
                    {below ? (
                      <span className={styles.statusWarning}>
                        <AlertTriangle size={14} /> Below nominal
                      </span>
                    ) : (
                      <span className={styles.statusOk}>
                        <CheckCircle size={14} /> OK
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className={styles.note}>Coverage measured on 2026-Q1 holdout set (3 months, 6 cities)</p>
      </Card>

      <Card className={styles.rmseCard}>
        <h3>Forecast Accuracy (RMSE by Pollutant)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={rmseData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={500}>
              {rmseData.map((_, i) => (
                <Cell key={i} fill={RMSE_COLORS[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className={styles.extremeGrid}>
        <Card className={styles.extremeCard}>
          <h3>Extreme Event Precision</h3>
          <div className={styles.gaugeWrap}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="var(--accent-cyan)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${insights.extreme_event_precision * 314} 314`}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dasharray 800ms ease-out' }}
              />
              <text x="60" y="65" textAnchor="middle" fill="var(--text-primary)" fontSize="22" fontFamily="JetBrains Mono" fontWeight="700">
                {(insights.extreme_event_precision * 100).toFixed(0)}%
              </text>
            </svg>
          </div>
          <p className={styles.extremeCaption}>Detecting AQI &gt; 200 events in 24h forecast horizon</p>
        </Card>
        <Card className={styles.extremeCard}>
          <h3>Extreme Event Recall</h3>
          <div className={styles.gaugeWrap}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="var(--accent-blue)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${insights.extreme_event_recall * 314} 314`}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dasharray 800ms ease-out' }}
              />
              <text x="60" y="65" textAnchor="middle" fill="var(--text-primary)" fontSize="22" fontFamily="JetBrains Mono" fontWeight="700">
                {(insights.extreme_event_recall * 100).toFixed(0)}%
              </text>
            </svg>
          </div>
          <p className={styles.extremeCaption}>Detecting AQI &gt; 200 events in 24h forecast horizon</p>
        </Card>
      </div>

      <div className={styles.researchToggle}>
        <label className={styles.toggle}>
          <input type="checkbox" checked={researchMode} onChange={(e) => setResearchMode(e.target.checked)} />
          <span className={styles.toggleSlider} />
          <span className={styles.toggleLabel}>Research Mode</span>
        </label>
      </div>

      {researchMode && <ResearchModePanel />}
    </div>
  );
}

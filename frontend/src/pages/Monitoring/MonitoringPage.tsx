import { useDrift } from '@/hooks/useDrift';
import Card from '@/components/ui/Card';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import StatusDot from '@/components/ui/StatusDot';
import MAEChart from '@/components/charts/MAEChart';
import LatencyHistogram from '@/components/charts/LatencyHistogram';
import InfraGrid from './InfraGrid';
import { formatTimestamp, formatShortDate } from '@/utils/formatters';
import { AlertTriangle, AlertOctagon, CheckCircle } from 'lucide-react';
import styles from './MonitoringPage.module.css';

export default function MonitoringPage() {
  const { data: drift, isLoading } = useDrift();

  if (isLoading || !drift) {
    return (
      <div className={styles.loading}>
        <SkeletonLoader width="100%" height="60px" />
        <SkeletonLoader width="100%" height="200px" />
      </div>
    );
  }

  const isWarning = drift.status === 'warning';
  const isAlert = drift.status === 'alert';
  const psiPercent = Math.min(100, (drift.psi / 0.3) * 100);

  return (
    <div className={styles.page}>
      <div className={`${styles.driftBanner} ${isWarning ? styles.bannerWarning : ''} ${isAlert ? styles.bannerAlert : ''}`}>
        {drift.status === 'ok' && <CheckCircle size={20} />}
        {isWarning && <AlertTriangle size={20} />}
        {isAlert && <AlertOctagon size={20} />}
        <span>
          {drift.status === 'ok' && `System Nominal — No drift detected. PSI: ${drift.psi.toFixed(2)}`}
          {isWarning && `Drift Warning — PSI: ${drift.psi.toFixed(2)} exceeds threshold 0.10`}
          {isAlert && 'Drift Alert — Model retraining recommended immediately'}
        </span>
      </div>

      <div className={styles.metricsGrid}>
        <Card className={styles.metricCard}>
          <span className={styles.metricLabel}>Drift PSI</span>
          <div className={styles.psiGauge}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="var(--bg-elevated)" strokeWidth="6" />
              <circle
                cx="40"
                cy="40"
                r="32"
                fill="none"
                stroke={isAlert ? 'var(--status-error)' : isWarning ? 'var(--status-warning)' : 'var(--status-ok)'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${psiPercent * 2.01} 201`}
                transform="rotate(-90 40 40)"
                style={{ transition: 'stroke-dasharray 800ms ease-out' }}
              />
              <text x="40" y="44" textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontFamily="JetBrains Mono" fontWeight="700">
                {drift.psi.toFixed(2)}
              </text>
            </svg>
          </div>
          <span className={styles.psiStatus} style={{ color: isWarning ? 'var(--status-warning)' : isAlert ? 'var(--status-error)' : 'var(--status-ok)' }}>
            {drift.status.toUpperCase()}
          </span>
        </Card>

        <Card className={styles.metricCard}>
          <span className={styles.metricLabel}>ADWIN Triggered</span>
          <div className={styles.badgeWrap}>
            <span className={`${styles.bigBadge} ${drift.adwin_triggered ? styles.badgeRed : styles.badgeGreen}`}>
              {drift.adwin_triggered ? 'YES' : 'NO'}
            </span>
          </div>
        </Card>

        <Card className={styles.metricCard}>
          <span className={styles.metricLabel}>Last Retrain</span>
          <span className={styles.metricValue}>{formatShortDate(drift.last_retrain)}</span>
          <span className={styles.metricSub}>{formatTimestamp(drift.last_retrain)}</span>
        </Card>

        <Card className={styles.metricCard}>
          <span className={styles.metricLabel}>Model Version</span>
          <span className={styles.metricValue}>v{drift.status ? '2.1.0' : '2.1.0'}</span>
          <StatusDot status="ok" size={6} label="Loaded" />
        </Card>
      </div>

      <InfraGrid />

      <Card className={styles.chartCard}>
        <h3>Rolling 7-Day Mean Absolute Error — PM2.5 (µg/m³)</h3>
        <MAEChart />
        <p className={styles.chartNote}>
          The upward trend in MAE explains the current "warning" drift status.
        </p>
      </Card>

      <Card className={styles.chartCard}>
        <h3>Inference Latency Distribution (last 100 requests)</h3>
        <LatencyHistogram />
      </Card>
    </div>
  );
}

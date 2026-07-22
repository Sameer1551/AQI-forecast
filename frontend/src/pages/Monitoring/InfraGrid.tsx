import Card from '@/components/ui/Card';
import StatusDot from '@/components/ui/StatusDot';
import { Server, Brain, Database, GitBranch, GitCommit, Rocket } from 'lucide-react';
import styles from './InfraGrid.module.css';

const COMPONENTS = [
  { icon: Server, name: 'FastAPI Service', status: 'Online', detail: '48ms avg latency' },
  { icon: Brain, name: 'ONNX Model', status: 'Loaded', detail: '24MB · v2.1.0' },
  { icon: Database, name: 'Feature Store', status: 'Online', detail: 'last write 5min ago' },
  { icon: GitBranch, name: 'MLflow Tracking', status: 'Online', detail: '142 runs logged' },
  { icon: GitCommit, name: 'DVC Versioning', status: 'Current', detail: 'data hash a3f91b2' },
  { icon: Rocket, name: 'CI/CD Pipeline', status: 'Passing', detail: 'last build 2h ago' },
];

function getStatusDot(status: string): 'ok' | 'warning' | 'error' {
  if (['Online', 'Loaded', 'Current', 'Passing'].includes(status)) return 'ok';
  if (['Degraded'].includes(status)) return 'warning';
  return 'error';
}

export default function InfraGrid() {
  return (
    <div className={styles.grid}>
      {COMPONENTS.map((comp) => {
        const Icon = comp.icon;
        return (
          <Card key={comp.name} className={styles.card} hover>
            <div className={styles.header}>
              <Icon size={18} className={styles.icon} />
              <span className={styles.name}>{comp.name}</span>
            </div>
            <div className={styles.statusRow}>
              <StatusDot status={getStatusDot(comp.status)} size={8} label={comp.status} />
            </div>
            <span className={styles.detail}>{comp.detail}</span>
          </Card>
        );
      })}
    </div>
  );
}

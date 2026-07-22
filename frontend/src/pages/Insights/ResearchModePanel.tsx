import Card from '@/components/ui/Card';
import styles from './ResearchModePanel.module.css';

const EQUATIONS = [
  {
    title: 'Equation 1 — Physics Prior',
    formula: 'w̃ᵢⱼ,ₜ = max(0, cos(φᵢⱼ − θ_wind,t)) · log(1+u_t) · exp(−dᵢⱼ/50) / (1 + b_t/1000) · exp(−0.15·p_t)',
    vars: [
      'φᵢⱼ — bearing from station i to j',
      'θ_wind,t — wind direction at time t',
      'u_t — wind speed at time t',
      'dᵢⱼ — distance between stations i and j (km)',
      'b_t — boundary layer height at time t (m)',
      'p_t — precipitation rate at time t (mm/h)',
    ],
  },
  {
    title: 'Equation 2 — Learned Edge Weight',
    formula: 'wᵢⱼ,ₜ = σ(MLP([eᵢⱼ,ₜ ‖ v_r]))',
    vars: [
      'eᵢⱼ,ₜ — edge feature vector (physics prior + distance + land use + traffic)',
      'v_r — learned relation embedding for relation type r',
      'σ — sigmoid activation',
      'MLP — 2-layer multilayer perceptron with hidden dim 64',
    ],
  },
  {
    title: 'Equation 3 — Probabilistic Output',
    formula: 'q̂ᵢ,p,h,τ = w^T_(p,h,τ) · z_fused_i + b_(p,h,τ)',
    vars: [
      'z_fused_i — GATv2-fused node representation for station i',
      'w_(p,h,τ) — quantile-specific weight vector',
      'b_(p,h,τ) — quantile-specific bias',
      'τ — quantile level (0.05, 0.5, 0.95)',
      'p — pollutant, h — forecast horizon',
    ],
  },
];

export default function ResearchModePanel() {
  return (
    <Card className={styles.panel}>
      <h3 className={styles.title}>Core MAADG Equations</h3>
      <div className={styles.equations}>
        {EQUATIONS.map((eq, i) => (
          <div key={i} className={styles.equation}>
            <div className={styles.eqTitle}>{eq.title}</div>
            <div className={styles.formula}>{eq.formula}</div>
            <ul className={styles.vars}>
              {eq.vars.map((v, j) => (
                <li key={j}>{v}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

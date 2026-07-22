import { useState } from 'react';
import { useStations } from '@/hooks/useStations';
import { useGraph } from '@/hooks/useGraph';
import { useAppStore } from '@/store/appStore';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import GraphCanvas from './GraphCanvas';
import GraphControls from './GraphControls';
import { ChevronDown, ChevronUp } from 'lucide-react';
import styles from './GraphExplorer.module.css';

export default function GraphExplorer() {
  const { data: stations } = useStations();
  const selectedCity = useAppStore((s) => s.selectedCity);
  const activeLayers = useAppStore((s) => s.activeRelationLayers);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const cityStation = stations?.find((s) => s.city === selectedCity);
  const { data: graphData, isLoading } = useGraph(cityStation?.id ?? 1);

  return (
    <div className={styles.page}>
      <div className={styles.mainLayout}>
        <div className={styles.canvasArea}>
          {isLoading || !graphData ? (
            <div className={styles.canvasLoading}>
              <SkeletonLoader width="100%" height="100%" borderRadius="12px" />
            </div>
          ) : (
            <GraphCanvas data={graphData} activeLayers={activeLayers} />
          )}
        </div>
        <div className={styles.controlsArea}>
          {graphData ? (
            <GraphControls data={graphData} />
          ) : (
            <div className={styles.controlsLoading}>
              <SkeletonLoader width="100%" height="200px" />
            </div>
          )}
        </div>
      </div>

      <div className={styles.howItWorks}>
        <button className={styles.howHeader} onClick={() => setShowHowItWorks(!showHowItWorks)}>
          <span>How MAADG Works</span>
          {showHowItWorks ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showHowItWorks && (
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNum}>1</div>
              <div className={styles.stepContent}>
                <h3>Physics Prior</h3>
                <p>Wind direction determines which stations influence each other. The bearing between stations is compared to wind direction to compute a physics-based prior weight.</p>
                <div className={styles.stepDiagram}>
                  <svg width="100" height="60" viewBox="0 0 100 60">
                    <circle cx="20" cy="30" r="6" fill="var(--accent-cyan)" />
                    <circle cx="80" cy="30" r="6" fill="var(--accent-blue)" />
                    <path d="M 26 30 L 74 30" stroke="var(--accent-cyan)" strokeWidth="2" markerEnd="url(#arrow)" />
                    <path d="M 50 10 L 50 50" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="55" y="20" fill="var(--text-muted)" fontSize="8">θ</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNum}>2</div>
              <div className={styles.stepContent}>
                <h3>Edge Scoring</h3>
                <p>An edge feature vector (distance, wind alignment, land use, traffic) is passed through an MLP to learn the final edge weight for each relation type.</p>
                <div className={styles.stepDiagram}>
                  <svg width="120" height="60" viewBox="0 0 120 60">
                    <rect x="5" y="20" width="20" height="20" rx="3" fill="var(--bg-elevated)" stroke="var(--accent-cyan)" />
                    <text x="15" y="33" textAnchor="middle" fill="var(--text-muted)" fontSize="7">eᵢⱼ</text>
                    <path d="M 25 30 L 50 30" stroke="var(--text-muted)" strokeWidth="1" />
                    <rect x="50" y="15" width="25" height="30" rx="3" fill="var(--bg-elevated)" stroke="var(--accent-blue)" />
                    <text x="62" y="33" textAnchor="middle" fill="var(--accent-blue)" fontSize="7">MLP</text>
                    <path d="M 75 30 L 100 30" stroke="var(--text-muted)" strokeWidth="1" markerEnd="url(#arrow)" />
                    <text x="88" y="25" textAnchor="middle" fill="var(--accent-cyan)" fontSize="8">wᵢⱼ</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNum}>3</div>
              <div className={styles.stepContent}>
                <h3>Graph Attention</h3>
                <p>GATv2 layers aggregate information across the dynamic graph, producing a fused representation for each station that feeds the forecast head.</p>
                <div className={styles.stepDiagram}>
                  <svg width="120" height="60" viewBox="0 0 120 60">
                    <circle cx="15" cy="15" r="5" fill="var(--accent-cyan)" />
                    <circle cx="15" cy="45" r="5" fill="var(--accent-blue)" />
                    <circle cx="55" cy="30" r="7" fill="var(--accent-purple)" />
                    <circle cx="100" cy="30" r="5" fill="var(--aqi-moderate)" />
                    <path d="M 20 17 L 48 28" stroke="var(--text-muted)" strokeWidth="1" />
                    <path d="M 20 43 L 48 32" stroke="var(--text-muted)" strokeWidth="1" />
                    <path d="M 62 30 L 95 30" stroke="var(--accent-cyan)" strokeWidth="2" markerEnd="url(#arrow)" />
                    <text x="60" y="50" textAnchor="middle" fill="var(--text-muted)" fontSize="7">GATv2</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

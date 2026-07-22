import { useRef, useEffect, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { GraphData, GraphNode, GraphEdge } from '@/types/Graph';
import { getAQIColorHSL, getEdgeColorHSL } from '@/utils/aqiColors';
import { mockStations } from '@/mock/mockStations';
import styles from './GraphCanvas.module.css';

interface GraphCanvasProps {
  data: GraphData;
  activeLayers: string[];
}

interface NodeWithExtra extends GraphNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
}

export default function GraphCanvas({ data, activeLayers }: GraphCanvasProps) {
  const fgRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);
  const particleStateRef = useRef<Record<string, number>>({});

  const stationMap = new Map(mockStations.map((s) => [s.id, s]));

  const filteredEdges = data.edges.filter((e) => activeLayers.includes(e.relation_type));

  const graphData = {
    nodes: data.nodes.map((n) => ({ ...n })),
    links: filteredEdges.map((e) => ({
      ...e,
      source: e.source,
      target: e.target,
    })),
  };

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-300);
      fgRef.current.d3Force('link').distance(120);
      fgRef.current.d3Reheat();
    }
  }, [data]);

  const nodeCanvasObject = useCallback((node: NodeWithExtra, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const aqi = node.aqi;
    const color = getAQIColorHSL(aqi);
    const radius = Math.min(24, Math.max(8, 8 + (aqi / 500) * 16));
    const isHazard = aqi > 200;

    const x = node.x ?? 0;
    const y = node.y ?? 0;

    // Pulsing ring for hazardous nodes
    if (isHazard) {
      const pulseRadius = radius + 4 + Math.sin(Date.now() / 400) * 4;
      ctx.beginPath();
      ctx.arc(x, y, pulseRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Node fill
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Label
    const fontSize = 10 / globalScale;
    ctx.font = `${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(node.name, x, y + radius + fontSize + 2);
  }, []);

  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const sourceNode = link.source as NodeWithExtra;
    const targetNode = link.target as NodeWithExtra;
    if (sourceNode.x === undefined || targetNode.x === undefined) return;

    const x1 = sourceNode.x ?? 0;
    const y1 = sourceNode.y ?? 0;
    const x2 = targetNode.x ?? 0;
    const y2 = targetNode.y ?? 0;

    const color = getEdgeColorHSL(link.relation_type);
    const thickness = Math.max(1, link.weight * 4);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = thickness;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Draw arrowhead
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowLen = 8 / globalScale;
    const arrowAngle = Math.PI / 6;
    const nodeRadius = Math.min(24, Math.max(8, 8 + ((targetNode.aqi ?? 0) / 500) * 16));
    const tipX = x2 - Math.cos(angle) * (nodeRadius + 2);
    const tipY = y2 - Math.sin(angle) * (nodeRadius + 2);

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - Math.cos(angle - arrowAngle) * arrowLen,
      tipY - Math.sin(angle - arrowAngle) * arrowLen
    );
    ctx.lineTo(
      tipX - Math.cos(angle + arrowAngle) * arrowLen,
      tipY - Math.sin(angle + arrowAngle) * arrowLen
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Flow particles
    const edgeKey = `${link.source.id ?? link.source}_${link.target.id ?? link.target}`;
    if (!particleStateRef.current[edgeKey]) {
      particleStateRef.current[edgeKey] = Math.random();
    }
    const particleSpeed = 0.0005 + link.weight * 0.0005;
    particleStateRef.current[edgeKey] += particleSpeed * 16;
    if (particleStateRef.current[edgeKey] > 1) particleStateRef.current[edgeKey] -= 1;

    const numParticles = Math.ceil(link.weight * 3);
    for (let i = 0; i < numParticles; i++) {
      const t = (particleStateRef.current[edgeKey] + i / numParticles) % 1;
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;
      const particleRadius = 2.5 / globalScale;

      ctx.beginPath();
      ctx.arc(px, py, particleRadius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, []);

  // Continuous animation loop for particles
  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      if (fgRef.current) {
        fgRef.current.centerAt(0, 0, 1);
      }
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const nodePointerAreaPaint = useCallback((node: NodeWithExtra, color: string, ctx: CanvasRenderingContext2D) => {
    const radius = Math.min(24, Math.max(8, 8 + (node.aqi / 500) * 16));
    ctx.beginPath();
    ctx.arc(node.x ?? 0, node.y ?? 0, radius + 4, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }, []);

  return (
    <div className={styles.canvas}>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        nodePointerAreaPaint={nodePointerAreaPaint}
        backgroundColor="hsl(220, 40%, 8%)"
        width={800}
        height={600}
        cooldownTicks={100}
        onNodeClick={(node: any) => {
          const station = stationMap.get(node.id);
          if (station) {
            console.log('Clicked:', station.name, 'AQI:', station.current_aqi);
          }
        }}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </div>
  );
}

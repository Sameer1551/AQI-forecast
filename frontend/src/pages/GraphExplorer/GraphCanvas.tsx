import { useRef, useEffect, useCallback } from 'react';
import { forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide } from 'd3-force';
import type { GraphData, GraphNode, GraphEdge } from '@/types/Graph';
import { getAQIColorHSL, getEdgeColorHSL } from '@/utils/aqiColors';
import styles from './GraphCanvas.module.css';

interface GraphCanvasProps {
  data: GraphData;
  activeLayers: string[];
}

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number;
  fy?: number;
}

interface SimLink {
  source: SimNode;
  target: SimNode;
  edge: GraphEdge;
  particlePhase: number;
}

export default function GraphCanvas({ data, activeLayers }: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<ReturnType<typeof forceSimulation<SimNode, SimLink>> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const rafRef = useRef<number>(0);
  const dimsRef = useRef({ width: 800, height: 600 });
  const dragRef = useRef<{ node: SimNode | null; offsetX: number; offsetY: number }>({ node: null, offsetX: 0, offsetY: 0 });
  const panRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const zoomRef = useRef<number>(1);
  const lastPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const filteredEdges = data.edges.filter((e) => activeLayers.includes(e.relation_type));

  const initSimulation = useCallback(() => {
    const { width, height } = dimsRef.current;

    const nodes: SimNode[] = data.nodes.map((n, i) => {
      const angle = (i / data.nodes.length) * Math.PI * 2;
      const r = Math.min(width, height) * 0.25;
      return {
        ...n,
        x: width / 2 + Math.cos(angle) * r,
        y: height / 2 + Math.sin(angle) * r,
        vx: 0,
        vy: 0,
      };
    });

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const links: SimLink[] = filteredEdges.map((e) => ({
      source: nodeMap.get(e.source)!,
      target: nodeMap.get(e.target)!,
      edge: e,
      particlePhase: Math.random(),
    }));

    nodesRef.current = nodes;
    linksRef.current = links;

    const sim = forceSimulation<SimNode, SimLink>(nodes)
      .force('charge', forceManyBody().strength(-400))
      .force('link', forceLink<SimNode, SimLink>(links).id((d) => d.id).distance(140).strength(0.3))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide<SimNode>().radius((d) => nodeRadius(d.aqi) + 8))
      .alpha(1)
      .alphaDecay(0.02);

    sim.on('tick', () => {
      // simulation positions updated in refs; rendering handled by RAF loop
    });

    simRef.current = sim;
  }, [data, filteredEdges]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimsRef.current;
    const pan = panRef.current;
    const zoom = zoomRef.current;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'hsl(220, 40%, 8%)';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);

    const now = Date.now();

    // Draw links
    for (const link of linksRef.current) {
      const s = link.source;
      const t = link.target;
      if (s.x == null || s.y == null || t.x == null || t.y == null) continue;

      const color = getEdgeColorHSL(link.edge.relation_type);
      const lw = Math.max(1, link.edge.weight * 4);

      // Base line
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = lw;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Arrowhead
      const angle = Math.atan2(t.y - s.y, t.x - s.x);
      const arrowLen = 8;
      const arrowPos = 0.85;
      const ax = s.x + (t.x - s.x) * arrowPos;
      const ay = s.y + (t.y - s.y) * arrowPos;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - arrowLen * Math.cos(angle - 0.4), ay - arrowLen * Math.sin(angle - 0.4));
      ctx.lineTo(ax - arrowLen * Math.cos(angle + 0.4), ay - arrowLen * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Animated particles — glowing dots moving source → target
      const speed = 0.004 + link.edge.weight * 0.004;
      const pCount = 4;
      const pSize = Math.max(2, link.edge.weight * 3);
      for (let i = 0; i < pCount; i++) {
        const phase = ((now * speed + link.particlePhase + i / pCount) % 1);
        const px = s.x + (t.x - s.x) * phase;
        const py = s.y + (t.y - s.y) * phase;
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Draw nodes
    for (const node of nodesRef.current) {
      if (node.x == null || node.y == null) continue;
      const color = getAQIColorHSL(node.aqi);
      const r = nodeRadius(node.aqi);

      // Pulse ring for hazardous nodes
      if (node.aqi > 200) {
        const pulseR = r + 4 + Math.sin(now / 400) * 4;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseR, 0, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Node circle with glow
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(node.name, node.x, node.y + r + 14);
    }

    ctx.restore();

    rafRef.current = requestAnimationFrame(render);
  }, []);

  // Setup canvas size via ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        dimsRef.current = { width: rect.width, height: rect.height };
        const canvas = canvasRef.current;
        if (canvas) {
          const dpr = window.devicePixelRatio || 1;
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          canvas.style.width = `${rect.width}px`;
          canvas.style.height = `${rect.height}px`;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.scale(dpr, dpr);
        }
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Init/restart simulation when data changes
  useEffect(() => {
    initSimulation();
    return () => {
      if (simRef.current) simRef.current.stop();
    };
  }, [initSimulation]);

  // Start render loop
  useEffect(() => {
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  // Pointer interaction: drag nodes, pan, zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPointerPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const findNodeAt = (px: number, py: number): SimNode | null => {
      const { width, height } = dimsRef.current;
      const pan = panRef.current;
      const zoom = zoomRef.current;
      // transform screen → world
      const wx = ((px - (width / 2 + pan.x)) / zoom) + width / 2;
      const wy = ((py - (height / 2 + pan.y)) / zoom) + height / 2;
      for (const node of nodesRef.current) {
        const r = nodeRadius(node.aqi);
        if (node.x != null && node.y != null) {
          const dx = wx - node.x;
          const dy = wy - node.y;
          if (dx * dx + dy * dy <= (r + 6) * (r + 6)) return node;
        }
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      const { x, y } = getPointerPos(e);
      const node = findNodeAt(x, y);
      if (node) {
        canvas.setPointerCapture(e.pointerId);
        const { width, height } = dimsRef.current;
        const pan = panRef.current;
        const zoom = zoomRef.current;
        const wx = ((x - (width / 2 + pan.x)) / zoom) + width / 2;
        const wy = ((y - (height / 2 + pan.y)) / zoom) + height / 2;
        dragRef.current = { node, offsetX: wx - node.x!, offsetY: wy - node.y! };
        node.fx = node.x;
        node.fy = node.y;
      } else {
        panRef.current.active = true;
        lastPanRef.current = { x: e.clientX, y: e.clientY };
        canvas.setPointerCapture(e.pointerId);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (dragRef.current.node) {
        const { x, y } = getPointerPos(e);
        const { width, height } = dimsRef.current;
        const pan = panRef.current;
        const zoom = zoomRef.current;
        const wx = ((x - (width / 2 + pan.x)) / zoom) + width / 2;
        const wy = ((y - (height / 2 + pan.y)) / zoom) + height / 2;
        dragRef.current.node.fx = wx - dragRef.current.offsetX;
        dragRef.current.node.fy = wy - dragRef.current.offsetY;
        if (simRef.current) simRef.current.alpha(0.5).restart();
      } else if (panRef.current.active) {
        panRef.current.x += e.clientX - lastPanRef.current.x;
        panRef.current.y += e.clientY - lastPanRef.current.y;
        lastPanRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (dragRef.current.node) {
        dragRef.current.node.fx = undefined;
        dragRef.current.node.fy = undefined;
        dragRef.current.node = null;
      }
      panRef.current.active = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      zoomRef.current = Math.max(0.3, Math.min(4, zoomRef.current * factor));
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, []);

  return (
    <div className={styles.canvas} ref={containerRef} style={{ flex: 1, overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}

function nodeRadius(aqi: number): number {
  return Math.min(24, Math.max(8, 8 + (aqi / 500) * 16));
}

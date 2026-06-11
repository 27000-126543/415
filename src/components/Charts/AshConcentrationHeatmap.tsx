import { useMemo } from 'react';
import type { GridPoint } from '../../../shared/types';

interface AshConcentrationHeatmapProps {
  data: GridPoint[];
  aviationThreshold?: number;
  showGrid?: boolean;
  className?: string;
}

const AVIATION_SAFETY_THRESHOLD = 2;

function getConcentrationColor(value: number, max: number): string {
  const ratio = Math.min(value / max, 1);
  if (ratio < 0.2) return `rgba(30, 64, 175, ${0.3 + ratio * 2})`;
  if (ratio < 0.4) return `rgba(6, 182, 212, ${0.4 + ratio})`;
  if (ratio < 0.6) return `rgba(250, 204, 21, ${0.5 + ratio * 0.5})`;
  if (ratio < 0.8) return `rgba(249, 115, 22, ${0.6 + ratio * 0.3})`;
  return `rgba(239, 68, 68, ${0.7 + ratio * 0.3})`;
}

export default function AshConcentrationHeatmap({
  data,
  aviationThreshold = AVIATION_SAFETY_THRESHOLD,
  showGrid = true,
  className,
}: AshConcentrationHeatmapProps) {
  const { gridData, maxValue, bounds, thresholdLine } = useMemo(() => {
    if (data.length === 0) {
      return { gridData: [], maxValue: 0, bounds: { minX: 0, maxX: 100, minY: 0, maxY: 100 }, thresholdLine: [] };
    }

    const xs = data.map((p) => p.x);
    const ys = data.map((p) => p.y);
    const vals = data.map((p) => p.value);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const maxValue = Math.max(...vals);

    const thresholdPoints = data.filter((p) => Math.abs(p.value - aviationThreshold) < maxValue * 0.05);

    return {
      gridData: data,
      maxValue,
      bounds: { minX, maxX, minY, maxY },
      thresholdLine: thresholdPoints,
    };
  }, [data, aviationThreshold]);

  const width = 500;
  const height = 400;
  const padding = 40;

  const scaleX = (x: number) =>
    padding + ((x - bounds.minX) / (bounds.maxX - bounds.minX || 1)) * (width - padding * 2);
  const scaleY = (y: number) =>
    height - padding - ((y - bounds.minY) / (bounds.maxY - bounds.minY || 1)) * (height - padding * 2);

  const cellSize = Math.max(
    4,
    Math.min(
      (width - padding * 2) / Math.sqrt(gridData.length || 1),
      (height - padding * 2) / Math.sqrt(gridData.length || 1)
    )
  );

  return (
    <div className={`glass-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title !mb-0">火山灰浓度分布</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded" style={{ background: 'linear-gradient(90deg, #1e40af, #06b6d4, #facc15, #f97316, #ef4444)' }} />
            <span className="text-deep-space-300">浓度梯度</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-warning-400 rounded border-dashed border border-warning-400" />
            <span className="text-deep-space-300">航空安全阈值</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="bg-deep-space-900/50 rounded-lg">
          <defs>
            <filter id="heatGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="concentrationLegend" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="25%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#facc15" />
              <stop offset="75%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {showGrid && (
            <g opacity={0.15}>
              {Array.from({ length: 11 }).map((_, i) => (
                <line
                  key={`v-${i}`}
                  x1={padding + (i * (width - padding * 2)) / 10}
                  y1={padding}
                  x2={padding + (i * (width - padding * 2)) / 10}
                  y2={height - padding}
                  stroke="#00D4AA"
                  strokeWidth={0.5}
                />
              ))}
              {Array.from({ length: 11 }).map((_, i) => (
                <line
                  key={`h-${i}`}
                  x1={padding}
                  y1={padding + (i * (height - padding * 2)) / 10}
                  x2={width - padding}
                  y2={padding + (i * (height - padding * 2)) / 10}
                  stroke="#00D4AA"
                  strokeWidth={0.5}
                />
              ))}
            </g>
          )}

          {gridData.map((point, idx) => (
            <rect
              key={idx}
              x={scaleX(point.x) - cellSize / 2}
              y={scaleY(point.y) - cellSize / 2}
              width={cellSize}
              height={cellSize}
              fill={getConcentrationColor(point.value, maxValue)}
              rx={1}
              filter="url(#heatGlow)"
            />
          ))}

          {thresholdLine.length > 0 && (
            <g>
              {thresholdLine.map((point, idx) => (
                <circle
                  key={idx}
                  cx={scaleX(point.x)}
                  cy={scaleY(point.y)}
                  r={3}
                  fill="none"
                  stroke="#F4C430"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />
              ))}
            </g>
          )}

          <g stroke="#1F4A85" strokeWidth={1}>
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} />
          </g>

          <text x={width / 2} y={height - 8} textAnchor="middle" fill="#9CB2D0" fontSize={11}>
            X 坐标 (km)
          </text>
          <text
            x={12}
            y={height / 2}
            textAnchor="middle"
            fill="#9CB2D0"
            fontSize={11}
            transform={`rotate(-90, 12, ${height / 2})`}
          >
            Y 坐标 (km)
          </text>

          {Array.from({ length: 5 }).map((_, i) => (
            <text
              key={`xt-${i}`}
              x={padding + (i * (width - padding * 2)) / 4}
              y={height - padding + 16}
              textAnchor="middle"
              fill="#7294BE"
              fontSize={10}
            >
              {(bounds.minX + (i * (bounds.maxX - bounds.minX)) / 4).toFixed(0)}
            </text>
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <text
              key={`yt-${i}`}
              x={padding - 6}
              y={height - padding - (i * (height - padding * 2)) / 4 + 3}
              textAnchor="end"
              fill="#7294BE"
              fontSize={10}
            >
              {(bounds.minY + (i * (bounds.maxY - bounds.minY)) / 4).toFixed(0)}
            </text>
          ))}

          <g transform={`translate(${padding}, ${padding - 20})`}>
            <rect width={120} height={8} fill="url(#concentrationLegend)" rx={2} />
            <text x={0} y={-2} fill="#7294BE" fontSize={9}>0</text>
            <text x={120} y={-2} fill="#7294BE" fontSize={9} textAnchor="end">{maxValue.toFixed(1)} g/m³</text>
          </g>
        </svg>
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import type { GridPoint } from '../../../shared/types';

interface ThermalRadiationMapProps {
  data: GridPoint[];
  showGrid?: boolean;
  showContours?: boolean;
  className?: string;
}

function getThermalColor(value: number, max: number): string {
  const ratio = Math.min(value / max, 1);
  const r = Math.round(30 + ratio * 225);
  const g = Math.round(20 + ratio * 80 * (1 - ratio * 0.5));
  const b = Math.round(80 * (1 - ratio));
  return `rgba(${r}, ${g}, ${b}, ${0.4 + ratio * 0.6})`;
}

export default function ThermalRadiationMap({
  data,
  showGrid = true,
  showContours = true,
  className,
}: ThermalRadiationMapProps) {
  const { gridData, maxValue, bounds } = useMemo(() => {
    if (data.length === 0) {
      return {
        gridData: [],
        maxValue: 0,
        bounds: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
      };
    }

    const xs = data.map((p) => p.x);
    const ys = data.map((p) => p.y);
    const vals = data.map((p) => p.value);

    return {
      gridData: data,
      maxValue: Math.max(...vals),
      bounds: {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      },
    };
  }, [data]);

  const width = 520;
  const height = 400;
  const padding = 45;

  const scaleX = (x: number) =>
    padding + ((x - bounds.minX) / (bounds.maxX - bounds.minX || 1)) * (width - padding * 2);
  const scaleY = (y: number) =>
    height - padding - ((y - bounds.minY) / (bounds.maxY - bounds.minY || 1)) * (height - padding * 2);

  const cols = Math.ceil(Math.sqrt(gridData.length || 1));
  const rows = Math.ceil((gridData.length || 1) / cols);
  const cellW = (width - padding * 2) / (cols || 1);
  const cellH = (height - padding * 2) / (rows || 1);
  const cellSize = Math.max(cellW, cellH);

  const contourLevels = useMemo(() => {
    if (maxValue === 0) return [];
    return [0.2, 0.4, 0.6, 0.8].map((ratio) => maxValue * ratio);
  }, [maxValue]);

  const contourPoints = useMemo(() => {
    if (!showContours || maxValue === 0) return [];
    return contourLevels.map((level) => ({
      level,
      points: gridData.filter(
        (p) => Math.abs(p.value - level) < maxValue * 0.03
      ),
    }));
  }, [gridData, contourLevels, maxValue, showContours]);

  return (
    <div className={`glass-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title !mb-0">热辐射通量云图</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded" style={{ background: 'linear-gradient(90deg, #1e3a5f, #ff6b35, #ffaa00, #ff4444)' }} />
            <span className="text-deep-space-300">辐射强度</span>
          </div>
          {showContours && (
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-lava-400 rounded border-dashed" />
              <span className="text-deep-space-300">等高线</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="bg-deep-space-950/60 rounded-lg">
          <defs>
            <radialGradient id="heatSource" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
            </radialGradient>
            <filter id="thermalGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="thermalLegend" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="30%" stopColor="#ff6b35" />
              <stop offset="65%" stopColor="#ffaa00" />
              <stop offset="100%" stopColor="#ff4444" />
            </linearGradient>
          </defs>

          <rect x={padding} y={padding} width={width - padding * 2} height={height - padding * 2} fill="url(#heatSource)" opacity={0.3} />

          {showGrid && (
            <g opacity={0.12}>
              {Array.from({ length: 13 }).map((_, i) => (
                <line
                  key={`tv-${i}`}
                  x1={padding + (i * (width - padding * 2)) / 12}
                  y1={padding}
                  x2={padding + (i * (width - padding * 2)) / 12}
                  y2={height - padding}
                  stroke="#FF6B35"
                  strokeWidth={0.5}
                />
              ))}
              {Array.from({ length: 10 }).map((_, i) => (
                <line
                  key={`th-${i}`}
                  x1={padding}
                  y1={padding + (i * (height - padding * 2)) / 9}
                  x2={width - padding}
                  y2={padding + (i * (height - padding * 2)) / 9}
                  stroke="#FF6B35"
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
              fill={getThermalColor(point.value, maxValue)}
              rx={0}
              filter="url(#thermalGlow)"
            />
          ))}

          {contourPoints.map((contour, cIdx) => (
            <g key={cIdx}>
              {contour.points.map((point, pIdx) => (
                <circle
                  key={pIdx}
                  cx={scaleX(point.x)}
                  cy={scaleY(point.y)}
                  r={2}
                  fill="none"
                  stroke={`rgba(255, 170, 0, ${0.3 + (cIdx + 1) * 0.15})`}
                  strokeWidth={1}
                />
              ))}
            </g>
          ))}

          <g stroke="#2E5E9E" strokeWidth={1}>
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} />
            <line x1={width - padding} y1={padding} x2={width - padding} y2={height - padding} />
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} />
          </g>

          <text x={width / 2} y={height - 10} textAnchor="middle" fill="#9CB2D0" fontSize={11}>
            经度 X (°)
          </text>
          <text
            x={14}
            y={height / 2}
            textAnchor="middle"
            fill="#9CB2D0"
            fontSize={11}
            transform={`rotate(-90, 14, ${height / 2})`}
          >
            纬度 Y (°)
          </text>

          {Array.from({ length: 5 }).map((_, i) => (
            <text
              key={`tx-${i}`}
              x={padding + (i * (width - padding * 2)) / 4}
              y={height - padding + 18}
              textAnchor="middle"
              fill="#7294BE"
              fontSize={10}
            >
              {(bounds.minX + (i * (bounds.maxX - bounds.minX)) / 4).toFixed(1)}
            </text>
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <text
              key={`ty-${i}`}
              x={padding - 8}
              y={height - padding - (i * (height - padding * 2)) / 4 + 4}
              textAnchor="end"
              fill="#7294BE"
              fontSize={10}
            >
              {(bounds.minY + (i * (bounds.maxY - bounds.minY)) / 4).toFixed(1)}
            </text>
          ))}

          <g transform={`translate(${padding}, ${padding - 22})`}>
            <rect width={160} height={8} fill="url(#thermalLegend)" rx={2} />
            <text x={0} y={-3} fill="#7294BE" fontSize={9}>0</text>
            <text x={160} y={-3} fill="#7294BE" fontSize={9} textAnchor="end">
              {maxValue.toFixed(1)} kW/m²
            </text>
          </g>

          <text x={width - padding} y={padding - 25} textAnchor="end" fill="#7294BE" fontSize={9} fontFamily="monospace">
            单位: kW/m²
          </text>
        </svg>
      </div>
    </div>
  );
}

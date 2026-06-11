import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { GridPoint } from '../../../shared/types';

interface SettlementThicknessChartProps {
  data: GridPoint[];
  className?: string;
}

function getThicknessColor(value: number, max: number): string {
  const ratio = Math.min(value / max, 1);
  if (ratio < 0.25) return '#2E5E9E';
  if (ratio < 0.5) return '#00B08C';
  if (ratio < 0.75) return '#F4C430';
  return '#FF6B35';
}

export default function SettlementThicknessChart({
  data,
  className,
}: SettlementThicknessChartProps) {
  const { chartData, maxThickness, regions } = useMemo(() => {
    if (data.length === 0) {
      return { chartData: [], maxThickness: 0, regions: [] as string[] };
    }

    const maxThickness = Math.max(...data.map((p) => p.value));

    const sortedData = [...data].sort((a, b) => b.value - a.value);
    const topData = sortedData.slice(0, 12);

    const chartData = topData.map((point, idx) => ({
      name: `区域 ${String.fromCharCode(65 + idx)}`,
      thickness: Number(point.value.toFixed(2)),
      x: point.x,
      y: point.y,
    }));

    const regions = chartData.map((d) => d.name);

    return { chartData, maxThickness, regions };
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: { x: number; y: number } }>; label?: string }) => {
    if (active && payload && payload.length) {
      const d = payload[0];
      return (
        <div className="glass-card px-4 py-3 border border-data-500/30">
          <p className="text-sm text-deep-space-200 mb-2 font-display font-semibold">{label}</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-deep-space-300">沉降厚度</span>
              <span className="text-data-400 font-bold font-data text-sm">{d.value} cm</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-deep-space-300">坐标 (X,Y)</span>
              <span className="text-deep-space-200 font-mono">({d.payload.x}, {d.payload.y})</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`glass-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title !mb-0">沉降厚度分布</h3>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#2E5E9E' }} />
            <span className="text-deep-space-300">轻微</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#00B08C' }} />
            <span className="text-deep-space-300">中等</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#F4C430' }} />
            <span className="text-deep-space-300">较重</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#FF6B35' }} />
            <span className="text-deep-space-300">严重</span>
          </div>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D4AA" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#00D4AA" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F4A85" strokeOpacity={0.3} vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#7294BE"
              tick={{ fill: '#9CB2D0', fontSize: 11 }}
              tickLine={{ stroke: '#1F4A85' }}
              axisLine={{ stroke: '#1F4A85' }}
            />
            <YAxis
              stroke="#7294BE"
              tick={{ fill: '#9CB2D0', fontSize: 11 }}
              tickLine={{ stroke: '#1F4A85' }}
              axisLine={{ stroke: '#1F4A85' }}
              label={{
                value: '厚度 (cm)',
                angle: -90,
                position: 'insideLeft',
                fill: '#9CB2D0',
                fontSize: 12,
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1F4A85', opacity: 0.2 }} />
            <Bar dataKey="thickness" radius={[4, 4, 0, 0]} maxBarSize={36}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getThicknessColor(entry.thickness, maxThickness)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {regions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-deep-space-700/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-deep-space-400">
              显示 Top {regions.length} 沉降区域
            </span>
            <span className="text-deep-space-400 font-data">
              最大厚度: <span className="text-lava-400 font-bold">{maxThickness.toFixed(2)} cm</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
} from 'recharts';
import type { MonitoringData } from '../../../shared/types';

interface PlumeHeightChartProps {
  data: MonitoringData[];
  threshold?: number;
  className?: string;
}

const STRATOSPHERE_THRESHOLD = 12;

export default function PlumeHeightChart({
  data,
  threshold = STRATOSPHERE_THRESHOLD,
  className,
}: PlumeHeightChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      time: new Date(item.timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      height: Number((item.plumeHeight / 1000).toFixed(2)),
      timestamp: item.timestamp,
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      const isOverThreshold = payload[0].value > threshold;
      return (
        <div className="glass-card px-4 py-3 border border-data-500/30">
          <p className="text-sm text-deep-space-200 mb-1 font-mono">{label}</p>
          <p className={`text-lg font-bold font-data ${isOverThreshold ? 'text-danger-400' : 'text-data-400'}`}>
            {payload[0].value} km
          </p>
          {isOverThreshold && (
            <p className="text-xs text-danger-400 mt-1">⚠ 超过平流层阈值</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`glass-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title !mb-0">喷发柱高度演化</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-data-400 rounded" style={{ boxShadow: '0 0 8px rgba(0, 212, 170, 0.8)' }} />
            <span className="text-deep-space-300">高度曲线</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-danger-500 rounded border-dashed border border-danger-500" />
            <span className="text-deep-space-300">平流层阈值 ({threshold}km)</span>
          </div>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <defs>
              <linearGradient id="plumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D4AA" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#00D4AA" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="dangerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E63946" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#E63946" stopOpacity={0} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F4A85" strokeOpacity={0.3} />
            <XAxis
              dataKey="time"
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
                value: '高度 (km)',
                angle: -90,
                position: 'insideLeft',
                fill: '#9CB2D0',
                fontSize: 12,
              }}
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={threshold}
              stroke="#E63946"
              strokeDasharray="8 4"
              strokeWidth={1.5}
              label={{
                value: `平流层 ${threshold}km`,
                position: 'right',
                fill: '#E63946',
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="height"
              stroke="none"
              fill="url(#dangerGradient)"
              connectNulls
            />
            <Area
              type="monotone"
              dataKey={(d) => (d.height > threshold ? null : d.height)}
              stroke="none"
              fill="url(#plumeGradient)"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="height"
              stroke="#00D4AA"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, fill: '#00D4AA', stroke: '#0A1628', strokeWidth: 2 }}
              filter="url(#glow)"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

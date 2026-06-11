import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DailyTrend } from '../../../shared/types';

interface PerformanceTrendChartProps {
  data: DailyTrend[];
  className?: string;
}

type TrendKey = 'completionRate' | 'leadTime' | 'accuracy';

interface LegendItem {
  key: TrendKey;
  label: string;
  color: string;
  unit: string;
}

const LEGEND_ITEMS: LegendItem[] = [
  { key: 'completionRate', label: '任务完成率', color: '#00D4AA', unit: '%' },
  { key: 'leadTime', label: '预警提前量', color: '#FF6B35', unit: 'h' },
  { key: 'accuracy', label: '预测精度', color: '#F4C430', unit: '%' },
];

export default function PerformanceTrendChart({
  data,
  className,
}: PerformanceTrendChartProps) {
  const [visibleLines, setVisibleLines] = useState<Record<TrendKey, boolean>>({
    completionRate: true,
    leadTime: true,
    accuracy: true,
  });

  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      dateLabel: new Date(item.date).toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
      }),
    }));
  }, [data]);

  const toggleLine = (key: TrendKey) => {
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card px-4 py-3 border border-data-500/30">
          <p className="text-sm text-deep-space-200 mb-2 font-mono">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry, idx) => {
              const legendItem = LEGEND_ITEMS.find((l) => l.key === entry.name);
              return (
                <div key={idx} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs text-deep-space-300">{legendItem?.label || entry.name}</span>
                  </div>
                  <span className="text-sm font-bold font-data" style={{ color: entry.color }}>
                    {entry.value}{legendItem?.unit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = () => (
    <div className="flex items-center justify-center gap-6 mt-2">
      {LEGEND_ITEMS.map((item) => (
        <button
          key={item.key}
          onClick={() => toggleLine(item.key)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 border ${
            visibleLines[item.key]
              ? 'bg-deep-space-800/80 border-deep-space-600/50'
              : 'bg-deep-space-900/50 border-deep-space-700/30 opacity-50'
          } hover:border-data-500/30`}
        >
          <span
            className="w-3 h-0.5 rounded"
            style={{ backgroundColor: visibleLines[item.key] ? item.color : '#7294BE' }}
          />
          <span className={visibleLines[item.key] ? 'text-deep-space-200' : 'text-deep-space-400'}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div className={`glass-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title !mb-0">30天性能趋势</h3>
        <div className="text-xs text-deep-space-400 font-mono">
          共 {data.length} 天数据
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <defs>
              {LEGEND_ITEMS.map((item) => (
                <linearGradient key={item.key} id={`grad-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={item.color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={item.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F4A85" strokeOpacity={0.3} />
            <XAxis
              dataKey="dateLabel"
              stroke="#7294BE"
              tick={{ fill: '#9CB2D0', fontSize: 10 }}
              tickLine={{ stroke: '#1F4A85' }}
              axisLine={{ stroke: '#1F4A85' }}
              interval={Math.floor(chartData.length / 6)}
            />
            <YAxis
              stroke="#7294BE"
              tick={{ fill: '#9CB2D0', fontSize: 11 }}
              tickLine={{ stroke: '#1F4A85' }}
              axisLine={{ stroke: '#1F4A85' }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} verticalAlign="bottom" height={40} />
            {LEGEND_ITEMS.map((item) => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.key}
                stroke={item.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: item.color, stroke: '#0A1628', strokeWidth: 2 }}
                hide={!visibleLines[item.key]}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

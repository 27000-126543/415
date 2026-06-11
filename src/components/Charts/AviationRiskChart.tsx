import { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { AviationRiskLevel } from '../../../shared/types';

interface RouteRisk {
  route: string;
  level: AviationRiskLevel;
  value: number;
}

interface AviationRiskChartProps {
  data: RouteRisk[];
  className?: string;
}

const RISK_COLORS: Record<AviationRiskLevel, { color: string; bg: string; label: string }> = {
  low: { color: '#00D4AA', bg: 'rgba(0, 212, 170, 0.3)', label: '低风险' },
  medium: { color: '#F4C430', bg: 'rgba(244, 196, 48, 0.3)', label: '中等风险' },
  high: { color: '#FF6B35', bg: 'rgba(255, 107, 53, 0.3)', label: '高风险' },
  severe: { color: '#E63946', bg: 'rgba(230, 57, 70, 0.3)', label: '严重风险' },
};

function riskLevelToValue(level: AviationRiskLevel): number {
  switch (level) {
    case 'low':
      return 25;
    case 'medium':
      return 50;
    case 'high':
      return 75;
    case 'severe':
      return 100;
  }
}

export default function AviationRiskChart({
  data,
  className,
}: AviationRiskChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      route: item.route,
      value: riskLevelToValue(item.level),
      level: item.level,
      fullMark: 100,
    }));
  }, [data]);

  const maxRisk = useMemo(() => {
    return data.reduce((acc, curr) => Math.max(acc, riskLevelToValue(curr.level)), 0);
  }, [data]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { route: string; level: AviationRiskLevel } }> }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const riskInfo = RISK_COLORS[d.level];
      return (
        <div className="glass-card px-4 py-3 border border-data-500/30">
          <p className="text-sm text-deep-space-200 mb-1 font-display font-semibold">{d.route}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: riskInfo.color }} />
            <span className="text-sm font-bold" style={{ color: riskInfo.color }}>
              {riskInfo.label}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`glass-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title !mb-0">航空航线风险等级</h3>
        <div className="flex items-center gap-3 text-xs">
          {(['low', 'medium', 'high', 'severe'] as AviationRiskLevel[]).map((level) => (
            <div key={level} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: RISK_COLORS[level].color }}
              />
              <span className="text-deep-space-300">{RISK_COLORS[level].label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} outerRadius="75%">
            <defs>
              <radialGradient id="riskGradient">
                <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#00D4AA" stopOpacity="0.4" />
              </radialGradient>
            </defs>
            <PolarGrid stroke="#1F4A85" strokeOpacity={0.4} />
            <PolarAngleAxis
              dataKey="route"
              tick={{ fill: '#9CB2D0', fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#7294BE', fontSize: 9 }}
              axisLine={false}
              tickCount={5}
              tickFormatter={(value) => {
                if (value === 25) return '低';
                if (value === 50) return '中';
                if (value === 75) return '高';
                if (value === 100) return '严重';
                return '';
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="风险等级"
              dataKey="value"
              stroke="#FF6B35"
              fill="url(#riskGradient)"
              fillOpacity={0.5}
              strokeWidth={2}
              dot={{ r: 4, fill: '#FF6B35', stroke: '#0A1628', strokeWidth: 2 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-deep-space-700/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-deep-space-400">
            共 {data.length} 条航线监控
          </span>
          <span className="text-deep-space-400 font-data">
            最高风险:{' '}
            <span
              className="font-bold"
              style={{
                color: maxRisk >= 75 ? '#E63946' : maxRisk >= 50 ? '#FF6B35' : '#00D4AA',
              }}
            >
              {maxRisk >= 75 ? '严重' : maxRisk >= 50 ? '高' : maxRisk >= 25 ? '中等' : '低'}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type TrendDirection = 'up' | 'down' | 'neutral';
type CardVariant = 'default' | 'lava' | 'data' | 'warning' | 'danger';

interface DataCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  trendDirection?: TrendDirection;
  variant?: CardVariant;
  className?: string;
  subtext?: string;
}

const variantStyles: Record<CardVariant, { border: string; iconBg: string; iconColor: string; valueColor: string }> = {
  default: {
    border: 'border-deep-space-600/30',
    iconBg: 'bg-deep-space-700/50',
    iconColor: 'text-data-400',
    valueColor: 'text-deep-space-50',
  },
  lava: {
    border: 'border-lava-500/30',
    iconBg: 'bg-lava-500/20',
    iconColor: 'text-lava-400',
    valueColor: 'text-lava-300',
  },
  data: {
    border: 'border-data-500/30',
    iconBg: 'bg-data-500/20',
    iconColor: 'text-data-400',
    valueColor: 'text-data-300',
  },
  warning: {
    border: 'border-warning-500/30',
    iconBg: 'bg-warning-500/20',
    iconColor: 'text-warning-400',
    valueColor: 'text-warning-300',
  },
  danger: {
    border: 'border-danger-500/30',
    iconBg: 'bg-danger-500/20',
    iconColor: 'text-danger-400',
    valueColor: 'text-danger-300',
  },
};

export default function DataCard({
  title,
  value,
  icon,
  trend,
  trendDirection = 'neutral',
  variant = 'default',
  className,
  subtext,
}: DataCardProps) {
  const styles = variantStyles[variant];

  const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus;
  const trendColor = trendDirection === 'up' ? 'text-data-400' : trendDirection === 'down' ? 'text-danger-400' : 'text-deep-space-300';

  return (
    <div
      className={cn(
        'glass-card-hover p-5 border',
        styles.border,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-deep-space-300 mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className={cn('text-3xl font-display font-bold font-data', styles.valueColor)}>
              {value}
            </span>
            {trend !== undefined && (
              <div className={cn('flex items-center gap-1 text-sm', trendColor)}>
                <TrendIcon className="w-4 h-4" />
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
          {subtext && (
            <p className="text-xs text-deep-space-400 mt-2">{subtext}</p>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center border',
            styles.iconBg,
            styles.border
          )}
        >
          <div className={styles.iconColor}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

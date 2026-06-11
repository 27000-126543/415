import { cn } from '@/lib/utils';

type ProgressColor = 'data' | 'lava' | 'warning' | 'danger' | 'deep-space';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: ProgressColor;
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  striped?: boolean;
  className?: string;
}

const colorMap: Record<ProgressColor, { bg: string; bar: string; glow?: string }> = {
  data: {
    bg: 'bg-data-500/10',
    bar: 'bg-gradient-to-r from-data-500 to-data-400',
    glow: 'shadow-glow-cyan',
  },
  lava: {
    bg: 'bg-lava-500/10',
    bar: 'bg-gradient-to-r from-lava-500 to-lava-400',
    glow: 'shadow-glow-orange',
  },
  warning: {
    bg: 'bg-warning-500/10',
    bar: 'bg-gradient-to-r from-warning-500 to-warning-400',
  },
  danger: {
    bg: 'bg-danger-500/10',
    bar: 'bg-gradient-to-r from-danger-500 to-danger-400',
    glow: 'shadow-glow-danger',
  },
  'deep-space': {
    bg: 'bg-deep-space-600/30',
    bar: 'bg-gradient-to-r from-deep-space-400 to-deep-space-300',
  },
};

const sizeMap = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export default function ProgressBar({
  value,
  max = 100,
  color = 'data',
  showLabel = false,
  label,
  size = 'md',
  animated = true,
  striped = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = colorMap[color];

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm text-deep-space-300">{label}</span>}
          {showLabel && (
            <span className="text-sm font-data text-deep-space-100">
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full overflow-hidden relative',
          colors.bg,
          sizeMap[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out relative',
            colors.bar,
            colors.glow,
            animated && 'animate-pulse-glow',
            striped && [
              'bg-[length:1rem_1rem]',
              'before:absolute before:inset-0 before:bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)]',
              animated && 'before:animate-[slide_1s_linear_infinite]',
            ]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

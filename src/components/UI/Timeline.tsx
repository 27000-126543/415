import type { ReactNode } from 'react';
import { CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskStatus } from '../../../shared/types';

interface TimelineItem {
  id: string;
  status: TaskStatus | 'custom';
  title: string;
  description?: string;
  timestamp?: string;
  icon?: ReactNode;
  isActive?: boolean;
  isCompleted?: boolean;
  customStatusColor?: 'data' | 'lava' | 'warning' | 'danger' | 'deep-space';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const statusColorMap: Record<string, { dot: string; line: string; text: string; bg: string }> = {
  completed: {
    dot: 'bg-data-500 border-data-400',
    line: 'bg-data-500/50',
    text: 'text-data-400',
    bg: 'bg-data-500/10',
  },
  error_fallback: {
    dot: 'bg-danger-500 border-danger-400',
    line: 'bg-danger-500/50',
    text: 'text-danger-400',
    bg: 'bg-danger-500/10',
  },
  active: {
    dot: 'bg-lava-500 border-lava-400 animate-pulse',
    line: 'bg-deep-space-600',
    text: 'text-lava-400',
    bg: 'bg-lava-500/10',
  },
  pending: {
    dot: 'bg-deep-space-700 border-deep-space-500',
    line: 'bg-deep-space-600',
    text: 'text-deep-space-400',
    bg: 'bg-deep-space-700/30',
  },
  data: {
    dot: 'bg-data-500 border-data-400',
    line: 'bg-data-500/50',
    text: 'text-data-400',
    bg: 'bg-data-500/10',
  },
  lava: {
    dot: 'bg-lava-500 border-lava-400',
    line: 'bg-lava-500/50',
    text: 'text-lava-400',
    bg: 'bg-lava-500/10',
  },
  warning: {
    dot: 'bg-warning-500 border-warning-400',
    line: 'bg-warning-500/50',
    text: 'text-warning-400',
    bg: 'bg-warning-500/10',
  },
  danger: {
    dot: 'bg-danger-500 border-danger-400',
    line: 'bg-danger-500/50',
    text: 'text-danger-400',
    bg: 'bg-danger-500/10',
  },
  'deep-space': {
    dot: 'bg-deep-space-500 border-deep-space-400',
    line: 'bg-deep-space-500/50',
    text: 'text-deep-space-200',
    bg: 'bg-deep-space-500/10',
  },
};

const activeStatuses: TaskStatus[] = [
  'mesh_generation',
  'eruption_calculation',
  'diffusion_simulation',
  'settlement_analysis',
];

const completedStatuses: TaskStatus[] = ['completed'];

function getItemColor(item: TimelineItem) {
  if (item.status === 'custom' && item.customStatusColor) {
    return statusColorMap[item.customStatusColor];
  }
  if (item.isCompleted || completedStatuses.includes(item.status as TaskStatus)) {
    return statusColorMap.completed;
  }
  if (item.isActive || activeStatuses.includes(item.status as TaskStatus)) {
    return statusColorMap.active;
  }
  if (item.status === 'error_fallback') {
    return statusColorMap.error_fallback;
  }
  return statusColorMap.pending;
}

function getStatusIcon(item: TimelineItem) {
  if (item.icon) return item.icon;
  if (item.isCompleted || completedStatuses.includes(item.status as TaskStatus)) {
    return <CheckCircle2 className="w-3.5 h-3.5 text-white" />;
  }
  if (item.isActive || activeStatuses.includes(item.status as TaskStatus)) {
    return <Clock className="w-3.5 h-3.5 text-white animate-spin" style={{ animationDuration: '3s' }} />;
  }
  if (item.status === 'error_fallback') {
    return <AlertTriangle className="w-3.5 h-3.5 text-white" />;
  }
  return <Circle className="w-3.5 h-3.5 text-deep-space-400" />;
}

export default function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {items.map((item, index) => {
        const colors = getItemColor(item);
        const isLast = index === items.length - 1;

        return (
          <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <div
                className={cn(
                  'absolute left-[11px] top-6 w-0.5 h-full',
                  colors.line
                )}
              />
            )}
            <div
              className={cn(
                'relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                colors.dot,
                colors.bg
              )}
            >
              {getStatusIcon(item)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={cn('text-sm font-medium font-display', colors.text)}>
                  {item.title}
                </h4>
                {item.timestamp && (
                  <span className="text-xs text-deep-space-400 font-data">
                    {item.timestamp}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="text-sm text-deep-space-300 mt-1 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

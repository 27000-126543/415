import { cn } from '@/lib/utils';
import type { TaskStatus, AlertLevel, ApprovalStatus, AlertStatus, AviationRiskLevel } from '../../../shared/types';

type BadgeVariant = TaskStatus | AlertLevel | ApprovalStatus | AlertStatus | AviationRiskLevel;

interface StatusBadgeProps {
  status: BadgeVariant;
  label?: string;
  className?: string;
}

const taskStatusConfig: Record<TaskStatus, { label: string; className: string }> = {
  pending_verification: {
    label: '待验证',
    className: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
  },
  mesh_generation: {
    label: '网格生成',
    className: 'bg-data-500/20 text-data-400 border-data-500/30',
  },
  eruption_calculation: {
    label: '喷发计算',
    className: 'bg-lava-500/20 text-lava-400 border-lava-500/30',
  },
  diffusion_simulation: {
    label: '扩散模拟',
    className: 'bg-deep-space-500/20 text-deep-space-200 border-deep-space-500/30',
  },
  settlement_analysis: {
    label: '沉降分析',
    className: 'bg-deep-space-400/20 text-deep-space-100 border-deep-space-400/30',
  },
  completed: {
    label: '已完成',
    className: 'bg-data-500/20 text-data-400 border-data-500/30',
  },
  error_fallback: {
    label: '错误回退',
    className: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
  },
};

const alertLevelConfig: Record<AlertLevel, { label: string; className: string }> = {
  info: {
    label: '信息',
    className: 'bg-deep-space-500/20 text-deep-space-200 border-deep-space-500/30',
  },
  warning: {
    label: '预警',
    className: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
  },
  danger: {
    label: '危险',
    className: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
  },
  critical: {
    label: '严重',
    className: 'bg-lava-500/20 text-lava-400 border-lava-500/30 animate-pulse-glow',
  },
};

const approvalStatusConfig: Record<ApprovalStatus, { label: string; className: string }> = {
  pending: {
    label: '待审批',
    className: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
  },
  approved: {
    label: '已通过',
    className: 'bg-data-500/20 text-data-400 border-data-500/30',
  },
  rejected: {
    label: '已拒绝',
    className: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
  },
};

const alertStatusConfig: Record<AlertStatus, { label: string; className: string }> = {
  pending_review: {
    label: '待复核',
    className: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
  },
  reviewed: {
    label: '已复核',
    className: 'bg-data-500/20 text-data-400 border-data-500/30',
  },
  adjusted: {
    label: '已调整',
    className: 'bg-lava-500/20 text-lava-400 border-lava-500/30',
  },
  ignored: {
    label: '已忽略',
    className: 'bg-deep-space-500/20 text-deep-space-200 border-deep-space-500/30',
  },
};

const aviationRiskConfig: Record<AviationRiskLevel, { label: string; className: string }> = {
  low: {
    label: '低风险',
    className: 'bg-data-500/20 text-data-400 border-data-500/30',
  },
  medium: {
    label: '中等风险',
    className: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
  },
  high: {
    label: '高风险',
    className: 'bg-lava-500/20 text-lava-400 border-lava-500/30',
  },
  severe: {
    label: '严重风险',
    className: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
  },
};

export default function StatusBadge({ status, label, className }: StatusBadgeProps) {
  let config;

  if (status in taskStatusConfig) {
    config = taskStatusConfig[status as TaskStatus];
  } else if (status in alertLevelConfig) {
    config = alertLevelConfig[status as AlertLevel];
  } else if (status in approvalStatusConfig) {
    config = approvalStatusConfig[status as ApprovalStatus];
  } else if (status in alertStatusConfig) {
    config = alertStatusConfig[status as AlertStatus];
  } else if (status in aviationRiskConfig) {
    config = aviationRiskConfig[status as AviationRiskLevel];
  } else {
    config = {
      label: status,
      className: 'bg-deep-space-500/20 text-deep-space-200 border-deep-space-500/30',
    };
  }

  return (
    <span
      className={cn(
        'status-badge border',
        config.className,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label || config.label}
    </span>
  );
}

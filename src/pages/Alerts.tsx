import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  PlayCircle,
  Mountain,
  Activity,
  Clock,
  AlertCircle,
  ChevronRight,
  Info,
  User,
  FileText,
} from 'lucide-react';
import StatusBadge from '@/components/UI/StatusBadge';
import { useAppStore } from '@/store';
import { formatDate, getRoleLabel } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import type { DeviationAlert } from '../../shared/types';

export default function Alerts() {
  const { deviationAlerts, fetchDeviationAlerts, currentUser, fetchTasks, tasks, updateTaskStatus, resumeVolcano } = useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchDeviationAlerts();
    fetchTasks();
  }, [fetchDeviationAlerts, fetchTasks]);

  const sortedAlerts = useMemo(
    () => [...deviationAlerts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [deviationAlerts]
  );

  const selected = useMemo(
    () => deviationAlerts.find((a) => a.id === selectedId) || sortedAlerts[0],
    [deviationAlerts, selectedId, sortedAlerts]
  );

  const isChiefScientist = currentUser.role === 'chief_scientist';

  const isPausedStatus = (alert: DeviationAlert) => alert.isPaused && alert.deviationPercentage > 20;

  const calculateIndividualDeviations = (heights: number[]) => {
    if (heights.length < 2) return { individual: [] as number[], avg: 0 };
    const avg = heights.reduce((a, b) => a + b, 0) / heights.length;
    const individual = heights.map((h) => (avg === 0 ? 0 : Number(Number(((h - avg) / avg) * 100).toFixed(1))));
    return { individual, avg };
  };

  const handleResume = async (alert: DeviationAlert) => {
    resumeVolcano(alert.volcanoName);
    for (const taskId of alert.taskIds) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== 'completed') {
        await updateTaskStatus(taskId, 'eruption_calculation');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-deep-space-50 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-warning-400" />
            异常告警
          </h2>
          <p className="text-sm text-deep-space-400 mt-1">
            监控喷发柱高度偏差，及时发现并处理异常情况
          </p>
        </div>
        {isChiefScientist && (
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-lava-500/10 text-lava-400 border border-lava-500/30">
            <User className="w-3.5 h-3.5" />
            首席科学家权限
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-14rem)] min-h-[550px]">
        <div className="lg:col-span-3 glass-card p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-deep-space-100 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-data-400" />
              偏差告警列表
              {sortedAlerts.filter((a) => isPausedStatus(a)).length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-danger-500/20 text-danger-400 text-xs">
                  {sortedAlerts.filter((a) => isPausedStatus(a)).length} 已暂停
                </span>
              )}
            </h3>
          </div>

          <div className="overflow-x-auto flex-1 -mx-4 px-4">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-deep-space-700/30">
                  <th className="text-left py-3 px-2 text-xs font-medium text-deep-space-400 uppercase tracking-wider">
                    火山名称
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-deep-space-400 uppercase tracking-wider">
                    连续三次高度 (km)
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-deep-space-400 uppercase tracking-wider">
                    偏差百分比
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-deep-space-400 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-deep-space-400 uppercase tracking-wider">
                    时间
                  </th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-deep-space-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedAlerts.length > 0 ? (
                  sortedAlerts.map((alert) => {
                    const isSelected = selected?.id === alert.id;
                    return (
                      <tr
                        key={alert.id}
                        onClick={() => setSelectedId(alert.id)}
                        className={cn(
                          'border-b border-deep-space-700/20 cursor-pointer transition-colors',
                          isSelected ? 'bg-data-500/5' : 'hover:bg-deep-space-800/30'
                        )}
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <Mountain className={cn('w-4 h-4', isPausedStatus(alert) ? 'text-danger-400' : 'text-lava-400')} />
                            <span className="font-medium text-deep-space-100">{alert.volcanoName}</span>
                            {isPausedStatus(alert) && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger-500/20 text-danger-400 border border-danger-500/30">已暂停</span>
                            )}
                            {alert.deviationPercentage > 0 && alert.deviationPercentage <= 20 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning-500/20 text-warning-400 border border-warning-500/30">监控中</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1">
                            {alert.plumeHeights.map((h, idx) => (
                              <span
                                key={idx}
                                className={cn(
                                  'px-2 py-0.5 rounded text-xs font-data',
                                  idx === alert.plumeHeights.length - 1
                                    ? 'bg-danger-500/20 text-danger-400'
                                    : 'bg-deep-space-700/50 text-deep-space-300'
                                )}
                              >
                                {(h / 1000).toFixed(1)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className="inline-flex items-center gap-1 text-danger-400 font-data font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            +{alert.deviationPercentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                              isPausedStatus(alert)
                                ? 'bg-danger-500/20 text-danger-400 border-danger-500/30'
                                : 'bg-warning-500/20 text-warning-400 border-warning-500/30'
                            )}
                          >
                            <span className={cn('w-1.5 h-1.5 rounded-full', isPausedStatus(alert) ? 'bg-danger-400' : 'bg-warning-400 animate-pulse')} />
                            {isPausedStatus(alert) ? '已暂停' : '监控中'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-xs text-deep-space-400 font-data">
                          {formatDate(alert.createdAt)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {isPausedStatus(alert) && isChiefScientist ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResume(alert);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-lava-500/10 text-lava-400 border border-lava-500/30 hover:bg-lava-500/20 transition-colors"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                              恢复任务
                            </button>
                          ) : isPausedStatus(alert) ? (
                            <span className="text-xs text-deep-space-500">仅限首席科学家</span>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-deep-space-500 inline-block" />
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-deep-space-500">
                      <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>暂无偏差告警</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-2 glass-card p-5 flex flex-col min-h-0">
          {selected ? (
            <>
              <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h3 className="font-display font-bold text-lg text-deep-space-50 flex items-center gap-2">
                      <Mountain className="w-5 h-5 text-lava-400" />
                      {selected.volcanoName}
                    </h3>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                        isPausedStatus(selected)
                          ? 'bg-danger-500/20 text-danger-400 border-danger-500/30'
                          : 'bg-warning-500/20 text-warning-400 border-warning-500/30'
                      )}
                    >
                      <span className={cn('w-1.5 h-1.5 rounded-full', isPausedStatus(selected) ? 'bg-danger-400' : 'bg-warning-400 animate-pulse')} />
                      {isPausedStatus(selected) ? '任务已暂停' : '偏差监控中'}
                    </span>
                  </div>
                  <p className="text-sm text-deep-space-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(selected.createdAt)}
                  </p>
                </div>
              </div>

              <div className="space-y-5 flex-1 overflow-y-auto">
                <div className="glass-card p-4">
                  <h4 className="font-display font-semibold text-deep-space-100 text-sm mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-data-400" />
                    连续喷发柱高度检测
                  </h4>
                  <div className="space-y-3">
                    {(() => {
                      const { individual } = calculateIndividualDeviations(selected.plumeHeights);
                      return selected.plumeHeights.map((height, idx) => {
                        const dev = individual[idx] || 0;
                        const exceeds = Math.abs(dev) > 20;
                        return (
                        <div key={idx} className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2',
                              idx === selected.plumeHeights.length - 1
                                ? 'bg-danger-500/20 border-danger-500 text-danger-400'
                                : 'bg-deep-space-700/50 border-deep-space-600 text-deep-space-300'
                            )}
                          >
                            #{idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-deep-space-300">第 {idx + 1} 次检测</span>
                              <div className="flex items-center gap-2">
                                <span className="font-data font-medium text-deep-space-100">
                                  {(height / 1000).toFixed(1)} km
                                </span>
                                {individual.length > 0 && (
                                  <span className={cn(
                                    'text-xs font-data px-1.5 py-0.5 rounded',
                                    exceeds ? 'bg-danger-500/20 text-danger-400' : 'bg-deep-space-700/50 text-deep-space-400'
                                  )}>
                                    {dev > 0 ? '+' : ''}{dev}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="h-2 bg-deep-space-700/50 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  idx === selected.plumeHeights.length - 1
                                    ? 'bg-gradient-to-r from-danger-500 to-danger-400'
                                    : 'bg-gradient-to-r from-data-500 to-data-400'
                                )}
                                style={{ width: `${Math.min(100, (height / 20000) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                      });
                    })()}
                  </div>
                </div>

                <div className="glass-card p-4 border-danger-500/30">
                  <h4 className="font-display font-semibold text-deep-space-100 text-sm mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-danger-400" />
                    偏差分析
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-danger-500/5 border border-danger-500/20">
                      <span className="text-sm text-deep-space-300">最大偏差</span>
                      <span className="text-2xl font-bold text-danger-400 font-data">
                        +{selected.deviationPercentage.toFixed(1)}%
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-deep-space-900/50 border border-deep-space-700/30">
                      <h5 className="text-sm font-medium text-deep-space-200 mb-3">各次偏差判断</h5>
                      <div className="space-y-2">
                        {(() => {
                          const { individual } = calculateIndividualDeviations(selected.plumeHeights);
                          return individual.map((dev, idx) => {
                            const exceeds = Math.abs(dev) > 20;
                            return (
                              <div key={idx} className="flex items-center justify-between">
                                <span className="text-sm text-deep-space-400">第 {idx + 1} 次</span>
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    'text-xs font-data px-2 py-0.5 rounded',
                                    exceeds ? 'bg-danger-500/20 text-danger-400' : 'bg-data-500/10 text-data-400'
                                  )}>
                                    {dev > 0 ? '+' : ''}{dev}%
                                  </span>
                                  <span className={cn(
                                    'text-xs',
                                    exceeds ? 'text-danger-400' : 'text-deep-space-500'
                                  )}>
                                    {exceeds ? '超阈值' : '正常'}
                                  </span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-warning-500/5 border border-warning-500/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-deep-space-300">判断规则</span>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded font-medium',
                          isPausedStatus(selected) ? 'bg-danger-500/20 text-danger-400' : 'bg-warning-500/20 text-warning-400'
                        )}>
                          {isPausedStatus(selected) ? '已触发暂停' : '监控中'}
                        </span>
                      </div>
                      <p className="text-xs text-deep-space-400">
                        连续三次检测，最大偏差 {'>'} 20% 时自动暂停该火山新任务。
                        当前 {selected.plumeHeights.length} 次检测，最大偏差 +{selected.deviationPercentage.toFixed(1)}%。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-4">
                  <h4 className="font-display font-semibold text-deep-space-100 text-sm mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-data-400" />
                    关联信息
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-deep-space-400">关联任务数</span>
                      <span className="text-deep-space-200 font-data">{selected.taskIds.length} 个</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-deep-space-400">是否已通知</span>
                      <span className={selected.notified ? 'text-data-400' : 'text-warning-400'}>
                        {selected.notified ? '已通知相关人员' : '未通知'}
                      </span>
                    </div>
                  </div>
                </div>

                {isPausedStatus(selected) && (
                  <div className="glass-card p-4 border-lava-500/30">
                    <h4 className="font-display font-semibold text-deep-space-100 text-sm mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-warning-400" />
                      处理建议
                    </h4>
                    <div className="space-y-2 text-sm text-deep-space-300">
                      <p className="flex gap-2">
                        <span className="text-data-400">1.</span>
                        审查历史监测数据，确认偏差是否持续存在
                      </p>
                      <p className="flex gap-2">
                        <span className="text-data-400">2.</span>
                        检查岩浆成分和喷发参数设置是否合理
                      </p>
                      <p className="flex gap-2">
                        <span className="text-data-400">3.</span>
                        参考实测数据调整模型参数或确认偏差原因
                      </p>
                      <p className="flex gap-2">
                        <span className="text-data-400">4.</span>
                        {isChiefScientist ? '确认无误后点击「恢复任务」继续模拟' : '联系首席科学家进行复核'}
                      </p>
                      <p className="pt-2 mt-2 border-t border-deep-space-700/30 text-xs text-warning-400">
                        注：只有偏差超过20%才会自动暂停任务，偏差≤20%时仅进入监控状态。
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {isPausedStatus(selected) && isChiefScientist && (
                <div className="mt-5 pt-5 border-t border-deep-space-700/30">
                  <button
                    onClick={() => handleResume(selected)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-lava-500/10 text-lava-400 border border-lava-500/30 hover:bg-lava-500/20 hover:shadow-glow-orange transition-all font-medium"
                  >
                    <PlayCircle className="w-5 h-5" />
                    恢复模拟任务
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-deep-space-500 mx-auto mb-4" />
                <p className="text-deep-space-300">请选择一个告警查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

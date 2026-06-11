import { useEffect, useMemo, useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Mountain,
  FileBarChart,
  User,
  Clock,
  MessageSquare,
  AlertCircle,
  ChevronRight,
  Send,
} from 'lucide-react';
import StatusBadge from '@/components/UI/StatusBadge';
import { useAppStore } from '@/store';
import { formatDate, getRoleLabel } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import type { Approval } from '../../shared/types';

const stageLabels: Record<string, { label: string; description: string }> = {
  volcanologist_validation: {
    label: '火山学家验证',
    description: '验证模拟参数是否合理、数据是否准确',
  },
  mitigation_confirmation: {
    label: '减灾专家确认',
    description: '确认减灾建议是否可行、风险评估是否恰当',
  },
};

export default function Approvals() {
  const { approvals, tasks, reports, pushRecords, fetchApprovals, fetchTasks, fetchReports, decideApproval, currentUser } = useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchApprovals();
    fetchTasks();
    fetchReports();
  }, [fetchApprovals, fetchTasks, fetchReports]);

  const sortedApprovals = useMemo(
    () => [...approvals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [approvals]
  );

  const selected = useMemo(
    () => approvals.find((a) => a.id === selectedId) || sortedApprovals[0],
    [approvals, selectedId, sortedApprovals]
  );

  const selectedTask = useMemo(
    () => (selected ? tasks.find((t) => t.id === selected.taskId) : undefined),
    [tasks, selected]
  );

  const selectedReport = useMemo(
    () => (selected ? reports.find((r) => r.id === selected.reportId) : undefined),
    [reports, selected]
  );

  const isVolcanologistApproved = useMemo(
    () =>
      selected
        ? approvals.some(
            (a) => a.taskId === selected.taskId && a.stage === 'volcanologist_validation' && a.status === 'approved'
          )
        : false,
    [approvals, selected]
  );

  const isMitigationApproved = useMemo(
    () =>
      selected
        ? approvals.some(
            (a) => a.taskId === selected.taskId && a.stage === 'mitigation_confirmation' && a.status === 'approved'
          )
        : false,
    [approvals, selected]
  );

  const taskPushRecords = useMemo(
    () => (selected ? pushRecords.filter((r) => r.taskId === selected.taskId) : []),
    [pushRecords, selected]
  );

  const handleDecide = async (status: 'approved' | 'rejected') => {
    if (!selected) return;
    await decideApproval(selected.id, { status, comments: comment });
    setComment('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-deep-space-50 flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-data-400" />
          审批中心
        </h2>
        <p className="text-sm text-deep-space-400 mt-1">
          审核模拟报告，两级审批流程确保数据准确可靠
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-14rem)] min-h-[600px]">
        <div className="lg:col-span-2 glass-card p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-deep-space-100 text-sm">
              待审批列表
              {sortedApprovals.filter((a) => a.status === 'pending').length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-warning-500/20 text-warning-400 text-xs">
                  {sortedApprovals.filter((a) => a.status === 'pending').length} 待处理
                </span>
              )}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
            {sortedApprovals.length > 0 ? (
              sortedApprovals.map((approval) => {
                const task = tasks.find((t) => t.id === approval.taskId);
                const stage = stageLabels[approval.stage];
                const isSelected = selected?.id === approval.id;

                return (
                  <div
                    key={approval.id}
                    onClick={() => setSelectedId(approval.id)}
                    className={cn(
                      'p-4 rounded-lg border cursor-pointer transition-all',
                      isSelected
                        ? 'bg-data-500/10 border-data-500/30'
                        : 'bg-deep-space-900/50 border-deep-space-700/30 hover:border-deep-space-600/50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-deep-space-100 text-sm truncate">
                        {task?.name || '未知任务'}
                      </h4>
                      <StatusBadge status={approval.status} />
                    </div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded bg-deep-space-700/50 text-deep-space-300">
                        {stage?.label || approval.stage}
                      </span>
                      <span className="text-xs text-deep-space-500 flex items-center gap-1">
                        <Mountain className="w-3 h-3" />
                        {task?.volcanoName || '未知'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-deep-space-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {getRoleLabel(approval.approverRole as any)}
                      </span>
                      <span className="font-data">{formatDate(approval.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center text-deep-space-500 text-sm">
                暂无审批项
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 glass-card p-5 flex flex-col min-h-0">
          {selected ? (
            <>
              <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h3 className="font-display font-bold text-xl text-deep-space-50">
                      {selectedTask?.name || '未知任务'}
                    </h3>
                    <StatusBadge status={selected.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-deep-space-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Mountain className="w-4 h-4" />
                      {selectedTask?.volcanoName || '未知火山'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      提交于 {formatDate(selected.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
                <div className="space-y-4">
                  <div className="glass-card p-4">
                    <h4 className="font-display font-semibold text-deep-space-100 text-sm mb-3 flex items-center gap-2">
                      <FileBarChart className="w-4 h-4 text-data-400" />
                      报告信息
                    </h4>
                    {selectedReport ? (
                      <div className="space-y-2 text-sm">
                        <p className="text-deep-space-200 font-medium">{selectedReport.title}</p>
                        <p className="text-deep-space-400 text-xs line-clamp-3">{selectedReport.summary}</p>
                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-deep-space-500 text-xs">航空风险等级:</span>
                          <StatusBadge status={selectedReport.aviationRiskLevel} />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-deep-space-500">报告信息加载中...</p>
                    )}
                  </div>

                  <div className="glass-card p-4">
                    <h4 className="font-display font-semibold text-deep-space-100 text-sm mb-3">
                      当前审批阶段
                    </h4>
                    <div className="space-y-4">
                      {[
                        { id: 'volcanologist_validation', label: '一级审批', role: '火山学家验证' },
                        { id: 'mitigation_confirmation', label: '二级审批', role: '减灾专家确认' },
                      ].map((stage, idx) => {
                        const isCurrent = selected.stage === stage.id;
                        const stageInfo = stageLabels[stage.id];

                        return (
                          <div key={stage.id} className="relative">
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 z-10',
                                  isCurrent
                                    ? 'bg-data-500/20 border-data-500 text-data-400 shadow-glow-cyan'
                                    : 'bg-deep-space-700/50 border-deep-space-600 text-deep-space-400'
                                )}
                              >
                                {idx + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={cn(
                                      'font-medium text-sm',
                                      isCurrent ? 'text-deep-space-100' : 'text-deep-space-400'
                                    )}
                                  >
                                    {stage.label} - {stage.role}
                                  </span>
                                  {isCurrent && selected.status === 'pending' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-data-500/20 text-data-400 animate-pulse">
                                      待您处理
                                    </span>
                                  )}
                                  {stage.id === 'mitigation_confirmation' && !isVolcanologistApproved && (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-warning-500/20 text-warning-400">
                                      等待一级审批通过
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-deep-space-500 mt-0.5">{stageInfo?.description}</p>
                              </div>
                            </div>
                            {idx < 1 && (
                              <div className="absolute left-[15px] top-8 w-0.5 h-8 bg-deep-space-700" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="glass-card p-4">
                    <h4 className="font-display font-semibold text-deep-space-100 text-sm mb-3 flex items-center gap-2">
                      <User className="w-4 h-4 text-lava-400" />
                      审批人信息
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-deep-space-400">角色</span>
                        <span className="text-deep-space-200">{getRoleLabel(selected.approverRole as any)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-deep-space-400">审批状态</span>
                        <StatusBadge status={selected.status} />
                      </div>
                      {selected.decidedAt && (
                        <div className="flex justify-between">
                          <span className="text-deep-space-400">审批时间</span>
                          <span className="text-deep-space-200 font-data text-xs">
                            {formatDate(selected.decidedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selected.status !== 'pending' && selected.comments && (
                    <div className="glass-card p-4">
                      <h4 className="font-display font-semibold text-deep-space-100 text-sm mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-warning-400" />
                        审批意见
                      </h4>
                      <p className="text-sm text-deep-space-300 leading-relaxed">{selected.comments}</p>
                    </div>
                  )}

                  <div className="glass-card p-4">
                    <h4 className="font-display font-semibold text-deep-space-100 text-sm mb-3 flex items-center gap-2">
                      <Mountain className="w-4 h-4 text-lava-400" />
                      任务参数摘要
                    </h4>
                    {selectedTask && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded bg-deep-space-900/50">
                          <p className="text-deep-space-500">喷口直径</p>
                          <p className="text-deep-space-200 font-data">{selectedTask.eruptionParams.ventDiameter} m</p>
                        </div>
                        <div className="p-2 rounded bg-deep-space-900/50">
                          <p className="text-deep-space-500">初始压力</p>
                          <p className="text-deep-space-200 font-data">{selectedTask.eruptionParams.initialPressure} MPa</p>
                        </div>
                        <div className="p-2 rounded bg-deep-space-900/50">
                          <p className="text-deep-space-500">温度</p>
                          <p className="text-deep-space-200 font-data">{selectedTask.eruptionParams.initialTemperature} °C</p>
                        </div>
                        <div className="p-2 rounded bg-deep-space-900/50">
                          <p className="text-deep-space-500">SiO₂</p>
                          <p className="text-deep-space-200 font-data">{selectedTask.magmaComposition.sio2.toFixed(1)}%</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isMitigationApproved && taskPushRecords.length > 0 && (
                <div className="glass-card p-4 mb-6">
                  <h4 className="font-display font-semibold text-deep-space-100 text-sm mb-3 flex items-center gap-2">
                    <Send className="w-4 h-4 text-data-400" />
                    推送记录
                  </h4>
                  <div className="space-y-3">
                    {taskPushRecords.map((record) => (
                      <div key={record.id} className="p-3 rounded-lg bg-deep-space-900/50 border border-deep-space-700/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-deep-space-100">
                            {record.targetDepartment === 'aviation' ? '民航管理部门' : '应急管理部门'}
                          </span>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              record.status === 'sent' && 'bg-data-500/20 text-data-400',
                              record.status === 'delivered' && 'bg-warning-500/20 text-warning-400',
                              record.status === 'acknowledged' && 'bg-data-500/20 text-data-400'
                            )}
                          >
                            {record.status === 'sent' ? '已发送' : record.status === 'delivered' ? '已送达' : '已确认'}
                          </span>
                        </div>
                        <p className="text-xs text-deep-space-300 leading-relaxed">{record.message}</p>
                        <p className="text-xs text-deep-space-500 mt-1 font-data">
                          推送时间：{formatDate(record.pushedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.status === 'pending' && (
                <div className="mt-auto pt-5 border-t border-deep-space-700/30">
                  {selected.stage === 'mitigation_confirmation' && !isVolcanologistApproved ? (
                    <div className="flex items-center gap-2 p-4 rounded-lg bg-warning-500/10 border border-warning-500/30 text-warning-400">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">火山学家验证尚未通过，减灾专家暂无法确认审批</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="label-text flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          审批意见
                        </label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="请输入审批意见..."
                          rows={3}
                          className="input-field resize-none"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleDecide('rejected')}
                          className="btn-danger flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          拒绝
                        </button>
                        <button
                          onClick={() => handleDecide('approved')}
                          className="btn-primary flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          通过
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-deep-space-500 mx-auto mb-4" />
                <p className="text-deep-space-300">请选择一个审批项查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

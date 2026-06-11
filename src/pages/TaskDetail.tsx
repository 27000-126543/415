import { useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mountain,
  File,
  Activity,
  Thermometer,
  Wind,
  Clock,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import StatusBadge from '@/components/UI/StatusBadge';
import ProgressBar from '@/components/UI/ProgressBar';
import Timeline from '@/components/UI/Timeline';
import { useAppStore } from '@/store';
import { formatDate, formatFileSize, getRoleLabel } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import type { TaskStatus } from '../../shared/types';

function getTaskTimeline(task: { status: TaskStatus; createdAt: string; currentStageStartTime: string }) {
  const stages: { id: string; status: TaskStatus; title: string; description: string }[] = [
    { id: '1', status: 'pending_verification', title: '待验证', description: '等待火山学家验证任务参数' },
    { id: '2', status: 'mesh_generation', title: '网格生成', description: '基于DEM数据生成计算网格' },
    { id: '3', status: 'eruption_calculation', title: '喷发计算', description: '计算喷发动力学过程' },
    { id: '4', status: 'diffusion_simulation', title: '扩散模拟', description: '模拟火山灰扩散过程' },
    { id: '5', status: 'settlement_analysis', title: '沉降分析', description: '分析火山灰沉降分布' },
    { id: '6', status: 'completed', title: '已完成', description: '模拟计算完成，报告生成中' },
  ];

  const currentIndex = stages.findIndex((s) => s.status === task.status);

  return stages.map((stage, index) => ({
    ...stage,
    isCompleted: task.status === 'error_fallback'
      ? index < currentIndex
      : index < currentIndex || task.status === 'completed',
    isActive: index === currentIndex && task.status !== 'completed' && task.status !== 'error_fallback',
    timestamp: index === currentIndex ? formatDate(task.currentStageStartTime) : undefined,
  }));
}

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, monitoringData, adjustmentLogs, fetchTasks, fetchMonitoringData } = useAppStore();

  const task = useMemo(() => tasks.find((t) => t.id === id), [tasks, id]);
  const taskMonitoring = useMemo(
    () => monitoringData.filter((m) => m.taskId === id).sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ),
    [monitoringData, id]
  );

  const taskAdjustmentLogs = useMemo(
    () => adjustmentLogs.filter((l) => l.taskId === id).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    [adjustmentLogs, id]
  );

  useEffect(() => {
    fetchTasks();
    if (id) {
      fetchMonitoringData(id);
    }
  }, [fetchTasks, fetchMonitoringData, id]);

  const chartData = taskMonitoring.map((m, index) => ({
    time: `${String(index).padStart(2, '0')}h`,
    喷发柱高度: Math.round(m.plumeHeight / 100) / 10,
    火山灰浓度: Math.round(m.ashConcentration),
    热辐射: Math.round(m.thermalRadiation),
  }));

  if (!task) {
    return (
      <div className="glass-card py-20 text-center">
        <AlertCircle className="w-12 h-12 text-danger-400 mx-auto mb-4" />
        <p className="text-deep-space-200 mb-4">任务不存在</p>
        <button onClick={() => navigate('/tasks')} className="btn-primary">
          返回任务列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/tasks')}
          className="flex items-center gap-1 text-deep-space-300 hover:text-deep-space-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-display text-xl font-bold text-deep-space-50">{task.name}</h2>
            <StatusBadge status={task.status} />
          </div>
          <p className="text-sm text-deep-space-400 mt-1">
            {task.volcanoName} · 创建于 {formatDate(task.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-5">
            <h3 className="section-title">
              <Mountain className="w-5 h-5 text-lava-400" />
              基本信息
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-deep-space-400">任务ID</span>
                <span className="text-deep-space-200 font-data">{task.id.slice(-8)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-deep-space-400">火山名称</span>
                <span className="text-deep-space-200">{task.volcanoName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-deep-space-400">当前状态</span>
                <StatusBadge status={task.status} />
              </div>
              {task.demFile && (
                <div className="flex justify-between text-sm items-center">
                  <span className="text-deep-space-400 flex items-center gap-1">
                    <File className="w-3.5 h-3.5" /> DEM文件
                  </span>
                  <div className="text-right">
                    <p className="text-deep-space-200 text-xs truncate max-w-[150px]">{task.demFile.name}</p>
                    <p className="text-deep-space-500 text-xs font-data">{formatFileSize(task.demFile.size)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-5 border-t border-deep-space-700/30">
              <ProgressBar
                value={task.progress}
                color={task.status === 'error_fallback' ? 'danger' : 'data'}
                showLabel
                label="整体进度"
              />
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="section-title">
              <Activity className="w-5 h-5 text-data-400" />
              参数详情
            </h3>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-deep-space-200 mb-2 flex items-center gap-2">
                <span className="w-1 h-3 bg-lava-500 rounded-full" />
                岩浆成分
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(task.magmaComposition).map(([key, value]) => (
                  <div key={key} className="flex justify-between bg-deep-space-900/30 px-2 py-1.5 rounded">
                    <span className="text-deep-space-400 uppercase">{key}</span>
                    <span className="text-data-400 font-data">{Number(value).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-deep-space-200 mb-2 flex items-center gap-2">
                <span className="w-1 h-3 bg-data-500 rounded-full" />
                喷发源参数
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-deep-space-400 flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5" /> 喷口直径
                  </span>
                  <span className="text-deep-space-200 font-data">{task.eruptionParams.ventDiameter} m</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-deep-space-400">初始压力</span>
                  <span className="text-deep-space-200 font-data">{task.eruptionParams.initialPressure} MPa</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-deep-space-400 flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5" /> 温度
                  </span>
                  <span className="text-deep-space-200 font-data">{task.eruptionParams.initialTemperature} °C</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-deep-space-400">H₂O 含量</span>
                  <span className="text-deep-space-200 font-data">{task.eruptionParams.h2oContent} wt%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-deep-space-400">CO₂ 含量</span>
                  <span className="text-deep-space-200 font-data">{task.eruptionParams.co2Content} wt%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-deep-space-400">SO₂ 含量</span>
                  <span className="text-deep-space-200 font-data">{task.eruptionParams.so2Content} wt%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="section-title">
              <Clock className="w-5 h-5 text-warning-400" />
              状态时间线
            </h3>
            <Timeline items={getTaskTimeline(task)} />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0">
                <Activity className="w-5 h-5 text-data-400" />
                实时监控
              </h3>
              {task.status !== 'completed' && task.status !== 'pending_verification' && (
                <Link to={`/monitor?taskId=${task.id}`} className="flex items-center gap-1 text-sm text-data-400 hover:text-data-300 transition-colors">
                  查看大屏 <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            {chartData.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-3">
                  <h4 className="text-sm text-deep-space-300 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-data-400 animate-pulse" />
                    喷发柱高度 (km)
                  </h4>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorHeight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1F4A85" opacity={0.2} />
                        <XAxis dataKey="time" stroke="#7294BE" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#7294BE" tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0A1628',
                            border: '1px solid #2E5E9E',
                            borderRadius: '8px',
                            color: '#C5D0E3',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="喷发柱高度"
                          stroke="#00D4AA"
                          strokeWidth={2}
                          fill="url(#colorHeight)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm text-deep-space-300 mb-2">火山灰浓度 (μg/m³)</h4>
                  <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1F4A85" opacity={0.2} />
                        <XAxis dataKey="time" stroke="#7294BE" tick={{ fontSize: 9 }} />
                        <YAxis stroke="#7294BE" tick={{ fontSize: 9 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0A1628',
                            border: '1px solid #2E5E9E',
                            borderRadius: '8px',
                            color: '#C5D0E3',
                          }}
                        />
                        <Line type="monotone" dataKey="火山灰浓度" stroke="#FF6B35" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm text-deep-space-300 mb-2">热辐射 (W/m²)</h4>
                  <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1F4A85" opacity={0.2} />
                        <XAxis dataKey="time" stroke="#7294BE" tick={{ fontSize: 9 }} />
                        <YAxis stroke="#7294BE" tick={{ fontSize: 9 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0A1628',
                            border: '1px solid #2E5E9E',
                            borderRadius: '8px',
                            color: '#C5D0E3',
                          }}
                        />
                        <Line type="monotone" dataKey="热辐射" stroke="#F4C430" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-data-400" />
                    <span className="text-deep-space-400">喷发柱高度</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-lava-400" />
                    <span className="text-deep-space-400">火山灰浓度</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-warning-400" />
                    <span className="text-deep-space-400">热辐射</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-deep-space-400">
                <Activity className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>暂无监控数据</p>
                <p className="text-sm mt-1">任务开始计算后将显示实时监控数据</p>
              </div>
            )}
          </div>

          <div className="glass-card p-5">
            <h3 className="section-title">
              <AlertCircle className="w-5 h-5 text-warning-400" />
              调整日志
            </h3>
            <div className="space-y-4">
              {taskAdjustmentLogs.length > 0 ? (
                taskAdjustmentLogs.map((log, idx) => (
                  <div
                    key={log.id}
                    className={cn(
                      'p-5 rounded-xl bg-deep-space-900/50 border transition-all',
                      idx === 0
                        ? 'border-lava-500/40 border-l-4 shadow-glow-orange/30'
                        : 'border-deep-space-700/30'
                    )}
                  >
                    <div className="flex items-center justify-between items-start mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-data text-deep-space-400">
                          {formatDate(log.createdAt)}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-lava-500/20 text-lava-400 border border-lava-500/30">
                          {getRoleLabel(log.adjustedBy as any)}
                        </span>
                      </div>
                      {idx === 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-data-500/20 text-data-400 font-medium">
                          最新调整
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
                      <div className="p-3 rounded-lg bg-danger-500/5 border border-danger-500/20">
                        <div className="text-[11px] uppercase tracking-wider text-danger-400 mb-2 font-medium">
                          ⬅ 调整前
                        </div>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-deep-space-400">喷口直径</span>
                            <span className="font-data text-deep-space-200">
                              {log.beforeParams.ventDiameter} m
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-deep-space-400">H₂O 含量</span>
                            <span className="font-data text-deep-space-200">
                              {log.beforeParams.h2oContent} wt%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-deep-space-400">初始压力</span>
                            <span className="font-data text-deep-space-200">
                              {log.beforeParams.initialPressure} MPa
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-deep-space-400">初始温度</span>
                            <span className="font-data text-deep-space-200">
                              {log.beforeParams.initialTemperature} ℃
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-data-500/5 border border-data-500/20">
                        <div className="text-[11px] uppercase tracking-wider text-data-400 mb-2 font-medium">
                          调整后 ➡
                        </div>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-deep-space-400">喷口直径</span>
                            <span className="font-data text-lava-400">
                              {log.afterParams.ventDiameter} m
                              {log.beforeParams.ventDiameter !== log.afterParams.ventDiameter && (
                                <span className="ml-1 text-[10px] text-danger-400">
                                  ({((log.afterParams.ventDiameter - log.beforeParams.ventDiameter) / log.beforeParams.ventDiameter * 100).toFixed(0)}%)
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-deep-space-400">H₂O 含量</span>
                            <span className="font-data text-lava-400">
                              {log.afterParams.h2oContent} wt%
                              {log.beforeParams.h2oContent !== log.afterParams.h2oContent && (
                                <span className="ml-1 text-[10px] text-danger-400">
                                  ({((log.afterParams.h2oContent - log.beforeParams.h2oContent) / log.beforeParams.h2oContent * 100).toFixed(0)}%
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-deep-space-400">初始压力</span>
                            <span className="font-data text-deep-space-200">
                              {log.afterParams.initialPressure} MPa
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-deep-space-400">初始温度</span>
                            <span className="font-data text-deep-space-200">
                              {log.afterParams.initialTemperature} ℃
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-deep-space-700/30">
                      <div className="text-xs text-deep-space-400 mb-1">调整理由</div>
                      <p className="text-sm text-deep-space-100 leading-relaxed">
                        {log.reason}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-deep-space-500 text-sm">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-deep-space-800/50 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-deep-space-600" />
                </div>
                <p className="text-deep-space-400">暂无调整记录</p>
                <p className="mt-1 text-xs text-deep-space-500">
                  当预警复核选择调整参数后，将在此显示详细调整记录
                </p>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Mountain,
  Wind,
  Thermometer,
  X,
  SlidersHorizontal,
  EyeOff,
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
  ReferenceLine,
} from 'recharts';
import StatusBadge from '@/components/UI/StatusBadge';
import { useAppStore } from '@/store';
import { formatDate } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import type { Alert } from '../../shared/types';

const alertTypeLabels: Record<string, string> = {
  plume_height: '喷发柱高度',
  ash_concentration: '火山灰浓度',
  thermal_radiation: '热辐射',
};

function generateHeatmapData(size: number, intensity: number) {
  const data: number[][] = [];
  for (let y = 0; y < size; y++) {
    const row: number[] = [];
    for (let x = 0; x < size; x++) {
      const centerX = size / 2;
      const centerY = size / 2;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const value = Math.max(0, intensity * (1 - distance / (size / 1.5)) + (Math.random() - 0.5) * 0.2);
      row.push(Math.min(1, Math.max(0, value)));
    }
    data.push(row);
  }
  return data;
}

function Heatmap({ data, colors }: { data: number[][]; colors: string[] }) {
  return (
    <div className="grid w-full h-full" style={{ gridTemplateColumns: `repeat(${data[0].length}, 1fr)` }}>
      {data.flat().map((value, idx) => {
        const colorIdx = Math.floor(value * (colors.length - 1));
        return (
          <div
            key={idx}
            className="aspect-square"
            style={{ backgroundColor: colors[colorIdx] }}
          />
        );
      })}
    </div>
  );
}

export default function Monitor() {
  const [searchParams] = useSearchParams();
  const initialTaskId = searchParams.get('taskId');
  const { tasks, monitoringData, alerts, fetchTasks, fetchMonitoringData, fetchAlerts, reviewAlert, currentUser } = useAppStore();

  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(initialTaskId || undefined);
  const [taskDropdownOpen, setTaskDropdownOpen] = useState(false);
  const [adjustingAlertId, setAdjustingAlertId] = useState<string | null>(null);
  const [adjustReason, setAdjustReason] = useState('');

  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'completed' && t.status !== 'pending_verification' && t.status !== 'error_fallback'),
    [tasks]
  );

  const selectedTask = useMemo(() => {
    if (selectedTaskId) return tasks.find((t) => t.id === selectedTaskId);
    return activeTasks[0] || tasks[0];
  }, [tasks, selectedTaskId, activeTasks]);

  const taskMonitoring = useMemo(() => {
    if (!selectedTask) return [];
    return monitoringData
      .filter((m) => m.taskId === selectedTask.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [monitoringData, selectedTask]);

  const taskAlerts = useMemo(() => {
    if (!selectedTask) return [];
    return alerts
      .filter((a) => a.taskId === selectedTask.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [alerts, selectedTask]);

  useEffect(() => {
    fetchTasks();
    fetchAlerts();
    if (selectedTask?.id) {
      fetchMonitoringData(selectedTask.id);
    }
  }, [fetchTasks, fetchMonitoringData, fetchAlerts, selectedTask?.id]);

  const chartData = taskMonitoring.map((m, index) => ({
    time: `${String(index).padStart(2, '0')}:00`,
    height: Math.round(m.plumeHeight / 100) / 10,
    ash: Math.round(m.ashConcentration),
    thermal: Math.round(m.thermalRadiation),
  }));

  const STRATOSPHERE_KM = 12;

  const ashHeatmap = useMemo(() => generateHeatmapData(20, 0.7), []);
  const thermalHeatmap = useMemo(() => generateHeatmapData(20, 0.8), []);

  const ashColors = [
    'rgba(10, 22, 40, 0)',
    'rgba(106, 120, 150, 0.3)',
    'rgba(150, 160, 180, 0.5)',
    'rgba(180, 170, 160, 0.7)',
    'rgba(120, 100, 80, 0.85)',
    'rgba(80, 60, 40, 1)',
  ];

  const thermalColors = [
    'rgba(10, 22, 40, 0)',
    'rgba(46, 94, 158, 0.4)',
    'rgba(0, 212, 170, 0.5)',
    'rgba(244, 196, 48, 0.7)',
    'rgba(255, 107, 53, 0.85)',
    'rgba(230, 57, 70, 1)',
  ];

  const handleReviewAlert = async (alert: Alert, status: 'reviewed' | 'adjusted' | 'ignored') => {
    await reviewAlert(alert.id, {
      status,
      reviewNote: status === 'adjusted' ? adjustReason : status === 'reviewed' ? '已复核' : '已忽略',
    });
    setAdjustingAlertId(null);
    setAdjustReason('');
  };

  return (
    <div className="h-full -m-6 p-6 bg-deep-space-950 flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl font-bold text-deep-space-50 flex items-center gap-2">
            <Activity className="w-6 h-6 text-data-400" />
            实时监控大屏
          </h1>
        </div>

        <div className="relative">
          <button
            onClick={() => setTaskDropdownOpen(!taskDropdownOpen)}
            className="flex items-center gap-3 px-4 py-2 glass-card hover:border-data-500/40 transition-all"
          >
            <Mountain className="w-4 h-4 text-lava-400" />
            <span className="text-deep-space-100 font-medium">
              {selectedTask ? selectedTask.name : '选择监控任务'}
            </span>
            {selectedTask && <StatusBadge status={selectedTask.status} />}
            <ChevronDown className={cn('w-4 h-4 text-deep-space-400 transition-transform', taskDropdownOpen && 'rotate-180')} />
          </button>

          {taskDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 glass-card border border-deep-space-600/50 overflow-hidden z-50 max-h-80 overflow-y-auto">
              {activeTasks.length > 0 ? (
                activeTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setTaskDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full px-4 py-3 text-left hover:bg-deep-space-800/50 transition-colors border-b border-deep-space-700/30 last:border-0',
                      selectedTaskId === task.id && 'bg-data-500/10'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-deep-space-100 font-medium text-sm truncate">{task.name}</span>
                      <StatusBadge status={task.status} />
                    </div>
                    <p className="text-xs text-deep-space-400 mt-1">{task.volcanoName}</p>
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-deep-space-400 text-sm">
                  暂无可监控的活跃任务
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        <div className="lg:col-span-3 grid grid-cols-1 xl:grid-cols-2 gap-4 min-h-0">
          <div className="glass-card p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-deep-space-100 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-data-400 animate-pulse" />
                喷发柱高度曲线 (km)
              </h3>
              <div className="text-xs font-data text-data-400">
                {taskMonitoring.length > 0 ? `${(taskMonitoring[taskMonitoring.length - 1]?.plumeHeight / 1000).toFixed(1)} km` : '--'}
              </div>
            </div>
            <div className="flex-1 min-h-0">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="plumeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F4A85" opacity={0.2} />
                    <XAxis dataKey="time" stroke="#7294BE" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#7294BE" tick={{ fontSize: 10 }} unit=" km" />
                    <ReferenceLine y={STRATOSPHERE_KM} stroke="#E63946" strokeDasharray="6 3" label={{ value: '平流层 12km', position: 'right', fill: '#E63946', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0A1628',
                        border: '1px solid #2E5E9E',
                        borderRadius: '8px',
                        color: '#C5D0E3',
                      }}
                      formatter={(value: number) => [`${value} km`, '喷发柱高度']}
                    />
                    <Area
                      type="monotone"
                      dataKey="height"
                      stroke="#00D4AA"
                      strokeWidth={2}
                      fill="url(#plumeGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-deep-space-500 text-sm">
                  暂无数据
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-4 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-deep-space-100 text-sm flex items-center gap-2">
                <Mountain className="w-4 h-4 text-lava-400" />
                3D 火山可视化
              </h3>
            </div>
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden bg-gradient-to-br from-deep-space-900 via-deep-space-800 to-deep-space-900 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 400 300" className="w-full h-full max-w-md">
                  <defs>
                    <linearGradient id="volcanoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.9" />
                      <stop offset="40%" stopColor="#8A2D0C" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#143668" stopOpacity="0.6" />
                    </linearGradient>
                    <radialGradient id="craterGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FF6B35" stopOpacity="1" />
                      <stop offset="50%" stopColor="#FF6B35" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <polygon
                    points="200,40 80,260 320,260"
                    fill="url(#volcanoGrad)"
                    stroke="#FF6B35"
                    strokeWidth="1"
                    opacity="0.9"
                  />
                  <polygon
                    points="200,40 140,260 260,260"
                    fill="rgba(0,0,0,0.2)"
                  />
                  <ellipse cx="200" cy="40" rx="25" ry="8" fill="url(#craterGlow)" className="animate-pulse" />
                  <ellipse cx="200" cy="40" rx="12" ry="4" fill="#FF6B35" />
                  {[...Array(8)].map((_, i) => (
                    <circle
                      key={i}
                      cx={200 + (Math.random() - 0.5) * 30}
                      cy={30 - i * 8 - Math.random() * 10}
                      r={2 + Math.random() * 3}
                      fill={i % 2 === 0 ? '#FF6B35' : '#F4C430'}
                      opacity={0.8 - i * 0.08}
                      className="animate-float"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </svg>
              </div>
              <div className="absolute bottom-3 left-3 text-xs font-data text-deep-space-400">
                {selectedTask?.volcanoName || '火山'}
              </div>
            </div>
          </div>

          <div className="glass-card p-4 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-deep-space-100 text-sm flex items-center gap-2">
                <Wind className="w-4 h-4 text-deep-space-200" />
                火山灰浓度热力图
              </h3>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-deep-space-500">低</span>
                <div className="flex h-3 w-24 rounded overflow-hidden">
                  {ashColors.slice(1).map((c, i) => (
                    <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span className="text-deep-space-300">高</span>
              </div>
            </div>
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden bg-deep-space-900/50 p-2">
              <Heatmap data={ashHeatmap} colors={ashColors} />
            </div>
          </div>

          <div className="glass-card p-4 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-deep-space-100 text-sm flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-warning-400" />
                热辐射云图
              </h3>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-deep-space-500">低</span>
                <div className="flex h-3 w-24 rounded overflow-hidden">
                  {thermalColors.slice(1).map((c, i) => (
                    <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span className="text-danger-300">高</span>
              </div>
            </div>
            <div className="flex-1 min-h-0 rounded-lg overflow-hidden bg-deep-space-900/50 p-2">
              <Heatmap data={thermalHeatmap} colors={thermalColors} />
            </div>
          </div>
        </div>

        <div className="glass-card p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-deep-space-100 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning-400" />
              预警推送
              {taskAlerts.filter((a) => a.status === 'pending_review').length > 0 && (
                <span className="w-4 h-4 rounded-full bg-danger-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {taskAlerts.filter((a) => a.status === 'pending_review').length}
                </span>
              )}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
            {taskAlerts.length > 0 ? (
              taskAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'p-3 rounded-lg border transition-all',
                    alert.status === 'pending_review'
                      ? 'bg-warning-500/5 border-warning-500/30'
                      : 'bg-deep-space-900/50 border-deep-space-700/30'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={alert.level} />
                      <span className="text-xs text-deep-space-200">
                        {alertTypeLabels[alert.type] || alert.type}
                      </span>
                    </div>
                    <StatusBadge status={alert.status} />
                  </div>
                  <p className="text-xs text-deep-space-300 mb-1">{alert.message}</p>
                  <div className="flex items-center justify-between text-xs text-deep-space-500 font-data mb-2">
                    <span>阈值: {alert.type === 'plume_height' ? `${(alert.threshold / 1000).toFixed(0)} km` : alert.threshold}</span>
                    <span>实际: {alert.type === 'plume_height' ? `${(alert.actualValue / 1000).toFixed(1)} km` : alert.actualValue}</span>
                  </div>
                  <p className="text-[10px] text-deep-space-500 font-data mb-2">
                    {formatDate(alert.createdAt)}
                  </p>
                  {alert.status === 'pending_review' && (
                    <div className="space-y-2">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleReviewAlert(alert, 'reviewed')}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs bg-data-500/10 text-data-400 border border-data-500/30 hover:bg-data-500/20 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          复核通过
                        </button>
                        <button
                          onClick={() => setAdjustingAlertId(alert.id)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs bg-warning-500/10 text-warning-400 border border-warning-500/30 hover:bg-warning-500/20 transition-colors"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          调整参数
                        </button>
                        <button
                          onClick={() => handleReviewAlert(alert, 'ignored')}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs bg-deep-space-700/30 text-deep-space-400 border border-deep-space-600/30 hover:bg-deep-space-700/50 transition-colors"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          忽略
                        </button>
                      </div>
                      {adjustingAlertId === alert.id && (
                        <div className="space-y-2 p-2 rounded bg-deep-space-900/50 border border-warning-500/20">
                          <textarea
                            value={adjustReason}
                            onChange={(e) => setAdjustReason(e.target.value)}
                            placeholder="请输入调整理由..."
                            className="w-full px-2 py-1.5 text-xs bg-deep-space-900/50 border border-deep-space-600/50 rounded text-deep-space-200 placeholder-deep-space-500 focus:outline-none focus:border-warning-500/50 resize-none"
                            rows={2}
                          />
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleReviewAlert(alert, 'adjusted')}
                              disabled={!adjustReason.trim()}
                              className={cn(
                                'flex-1 py-1.5 rounded text-xs bg-warning-500/20 text-warning-300 border border-warning-500/30 hover:bg-warning-500/30 transition-colors',
                                !adjustReason.trim() && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              确认调整
                            </button>
                            <button
                              onClick={() => { setAdjustingAlertId(null); setAdjustReason(''); }}
                              className="px-2 py-1.5 rounded text-xs text-deep-space-400 hover:text-deep-space-200 transition-colors"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-deep-space-500 text-sm text-center px-4">
                暂无预警信息
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

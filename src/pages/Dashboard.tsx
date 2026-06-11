import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Target,
  AlertTriangle,
  TrendingUp,
  Activity,
  Flame,
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
  Legend,
} from 'recharts';
import DataCard from '@/components/UI/DataCard';
import StatusBadge from '@/components/UI/StatusBadge';
import ProgressBar from '@/components/UI/ProgressBar';
import { useAppStore } from '@/store';
import { formatDate } from '@/utils/helpers';

const alertTypeLabels: Record<string, string> = {
  plume_height: '喷发柱高度',
  ash_concentration: '火山灰浓度',
  thermal_radiation: '热辐射',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    dashboardStats,
    tasks,
    alerts,
    fetchDashboardStats,
    fetchTasks,
    fetchAlerts,
  } = useAppStore();

  useEffect(() => {
    fetchDashboardStats();
    fetchTasks();
    fetchAlerts();
  }, [fetchDashboardStats, fetchTasks, fetchAlerts]);

  const activeTasks = tasks
    .filter((t) => t.status !== 'completed' && t.status !== 'error_fallback')
    .slice(0, 5);

  const recentAlerts = [...alerts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const trendData = dashboardStats.dailyTrend.map((item) => ({
    date: item.date.slice(5),
    完成率: Number(item.completionRate.toFixed(1)),
    精度: Number(item.accuracy.toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard
          title="总任务数"
          value={dashboardStats.totalTasks}
          icon={<ClipboardList className="w-6 h-6" />}
          variant="data"
          trend={5.2}
          trendDirection="up"
          subtext={`活跃任务 ${dashboardStats.activeTasks} 个`}
        />
        <DataCard
          title="完成率"
          value={`${(dashboardStats.completionRate * 100).toFixed(1)}%`}
          icon={<Target className="w-6 h-6" />}
          variant="lava"
          trend={2.8}
          trendDirection="up"
          subtext={`平均耗时 ${dashboardStats.averageLeadTime} 分钟`}
        />
        <DataCard
          title="预警次数"
          value={dashboardStats.totalAlerts}
          icon={<AlertTriangle className="w-6 h-6" />}
          variant="warning"
          trend={1.5}
          trendDirection="down"
          subtext="近30天累计"
        />
        <DataCard
          title="平均预测精度"
          value={`${(dashboardStats.averageAccuracy * 100).toFixed(1)}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          variant="data"
          trend={0.9}
          trendDirection="up"
          subtext="模型评估指标"
        />
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title mb-0">
            <Activity className="w-5 h-5 text-data-400" />
            性能趋势（近30天）
          </h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-data-400" />
              <span className="text-deep-space-300">完成率 (%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-lava-400" />
              <span className="text-deep-space-300">预测精度 (%)</span>
            </div>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F4A85" opacity={0.3} />
              <XAxis dataKey="date" stroke="#7294BE" tick={{ fontSize: 12 }} />
              <YAxis stroke="#7294BE" tick={{ fontSize: 12 }} domain={[50, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0A1628',
                  border: '1px solid #2E5E9E',
                  borderRadius: '8px',
                  color: '#C5D0E3',
                }}
                labelStyle={{ color: '#E8EDF5' }}
              />
              <Line
                type="monotone"
                dataKey="完成率"
                stroke="#00D4AA"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#00D4AA' }}
              />
              <Line
                type="monotone"
                dataKey="精度"
                stroke="#FF6B35"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#FF6B35' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">
              <Flame className="w-5 h-5 text-lava-400" />
              活跃任务
            </h3>
            <button
              onClick={() => navigate('/tasks')}
              className="flex items-center gap-1 text-sm text-data-400 hover:text-data-300 transition-colors"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {activeTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/tasks/${task.id}`)}
                className="p-4 rounded-lg bg-deep-space-900/50 border border-deep-space-700/30 hover:border-data-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1 mr-3">
                    <h4 className="font-display font-medium text-deep-space-50 truncate group-hover:text-data-400 transition-colors">
                      {task.name}
                    </h4>
                    <p className="text-sm text-deep-space-400 mt-0.5">{task.volcanoName}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
                <ProgressBar
                  value={task.progress}
                  color={task.status === 'error_fallback' ? 'danger' : 'data'}
                  showLabel
                  size="sm"
                />
              </div>
            ))}
            {activeTasks.length === 0 && (
              <div className="py-10 text-center text-deep-space-400">
                暂无活跃任务
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">
              <AlertTriangle className="w-5 h-5 text-warning-400" />
              最新预警
            </h3>
            <button
              onClick={() => navigate('/alerts')}
              className="flex items-center gap-1 text-sm text-data-400 hover:text-data-300 transition-colors"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-lg bg-deep-space-900/50 border border-deep-space-700/30 hover:border-warning-500/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-deep-space-100">
                        {alertTypeLabels[alert.type] || alert.type}
                      </span>
                      <StatusBadge status={alert.level} />
                    </div>
                    <p className="text-sm text-deep-space-400 mt-1">
                      阈值: {alert.threshold} | 实际值: {alert.actualValue}
                    </p>
                    <p className="text-xs text-deep-space-500 mt-1 font-data">
                      {formatDate(alert.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={alert.status} />
                </div>
              </div>
            ))}
            {recentAlerts.length === 0 && (
              <div className="py-10 text-center text-deep-space-400">
                暂无预警
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

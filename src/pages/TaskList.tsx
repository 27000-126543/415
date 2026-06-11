import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Mountain,
  Gauge,
} from 'lucide-react';
import StatusBadge from '@/components/UI/StatusBadge';
import ProgressBar from '@/components/UI/ProgressBar';
import Timeline from '@/components/UI/Timeline';
import { useAppStore } from '@/store';
import { formatDate } from '@/utils/helpers';
import type { TaskStatus } from '../../shared/types';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 6;

const statusOptions: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending_verification', label: '待验证' },
  { value: 'mesh_generation', label: '网格生成' },
  { value: 'eruption_calculation', label: '喷发计算' },
  { value: 'diffusion_simulation', label: '扩散模拟' },
  { value: 'settlement_analysis', label: '沉降分析' },
  { value: 'completed', label: '已完成' },
  { value: 'error_fallback', label: '错误回退' },
];

const intensityOptions = [
  { value: 'all', label: '全部强度' },
  { value: 'low', label: '低强度' },
  { value: 'medium', label: '中等强度' },
  { value: 'high', label: '高强度' },
  { value: 'severe', label: '极端强度' },
];

function getTaskTimeline(task: { status: TaskStatus; createdAt: string; currentStageStartTime: string }) {
  const stages: { id: string; status: TaskStatus; title: string }[] = [
    { id: '1', status: 'pending_verification', title: '待验证' },
    { id: '2', status: 'mesh_generation', title: '网格生成' },
    { id: '3', status: 'eruption_calculation', title: '喷发计算' },
    { id: '4', status: 'diffusion_simulation', title: '扩散模拟' },
    { id: '5', status: 'settlement_analysis', title: '沉降分析' },
    { id: '6', status: 'completed', title: '已完成' },
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

function getIntensityLevel(initialPressure: number): string {
  if (initialPressure < 8) return 'low';
  if (initialPressure < 12) return 'medium';
  if (initialPressure < 16) return 'high';
  return 'severe';
}

export default function TaskList() {
  const navigate = useNavigate();
  const { tasks, fetchTasks } = useAppStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [intensityFilter, setIntensityFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (search && !task.volcanoName.toLowerCase().includes(search.toLowerCase()) &&
          !task.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }
      if (intensityFilter !== 'all') {
        const intensity = getIntensityLevel(task.eruptionParams.initialPressure);
        if (intensity !== intensityFilter) return false;
      }
      if (dateFrom) {
        if (new Date(task.createdAt) < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        if (new Date(task.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
      }
      return true;
    });
  }, [tasks, search, statusFilter, intensityFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE));
  const pagedTasks = filteredTasks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, intensityFilter, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-deep-space-400" />
            <input
              type="text"
              placeholder="搜索火山名称或任务名..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-deep-space-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
              className="input-field min-w-[140px]"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-deep-space-800">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-deep-space-400" />
            <select
              value={intensityFilter}
              onChange={(e) => setIntensityFilter(e.target.value)}
              className="input-field min-w-[140px]"
            >
              {intensityOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-deep-space-800">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-deep-space-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-field min-w-[140px]"
            />
            <span className="text-deep-space-400">至</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-field min-w-[140px]"
            />
          </div>

          <button
            onClick={() => navigate('/tasks/create')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新建任务
          </button>
        </div>
      </div>

      {pagedTasks.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {pagedTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/tasks/${task.id}`)}
                className="glass-card-hover p-5 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1 mr-3">
                    <h3 className="font-display font-semibold text-deep-space-50 truncate group-hover:text-data-400 transition-colors">
                      {task.name}
                    </h3>
                    <p className="text-sm text-deep-space-400 mt-0.5">{task.volcanoName}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>

                <ProgressBar
                  value={task.progress}
                  color={task.status === 'error_fallback' ? 'danger' : 'data'}
                  showLabel
                  size="sm"
                  className="mb-4"
                />

                <div className="text-xs text-deep-space-400 mb-3 font-data">
                  创建于 {formatDate(task.createdAt)}
                </div>

                <div className="pt-3 border-t border-deep-space-700/30">
                  <Timeline items={getTaskTimeline(task)} />
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={cn(
                  'p-2 rounded-lg border transition-all',
                  page === 1
                    ? 'border-deep-space-700/30 text-deep-space-500 cursor-not-allowed'
                    : 'border-deep-space-600/50 text-deep-space-200 hover:border-data-500/50 hover:text-data-400'
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-9 h-9 rounded-lg text-sm font-medium transition-all border',
                    page === p
                      ? 'bg-data-500/20 border-data-500/50 text-data-400 shadow-glow-cyan'
                      : 'border-deep-space-600/50 text-deep-space-200 hover:border-data-500/30 hover:text-data-400'
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={cn(
                  'p-2 rounded-lg border transition-all',
                  page === totalPages
                    ? 'border-deep-space-700/30 text-deep-space-500 cursor-not-allowed'
                    : 'border-deep-space-600/50 text-deep-space-200 hover:border-data-500/50 hover:text-data-400'
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="glass-card py-20 text-center">
          <Filter className="w-12 h-12 text-deep-space-500 mx-auto mb-4" />
          <p className="text-deep-space-300">没有找到匹配的任务</p>
          <p className="text-sm text-deep-space-500 mt-1">请尝试调整筛选条件</p>
        </div>
      )}
    </div>
  );
}

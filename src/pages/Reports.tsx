import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileBarChart,
  Download,
  Eye,
  Mountain,
  Calendar,
  AlertTriangle,
  Plane,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { formatDate } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import type { AviationRiskLevel } from '../../shared/types';

const riskLevelConfig: Record<AviationRiskLevel, { label: string; className: string }> = {
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

export default function Reports() {
  const navigate = useNavigate();
  const { reports, tasks, fetchReports, fetchTasks } = useAppStore();

  useEffect(() => {
    fetchReports();
    fetchTasks();
  }, [fetchReports, fetchTasks]);

  const getTaskById = (taskId: string) => tasks.find((t) => t.id === taskId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-deep-space-50 flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-data-400" />
            报告中心
          </h2>
          <p className="text-sm text-deep-space-400 mt-1">
            查看和下载所有已生成的模拟报告
          </p>
        </div>
      </div>

      {reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {reports.map((report) => {
            const task = getTaskById(report.taskId);
            const riskConfig = riskLevelConfig[report.aviationRiskLevel];

            return (
              <div
                key={report.id}
                className="glass-card-hover p-5 flex flex-col group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-data-500/10 flex items-center justify-center border border-data-500/30">
                    <FileBarChart className="w-6 h-6 text-data-400" />
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                      riskConfig.className
                    )}
                  >
                    <Plane className="w-3 h-3" />
                    {riskConfig.label}
                  </span>
                </div>

                <h3 className="font-display font-semibold text-deep-space-50 mb-2 group-hover:text-data-400 transition-colors line-clamp-2">
                  {report.title}
                </h3>

                <p className="text-sm text-deep-space-400 mb-4 line-clamp-3 flex-1">
                  {report.summary}
                </p>

                <div className="space-y-2 mb-4 pt-4 border-t border-deep-space-700/30">
                  <div className="flex items-center gap-2 text-sm">
                    <Mountain className="w-4 h-4 text-lava-400" />
                    <span className="text-deep-space-400">火山:</span>
                    <span className="text-deep-space-200">{task?.volcanoName || '未知'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-data-400" />
                    <span className="text-deep-space-400">生成时间:</span>
                    <span className="text-deep-space-200 font-data">{formatDate(report.generatedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/reports/${report.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-data-500/10 text-data-400 border border-data-500/30 hover:bg-data-500/20 transition-colors text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    预览
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-deep-space-700/50 text-deep-space-200 border border-deep-space-600/50 hover:bg-deep-space-700 transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    下载
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card py-20 text-center">
          <FileBarChart className="w-12 h-12 text-deep-space-500 mx-auto mb-4" />
          <p className="text-deep-space-300">暂无报告</p>
          <p className="text-sm text-deep-space-500 mt-1">
            模拟任务完成后将自动生成报告
          </p>
        </div>
      )}
    </div>
  );
}

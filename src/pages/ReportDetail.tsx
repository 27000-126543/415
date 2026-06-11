import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  Activity,
  Mountain,
  Wind,
  Thermometer,
  Layers,
  Plane,
  ChevronDown,
  AlertCircle,
  Loader2,
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
  ReferenceLine,
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAppStore } from '@/store';
import { formatDate } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import type { AviationRiskLevel, GridPoint } from '../../shared/types';

const riskLevelConfig: Record<AviationRiskLevel, { label: string; className: string; description: string }> = {
  low: {
    label: '低风险',
    className: 'bg-data-500/20 text-data-400 border-data-500/30',
    description: '火山灰浓度低于安全阈值，对航空飞行影响较小',
  },
  medium: {
    label: '中等风险',
    className: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
    description: '部分空域火山灰浓度较高，建议调整航线',
  },
  high: {
    label: '高风险',
    className: 'bg-lava-500/20 text-lava-400 border-lava-500/30',
    description: '大范围空域受火山灰影响，建议暂停相关航线',
  },
  severe: {
    label: '严重风险',
    className: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
    description: '极端危险，立即停止所有受影响区域的航空活动',
  },
};

function ContourMap({ data, title, colors }: { data: GridPoint[]; title: string; colors: string[] }) {
  const gridSize = Math.ceil(Math.sqrt(data.length));
  const values = data.map((p) => p.value);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-deep-space-200">{title}</h4>
      <div className="rounded-lg overflow-hidden bg-deep-space-900/50 border border-deep-space-700/30 p-3">
        <div
          className="grid gap-0 w-full aspect-square"
          style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
        >
          {data.map((point, idx) => {
            const normalized = maxVal === minVal ? 0.5 : (point.value - minVal) / (maxVal - minVal);
            const colorIdx = Math.min(colors.length - 1, Math.floor(normalized * (colors.length - 1)));
            return (
              <div
                key={idx}
                className="aspect-square"
                style={{ backgroundColor: colors[colorIdx] }}
                title={`值: ${point.value.toFixed(2)}`}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-3 text-xs">
          <span className="text-deep-space-500">{minVal.toFixed(1)}</span>
          <div className="flex h-3 flex-1 mx-3 rounded overflow-hidden">
            {colors.map((c, i) => (
              <div key={i} className="flex-1" style={{ backgroundColor: c }} />
            ))}
          </div>
          <span className="text-deep-space-300">{maxVal.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { reports, tasks, fetchReports, fetchTasks } = useAppStore();
  const [exportOpen, setExportOpen] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const reportContentRef = useRef<HTMLDivElement>(null);

  const report = useMemo(() => reports.find((r) => r.id === id), [reports, id]);
  const task = useMemo(() => (report ? tasks.find((t) => t.id === report.taskId) : undefined), [tasks, report]);

  const isTaskCompleted = useMemo(() => {
    if (!task) return false;
    return task.status === 'completed';
  }, [task]);

  const hasValidLayers = useMemo(() => {
    if (!report) return false;
    return (
      report.ashDistribution && report.ashDistribution.length > 0 &&
      report.thermalRadiationMap && report.thermalRadiationMap.length > 0 &&
      report.settlementThickness && report.settlementThickness.length > 0
    );
  }, [report]);

  useEffect(() => {
    fetchReports();
    fetchTasks();
  }, [fetchReports, fetchTasks]);

  const handleDownloadPdf = useCallback(async () => {
    if (!reportContentRef.current || !report) return;
    setGeneratingPdf(true);
    try {
      const el = reportContentRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0A1628',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);

      while (heightLeft > 0) {
        position = -(pdfHeight - 20 - 10) + position;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      pdf.save(`${report.title || '火山模拟报告'}.pdf`);
    } catch (err) {
      console.error('PDF生成失败:', err);
    } finally {
      setGeneratingPdf(false);
    }
  }, [report]);

  const plumeData = useMemo(
    () =>
      report?.plumeHeightChart.map((m, index) => ({
        time: `${String(index).padStart(2, '0')}h`,
        height: Math.round(m.plumeHeight / 100) / 10,
        ash: Math.round(m.ashConcentration),
        thermal: Math.round(m.thermalRadiation),
      })) || [],
    [report]
  );

  const heightColors = [
    'rgba(10, 22, 40, 0.3)',
    'rgba(46, 94, 158, 0.5)',
    'rgba(0, 212, 170, 0.7)',
    'rgba(244, 196, 48, 0.85)',
    'rgba(255, 107, 53, 1)',
  ];

  const ashColors = [
    'rgba(10, 22, 40, 0)',
    'rgba(106, 120, 150, 0.3)',
    'rgba(150, 160, 180, 0.55)',
    'rgba(120, 100, 80, 0.8)',
    'rgba(60, 40, 20, 1)',
  ];

  const thermalColors = [
    'rgba(10, 22, 40, 0)',
    'rgba(46, 94, 158, 0.4)',
    'rgba(0, 212, 170, 0.6)',
    'rgba(255, 107, 53, 0.85)',
    'rgba(230, 57, 70, 1)',
  ];

  const settlementColors = [
    'rgba(10, 22, 40, 0)',
    'rgba(106, 120, 150, 0.25)',
    'rgba(244, 196, 48, 0.5)',
    'rgba(255, 107, 53, 0.75)',
    'rgba(120, 60, 20, 1)',
  ];

  const aviationColors = [
    'rgba(0, 212, 170, 0.4)',
    'rgba(244, 196, 48, 0.5)',
    'rgba(255, 107, 53, 0.7)',
    'rgba(230, 57, 70, 0.85)',
    'rgba(180, 20, 30, 1)',
  ];

  if (!report) {
    return (
      <div className="glass-card py-20 text-center">
        <AlertCircle className="w-12 h-12 text-danger-400 mx-auto mb-4" />
        <p className="text-deep-space-200 mb-4">报告不存在</p>
        <button onClick={() => navigate('/reports')} className="btn-primary">
          返回报告列表
        </button>
      </div>
    );
  }

  const riskConfig = riskLevelConfig[report.aviationRiskLevel];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-1 text-deep-space-300 hover:text-deep-space-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="font-display text-xl font-bold text-deep-space-50">{report.title}</h2>
              {!isTaskCompleted && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-warning-500/20 text-warning-400 border-warning-500/30">
                  <AlertCircle className="w-3 h-3" />
                  未完成报告
                </span>
              )}
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
            <p className="text-sm text-deep-space-400 mt-1">
              {task?.volcanoName || '未知火山'} · 生成于 {formatDate(report.generatedAt)}
              {!isTaskCompleted && task && ` · 任务状态：${task.status === 'error_fallback' ? '异常回退' : '计算中'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={generatingPdf}
            className={cn('btn-primary flex items-center gap-2', generatingPdf && 'opacity-70 cursor-not-allowed')}
          >
            {generatingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {generatingPdf ? '正在生成...' : '下载 PDF'}
          </button>
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="btn-lava flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              导出数据
              <ChevronDown className={cn('w-4 h-4 transition-transform', exportOpen && 'rotate-180')} />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 glass-card border border-deep-space-600/50 overflow-hidden z-50">
                <button className="w-full px-4 py-2.5 text-left text-sm text-deep-space-200 hover:bg-deep-space-800/50 transition-colors flex items-center gap-2">
                  <FileText className="w-4 h-4 text-data-400" />
                  按强度等级导出
                </button>
                <button className="w-full px-4 py-2.5 text-left text-sm text-deep-space-200 hover:bg-deep-space-800/50 transition-colors flex items-center gap-2">
                  <FileText className="w-4 h-4 text-lava-400" />
                  按大气条件导出
                </button>
                <button className="w-full px-4 py-2.5 text-left text-sm text-deep-space-200 hover:bg-deep-space-800/50 transition-colors flex items-center gap-2">
                  <FileText className="w-4 h-4 text-warning-400" />
                  按时间窗口导出
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card p-6" ref={reportContentRef}>
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center border-b border-deep-space-700/30 pb-6">
            <h1 className="font-display text-2xl font-bold text-deep-space-50 mb-3">
              {report.title}
            </h1>
            <div className="flex items-center justify-center gap-4 flex-wrap text-sm text-deep-space-400">
              <span className="flex items-center gap-1">
                <Mountain className="w-4 h-4" />
                {task?.volcanoName || '未知火山'}
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                {formatDate(report.generatedAt)}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-deep-space-900/50 border border-deep-space-700/30">
            <h3 className="font-display font-semibold text-deep-space-100 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-data-400" />
              报告摘要
            </h3>
            <p className="text-sm text-deep-space-300 leading-relaxed">{report.summary}</p>
          </div>

          <div
            className={cn(
              'p-4 rounded-lg border',
              `bg-${report.aviationRiskLevel === 'low' ? 'data' : report.aviationRiskLevel === 'medium' ? 'warning' : report.aviationRiskLevel === 'high' ? 'lava' : 'danger'}-500/5`,
              riskConfig.className
            )}
          >
            <h3 className="font-display font-semibold mb-2 flex items-center gap-2">
              <Plane className="w-4 h-4" />
              航空风险评估
            </h3>
            <p className="text-sm leading-relaxed">{riskConfig.description}</p>
          </div>

          <div>
            <h3 className="section-title">
              <Activity className="w-5 h-5 text-data-400" />
              喷发柱演化曲线
            </h3>
            <div className="h-64 glass-card p-4">
              {plumeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={plumeData}>
                    <defs>
                      <linearGradient id="reportHeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F4A85" opacity={0.2} />
                    <XAxis dataKey="time" stroke="#7294BE" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#7294BE" tick={{ fontSize: 11 }} unit=" km" />
                    <ReferenceLine y={12} stroke="#E63946" strokeDasharray="6 3" label={{ value: '平流层 12km', position: 'right', fill: '#E63946', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0A1628',
                        border: '1px solid #2E5E9E',
                        borderRadius: '8px',
                        color: '#C5D0E3',
                      }}
                      formatter={(value: number) => [`${value} km`, '喷发柱高度']}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="height"
                      name="喷发柱高度 (km)"
                      stroke="#00D4AA"
                      strokeWidth={2.5}
                      fill="url(#reportHeight)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-deep-space-500">
                  暂无数据
                </div>
              )}
            </div>
          </div>

          {!isTaskCompleted && (
            <div className="p-4 rounded-lg bg-warning-500/10 border border-warning-500/30">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-warning-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning-400 mb-1">报告未完成</p>
                  <p className="text-deep-space-300">
                    当前任务尚未完成全部计算，下方部分数据可能不完整。请等待任务完成后查看完整报告。
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hasValidLayers ? (
              <>
                <ContourMap
                  data={report.ashDistribution}
                  title="火山灰浓度等值面 (μg/m³)"
                  colors={ashColors}
                />
                <ContourMap
                  data={report.thermalRadiationMap}
                  title="热辐射云图 (W/m²)"
                  colors={thermalColors}
                />
                <ContourMap
                  data={report.settlementThickness}
                  title="沉降厚度分布 (cm)"
                  colors={settlementColors}
                />
              </>
            ) : (
              <div className="md:col-span-2 glass-card p-8 text-center">
                <Layers className="w-12 h-12 text-deep-space-500 mx-auto mb-3 opacity-50" />
                <p className="text-deep-space-400 mb-2">图层数据加载中</p>
                <p className="text-xs text-deep-space-500">
                  {isTaskCompleted ? '正在补全报告图层数据，请稍候...' : '任务完成后将自动生成图层数据'}
                </p>
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium text-deep-space-200 mb-3 flex items-center gap-2">
                <Plane className="w-4 h-4" />
                航空风险区域图
              </h4>
              <div className="rounded-lg overflow-hidden bg-deep-space-900/50 border border-deep-space-700/30 p-3">
                <div
                  className="grid gap-0 w-full aspect-square"
                  style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}
                >
                  {Array.from({ length: 64 }).map((_, idx) => {
                    const x = idx % 8;
                    const y = Math.floor(idx / 8);
                    const centerDist = Math.sqrt((x - 3.5) ** 2 + (y - 3.5) ** 2);
                    const riskLevel = Math.max(0, Math.min(4, Math.floor(4 - centerDist / 1.5 + (Math.random() - 0.5))));
                    return (
                      <div
                        key={idx}
                        className="aspect-square"
                        style={{ backgroundColor: aviationColors[riskLevel] }}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-3 text-xs">
                  <span className="text-data-400">安全</span>
                  <div className="flex h-3 flex-1 mx-3 rounded overflow-hidden">
                    {aviationColors.map((c, i) => (
                      <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-danger-400">危险</span>
                </div>
              </div>
            </div>
          </div>

          {task && (
            <div className="pt-6 border-t border-deep-space-700/30">
              <h3 className="section-title">
                <Layers className="w-5 h-5 text-lava-400" />
                模拟参数
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-deep-space-900/50 border border-deep-space-700/30">
                  <p className="text-deep-space-400 text-xs mb-1">喷口直径</p>
                  <p className="text-deep-space-100 font-data">{task.eruptionParams.ventDiameter} m</p>
                </div>
                <div className="p-3 rounded-lg bg-deep-space-900/50 border border-deep-space-700/30">
                  <p className="text-deep-space-400 text-xs mb-1">初始压力</p>
                  <p className="text-deep-space-100 font-data">{task.eruptionParams.initialPressure} MPa</p>
                </div>
                <div className="p-3 rounded-lg bg-deep-space-900/50 border border-deep-space-700/30">
                  <p className="text-deep-space-400 text-xs mb-1">温度</p>
                  <p className="text-deep-space-100 font-data">{task.eruptionParams.initialTemperature} °C</p>
                </div>
                <div className="p-3 rounded-lg bg-deep-space-900/50 border border-deep-space-700/30">
                  <p className="text-deep-space-400 text-xs mb-1">H₂O 含量</p>
                  <p className="text-deep-space-100 font-data">{task.eruptionParams.h2oContent} wt%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

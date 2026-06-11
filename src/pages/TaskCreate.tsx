import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  File,
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  Sparkles,
  Mountain,
  Info,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { formatFileSize } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import type { MagmaComposition, EruptionSourceParams, DemFile } from '../../shared/types';

interface FormData {
  name: string;
  volcanoName: string;
  demFile: DemFile | null;
  magmaComposition: MagmaComposition;
  eruptionParams: EruptionSourceParams;
}

const defaultFormData: FormData = {
  name: '',
  volcanoName: '',
  demFile: null,
  magmaComposition: {
    sio2: 65,
    al2o3: 16,
    feo: 5,
    mgo: 3,
    cao: 5,
    na2o: 4,
    k2o: 2,
  },
  eruptionParams: {
    ventDiameter: 100,
    initialPressure: 10,
    initialTemperature: 1100,
    h2oContent: 3,
    co2Content: 0.3,
    so2Content: 0.15,
  },
};

const oxideLabels: Record<keyof MagmaComposition, { label: string; unit: string; min: number; max: number }> = {
  sio2: { label: 'SiO₂ 二氧化硅', unit: '%', min: 45, max: 80 },
  al2o3: { label: 'Al₂O₃ 氧化铝', unit: '%', min: 10, max: 20 },
  feo: { label: 'FeO 氧化铁', unit: '%', min: 1, max: 15 },
  mgo: { label: 'MgO 氧化镁', unit: '%', min: 0.5, max: 10 },
  cao: { label: 'CaO 氧化钙', unit: '%', min: 1, max: 12 },
  na2o: { label: 'Na₂O 氧化钠', unit: '%', min: 1, max: 6 },
  k2o: { label: 'K₂O 氧化钾', unit: '%', min: 0.5, max: 4 },
};

const eruptionLabels: Record<keyof EruptionSourceParams, { label: string; unit: string; min: number; max: number; step: number }> = {
  ventDiameter: { label: '喷口直径', unit: 'm', min: 10, max: 500, step: 10 },
  initialPressure: { label: '初始压力', unit: 'MPa', min: 1, max: 30, step: 0.5 },
  initialTemperature: { label: '温度', unit: '°C', min: 700, max: 1500, step: 50 },
  h2oContent: { label: 'H₂O 含量', unit: 'wt%', min: 0.1, max: 8, step: 0.1 },
  co2Content: { label: 'CO₂ 含量', unit: 'wt%', min: 0.01, max: 2, step: 0.05 },
  so2Content: { label: 'SO₂ 含量', unit: 'wt%', min: 0.01, max: 1, step: 0.05 },
};

export default function TaskCreate() {
  const navigate = useNavigate();
  const { createTask, isVolcanoPaused, loading } = useAppStore();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [isDragging, setIsDragging] = useState(false);
  const [volcanoPauseError, setVolcanoPauseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setFormData((prev) => ({
        ...prev,
        demFile: {
          name: file.name,
          size: file.size,
          path: URL.createObjectURL(file),
        },
      }));
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFormData((prev) => ({
        ...prev,
        demFile: {
          name: file.name,
          size: file.size,
          path: URL.createObjectURL(file),
        },
      }));
    }
  };

  const handleApplyRecommendation = () => {
    setFormData((prev) => ({
      ...prev,
      magmaComposition: {
        sio2: 68,
        al2o3: 15,
        feo: 4,
        mgo: 2.5,
        cao: 4,
        na2o: 3.8,
        k2o: 2.7,
      },
      eruptionParams: {
        ventDiameter: 120,
        initialPressure: 12,
        initialTemperature: 1150,
        h2oContent: 3.5,
        co2Content: 0.35,
        so2Content: 0.2,
      },
    }));
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.name.trim() && formData.volcanoName.trim();
    }
    if (step === 2) {
      return formData.demFile !== null;
    }
    return true;
  };

  const handleSubmit = async () => {
    setVolcanoPauseError(null);
    if (isVolcanoPaused(formData.volcanoName)) {
      setVolcanoPauseError(
        `火山「${formData.volcanoName}」因连续三次喷发柱高度偏差超过20%已被暂停新任务，已通知首席科学家复核`
      );
      return;
    }
    const task = await createTask({
      name: formData.name,
      volcanoName: formData.volcanoName,
      magmaComposition: formData.magmaComposition,
      eruptionParams: formData.eruptionParams,
    });
    if (task) {
      navigate(`/tasks/${task.id}`);
    }
  };

  const steps = [
    { id: 1, label: '基本信息' },
    { id: 2, label: 'DEM上传' },
    { id: 3, label: '参数配置' },
  ];

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <div className="flex items-center justify-center gap-4">
          {steps.map((s, index) => (
            <div key={s.id} className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-all',
                    step >= s.id
                      ? 'bg-data-500/20 border-data-500/50 text-data-400 shadow-glow-cyan'
                      : 'bg-deep-space-700/50 border-deep-space-600/50 text-deep-space-400'
                  )}
                >
                  {s.id}
                </div>
                <span
                  className={cn(
                    'font-medium text-sm',
                    step >= s.id ? 'text-deep-space-100' : 'text-deep-space-400'
                  )}
                >
                  {s.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-16 h-0.5 rounded-full',
                    step > s.id ? 'bg-data-500/50' : 'bg-deep-space-700'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 min-h-[500px]">
        {step === 1 && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h3 className="section-title">
                <Mountain className="w-5 h-5 text-data-400" />
                任务基本信息
              </h3>
              <p className="text-sm text-deep-space-400 -mt-2 mb-6">
                请填写模拟任务的基础信息
              </p>
            </div>

            <div>
              <label className="label-text">任务名称 <span className="text-danger-400">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：富士山2024年喷发模拟"
                className="input-field"
              />
            </div>

            <div>
              <label className="label-text">火山名称 <span className="text-danger-400">*</span></label>
              <input
                type="text"
                value={formData.volcanoName}
                onChange={(e) => setFormData({ ...formData, volcanoName: e.target.value })}
                placeholder="例如：富士山"
                className="input-field"
              />
            </div>

            <div className="p-4 rounded-lg bg-data-500/5 border border-data-500/20">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-data-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-deep-space-300">
                  <p className="font-medium text-data-400 mb-1">提示</p>
                  <p>任务名称和火山名称将用于后续报告生成和数据归档，请确保信息准确。</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h3 className="section-title">
                <Upload className="w-5 h-5 text-lava-400" />
                DEM 数据上传
              </h3>
              <p className="text-sm text-deep-space-400 -mt-2 mb-6">
                上传火山区域的数字高程模型（DEM）文件
              </p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all',
                isDragging
                  ? 'border-data-500/60 bg-data-500/5 shadow-glow-cyan'
                  : 'border-deep-space-600/50 hover:border-deep-space-500/50 bg-deep-space-900/30'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".tif,.tiff,.dem,.asc,.img"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-deep-space-700/50 flex items-center justify-center mx-auto mb-4 border border-deep-space-600/30">
                <Upload className="w-8 h-8 text-deep-space-400" />
              </div>
              <p className="font-medium text-deep-space-100 mb-1">
                拖拽文件到此处，或点击上传
              </p>
              <p className="text-sm text-deep-space-400">
                支持 .tif, .tiff, .dem, .asc, .img 格式，建议文件小于 100MB
              </p>
            </div>

            {formData.demFile && (
              <div className="p-4 rounded-lg bg-deep-space-900/50 border border-data-500/30 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-data-500/10 flex items-center justify-center border border-data-500/30">
                  <File className="w-6 h-6 text-data-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-deep-space-100 truncate">{formData.demFile.name}</p>
                  <p className="text-sm text-deep-space-400 font-data">{formatFileSize(formData.demFile.size)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData({ ...formData, demFile: null });
                  }}
                  className="p-2 rounded-lg text-deep-space-400 hover:text-danger-400 hover:bg-danger-500/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="section-title mb-0">
                  <Sparkles className="w-5 h-5 text-warning-400" />
                  参数配置
                </h3>
                <p className="text-sm text-deep-space-400 mt-1">
                  配置岩浆成分和喷发参数，或使用智能推荐
                </p>
              </div>
              <button
                onClick={handleApplyRecommendation}
                className="btn-warning flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                智能推荐参数
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-display font-semibold text-deep-space-100 flex items-center gap-2">
                  <span className="w-1 h-5 bg-lava-500 rounded-full" />
                  岩浆成分（氧化物百分比）
                </h4>
                <div className="glass-card p-5 space-y-5">
                  {(Object.keys(oxideLabels) as (keyof MagmaComposition)[]).map((key) => {
                    const config = oxideLabels[key];
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-deep-space-200">{config.label}</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={formData.magmaComposition[key]}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  magmaComposition: {
                                    ...formData.magmaComposition,
                                    [key]: Number(e.target.value),
                                  },
                                })
                              }
                              min={config.min}
                              max={config.max}
                              step={0.1}
                              className="w-20 px-2 py-1 text-sm text-right bg-deep-space-900/50 border border-deep-space-600/50 rounded text-data-400 font-data focus:outline-none focus:border-data-500/50"
                            />
                            <span className="text-xs text-deep-space-400 w-6">{config.unit}</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          value={formData.magmaComposition[key]}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              magmaComposition: {
                                ...formData.magmaComposition,
                                [key]: Number(e.target.value),
                              },
                            })
                          }
                          min={config.min}
                          max={config.max}
                          step={0.1}
                          className="w-full h-1.5 bg-deep-space-700 rounded-full appearance-none cursor-pointer accent-lava-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-display font-semibold text-deep-space-100 flex items-center gap-2">
                  <span className="w-1 h-5 bg-data-500 rounded-full" />
                  喷发源参数
                </h4>
                <div className="glass-card p-5 space-y-4">
                  {(Object.keys(eruptionLabels) as (keyof EruptionSourceParams)[]).map((key) => {
                    const config = eruptionLabels[key];
                    return (
                      <div key={key}>
                        <label className="label-text">{config.label}</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={formData.eruptionParams[key]}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                eruptionParams: {
                                  ...formData.eruptionParams,
                                  [key]: Number(e.target.value),
                                },
                              })
                            }
                            min={config.min}
                            max={config.max}
                            step={config.step}
                            className="input-field flex-1"
                          />
                          <span className="text-sm text-deep-space-400 w-12">{config.unit}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : navigate('/tasks'))}
          className="flex items-center gap-2 px-4 py-2 text-deep-space-300 hover:text-deep-space-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {step > 1 ? '上一步' : '返回列表'}
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className={cn(
              'btn-primary flex items-center gap-2',
              !canProceed() && 'opacity-50 cursor-not-allowed'
            )}
          >
            下一步 <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading.createTask}
            className="btn-lava flex items-center gap-2"
          >
            {loading.createTask ? (
              <div className="w-4 h-4 border-2 border-lava-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            提交任务
          </button>
        )}
      </div>

      {volcanoPauseError && (
        <div className="p-4 rounded-lg bg-danger-500/10 border border-danger-500/30">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-danger-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger-300">{volcanoPauseError}</p>
          </div>
        </div>
      )}
    </div>
  );
}

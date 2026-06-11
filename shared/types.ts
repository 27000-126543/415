export type UserRole = 'admin' | 'volcanologist' | 'mitigation_expert' | 'chief_scientist' | 'aviation';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface MagmaComposition {
  sio2: number;
  al2o3: number;
  feo: number;
  mgo: number;
  cao: number;
  na2o: number;
  k2o: number;
}

export interface EruptionSourceParams {
  ventDiameter: number;
  initialPressure: number;
  initialTemperature: number;
  h2oContent: number;
  co2Content: number;
  so2Content: number;
}

export type TaskStatus =
  | 'pending_verification'
  | 'mesh_generation'
  | 'eruption_calculation'
  | 'diffusion_simulation'
  | 'settlement_analysis'
  | 'completed'
  | 'error_fallback';

export interface DemFile {
  name: string;
  size: number;
  path: string;
}

export interface SimulationTask {
  id: string;
  name: string;
  volcanoName: string;
  demFile?: DemFile;
  magmaComposition: MagmaComposition;
  eruptionParams: EruptionSourceParams;
  status: TaskStatus;
  progress: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  currentStageStartTime: string;
  deviationFlag?: boolean;
}

export interface MonitoringData {
  id: string;
  taskId: string;
  timestamp: string;
  plumeHeight: number;
  ashConcentration: number;
  thermalRadiation: number;
}

export type AlertLevel = 'info' | 'warning' | 'danger' | 'critical';
export type AlertStatus = 'pending_review' | 'reviewed' | 'adjusted' | 'ignored';
export type AlertType = 'plume_height' | 'ash_concentration' | 'thermal_radiation';

export interface Alert {
  id: string;
  taskId: string;
  type: AlertType;
  level: AlertLevel;
  message: string;
  threshold: number;
  actualValue: number;
  status: AlertStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface AdjustmentLog {
  id: string;
  taskId: string;
  alertId: string;
  adjustedBy: string;
  adjustments: Partial<EruptionSourceParams>;
  beforeParams: EruptionSourceParams;
  afterParams: EruptionSourceParams;
  reason: string;
  createdAt: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ApprovalStage = 'volcanologist_validation' | 'mitigation_confirmation';

export interface Approval {
  id: string;
  taskId: string;
  reportId: string;
  stage: ApprovalStage;
  status: ApprovalStatus;
  approverId: string;
  approverRole: string;
  comments: string;
  createdAt: string;
  decidedAt?: string;
}

export interface PushRecord {
  id: string;
  approvalId: string;
  taskId: string;
  targetDepartment: 'aviation' | 'emergency';
  message: string;
  pushedAt: string;
  status: 'sent' | 'delivered' | 'acknowledged';
}

export type AviationRiskLevel = 'low' | 'medium' | 'high' | 'severe';

export interface GridPoint {
  x: number;
  y: number;
  z: number;
  value: number;
}

export interface Report {
  id: string;
  taskId: string;
  title: string;
  summary: string;
  plumeHeightChart: MonitoringData[];
  ashDistribution: GridPoint[];
  thermalRadiationMap: GridPoint[];
  settlementThickness: GridPoint[];
  aviationRiskLevel: AviationRiskLevel;
  generatedAt: string;
  generatedBy: string;
}

export interface DailyTrend {
  date: string;
  completionRate: number;
  leadTime: number;
  accuracy: number;
}

export interface DashboardStats {
  totalTasks: number;
  completionRate: number;
  totalAlerts: number;
  averageAccuracy: number;
  activeTasks: number;
  averageLeadTime: number;
  dailyTrend: DailyTrend[];
}

export interface DeviationAlert {
  id: string;
  volcanoName: string;
  taskIds: string[];
  plumeHeights: number[];
  deviationPercentage: number;
  isPaused: boolean;
  createdAt: string;
  notified: boolean;
  chiefNotified: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

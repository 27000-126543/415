import { create } from 'zustand'
import type {
  User,
  SimulationTask,
  MonitoringData,
  Alert,
  AlertStatus,
  Approval,
  ApprovalStatus,
  Report,
  DashboardStats,
  DeviationAlert,
  MagmaComposition,
  EruptionSourceParams,
  TaskStatus,
  AdjustmentLog,
  PushRecord,
  GridPoint,
} from '../../shared/types'
import {
  tasksApi,
  alertsApi,
  approvalsApi,
  reportsApi,
  dashboardApi,
} from '../services/api'
import { generateAllMockData } from '@shared/mockData'

const mockData = generateAllMockData()

const defaultUser: User = {
  id: 'user_default',
  name: '李火山学家',
  email: 'li@volcano-sim.com',
  role: 'volcanologist',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=volcanologist',
  createdAt: new Date().toISOString(),
}

const STATUS_FLOW: TaskStatus[] = [
  'pending_verification',
  'mesh_generation',
  'eruption_calculation',
  'diffusion_simulation',
  'settlement_analysis',
  'completed',
]

const STATUS_PROGRESS: Record<TaskStatus, number> = {
  pending_verification: 5,
  mesh_generation: 25,
  eruption_calculation: 50,
  diffusion_simulation: 70,
  settlement_analysis: 88,
  completed: 100,
  error_fallback: 0,
}

const STAGE_DURATION_MS = 2000
const STORAGE_KEY_PUSH = 'volcano_push_records'
const STORAGE_KEY_REPORTS = 'volcano_report_layers'
const STORAGE_KEY_APPROVALS = 'volcano_approvals'

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

function getNextStatus(current: TaskStatus): TaskStatus | null {
  const idx = STATUS_FLOW.indexOf(current)
  if (idx < 0 || idx >= STATUS_FLOW.length - 1) return null
  return STATUS_FLOW[idx + 1]
}

function generateMonitoringForTask(taskId: string, count: number, baseHeight = 5000): MonitoringData[] {
  const data: MonitoringData[] = []
  const now = Date.now()
  for (let i = 0; i < count; i++) {
    const progressFactor = i / count
    data.push({
      id: generateId('mon'),
      taskId,
      timestamp: new Date(now - (count - i) * 90000).toISOString(),
      plumeHeight: baseHeight + Math.random() * 6000 + progressFactor * 4000,
      ashConcentration: 20 + Math.random() * 380 + progressFactor * 150,
      thermalRadiation: 80 + Math.random() * 700 + progressFactor * 300,
    })
  }
  return data
}

function generateSpatialGrid(count: number, baseValue: number, variance: number, peakFactor = 2): GridPoint[] {
  const points: GridPoint[] = []
  const gridSize = Math.ceil(Math.sqrt(count))
  const centerX = gridSize / 2
  const centerY = gridSize / 2
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY)
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize && points.length < count; y++) {
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
      const decay = 1 - (dist / maxDist) * 0.7
      const peakBoost = (1 - dist / maxDist) * peakFactor
      points.push({
        x,
        y,
        z: 0,
        value: Math.max(0.1, (baseValue + (Math.random() - 0.3) * variance) * decay * (1 + peakBoost * 0.5)),
      })
    }
  }
  return points
}

function loadPushRecords(): PushRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PUSH)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (_) {}
  const initRecords: PushRecord[] = []
  const completedApprovals = mockData.approvals.filter(
    (a) => a.stage === 'mitigation_confirmation' && a.status === 'approved'
  )
  completedApprovals.forEach((a) => {
    initRecords.push({
      id: generateId('push'),
      approvalId: a.id,
      taskId: a.taskId,
      targetDepartment: 'aviation',
      message: '火山喷发预警通知：根据最新模拟结果，请调整相关航线并做好乘客告知工作。',
      pushedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      status: 'delivered',
    })
    initRecords.push({
      id: generateId('push'),
      approvalId: a.id,
      taskId: a.taskId,
      targetDepartment: 'emergency',
      message: '火山喷发应急响应通知：请启动对应级别应急预案，疏散周边居民。',
      pushedAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
      status: 'acknowledged',
    })
  })
  localStorage.setItem(STORAGE_KEY_PUSH, JSON.stringify(initRecords))
  return initRecords
}

function savePushRecords(records: PushRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_PUSH, JSON.stringify(records))
  } catch (_) {}
}

function loadApprovals(mockApprovals: Approval[]): Approval[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPROVALS)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const mockIds = new Set(mockApprovals.map((a) => a.id))
        const savedApprovals = parsed.filter((a: Approval) => !mockIds.has(a.id))
        return [...mockApprovals, ...savedApprovals]
      }
    }
  } catch (_) {}
  return mockApprovals
}

function saveApprovals(approvals: Approval[], mockApprovals: Approval[]) {
  try {
    const mockIds = new Set(mockApprovals.map((a) => a.id))
    const customApprovals = approvals.filter((a) => !mockIds.has(a.id))
    if (customApprovals.length > 0) {
      localStorage.setItem(STORAGE_KEY_APPROVALS, JSON.stringify(customApprovals))
    }
  } catch (_) {}
}

function calculateDeviation(heights: number[]): {
  overall: number
  individual: number[]
  exceedsThreshold: boolean
  allExceed20: boolean
} {
  if (heights.length < 2) {
    return { overall: 0, individual: [], exceedsThreshold: false, allExceed20: false }
  }
  const avg = heights.reduce((a, b) => a + b, 0) / heights.length
  const individual = heights.map((h) => (avg === 0 ? 0 : Number(Number(((h - avg) / avg) * 100).toFixed(1))))
  const maxAbsDev = Math.max(...individual.map(Math.abs))
  const overall = Number(maxAbsDev.toFixed(1))
  const allExceed20 = heights.length >= 3 && individual.every((d) => Math.abs(d) > 20)
  return {
    overall,
    individual,
    exceedsThreshold: allExceed20,
    allExceed20,
  }
}

function ensureReportLayers(report: Report, isTaskCompleted: boolean): Report {
  if (!isTaskCompleted) {
    return report
  }
  if (!report.ashDistribution || report.ashDistribution.length === 0) {
    report.ashDistribution = generateSpatialGrid(100, 100, 150, 2.5)
  }
  if (!report.thermalRadiationMap || report.thermalRadiationMap.length === 0) {
    report.thermalRadiationMap = generateSpatialGrid(100, 400, 500, 1.8)
  }
  if (!report.settlementThickness || report.settlementThickness.length === 0) {
    report.settlementThickness = generateSpatialGrid(100, 10, 30, 2.2)
  }
  return report
}

function loadReportsWithLayers(reports: Report[], tasks: SimulationTask[]): Report[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS)
    if (raw) {
      const saved = JSON.parse(raw) as Record<string, Report>
      return reports.map((r) => {
        const task = tasks.find((t) => t.id === r.taskId)
        const isCompleted = task?.status === 'completed'
        const savedReport = saved[r.id]
        if (savedReport && isCompleted) {
          return {
            ...r,
            ashDistribution: savedReport.ashDistribution || r.ashDistribution,
            thermalRadiationMap: savedReport.thermalRadiationMap || r.thermalRadiationMap,
            settlementThickness: savedReport.settlementThickness || r.settlementThickness,
          }
        }
        return ensureReportLayers(r, isCompleted)
      })
    }
  } catch (_) {}
  return reports.map((r) => {
    const task = tasks.find((t) => t.id === r.taskId)
    return ensureReportLayers(r, task?.status === 'completed')
  })
}

function saveReportLayers(report: Report) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS)
    const saved = raw ? JSON.parse(raw) : {}
    saved[report.id] = {
      ashDistribution: report.ashDistribution,
      thermalRadiationMap: report.thermalRadiationMap,
      settlementThickness: report.settlementThickness,
    }
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(saved))
  } catch (_) {}
}

interface AppState {
  currentUser: User
  tasks: SimulationTask[]
  alerts: Alert[]
  approvals: Approval[]
  reports: Report[]
  dashboardStats: DashboardStats
  monitoringData: MonitoringData[]
  deviationAlerts: DeviationAlert[]
  adjustmentLogs: AdjustmentLog[]
  pushRecords: PushRecord[]
  loading: Record<string, boolean>
  errors: Record<string, string | null>
  activeVolcanoHeights: Record<string, number[]>
  runningTaskIds: Set<string>

  fetchTasks: () => Promise<void>
  fetchAlerts: () => Promise<void>
  fetchApprovals: () => Promise<void>
  fetchReports: () => Promise<void>
  fetchDashboardStats: () => Promise<void>
  fetchMonitoringData: (taskId: string) => Promise<void>
  fetchDeviationAlerts: () => Promise<void>

  createTask: (data: {
    name: string
    volcanoName: string
    magmaComposition: MagmaComposition
    eruptionParams: EruptionSourceParams
  }) => Promise<SimulationTask | null>
  reviewAlert: (
    id: string,
    data: {
      status: AlertStatus
      reviewNote?: string
    }
  ) => Promise<Alert | null>
  decideApproval: (
    id: string,
    data: {
      status: ApprovalStatus
      comments?: string
    }
  ) => Promise<Approval | null>
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<SimulationTask | null>
  resumeVolcano: (volcanoName: string) => void

  startTaskProgression: (taskId: string) => void
  stopTaskProgression: (taskId: string) => void
  isVolcanoPaused: (volcanoName: string) => DeviationAlert | null
  calculateTaskDeviation: (taskId: string) => { overall: number; individual: number[]; exceedsThreshold: boolean; allExceed20: boolean }
  initActiveTasks: () => void
}

export const useAppStore = create<AppState>((set, get) => {
  const initPushRecords = loadPushRecords()
  const initApprovals = loadApprovals(mockData.approvals)
  const initActiveHeights: Record<string, number[]> = {}
  mockData.deviationAlerts.forEach((d) => {
    initActiveHeights[d.volcanoName] = [...d.plumeHeights]
  })
  const initReports = loadReportsWithLayers(mockData.reports, mockData.tasks)

  const runTaskTick = (taskId: string) => {
    const state = get()
    if (!state.runningTaskIds.has(taskId)) return

    const task = state.tasks.find((t) => t.id === taskId)
    if (!task) {
      set({ runningTaskIds: new Set([...state.runningTaskIds].filter((id) => id !== taskId)) })
      return
    }
    if (task.status === 'completed' || task.status === 'error_fallback') {
      set({ runningTaskIds: new Set([...state.runningTaskIds].filter((id) => id !== taskId)) })
      return
    }

    const hasError = Math.random() < 0.04 && task.status !== 'pending_verification'
    if (hasError) {
      set({
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'error_fallback' as TaskStatus,
                progress: STATUS_PROGRESS[t.status],
                updatedAt: new Date().toISOString(),
              }
            : t
        ),
        runningTaskIds: new Set([...state.runningTaskIds].filter((id) => id !== taskId)),
      })
      return
    }

    const nextStatus = getNextStatus(task.status)
    if (!nextStatus) {
      set({ runningTaskIds: new Set([...state.runningTaskIds].filter((id) => id !== taskId)) })
      return
    }

    const stageMonitoring = generateMonitoringForTask(taskId, 3, 4000 + Math.random() * 2000)
    const allMonitoring = [...state.monitoringData, ...stageMonitoring]
    const latestPlumeHeight = stageMonitoring[stageMonitoring.length - 1]?.plumeHeight || 0
    const latestAsh = stageMonitoring[stageMonitoring.length - 1]?.ashConcentration || 0

    const STRATOSPHERE_THRESHOLD_M = 12000
    const ASH_SAFETY_THRESHOLD = 300
    const newAlerts: Alert[] = []
    const curAlerts = state.alerts

    if (latestPlumeHeight > STRATOSPHERE_THRESHOLD_M && nextStatus !== 'completed') {
      const dup = curAlerts.find(
        (a) => a.taskId === taskId && a.type === 'plume_height' && a.status === 'pending_review'
      )
      if (!dup) {
        newAlerts.push({
          id: generateId('alert'),
          taskId,
          type: 'plume_height',
          level: latestPlumeHeight > STRATOSPHERE_THRESHOLD_M * 1.3 ? 'critical' : 'danger',
          message: `喷发柱高度 ${(latestPlumeHeight / 1000).toFixed(1)} km 超过平流层阈值`,
          threshold: STRATOSPHERE_THRESHOLD_M,
          actualValue: latestPlumeHeight,
          status: 'pending_review',
          createdAt: new Date().toISOString(),
        })
      }
    }
    if (latestAsh > ASH_SAFETY_THRESHOLD && nextStatus !== 'completed') {
      const dup = curAlerts.find(
        (a) => a.taskId === taskId && a.type === 'ash_concentration' && a.status === 'pending_review'
      )
      if (!dup) {
        newAlerts.push({
          id: generateId('alert'),
          taskId,
          type: 'ash_concentration',
          level: latestAsh > ASH_SAFETY_THRESHOLD * 1.5 ? 'critical' : 'warning',
          message: `火山灰浓度 ${latestAsh.toFixed(0)} mg/m³ 威胁航空安全`,
          threshold: ASH_SAFETY_THRESHOLD,
          actualValue: latestAsh,
          status: 'pending_review',
          createdAt: new Date().toISOString(),
        })
      }
    }

    const updatedTask: SimulationTask = {
      ...task,
      status: nextStatus,
      progress: STATUS_PROGRESS[nextStatus],
      updatedAt: new Date().toISOString(),
      currentStageStartTime: new Date().toISOString(),
    }

    const heightsKey = task.volcanoName
    const curHeights = state.activeVolcanoHeights[heightsKey] || []
    const newHeights = [...curHeights.slice(-2), latestPlumeHeight]
    const newActiveHeights = { ...state.activeVolcanoHeights, [heightsKey]: newHeights }
    const deviationResult = calculateDeviation(newHeights)

    let finalReports = state.reports
    let finalApprovals = state.approvals
    let finalDeviations = state.deviationAlerts
    const newRunningIds = [...state.runningTaskIds]

    if (nextStatus === 'completed') {
      const taskAllMons = allMonitoring.filter((m) => m.taskId === taskId)
      const maxH = taskAllMons.reduce((m, x) => Math.max(m, x.plumeHeight), 0)
      const riskLvl =
        maxH > 15000 ? 'severe' : maxH > 12000 ? 'high' : maxH > 8000 ? 'medium' : 'low'
      const reportId = generateId('report')
      const newReport: Report = {
        id: reportId,
        taskId,
        title: `${task.volcanoName}喷发模拟报告`,
        summary: `基于${task.volcanoName}地质数据模拟完成。监测共${taskAllMons.length}个时间点，最大烟羽高度约${(maxH / 1000).toFixed(1)} km，航空风险等级：${riskLvl}。`,
        plumeHeightChart: taskAllMons,
        ashDistribution: generateSpatialGrid(100, 100, 150, 2.5),
        thermalRadiationMap: generateSpatialGrid(100, 400, 500, 1.8),
        settlementThickness: generateSpatialGrid(100, 10, 30, 2.2),
        aviationRiskLevel: riskLvl,
        generatedAt: new Date().toISOString(),
        generatedBy: task.createdBy,
      }
      saveReportLayers(newReport)
      finalReports = [...finalReports, newReport]

      const volcApproval: Approval = {
        id: generateId('approval'),
        taskId,
        reportId,
        stage: 'volcanologist_validation',
        status: 'pending',
        approverId: '',
        approverRole: 'volcanologist',
        comments: '',
        createdAt: new Date().toISOString(),
      }
      finalApprovals = [...finalApprovals, volcApproval]

      if (deviationResult.exceedsThreshold) {
        const existing = finalDeviations.find((d) => d.volcanoName === task.volcanoName)
        if (existing) {
          finalDeviations = finalDeviations.map((d) =>
            d.volcanoName === task.volcanoName
              ? {
                  ...d,
                  plumeHeights: newHeights,
                  deviationPercentage: deviationResult.overall,
                  isPaused: true,
                  chiefNotified: true,
                  notified: true,
                }
              : d
          )
        } else {
          finalDeviations = [
            ...finalDeviations,
            {
              id: generateId('deviation'),
              volcanoName: task.volcanoName,
              taskIds: [taskId],
              plumeHeights: newHeights,
              deviationPercentage: deviationResult.overall,
              isPaused: true,
              createdAt: new Date().toISOString(),
              notified: true,
              chiefNotified: true,
            },
          ]
        }
      }

      const idx = newRunningIds.indexOf(taskId)
      if (idx > -1) newRunningIds.splice(idx, 1)
    }

    set({
      tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
      monitoringData: allMonitoring,
      alerts: [...newAlerts, ...curAlerts],
      reports: finalReports,
      approvals: finalApprovals,
      deviationAlerts: finalDeviations,
      activeVolcanoHeights: newActiveHeights,
      runningTaskIds: new Set(newRunningIds),
      dashboardStats: {
        ...state.dashboardStats,
        activeTasks: state.tasks.filter(
          (t) => t.id !== taskId && t.status !== 'completed' && t.status !== 'error_fallback'
        ).length + (nextStatus === 'completed' || nextStatus === 'error_fallback' ? 0 : 1),
      },
    })

    if (nextStatus !== 'completed') {
      setTimeout(() => runTaskTick(taskId), STAGE_DURATION_MS)
    }
  }

  return {
    currentUser: mockData.users.find((u) => u.role === 'volcanologist') || defaultUser,
    tasks: mockData.tasks,
    alerts: mockData.alerts,
    approvals: mockData.approvals,
    reports: initReports,
    dashboardStats: {
      totalTasks: mockData.tasks.length,
      completionRate:
        mockData.tasks.filter((t) => t.status === 'completed').length /
        Math.max(1, mockData.tasks.length),
      totalAlerts: mockData.alerts.length,
      averageAccuracy: 0.88,
      activeTasks: mockData.tasks.filter(
        (t) => t.status !== 'completed' && t.status !== 'error_fallback'
      ).length,
      averageLeadTime: 145,
      dailyTrend: mockData.dailyTrends,
    },
    monitoringData: mockData.monitoring,
    deviationAlerts: mockData.deviationAlerts,
    adjustmentLogs: mockData.adjustmentLogs,
    pushRecords: initPushRecords,
    loading: {},
    errors: {},
    activeVolcanoHeights: initActiveHeights,
    runningTaskIds: new Set<string>(),

    fetchTasks: async () => {
      set({ loading: { ...get().loading, fetchTasks: true } })
      try {
        const response = await tasksApi.getTasks()
        if (response.success && response.data) {
          set({ tasks: response.data })
        }
      } catch (_) {}
      finally {
        set({ loading: { ...get().loading, fetchTasks: false } })
      }
    },

    fetchAlerts: async () => {
      set({ loading: { ...get().loading, fetchAlerts: true } })
      try {
        const response = await alertsApi.getAlerts()
        if (response.success && response.data) {
          set({ alerts: response.data })
        }
      } catch (_) {}
      finally {
        set({ loading: { ...get().loading, fetchAlerts: false } })
      }
    },

    fetchApprovals: async () => {
      set({ loading: { ...get().loading, fetchApprovals: true } })
      try {
        const response = await approvalsApi.getApprovals()
        if (response.success && response.data) {
          set({ approvals: response.data })
        }
      } catch (_) {}
      finally {
        set({ loading: { ...get().loading, fetchApprovals: false } })
      }
    },

    fetchReports: async () => {
      set({ loading: { ...get().loading, fetchReports: true } })
      try {
        const response = await reportsApi.getReports()
        if (response.success && response.data) {
          const curTasks = get().tasks
          const loaded = loadReportsWithLayers(response.data, curTasks)
          set({ reports: loaded })
        }
      } catch (_) {
        const curTasks = get().tasks
        set({ reports: loadReportsWithLayers(get().reports, curTasks) })
      }
      finally {
        set({ loading: { ...get().loading, fetchReports: false } })
      }
    },

    fetchDashboardStats: async () => {
      set({ loading: { ...get().loading, fetchDashboardStats: true } })
      try {
        const response = await dashboardApi.getStats()
        if (response.success && response.data) {
          set({ dashboardStats: response.data })
        }
      } catch (_) {}
      finally {
        set({ loading: { ...get().loading, fetchDashboardStats: false } })
      }
    },

    fetchMonitoringData: async (taskId: string) => {
      set({ loading: { ...get().loading, fetchMonitoringData: true } })
      try {
        const response = await tasksApi.getMonitoringData(taskId)
        if (response.success && response.data) {
          const existingIds = new Set(get().monitoringData.map((m) => m.id))
          const newData = response.data.filter((m) => !existingIds.has(m.id))
          set({ monitoringData: [...get().monitoringData, ...newData] })
        }
      } catch (_) {}
      finally {
        set({ loading: { ...get().loading, fetchMonitoringData: false } })
      }
    },

    fetchDeviationAlerts: async () => {
      set({ loading: { ...get().loading, fetchDeviationAlerts: true } })
      try {
        const response = await alertsApi.getDeviations()
        if (response.success && response.data) {
          set({ deviationAlerts: response.data })
        }
      } catch (_) {}
      finally {
        set({ loading: { ...get().loading, fetchDeviationAlerts: false } })
      }
    },

    isVolcanoPaused: (volcanoName: string) => {
      const heights = get().activeVolcanoHeights[volcanoName] || []
      const dev = calculateDeviation(heights)
      const alert = get().deviationAlerts.find((d) => d.volcanoName === volcanoName)
      if (alert && alert.isPaused && dev.exceedsThreshold) {
        return alert
      }
      if (dev.exceedsThreshold) {
        return {
          id: generateId('deviation'),
          volcanoName,
          taskIds: [],
          plumeHeights: heights,
          deviationPercentage: dev.overall,
          isPaused: true,
          createdAt: new Date().toISOString(),
          notified: true,
          chiefNotified: true,
        }
      }
      return null
    },

    resumeVolcano: (volcanoName: string) => {
      set({
        deviationAlerts: get().deviationAlerts.map((d) =>
          d.volcanoName === volcanoName ? { ...d, isPaused: false } : d
        ),
        activeVolcanoHeights: {
          ...get().activeVolcanoHeights,
          [volcanoName]: [],
        },
      })
    },

    calculateTaskDeviation: (taskId: string) => {
      const task = get().tasks.find((t) => t.id === taskId)
      if (!task) return { overall: 0, individual: [], exceedsThreshold: false }
      const heights = get().activeVolcanoHeights[task.volcanoName] || []
      return calculateDeviation(heights)
    },

    createTask: async (data) => {
      set({
        loading: { ...get().loading, createTask: true },
        errors: { ...get().errors, createTask: null },
      })
      try {
        const pausedAlert = get().isVolcanoPaused(data.volcanoName)
        if (pausedAlert) {
          const err = `火山「${data.volcanoName}」因连续三次喷发柱高度偏差超过20%已被暂停新任务，已通知首席科学家复核。`
          set({ errors: { ...get().errors, createTask: err } })
          return null
        }

        const now = new Date().toISOString()
        const newTaskId = generateId('task')
        const newTask: SimulationTask = {
          id: newTaskId,
          name: data.name,
          volcanoName: data.volcanoName,
          magmaComposition: data.magmaComposition,
          eruptionParams: data.eruptionParams,
          status: 'pending_verification',
          progress: 5,
          createdBy: get().currentUser.id,
          createdAt: now,
          updatedAt: now,
          currentStageStartTime: now,
        }
        set({ tasks: [newTask, ...get().tasks] })

        setTimeout(() => {
          const cur = get()
          const taskExists = cur.tasks.find((t) => t.id === newTaskId)
          if (!taskExists) return

          let finalId = newTaskId
          tasksApi
            .createTask({
              ...data,
              createdBy: cur.currentUser.id,
            })
            .then((response) => {
              if (response.success && response.data && response.data.id) {
                set((s) => ({
                  tasks: s.tasks.map((t) => {
                    if (t.id !== newTaskId) return t
                    const currentTask = t
                    const apiData = response.data!
                    return {
                      ...apiData,
                      id: newTaskId,
                      status: currentTask.status,
                      progress: currentTask.progress,
                      currentStageStartTime: currentTask.currentStageStartTime,
                      updatedAt: currentTask.updatedAt,
                    }
                  }),
                }))
              }
            })
            .catch(() => {})

          const newRunning = new Set(cur.runningTaskIds)
          newRunning.add(finalId)
          set({ runningTaskIds: newRunning })
          runTaskTick(finalId)
        }, 300)

        return newTask
      } catch (error) {
        set({
          errors: {
            ...get().errors,
            createTask: error instanceof Error ? error.message : '创建任务失败',
          },
        })
        return null
      } finally {
        set({ loading: { ...get().loading, createTask: false } })
      }
    },

    startTaskProgression: (taskId: string) => {
      const cur = get()
      if (cur.runningTaskIds.has(taskId)) return
      const newRunning = new Set(cur.runningTaskIds)
      newRunning.add(taskId)
      set({ runningTaskIds: newRunning })
      runTaskTick(taskId)
    },

    stopTaskProgression: (taskId: string) => {
      const newRunning = new Set([...get().runningTaskIds].filter((id) => id !== taskId))
      set({ runningTaskIds: newRunning })
    },

    initActiveTasks: () => {
      // no-op, for compat
    },

    reviewAlert: async (id, data) => {
      set({
        loading: { ...get().loading, reviewAlert: true },
        errors: { ...get().errors, reviewAlert: null },
      })
      try {
        const { alerts, tasks, currentUser, adjustmentLogs } = get()
        const alert = alerts.find((a) => a.id === id)
        if (!alert) return null

        const updatedAlert: Alert = {
          ...alert,
          status: data.status,
          reviewedBy: currentUser.id,
          reviewedAt: new Date().toISOString(),
          reviewNote: data.reviewNote,
        }

        let updatedTasks = tasks
        let updatedAdjustmentLogs = adjustmentLogs

        if (data.status === 'adjusted') {
          const task = tasks.find((t) => t.id === alert.taskId)
          if (task) {
            const oldParams = { ...task.eruptionParams }
            const newVent = Math.round(
              Math.max(20, oldParams.ventDiameter * (0.78 + Math.random() * 0.14))
            )
            const newH2O = Math.round(Math.max(0.5, oldParams.h2oContent * (0.7 + Math.random() * 0.2)) * 100) / 100
            const newGas = { ventDiameter: newVent, h2oContent: newH2O }
            const afterParams = { ...oldParams, ...newGas }

            const log: AdjustmentLog = {
              id: generateId('adjust'),
              taskId: task.id,
              alertId: alert.id,
              adjustedBy: currentUser.id,
              adjustments: newGas,
              beforeParams: oldParams,
              afterParams,
              reason: data.reviewNote || '根据预警复核结果自动调整喷发参数',
              createdAt: new Date().toISOString(),
            }
            updatedAdjustmentLogs = [log, ...updatedAdjustmentLogs]

            updatedTasks = tasks.map((t) =>
              t.id === task.id
                ? {
                    ...t,
                    eruptionParams: afterParams,
                    status: 'mesh_generation' as TaskStatus,
                    progress: STATUS_PROGRESS['mesh_generation'],
                    updatedAt: new Date().toISOString(),
                    currentStageStartTime: new Date().toISOString(),
                  }
                : t
            )

            setTimeout(() => {
              get().startTaskProgression(task.id)
            }, 400)
          }
        }

        set({
          alerts: alerts.map((a) => (a.id === id ? updatedAlert : a)),
          tasks: updatedTasks,
          adjustmentLogs: updatedAdjustmentLogs,
        })

        try {
          await alertsApi.reviewAlert(id, { ...data, reviewedBy: currentUser.id })
        } catch (_) {}
        return updatedAlert
      } catch (error) {
        set({
          errors: {
            ...get().errors,
            reviewAlert: error instanceof Error ? error.message : '审核告警失败',
          },
        })
        return null
      } finally {
        set({ loading: { ...get().loading, reviewAlert: false } })
      }
    },

    decideApproval: async (id, data) => {
      set({
        loading: { ...get().loading, decideApproval: true },
        errors: { ...get().errors, decideApproval: null },
      })
      try {
        const { approvals, currentUser, reports, tasks, pushRecords } = get()
        const approval = approvals.find((a) => a.id === id)
        if (!approval) return null

        if (approval.stage === 'mitigation_confirmation') {
          const taskVolc = approvals.find(
            (a) => a.taskId === approval.taskId && a.stage === 'volcanologist_validation'
          )
          if (!taskVolc || taskVolc.status !== 'approved') {
            set({
              errors: {
                ...get().errors,
                decideApproval: '火山学家验证尚未通过，减灾专家无法提前确认审批',
              },
            })
            return null
          }
        }

        const updatedApproval: Approval = {
          ...approval,
          status: data.status,
          comments: data.comments || '',
          decidedAt: new Date().toISOString(),
          approverId: currentUser.id,
        }

        let finalApprovals = approvals.map((a) => (a.id === id ? updatedApproval : a))
        let finalPushRecords = [...pushRecords]

        if (data.status === 'approved' && approval.stage === 'volcanologist_validation') {
          const existsMit = approvals.find(
            (a) => a.taskId === approval.taskId && a.stage === 'mitigation_confirmation'
          )
          if (!existsMit) {
            finalApprovals = [
              ...finalApprovals,
              {
                id: generateId('approval'),
                taskId: approval.taskId,
                reportId: approval.reportId,
                stage: 'mitigation_confirmation',
                status: 'pending',
                approverId: '',
                approverRole: 'mitigation_expert',
                comments: '',
                createdAt: new Date().toISOString(),
              },
            ]
          }
        }

        if (data.status === 'approved' && approval.stage === 'mitigation_confirmation') {
          const existingPush = pushRecords.filter((p) => p.approvalId === id)
          if (existingPush.length === 0) {
            const task = tasks.find((t) => t.id === approval.taskId)
            const report = reports.find((r) => r.id === approval.reportId)
            const taskName = task?.name || approval.taskId
            const risk = report?.aviationRiskLevel || 'medium'
            finalPushRecords = [
              ...finalPushRecords,
              {
                id: generateId('push'),
                approvalId: id,
                taskId: approval.taskId,
                targetDepartment: 'aviation',
                message: `【民航预警通知】模拟任务「${taskName}」完成审批，航空风险等级：${risk}。请及时调整航线并通知相关机组人员。`,
                pushedAt: new Date().toISOString(),
                status: 'sent',
              },
              {
                id: generateId('push'),
                approvalId: id,
                taskId: approval.taskId,
                targetDepartment: 'emergency',
                message: `【应急响应通知】模拟任务「${taskName}」完成审批，航空风险等级：${risk}。请评估并启动对应级别应急预案。`,
                pushedAt: new Date().toISOString(),
                status: 'sent',
              },
            ]
            savePushRecords(finalPushRecords)
          }
        }

        set({ approvals: finalApprovals, pushRecords: finalPushRecords })

        try {
          await approvalsApi.decideApproval(id, data)
        } catch (_) {}
        return updatedApproval
      } catch (error) {
        set({
          errors: {
            ...get().errors,
            decideApproval: error instanceof Error ? error.message : '审批决策失败',
          },
        })
        return null
      } finally {
        set({ loading: { ...get().loading, decideApproval: false } })
      }
    },

    updateTaskStatus: async (id, status) => {
      set({ loading: { ...get().loading, updateTaskStatus: true } })
      try {
        set({
          tasks: get().tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  progress: STATUS_PROGRESS[status],
                  updatedAt: new Date().toISOString(),
                  currentStageStartTime: new Date().toISOString(),
                }
              : t
          ),
        })
        try {
          await tasksApi.updateTaskStatus(id, status)
        } catch (_) {}
        return get().tasks.find((t) => t.id === id) || null
      } catch (error) {
        set({
          errors: {
            ...get().errors,
            updateTaskStatus: error instanceof Error ? error.message : '更新任务状态失败',
          },
        })
        return null
      } finally {
        set({ loading: { ...get().loading, updateTaskStatus: false } })
      }
    },
  }
})

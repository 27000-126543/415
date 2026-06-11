import type {
  User,
  SimulationTask,
  MonitoringData,
  Alert,
  AdjustmentLog,
  Approval,
  Report,
  DailyTrend,
  DeviationAlert,
  MagmaComposition,
  EruptionSourceParams,
  GridPoint,
  UserRole,
  TaskStatus,
  AlertLevel,
  AlertStatus,
  AlertType,
  ApprovalStatus,
  ApprovalStage,
  AviationRiskLevel,
} from './types'

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}`
}

function formatDate(date: Date): string {
  return date.toISOString()
}

function daysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

function hoursAgo(hours: number): Date {
  const date = new Date()
  date.setHours(date.getHours() - hours)
  return date
}

export function generateMockUsers(): User[] {
  const roles: UserRole[] = ['admin', 'volcanologist', 'mitigation_expert', 'chief_scientist', 'aviation']
  const names = ['张管理员', '李火山学家', '王减灾专家', '赵首席科学家', '陈航空专家']
  const emails = ['admin@volcano-sim.com', 'li@volcano-sim.com', 'wang@volcano-sim.com', 'zhao@volcano-sim.com', 'chen@volcano-sim.com']

  return names.map((name, i) => ({
    id: generateId('user'),
    name,
    email: emails[i],
    role: roles[i],
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    createdAt: formatDate(daysAgo(30 - i * 5)),
  }))
}

export function generateMockTasks(users: User[]): SimulationTask[] {
  const statuses: TaskStatus[] = [
    'pending_verification',
    'mesh_generation',
    'eruption_calculation',
    'diffusion_simulation',
    'settlement_analysis',
    'completed',
    'completed',
    'completed',
    'error_fallback',
    'eruption_calculation',
  ]

  const volcanoNames = [
    '富士山',
    '长白山',
    '圣海伦斯火山',
    '埃特纳火山',
    '基拉韦厄火山',
    '马荣火山',
    '维苏威火山',
    '波波卡特佩特火山',
    '默拉皮火山',
    '樱岛火山',
  ]

  const tasks: SimulationTask[] = []

  for (let i = 0; i < 10; i++) {
    const status = statuses[i]
    const progress = status === 'completed' ? 100 : status === 'error_fallback' ? 35 : Math.floor(Math.random() * 80) + 10
    const createdAt = daysAgo(20 - i * 2)
    const updatedAt = status === 'completed' ? daysAgo(20 - i * 2 - 1) : hoursAgo(i)

    const magmaComposition: MagmaComposition = {
      sio2: 60 + Math.random() * 15,
      al2o3: 14 + Math.random() * 4,
      feo: 3 + Math.random() * 5,
      mgo: 2 + Math.random() * 4,
      cao: 3 + Math.random() * 4,
      na2o: 3 + Math.random() * 2,
      k2o: 1.5 + Math.random() * 1.5,
    }

    const eruptionParams: EruptionSourceParams = {
      ventDiameter: 50 + Math.random() * 150,
      initialPressure: 5 + Math.random() * 15,
      initialTemperature: 900 + Math.random() * 300,
      h2oContent: 1 + Math.random() * 4,
      co2Content: 0.1 + Math.random() * 0.5,
      so2Content: 0.05 + Math.random() * 0.3,
    }

    tasks.push({
      id: generateId('task'),
      name: `${volcanoNames[i]}喷发模拟-${i + 1}`,
      volcanoName: volcanoNames[i],
      demFile: i % 3 !== 0 ? {
        name: `${volcanoNames[i]}_DEM.tif`,
        size: Math.floor(Math.random() * 50000000) + 10000000,
        path: `/uploads/${volcanoNames[i]}_DEM.tif`,
      } : undefined,
      magmaComposition,
      eruptionParams,
      status,
      progress,
      createdBy: users[i % users.length].id,
      createdAt: formatDate(createdAt),
      updatedAt: formatDate(updatedAt),
      currentStageStartTime: formatDate(hoursAgo(i * 2)),
      deviationFlag: i === 2 || i === 7,
    })
  }

  return tasks
}

export function generateMockMonitoringData(tasks: SimulationTask[]): MonitoringData[] {
  const data: MonitoringData[] = []
  const activeTasks = tasks.filter(t => t.status !== 'pending_verification')

  for (let i = 0; i < 50; i++) {
    const task = activeTasks[i % activeTasks.length]
    data.push({
      id: generateId('monitor'),
      taskId: task.id,
      timestamp: formatDate(hoursAgo(i)),
      plumeHeight: 500 + Math.random() * 15000,
      ashConcentration: Math.random() * 500,
      thermalRadiation: 100 + Math.random() * 900,
    })
  }

  return data
}

export function generateMockAlerts(tasks: SimulationTask[], users: User[]): Alert[] {
  const alertTypes: AlertType[] = ['plume_height', 'ash_concentration', 'thermal_radiation']
  const alertLevels: AlertLevel[] = ['info', 'warning', 'danger', 'critical']
  const alertStatuses: AlertStatus[] = ['pending_review', 'reviewed', 'adjusted', 'ignored']

  const alerts: Alert[] = []
  const alertMessages = {
    plume_height: '烟羽高度超过阈值',
    ash_concentration: '火山灰浓度异常',
    thermal_radiation: '热辐射值异常',
  }

  for (let i = 0; i < 8; i++) {
    const type = alertTypes[i % alertTypes.length]
    const level = alertLevels[i % alertLevels.length]
    const status = alertStatuses[i % alertStatuses.length]
    const threshold = type === 'plume_height' ? 8000 : type === 'ash_concentration' ? 300 : 600
    const actualValue = threshold * (1.1 + Math.random() * 0.5)
    const reviewedBy = status !== 'pending_review' ? users[i % users.length].id : undefined
    const reviewedAt = status !== 'pending_review' ? formatDate(hoursAgo(i * 2)) : undefined

    alerts.push({
      id: generateId('alert'),
      taskId: tasks[i % tasks.length].id,
      type,
      level,
      message: alertMessages[type],
      threshold,
      actualValue: Math.round(actualValue * 100) / 100,
      status,
      createdAt: formatDate(hoursAgo(i * 3 + 1)),
      reviewedBy,
      reviewedAt,
      reviewNote: status !== 'pending_review' ? `已${status === 'adjusted' ? '调整参数' : status === 'ignored' ? '忽略' : '审核'}：参数在合理范围内` : undefined,
    })
  }

  return alerts
}

export function generateMockAdjustmentLogs(tasks: SimulationTask[], alerts: Alert[], users: User[]): AdjustmentLog[] {
  const adjustedAlerts = alerts.filter(a => a.status === 'adjusted')
  const logs: AdjustmentLog[] = []

  for (let i = 0; i < Math.min(3, adjustedAlerts.length); i++) {
    const alert = adjustedAlerts[i]
    const task = tasks.find(t => t.id === alert.taskId) || tasks[0]
    const before = task.eruptionParams
    const after: EruptionSourceParams = {
      ...before,
      ventDiameter: Math.round(before.ventDiameter * 0.85),
      h2oContent: Math.round(before.h2oContent * 0.75 * 100) / 100,
    }
    logs.push({
      id: generateId('adjust'),
      taskId: alert.taskId,
      alertId: alert.id,
      adjustedBy: users[i % users.length].id,
      adjustments: {
        ventDiameter: after.ventDiameter,
        h2oContent: after.h2oContent,
      },
      beforeParams: before,
      afterParams: after,
      reason: '根据历史数据和实测值调整喷发参数，降低烟羽高度预测偏差',
      createdAt: formatDate(hoursAgo(i * 5 + 2)),
    })
  }

  return logs
}

function generateGridPoints(count: number, baseValue: number, variance: number): GridPoint[] {
  const points: GridPoint[] = []
  const gridSize = Math.ceil(Math.sqrt(count))
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize && points.length < count; y++) {
      points.push({
        x,
        y,
        z: 0,
        value: Math.max(0, baseValue + (Math.random() - 0.5) * variance),
      })
    }
  }
  return points
}

export function generateMockReports(tasks: SimulationTask[], users: User[], monitoringData: MonitoringData[]): Report[] {
  const riskLevels: AviationRiskLevel[] = ['low', 'medium', 'high']
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const reports: Report[] = []

  for (let i = 0; i < Math.min(3, completedTasks.length); i++) {
    const task = completedTasks[i]
    const taskMonitoring = monitoringData.filter(m => m.taskId === task.id)
    const plumeChart = taskMonitoring.length > 0 ? taskMonitoring.slice(0, 10) : monitoringData.slice(0, 10)

    reports.push({
      id: generateId('report'),
      taskId: task.id,
      title: `${task.volcanoName}喷发模拟报告`,
      summary: `本报告基于${task.volcanoName}的地质数据，模拟了火山喷发过程中的烟羽扩散、火山灰沉降和热辐射分布。模拟结果显示最大烟羽高度约${Math.round(plumeChart.reduce((max, m) => Math.max(max, m.plumeHeight), 0))}米，航空风险等级为${riskLevels[i]}。`,
      plumeHeightChart: plumeChart,
      ashDistribution: generateGridPoints(64, 50, 80),
      thermalRadiationMap: generateGridPoints(64, 300, 400),
      settlementThickness: generateGridPoints(64, 5, 15),
      aviationRiskLevel: riskLevels[i],
      generatedAt: formatDate(daysAgo(i * 3 + 1)),
      generatedBy: users[i % users.length].id,
    })
  }

  return reports
}

export function generateMockApprovals(tasks: SimulationTask[], reports: Report[], users: User[]): Approval[] {
  const approvalStages: ApprovalStage[] = ['volcanologist_validation', 'mitigation_confirmation']
  const approvalStatuses: ApprovalStatus[] = ['pending', 'approved', 'rejected', 'approved', 'pending']

  const approvals: Approval[] = []
  const completedTasks = tasks.filter(t => t.status === 'completed')

  for (let i = 0; i < 5; i++) {
    const stage = approvalStages[i % approvalStages.length]
    const status = approvalStatuses[i % approvalStatuses.length]
    const approver = users.find(u => stage === 'volcanologist_validation' ? u.role === 'volcanologist' || u.role === 'chief_scientist' : u.role === 'mitigation_expert') || users[i % users.length]
    const decidedAt = status !== 'pending' ? formatDate(hoursAgo(i * 6 + 3)) : undefined

    approvals.push({
      id: generateId('approval'),
      taskId: completedTasks[i % completedTasks.length].id,
      reportId: reports[i % reports.length].id,
      stage,
      status,
      approverId: approver.id,
      approverRole: approver.role,
      comments: status === 'approved' ? '数据合理，模拟结果可信' : status === 'rejected' ? '部分参数需要重新验证' : '等待审核',
      createdAt: formatDate(hoursAgo(i * 8 + 4)),
      decidedAt,
    })
  }

  return approvals
}

export function generateMockDailyTrends(): DailyTrend[] {
  const trends: DailyTrend[] = []
  const today = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    trends.push({
      date: formatDate(date).split('T')[0],
      completionRate: 65 + Math.random() * 30,
      leadTime: 30 + Math.random() * 60,
      accuracy: 75 + Math.random() * 20,
    })
  }

  return trends
}

export function generateMockDeviationAlerts(tasks: SimulationTask[]): DeviationAlert[] {
  const tasksWithDeviation = tasks.filter(t => t.deviationFlag)
  const alerts: DeviationAlert[] = []

  if (tasksWithDeviation.length > 0) {
    const task1 = tasksWithDeviation[0]
    alerts.push({
      id: generateId('deviation'),
      volcanoName: task1.volcanoName,
      taskIds: [task1.id],
      plumeHeights: [7800, 11500, 15200],
      deviationPercentage: 51.7,
      isPaused: true,
      createdAt: formatDate(hoursAgo(4)),
      notified: true,
      chiefNotified: true,
    })
  }

  if (tasksWithDeviation.length > 1) {
    const task2 = tasksWithDeviation[1]
    alerts.push({
      id: generateId('deviation'),
      volcanoName: task2.volcanoName,
      taskIds: [task2.id],
      plumeHeights: [9000, 9500, 10100],
      deviationPercentage: 10.8,
      isPaused: false,
      createdAt: formatDate(hoursAgo(8)),
      notified: true,
      chiefNotified: false,
    })
  }

  return alerts
}

export interface MockDatabaseData {
  users: User[]
  tasks: SimulationTask[]
  monitoring: MonitoringData[]
  alerts: Alert[]
  approvals: Approval[]
  reports: Report[]
  adjustmentLogs: AdjustmentLog[]
  deviationAlerts: DeviationAlert[]
  dailyTrends: DailyTrend[]
}

export function generateAllMockData(): MockDatabaseData {
  const users = generateMockUsers()
  const tasks = generateMockTasks(users)
  const monitoring = generateMockMonitoringData(tasks)
  const reports = generateMockReports(tasks, users, monitoring)
  const alerts = generateMockAlerts(tasks, users)
  const adjustmentLogs = generateMockAdjustmentLogs(tasks, alerts, users)
  const approvals = generateMockApprovals(tasks, reports, users)
  const dailyTrends = generateMockDailyTrends()
  const deviationAlerts = generateMockDeviationAlerts(tasks)

  return {
    users,
    tasks,
    monitoring,
    alerts,
    approvals,
    reports,
    adjustmentLogs,
    deviationAlerts,
    dailyTrends,
  }
}

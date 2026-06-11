import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
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
} from '../../shared/types.js'
import { generateAllMockData, type MockDatabaseData } from '../../shared/mockData.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_DIR = path.join(__dirname, 'db')
const DB_FILE = path.join(DB_DIR, 'database.json')

export type DatabaseData = MockDatabaseData

type CollectionName = keyof DatabaseData

const ID_FIELDS: Record<CollectionName, string> = {
  users: 'id',
  tasks: 'id',
  monitoring: 'id',
  alerts: 'id',
  approvals: 'id',
  reports: 'id',
  adjustmentLogs: 'id',
  deviationAlerts: 'id',
  dailyTrends: 'date',
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

function ensureDbDirectory(): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true })
  }
}

class DataRepository {
  private data: DatabaseData
  private persistTimeout: NodeJS.Timeout | null = null
  private readonly persistDelay = 100

  constructor() {
    this.data = this.loadOrInitialize()
  }

  private loadOrInitialize(): DatabaseData {
    ensureDbDirectory()

    if (fs.existsSync(DB_FILE)) {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8')
        return JSON.parse(content) as DatabaseData
      } catch (error) {
        console.warn('Failed to load database file, initializing with mock data:', error)
        return this.initializeWithMockData()
      }
    }

    return this.initializeWithMockData()
  }

  private initializeWithMockData(): DatabaseData {
    const mockData = generateAllMockData()
    this.schedulePersist(mockData)
    return mockData
  }

  private schedulePersist(data?: DatabaseData): void {
    if (this.persistTimeout) {
      clearTimeout(this.persistTimeout)
    }

    this.persistTimeout = setTimeout(() => {
      this.persist(data || this.data)
      this.persistTimeout = null
    }, this.persistDelay)
  }

  private persist(data: DatabaseData): void {
    ensureDbDirectory()
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8')
    } catch (error) {
      console.error('Failed to persist database:', error)
    }
  }

  private markDirty(): void {
    this.schedulePersist()
  }

  resetToMockData(): DatabaseData {
    this.data = generateAllMockData()
    this.markDirty()
    return JSON.parse(JSON.stringify(this.data))
  }

  private getCollection(collection: CollectionName): unknown[] {
    return this.data[collection] as unknown as unknown[]
  }

  private setCollection(collection: CollectionName, items: unknown[]): void {
    ;(this.data as unknown as Record<string, unknown[]>)[collection] = items
  }

  private getPrefix(collection: CollectionName): string {
    const prefixes: Record<CollectionName, string> = {
      users: 'user',
      tasks: 'task',
      monitoring: 'monitor',
      alerts: 'alert',
      approvals: 'approval',
      reports: 'report',
      adjustmentLogs: 'adjust',
      deviationAlerts: 'deviation',
      dailyTrends: 'trend',
    }
    return prefixes[collection]
  }

  getAll<T>(collection: CollectionName): T[] {
    return JSON.parse(JSON.stringify(this.getCollection(collection))) as T[]
  }

  getById<T>(collection: CollectionName, id: string): T | undefined {
    const idField = ID_FIELDS[collection]
    const items = this.getCollection(collection) as Array<Record<string, unknown>>
    const found = items.find((item) => item[idField] === id)
    return found ? (JSON.parse(JSON.stringify(found)) as T) : undefined
  }

  create<T>(collection: CollectionName, item: Partial<T> & Record<string, unknown>): T {
    const idField = ID_FIELDS[collection]
    const prefix = this.getPrefix(collection)
    const idValue = (item[idField] as string) || generateId(prefix)

    const newItem = {
      ...item,
      [idField]: idValue,
    }

    const items = this.getCollection(collection)
    items.push(newItem)
    this.markDirty()
    return JSON.parse(JSON.stringify(newItem)) as T
  }

  update<T>(collection: CollectionName, id: string, updates: Partial<T>): T | undefined {
    const idField = ID_FIELDS[collection]
    const items = this.getCollection(collection) as Array<Record<string, unknown>>
    const index = items.findIndex((item) => item[idField] === id)

    if (index === -1) {
      return undefined
    }

    const currentItem = items[index]
    const updatedItem = {
      ...currentItem,
      ...updates,
      [idField]: id,
    }

    items[index] = updatedItem
    this.markDirty()
    return JSON.parse(JSON.stringify(updatedItem)) as T
  }

  delete(collection: CollectionName, id: string): boolean {
    const idField = ID_FIELDS[collection]
    const items = this.getCollection(collection) as Array<Record<string, unknown>>
    const initialLength = items.length
    const filtered = items.filter((item) => item[idField] !== id)
    this.setCollection(collection, filtered as unknown[])

    const deleted = filtered.length !== initialLength
    if (deleted) {
      this.markDirty()
    }
    return deleted
  }

  find<T>(collection: CollectionName, predicate: (item: T) => boolean): T[] {
    const items = this.getCollection(collection) as T[]
    return JSON.parse(JSON.stringify(items.filter(predicate))) as T[]
  }

  findOne<T>(collection: CollectionName, predicate: (item: T) => boolean): T | undefined {
    const items = this.getCollection(collection) as T[]
    const found = items.find(predicate)
    return found ? (JSON.parse(JSON.stringify(found)) as T) : undefined
  }

  count(collection: CollectionName): number {
    return this.getCollection(collection).length
  }

  listUsers(): User[] {
    return this.getAll<User>('users')
  }

  getUserById(id: string): User | undefined {
    return this.getById<User>('users', id)
  }

  createUser(user: Omit<User, 'id'> & Partial<Pick<User, 'id'>>): User {
    return this.create<User>('users', user as unknown as Partial<User> & Record<string, unknown>)
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    return this.update<User>('users', id, updates)
  }

  deleteUser(id: string): boolean {
    return this.delete('users', id)
  }

  listTasks(): SimulationTask[] {
    return this.getAll<SimulationTask>('tasks')
  }

  getTaskById(id: string): SimulationTask | undefined {
    return this.getById<SimulationTask>('tasks', id)
  }

  createTask(task: Omit<SimulationTask, 'id'> & Partial<Pick<SimulationTask, 'id'>>): SimulationTask {
    return this.create<SimulationTask>('tasks', task as unknown as Partial<SimulationTask> & Record<string, unknown>)
  }

  updateTask(id: string, updates: Partial<SimulationTask>): SimulationTask | undefined {
    return this.update<SimulationTask>('tasks', id, updates)
  }

  deleteTask(id: string): boolean {
    return this.delete('tasks', id)
  }

  listMonitoring(): MonitoringData[] {
    return this.getAll<MonitoringData>('monitoring')
  }

  getMonitoringById(id: string): MonitoringData | undefined {
    return this.getById<MonitoringData>('monitoring', id)
  }

  listMonitoringByTaskId(taskId: string): MonitoringData[] {
    return this.find<MonitoringData>('monitoring', (m) => m.taskId === taskId)
  }

  createMonitoring(data: Omit<MonitoringData, 'id'> & Partial<Pick<MonitoringData, 'id'>>): MonitoringData {
    return this.create<MonitoringData>('monitoring', data as unknown as Partial<MonitoringData> & Record<string, unknown>)
  }

  updateMonitoring(id: string, updates: Partial<MonitoringData>): MonitoringData | undefined {
    return this.update<MonitoringData>('monitoring', id, updates)
  }

  deleteMonitoring(id: string): boolean {
    return this.delete('monitoring', id)
  }

  listAlerts(): Alert[] {
    return this.getAll<Alert>('alerts')
  }

  getAlertById(id: string): Alert | undefined {
    return this.getById<Alert>('alerts', id)
  }

  listAlertsByTaskId(taskId: string): Alert[] {
    return this.find<Alert>('alerts', (a) => a.taskId === taskId)
  }

  createAlert(alert: Omit<Alert, 'id'> & Partial<Pick<Alert, 'id'>>): Alert {
    return this.create<Alert>('alerts', alert as unknown as Partial<Alert> & Record<string, unknown>)
  }

  updateAlert(id: string, updates: Partial<Alert>): Alert | undefined {
    return this.update<Alert>('alerts', id, updates)
  }

  deleteAlert(id: string): boolean {
    return this.delete('alerts', id)
  }

  listApprovals(): Approval[] {
    return this.getAll<Approval>('approvals')
  }

  getApprovalById(id: string): Approval | undefined {
    return this.getById<Approval>('approvals', id)
  }

  listApprovalsByTaskId(taskId: string): Approval[] {
    return this.find<Approval>('approvals', (a) => a.taskId === taskId)
  }

  listApprovalsByReportId(reportId: string): Approval[] {
    return this.find<Approval>('approvals', (a) => a.reportId === reportId)
  }

  createApproval(approval: Omit<Approval, 'id'> & Partial<Pick<Approval, 'id'>>): Approval {
    return this.create<Approval>('approvals', approval as unknown as Partial<Approval> & Record<string, unknown>)
  }

  updateApproval(id: string, updates: Partial<Approval>): Approval | undefined {
    return this.update<Approval>('approvals', id, updates)
  }

  deleteApproval(id: string): boolean {
    return this.delete('approvals', id)
  }

  listReports(): Report[] {
    return this.getAll<Report>('reports')
  }

  getReportById(id: string): Report | undefined {
    return this.getById<Report>('reports', id)
  }

  listReportsByTaskId(taskId: string): Report[] {
    return this.find<Report>('reports', (r) => r.taskId === taskId)
  }

  createReport(report: Omit<Report, 'id'> & Partial<Pick<Report, 'id'>>): Report {
    return this.create<Report>('reports', report as unknown as Partial<Report> & Record<string, unknown>)
  }

  updateReport(id: string, updates: Partial<Report>): Report | undefined {
    return this.update<Report>('reports', id, updates)
  }

  deleteReport(id: string): boolean {
    return this.delete('reports', id)
  }

  listAdjustmentLogs(): AdjustmentLog[] {
    return this.getAll<AdjustmentLog>('adjustmentLogs')
  }

  getAdjustmentLogById(id: string): AdjustmentLog | undefined {
    return this.getById<AdjustmentLog>('adjustmentLogs', id)
  }

  listAdjustmentLogsByTaskId(taskId: string): AdjustmentLog[] {
    return this.find<AdjustmentLog>('adjustmentLogs', (l) => l.taskId === taskId)
  }

  listAdjustmentLogsByAlertId(alertId: string): AdjustmentLog[] {
    return this.find<AdjustmentLog>('adjustmentLogs', (l) => l.alertId === alertId)
  }

  createAdjustmentLog(log: Omit<AdjustmentLog, 'id'> & Partial<Pick<AdjustmentLog, 'id'>>): AdjustmentLog {
    return this.create<AdjustmentLog>('adjustmentLogs', log as unknown as Partial<AdjustmentLog> & Record<string, unknown>)
  }

  updateAdjustmentLog(id: string, updates: Partial<AdjustmentLog>): AdjustmentLog | undefined {
    return this.update<AdjustmentLog>('adjustmentLogs', id, updates)
  }

  deleteAdjustmentLog(id: string): boolean {
    return this.delete('adjustmentLogs', id)
  }

  listDeviationAlerts(): DeviationAlert[] {
    return this.getAll<DeviationAlert>('deviationAlerts')
  }

  getDeviationAlertById(id: string): DeviationAlert | undefined {
    return this.getById<DeviationAlert>('deviationAlerts', id)
  }

  createDeviationAlert(alert: Omit<DeviationAlert, 'id'> & Partial<Pick<DeviationAlert, 'id'>>): DeviationAlert {
    return this.create<DeviationAlert>('deviationAlerts', alert as unknown as Partial<DeviationAlert> & Record<string, unknown>)
  }

  updateDeviationAlert(id: string, updates: Partial<DeviationAlert>): DeviationAlert | undefined {
    return this.update<DeviationAlert>('deviationAlerts', id, updates)
  }

  deleteDeviationAlert(id: string): boolean {
    return this.delete('deviationAlerts', id)
  }

  listDailyTrends(): DailyTrend[] {
    return this.getAll<DailyTrend>('dailyTrends')
  }

  getDailyTrendByDate(date: string): DailyTrend | undefined {
    return this.getById<DailyTrend>('dailyTrends', date)
  }

  createDailyTrend(trend: Omit<DailyTrend, 'date'> & Partial<Pick<DailyTrend, 'date'>>): DailyTrend {
    const dateStr = trend.date || new Date().toISOString().split('T')[0]
    const data = { ...trend, date: dateStr }
    return this.create<DailyTrend>('dailyTrends', data as unknown as Partial<DailyTrend> & Record<string, unknown>)
  }

  updateDailyTrend(date: string, updates: Partial<DailyTrend>): DailyTrend | undefined {
    return this.update<DailyTrend>('dailyTrends', date, updates)
  }

  deleteDailyTrend(date: string): boolean {
    return this.delete('dailyTrends', date)
  }
}

export const db = new DataRepository()
export default DataRepository

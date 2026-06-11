import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TaskStatus, AlertLevel, UserRole } from '../../shared/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

const taskStatusLabels: Record<TaskStatus, string> = {
  pending_verification: '待验证',
  mesh_generation: '网格生成中',
  eruption_calculation: '喷发计算中',
  diffusion_simulation: '扩散模拟中',
  settlement_analysis: '沉降分析中',
  completed: '已完成',
  error_fallback: '错误回退',
}

export function getStatusLabel(status: TaskStatus): string {
  return taskStatusLabels[status] || status
}

const taskStatusColors: Record<TaskStatus, string> = {
  pending_verification: 'bg-yellow-100 text-yellow-800',
  mesh_generation: 'bg-blue-100 text-blue-800',
  eruption_calculation: 'bg-purple-100 text-purple-800',
  diffusion_simulation: 'bg-cyan-100 text-cyan-800',
  settlement_analysis: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  error_fallback: 'bg-red-100 text-red-800',
}

export function getStatusColor(status: TaskStatus): string {
  return taskStatusColors[status] || 'bg-gray-100 text-gray-800'
}

const alertLevelLabels: Record<AlertLevel, string> = {
  info: '信息',
  warning: '警告',
  danger: '危险',
  critical: '严重',
}

export function getAlertLevelLabel(level: AlertLevel): string {
  return alertLevelLabels[level] || level
}

const alertLevelColors: Record<AlertLevel, string> = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

export function getAlertLevelColor(level: AlertLevel): string {
  return alertLevelColors[level] || 'bg-gray-100 text-gray-800'
}

const roleLabels: Record<UserRole, string> = {
  admin: '管理员',
  volcanologist: '火山学家',
  mitigation_expert: '减灾专家',
  chief_scientist: '首席科学家',
  aviation: '航空专家',
}

export function getRoleLabel(role: UserRole): string {
  return roleLabels[role] || role
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

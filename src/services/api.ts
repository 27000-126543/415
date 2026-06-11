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
  ApiResponse,
  MagmaComposition,
  EruptionSourceParams,
  TaskStatus,
} from '../../shared/types'

const API_BASE = '/api'

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  if (!response.ok) {
    try {
      const errorData = await response.json()
      return errorData
    } catch {
      return {
        success: false,
        error: `HTTP Error: ${response.status}`,
        message: '请求失败',
      }
    }
  }

  return response.json()
}

export const tasksApi = {
  getTasks(): Promise<ApiResponse<SimulationTask[]>> {
    return request<SimulationTask[]>('/tasks')
  },

  getTask(id: string): Promise<ApiResponse<SimulationTask>> {
    return request<SimulationTask>(`/tasks/${id}`)
  },

  createTask(data: {
    name: string
    volcanoName: string
    magmaComposition: MagmaComposition
    eruptionParams: EruptionSourceParams
    createdBy: string
  }): Promise<ApiResponse<SimulationTask>> {
    return request<SimulationTask>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateTaskStatus(
    id: string,
    status: TaskStatus
  ): Promise<ApiResponse<SimulationTask>> {
    return request<SimulationTask>(`/tasks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  },

  getMonitoringData(id: string): Promise<ApiResponse<MonitoringData[]>> {
    return request<MonitoringData[]>(`/tasks/${id}/monitoring`)
  },
}

export const alertsApi = {
  getAlerts(): Promise<ApiResponse<Alert[]>> {
    return request<Alert[]>('/alerts')
  },

  reviewAlert(
    id: string,
    data: {
      status: AlertStatus
      reviewedBy: string
      reviewNote?: string
    }
  ): Promise<ApiResponse<Alert>> {
    return request<Alert>(`/alerts/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getDeviations(): Promise<ApiResponse<DeviationAlert[]>> {
    return request<DeviationAlert[]>('/alerts/deviations')
  },
}

export const approvalsApi = {
  getApprovals(): Promise<ApiResponse<Approval[]>> {
    return request<Approval[]>('/approvals')
  },

  decideApproval(
    id: string,
    data: {
      status: ApprovalStatus
      comments?: string
    }
  ): Promise<ApiResponse<Approval>> {
    return request<Approval>(`/approvals/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

export const reportsApi = {
  getReports(): Promise<ApiResponse<Report[]>> {
    return request<Report[]>('/reports')
  },

  getReport(id: string): Promise<ApiResponse<Report>> {
    return request<Report>(`/reports/${id}`)
  },
}

export const dashboardApi = {
  getStats(): Promise<ApiResponse<DashboardStats>> {
    return request<DashboardStats>('/dashboard/stats')
  },
}

export const authApi = {
  getCurrentUser(): Promise<ApiResponse<User>> {
    return request<User>('/auth/me')
  },
}

import { Router, type Request, type Response } from 'express'
import type { Alert, AlertStatus, DeviationAlert, ApiResponse } from '../../shared/types.js'

const router = Router()

const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    taskId: 'task-2',
    type: 'plume_height',
    level: 'warning',
    message: '烟柱高度超过预警阈值',
    threshold: 8000,
    actualValue: 9200,
    status: 'pending_review',
    createdAt: '2024-06-10T11:20:00Z',
  },
  {
    id: 'alert-2',
    taskId: 'task-2',
    type: 'ash_concentration',
    level: 'danger',
    message: '火山灰浓度异常偏高',
    threshold: 300,
    actualValue: 420,
    status: 'pending_review',
    createdAt: '2024-06-10T11:25:00Z',
  },
  {
    id: 'alert-3',
    taskId: 'task-1',
    type: 'thermal_radiation',
    level: 'info',
    message: '热辐射监测值在正常范围内波动',
    threshold: 700,
    actualValue: 610,
    status: 'reviewed',
    createdAt: '2024-06-01T10:30:00Z',
    reviewedBy: '2',
    reviewedAt: '2024-06-01T11:00:00Z',
    reviewNote: '确认数据正常，无需调整参数',
  },
  {
    id: 'alert-4',
    taskId: 'task-1',
    type: 'plume_height',
    level: 'critical',
    message: '烟柱高度达到危险级别',
    threshold: 10000,
    actualValue: 10500,
    status: 'adjusted',
    createdAt: '2024-06-01T10:35:00Z',
    reviewedBy: '4',
    reviewedAt: '2024-06-01T10:50:00Z',
    reviewNote: '已调整喷发源参数，降低初始压力',
  },
]

const mockDeviations: DeviationAlert[] = [
  {
    id: 'deviation-1',
    volcanoName: '樱岛',
    taskIds: ['task-2'],
    plumeHeights: [9200, 8800, 9500],
    deviationPercentage: 18.5,
    isPaused: true,
    createdAt: '2024-06-10T11:30:00Z',
    notified: true,
  },
  {
    id: 'deviation-2',
    volcanoName: '富士山',
    taskIds: ['task-1'],
    plumeHeights: [8500, 9200, 10500],
    deviationPercentage: 12.3,
    isPaused: false,
    createdAt: '2024-06-01T10:40:00Z',
    notified: false,
  },
]

/**
 * 获取告警列表
 * GET /api/alerts
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const response: ApiResponse<Alert[]> = {
      success: true,
      data: mockAlerts,
      message: '获取告警列表成功',
    }
    res.status(200).json(response)
  } catch (error) {
    const err = error as Error
    const response: ApiResponse<null> = {
      success: false,
      error: err.message,
      message: '获取告警列表失败',
    }
    res.status(500).json(response)
  }
})

/**
 * 审核告警
 * POST /api/alerts/:id/review
 */
router.post('/:id/review', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const {
      status,
      reviewedBy,
      reviewNote,
    }: {
      status: AlertStatus
      reviewedBy: string
      reviewNote?: string
    } = req.body

    const alertIndex = mockAlerts.findIndex((a) => a.id === id)
    if (alertIndex === -1) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Alert not found',
        message: '告警不存在',
      }
      res.status(404).json(response)
      return
    }

    mockAlerts[alertIndex].status = status
    mockAlerts[alertIndex].reviewedBy = reviewedBy
    mockAlerts[alertIndex].reviewedAt = new Date().toISOString()
    if (reviewNote) {
      mockAlerts[alertIndex].reviewNote = reviewNote
    }

    const response: ApiResponse<Alert> = {
      success: true,
      data: mockAlerts[alertIndex],
      message: '告警审核成功',
    }
    res.status(200).json(response)
  } catch (error) {
    const err = error as Error
    const response: ApiResponse<null> = {
      success: false,
      error: err.message,
      message: '告警审核失败',
    }
    res.status(500).json(response)
  }
})

/**
 * 获取偏差告警列表
 * GET /api/alerts/deviations
 */
router.get('/deviations', async (req: Request, res: Response): Promise<void> => {
  try {
    const response: ApiResponse<DeviationAlert[]> = {
      success: true,
      data: mockDeviations,
      message: '获取偏差告警列表成功',
    }
    res.status(200).json(response)
  } catch (error) {
    const err = error as Error
    const response: ApiResponse<null> = {
      success: false,
      error: err.message,
      message: '获取偏差告警列表失败',
    }
    res.status(500).json(response)
  }
})

export default router

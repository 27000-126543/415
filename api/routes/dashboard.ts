import { Router, type Request, type Response } from 'express'
import type { DashboardStats, ApiResponse } from '../../shared/types.js'

const router = Router()

/**
 * 获取仪表盘统计数据
 * GET /api/dashboard/stats
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats: DashboardStats = {
      totalTasks: 156,
      completionRate: 0.87,
      totalAlerts: 42,
      averageAccuracy: 0.92,
      activeTasks: 18,
      averageLeadTime: 145,
      dailyTrend: [
        { date: '2024-06-05', completionRate: 0.82, leadTime: 160, accuracy: 0.88 },
        { date: '2024-06-06', completionRate: 0.84, leadTime: 155, accuracy: 0.89 },
        { date: '2024-06-07', completionRate: 0.85, leadTime: 150, accuracy: 0.90 },
        { date: '2024-06-08', completionRate: 0.86, leadTime: 148, accuracy: 0.91 },
        { date: '2024-06-09', completionRate: 0.87, leadTime: 145, accuracy: 0.92 },
        { date: '2024-06-10', completionRate: 0.88, leadTime: 142, accuracy: 0.93 },
        { date: '2024-06-11', completionRate: 0.87, leadTime: 145, accuracy: 0.92 },
      ],
    }

    const response: ApiResponse<DashboardStats> = {
      success: true,
      data: stats,
      message: '获取统计数据成功',
    }
    res.status(200).json(response)
  } catch (error) {
    const err = error as Error
    const response: ApiResponse<null> = {
      success: false,
      error: err.message,
      message: '获取统计数据失败',
    }
    res.status(500).json(response)
  }
})

export default router

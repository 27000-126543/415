import { Router, type Request, type Response } from 'express'
import type { Report, ApiResponse } from '../../shared/types.js'

const router = Router()

const mockReports: Report[] = [
  {
    id: 'report-1',
    taskId: 'task-1',
    title: '富士山喷发模拟分析报告',
    summary:
      '本次模拟结果显示富士山喷发烟柱最高可达10500米，火山灰将影响周边50公里范围，建议航空部门调整航线，周边城市做好防灾准备。',
    plumeHeightChart: [
      {
        id: 'mon-1',
        taskId: 'task-1',
        timestamp: '2024-06-01T10:00:00Z',
        plumeHeight: 8500,
        ashConcentration: 250,
        thermalRadiation: 450,
      },
      {
        id: 'mon-2',
        taskId: 'task-1',
        timestamp: '2024-06-01T10:15:00Z',
        plumeHeight: 9200,
        ashConcentration: 310,
        thermalRadiation: 520,
      },
      {
        id: 'mon-3',
        taskId: 'task-1',
        timestamp: '2024-06-01T10:30:00Z',
        plumeHeight: 10500,
        ashConcentration: 380,
        thermalRadiation: 610,
      },
    ],
    ashDistribution: [
      { x: 0, y: 0, z: 5000, value: 400 },
      { x: 1000, y: 0, z: 4500, value: 350 },
      { x: 2000, y: 0, z: 4000, value: 300 },
      { x: 3000, y: 0, z: 3500, value: 250 },
      { x: 4000, y: 0, z: 3000, value: 200 },
    ],
    thermalRadiationMap: [
      { x: 0, y: 0, z: 0, value: 610 },
      { x: 500, y: 500, z: 0, value: 520 },
      { x: 1000, y: 1000, z: 0, value: 450 },
      { x: 1500, y: 1500, z: 0, value: 380 },
      { x: 2000, y: 2000, z: 0, value: 310 },
    ],
    settlementThickness: [
      { x: 0, y: 0, z: 0, value: 45 },
      { x: 1000, y: 0, z: 0, value: 38 },
      { x: 2000, y: 0, z: 0, value: 32 },
      { x: 3000, y: 0, z: 0, value: 25 },
      { x: 4000, y: 0, z: 0, value: 18 },
    ],
    aviationRiskLevel: 'high',
    generatedAt: '2024-06-01T12:00:00Z',
    generatedBy: '2',
  },
  {
    id: 'report-2',
    taskId: 'task-2',
    title: '樱岛火山监测模拟报告（进行中）',
    summary:
      '模拟正在进行中，当前烟柱高度约5200米，监测数据出现轻微偏差，已触发告警等待审核。',
    plumeHeightChart: [
      {
        id: 'mon-4',
        taskId: 'task-2',
        timestamp: '2024-06-10T11:00:00Z',
        plumeHeight: 5200,
        ashConcentration: 180,
        thermalRadiation: 320,
      },
    ],
    ashDistribution: [],
    thermalRadiationMap: [],
    settlementThickness: [],
    aviationRiskLevel: 'medium',
    generatedAt: '2024-06-10T11:30:00Z',
    generatedBy: '2',
  },
]

/**
 * 获取报告列表
 * GET /api/reports
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const response: ApiResponse<Report[]> = {
      success: true,
      data: mockReports,
      message: '获取报告列表成功',
    }
    res.status(200).json(response)
  } catch (error) {
    const err = error as Error
    const response: ApiResponse<null> = {
      success: false,
      error: err.message,
      message: '获取报告列表失败',
    }
    res.status(500).json(response)
  }
})

/**
 * 获取单个报告详情
 * GET /api/reports/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const report = mockReports.find((r) => r.id === id)

    if (!report) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Report not found',
        message: '报告不存在',
      }
      res.status(404).json(response)
      return
    }

    const response: ApiResponse<Report> = {
      success: true,
      data: report,
      message: '获取报告详情成功',
    }
    res.status(200).json(response)
  } catch (error) {
    const err = error as Error
    const response: ApiResponse<null> = {
      success: false,
      error: err.message,
      message: '获取报告详情失败',
    }
    res.status(500).json(response)
  }
})

export default router

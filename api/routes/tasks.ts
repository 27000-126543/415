import { Router, type Request, type Response } from 'express'
import type {
  SimulationTask,
  TaskStatus,
  MonitoringData,
  ApiResponse,
  EruptionSourceParams,
  MagmaComposition,
} from '../../shared/types.js'

const router = Router()

const mockTasks: SimulationTask[] = [
  {
    id: 'task-1',
    name: '富士山喷发模拟',
    volcanoName: '富士山',
    magmaComposition: {
      sio2: 65.5,
      al2o3: 15.2,
      feo: 5.8,
      mgo: 3.1,
      cao: 4.2,
      na2o: 3.5,
      k2o: 2.7,
    },
    eruptionParams: {
      ventDiameter: 150,
      initialPressure: 120,
      initialTemperature: 1100,
      h2oContent: 4.5,
      co2Content: 1.2,
      so2Content: 0.08,
    },
    status: 'completed',
    progress: 100,
    createdBy: '1',
    createdAt: '2024-06-01T08:00:00Z',
    updatedAt: '2024-06-01T12:00:00Z',
    currentStageStartTime: '2024-06-01T11:00:00Z',
    deviationFlag: false,
  },
  {
    id: 'task-2',
    name: '樱岛火山监测模拟',
    volcanoName: '樱岛',
    magmaComposition: {
      sio2: 68.2,
      al2o3: 14.8,
      feo: 4.5,
      mgo: 2.8,
      cao: 3.9,
      na2o: 3.8,
      k2o: 2.0,
    },
    eruptionParams: {
      ventDiameter: 100,
      initialPressure: 95,
      initialTemperature: 1050,
      h2oContent: 5.2,
      co2Content: 1.5,
      so2Content: 0.12,
    },
    status: 'eruption_calculation',
    progress: 45,
    createdBy: '2',
    createdAt: '2024-06-10T10:00:00Z',
    updatedAt: '2024-06-10T11:30:00Z',
    currentStageStartTime: '2024-06-10T11:00:00Z',
    deviationFlag: true,
  },
  {
    id: 'task-3',
    name: '长白山喷发预测',
    volcanoName: '长白山',
    magmaComposition: {
      sio2: 72.1,
      al2o3: 13.5,
      feo: 3.2,
      mgo: 1.8,
      cao: 2.5,
      na2o: 4.1,
      k2o: 2.8,
    },
    eruptionParams: {
      ventDiameter: 200,
      initialPressure: 150,
      initialTemperature: 1150,
      h2oContent: 6.0,
      co2Content: 0.9,
      so2Content: 0.15,
    },
    status: 'pending_verification',
    progress: 10,
    createdBy: '3',
    createdAt: '2024-06-11T09:00:00Z',
    updatedAt: '2024-06-11T09:15:00Z',
    currentStageStartTime: '2024-06-11T09:00:00Z',
    deviationFlag: false,
  },
]

const mockMonitoringData: Record<string, MonitoringData[]> = {
  'task-1': [
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
  'task-2': [
    {
      id: 'mon-4',
      taskId: 'task-2',
      timestamp: '2024-06-10T11:00:00Z',
      plumeHeight: 5200,
      ashConcentration: 180,
      thermalRadiation: 320,
    },
  ],
}

/**
 * 获取任务列表
 * GET /api/tasks
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const response: ApiResponse<SimulationTask[]> = {
      success: true,
      data: mockTasks,
      message: '获取任务列表成功',
    }
    res.status(200).json(response)
  } catch (error) {
    const err = error as Error
    const response: ApiResponse<null> = {
      success: false,
      error: err.message,
      message: '获取任务列表失败',
    }
    res.status(500).json(response)
  }
})

/**
 * 创建新任务
 * POST /api/tasks
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      volcanoName,
      magmaComposition,
      eruptionParams,
      createdBy,
    }: {
      name: string
      volcanoName: string
      magmaComposition: MagmaComposition
      eruptionParams: EruptionSourceParams
      createdBy: string
    } = req.body

    const newTask: SimulationTask = {
      id: `task-${Date.now()}`,
      name,
      volcanoName,
      magmaComposition,
      eruptionParams,
      status: 'pending_verification',
      progress: 0,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentStageStartTime: new Date().toISOString(),
      deviationFlag: false,
    }

    mockTasks.push(newTask)

    const response: ApiResponse<SimulationTask> = {
      success: true,
      data: newTask,
      message: '任务创建成功',
    }
    res.status(201).json(response)
  } catch (error) {
    const err = error as Error
    const response: ApiResponse<null> = {
      success: false,
      error: err.message,
      message: '任务创建失败',
    }
    res.status(500).json(response)
  }
})

/**
 * 获取单个任务详情
 * GET /api/tasks/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const task = mockTasks.find((t) => t.id === id)

    if (!task) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Task not found',
        message: '任务不存在',
      }
      res.status(404).json(response)
      return
    }

    const response: ApiResponse<SimulationTask> = {
      success: true,
      data: task,
      message: '获取任务详情成功',
    }
    res.status(200).json(response)
  } catch (error) {
    const err = error as Error
    const response: ApiResponse<null> = {
      success: false,
      error: err.message,
      message: '获取任务详情失败',
    }
    res.status(500).json(response)
  }
})

/**
 * 更新任务状态
 * PUT /api/tasks/:id/status
 */
router.put('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status }: { status: TaskStatus } = req.body

    const taskIndex = mockTasks.findIndex((t) => t.id === id)
    if (taskIndex === -1) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Task not found',
        message: '任务不存在',
      }
      res.status(404).json(response)
      return
    }

    mockTasks[taskIndex].status = status
    mockTasks[taskIndex].updatedAt = new Date().toISOString()
    mockTasks[taskIndex].currentStageStartTime = new Date().toISOString()

    if (status === 'completed') {
      mockTasks[taskIndex].progress = 100
    }

    const response: ApiResponse<SimulationTask> = {
      success: true,
      data: mockTasks[taskIndex],
      message: '任务状态更新成功',
    }
    res.status(200).json(response)
  } catch (error) {
    const err = error as Error
    const response: ApiResponse<null> = {
      success: false,
      error: err.message,
      message: '任务状态更新失败',
    }
    res.status(500).json(response)
  }
})

/**
 * 获取任务监测数据
 * GET /api/tasks/:id/monitoring
 */
router.get('/:id/monitoring', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const task = mockTasks.find((t) => t.id === id)

    if (!task) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Task not found',
        message: '任务不存在',
      }
      res.status(404).json(response)
      return
    }

    const monitoringData = mockMonitoringData[id] || []

    const response: ApiResponse<MonitoringData[]> = {
      success: true,
      data: monitoringData,
      message: '获取监测数据成功',
    }
    res.status(200).json(response)
  } catch (error) {
    const err = error as Error
    const response: ApiResponse<null> = {
      success: false,
      error: err.message,
      message: '获取监测数据失败',
    }
    res.status(500).json(response)
  }
})

export default router

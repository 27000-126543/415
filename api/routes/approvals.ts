import { Router, type Request, type Response } from 'express'
import type { Approval, ApprovalStatus, ApiResponse } from '../../shared/types.js'

const router = Router()

const mockApprovals: Approval[] = [
  {
    id: 'approval-1',
    taskId: 'task-1',
    reportId: 'report-1',
    stage: 'volcanologist_validation',
    status: 'approved',
    approverId: '2',
    approverRole: 'volcanologist',
    comments: '模拟参数合理，数据可信，同意进入下一阶段',
    createdAt: '2024-06-01T13:00:00Z',
    decidedAt: '2024-06-01T14:30:00Z',
  },
  {
    id: 'approval-2',
    taskId: 'task-1',
    reportId: 'report-1',
    stage: 'mitigation_confirmation',
    status: 'pending',
    approverId: '3',
    approverRole: 'mitigation_expert',
    comments: '等待灾害减轻专家确认防灾建议',
    createdAt: '2024-06-01T15:00:00Z',
  },
  {
    id: 'approval-3',
    taskId: 'task-2',
    reportId: 'report-2',
    stage: 'volcanologist_validation',
    status: 'pending',
    approverId: '4',
    approverRole: 'chief_scientist',
    comments: '监测数据出现偏差，需要首席科学家审核',
    createdAt: '2024-06-10T12:00:00Z',
  },
]

/**
 * 获取审批列表
 * GET /api/approvals
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const response: ApiResponse<Approval[]> = {
      success: true,
      data: mockApprovals,
      message: '获取审批列表成功',
    }
    res.status(200).json(response)
  } catch (error) {
    const err = error as Error
    const response: ApiResponse<null> = {
      success: false,
      error: err.message,
      message: '获取审批列表失败',
    }
    res.status(500).json(response)
  }
})

/**
 * 审批决策
 * POST /api/approvals/:id/decide
 */
router.post('/:id/decide', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const {
      status,
      comments,
    }: {
      status: ApprovalStatus
      comments?: string
    } = req.body

    const approvalIndex = mockApprovals.findIndex((a) => a.id === id)
    if (approvalIndex === -1) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Approval not found',
        message: '审批不存在',
      }
      res.status(404).json(response)
      return
    }

    mockApprovals[approvalIndex].status = status
    mockApprovals[approvalIndex].decidedAt = new Date().toISOString()
    if (comments) {
      mockApprovals[approvalIndex].comments = comments
    }

    const response: ApiResponse<Approval> = {
      success: true,
      data: mockApprovals[approvalIndex],
      message: '审批决策成功',
    }
    res.status(200).json(response)
  } catch (error) {
    const err = error as Error
    const response: ApiResponse<null> = {
      success: false,
      error: err.message,
      message: '审批决策失败',
    }
    res.status(500).json(response)
  }
})

export default router

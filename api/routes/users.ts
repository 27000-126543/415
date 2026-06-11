import { Router, type Request, type Response } from 'express'
import type { User, ApiResponse } from '../../shared/types.js'

const router = Router()

const mockUsers: User[] = [
  {
    id: '1',
    name: '张三',
    email: 'zhangsan@volcano.example.com',
    role: 'admin',
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    id: '2',
    name: '李四',
    email: 'lisi@volcano.example.com',
    role: 'volcanologist',
    createdAt: '2024-02-20T09:30:00Z',
  },
  {
    id: '3',
    name: '王五',
    email: 'wangwu@volcano.example.com',
    role: 'mitigation_expert',
    createdAt: '2024-03-10T10:00:00Z',
  },
  {
    id: '4',
    name: '赵六',
    email: 'zhaoliu@volcano.example.com',
    role: 'chief_scientist',
    createdAt: '2024-04-05T11:00:00Z',
  },
  {
    id: '5',
    name: '钱七',
    email: 'qianqi@volcano.example.com',
    role: 'aviation',
    createdAt: '2024-05-18T14:00:00Z',
  },
]

/**
 * 获取用户列表
 * GET /api/users
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const response: ApiResponse<User[]> = {
      success: true,
      data: mockUsers,
      message: '获取用户列表成功',
    }
    res.status(200).json(response)
  } catch (error) {
    const err = error as Error
    const response: ApiResponse<null> = {
      success: false,
      error: err.message,
      message: '获取用户列表失败',
    }
    res.status(500).json(response)
  }
})

export default router

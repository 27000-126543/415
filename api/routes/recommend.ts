import { Router, type Request, type Response } from 'express'
import type { EruptionSourceParams, MagmaComposition, ApiResponse } from '../../shared/types.js'

const router = Router()

interface RecommendRequest {
  volcanoName: string
  magmaComposition: MagmaComposition
  historicalData?: {
    plumeHeights: number[]
    durations: number[]
  }
}

interface RecommendResponse {
  recommendedParams: EruptionSourceParams
  confidence: number
  reasoning: string[]
  similarVolcanoes: string[]
}

/**
 * 智能参数推荐
 * POST /api/recommend/params
 */
router.post('/params', async (req: Request, res: Response): Promise<void> => {
  try {
    const { volcanoName, magmaComposition, historicalData }: RecommendRequest = req.body

    const sio2 = magmaComposition?.sio2 ?? 65

    const recommendVentDiameter = (): number => {
      if (sio2 >= 70) return 80 + Math.random() * 40
      if (sio2 >= 65) return 120 + Math.random() * 60
      return 180 + Math.random() * 80
    }

    const recommendInitialPressure = (): number => {
      if (sio2 >= 70) return 160 + Math.random() * 40
      if (sio2 >= 65) return 100 + Math.random() * 50
      return 70 + Math.random() * 40
    }

    const recommendTemperature = (): number => {
      if (sio2 >= 70) return 800 + Math.random() * 100
      if (sio2 >= 65) return 1000 + Math.random() * 150
      return 1150 + Math.random() * 150
    }

    const recommendH2O = (): number => {
      if (sio2 >= 70) return 5.5 + Math.random() * 2
      if (sio2 >= 65) return 4 + Math.random() * 2
      return 2.5 + Math.random() * 1.5
    }

    const recommendedParams: EruptionSourceParams = {
      ventDiameter: Math.round(recommendVentDiameter()),
      initialPressure: Math.round(recommendInitialPressure()),
      initialTemperature: Math.round(recommendTemperature()),
      h2oContent: Math.round(recommendH2O() * 100) / 100,
      co2Content: Math.round((0.8 + Math.random() * 1.2) * 100) / 100,
      so2Content: Math.round((0.05 + Math.random() * 0.15) * 1000) / 1000,
    }

    let confidence = 0.75
    const reasoning: string[] = []

    if (sio2 >= 70) {
      reasoning.push('岩浆属于流纹岩/英安岩类型(SiO₂≥70%)，黏度高，推荐较小喷口直径和较高初始压力')
      confidence += 0.05
    } else if (sio2 >= 65) {
      reasoning.push('岩浆属于安山岩/英安岩类型(65%≤SiO₂<70%)，中等黏度，参数取中间范围')
    } else {
      reasoning.push('岩浆属于玄武岩类型(SiO₂<65%)，黏度低，推荐较大喷口直径和较低初始压力')
    }

    if (historicalData && historicalData.plumeHeights.length > 0) {
      const avgPlumeHeight =
        historicalData.plumeHeights.reduce((a, b) => a + b, 0) / historicalData.plumeHeights.length
      reasoning.push(`基于历史喷发数据，平均烟柱高度约 ${Math.round(avgPlumeHeight)} 米，参数已相应调整`)
      confidence += 0.1
    } else {
      reasoning.push('缺少历史喷发数据，建议结合实地监测结果进一步验证参数')
    }

    const similarVolcanoes: string[] = []
    if (volcanoName.includes('富士') || sio2 >= 65 && sio2 < 70) {
      similarVolcanoes.push('富士山', '樱岛', '浅间山')
    } else if (sio2 >= 70) {
      similarVolcanoes.push('长白山', '圣海伦斯火山', '皮纳图博火山')
    } else {
      similarVolcanoes.push('基拉韦厄火山', '冒纳罗亚火山', '埃特纳火山')
    }

    confidence = Math.min(confidence, 0.95)

    const data: RecommendResponse = {
      recommendedParams,
      confidence: Math.round(confidence * 100) / 100,
      reasoning,
      similarVolcanoes,
    }

    const response: ApiResponse<RecommendResponse> = {
      success: true,
      data,
      message: '智能参数推荐完成',
    }
    res.status(200).json(response)
  } catch (error) {
    const err = error as Error
    const response: ApiResponse<null> = {
      success: false,
      error: err.message,
      message: '智能参数推荐失败',
    }
    res.status(500).json(response)
  }
})

export default router

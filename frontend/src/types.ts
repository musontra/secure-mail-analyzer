// Backend API sözleşmesinin TypeScript karşılığı (JSON camelCase gelir)

export type InputType = 'email' | 'link'

export type RiskLevel = 'low' | 'medium' | 'high'

export interface DetectedSignal {
  code: string
  title: string
  description: string
  score: number
  matchedText: string | null
}

export interface AnalysisResponse {
  id: string
  inputType: InputType
  inputContent: string
  riskLevel: RiskLevel
  riskScore: number
  detectedSignals: DetectedSignal[]
  createdAt: string
}

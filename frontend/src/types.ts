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
  // LLM katmanı sonuçları; LLM çalışmadıysa null
  llmAssessment: RiskLevel | null
  educationalExplanation: string | null
}

// --- Auth ---

export type UserRole = 'user' | 'admin'

// Oturumdaki kullanıcı (login yanıtından gelir, sessionStorage'da saklanır)
export interface AuthUser {
  token: string
  email: string
  role: UserRole
}

// --- Admin istatistikleri (GET /api/admin/stats) ---

export interface RiskDistribution {
  low: number
  medium: number
  high: number
  lowPercent: number
  mediumPercent: number
  highPercent: number
}

export interface TopSignal {
  code: string
  title: string
  count: number
  percent: number
}

export interface RecentAnalysis {
  id: string
  inputType: InputType
  preview: string
  riskLevel: RiskLevel
  riskScore: number
  createdAt: string
}

export interface AdminStats {
  totalAnalyses: number
  todayAnalyses: number
  riskDistribution: RiskDistribution
  topSignals: TopSignal[]
  recentAnalyses: RecentAnalysis[]
}

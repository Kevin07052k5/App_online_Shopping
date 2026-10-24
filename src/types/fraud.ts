export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export type DecisionType = 'APPROVED' | 'CHALLENGE_OTP' | 'HOLD_REVIEW'

export interface AIExplanation {
  riskScore: number // 0 to 100
  riskLevel: RiskLevel
  decision: DecisionType
  reasons: string[]
  summary: string
  modelName: string
  evaluatedAt: string
}

export interface FraudEvaluationPayload {
  orderId: string
  totalAmount: number
  discountAmount: number
  voucherCode?: string
  itemsCount: number
  paymentMethod: string
  deviceEntropy: string
  clientIp: string
  checkoutVelocitySec: number
  customerEmail: string
  shippingAddress: string
}

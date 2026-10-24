// Định nghĩa kiểu dữ liệu cho Hệ thống Bảo vệ Sinh trắc học Khuôn mặt & Chống Giả mạo (SFace ONNX)

export interface FaceBoundingBox {
  x: number
  y: number
  width: number
  height: number
  confidence: number
}

export type LivenessChallengeType = 'BLINK' | 'TURN_LEFT' | 'TURN_RIGHT' | 'SMILE' | 'NOD'

export interface LivenessStatus {
  challenge: LivenessChallengeType
  challengeText: string
  isPassed: boolean
  progress: number // 0 - 100%
  blinkCount: number
  motionScore: number
  moireScore: number // Phân tích vi vân sọc màn hình (0 - 100, càng cao càng giống màn hình)
  staticFrameScore: number // Đo độ đóng băng điểm ảnh (print attack)
  isLive: boolean
  spoofThreat: 'NONE' | 'PRINT_ATTACK' | 'REPLAY_ATTACK' | 'MASK_ATTACK' | 'MOTION_SUSPICIOUS'
  explanation: string
}

export interface EnrolledProfile {
  id: string
  name: string
  role: 'ADMIN' | 'CUSTOMER' | 'SECURITY_OFFICER'
  embedding128D: number[] // Vector nhúng 128 chiều từ tầng fc1 của sface.onnx
  createdAt: string
  avatarUrl?: string
}

export interface BiometricVerificationResult {
  success: boolean
  status: 'MATCHED' | 'MISMATCH' | 'SPOOF_DETECTED' | 'NO_FACE' | 'TIMEOUT'
  cosineSimilarity: number // -1 đến 1 (ngưỡng >= 0.363 - 0.40 là hợp lệ)
  livenessScore: number // 0 đến 100
  spoofThreat: 'NONE' | 'PRINT_ATTACK' | 'REPLAY_ATTACK' | 'MASK_ATTACK' | 'MOTION_SUSPICIOUS'
  matchedProfile?: EnrolledProfile
  embedding128D: number[]
  timestamp: string
  details: string
}

export type BiometricAuthTarget = 'CHECKOUT_ORDER' | 'ADMIN_LOGIN' | 'LAB_TEST'

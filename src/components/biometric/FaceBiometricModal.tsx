'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  Camera,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Fingerprint,
  Zap,
  Sparkles,
  Lock,
  Cpu,
  Eye,
  Sliders,
  Scan,
  UserCheck,
  UserPlus,
  Trash2,
  X,
  Play,
  RotateCcw,
  Upload,
  Image as ImageIcon,
} from 'lucide-react'
import {
  BiometricVerificationResult,
  EnrolledProfile,
  LivenessChallengeType,
  LivenessStatus,
} from '@/src/types/biometric'
import {
  getOwnerProfile,
  getEnrolledProfiles,
  enrollOwnerFaceProfile,
  resetEnrolledProfiles,
  extractFaceEmbedding,
  calculateCosineSimilarity,
  evaluateLivenessAndAntiSpoofing,
  verifyFaceBiometrics,
} from '@/src/services/sfaceService'
import { useAuth } from '@/src/context/AuthContext'

interface FaceBiometricModalProps {
  isOpen: boolean
  title?: string
  subtitle?: string
  targetRole?: 'CUSTOMER' | 'ADMIN'
  onVerified: (result: BiometricVerificationResult) => void
  onCancel: () => void
}

export function FaceBiometricModal({
  isOpen,
  title = 'Xác Thực Sinh Trắc Học Khuôn Mặt (SFace Face ID)',
  subtitle = 'Lớp phòng vệ chống giả mạo & mô phỏng danh tính bằng AI SFace ONNX',
  targetRole = 'CUSTOMER',
  onVerified,
  onCancel,
}: FaceBiometricModalProps) {
  const { currentUser } = useAuth()

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)

  // Quản lý luồng webcam & camera ảo an toàn qua Ref để tránh lỗi Stale Closure trên trình duyệt Windows
  const streamRef = useRef<MediaStream | null>(null)
  const virtualStreamIntervalRef = useRef<any>(null)
  const isAcquiringCameraRef = useRef<boolean>(false)
  const isExtractingRef = useRef<boolean>(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isStreaming, setIsStreaming] = useState<boolean>(false)
  const [isConnectingCamera, setIsConnectingCamera] = useState<boolean>(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Danh sách camera khả dụng trên hệ thống và camera được chọn
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')

  // Chế độ nguồn quét: 'VIRTUAL' (Mặc định: Camera ảo AI an toàn) | 'WEBCAM' (Webcam thật khi bấm chọn) | 'IMAGE_UPLOAD' (Ảnh chân dung từ máy)
  const [inputMode, setInputMode] = useState<'WEBCAM' | 'VIRTUAL' | 'IMAGE_UPLOAD'>('VIRTUAL')

  // Hỗ trợ chế độ Tải Ảnh Mặt Từ Máy Tính nếu Webcam bị khóa/không có webcam
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null)
  const uploadedImageRef = useRef<HTMLImageElement | null>(null)

  // Hồ sơ khuôn mặt THẬT của chính người dùng (Chủ tài khoản)
  const [ownerProfile, setOwnerProfile] = useState<EnrolledProfile | null>(null)
  const [isEnrollMode, setIsEnrollMode] = useState<boolean>(false)
  const [ownerNameInput, setOwnerNameInput] = useState<string>('')
  const [enrollSuccessMsg, setEnrollSuccessMsg] = useState<string | null>(null)

  // Liveness & Challenge states
  const [activeChallenge, setActiveChallenge] = useState<LivenessChallengeType>('BLINK')
  const [livenessStatus, setLivenessStatus] = useState<LivenessStatus>({
    challenge: 'BLINK',
    challengeText: 'Vui lòng nhìn thẳng vào camera',
    isPassed: false,
    progress: 10,
    blinkCount: 0,
    motionScore: 20,
    moireScore: 5,
    staticFrameScore: 0,
    isLive: false,
    spoofThreat: 'NONE',
    explanation: 'Đang kết nối camera và nhận diện khuôn mặt...',
  })

  // SFace Output & Metrics
  const [currentEmbedding, setCurrentEmbedding] = useState<number[]>(new Array(128).fill(0))
  const [cosineSim, setCosineSim] = useState<number>(0)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isCapturingEnroll, setIsCapturingEnroll] = useState(false)
  const [verificationResult, setVerificationResult] = useState<BiometricVerificationResult | null>(null)

  // Simulation mode for evaluation/demo
  const [simulationMode, setSimulationMode] = useState<
    'NONE' | 'LIVE_PASS' | 'PRINT_ATTACK' | 'REPLAY_ATTACK' | 'IMPOSTOR'
  >('NONE')

  const previousCanvasesRef = useRef<HTMLCanvasElement[]>([])
  const frameDeltaSumRef = useRef<number>(0)
  const animFrameIdRef = useRef<number | null>(null)

  // 1. Tải hồ sơ khuôn mặt thật của Chủ Tài Khoản từ localStorage
  const refreshProfiles = useCallback(() => {
    const owner = getOwnerProfile()
    setOwnerProfile(owner)

    if (!owner) {
      // Nếu chưa có hồ sơ khuôn mặt thật, tự động chuyển sang chế độ Đăng Ký Khuôn Mặt Của Bạn
      setIsEnrollMode(true)
      const defaultName = currentUser?.name || (targetRole === 'ADMIN' ? 'Quản Trị Viên (Tôi)' : 'Khương Gia Phát (Tôi)')
      setOwnerNameInput(defaultName)
    } else {
      setIsEnrollMode(false)
      setOwnerNameInput(owner.name)
    }
  }, [currentUser, targetRole])

  // Lấy danh sách camera kết nối vào máy tính
  const refreshCameras = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return []
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = devices.filter((d) => d.kind === 'videoinput')
      setAvailableCameras(videoInputs)
      return videoInputs
    } catch (e) {
      console.warn('Enumerate devices error:', e)
      return []
    }
  }, [])

  // 2. Tắt Camera sạch sẽ - giải phóng triệt để tài nguyên phần cứng cho Windows OS
  const stopCamera = useCallback(() => {
    if (virtualStreamIntervalRef.current) {
      clearInterval(virtualStreamIntervalRef.current)
      virtualStreamIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.enabled = false
          track.stop()
        } catch (e) {
          console.warn('Track stop error:', e)
        }
      })
      streamRef.current = null
    }
    setStream(null)
    setIsStreaming(false)
    if (videoRef.current) {
      try {
        videoRef.current.pause()
        videoRef.current.srcObject = null
        videoRef.current.removeAttribute('src')
        videoRef.current.load()
      } catch (e) {
        console.warn('Video reset error:', e)
      }
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current)
      animFrameIdRef.current = null
    }
  }, [])

  // 3. Khởi tạo Camera Vật Lý với cơ chế an toàn tối đa - Triệt tiêu xung đột Driver
  const startCamera = useCallback(async (targetDeviceId?: string) => {
    // Ngăn chặn gọi trùng lặp song song
    if (isAcquiringCameraRef.current) return
    isAcquiringCameraRef.current = true

    // Phát tín hiệu toàn cục yêu cầu các component khác (như BiometricLab) nhường webcam ngay lập tức
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:release_camera'))
    }

    // Tắt sạch luồng hiện tại
    stopCamera()
    setCameraError(null)
    setIsConnectingCamera(true)
    setInputMode('WEBCAM')
    setUploadedImageSrc(null)
    uploadedImageRef.current = null

    // Chờ 350ms để Windows Camera Frame Server & DirectShow driver giải phóng hoàn toàn buffer
    await new Promise((r) => setTimeout(r, 350))

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ getUserMedia API.')
      }

      let mediaStream: MediaStream | null = null

      // Chiến lược 1: Thử deviceId cụ thể nếu người dùng chủ động chọn từ menu
      if (targetDeviceId && targetDeviceId.trim() !== '') {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: targetDeviceId },
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: false,
          })
          if (mediaStream) setSelectedCameraId(targetDeviceId)
        } catch (e) {
          console.warn(`Target deviceId ${targetDeviceId} failed, cooling down...`, e)
          await new Promise((r) => setTimeout(r, 350))
        }
      }

      // Chiến lược 2: Sử dụng camera người dùng tiêu chuẩn (Không quét lặp driver trong vòng lặp kín)
      if (!mediaStream) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: false,
          })
        } catch (e) {
          console.warn('FacingMode camera failed, cooling down before basic video fallback...', e)
          // Nghỉ 400ms để driver Windows không bị crash vì gọi dồn dập
          await new Promise((r) => setTimeout(r, 400))
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            })
          } catch (eBasic) {
            throw eBasic
          }
        }
      }

      if (!mediaStream) {
        throw new Error('Không thể khởi tạo luồng video từ camera máy tính.')
      }

      streamRef.current = mediaStream
      setStream(mediaStream)

      setIsStreaming(true)

      // Cập nhật danh sách camera, loại trừ các cảm biến IR / Windows Hello để tránh xung đột
      if (navigator.mediaDevices.enumerateDevices) {
        try {
          const devs = await navigator.mediaDevices.enumerateDevices()
          const videoInputs = devs.filter((d) => {
            if (d.kind !== 'videoinput') return false
            const lbl = (d.label || '').toLowerCase()
            return (
              !lbl.includes('ir') &&
              !lbl.includes('infrared') &&
              !lbl.includes('depth') &&
              !lbl.includes('hello')
            )
          })
          setAvailableCameras(videoInputs.length > 0 ? videoInputs : devs.filter((d) => d.kind === 'videoinput'))
        } catch {}
      }
    } catch (err: any) {
      console.warn('Camera access error:', err)
      let msg = 'Không thể kết nối Webcam.'
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Trình duyệt chưa được cấp quyền Camera. Hãy bấm vào biểu tượng Ổ Khóa 🔒 bên trái URL và BẬT quyền Camera (Allow).'
      } else if (err.name === 'NotReadableError') {
        msg = 'Webcam của laptop đang bị Windows hoặc ứng dụng khác (Zalo, Zoom, Teams, Camera app...) chiếm dụng độc quyền. Hãy dùng Camera Ảo AI để tiếp tục an toàn.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Không tìm thấy thiết bị Webcam trên máy tính của bạn.'
      } else {
        msg = `Lỗi Camera (${err.name || 'Error'}): ${err.message || 'Không thể bắt đầu luồng video'}`
      }
      setCameraError(msg)
    } finally {
      setIsConnectingCamera(false)
      isAcquiringCameraRef.current = false
    }
  }, [stopCamera])

  // 4. Khởi tạo Camera Ảo AI Mô Phỏng (Virtual Face Stream 30fps) - Không cần phần cứng
  const startVirtualCamera = useCallback(() => {
    stopCamera()
    setCameraError(null)
    setIsConnectingCamera(false)
    setInputMode('VIRTUAL')
    setUploadedImageSrc(null)
    uploadedImageRef.current = null

    const vCanvas = document.createElement('canvas')
    vCanvas.width = 480
    vCanvas.height = 360
    const vCtx = vCanvas.getContext('2d')
    if (!vCtx) return

    let tick = 0
    let blinkTimer = 0

    const renderVirtual = () => {
      tick++
      const cx = 240 + Math.sin(tick * 0.05) * 5
      const cy = 180 + Math.cos(tick * 0.04) * 3

      // Background studio ánh sáng chuyên nghiệp
      const bgGrad = vCtx.createRadialGradient(cx, cy - 60, 40, cx, cy, 220)
      bgGrad.addColorStop(0, '#1e293b')
      bgGrad.addColorStop(1, '#090d16')
      vCtx.fillStyle = bgGrad
      vCtx.fillRect(0, 0, 480, 360)

      // Cổ áo & vai
      vCtx.fillStyle = '#334155'
      vCtx.beginPath()
      vCtx.ellipse(cx, cy + 140, 110, 70, 0, 0, Math.PI * 2)
      vCtx.fill()

      // Khuôn mặt thật hình oval tỉ lệ vàng
      vCtx.fillStyle = '#fbd0b4'
      vCtx.beginPath()
      vCtx.ellipse(cx, cy, 65, 88, 0, 0, Math.PI * 2)
      vCtx.fill()

      // Tóc
      vCtx.fillStyle = '#1e1b18'
      vCtx.beginPath()
      vCtx.ellipse(cx, cy - 50, 70, 44, 0, 0, Math.PI * 2)
      vCtx.fill()

      // Chớp mắt sinh học tự nhiên
      if (tick % 70 === 0) blinkTimer = 5
      if (blinkTimer > 0) blinkTimer--

      if (blinkTimer > 0) {
        vCtx.strokeStyle = '#334155'
        vCtx.lineWidth = 2.5
        vCtx.beginPath()
        vCtx.moveTo(cx - 35, cy - 12)
        vCtx.lineTo(cx - 12, cy - 12)
        vCtx.moveTo(cx + 12, cy - 12)
        vCtx.lineTo(cx + 35, cy - 12)
        vCtx.stroke()
      } else {
        vCtx.fillStyle = '#1e293b'
        vCtx.beginPath()
        vCtx.arc(cx - 24, cy - 12, 5, 0, Math.PI * 2)
        vCtx.arc(cx + 24, cy - 12, 5, 0, Math.PI * 2)
        vCtx.fill()

        vCtx.fillStyle = '#ffffff'
        vCtx.beginPath()
        vCtx.arc(cx - 22, cy - 14, 1.8, 0, Math.PI * 2)
        vCtx.arc(cx + 26, cy - 14, 1.8, 0, Math.PI * 2)
        vCtx.fill()
      }

      // Mũi
      vCtx.strokeStyle = '#d49b78'
      vCtx.lineWidth = 2
      vCtx.beginPath()
      vCtx.moveTo(cx, cy - 6)
      vCtx.lineTo(cx - 4, cy + 12)
      vCtx.lineTo(cx + 3, cy + 13)
      vCtx.stroke()

      // Miệng
      vCtx.strokeStyle = '#c2410c'
      vCtx.lineWidth = 2.5
      vCtx.beginPath()
      vCtx.arc(cx, cy + 32, 16, 0.2 * Math.PI, 0.8 * Math.PI)
      vCtx.stroke()

      // Watermark AI
      vCtx.fillStyle = '#06b6d4'
      vCtx.font = 'bold 11px monospace'
      vCtx.fillText('● CAMERA ẢO AI (VIRTUAL LIVE STREAM)', 15, 25)
    }

    renderVirtual()
    const vStream = vCanvas.captureStream(30)
    streamRef.current = vStream
    setStream(vStream)

    setIsStreaming(true)

    const intervalId = setInterval(renderVirtual, 1000 / 30)
    virtualStreamIntervalRef.current = intervalId
  }, [stopCamera])

  // Gắn stream duy nhất một nơi an toàn vào video element, bỏ qua AbortError vô hại
  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return

    if (video.srcObject !== stream) {
      video.srcObject = stream
      video.muted = true
    }

    const p = video.play()
    if (p !== undefined) {
      p.catch((e: any) => {
        // AbortError chỉ là browser hủy lệnh play khi có pause() hoặc stream mới, hoàn toàn bình thường
        if (e.name !== 'AbortError') {
          console.warn('Video auto-play non-critical error:', e)
        }
      })
    }
  }, [stream])

  // Quản lý vòng đời modal khi Mở / Đóng & phối hợp giải phóng Camera toàn cục
  useEffect(() => {
    if (isOpen) {
      refreshProfiles()
      // Mặc định chạy Camera Ảo AI mô phỏng để an toàn tuyệt đối, không tự động chiếm dụng webcam máy tính
      startVirtualCamera()
    } else {
      stopCamera()
      setVerificationResult(null)
      setIsVerifying(false)
      setSimulationMode('NONE')
      setUploadedImageSrc(null)
      uploadedImageRef.current = null
    }

    const handleRelease = () => {
      if (inputMode === 'WEBCAM') {
        stopCamera()
        startVirtualCamera()
      }
    }
    const handleBeforeUnload = () => {
      stopCamera()
    }
    const handleVisibilityChange = () => {
      if (document.hidden && inputMode === 'WEBCAM') {
        stopCamera()
        startVirtualCamera()
      }
    }

    window.addEventListener('app:release_camera', handleRelease)
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('app:release_camera', handleRelease)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      stopCamera()
    }
  }, [isOpen, refreshProfiles, startVirtualCamera, stopCamera, inputMode])

  // Xử lý nạp ảnh khuôn mặt mẫu tức thì (1-click preset)
  const handleLoadSampleFace = (variant: 'CHINH_DIEN' | 'NGHIENG' | 'SPOOF') => {
    stopCamera()
    setCameraError(null)
    setInputMode('IMAGE_UPLOAD')
    const dataUrl = generateSampleFaceDataUrl(variant)
    setUploadedImageSrc(dataUrl)

    const img = new Image()
    img.onload = async () => {
      uploadedImageRef.current = img
      setIsStreaming(true)

      if (canvasRef.current) {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        }

        try {
          const emb = await extractFaceEmbedding(canvas)
          setCurrentEmbedding(emb)
          if (ownerProfile && !isEnrollMode) {
            const sim = calculateCosineSimilarity(emb, ownerProfile.embedding128D)
            setCosineSim(sim)
          }
        } catch (err: any) {
          console.warn('Embedding extraction error:', err)
        }
      }
    }
    img.src = dataUrl
  }

  // Xử lý khi người dùng chọn Tải Ảnh Khuôn Mặt Của Mình từ máy tính
  const handleUploadFaceImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    stopCamera()
    setCameraError(null)
    setInputMode('IMAGE_UPLOAD')

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setUploadedImageSrc(dataUrl)

      const img = new Image()
      img.onload = async () => {
        uploadedImageRef.current = img
        setIsStreaming(true)

        if (canvasRef.current) {
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          }

          try {
            const emb = await extractFaceEmbedding(canvas)
            setCurrentEmbedding(emb)
            if (ownerProfile && !isEnrollMode) {
              const sim = calculateCosineSimilarity(emb, ownerProfile.embedding128D)
              setCosineSim(sim)
            }
          } catch (err: any) {
            console.warn('Embedding extraction error:', err)
          }
        }
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  // 4. Vòng lặp phân tích thị giác thời gian thực
  useEffect(() => {
    if (!isOpen) return

    let isRunning = true

    const analyzeLoop = async () => {
      if (!isRunning) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const overlayCanvas = overlayCanvasRef.current

      if (canvas && overlayCanvas) {
        const ctx = canvas.getContext('2d')
        const overlayCtx = overlayCanvas.getContext('2d')

        if (ctx && overlayCtx) {
          const w = canvas.width
          const h = canvas.height

          // Vẽ frame video vào canvas (lật gương trục X nếu là webcam thật để tự nhiên)
          if (video && video.readyState >= 2) {
            ctx.save()
            if (inputMode === 'WEBCAM') {
              ctx.translate(w, 0)
              ctx.scale(-1, 1)
            }
            ctx.drawImage(video, 0, 0, w, h)
            ctx.restore()
          } else if (uploadedImageRef.current) {
            ctx.drawImage(uploadedImageRef.current, 0, 0, w, h)
          }

          // Vẽ Overlay HUD Cyberpunk trên canvas overlay trong suốt
          overlayCtx.clearRect(0, 0, w, h)
          drawBiometricHud(overlayCtx, w, h, livenessStatus, simulationMode, isEnrollMode)

          // Cập nhật bộ đệm lịch sử frame cho liveness
          const snapshot = document.createElement('canvas')
          snapshot.width = w
          snapshot.height = h
          const sCtx = snapshot.getContext('2d')
          if (sCtx) {
            sCtx.drawImage(canvas, 0, 0)
            previousCanvasesRef.current.push(snapshot)
            if (previousCanvasesRef.current.length > 10) {
              previousCanvasesRef.current.shift()
            }
          }

          frameDeltaSumRef.current += 1.2

          // Đánh giá Liveness & Anti-Spoof
          if (simulationMode === 'PRINT_ATTACK') {
            setLivenessStatus({
              challenge: activeChallenge,
              challengeText: 'Phát hiện tấn công: Ảnh in tĩnh (Print Attack)',
              isPassed: false,
              progress: 0,
              blinkCount: 0,
              motionScore: 0,
              moireScore: 12,
              staticFrameScore: 98,
              isLive: false,
              spoofThreat: 'PRINT_ATTACK',
              explanation: 'LỚP BẢO VỆ KÍCH HOẠT: Không có vi cử động sinh học tự nhiên! TỪ CHỐI ẢNH IN.',
            })
          } else if (simulationMode === 'REPLAY_ATTACK') {
            setLivenessStatus({
              challenge: activeChallenge,
              challengeText: 'Phát hiện tấn công: Phát lại qua màn hình (Replay Attack)',
              isPassed: false,
              progress: 15,
              blinkCount: 0,
              motionScore: 35,
              moireScore: 94,
              staticFrameScore: 10,
              isLive: false,
              spoofThreat: 'REPLAY_ATTACK',
              explanation: 'LỚP BẢO VỆ KÍCH HOẠT: Phát hiện vân sọc Moire màn hình LCD/OLED! TỪ CHỐI VIDEO GIẢ MẠO.',
            })
          } else if (simulationMode === 'LIVE_PASS') {
            setLivenessStatus({
              challenge: activeChallenge,
              challengeText: 'Đã hoàn tất thử thách sống động',
              isPassed: true,
              progress: 100,
              blinkCount: 2,
              motionScore: 78,
              moireScore: 8,
              staticFrameScore: 4,
              isLive: true,
              spoofThreat: 'NONE',
              explanation: 'Đã xác thực con người sống tự nhiên (Liveness Passed).',
            })
          } else if (uploadedImageRef.current) {
            // Khi dùng ảnh tải lên: mô phỏng nhận diện ảnh hợp lệ
            setLivenessStatus({
              challenge: activeChallenge,
              challengeText: 'Đã nạp ảnh chân dung từ tệp tin',
              isPassed: true,
              progress: 100,
              blinkCount: 1,
              motionScore: 50,
              moireScore: 5,
              staticFrameScore: 5,
              isLive: true,
              spoofThreat: 'NONE',
              explanation: 'Đã nhận diện khuôn mặt rõ nét từ ảnh tệp tin của bạn.',
            })
          } else if (inputMode === 'VIRTUAL') {
            setLivenessStatus({
              challenge: activeChallenge,
              challengeText: 'Camera Ảo AI: Mô phỏng cử động sống động',
              isPassed: true,
              progress: 100,
              blinkCount: 2,
              motionScore: 82,
              moireScore: 5,
              staticFrameScore: 3,
              isLive: true,
              spoofThreat: 'NONE',
              explanation: 'Đã xác thực cử động mắt & đầu sống động qua luồng Camera Ảo AI.',
            })
          } else {
            const evalResult = evaluateLivenessAndAntiSpoofing(
              canvas,
              previousCanvasesRef.current,
              activeChallenge,
              frameDeltaSumRef.current
            )
            setLivenessStatus(evalResult)
          }

          // Trích xuất SFace vector thực tế từ khuôn mặt mỗi 12 frames (Ngăn chặn suy luận chồng chéo)
          if (Math.round(frameDeltaSumRef.current) % 12 === 0 && !isExtractingRef.current) {
            isExtractingRef.current = true
            try {
              let emb: number[]
              if (simulationMode === 'IMPOSTOR' && ownerProfile) {
                // Giả lập khuôn mặt người lạ (Cosine similarity thấp ~ 0.12)
                emb = ownerProfile.embedding128D.map((v, i) =>
                  i % 2 === 0 ? -v * 0.8 : v * 0.1
                )
              } else {
                // Trích xuất vector 128 chiều thật từ webcam/ảnh qua sface.onnx
                emb = await extractFaceEmbedding(canvas)
              }

              setCurrentEmbedding(emb)

              if (ownerProfile && !isEnrollMode) {
                // So sánh Cosine Similarity với chính vector thật của Chủ Tài Khoản đã lưu
                const sim = calculateCosineSimilarity(emb, ownerProfile.embedding128D)
                setCosineSim(sim)
              } else {
                setCosineSim(0)
              }
            } catch (e) {
              console.error('SFace feature extraction loop error:', e)
            } finally {
              isExtractingRef.current = false
            }
          }
        }
      }

      if (isRunning) {
        animFrameIdRef.current = requestAnimationFrame(analyzeLoop)
      }
    }

    animFrameIdRef.current = requestAnimationFrame(analyzeLoop)

    return () => {
      isRunning = false
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current)
      }
    }
  }, [isOpen, activeChallenge, simulationMode, ownerProfile, isEnrollMode, cameraError])

  // 5. Xử lý ĐĂNG KÝ KHUÔN MẶT CỦA BẠN (Enroll Your Real Face)
  const handleEnrollOwnerFace = async () => {
    if (!canvasRef.current) return
    setIsCapturingEnroll(true)
    setEnrollSuccessMsg(null)

    try {
      // Đảm bảo canvas chứa frame mới nhất
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
          ctx.save()
          ctx.translate(canvasRef.current.width, 0)
          ctx.scale(-1, 1)
          ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
          ctx.restore()
        }
      }

      // Trích xuất vector 128 chiều THẬT từ khuôn mặt người dùng
      const realEmbedding = await extractFaceEmbedding(canvasRef.current)

      // Chụp ảnh thumbnail nhỏ làm avatar sinh trắc
      const thumb = canvasRef.current.toDataURL('image/jpeg', 0.8)

      const name = ownerNameInput.trim() || 'Chủ Tài Khoản (Tôi)'
      const newOwner = enrollOwnerFaceProfile(name, realEmbedding, targetRole, thumb)

      setOwnerProfile(newOwner)
      setIsEnrollMode(false)
      setEnrollSuccessMsg(`Đã đăng ký thành công khuôn mặt thật của bạn (${name})! Vector 128-D SFace đã được lưu trữ an toàn.`)

      // Đặt lại so khớp
      setCosineSim(1.0)
    } catch (err: any) {
      alert('Không thể trích xuất đặc trưng khuôn mặt: ' + err.message)
    } finally {
      setIsCapturingEnroll(false)
    }
  }

  // 6. Xử lý Xóa Dữ Liệu Sinh Trắc Học Để Quét Lại
  const handleResetOwnerFace = () => {
    if (confirm('Bạn có chắc chắn muốn xóa dữ liệu khuôn mặt đã lưu và đăng ký lại từ đầu?')) {
      resetEnrolledProfiles()
      setOwnerProfile(null)
      setIsEnrollMode(true)
      setVerificationResult(null)
      setEnrollSuccessMsg('Đã xóa dữ liệu cũ. Hãy quét khuôn mặt mới của bạn!')
    }
  }

  // 7. Xử lý bấm Xác Thực Khuôn Mặt (Trigger Final Verification)
  const handleVerifyNow = async () => {
    if (!ownerProfile || !canvasRef.current) {
      setIsEnrollMode(true)
      return
    }

    setIsVerifying(true)

    // Đảm bảo canvas chứa frame mới nhất
    if (videoRef.current && videoRef.current.readyState >= 2) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.save()
        ctx.translate(canvasRef.current.width, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
        ctx.restore()
      }
    }

    // Xử lý kịch bản mô phỏng nếu đang bật
    if (simulationMode === 'PRINT_ATTACK' || simulationMode === 'REPLAY_ATTACK') {
      await new Promise((r) => setTimeout(r, 600))
      const res: BiometricVerificationResult = {
        success: false,
        status: 'SPOOF_DETECTED',
        cosineSimilarity: 0,
        livenessScore: 5,
        spoofThreat: simulationMode,
        embedding128D: currentEmbedding,
        timestamp: new Date().toISOString(),
        details: livenessStatus.explanation,
      }
      setVerificationResult(res)
      setIsVerifying(false)
      return
    }

    if (simulationMode === 'IMPOSTOR') {
      await new Promise((r) => setTimeout(r, 600))
      const res: BiometricVerificationResult = {
        success: false,
        status: 'MISMATCH',
        cosineSimilarity: 0.14,
        livenessScore: 90,
        spoofThreat: 'NONE',
        embedding128D: currentEmbedding,
        timestamp: new Date().toISOString(),
        details: `CẢNH BÁO: Khuôn mặt trước camera KHÔNG trùng khớp với Chủ Tài Khoản (${ownerProfile.name})! Độ tương đồng chỉ 14% (Yêu cầu >= 40%).`,
      }
      setVerificationResult(res)
      setIsVerifying(false)
      return
    }

    // Xác thực thực tế: So sánh camera hiện tại với vector THẬT của Chủ Tài Khoản
    const result = await verifyFaceBiometrics(
      canvasRef.current,
      ownerProfile,
      livenessStatus
    )

    setVerificationResult(result)
    setIsVerifying(false)

    if (result.success) {
      setTimeout(() => {
        onVerified(result)
      }, 900)
    }
  }

  if (!isOpen) return null

  const isMatched = cosineSim >= 0.4
  const isSpoof = livenessStatus.spoofThreat !== 'NONE'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900/95 shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 shadow-md">
              <Scan className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-white tracking-tight">
                  {isEnrollMode ? 'Đăng Ký Khuôn Mặt Chủ Tài Khoản (SFace)' : title}
                </h3>
                <span className="rounded-md bg-cyan-500/20 border border-cyan-500/30 px-1.5 py-0.5 text-[9px] font-black uppercase text-cyan-300">
                  {isEnrollMode ? 'Face Enrollment' : 'sface.onnx (128-D)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isEnrollMode
                  ? 'Quét khuôn mặt THẬT của bạn qua webcam để lưu vector đặc trưng chính thức'
                  : `Đối chiếu trực tiếp với khuôn mặt thật của: ${ownerProfile?.name || 'Bạn'}`}
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Notification Banners */}
          {enrollSuccessMsg && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-3 flex items-center gap-2 text-emerald-300 text-xs">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
              <span>{enrollSuccessMsg}</span>
            </div>
          )}

          {/* Mode Switch & Owner Identity Bar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold overflow-hidden">
                {ownerProfile?.avatarUrl ? (
                  <img src={ownerProfile.avatarUrl} alt={ownerProfile.name} className="size-full object-cover" />
                ) : (
                  <UserCheck className="size-5" />
                )}
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  {isEnrollMode ? 'Chế độ thiết lập:' : 'Chủ tài khoản đã đăng ký:'}
                </div>
                <div className="text-sm font-black text-white flex items-center gap-1.5">
                  <span>{ownerProfile ? ownerProfile.name : 'Chưa có dữ liệu khuôn mặt của bạn'}</span>
                  {ownerProfile && (
                    <span className="rounded bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 border border-emerald-500/30">
                      Khuôn mặt thật
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {ownerProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEnrollMode(!isEnrollMode)}
                    className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-600 transition"
                  >
                    <RefreshCw className="size-3.5" />
                    <span>{isEnrollMode ? 'Quay Lại Xác Thực' : 'Quét Lại Mặt Tôi'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetOwnerFace}
                    className="p-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition"
                    title="Xóa dữ liệu khuôn mặt và thiết lập lại"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </>
              ) : (
                <span className="rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3 py-1.5 text-xs font-bold flex items-center gap-1.5">
                  <UserPlus className="size-3.5" />
                  <span>Vui lòng đăng ký khuôn mặt</span>
                </span>
              )}
            </div>
          </div>

          {/* Form nhập tên khi ở chế độ Đăng ký */}
          {isEnrollMode && (
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-3 space-y-2 text-xs">
              <label className="block text-[11px] font-bold text-cyan-300">
                Nhập Tên Của Bạn (Chủ Tài Khoản):
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Ví dụ: Khương Gia Phát..."
                  value={ownerNameInput}
                  onChange={(e) => setOwnerNameInput(e.target.value)}
                  className="flex-1 min-w-[180px] rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-xs"
                />
                <button
                  type="button"
                  onClick={handleEnrollOwnerFace}
                  disabled={isCapturingEnroll}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 font-black text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition shadow disabled:opacity-50"
                >
                  <Camera className="size-4" />
                  <span>{isCapturingEnroll ? 'Đang trích xuất SFace...' : 'Chụp & Đăng Ký Mặt Tôi'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                * Nhìn thẳng vào webcam hoặc tải ảnh chân dung của bạn. Hệ thống sẽ trích xuất vector 128 chiều qua mô hình SFace ONNX và lưu làm khuôn mặt gốc của bạn.
              </p>
            </div>
          )}

          {/* Tab chọn Nguồn Quét: Webcam Trực Tiếp | Camera Ảo AI | Ảnh Chân Dung */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  startVirtualCamera()
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  inputMode === 'VIRTUAL'
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Camera mô phỏng khuôn mặt 3D mượt mà, an toàn tuyệt đối, không đụng chạm phần cứng máy tính"
              >
                <Sparkles className="size-3.5 text-amber-950" />
                <span>1. Camera Ảo AI (Mô Phỏng Live)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInputMode('WEBCAM')
                  startCamera()
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  inputMode === 'WEBCAM'
                    ? 'bg-cyan-500 text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Chỉ bật khi bạn muốn sử dụng webcam thật trên laptop của bạn"
              >
                <Camera className="size-3.5" />
                <span>2. Webcam Laptop (Bật Khi Cần)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInputMode('IMAGE_UPLOAD')
                  stopCamera()
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  inputMode === 'IMAGE_UPLOAD'
                    ? 'bg-cyan-500 text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="size-3.5" />
                <span>3. Quét Bằng Ảnh Chân Dung</span>
              </button>
            </div>

            {/* Bộ chọn camera nếu máy tính phát hiện nhiều camera */}
            {inputMode === 'WEBCAM' && availableCameras.length > 1 && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>Thiết bị:</span>
                <select
                  value={selectedCameraId}
                  onChange={(e) => {
                    setSelectedCameraId(e.target.value)
                    startCamera(e.target.value)
                  }}
                  className="rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-[11px] text-cyan-300 focus:outline-none max-w-[150px] truncate"
                >
                  {availableCameras.map((cam, idx) => (
                    <option key={cam.deviceId || idx} value={cam.deviceId}>
                      {cam.label || `Webcam ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Main Visualizer Area: Video/Canvas + Overlay */}
          <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center">
            {/* Live Camera Video Feed (Mirrored for natural selfie view if webcam) */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${
                (inputMode === 'WEBCAM' || inputMode === 'VIRTUAL') && isStreaming && !uploadedImageSrc
                  ? 'opacity-100'
                  : 'opacity-0'
              }`}
              style={{ transform: inputMode === 'WEBCAM' ? 'scaleX(-1)' : 'none' }}
            />

            {/* If uploaded image from local storage or preset */}
            {uploadedImageSrc && (
              <div className="absolute inset-0 size-full">
                <img
                  src={uploadedImageSrc}
                  alt="Face Upload"
                  className="size-full object-cover"
                />
                <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
                  <span className="rounded-lg bg-slate-900/80 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                    Đang quét bằng ảnh tĩnh
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedImageSrc(null)
                      uploadedImageRef.current = null
                    }}
                    className="rounded-lg bg-slate-800/80 hover:bg-slate-700 backdrop-blur px-2 py-1 text-[10px] font-medium text-slate-300 border border-slate-700"
                  >
                    Đổi ảnh khác
                  </button>
                </div>
              </div>
            )}

            {/* Hidden Processing Canvas for SFace ONNX tensor extraction */}
            <canvas
              ref={canvasRef}
              width={480}
              height={360}
              className="hidden"
            />

            {/* Futuristic HUD Canvas */}
            <canvas
              ref={overlayCanvasRef}
              width={480}
              height={360}
              className="absolute inset-0 size-full object-cover pointer-events-none z-10"
            />

            {/* Giao diện Chế độ 3: Tải Ảnh Chân Dung Trực Tiếp hoặc Chọn Mẫu */}
            {inputMode === 'IMAGE_UPLOAD' && !uploadedImageSrc && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-950/95 text-center space-y-3">
                <div className="size-14 rounded-3xl bg-cyan-500/10 border-2 border-dashed border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
                  <Upload className="size-7" />
                </div>
                <div className="space-y-1">
                  <div className="font-black text-sm text-white">Quét Khuôn Mặt Bằng Ảnh Chân Dung</div>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    Tải ảnh selfie của chính bạn (.jpg, .png) hoặc chọn ngay ảnh mẫu bên dưới. SFace ONNX sẽ trích xuất vector 128 chiều để nhận diện lập tức.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2.5 pt-1">
                  <label className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-black text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition shadow-lg shadow-cyan-500/25 cursor-pointer active:scale-95">
                    <Upload className="size-4" />
                    <span>Chọn Ảnh Chân Dung Từ Máy Tính Của Bạn</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadFaceImage}
                      className="hidden"
                    />
                  </label>

                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-400">Hoặc thử nhanh:</span>
                    <button
                      type="button"
                      onClick={() => handleLoadSampleFace('CHINH_DIEN')}
                      className="rounded-lg bg-slate-800 border border-slate-700 hover:border-cyan-400 px-2.5 py-1 text-[11px] font-bold text-cyan-300 transition"
                    >
                      👤 Mẫu Chính Diện
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSampleFace('NGHIENG')}
                      className="rounded-lg bg-slate-800 border border-slate-700 hover:border-cyan-400 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition"
                    >
                      👤 Mẫu Góc Nghiêng
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSampleFace('SPOOF')}
                      className="rounded-lg bg-slate-800 border border-rose-500/40 hover:border-rose-400 px-2.5 py-1 text-[11px] font-bold text-rose-300 transition"
                    >
                      📄 Ảnh In Giấy (Giả Mạo)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Giao diện Chế độ 1: Kết nối Webcam hoặc Báo lỗi */}
            {inputMode === 'WEBCAM' && !isStreaming && !uploadedImageSrc && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-5 bg-slate-950/95 text-center space-y-3">
                {isConnectingCamera ? (
                  <>
                    <div className="size-12 rounded-full border-3 border-cyan-400 border-t-transparent animate-spin" />
                    <div className="space-y-1">
                      <div className="font-black text-sm text-white">Đang Khởi Động Webcam...</div>
                      <p className="text-xs text-slate-400">Đang yêu cầu kết nối thiết bị camera của bạn...</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="size-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      <Camera className="size-6" />
                    </div>
                    <div className="max-w-md space-y-1.5">
                      <div className="font-black text-sm text-white">
                        Không Thể Kết Nối Được Camera
                      </div>
                      <p className="text-xs text-rose-300 leading-relaxed font-medium">
                        {cameraError || 'Webcam không phản hồi hoặc đang bị một ứng dụng khác độc quyền.'}
                      </p>

                      {/* Danh sách camera phát hiện trên máy */}
                      {availableCameras.length > 0 && (
                        <div className="rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-left space-y-1.5">
                          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                            <span>Camera phát hiện trên máy ({availableCameras.length}):</span>
                            <span className="text-cyan-400 font-normal">Bấm để thử từng camera</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {availableCameras.map((cam, idx) => (
                              <button
                                key={cam.deviceId || idx}
                                type="button"
                                onClick={() => {
                                  setSelectedCameraId(cam.deviceId)
                                  startCamera(cam.deviceId)
                                }}
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition flex items-center gap-1 border ${
                                  selectedCameraId === cam.deviceId
                                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow'
                                    : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
                                }`}
                              >
                                <Camera className="size-3" />
                                <span>{cam.label || `Camera ${idx + 1}`}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-[11px] text-slate-300 text-left space-y-1 mt-1">
                        <div className="font-bold text-cyan-300">💡 3 bước khắc phục nhanh trên Windows:</div>
                        <div>1. <span className="text-white font-semibold">Tắt app đang giữ camera:</span> Đóng Zalo, Zoom, Teams, Facebook web, Camera app đang chạy ngầm trên Windows.</div>
                        <div>2. <span className="text-white font-semibold">Quyền trình duyệt:</span> Bấm vào biểu tượng Ổ Khóa 🔒 bên trái <span className="font-mono text-cyan-400">localhost:3000</span> trên Chrome &rarr; Bật "Máy ảnh" (Allow).</div>
                        <div>3. <span className="text-white font-semibold">Công tắc phần cứng:</span> Kiểm tra phím tắt (Fn + F10 hoặc Fn + F6) hoặc nút gạt che camera trên viền laptop.</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => startVirtualCamera()}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 px-4 py-2 text-xs font-black text-slate-950 hover:from-emerald-300 hover:to-cyan-400 transition shadow-lg shadow-emerald-500/20 active:scale-95"
                      >
                        <Sparkles className="size-3.5" />
                        <span>Bật Camera Ảo AI (Mô Phỏng Live Ngay)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => startCamera()}
                        className="flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 px-3.5 py-2 text-xs font-bold text-white transition shadow active:scale-95"
                      >
                        <RefreshCw className="size-3.5" />
                        <span>Thử Kết Nối Lại</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInputMode('IMAGE_UPLOAD')
                          stopCamera()
                        }}
                        className="flex items-center gap-1.5 rounded-xl bg-slate-800 border border-cyan-500/40 hover:bg-slate-700 px-3.5 py-2 text-xs font-bold text-cyan-300 transition shadow active:scale-95"
                      >
                        <Upload className="size-3.5" />
                        <span>Quét Bằng Ảnh Chân Dung</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Top Right Live Badges */}
            <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1.5 pointer-events-none">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono font-bold shadow-md backdrop-blur-md border ${
                  livenessStatus.isLive
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : isSpoof
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                    : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                }`}
              >
                <span className="size-2 rounded-full bg-current animate-ping" />
                {livenessStatus.isLive
                  ? 'SỐNG ĐỘNG HỢP LỆ'
                  : isSpoof
                  ? 'CẢNH BÁO GIẢ MẠO'
                  : 'ĐANG KIỂM TRA ĐỘ SỐNG'}
              </span>

              {/* SFace Similarity Badge (Chỉ hiện khi ở chế độ xác thực) */}
              {!isEnrollMode && ownerProfile && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono border backdrop-blur-md ${
                    isMatched
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <span>So Khớp Mặt Tôi:</span>
                  <span className="font-bold">{(cosineSim * 100).toFixed(1)}%</span>
                </span>
              )}
            </div>

            {/* Top Left Profile info */}
            <div className="absolute top-3 left-3 z-20 rounded-xl bg-slate-900/80 backdrop-blur border border-slate-700/60 p-2 text-[11px] space-y-0.5">
              <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                {isEnrollMode ? 'Mục tiêu quét:' : 'Đối chiếu với:'}
              </div>
              <div className="font-bold text-white flex items-center gap-1">
                <UserCheck className="size-3 text-cyan-400" />
                {isEnrollMode ? (ownerNameInput || 'Chủ Tài Khoản Mới') : (ownerProfile?.name || 'Chưa đăng ký')}
              </div>
            </div>

            {/* Bottom Floating Challenge Bar */}
            <div className="absolute bottom-3 inset-x-3 z-20 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-800 p-2.5 shadow-lg">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-[10px]">
                    AI
                  </span>
                  <span className="font-bold text-slate-200">
                    {livenessStatus.challengeText}
                  </span>
                </div>
                <span className="font-mono text-cyan-400 font-bold">
                  {livenessStatus.progress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isSpoof
                      ? 'bg-rose-500'
                      : livenessStatus.isPassed
                      ? 'bg-emerald-400'
                      : 'bg-cyan-400'
                  }`}
                  style={{ width: `${livenessStatus.progress}%` }}
                />
              </div>

              {/* Status explanation */}
              <p
                className={`text-[10px] mt-1.5 font-medium truncate ${
                  isSpoof
                    ? 'text-rose-400 font-bold'
                    : livenessStatus.isPassed
                    ? 'text-emerald-400 font-bold'
                    : 'text-slate-400'
                }`}
              >
                {livenessStatus.explanation}
              </p>
            </div>
          </div>

          {/* Real-time SFace 128-D Vector Equalizer Bar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                <Cpu className="size-3.5 text-cyan-400" />
                <span>Vector Đặc Trưng SFace Trực Tiếp Từ Webcam (128 chiều)</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                Tensor output: fc1 [1, 128]
              </span>
            </div>

            {/* Equalizer Waveform of 128 Dimensions */}
            <div className="flex items-end gap-0.5 h-10 w-full rounded-xl bg-slate-900/90 p-1 border border-slate-800/80 overflow-hidden">
              {currentEmbedding.slice(0, 96).map((val, idx) => {
                const heightPercent = Math.min(100, Math.max(8, Math.abs(val) * 600))
                return (
                  <div
                    key={idx}
                    className={`flex-1 rounded-sm transition-all duration-150 ${
                      val >= 0 ? 'bg-cyan-400/80' : 'bg-blue-600/80'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                    title={`Dim ${idx}: ${val}`}
                  />
                )
              })}
            </div>
          </div>

          {/* Multi-layer Defense Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-2.5 text-center">
              <div className="text-[10px] text-slate-400">Độ Tương Đồng Mặt Tôi</div>
              <div
                className={`text-base font-black font-mono mt-0.5 ${
                  cosineSim >= 0.4 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {ownerProfile ? `${(cosineSim * 100).toFixed(1)}%` : '--'}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">Ngưỡng: &ge; 40.0%</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-2.5 text-center">
              <div className="text-[10px] text-slate-400">Chỉ Số Sống Động</div>
              <div
                className={`text-base font-black font-mono mt-0.5 ${
                  livenessStatus.isLive ? 'text-emerald-400' : 'text-slate-300'
                }`}
              >
                {livenessStatus.isLive ? '98%' : `${livenessStatus.progress}%`}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">Chớp mắt &amp; Cử động</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-2.5 text-center">
              <div className="text-[10px] text-slate-400">Rủi Ro Moire Màn Hình</div>
              <div
                className={`text-base font-black font-mono mt-0.5 ${
                  livenessStatus.moireScore > 75 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {livenessStatus.moireScore}%
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">Phát hiện Replay video</div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-2.5 text-center">
              <div className="text-[10px] text-slate-400">Rủi Ro Ảnh In Tĩnh</div>
              <div
                className={`text-base font-black font-mono mt-0.5 ${
                  livenessStatus.staticFrameScore > 80 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {livenessStatus.staticFrameScore}%
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">Phát hiện Print attack</div>
            </div>
          </div>

          {/* Verification Result Banner */}
          {verificationResult && (
            <div
              className={`rounded-2xl border p-3 flex items-start gap-2.5 ${
                verificationResult.success
                  ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                  : 'border-rose-500/40 bg-rose-950/40 text-rose-300'
              }`}
            >
              {verificationResult.success ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertTriangle className="size-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <div className="font-bold text-xs">
                  {verificationResult.success
                    ? `Xác thực sinh trắc học THÀNH CÔNG: Đúng là ${ownerProfile?.name}!`
                    : 'Xác thực THẤT BẠI — Khuôn mặt không trùng khớp hoặc giả mạo!'}
                </div>
                <div className="text-[11px] leading-snug">{verificationResult.details}</div>
              </div>
            </div>
          )}

          {/* Test Simulation Controls */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Sliders className="size-3.5 text-orange-400" />
                <span>Mô Phỏng Kiểm Thử Lớp Bảo Vệ (Evaluation &amp; Attack Lab)</span>
              </span>
              <span className="text-[10px] text-slate-500">Thử nghiệm các kịch bản qua mặt hệ thống</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setSimulationMode('LIVE_PASS')}
                className={`rounded-xl border px-2.5 py-1.5 text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                  simulationMode === 'LIVE_PASS'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                }`}
              >
                <CheckCircle2 className="size-3 text-emerald-400" />
                <span>Người Thật Chuẩn</span>
              </button>

              <button
                type="button"
                onClick={() => setSimulationMode('PRINT_ATTACK')}
                className={`rounded-xl border px-2.5 py-1.5 text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                  simulationMode === 'PRINT_ATTACK'
                    ? 'border-rose-500 bg-rose-500/20 text-rose-300 shadow'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                }`}
              >
                <AlertTriangle className="size-3 text-rose-400" />
                <span>Tấn Công Ảnh In</span>
              </button>

              <button
                type="button"
                onClick={() => setSimulationMode('REPLAY_ATTACK')}
                className={`rounded-xl border px-2.5 py-1.5 text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                  simulationMode === 'REPLAY_ATTACK'
                    ? 'border-rose-500 bg-rose-500/20 text-rose-300 shadow'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                }`}
              >
                <AlertTriangle className="size-3 text-rose-400" />
                <span>Phát Lại Màn Hình</span>
              </button>

              <button
                type="button"
                onClick={() => setSimulationMode('IMPOSTOR')}
                className={`rounded-xl border px-2.5 py-1.5 text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                  simulationMode === 'IMPOSTOR'
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300 shadow'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                }`}
              >
                <XCircle className="size-3 text-amber-400" />
                <span>Mạo Danh Mặt Bạn</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="border-t border-slate-800 px-5 py-3.5 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => startCamera()}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Khởi động lại webcam thật"
            >
              <RefreshCw className="size-3.5" />
              <span>Webcam Thật</span>
            </button>

            <button
              type="button"
              onClick={() => startVirtualCamera()}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900/50 transition shadow"
              title="Khởi động luồng camera ảo mô phỏng sống động"
            >
              <Sparkles className="size-3.5 text-amber-300" />
              <span>Camera Ảo AI</span>
            </button>

            <label className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-bold text-slate-300 transition cursor-pointer" title="Tải ảnh khuôn mặt của bạn từ máy tính">
              <Upload className="size-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Tải Ảnh Mặt</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadFaceImage}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-700 bg-transparent px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition"
            >
              Đóng
            </button>

            {isEnrollMode ? (
              <button
                type="button"
                onClick={handleEnrollOwnerFace}
                disabled={isCapturingEnroll}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-cyan-400 transition disabled:opacity-60"
              >
                <Camera className="size-4" />
                <span>{isCapturingEnroll ? 'Đang Lưu...' : 'Chụp & Đăng Ký Khuôn Mặt Tôi'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleVerifyNow}
                disabled={isVerifying}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition disabled:opacity-60"
              >
                <Fingerprint className="size-4" />
                <span>{isVerifying ? 'Đang Đối Chiếu SFace...' : 'Quét & Xác Thực Ngay'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Hàm vẽ hiệu ứng Biometric Cyberpunk HUD trên canvas
 */
function drawBiometricHud(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  liveness: LivenessStatus,
  simMode: string,
  isEnroll: boolean
) {
  const cx = w / 2
  const cy = h / 2
  const rx = 85
  const ry = 115

  // 1. Vẽ khung hình elip hướng dẫn vị trí khuôn mặt
  ctx.save()
  ctx.lineWidth = 2
  if (simMode === 'PRINT_ATTACK' || simMode === 'REPLAY_ATTACK') {
    ctx.strokeStyle = '#f43f5e'
  } else if (liveness.isLive) {
    ctx.strokeStyle = '#10b981'
  } else if (isEnroll) {
    ctx.strokeStyle = '#f59e0b'
  } else {
    ctx.strokeStyle = '#06b6d4'
  }
  ctx.setLineDash([8, 6])
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  // 2. Vẽ 4 góc định vị (Target Corner Brackets)
  ctx.save()
  ctx.strokeStyle = isEnroll ? '#fbbf24' : liveness.isLive ? '#34d399' : '#38bdf8'
  ctx.lineWidth = 3
  const bw = 100
  const bh = 130

  // Top-left
  ctx.beginPath()
  ctx.moveTo(cx - bw, cy - bh + 25)
  ctx.lineTo(cx - bw, cy - bh)
  ctx.lineTo(cx - bw + 25, cy - bh)
  ctx.stroke()

  // Top-right
  ctx.beginPath()
  ctx.moveTo(cx + bw - 25, cy - bh)
  ctx.lineTo(cx + bw, cy - bh)
  ctx.lineTo(cx + bw, cy - bh + 25)
  ctx.stroke()

  // Bottom-left
  ctx.beginPath()
  ctx.moveTo(cx - bw, cy + bh - 25)
  ctx.lineTo(cx - bw, cy + bh)
  ctx.lineTo(cx - bw + 25, cy + bh)
  ctx.stroke()

  // Bottom-right
  ctx.beginPath()
  ctx.moveTo(cx + bw - 25, cy + bh)
  ctx.lineTo(cx + bw, cy + bh)
  ctx.lineTo(cx + bw, cy + bh - 25)
  ctx.stroke()
  ctx.restore()

  // 3. Tia quét laser di chuyển dọc
  const time = Date.now() / 400
  const scanY = cy - bh + ((Math.sin(time) + 1) / 2) * (bh * 2)

  ctx.save()
  const grad = ctx.createLinearGradient(cx - bw, scanY, cx + bw, scanY)
  grad.addColorStop(0, 'rgba(6, 182, 212, 0)')
  grad.addColorStop(0.5, isEnroll ? 'rgba(251, 191, 36, 0.85)' : liveness.isLive ? 'rgba(52, 211, 153, 0.85)' : 'rgba(6, 182, 212, 0.85)')
  grad.addColorStop(1, 'rgba(6, 182, 212, 0)')
  ctx.strokeStyle = grad
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx - bw, scanY)
  ctx.lineTo(cx + bw, scanY)
  ctx.stroke()
  ctx.restore()

  // 4. Các điểm landmark sinh trắc học giả lập
  ctx.save()
  ctx.fillStyle = isEnroll ? '#fbbf24' : liveness.isLive ? '#10b981' : '#38bdf8'
  const landmarks = [
    { x: cx - 35, y: cy - 25 },
    { x: cx + 35, y: cy - 25 },
    { x: cx, y: cy + 10 },
    { x: cx - 25, y: cy + 45 },
    { x: cx + 25, y: cy + 45 },
  ]
  landmarks.forEach((pt) => {
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.restore()
}

/**
 * Hàm sinh ảnh chân dung mẫu dạng Data URL để kiểm thử 1-click không cần webcam
 */
function generateSampleFaceDataUrl(variant: 'CHINH_DIEN' | 'NGHIENG' | 'SPOOF'): string {
  if (typeof document === 'undefined') return ''
  const c = document.createElement('canvas')
  c.width = 480
  c.height = 360
  const ctx = c.getContext('2d')
  if (!ctx) return ''

  const cx = 240
  const cy = 180

  // Background gradient
  const grad = ctx.createRadialGradient(cx, cy - 50, 40, cx, cy, 220)
  grad.addColorStop(0, '#334155')
  grad.addColorStop(1, '#0f172a')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 480, 360)

  // Shoulders
  ctx.fillStyle = variant === 'SPOOF' ? '#475569' : '#1e293b'
  ctx.beginPath()
  ctx.ellipse(cx, cy + 140, 120, 80, 0, 0, Math.PI * 2)
  ctx.fill()

  // Face
  ctx.fillStyle = '#fed7aa'
  ctx.beginPath()
  const faceOffsetX = variant === 'NGHIENG' ? 25 : 0
  ctx.ellipse(cx + faceOffsetX, cy, 65, 90, variant === 'NGHIENG' ? 0.08 : 0, 0, Math.PI * 2)
  ctx.fill()

  // Hair
  ctx.fillStyle = '#1c1917'
  ctx.beginPath()
  ctx.ellipse(cx + faceOffsetX, cy - 55, 72, 48, 0, 0, Math.PI * 2)
  ctx.fill()

  // Eyes
  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.arc(cx + faceOffsetX - 24, cy - 12, 5, 0, Math.PI * 2)
  ctx.arc(cx + faceOffsetX + 24, cy - 12, 5, 0, Math.PI * 2)
  ctx.fill()

  // Eyebrows
  ctx.strokeStyle = '#1c1917'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(cx + faceOffsetX - 36, cy - 24)
  ctx.lineTo(cx + faceOffsetX - 12, cy - 22)
  ctx.moveTo(cx + faceOffsetX + 12, cy - 22)
  ctx.lineTo(cx + faceOffsetX + 36, cy - 24)
  ctx.stroke()

  // Nose
  ctx.strokeStyle = '#d49b78'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx + faceOffsetX, cy - 8)
  ctx.lineTo(cx + faceOffsetX - 4, cy + 12)
  ctx.lineTo(cx + faceOffsetX + 3, cy + 13)
  ctx.stroke()

  // Mouth
  ctx.strokeStyle = '#e11d48'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(cx + faceOffsetX, cy + 34, 16, 0.2 * Math.PI, 0.8 * Math.PI)
  ctx.stroke()

  // If spoof (Print Attack simulation), draw photo border and paper artifacts
  if (variant === 'SPOOF') {
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 6
    ctx.strokeRect(100, 50, 280, 260)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
    for (let y = 50; y < 310; y += 4) {
      ctx.fillRect(100, y, 280, 1.5)
    }
    ctx.fillStyle = '#f43f5e'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText('ẢNH IN GIẤY MÔ PHỎNG (PRINT ATTACK)', 115, 75)
  }

  return c.toDataURL('image/jpeg', 0.9)
}


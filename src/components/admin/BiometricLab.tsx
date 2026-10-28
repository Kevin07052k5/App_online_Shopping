'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  Camera,
  Cpu,
  Fingerprint,
  RefreshCw,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Sliders,
  Sparkles,
  Layers,
  Activity,
  Scan,
  Database,
  Eye,
  KeyRound,
  Download,
  Trash2,
} from 'lucide-react'
import {
  EnrolledProfile,
  LivenessChallengeType,
  LivenessStatus,
  BiometricVerificationResult,
} from '@/src/types/biometric'
import {
  getEnrolledProfiles,
  getOwnerProfile,
  enrollOwnerFaceProfile,
  enrollNewFaceProfile,
  resetEnrolledProfiles,
  extractFaceEmbedding,
  calculateCosineSimilarity,
  evaluateLivenessAndAntiSpoofing,
  verifyFaceBiometrics,
} from '@/src/services/sfaceService'

export function BiometricLab() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const isAcquiringCameraRef = useRef<boolean>(false)
  const isExtractingRef = useRef<boolean>(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isStreaming, setIsStreaming] = useState<boolean>(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [feedMode, setFeedMode] = useState<'VIRTUAL' | 'WEBCAM'>('VIRTUAL')

  // Profiles list
  const [profiles, setProfiles] = useState<EnrolledProfile[]>([])
  const [selectedTargetProfile, setSelectedTargetProfile] = useState<EnrolledProfile | null>(null)

  // New enrollment form
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [enrollName, setEnrollName] = useState('')
  const [enrollRole, setEnrollRole] = useState<'ADMIN' | 'CUSTOMER'>('CUSTOMER')
  const [isExtractingFace, setIsExtractingFace] = useState(false)

  // Live analysis state
  const [activeChallenge, setActiveChallenge] = useState<LivenessChallengeType>('BLINK')
  const [liveness, setLiveness] = useState<LivenessStatus>({
    challenge: 'BLINK',
    challengeText: 'Vui lòng chớp mắt 2 lần',
    isPassed: false,
    progress: 10,
    blinkCount: 0,
    motionScore: 20,
    moireScore: 5,
    staticFrameScore: 0,
    isLive: false,
    spoofThreat: 'NONE',
    explanation: 'Đang theo dõi tín hiệu quang học...',
  })

  const [currentEmbedding, setCurrentEmbedding] = useState<number[]>(new Array(128).fill(0))
  const [cosineSim, setCosineSim] = useState<number>(0)
  const [attackSimulation, setAttackSimulation] = useState<
    'NONE' | 'PRINT_ATTACK' | 'REPLAY_ATTACK' | 'IMPOSTOR'
  >('NONE')

  const [lastAuditResult, setLastAuditResult] = useState<BiometricVerificationResult | null>(null)

  const previousCanvasesRef = useRef<HTMLCanvasElement[]>([])
  const frameDeltaSumRef = useRef<number>(0)
  const animFrameIdRef = useRef<number | null>(null)

  // 1. Load profiles on mount
  useEffect(() => {
    const list = getEnrolledProfiles()
    setProfiles(list)
    if (list.length > 0) {
      setSelectedTargetProfile(list[0])
    }
  }, [])

  // 2. Stop Camera cleanly - giải phóng hoàn toàn driver phần cứng
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        try {
          t.enabled = false
          t.stop()
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
        console.warn('Video element reset error:', e)
      }
    }
  }, [])

  // 3. Start Camera with safe cooldown and global release dispatch
  const startCamera = useCallback(async () => {
    if (isAcquiringCameraRef.current) return
    isAcquiringCameraRef.current = true

    // Bắn tín hiệu toàn cục để mọi modal khác (như FaceBiometricModal) giải phóng webcam ngay
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:release_camera'))
    }

    stopCamera()
    setCameraError(null)
    setFeedMode('WEBCAM')

    // Nghỉ 350ms cho Windows Media Foundation Frame Server giải phóng hoàn toàn buffer
    await new Promise((r) => setTimeout(r, 350))

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ getUserMedia API.')
      }

      let media: MediaStream | null = null
      try {
        media = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        })
      } catch (firstErr) {
        console.warn('BiometricLab primary camera constraints failed, cooling down...', firstErr)
        await new Promise((r) => setTimeout(r, 400))
        media = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
      }

      streamRef.current = media
      setStream(media)

      if (videoRef.current) {
        videoRef.current.srcObject = media
        videoRef.current.muted = true
        try {
          await videoRef.current.play()
          setIsStreaming(true)
        } catch (e: any) {
          if (e.name !== 'AbortError') {
            console.warn('Video play delayed/interrupted:', e)
          }
        }
      }
    } catch (e: any) {
      console.warn('BiometricLab camera access error:', e)
      let msg = 'Chưa có camera khả dụng hoặc đang bị ứng dụng khác khóa.'
      if (e.name === 'NotReadableError') {
        msg = 'Webcam đang bị ứng dụng khác hoặc Windows Frame Server chiếm dụng độc quyền.'
      } else if (e.name === 'NotAllowedError') {
        msg = 'Trình duyệt chưa được cấp quyền truy cập Camera.'
      }
      setCameraError(msg)
    } finally {
      isAcquiringCameraRef.current = false
    }
  }, [stopCamera])

  // Chuyển sang Camera Ảo AI an toàn 100% không dùng phần cứng
  const switchToVirtual = useCallback(() => {
    stopCamera()
    setCameraError(null)
    setFeedMode('VIRTUAL')
  }, [stopCamera])

  // Lắng nghe tín hiệu giải phóng & dọn dẹp khi unmount / ẩn tab
  useEffect(() => {
    const handleRelease = () => {
      if (feedMode === 'WEBCAM') {
        stopCamera()
        setFeedMode('VIRTUAL')
      }
    }
    const handleBeforeUnload = () => {
      stopCamera()
    }
    const handleVisibilityChange = () => {
      if (document.hidden && feedMode === 'WEBCAM') {
        stopCamera()
        setFeedMode('VIRTUAL')
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
  }, [stopCamera, feedMode])

  // 3. Real-time vision loop
  useEffect(() => {
    let running = true

    const loop = async () => {
      if (!running) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const overlay = overlayRef.current

      if (canvas && overlay) {
        const ctx = canvas.getContext('2d')
        const oCtx = overlay.getContext('2d')

        if (ctx && oCtx) {
          const w = canvas.width
          const h = canvas.height

          if (feedMode === 'WEBCAM' && video && video.readyState >= 2 && !cameraError) {
            ctx.drawImage(video, 0, 0, w, h)
          } else {
            // Simulated AI feed (Chất lượng cao, mô phỏng sinh trắc học mượt mà)
            const tick = Math.round(frameDeltaSumRef.current)
            const cx = w / 2 + (attackSimulation === 'PRINT_ATTACK' ? 0 : Math.sin(tick * 0.05) * 4)
            const cy = h / 2 + (attackSimulation === 'PRINT_ATTACK' ? 0 : Math.cos(tick * 0.04) * 2)

            // Background gradient
            const bgGrad = ctx.createRadialGradient(cx, cy - 40, 30, cx, cy, 200)
            bgGrad.addColorStop(0, '#1e293b')
            bgGrad.addColorStop(1, '#090d16')
            ctx.fillStyle = bgGrad
            ctx.fillRect(0, 0, w, h)

            // Vai & Cổ áo
            ctx.fillStyle = '#334155'
            ctx.beginPath()
            ctx.ellipse(cx, cy + 130, 100, 60, 0, 0, Math.PI * 2)
            ctx.fill()

            // Khuôn mặt
            ctx.fillStyle = attackSimulation === 'IMPOSTOR' ? '#f43f5e' : '#fbd0b4'
            ctx.beginPath()
            ctx.ellipse(cx, cy - 10, 60, 80, 0, 0, Math.PI * 2)
            ctx.fill()

            // Mái tóc
            ctx.fillStyle = '#1e1b18'
            ctx.beginPath()
            ctx.ellipse(cx, cy - 55, 65, 40, 0, 0, Math.PI * 2)
            ctx.fill()

            // Mắt & Cơ chế chớp mắt tự nhiên
            const isBlinking =
              attackSimulation !== 'PRINT_ATTACK' &&
              (tick % 65 < 5 || (activeChallenge === 'BLINK' && liveness.blinkCount % 2 === 1))

            if (isBlinking) {
              ctx.strokeStyle = '#334155'
              ctx.lineWidth = 2.5
              ctx.beginPath()
              ctx.moveTo(cx - 30, cy - 20)
              ctx.lineTo(cx - 10, cy - 20)
              ctx.moveTo(cx + 10, cy - 20)
              ctx.lineTo(cx + 30, cy - 20)
              ctx.stroke()
            } else {
              ctx.fillStyle = '#1e293b'
              ctx.beginPath()
              ctx.arc(cx - 20, cy - 20, 5, 0, Math.PI * 2)
              ctx.arc(cx + 20, cy - 20, 5, 0, Math.PI * 2)
              ctx.fill()

              ctx.fillStyle = '#ffffff'
              ctx.beginPath()
              ctx.arc(cx - 18, cy - 22, 1.8, 0, Math.PI * 2)
              ctx.arc(cx + 22, cy - 22, 1.8, 0, Math.PI * 2)
              ctx.fill()
            }

            // Sống mũi
            ctx.strokeStyle = '#d49b78'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(cx, cy - 12)
            ctx.lineTo(cx - 4, cy + 5)
            ctx.lineTo(cx + 3, cy + 6)
            ctx.stroke()

            // Miệng
            ctx.strokeStyle = '#c2410c'
            ctx.lineWidth = 2.5
            ctx.beginPath()
            ctx.arc(cx, cy + 22, 15, 0.2 * Math.PI, 0.8 * Math.PI)
            ctx.stroke()

            // Watermark AI
            ctx.fillStyle = '#06b6d4'
            ctx.font = 'bold 11px monospace'
            ctx.fillText('● CAMERA ẢO AI (VIRTUAL LIVE STREAM)', 15, 25)

            // Hiệu ứng tấn công giả mạo đặc thù
            if (attackSimulation === 'PRINT_ATTACK') {
              ctx.strokeStyle = '#f43f5e'
              ctx.lineWidth = 4
              ctx.strokeRect(cx - 85, cy - 105, 170, 210)
              ctx.fillStyle = '#f43f5e'
              ctx.font = 'bold 10px monospace'
              ctx.fillText('ẢNH IN GIẢ MẠO (PRINT ATTACK)', cx - 75, cy - 114)
            } else if (attackSimulation === 'REPLAY_ATTACK') {
              ctx.fillStyle = 'rgba(6, 182, 212, 0.12)'
              for (let lineY = 0; lineY < h; lineY += 4) {
                ctx.fillRect(0, lineY, w, 1)
              }
              ctx.fillStyle = '#f43f5e'
              ctx.font = 'bold 10px monospace'
              ctx.fillText('PHÁT LẠI MÀN HÌNH LCD (MOIRE REPLAY)', 15, h - 15)
            }
          }

          // Draw HUD
          oCtx.clearRect(0, 0, w, h)
          drawLabHud(oCtx, w, h, liveness, attackSimulation)

          // Buffer snapshot
          const snapshot = document.createElement('canvas')
          snapshot.width = w
          snapshot.height = h
          const sCtx = snapshot.getContext('2d')
          if (sCtx) {
            sCtx.drawImage(canvas, 0, 0)
            previousCanvasesRef.current.push(snapshot)
            if (previousCanvasesRef.current.length > 8) {
              previousCanvasesRef.current.shift()
            }
          }

          frameDeltaSumRef.current += 1.0

          // Liveness analysis
          if (attackSimulation === 'PRINT_ATTACK') {
            setLiveness({
              challenge: activeChallenge,
              challengeText: 'Tấn công ảnh in tĩnh (Print Attack)',
              isPassed: false,
              progress: 0,
              blinkCount: 0,
              motionScore: 0,
              moireScore: 10,
              staticFrameScore: 96,
              isLive: false,
              spoofThreat: 'PRINT_ATTACK',
              explanation: 'PHÁT HIỆN GIAN LẬN: Khung hình bất động, không có vi cử động sinh học!',
            })
          } else if (attackSimulation === 'REPLAY_ATTACK') {
            setLiveness({
              challenge: activeChallenge,
              challengeText: 'Tấn công phát lại qua màn hình (Replay Attack)',
              isPassed: false,
              progress: 10,
              blinkCount: 0,
              motionScore: 30,
              moireScore: 92,
              staticFrameScore: 5,
              isLive: false,
              spoofThreat: 'REPLAY_ATTACK',
              explanation: 'PHÁT HIỆN GIAN LẬN: Vân sọc Moire màn hình LCD vượt ngưỡng cho phép (>75%)!',
            })
          } else {
            const res = evaluateLivenessAndAntiSpoofing(
              canvas,
              previousCanvasesRef.current,
              activeChallenge,
              frameDeltaSumRef.current
            )
            setLiveness(res)
          }

          // Extract SFace vector (Ngăn chặn suy luận chồng chéo)
          if (Math.round(frameDeltaSumRef.current) % 15 === 0 && selectedTargetProfile && !isExtractingRef.current) {
            isExtractingRef.current = true
            try {
              let emb: number[]
              if (attackSimulation === 'IMPOSTOR') {
                emb = selectedTargetProfile.embedding128D.map((v, i) => (i % 2 === 0 ? -v : v * 0.2))
              } else {
                emb = await extractFaceEmbedding(canvas)
              }
              setCurrentEmbedding(emb)
              const sim = calculateCosineSimilarity(emb, selectedTargetProfile.embedding128D)
              setCosineSim(sim)
            } catch (err) {
              console.error('Embedding loop error:', err)
            } finally {
              isExtractingRef.current = false
            }
          }
        }
      }

      if (running) {
        animFrameIdRef.current = requestAnimationFrame(loop)
      }
    }

    animFrameIdRef.current = requestAnimationFrame(loop)

    return () => {
      running = false
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current)
      }
    }
  }, [activeChallenge, attackSimulation, selectedTargetProfile, cameraError, feedMode])

  // Handle Enrollment of current face
  const handleEnrollFace = async () => {
    if (!enrollName.trim()) {
      alert('Vui lòng nhập tên chủ tài khoản trước khi chụp ảnh!')
      return
    }
    if (!canvasRef.current || isExtractingFace) return

    setIsExtractingFace(true)
    try {
      const emb = await extractFaceEmbedding(canvasRef.current)
      const newProf = enrollNewFaceProfile(enrollName.trim(), enrollRole, emb)
      const updated = getEnrolledProfiles()
      setProfiles(updated)
      setSelectedTargetProfile(newProf)
      setIsEnrolling(false)
      setEnrollName('')
    } catch (e: any) {
      console.error('Enrollment error:', e)
      alert('Lỗi trích xuất khuôn mặt: ' + (e.message || 'Vui lòng đưa mặt vào trước camera'))
    } finally {
      setIsExtractingFace(false)
    }
  }

  // Handle Manual Biometric Audit
  const handleAuditTest = async () => {
    if (!selectedTargetProfile || !canvasRef.current) return

    const result = await verifyFaceBiometrics(
      canvasRef.current,
      selectedTargetProfile,
      liveness
    )
    setLastAuditResult(result)
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              <Scan className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">
                  Phòng Thử Nghiệm Sinh Trắc Học Khuôn Mặt &amp; Anti-Spoofing (SFace Lab)
                </h2>
                <span className="rounded-md bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-black uppercase text-cyan-300">
                  sface.onnx
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Lớp bảo vệ đa tầng: Phát hiện tấn công mô phỏng (PAD ISO/IEC 30107-3) &amp; Trích xuất đặc trưng 128 chiều
              </p>
            </div>
          </div>

          {/* Model Specification Tags */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-slate-300">
              <span className="text-slate-500">Input:</span> data [1, 3, 112, 112]
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-slate-300">
              <span className="text-slate-500">Output:</span> fc1 [1, 128]
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-cyan-400">
              <span className="text-slate-500">Size:</span> 36.9 MB (Opset 11)
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Scanner & Right Profiles/Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Biometric HUD & Camera (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Camera className="size-4 text-cyan-400" />
                <span>Trạm Quét &amp; Phân Tích Quang Học Trực Tiếp</span>
              </div>

              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono font-bold border ${
                  liveness.isLive
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                    : liveness.spoofThreat !== 'NONE'
                    ? 'border-rose-500/40 bg-rose-500/20 text-rose-300 animate-pulse'
                    : 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                }`}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {liveness.isLive
                  ? 'SỐNG ĐỘNG HỢP LỆ'
                  : liveness.spoofThreat !== 'NONE'
                  ? 'CẢNH BÁO GIẢ MẠO'
                  : 'ĐANG PHÂN TÍCH'}
              </span>
            </div>

            {/* Source Mode Toggle: Virtual AI vs Hardware Webcam */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
              <div className="flex items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={switchToVirtual}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition ${
                    feedMode === 'VIRTUAL'
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="size-3.5" />
                  <span>Camera Ảo AI (Không dùng phần cứng)</span>
                </button>

                <button
                  type="button"
                  onClick={startCamera}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition ${
                    feedMode === 'WEBCAM'
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="size-3.5" />
                  <span>Webcam Laptop Thật</span>
                </button>
              </div>

              {feedMode === 'VIRTUAL' ? (
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  An toàn 100% — Tránh xung đột driver
                </span>
              ) : (
                <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-cyan-400" />
                  Chế độ Phần Cứng
                </span>
              )}
            </div>

            {/* Canvas Viewport */}
            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${
                  feedMode === 'WEBCAM' && isStreaming ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas
                ref={canvasRef}
                width={480}
                height={360}
                className={`size-full object-cover ${feedMode === 'VIRTUAL' ? 'block' : 'hidden'}`}
              />
              <canvas
                ref={overlayRef}
                width={480}
                height={360}
                className="absolute inset-0 size-full object-cover pointer-events-none z-10"
              />

              {feedMode === 'WEBCAM' && !isStreaming && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-950/90 text-center space-y-2">
                  <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Camera className="size-5" />
                  </div>
                  <div className="text-xs text-slate-300 font-bold max-w-sm">
                    {cameraError || 'Đang kết nối camera laptop...'}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex items-center gap-1 rounded-lg bg-cyan-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-cyan-400"
                    >
                      <RefreshCw className="size-3" />
                      <span>Thử Lại Webcam</span>
                    </button>
                    <button
                      type="button"
                      onClick={switchToVirtual}
                      className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-slate-300 hover:text-white"
                    >
                      <Sparkles className="size-3 text-cyan-400" />
                      <span>Dùng Camera Ảo AI</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Top Left Matching Overlay */}
              {selectedTargetProfile && (
                <div className="absolute top-3 left-3 z-20 rounded-xl bg-slate-950/80 backdrop-blur border border-slate-800 p-2 text-[10px]">
                  <div className="text-slate-400">Đang đối chiếu với:</div>
                  <div className="font-bold text-cyan-300">{selectedTargetProfile.name}</div>
                  <div className="font-mono text-slate-300 mt-0.5">
                    CosSim: {(cosineSim * 100).toFixed(1)}% ({cosineSim >= 0.4 ? 'Trùng Khớp' : 'Không Khớp'})
                  </div>
                </div>
              )}

              {/* Bottom Liveness Strip */}
              <div className="absolute bottom-3 inset-x-3 z-20 rounded-xl bg-slate-950/85 backdrop-blur border border-slate-800 p-2 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-slate-300 font-bold">
                  <span>{liveness.challengeText}</span>
                  <span className="font-mono text-cyan-400">{liveness.progress}%</span>
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      liveness.spoofThreat !== 'NONE'
                        ? 'bg-rose-500'
                        : liveness.isPassed
                        ? 'bg-emerald-400'
                        : 'bg-cyan-400'
                    }`}
                    style={{ width: `${liveness.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* SFace 128-D Waveform */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Cpu className="size-3.5 text-cyan-400" />
                  <span>SFace fc1 Output Tensor (128-D Embedding Waveform)</span>
                </span>
                <span className="font-mono text-[10px] text-slate-500">Unit L2-Normalized</span>
              </div>
              <div className="flex items-end gap-0.5 h-10 w-full rounded-xl bg-slate-900 p-1 border border-slate-800 overflow-hidden">
                {currentEmbedding.slice(0, 96).map((val, idx) => {
                  const h = Math.min(100, Math.max(10, Math.abs(val) * 600))
                  return (
                    <div
                      key={idx}
                      className={`flex-1 rounded-sm ${val >= 0 ? 'bg-cyan-400' : 'bg-indigo-500'}`}
                      style={{ height: `${h}%` }}
                    />
                  )
                })}
              </div>
            </div>

            {/* Attack Simulation Buttons */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-300 flex items-center gap-1">
                  <Sliders className="size-3.5 text-amber-400" />
                  <span>Thử Nghiệm Kịch Bản Tấn Công Giả Mạo (Spoofing Scenarios)</span>
                </span>
                <span className="text-[10px] text-slate-500">Kiểm thử độ nhạy PAD</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setAttackSimulation('NONE')}
                  className={`rounded-xl border px-2.5 py-1.5 text-[10px] font-bold transition ${
                    attackSimulation === 'NONE'
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Bình Thường (Live)
                </button>

                <button
                  type="button"
                  onClick={() => setAttackSimulation('PRINT_ATTACK')}
                  className={`rounded-xl border px-2.5 py-1.5 text-[10px] font-bold transition ${
                    attackSimulation === 'PRINT_ATTACK'
                      ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Tấn Công Ảnh In
                </button>

                <button
                  type="button"
                  onClick={() => setAttackSimulation('REPLAY_ATTACK')}
                  className={`rounded-xl border px-2.5 py-1.5 text-[10px] font-bold transition ${
                    attackSimulation === 'REPLAY_ATTACK'
                      ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Phát Lại Màn Hình
                </button>

                <button
                  type="button"
                  onClick={() => setAttackSimulation('IMPOSTOR')}
                  className={`rounded-xl border px-2.5 py-1.5 text-[10px] font-bold transition ${
                    attackSimulation === 'IMPOSTOR'
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Mạo Danh Người Khác
                </button>
              </div>
            </div>

            {/* Run Audit Button */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleAuditTest}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition"
              >
                <Fingerprint className="size-4" />
                <span>Kiểm Duyệt Sinh Trắc Học Tức Thì (Run Biometric Audit)</span>
              </button>

              <button
                type="button"
                onClick={() => (feedMode === 'WEBCAM' ? startCamera() : switchToVirtual())}
                className="rounded-2xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition"
                title={feedMode === 'WEBCAM' ? 'Khởi động lại Webcam' : 'Làm mới Camera Ảo'}
              >
                <RefreshCw className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Profiles & Audit Reports (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Audit Result Card */}
          {lastAuditResult && (
            <div
              className={`rounded-3xl border p-4 shadow-xl space-y-2.5 ${
                lastAuditResult.success
                  ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                  : 'border-rose-500/40 bg-rose-950/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {lastAuditResult.success ? (
                  <CheckCircle2 className="size-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="size-5 text-rose-400" />
                )}
                <span>
                  {lastAuditResult.success
                    ? 'KẾT QUẢ: HỢP LỆ — XÁC THỰC THÀNH CÔNG'
                    : 'KẾT QUẢ: TỪ CHỐI — PHÁT HIỆN GIAN LẬN'}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-200">{lastAuditResult.details}</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                <div className="rounded-xl bg-slate-900/60 p-2 border border-slate-800">
                  <span className="text-slate-400">Cosine Sim:</span>{' '}
                  <span className="font-bold text-white">
                    {(lastAuditResult.cosineSimilarity * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="rounded-xl bg-slate-900/60 p-2 border border-slate-800">
                  <span className="text-slate-400">Độ sống động:</span>{' '}
                  <span className="font-bold text-white">{lastAuditResult.livenessScore}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Enrolled Profiles Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Database className="size-4 text-cyan-400" />
                <span>Hồ Sơ Khuôn Mặt Thật (Enrolled Faces)</span>
              </div>

              <div className="flex items-center gap-1.5">
                {profiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Xóa toàn bộ hồ sơ khuôn mặt để đăng ký lại từ đầu?')) {
                        resetEnrolledProfiles()
                        setProfiles([])
                        setSelectedTargetProfile(null)
                      }
                    }}
                    className="p-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition"
                    title="Xóa toàn bộ dữ liệu sinh trắc học"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsEnrolling(!isEnrolling)}
                  className="flex items-center gap-1 rounded-xl bg-cyan-500/20 border border-cyan-500/30 px-2.5 py-1 text-[11px] font-bold text-cyan-300 hover:bg-cyan-500/30 transition"
                >
                  <UserPlus className="size-3.5" />
                  <span>{isEnrolling ? 'Đóng' : '+ Đăng Ký Mặt Tôi'}</span>
                </button>
              </div>
            </div>

            {/* Quick Enrollment Form */}
            {isEnrolling && (
              <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-3 space-y-2 text-xs">
                <div className="font-bold text-cyan-300">Đăng Ký Khuôn Mặt Của Bạn Từ Camera</div>
                <input
                  type="text"
                  placeholder="Nhập tên của bạn (Chủ Tài Khoản)..."
                  value={enrollName}
                  onChange={(e) => setEnrollName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={enrollRole}
                    onChange={(e: any) => setEnrollRole(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-white text-xs"
                  >
                    <option value="CUSTOMER">Chủ Tài Khoản (Customer)</option>
                    <option value="ADMIN">Quản Trị Viên (Admin)</option>
                  </select>
                  <button
                    type="button"
                    disabled={isExtractingFace || !enrollName.trim()}
                    onClick={handleEnrollFace}
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1.5 font-bold text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isExtractingFace ? (
                      <>
                        <span className="animate-spin inline-block size-3 border-2 border-slate-950 border-t-transparent rounded-full" />
                        <span>Đang Trích Xuất...</span>
                      </>
                    ) : (
                      <span>Chụp &amp; Lưu SFace</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Profile List or Empty State */}
            {profiles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center space-y-2 bg-slate-950/40">
                <Fingerprint className="size-8 mx-auto text-cyan-400 opacity-60" />
                <div className="font-bold text-white text-xs">Chưa có khuôn mặt Chủ Tài Khoản nào được lưu</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Hệ thống không sử dụng dữ liệu tạo sẵn. <strong>Bạn chính là Chủ Tài Khoản!</strong> Hãy nhìn vào camera và bấm <strong>&quot;+ Đăng Ký Mặt Tôi&quot;</strong> để lưu vector 128 chiều thật của bạn.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {profiles.map((prof) => {
                const isSelected = selectedTargetProfile?.id === prof.id
                const sim = calculateCosineSimilarity(currentEmbedding, prof.embedding128D)
                return (
                  <div
                    key={prof.id}
                    onClick={() => setSelectedTargetProfile(prof)}
                    className={`rounded-2xl border p-3 cursor-pointer transition flex items-center justify-between text-xs ${
                      isSelected
                        ? 'border-cyan-500/60 bg-cyan-950/20 shadow-md'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 overflow-hidden">
                        {prof.avatarUrl ? (
                          <img src={prof.avatarUrl} alt={prof.name} className="size-full object-cover" />
                        ) : (
                          prof.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">{prof.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                          <span
                            className={`px-1 rounded text-[9px] font-bold ${
                              prof.role === 'ADMIN'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            {prof.role}
                          </span>
                          <span>Vector: 128 float</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-mono font-bold text-xs ${
                          sim >= 0.4 ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {(sim * 100).toFixed(1)}%
                      </div>
                      <div className="text-[9px] text-slate-500">Độ tương đồng</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

          {/* Defense Architecture Architecture Breakdown */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl space-y-2.5 text-xs">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="size-4 text-cyan-400" />
              <span>Kiến Trúc Lớp Bảo Vệ Sinh Trắc Học</span>
            </div>

            <div className="space-y-2 text-[11px] text-slate-400">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 space-y-1">
                <span className="font-bold text-cyan-300">Tầng 1: Active Liveness (Thử Thách Động)</span>
                <p>Yêu cầu tương tác sinh học (chớp mắt, quay góc mặt) chống lại ảnh tĩnh 100%.</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 space-y-1">
                <span className="font-bold text-cyan-300">Tầng 2: Passive Optical &amp; Moire Defense</span>
                <p>Phân tích quang học vi kết cấu bề mặt da nhằm phát hiện ánh sáng màn hình phát lại (Replay Attack).</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 space-y-1">
                <span className="font-bold text-cyan-300">Tầng 3: SFace 128-D Hypersphere Recognition</span>
                <p>Mô hình SFace ONNX trích xuất đặc trưng với hàm mất mát Sigmoid Hypersphere, so khớp Cosine Similarity &ge; 0.40.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function drawLabHud(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  liveness: LivenessStatus,
  sim: string
) {
  const cx = w / 2
  const cy = h / 2

  ctx.save()
  ctx.strokeStyle =
    sim === 'PRINT_ATTACK' || sim === 'REPLAY_ATTACK'
      ? '#ef4444'
      : liveness.isLive
      ? '#10b981'
      : '#06b6d4'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 6])
  ctx.beginPath()
  ctx.ellipse(cx, cy, 75, 105, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

import { AIAnalysisResult, TransactionPayload } from './types'

const SYSTEM_PROMPT = `Bạn là Chuyên gia Đánh giá Rủi ro Gian lận TMĐT của sàn HTP Foody. Hãy phân tích Transaction Payload và trả về duy nhất một chuỗi JSON hợp lệ theo format sau:
{
  "riskScore": <số nguyên từ 0 đến 100>,
  "riskLevel": <"LOW" hoặc "MEDIUM" hoặc "HIGH">,
  "decision": <"APPROVED" hoặc "CHALLENGE_OTP" hoặc "HOLD_REVIEW">,
  "reasons": [<danh sách 2-4 lý do phân tích cụ thể bằng tiếng Việt>],
  "summary": "<lời giải thích ngắn gọn quyết định cho kiểm duyệt viên>"
}
Không xuất hiện bất kỳ markdown, lời giải thích hay ký tự nào ngoài JSON.`

// Fallback Mock Inference Engine based on heuristic domain rules
export function analyzeWithRuleEngine(payload: TransactionPayload): AIAnalysisResult {
  const reasons: string[] = []
  let riskScore = 12
  let decision: 'APPROVED' | 'CHALLENGE_OTP' | 'HOLD_REVIEW' = 'APPROVED'
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'

  const lowerEmail = payload.email.toLowerCase()
  const lowerAddr = payload.shipping_address.toLowerCase()
  const lowerName = payload.customer_name.toLowerCase()
  const lowerDevice = payload.device_fingerprint.toLowerCase()

  // 1. Check Bot / Spam Indicators
  const isSpamBot =
    payload.cart_duration_seconds < 2 ||
    payload.items_count >= 50 ||
    /x89|bot|_payload|null|0x992/i.test(payload.customer_name) ||
    /throwaway|mailinator/i.test(lowerEmail)

  if (isSpamBot) {
    riskScore = Math.floor(Math.random() * 5) + 94 // 94-98
    riskLevel = 'HIGH'
    decision = 'HOLD_REVIEW'
    reasons.push(
      `Tốc độ thao tác cực nhanh (${payload.cart_duration_seconds}s), đặc trưng của Botnet cào dữ liệu.`
    )
    reasons.push(
      'Họ tên và địa chỉ có định dạng chuỗi ký tự ngẫu nhiên hoặc chứa mã lệnh độc hại.'
    )
    reasons.push(
      `Số lượng sản phẩm đột biến (${payload.items_count} món) nhằm mục đích làm nghẽn kho hàng.`
    )

    return {
      riskScore,
      riskLevel,
      decision,
      reasons,
      summary:
        'Hệ thống phát hiện dấu hiệu tấn công từ chối dịch vụ (DDoS/Spam Bot) với tốc độ giao dịch phi thực tế. Đã tự động cách ly đơn hàng.',
      analyzedAt: new Date().toISOString(),
      model: 'HTP-RuleEngine-v2.6 (Mock Fallback)',
    }
  }

  // 2. Check High-Risk Fraud Indicators
  const isTempEmail =
    lowerEmail.includes('10minutemail') ||
    lowerEmail.includes('temp_') ||
    lowerEmail.includes('disposable')
  const isSuspiciousAddress =
    lowerAddr.includes('bãi đất trống') ||
    lowerAddr.includes('hoang') ||
    lowerAddr.includes('kcn sóng thần')
  const isForeignIp = payload.ip_country !== 'VN'
  const isLargeOrder = payload.total_amount >= 10000000
  const isHeadless =
    lowerDevice.includes('headless') ||
    lowerDevice.includes('puppeteer') ||
    lowerDevice.includes('selenium')

  let fraudScoreAccum = 0

  if (isLargeOrder) {
    fraudScoreAccum += 30
    reasons.push(
      `Giá trị đơn hàng rất lớn (${payload.total_amount.toLocaleString('vi-VN')}₫), vượt 300% ngưỡng chi tiêu trung bình.`
    )
  }

  if (isTempEmail) {
    fraudScoreAccum += 25
    reasons.push('Khách hàng sử dụng dịch vụ email tạm thời (10minutemail/disposable).')
  }

  if (isSuspiciousAddress) {
    fraudScoreAccum += 20
    reasons.push('Địa chỉ nhận hàng mơ hồ, có nguy cơ bùng hàng hoặc giao vào khu vực không cư trú.')
  }

  if (isForeignIp) {
    fraudScoreAccum += 20
    reasons.push(
      `Địa chỉ IP (${payload.client_ip}) thuộc quốc gia ${payload.ip_country}, bất thường đối với đơn hàng giao tại Việt Nam.`
    )
  }

  if (isHeadless) {
    fraudScoreAccum += 25
    reasons.push('Dấu vân tay trình duyệt cho thấy môi trường Headless Browser / Web Automation.')
  }

  if (fraudScoreAccum >= 40) {
    riskScore = Math.min(92, 50 + fraudScoreAccum / 2)
    if (riskScore >= 75) {
      riskLevel = 'HIGH'
      decision = 'HOLD_REVIEW'
    } else {
      riskLevel = 'MEDIUM'
      decision = 'CHALLENGE_OTP'
    }

    return {
      riskScore: Math.round(riskScore),
      riskLevel,
      decision,
      reasons,
      summary:
        riskLevel === 'HIGH'
          ? 'Đơn hàng hội tụ nhiều dấu hiệu gian lận thẻ tín dụng hoặc tài khoản ma. Đề xuất tạm giữ kiểm duyệt thủ công.'
          : 'Giao dịch có một số điểm bất thường cần kích hoạt bước xác thực 2 yếu tố (OTP Challenge) để bảo vệ thanh toán.',
      analyzedAt: new Date().toISOString(),
      model: 'HTP-RuleEngine-v2.6 (Mock Fallback)',
    }
  }

  // 3. Normal / Legitimate Order
  riskScore = Math.floor(Math.random() * 8) + 7 // 7-14
  reasons.push('Hành vi người dùng tự nhiên, thời gian lướt xem hàng và chọn món hợp lý.')
  reasons.push('Địa chỉ giao hàng thực tế trong khu vực nội thành TP.HCM, thông tin đồng bộ.')
  reasons.push('Địa chỉ IP Việt Nam hợp lệ, trình duyệt tiêu chuẩn người dùng cá nhân.')

  return {
    riskScore,
    riskLevel: 'LOW',
    decision: 'APPROVED',
    reasons,
    summary:
      'Giao dịch minh bạch và an toàn. Độ tin cậy cao, tự động thông qua và chuyển sang quy trình mã hóa dữ liệu.',
    analyzedAt: new Date().toISOString(),
    model: 'HTP-RuleEngine-v2.6 (Mock Fallback)',
  }
}

// Call Google Gemini API with smart fallback
export async function analyzeTransactionWithGemini(
  payload: TransactionPayload,
  apiKey?: string,
  modelName: string = 'gemini-1.5-flash'
): Promise<AIAnalysisResult> {
  const trimmedKey = apiKey?.trim()

  if (!trimmedKey) {
    // Artificial small delay for realistic UX demonstration
    await new Promise((res) => setTimeout(res, 900))
    return analyzeWithRuleEngine(payload)
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${trimmedKey}`
    
    const promptText = `${SYSTEM_PROMPT}\n\nTRANSACTION PAYLOAD:\n${JSON.stringify(
      payload,
      null,
      2
    )}`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptText }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!response.ok) {
      console.warn('Gemini API call failed, falling back to Rule Engine:', response.statusText)
      return analyzeWithRuleEngine(payload)
    }

    const data = await response.json()
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawContent) {
      return analyzeWithRuleEngine(payload)
    }

    const cleanJson = rawContent
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()
    const parsed = JSON.parse(cleanJson)

    return {
      riskScore: Math.min(100, Math.max(0, Number(parsed.riskScore) || 50)),
      riskLevel: parsed.riskLevel || 'MEDIUM',
      decision: parsed.decision || 'HOLD_REVIEW',
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [parsed.summary || 'Phân tích AI'],
      summary: parsed.summary || 'Phân tích hoàn tất từ mô hình Gemini.',
      analyzedAt: new Date().toISOString(),
      model: `${modelName} (Google Gemini Live)`,
    }
  } catch (error) {
    console.error('Error invoking Gemini, using fallback:', error)
    return analyzeWithRuleEngine(payload)
  }
}

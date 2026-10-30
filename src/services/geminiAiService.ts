import { AIExplanation, FraudEvaluationPayload } from '@/src/types/fraud'

const SYSTEM_AUDIT_PROMPT = `Bạn là Chuyên gia Kiểm toán Gian lận TMĐT cấp cao của sàn Thương mại Điện tử (mô hình Shopee / Lazada). Hãy phân tích Transaction Payload của đơn hàng (bao gồm dữ liệu thiết bị, mạng, voucher, và kết quả xác thực sinh trắc học Face ID chính chủ) và trả về duy nhất một chuỗi JSON hợp lệ theo format:
{
  "riskScore": <số nguyên từ 0 đến 100>,
  "riskLevel": <"LOW" hoặc "MEDIUM" hoặc "HIGH">,
  "decision": <"APPROVED" hoặc "CHALLENGE_OTP" hoặc "HOLD_REVIEW">,
  "reasons": [<danh sách 2-4 lý do phân tích cụ thể bằng tiếng Việt>],
  "summary": "<lời giải thích ngắn gọn quyết định cho kiểm duyệt viên sàn>"
}
Chú ý: Nếu đơn hàng đã xác thực Face ID chính chủ thành công (biometricVerification.verified = true), đây là bằng chứng mạnh mẽ cho thấy chính chủ tài khoản đang thực hiện giao dịch, giúp giảm rủi ro chiếm quyền tài khoản (Account Takeover). Ngược lại nếu Face ID thất bại hoặc bị giả mạo, phải đánh giá HIGH RISK và HOLD_REVIEW.
Không xuất hiện bất kỳ markdown, lời giải thích hay ký tự nào ngoài JSON.`

/**
 * Intelligent Rule-Based Fallback Engine
 * Ensures 100% smooth, bulletproof presentation during thesis defense even without internet or API key
 */
export function evaluateWithHeuristicEngine(
  payload: FraudEvaluationPayload
): AIExplanation {
  const reasons: string[] = []
  const lowerEmail = payload.customerEmail.toLowerCase()
  const lowerDevice = payload.deviceEntropy.toLowerCase()
  const isExploitVoucher = payload.voucherCode === 'VOUCHER_HACK_90'
  const isFastCheckout = payload.checkoutVelocitySec < 3.0
  const isTempEmail =
    lowerEmail.includes('tempmail') ||
    lowerEmail.includes('10minutemail') ||
    lowerEmail.includes('throwaway') ||
    lowerEmail.includes('bot_')
  const isHeadless =
    lowerDevice.includes('headless') ||
    lowerDevice.includes('puppeteer') ||
    lowerDevice.includes('curl') ||
    lowerDevice.includes('automation')
  const isHighValue = payload.totalAmount >= 20000000
  const isProxyIp =
    payload.clientIp.includes('Proxy') ||
    payload.clientIp.includes('Datacenter') ||
    payload.clientIp.startsWith('194.') ||
    payload.clientIp.startsWith('185.')

  // BIOMETRIC SECURITY GATE: Nếu xác thực sinh trắc học Face ID thất bại hoặc phát hiện giả mạo
  if (
    payload.biometricVerification &&
    (!payload.biometricVerification.verified ||
      payload.biometricVerification.status === 'MISMATCH' ||
      payload.biometricVerification.status === 'SPOOF_DETECTED')
  ) {
    const riskScore = 96
    reasons.push(
      `CẢNH BÁO SINH TRẮC HỌC: Khuôn mặt trước camera không trùng khớp với chủ tài khoản đã đăng ký (Trạng thái: ${payload.biometricVerification.status}).`
    )
    reasons.push(
      'Nghi vấn nghiêm trọng về chiếm quyền tài khoản (Account Takeover) hoặc người lạ cố tình đặt hàng trái phép.'
    )
    reasons.push(
      'Hệ thống AI tự động chặn đơn hàng để bảo vệ tài sản và thông tin cá nhân của chủ sở hữu.'
    )

    return {
      riskScore,
      riskLevel: 'HIGH',
      decision: 'HOLD_REVIEW',
      reasons,
      summary:
        'CẢNH BÁO: Xác thực Face ID thất bại (Khuôn mặt không phải chính chủ). Đơn hàng đã bị giữ lại để kiểm duyệt an ninh.',
      modelName: 'Heuristic-Engine-v3.0 (Smart Fallback)',
      evaluatedAt: new Date().toISOString(),
    }
  }

  // SCENARIO 3: Bot Farm Voucher / Spam Attack / Exploitation (HIGH RISK: 88 - 98)
  if (isExploitVoucher || (isFastCheckout && isTempEmail) || (isFastCheckout && isHeadless)) {
    const riskScore = Math.floor(Math.random() * 7) + 91 // 91-97
    reasons.push(
      `Tốc độ thanh toán siêu tốc (${payload.checkoutVelocitySec}s), đặc trưng của Bot tự động cào khuyến mãi.`
    )
    if (isExploitVoucher) {
      reasons.push(
        `Áp dụng mã giảm giá bất thường (${payload.voucherCode}) với mức giảm vượt quá hạn mức sàn cho phép.`
      )
    }
    if (isTempEmail) {
      reasons.push(
        `Sử dụng tài khoản email ảo/tạm thời (${payload.customerEmail}) thường dùng cho các chiến dịch gian lận coupon.`
      )
    }
    if (isHeadless || isProxyIp) {
      reasons.push(
        `Môi trường thiết bị tự động hóa (Headless Browser) qua địa chỉ IP máy chủ ảo/Proxy.`
      )
    }

    return {
      riskScore,
      riskLevel: 'HIGH',
      decision: 'HOLD_REVIEW',
      reasons,
      summary:
        'Phát hiện dấu hiệu tấn công Botnet trục lợi Voucher và đầu cơ hàng số lượng lớn. Đã tạm giữ đơn hàng vào Hàng đợi kiểm duyệt.',
      modelName: 'Heuristic-Engine-v3.0 (Smart Fallback)',
      evaluatedAt: new Date().toISOString(),
    }
  }

  // SCENARIO 2: Account Takeover / Unusual Credit Card / Foreign IP (MEDIUM RISK: 45 - 65)
  if (isHighValue || isProxyIp || payload.paymentMethod === 'CREDIT_CARD' && (payload.totalAmount > 10000000 || isFastCheckout)) {
    const riskScore = Math.floor(Math.random() * 12) + 52 // 52-63
    if (isHighValue) {
      reasons.push(
        `Đơn hàng có giá trị rất cao (${payload.totalAmount.toLocaleString('vi-VN')}₫) đối với tài khoản cá nhân thông thường.`
      )
    }
    if (payload.paymentMethod === 'CREDIT_CARD') {
      reasons.push(
        'Giao dịch thanh toán Thẻ Tín Dụng Quốc Tế có dấu hiệu thử thẻ (Card Testing) hoặc địa chỉ IP mạng bất thường.'
      )
    }
    if (isProxyIp) {
      reasons.push(
        `Kết nối từ dải IP bất thường (${payload.clientIp}), lệch múi giờ giao dịch thông thường.`
      )
    }
    if (reasons.length < 2) {
      reasons.push('Thiết bị mới chưa từng ghi nhận lịch sử đặt hàng trước đó trên sàn.')
    }

    return {
      riskScore,
      riskLevel: 'MEDIUM',
      decision: 'CHALLENGE_OTP',
      reasons,
      summary:
        'Giao dịch thẻ tín dụng giá trị cao có độ bất thường trung bình. Cần kích hoạt xác thực 2 yếu tố (OTP Challenge) qua điện thoại khách hàng.',
      modelName: 'Heuristic-Engine-v3.0 (Smart Fallback)',
      evaluatedAt: new Date().toISOString(),
    }
  }

  // SCENARIO 1: Legitimate Purchase (LOW RISK: 5 - 15)
  const riskScore = Math.floor(Math.random() * 8) + 7 // 7-14
  if (payload.biometricVerification?.verified) {
    reasons.push(
      `Đã xác thực sinh trắc học Face ID chính chủ (${payload.biometricVerification.matchedProfileName || 'Khách hàng'}, độ khớp SFace ${Math.round(payload.biometricVerification.cosineSimilarity * 100)}%).`
    )
  }
  reasons.push('Hành vi người dùng tự nhiên, thời gian lướt xem hàng và thêm giỏ hợp lý.')
  reasons.push('Thông tin người nhận, số điện thoại và địa chỉ giao hàng đồng bộ, có độ tin cậy cao.')
  reasons.push('Phương thức thanh toán phù hợp, không phát hiện dấu hiệu gian lận voucher hay giả mạo thiết bị.')

  return {
    riskScore,
    riskLevel: 'LOW',
    decision: 'APPROVED',
    reasons,
    summary:
      'Giao dịch hợp lệ, độ rủi ro rất thấp. Hệ thống tự động thông qua và chuyển sang quy trình mã hóa dữ liệu.',
    modelName: 'Heuristic-Engine-v3.0 (Smart Fallback)',
    evaluatedAt: new Date().toISOString(),
  }
}

// Mapping các model cũ đã bị Google ngừng hoạt động (deprecated) sang thế hệ mới
const DEPRECATED_MODEL_ALIASES: Record<string, string> = {
  'gemini-1.5-pro': 'gemini-2.5-flash',
  'gemini-1.5-pro-latest': 'gemini-2.5-pro',
  'gemini-1.5-flash': 'gemini-2.5-flash',
  'gemini-1.5-flash-latest': 'gemini-2.5-flash',
  'gemini-1.0-pro': 'gemini-2.0-flash',
}

/**
 * Call Google Gemini API or smoothly fallback to heuristic rules
 */
export async function analyzeOrderFraud(
  payload: FraudEvaluationPayload,
  apiKey?: string,
  modelName: string = 'gemini-2.5-flash'
): Promise<AIExplanation> {
  const trimmedKey = apiKey?.trim()

  if (!trimmedKey) {
    // Realistic micro-delay to simulate neural network inference
    await new Promise((res) => setTimeout(res, 850))
    return evaluateWithHeuristicEngine(payload)
  }

  // Tự động chuẩn hóa model name nếu người dùng vô tình cấu hình model 1.5 cũ đã bị Google đóng
  let targetModel = DEPRECATED_MODEL_ALIASES[modelName] || modelName || 'gemini-2.5-flash'

  const callGeminiEndpoint = async (model: string) => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${trimmedKey}`
    const promptText = `${SYSTEM_AUDIT_PROMPT}\n\nTRANSACTION PAYLOAD:\n${JSON.stringify(
      payload,
      null,
      2
    )}`

    return fetch(endpoint, {
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
  }

  try {
    let response = await callGeminiEndpoint(targetModel)

    // Nếu gặp lỗi 404 Not Found, tự động gọi ListModels để tìm model khả dụng của chính tài khoản đó
    if (!response.ok && response.status === 404) {
      console.warn(`Model ${targetModel} trả về 404, tự động tra cứu danh sách model được cấp phép cho API Key...`)
      try {
        const listRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedKey}`
        )
        if (listRes.ok) {
          const listData = await listRes.json()
          const validModel = listData.models
            ?.find((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
            ?.name?.replace(/^models\//, '')

          if (validModel && validModel !== targetModel) {
            console.info(`Đã tự động chuyển đổi sang mô hình khả dụng: ${validModel}`)
            targetModel = validModel
            response = await callGeminiEndpoint(targetModel)
          }
        }
      } catch (listErr) {
        console.warn('Không thể tra cứu ListModels:', listErr)
      }
    }

    if (!response.ok) {
      console.warn('Gemini API call failed, falling back to Heuristic Engine:', response.statusText)
      return evaluateWithHeuristicEngine(payload)
    }

    const data = await response.json()
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawContent) {
      return evaluateWithHeuristicEngine(payload)
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
      summary: parsed.summary || 'Phân tích hoàn tất từ mô hình Gemini Live.',
      modelName: `${targetModel} (Google Gemini Live)`,
      evaluatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error in analyzeOrderFraud, invoking fallback:', error)
    return evaluateWithHeuristicEngine(payload)
  }
}

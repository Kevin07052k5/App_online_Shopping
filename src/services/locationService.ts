/**
 * Service Định Vị Vị Trí Thời Gian Thực (GPS & IP Geolocation)
 * Tự động xác định vị trí thực tế của khách hàng thay vì dùng dữ liệu mặc định gán sẵn
 */

export interface DetectedLocationResult {
  success: boolean
  coords: {
    lat: number
    lng: number
  }
  address: string
  source: 'GPS_HARDWARE' | 'IP_NETWORK' | 'MANUAL'
  accuracy?: number
  isEstimate?: boolean
  error?: string
}

/**
 * Hàm lấy tọa độ từ GPS trình duyệt với 2 tầng (High Accuracy -> Low Accuracy)
 */
function getBrowserGpsCoords(): Promise<{ lat: number; lng: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return reject(new Error('Trình duyệt không hỗ trợ Geolocation API'))
    }

    // Tầng 1: Thử lấy GPS chính xác cao (phù hợp điện thoại / laptop có Wi-Fi)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 20),
        })
      },
      (err1) => {
        console.warn('GPS High Accuracy timeout/error, thử Low Accuracy...', err1)
        // Tầng 2: Thử lấy vị trí Low Accuracy (dùng bộ nhớ đệm hệ điều hành)
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: Math.round(pos.coords.accuracy || 100),
            })
          },
          (err2) => {
            reject(err2)
          },
          {
            enableHighAccuracy: false,
            timeout: 6000,
            maximumAge: 300000,
          }
        )
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 60000,
      }
    )
  })
}

/**
 * Hàm dự phòng lấy tọa độ qua IP mạng nếu thiết bị không có cảm biến GPS
 */
async function getNetworkIpCoords(): Promise<{ lat: number; lng: number }> {
  try {
    const res = await fetch('https://ipwho.is/')
    const data = await res.json()
    if (data && data.success !== false && data.latitude && data.longitude) {
      return {
        lat: Number(data.latitude),
        lng: Number(data.longitude),
      }
    }
  } catch (err) {
    console.warn('ipwho.is failed, trying backup API:', err)
  }

  // Backup IP API
  const backupRes = await fetch('https://ipapi.co/json/')
  const backupData = await backupRes.json()
  if (backupData && backupData.latitude && backupData.longitude) {
    return {
      lat: Number(backupData.latitude),
      lng: Number(backupData.longitude),
    }
  }

  throw new Error('Không thể xác định vị trí qua địa chỉ IP mạng')
}

/**
 * Hàm Dịch Ngược Tọa Độ thành Địa Chỉ Đường Phố Tiếng Việt chuẩn
 */
export async function reverseGeocodeToVietnameseAddress(
  lat: number,
  lng: number
): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=vi`,
      {
        headers: {
          'Accept-Language': 'vi,en;q=0.9',
        },
      }
    )

    if (!res.ok) throw new Error('Network error on reverse geocoding')
    const data = await res.json()

    if (data && data.address) {
      const addr = data.address
      const parts: string[] = []

      // 1. Số nhà + Tên đường / Tòa nhà
      const houseNumber = addr.house_number || ''
      const road = addr.road || addr.street || addr.pedestrian || ''
      if (houseNumber && road) {
        parts.push(`${houseNumber} ${road}`)
      } else if (road) {
        parts.push(road)
      } else if (data.name) {
        parts.push(data.name)
      }

      // 2. Thôn / Ấp / Khu phố / Phường / Xã
      const quarter =
        addr.quarter || addr.suburb || addr.neighbourhood || addr.village || addr.hamlet || ''
      if (quarter) parts.push(quarter)

      // 3. Quận / Huyện / Thị xã
      const district = addr.city_district || addr.district || addr.county || addr.town || ''
      if (district) parts.push(district)

      // 4. Tỉnh / Thành phố
      const city = addr.city || addr.state || addr.province || ''
      if (city) parts.push(city)

      if (parts.length >= 2) {
        return parts.join(', ')
      } else if (data.display_name) {
        return data.display_name
      }
    } else if (data && data.display_name) {
      return data.display_name
    }
  } catch (err) {
    console.warn('Lỗi reverse geocoding:', err)
  }

  return `Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

/**
 * HÀM CHÍNH: Tự động định vị vị trí hiện tại thực tế của người dùng
 * - Ưu tiên 1: GPS thực tế phần cứng
 * - Ưu tiên 2: Ước tính theo IP mạng nếu thiết bị không có chip GPS
 */
export async function detectRealCurrentLocation(): Promise<DetectedLocationResult> {
  // 1. Thử GPS phần cứng
  try {
    const gps = await getBrowserGpsCoords()
    const address = await reverseGeocodeToVietnameseAddress(gps.lat, gps.lng)
    return {
      success: true,
      coords: { lat: gps.lat, lng: gps.lng },
      address,
      source: 'GPS_HARDWARE',
      accuracy: gps.accuracy,
      isEstimate: false,
    }
  } catch (gpsErr: any) {
    console.info('GPS không thể kích hoạt trên thiết bị này, thử ước tính theo trạm IP...')

    // 2. Dự phòng: Thử định vị IP mạng
    try {
      const ipCoords = await getNetworkIpCoords()
      const address = await reverseGeocodeToVietnameseAddress(ipCoords.lat, ipCoords.lng)
      return {
        success: true,
        coords: ipCoords,
        address,
        source: 'IP_NETWORK',
        isEstimate: true,
        error: 'Vị trí ước tính theo trạm mạng Internet. Bạn có thể kéo ghim đỏ hoặc gõ tìm kiếm để chọn đúng số nhà.',
      }
    } catch (ipErr: any) {
      return {
        success: false,
        coords: { lat: 10.776, lng: 106.700 },
        address: '',
        source: 'MANUAL',
        error: 'Chưa thể xác định vị trí tự động. Vui lòng bấm vào bản đồ hoặc gõ địa chỉ của bạn.',
      }
    }
  }
}

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
  source: 'GPS_HARDWARE' | 'IP_NETWORK'
  error?: string
}

/**
 * Hàm lấy tọa độ từ GPS trình duyệt (ưu tiên số 1)
 */
function getBrowserGpsCoords(timeoutMs = 6000): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return reject(new Error('Trình duyệt không hỗ trợ Geolocation API'))
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      (err) => {
        reject(err)
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 0,
      }
    )
  })
}

/**
 * Hàm dự phòng lấy tọa độ thời gian thực qua IP mạng
 * (Cực kỳ hiệu quả trên máy tính PC / Laptop Windows không có cảm biến GPS phần cứng)
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
 * Thứ tự ưu tiên:
 * 1. GPS phần cứng trình duyệt (High Accuracy)
 * 2. IP Geolocation thời gian thực (nếu máy tính không có GPS hoặc người dùng chưa bấm Allow)
 * 3. Tự động dịch sang địa chỉ tiếng Việt chi tiết
 */
export async function detectRealCurrentLocation(): Promise<DetectedLocationResult> {
  let coords: { lat: number; lng: number } | null = null
  let source: 'GPS_HARDWARE' | 'IP_NETWORK' = 'GPS_HARDWARE'

  // Bước 1: Thử GPS trình duyệt
  try {
    coords = await getBrowserGpsCoords(5000)
    source = 'GPS_HARDWARE'
  } catch (gpsErr) {
    console.info('GPS phần cứng không phản hồi hoặc bị từ chối, chuyển sang IP Geolocation thời gian thực...')
    // Bước 2: Chuyển sang định vị IP mạng
    try {
      coords = await getNetworkIpCoords()
      source = 'IP_NETWORK'
    } catch (ipErr: any) {
      return {
        success: false,
        coords: { lat: 10.823, lng: 106.629 },
        address: '',
        source: 'IP_NETWORK',
        error: 'Không thể định vị vị trí hiện tại. Vui lòng kiểm tra kết nối mạng hoặc cấp quyền định vị!',
      }
    }
  }

  // Bước 3: Dịch ngược tọa độ thành tên đường, quận, thành phố thực tế
  const formattedAddress = await reverseGeocodeToVietnameseAddress(coords.lat, coords.lng)

  return {
    success: true,
    coords,
    address: formattedAddress,
    source,
  }
}


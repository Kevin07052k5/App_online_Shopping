'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  MapPin,
  Search,
  Crosshair,
  Layers,
  ExternalLink,
  Check,
  X,
  Loader2,
  Sparkles,
  Navigation,
  Globe,
  Building2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

export interface MapCoordinates {
  lat: number
  lng: number
}

export interface GoogleMapAddressPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectAddress: (address: string, coords?: MapCoordinates) => void
  initialAddress?: string
  initialCoords?: MapCoordinates
  showSaveAsDefaultOption?: boolean
  onSaveAsDefault?: (address: string) => void
  title?: string
}

// Preset các địa điểm phổ biến tại Việt Nam để test nhanh / demo
const VIETNAM_PRESETS: Array<{
  name: string
  label: string
  address: string
  coords: MapCoordinates
}> = [
  {
    name: 'HUTECH',
    label: 'ĐH Hutech, 475A Điện Biên Phủ',
    address: '475A Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh',
    coords: { lat: 10.801344, lng: 106.714365 },
  },
  {
    name: 'Landmark 81',
    label: 'Landmark 81, Vinhomes',
    address: '720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh',
    coords: { lat: 10.795055, lng: 106.721862 },
  },
  {
    name: 'Bến Thành',
    label: 'Chợ Bến Thành, Quận 1',
    address: 'Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
    coords: { lat: 10.772545, lng: 106.698028 },
  },
  {
    name: 'Hồ Hoàn Kiếm',
    label: 'Hồ Hoàn Kiếm, Hà Nội',
    address: 'Đinh Tiên Hoàng, Phường Hàng Trống, Quận Hoàn Kiếm, Hà Nội',
    coords: { lat: 21.028511, lng: 105.854444 },
  },
  {
    name: 'Cầu Rồng',
    label: 'Cầu Rồng, Đà Nẵng',
    address: 'Đường Nguyễn Văn Linh, Phước Ninh, Hải Châu, Đà Nẵng',
    coords: { lat: 16.061081, lng: 108.223847 },
  },
  {
    name: 'Bến Ninh Kiều',
    label: 'Bến Ninh Kiều, Cần Thơ',
    address: 'Đường Hai Bà Trưng, Tân An, Ninh Kiều, Cần Thơ',
    coords: { lat: 10.033691, lng: 105.787654 },
  },
]

type MapLayerType = 'google_roadmap' | 'google_satellite' | 'osm'

export function GoogleMapAddressPickerModal({
  isOpen,
  onClose,
  onSelectAddress,
  initialAddress = '',
  initialCoords = { lat: 10.801344, lng: 106.714365 },
  showSaveAsDefaultOption = false,
  onSaveAsDefault,
  title = 'Chọn Vị Trí Giao Hàng Trên Google Maps',
}: GoogleMapAddressPickerModalProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerInstanceRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)

  const [coords, setCoords] = useState<MapCoordinates>(initialCoords)
  const [address, setAddress] = useState<string>(
    initialAddress || '475A Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh'
  )
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<
    Array<{ display_name: string; lat: string; lon: string }>
  >([])
  const [isSearching, setIsSearching] = useState(false)
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)
  const [mapLayer, setMapLayer] = useState<MapLayerType>('google_roadmap')
  const [isLeafletReady, setIsLeafletReady] = useState(false)
  const [saveAsDefault, setSaveAsDefault] = useState(false)
  const [isGpsLocating, setIsGpsLocating] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)

  // Khởi tạo địa chỉ và tọa độ ban đầu khi mở modal
  useEffect(() => {
    if (isOpen) {
      if (initialCoords && initialCoords.lat && initialCoords.lng) {
        setCoords(initialCoords)
      }
      if (initialAddress) {
        setAddress(initialAddress)
      }
      setSearchQuery('')
      setSearchResults([])
      setGpsError(null)
    }
  }, [isOpen, initialAddress, initialCoords])

  // Tải thư viện Leaflet CSS & JS qua CDN động (không phụ thuộc npm package)
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return

      // 1. Tải stylesheet nếu chưa có
      if (!document.getElementById('leaflet-css-cdn')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css-cdn'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      // 2. Tải script nếu chưa có
      if ((window as any).L) {
        if (isMounted) setIsLeafletReady(true)
        return
      }

      if (!document.getElementById('leaflet-js-cdn')) {
        const script = document.createElement('script')
        script.id = 'leaflet-js-cdn'
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.async = true
        script.onload = () => {
          if (isMounted) setIsLeafletReady(true)
        }
        document.body.appendChild(script)
      } else {
        const interval = setInterval(() => {
          if ((window as any).L) {
            clearInterval(interval)
            if (isMounted) setIsLeafletReady(true)
          }
        }, 100)
      }
    }

    loadLeaflet()

    return () => {
      isMounted = false
    }
  }, [isOpen])

  // Hàm lấy URL Tile tương ứng cho từng chế độ bản đồ
  const getTileConfig = useCallback((layer: MapLayerType) => {
    switch (layer) {
      case 'google_satellite':
        return {
          url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          maxZoom: 20,
          attribution: 'Imagery © Google Maps',
        }
      case 'google_roadmap':
        return {
          url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          maxZoom: 20,
          attribution: 'Map data © Google Maps',
        }
      case 'osm':
      default:
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        }
    }
  }, [])

  // Hàm Geocode ngược: Tọa độ (Lat, Lng) -> Tên đường, Phường, Quận, Thành phố
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsReverseGeocoding(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=vi`
      )
      if (!res.ok) throw new Error('Network error')
      const data = await res.json()

      if (data && data.address) {
        const addr = data.address
        const parts: string[] = []

        // Số nhà + Tên đường
        const streetNum = addr.house_number || ''
        const road = addr.road || addr.street || addr.pedestrian || ''
        if (streetNum && road) {
          parts.push(`${streetNum} ${road}`)
        } else if (road) {
          parts.push(road)
        } else if (data.name) {
          parts.push(data.name)
        }

        // Phường / Xã
        const quarter = addr.quarter || addr.suburb || addr.neighbourhood || addr.village || ''
        if (quarter) parts.push(quarter)

        // Quận / Huyện / Thị xã
        const district = addr.city_district || addr.district || addr.county || addr.town || ''
        if (district) parts.push(district)

        // Tỉnh / Thành phố
        const city = addr.city || addr.state || ''
        if (city) parts.push(city)

        if (parts.length >= 2) {
          setAddress(parts.join(', '))
        } else if (data.display_name) {
          setAddress(data.display_name)
        }
      } else if (data && data.display_name) {
        setAddress(data.display_name)
      }
    } catch (err) {
      console.warn('Reverse geocode fallback:', err)
      // Giữ nguyên địa chỉ trước đó nếu gặp lỗi mạng
    } finally {
      setIsReverseGeocoding(false)
    }
  }, [])

  // Khởi tạo bản đồ Leaflet
  useEffect(() => {
    if (!isOpen || !isLeafletReady || !mapContainerRef.current) return

    const L = (window as any).L
    if (!L) return

    // Hủy bản đồ cũ nếu có
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 16,
        zoomControl: false,
      })

      // Layer Tiles
      const tileConfig = getTileConfig(mapLayer)
      const tileLayer = L.tileLayer(tileConfig.url, {
        maxZoom: tileConfig.maxZoom,
        attribution: tileConfig.attribution,
      }).addTo(map)
      tileLayerRef.current = tileLayer

      // Nút Zoom góc dưới phải
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      // Custom Google Red Pin Marker Icon
      const customPinIcon = L.divIcon({
        className: 'custom-google-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
            <div style="background-color: #ea4335; color: white; width: 38px; height: 38px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(234, 67, 53, 0.4); border: 2.5px solid #ffffff;">
              <div style="width: 14px; height: 14px; background-color: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
            </div>
            <div style="width: 12px; height: 5px; background: rgba(0, 0, 0, 0.35); border-radius: 50%; filter: blur(1.5px); margin-top: 2px;"></div>
          </div>
        `,
        iconSize: [40, 48],
        iconAnchor: [20, 48],
      })

      const marker = L.marker([coords.lat, coords.lng], {
        draggable: true,
        icon: customPinIcon,
      }).addTo(map)
      markerInstanceRef.current = marker

      // Kéo thả marker
      marker.on('dragend', () => {
        const position = marker.getLatLng()
        const newCoords = { lat: position.lat, lng: position.lng }
        setCoords(newCoords)
        reverseGeocode(newCoords.lat, newCoords.lng)
      })

      // Click vào vị trí bất kỳ trên bản đồ
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        const newCoords = { lat, lng }
        setCoords(newCoords)
        reverseGeocode(lat, lng)
      })

      mapInstanceRef.current = map

      // Fix render size sau khi modal hiện
      setTimeout(() => {
        map.invalidateSize()
      }, 250)
    } catch (e) {
      console.error('Error initializing map:', e)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isOpen, isLeafletReady])

  // Cập nhật Layer tile khi đổi layer (Roadmap <-> Satellite <-> OSM)
  useEffect(() => {
    if (!mapInstanceRef.current || !(window as any).L) return
    const L = (window as any).L
    const tileConfig = getTileConfig(mapLayer)

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current)
    }

    tileLayerRef.current = L.tileLayer(tileConfig.url, {
      maxZoom: tileConfig.maxZoom,
      attribution: tileConfig.attribution,
    }).addTo(mapInstanceRef.current)
  }, [mapLayer, getTileConfig])

  // Di chuyển camera và marker đến tọa độ mới
  const flyToCoords = (newCoords: MapCoordinates, newAddress?: string) => {
    setCoords(newCoords)
    if (newAddress) setAddress(newAddress)

    if (mapInstanceRef.current && markerInstanceRef.current) {
      markerInstanceRef.current.setLatLng([newCoords.lat, newCoords.lng])
      mapInstanceRef.current.flyTo([newCoords.lat, newCoords.lng], 16, { duration: 1.2 })
    }
  }

  // Tìm kiếm địa chỉ với Nominatim API (Ưu tiên Việt Nam)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&countrycodes=vn&limit=5&accept-language=vi`
      )
      const data = await res.json()
      setSearchResults(data || [])
    } catch (err) {
      console.error('Lỗi tìm kiếm địa chỉ:', err)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Chọn 1 kết quả từ danh sách tìm kiếm
  const handleSelectSearchResult = (result: {
    display_name: string
    lat: string
    lon: string
  }) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    const newCoords = { lat, lng }
    flyToCoords(newCoords, result.display_name)
    setSearchResults([])
    setSearchQuery('')
  }

  // Lấy vị trí GPS hiện tại của thiết bị
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Trình duyệt không hỗ trợ định vị GPS')
      return
    }

    setIsGpsLocating(true)
    setGpsError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGpsLocating(false)
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }
        flyToCoords(newCoords)
        reverseGeocode(newCoords.lat, newCoords.lng)
      },
      (err) => {
        setIsGpsLocating(false)
        console.warn('Geolocation error:', err)
        setGpsError('Không thể lấy vị trí GPS (vui lòng cấp quyền truy cập vị trí trên trình duyệt)')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // Xác nhận và áp dụng địa chỉ
  const handleConfirm = () => {
    onSelectAddress(address, coords)

    if (saveAsDefault && onSaveAsDefault) {
      onSaveAsDefault(address)
    }

    onClose()
  }

  if (!isOpen) return null

  // URL mở trực tiếp trên Google Maps ngoài đời
  const googleMapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[92vh] max-h-[820px] border border-slate-200 dark:border-slate-800">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
              <MapPin className="size-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight flex items-center gap-2">
                <span>{title}</span>
                <span className="hidden sm:inline-flex rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold text-white tracking-wide">
                  Live GPS &amp; Google Map Tiles
                </span>
              </h3>
              <p className="text-[11px] text-white/90">
                Kéo ghim hoặc click trên bản đồ để chọn tọa độ nhận hàng chính xác
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition cursor-pointer"
            title="Đóng modal"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Thanh công cụ tìm kiếm & điều khiển nhanh */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 space-y-2.5 shrink-0">
          {/* Ô Tìm kiếm địa chỉ */}
          <div className="relative">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nhập tên đường, địa danh, phường/xã, quận/huyện cần tìm..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white focus:border-[#ee4d2d] focus:outline-none shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ee4d2d] hover:bg-[#d73211] text-white text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isSearching ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Search className="size-3.5" />
                )}
                <span>Tìm Kiếm</span>
              </button>

              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isGpsLocating}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition shadow-sm cursor-pointer shrink-0"
                title="Lấy vị trí GPS hiện tại của tôi"
              >
                {isGpsLocating ? (
                  <Loader2 className="size-3.5 animate-spin text-blue-500" />
                ) : (
                  <Crosshair className="size-3.5 text-blue-500" />
                )}
                <span className="hidden sm:inline">Vị Trí Hiện Tại</span>
              </button>
            </form>

            {/* Dropdown gợi ý kết quả tìm kiếm */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl p-1.5">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Kết quả tìm kiếm ({searchResults.length})</span>
                  <button
                    onClick={() => setSearchResults([])}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                  >
                    ×
                  </button>
                </div>
                {searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <MapPin className="size-4 text-[#ee4d2d] shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{res.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick presets & Layer buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar max-w-full">
              <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0 flex items-center gap-1">
                <Building2 className="size-3" /> Gợi ý:
              </span>
              {VIETNAM_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => flyToCoords(preset.coords, preset.address)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-[#ee4d2d] hover:text-[#ee4d2d] transition whitespace-nowrap cursor-pointer shadow-2xs"
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {/* Chuyển đổi lớp bản đồ Google (Roadmap vs Satellite) */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => setMapLayer('google_roadmap')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  mapLayer === 'google_roadmap'
                    ? 'bg-[#ee4d2d] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Google Đường Phố
              </button>
              <button
                type="button"
                onClick={() => setMapLayer('google_satellite')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  mapLayer === 'google_satellite'
                    ? 'bg-[#ee4d2d] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Google Vệ Tinh
              </button>
              <button
                type="button"
                onClick={() => setMapLayer('osm')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  mapLayer === 'osm'
                    ? 'bg-[#ee4d2d] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                OSM
              </button>
            </div>
          </div>

          {gpsError && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-900">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{gpsError}</span>
            </div>
          )}
        </div>

        {/* Khung Bản Đồ Trực Quan */}
        <div className="relative flex-1 w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
          {/* Container Leaflet */}
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Indicator Đang tải bản đồ */}
          {!isLeafletReady && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-xs">
              <Loader2 className="size-8 animate-spin text-[#ee4d2d] mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Đang nạp dữ liệu bản đồ Google Maps...
              </p>
            </div>
          )}

          {/* Huy hiệu tọa độ góc trên */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none">
            <div className="rounded-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-3 py-1.5 shadow-md border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </span>
            </div>
          </div>

          {/* Nút mở trực tiếp bản đồ ngoài */}
          <div className="absolute top-3 right-3 z-20">
            <a
              href={googleMapsExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-3 py-1.5 shadow-md border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-white transition cursor-pointer"
            >
              <span>Mở Google Maps</span>
              <ExternalLink className="size-3" />
            </a>
          </div>

          {/* Hướng dẫn góc dưới trái */}
          <div className="absolute bottom-3 left-3 z-20 pointer-events-none hidden sm:block">
            <div className="rounded-xl bg-slate-900/80 backdrop-blur-md px-3 py-1.5 text-[11px] text-white/90 shadow-md">
              💡 Bấm chuột hoặc kéo ghim đỏ để chọn vị trí mong muốn
            </div>
          </div>
        </div>

        {/* Footer: Thông tin địa chỉ đã chọn & Nút xác nhận */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <MapPin className="size-3 text-[#ee4d2d]" /> Địa chỉ giao hàng đã chọn:
                </span>
                {isReverseGeocoding && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-500">
                    <Loader2 className="size-3 animate-spin" /> Đang định vị địa chỉ...
                  </span>
                )}
              </div>

              {/* Textarea cho phép chỉnh sửa thêm số nhà hoặc ghi chú chi tiết */}
              <div className="relative">
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Địa chỉ chi tiết..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-medium text-slate-900 dark:text-white focus:border-[#ee4d2d] focus:outline-none resize-none shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Tùy chọn lưu làm địa chỉ mặc định */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              {showSaveAsDefaultOption && (
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveAsDefault}
                    onChange={(e) => setSaveAsDefault(e.target.checked)}
                    className="rounded border-slate-300 text-[#ee4d2d] focus:ring-[#ee4d2d] size-4"
                  />
                  <span>Lưu làm địa chỉ nhận hàng mặc định cho tài khoản của tôi</span>
                </label>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Hủy Bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ee4d2d] to-orange-500 hover:from-[#d73211] hover:to-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/25 transition active:scale-95 cursor-pointer"
              >
                <Check className="size-4" />
                <span>Xác Nhận Địa Chỉ Này</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

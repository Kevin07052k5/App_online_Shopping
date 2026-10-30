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
  Radio,
} from 'lucide-react'
import {
  detectRealCurrentLocation,
  reverseGeocodeToVietnameseAddress,
} from '@/src/services/locationService'

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

// Preset các địa điểm phổ biến tại Việt Nam để test nhanh / demo nếu cần
const VIETNAM_PRESETS: Array<{
  name: string
  label: string
  address: string
  coords: MapCoordinates
}> = [
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
  initialCoords,
  showSaveAsDefaultOption = false,
  onSaveAsDefault,
  title = 'Định Vị Vị Trí Giao Hàng Trên Google Maps',
}: GoogleMapAddressPickerModalProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerInstanceRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)

  const [coords, setCoords] = useState<MapCoordinates>(
    initialCoords || { lat: 10.823, lng: 106.629 }
  )
  const [address, setAddress] = useState<string>(initialAddress || '')
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
  const [locationSource, setLocationSource] = useState<
    'GPS_HARDWARE' | 'IP_NETWORK' | 'MANUAL'
  >('MANUAL')
  const [gpsMessage, setGpsMessage] = useState<string | null>(null)
  const [gpsError, setGpsError] = useState<string | null>(null)

  // Tải thư viện Leaflet CSS & JS qua CDN động
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return

      if (!document.getElementById('leaflet-css-cdn')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css-cdn'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

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

  // Lấy URL Tile cho từng chế độ bản đồ
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
      const formatted = await reverseGeocodeToVietnameseAddress(lat, lng)
      setAddress(formatted)
    } catch (err) {
      console.warn('Reverse geocode error:', err)
    } finally {
      setIsReverseGeocoding(false)
    }
  }, [])

  // Di chuyển camera và marker đến tọa độ mới
  const flyToCoords = useCallback((newCoords: MapCoordinates, newAddress?: string) => {
    setCoords(newCoords)
    if (newAddress) setAddress(newAddress)

    if (mapInstanceRef.current && markerInstanceRef.current) {
      markerInstanceRef.current.setLatLng([newCoords.lat, newCoords.lng])
      mapInstanceRef.current.flyTo([newCoords.lat, newCoords.lng], 16, { duration: 1.2 })
    }
  }, [])

  // HÀM ĐỊNH VỊ VỊ TRÍ HIỆN TẠI THỜI GIAN THỰC (GPS + IP FALLBACK)
  const handleGetCurrentLocation = useCallback(async () => {
    setIsGpsLocating(true)
    setGpsError(null)
    setGpsMessage(null)

    try {
      const result = await detectRealCurrentLocation()
      if (result.success) {
        flyToCoords(result.coords, result.address)
        setLocationSource(result.source)
        if (result.source === 'GPS_HARDWARE') {
          setGpsMessage('Đã định vị thành công bằng GPS thiết bị thực tế')
        } else {
          setGpsMessage('Đã định vị thành công qua vị trí mạng Internet thực tế')
        }
      } else {
        setGpsError(result.error || 'Không thể xác định vị trí hiện tại')
      }
    } catch (err: any) {
      console.error('Lỗi định vị vị trí hiện tại:', err)
      setGpsError('Không thể lấy vị trí hiện tại. Vui lòng cấp quyền hoặc kéo ghim trên bản đồ.')
    } finally {
      setIsGpsLocating(false)
    }
  }, [flyToCoords])

  // Khởi tạo tọa độ hoặc TỰ ĐỘNG ĐỊNH VỊ THỰC TẾ khi mở modal
  useEffect(() => {
    if (!isOpen) return

    setSearchQuery('')
    setSearchResults([])
    setGpsError(null)
    setGpsMessage(null)

    if (initialAddress && initialAddress.trim() !== '') {
      setAddress(initialAddress)
      if (initialCoords && initialCoords.lat && initialCoords.lng) {
        setCoords(initialCoords)
      }
    } else {
      // Nếu chưa có địa chỉ nhập sẵn: TỰ ĐỘNG LẤY VỊ TRÍ HIỆN TẠI THỰC TẾ CỦA KHÁCH HÀNG!
      handleGetCurrentLocation()
    }
  }, [isOpen, initialAddress, initialCoords, handleGetCurrentLocation])

  // Khởi tạo bản đồ Leaflet
  useEffect(() => {
    if (!isOpen || !isLeafletReady || !mapContainerRef.current) return

    const L = (window as any).L
    if (!L) return

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

      const tileConfig = getTileConfig(mapLayer)
      const tileLayer = L.tileLayer(tileConfig.url, {
        maxZoom: tileConfig.maxZoom,
        attribution: tileConfig.attribution,
      }).addTo(map)
      tileLayerRef.current = tileLayer

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      // Custom Google Red Pin Marker Icon
      const customPinIcon = L.divIcon({
        className: 'custom-google-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
            <div style="background-color: #ea4335; color: white; width: 38px; height: 38px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(234, 67, 53, 0.45); border: 2.5px solid #ffffff;">
              <div style="width: 14px; height: 14px; background-color: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
            </div>
            <div style="width: 14px; height: 5px; background: rgba(0, 0, 0, 0.35); border-radius: 50%; filter: blur(1.5px); margin-top: 2px;"></div>
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

      // Khi người dùng kéo thả ghim
      marker.on('dragend', () => {
        const position = marker.getLatLng()
        const newCoords = { lat: position.lat, lng: position.lng }
        setCoords(newCoords)
        setLocationSource('MANUAL')
        setGpsMessage('Vị trí được chọn bằng kéo thả ghim')
        reverseGeocode(newCoords.lat, newCoords.lng)
      })

      // Khi người dùng click bất kỳ đâu trên bản đồ
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        const newCoords = { lat, lng }
        setCoords(newCoords)
        setLocationSource('MANUAL')
        setGpsMessage('Vị trí được chọn bằng click chuột trên bản đồ')
        reverseGeocode(lat, lng)
      })

      mapInstanceRef.current = map

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

  // Cập nhật Layer tile khi đổi layer
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

  // Tìm kiếm địa chỉ với Nominatim API
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
    setLocationSource('MANUAL')
    setGpsMessage(`Đã chọn từ tìm kiếm: ${result.display_name.slice(0, 40)}...`)
    setSearchResults([])
    setSearchQuery('')
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
                  Định Vị Thời Gian Thực
                </span>
              </h3>
              <p className="text-[11px] text-white/90">
                Tự động lấy vị trí thực tế của bạn hoặc kéo ghim đỏ để chọn vị trí mong muốn
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

        {/* Thanh công cụ tìm kiếm & nút Định vị thực tế */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 space-y-2.5 shrink-0">
          <div className="relative">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nhập tên đường, địa danh, tòa nhà cần tìm..."
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

              {/* NÚT LẤY VỊ TRÍ HIỆN TẠI THỰC TẾ */}
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isGpsLocating}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer shrink-0 active:scale-95 disabled:opacity-50"
                title="Lấy vị trí thực tế của thiết bị / mạng Internet hiện tại"
              >
                {isGpsLocating ? (
                  <Loader2 className="size-3.5 animate-spin text-white" />
                ) : (
                  <Crosshair className="size-3.5 text-white" />
                )}
                <span>🎯 Lấy Vị Trí Hiện Tại</span>
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
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar max-w-full">
              <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0 flex items-center gap-1">
                <Building2 className="size-3" /> Địa điểm khác:
              </span>
              {VIETNAM_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    flyToCoords(preset.coords, preset.address)
                    setLocationSource('MANUAL')
                    setGpsMessage(`Đã chọn: ${preset.name}`)
                  }}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-[#ee4d2d] hover:text-[#ee4d2d] transition whitespace-nowrap cursor-pointer shadow-2xs"
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {/* Chuyển đổi lớp bản đồ */}
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

          {/* Banner thông báo trạng thái định vị thực tế */}
          {gpsMessage && (
            <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                <span>{gpsMessage}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 font-bold">
                {locationSource === 'GPS_HARDWARE'
                  ? '🛰️ GPS Thiết Bị'
                  : locationSource === 'IP_NETWORK'
                  ? '🌐 Mạng Internet'
                  : '📍 Thủ Công'}
              </span>
            </div>
          )}

          {gpsError && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-900">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{gpsError}</span>
            </div>
          )}
        </div>

        {/* Khung Bản Đồ Trực Quan */}
        <div className="relative flex-1 w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {!isLeafletReady && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-xs">
              <Loader2 className="size-8 animate-spin text-[#ee4d2d] mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Đang nạp dữ liệu bản đồ Google Maps...
              </p>
            </div>
          )}

          {/* Huy hiệu tọa độ thực */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none">
            <div className="rounded-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-3 py-1.5 shadow-md border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </span>
            </div>
          </div>

          {/* Nút mở trực tiếp Google Maps */}
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

          <div className="absolute bottom-3 left-3 z-20 pointer-events-none hidden sm:block">
            <div className="rounded-xl bg-slate-900/80 backdrop-blur-md px-3 py-1.5 text-[11px] text-white/90 shadow-md">
              💡 Bấm chuột hoặc kéo ghim đỏ để điều chỉnh vị trí chính xác
            </div>
          </div>
        </div>

        {/* Footer: Địa chỉ đã chọn & Nút xác nhận */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <MapPin className="size-3 text-[#ee4d2d]" /> Địa chỉ giao hàng đã định vị:
                </span>
                {isReverseGeocoding && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-500">
                    <Loader2 className="size-3 animate-spin" /> Đang cập nhật địa chỉ...
                  </span>
                )}
                {isGpsLocating && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-blue-500">
                    <Loader2 className="size-3 animate-spin" /> Đang định vị thời gian thực...
                  </span>
                )}
              </div>

              <div className="relative">
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Địa chỉ định vị sẽ hiển thị tại đây (hoặc nhập số nhà, tầng, phòng cụ thể)..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs font-medium text-slate-900 dark:text-white focus:border-[#ee4d2d] focus:outline-none resize-none shadow-2xs"
                />
              </div>
            </div>
          </div>

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

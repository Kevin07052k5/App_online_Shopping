import { Voucher } from '@/src/types/marketplace'

export const MOCK_VOUCHERS: Voucher[] = [
  {
    code: 'FREESHIP_MAX',
    name: 'Freeship Xtra Toàn Quốc',
    description: 'Giảm 30.000₫ phí vận chuyển cho đơn hàng từ 150.000₫',
    type: 'FREESHIP',
    discountValue: 30000,
    minOrderAmount: 150000,
  },
  {
    code: 'TECH_SUPER_SALE',
    name: 'Siêu Sale Đồ Công Nghệ',
    description: 'Giảm 15% tối đa 500.000₫ cho các sản phẩm thiết bị điện tử',
    type: 'PERCENT',
    discountValue: 15,
    maxDiscount: 500000,
    minOrderAmount: 500000,
  },
  {
    code: 'VOUCHER_HACK_90',
    name: 'Mã Giảm Giá Lỗ Hổng 90% (Kịch Bản Tấn Công)',
    description: 'Mã giảm giá nội bộ 90% bị rò rỉ - Kẻ gian lợi dụng botnet để trục lợi sàn',
    type: 'PERCENT',
    discountValue: 90,
    maxDiscount: 20000000,
    minOrderAmount: 100000,
    isExploitMock: true,
  },
]

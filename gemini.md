### SYSTEM ROLE & INSTRUCTION:
Bạn là một Senior Full-Stack Architect & Cyber Security Specialist. Hãy khởi tạo và lập trình hoàn chỉnh một Ứng dụng Web Đơn trang (Single Page Application - SPA) theo chuẩn Production-Ready bằng React, TypeScript, Tailwind CSS và Lucide Icons.

Đề tài: "HỆ THỐNG PHÁT HIỆN GIAN LẬN VÀ MÃ HÓA ĐƠN HÀNG BẰNG AI - NỀN TẢNG SÀN THƯƠNG MẠI ĐIỆN TỬ (MÔ HÌNH SHOPEE / LAZADA)"

---

### YÊU CẦU KIẾN TRÚC THƯ MỤC DỰ ÁN (PROJECT DIRECTORY TREE):
Agent hãy scaffold và sinh đầy đủ toàn bộ mã nguồn theo đúng cấu trúc sau (không dùng mã giữ chỗ `// TODO` hay cắt bớt code):

marketplace-ai-security/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   ├── marketplace.ts      # Định nghĩa Category, Product, Voucher, CartItem
    │   ├── order.ts            # OrderPayload, EncryptedOrder, FulfillmentStatus
    │   ├── fraud.ts            # RiskScore, RiskLevel, Decision, AIExplanation
    │   └── crypto.ts           # CiphertextPackage, BlindIndex, IntegrityReport
    ├── data/
    │   ├── mockProducts.ts     # Dữ liệu sản phẩm đa ngành hàng chuẩn Shopee/Lazada
    │   └── mockVouchers.ts     # Danh sách mã giảm giá sàn & mã freeship
    ├── services/
    │   ├── geminiAiService.ts  # Tích hợp Gemini API phân tích gian lận + Heuristic Fallback
    │   └── webCryptoService.ts # Web Crypto API (AES-256-GCM, PBKDF2, HMAC-SHA256, SHA-256)
    ├── context/
    │   ├── MarketplaceContext.tsx # Quản lý Catalog, Giỏ hàng, Voucher áp dụng
    │   └── SecurityOrderContext.tsx # Quản lý Đơn hàng mã hóa, CSDL mô phỏng, Trạng thái Fulfillment
    ├── components/
    │   ├── layout/
    │   │   ├── MarketplaceHeader.tsx  # Navbar phong cách Shopee (Cam/Đỏ hoặc Navy), Search bar, Cart badge, View Switcher
    │   │   └── ViewModeSwitcher.tsx   # Chuyển đổi Khách mua hàng <-> Trung tâm Quản trị An ninh
    │   ├── storefront/
    │   │   ├── BannerCarousel.tsx     # Banner Flash Sale & Siêu Sale phong cách sàn TMĐT
    │   │   ├── CategoryGrid.tsx       # Lưới danh mục: Điện tử, Thời trang, Nhà cửa đời sống, Phụ kiện
    │   │   ├── ProductCard.tsx        # Card sản phẩm: Tag giảm giá, đánh giá sao, số lượng đã bán
    │   │   ├── CartDrawer.tsx         # Giỏ hàng bên phải, chọn sản phẩm, áp voucher
    │   │   ├── CheckoutModal.tsx      # Modal thanh toán + 3 Preset Buttons cho Hội đồng chấm thi
    │   │   └── OtpVerificationModal.tsx # Modal nhập OTP khi AI kích hoạt CHALLENGE_OTP
    │   ├── admin/
    │   │   ├── AdminSidebar.tsx       # Điều hướng 4 phân hệ quản trị
    │   │   ├── FraudDashboard.tsx     # Tab 1: Chỉ số gian lận, Biểu đồ rủi ro, Thống kê đơn
    │   │   ├── RiskAuditQueue.tsx     # Tab 2: Hàng đợi duyệt đơn nghi vấn + Panel Explainable AI
    │   │   ├── FulfillmentKanban.tsx  # Tab 3: Quy trình chuẩn bị hàng, Đóng gói, Vận chuyển 4 bước
    │   │   └── EncryptedDbExplorer.tsx # Tab 4: CSDL mã hóa, Tra cứu Blind Index, Thử nghiệm hack DB
    │   └── common/
    │       ├── CryptoVisualizerModal.tsx # Modal diễn họa đồ họa luồng mã hóa phong bì
    │       └── NotificationToast.tsx     # Toast thông báo real-time
    └── utils/
        └── helpers.ts                 # Format tiền tệ VNĐ, rút gọn chuỗi Hex, tạo ID ngẫu nhiên

---

### CHI TIẾT NGHIỆP VỤ & KỸ THUẬT TỪNG MODULE:

#### 1. DỮ LIỆU ĐA NGÀNH HÀNG (`src/data/mockProducts.ts` & `mockVouchers.ts`):
- Sản phẩm chuẩn sàn Shopee/Lazada thuộc 4 nhóm ngành:
  * **Thiết bị Điện tử & Công nghệ:** Laptop Gaming RTX 4050 (24.990.000đ), Tai nghe chống ồn Bluetooth (1.450.000đ), Bàn phím cơ Rapid Trigger (1.890.000đ), Chuột Gaming siêu nhẹ (990.000đ).
  * **Thời trang & Phụ kiện:** Áo thun Oversize Unisex (189.000đ), Balo công nghệ chống nước (450.000đ), Giày thể thao cầu lông (850.000đ).
  * **Nhà cửa & Đời sống:** Đèn bàn thông minh LED (320.000đ), Máy lọc không khí mini (1.290.000đ).
  * **Bách hóa Online:** Hộp hạt dinh dưỡng sấy khô (195.000đ).
  Mỗi sản phẩm có trường: `id`, `name`, `category`, `price`, `discountPercent`, `rating`, `soldCount`, `image`, `stock`.
- Hệ thống Voucher sàn:
  * `FREESHIP_MAX`: Giảm 30.000đ phí vận chuyển (Đơn tối thiểu 150.000đ).
  * `TECH_SUPER_SALE`: Giảm 15% tối đa 500.000đ cho đơn đồ công nghệ.
  * `VOUCHER_HACK_90`: Giảm 90% (Dành riêng cho kịch bản mô phỏng kẻ gian trục lợi mã lỗi).

#### 2. ENGINE MẬT MÃ TẦNG ỨNG DỤNG (`src/services/webCryptoService.ts`):
Sử dụng 100% `window.crypto.subtle` của trình duyệt:
- **AES-256-GCM:** 
  * Hàm `encryptOrderPII(piiData: object)`: Mã hóa các trường `customerName`, `phoneNumber`, `deliveryAddress`, `cardNumber`. Trả về `{ ciphertextHex, ivHex, authTagHex }`.
  * Hàm `decryptOrderPII(ciphertextHex, ivHex, authTagHex)`: Giải mã và xác thực tính toàn vẹn qua GMAC. Ném lỗi nếu dữ liệu bị thay đổi dù chỉ 1 bit.
- **HMAC-SHA256 Blind Index:**
  * Hàm `computeBlindIndex(plaintext: string)`: Băm số điện thoại chuẩn hóa với khóa bí mật để tạo chỉ mục mù tìm kiếm $O(1)$.
- **Băm toàn vẹn SHA-256:**
  * Hàm `computeRecordChecksum(record: object)`: Băm toàn bộ trạng thái đơn hàng để làm mã niêm phong.

#### 3. AI PHÁT HIỆN GIAN LẬN SÀN TMĐT (`src/services/geminiAiService.ts`):
- Gọi Google Gemini API (`gemini-1.5-flash` hoặc endpoint tương đương) với đầu vào Payload:
  ```json
  {
    "orderId": "ORD-2026-X89",
    "totalAmount": 26880000,
    "discountAmount": 15000000,
    "voucherCode": "VOUCHER_HACK_90",
    "itemsCount": 5,
    "paymentMethod": "CREDIT_CARD",
    "deviceEntropy": "Headless Chrome / Linux x86_64",
    "clientIp": "194.26.29.112 (Proxy/Datacenter IP)",
    "checkoutVelocitySec": 1.2,
    "customerEmail": "bot_farmer_88@tempmail.io"
  }
  ```
- System Prompt yêu cầu Gemini đóng vai trò Chuyên gia Kiểm toán Gian lận TMĐT và trả về JSON:
  `{ riskScore: number (0-100), riskLevel: "LOW"|"MEDIUM"|"HIGH", decision: "APPROVED"|"CHALLENGE_OTP"|"HOLD_REVIEW", reasons: string[], summary: string }`
- **Fallback Engine:** Tự động phát hiện các rule gian lận (giảm giá > 50%, thời gian đặt < 3s, email domain rác) nếu người dùng chưa nhập `GEMINI_API_KEY` trong phần cài đặt.

#### 4. GIAO DIỆN THANH TOÁN & 3 PRESET DEMO HỘI ĐỒNG (`src/components/storefront/CheckoutModal.tsx`):
Tích hợp sẵn 3 nút kịch bản bấm ăn ngay:
- **[Kịch bản 1: Mua hàng Hợp lệ]:** Khách mua 1 Bàn phím cơ, áp mã freeship, thanh toán COD, thông tin cá nhân rõ ràng. $\rightarrow$ AI đánh giá: **LOW RISK (5–15 điểm)** $\rightarrow$ Duyệt đơn tự động.
- **[Kịch bản 2: Nghi vấn Chiếm quyền / Thẻ lạ]:** Khách mua Laptop Gaming giá trị cao bằng Thẻ tín dụng, IP bất thường. $\rightarrow$ AI đánh giá: **MEDIUM RISK (45–65 điểm)** $\rightarrow$ Mở popup yêu cầu nhập mã OTP xác thực qua SĐT.
- **[Kịch bản 3: Bot Farm Voucher / Spam Đơn]:** Tài khoản dùng email `@tempmail.io`, áp voucher giảm 90%, thời gian bấm checkout 0.8 giây. $\rightarrow$ AI đánh giá: **HIGH RISK (88–98 điểm)** $\rightarrow$ Tạm giữ đơn hàng để chuyên viên thẩm định.

#### 5. QUY TRÌNH QUẢN TRỊ & VẬN HÀNH KHO (`src/components/admin/`):
- **Tab 1 - Dashboard An ninh:** Thẻ số liệu (Tổng đơn, Doanh thu, Tỷ lệ đơn gian lận bị chặn, Tiết kiệm ngân sách voucher). Biểu đồ trực quan phân bố điểm rủi ro AI.
- **Tab 2 - Hàng đợi Kiểm duyệt Rủi ro:** Danh sách đơn MEDIUM và HIGH. Click vào đơn sẽ mở ngăn **Explainable AI (XAI)** hiển thị toàn bộ phân tích nguyên nhân của Gemini AI. Admin có nút `Phê duyệt` hoặc `Hủy & Khóa tài khoản`.
- **Tab 3 - Vòng đời Đóng gói & Vận chuyển (Kanban 4 bước chuẩn TMĐT):**
  1. `Đã duyệt thanh toán`
  2. `Người bán đang đóng gói` (Kiểm kho, bọc chống sốc, niêm phong)
  3. `Đang vận chuyển` (Bàn giao cho đơn vị vận chuyển SPX Express/J&T)
  4. `Giao hàng thành công`
  Có nút chuyển trạng thái tức thời kèm toast thông báo.
- **Tab 4 - CSDL Mã hóa & Phòng thí nghiệm Tấn công (Encrypted DB Explorer):**
  * Bảng hiển thị CSDL sàn: Các cột tên, SĐT, địa chỉ hiển thị chuỗi hex mã hóa (Ciphertext + IV + GMAC Tag).
  * **Ô tra cứu Blind Index:** Gõ SĐT `0908123456`, hệ thống tự tính mã băm HMAC-SHA256 và lọc đúng đơn hàng mà không cần giải mã DB.
  * **Nút "Cố tình sửa đổi 1 byte trong CSDL":** Thay đổi 1 ký tự trong Ciphertext của đơn hàng bất kỳ.
  * **Nút "Kiểm tra toàn vẹn (Verify Integrity)":** Chạy đối soát GMAC Tag và Checksum SHA-256. Hệ thống hiển thị ngay cảnh báo màu đỏ: *"VI PHẠM TÍNH TOÀN VẸN: Dữ liệu đơn hàng đã bị can thiệp trái phép trên CSDL!"*

---

### YÊU CẦU CHẤT LƯỢNG MÃ NGUỒN:
1. Toàn bộ code viết bằng TypeScript sạch, có đầy đủ kiểu dữ liệu, không sử dụng `any`.
2. Tạo file `package.json` với các dependency: `react`, `react-dom`, `lucide-react`, `clsx`, `tailwind-merge`.
3. Cung cấp file `.env.example` hướng dẫn cấu hình `VITE_GEMINI_API_KEY`.
4. Giao diện được thiết kế hiện đại, responsive, hoàn toàn bằng tiếng Việt chuẩn thuật ngữ TMĐT và An toàn thông tin.
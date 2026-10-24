# GROUP 9 — HỆ THỐNG PHÁT HIỆN GIAN LẬN VÀ MÃ HÓA ĐƠN HÀNG BẰNG AI
### Nền Tảng Sàn Thương Mại Điện Tử Group 9

Hệ thống Single Page Application (SPA) toàn diện, tích hợp trí tuệ nhân tạo (Explainable AI - XAI) và mật mã học hiện đại (Web Crypto API) nhằm giải quyết bài toán cốt lõi trong thương mại điện tử: **Ngăn chặn gian lận đơn hàng theo thời gian thực** và **Bảo vệ dữ liệu định danh cá nhân (PII) theo tiêu chuẩn Zero-Knowledge Database**.

---

## 🌟 TÍNH NĂNG NỔI BẬT

### 1. Storefront Giao Diện Group 9 (Trải nghiệm Người Mua)
- **Hệ Thống Đăng Ký & Đăng Nhập Đa Kênh**:
  - **Đăng nhập / Đăng ký bằng Google**: Xác thực nhanh thông tin tài khoản Google.
  - **Đăng nhập / Đăng ký bằng Apple ID**: Xác thực bảo mật chuẩn Apple.
  - **Đăng ký bằng cách điền thông tin**: Họ tên, Email, Số điện thoại (sinh Blind Index), Mật khẩu và cam kết bảo vệ PII.
  - **Tự động điền (Auto-prefill)**: Khi người dùng đã đăng nhập, thông tin PII sẽ tự động được điền vào form thanh toán đơn hàng.
- **Danh mục đa dạng (4 ngành hàng)**: Điện Tử & Công Nghệ, Thời Trang & Phụ Kiện, Nhà Cửa & Đời Sống, Bách Hóa Online.
- **Banner Carousel Flash Sale**: Tự động chuyển đổi các chương trình khuyến mãi giờ vàng.
- **Giỏ hàng trượt (Cart Drawer)**: Quản lý số lượng, tính phí vận chuyển động (SPX Express), nhập mã giảm giá sàn.
- **Modal Thanh toán với 3 Kịch bản Demo 1-Click (Phục vụ Báo cáo & Bảo vệ Đồ án)**:
  1. *Kịch bản 1 — Khách hàng bình thường (Điểm rủi ro thấp, Tự động duyệt)*: Mua sắm tự nhiên, IP nội địa, số điện thoại sạch, duyệt giỏ hàng > 40 giây.
  2. *Kịch bản 2 — Giá trị cao / Tốc độ bất thường (Cảnh báo, Yêu cầu OTP)*: Đơn hàng giá trị lớn, thẻ quốc tế, tốc độ checkout quá nhanh (3 giây) $\rightarrow$ kích hoạt xác minh OTP 6 số.
  3. *Kịch bản 3 — Bot Gian lận / Voucher Hack / IP Blacklist (Chặn đứng)*: Áp dụng voucher khai thác `VOUCHER_HACK_90`, IP thuộc dải proxy/VPN, số điện thoại trong danh sách đen, tốc độ bot < 1 giây $\rightarrow$ AI từ chối tức thì (REJECTED).
- **Thử thách OTP (Risk-based Authentication)**: Tự động kích hoạt khi mức độ rủi ro ở ngưỡng `CHALLENGE_OTP`.

### 2. Trung Tâm Quản Trị An Ninh & Kho Vận (`http://localhost:3000/admin`)
- **Cổng Đăng Nhập Bảo Mật Cho Quản Trị Viên**:
  - URL truy cập riêng biệt: **`http://localhost:3000/admin`**
  - Tên đăng nhập: **`admin`**
  - Mật khẩu: **`admin`**
  - Hỗ trợ nút *"Điền nhanh"* phục vụ báo cáo và bảo vệ đồ án trực tiếp.
  - Tự động chặn truy cập trái phép nếu chưa đăng nhập quyền admin.
- **Tab 1: Dashboard Thống Kê Gian Lận (Metrics & Distribution)**:
  - 4 thẻ KPI: Tổng đơn hàng, Tỷ lệ duyệt tự động (%), Đơn cần hậu kiểm, Đơn gian lận bị chặn.
  - Biểu đồ phân bổ mức độ rủi ro (Low Risk, Medium Risk, High Risk) và tỷ lệ phương thức thanh toán.
  - Bảng top các nguyên nhân gian lận phổ biến nhất được AI phát hiện.
- **Tab 2: Hàng Đợi Kiểm Tra Gian Lận (Risk Audit Queue & XAI Panel)**:
  - Lọc và tìm kiếm đơn hàng theo cấp độ rủi ro (`CRITICAL`, `ELEVATED`, `NORMAL`).
  - Thao tác hậu kiểm nhanh: Phê duyệt thủ công, Hủy đơn rủi ro cao, Yêu cầu bổ sung xác minh KYC.
  - Modal **Explainable AI (XAI)** chi tiết: Minh bạch hóa quyết định của mô hình AI (Lý do cụ thể, thời gian đánh giá, khuyến nghị nghiệp vụ).
- **Tab 3: Kanban Vận Hành Đơn Hàng (Fulfillment Pipeline)**:
  - 4 cột trạng thái: `PAID_APPROVED` (Đã duyệt) $\rightarrow$ `PACKING` (Đang đóng gói) $\rightarrow$ `SHIPPING` (Đang giao hàng) $\rightarrow$ `DELIVERED` (Đã giao thành công).
  - Tự động khóa không cho đẩy sang đóng gói đối với các đơn hàng chưa được phê duyệt an ninh.
- **Tab 4: Trình Khám Phá Cơ Sở Dữ Liệu Mã Hóa (Encrypted Database Explorer)**:
  - **Mô phỏng Database Server**: Toàn bộ PII (Họ tên, SĐT, Địa chỉ, Số thẻ) được lưu trữ dưới dạng bản mã Hex (Ciphertext + IV + GMAC Tag).
  - **Blind Index HMAC-SHA256**: Cho phép tìm kiếm chính xác bản ghi qua Số điện thoại với độ phức tạp $O(1)$ mà **không cần giải mã** toàn bộ cơ sở dữ liệu.
  - **Nút "Quyền Giải Mã Thẩm Quyền" (Authorized Decrypt)**: Chuyển đổi giữa chế độ xem bản mã (Zero-Knowledge) và bản rõ dành cho nhân sự có thẩm quyền.
  - **Mô phỏng Tấn công Thay đổi Dữ liệu (1-byte Tamper Attack)**:
    - Kẻ tấn công sửa đổi 1 byte trong Ciphertext (ví dụ đổi địa chỉ giao hàng để chiếm đoạt tài sản).
    - Hệ thống thực thi **Xác minh Tính toàn vẹn (Integrity Check)**: Web Crypto API ngay lập tức phát hiện sai lệch GMAC Authentication Tag và SHA-256 Checksum, đưa ra cảnh báo đỏ và chặn đơn hàng ngay lập tức.
    - Hỗ trợ nút phục hồi nguyên trạng đơn hàng sau khi kiểm thử.

---

## 🔒 KIẾN TRÚC MẬT MÃ HỌC (CRYPTOGRAPHY ENGINE)

Tất cả các thuật toán bảo mật được hiện thực chuẩn hóa thông qua **Native Browser Web Crypto API** (`window.crypto.subtle`):

| Thành Phần | Thuật Toán Chuẩn | Cơ Chế & Mục Đích |
| :--- | :--- | :--- |
| **Mã hóa PII** | **AES-256-GCM** | Mã hóa đối xứng có xác thực. Mỗi trường dữ liệu có IV 96-bit ngẫu nhiên và GMAC Authentication Tag 128-bit chống giả mạo. |
| **Dẫn xuất Khóa** | **PBKDF2-HMAC-SHA256** | Chuyển đổi Master Secret Key thành CryptoKey với 100,000 vòng lặp (iterations) và Salt ngẫu nhiên. |
| **Tìm kiếm Bảo mật** | **Blind Index (HMAC-SHA256)** | Tạo mã băm chỉ mục trên số điện thoại chuẩn hóa, cho phép tìm kiếm chính xác mà không làm lộ số điện thoại gốc. |
| **Toàn vẹn Bản ghi** | **SHA-256 Checksum** | Băm toàn bộ nội dung đơn hàng (Items, Tổng tiền, Trạng thái) thành chữ ký kiểm tra chống sửa đổi logic. |

---

## 🤖 ĐỘNG CƠ TRÍ TUỆ NHÂN TẠO (AI FRAUD ENGINE)

Hệ thống tích hợp 2 lớp phân tích gian lận:
1. **Google Gemini 1.5 Flash (Trực tuyến)**: Phân tích sâu ngữ cảnh giỏ hàng, thói quen duyệt web, địa chỉ IP, phương thức thanh toán và mã voucher để đưa ra điểm số rủi ro (0 - 100) kèm lý giải chi tiết (XAI).
2. **Deterministic Heuristic Fallback Engine (Dự phòng / Ngoại tuyến)**: Hoạt động tức thì khi không có kết nối internet hoặc chưa cấu hình API key, đảm bảo 100% các kịch bản demo luôn phản hồi ổn định trong buổi bảo vệ đồ án.

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN

### Yêu cầu tiên quyết
- **Node.js**: v18.0.0 trở lên
- **npm** hoặc **pnpm**

### Cài đặt và Khởi chạy
```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi chạy máy chủ phát triển
npm run dev

# 3. Mở trình duyệt tại địa chỉ
http://localhost:3000
```

### Cấu hình Gemini API Key (Tùy chọn)
- Sao chép file `.env.example` thành `.env.local`:
  ```bash
  cp .env.example .env.local
  ```
- Hoặc nhập trực tiếp Google Gemini API Key tại thanh Header trong giao diện ứng dụng.

---

## 📋 KỊCH BẢN DEMO PHỤC VỤ BÁO CÁO ĐỒ ÁN (THESIS DEFENSE CHEATSHEET)

| Kịch Bản | Thao Tác | Kết Quả Mong Đợi |
| :--- | :--- | :--- |
| **Demo 1: Mua Hàng Hợp Lệ** | Tại Storefront $\rightarrow$ Giỏ hàng $\rightarrow$ Chọn Preset 1 $\rightarrow$ Thanh toán | AI chấm Risk Score < 20 (Low Risk) $\rightarrow$ Tự động chuyển đơn sang trạng thái `PAID_APPROVED` $\rightarrow$ Kanban hiển thị sẵn sàng đóng gói. |
| **Demo 2: Xác Thực Bước Hai (Step-up OTP)** | Chọn Preset 2 $\rightarrow$ Bấm Thanh toán | Risk Score 40 - 70 (Medium Risk) $\rightarrow$ Kích hoạt modal OTP $\rightarrow$ Nhập mã OTP demo `888999` $\rightarrow$ Đơn hàng được phê duyệt. |
| **Demo 3: Chặn Đứng Bot Hack Voucher** | Chọn Preset 3 $\rightarrow$ Bấm Thanh toán | Risk Score > 80 (High Risk) $\rightarrow$ AI phát hiện IP proxy và mã hack $\rightarrow$ Trạng thái `REJECTED`, xuất hiện trong hàng đợi rủi ro cần kiểm toán. |
| **Demo 4: Tra Cứu Blind Index** | Sang Admin Tab 4 $\rightarrow$ Nhập SĐT `0908123456` vào ô tìm kiếm | Hệ thống tìm ra chính xác bản ghi chỉ bằng chuỗi Blind Index HMAC mà không giải mã dữ liệu. |
| **Demo 5: Tấn Công Sửa Đổi Bản Mã & Phát Hiện Bằng GMAC** | Tại Tab 4 $\rightarrow$ Nhấn nút "Tấn công sửa đổi 1 byte" trên đơn bất kỳ $\rightarrow$ Bấm "Kiểm tra toàn vẹn" | Cảnh báo đỏ xuất hiện! Web Crypto API phát hiện GMAC tag sai lệch $\rightarrow$ Chứng minh khả năng toàn vẹn tuyệt đối của hệ thống. |

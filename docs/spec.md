# ĐẶC TẢ NGHIỆP VỤ HỆ THỐNG AN NINH & MÃ HÓA ĐƠN HÀNG (SPEC.MD)

Tài liệu đặc tả các kịch bản kiểm thử và vận hành hệ thống Thương Mại Điện Tử Group 9 theo chuẩn "Khi ... thì ...".

---

## 1. Kịch bản Phát hiện Gian lận bằng AI (Fraud Detection Engine)

- **Kịch bản 1 (Mua hàng hợp lệ):**
  * *Khi* khách hàng mua sản phẩm thông thường (Preset 1: Bàn phím cơ, phương thức COD, thông tin cá nhân rõ ràng, IP nội địa), *thì* hệ thống AI đánh giá mức rủi ro **LOW RISK (5–15 điểm)** và tự động phê duyệt đơn hàng (**APPROVED**) để chuyển sang khâu đóng gói.

- **Kịch bản 2 (Nghi vấn chiếm quyền tài khoản / Thẻ lạ):**
  * *Khi* khách hàng mua sản phẩm giá trị cao bằng Thẻ tín dụng và có dấu hiệu địa chỉ IP lạ/proxy (Preset 2), *thì* hệ thống AI đánh giá mức rủi ro **MEDIUM RISK (45–65 điểm)** và kích hoạt cơ chế xác thực thích ứng (**CHALLENGE_OTP**), mở hộp thoại yêu cầu nhập mã OTP xác minh trước khi duyệt đơn.

- **Kịch bản 3 (Botnet đầu cơ / Trục lợi voucher lỗi):**
  * *Khi* phát hiện tài khoản sử dụng email rác (`@tempmail.io`), áp mã giảm giá lỗ hổng (`VOUCHER_HACK_90`), tốc độ thanh toán siêu tốc dưới 1 giây và dấu vân tay trình duyệt tự động Headless Chrome (Preset 3), *thì* hệ thống AI đánh giá mức rủi ro **HIGH RISK (88–98 điểm)** và lập tức cách ly đơn hàng vào hàng đợi kiểm duyệt (**HOLD_REVIEW**).

---

## 2. Kịch bản Mật mã Tầng Ứng dụng (Application-Layer Cryptography)

- **Kịch bản 4 (Mã hóa phong bì PII bằng AES-256-GCM):**
  * *Khi* đơn hàng được xác nhận đặt, *thì* toàn bộ dữ liệu cá nhân nhạy cảm PII (Họ tên, Số điện thoại, Địa chỉ giao hàng, Số thẻ tín dụng) phải được mã hóa độc lập bằng chuẩn **AES-256-GCM** kèm vector ngẫu nhiên 12 bytes (IV) và mã xác thực toàn vẹn 128-bit (GMAC Auth Tag) trước khi lưu vào CSDL.

- **Kịch bản 5 (Tra cứu ẩn danh O(1) bằng Blind Index):**
  * *Khi* người quản trị nhập số điện thoại vào thanh tìm kiếm CSDL, *thì* hệ thống tính toán mã băm **HMAC-SHA256** với khóa bí mật riêng và so khớp trực tiếp trên trường `phone_blind_index` mà không cần giải mã dữ liệu của khách hàng.

- **Kịch bản 6 (Niêm phong toàn vẹn bằng SHA-256 Checksum):**
  * *Khi* đơn hàng được tạo, *thì* hệ thống tính toán một chữ ký niêm phong SHA-256 tổng hợp trên toàn bộ các chuỗi bản mã, thẻ tag, blind index và giá trị tiền đơn hàng để chống sửa đổi CSDL.

- **Kịch bản 7 (Phát hiện tấn công sửa đổi 1 byte trong CSDL):**
  * *Khi* có hành vi can thiệp sửa đổi dù chỉ 1 ký tự hex trong chuỗi bản mã CSDL (Ciphertext), *thì* khi bấm "Kiểm tra toàn vẹn", hệ thống kiểm tra đối soát GMAC Tag và SHA-256 Checksum, lập tức báo động đỏ vi phạm tính toàn vẹn dữ liệu.

- **Kịch bản 8 (Giải mã động thời gian thực có kiểm soát thẩm quyền):**
  * *Khi* người quản trị kích hoạt nút "Giải Mã Hợp Lệ (Authorized Decrypt)", *thì* trình duyệt thực thi giải mã AES-256-GCM theo thời gian thực; nếu bản mã bị can thiệp trái phép, hàm giải mã ném ngoại lệ GMAC và hiển thị cảnh báo đỏ lỗi toàn vẹn thay vì hiển thị dữ liệu bản rõ.


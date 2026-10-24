Hãy refactor lại toàn bộ cụm nút Social Login (Google, Apple, Facebook, X) trong component Login/Auth theo đúng 2 yêu cầu sau:

1. GIAO DIỆN HÀNG NÚT BẤM (Chuẩn Modern SaaS):
   - Thay toàn bộ các nút cũ thành một hàng ngang gồm 4 nút hình vuông bo góc mềm (w-14 h-14, rounded-2xl, bg-white, viền border border-slate-100, shadow nhẹ shadow-sm).
   - Icon bên trong căn giữa chính xác:
     * Google: Logo chữ G 4 màu chuẩn vector SVG.
     * Apple: Logo quả táo cắn dở màu đen chuẩn SVG viewBox="0 0 24 24" (không bị méo hay mất cuống).
     * Facebook: Icon chữ f nền tròn xanh #1877F2 SVG.
     * X (Twitter): Logo X nét đôi tối giản màu đen SVG.
   - Thêm hiệu ứng hover: hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all.

2. LOGIC BẬT CỬA SỔ POPUP XÁC THỰC OAUTH CHUẨN THỰC TẾ:
   - Khi người dùng click vào nút Google: Hiển thị một Modal giả lập giao diện cửa sổ "Đăng nhập bằng Google - Google Chrome" với thanh tiêu đề cửa sổ, danh sách chọn tài khoản (avatar, tên, email) và nút xác nhận quyền truy cập.
   - Khi click vào nút Facebook: Hiển thị Modal giả lập cửa sổ "Facebook - Google Chrome" (nền dark mode #1c1e21, hiển thị ứng dụng yêu cầu cấp quyền Tên, Email, Sinh nhật và nút 'Tiếp tục dưới tên Phát').
   - Khi click "Tiếp tục" trong popup: Giả lập đăng nhập thành công, tự động đóng popup và cập nhật trạng thái User vào hệ thống.
   - Cho phép đóng popup bằng nút [X] hoặc bấm "Hủy".



   
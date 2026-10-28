-- ==============================================================================
-- BẢO MẬT HÀNG (ROW LEVEL SECURITY - RLS) NÂNG CAO CHO MÔ HÌNH PRODUCTION
-- Ngày cập nhật: 28/10/2026
-- Mục tiêu: Khắc phục các lỗ hổng USING (true) trên PII, sinh trắc học và đơn hàng
-- ==============================================================================

-- 1. BẢNG TODOS: Chỉ cho phép người dùng đã xác thực (loại bỏ anon tự do)
DROP POLICY IF EXISTS "Todos public access" ON public.todos;
DROP POLICY IF EXISTS "Todos authenticated access" ON public.todos;
CREATE POLICY "Todos authenticated access" ON public.todos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. BẢNG PROFILES: Bảo vệ thông tin cá nhân (Tên, SĐT, Email)
-- Khách vãng lai và người dùng thông thường CHỈ được xem hồ sơ của chính mình
-- Quản trị viên (ADMIN, SECURITY_OFFICER) được xem tất cả để phục vụ kiểm toán
DROP POLICY IF EXISTS "Profiles public read basic" ON public.profiles;
DROP POLICY IF EXISTS "Profiles secure read" ON public.profiles;
CREATE POLICY "Profiles secure read" ON public.profiles
  FOR SELECT TO authenticated, anon
  USING (
    (SELECT auth.uid()) = id OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('ADMIN', 'SECURITY_OFFICER')
    )
  );

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated, anon
  WITH CHECK ((SELECT auth.uid()) = id OR (SELECT auth.uid()) IS NULL);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- 3. BẢNG CATEGORIES: Công khai danh mục cho khách xem hàng
DROP POLICY IF EXISTS "Categories public read" ON public.categories;
CREATE POLICY "Categories public read" ON public.categories
  FOR SELECT TO anon, authenticated USING (true);

-- 4. BẢNG PRODUCTS: Công khai sản phẩm cho khách xem hàng
DROP POLICY IF EXISTS "Products public read" ON public.products;
CREATE POLICY "Products public read" ON public.products
  FOR SELECT TO anon, authenticated USING (true);

-- 5. BẢNG VOUCHERS: Chỉ xem các mã giảm giá đang hoạt động
DROP POLICY IF EXISTS "Vouchers public read" ON public.vouchers;
CREATE POLICY "Vouchers public read" ON public.vouchers
  FOR SELECT TO anon, authenticated USING (is_active = true);

-- 6. BẢNG ORDERS: Bảo vệ dữ liệu đơn hàng
-- Khách hàng chỉ xem được đơn hàng của chính mình
-- Quản trị viên mới được xem toàn bộ danh sách đơn hàng
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Orders secure read" ON public.orders;
CREATE POLICY "Orders secure read" ON public.orders
  FOR SELECT TO authenticated, anon
  USING (
    (SELECT auth.uid()) = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role IN ('ADMIN', 'SECURITY_OFFICER')
    )
  );

DROP POLICY IF EXISTS "Allow checkout creation" ON public.orders;
CREATE POLICY "Allow checkout creation" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Khóa quyền sửa đơn hàng: Chỉ Admin hoặc chính chủ mới được cập nhật
DROP POLICY IF EXISTS "Allow order update" ON public.orders;
DROP POLICY IF EXISTS "Admin allow order update" ON public.orders;
CREATE POLICY "Admin allow order update" ON public.orders
  FOR UPDATE TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role IN ('ADMIN', 'SECURITY_OFFICER')
    ) OR
    (SELECT auth.uid()) = user_id
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role IN ('ADMIN', 'SECURITY_OFFICER')
    ) OR
    (SELECT auth.uid()) = user_id
  );

-- 7. BẢNG BIOMETRIC_PROFILES: Bảo vệ dữ liệu sinh trắc học khuôn mặt (SFace)
DROP POLICY IF EXISTS "Biometric profiles access" ON public.biometric_profiles;
DROP POLICY IF EXISTS "Biometric profiles secure access" ON public.biometric_profiles;
CREATE POLICY "Biometric profiles secure access" ON public.biometric_profiles
  FOR ALL TO authenticated, anon
  USING (
    (SELECT auth.uid()) = user_id OR
    user_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role IN ('ADMIN', 'SECURITY_OFFICER')
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id OR
    user_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role IN ('ADMIN', 'SECURITY_OFFICER')
    )
  );

-- 8. BẢNG AUDIT_LOGS: Chỉ Quản trị viên mới được đọc nhật ký an ninh
DROP POLICY IF EXISTS "Audit logs read" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs secure read" ON public.audit_logs;
CREATE POLICY "Audit logs secure read" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role IN ('ADMIN', 'SECURITY_OFFICER')
    )
  );

DROP POLICY IF EXISTS "Audit logs insert" ON public.audit_logs;
CREATE POLICY "Audit logs insert" ON public.audit_logs
  FOR INSERT TO anon, authenticated WITH CHECK (true);

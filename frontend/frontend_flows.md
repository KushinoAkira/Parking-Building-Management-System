# Các Luồng Chính (Main Flows) - Frontend

Tài liệu này mô tả chi tiết các luồng nghiệp vụ chính trên giao diện Frontend của hệ thống Quản lý bãi đỗ xe (Parking Building Management System). Các bước được liệt kê chi tiết để team Backend dễ dàng hình dung và chuẩn bị các API tương ứng.

## 1. Luồng Nhân viên (Staff Dashboard)

### 1.1. Luồng Check-in (Xe vào bãi)
**Mục tiêu:** Ghi nhận xe vào bãi, cấp phát vị trí đỗ (slot).
**Quy trình từng bước:**
1. Nhân viên mở màn hình **Trạm Kiểm Soát** (tab Kiểm Soát Xe).
2. Hệ thống chờ đọc biển số qua 2 cách:
   - **Tự động:** Quét camera nhận diện biển số.
   - **Thủ công:** Nhân viên gõ biển số vào ô "Nhập Thủ Công" và nhấn "Ghi".
3. Giao diện (Frontend) hiển thị trạng thái "Đang nhận diện...".
4. *[Backend API]* Frontend gửi yêu cầu Check-in kèm biển số xe lên Server.
5. *[Backend API]* Server kiểm tra biển số, tìm slot trống trên các tầng, tạo giao dịch Check-in, và trả về thông tin (Biển số, Giờ vào, Slot được cấp).
6. Frontend hiển thị thông báo **"Check-in Thành Công"** cùng biển số, giờ vào và số slot.
7. Danh sách slot trên sơ đồ tầng tự động cập nhật trạng thái slot đó thành "Đã chiếm" (Occupied).

### 1.2. Luồng Check-out (Xe ra bãi)
**Mục tiêu:** Ghi nhận xe ra bãi và tính phí (nếu có).
**Quy trình từng bước:**
1. Xe đến cổng ra, nhân viên quét camera hoặc nhập biển số thủ công.
2. *[Backend API]* Frontend gửi yêu cầu Check-out với biển số.
3. *[Backend API]* Server kiểm tra thông tin xe, tính toán thời gian đỗ, phí đỗ xe và cập nhật trạng thái slot thành "Trống".
4. Frontend hiển thị thông báo **"Check-out Thành Công"** cùng biển số và giờ ra.
5. (Tuỳ chọn) Nếu xe chưa đóng phí (đối với khách vãng lai), Frontend hiển thị số tiền cần thanh toán để nhân viên thu tiền mặt hoặc xác nhận khách đã chuyển khoản.

### 1.3. Luồng Ghi nhận Vi phạm
**Mục tiêu:** Xử lý các xe đỗ sai quy định, chiếm chỗ, đỗ sai làn v.v.
**Quy trình từng bước:**
1. Nhân viên phát hiện vi phạm trên sơ đồ bãi đỗ (thông qua camera) hoặc trực tiếp.
2. Nhấn nút **"Ghi nhận vi phạm"** (Icon cảnh báo).
3. Form vi phạm hiện lên, nhân viên điền:
   - Biển số xe.
   - Loại vi phạm (Đỗ sai vị trí, Chiếm 2 slot...).
   - Ghi chú thêm.
   - Chụp/Tải ảnh minh họa.
4. Nhấn **"Lưu & Chuyển xe vi phạm"**.
5. *[Backend API]* Gửi dữ liệu vi phạm lên Server.
6. Hệ thống cập nhật xe vào danh sách ở tab "Bãi Xe Vi Phạm" và cập nhật trạng thái slot thành "Vi phạm" (hiển thị màu vàng/đỏ tuỳ thiết kế).

### 1.4. Luồng Xử lý Vị trí (Slot) cụ thể
**Mục tiêu:** Xem chi tiết một vị trí đang đỗ và có hành động xử lý trực tiếp.
**Quy trình từng bước:**
1. Nhân viên chọn một slot đang sáng (màu đỏ hoặc vàng) trên sơ đồ tầng.
2. Modal chi tiết slot mở lên, hiển thị trạng thái (Trống/Đang sử dụng/Vi phạm), biển số xe, và giờ vào.
3. Nhân viên có thể nhấn nút **Check-out** trực tiếp cho xe đó, hoặc nhấn nút **Xử phạt** nếu xe đang vi phạm.
4. *[Backend API]* Gọi API check-out hoặc API đánh dấu vi phạm cho slot tương ứng.

---

## 2. Luồng Khách hàng (User Mobile App)

### 2.1. Luồng Người dùng tự Check-in (Quét QR)
**Mục tiêu:** Khách hàng dùng app di động tự quét mã QR tại cổng trạm để vào bãi.
**Quy trình từng bước:**
1. Khách hàng mở app, nhấn vào icon **Quét QR** ở giữa thanh điều hướng dưới cùng.
2. Màn hình quét mở ra, khách hàng hướng camera vào mã QR của bãi đỗ xe hoặc trạm.
3. *[Backend API]* Gửi dữ liệu mã QR và token của user lên Server để xác thực.
4. Nhận phản hồi thành công, hệ thống mở barie và tạo một "Phiên Đỗ Xe Hiện Tại".
5. App hiển thị thông tin vé xe (Biển số, Tầng, Slot, Giờ vào) trên trang chủ.

### 2.2. Luồng Thanh toán và Check-out (Khách hàng tự làm)
**Mục tiêu:** Khách hàng thanh toán trước thông qua app để cổng tự động mở khi lái xe ra.
**Quy trình từng bước:**
1. Tại màn hình trang chủ, khách hàng xem thẻ "Phiên Đỗ Xe Hiện Tại" và nhấn **"Thanh toán & Check-out"**.
2. Modal Thanh Toán hiện ra, hiển thị chi tiết (Slot, Thời gian đỗ, Số tiền cần trả).
3. Khách hàng có thể chọn thanh toán qua số dư Ví nội bộ, hoặc thanh toán qua cổng ngoài (VD: quét mã VietQR/payOS).
4. Nhấn **"Xác nhận thanh toán"**.
5. *[Backend API]* Gửi yêu cầu trừ tiền và kết thúc phiên đỗ xe lên Server.
6. Server xử lý và trả kết quả thành công.
7. App hiển thị "Thanh Toán Thành Công", vé xe chuyển sang trạng thái "Hoàn thành" trong mục Lịch sử.

### 2.3. Luồng Nạp tiền vào Ví
**Mục tiêu:** Nạp tiền trước vào tài khoản app để trừ tiền tự động khi đỗ xe.
**Quy trình từng bước:**
1. Khách hàng nhấn nút **"Nạp tiền"** ở phần Tiện ích (hoặc Ví).
2. Chọn mệnh giá nạp có sẵn (10k, 20k, 50k...) hoặc nhập số tiền tuỳ ý. Chọn phương thức thanh toán.
3. Nhấn **"Xác nhận nạp tiền"**.
4. *[Backend API]* Frontend gọi Server để tạo request thanh toán và lấy mã QR ngân hàng.
5. App hiển thị mã QR. Khách hàng dùng app ngân hàng quét để chuyển khoản.
6. *[Backend API]* Khi chuyển khoản thành công, hệ thống ngân hàng (payOS) gọi Webhook báo về Server. Server cập nhật số dư cho User.
7. Frontend (nếu có polling/websocket) nhận thông báo nạp thành công, tự động làm mới số dư hiển thị trên App.

---

## 3. Luồng Quản lý (Manager Web Dashboard)
- **Xem Thống Kê:** Frontend tự động load API dashboard về doanh thu, lượt ra vào, công suất.
- **Quản lý Slot:** Thêm, Sửa, Xoá slot và khu vực đỗ xe. (Admin tạo slot trên DB).
- **Thiết lập Giá (Pricing):** Cập nhật bảng giá cho các loại phương tiện và loại thẻ (tháng, vãng lai).
- **Quản lý Nhân viên:** Tạo mới tài khoản cho nhân viên trực chốt, cấp quyền ca trực.

*Lưu ý cho Backend:* Các nút bấm và logic mô phỏng hiện tại trên Frontend (trong `StaffDashboard.tsx`, `UserMobileHome.tsx`...) đang dùng `setTimeout` và sinh dữ liệu ngẫu nhiên (Mock data). Khi tích hợp Backend, các hàm xử lý này sẽ được thay bằng hàm gọi API tới các Endpoint tương ứng.

# Danh sách quyết định thiết kế & kiến trúc (DECISIONS.md)

Tài liệu này lưu lại các quyết định kỹ thuật, giả định và lựa chọn mặc định trong quá trình triển khai dự án **Tài Xế Công Nghệ**.

---

## 001. Khởi tạo Dự án & Tech Stack
- **Ngày**: 06/11/2026
- **Quyết định**: Sử dụng TypeScript + Vite + React 19 + Tailwind CSS v4 + Vitest.
- **Lý do**: Đúng đặc tả mục 3. Nhẹ, khởi động nhanh, kiểm thử tự động với Vitest đơn giản và tương thích với core TypeScript headless.

## 002. Cấu trúc thư mục lõi mô phỏng (Simulation Core)
- **Ngày**: 06/11/2026
- **Quyết định**: 
  - Thư mục `/src/sim/` chứa toàn bộ logic toán học, trạng thái, PRNG (`mulberry32`), deterministic.
  - Tuyệt đối không import bất kỳ thành phần React hay DOM/UI nào vào `/src/sim/`.
  - Mọi tham số khởi điểm lưu trong `/data/*.json`.
- **Lý do**: Cho phép chạy headless test, bot simulation hàng trăm ngày mà không cần render UI, đảm bảo state serialization an toàn cho tính năng Save/Load.

## 003. Đơn vị đo thời gian và Tick
- **Ngày**: 06/11/2026
- **Quyết định**:
  - 1 tick mô phỏng = 1 phút game.
  - Tốc độ x1: 1 giờ game = 90 giây thực (1 tick = 1.5 giây thực).
  - Tua x2: 1 tick = 0.75s thực.
  - Tua x4: 1 tick = 0.375s thực.
  - Tua x8: 1 tick = 0.1875s thực.
  - Ngủ: Tự động tua nhanh đến khi thức dậy hoặc có sự kiện ngắt.
- **Lý do**: Bám sát mục 3 & 4 của đặc tả.

## 004. Nghiệm thu Mốc 1 (Lõi thời gian & 4 chỉ số)
- **Ngày**: 06/11/2026
- **Nội dung hoàn thành**:
  - Cài đặt đầy đủ công thức biến thiên của 4 chỉ số (Thể lực, No, Tỉnh táo, Tinh thần) từ mục 5 đặc tả.
  - Xử lý hiệu ứng cà phê (bùng tỉnh + sập sau 3h + cơ chế nhờn thuốc từ ly thứ 3).
  - Xử lý chợp mắt 20 phút (hồi +15 Tỉnh táo, +5 Thể lực, cooldown 4 tiếng).
  - Xử lý giấc ngủ dài và nợ ngủ `sleepDebt` cập nhật vào 05:00 sáng mỗi ngày.
  - Xây dựng UI khung chuẩn dashboard 3 cột (Desktop) và hệ thống tab (Mobile) kết nối trực tiếp với Game Engine.
  - 16/16 test case Vitest pass 100%, build production thành công.

## 005. Nghiệm thu Mốc 2 (Cuốc xe & Kinh tế cơ bản)
- **Ngày**: 06/11/2026
- **Nội dung hoàn thành**:
  - **Cơ chế phát cuốc (Dispatch Engine)**:
    - Tính toán xác suất $\lambda$ phát cuốc theo mật độ điểm chờ, nhu cầu giờ cao điểm (giờ cơm/giờ tan tầm), hệ số thời tiết và điểm uy tín tài xế.
    - Thẻ cuốc xe hiện lên với thanh đếm ngược **12 giây thực**.
    - Hai loại hình cuốc: 🍔 Giao đồ ăn & 🛵 Chở khách.
    - Phân loại 7 nhóm tính cách khách hàng ảnh hưởng đến xác suất tip và phàn nàn.
  - **Vòng đời cuốc xe (Order Lifecycle)**:
    - `OFFERED` -> `ACCEPTED` -> `TO_PICKUP` -> `AT_MERCHANT_WAITING` (đồ ăn) -> `TO_DROPOFF` -> `COMPLETED`.
    - Di chuyển tiêu hao xăng thực tế (1.9L/100km cho Wave Alpha), tăng odo km lăn bánh và trừ thể lực.
    - Xử lý dòng tiền: Tiền mặt vs Ví điện tử.
  - **Màn hình Tổng kết cuối ngày (Daily Summary Modal)**:
    - Kích hoạt tự động khi chuyển giao ngày mới vào 05:00 sáng.
    - Đặt cạnh nhau 2 con số: **Doanh thu hiển thị trên app** vs **Lợi nhuận thực tế**.
  - **Kiểm thử**: Đạt 23/23 tests pass 100%.

## 006. Nghiệm thu Mốc 3 (MVP Chơi Được & Bot Mô Phỏng 7 Ngày)
- **Ngày**: 06/11/2026
- **Nội dung hoàn thành**:
  - **Công thức điểm ưu tiên phát cuốc ẩn (Hidden Dispatch Score)** với nhiễu Gaussian $\varepsilon \sim \mathcal{N}(0, 0.2)$.
  - **Hệ thống phân hạng tài xế (Đồng/Bạc/Vàng/Kim Cương)** & kỷ luật tạm khóa tài khoản.
  - **Hệ thống Bot mô phỏng Headless 7 ngày**: BalancedBot, WorkaholicBot, LazyBot, PeakHunterBot với tính năng xuất CSV.
  - **Lưu/Tải/Reset**: Quản lý localStorage an toàn, bản đồ đường đi nối 2 khu vực phát sáng khi nhận cuốc.

## 007. Nghiệm thu Mốc 4 (Chiều Sâu: Chỉ Số Ẩn, Hao Mòn, Sự Kiện & Tai Nạn)
- **Ngày**: 06/11/2026
- **Nội dung hoàn thành**:
  - **Chỉ số ẩn & Sức khỏe dài hạn**:
    - `baseFatigue` (Mệt nền 0–100): Tích lũy khi chạy $>10$h/ngày, làm giảm hiệu suất hồi phục thể lực khi ngủ.
    - `health` (Sức khỏe 0–100): Suy giảm khi dầm mưa nặng hạt không áo mưa xịn (-3/h), nhịn đói hoặc nợ ngủ kinh niên ($>10$h).
    - `isSick` (Ốm sốt): Kích hoạt khi `health < 40`, bắt buộc nghỉ dưỡng và tốn tiền thuốc men.
    - `phoneBattery` (Pin điện thoại): Tiêu hao 8%/h khi bật app định vị; nếu sập nguồn về 0% app tự ngắt; hỗ trợ ghé quán nước sạc pin (`CHARGE_PHONE`).
  - **Hao mòn 5 bộ phận xe & Bảo dưỡng**:
    - Lốp (~8.000km), Nhớt (~1.500km), Bố thắng (~10.000km), Nhông sên dĩa (~15.000km), Bugi (~8.000km).
    - Giao diện Tiệm sửa xe & bảo dưỡng (`MaintenanceModal`) cho phép thay thế phục hồi 100%.
  - **Công thức xác suất Tai nạn giao thông (Mục 10)**:
    - $P = 0.0015 \times speedMode \times rain \times night \times (1 + \max(0, \frac{30 - alert}{30})) \times (1 + \max(0, \frac{50 - \min(tires, brakes)}{50}))$.
    - Phân cấp 3 mức độ: Nhẹ (trầy xe 250k–600k), Vừa (chấn thương phần mềm 1.5tr–3tr, nghỉ 1 ngày), Nặng (nhập viện cấp cứu 5tr–15tr, nghỉ 4 ngày).
  - **18 Sự kiện ngẫu nhiên trên đường phố**:
    - Xây dựng 18 kịch bản tương tác (thủng lốp, chết máy ngập nước, khách tip lớn, khách chửi, khách bỏ quên túi xách, tin nhắn lừa đảo, bạn rủ nhậu, pin yếu...) kèm các lựa chọn đánh đổi rủi ro / chi phí / đạo đức.
  - **Chế độ dẫn đường**:
    - Lựa chọn 3 tuyến đường: `fast` (Nhanh nhất), `light` (Né kẹt xe +15% km), `dry` (Né ngập triều cường +25% km).
  - **Kiểm thử**: Toàn bộ 36/36 unit tests pass 100%, build production thành công.

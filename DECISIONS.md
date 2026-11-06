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
  - **Công thức điểm ưu tiên phát cuốc ẩn (Hidden Dispatch Score)**:
    - $score = 0.35 \cdot rating\_norm + 0.25 \cdot acceptRate + 0.20 \cdot (1 - cancelRate) + 0.20 \cdot proximity\_norm + \varepsilon$ với nhiễu Gaussian $\varepsilon \sim \mathcal{N}(0, 0.2)$ mô phỏng thuật toán thực tế của app công nghệ (không minh bạch tuyệt đối).
  - **Hệ thống phân hạng tài xế (Driver Tiers) & Kỷ luật**:
    - Tự động thăng hạng theo tích lũy số cuốc và sao: Đồng (0-49), Bạc (>=50 & 4.8★), Vàng (>=150 & 4.85★), Kim Cương (>=300 & 4.90★).
    - Cảnh cáo và tạm khóa tài khoản 24h nếu rating < 4.6 hoặc tỷ lệ hủy chuyến > 15%.
    - Hỗ trợ tài xế chủ động hủy cuốc trước khi đón (`CANCEL_ACTIVE_TRIP`).
  - **Hệ thống Bot mô phỏng đa chiến lược (Headless Multi-Day Simulation)**:
    - Xây dựng 4 bot đại diện cho 4 phong cách tài xế:
      1. *BalancedBot* (Cân bằng): Ăn/ngủ đủ 7h, chạy giờ hành chính $\rightarrow$ sống sót trọn vẹn 7 ngày, nợ ngủ thấp (<5h), lợi nhuận dương ổn định.
      2. *WorkaholicBot* (Ham chạy): Cày cuốc thâu đêm, uống cà phê liên tục, ngủ ít $\rightarrow$ nợ ngủ tăng vọt (>15h), sụp đổ thể lực.
      3. *LazyBot* (Lười): Chỉ chạy 5h ban ngày, ngủ 10h $\rightarrow$ an toàn nhưng số cuốc và thu nhập thấp hơn hẳn.
      4. *PeakHunterBot* (Săn giờ cao điểm): Chỉ bật app lúc 07:00-09:00 và 17:00-19:30 $\rightarrow$ tối ưu thời gian/thu nhập.
    - Xuất dữ liệu mô phỏng ra định dạng CSV chuẩn theo mục 19.
  - **Giao diện & Lưu trữ (Save / Load / Reset)**:
    - Bổ sung nút Lưu game, Chơi lại từ đầu trên TopBar.
    - Bản đồ Graph 2D SVG hiển thị đường di chuyển màu neon rực rỡ khi đang thực hiện cuốc.
  - **Kiểm thử**: Toàn bộ 28/28 unit tests pass 100%, build production thành công.

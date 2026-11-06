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
  - Đã cài đặt đầy đủ công thức biến thiên của 4 chỉ số (Thể lực, No, Tỉnh táo, Tinh thần) từ mục 5 đặc tả.
  - Xử lý hiệu ứng cà phê (bùng tỉnh + sập sau 3h + cơ chế nhờn thuốc từ ly thứ 3).
  - Xử lý chợp mắt 20 phút (hồi +15 Tỉnh táo, +5 Thể lực, cooldown 4 tiếng).
  - Xử lý giấc ngủ dài và nợ ngủ `sleepDebt` cập nhật vào 05:00 sáng mỗi ngày.
  - Xây dựng UI khung chuẩn dashboard 3 cột (Desktop) và hệ thống tab (Mobile) kết nối trực tiếp với Game Engine.
  - 16/16 test case Vitest pass 100%, build production thành công.

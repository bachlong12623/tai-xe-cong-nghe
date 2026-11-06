# Tài Xế Công Nghệ — 24 Giờ Mưu Sinh

Dự án game mô phỏng chu kỳ 24 giờ của một tài xế công nghệ tại TP.HCM (Grab / Be / Xanh SM), tập trung vào bài toán đánh đổi kinh tế và sức khỏe: **"Chạy thêm một cuốc nữa có đáng không?"**.

## 🚀 Khởi chạy dự án

### Cài đặt dependencies
```bash
npm install
```

### Chạy chế độ phát triển (Development)
```bash
npm run dev
```
Trình duyệt sẽ tự động mở giao diện tại `http://localhost:3000`.

### Chạy kiểm thử tự động (Unit Tests)
```bash
npm test
```

### Build cho môi trường Production
```bash
npm run build
```

---

## 🏗️ Kiến trúc & Cấu trúc thư mục

Dự án tuân thủ nghiêm ngặt nguyên tắc tách biệt giữa **Lõi mô phỏng (Simulation Core)** và **Giao diện (React UI)**:

```
├── data/                      # Toàn bộ tham số cân bằng, cấu hình kinh tế, xe cộ, địa điểm
│   ├── balance.json           # Tốc độ suy hao & hồi phục chỉ số, chu kỳ thời gian
│   ├── items.json             # Thức ăn, nước uống, cà phê, vật phẩm
│   ├── vehicles.json          # Danh sách xe (Wave, Vision, Xe điện...)
│   ├── zones.json             # 12 khu vực TP.HCM & tọa độ bản đồ Graph
│   ├── spots.json             # Danh sách điểm chờ đón khách & giao hàng
│   ├── demand.json            # Đường cong nhu cầu cuốc xe theo từng giờ
│   ├── pricing.json           # Bảng giá cước, chiết khấu nền tảng, giá xăng
│   └── events.json            # Danh sách sự kiện ngẫu nhiên
├── src/
│   ├── sim/                   # Lõi mô phỏng thuần TypeScript (headless, deterministic)
│   │   ├── rng.ts             # Mulberry32 PRNG có seed
│   │   ├── time.ts            # Hệ thống thời gian 24h, tick 1 phút, lịch tuần
│   │   ├── stats.ts           # 4 chỉ số cơ bản + chỉ số ẩn, cà phê, nợ ngủ
│   │   ├── vehicle.ts         # Phương tiện, mức tiêu thụ & đổ xăng
│   │   ├── economy.ts         # Doanh thu, chi phí, lợi nhuận thực & tổng kết ngày
│   │   ├── demand.ts          # Nhu cầu cuốc xe theo giờ & thời tiết
│   │   ├── platform.ts        # App tài xế, hạng tài xế, chiết khấu
│   │   ├── weather.ts         # Chuỗi Markov thời tiết & nhiệt độ TP.HCM
│   │   ├── save.ts            # Quản lý localStorage, schema version & migration
│   │   ├── types.ts           # Toàn bộ Interface & Action types
│   │   └── engine.ts          # Game loop, step, dispatch & view model
│   ├── ui/                    # Giao diện người dùng React 19 + Tailwind CSS
│   │   ├── components/        # TopBar, CharacterPanel, CityMap, DriverAppScreen, EventLogPanel
│   │   ├── hooks/             # useGameEngine hook tích hợp game loop
│   │   └── App.tsx            # Bố cục giao diện Desktop 3 cột & Mobile Tabs
│   ├── main.tsx
│   └── index.css
├── tests/                     # Bộ kiểm thử tự động với Vitest
│   ├── sim/
│   │   ├── time.test.ts
│   │   ├── stats.test.ts
│   │   └── engine.test.ts
├── DECISIONS.md               # Nhật ký các quyết định kỹ thuật & thiết kế
└── package.json
```

---

## 🎯 Trạng thái nghiệm thu các Mốc

### ✅ Mốc 1: Lõi thời gian + 4 Chỉ số (HOÀN THÀNH)
* **Thời gian & Nhịp mô phỏng**:
  * 1 tick = 1 phút game.
  * Tốc độ x1: 1 giờ game = 90 giây thực. Hỗ trợ tua x2, x4, x8 và tạm dừng.
  * Tự động tua nhanh x8 khi ngủ; tự động chuyển về x1 khi thức dậy.
* **4 Chỉ số sinh lý**:
  * **Thể lực (Stamina)**: Giảm -0.5/h nghỉ, -1.5/h chờ cuốc, -5/h chạy xe; mưa và nắng nóng >34°C trừ thêm; ngủ hồi +12/h; chợp mắt +5.
  * **Độ no (Hunger)**: Giảm -4/h; ăn bánh mì (+25), mì gói (+30), cơm bình dân (+45), quán xịn (+60).
  * **Tỉnh táo (Alertness)**: Giảm -3/h ban ngày, -6/h ban đêm (23:00 - 05:00); ngủ hồi +14/h; chợp mắt +15 (cooldown 4h); cà phê +20 tức thì, sập sau 3h (-15) và có cơ chế nhờn thuốc.
  * **Tinh thần (Morale)**: Tụt nhanh khi đói (No < 20), hồi phục khi ăn ngon hoặc hoàn thành công việc tốt.
* **UI Khung đầy đủ**:
  * Thanh trạng thái TopBar, Cột chỉ số & Xe, Bản đồ Graph 2D SVG 12 quận TP.HCM, App Tài xế giả lập, Terminal Event Log.
  * Tương thích hoàn toàn trên Desktop và Mobile (hệ thống Tab chuyển đổi).
* **Kiểm thử**: 16/16 test pass, build production sạch.

---

### ⏳ Các mốc tiếp theo
* **Mốc 2**: Cơ chế sinh cuốc, nhận/từ chối cuốc (12s đếm ngược), vòng đời đơn hàng, trừ xăng theo km, màn hình tổng kết cuối ngày.
* **Mốc 3 (MVP)**: Hoàn thiện dispatch score, rating, bot test 7 ngày liên tục.
* **Mốc 4 (Chiều sâu)**: Chỉ số ẩn, thời tiết ngập nước, sự kiện ngẫu nhiên, tai nạn.
* **Mốc 5 (Thế giới)**: CSGT, 12 khu vực, NPC/hội nhóm tài xế, xe điện & ô tô.
* **Mốc 6 (Hoàn thiện)**: Mùa vụ/Tết, thành tựu, cân bằng kinh tế cuối cùng.

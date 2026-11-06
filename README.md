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
│   │   ├── orders.ts          # Sinh cuốc, định giá chở khách & đồ ăn, vòng đời cuốc xe
│   │   ├── traffic.ts         # Tính toán thời gian di chuyển theo giờ kẹt xe & thời tiết
│   │   ├── vehicle.ts         # Phương tiện, mức tiêu thụ xăng theo km & đổ xăng
│   │   ├── economy.ts         # Doanh thu, chi phí, lợi nhuận thực & tổng kết ngày
│   │   ├── demand.ts          # Nhu cầu cuốc xe theo giờ & thời tiết
│   │   ├── platform.ts        # App tài xế, hạng tài xế, chiết khấu
│   │   ├── weather.ts         # Chuỗi Markov thời tiết & nhiệt độ TP.HCM
│   │   ├── save.ts            # Quản lý localStorage, schema version & migration
│   │   ├── types.ts           # Toàn bộ Interface & Action types
│   │   └── engine.ts          # Game loop, step, dispatch & view model
│   ├── ui/                    # Giao diện người dùng React 19 + Tailwind CSS
│   │   ├── components/        # TopBar, CharacterPanel, CityMap, DriverAppScreen, EventLogPanel, DailySummaryModal
│   │   ├── hooks/             # useGameEngine hook tích hợp game loop & đếm ngược 12s
│   │   └── App.tsx            # Bố cục giao diện Desktop 3 cột & Mobile Tabs
│   ├── main.tsx
│   └── index.css
├── tests/                     # Bộ kiểm thử tự động với Vitest
│   ├── sim/
│   │   ├── time.test.ts
│   │   ├── stats.test.ts
│   │   ├── orders.test.ts
│   │   └── engine.test.ts
├── DECISIONS.md               # Nhật ký các quyết định kỹ thuật & thiết kế
└── package.json
```

---

## 🎯 Trạng thái nghiệm thu các Mốc

### ✅ Mốc 1: Lõi thời gian + 4 Chỉ số (HOÀN THÀNH)
* Vòng lặp thời gian 24h, tick 1 phút, tua x1-x8, tạm dừng.
* 4 chỉ số sinh lý (Thể lực, No, Tỉnh táo, Tinh thần) với công thức suy hao thực tế.
* Cà phê bùng nổ tỉnh táo rồi sập sau 3h, chợp mắt 20 phút, giấc ngủ dài và nợ ngủ `sleepDebt`.

### ✅ Mốc 2: Cuốc xe + Kinh tế cơ bản (HOÀN THÀNH)
* **Sinh cuốc thông minh**: Tự động phát cuốc khi Online tại các Điểm chờ (theo mật độ, giờ cao điểm, thời tiết mưa gió).
* **Thẻ cuốc đếm ngược 12 giây thực**:
  * Đầy đủ thông số: Quãng đường đón/chở, cước hiển thị, phụ phí giờ cao điểm/mưa, điểm đến, hình thức thanh toán.
  * Tùy chọn Nhận cuốc hoặc Bỏ qua (ảnh hưởng trực tiếp đến tỷ lệ nhận cuốc và thời gian chờ cuốc sau).
* **Vòng đời cuốc xe hoàn chỉnh**:
  * Giao đồ ăn: Đón quán -> Đợi làm món -> Giao khách.
  * Chở khách: Đón khách -> Chở khách tới nơi.
  * Tiêu hao xăng theo km lăn bánh (Wave Alpha ~1.9L/100km).
  * Xử lý tiền cước & tip (Tiền mặt vs Ví điện tử, tự động trừ hoa hồng app theo hạng tài xế).
* **Màn hình Tổng kết cuối ngày (Daily Summary)**:
  * Tự động xuất hiện vào 05:00 sáng mỗi ngày.
  * Đối chiếu trực quan: Doanh thu app vs Lợi nhuận thực tế (sau xăng, ăn uống, hoa hồng, khấu hao xe) và thu nhập thực/giờ online.

---

### ⏳ Các mốc tiếp theo
* **Mốc 3 (MVP chơi được)**: Hoàn thiện Graph 8 khu vực chuyển động, dispatch score ẩn với nhiễu ngẫu nhiên, hệ thống bot mô phỏng chạy liên tục 7 ngày kiểm thử độ bền.
* **Mốc 4 (Chiều sâu)**: Các chỉ số ẩn (`baseFatigue`, `health`), triều cường ngập nước chết máy, hao mòn 5 bộ phận phụ tùng, sự kiện ngẫu nhiên & tai nạn.
* **Mốc 5 (Thế giới)**: CSGT/phạt, luật giao thông, 12 khu vực hoàn chỉnh, NPC tài xế chia sẻ tin tức trên nhóm chat, xe điện & ô tô.
* **Mốc 6 (Hoàn thiện)**: Mùa vụ/Tết, thành tựu, cân bằng kinh tế cuối cùng với bot simulation đa chiến lược.

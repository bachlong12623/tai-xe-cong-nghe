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
│   │   ├── rng.ts             # Mulberry32 PRNG có seed, Gaussian noise
│   │   ├── time.ts            # Hệ thống thời gian 24h, tick 1 phút, lịch tuần
│   │   ├── stats.ts           # 4 chỉ số cơ bản + chỉ số ẩn, cà phê, nợ ngủ
│   │   ├── orders.ts          # Điểm ưu tiên phát cuốc ẩn, định giá & vòng đời cuốc xe
│   │   ├── traffic.ts         # Tính toán thời gian di chuyển theo giờ kẹt xe & thời tiết
│   │   ├── vehicle.ts         # Phương tiện, mức tiêu thụ xăng theo km & đổ xăng
│   │   ├── economy.ts         # Doanh thu, chi phí, lợi nhuận thực & tổng kết ngày
│   │   ├── demand.ts          # Nhu cầu cuốc xe theo giờ & thời tiết
│   │   ├── platform.ts        # App tài xế, phân hạng Đồng/Bạc/Vàng/Kim Cương, kỷ luật
│   │   ├── bot.ts             # Hệ thống Bot mô phỏng đa chiến lược chạy 7+ ngày
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
│   │   ├── engine.test.ts
│   │   └── bot.test.ts
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
* Sinh cuốc thông minh tại các điểm chờ; thẻ cuốc xe đếm ngược 12 giây thực.
* Vòng đời cuốc xe hoàn chỉnh cho giao đồ ăn và chở khách.
* Tiêu hao xăng theo km lăn bánh (Wave Alpha ~1.9L/100km).
* Màn hình Tổng kết cuối ngày đối chiếu Doanh thu app vs Lợi nhuận thực tế.

### ✅ Mốc 3: MVP Chơi Được & Bot Mô Phỏng 7 Ngày (HOÀN THÀNH)
* **Bản đồ Graph 2D SVG**: Hiển thị đường di chuyển màu neon rực rỡ khi đang chở khách/giao đồ ăn giữa các khu vực.
* **Thuật toán phát cuốc ẩn có nhiễu Gaussian $\varepsilon$**: Mô phỏng sự thiếu minh bạch thực tế của các app công nghệ.
* **Hệ thống phân hạng tài xế (Đồng/Bạc/Vàng/Kim Cương)**: Thăng hạng tự động, hưởng chiết khấu ưu đãi và cảnh cáo/khóa tài khoản nếu rating thấp hoặc hủy nhiều.
* **Lưu / Tải / Chơi lại từ đầu**: Tích hợp nút Lưu game và Reset vào TopBar.
* **Bot mô phỏng 7 ngày (Headless Bot)**: Kiểm thử 4 chiến lược tài xế (Cân bằng, Ham chạy, Lười, Săn cao điểm) với chức năng xuất báo cáo CSV.

---

### ⏳ Các mốc tiếp theo
* **Mốc 4 (Chiều sâu)**: Các chỉ số ẩn (`baseFatigue`, `health`), triều cường ngập nước chết máy, hao mòn 5 bộ phận phụ tùng, 24 sự kiện ngẫu nhiên & rủi ro tai nạn.
* **Mốc 5 (Thế giới)**: CSGT/phạt, luật giao thông & "đi tắt", 12 khu vực mở khóa, NPC tài xế chia sẻ tin tức trên nhóm chat, xe điện & ô tô.
* **Mốc 6 (Hoàn thiện)**: Mùa vụ/Tết, thành tựu, cân bằng kinh tế cuối cùng với bot simulation hàng trăm ngày.

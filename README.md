# Tài Xế Công Nghệ — 24 Giờ Mưu Sinh

Dự án game mô phỏng chu kỳ 24 giờ của một tài xế công nghệ tại TP.HCM (Grab / Be / ShopeeFood / Xanh SM), tập trung vào bài toán đánh đổi kinh tế và sức khỏe: **"Chạy thêm một cuốc nữa có đáng không?"**.

Dự án được xây dựng toàn diện từ Mốc 1 đến Mốc 6 theo đúng bản đặc tả kiến trúc `Tài Xế Công Nghệ — Đặc tả & kế hoạch triển khai.md`.

---

## 🚀 Khởi chạy dự án

### Cài đặt dependencies
```bash
npm install
```

### Chạy chế độ phát triển (Development)
```bash
npm run dev
```
Mở trình duyệt tại: `http://localhost:3000`

### Chạy toàn bộ kiểm thử tự động (Unit & Integration Tests)
```bash
npm test
```
*Hiện tại: 76/76 test cases qua 18 test suites pass 100%.*

### Build kiểm tra và đóng gói Production
```bash
npm run build
```

---

## 🏗️ Kiến trúc & Cấu trúc thư mục

Dự án tuân thủ nghiêm ngặt nguyên tắc **Headless Simulation**:
1. **Simulation Core (`/src/sim/`)**: Viết bằng TypeScript thuần, 100% deterministic (sử dụng Mulberry32 PRNG có seed, không dùng `Date.now()` hay `Math.random()`), không import bất kỳ thư viện UI, DOM hay React nào. Toàn bộ GameState có thể serialize/deserialize JSON an toàn.
2. **Configuration & Balance (`/data/*.json`)**: Toàn bộ tham số cân bằng, giá cước, xe cộ, chỉ số, thời tiết, sự kiện đều được lưu trữ trong thư mục `data/` mà không bị hardcode trong logic.
3. **User Interface (`/src/ui/`)**: React 19 + Tailwind CSS v4, thiết kế responsive tối ưu cho cả Desktop (3 cột chuyên nghiệp) và Mobile (hệ thống Tab chuyển đổi linh hoạt).
4. **Synthesizer Sound (`/src/ui/utils/sound.ts`)**: Tổng hợp âm thanh thuần mã bằng Web Audio API không phụ thuộc file media ngoài.

```
├── .github/workflows/         # CI Workflow tự động chạy test & build trên GitHub Actions
│   └── ci.yml
├── data/                      # Cấu hình cân bằng, dữ liệu kinh tế, địa điểm, sự kiện
│   ├── balance.json           # Tốc độ suy hao & hồi phục chỉ số, chu kỳ thời gian & tiền trọ
│   ├── items.json             # Thức ăn, nước uống, cà phê, trạm sạc điện
│   ├── vehicles.json          # Danh sách xe (Wave Alpha, VinFast Evo 200, Toyota Vios)
│   ├── zones.json             # 12 khu vực TP.HCM & tọa độ bản đồ Graph SVG
│   ├── spots.json             # Danh sách điểm chờ đón khách & giao hàng chiến lược
│   ├── demand.json            # Đường cong nhu cầu cuốc xe theo từng giờ
│   ├── pricing.json           # Bảng giá cước, chiết khấu nền tảng, giá xăng, phụ phí mưa
│   ├── skills.json            # 5 cây kỹ năng tài xế & mốc nâng cấp cấp độ
│   ├── violations.json        # 4 phong cách lái xe & danh mục biên bản xử phạt CSGT
│   ├── npc.json               # 12 NPC tài xế cộng đồng & độ tin cậy chia sẻ tin tức
│   ├── goals.json             # 4 mục tiêu cuộc đời & chính sách vay nợ trả góp
│   ├── achievements.json      # 12 danh hiệu thành tựu đáng nhớ
│   └── events.json            # 18 sự kiện đường phố ngẫu nhiên có tương tác lựa chọn
├── docs/
│   └── SPEC.md                # Bản sao đặc tả kiến trúc chuẩn (docs/SPEC.md)
├── src/
│   ├── sim/                   # Lõi mô phỏng headless (100% Deterministic Pure TypeScript)
│   │   ├── rng.ts             # Mulberry32 PRNG có seed & hàm phân phối chuẩn Gaussian
│   │   ├── time.ts            # Hệ thống thời gian 24h, tick 1 phút, ngày & lịch tuần
│   │   ├── stats.ts           # 4 chỉ số cơ bản + chỉ số ẩn, nợ ngủ, mệt nền, đổ bệnh
│   │   ├── orders.ts          # Điểm ưu tiên phát cuốc ẩn, định giá & vòng đời cuốc xe
│   │   ├── traffic.ts         # Tính toán thời gian di chuyển, kẹt xe, triều cường & ngập
│   │   ├── vehicle.ts         # Tiêu hao xăng/pin, hao mòn 5 bộ phận & tiệm sửa xe
│   │   ├── economy.ts         # Doanh thu hiển thị vs Lợi nhuận thực, khấu hao, tiền trọ
│   │   ├── demand.ts          # Nhu cầu cuốc xe theo giờ & thời tiết
│   │   ├── platform.ts        # App tài xế, phân hạng Đồng/Bạc/Vàng/Kim Cương, kỷ luật
│   │   ├── skills.ts          # Quản lý 5 kỹ năng, tích lũy EXP & hệ số tác động
│   │   ├── violations.ts      # Phong cách lái xe, tuần tra CSGT & xử phạt vi phạm
│   │   ├── npc.ts             # Mạng xã hội đàm thoại NPC, cập nhật điểm nóng & bẫy phạt
│   │   ├── goals.ts           # Trả góp nợ mua xe 50k/ngày, vay nóng 10% phí & lãi ngày
│   │   ├── achievements.ts    # Thẩm định mở khóa danh hiệu & thành tựu
│   │   ├── bot.ts             # Hệ thống Bot mô phỏng 4 chiến lược kiểm thử 30 ngày & xuất CSV
│   │   ├── weather.ts         # Chuỗi Markov thời tiết & nhiệt độ TP.HCM
│   │   ├── save.ts            # Quản lý lưu trữ localStorage, schemaVersion & migration
│   │   ├── types.ts           # Toàn bộ Interface, Type definitions & Action types
│   │   └── engine.ts          # Game loop, step, dispatch & view model
│   ├── ui/                    # Giao diện người dùng React 19 + Tailwind CSS
│   │   ├── components/        # TopBar, Map, Modals, AppScreen, LogPanel...
│   │   ├── hooks/             # useGameEngine hook tích hợp game loop & đếm ngược 12s
│   │   ├── utils/             # sound.ts (Web Audio API Synthesizer)
│   │   └── App.tsx            # Bố cục giao diện Desktop 3 cột & Mobile Tabs
│   ├── main.tsx
│   └── index.css
├── tests/                     # 18 test suites kiểm thử tự động với Vitest
│   ├── sim/
│   │   ├── time.test.ts
│   │   ├── stats.test.ts
│   │   ├── vehicle_wear.test.ts
│   │   ├── accidents.test.ts
│   │   ├── traffic.test.ts
│   │   ├── economy.test.ts
│   │   ├── weather.test.ts
│   │   ├── platform.test.ts
│   │   ├── skills.test.ts
│   │   ├── world_society.test.ts
│   │   ├── achievements.test.ts
│   │   ├── save.test.ts
│   │   ├── determinism.test.ts
│   │   ├── orders.test.ts
│   │   ├── engine.test.ts
│   │   ├── bot.test.ts
│   │   └── benchmark.test.ts
├── DECISIONS.md               # Nhật ký các quyết định thiết kế & kiến trúc (thư mục gốc)
├── LICENSE                    # Giấy phép phần mềm mã nguồn mở MIT
└── package.json
```

---

## 🎮 Tổng kết 6 Cột mốc hoàn thành

### ✅ Mốc 1: Lõi thời gian + 4 Chỉ số
* Vòng lặp thời gian 24h, 1 tick = 1 phút game, tua nhanh x1, x2, x4, x8 hoặc tạm dừng.
* 4 chỉ số cơ bản (Thể lực, No, Tỉnh táo, Tinh thần) với công thức suy hao theo thời gian, thời tiết và cường độ làm việc.
* Hiệu ứng cà phê bùng nổ tỉnh táo rồi sập sau 3h kèm cơ chế nhờn thuốc từ ly thứ 3.
* Chợp mắt 20 phút (cooldown 4h) và giấc ngủ dài với nợ ngủ `sleepDebt` cập nhật vào 05:00 sáng.

### ✅ Mốc 2: Cuốc xe + Kinh tế cơ bản
* Bộ máy phát cuốc (Dispatch Engine) tính toán xác suất nổ đơn theo mật độ điểm chờ, nhu cầu giờ cao điểm và thời tiết.
* Thẻ cuốc xe đếm ngược **12 giây thực** với thông tin điểm đón, điểm trả, khoảng cách, thu nhập ước tính.
* Vòng đời cuốc xe hoàn chỉnh cho 🍔 Giao đồ ăn & 🛵 Chở khách.
* 7 nhóm tính cách khách hàng tác động đến tiền tip và khiếu nại.
* Màn hình Tổng kết ngày đối chiếu **Doanh thu App** vs **Lợi nhuận thực tế sau chi phí**.

### ✅ Mốc 3: MVP Chơi Được & Bot Mô Phỏng 7 Ngày
* **Bản đồ Graph 2D SVG**: Mô phỏng 12 quận huyện TP.HCM và các cung đường nối với hiệu ứng phát sáng khi có cuốc xe di chuyển.
* **Điểm ưu tiên phát cuốc ẩn (Hidden Dispatch Score)**: Áp dụng nhiễu Gaussian $\varepsilon \sim \mathcal{N}(0, 0.2)$.
* **Hệ thống phân hạng tài xế**: Đồng, Bạc, Vàng, Kim Cương kèm kỷ luật cảnh cáo/khóa tài khoản tạm thời.
* **Lưu & Tải game**: Quản lý `localStorage` an toàn, hỗ trợ nút Lưu game và Reset trên TopBar.
* **Bot mô phỏng Headless**: Kiểm thử 4 chiến lược tài xế với chức năng trích xuất dữ liệu ra CSV.

### ✅ Mốc 4: Chiều sâu (Chỉ số ẩn, Hao mòn xe, Sự kiện & Tai nạn)
* **Chỉ số ẩn & Sức khỏe dài hạn**:
  * `baseFatigue` (Mệt nền): Tích lũy khi chạy quá 10h/ngày, làm giảm hiệu suất hồi phục thể lực khi ngủ.
  * `health` (Sức khỏe tổng quát): Giảm khi dầm mưa bão, nhịn đói hoặc thiếu ngủ kinh niên; dưới 40 kích hoạt trạng thái ốm sốt (`isSick`).
  * `phoneBattery` (Pin điện thoại): Tiêu hao khi bật GPS, tự động ngắt nhận cuốc khi hết pin; hỗ trợ ghé quán sạc pin.
* **Hao mòn 5 bộ phận xe & Bảo dưỡng**: Lốp (~8.000km), Nhớt (~1.500km), Bố thắng (~10.000km), Nhông sên dĩa (~15.000km), Bugi (~8.000km). Tiệm sửa xe `MaintenanceModal` cho phép thay thế phục hồi 100%.
* **Xác suất Tai nạn giao thông (Mục 10)**: Phân cấp 3 mức độ (Nhẹ, Vừa, Nặng) phụ thuộc vào tốc độ, mưa, chạy đêm, mệt mỏi và độ mòn lốp/phanh.
* **18 Sự kiện đường phố tương tác**: Thủng lốp, chết máy ngập nước, khách tip lớn, khách chửi, khách quên đồ, lừa đảo, rủ nhậu... với lựa chọn đánh đổi rủi ro / chi phí.
* **3 Chế độ dẫn đường**: `fast` (Nhanh nhất), `light` (Né kẹt xe), `dry` (Né ngập triều cường).

### ✅ Mốc 5: Thế giới & Xã hội
* **Mạng lưới 12 khu vực TP.HCM**: Đầy đủ các quận trọng điểm từ Quận 1, 3, Bình Thạnh đến Tân Bình (Sân bay), Quận 7, KCN Bình Tân, Phố Tây Bùi Viện kèm điểm chờ chiến lược.
* **5 Cây Kỹ năng tài xế (Cấp 0–5)**: Thuộc đường, Giao tiếp, Giữ đồ, Lái an toàn, Tự chủ với điểm kinh nghiệm EXP thực tế.
* **Lực lượng CSGT & Phong cách lái xe**: 4 phong cách (`safe`, `normal`, `rush`, `shortcut`). Nếu đi tắt vượt đèn gặp chốt CSGT sẽ bị lập biên bản phạt từ 400.000đ đến 1.000.000đ (`PoliceFineModal`).
* **Mạng xã hội đàm thoại 12 NPC tài xế**: Chia sẻ tình hình ngập nước, kẹt xe, chốt CSGT và quán ăn làm lâu (`CommunityModal`).
* **3 Loại Phương tiện chơi được**:
  * *Honda Wave Alpha*: Xe máy xăng phổ thông, tiết kiệm xăng.
  * *VinFast Evo 200 (Xe điện)*: Quản lý dung lượng pin (0-100%), đổi pin nhanh 15.000đ tại trạm hoặc sạc chậm tại nhà.
  * *Toyota Vios 1.5E (Taxi 4 chỗ)*: Cước mở cửa cao, không nhận đơn hẻm, tiêu hao 6.5L/100km, phí trạm sân bay; Showroom & Gara `VehicleShopModal`.
* **Mục tiêu cuộc đời & Nợ vay**: Trả góp nợ xe 50.000đ/ngày vào 05:00 sáng; hỗ trợ vay nóng cứu nguy khi cạn tiền (`GoalsModal`).

### ✅ Mốc 6: Hoàn thiện, Đánh bóng & Cân bằng Toàn diện
* **12 Danh hiệu & Thành tựu (`achievements.json`)**: Bộ thẩm định tự động `evaluateAchievements` và popup tôn vinh `AchievementsModal`.
* **Báo cáo Thống kê Dài hạn (`StatisticsModal`)**: Lưu trữ và tổng kết lịch sử nhiều ngày về doanh thu, chi phí nhiên liệu/ăn uống, quãng đường và thu nhập trung bình theo giờ.
* **Mùa Tết Nguyên Đán (`TetHolidayModal`)**: Hệ số Surge x1.6–x2.0; lựa chọn nhân văn giữa mua vé xe 800.000đ về quê đón Tết cùng gia đình (hồi 100% sức khỏe, xóa nợ ngủ) hay ở lại Sài Gòn cày xuyên Tết.
* **Âm thanh Synthesizer Web Audio API**: Tự tổng hợp 100% qua code trong `sound.ts` (chuông nổ đơn, tiền rơi leng keng, còi hụ cảnh sát, tiếng va quẹt, nhạc thăng cấp, nút Mute/Unmute).
* **Kiểm thử mô phỏng 30 ngày Bot Simulation**: Xác thực tính ổn định kinh tế và quy luật đánh đổi sức khỏe.

---

## 📊 Bảng tổng hợp Kiểm thử Bot Mô phỏng Multi-Seed (Mục 19)

Kiểm thử tự động chạy trên lõi headless qua 5 seed ngẫu nhiên độc lập (`tests/sim/benchmark.test.ts`):

| Chiến lược Bot | Chu kỳ mục tiêu | Thời gian sống (Min – Max – Avg) | Tổng số cuốc (Avg) | Tổng lợi nhuận ròng (Min – Max – Avg) | Tỷ lệ sụp đổ | Đánh giá & Khớp Đặc Tả Mục 19 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Balanced Bot** (Cân bằng) | **30 ngày** | **32 ngày** (32 – 32 – 32) | **962 cuốc** | 10.879k – 12.456k (**+11.529.619 đ**) | **0%** *(Sống sót)* | Bền vững tuyệt đối. Thu nhập ròng đạt ~360k/ngày (thuộc khoảng chuẩn 350k–550k/ngày sau khi trừ 50k tiền trọ và tiền ăn); tự bảo dưỡng xe định kỳ; không kiệt sức. |
| **Workaholic Bot** (Ham chạy) | **7 ngày** | **3 ngày** (2 – 5 – 3) | **116 cuốc** | 942k – 1.323k (**+1.070.657 đ**) | **100%** *(Sụp đổ)* | **Sụp đổ trong vòng $\le 7$ ngày** đúng spec. 2–3 ngày đầu kiếm rất tốt (>350k–500k/ngày sau chi phí) tạo "bẫy cày cuốc", sau đó nợ ngủ >12h gây ngất xỉu hoặc tai nạn nghiêm trọng. |
| **Lazy Bot** (Lười biếng) | **7 ngày** | **7 ngày** (7 – 7 – 7) | **59 cuốc** | -347k – +321k (**+14.596 đ**) | **0%** *(Sống sót)* | Chỉ chạy 4h/ngày, sống sót an toàn nhờ ngủ 10h nhưng sau khi trừ tiền phòng trọ (50k/ngày) và ăn uống thì lợi nhuận ròng xấp xỉ 0 hoặc âm; không đủ trả nợ mua xe. |
| **Peak Hunter Bot** (Săn cao điểm) | **7 ngày** | **7 ngày** (7 – 7 – 7) | **79 cuốc** | 440k – 1.329k (**+908.178 đ**) | **0%** *(Sống sót)* | **Hiệu suất thu nhập trên giờ làm việc cao nhất** (~29.000 đ net/h online thực tế). Chiến lược này tối ưu thời gian nhưng tổng thu nhập tháng không bằng Balanced Bot (đúng spec). |

---

## ⚙️ Hướng dẫn Cân bằng Game (`data/balance.json`)

Tất cả các hằng số sinh học, suy hao, tiền trọ và thời gian được cấu hình tập trung trong `data/balance.json` (khớp hoàn toàn giữa code và tài liệu):

* `time`: Bắt đầu lúc 05:00 sáng; 1 giờ game = 90 giây thời gian thực ở tốc độ x1 (1 tick = 1 phút game = 1.5 giây thực).
* `livingCosts`: Tiền thuê phòng trọ bình dân 50.000đ/ngày (1.500.000đ/tháng), tự động khấu trừ vào 05:00 sáng mỗi ngày.
* `stats`:
  * **Thể lực (`stamina`)**: Lái xe: **-5.0/giờ** (-0.083/phút); Chờ khách: **-1.5/giờ** (-0.025/phút); Nghỉ ngơi: **-0.5/giờ**; Nắng nóng $\ge 34^\circ\text{C}$: cộng thêm -2.0/giờ; Mưa to/bão: cộng thêm -2.0/giờ; Ngủ: hồi phục **+12.0/giờ** (bị giảm hiệu suất nếu có mệt nền `baseFatigue`).
  * **No (`hunger`)**: Tiêu hao cơ bản: **-4.0/giờ** (-0.067/phút); Khi đói bụng (< 20%) làm tụt tinh thần -2.0/giờ; Đói lả (< 10%) gây hao mòn -2.0 sức khỏe/giờ.
  * **Tỉnh táo (`alertness`)**: Ban ngày (6h–22h): **-3.0/giờ** (-0.05/phút); Ban đêm (23h–5h): **-6.0/giờ** (-0.10/phút); Nhân hệ số phạt nợ ngủ ($1 + 0.15 \times \text{sleepDebt}$); Ngủ hồi phục **+14.0/giờ**.
  * **Cà phê (`coffee`)**: Tăng tức thì **+20 tỉnh táo**; sau 3 giờ hết tác dụng bị sụt pin **-15 tỉnh táo**; uống từ ly thứ 3 bị nhờn thuốc (giảm hồi phục) và trừ -2 sức khỏe dài hạn.
  * **Chợp mắt (`nap`)**: Chợp mắt 20 phút hồi **+15 tỉnh táo, +5 thể lực**; thời gian hồi chiêu (cooldown): 240 phút (4 tiếng).
  * **Nợ ngủ (`sleepDebt`)**: Chuẩn 7 giờ ngủ/ngày; thiếu ngủ tích lũy nợ ngủ; nợ ngủ $\ge 10$h làm suy giảm sức khỏe -3/ngày; nợ ngủ $\ge 18$h dẫn đến sụp đổ kiệt sức.
* `tetSeason`: Diễn ra từ ngày 25 đến 33; giá cước Surge x1.6–x2.0; lựa chọn về quê ăn Tết (vé xe 800k, hồi phục +30 sức khỏe, tinh thần 90, giảm 50% nợ ngủ, nghỉ chạy mùng 1-3).
* `accidents`: Tai nạn nghiêm trọng khiến tài xế phải nằm viện điều trị từ 3 đến 14 ngày (randomized), viện phí 5–15 triệu đồng.
* `emergencyLoan`: Vay nóng khẩn cấp chịu phí dịch vụ 10% cắt trước và lãi suất lũy tiến 0.5%/ngày (~15%/tháng).

---

## 📜 Giấy phép & Bản quyền
Dự án phát hành theo giấy phép mã nguồn mở **MIT License** (xem chi tiết tại [`LICENSE`](file:///d:/01_Projects/AntiGravity/TaiXe/LICENSE)). Mọi số liệu và địa danh dựa trên thực tế đời sống tài xế công nghệ tại Thành phố Hồ Chí Minh.

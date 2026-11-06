# Tài Xế Công Nghệ — Đặc tả & kế hoạch triển khai

*Tài liệu bàn giao cho agent thực hiện · Phiên bản 1.0 · 06/11/2026*

## 0. Cách dùng tài liệu này

- Đây là nguồn sự thật duy nhất của dự án. Mọi con số trong tài liệu là **giá trị khởi điểm để cân bằng**, không phải chân lý. Đặt toàn bộ vào file cấu hình JSON, không hard-code.
- Khi thiếu thông tin: **chọn mặc định ở mục 3, ghi quyết định vào `DECISIONS.md`, rồi làm tiếp**. Chỉ dừng hỏi khi bị chặn hoàn toàn.
- Làm theo thứ tự các mốc ở mục 18. Mỗi mốc phải chạy được và có test trước khi sang mốc sau.
- Ngôn ngữ giao diện và nội dung game: tiếng Việt. Tên biến, code, comment: tiếng Anh.
- Giá cước, chiết khấu, giá xăng, mức phạt là ước lượng gần thực tế. Nếu có điều kiện thì kiểm tra lại, nhưng không để việc đó chặn tiến độ.

## 1. Tầm nhìn

Game mô phỏng một ngày 24 giờ của tài xế công nghệ ở TP.HCM: giao đồ ăn và chở khách bằng xe máy (sau đó xe điện, ô tô). Người chơi liên tục cân bằng **kiếm tiền ↔ giữ sức khỏe**.

Câu hỏi xuyên suốt: **“Chạy thêm một cuốc nữa có đáng không?”** Mọi tính năng phải tạo ra một sự đánh đổi phục vụ câu hỏi này. Tính năng không tạo đánh đổi thì hoãn.

**Năm trụ cột thiết kế**

1. **Đánh đổi thật**: lợi ngay, trả giá sau (nước tăng lực, bỏ bảo dưỡng, bỏ bữa, vượt đèn đỏ).
2. **Thông tin không hoàn hảo**: app không minh bạch, người chơi học bằng kinh nghiệm.
3. **Hậu quả tích lũy nhiều ngày**: nợ ngủ, mệt nền, hao mòn xe.
4. **Chiều sâu từ ra quyết định**, không từ đồ họa hay cảm giác lái.
5. **Khoảnh khắc “ngộ ra”**: màn tổng kết cho thấy lợi nhuận thực thấp hơn doanh thu hiển thị.

## 2. Phạm vi

- **MVP (mốc 1–3)**: đồng hồ 24h, 4 chỉ số, xe máy xăng, 1 vùng chơi (graph khu vực), giao đồ ăn + chở khách, giờ cao/thấp điểm, chọn điểm chờ, ăn/ngủ/đổ xăng, rating cơ bản, tổng kết cuối ngày có thu nhập thực.
- **Sau MVP (mốc 4–6)**: chỉ số ẩn (nợ ngủ, mệt nền, sức khỏe), thời tiết/kẹt xe/ngập, hao mòn, CSGT/tai nạn, sự kiện ngẫu nhiên, hạng tài xế, thưởng/khóa tài khoản, NPC/cộng đồng, xe điện/ô tô, kinh tế dài hạn, thành tựu, Tết.
- **Ngoài phạm vi**: bản đồ thật 1:1, mô phỏng lái xe, đồ họa 3D, multiplayer, tích hợp API thật của Grab/Be.

## 3. Quyết định kỹ thuật mặc định

| Hạng mục | Mặc định |
| --- | --- |
| Nền tảng | Web (chạy được trên desktop và điện thoại) |
| Stack | TypeScript + Vite + React (UI) + Vitest (test) |
| Kiến trúc | **Lõi mô phỏng thuần TypeScript, tách hẳn khỏi UI**, chạy headless được, deterministic với RNG có seed (mulberry32) |
| Hiển thị | Giao diện menu/panel + **sơ đồ khu vực dạng graph 2D** (SVG), không dùng tile map |
| Nhịp thời gian | Thời gian thực có tua x1/x2/x4/x8; **1 giờ game = 90 giây thực ở x1** (một ngày ≈ 36 phút). Tự tua khi ngủ; tự về x1 và tạm dừng khi có cuốc đến hoặc sự kiện |
| Tick | 1 tick = 1 phút game |
| Lưu trữ | localStorage, có `schemaVersion` và hàm migrate |
| Cấu hình | `/data/*.json` (xe, giá, sự kiện, khu vực, đường cong nhu cầu, thưởng) |
| Bối cảnh | TP.HCM, tiền VNĐ, giờ 24h |

## 4. Hệ thống thời gian và nhu cầu

- Ngày mặc định bắt đầu 05:00. Có lịch tuần (T2–CN). Thứ 7/CN và lễ/Tết có hệ số riêng.
- **Đường cong nhu cầu** (hệ số 0–1 theo giờ 00→23), dùng làm điểm khởi đầu:

```
ride: [0.15,0.08,0.05,0.04,0.08,0.30,0.70,1.00,0.80,0.50,0.45,0.50,
       0.55,0.45,0.40,0.50,0.70,1.00,0.95,0.70,0.55,0.50,0.40,0.25]
food: [0.10,0.05,0.02,0.01,0.02,0.10,0.25,0.35,0.30,0.35,0.70,1.00,
       0.85,0.40,0.30,0.40,0.55,0.80,1.00,0.85,0.60,0.40,0.25,0.12]
```

- **Hệ số điều chỉnh** (cấu hình được):
  - Cuối tuần: ride khu văn phòng ×0.6, food khu dân cư ×1.15, ride khu bar sau 22:30 ×1.5.
  - Mưa: food ×1.4, ride ×1.2, tốc độ giao thông ×0.75, số tài xế online ×0.8 (nên giá và cuốc tốt hơn nhưng rủi ro cao hơn).
  - Cuối/đầu tháng, ngày lương: food ×1.1.
- **Phân giai đoạn trong ngày** (để thiết kế nội dung): 05:30–08:30 đi làm/đi học; 10:30–13:00 cơm trưa; 13:30–16:30 giờ chết; 16:30–19:30 tan tầm + cơm tối (kẹt nặng nhất); 19:30–22:30 ăn tối, trà sữa, đi chơi; 22:30–03:00 khách bar, giá cao rủi ro cao; 03:00–05:00 rất ít cuốc, buồn ngủ nhất.

## 5. Chỉ số nhân vật

**Chỉ số hiển thị (MVP)**, thang 0–100: **Thể lực, No, Tỉnh táo, Tinh thần**.

**Chỉ số ẩn (từ mốc 4)**: `sleepDebt` (giờ), `baseFatigue` (0–100), `health` (0–100), `hydration`, `bladder`, `phoneBattery`. Người chơi chỉ thấy qua dấu hiệu gián tiếp (cảnh báo, nhật ký), trừ khi mở khóa dụng cụ đo.

**Tốc độ biến đổi mỗi giờ game (khởi điểm)**

| Chỉ số | Giảm | Hồi |
| --- | --- | --- |
| Thể lực | Chạy xe −5; chờ cuốc −1.5; nắng gắt (>34°C) −2 thêm; mưa −2 thêm | Ngủ +12/giờ; chợp mắt +5 |
| No | −4 mọi lúc | Cơm bình dân (35k) +45; bánh mì (20k) +25; mì gói (15k) +30; quán xịn (80k) +60 và Tinh thần +5. Ăn mất 15–30 phút game |
| Tỉnh táo | −3 ban ngày; −6 từ 23:00–05:00; nhân (1 + 0.15 × sleepDebt) | Ngủ +14/giờ; chợp mắt 20 phút +15 (hiệu quả 1 lần/4 giờ); cà phê/nước tăng lực +20 tức thì |
| Tinh thần | −2 khi No < 20; sự kiện xấu (khách chửi, hủy cuốc, bị phạt, kẹt xe lâu) | Cuốc tốt, tip, ăn ngon, nhắn tin gia đình, nghỉ ngơi |

**Cà phê/nước tăng lực**: sau 3 giờ “sập” (Tỉnh táo −15 tức thì). Nhờn thuốc: từ ly thứ 3 trong ngày, hiệu quả giảm 10% mỗi ly. Lạm dụng trừ `health` dài hạn.

**Nợ ngủ**: nhu cầu 7 giờ/ngày. Cuối mỗi ngày `sleepDebt += max(0, 7 − giờ ngủ)`; mỗi giờ ngủ vượt mức giảm nợ 0.5. Nợ ngủ làm Tỉnh táo giảm nhanh hơn và hồi chậm hơn.

**Ngưỡng và hậu quả**

- Tỉnh táo < 30: mỗi giờ xác suất ngủ gật = `(30 − tỉnh táo)/30 × 0.12`. Khi xảy ra: 70% giật mình (Tinh thần −5, có thể hủy hành trình), 30% **tai nạn**.
- Thể lực < 25: tốc độ di chuyển −20%, tăng xác suất đi sai đường/trễ.
- No < 20: Tinh thần −3/giờ, dễ cáu với khách (rating giảm).
- Tinh thần < 30: tăng xác suất phản ứng xấu, khiếu nại; mở lựa chọn “nghỉ cho khuây khỏa”.
- `health` (mốc 4): giảm khi dầm mưa không áo mưa (−3/giờ), nợ ngủ > 10 (−2/ngày), bỏ bữa lâu, lạm dụng caffeine. `health` < 40 → **ốm**: bắt buộc nghỉ 1–3 ngày và tốn chi phí khám/thuốc.
- **Mệt nền** `baseFatigue`: tăng khi chạy > 10 giờ/ngày nhiều ngày liên tiếp, giảm chậm khi có ngày nghỉ. Mệt nền cao làm giảm mức hồi thể lực khi ngủ. Đây là cơ chế biến “cố thêm một cuốc nữa” thành hậu quả dài hạn.

## 6. Phương tiện

| Xe | Giá (tham khảo) | Nhiên liệu | Ghi chú |
| --- | --- | --- | --- |
| Wave Alpha | \~18 triệu | \~1.9 L/100km, bình 3.7L | Rẻ, bền, mặc định lúc bắt đầu |
| Vision | \~32 triệu | \~2.0 L/100km, bình 4.9L | Êm hơn, ít mệt hơn |
| Air Blade | \~45 triệu | \~2.2 L/100km, bình 4.4L | Nhanh, thùng chứa tốt |
| Xe điện (kiểu Feliz/Evo) | \~25–35 triệu hoặc thuê pin | Tầm \~80 km/lần; sạc \~4 giờ hoặc đổi pin \~15k | Chi phí chạy thấp, phải quản lý pin/trạm |
| Ô tô xăng (kiểu Vios) | \~480 triệu, trả góp | \~6.5 L/100km | Giá cước cao, phí đậu/BOT, khó lách hẻm |
| Ô tô điện (kiểu VF5) | \~530 triệu hoặc thuê | \~13 kWh/100km | Phụ thuộc trạm sạc |

- **Giá xăng khởi điểm \~23.000đ/lít**, dao động ±8% mỗi tuần (sự kiện “xăng tăng/giảm”).
- **Hao mòn** (`condition` 0–100 cho từng bộ phận): lốp (\~8.000 km), nhớt (\~1.500 km), bố thắng (\~10.000 km), xích/nhông sên dĩa (\~15.000 km), bugi (\~8.000 km), ắc quy. Điều kiện thấp làm tăng xác suất hỏng, thủng lốp, tai nạn, tốn xăng.
- **Nâng cấp phụ kiện**: giá đỡ điện thoại, áo mưa tốt, sạc dự phòng, thùng giao hàng, bọc yên, camera hành trình, găng tay, kính, nón tốt. Mỗi món có hiệu ứng nhỏ nhưng rõ (ví dụ áo mưa tốt giảm trừ `health` khi mưa, sạc dự phòng chống hết pin).
- Đổ xăng mất \~5 phút game và tiền. Hết xăng/pin giữa đường = sự kiện (đẩy xe, gọi cứu hộ, tốn tiền và thời gian).

## 7. Nền tảng (app giả lập kiểu Grab/Be/Xanh SM)

**Luồng nhận cuốc**

1. Người chơi bật “Online” và đang ở một **điểm chờ** (mục 12).
2. Hệ thống sinh cuốc theo xác suất (bên dưới). Khi có cuốc: tự về x1, hiện thẻ cuốc: loại cuốc, quãng đường đón, quãng đường chở, giá, điểm đến (có thể ẩn một phần theo loại), đếm ngược **12 giây thực**.
3. Chấp nhận / từ chối / hết giờ (tính như từ chối).

**Tốc độ phát cuốc** tại điểm chờ, mỗi phút game: `λ = base_zone × demand(giờ, khu) × spotDensity × weather × dispatchFactor ÷ onlineDrivers`.

**Điểm ưu tiên ẩn (người chơi không thấy công thức)**

```
score = 0.35·rating_norm + 0.25·acceptRate + 0.20·(1 − cancelRate)
      + 0.20·proximity_norm + ε   (ε ~ N(0, 0.2))
```

`dispatchFactor` tăng theo `score`. Cố ý để nhiễu: đôi khi cuốc tốt đến ngay sau khi vừa từ chối cuốc xấu, hoặc ngược lại. **Không tương quan hoàn toàn** để tạo cảm giác “app không minh bạch”.

**Từ chối cuốc**: giảm `acceptRate`; cuốc tiếp theo bị trễ ngẫu nhiên 20–90 giây game.

**Rating**: trung bình 50 cuốc gần nhất (1–5 sao). **Hạng tài xế** (Đồng/Bạc/Vàng/Kim cương) theo điểm tích lũy, ảnh hưởng chiết khấu và ưu tiên:

| Hạng | Chiết khấu nền tảng | Ưu tiên phát cuốc |
| --- | --- | --- |
| Đồng | 25% | ×1.00 |
| Bạc | 22% | ×1.05 |
| Vàng | 20% | ×1.10 |
| Kim cương | 18% | ×1.15 |

**Thưởng**: theo chuỗi/khung giờ (ví dụ 10 cuốc trong 11:00–14:00 → +50k). Thiết kế cố ý để cám dỗ chạy quá sức.

**Khóa tài khoản**: rating < 4.6 hoặc tỷ lệ hủy > 15% → cảnh cáo; 2 lần cảnh cáo → khóa tạm 1–3 ngày.

**Ví**: tiền mặt và thanh toán qua app. Cuốc tiền mặt thì tài xế giữ tiền, **chiết khấu bị trừ vào ví**. Ví < −200.000đ → không nhận cuốc tiền mặt đến khi nạp.

**Hiển thị vs thực tế**: app chỉ hiện doanh thu. Lợi nhuận thực (trừ xăng, hao mòn, ăn uống, khấu hao, trả góp) chỉ hiện ở màn tổng kết.

## 8. Đơn giao đồ ăn

**Vòng đời**: `OFFERED → ACCEPTED → TO_MERCHANT → AT_MERCHANT (chờ món) → PICKED → TO_CUSTOMER → AT_CUSTOMER (tìm địa chỉ/liên lạc) → DELIVERED | CANCELLED | FAILED`.

**Tiền công tài xế (khởi điểm)**: 14.000đ cho ≤ 2 km, +4.500đ/km sau đó; +10% giờ cao điểm; +5.000–10.000đ khi mưa; nhân hệ số tăng giá (surge). Sau đó trừ chiết khấu nền tảng.

**Tham số tình huống**

- **Chờ món**: thời gian chuẩn bị theo phân phối lognormal, trung bình 8 phút; ×1.5 ở giờ cao điểm; mỗi quán có “độ chậm” riêng (người chơi học qua nhiều ngày hoặc qua tin từ cộng đồng).
- **Đơn ghép**: 2 đơn cùng tuyến, tiền +60% nhưng mỗi đơn có deadline riêng; dễ trễ nếu quán chậm.
- **COD**: tài xế phải ứng tiền (cần đủ tiền mặt); \~3% bom hàng (khách không nhận, tài xế chịu thiệt một phần).
- **Món dễ hỏng** (trà sữa, canh, lẩu): xác suất đổ/khiếu nại tăng theo tốc độ di chuyển, đường xấu, tình trạng xe.
- **Độ khó địa chỉ** 0–3: số nhà sai, hẻm ngoắt ngoéo, chung cư phải gửi bảo vệ, tòa nhà đông, KCN, ký túc xá. Mất thêm 2–10 phút tìm.
- **Khách không nghe máy**: chờ 5 phút gọi/nhắn; sau 10 phút được hủy và nhận đền bù \~50%.
- **Trễ giờ**: trễ > 10 phút → 25% khiếu nại và giảm rating.
- **Tip**: xác suất cơ bản \~12%, tăng khi mưa, giao nhanh, thái độ tốt, đồ nguyên vẹn.

## 9. Cuốc chở khách

**Giá cước (khởi điểm)**

- Xe máy: 12.000đ cho 2 km đầu + 5.000đ/km.
- Ô tô 4 chỗ: 28.000đ cho 2 km đầu + 11.000đ/km.
- Surge tối đa ×1.8 (theo khu, giờ, mưa). Trừ chiết khấu nền tảng.

**Hồ sơ khách** (xác suất tham khảo): bình thường 55%, vội 15%, nhiều đồ 8%, nhóm 7%, khách nước ngoài 5%, khó tính 6%, say xỉn (chỉ ở khu bar 22:30–03:00, \~18% số cuốc ở đó) 4% tổng thể.

**Tình huống**

- **Hủy cuốc**: khách hủy \~6%, ×2 nếu tài xế đến trễ > 5 phút. Nếu đã đến điểm đón, nhận đền bù 8.000–15.000đ.
- **Sai điểm đón**: phải gọi điện, mất thêm thời gian.
- **Say xỉn**: có thể ói (ô tô: phí vệ sinh 100–300k), cãi vã, trả thiếu tiền.
- **Cuốc ngắn giá thấp vs. cuốc dài**: cuốc dài về nơi vắng buộc chạy rỗng về (rủi ro “cuốc lỗ”). App chỉ hiện điểm đến ở mức khu vực để người chơi phải cân nhắc.
- **Sân bay**: xếp hàng chờ 30–90 phút, cuốc ô tô \~150–250k; phí vào sân bay/BOT.
- **Đồ bỏ quên**: lựa chọn trả lại (mất thời gian, được thưởng/rating) hoặc bỏ qua (rủi ro khiếu nại).
- **Chấm điểm sao** dựa trên: thời gian đón, thái độ, độ êm (tốc độ/đường), sạch sẽ, đi đúng tuyến. Điểm này nuôi `rating` ở mục 7.

## 10. Giao thông, thời tiết, pháp luật

**Bản đồ là graph trừu tượng**, không phải bản đồ thật. Mỗi node là một khu với `type`, `floodProne`, `crimeRisk`; mỗi cạnh có `km` và `freeSpeedKph` (xe máy nội đô \~30). Khu đề xuất (12): Quận 1 (văn phòng, ăn uống), Quận 3, Bình Thạnh (chung cư, hay ngập đoạn Nguyễn Hữu Cảnh), Phú Nhuận, Tân Bình (sân bay), Gò Vấp (dân cư), Quận 10/5 (chợ, bệnh viện), Quận 7 (chung cư, hay ngập đường Huỳnh Tấn Phát), Thủ Đức/Thảo Điền (văn phòng, hay ngập), Bình Tân (KCN, công nhân), Quận 12/Hóc Môn (ngoại thành), khu bar/ẩm thực đêm.

**Thời gian di chuyển** = `km / (freeSpeed × trafficMult × weatherMult × vehicleCondMult × staminaMult)` + nhiễu + 1–5 phút tìm chỗ đậu/địa chỉ.

- `trafficMult`: 0.55 giờ cao điểm (07–09, 17:00–19:30); 0.85 ban ngày; 1.0 đêm. Tai nạn/công trình làm một cạnh chậm thêm 30–60 phút.
- **Chế độ tuyến**: Nhanh nhất / Ít kẹt / Tránh ngập (từ mốc 4). Mỗi chế độ đổi thời gian, xăng, rủi ro.
- **Ngập**: khi mưa to ở khu `floodProne`, cạnh bị ×0.3 tốc độ; vào vùng ngập có 15% chết máy (cao hơn nếu xe thấp/bugi yếu).
- **Thời tiết**: chuỗi Markov (nắng, nhiều mây, mưa nhỏ, mưa to, giông). Mùa mưa (tháng 5–11): \~55% ngày có mưa chiều 13:00–18:00; mùa khô \~10%. Nhiệt độ 26–36°C theo giờ. Hiển thị dự báo 3 giờ tới, **có sai số**.

**Pháp luật và “đi tắt”** (từ mốc 5). Người chơi có thể chọn: vượt đèn đỏ, đi ngược chiều, chạy quá tốc độ, đi vỉa hè. Mỗi cái tiết kiệm 1–4 phút nhưng có xác suất bị phạt (trung tâm \~5%, ngoại thành \~1.5%, tăng nếu có camera) và tăng xác suất tai nạn. Mức phạt khởi điểm 400.000–1.000.000đ, cấu hình được. Sự kiện “bạn rủ nhậu” mà vẫn chạy xe: phạt rất nặng và nghỉ nhiều ngày (game không khuyến khích hành vi này).

**Tai nạn**, xác suất mỗi giờ chạy:

```
P = 0.0015 × speedMode(1.0|1.3) × rain(1|2) × night(1|1.4)
  × (1 + max(0,(30 − alertness)/30)) × (1 + max(0,(50 − minCond(lốp,phanh))/50))
```

Mức độ: **nhẹ** (trầy xe 200–800k, mất 30 phút), **vừa** (sửa 1–4 triệu, nghỉ 1 ngày, `health` −10), **nặng** (viện phí 5–30 triệu, nghỉ 3–14 ngày). Bảo hiểm tai nạn (mua được) giảm chi phí.

**An ninh**: ở khu `crimeRisk` cao ban đêm, vừa chờ vừa cầm điện thoại có xác suất rất thấp bị giật. Mất điện thoại = mất cuốc, mua mới.

## 11. Kinh tế

**Thu**: tiền cuốc (sau chiết khấu) + tip + thưởng + đền bù.

**Chi hằng ngày**: xăng/điện, ăn uống, nước, cà phê.

**Chi định kỳ** (theo chu kỳ tháng game): tiền trọ 2,5–4 triệu (chọn chỗ ở: trọ rẻ nhưng xa khu đông khách, hoặc trọ gần đắt hơn; ảnh hưởng thời gian di chuyển đầu ngày và chất lượng ngủ), trả góp xe, data điện thoại 100–150k, bảo hiểm, bảo dưỡng, tiền gửi gia đình (mục tiêu), chi phí khám bệnh.

**Lợi nhuận thực**:

```
net = doanh thu − chiết khấu − nhiên liệu − hao mòn (theo km)
    − khấu hao xe (giá xe / tuổi thọ km) − ăn uống − phạt − sửa chữa
```

Cuối ngày hiển thị **cả hai con số cạnh nhau** (doanh thu app vs lợi nhuận thực) và **thu nhập thực mỗi giờ** (tính cả giờ chờ và chạy rỗng). Ghi riêng km chở khách/giao hàng và km chạy rỗng.

**Mục tiêu nhân vật** (chọn đầu game): trả hết nợ xe; gửi mẹ 5 triệu/tháng; đóng học phí cho con; dành vốn mở quán nhỏ. Mục tiêu tạo áp lực vừa đủ và cho game một đích.

**Ví**: tiền mặt, ví app, tiết kiệm, nợ. Vay nóng (lãi cao, cám dỗ) chỉ thêm ở mốc 5 trở đi và phải thiết kế thận trọng.

**Mục tiêu cân bằng** (tham khảo; chỉnh trong `balance.json`): người chơi hợp lý chạy 10–11 giờ/ngày, lợi nhuận thực \~350.000–550.000đ/ngày; chạy 14+ giờ lên \~600.000–750.000đ/ngày nhưng sau \~5 ngày `health` và mệt nền kéo thu nhập xuống; chi phí sống cố định \~200.000đ/ngày (trọ + ăn).

## 12. Điểm chờ

Người chơi **chọn nơi đứng chờ** thay vì cuốc tự rơi xuống. Đi tới điểm chờ tốn thời gian/xăng. Có thể “lang thang tìm cuốc” (tốn xăng, mật độ cuốc thay đổi ngẫu nhiên).

| Điểm chờ | Mật độ cuốc | Thiên về | An toàn | Rủi ro bị đuổi/phạt | Tiện ích |
| --- | --- | --- | --- | --- | --- |
| Ngã tư trung tâm | Cao | Chở khách | Trung bình | Trung bình | Ít |
| Cổng khu công nghiệp | Cao theo ca | Chở khách | Cao | Thấp | Quán ăn rẻ |
| Quán cà phê gần văn phòng | Trung bình | Cả hai | Cao | Thấp | Cà phê, WC |
| Bến xe/ga/sân bay | Cao nhưng xếp hàng | Chở khách đường dài | Cao | Cao (quy định bãi) | Có WC, nước |
| Chung cư lớn | Trung bình | Giao đồ ăn | Cao | Thấp (bảo vệ) | Ít |
| Khu ẩm thực | Cao giờ ăn | Giao đồ ăn | Trung bình | Trung bình | Ăn uống |
| Khu bar/đêm | Cao đêm | Chở khách | Thấp | Trung bình | Ít |
| Cây xăng/trạm nghỉ | Thấp | Cả hai | Cao | Thấp | Xăng, WC, nước |

## 13. Sự kiện ngẫu nhiên

**Cấu trúc dữ liệu**: `id`, `weight`, `conditions` (giờ, khu, thời tiết, chỉ số), `cooldown`, `options[{label, cost, effects}]`. **Nguyên tắc**: mỗi sự kiện phải có lựa chọn đánh đổi, không chỉ gây hại ngẫu nhiên. Game tự tạm dừng khi sự kiện xuất hiện.

| # | Sự kiện | Gợi ý lựa chọn/hiệu ứng |
| --- | --- | --- |
| 1 | Thủng lốp | Vá tại chỗ (\~50k, 20 phút) hoặc dắt tới tiệm |
| 2 | Hết xăng/pin giữa đường | Dắt xe hoặc gọi cứu hộ (\~100k) |
| 3 | Chết máy do ngập | Dắt xe 45 phút, sửa 300–800k |
| 4 | Khách tip lớn | +50–100k, Tinh thần +5 |
| 5 | Khách chửi/khiếu nại vô lý | Nhẫn nhịn (Tinh thần −5) hoặc cãi lại (rủi ro rating) |
| 6 | Nhặt được đồ khách bỏ quên | Trả lại (mất 20 phút, thưởng + rating) hoặc bỏ qua |
| 7 | Quán hết món/đóng cửa | Hủy nhận đền bù 30k hoặc chờ quán xử lý |
| 8 | App lỗi/mất sóng | Mất 10–20 phút cuốc |
| 9 | Tin nhắn lừa “nạp tiền mở khóa tài khoản” | Làm theo (mất 500k–3 triệu) hoặc bỏ qua |
| 10 | Bạn rủ nhậu | Từ chối, hoặc đi (Tinh thần + nhưng nghỉ phần còn lại của ngày) |
| 11 | Người nhà gọi, bị ốm | Về ngay (mất thu nhập, Tinh thần +) hoặc gửi tiền |
| 12 | Giá xăng đổi | Chi phí nhiên liệu đổi cả tuần |
| 13 | Công trình/tai nạn chặn đường | Đi vòng hoặc chờ |
| 14 | CSGT kiểm tra | Giấy tờ đủ thì qua; thiếu thì phạt |
| 15 | Nền tảng đổi chính sách | Chiết khấu/thưởng thay đổi theo tuần |
| 16 | Tài xế khác giúp đỡ/chia sẻ tin | Nhận tin hữu ích (độ tin cậy 70–90%) |
| 17 | Bị giật/mất điện thoại (hiếm) | Mua máy mới, mất cuốc hôm đó |
| 18 | Mưa giông bất chợt | Trú mưa (mất cuốc) hoặc chạy tiếp (rủi ro, thu nhập cao) |
| 19 | Khách say ói/cãi | Phí vệ sinh, Tinh thần giảm |
| 20 | Đồ ăn đổ | Tự bồi thường 50–100k hoặc giải trình (rủi ro rating) |
| 21 | Pin điện thoại yếu | Sạc ở quán (mất thời gian, +ăn uống) |
| 22 | Tài xế khác chen chỗ chờ | Nhường (mất cuốc) hoặc tranh (rủi ro Tinh thần) |
| 23 | Cảm vặt | Uống thuốc, hoặc nghỉ cho nhanh khỏi |
| 24 | Khách hẹn nơi vắng ban đêm | Nhận (rủi ro) hoặc từ chối (ảnh hưởng tỷ lệ chấp nhận) |

## 14. NPC và cộng đồng

- 10–15 tài xế NPC có tên, tính cách và “thông tin” riêng. Họ chia sẻ tin qua nhóm chat (quán nào chậm, khu nào kẹt, CSGT đứng đâu, bãi sân bay đang đông).
- Tin có độ tin cậy (70–90%); đôi khi sai. Người chơi học được ai đáng tin.
- NPC thân (ví dụ bác sửa xe) giúp khi hỏng xe, giảm giá/sửa nhanh; mối quan hệ tăng theo tương tác.
- NPC cạnh tranh: tranh chỗ chờ, chen cuốc ở điểm đông.
- Tone: tôn trọng nghề tài xế và khách hàng, tránh định kiến.

## 15. Tiến trình, kỹ năng, thành tựu

**5 cây kỹ năng** (cấp 0–5, tăng theo kinh nghiệm sử dụng, hiệu ứng nhỏ nhưng rõ):

| Kỹ năng | Hiệu ứng chính |
| --- | --- |
| Thuộc đường | Giảm thời gian di chuyển, giảm lạc đường |
| Giao tiếp | Tăng xác suất tip, giảm khiếu nại |
| Giữ đồ | Giảm xác suất đổ/hỏng hàng |
| Lái an toàn | Giảm xác suất tai nạn |
| Tự chủ | Giảm hao Tinh thần khi gặp khách khó |

- **Mở khóa khu vực** theo số cuốc và rating (nội thành → mở rộng → sân bay/ngoại thành).
- **Mùa/tháng**: mùa mưa/khô; tuần/tháng có tổng kết; **Tết (mốc 6)**: 25–30 Tết giá cao, nhiều người về quê, mùng 1–3 ít khách, người chơi tự quyết có về nhà hay không.
- **Thành tựu** ví dụ: “7 ngày không hủy cuốc”, “Mưa vẫn chạy”, “Chạy đêm 10 lần”, “Trả hết nợ xe”, “Một tuần ngủ đủ”.

## 16. Giao diện

**Bố cục desktop**: thanh trên (giờ/ngày, thời tiết, tiền mặt, tốc độ x1–x8, Online/Offline); cột trái (4 chỉ số, xe, xăng); giữa (sơ đồ khu vực SVG + trạng thái hành trình hiện tại); cột phải (app tài xế: thẻ cuốc, thu nhập, rating, hạng); dưới (nhật ký sự kiện). **Mobile**: các panel thành tab.

**Menu**: Nhà (ngủ, ăn), Xe (bảo dưỡng, nâng cấp), Cửa hàng, Ví/Mục tiêu, Thống kê, Cài đặt (tốc độ, độ khó).

**Độ khó** (Dễ/Thường/Khó): nhân hệ số cho chi phí, tốc độ giảm chỉ số, xác suất sự kiện xấu.

**Màn tổng kết cuối ngày** (bắt buộc từ mốc 2): doanh thu, chiết khấu, lợi nhuận thực, thu nhập thực/giờ, số cuốc, km (có chở/chạy rỗng), giờ chạy/ngủ/chờ, sự kiện nổi bật, thay đổi chỉ số. Mốc 4 trở đi thêm biểu đồ tuần: thu nhập, giờ ngủ, chi phí xe, số lần ốm.

## 17. Kiến trúc và dữ liệu

```
/src/sim/    rng.ts time.ts stats.ts vehicle.ts demand.ts orders.ts
             platform.ts traffic.ts weather.ts economy.ts events.ts
             npc.ts save.ts engine.ts          (thuần TS, không import UI)
/src/ui/     React components + hooks gọi engine
/data/       vehicles.json zones.json spots.json demand.json pricing.json
             events.json items.json balance.json
/tests/      unit + property tests + bot simulations
DECISIONS.md README.md
```

**API của engine** (thuần, deterministic):

```ts
createGame(seed: number, config: Config): GameState
step(state: GameState, minutes: number): GameState        // tick = 1 phút
dispatch(state: GameState, action: Action): GameState
getView(state: GameState): ViewModel                        // dữ liệu cho UI

type Action =
  | {t:'GO_ONLINE'} | {t:'GO_OFFLINE'}
  | {t:'MOVE_TO', target: string, route?: 'fast'|'light'|'dry'}
  | {t:'ACCEPT_OFFER', id: string} | {t:'REJECT_OFFER', id: string}
  | {t:'EAT', item: string} | {t:'SLEEP', hours: number} | {t:'NAP'}
  | {t:'REFUEL'} | {t:'REPAIR', part: string} | {t:'BUY', item: string}
  | {t:'CHOOSE_EVENT', eventId: string, option: number}
  | {t:'SET_SPEED_MODE', mode: 'normal'|'fast'}
```

**Quy tắc**: mọi ngẫu nhiên qua `state.rng` (seeded, lưu trong save); không dùng `Math.random()` trong `sim/`. `GameState` serialize được hoàn toàn thành JSON. UI không chứa logic game. Mọi hằng số nằm trong `/data`.

## 18. Lộ trình và tiêu chí nghiệm thu

| Mốc | Nội dung | Nghiệm thu |
| --- | --- | --- |
| **1. Lõi thời gian + chỉ số** | Time system, 4 chỉ số, ăn/ngủ/chợp mắt, UI khung, tua x1–x8 | Chạy trọn 24h game; chỉ số đổi đúng công thức mục 5; test pass; tạm dừng/tua hoạt động |
| **2. Cuốc + kinh tế cơ bản** | Điểm chờ, sinh cuốc, giao đồ ăn + chở khách, thu/chi, xăng, tổng kết cuối ngày | Nhận/hoàn thành cuốc đúng giá; màn tổng kết hiện doanh thu **và** lợi nhuận thực |
| **3. MVP chơi được** | Graph 8 khu, demand theo giờ, dispatch score, rating, save/load | Chơi liền 7 ngày không lỗi; bot cơ bản chạy hết 7 ngày; save/load khôi phục đúng trạng thái |
| **4. Chiều sâu** | Chỉ số ẩn, thời tiết, kẹt xe, hao mòn, sự kiện, tai nạn, hạng, thưởng, khóa tài khoản | Nợ ngủ/mệt nền ảnh hưởng đa ngày; ≥ 15 sự kiện hoạt động; test tai nạn/hỏng xe theo công thức |
| **5. Thế giới** | CSGT/phạt, ngập, NPC/tin tức, mục tiêu, kỹ năng, xe điện/ô tô, vay nợ | Đủ 12 khu; kỹ năng có hiệu ứng đo được; 3 loại xe chơi được |
| **6. Hoàn thiện** | Tết/mùa, thành tựu, thống kê dài hạn, âm thanh/hiệu ứng, độ khó, cân bằng cuối | Qua bài kiểm tra cân bằng mục 19; playtest 30+ ngày game không lỗi; README đầy đủ |

Sau mỗi mốc: commit, ghi `DECISIONS.md`, chạy full test, tạo seed demo.

## 19. Cân bằng và kiểm thử

- **Unit test** cho từng công thức (chỉ số, giá cước, xác suất tai nạn, dispatch).
- **Property test**: chỉ số luôn trong \[0,100\], tiền không âm vô lý, state serialize/deserialize bất biến.
- **Bot mô phỏng** chạy hàng trăm ngày với nhiều seed, xuất CSV (thu nhập, `health`, nợ ngủ, tai nạn, số ngày sống):
  - *Ham chạy*: gần như không ngủ/ăn đủ → phải **sụp đổ trong ≤ \~7 ngày** game.
  - *Cân bằng*: heuristic ăn/ngủ/chạy giờ cao điểm → sống lâu, tích lũy tiền.
  - *Lười*: chạy ít → thu nhập thấp nhưng không gục.
  - *Săn giờ cao điểm*: chỉ chạy 2 khung giờ đỉnh → phải **không thống trị** các chiến lược khác.
- **Tiêu chí**: không có chiến lược duy nhất thắng tuyệt đối; thu nhập dao động tự nhiên giữa ngày tốt/xấu; không có chuỗi vô lý (ví dụ tai nạn liên tục khi chơi đúng).
- Mọi chỉnh số làm trong `balance.json`, không sửa code. Lưu seed cho regression test.

## 20. Rủi ro, điều không làm, bàn giao

**Rủi ro chính**

- Cân bằng kinh tế là phần dễ hỏng nhất → làm bot test sớm (từ mốc 3).
- Quá nhiều chỉ số làm người chơi rối → MVP chỉ 4 chỉ số, thêm dần.
- Scope trượt → bám mốc, hoãn tính năng không tạo đánh đổi.

**Không làm (trừ khi được yêu cầu)**: bản đồ thật 1:1, mô phỏng lái xe, 3D, multiplayer, tích hợp API thật, cờ bạc/cá cược trong game, nội dung châm biếm hay định kiến về tài xế hoặc khách.

**Checklist bàn giao cuối cùng**

1. Mã nguồn chạy được (`npm install && npm run dev`) và build production.
2. Toàn bộ test pass; có báo cáo bot (CSV hoặc bảng tóm tắt).
3. `README.md`: cách chạy, cấu trúc, cách chỉnh cân bằng.
4. `DECISIONS.md`: mọi quyết định mặc định đã chọn và lý do.
5. Seed demo cho từng mốc và danh sách việc còn lại/ý tưởng mở rộng.

# Logo — Ví Của Tôi

Ô vuông vàng nghệ với chữ V. Không bo góc, đúng `--radius: 0` của cả app.

Hai màu duy nhất, không dùng màu nào khác:

| | |
|---|---|
| Vàng nghệ | `#edc948` |
| Men xanh | `#0f4c3a` |

## Dùng file nào

| File | Khi nào |
|---|---|
| `logo.svg` | **Mặc định.** Có viền men bao quanh, nền đặc — dán lên đâu cũng đọc được |
| `logo-vuong.svg` | Chỉ ô vuông vàng, không viền. Khi bạn tự kiểm soát nền |
| `logo-{16…1024}.png` | Khi chỗ nhận không chấp nhận SVG |
| `wordmark-men.png` | Logo + tên, chữ men xanh — cho **nền sáng**. Nền trong suốt |
| `wordmark-sang.png` | Logo + tên, chữ ngà — cho **nền tối**. Nền trong suốt |

Ưu tiên SVG bất cứ khi nào được: nó là bản gốc, phóng to bao nhiêu cũng nét.
PNG chỉ là bản kết xuất.

## Không phải favicon

Favicon của app là [`app/icon.svg`](../../app/icon.svg), file riêng — Next đọc
theo quy ước tên file nên không lấy từ thư mục này được. Hai file cùng một
hình; **sửa logo thì phải sửa cả hai**, cộng với
[`components/layout/logo.tsx`](../../components/layout/logo.tsx) là bản dùng
biến CSS để đi theo chế độ sáng/tối.

Ba nơi cùng giữ một hình là chấp nhận được vì hình này gần như không đổi, và
gộp lại sẽ tốn hơn: favicon phải là file tĩnh màu cứng, còn logo trong app
phải đọc được biến CSS.

## Chữ V khoét thủng hay vẽ đặc

`logo.svg` và favicon **khoét thủng** chữ V (`fill-rule="evenodd"` trên một
path duy nhất) — nền men phía sau lộ qua. Vẽ chữ V thành hình thứ hai chồng
lên sẽ hở viền khi trình duyệt khử răng cưa hai hình.

`logo-vuong.svg` thì ngược lại, **vẽ đặc**: nó không có nền riêng, khoét thủng
sẽ làm chữ V lấy màu của thứ nằm sau — đặt lên nền tối là mất chữ.

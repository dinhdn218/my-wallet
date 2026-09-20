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
| `logo-vuong-{192,512}.png` | Icon manifest. **Sinh tự động**, đừng sửa tay — xem dưới |
| `logo-vuong.svg` | Chỉ ô vuông vàng, không viền. Khi bạn tự kiểm soát nền |
| `logo-{16…1024}.png` | Khi chỗ nhận không chấp nhận SVG |
| `wordmark-men.png` | Logo + tên, chữ men xanh — cho **nền sáng**. Nền trong suốt |
| `wordmark-sang.png` | Logo + tên, chữ ngà — cho **nền tối**. Nền trong suốt |

Ưu tiên SVG bất cứ khi nào được: nó là bản gốc, phóng to bao nhiêu cũng nét.
PNG chỉ là bản kết xuất.

## Icon của app nằm ở chỗ khác

Next đọc icon theo quy ước tên file nên không lấy từ thư mục này được. Bản
gốc của mọi icon app là [`app/icon.svg`](../../app/icon.svg).

| File | Ai đọc |
|---|---|
| `app/icon.svg` | Favicon tab trình duyệt. **Bản gốc** của hai dòng dưới |
| `app/apple-icon.png` | iOS, khi thêm vào màn hình chính |
| `logo-vuong-{192,512}.png` | Android, qua [`app/manifest.ts`](../../app/manifest.ts) |

Ba file sau là BẢN DẪN XUẤT của `app/icon.svg`. Sửa logo xong phải chạy:

```bash
node scripts/tao-icon.mjs
```

Quên chạy thì favicon một đằng, icon trên màn hình chính một nẻo — mà không
có gì báo, vì hai thứ đó không bao giờ hiện cạnh nhau.

**`app/icon.svg` TRÀN MÉP, `logo.svg` thì CÓ VIỀN** — cố ý khác nhau, không
phải quên đồng bộ. Icon app được hệ điều hành tự bo góc và tự đặt lên nền của
nó, thêm viền chỉ làm ô vàng bé lại như bị đóng khung; còn `logo.svg` dùng để
dán lên nền lạ nên cần mép của riêng nó.

Bản thứ ba là [`components/layout/logo.tsx`](../../components/layout/logo.tsx)
— cùng hình tràn mép với `app/icon.svg`, nhưng dùng biến CSS để đi theo chế độ
sáng/tối. Không gộp được với file tĩnh màu cứng.

## Chữ V khoét thủng hay vẽ đặc

`logo.svg` và favicon **khoét thủng** chữ V (`fill-rule="evenodd"` trên một
path duy nhất) — nền men phía sau lộ qua. Vẽ chữ V thành hình thứ hai chồng
lên sẽ hở viền khi trình duyệt khử răng cưa hai hình.

`logo-vuong.svg` thì ngược lại, **vẽ đặc**: nó không có nền riêng, khoét thủng
sẽ làm chữ V lấy màu của thứ nằm sau — đặt lên nền tối là mất chữ.

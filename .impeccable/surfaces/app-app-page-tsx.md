---
version: 1
slug: "app-app-page-tsx"
primary_target: "app/(app)/page.tsx"
related_targets: ["app/(app)/layout.tsx","app/globals.css","app/(app)/giao-dich/page.tsx","app/(app)/ngan-sach/page.tsx","app/(app)/danh-muc/page.tsx","app/(app)/bao-cao/page.tsx"]
---

## Scope

Toàn bộ vỏ ứng dụng Ví Riêng: màn ghi nhanh (mặc định), tổng quan, giao dịch,
ngân sách, danh mục, báo cáo, đăng nhập. Visitor mode: **Operate**.

Người dùng: một người, tiếng Việt, VND. Hai cảnh dùng — đứng ở quán ghi một
khoản trong 5 giây (mobile), và ngồi xem lại tháng (desktop). Việc chính là
GHI, không phải xem.

Ràng buộc: bỏ hẳn khái niệm nguồn tiền; `activeMonth` là nguồn sự thật dùng
chung; số tiền luôn dương, dấu suy ra từ `type`; E2E bám `data-testid`.

## Direction contract

**THESIS.** Sổ chi tiêu là tấm bảng giá sơn tay của chính bạn — một cột số to
bằng nắm tay, đọc được từ bên kia đường. Từ chối dứt khoát cách dàn thẻ-bo-góc
+ donut + nền tối mà mọi app tài chính (kể cả bản hiện tại của chính app này)
đều dùng; ở đây không có thẻ nào cả, chỉ có mặt bảng và số sơn lên nó.

**OWN-WORLD.** Nền men sắt tráng xanh rêu đậm (#0F4C3A) chiếm ~40% mọi màn,
không phải accent mà là mặt bảng thật. Chữ số sơn stencil trắng ngà (#F2E8D5)
với vệt cọ hở ở chân nét. Đỏ son (#E8442B) chỉ dành cho vượt hạn mức; vàng
nghệ (#EDC948) cho khoản thu. Không gradient, không blur, không bóng đổ mềm —
chiều sâu đến từ vệt sơn dày và mép men sứt. Hàng danh mục là những thẻ giá
treo dây kẽm. Nhãn phụ set mono nhỏ xíu in hoa, tương phản kích cỡ cực đại với
cột số.

**STORY.** Người dùng mở app và thấy ngay bàn phím số — gõ được lập tức, không
qua lớp chặn nào. Họ hiểu: đây là chỗ để ghi, không phải chỗ để ngắm. Con số
"còn tiêu được" luôn hiện phía trên, nên mỗi lần ghi họ vừa nhập vừa thấy số đó
tụt xuống. Họ ghi xong trong 5 giây và đóng máy.

**FIRST VIEWPORT.** Mobile (390×844): nửa dưới (420px) là bàn phím số sơn
stencil, sẵn sàng nhận phím ngay khi mở — phím `k` và `tr` nằm cùng hàng với số.
Nửa trên là mặt bảng men: dòng mono nhỏ "CÒN TIÊU ĐƯỢC THÁNG 9" rồi con số cao
96px sơn trắng ngà; ngay dưới là dải thẻ giá danh mục cuộn ngang, thẻ đang chọn
tràn màu danh mục vào cả vùng số. Nút ghi là thanh sơn đỏ son sát mép dưới, cao
56px. Desktop (1440): mặt bảng nằm ngang — cột trái 420px giữ con số lớn cùng
bàn phím, phần còn lại là các dòng giá kẻ tay theo ngày, mỗi ngày một dòng như
bảng giá món.

**FORM.** Bảng giá quán ăn sơn tay — ứng viên số 5 trong danh sách có căn cứ đã
xếp theo độ cộng hưởng (1 sổ chợ · 2 máy tính bỏ túi · 3 hoá đơn giấy · 4 phong
bì tiền · **5 bảng giá quán** · 6 sổ tiết kiệm · 7 tem phiếu chợ đầu mối).
Seed key: `1a99081c`.

**RAISES** (từ các quân bài bị loại, chỉ lấy kỷ luật hệ thống, không lấy quần áo):
- *từ Mẫu Chữ Biến Thiên*: một con số khổng lồ áp đảo mọi nhãn mono nhỏ — thứ
  bậc dựng bằng tương phản kích cỡ, không bằng khung viền.
- *từ Hệ Nhận Diện Khối Màu*: màu chiếm nguyên vùng lớn, không rắc accent lên
  nền trung tính.
- *từ Giải Đua Khử Răng Cưa*: danh mục đang chọn làm tràn màu vào vùng số —
  trạng thái không thể bỏ sót.
- *từ Mỏ Đá Mây*: khoảng hở sâu giữa các khối thay cho đường kẻ.

**RISK.** Nếu chữ sơn set nhát tay, kết quả sẽ thành "hoài cổ dễ thương" thay vì
một công cụ đọc nhanh. Cột số phải thật lớn và vệt sơn phải thật dứt khoát mới
đứng vững. Rủi ro thứ hai: men xanh đậm phải qua được kiểm tra tương phản ở cả
chế độ sáng lẫn tối ngoài nắng.

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance

## Unresolved

- Bỏ nguồn tiền chạm schema Supabase (`transactions.account_id`) — cần migration
  thuận nghịch, không được xoá cột khi chưa hỏi người dùng.
- Số "còn tiêu được" cần hạn mức tổng; nếu người dùng chưa đặt hạn mức nào thì
  màn ghi nhanh hiện "đã tiêu tháng này" thay thế.

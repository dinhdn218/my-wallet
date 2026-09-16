# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Một người dùng duy nhất, ghi chi tiêu cá nhân của chính mình. Tiếng Việt, đơn vị
VND. Dùng trên cả điện thoại và desktop, hai bên quan trọng ngang nhau — nhưng
tình huống dùng khác nhau:

- **Điện thoại:** đang đứng ở quán, vừa trả tiền xong, mở app ghi một khoản
  trong vài giây rồi đóng. Một tay, có thể đang đi.
- **Desktop:** ngồi xem lại — tháng này tiêu vào đâu, có vượt hạn mức không.

Không có vai trò khác, không chia sẻ dữ liệu, không cộng tác.

## Product Purpose

Ghi lại mọi khoản thu chi cá nhân với ma sát thấp nhất có thể, để người dùng
luôn biết mình đang tiêu bao nhiêu và vào đâu.

**Việc chính là GHI, không phải xem.** Một lần xem báo cáo ứng với hàng chục lần
nhập liệu. App thành công khi việc ghi một khoản nhanh tới mức người dùng không
bao giờ bỏ qua — vì mỗi khoản bị bỏ sót làm hỏng toàn bộ số liệu phía sau.

Thành công = ghi đủ, không sót. Thất bại = người dùng thấy phiền rồi ngưng ghi.

## Positioning

App cá nhân, một người dùng, tự dựng. Không cạnh tranh với app thương mại: đổi
lại là không quảng cáo, không gói trả phí, không tính năng thừa, và có thể tối
ưu cực đoan cho đúng một người dùng cụ thể với đúng thói quen của họ.

## Operating Context

- Đăng nhập bằng magic link qua email (không mật khẩu). Đổi máy thì đăng nhập lại.
- Dữ liệu ở Supabase (Postgres), có RLS theo user.
- Mọi số liệu gom theo **tháng**; `activeMonth` là bộ lọc dùng chung cho mọi màn.
- Số tiền nhập theo lối nói tiếng Việt: `300k`, `1.5tr` — không gõ đủ số 0.
- Múi giờ UTC+7; gom tháng theo giờ địa phương, không cắt chuỗi ISO.

## Capabilities and Constraints

**Có:**
- Thêm / sửa / xoá giao dịch (thu hoặc chi), mỗi khoản có: số tiền, danh mục,
  ngày, ghi chú.
- Danh mục sửa được lúc chạy: đổi tên, đổi màu (trong 6 màu biểu đồ), xoá khi
  chưa có giao dịch nào dùng.
- Hạn mức chi theo danh mục, theo tháng.
- Báo cáo: so sánh tháng này với tháng trước, xu hướng nhiều tháng, chi lớn nhất.
- **Số dư thật**, suy ra từ "mốc số dư" người dùng tự đặt (một con số gộp mọi
  ví/ngân hàng/tiền mặt). Đặt mốc mới = đối soát, và app chỉ ra phần lệch giữa
  sổ và đời thực để người dùng biết mình đã quên ghi khoảng bao nhiêu.

**Bỏ trong bản thiết kế lại:**
- **Nguồn tiền (Techcombank / Tiền mặt / Ví Momo) bị gỡ bỏ.** Không có số dư đầu
  kỳ nên con số theo nguồn không bao giờ khớp đời thực; giữ lại chỉ tạo ra một
  ô bắt buộc chọn trong form nhập mà không đổi lại được gì. Việc gỡ chạm cả
  schema, store, form và các màn hiển thị.
- Vì bỏ nguồn tiền, "Tổng số dư" không còn nghĩa là tiền thật đang có. Số liệu
  chủ đạo phải là **dòng tiền trong tháng** (thu, chi, còn lại), không phải một
  con số "số dư" gây hiểu lầm.
- Số dư thật được thêm lại về sau, nhưng theo cách khác hẳn: KHÔNG cộng dồn
  `Σthu − Σchi` (sai số tích luỹ vĩnh viễn), mà suy ra từ mốc người dùng xác
  nhận. Và nó ở màn Báo cáo, không chiếm chỗ con số chủ đạo của màn ghi.

**Ràng buộc kỹ thuật:**
- Next.js 16 (App Router), React 19, Tailwind v4, Zustand v5, Supabase, Recharts.
- Server là nguồn sự thật; Zustand là cache của phiên. Store chỉ giữ dữ liệu
  thô (`transactions`, `categories`, `budgets`, `balanceMarks`, `activeMonth`);
  mọi con số khác là selector tính lại — không có state nào chép sẵn số tổng.
- Số tiền luôn dương; dấu suy ra từ `type`.
- Bộ E2E Playwright bám `data-testid`; đổi layout phải giữ hoặc cập nhật chúng.

**Phạm vi được phép:** thiết kế lại được thêm tính năng mới nếu tính năng đó làm
việc ghi nhanh hơn hoặc rõ hơn — không thêm để cho đầy màn.

## Brand Commitments

Tên sản phẩm: **Ví Riêng**. Toàn bộ giao diện bằng tiếng Việt, giọng văn thân
mật, ngắn, không thuật ngữ tài chính — như cách người dùng tự nói với mình
("Còn 4 ngày", "Chi ít hơn tháng trước"). Không có ràng buộc về logo, màu sắc
hay font: bản thiết kế lại được tự do chọn.

## Evidence on Hand

- Dữ liệu thật của người dùng đang nằm trong Supabase; `lib/seed-data.ts` có dữ
  liệu mẫu cho phát triển.
- Không có testimonial, số liệu thị trường, hay khách hàng nào để trưng — đây là
  app cá nhân, không được bịa ra những thứ đó.
- Thiết kế cũ (kính mờ, nền tối, accent hổ phách, bento grid) là **bằng chứng và
  phản-tham-chiếu**, không phải thứ phải giữ.

## Product Principles

1. **Ghi trước, xem sau.** Mọi quyết định thiết kế ưu tiên tốc độ và độ chắc
   chắn của việc nhập liệu. Nếu một lựa chọn làm báo cáo đẹp hơn nhưng làm việc
   ghi chậm đi một nhịp, chọn cái ghi nhanh.
2. **Không con số nào gây hiểu lầm.** Thà không hiện còn hơn hiện một con số
   người dùng tưởng là tiền thật mà không phải. Đây là lý do nguồn tiền bị gỡ.
3. **Một nguồn sự thật, mọi thứ còn lại là dẫn xuất.** Đúng với dữ liệu, và đúng
   cả với giao diện: tháng đang xem chỉ có một chỗ đặt, mọi màn đọc theo.
4. **Nói bằng tiếng người.** Nhãn, lỗi, trạng thái rỗng đều viết như một câu nói
   ra miệng, không phải nhãn cơ sở dữ liệu.
5. **Mỗi tín hiệu quan trọng phải đọc được bằng hơn một cách.** Vượt hạn mức
   không chỉ là màu đỏ — còn có chữ và hình.

## Accessibility & Inclusion

- Không bao giờ dùng riêng màu để truyền đạt trạng thái (đặc biệt là vượt hạn
  mức) — luôn kèm chữ hoặc hình.
- Vùng bấm trên điện thoại đủ lớn cho thao tác một tay khi đang đứng/đi.
- Tôn trọng `prefers-reduced-motion`.
- Hỗ trợ cả chế độ sáng và tối; chế độ sáng phải dùng được ngoài nắng.

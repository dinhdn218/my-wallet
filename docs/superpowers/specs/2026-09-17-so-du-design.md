# Số dư thật — thiết kế

> Trạng thái: đã duyệt, đang triển khai. Ngày 17/09/2026.

## Vấn đề

App ghi cả thu lẫn chi nhưng không hiện số dư. Lý do cũ đúng: `Σthu − Σchi`
không phải số dư, vì thiếu số dư đầu kỳ — nó đếm từ một số 0 giả.

Nhưng lý do sâu hơn là **sai số tích luỹ**. Tổng chi tháng 9 sai đúng bằng
những khoản quên ghi trong tháng 9; sang tháng 10 nó sạch lại. Số dư thì cộng
dồn mọi lần quên kể từ ngày đầu và không bao giờ tự sửa. Sau nửa năm nó lệch
vài triệu so với ngân hàng mà không ai biết lệch ở đâu.

Bằng chứng còn trong code: `useTotalBalance` (store) tính đúng `Σthu − Σchi`,
kèm chú thích cảnh báo nó không phải tiền đang có — và **không màn nào dùng**.
Một con số không ai dám hiện.

## Giải pháp: mốc số dư

Một khái niệm duy nhất. Một **mốc** là `(thời điểm, số tiền thật sự có lúc đó)`.

```
số dư tại T = mốc gần nhất trước T + Σthu − Σchi (của giao dịch sau mốc, tới T)
```

Điều này giải quyết cả hai vế bằng cùng một cơ chế:

- **Số dư đầu kỳ** là mốc đầu tiên.
- **Đối soát** là thêm một mốc mới. Không có cơ chế thứ hai.

Mỗi lần đặt mốc mới, sai số tích luỹ bị **cắt về 0**. Đó là thứ chặn cái trôi
đã nêu ở phần Vấn đề, và là lý do tính năng này đáng làm.

Chưa có mốc nào thì KHÔNG hiện số dư — theo nguyên tắc 2 của PRODUCT.md
("thà không hiện còn hơn hiện một con số người dùng tưởng là tiền thật").

### Chênh lệch khi đối soát

Lúc nhập mốc mới, app so số người dùng nhập với số nó tự tính:

```
chênh lệch = số nhập − số tính được
```

Hiện thẳng trước khi xác nhận: *"Theo sổ là 12.400.000đ, bạn nhập 11.900.000đ
— lệch 500.000đ"*. Người dùng biết mình đã quên ghi khoảng bấy nhiêu.

Mốc đầu tiên không có chênh lệch (không có gì để so).

## Không phân biệt nguồn tiền

Một con số duy nhất cho tất cả ví, ngân hàng, tiền mặt gộp lại. Đây là yêu cầu
của người dùng và nó **đơn giản hoá thiết kế một cách đáng kể**: chuyển tiền
giữa các tài khoản của chính mình trở thành vô hình — tiền không rời khỏi túi,
nên không phải thu, không phải chi, và không cần loại giao dịch thứ ba.

Quyết định này nhất quán với việc đã gỡ `account_id` (migration 001).

## Dữ liệu

Bảng mới, theo đúng khuôn `budgets`: khoá ghép theo user, RLS bốn policy,
cascade khi xoá tài khoản.

```sql
create table public.balance_marks (
  user_id    uuid not null references auth.users (id) on delete cascade,
  as_of      timestamptz not null,
  amount_vnd bigint not null,
  created_at timestamptz not null default now(),
  primary key (user_id, as_of)
);
```

`amount_vnd` KHÔNG có `check > 0`. Bất biến "số tiền luôn dương" của dự án nói
về **giao dịch**; số dư thì âm được thật nếu đang nợ.

Khoá chính `(user_id, as_of)` khiến việc đặt mốc thành upsert idempotent — đặt
lại mốc cùng thời điểm là sửa, không phải tạo bản thứ hai.

## Mốc thời gian nào được dùng

`at = min(cuối tháng đang xem, bây giờ)`.

`activeMonth` là nguồn sự thật cho mọi màn, nên số dư cũng phải theo nó — xem
tháng 8 thì thấy số dư cuối tháng 8. Chặn trên bằng "bây giờ" vì số dư của
tương lai là vô nghĩa.

Nhãn đổi theo: tháng hiện tại → "Số dư hiện tại"; tháng cũ → "Số dư cuối tháng N".

Giao dịch có `occurredAt` **đúng bằng** `mark.asOf` bị loại (dùng so sánh
nghiêm ngặt `>`): mốc là lời khẳng định về thời điểm đó, nó thắng mọi thứ tại
hoặc trước nó.

## Đặt ở màn nào

**Chỉ `/bao-cao`.** Màn chính giữ nguyên "Còn tiêu được" — đó là quyết định có
chủ ý thay cho "Tổng số dư" cũ, và không phải câu hỏi cần trả lời trong 2 giây
khi đang đứng ở quán. Hai con số tiền cạnh nhau cũng mời người ta đọc nhầm.

Không thêm tab thứ sáu vào thanh điều hướng.

Khối mới ở `/bao-cao` gồm:

1. Số dư, kèm dòng nhỏ "tính từ mốc ngày dd/mm"
2. `net` của tháng đang xem — đã tính sẵn ở `computeMonthlySummary` nhưng chưa
   màn nào hiện
3. Nút đặt mốc / đối soát, kèm phần chênh lệch

## Phạm vi thay đổi

| Lớp | Việc |
|---|---|
| `supabase/schema.sql` | bảng + index + 4 policy RLS |
| `supabase/migrations/002-balance-marks.sql` | cùng nội dung, cho DB đã dựng |
| `lib/supabase/types.ts` | `BalanceMarkRow` |
| `lib/supabase/mappers.ts` | `rowToBalanceMark` — chuẩn hoá thời gian về `Z` |
| `lib/supabase/queries.ts` | `fetchSnapshot` kéo bảng thứ tư; upsert + delete |
| `types/balance.ts` | `BalanceMark` |
| `store/useExpenseStore.ts` | lát `balanceMarks`, 2 action, `computeCurrentBalance`, `computeDrift`, hook; **gỡ `useTotalBalance`** |
| `components/balance/so-du-card.tsx` | khối UI |
| `app/(app)/bao-cao/page.tsx` | gắn khối |

## Test

Vitest, logic thuần — đúng chỗ mạnh của bộ test hiện có:

- không có mốc → trả `null`, không trả 0
- một mốc, không giao dịch sau đó → đúng bằng mốc
- cộng thu, trừ chi sau mốc
- bỏ qua giao dịch TRƯỚC mốc
- bỏ qua giao dịch đúng tại `asOf`
- nhiều mốc → lấy mốc gần nhất trước `at`, bỏ qua mốc tương lai
- chênh lệch dương/âm/bằng 0
- mốc đầu tiên không có chênh lệch

## Rủi ro đã biết

Người dùng có thể đặt mốc rồi không bao giờ đối soát lại. Lúc đó số dư trôi y
như cũ, chỉ là xuất phát từ một điểm đúng. Dòng "tính từ mốc ngày dd/mm" tồn
tại để lộ chuyện đó ra: mốc càng cũ thì càng đáng nghi. Không thêm nhắc nhở tự
động ở bản này — thêm khi thấy thật sự cần.

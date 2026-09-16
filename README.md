# Ví Riêng — quản lý chi tiêu cá nhân

App web ghi thu chi cá nhân bằng tiếng Việt, đơn vị VND. Dữ liệu lưu trên
**Supabase (Postgres)**, đăng nhập bằng **magic link qua email** — đổi máy chỉ
cần đăng nhập lại.

Giao diện là **"Bảng Giá Quán"**: tấm bảng men sơn tay, một cột số lớn, các
dòng giá nối bằng đường chấm. Việc chính là GHI — mở app là bàn phím số đã sẵn
sàng, không qua lớp sheet nào.

## Chạy

```bash
npm install
# Dựng Supabase trước: xem supabase/README.md rồi tạo .env.local
npm run dev          # http://localhost:3000
```

Lần đầu chạy phải dựng Supabase theo [supabase/README.md](supabase/README.md) —
tạo project, chạy `supabase/schema.sql`, rồi điền `.env.local`.

| Lệnh | Việc |
|---|---|
| `npm run dev` | Server dev (Turbopack) |
| `npm run build` | Build production |
| `npm test` | Test logic thuần (Vitest) |
| `npm run e2e` | Test đầu-cuối (Playwright) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

Lần đầu chạy E2E cần tải browser: `npx playwright install chromium`.
Bộ E2E dùng luôn server dev ở cổng 3000 nếu đang mở, không thì tự khởi động —
Next 16 chỉ cho một `next dev` mỗi thư mục.

## Màn hình

| Route | Màn |
|---|---|
| `/dang-nhap` | Đăng nhập bằng magic link |
| `/` | Ghi & xem — bàn phím số luôn sẵn, con số "còn tiêu được", bảng giá theo ngày |
| `/giao-dich` | Danh sách + lọc theo loại/danh mục, sắp xếp, sửa & xoá |
| `/ngan-sach` | Hạn mức chi theo danh mục, đặt/sửa/gỡ |
| `/danh-muc` | Đổi tên và màu danh mục, xoá danh mục chưa dùng |
| `/bao-cao` | Số dư thật, so sánh tháng này với tháng trước |

## Cấu trúc

```
app/
  (app)/      5 màn cần đăng nhập, dùng chung vỏ sidebar/tabbar
  (auth)/     màn đăng nhập — không có vỏ ứng dụng
  auth/       route handler đổi code lấy session
proxy.ts      làm mới session + chặn route (Next 16 đổi tên từ middleware.ts)
supabase/     schema.sql + hướng dẫn dựng project
lib/supabase/ client, mapper snake_case↔camelCase, các câu truy vấn
components/
  dashboard/  con số "còn tiêu được" + trạng thái rỗng
  layout/     cột trái · header + tabbar mobile · bộ chọn tháng
  transaction/ghi nhanh (bàn phím số) · dòng giá · sửa giao dịch
  budget/     dòng hạn mức + vạch sơn tiến độ
  balance/    số dư thật + đối soát mốc
  ui/         primitive shadcn + thẻ giá treo dây kẽm
lib/          format tiền/ngày, danh mục, theme, tiện ích
store/        một store Zustand + các selector
e2e/          spec Playwright
```

## Thiết kế

**Thế giới: bảng giá quán ăn sơn tay.** Nền men xanh rêu chiếm ~40% mọi màn,
chữ sơn stencil (Oswald), nhãn đo đạc mono (Roboto Mono). Không có thẻ bo góc
nào — `--radius: 0` và cấu trúc đọc bằng khoảng hở + vệt sơn. Hợp đồng thiết
kế đầy đủ nằm ở `.impeccable/surfaces/app-app-page-tsx.md`.

**Chế độ sáng vẫn là tấm bảng men, chỉ là ngoài nắng.** Men sáng lên, sơn
thành mực xanh đậm. Đảo về nền be trung tính sẽ mất luôn thế giới.

**Bảng giá không viết số âm.** Khoản chi là GIÁ (`65.000đ`), chỉ khoản thu mới
có dấu `+`. Dấu vẫn suy ra từ `type` như cũ, chỉ là cách hiển thị đổi.

**Việc ghi chiếm chỗ tốt nhất của màn hình.** Desktop: cột trái 360–400px giữ
con số + bàn phím. Mobile: bàn phím neo đáy (`max-h-[62dvh]`), danh sách cuộn
phía trên. Đây là lý do màn chính KHÔNG dùng `CotTrai` như 4 màn phụ.

**"Còn tiêu được" thay cho "Tổng số dư".** Số dư cũ gây hiểu lầm vì không có
số dư đầu kỳ. Khi chưa đặt hạn mức nào, `useConTieuDuoc` trả `coHanMuc: false`
và màn hiện "đã tiêu tháng này" — KHÔNG bịa ra một con số còn lại bằng 0.

**Nguồn tiền đã gỡ bỏ** khỏi type, store, form, schema. Xem
`supabase/migrations/001-drop-account-id.sql`.

**Số dư suy ra từ MỐC, không cộng dồn từ số 0.** Một mốc là "lúc đó tôi có
đúng bấy nhiêu"; số dư = mốc gần nhất + dòng tiền kể từ đó. Mốc đầu tiên là số
dư đầu kỳ, mốc thêm về sau là đối soát — và mỗi lần đối soát, sai số tích luỹ
do quên ghi bị cắt về 0. Chưa có mốc nào thì KHÔNG hiện số dư. Số dư chỉ sống ở
màn Báo cáo, màn chính vẫn là "còn tiêu được". Xem
`docs/superpowers/specs/2026-09-17-so-du-design.md`.

## Vài quyết định đáng nhớ

**Server là nguồn sự thật, Zustand là cache của phiên.** Store vẫn giữ đúng 4
lát dữ liệu như cũ, chỉ đổi nguồn nạp: `loadFromServer()` kéo cả 3 bảng về một
lần rồi mọi selector chạy y như trước. Nhờ vậy 11 hàm `compute*` và 15 hook
không phải sửa dòng nào. localStorage vẫn còn nhưng chỉ là cache đọc cho lần
sơn đầu.

**Một store, mọi con số còn lại là dẫn xuất.** `store/useExpenseStore.ts` chỉ
giữ `transactions`, `categories`, `budgets`, `activeMonth`. Tổng tháng, chia
theo danh mục, tình trạng hạn mức… đều là selector tính lại — không có state
nào chép sẵn số tổng, nên không bao giờ lệch nhau.

**Selector phải tính trong `useMemo`.** Zustand v5 đọc qua
`useSyncExternalStore`: truyền thẳng một hàm trả về object/mảng mới vào
`useExpenseStore(...)` sẽ tạo snapshot mới mỗi lần render → vòng lặp vô hạn.
Mỗi hook ở đây lấy lát dữ liệu thô (tham chiếu ổn định) rồi mới tính.

**Gom tháng theo giờ địa phương, không cắt chuỗi ISO.** ISO là giờ UTC, nên ở
UTC+7 mọi khoản ghi trước 07:00 sáng sẽ bị đẩy sang tháng trước — sai cả tổng
tháng lẫn ngân sách.

**Sao lưu dữ liệu cũ trước khi nạp từ server.** `zustand/persist` ghi đè
`vi-rieng/expenses` ngay khi `loadFromServer` trả về — với tài khoản mới (server
rỗng) thì dữ liệu cũ của người dùng bị xoá trắng trong chưa tới một giây. Nên
`store-bootstrap` chép sang `vi-rieng/pre-supabase-backup` **trước mọi thứ
khác**; nhờ vậy bấm "Bỏ qua" mới thật sự giữ lại được, đúng như hộp thoại hứa.

**Hydrate từ effect phía client** (`skipHydration: true` +
`components/store-bootstrap.tsx`). Nếu để persist đọc `localStorage` ngay khi
module nạp thì lần render client đầu tiên đã khác server render → React báo
hydration mismatch.

**`hasHydrated` là latch một chiều.** 10 component dùng nó để chọn giữa
skeleton và số thật. Cho nó lật lại mỗi lần refetch thì cả dashboard sẽ nháy về
skeleton mỗi lần đồng bộ nền — nên trạng thái đồng bộ chi tiết nằm ở
`syncStatus` riêng, chỉ dùng cho chỉ báo, không chặn nội dung.

**Mapper luôn chuẩn hoá thời gian về dạng `...Z`.** Postgres trả `+00:00`, dữ
liệu cũ là `.000Z`; mà hai chỗ sắp xếp giao dịch dùng `localeCompare` trên
chuỗi. Trộn hai định dạng thì danh sách sắp sai mà không văng lỗi gì.

**`activeMonth` là nguồn sự thật cho cả 4 màn.** Bộ chọn tháng
(`components/layout/month-picker.tsx`) dùng chung ở ba chỗ và chỉ ghi vào đúng
ô đó; mọi selector lọc theo nó.

**Số tiền luôn dương, dấu suy ra từ `type`.** Không có số âm trong store, nên
không có chỗ nào phải đoán dấu.

**Vượt hạn mức báo bằng ba tín hiệu chồng nhau** — viền + nền, thanh đổi màu,
và nhãn chữ — để người mù màu vẫn đọc được, không chỉ dựa vào màu.

## Test

- **Vitest** (`*.test.ts`) — logic thuần: format tiền/ngày, các hàm `compute*`
  của store. Chạy trong vài trăm ms.
- **Playwright** (`e2e/*.spec.ts`) — luồng thật trên trình duyệt: sửa/xoá giao
  dịch, đặt/sửa/gỡ hạn mức, đổi tên & xoá danh mục, đổi tháng xuyên các màn,
  điều hướng. Nhiều test có bước `reload()` — giờ đó là phép thử cho vòng lưu
  về Postgres.

  E2E cần Supabase thật và `SUPABASE_SERVICE_ROLE_KEY` trong `.env.local`.
  **Mỗi worker một tài khoản test riêng** (`e2e+w0@…`) vì `fullyParallel` đang
  bật: dùng chung một tài khoản thì các spec giẫm chân nhau. `resetStore(page)`
  giữ nguyên tên cũ nhưng giờ xoá và seed lại dữ liệu trong Postgres.

  `e2e/auth.setup.ts` tạo sẵn session cho **tất cả** worker chứ không chỉ worker
  0, vì project `setup` chỉ chạy ở một worker trong khi mỗi worker lại đọc file
  session theo chỉ số của chính nó. Do đó số worker bị chốt cứng trong
  `playwright.config.ts` (đổi qua `E2E_WORKERS`) — hai chỗ phải khớp nhau.

  Id giao dịch mẫu có kèm chỉ số worker: `transactions.id` là khoá chính của cả
  bảng chứ không theo từng user, nên dùng chung uuid cho mọi worker sẽ đụng khoá.

  Trỏ vào một project Supabase **riêng cho test**, không bao giờ trỏ vào
  project thật — seeder xoá sạch dữ liệu của tài khoản test trước mỗi lần chạy.

Bảng desktop và danh sách mobile **cùng nằm trong DOM**, chỉ ẩn bằng CSS. Nên
locator trong E2E phải bám `data-testid` hoặc scope vào `tx-table`, không thì
mỗi chuỗi khớp hai lần.

## Còn tồn

- **`schema.sql` đã bỏ `account_id`** — DB dựng mới chỉ cần chạy `schema.sql`,
  không phải chạy migration nào. DB đã dựng từ bản schema cũ thì chạy
  `supabase/migrations/001-drop-account-id.sql` (cả 3 bước, kể cả bước dựng lại
  `migrate_local_data`).
- Bộ E2E đã cập nhật selector nhưng **chưa chạy lại được** kể từ lần đổi này.
- `playwright.config.ts` không tự nạp `.env.local`; phải `set -a && . ./.env.local`
  trước khi chạy E2E.
- `docs/superpowers/` là spec/plan của thiết kế **đầu tiên**, đã lỗi thời.

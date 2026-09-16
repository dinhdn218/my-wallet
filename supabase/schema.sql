-- ===========================================================================
-- Ví Riêng — schema Supabase
--
-- Chạy MỘT LẦN trong SQL Editor của project Supabase. Xem supabase/README.md.
-- File này chỉ TẠO MỚI, không xoá bảng nào — chạy lại lần hai sẽ báo lỗi
-- "already exists", đó là chủ ý: không có DROP nào ở đây để không bao giờ
-- xoá nhầm dữ liệu thật.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- categories
--
-- Khoá chính ghép (user_id, id): `id` là slug ổn định ('an-uong', 'cafe'…) và
-- chỉ cần duy nhất trong phạm vi một người dùng.
-- `color` để text vì dữ liệu trộn 3 dạng: '#3ED6B5', 'oklch(...)', 'rgba(...)'.
-- `sort_order` là cột mới: thứ tự trong mảng cũ là ngầm định, còn Postgres
-- không đảm bảo thứ tự dòng — thiếu cột này màn Danh mục sẽ xáo trộn mỗi lần nạp.
-- ---------------------------------------------------------------------------
create table public.categories (
  user_id    uuid not null references auth.users (id) on delete cascade,
  id         text not null,
  label      text not null check (length(btrim(label)) between 1 and 60),
  color      text not null,
  sort_order int  not null default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);


-- ---------------------------------------------------------------------------
-- transactions
--
-- ⚠️ occurred_at là timestamptz và KHÔNG có cột tháng đi kèm — đây là chủ ý.
-- Việc gom tháng nằm ở monthKey() phía client (store/useExpenseStore.ts), tính
-- theo giờ ĐỊA PHƯƠNG. Thêm generated column dạng
-- to_char(occurred_at at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM') sẽ tạo ra
-- định nghĩa "tháng" thứ hai, lệch với client khi người dùng đổi múi giờ, và
-- lệch âm thầm — không văng lỗi, chỉ ra sai số tổng tháng.
-- Cũng vì vậy: không dùng date_trunc('month', ...) hay ::date cho dữ liệu UI.
--
-- amount_vnd LUÔN DƯƠNG, dấu suy ra từ `type` (bất biến của types/transaction.ts).
-- Dùng bigint chứ không int: int4 chỉ tới ~2,1 tỷ đồng, một khoản mua xe hay đặt
-- cọc nhà là vượt.
--
-- KHÔNG có cột account_id ("nguồn tiền") — đã gỡ có chủ ý, xem
-- supabase/migrations/001-drop-account-id.sql và PRODUCT.md. App không gửi cột
-- đó nữa, nên dựng lại nó dạng `not null` sẽ làm MỌI lần ghi giao dịch hỏng.
-- ---------------------------------------------------------------------------
create table public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null check (type in ('income', 'expense')),
  amount_vnd  bigint not null check (amount_vnd > 0),
  category_id text not null,
  note        text check (note is null or length(note) <= 120),
  occurred_at timestamptz not null,
  created_at  timestamptz not null default now(),

  -- on delete restrict = đúng nguyên tắc removeCategory hiện tại: từ chối xoá
  -- danh mục còn giao dịch. Trả về mã lỗi 23503, client dịch thành 'in-use'.
  -- on update cascade để đổi slug danh mục không làm mồ côi giao dịch.
  foreign key (user_id, category_id)
    references public.categories (user_id, id)
    on update cascade
    on delete restrict
);

create index transactions_user_occurred_idx
  on public.transactions (user_id, occurred_at desc);


-- ---------------------------------------------------------------------------
-- budgets
--
-- Dạng quan hệ của budgets[month][categoryId] = limit. Khoá chính ghép khiến
-- setBudget thành một upsert idempotent — không đọc-sửa-ghi, không mất cập nhật
-- khi mở hai tab.
--
-- `month` được phép là cột (khác với transactions) vì đây là nhãn NGƯỜI DÙNG
-- CHỌN ở bộ chọn tháng, không phải giá trị dẫn xuất từ timestamp.
--
-- ⚠️ limit_vnd > 0, không phải >= 0. clearBudget phải XOÁ DÒNG chứ không ghi 0:
-- computeBudgetRows phân biệt "chưa đặt hạn mức" bằng sự VẮNG MẶT của key, nên
-- một số 0 được lưu sẽ hiện thành thanh 0đ thay vì vào nhóm "Chưa đặt hạn mức".
-- ---------------------------------------------------------------------------
create table public.budgets (
  user_id     uuid not null references auth.users (id) on delete cascade,
  month       text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  category_id text not null,
  limit_vnd   bigint not null check (limit_vnd > 0),
  updated_at  timestamptz not null default now(),
  primary key (user_id, month, category_id),

  -- Xoá danh mục thì hạn mức của nó ở MỌI tháng biến mất theo — thay cho đoạn
  -- tự dựng lại budgets trong removeCategory cũ.
  foreign key (user_id, category_id)
    references public.categories (user_id, id)
    on update cascade
    on delete cascade
);


-- ---------------------------------------------------------------------------
-- balance_marks — mốc số dư
--
-- Một mốc = (thời điểm, số tiền THẬT SỰ có lúc đó). Số dư được suy ra:
--   số dư tại T = mốc gần nhất trước T + Σthu − Σchi (giao dịch sau mốc, tới T)
--
-- Một khái niệm này phục vụ CẢ HAI việc: mốc đầu tiên là "số dư đầu kỳ", mốc
-- thêm về sau là "đối soát". Mỗi lần đặt mốc mới, sai số tích luỹ do quên ghi
-- bị cắt về 0 — đó là lý do bảng này tồn tại. Xem
-- docs/superpowers/specs/2026-09-17-so-du-design.md.
--
-- ⚠️ amount_vnd KHÔNG có check > 0, khác transactions.amount_vnd. Bất biến
-- "số tiền luôn dương" nói về GIAO DỊCH; số dư thì âm được thật khi đang nợ.
--
-- Khoá chính ghép khiến đặt mốc thành upsert idempotent: đặt lại mốc cùng thời
-- điểm là SỬA, không tạo bản thứ hai.
--
-- Không có cột nào cho ví/ngân hàng: app gộp mọi nguồn thành một con số. Nhờ
-- vậy chuyển tiền giữa các tài khoản của chính mình là vô hình — không phải
-- thu, không phải chi, không cần loại giao dịch thứ ba. Nhất quán với việc đã
-- gỡ account_id (migration 001).
-- ---------------------------------------------------------------------------
create table public.balance_marks (
  user_id    uuid not null references auth.users (id) on delete cascade,
  as_of      timestamptz not null,
  amount_vnd bigint not null,
  created_at timestamptz not null default now(),
  primary key (user_id, as_of)
);

create index balance_marks_user_asof_idx
  on public.balance_marks (user_id, as_of desc);


-- ===========================================================================
-- Row Level Security
--
-- Đây là lớp phân quyền THẬT. proxy.ts chỉ chặn route cho đỡ render nhầm,
-- không phải hàng rào bảo mật.
--
-- Hai chi tiết bắt buộc:
--   1. (select auth.uid()) bọc trong subquery, không gọi trần auth.uid().
--      Gọi trần bị Postgres coi là volatile và tính lại TỪNG DÒNG; dạng
--      subselect chỉ tính một lần và dùng được index.
--   2. Policy update phải có CẢ using LẪN with check. Thiếu with check thì
--      người dùng chạy được `update ... set user_id = <uuid người khác>` và
--      đẩy dòng của mình sang tài khoản khác.
-- ===========================================================================

alter table public.categories   enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets      enable row level security;
alter table public.balance_marks enable row level security;

-- categories
create policy "categories: select own" on public.categories
  for select using ((select auth.uid()) = user_id);
create policy "categories: insert own" on public.categories
  for insert with check ((select auth.uid()) = user_id);
create policy "categories: update own" on public.categories
  for update using ((select auth.uid()) = user_id)
              with check ((select auth.uid()) = user_id);
create policy "categories: delete own" on public.categories
  for delete using ((select auth.uid()) = user_id);

-- transactions
create policy "transactions: select own" on public.transactions
  for select using ((select auth.uid()) = user_id);
create policy "transactions: insert own" on public.transactions
  for insert with check ((select auth.uid()) = user_id);
create policy "transactions: update own" on public.transactions
  for update using ((select auth.uid()) = user_id)
              with check ((select auth.uid()) = user_id);
create policy "transactions: delete own" on public.transactions
  for delete using ((select auth.uid()) = user_id);

-- budgets
create policy "budgets: select own" on public.budgets
  for select using ((select auth.uid()) = user_id);
create policy "budgets: insert own" on public.budgets
  for insert with check ((select auth.uid()) = user_id);
create policy "budgets: update own" on public.budgets
  for update using ((select auth.uid()) = user_id)
              with check ((select auth.uid()) = user_id);
create policy "budgets: delete own" on public.budgets
  for delete using ((select auth.uid()) = user_id);

-- balance_marks
create policy "balance_marks: select own" on public.balance_marks
  for select using ((select auth.uid()) = user_id);
create policy "balance_marks: insert own" on public.balance_marks
  for insert with check ((select auth.uid()) = user_id);
create policy "balance_marks: update own" on public.balance_marks
  for update using ((select auth.uid()) = user_id)
              with check ((select auth.uid()) = user_id);
create policy "balance_marks: delete own" on public.balance_marks
  for delete using ((select auth.uid()) = user_id);


-- ===========================================================================
-- Tài khoản mới → seed 8 danh mục mặc định
--
-- Giữ khớp với DEFAULT_CATEGORIES trong lib/categories.ts (kể cả thứ tự).
--
-- ⚠️ security definer là bắt buộc (ghi vào bảng của user chưa đăng nhập xong),
-- và đi kèm nó `set search_path = ''` cũng bắt buộc: thiếu search_path rỗng,
-- kẻ tấn công tạo được hàm trùng tên ở schema ghi được và chiếm quyền definer.
-- Vì search_path rỗng nên mọi tên bên dưới phải ghi đầy đủ (public.categories).
-- ===========================================================================
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categories (user_id, id, label, color, sort_order) values
    (new.id, 'an-uong', 'Ăn uống', '#3ED6B5',              0),
    (new.id, 'nhau',    'Nhậu',    'oklch(.78 .13 265)',   1),
    (new.id, 'cafe',    'Cafe',    'oklch(.76 .14 320)',   2),
    (new.id, 'di-lai',  'Đi lại',  '#FF7A9C',              3),
    (new.id, 'nha-cua', 'Nhà cửa', '#F5AC3C',              4),
    (new.id, 'mua-sam', 'Mua sắm', 'oklch(.78 .13 220)',   5),
    (new.id, 'luong',   'Lương',   '#3ED6B5',              6),
    (new.id, 'khac',    'Khác',    'rgba(246,241,233,.28)', 7);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ===========================================================================
-- migrate_local_data — đẩy dữ liệu localStorage lên tài khoản (Phase 5)
--
-- Gộp cả 3 lần ghi vào MỘT transaction: hỏng giữa chừng thì không để lại
-- categories đã ghi mà transactions thì chưa.
--
-- security invoker (mặc định) là đúng ở đây: hàm chạy dưới quyền người gọi nên
-- RLS vẫn áp dụng, không thể bị lợi dụng để ghi sang tài khoản khác.
--
-- payload:
-- {
--   "categories":   [{"id","label","color","sortOrder"}],
--   "transactions": [{"type","amountVnd","categoryId","note","occurredAt","createdAt"}],
--   "budgets":      [{"month","categoryId","limitVnd"}]
-- }
--
-- Id cũ dạng 'tx_xxxxxxxx' bị bỏ, Postgres cấp UUID mới. occurred_at giữ
-- nguyên chuỗi ISO đã lưu nên việc gom tháng không đổi.
-- ===========================================================================
create function public.migrate_local_data(payload jsonb)
returns void
language plpgsql
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Chưa đăng nhập';
  end if;

  -- 1. Danh mục trước: transactions và budgets đều có FK trỏ tới đây.
  -- Upsert để giữ tên/màu người dùng đã sửa, đè lên bản mặc định của trigger.
  insert into public.categories (user_id, id, label, color, sort_order)
  select uid,
         c ->> 'id',
         c ->> 'label',
         c ->> 'color',
         coalesce((c ->> 'sortOrder')::int, 0)
  from jsonb_array_elements(coalesce(payload -> 'categories', '[]'::jsonb)) as c
  on conflict (user_id, id) do update
    set label = excluded.label,
        color = excluded.color,
        sort_order = excluded.sort_order;

  -- 2. Giao dịch.
  insert into public.transactions
    (user_id, type, amount_vnd, category_id, note, occurred_at, created_at)
  select uid,
         t ->> 'type',
         (t ->> 'amountVnd')::bigint,
         t ->> 'categoryId',
         nullif(t ->> 'note', ''),
         (t ->> 'occurredAt')::timestamptz,
         coalesce((t ->> 'createdAt')::timestamptz, now())
  from jsonb_array_elements(coalesce(payload -> 'transactions', '[]'::jsonb)) as t;

  -- 3. Hạn mức. Bỏ qua entry trỏ tới danh mục không tồn tại — cache cũ có thể
  -- còn sót hạn mức mồ côi từ trước khi removeCategory dọn budgets.
  insert into public.budgets (user_id, month, category_id, limit_vnd)
  select uid,
         b ->> 'month',
         b ->> 'categoryId',
         (b ->> 'limitVnd')::bigint
  from jsonb_array_elements(coalesce(payload -> 'budgets', '[]'::jsonb)) as b
  where (b ->> 'limitVnd')::bigint > 0
    and exists (
      select 1 from public.categories c
      where c.user_id = uid and c.id = b ->> 'categoryId'
    )
  on conflict (user_id, month, category_id) do nothing;
end;
$$;

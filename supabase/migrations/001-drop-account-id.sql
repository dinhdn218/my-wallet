-- ===========================================================================
-- 001 — Gỡ khái niệm "nguồn tiền": xoá cột transactions.account_id
--
-- ⚠️⚠️  MIGRATION NÀY XOÁ DỮ LIỆU VĨNH VIỄN  ⚠️⚠️
--
-- Sau khi chạy, MỌI giao dịch cũ sẽ KHÔNG CÒN biết đã trả bằng Techcombank,
-- Tiền mặt hay Ví Momo. Không khôi phục được nếu chưa sao lưu.
--
-- Lý do gỡ (xem PRODUCT.md § Capabilities and Constraints): không có số dư đầu
-- kỳ nên con số theo từng nguồn không bao giờ khớp đời thực; giữ lại chỉ tạo
-- thêm một ô bắt buộc chọn trong form nhập mà không đổi lại được gì.
--
-- ---------------------------------------------------------------------------
-- BƯỚC 1 — SAO LƯU TRƯỚC (bắt buộc, chạy riêng và tự kiểm tra kết quả)
-- ---------------------------------------------------------------------------
-- Chạy riêng câu này TRƯỚC, và chỉ đi tiếp khi đã thấy bảng sao lưu có đủ dòng:
--
--     create table public.transactions_account_backup as
--     select id, user_id, account_id from public.transactions;
--
--     select count(*) from public.transactions_account_backup;   -- phải > 0
--     select count(*) from public.transactions;                  -- phải khớp
--
-- Muốn khôi phục về sau (chỉ được nếu bảng sao lưu còn):
--
--     alter table public.transactions add column account_id text;
--     update public.transactions t
--        set account_id = b.account_id
--       from public.transactions_account_backup b
--      where b.id = t.id;
--
-- ---------------------------------------------------------------------------
-- BƯỚC 2 — Gỡ cột (chỉ chạy sau khi BƯỚC 1 đã xong và đã kiểm tra)
-- ---------------------------------------------------------------------------
-- Ứng dụng phải được deploy TRƯỚC hoặc CÙNG LÚC: cột đang `not null` nên bản
-- app cũ (còn gửi account_id) vẫn chạy được sau khi xoá cột, nhưng bản app mới
-- (không gửi account_id) sẽ LỖI nếu cột vẫn còn `not null`. Thứ tự an toàn:
-- chạy migration này rồi deploy app mới ngay.

alter table public.transactions
  drop column if exists account_id;

-- Ghi chú: CHECK constraint account_id in ('techcombank','cash','momo') tự biến
-- mất theo cột, không cần drop riêng.


-- ---------------------------------------------------------------------------
-- BƯỚC 3 — Dựng lại migrate_local_data (bắt buộc, chạy cùng BƯỚC 2)
-- ---------------------------------------------------------------------------
-- Thân hàm cũ còn insert vào account_id, mà lib/migrate-local.ts đã bỏ field
-- 'accountId' khỏi payload. Bỏ qua bước này thì luồng di trú hỏng cả hai chiều:
-- còn cột -> insert null vào cột not null; bỏ cột -> 42703 column does not exist.
--
-- Bản schema.sql hiện tại đã bỏ account_id, nên DB dựng mới KHÔNG cần file này.
create or replace function public.migrate_local_data(payload jsonb)
returns void
language plpgsql
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Chưa đăng nhập';
  end if;

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

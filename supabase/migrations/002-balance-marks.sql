-- ===========================================================================
-- 002 — Mốc số dư (balance_marks)
--
-- AN TOÀN: chỉ TẠO MỚI, không đụng tới bảng hay dữ liệu nào đang có.
--
-- Chỉ cần chạy cho DB đã dựng TRƯỚC thay đổi này. Bản schema.sql hiện tại đã
-- gồm sẵn bảng này, nên DB dựng mới KHÔNG cần file này.
--
-- Lý do và thiết kế: docs/superpowers/specs/2026-09-17-so-du-design.md
-- ===========================================================================

create table public.balance_marks (
  user_id    uuid not null references auth.users (id) on delete cascade,
  as_of      timestamptz not null,
  amount_vnd bigint not null,
  created_at timestamptz not null default now(),
  primary key (user_id, as_of)
);

create index balance_marks_user_asof_idx
  on public.balance_marks (user_id, as_of desc);

alter table public.balance_marks enable row level security;

create policy "balance_marks: select own" on public.balance_marks
  for select using ((select auth.uid()) = user_id);
create policy "balance_marks: insert own" on public.balance_marks
  for insert with check ((select auth.uid()) = user_id);
create policy "balance_marks: update own" on public.balance_marks
  for update using ((select auth.uid()) = user_id)
              with check ((select auth.uid()) = user_id);
create policy "balance_marks: delete own" on public.balance_marks
  for delete using ((select auth.uid()) = user_id);

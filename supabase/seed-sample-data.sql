-- ===========================================================================
-- DỮ LIỆU MẪU (tuỳ chọn) — để xem giao diện có số thật
--
-- Dán TOÀN BỘ file này vào Supabase SQL Editor rồi bấm Run. SQL Editor chạy
-- quyền admin nên ghi được vào tài khoản của bạn.
--
-- AN TOÀN: chỉ INSERT, không xoá gì. Mọi giao dịch mẫu mang id bắt đầu bằng
-- '5eed0000-' nên gỡ sạch lại được chính xác — xem phần CUỐI file.
--
-- Cần chạy trước: schema.sql. Mốc số dư cần thêm migration 002; thiếu thì
-- riêng phần đó tự bỏ qua, các phần còn lại vẫn chạy.
-- ===========================================================================

do $$
declare
  uid uuid;
begin
  -- App một người dùng: lấy tài khoản đầu tiên.
  select id into uid from auth.users order by created_at limit 1;
  if uid is null then
    raise exception 'Chưa có tài khoản nào. Đăng nhập vào app một lần rồi chạy lại.';
  end if;

  insert into public.transactions
    (id, user_id, type, amount_vnd, category_id, note, occurred_at)
  values
    ('5eed0000-0000-4000-8000-000000000001', uid, 'income', 22000000, 'luong', 'Lương tháng 9', '2026-09-01 08:00+07'),
    ('5eed0000-0000-4000-8000-000000000002', uid, 'income', 2500000, 'khac', 'Freelance sửa landing', '2026-09-05 14:20+07'),
    ('5eed0000-0000-4000-8000-000000000003', uid, 'expense', 5500000, 'nha-cua', 'Tiền nhà tháng 9', '2026-09-01 10:00+07'),
    ('5eed0000-0000-4000-8000-000000000004', uid, 'expense', 412000, 'an-uong', 'Đi chợ cuối tuần', '2026-09-02 17:05+07'),
    ('5eed0000-0000-4000-8000-000000000005', uid, 'expense', 185000, 'an-uong', 'Bún bò', '2026-09-03 12:10+07'),
    ('5eed0000-0000-4000-8000-000000000006', uid, 'expense', 95000, 'an-uong', 'Bánh mì + sữa', '2026-09-04 12:00+07'),
    ('5eed0000-0000-4000-8000-000000000007', uid, 'expense', 450000, 'an-uong', 'Ăn tối với bạn', '2026-09-05 19:30+07'),
    ('5eed0000-0000-4000-8000-000000000008', uid, 'expense', 168000, 'an-uong', 'Phở', '2026-09-07 12:15+07'),
    ('5eed0000-0000-4000-8000-000000000009', uid, 'expense', 275000, 'an-uong', 'Đi chợ', '2026-09-08 18:40+07'),
    ('5eed0000-0000-4000-8000-000000000010', uid, 'expense', 130000, 'an-uong', 'Cơm tấm', '2026-09-09 12:00+07'),
    ('5eed0000-0000-4000-8000-000000000011', uid, 'expense', 890000, 'an-uong', 'Lẩu cuối tuần', '2026-09-11 19:00+07'),
    ('5eed0000-0000-4000-8000-000000000012', uid, 'expense', 210000, 'an-uong', 'Cơm văn phòng', '2026-09-12 12:30+07'),
    ('5eed0000-0000-4000-8000-000000000013', uid, 'expense', 320000, 'an-uong', 'Đi chợ', '2026-09-14 18:20+07'),
    ('5eed0000-0000-4000-8000-000000000014', uid, 'expense', 165000, 'an-uong', 'Bún chả', '2026-09-15 12:00+07'),
    ('5eed0000-0000-4000-8000-000000000015', uid, 'expense', 240000, 'an-uong', 'Cơm gà', '2026-09-16 19:10+07'),
    ('5eed0000-0000-4000-8000-000000000016', uid, 'expense', 45000, 'cafe', 'Cafe', '2026-09-01 08:30+07'),
    ('5eed0000-0000-4000-8000-000000000017', uid, 'expense', 65000, 'cafe', 'Cafe', '2026-09-02 09:12+07'),
    ('5eed0000-0000-4000-8000-000000000018', uid, 'expense', 40000, 'cafe', 'Cafe', '2026-09-03 08:45+07'),
    ('5eed0000-0000-4000-8000-000000000019', uid, 'expense', 55000, 'cafe', 'Cafe', '2026-09-04 09:00+07'),
    ('5eed0000-0000-4000-8000-000000000020', uid, 'expense', 65000, 'cafe', 'Cafe', '2026-09-05 08:20+07'),
    ('5eed0000-0000-4000-8000-000000000021', uid, 'expense', 45000, 'cafe', 'Cafe', '2026-09-08 09:30+07'),
    ('5eed0000-0000-4000-8000-000000000022', uid, 'expense', 75000, 'cafe', 'Cafe', '2026-09-09 08:15+07'),
    ('5eed0000-0000-4000-8000-000000000023', uid, 'expense', 60000, 'cafe', 'Cafe', '2026-09-10 09:00+07'),
    ('5eed0000-0000-4000-8000-000000000024', uid, 'expense', 40000, 'cafe', 'Cafe', '2026-09-11 08:40+07'),
    ('5eed0000-0000-4000-8000-000000000025', uid, 'expense', 65000, 'cafe', 'Cafe', '2026-09-12 09:20+07'),
    ('5eed0000-0000-4000-8000-000000000026', uid, 'expense', 55000, 'cafe', 'Cafe', '2026-09-14 08:30+07'),
    ('5eed0000-0000-4000-8000-000000000027', uid, 'expense', 70000, 'cafe', 'Cafe', '2026-09-15 09:10+07'),
    ('5eed0000-0000-4000-8000-000000000028', uid, 'expense', 45000, 'cafe', 'Cafe', '2026-09-16 08:25+07'),
    ('5eed0000-0000-4000-8000-000000000029', uid, 'expense', 85000, 'cafe', 'Cafe', '2026-09-16 15:00+07'),
    ('5eed0000-0000-4000-8000-000000000030', uid, 'expense', 78000, 'di-lai', 'Grab về nhà', '2026-09-02 22:40+07'),
    ('5eed0000-0000-4000-8000-000000000031', uid, 'expense', 320000, 'di-lai', 'Đổ xăng', '2026-09-04 08:00+07'),
    ('5eed0000-0000-4000-8000-000000000032', uid, 'expense', 95000, 'di-lai', 'Grab', '2026-09-07 21:15+07'),
    ('5eed0000-0000-4000-8000-000000000033', uid, 'expense', 150000, 'di-lai', 'Grab', '2026-09-10 19:50+07'),
    ('5eed0000-0000-4000-8000-000000000034', uid, 'expense', 280000, 'di-lai', 'Đổ xăng', '2026-09-13 08:10+07'),
    ('5eed0000-0000-4000-8000-000000000035', uid, 'expense', 110000, 'di-lai', 'Grab', '2026-09-16 22:00+07'),
    ('5eed0000-0000-4000-8000-000000000036', uid, 'expense', 650000, 'nhau', 'Nhậu với team', '2026-09-06 20:00+07'),
    ('5eed0000-0000-4000-8000-000000000037', uid, 'expense', 420000, 'nhau', 'Bia cuối tuần', '2026-09-13 20:30+07'),
    ('5eed0000-0000-4000-8000-000000000038', uid, 'expense', 1420000, 'mua-sam', 'Áo khoác', '2026-09-01 07:00+07'),
    ('5eed0000-0000-4000-8000-000000000039', uid, 'expense', 380000, 'mua-sam', 'Giày', '2026-09-10 16:00+07'),
    ('5eed0000-0000-4000-8000-000000000040', uid, 'expense', 260000, 'khac', 'Netflix', '2026-09-02 07:00+07'),
    ('5eed0000-0000-4000-8000-000000000041', uid, 'expense', 1010000, 'khac', 'Thuốc + tạp hoá', '2026-09-06 10:30+07'),
    ('5eed0000-0000-4000-8000-000000000042', uid, 'expense', 189000, 'khac', 'Spotify', '2026-09-09 07:00+07'),
    ('5eed0000-0000-4000-8000-000000000043', uid, 'income', 22000000, 'luong', 'Lương tháng 8', '2026-08-03 08:00+07'),
    ('5eed0000-0000-4000-8000-000000000044', uid, 'expense', 5500000, 'nha-cua', 'Tiền nhà tháng 8', '2026-08-01 10:00+07'),
    ('5eed0000-0000-4000-8000-000000000045', uid, 'expense', 6140000, 'an-uong', 'Ăn uống tháng 8', '2026-08-20 12:00+07'),
    ('5eed0000-0000-4000-8000-000000000046', uid, 'expense', 2310000, 'di-lai', 'Đi lại tháng 8', '2026-08-18 12:00+07'),
    ('5eed0000-0000-4000-8000-000000000047', uid, 'expense', 920000, 'cafe', 'Cafe tháng 8', '2026-08-15 09:00+07'),
    ('5eed0000-0000-4000-8000-000000000048', uid, 'expense', 1680000, 'mua-sam', 'Mua sắm tháng 8', '2026-08-12 16:00+07'),
    ('5eed0000-0000-4000-8000-000000000049', uid, 'expense', 1250000, 'khac', 'Lặt vặt tháng 8', '2026-08-08 10:00+07'),
    ('5eed0000-0000-4000-8000-000000000050', uid, 'income', 22000000, 'luong', 'Lương tháng 7', '2026-07-03 08:00+07'),
    ('5eed0000-0000-4000-8000-000000000051', uid, 'expense', 5500000, 'nha-cua', 'Tiền nhà tháng 7', '2026-07-01 10:00+07'),
    ('5eed0000-0000-4000-8000-000000000052', uid, 'expense', 5420000, 'an-uong', 'Ăn uống tháng 7', '2026-07-20 12:00+07'),
    ('5eed0000-0000-4000-8000-000000000053', uid, 'expense', 1980000, 'di-lai', 'Đi lại tháng 7', '2026-07-18 12:00+07'),
    ('5eed0000-0000-4000-8000-000000000054', uid, 'expense', 760000, 'cafe', 'Cafe tháng 7', '2026-07-15 09:00+07'),
    ('5eed0000-0000-4000-8000-000000000055', uid, 'expense', 540000, 'mua-sam', 'Mua sắm tháng 7', '2026-07-12 16:00+07'),
    ('5eed0000-0000-4000-8000-000000000056', uid, 'expense', 1100000, 'khac', 'Lặt vặt tháng 7', '2026-07-08 10:00+07'),
    ('5eed0000-0000-4000-8000-000000000057', uid, 'income', 23500000, 'luong', 'Lương tháng 6', '2026-06-03 08:00+07'),
    ('5eed0000-0000-4000-8000-000000000058', uid, 'expense', 5500000, 'nha-cua', 'Tiền nhà tháng 6', '2026-06-01 10:00+07'),
    ('5eed0000-0000-4000-8000-000000000059', uid, 'expense', 5890000, 'an-uong', 'Ăn uống tháng 6', '2026-06-20 12:00+07'),
    ('5eed0000-0000-4000-8000-000000000060', uid, 'expense', 2140000, 'di-lai', 'Đi lại tháng 6', '2026-06-18 12:00+07'),
    ('5eed0000-0000-4000-8000-000000000061', uid, 'expense', 810000, 'cafe', 'Cafe tháng 6', '2026-06-15 09:00+07'),
    ('5eed0000-0000-4000-8000-000000000062', uid, 'expense', 2300000, 'mua-sam', 'Mua sắm tháng 6', '2026-06-12 16:00+07'),
    ('5eed0000-0000-4000-8000-000000000063', uid, 'expense', 980000, 'khac', 'Lặt vặt tháng 6', '2026-06-08 10:00+07'),
    ('5eed0000-0000-4000-8000-000000000064', uid, 'income', 22000000, 'luong', 'Lương tháng 5', '2026-05-03 08:00+07'),
    ('5eed0000-0000-4000-8000-000000000065', uid, 'expense', 5200000, 'nha-cua', 'Tiền nhà tháng 5', '2026-05-01 10:00+07'),
    ('5eed0000-0000-4000-8000-000000000066', uid, 'expense', 4960000, 'an-uong', 'Ăn uống tháng 5', '2026-05-20 12:00+07'),
    ('5eed0000-0000-4000-8000-000000000067', uid, 'expense', 1720000, 'di-lai', 'Đi lại tháng 5', '2026-05-18 12:00+07'),
    ('5eed0000-0000-4000-8000-000000000068', uid, 'expense', 690000, 'cafe', 'Cafe tháng 5', '2026-05-15 09:00+07'),
    ('5eed0000-0000-4000-8000-000000000069', uid, 'expense', 420000, 'mua-sam', 'Mua sắm tháng 5', '2026-05-12 16:00+07'),
    ('5eed0000-0000-4000-8000-000000000070', uid, 'expense', 1340000, 'khac', 'Lặt vặt tháng 5', '2026-05-08 10:00+07'),
    ('5eed0000-0000-4000-8000-000000000071', uid, 'income', 22000000, 'luong', 'Lương tháng 4', '2026-04-03 08:00+07'),
    ('5eed0000-0000-4000-8000-000000000072', uid, 'expense', 5200000, 'nha-cua', 'Tiền nhà tháng 4', '2026-04-01 10:00+07'),
    ('5eed0000-0000-4000-8000-000000000073', uid, 'expense', 5310000, 'an-uong', 'Ăn uống tháng 4', '2026-04-20 12:00+07'),
    ('5eed0000-0000-4000-8000-000000000074', uid, 'expense', 1890000, 'di-lai', 'Đi lại tháng 4', '2026-04-18 12:00+07'),
    ('5eed0000-0000-4000-8000-000000000075', uid, 'expense', 730000, 'cafe', 'Cafe tháng 4', '2026-04-15 09:00+07'),
    ('5eed0000-0000-4000-8000-000000000076', uid, 'expense', 1150000, 'mua-sam', 'Mua sắm tháng 4', '2026-04-12 16:00+07'),
    ('5eed0000-0000-4000-8000-000000000077', uid, 'expense', 870000, 'khac', 'Lặt vặt tháng 4', '2026-04-08 10:00+07')
  on conflict (id) do nothing;

  -- Hạn mức tháng 9. 'cafe' cố tình ĐỂ THẤP hơn số đã tiêu, để thấy giao diện
  -- vượt hạn mức với ba tín hiệu chồng nhau (viền + nền, thanh đổi màu, nhãn
  -- chữ). 'khac' KHÔNG có hạn mức, để thấy nhóm "Chưa đặt hạn mức".
  insert into public.budgets (user_id, month, category_id, limit_vnd) values
    (uid, '2026-09', 'an-uong', 4500000),
    (uid, '2026-09', 'cafe',     600000),
    (uid, '2026-09', 'di-lai',  1500000),
    (uid, '2026-09', 'nha-cua', 6000000),
    (uid, '2026-09', 'mua-sam', 2000000),
    (uid, '2026-09', 'nhau',    1200000)
  on conflict (user_id, month, category_id)
    do update set limit_vnd = excluded.limit_vnd;

  -- Mốc số dư đầu tháng 9. Số dư hiện tại = mốc này + dòng tiền tháng 9.
  if to_regclass('public.balance_marks') is null then
    raise notice 'BỎ QUA mốc số dư: chưa chạy supabase/migrations/002-balance-marks.sql';
  else
    insert into public.balance_marks (user_id, as_of, amount_vnd)
    values (uid, '2026-09-01 00:00:00+07', 18000000)
    on conflict (user_id, as_of) do update set amount_vnd = excluded.amount_vnd;
  end if;
end $$;


-- ===========================================================================
-- GỠ SẠCH DỮ LIỆU MẪU
--
-- Bỏ dấu chú thích ở ba lệnh dưới rồi Run.
--
-- Lệnh đầu chỉ đụng giao dịch mang id '5eed0000-', nên giao dịch THẬT của bạn
-- không hề bị ảnh hưởng. Hai lệnh sau thì khác: hạn mức và mốc số dư không có
-- id riêng để nhận diện, nên chúng xoá theo tháng 9 / theo đúng mốc 01-09.
-- Nếu bạn đã tự đặt hạn mức tháng 9 hay tự đối soát, hãy bỏ qua hai lệnh đó.
-- ===========================================================================

-- delete from public.transactions where id::text like '5eed0000-%';
-- delete from public.budgets where month = '2026-09';
-- delete from public.balance_marks where as_of = '2026-09-01 00:00:00+07';

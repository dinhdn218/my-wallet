-- ===========================================================================
-- 003 — Thêm 4 danh mục: Tín dụng, Cầu lông, Hiếu hỉ, Freelance
--
-- AN TOÀN: chỉ THÊM dòng mới và dời `sort_order` của "Khác" xuống cuối. Không
-- xoá, không đụng tới giao dịch hay hạn mức nào đang có.
--
-- VÌ SAO CẦN FILE NÀY: `handle_new_user()` chỉ chạy đúng một lần lúc tài khoản
-- được tạo. Sửa trigger trong schema.sql chỉ giúp tài khoản MỚI; tài khoản
-- đang dùng đã có sẵn 8 dòng và sẽ không tự mọc thêm. Thiếu file này thì bốn
-- danh mục mới hiện trên dải thẻ (vì dải đọc hằng trong TypeScript) nhưng ghi
-- một khoản vào chúng sẽ văng lỗi khoá ngoại 23503.
--
-- DB dựng mới KHÔNG cần file này — schema.sql hiện tại đã gồm sẵn.
-- ===========================================================================

-- Chèn cho MỌI tài khoản đang có. `on conflict do nothing` để chạy lại lần hai
-- cũng không sao (migration phải lặp được — chạy nửa chừng rồi mất mạng là
-- chuyện thường).
insert into public.categories (user_id, id, label, color, sort_order)
select
  u.id,
  m.cat_id,
  m.label,
  m.color,
  m.sort_order
from auth.users u
cross join (values
  ('tin-dung',  'Tín dụng',  'var(--c1)',            7),
  ('cau-long',  'Cầu lông',  'oklch(.76 .14 145)',   8),
  ('hieu-hi',   'Hiếu hỉ',   'oklch(.78 .13 295)',   9),
  ('freelance', 'Freelance', 'oklch(.78 .13 195)',  10)
) as m (cat_id, label, color, sort_order)
on conflict (user_id, id) do nothing;

-- "Khác" phải ở lại cuối danh sách: nó là chỗ đổ của mọi thứ chưa phân loại,
-- đứng giữa dải thì người dùng dừng ở đó thay vì tìm tiếp danh mục đúng.
update public.categories
   set sort_order = 11
 where id = 'khac'
   and sort_order = 7;

import type { CategoryId } from '@/lib/categories'

export type { CategoryId }

export type TxType = 'income' | 'expense'

/**
 * Khái niệm "nguồn tiền" (Techcombank / Tiền mặt / Ví Momo) đã được GỠ BỎ.
 *
 * Lý do: không có số dư đầu kỳ cho từng nguồn, nên mọi con số theo nguồn đều
 * không khớp đời thực — mà một con số sai còn tệ hơn không có số. Giữ lại chỉ
 * tạo thêm một ô bắt buộc chọn trong form nhập mà không đổi lại được gì.
 * Xem PRODUCT.md § Capabilities and Constraints.
 *
 * Cột `transactions.account_id` trong Postgres được gỡ bằng
 * supabase/migrations/001-drop-account-id.sql.
 */

export interface Transaction {
  id: string
  type: TxType
  /** Số nguyên đồng, LUÔN dương. Dấu suy ra từ `type`. */
  amountVnd: number
  categoryId: CategoryId
  note?: string
  /** ISO — thời điểm phát sinh (người dùng chọn được). */
  occurredAt: string
  createdAt: string
}

export type NewTransaction = Omit<Transaction, 'id' | 'createdAt'>

/**
 * Patch cho updateTransaction. Khác `Partial<NewTransaction>` ở đúng một chỗ:
 * `note` nhận thêm `null`.
 *
 * Cần thiết vì `note?: string` không phân biệt được hai ý ngược nhau — bỏ
 * trường đi nghĩa là "giữ nguyên tên cũ", nên không còn cách nào nói "xoá tên
 * đi". `null` là lời nói đó; `undefined` vẫn giữ nghĩa "không đụng tới".
 */
export type TransactionPatch = Partial<Omit<NewTransaction, 'note'>> & {
  note?: string | null
}

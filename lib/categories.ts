/**
 * Danh mục sửa được lúc chạy (màn 2c), nên `CategoryId` là string chứ không
 * phải union đóng — đây là danh sách **mặc định** khi chưa có gì trong store.
 */
export type CategoryId = string

export interface Category {
  id: CategoryId
  label: string
  color: string
}

/**
 * Danh mục "ứng tiền cho người khác" — KHÔNG phải một khoản chi.
 *
 * Tiền rời ví thật (nên số dư phải giảm), nhưng nó sẽ quay về, nên nó không
 * được tính vào "đã tiêu tháng này", không vào biểu đồ chi theo danh mục, và
 * không đốt hạn mức. Mọi selector tính CHI TIÊU đều phải loại id này ra —
 * xem `laUngNhom` và các chỗ gọi nó trong store/useExpenseStore.ts.
 *
 * Là danh mục HỆ THỐNG: app tự tạo khi cần, người dùng không xoá/đổi tên được.
 * Lý do không cho sửa: cả cơ chế chia tiền lẫn phép tính "đang cho mượn" đều
 * tìm theo đúng id này. Đổi được id thì tiền ứng ra biến mất khỏi sổ nợ.
 */
export const UNG_NHOM_ID: CategoryId = 'ung-nhom'

export const UNG_NHOM_CATEGORY: Category = {
  id: UNG_NHOM_ID,
  label: 'Ứng cho nhóm',
  color: 'var(--c3)',
}

/** Danh mục hệ thống — không xoá, không đổi tên được ở màn Danh mục. */
export const laDanhMucHeThong = (id: CategoryId) => id === UNG_NHOM_ID

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'an-uong', label: 'Ăn uống', color: '#3ED6B5' },
  { id: 'nhau', label: 'Nhậu', color: 'oklch(.78 .13 265)' },
  { id: 'cafe', label: 'Cafe', color: 'oklch(.76 .14 320)' },
  { id: 'di-lai', label: 'Đi lại', color: '#FF7A9C' },
  { id: 'nha-cua', label: 'Nhà cửa', color: '#F5AC3C' },
  { id: 'mua-sam', label: 'Mua sắm', color: 'oklch(.78 .13 220)' },
  { id: 'luong', label: 'Lương', color: '#3ED6B5' },
  { id: 'khac', label: 'Khác', color: 'rgba(246,241,233,.28)' },
]

/** Giữ lại cho code cũ; nguồn sự thật lúc chạy là store. */
export const CATEGORIES = DEFAULT_CATEGORIES

const FALLBACK: Category = { id: 'khac', label: 'Khác', color: 'var(--c6)' }

export function categoryOf(id: CategoryId, list: Category[] = DEFAULT_CATEGORIES) {
  return list.find((c) => c.id === id) ?? { ...FALLBACK, id }
}

/**
 * 6 màu biểu đồ — bảng chọn màu duy nhất khi sửa danh mục (2c).
 * Dùng biến CSS nên tự đổi theo chế độ sáng/tối.
 */
export const CHART_COLORS = [
  'var(--c1)',
  'var(--c2)',
  'var(--c3)',
  'var(--c4)',
  'var(--c5)',
  'var(--c6)',
]

/**
 * ⚠️ UNG_NHOM_ID cố ý KHÔNG có ở đây. Khoản ứng không được chọn bằng tay như
 * một khoản chi — nó chỉ sinh ra từ nút "Chia tiền", kèm theo phần mình thật
 * sự tiêu. Bày nó ra dải thẻ giá sẽ mời người dùng ghi 500k tiền ứng mà không
 * ghi 100k phần của mình, đúng cái sai mà tính năng này sinh ra để tránh.
 */
export const EXPENSE_CATEGORY_IDS: CategoryId[] = [
  'an-uong',
  'di-lai',
  'nha-cua',
  'mua-sam',
  'cafe',
  'nhau',
  'khac',
]

/**
 * UNG_NHOM_ID CÓ ở đây: đòi được tiền là ghi một khoản Thu vào danh mục này,
 * và đó là cách duy nhất để sổ nợ trừ dần về 0.
 */
export const INCOME_CATEGORY_IDS: CategoryId[] = [UNG_NHOM_ID, 'luong', 'khac']

/**
 * Danh mục chọn được khi SỬA một giao dịch đã có.
 *
 * Khác danh sách lúc ghi mới ở đúng một chỗ: luôn kèm danh mục hiện tại của
 * giao dịch, kể cả khi nó không nằm trong danh sách chọn tay.
 *
 * Vì sao cần: khoản ứng do "Chia tiền" sinh ra là type `expense` mang
 * UNG_NHOM_ID, mà id này cố ý vắng mặt ở EXPENSE_CATEGORY_IDS. Thiếu nó trong
 * options thì ô Danh mục không tra được nhãn và in thẳng id "ung-nhom" ra màn
 * hình — đồng thời người dùng lỡ mở danh sách ra là không còn đường chọn lại.
 *
 * Không tự dựng mục từ id: danh mục bị xoá khỏi store thì thà thiếu một dòng
 * còn hơn bày ra một dòng không màu không tên.
 */
export function categoryOptionsForEdit(
  type: 'income' | 'expense',
  currentId: CategoryId,
  list: Category[],
): Category[] {
  const ids = type === 'income' ? INCOME_CATEGORY_IDS : EXPENSE_CATEGORY_IDS
  return list.filter((c) => ids.includes(c.id) || c.id === currentId)
}

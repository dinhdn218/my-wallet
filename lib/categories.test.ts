import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CATEGORIES,
  UNG_NHOM_CATEGORY,
  UNG_NHOM_ID,
  categoryOptionsForEdit,
} from '@/lib/categories'

/** Store thật luôn có sẵn danh mục hệ thống sau lần chia tiền đầu tiên. */
const STORE = [...DEFAULT_CATEGORIES, UNG_NHOM_CATEGORY]

describe('categoryOptionsForEdit', () => {
  it('khoản chi thường: đúng các danh mục chi, không có ứng nhóm', () => {
    const ids = categoryOptionsForEdit('expense', 'an-uong', STORE).map((c) => c.id)
    expect(ids).toContain('an-uong')
    expect(ids).not.toContain(UNG_NHOM_ID)
  })

  it('khoản ứng nhóm: có chính danh mục của nó, kèm nhãn tiếng Việt', () => {
    // Đây là lỗi gốc: 'ung-nhom' cố ý vắng mặt ở EXPENSE_CATEGORY_IDS, nên ô
    // Danh mục không tra được nhãn và in thẳng id ra màn hình.
    const options = categoryOptionsForEdit('expense', UNG_NHOM_ID, STORE)
    expect(options.find((c) => c.id === UNG_NHOM_ID)?.label).toBe('Ứng cho nhóm')
  })

  it('khoản thu ứng nhóm: vẫn chỉ có một mục ứng nhóm, không nhân đôi', () => {
    const ids = categoryOptionsForEdit('income', UNG_NHOM_ID, STORE).map((c) => c.id)
    expect(ids.filter((id) => id === UNG_NHOM_ID)).toHaveLength(1)
  })

  it('danh mục hiện tại đã bị xoá khỏi store: không dựng mục rỗng', () => {
    const ids = categoryOptionsForEdit('expense', 'da-xoa', DEFAULT_CATEGORIES).map(
      (c) => c.id,
    )
    expect(ids).not.toContain('da-xoa')
  })
})

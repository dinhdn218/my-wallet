import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CATEGORIES,
  EXPENSE_CATEGORY_IDS,
  INCOME_CATEGORY_IDS,
  UNG_NHOM_ID,
} from '@/lib/categories'

/**
 * Danh mục sống ở BA nơi phải khớp nhau: hằng TypeScript, hai danh sách chọn,
 * và trigger seed trong Postgres. Lệch một chỗ là lỗi câm — danh mục có trong
 * DB nhưng không hiện ở dải thẻ, hoặc hiện ở dải thẻ mà insert thì văng khoá
 * ngoại. Bộ test này là thứ duy nhất giữ ba nơi đó khớp.
 */

const ids = new Set(DEFAULT_CATEGORIES.map((c) => c.id))

describe('DEFAULT_CATEGORIES', () => {
  it('không có id trùng', () => {
    expect(DEFAULT_CATEGORIES).toHaveLength(ids.size)
  })

  it('"Khác" đứng cuối — nó là chỗ đổ của mọi thứ chưa phân loại', () => {
    expect(DEFAULT_CATEGORIES.at(-1)?.id).toBe('khac')
  })

  it('có đủ các danh mục vừa thêm, đúng nhãn tiếng Việt', () => {
    const nhan = new Map(DEFAULT_CATEGORIES.map((c) => [c.id, c.label]))
    expect(nhan.get('tin-dung')).toBe('Tín dụng')
    expect(nhan.get('cau-long')).toBe('Cầu lông')
    expect(nhan.get('hieu-hi')).toBe('Hiếu hỉ')
    expect(nhan.get('freelance')).toBe('Freelance')
  })
})

describe('danh sách chọn', () => {
  it('mọi id chọn được đều có thật trong DEFAULT_CATEGORIES', () => {
    // Trừ ung-nhom: danh mục hệ thống, app tự tạo lúc chia tiền chứ không seed.
    const moiId = [...EXPENSE_CATEGORY_IDS, ...INCOME_CATEGORY_IDS].filter(
      (id) => id !== UNG_NHOM_ID,
    )
    expect(moiId.filter((id) => !ids.has(id))).toEqual([])
  })

  it('ba khoản chi mới nằm ở danh sách CHI, không lẫn sang THU', () => {
    for (const id of ['tin-dung', 'cau-long', 'hieu-hi']) {
      expect(EXPENSE_CATEGORY_IDS).toContain(id)
      expect(INCOME_CATEGORY_IDS).not.toContain(id)
    }
  })

  it('Freelance là khoản THU, không bày ở dải thẻ chi', () => {
    expect(INCOME_CATEGORY_IDS).toContain('freelance')
    expect(EXPENSE_CATEGORY_IDS).not.toContain('freelance')
  })

  it('"Khác" đứng cuối cả hai dải — mục cuối cùng người ta mới với tới', () => {
    expect(EXPENSE_CATEGORY_IDS.at(-1)).toBe('khac')
    expect(INCOME_CATEGORY_IDS.at(-1)).toBe('khac')
  })
})

describe('trigger seed trong Postgres', () => {
  // Môi trường test là jsdom nên import.meta.url không phải file:// — lấy
  // đường dẫn từ gốc project (vitest luôn chạy ở đó).
  const sql = readFileSync(join(process.cwd(), 'supabase/schema.sql'), 'utf8')

  /** Bóc các dòng `(new.id, 'id', 'Nhãn', 'màu', n)` trong handle_new_user(). */
  const seeded = [...sql.matchAll(/\(new\.id,\s*'([^']+)',\s*'([^']+)',/g)].map(
    ([, id, label]) => ({ id, label }),
  )

  it('seed đúng từng danh mục, đúng thứ tự như DEFAULT_CATEGORIES', () => {
    expect(seeded).toEqual(
      DEFAULT_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
    )
  })

  it('sort_order chạy liên tục từ 0 — nguồn thứ tự hiển thị của mọi màn', () => {
    const thuTu = [...sql.matchAll(/\(new\.id,\s*'[^']+',\s*'[^']+',\s*'[^']+',\s*(\d+)\)/g)].map(
      ([, n]) => Number(n),
    )
    expect(thuTu).toEqual(DEFAULT_CATEGORIES.map((_, i) => i))
  })
})

import { vi } from 'vitest'
import type { Snapshot } from '@/lib/supabase/queries'

/**
 * Supabase giả cho unit test của store.
 *
 * Store gọi `createClient()` từ '@/lib/supabase/client' rồi đưa cho các hàm
 * trong '@/lib/supabase/queries'. Test chỉ cần biết mutation có gọi đúng lớp
 * truy vấn không và có cập nhật cache đúng không — không cần dựng lại cả
 * chuỗi .from().insert().select() của supabase-js. Nên mock thẳng lớp queries.
 */

/** Bộ đếm để giả uuid do Postgres cấp. */
let counter = 0

export const nextId = () => `srv_${++counter}`

export function resetFakeServer() {
  counter = 0
}

export const queryMocks = {
  insertTransaction: vi.fn(async (_client, _userId, input) => ({
    ...input,
    id: nextId(),
    note: input.note ?? undefined,
    createdAt: new Date().toISOString(),
  })),
  // Postgres trả về dòng SAU khi cập nhật; bản giả merge patch để giống thật.
  updateTransactionRow: vi.fn(async (_client, id, patch) => ({
    id,
    type: 'expense',
    amountVnd: 100_000,
    categoryId: 'an-uong',
    occurredAt: '2026-09-01T09:00:00.000Z',
    createdAt: '2026-09-01T09:00:00.000Z',
    ...patch,
  })),
  deleteTransaction: vi.fn(async () => {}),
  insertCategoryIfMissing: vi.fn(async () => {}),
  updateCategoryRow: vi.fn(async () => {}),
  deleteCategory: vi.fn(async () => {}),
  upsertBudget: vi.fn(async () => {}),
  deleteBudget: vi.fn(async () => {}),
  upsertBalanceMark: vi.fn(async () => {}),
  deleteBalanceMark: vi.fn(async () => {}),
  // Chú thích kiểu trả về: thiếu nó thì vi.fn suy ra transactions: never[] và
  // mọi test muốn mockResolvedValueOnce một snapshot CÓ dữ liệu sẽ không biên dịch.
  fetchSnapshot: vi.fn(async (): Promise<Snapshot> => ({
    transactions: [],
    categories: [],
    budgets: {},
    balanceMarks: [],
  })),
  countTransactions: vi.fn(async () => 0),
}

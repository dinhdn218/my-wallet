import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { updateTransactionRow } from './queries'
import type { TransactionRow } from './types'

const stored: TransactionRow = {
  id: '11111111-1111-4111-8111-111111111111',
  user_id: 'u1',
  type: 'expense',
  amount_vnd: 65_000,
  category_id: 'cafe',
  note: 'Cafe Highlands',
  occurred_at: '2026-09-03T02:12:00+00:00',
  created_at: '2026-09-03T02:12:00+00:00',
}

/**
 * Client giả, chỉ đủ cho chuỗi .from().update().eq().select().single() và giữ
 * lại payload để test soi. Điều cần kiểm ở đây là CỘT NÀO được gửi lên, nên
 * chạm tới Postgres thật không đem lại thêm gì.
 */
function fakeClient() {
  const seen: { payload?: Record<string, unknown> } = {}
  const client = {
    from: () => ({
      update: (payload: Record<string, unknown>) => {
        seen.payload = payload
        return {
          eq: () => ({
            select: () => ({
              single: async () => ({
                data: { ...stored, ...payload },
                error: null,
              }),
            }),
          }),
        }
      },
    }),
  }
  return { client: client as unknown as SupabaseClient, seen }
}

describe('updateTransactionRow', () => {
  it('bỏ qua trường undefined để không ghi đè cột không đổi', async () => {
    const { client, seen } = fakeClient()
    await updateTransactionRow(client, stored.id, { amountVnd: 70_000 })

    expect(seen.payload).toEqual({ amount_vnd: 70_000 })
    expect(seen.payload).not.toHaveProperty('note')
  })

  /*
   * Lỗi thật đã gặp: xoá trắng ô tên rồi bấm Lưu mà tên cũ vẫn còn.
   * transaction-edit gửi `note.trim() || undefined`, mà undefined ở đây nghĩa là
   * "không đụng tới" — nên cột note không bao giờ được gửi và thao tác xoá tên
   * im lặng không có tác dụng. null mới là lời "xoá tên đi".
   */
  it('note null thì gửi null để xoá tên, không phải bỏ qua', async () => {
    const { client, seen } = fakeClient()
    const tx = await updateTransactionRow(client, stored.id, { note: null })

    expect(seen.payload).toEqual({ note: null })
    expect(tx.note).toBeUndefined()
  })

  it('note có chữ thì gửi nguyên chữ', async () => {
    const { client, seen } = fakeClient()
    const tx = await updateTransactionRow(client, stored.id, { note: 'Bún chả' })

    expect(seen.payload).toEqual({ note: 'Bún chả' })
    expect(tx.note).toBe('Bún chả')
  })

  it('gửi được nhiều cột một lượt', async () => {
    const { client, seen } = fakeClient()
    await updateTransactionRow(client, stored.id, {
      amountVnd: 90_000,
      categoryId: 'an-uong',
      note: null,
      occurredAt: '2026-09-04T03:00:00.000Z',
    })

    expect(seen.payload).toEqual({
      amount_vnd: 90_000,
      category_id: 'an-uong',
      note: null,
      occurred_at: '2026-09-04T03:00:00.000Z',
    })
  })
})

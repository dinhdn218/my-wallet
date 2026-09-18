import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({}) }))
vi.mock('@/lib/supabase/queries', async () => {
  const { queryMocks } = await import('./test-supabase')
  return { ...queryMocks, FK_VIOLATION: '23503' }
})

import { UNG_NHOM_ID } from '@/lib/categories'
import {
  chiaHoaDon,
  computeBudgetRows,
  computeCurrentBalance,
  computeDangChoMuon,
  computeExpenseByCategory,
  computeMonthlySummary,
  useExpenseStore,
} from '@/store/useExpenseStore'
import type { Transaction } from '@/types/transaction'
import { queryMocks } from './test-supabase'

const base: Omit<Transaction, 'id'> = {
  type: 'expense',
  amountVnd: 100_000,
  categoryId: 'an-uong',
  occurredAt: '2026-09-10T09:00:00.000Z',
  createdAt: '2026-09-10T09:00:00.000Z',
}

const tx = (over: Partial<Transaction> & Pick<Transaction, 'id'>): Transaction => ({
  ...base,
  ...over,
})

/** Bữa lẩu 500k chia 5 người: mình 100k, ứng 400k. */
const LAU = [
  tx({ id: 't1', amountVnd: 100_000, categoryId: 'an-uong' }),
  tx({ id: 't2', amountVnd: 400_000, categoryId: UNG_NHOM_ID }),
]

describe('chiaHoaDon', () => {
  it('chia chẵn: 500k cho 5 người', () => {
    expect(chiaHoaDon(500_000, 5)).toEqual({ cuaMinh: 100_000, ungRa: 400_000 })
  })

  it('hai người thì đôi một nửa', () => {
    expect(chiaHoaDon(300_000, 2)).toEqual({ cuaMinh: 150_000, ungRa: 150_000 })
  })

  it('phần lẻ rơi vào MÌNH, để số nợ là con số đòi được', () => {
    // 500.000 / 3 = 166.666,67 -> mỗi người kia nợ đúng 166.666, mình chịu phần dư.
    expect(chiaHoaDon(500_000, 3)).toEqual({ cuaMinh: 166_668, ungRa: 333_332 })
  })

  it('tổng hai phần LUÔN bằng hoá đơn — bất biến giữ số dư khớp đời thực', () => {
    for (const tong of [1, 7, 999, 100_001, 500_000, 1_234_567]) {
      for (const nguoi of [2, 3, 4, 5, 6, 7, 11, 13]) {
        const { cuaMinh, ungRa } = chiaHoaDon(tong, nguoi)
        expect(cuaMinh + ungRa).toBe(tong)
        // Không bao giờ sinh khoản âm: amount_vnd > 0 là ràng buộc của Postgres.
        expect(ungRa).toBeGreaterThanOrEqual(0)
        expect(cuaMinh).toBeGreaterThan(0)
      }
    }
  })
})

describe('addSplitTransaction', () => {
  beforeEach(() => {
    useExpenseStore.setState({ transactions: [], categories: [], userId: 'u1' })
    queryMocks.insertTransaction.mockClear()
    queryMocks.deleteTransaction.mockClear()
    queryMocks.insertCategoryIfMissing.mockClear()
  })

  it('ghi HAI giao dịch: phần mình và phần ứng', async () => {
    await useExpenseStore.getState().addSplitTransaction({
      amountVnd: 500_000,
      soNguoi: 5,
      categoryId: 'an-uong',
      note: 'Lẩu',
      occurredAt: '2026-09-10T09:00:00.000Z',
    })

    expect(queryMocks.insertTransaction).toHaveBeenCalledTimes(2)
    const [phanMinh, phanUng] = queryMocks.insertTransaction.mock.calls.map(
      (c) => c[2],
    )

    expect(phanMinh).toMatchObject({
      type: 'expense',
      amountVnd: 100_000,
      categoryId: 'an-uong',
      note: 'Lẩu',
    })
    expect(phanUng).toMatchObject({
      type: 'expense',
      amountVnd: 400_000,
      categoryId: UNG_NHOM_ID,
    })
    // Ghi chú của phần ứng nói rõ ứng cho mấy người, để sau còn đối chiếu.
    expect(phanUng.note).toContain('4 người')

    expect(useExpenseStore.getState().transactions).toHaveLength(2)
  })

  it('tạo danh mục hệ thống trước khi ghi, và đưa vào cache', async () => {
    await useExpenseStore.getState().addSplitTransaction({
      amountVnd: 200_000,
      soNguoi: 2,
      categoryId: 'cafe',
      occurredAt: '2026-09-10T09:00:00.000Z',
    })

    expect(queryMocks.insertCategoryIfMissing).toHaveBeenCalledTimes(1)
    expect(
      useExpenseStore.getState().categories.some((c) => c.id === UNG_NHOM_ID),
    ).toBe(true)
  })

  it('không nhân đôi danh mục hệ thống khi chia lần thứ hai', async () => {
    const chia = () =>
      useExpenseStore.getState().addSplitTransaction({
        amountVnd: 200_000,
        soNguoi: 2,
        categoryId: 'cafe',
        occurredAt: '2026-09-10T09:00:00.000Z',
      })
    await chia()
    await chia()

    const ungNhom = useExpenseStore
      .getState()
      .categories.filter((c) => c.id === UNG_NHOM_ID)
    expect(ungNhom).toHaveLength(1)
  })

  it('khoản thứ hai hỏng thì GỠ khoản thứ nhất — không để sổ lệch một nửa', async () => {
    queryMocks.insertTransaction
      .mockImplementationOnce(async (_c, _u, input) => ({
        ...input,
        id: 'srv_ok',
        createdAt: '2026-09-10T09:00:00.000Z',
      }))
      .mockImplementationOnce(async () => {
        throw new Error('mất mạng')
      })

    await expect(
      useExpenseStore.getState().addSplitTransaction({
        amountVnd: 500_000,
        soNguoi: 5,
        categoryId: 'an-uong',
        occurredAt: '2026-09-10T09:00:00.000Z',
      }),
    ).rejects.toThrow('mất mạng')

    expect(queryMocks.deleteTransaction).toHaveBeenCalledWith({}, 'srv_ok')
    // Cache không được giữ lại nửa giao dịch nào.
    expect(useExpenseStore.getState().transactions).toHaveLength(0)
  })

  it('từ chối khi chưa đủ 2 người', async () => {
    await expect(
      useExpenseStore.getState().addSplitTransaction({
        amountVnd: 500_000,
        soNguoi: 1,
        categoryId: 'an-uong',
        occurredAt: '2026-09-10T09:00:00.000Z',
      }),
    ).rejects.toThrow()
    expect(queryMocks.insertTransaction).not.toHaveBeenCalled()
  })
})

describe('tiền ứng không bị tính là chi tiêu', () => {
  it('computeMonthlySummary chỉ đếm phần mình tiêu', () => {
    expect(computeMonthlySummary(LAU, '2026-09').expense).toBe(100_000)
  })

  it('đòi nợ về KHÔNG thành thu nhập', () => {
    const doiVe = tx({
      id: 't3',
      type: 'income',
      amountVnd: 400_000,
      categoryId: UNG_NHOM_ID,
    })
    const s = computeMonthlySummary([...LAU, doiVe], '2026-09')
    expect(s.income).toBe(0)
    expect(s.expense).toBe(100_000)
  })

  it('biểu đồ chi theo danh mục không có danh mục ứng', () => {
    const slices = computeExpenseByCategory(LAU, '2026-09')
    expect(slices.map((s) => s.categoryId)).toEqual(['an-uong'])
    expect(slices[0].share).toBe(1)
  })

  it('hạn mức không bị đốt bởi tiền ứng', () => {
    const rows = computeBudgetRows(
      LAU,
      { '2026-09': { 'an-uong': 300_000 } },
      '2026-09',
    )
    const anUong = rows.find((r) => r.categoryId === 'an-uong')!
    expect(anUong.used).toBe(100_000)
    expect(anUong.over).toBe(false)
    // Danh mục ứng không được tự xuất hiện thành một dòng ngân sách.
    expect(rows.some((r) => r.categoryId === UNG_NHOM_ID)).toBe(false)
  })

  it('SỐ DƯ thì vẫn trừ đủ cả 500k — tiền đã thật sự rời ví', () => {
    const marks = [{ asOf: '2026-09-01T00:00:00.000Z', amountVnd: 2_000_000 }]
    const balance = computeCurrentBalance(LAU, marks, '2026-09-30T00:00:00.000Z')
    expect(balance?.amount).toBe(1_500_000)
  })
})

describe('computeDangChoMuon', () => {
  it('chưa ứng lần nào thì mọi số là 0', () => {
    expect(computeDangChoMuon([])).toEqual({ conLai: 0, daUng: 0, daDoi: 0 })
  })

  it('cộng dồn MỌI THÁNG, không lọc theo tháng đang xem', () => {
    const thang8 = tx({
      id: 't8',
      amountVnd: 300_000,
      categoryId: UNG_NHOM_ID,
      occurredAt: '2026-08-05T09:00:00.000Z',
    })
    expect(computeDangChoMuon([...LAU, thang8]).conLai).toBe(700_000)
  })

  it('đòi về thì trừ dần', () => {
    const doiVe = tx({
      id: 't3',
      type: 'income',
      amountVnd: 250_000,
      categoryId: UNG_NHOM_ID,
    })
    expect(computeDangChoMuon([...LAU, doiVe])).toEqual({
      conLai: 150_000,
      daUng: 400_000,
      daDoi: 250_000,
    })
  })

  it('đòi về nhiều hơn đã ứng cho ra số ÂM — tín hiệu sổ lệch, không kẹp về 0', () => {
    const doiVe = tx({
      id: 't3',
      type: 'income',
      amountVnd: 500_000,
      categoryId: UNG_NHOM_ID,
    })
    expect(computeDangChoMuon([...LAU, doiVe]).conLai).toBe(-100_000)
  })
})

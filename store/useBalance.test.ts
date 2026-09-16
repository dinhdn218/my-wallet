import { describe, expect, it } from 'vitest'
import { computeCurrentBalance, computeDrift } from '@/store/useExpenseStore'
import type { BalanceMark } from '@/types/balance'
import type { Transaction } from '@/types/transaction'

/**
 * Số dư suy ra từ mốc — xem docs/superpowers/specs/2026-09-17-so-du-design.md.
 *
 * Toàn bộ logic ở đây là hàm thuần, không chạm store hay mạng: đúng chỗ mạnh
 * của Vitest trong dự án này.
 */

const mark = (asOf: string, amountVnd: number): BalanceMark => ({ asOf, amountVnd })

let seq = 0
const tx = (
  occurredAt: string,
  amountVnd: number,
  type: Transaction['type'] = 'expense',
): Transaction => ({
  id: `t${++seq}`,
  type,
  amountVnd,
  categoryId: 'an-uong',
  occurredAt,
  createdAt: occurredAt,
})

const MOC = '2026-09-01T00:00:00.000Z'
const SAU = '2026-09-30T00:00:00.000Z'

describe('computeCurrentBalance', () => {
  // Nguyên tắc 2 của PRODUCT.md: thà không hiện còn hơn hiện một con số người
  // dùng tưởng là tiền thật. Trả 0 sẽ bị màn hình vẽ ra như một số dư có thật.
  it('chưa có mốc nào thì trả null, KHÔNG phải 0', () => {
    expect(computeCurrentBalance([tx('2026-09-05T00:00:00.000Z', 100_000)], [], SAU))
      .toBeNull()
  })

  it('có mốc nhưng không giao dịch nào sau đó thì đúng bằng mốc', () => {
    const r = computeCurrentBalance([], [mark(MOC, 10_000_000)], SAU)
    expect(r?.amount).toBe(10_000_000)
    expect(r?.mark.asOf).toBe(MOC)
  })

  it('cộng thu và trừ chi phát sinh sau mốc', () => {
    const r = computeCurrentBalance(
      [
        tx('2026-09-05T00:00:00.000Z', 2_000_000, 'income'),
        tx('2026-09-06T00:00:00.000Z', 500_000),
      ],
      [mark(MOC, 10_000_000)],
      SAU,
    )
    expect(r?.amount).toBe(11_500_000)
  })

  // Mốc là lời khẳng định "lúc đó tôi có đúng bấy nhiêu" — nó đã bao hàm mọi
  // thứ xảy ra trước nó. Cộng lại là tính hai lần.
  it('bỏ qua giao dịch TRƯỚC mốc', () => {
    const r = computeCurrentBalance(
      [tx('2026-08-20T00:00:00.000Z', 9_000_000)],
      [mark(MOC, 10_000_000)],
      SAU,
    )
    expect(r?.amount).toBe(10_000_000)
  })

  it('bỏ qua giao dịch xảy ra ĐÚNG tại mốc', () => {
    const r = computeCurrentBalance([tx(MOC, 1_000_000)], [mark(MOC, 10_000_000)], SAU)
    expect(r?.amount).toBe(10_000_000)
  })

  it('bỏ qua giao dịch sau thời điểm đang hỏi', () => {
    const r = computeCurrentBalance(
      [tx('2026-10-15T00:00:00.000Z', 1_000_000)],
      [mark(MOC, 10_000_000)],
      SAU,
    )
    expect(r?.amount).toBe(10_000_000)
  })

  it('nhiều mốc thì lấy mốc gần nhất trước thời điểm hỏi', () => {
    const r = computeCurrentBalance(
      [tx('2026-09-20T00:00:00.000Z', 300_000)],
      [mark(MOC, 10_000_000), mark('2026-09-15T00:00:00.000Z', 7_000_000)],
      SAU,
    )
    // Mốc 15/09 thắng; chỉ khoản 20/09 được trừ.
    expect(r?.amount).toBe(6_700_000)
    expect(r?.mark.asOf).toBe('2026-09-15T00:00:00.000Z')
  })

  it('bỏ qua mốc nằm SAU thời điểm đang hỏi', () => {
    const r = computeCurrentBalance(
      [],
      [mark(MOC, 10_000_000), mark('2026-12-01T00:00:00.000Z', 99_000_000)],
      SAU,
    )
    expect(r?.amount).toBe(10_000_000)
  })

  // Mọi mốc đều ở tương lai -> chưa có gốc nào để suy ra, vẫn là null.
  it('chỉ có mốc tương lai thì trả null', () => {
    expect(
      computeCurrentBalance([], [mark('2026-12-01T00:00:00.000Z', 5_000_000)], SAU),
    ).toBeNull()
  })

  // Số dư âm được thật — khác bất biến "số tiền luôn dương" của giao dịch.
  it('số dư âm được khi chi vượt quá mốc', () => {
    const r = computeCurrentBalance(
      [tx('2026-09-05T00:00:00.000Z', 3_000_000)],
      [mark(MOC, 1_000_000)],
      SAU,
    )
    expect(r?.amount).toBe(-2_000_000)
  })
})

describe('computeDrift', () => {
  it('mốc đầu tiên không có chênh lệch', () => {
    expect(computeDrift([], [], MOC, 10_000_000)).toBeNull()
  })

  it('quên ghi khoản chi thì chênh lệch âm', () => {
    // Sổ nói còn 10tr, thực tế chỉ còn 9.5tr -> đã tiêu 500k mà quên ghi.
    const drift = computeDrift([], [mark(MOC, 10_000_000)], SAU, 9_500_000)
    expect(drift).toBe(-500_000)
  })

  it('quên ghi khoản thu thì chênh lệch dương', () => {
    expect(computeDrift([], [mark(MOC, 10_000_000)], SAU, 10_200_000)).toBe(200_000)
  })

  it('ghi đủ thì chênh lệch bằng 0', () => {
    const drift = computeDrift(
      [tx('2026-09-05T00:00:00.000Z', 500_000)],
      [mark(MOC, 10_000_000)],
      SAU,
      9_500_000,
    )
    expect(drift).toBe(0)
  })

  // Đặt lại mốc cùng thời điểm là SỬA nó. Lúc đó phải so với những gì sổ suy
  // ra từ lịch sử TRƯỚC đó, không phải so với chính con số đang bị thay.
  it('đặt lại mốc cùng thời điểm thì so với mốc trước đó, không so với chính nó', () => {
    const drift = computeDrift(
      [tx('2026-09-10T00:00:00.000Z', 1_000_000)],
      [mark(MOC, 10_000_000), mark(SAU, 8_000_000)],
      SAU,
      9_000_000,
    )
    // Sổ suy từ mốc 01/09: 10tr − 1tr = 9tr. Nhập 9tr -> khớp.
    expect(drift).toBe(0)
  })
})

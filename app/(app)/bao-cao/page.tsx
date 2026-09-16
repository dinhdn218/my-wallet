'use client'

import { useMemo, useState } from 'react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { SoDuCard } from '@/components/balance/so-du-card'
import { CotTrai } from '@/components/layout/cot-trai'
import { PageHeader } from '@/components/layout/page-header'
import { AmountSkeleton, CardLabel } from '@/components/ui/glass-card'
import { formatVnd, formatVndShort } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  useCashflowSeries,
  useCategoryLookup,
  useExpenseByCategory,
  useExpenseStore,
  useMonthComparison,
} from '@/store/useExpenseStore'

const RANGES = [
  { id: '12', label: '12 tháng', months: 12 },
  { id: '6', label: '6 tháng', months: 6 },
  { id: 'year', label: 'Năm nay', months: 0 },
] as const

export default function ReportPage() {
  const hasHydrated = useExpenseStore((s) => s.hasHydrated)
  const activeMonth = useExpenseStore((s) => s.activeMonth)
  const [rangeId, setRangeId] = useState<(typeof RANGES)[number]['id']>('12')
  const lookup = useCategoryLookup()

  const monthNo = Number(activeMonth.split('-')[1])
  const monthsInYear = monthNo
  const months =
    rangeId === 'year' ? monthsInYear : RANGES.find((r) => r.id === rangeId)!.months

  const series = useCashflowSeries(months)
  const comparison = useMonthComparison()
  const slices = useExpenseByCategory()

  const averages = useMemo(() => {
    if (series.length === 0) return { income: 0, expense: 0, savingRate: 0 }
    const income = series.reduce((a, p) => a + p.income, 0) / series.length
    const expense = series.reduce((a, p) => a + p.expense, 0) / series.length
    return {
      income,
      expense,
      savingRate: income > 0 ? (income - expense) / income : 0,
    }
  }, [series])

  const prevMonthNo = monthNo === 1 ? 12 : monthNo - 1
  const spendLess = comparison.expenseDelta < 0

  return (
    <div className="flex min-h-0 flex-1 md:flex-row">
      <CotTrai />

      <main className="no-scrollbar flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-4 pt-4 pb-4 md:px-8 md:pt-8 md:pb-8">
      <PageHeader title="Báo cáo" meta={`Thu chi theo tháng · tới tháng ${monthNo}`}>
        <div className="hidden h-9 items-center gap-px bg-men-sau p-px sm:flex">
          {RANGES.map((range) => (
            <button
              key={range.id}
              type="button"
              onClick={() => setRangeId(range.id)}
              aria-pressed={rangeId === range.id}
              className={cn(
                'h-full px-3 text-[15px] transition-colors duration-[120ms]',
                rangeId === range.id
                  ? 'bg-accent font-semibold text-accent-foreground'
                  : 'font-normal text-muted hover:text-foreground',
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </PageHeader>

      <SoDuCard className="mt-6" />

      {/* Thu & chi theo tháng */}
      <section className="mt-8 flex flex-col">
        <div className="flex items-center justify-between gap-3">
          <CardLabel>Thu &amp; chi theo tháng</CardLabel>
          <div className="flex items-center gap-3.5 text-[11px] font-semibold text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 bg-accent" aria-hidden />
              Thu
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 bg-foreground" aria-hidden />
              Chi
            </span>
          </div>
        </div>

        {!hasHydrated ? (
          <AmountSkeleton className="mt-4 h-[200px] w-full xl:h-[240px]" />
        ) : (
          <div className="mt-4 h-[220px] xl:h-[300px]">
            {/* flex-1 chỉ dùng ở xl, nơi thẻ có chiều cao xác định (396px).
                Ở khổ nhỏ thẻ cao theo nội dung, flex-basis:0 sẽ thắng
                h-[200px] và làm biểu đồ co về 0. */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} barGap={5} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tick={{
                    fill: 'var(--muted)',
                    fontSize: 10.5,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                  }}
                />
                <Tooltip cursor={{ fill: 'color-mix(in oklab, var(--foreground) 8%, transparent)' }} content={<ChartTooltip />} />
                <Bar dataKey="income" barSize={15} radius={0} isAnimationActive={false}>
                  {series.map((point, index) => (
                    <Cell
                      key={point.month}
                      fill="var(--accent)"
                      fillOpacity={index === series.length - 1 ? 1 : 0.5}
                    />
                  ))}
                </Bar>
                <Bar dataKey="expense" barSize={15} radius={0} isAnimationActive={false}>
                  {series.map((point, index) => (
                    <Cell
                      key={point.month}
                      fill="var(--foreground)"
                      fillOpacity={index === series.length - 1 ? 1 : 0.5}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-5 grid shrink-0 grid-cols-3 gap-3 border-t-2 border-foreground pt-4">
          <Stat label="Thu TB" value={averages.income} ready={hasHydrated} />
          <Stat label="Chi TB" value={averages.expense} ready={hasHydrated} />
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] text-muted">Tiết kiệm</span>
            {hasHydrated ? (
              <span className="text-[19px] font-semibold text-accent tabular-nums">
                {Math.round(averages.savingRate * 100)}%
              </span>
            ) : (
              <AmountSkeleton className="h-[18px] w-16" />
            )}
          </div>
        </div>
      </section>

      {/* Hai thẻ dưới */}
      <div className="mt-9 grid gap-9 pb-1 lg:grid-cols-2 lg:gap-8">
        <section className="flex flex-col">
          <CardLabel>
            Tháng {monthNo} so tháng {prevMonthNo}
          </CardLabel>

          {!hasHydrated ? (
            <AmountSkeleton className="mt-4 h-24 w-full" />
          ) : comparison.previous.expense === 0 ? (
            <p className="mt-4 text-[15px] text-muted text-pretty">
              Tháng {prevMonthNo} chưa có khoản chi nào để so sánh.
            </p>
          ) : (
            <>
              <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                <span
                  className={cn(
                    'px-2.5 py-1 text-[11px] font-semibold tabular-nums',
                    spendLess
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-negative text-negative-foreground',
                  )}
                >
                  {spendLess ? 'Chi ít hơn' : 'Chi nhiều hơn'}{' '}
                  {Math.abs((comparison.expenseShare ?? 0) * 100)
                    .toFixed(1)
                    .replace('.', ',')}
                  %
                </span>
                <span className="text-[19px] font-semibold tabular-nums">
                  {formatVnd(comparison.expenseDelta, { sign: true })}
                </span>
              </div>

              <ul className="mt-3.5 flex flex-col gap-2.5">
                {comparison.rows.slice(0, 3).map((row) => {
                  const category = lookup(row.categoryId)
                  const down = row.delta < 0
                  return (
                    <li key={row.categoryId} className="flex items-center gap-2.5">
                      <span
                        className="size-2 shrink-0"
                        style={{ background: category.color }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 text-[15px] text-pretty">
                        {category.label}
                      </span>
                      {row.share !== null && (
                        <span
                          className={cn(
                            'shrink-0 text-[15px] font-semibold tabular-nums',
                            down ? 'text-positive' : 'text-negative',
                          )}
                        >
                          {down ? '−' : '+'}
                          {Math.abs(row.share * 100).toFixed(0)}%
                        </span>
                      )}
                      <span className="w-[110px] shrink-0 text-right text-[15px] font-semibold tabular-nums">
                        {formatVnd(row.delta, { sign: true })}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </section>

        {/*
          Thay cho khối "Chi lớn nhất" cũ, vốn chỉ liệt kê 4 GIAO DỊCH đắt nhất
          — một giai thoại, không phải câu trả lời. Sáu mươi ly cà phê 40k là
          2,4 triệu mà không khoản nào lọt top 4, nên tiền đi đâu vẫn không ai
          thấy. Bản thân danh sách khoản đắt nhất không mất: /giao-dich lọc
          loại = Chi rồi sắp theo Số tiền là ra đúng thứ đó.
        */}
        <section className="flex flex-col">
          <CardLabel>Tiêu vào đâu tháng {monthNo}</CardLabel>

          {!hasHydrated ? (
            <AmountSkeleton className="mt-4 h-24 w-full" />
          ) : slices.length === 0 ? (
            <p className="mt-4 text-[15px] text-muted">
              Tháng này chưa có khoản chi nào.
            </p>
          ) : (
            <ul className="mt-3.5 flex flex-col gap-3">
              {slices.map((slice) => {
                const category = lookup(slice.categoryId)
                const percent = Math.round(slice.share * 100)
                return (
                  <li key={slice.categoryId} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline gap-2.5">
                      <span
                        className="size-2 shrink-0 self-center"
                        style={{ background: category.color }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 text-[15px] text-pretty">
                        {category.label}
                      </span>
                      {/* Tỉ trọng đi kèm số tiền: 4,2tr là nhiều hay ít chỉ có
                          nghĩa khi biết nó chiếm bao nhiêu phần tổng chi. */}
                      <span className="shrink-0 font-mono text-[11px] text-muted tabular-nums">
                        {percent}%
                      </span>
                      <span className="shrink-0 text-[16px] font-semibold tabular-nums">
                        {formatVnd(slice.amount)}
                      </span>
                    </div>
                    {/* Thanh tỉ trọng: đọc được thứ hạng bằng MẮT mà không phải
                        so từng con số — và không chỉ dựa vào màu danh mục, vì
                        chiều dài tự nó đã mang thông tin. */}
                    <div className="ml-[18px] h-[6px] bg-men-sau" aria-hidden>
                      <div
                        className="h-full transition-[width] duration-500"
                        style={{
                          width: `${Math.max(percent, 1)}%`,
                          background: category.color,
                        }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="mt-5 border-t border-men-vien pt-3">
            <a href="/giao-dich" className="text-[15px] font-semibold text-accent underline underline-offset-4">
              Xem tất cả giao dịch →
            </a>
          </div>
        </section>
      </div>
      </main>
    </div>
  )
}

function Stat({ label, value, ready }: { label: string; value: number; ready: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[11px] text-muted">{label}</span>
      {ready ? (
        <span className="text-[19px] font-semibold tabular-nums">
          {formatVndShort(value)}
        </span>
      ) : (
        <AmountSkeleton className="h-[18px] w-16" />
      )}
    </div>
  )
}

/** Tooltip tự viết theo style pill của app — không dùng mặc định của Recharts. */
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ dataKey?: string | number; value?: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  const income = payload.find((p) => p.dataKey === 'income')?.value ?? 0
  const expense = payload.find((p) => p.dataKey === 'expense')?.value ?? 0

  return (
    <div className="bg-men-sau px-3 py-2">
      <p className="font-mono text-[11px] font-medium tracking-[.2em] text-muted uppercase">
        {label}
      </p>
      <p className="mt-1 text-[15px] font-semibold text-accent tabular-nums">
        Thu {formatVnd(income)}
      </p>
      <p className="text-[15px] font-semibold tabular-nums">
        Chi {formatVnd(expense)}
      </p>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { BudgetRow } from '@/components/budget/budget-row'
import { CotTrai } from '@/components/layout/cot-trai'
import { PageHeader } from '@/components/layout/page-header'
import { AmountSkeleton, CardLabel } from '@/components/ui/glass-card'
import { daysLeftInMonth, formatVnd } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useBudgetRows, useBudgetStatus, useExpenseStore } from '@/store/useExpenseStore'

export default function BudgetPage() {
  const hasHydrated = useExpenseStore((s) => s.hasHydrated)
  const activeMonth = useExpenseStore((s) => s.activeMonth)
  const status = useBudgetStatus()
  const rows = useBudgetRows()

  const { withLimit, withoutLimit } = useMemo(
    () => ({
      withLimit: rows.filter((r) => !r.unset),
      withoutLimit: rows.filter((r) => r.unset),
    }),
    [rows],
  )

  const percent = status.limit > 0 ? Math.round((status.used / status.limit) * 100) : 0
  const remaining = Math.max(0, status.limit - status.used)
  const daysLeft = daysLeftInMonth(activeMonth)
  const perDay = Math.round(remaining / daysLeft)

  return (
    <div className="flex min-h-0 flex-1 md:flex-row">
      <CotTrai />

      <main className="no-scrollbar flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-4 pt-4 pb-4 md:px-8 md:pt-8 md:pb-8">
        <PageHeader
          title="Ngân sách"
          meta={
            hasHydrated
              ? `Đã dùng ${formatVnd(status.used)} trên ${formatVnd(status.limit)} · còn ${daysLeft} ngày`
              : 'Đang tải…'
          }
        >
          {/* Lối vào màn Danh mục cho mobile — thanh tab dưới chỉ đủ 4 mục. */}
          <Link
            href="/danh-muc"
            className="flex h-9 items-center bg-men-dam px-3.5 text-[15px] font-medium md:hidden"
          >
            Danh mục
          </Link>
        </PageHeader>

        {/* Nhịp chi — một câu, thay cho hai thẻ của bản cũ */}
        {hasHydrated && status.limit > 0 && (
          <p className="mt-5 text-[16px] text-pretty md:text-[19px]">
            Còn <span className="font-semibold">{daysLeft} ngày</span>, tiêu tối đa{' '}
            <span
              className={cn(
                'font-semibold tabular-nums',
                status.over ? 'text-negative' : 'text-accent',
              )}
            >
              {formatVnd(perDay)}/ngày
            </span>{' '}
            {status.over
              ? `— đã vượt hạn mức ${formatVnd(status.overBy)}.`
              : 'là vừa hạn mức.'}
          </p>
        )}

        <div className="mt-5 h-px bg-men-vien" />

        <div className="mt-5 flex items-baseline gap-3">
          <CardLabel>Theo danh mục</CardLabel>
          {hasHydrated && status.limit > 0 && (
            <>
              <span aria-hidden className="duong-cham mb-[3px] h-px flex-1 self-center" />
              <span
                className={cn(
                  'font-mono text-[11px] tracking-[.2em] tabular-nums',
                  status.over ? 'text-negative' : 'text-muted',
                )}
              >
                {percent}% {status.over ? 'ĐÃ VƯỢT' : 'ĐÃ DÙNG'}
              </span>
            </>
          )}
        </div>

        {!hasHydrated ? (
          <div className="mt-4 flex flex-col gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <AmountSkeleton
                  className="h-[15px] w-full"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
                <AmountSkeleton
                  className="h-2.5 w-full"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="mt-6 text-[15px] text-muted text-pretty">
            Chưa có hạn mức nào. Đặt hạn mức để thấy còn tiêu được bao nhiêu mỗi
            tháng.
          </p>
        ) : (
          <>
            <div className="mt-2 flex flex-col gap-2">
              {withLimit.map((row) => (
                <BudgetRow key={row.categoryId} row={row} />
              ))}
            </div>

            {withoutLimit.length > 0 && (
              <div className="mt-7">
                <CardLabel>Chưa đặt hạn mức</CardLabel>
                <div className="mt-2 flex flex-col">
                  {withoutLimit.map((row) => (
                    <BudgetRow key={row.categoryId} row={row} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Dòng kết sổ */}
        {hasHydrated && status.limit > 0 && (
          <div className="mt-8 flex shrink-0 items-baseline gap-3 border-t-2 border-foreground pt-4">
            <span className="font-mono text-[11px] tracking-[.2em] text-muted uppercase">
              {status.over ? 'Đã vượt' : 'Còn lại'}
            </span>
            <span aria-hidden className="duong-cham mb-[3px] h-px flex-1 self-center" />
            <span
              className={cn(
                'text-[26px] font-semibold tracking-[-.025em] tabular-nums',
                status.over && 'text-negative',
              )}
            >
              {formatVnd(status.over ? status.overBy : remaining)}
            </span>
          </div>
        )}
      </main>
    </div>
  )
}

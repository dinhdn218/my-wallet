'use client'

import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/dashboard/empty-state'
import { CotTrai } from '@/components/layout/cot-trai'
import { FilterChip, PageHeader } from '@/components/layout/page-header'
import { DongGia, NhanNgay, groupByDay } from '@/components/transaction/dong-gia'
import { TransactionEdit } from '@/components/transaction/transaction-edit'
import { AmountSkeleton } from '@/components/ui/glass-card'
import { formatVnd } from '@/lib/format'
import {
  useCategories,
  useCategoryLookup,
  useExpenseStore,
  useFilteredTransactions,
} from '@/store/useExpenseStore'
import type { TxType } from '@/types/transaction'

type TypeFilter = TxType | 'all'
type SortKey = 'newest' | 'oldest' | 'amount'

const SORT_LABEL: Record<SortKey, string> = {
  newest: 'Mới nhất',
  oldest: 'Cũ nhất',
  amount: 'Số tiền',
}

export default function TransactionsPage() {
  const hasHydrated = useExpenseStore((s) => s.hasHydrated)
  const activeMonth = useExpenseStore((s) => s.activeMonth)
  const categories = useCategories()
  const lookup = useCategoryLookup()

  const [type, setType] = useState<TypeFilter>('all')
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [sort, setSort] = useState<SortKey>('newest')
  const [editingId, setEditingId] = useState<string | null>(null)

  const rows = useFilteredTransactions({ type, categoryIds, month: activeMonth, sort })
  const groups = useMemo(() => groupByDay(rows), [rows])

  const summary = useMemo(
    () =>
      rows.reduce(
        (a, r) => {
          if (r.type === 'income') a.income += r.amountVnd
          else a.expense += r.amountVnd
          return a
        },
        { income: 0, expense: 0 },
      ),
    [rows],
  )

  const filtering = type !== 'all' || categoryIds.length > 0
  const monthNo = Number(activeMonth.split('-')[1])

  const toggleCategory = (id: string) =>
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )

  const clearFilters = () => {
    setType('all')
    setCategoryIds([])
  }

  return (
    <div className="flex min-h-0 flex-1 md:flex-row">
      <CotTrai />

      {/*
        Vùng cuộn nằm ở BẢNG bên dưới chứ không ở `main`: tiêu đề, dải lọc và
        dòng kết sổ "Chi tháng" phải đứng yên khi lướt danh sách. Cùng mô hình
        với màn chính — xem app/(app)/page.tsx.
      */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 pt-4 pb-4 md:px-8 md:pt-8 md:pb-8">
        <PageHeader
          title="Giao dịch"
          meta={
            hasHydrated
              ? `${rows.length} khoản tháng ${monthNo} · thu ${formatVnd(summary.income)} · chi ${formatVnd(summary.expense)}`
              : 'Đang tải…'
          }
        />

        {/* Dải lọc */}
        <div className="no-scrollbar -mx-4 mt-5 flex items-center gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
          <FilterChip active={type === 'all'} onClick={() => setType('all')}>
            Tất cả
          </FilterChip>
          <FilterChip active={type === 'expense'} onClick={() => setType('expense')}>
            Chi tiêu
          </FilterChip>
          <FilterChip active={type === 'income'} onClick={() => setType('income')}>
            Thu nhập
          </FilterChip>

          <span className="h-6 w-px shrink-0 bg-men-vien" aria-hidden />

          {/*
            MỌI danh mục trong store, không cắt bớt. Bản trước lấy
            `categories.slice(0, 4)`, nên từ "Nhà cửa" trở đi — gồm cả bốn mục
            thêm sau (Tín dụng, Cầu lông, Hiếu hỉ, Freelance) lẫn "Ứng cho nhóm"
            — không có đường nào lọc tới, dù selector vẫn lọc đúng theo id.
            Chỗ chứa đã lo phần dài: mobile cuộn ngang, desktop `md:flex-wrap`
            xuống dòng.
          */}
          {categories.map((category) => (
            <FilterChip
              key={category.id}
              active={categoryIds.includes(category.id)}
              onClick={() => toggleCategory(category.id)}
            >
              <span
                className="size-2.5"
                style={{ background: category.color }}
                aria-hidden
              />
              {category.label}
            </FilterChip>
          ))}

          <span className="hidden flex-1 md:block" />

          <FilterChip
            onClick={() =>
              setSort((s) =>
                s === 'newest' ? 'oldest' : s === 'oldest' ? 'amount' : 'newest',
              )
            }
          >
            {SORT_LABEL[sort]}
            <span className="text-[11px] text-muted" aria-hidden>
              ▾
            </span>
          </FilterChip>
        </div>

        <div className="mt-5 h-px bg-men-vien" />

        {/*
          Đây là vùng cuộn duy nhất của trang. `min-h-0` là bắt buộc: thiếu nó
          thì flex item không co dưới chiều cao nội dung, bảng phình ra đẩy dòng
          kết sổ khỏi màn hình thay vì tự cuộn bên trong.
        */}
        <div
          data-testid="tx-table"
          className="no-scrollbar mt-2 flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          {!hasHydrated ? (
            <div className="flex flex-col gap-3 pt-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <AmountSkeleton
                  key={i}
                  className="h-[22px] w-full"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          ) : rows.length === 0 ? (
            filtering ? (
              <NoMatch onClear={clearFilters} />
            ) : (
              <EmptyState href="/" />
            )
          ) : (
            groups.map((group) => (
              <section key={group.label}>
                <NhanNgay>{group.label}</NhanNgay>
                {group.rows.map((row) => (
                  <DongGia
                    key={row.id}
                    row={row}
                    lookup={lookup}
                    onClick={() => setEditingId(row.id)}
                    data-testid={`tx-row-${row.id}`}
                  />
                ))}
              </section>
            ))
          )}
        </div>

        {hasHydrated && rows.length > 0 && (
          <div className="mt-6 flex shrink-0 items-baseline gap-3 border-t-2 border-foreground pt-4">
            <span className="font-mono text-[11px] tracking-[.2em] text-muted uppercase">
              Chi tháng {monthNo}
            </span>
            <span aria-hidden className="duong-cham mb-[3px] h-px flex-1 self-center" />
            <span className="text-[26px] font-semibold tracking-[-.025em] tabular-nums">
              {formatVnd(summary.expense)}
            </span>
          </div>
        )}

        <TransactionEdit id={editingId} onClose={() => setEditingId(null)} />
      </main>
    </div>
  )
}

function NoMatch({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
      <p className="text-[16px] text-muted">Không có khoản nào khớp bộ lọc</p>
      <button
        type="button"
        onClick={onClear}
        className="text-[15px] font-semibold text-accent underline underline-offset-4"
      >
        Bỏ lọc
      </button>
    </div>
  )
}

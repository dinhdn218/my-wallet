'use client'

import { useState } from 'react'
import { CotTrai } from '@/components/layout/cot-trai'
import { PageHeader } from '@/components/layout/page-header'
import { AmountSkeleton } from '@/components/ui/glass-card'
import { CHART_COLORS, laDanhMucHeThong } from '@/lib/categories'
import { formatVnd } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  useCategories,
  useCategoryUsage,
  useExpenseStore,
} from '@/store/useExpenseStore'

export default function CategoriesPage() {
  const hasHydrated = useExpenseStore((s) => s.hasHydrated)
  const activeMonth = useExpenseStore((s) => s.activeMonth)
  const categories = useCategories()
  const usage = useCategoryUsage()
  const monthNo = Number(activeMonth.split('-')[1])

  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="flex min-h-0 flex-1 md:flex-row">
      <CotTrai />

      <main className="no-scrollbar flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-4 pt-4 pb-4 md:px-8 md:pt-8 md:pb-8">
      <PageHeader
        title="Danh mục"
        meta={`${categories.length} danh mục · chỉ xoá được danh mục chưa có giao dịch`}
      />

      <div className="mt-5 h-px bg-men-vien" />

      <div className="mt-2">
        {/* Header cột — desktop */}
        <div className="hidden items-center gap-3.5 border-b border-men-vien pb-2.5 md:flex">
          <span className="flex-1 font-mono text-[11px] font-medium tracking-[.2em] text-muted uppercase">
            Tên
          </span>
          <span className="hidden w-30 font-mono text-[11px] font-medium tracking-[.2em] text-muted uppercase xl:block">
            Giao dịch
          </span>
          <span className="w-[150px] text-right font-mono text-[11px] font-medium tracking-[.2em] text-muted uppercase">
            Chi tháng {monthNo}
          </span>
          <span className="w-24" aria-hidden />
        </div>

        {!hasHydrated ? (
          <div className="mt-3 flex flex-col gap-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <AmountSkeleton
                key={i}
                className="h-[22px] w-full"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col">
            {categories.map((category) => {
              const stats = usage.get(category.id)
              const count = stats?.count ?? 0
              const spend = stats?.monthSpend ?? 0

              return editingId === category.id ? (
                <CategoryEditor
                  key={category.id}
                  id={category.id}
                  label={category.label}
                  color={category.color}
                  count={count}
                  onDone={() => setEditingId(null)}
                />
              ) : (
                <CategoryRow
                  key={category.id}
                  id={category.id}
                  label={category.label}
                  color={category.color}
                  count={count}
                  spend={spend}
                  onEdit={() => setEditingId(category.id)}
                />
              )
            })}
          </div>
        )}
      </div>
      </main>
    </div>
  )
}

function CategoryRow({
  id,
  label,
  color,
  count,
  spend,
  onEdit,
}: {
  id: string
  label: string
  color: string
  count: number
  spend: number
  onEdit: () => void
}) {
  const removeCategory = useExpenseStore((s) => s.removeCategory)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  // Danh mục hệ thống ("Ứng cho nhóm") không xoá và không đổi tên được: cả
  // việc chia tiền lẫn con số "đang cho mượn" đều tìm theo đúng id của nó.
  const heThong = laDanhMucHeThong(id)
  const deletable = count === 0 && !heThong

  async function remove() {
    setBusy(true)
    const result = await removeCategory(id)
    setBusy(false)
    // reason 'in-use' thì nút đã bị vô hiệu sẵn và có dòng giải thích bên dưới,
    // nên chỉ cần báo khi hỏng vì mạng.
    setFailed(!result.ok && result.reason === 'network')
  }

  return (
    <div
      data-testid={`cat-row-${id}`}
      className="flex flex-col border-b border-men-vien py-3.5 last:border-b-0"
    >
      <div className="flex items-center gap-3.5">
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          <span
            className="size-2.5 shrink-0"
            style={{ background: color }}
            aria-hidden
          />
          <span className="min-w-0 text-[16px] text-pretty">
            {label}
          </span>
        </span>

        <span className="hidden w-30 font-mono text-[11px] text-muted xl:block">
          {count} giao dịch
        </span>

        <span className="w-[110px] shrink-0 text-right text-[16px] font-semibold tabular-nums md:w-[150px]">
          {formatVnd(spend)}
        </span>

        <span className="flex w-20 shrink-0 justify-end gap-3 md:w-24">
          {!heThong && (
            <button
              type="button"
              onClick={onEdit}
              className="text-[15px] font-semibold text-accent"
            >
              Sửa
            </button>
          )}
          <button
            type="button"
            onClick={remove}
            disabled={!deletable || busy}
            className={cn(
              'text-[15px] font-semibold',
              deletable ? 'text-negative' : 'cursor-not-allowed text-foreground/40',
            )}
          >
            {busy ? 'Đang xoá…' : 'Xoá'}
          </button>
        </span>
      </div>

      {failed && (
        <p role="alert" className="mt-1.5 text-[15px] font-medium text-negative">
          Chưa xoá được — không kết nối được máy chủ. Thử lại sau.
        </p>
      )}

      {/* Nói thẳng lý do ngay dưới, không ẩn nút. */}
      {heThong ? (
        <p className="mt-1.5 text-[15px] text-muted text-pretty">
          Danh mục của app — tiền bạn ứng cho người khác nằm ở đây, và nó không
          tính vào chi tiêu. Không sửa hay xoá được.
        </p>
      ) : (
        !deletable && (
          <p className="mt-1.5 text-[15px] text-muted text-pretty">
            Chưa xoá được — còn {count} giao dịch. Chuyển chúng sang danh mục khác
            trước rồi mới xoá được.
          </p>
        )
      )}
    </div>
  )
}

function CategoryEditor({
  id,
  label,
  color,
  count,
  onDone,
}: {
  id: string
  label: string
  color: string
  count: number
  onDone: () => void
}) {
  const updateCategory = useExpenseStore((s) => s.updateCategory)
  const [draftLabel, setDraftLabel] = useState(label)
  const [draftColor, setDraftColor] = useState(color)
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')

  async function save() {
    const name = draftLabel.trim()
    if (!name) return
    setStatus('saving')
    try {
      await updateCategory(id, { label: name, color: draftColor })
    } catch {
      // Giữ nguyên ô đang sửa để không mất tên vừa gõ.
      setStatus('error')
      return
    }
    setStatus('idle')
    onDone()
  }

  return (
    <div className="my-2 border-2 border-accent bg-accent/10 p-4">
      <p className="font-mono text-[11px] font-medium tracking-[.2em] text-accent uppercase">
        Đang sửa danh mục
      </p>

      <input
        autoFocus
        value={draftLabel}
        onChange={(e) => setDraftLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') onDone()
        }}
        aria-label="Tên danh mục"
        className="mt-3 h-[52px] w-full border-2 border-accent bg-men-sau px-3.5 text-[16px] font-medium outline-none"
      />

      {/* Chỉ chọn trong 6 màu biểu đồ — không có color picker tự do. */}
      <div className="mt-3 flex flex-wrap gap-2.5" role="group" aria-label="Màu danh mục">
        {CHART_COLORS.map((option) => {
          const selected = draftColor === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => setDraftColor(option)}
              aria-label={`Màu ${option}`}
              aria-pressed={selected}
              className={cn(
                'size-[30px] transition-opacity duration-[120ms]',
                !selected && 'opacity-50 hover:opacity-80',
              )}
              style={{
                background: option,
                boxShadow: selected
                  ? `0 0 0 2px var(--background), 0 0 0 4px ${option}`
                  : undefined,
              }}
            />
          )
        })}
      </div>

      {status === 'error' && (
        <p role="alert" className="mt-3 text-[15px] font-medium text-negative">
          Chưa lưu được — không kết nối được máy chủ. Thử lại sau.
        </p>
      )}

      <div className="mt-3.5 flex items-center gap-2.5">
        <button
          type="button"
          onClick={save}
          disabled={!draftLabel.trim() || status === 'saving'}
          className={cn(
            'h-[46px] bg-accent px-5 text-[15px] font-semibold text-accent-foreground',
            'transition-[filter] duration-[120ms] hover:brightness-[1.06] active:brightness-90',
            (!draftLabel.trim() || status === 'saving') && 'opacity-40',
          )}
        >
          {status === 'saving' ? 'Đang lưu…' : 'Lưu'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="h-[46px] bg-men-phim px-5 text-[15px] font-medium text-muted transition-[filter] duration-[120ms] hover:brightness-110"
        >
          Huỷ
        </button>
      </div>

      {count > 0 && (
        <p className="mt-3 text-[15px] text-muted text-pretty">
          Đổi tên và màu áp dụng cho cả {count} giao dịch cũ trong danh mục này.
        </p>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { formatVnd, parseAmountVnd } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCategoryLookup, useExpenseStore } from '@/store/useExpenseStore'
import type { CategoryBudgetRow } from '@/store/useExpenseStore'

/**
 * Một danh mục trong màn Ngân sách.
 * Vượt hạn mức dùng **ba tín hiệu chồng lên nhau** (viền + nền, thanh đổi màu,
 * nhãn chữ) chứ không chỉ màu — để người mù màu vẫn đọc được.
 */
export function BudgetRow({ row, compact }: { row: CategoryBudgetRow; compact?: boolean }) {
  const lookup = useCategoryLookup()
  const setBudget = useExpenseStore((s) => s.setBudget)
  const clearBudget = useExpenseStore((s) => s.clearBudget)
  const category = lookup(row.categoryId)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  // Gỡ hạn mức là mất dữ liệu, nên hỏi lại một nhịp — cùng lối với xoá giao dịch.
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [busy, setBusy] = useState(false)

  const percent = row.limit > 0 ? Math.round((row.used / row.limit) * 100) : 0
  const remaining = Math.max(0, row.limit - row.used)

  async function save() {
    const value = parseAmountVnd(draft)
    if (!value) return
    setBusy(true)
    try {
      await setBudget(row.categoryId, value)
    } catch {
      // Lưu hỏng thì giữ nguyên ô đang sửa để không mất số vừa gõ.
      setBusy(false)
      return
    }
    setBusy(false)
    setEditing(false)
    setDraft('')
  }

  async function clear() {
    setBusy(true)
    try {
      await clearBudget(row.categoryId)
    } catch {
      // Gỡ hỏng thì giữ nguyên hộp xác nhận — đóng nó lại sẽ trông như đã xong.
      setBusy(false)
      return
    }
    setBusy(false)
    setConfirmingClear(false)
  }

  /* Chưa đặt hạn mức: vẫn tính vào tổng chi, chỉ không có thanh tiến độ. */
  if (row.unset) {
    return (
      <div className="flex flex-col gap-2 py-2">
        <div className="flex items-center gap-2.5">
          <span
            className="size-2 shrink-0 bg-foreground/30"
            aria-hidden
          />
          <span className="min-w-0 flex-1 text-[15px] text-foreground/70 text-pretty">
            {category.label}
          </span>
          <span className="shrink-0 text-[15px] font-semibold tabular-nums text-foreground/70">
            {formatVnd(row.used)}
          </span>
          <span className="w-6 shrink-0 text-right text-[15px] text-muted" aria-hidden>
            —
          </span>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="shrink-0 text-[15px] font-semibold text-accent"
            >
              Đặt
            </button>
          )}
        </div>

        {editing && (
          <LimitInput
            label={category.label}
            draft={draft}
            onDraft={setDraft}
            onSave={save}
            busy={busy}
            onCancel={() => setEditing(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-2.5',
        row.over
          ? 'border-2 border-negative bg-negative/12 p-3.5'
          : 'py-2',
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="size-2 shrink-0"
          style={{ background: category.color }}
          aria-hidden
        />
        <span
          className={cn(
            'min-w-0 flex-1 text-pretty',
            compact ? 'text-[15px]' : 'text-[15px]',
          )}
        >
          {category.label}
        </span>
        <span
          className={cn(
            'shrink-0 font-semibold tabular-nums',
            compact ? 'text-[15px]' : 'text-[15px]',
          )}
        >
          {formatVnd(row.used, { unit: false })}
          <span className="font-normal text-muted"> / {formatVnd(row.limit)}</span>
        </span>
      </div>

      <div className="flex h-2.5 bg-men-sau">
        <div
          className={cn(
            'h-full transition-[width] duration-500',
            row.over ? 'bg-negative' : 'bg-foreground',
          )}
          // share đã kẹp ở 1 nên thanh không bao giờ vẽ quá 100%.
          style={{ width: `${row.share * 100}%` }}
        />
      </div>

      <div className="flex items-center gap-3">
        {row.over ? (
          <p className="min-w-0 flex-1 text-[15px]">
            <span className="font-mono text-[11px] font-medium tracking-[.2em] text-negative uppercase">
              Vượt hạn mức
            </span>
            <span className="text-muted">
              {' '}
              quá {formatVnd(row.overBy)} · {percent}% hạn mức
            </span>
          </p>
        ) : (
          <p className="min-w-0 flex-1 text-[15px] text-muted">
            Còn {formatVnd(remaining)} · {percent}% hạn mức
          </p>
        )}

        {!editing && !confirmingClear && (
          <span className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setDraft(String(row.limit))
                setEditing(true)
              }}
              className="text-[15px] font-semibold text-accent"
            >
              Sửa
            </button>
            <button
              type="button"
              onClick={() => setConfirmingClear(true)}
              className="text-[15px] font-semibold text-negative"
            >
              Gỡ
            </button>
          </span>
        )}
      </div>

      {editing && (
        <LimitInput
          label={category.label}
          draft={draft}
          onDraft={setDraft}
          onSave={save}
          busy={busy}
          onCancel={() => setEditing(false)}
        />
      )}

      {confirmingClear && (
        <div className="flex flex-col gap-2.5 border-2 border-negative bg-negative/12 p-3.5">
          <p className="text-[15px] text-pretty">
            Gỡ hạn mức của “{category.label}”? Khoản đã chi vẫn giữ nguyên, chỉ
            không còn theo dõi hạn mức nữa.
          </p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={clear}
              disabled={busy}
              className="h-[44px] shrink-0 bg-negative px-4 text-[15px] font-semibold text-negative-foreground disabled:opacity-60"
            >
              {busy ? 'Đang gỡ…' : 'Gỡ hạn mức'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingClear(false)}
              className="h-[44px] shrink-0 bg-men-phim px-4 text-[15px] font-medium text-muted"
            >
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Ô nhập hạn mức — dùng chung cho lúc đặt mới và lúc sửa. */
function LimitInput({
  label,
  draft,
  onDraft,
  onSave,
  busy,
  onCancel,
}: {
  label: string
  draft: string
  onDraft: (value: string) => void
  onSave: () => void
  busy?: boolean
  onCancel: () => void
}) {
  const valid = parseAmountVnd(draft) && !busy
  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={draft}
        onChange={(e) => onDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && valid) onSave()
          if (e.key === 'Escape') onCancel()
        }}
        placeholder="VD: 2tr"
        aria-label={`Hạn mức cho ${label}`}
        className="h-[44px] min-w-0 flex-1 bg-men-sau px-3 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
      />
      <button
        type="button"
        onClick={onSave}
        disabled={!valid}
        className={cn(
          'h-[44px] shrink-0 bg-accent px-4 text-[15px] font-semibold text-accent-foreground',
          !valid && 'opacity-40',
        )}
      >
        {busy ? 'Đang lưu…' : 'Lưu'}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="h-[44px] shrink-0 bg-men-phim px-3 text-[15px] font-medium text-muted"
      >
        Huỷ
      </button>
    </div>
  )
}

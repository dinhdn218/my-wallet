'use client'

import { formatVnd, parseAmountVnd } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Tách phần số và hậu tố để tô hậu tố nhạt hơn: "412k" -> ["412", "k"]. */
function splitSuffix(raw: string): [string, string] {
  const m = raw.match(/^([\d.,\s]*)(.*)$/)
  return m ? [m[1], m[2]] : [raw, '']
}

interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  /** 'input' = bàn phím hệ thống (dialog) · 'display' = numpad riêng (mobile). */
  mode: 'input' | 'display'
  className?: string
}

/**
 * Ô số tiền: hiện **nguyên văn** chuỗi người dùng gõ, và pill xác nhận số đã
 * hiểu, cập nhật theo từng phím. Parse hỏng thì pill biến mất — không báo lỗi đỏ.
 */
export function AmountInput({
  value,
  onChange,
  mode,
  className,
}: AmountInputProps) {
  const parsed = parseAmountVnd(value)
  const [digits, suffix] = splitSuffix(value)
  // Cùng một vai với ô nhập ở màn chính (38px) — giữ một cỡ duy nhất cho
  // "số tiền đang gõ" ở mọi chỗ.
  const big = mode === 'display' ? 'text-[52px]' : 'text-[38px]'

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <h3 className="font-mono text-[11px] font-medium tracking-[.2em] text-muted uppercase">
        Số tiền
      </h3>

      <div
        className={cn(
          'bg-men-sau px-4 py-3.5',
          mode === 'input' ? 'flex items-center gap-3' : 'flex flex-col gap-2',
        )}
      >
        <div className="flex min-w-0 flex-1 items-center">
          {mode === 'input' ? (
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              aria-label="Số tiền"
              className={cn(
                'w-full min-w-0 bg-transparent font-semibold tabular-nums outline-none',
                'placeholder:text-foreground/25',
                big,
              )}
            />
          ) : (
            <p
              className={cn(
                'flex min-h-[58px] items-center font-semibold tabular-nums',
                big,
              )}
              aria-live="polite"
              aria-label={`Số tiền ${value || '0'}`}
            >
              {value === '' ? (
                <span className="text-foreground/25">0</span>
              ) : (
                <>
                  <span>{digits}</span>
                  <span className="text-muted">{suffix}</span>
                </>
              )}
              <span
                className="ml-1 inline-block h-11 w-[3px] shrink-0 bg-accent"
                aria-hidden
              />
            </p>
          )}
        </div>

        {parsed !== null && (
          <span
            className={cn(
              'shrink-0 bg-accent px-2.5 py-1.5',
              'font-semibold tabular-nums text-accent-foreground',
              mode === 'display' ? 'self-start text-[19px]' : 'text-[19px]',
            )}
          >
            = {formatVnd(parsed)}
          </span>
        )}
      </div>
    </div>
  )
}

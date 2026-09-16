'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { formatMonthLabel, formatMonthShort } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAvailableMonths, useExpenseStore } from '@/store/useExpenseStore'

/**
 * Pill chọn tháng — dùng chung cho cả ba chỗ (dashboard, header mobile,
 * PageHeader của 2a–2d). Ghi thẳng vào `activeMonth`, nên mọi selector lọc
 * theo tháng đổi theo ngay.
 *
 * `size="mobile"` chỉ hiện "T9" cho vừa header hẹp; bản đầy đủ ghi
 * "Tháng 9, 2026".
 */
export function MonthPicker({
  size = 'default',
  className,
}: {
  size?: 'default' | 'mobile'
  className?: string
}) {
  const activeMonth = useExpenseStore((s) => s.activeMonth)
  const setActiveMonth = useExpenseStore((s) => s.setActiveMonth)
  const months = useAvailableMonths()

  const isMobile = size === 'mobile'

  return (
    <Select
      items={Object.fromEntries(months.map((m) => [m, formatMonthLabel(m)]))}
      value={activeMonth}
      onValueChange={(v) => setActiveMonth(String(v ?? activeMonth))}
    >
      <SelectTrigger
        aria-label="Chọn tháng"
        size="none"
        className={cn(
          'shrink-0 justify-center gap-1.5 bg-men-dam font-medium text-foreground',
          isMobile
            ? 'h-[40px] px-3 text-[15px]'
            : 'h-9 px-3.5 text-[15px]',
          '[&>svg]:size-3 [&>svg]:text-muted',
          className,
        )}
      >
        {isMobile ? formatMonthShort(activeMonth) : formatMonthLabel(activeMonth)}
      </SelectTrigger>

      <SelectContent className="border-0 bg-men-dam">
        {months.map((m) => (
          <SelectItem
            key={m}
            value={m}
            className="py-2 pl-2.5 text-[15px] font-medium"
          >
            {formatMonthLabel(m)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

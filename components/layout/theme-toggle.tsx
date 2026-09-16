'use client'

import { setTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

const SIZES = {
  desktop: { box: 'h-[46px] w-full', seg: 'flex-1 text-[15px]' },
  tablet: { box: 'h-10', seg: 'w-14 text-[11px]' },
  mobile: { box: 'h-[44px]', seg: 'w-12 text-[11px]' },
} as const

/**
 * Nút chuyển Sáng/Tối — chữ, không icon (yêu cầu thiết kế).
 * Trạng thái "đang chọn" vẽ bằng biến thể CSS theo `data-theme` trên <html>,
 * không bằng state React: server và client render giống hệt nhau nên không
 * lệch hydrate, và không nháy sai màu khi tải lại trang.
 */
export function ThemeToggle({
  size = 'desktop',
  className,
}: {
  size?: keyof typeof SIZES
  className?: string
}) {
  const s = SIZES[size]

  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-px bg-men-sau p-px',
        s.box,
        className,
      )}
      role="group"
      aria-label="Chế độ hiển thị"
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={cn(
          'h-full font-medium text-muted transition-colors duration-[120ms]',
          'light:bg-accent light:font-semibold light:text-accent-foreground',
          s.seg,
        )}
      >
        Sáng
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={cn(
          'h-full font-medium text-muted transition-colors duration-[120ms]',
          'dark:bg-accent dark:font-semibold dark:text-accent-foreground',
          s.seg,
        )}
      >
        Tối
      </button>
    </div>
  )
}

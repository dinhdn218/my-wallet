import { cn } from '@/lib/utils'

const SIZES = {
  desktop: { mark: 'size-[22px]', text: 'text-[16px]' },
  tablet: { mark: 'size-5', text: 'text-[15.5px]' },
  mobile: { mark: 'size-[18px]', text: 'text-[16px]' },
} as const

/**
 * Dấu hiệu nhận diện: một ô vuông vàng nghệ — vệt sơn mẫu trên tấm bảng, không
 * bo góc như mọi thứ khác trong thế giới này.
 */
export function Brand({
  size = 'desktop',
  className,
}: {
  size?: keyof typeof SIZES
  className?: string
}) {
  const s = SIZES[size]

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className={cn('shrink-0 bg-accent', s.mark)} aria-hidden />
      <span className={cn('font-semibold tracking-[.01em]', s.text)}>
        Ví Riêng
      </span>
    </div>
  )
}

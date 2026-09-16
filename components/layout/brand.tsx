import { Logo } from '@/components/layout/logo'
import { cn } from '@/lib/utils'

const SIZES = {
  desktop: { mark: 'size-[22px]', text: 'text-[16px]' },
  tablet: { mark: 'size-5', text: 'text-[15.5px]' },
  mobile: { mark: 'size-[18px]', text: 'text-[16px]' },
} as const

/**
 * Dấu hiệu nhận diện: logo + tên, đi liền nhau.
 *
 * Ô vuông vàng nghệ của bản trước nay có chữ V khoét thủng (components/layout/logo.tsx)
 * — vẫn là vệt sơn trên tấm bảng, chỉ thêm khuôn stencil. Vẫn không bo góc.
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
      <Logo className={cn('shrink-0', s.mark)} />
      <span className={cn('font-semibold tracking-[.01em]', s.text)}>
        Ví Của Tôi
      </span>
    </div>
  )
}

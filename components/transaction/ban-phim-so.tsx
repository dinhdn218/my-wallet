'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Bàn phím số sơn stencil — mặt dưới của tấm bảng.
 *
 * Lý do nó luôn hiện sẵn (không nằm sau sheet): việc chính của app là GHI, và
 * mỗi lớp chặn trước ô nhập là một lý do để người dùng bỏ qua khoản đó. Xem
 * PRODUCT.md § Product Purpose.
 *
 * Hai phím `k` và `tr` là lý do bàn phím này tồn tại thay vì bàn phím hệ thống:
 * "300k" = 4 chạm, "1.5tr" = 5 chạm. Chúng tô vàng nghệ để tách khỏi cột số.
 */

interface Phim {
  nhan: string
  loai: 'so' | 'donvi' | 'xoa'
  giatri: string
}

const PHIM: Phim[] = [
  { nhan: '1', loai: 'so', giatri: '1' },
  { nhan: '2', loai: 'so', giatri: '2' },
  { nhan: '3', loai: 'so', giatri: '3' },
  { nhan: 'k', loai: 'donvi', giatri: 'k' },
  { nhan: '4', loai: 'so', giatri: '4' },
  { nhan: '5', loai: 'so', giatri: '5' },
  { nhan: '6', loai: 'so', giatri: '6' },
  { nhan: 'tr', loai: 'donvi', giatri: 'tr' },
  { nhan: '7', loai: 'so', giatri: '7' },
  { nhan: '8', loai: 'so', giatri: '8' },
  { nhan: '9', loai: 'so', giatri: '9' },
  { nhan: '⌫', loai: 'xoa', giatri: '' },
  { nhan: ',', loai: 'so', giatri: ',' },
  { nhan: '0', loai: 'so', giatri: '0' },
  { nhan: '000', loai: 'so', giatri: '000' },
]

export function BanPhimSo({
  value,
  onChange,
  focusRef,
  thap,
  className,
  children,
}: {
  value: string
  onChange: (next: string) => void
  /**
   * Ô nhập để trả con trỏ về sau mỗi lần bấm phím. Không có nó thì bấm phím
   * trên màn hình xong, gõ tiếp bằng bàn phím máy sẽ không ăn — hai lối nhập
   * phải dùng chung một điểm focus.
   */
  focusRef?: React.RefObject<HTMLInputElement | null>
  /**
   * Hạ chiều cao phím khi cột ghi đang phải chứa thêm thứ khác (dải chia
   * tiền). Phím vẫn giữ 44px — ngưỡng vùng chạm tối thiểu, không xuống thấp
   * hơn — chỉ bỏ phần nở thêm trên màn cao, để nút GHI không bị đẩy khỏi tầm
   * ngón cái. Xem PRODUCT.md § Accessibility.
   */
  thap?: boolean
  className?: string
  /** Ô thứ 16 của lưới — thường là nút đổi Thu/Chi. */
  children?: React.ReactNode
}) {
  const reduceMotion = useReducedMotion()

  const bam = (phim: Phim) => {
    if (phim.loai === 'xoa') {
      onChange(value.slice(0, -1))
    } else if (phim.loai === 'donvi' && /[a-z]/i.test(value)) {
      // Đã có hậu tố (k/tr) thì không cho gõ tiếp hậu tố nữa.
      return
    } else {
      onChange(value + phim.giatri)
    }
    // Trả con trỏ về ô nhập để gõ tiếp bằng bàn phím máy được ngay.
    focusRef?.current?.focus()
  }

  return (
    <div className={cn('grid shrink-0 grid-cols-4 gap-2', className)}>
      {PHIM.map((phim) => (
        <motion.button
          key={phim.nhan}
          type="button"
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          // Giữ con trỏ ở ô nhập trong lúc bấm — nếu để nút cướp focus thì
          // con trỏ nhấp nháy biến mất mỗi lần chạm phím.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => bam(phim)}
          aria-label={
            phim.loai === 'xoa'
              ? 'Xoá một chữ số'
              : phim.loai === 'donvi'
                ? `Thêm ${phim.giatri === 'k' ? 'nghìn' : 'triệu'}`
                : undefined
          }
          className={cn(
            'flex items-center justify-center bg-men-phim',
            thap ? 'h-[clamp(44px,5vh,48px)]' : 'h-[clamp(44px,6.2vh,58px)]',
            'transition-[filter] duration-[120ms] hover:brightness-110 active:brightness-95',
            phim.loai === 'donvi'
              ? 'text-[19px] font-semibold text-accent'
              : 'text-[26px] font-medium text-foreground',
          )}
        >
          {phim.nhan}
        </motion.button>
      ))}
      {children}
    </div>
  )
}

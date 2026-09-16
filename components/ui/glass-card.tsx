import { cn } from '@/lib/utils'

/**
 * Vốn là "lớp kính"; nay là VÙNG MEN của tấm bảng giá.
 *
 * Giữ nguyên tên file và tên export vì hơn 10 component đang import — đổi ở
 * đây là đổi cả app, đúng như trước. Khác biệt cốt lõi so với bản cũ: không
 * bo góc, không blur, không viền bao quanh. Cấu trúc đọc bằng KHOẢNG HỞ và
 * vệt sơn, nên `glass` giờ chỉ là nền lõm + một đường kẻ trên cùng khi cần.
 */
export const glass = 'bg-men-dam'

export function GlassCard({
  className,
  children,
  ...props
}: React.ComponentProps<'section'>) {
  return (
    <section className={cn('flex min-w-0 flex-col', className)} {...props}>
      {children}
    </section>
  )
}

/** Nhãn mục in hoa, mono — dùng ở mọi đầu vùng. Sàn 11px, không nhỏ hơn. */
export function CardLabel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h2
      className={cn(
        'font-mono text-[11px] font-medium tracking-[.2em] text-muted uppercase',
        className,
      )}
    >
      {children}
    </h2>
  )
}

/**
 * Khối giả lập lúc chờ dữ liệu — đặt đúng kích thước nội dung thật để bố cục
 * không nhảy khi số về. Không spinner toàn màn. Truyền `style.animationDelay`
 * để các khối lệch pha nhau.
 */
export function AmountSkeleton({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={cn('animate-pulse bg-foreground/10', className)}
      style={style}
    />
  )
}

/**
 * Thẻ giá treo dây kẽm — đơn vị hiển thị danh mục của cả app.
 * `chon` làm thẻ tràn màu vàng nghệ; trạng thái không thể bỏ sót.
 */
export function TheGia({
  ten,
  gia,
  chon,
  mau,
  className,
  ...props
}: {
  ten: string
  gia?: string
  chon?: boolean
  mau?: string
} & React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      aria-pressed={chon}
      className={cn(
        'relative mt-3 flex shrink-0 flex-col px-3 pt-2.5 pb-3 text-left',
        'transition-[filter] duration-[120ms] hover:brightness-[1.04]',
        chon ? 'bg-accent text-accent-foreground' : 'bg-the text-the-muc',
        className,
      )}
      {...props}
    >
      {/* dây kẽm nối lên thanh treo */}
      <span
        aria-hidden
        className="absolute -top-3 left-1/2 h-3 w-px bg-men-vien"
      />
      <span className="flex items-center gap-1.5">
        {mau && (
          <span
            aria-hidden
            className="size-2 shrink-0"
            style={{ background: mau }}
          />
        )}
        <span className="text-[15px] leading-tight font-normal">{ten}</span>
      </span>
      {gia && (
        <span className="mt-0.5 text-[19px] font-semibold tabular-nums">
          {gia}
        </span>
      )}
    </button>
  )
}

/** Thanh treo ngang mà các thẻ giá móc vào. */
export function ThanhTreo({ className }: { className?: string }) {
  return <div aria-hidden className={cn('h-px bg-men-vien', className)} />
}

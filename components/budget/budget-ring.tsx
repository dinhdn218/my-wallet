import { cn } from '@/lib/utils'

/**
 * Chỉ báo hạn mức — vốn là vòng tròn conic-gradient, nay là VẠCH SƠN.
 *
 * Đổi vì hai lý do: vòng tròn tiến độ là thứ mọi app tài chính đều vẽ (đúng
 * cái rut mà thiết kế này từ chối), và một vòng bo tròn nằm lạc lõng trong
 * thế giới không có góc bo nào. Giữ nguyên tên file + props để chỗ gọi không
 * phải sửa.
 *
 * Vượt hạn mức đọc được bằng BA cách: màu đỏ son, chữ "vượt", và vạch đổi
 * hướng lấp đầy — người mù màu vẫn nhận ra.
 */
export function BudgetRing({
  percent,
  over,
  size,
  valueClassName = 'text-[26px]',
  className,
}: {
  percent: number
  over?: boolean
  /** Bề rộng vùng vạch; chiều cao suy ra từ nội dung. */
  size: number
  /** Giữ cho tương thích chỗ gọi cũ — không còn dùng. */
  hole?: number
  valueClassName?: string
  className?: string
}) {
  const capped = Math.min(100, Math.max(0, percent))

  return (
    <div
      className={cn('flex shrink-0 flex-col gap-1.5', className)}
      style={{ width: size }}
      role="img"
      aria-label={`Đã dùng ${percent}% hạn mức tháng${over ? ', đã vượt' : ''}`}
    >
      <span
        className={cn(
          'font-semibold tabular-nums',
          over && 'text-negative',
          valueClassName,
        )}
      >
        {percent}%
      </span>
      <div className="flex h-[10px] w-full bg-men-sau" aria-hidden>
        <div
          className={cn(
            'h-full transition-[width] duration-500',
            over ? 'bg-negative' : 'bg-foreground',
          )}
          style={{ width: `${capped}%` }}
        />
      </div>
      <span className="font-mono text-[11px] font-medium tracking-[.2em] text-muted uppercase">
        {over ? 'Đã vượt' : 'Đã dùng'}
      </span>
    </div>
  )
}

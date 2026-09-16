import { cn } from '@/lib/utils'

/**
 * Dải báo lỗi lưu, chèn **ngay trên** hàng nút. Không toast, không đóng
 * dialog, không xoá thứ người dùng đã gõ.
 */
export function SaveError({
  onRetry,
  className,
}: {
  onRetry: () => void
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        'mt-2 border-2 border-negative bg-negative/12 p-3.5',
        className,
      )}
    >
      <p className="text-[15px] font-semibold">Chưa lưu được</p>
      <p className="mt-1 text-[15px] text-muted text-pretty">
        Không kết nối được máy chủ. Không có gì bị mất.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2.5 h-[44px] bg-negative px-4 text-[15px] font-semibold text-negative-foreground transition-[filter] duration-[120ms] hover:brightness-[1.06] active:brightness-90"
      >
        Thử lại
      </button>
    </div>
  )
}

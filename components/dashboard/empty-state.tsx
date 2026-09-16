'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * Trạng thái rỗng — tấm bảng chưa sơn chữ nào.
 *
 * Khác bản cũ: không còn nút "+ Thêm giao dịch" ở đây. Ở màn chính, bàn phím
 * ghi đã nằm ngay cạnh trạng thái rỗng này rồi — thêm một nút nữa chỉ trỏ vào
 * chỗ người dùng đang nhìn. Ở các màn khác thì `href` đưa về màn ghi.
 */
export function EmptyState({
  className,
  message = 'Gõ số tiền rồi chọn danh mục để ghi khoản đầu tiên.',
  href,
}: {
  className?: string
  message?: string
  /** Có href thì hiện lối về màn ghi — dùng ở các màn không có bàn phím. */
  href?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center',
        className,
      )}
    >
      {/* Khung trống của một dòng giá chưa có gì */}
      <div
        aria-hidden
        className="flex w-full max-w-[280px] items-baseline gap-3 opacity-25"
      >
        <span className="size-2 shrink-0 self-center bg-foreground" />
        <span className="h-[14px] w-16 bg-foreground" />
        <span className="duong-cham mb-[3px] h-px flex-1 self-center" />
        <span className="h-[14px] w-14 bg-foreground" />
      </div>

      <p className="mt-1 text-[26px] leading-tight font-semibold text-pretty">
        Bảng còn trống
      </p>
      <p className="max-w-[32ch] text-[15px] text-muted text-pretty">{message}</p>

      {href && (
        <Link
          href={href}
          className="mt-1 text-[15px] font-semibold text-accent underline underline-offset-4"
        >
          Ghi một khoản
        </Link>
      )}
    </div>
  )
}

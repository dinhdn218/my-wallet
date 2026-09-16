'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS_COMPACT, isActive } from '@/components/layout/nav-items'
import { cn } from '@/lib/utils'

/**
 * Thanh tab dưới — không còn nút "+ Thêm giao dịch" như bản cũ.
 *
 * Lý do: màn chính giờ LÀ màn ghi, bàn phím số nằm sẵn ở nửa dưới. Một nút
 * "thêm" mở sheet sẽ dựng lại đúng lớp chặn mà bản thiết kế này gỡ bỏ.
 */
export function MobileTabbar({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'flex shrink-0 gap-px border-t border-men-vien bg-men-dam',
        className,
      )}
    >
      {NAV_ITEMS_COMPACT.map((item) => {
        const active = isActive(item.href, pathname)
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-[52px] flex-1 items-center justify-center text-center text-[15px] transition-colors duration-[120ms]',
              active
                ? 'bg-accent font-semibold text-accent-foreground'
                : 'font-normal text-muted',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

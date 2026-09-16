'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Brand } from '@/components/layout/brand'
import { NAV_ITEMS, isActive } from '@/components/layout/nav-items'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { ConTieuDuoc } from '@/components/dashboard/con-tieu-duoc'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useExpenseStore } from '@/store/useExpenseStore'

/**
 * Cột trái của tấm bảng — nhận diện, con số dẫn đầu, điều hướng.
 *
 * Dùng chung cho 4 màn phụ (Giao dịch, Ngân sách, Danh mục, Báo cáo). Màn
 * chính (/) không dùng vì nó đặt bàn phím số ở đúng chỗ này.
 */
export function CotTrai({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  async function dangXuat() {
    // Xoá cache TRƯỚC khi rời trang: người khác đăng nhập trên cùng máy sẽ
    // thấy thoáng số của tài khoản cũ nếu cache còn.
    useExpenseStore.getState().signOutAndClear()
    await createClient().auth.signOut()
    router.push('/dang-nhap')
  }

  return (
    <aside
      className={cn(
        'no-scrollbar hidden h-full w-[360px] shrink-0 flex-col overflow-y-auto bg-men-dam px-7 py-8 md:flex xl:w-[400px]',
        className,
      )}
    >
      <Brand />

      <ConTieuDuoc className="mt-9" />

      <nav className="mt-9 flex flex-col">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, pathname)
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-11 items-center px-3.5 text-[15px] transition-colors duration-[120ms]',
                active
                  ? 'bg-accent font-semibold text-accent-foreground'
                  : 'font-normal text-muted hover:bg-foreground/8 hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {children}

      <div className="mt-auto flex flex-col gap-4 pt-8">
        <ThemeToggle size="desktop" />
        <button
          type="button"
          onClick={dangXuat}
          className="self-start text-[15px] font-medium text-muted transition-colors duration-[120ms] hover:text-foreground"
        >
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}

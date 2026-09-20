'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ConTieuDuoc } from '@/components/dashboard/con-tieu-duoc'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Brand } from '@/components/layout/brand'
import { MonthPicker } from '@/components/layout/month-picker'
import { NAV_ITEMS, isActive } from '@/components/layout/nav-items'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { DongGia, NhanNgay, groupByDay } from '@/components/transaction/dong-gia'
import { GhiNhanh } from '@/components/transaction/ghi-nhanh'
import { TransactionEdit } from '@/components/transaction/transaction-edit'
import { AmountSkeleton } from '@/components/ui/glass-card'
import { cn } from '@/lib/utils'
import {
  useCategoryLookup,
  useExpenseStore,
  useRecentTransactions,
} from '@/store/useExpenseStore'

/**
 * Màn chính — tấm bảng giá.
 *
 * Bố cục là điều khác biệt lớn nhất so với bản cũ:
 *   mobile  → cột số ở trên, bàn phím ghi ở dưới, gõ được ngay khi mở app
 *   desktop → cột trái giữ số + bàn phím, cột phải là bảng giá theo ngày
 *
 * Không có lưới bento, không thẻ bo góc. Việc GHI chiếm chỗ tốt nhất của màn
 * hình vì đó là việc người dùng làm hàng chục lần mỗi tháng.
 */
export default function TrangChinh() {
  // Số đang gõ dở ở bàn phím, nâng lên đây để con số lớn tụt xuống theo.
  const [pending, setPending] = useState(0)
  const hasHydrated = useExpenseStore((s) => s.hasHydrated)
  const activeMonth = useExpenseStore((s) => s.activeMonth)
  const lookup = useCategoryLookup()
  // 10, không phải 40: đây là "vừa ghi gì" để soát lại ngay sau khi gõ, còn
  // xem cả tháng là việc của /giao-dich. Ở 40 thì phần lớn tháng lọt hết vào
  // đây, trang này và trang giao dịch hiện y hệt nhau, chỉ khác dải lọc — mà
  // ai chi hơn 40 khoản/tháng lại bị cắt bớt im lặng, không biết mình xem thiếu.
  const rows = useRecentTransactions(10)
  const [editingId, setEditingId] = useState<string | null>(null)

  const groups = groupByDay(rows)
  const thang = Number(activeMonth.split('-')[1])
  const nam = activeMonth.split('-')[0]

  return (
    <main className="flex min-h-0 flex-1 flex-col md:flex-row">
      {/* ---------- Cột ghi: trái ở desktop, dưới ở mobile ---------- */}
      {/*
        ⚠️ Cột này KHÔNG cuộn (`overflow-hidden`), chỉ khối ghi bên trong mới
        cuộn. Trước đây cả cột cuộn, nên mở dải chia tiền là thương hiệu và
        con số "còn tiêu được" bị kéo lên trên mép màn — hai thứ phải luôn
        nhìn thấy, vì con số đó là câu trả lời của cả màn hình.
        Ở mobile cột này ăn hết phần còn lại của màn (`flex-1`): bảng giá đã
        ẩn ở khổ đó nên không còn ai tranh chỗ nữa. Trần `max-h-[70dvh]` cũ đã
        gỡ — nó sinh ra để chừa chỗ cho đúng cái bảng giá vừa ẩn, giữ lại thì
        chỉ để lại một khoảng trống giữa con số và khối ghi.
      */}
      <div className="mep-men order-2 flex min-h-0 flex-1 flex-col overflow-hidden bg-men-dam px-4 pt-3 pb-3 md:order-1 md:h-dvh md:w-[360px] md:flex-none md:shrink-0 md:px-7 md:py-6 xl:w-[400px] xl:px-8">
        <Brand className="hidden shrink-0 md:flex" />
        <ConTieuDuoc pending={pending} className="mt-[clamp(14px,3vh,28px)] hidden shrink-0 md:flex" />
        <GhiNhanh
          onPendingChange={setPending}
          className="min-h-0 flex-1 md:mt-[clamp(12px,2.2vh,24px)]"
        />

        <div className="mt-[clamp(8px,1.5vh,16px)] hidden shrink-0 flex-col md:flex">
          <ThemeToggle size="desktop" />
        </div>
      </div>

      {/* ---------- Cột bảng giá: phải ở desktop, trên ở mobile ---------- */}
      {/*
        Ở mobile cột này chỉ còn con số dẫn đầu nên cao đúng bằng nội dung
        (`flex-none`); phần dư thuộc về cột ghi. Desktop vẫn `md:flex-1` vì ở
        đó nó là cột bảng giá và phải chiếm hết chỗ trống.
      */}
      <div className="flex min-h-0 min-w-0 flex-none flex-col px-4 pt-3 md:order-2 md:flex-1 md:px-8 md:pt-8 md:pb-8">
        {/* Con số dẫn đầu — mobile hiện ở đây, desktop đã có ở cột trái */}
        <ConTieuDuoc compact pending={pending} className="md:hidden" />

        <header className="mt-6 hidden items-baseline justify-between gap-5 md:flex">
          <h1 className="text-[27px] leading-none font-semibold tracking-[-.01em]">
            Tháng {thang}, {nam}
          </h1>
          <div className="flex items-center gap-3">
            <MonthPicker />
            {/*
              "Gần nhất", KHÔNG phải `${rows.length} khoản`: bảng này cắt ở 10
              nên con số đó luôn đọc là "10 khoản" dù tháng có bao nhiêu — người
              dùng sẽ tưởng cả tháng chỉ chi có ngần ấy.
            */}
            <span className="font-mono text-[11px] tracking-[.2em] text-muted uppercase">
              {hasHydrated ? 'Gần nhất' : '…'}
            </span>
          </div>
        </header>

        <NavNgang className="mt-5 hidden md:flex" />

        <div className="mt-5 hidden h-px bg-men-vien md:block" />

        {/*
          Bảng giá theo ngày — vùng cuộn riêng, để dòng kết sổ luôn ở đáy.

          ẨN Ở MOBILE. Một màn điện thoại không đủ cho cả việc ghi lẫn việc
          xem: chia đôi thì khối ghi bị bóp mà danh sách cũng chỉ hiện nổi một
          dòng rưỡi, tức là hỏng cả hai. PRODUCT.md tả tình huống mobile là
          "đứng ở quán, ghi một khoản trong vài giây rồi đóng", còn "ngồi xem
          lại" là tình huống desktop — nên ở đây nhường hết chỗ cho việc ghi.

          Danh sách không mất đi đâu: thanh tab dưới có sẵn mục "Giao dịch".
          Cũng vì vậy mà KHÔNG thêm lối "Xem tất cả giao dịch →" cho mobile —
          nó sẽ là cái nút thứ hai dẫn tới đúng chỗ cái tab đang dẫn tới.
        */}
        <div className="no-scrollbar mt-5 hidden min-h-0 flex-1 flex-col overflow-y-auto md:mt-2 md:flex">
          {!hasHydrated ? (
            <div className="flex flex-col gap-3 pt-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <AmountSkeleton
                  key={i}
                  className="h-[22px] w-full"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState />
          ) : (
            groups.map((group) => (
              <section key={group.label}>
                <NhanNgay>{group.label}</NhanNgay>
                {group.rows.map((row) => (
                  <DongGia
                    key={row.id}
                    row={row}
                    lookup={lookup}
                    onClick={() => setEditingId(row.id)}
                    data-testid={`tx-row-${row.id}`}
                  />
                ))}
              </section>
            ))
          )}
        </div>

        {/*
          Lối sang bảng đầy đủ, thay cho dòng kết sổ "Chi tháng" trước đây: con
          số đó đã nằm ở ConTieuDuoc phía trên rồi — nguyên văn khi chưa đặt hạn
          mức, hoặc ở dòng "Đã tiêu X trên Y" khi đã đặt (cũng chỉ desktop, đúng
          cùng điều kiện hiện của khối này). Danh sách ở đây chỉ 10 khoản gần
          nhất nên phải nói rõ còn chỗ xem hết.
        */}
        {hasHydrated && rows.length > 0 && (
          <div className="mt-5 hidden shrink-0 border-t border-men-vien pt-3 pb-2 md:block">
            <Link
              href="/giao-dich"
              className="text-[15px] font-semibold text-accent underline underline-offset-4"
            >
              Xem tất cả giao dịch →
            </Link>
          </div>
        )}
      </div>

      <TransactionEdit id={editingId} onClose={() => setEditingId(null)} />
    </main>
  )
}

/** Điều hướng ngang — chỉ desktop; mobile dùng thanh tab dưới. */
function NavNgang({ className }: { className?: string }) {
  const pathname = usePathname()
  return (
    <nav className={cn('flex flex-wrap gap-px', className)}>
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href, pathname)
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'px-4 py-2 text-[15px] transition-colors duration-[120ms]',
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
  )
}

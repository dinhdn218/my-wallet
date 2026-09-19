'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { useEffect, useState } from 'react'
import { TheGia, ThanhTreo } from '@/components/ui/glass-card'
import { formatVndShort } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/categories'

/**
 * Dải thẻ giá danh mục — cuộn ngang bằng Embla.
 *
 * Vì sao dùng thư viện thay vì tự viết: bản tự viết ghi thẳng `scrollLeft`
 * theo từng pointer event nên thả tay là dừng khực, không có quán tính, và
 * không bám khung hình. Embla lo phần vật lý đó (đà, giảm tốc, bám rAF).
 *
 * KHÔNG dùng shadcn Carousel: nó kèm nút ‹ › và lớp vỏ riêng, trong khi ở đây
 * các thẻ phải treo trên dây kẽm và giữ đúng ngôn ngữ tấm bảng. Chỉ lấy đúng
 * phần máy kéo.
 *
 * ⚠️ Mỗi thẻ là một NÚT chọn danh mục, và Embla 8 TỰ lo việc không cho một cú
 * kéo biến thành cú chọn: nó bật cờ `preventClick` khi ngón tay đi quá
 * `dragThreshold` (10px) rồi chặn bằng listener `click` pha capture ngay trên
 * node gốc này. KHÔNG dựng thêm lớp chặn nữa.
 *
 * Đã từng có một lớp như vậy ở đây và nó nuốt click thật: cờ được bật bằng sự
 * kiện `scroll`, mà `scroll` nổ ở mọi khung hình có chuyển động — kể cả cú
 * nhích 1px dưới ngưỡng, tức là một cú BẤM — còn lệnh tắt cờ lại nằm trong
 * setTimeout, chạy sau khi `click` đã bay qua. Bấm vài lần là trúng một lần
 * không đổi được danh mục. Quán tính của `dragFree` còn bật lại cờ sau khi đã
 * tắt, khoá luôn lối chọn bằng bàn phím cho tới lần chạm kế tiếp.
 */
export function DaiTheGia({
  ids,
  lookup,
  usage,
  selected,
  onSelect,
  className,
}: {
  ids: string[]
  lookup: (id: string) => Category
  usage: Map<string, { monthSpend: number }>
  selected: string
  onSelect: (id: string) => void
  className?: string
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    // Dải thẻ, không phải slideshow: trượt tự do, không chia trang, không snap
    // về từng thẻ — snap sẽ giật mỗi lần thả tay giữa hai thẻ.
    dragFree: true,
    // trimSnaps: dải dừng đúng ở hai mép, không để lại khoảng trống thừa.
    // (Kéo quá đà thì Embla kéo ngược về mép — đó là hành vi đúng, không phải
    //  giật; vùng trôi thật của dải này chỉ khoảng 150px.)
    containScroll: 'trimSnaps',
    align: 'start',
    skipSnaps: true,
    watchDrag: true,
  })

  const [coTheKeo, setCoTheKeo] = useState(false)

  // Chỉ hiện con trỏ "nắm" khi dải THỰC SỰ tràn; ít danh mục thì kéo vô nghĩa.
  useEffect(() => {
    if (!emblaApi) return
    const capNhat = () => setCoTheKeo(emblaApi.canScrollNext() || emblaApi.canScrollPrev())
    capNhat()
    emblaApi.on('reInit', capNhat).on('select', capNhat).on('scroll', capNhat)
    return () => {
      emblaApi.off('reInit', capNhat).off('select', capNhat).off('scroll', capNhat)
    }
  }, [emblaApi])

  return (
    <div className={cn('shrink-0', className)}>
      <ThanhTreo />
      <div
        ref={emblaRef}
        className={cn(
          '-mx-4 overflow-hidden md:-mx-7 xl:-mx-8',
          coTheKeo && 'cursor-grab active:cursor-grabbing',
        )}
      >
        <div className="flex touch-pan-y gap-2 px-4 pb-1 md:px-7 xl:px-8">
          {ids.map((id) => {
            const category = lookup(id)
            return (
              <TheGia
                key={id}
                ten={category.label}
                gia={formatVndShort(usage.get(id)?.monthSpend ?? 0)}
                mau={category.color}
                chon={selected === id}
                onClick={() => onSelect(id)}
                data-testid={`the-gia-${id}`}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

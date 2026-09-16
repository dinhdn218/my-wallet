'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useRef, useState } from 'react'
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
 * ⚠️ Mỗi thẻ là một NÚT chọn danh mục. Embla không tự phân biệt kéo với bấm,
 * nên vẫn phải tự chặn click sau một cú kéo — nếu không, kéo dải xong sẽ chọn
 * nhầm danh mục ở chỗ thả tay.
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

  const daKeo = useRef(false)
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

  // Đánh dấu đã kéo để chặn cú click ngay sau đó.
  useEffect(() => {
    if (!emblaApi) return
    const batDau = () => {
      daKeo.current = true
    }
    const ketThuc = () => {
      // Nhả cờ ở khung hình sau: click nổ ra ngay sau pointerup.
      setTimeout(() => {
        daKeo.current = false
      }, 0)
    }
    emblaApi.on('pointerDown', () => {
      daKeo.current = false
    })
    emblaApi.on('scroll', batDau).on('pointerUp', ketThuc)
    return () => {
      emblaApi.off('scroll', batDau).off('pointerUp', ketThuc)
    }
  }, [emblaApi])

  const chan = useCallback((e: React.MouseEvent) => {
    if (!daKeo.current) return
    e.preventDefault()
    e.stopPropagation()
  }, [])

  return (
    <div className={cn('shrink-0', className)}>
      <ThanhTreo />
      <div
        ref={emblaRef}
        onClickCapture={chan}
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

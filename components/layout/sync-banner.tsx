'use client'

import { CloudOff } from 'lucide-react'
import { useExpenseStore } from '@/store/useExpenseStore'

/**
 * Dải báo mất kết nối máy chủ.
 *
 * Lý do tồn tại: `hasHydrated` giờ bật cả khi nạp HỎNG (xem store), nên màn
 * hiện số ngay thay vì treo skeleton. Nhưng số đó là cache cũ — không nói ra
 * thì người dùng tưởng đã đồng bộ xong. Đây là nửa còn lại của bản vá đó.
 *
 * Đặt ở vỏ (app)/layout.tsx nên một chỗ này phủ cả 5 màn.
 *
 * Ba tín hiệu chồng nhau như quy ước "vượt hạn mức": viền + nền, biểu tượng,
 * và nhãn chữ — đọc được cả khi không phân biệt được màu.
 *
 * Chọn một string nguyên thuỷ từ store, KHÔNG phải object dẫn xuất: Zustand v5
 * đọc qua useSyncExternalStore nên snapshot mới mỗi render sẽ thành vòng lặp.
 */
export function SyncBanner() {
  const syncStatus = useExpenseStore((s) => s.syncStatus)

  if (syncStatus !== 'error') return null

  return (
    <div
      role="status"
      className="flex shrink-0 items-center gap-3 border-b-2 border-negative bg-negative/12 px-4 py-2"
    >
      <CloudOff className="size-4 shrink-0 text-negative" aria-hidden />

      <p className="min-w-0 flex-1 text-[13px] leading-snug">
        <span className="nhan-do mr-2 !text-negative">Mất kết nối</span>
        {/* Nói thẳng cả hai hệ quả: số đang xem là số cũ, VÀ ghi mới sẽ hỏng.
            Chỉ báo "đang xem số cũ" mà giấu vế sau thì người dùng gõ một khoản,
            thấy báo lỗi đỏ ở ô ghi và không hiểu vì sao. */}
        Đang xem số đã lưu lần trước. Khoản ghi mới chưa lưu được.
      </p>

      {/*
        Tải lại trang chứ không gọi lại loadFromServer: lỗi có thể nằm ở
        getUser() trước đó, lúc ấy store còn chưa có userId để gọi lại. Chạy lại
        nguyên bootstrap luôn đúng, và đây là đường hiếm nên không cần tối ưu.
      */}
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="nhan-do shrink-0 !text-foreground underline underline-offset-4 hover:!text-negative"
      >
        Thử lại
      </button>
    </div>
  )
}

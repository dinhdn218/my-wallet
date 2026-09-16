import { MobileHeader } from '@/components/layout/mobile-header'
import { MobileTabbar } from '@/components/layout/mobile-tabbar'
import { SyncBanner } from '@/components/layout/sync-banner'
import { StoreBootstrap } from '@/components/store-bootstrap'

/**
 * Vỏ ứng dụng — chỉ bọc các màn cần đăng nhập.
 *
 * Khác bản cũ ở chỗ KHÔNG có sidebar hay topbar dùng chung: màn chính (/) là
 * một tấm bảng liền khối tự dựng hai cột của nó, còn 4 màn phụ dùng
 * `KhungPhu` để có cột trái điều hướng. Gộp cả hai vào một vỏ chung sẽ buộc
 * màn chính phải nhường chỗ cho một thanh nav mà nó vốn đã chứa sẵn.
 */
export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <StoreBootstrap />
      <div className="flex h-dvh flex-col">
        <MobileHeader className="md:hidden" />
        {/* Không phải md:hidden: mất mạng thì desktop cũng phải biết. */}
        <SyncBanner />
        {children}
        <MobileTabbar className="md:hidden" />
      </div>
    </>
  )
}

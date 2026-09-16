import Link from 'next/link'
import { Brand } from '@/components/layout/brand'

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <section className="w-full max-w-[400px] bg-men-dam p-7 md:p-8">
        <Brand />
        <h1 className="mt-7 text-[26px] leading-tight font-semibold tracking-[-.02em]">
          Liên kết không dùng được
        </h1>
        <p className="mt-2.5 text-[15px] leading-relaxed text-muted text-pretty">
          Liên kết đăng nhập đã hết hạn hoặc đã được dùng rồi. Mỗi liên kết chỉ
          dùng được một lần.
        </p>
        <Link
          href="/dang-nhap"
          className="mt-7 flex h-[52px] items-center justify-center bg-accent text-[16px] font-semibold text-accent-foreground transition-[filter] hover:brightness-110"
        >
          Gửi liên kết mới
        </Link>
      </section>
    </main>
  )
}

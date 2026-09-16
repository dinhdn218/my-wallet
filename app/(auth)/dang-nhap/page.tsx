'use client'

import { useState } from 'react'
import { Brand } from '@/components/layout/brand'
import { createClient } from '@/lib/supabase/client'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [reason, setReason] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const address = email.trim()
    if (!address) return

    setStatus('sending')
    setReason(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: address,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      setStatus('sent')
    } catch (error) {
      // Hiện lý do thật thay vì nuốt đi: lỗi hay gặp nhất là sai
      // NEXT_PUBLIC_SUPABASE_URL hoặc chưa bật Email provider, mà một dòng
      // "không gửi được" chung chung thì không lần ra được.
      setReason(error instanceof Error ? error.message : String(error))
      setStatus('error')
    }
  }

  const sending = status === 'sending'

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <section className="w-full max-w-[400px] bg-men-dam p-7 md:p-8">
        <Brand />

        <h1 className="mt-7 text-[27px] leading-tight font-semibold tracking-[-.02em]">
          Đăng nhập
        </h1>
        <p className="mt-2.5 text-[15px] leading-relaxed text-muted text-pretty">
          Nhập email để nhận liên kết đăng nhập. Không cần mật khẩu.
        </p>

        {status === 'sent' ? (
          <div
            role="status"
            className="mt-7 border-2 border-accent bg-accent/12 p-4"
          >
            <p className="text-[15px] font-semibold text-accent">
              Đã gửi liên kết tới {email.trim()}
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-muted text-pretty">
              Mở hộp thư và bấm vào liên kết để vào app. Liên kết chỉ dùng được
              một lần.
            </p>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="mt-3 text-[15px] font-semibold text-accent underline underline-offset-4"
            >
              Gửi lại hoặc đổi email
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 flex flex-col gap-2.5">
            <label htmlFor="email" className="font-mono text-[11px] font-medium tracking-[.2em] text-muted uppercase">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={sending}
              placeholder="ban@email.com"
              className="h-[52px] w-full bg-men-sau px-3.5 text-[15px] outline-none transition-colors placeholder:text-muted/70 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset disabled:opacity-60"
            />

            {status === 'error' && (
              <p role="alert" className="text-[15px] font-medium text-negative">
                Không gửi được liên kết. Kiểm tra lại email rồi thử lần nữa.
                {reason && (
                  <span className="mt-1 block font-normal text-negative/85">
                    {reason}
                  </span>
                )}
              </p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="mt-2 h-[52px] bg-accent text-[16px] font-semibold text-accent-foreground transition-[filter] hover:brightness-110 disabled:opacity-60"
            >
              {sending ? 'Đang gửi…' : 'Gửi liên kết đăng nhập'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}

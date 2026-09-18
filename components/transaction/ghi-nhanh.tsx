'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { BanPhimSo } from '@/components/transaction/ban-phim-so'
import { ChiaTien } from '@/components/transaction/chia-tien'
import { DaiTheGia } from '@/components/transaction/dai-the-gia'
import { SaveError } from '@/components/transaction/save-error'
import { EXPENSE_CATEGORY_IDS, INCOME_CATEGORY_IDS } from '@/lib/categories'
import { formatVnd, parseAmountVnd } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  chiaHoaDon,
  useCategoryLookup,
  useCategoryUsage,
  useExpenseStore,
} from '@/store/useExpenseStore'
import type { TxType } from '@/types/transaction'

/**
 * Khối ghi nhanh — trái tim của bản thiết kế này.
 *
 * Luôn hiện sẵn ở màn chính, không nằm sau sheet hay dialog: mở app là gõ được
 * ngay. Chỉ có hai thứ bắt buộc — SỐ TIỀN và DANH MỤC. Ngày mặc định là hôm
 * nay, ghi chú là tuỳ chọn và chỉ hiện khi người dùng chủ động mở.
 *
 * Nguồn tiền đã gỡ bỏ, nên form này ngắn hơn bản cũ đúng một ô bắt buộc.
 */
export function GhiNhanh({
  onPendingChange,
  className,
}: {
  /** Báo số đang gõ dở ra ngoài để con số lớn tụt xuống theo từng phím. */
  onPendingChange?: (amount: number) => void
  className?: string
}) {
  const addTransaction = useExpenseStore((s) => s.addTransaction)
  const addSplitTransaction = useExpenseStore((s) => s.addSplitTransaction)
  /*
    Ghi cần userId để thoả policy RLS, mà nó chỉ có sau khi loadFromServer
    chạy xong. Bấm Ghi trước lúc đó thì store ném "Chưa đăng nhập" và màn hình
    báo "Không kết nối được máy chủ" — sai hẳn nguyên nhân, và người dùng sẽ
    đi kiểm tra wifi. Chặn ở nút thì cửa sổ đó không tồn tại nữa.
  */
  const userId = useExpenseStore((s) => s.userId)
  const lookup = useCategoryLookup()
  const usage = useCategoryUsage()
  const reduceMotion = useReducedMotion()

  const [type, setType] = useState<TxType>('expense')
  const [raw, setRaw] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [note, setNote] = useState('')
  const [moGhiChu, setMoGhiChu] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  /** null = không chia; số = tổng người cùng chia, kể cả mình. */
  const [soNguoi, setSoNguoi] = useState<number | null>(null)

  const amount = parseAmountVnd(raw)
  // Chia tiền chỉ có nghĩa với khoản CHI. Đổi sang Thu là tắt, nên cờ này đọc
  // từ cả hai state thay vì tin riêng soNguoi.
  const dangChia = type === 'expense' && soNguoi !== null
  /**
   * Cột ghi đang phải chứa thêm khối phụ, nên bàn phím nhường bớt chiều cao.
   *
   * Tính cả ghi chú chứ không riêng chia tiền: ô ghi chú cao 46px, đủ để đẩy
   * dòng "+ Chia tiền nhóm" xuống dưới mép vùng cuộn và cắt nó làm đôi. Phím
   * vẫn giữ sàn 44px cho vùng chạm.
   */
  const chatCho = dangChia || moGhiChu

  // Đẩy số đang gõ lên cha. Dùng effect vì cha render con số ở nhánh khác.
  //
  // ⚠️ Khi đang chia tiền, chỉ đẩy PHẦN MÌNH CHỊU. Con số "còn tiêu được" phải
  // tụt đúng bằng thứ sẽ được ghi là chi tiêu — đẩy cả hoá đơn lên thì lúc gõ
  // thấy tụt 500k, ghi xong lại nảy về 100k, và người dùng mất niềm tin vào
  // chính con số dẫn đầu của app.
  useEffect(() => {
    if (type !== 'expense' || amount === null) {
      onPendingChange?.(0)
      return
    }
    onPendingChange?.(
      soNguoi !== null ? chiaHoaDon(amount, soNguoi).cuaMinh : amount,
    )
  }, [amount, type, soNguoi, onPendingChange])
  const ids = type === 'income' ? INCOME_CATEGORY_IDS : EXPENSE_CATEGORY_IDS
  const sanSang =
    amount !== null && amount > 0 && categoryId !== '' && userId !== null
  const dangLuu = status === 'saving'
  const mauDanhMuc = categoryId ? lookup(categoryId).color : undefined
  const oNhap = useRef<HTMLInputElement>(null)

  /**
   * Nút ghi nói đúng thứ SẼ ĐƯỢC GHI, không phải thứ đang gõ.
   *
   * Khi chia tiền, con số trên nút là phần MÌNH CHỊU — hứa "Ghi 500.000đ ·
   * Ăn uống" rồi ghi có 100k vào Ăn uống là nói dối người dùng ngay tại nút
   * xác nhận cuối cùng. Phần ứng ra được nói riêng ở dải chia tiền phía trên.
   */
  const nhanNutGhi = (() => {
    if (!sanSang) {
      if (amount === null || amount === 0) return 'Gõ số tiền'
      if (categoryId === '') return 'Chọn danh mục'
      // Còn lại: đủ thông tin nhưng phiên chưa sẵn sàng.
      return 'Đang kết nối…'
    }
    const nhanDanhMuc = lookup(categoryId).label
    if (!dangChia || soNguoi === null) {
      return `Ghi ${formatVnd(amount)} · ${nhanDanhMuc}`
    }
    return `Ghi ${formatVnd(chiaHoaDon(amount, soNguoi).cuaMinh)} · ${nhanDanhMuc} + ứng`
  })()

  function doiLoai(next: TxType) {
    setType(next)
    // Danh mục tách theo loại, nên bỏ lựa chọn cũ.
    setCategoryId('')
    // Khoản THU không chia được: tiền người ta trả về không phải hoá đơn chung.
    if (next === 'income') setSoNguoi(null)
  }

  /**
   * Chỉ nhận ký tự có nghĩa cho số tiền: chữ số, dấu thập phân, và hậu tố
   * k/tr. Lọc ngay lúc gõ thay vì báo lỗi sau — parseAmountVnd vốn trả null
   * êm khi chuỗi dở dang, nên không bao giờ hiện lỗi đỏ giữa chừng.
   */
  function onChangeRaw(next: string) {
    const sach = next
      .toLowerCase()
      .replace(/[^0-9.,ktr]/g, '')
      // Hậu tố chỉ được xuất hiện một lần, ở cuối.
      .replace(/(tr|k)(?=.*(tr|k))/g, '')
    setRaw(sach)
  }

  /**
   * Đóng ô ghi chú VÀ xoá nội dung đã gõ.
   *
   * Xoá chứ không giữ: ô đóng lại là không còn nhìn thấy chữ, nên giữ lại
   * nghĩa là khoản sắp ghi mang một ghi chú người dùng tưởng đã bỏ đi. Muốn
   * giữ thì cứ để ô mở — nó không cản gì.
   */
  function dongGhiChu() {
    setMoGhiChu(false)
    setNote('')
    oNhap.current?.focus()
  }

  function onKeyDownRaw(e: React.KeyboardEvent<HTMLInputElement>) {
    // Enter = Ghi, đúng như bấm nút — người gõ bàn phím không phải với chuột.
    if (e.key === 'Enter') {
      e.preventDefault()
      void luu()
      return
    }
    // Escape xoá nhanh số đang gõ dở.
    if (e.key === 'Escape') {
      e.preventDefault()
      setRaw('')
    }
  }

  async function luu() {
    if (!sanSang || dangLuu) return
    setStatus('saving')
    const chung = {
      categoryId,
      note: note.trim() || undefined,
      occurredAt: new Date().toISOString(),
    }
    try {
      if (dangChia && soNguoi !== null) {
        await addSplitTransaction({ ...chung, amountVnd: amount, soNguoi })
      } else {
        await addTransaction({ ...chung, type, amountVnd: amount })
      }
    } catch {
      // Giữ nguyên thứ đã gõ khi lưu hỏng — không xoá công của người dùng.
      setStatus('error')
      return
    }
    setStatus('idle')
    setRaw('')
    setNote('')
    setMoGhiChu(false)
    // Tắt chia tiền sau khi ghi: bữa sau chưa chắc đã chia, mà để bật sẵn thì
    // khoản kế tiếp bị âm thầm tách đôi. Danh mục thì giữ — ghi nhiều khoản
    // cùng loại liên tiếp là chuyện thường.
    setSoNguoi(null)
  }

  return (
    <section
      className={cn('flex min-h-0 flex-col', className)}
      aria-label="Ghi giao dịch"
    >
      {/*
        Vùng CUỘN — mọi thứ trừ nút GHI. Nút phải nằm NGOÀI vùng này, không
        phải `sticky` bên trong: một phần tử sticky không chừa chỗ cho mình
        trong dòng cuộn, nên thứ nằm ngay trên nó (dòng "+ Chia tiền nhóm")
        chạy tiếp phía sau và bị cắt mất nửa dưới.

        ⚠️ `overflow-y-auto` kéo theo hai hệ quả phải xử lý cùng lúc:
        1. CSS tự nâng `overflow-x` lên `auto` — mà DaiTheGia cố ý tràn mép
           bằng `-mx-4`/`-mx-7` để dải thẻ chạy hết chiều rộng bảng. Không
           chặn thì cả khối cuộn ngang theo phần tràn đó.
        2. Chặn bằng `clip` thôi thì phần tràn bị CẮT ở mép phải, và cả cột
           trông như bị đẩy lệch sang trái.
        Nên: cắt theo trục x, rồi trả lại đúng khoảng tràn bằng margin âm +
        padding bù — khối vẫn rộng như cũ, dải thẻ vẫn chạm hai mép.
      */}
      <div
        className={cn(
          'no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-clip',
          '-mx-4 px-4 md:-mx-7 md:px-7 xl:-mx-8 xl:px-8',
        )}
      >
        {/* Thẻ giá danh mục treo dây kẽm */}
        <DaiTheGia
          ids={ids}
          lookup={lookup}
          usage={usage}
          selected={categoryId}
          onSelect={setCategoryId}
        />

        {/*
        Ô hiển thị số đang gõ. Màu danh mục đang chọn tràn vào đây — vạch dày
        bên trái + con trỏ — nên không thể nhìn con số mà không biết nó thuộc
        danh mục nào.
      */}
        <div
          // sticky top-0: cuộn xuống để tới dải chia tiền sẽ cuốn ô số đi mất —
          // người dùng bấm "Ghi 100.000đ" mà không còn nhìn thấy mình đã gõ gì.
          // Số tiền phải luôn ở trên màn tại mọi vị trí cuộn.
          className="sticky top-0 z-10 mt-4 flex shrink-0 items-stretch bg-men-sau transition-colors duration-200"
          style={
            categoryId
              ? {
                  // Màu danh mục TRÀN vào cả vùng số, không chỉ đánh dấu mép:
                  // nền ô ngả sang màu đó, và con số mang chính màu đó.
                  backgroundColor: `color-mix(in oklab, ${mauDanhMuc} 22%, var(--men-sau))`,
                }
              : undefined
          }
        >
          <span
            aria-hidden
            className="w-2 shrink-0 transition-colors duration-200"
            style={{ background: categoryId ? mauDanhMuc : 'transparent' }}
          />
          <span className="self-center pl-3 font-mono text-[11px] tracking-[.2em] text-muted uppercase">
            {type === 'income' ? 'Thu' : 'Chi'}
          </span>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1 py-[clamp(6px,1.2vh,10px)] pr-4">
            {/*
            Con số KHÔNG tô màu danh mục: 6 màu biểu đồ do người dùng chọn, có
            màu sáng (teal, vàng) tụt xuống ~1:1 trên nền men sáng. Màu danh mục
            chỉ đi vào khối đặc và con trỏ — chỗ không mang chữ — nên vẫn "tràn"
            rõ mà không bao giờ hy sinh độ đọc.
          */}
            {/*
            Ô nhập THẬT, không phải span hiển thị: gõ được bằng bàn phím máy
            tính, dán được, dùng được mũi tên và Backspace. Bàn phím số trên
            màn hình ghi vào đúng state này, nên hai lối nhập không bao giờ
            lệch nhau.

            inputMode="decimal" để điện thoại bật bàn phím số của hệ thống khi
            người dùng chạm thẳng vào ô — còn bàn phím riêng bên dưới vẫn là
            lối chính, nhanh hơn vì có k/tr.
          */}
            <input
              ref={oNhap}
              type="text"
              value={raw}
              onChange={(e) => onChangeRaw(e.target.value)}
              onKeyDown={onKeyDownRaw}
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              placeholder="0"
              aria-label="Số tiền"
              data-testid="o-nhap-so"
              className={cn(
                'w-full min-w-0 bg-transparent text-right text-[clamp(30px,4.2vh,38px)] leading-none',
                'font-semibold tabular-nums caret-accent outline-none',
                'placeholder:text-muted',
              )}
              style={mauDanhMuc ? { caretColor: mauDanhMuc } : undefined}
            />
          </div>
        </div>

        {/* Số đã hiểu — xác nhận theo từng phím, không báo lỗi đỏ khi gõ dở */}
        <p
          aria-live="polite"
          className="mt-1 min-h-[16px] shrink-0 text-right font-mono text-[11px] text-muted"
        >
          {amount !== null ? `= ${formatVnd(amount)}` : ''}
        </p>

        <BanPhimSo
          value={raw}
          onChange={onChangeRaw}
          focusRef={oNhap}
          thap={chatCho}
          className="mt-2"
        >
          <button
            type="button"
            onClick={() => doiLoai(type === 'expense' ? 'income' : 'expense')}
            aria-pressed={type === 'income'}
            className={cn(
              'flex items-center justify-center text-[15px] font-semibold',
              // Cùng chiều cao với phím số, kể cả khi hạ thấp — lệch một ô là
              // lưới bàn phím gãy ngay.
              chatCho
                ? 'h-[clamp(44px,5vh,48px)]'
                : 'h-[clamp(44px,6.2vh,58px)]',
              'transition-[filter] duration-[120ms] hover:brightness-110',
              type === 'income'
                ? 'bg-accent text-accent-foreground'
                : 'bg-men-phim text-accent',
            )}
          >
            THU
          </button>
        </BanPhimSo>

        {/*
        Hai lối phụ — ghi chú và chia tiền — mỗi thứ một dòng, LUÔN theo thứ
        tự này dù đang đóng hay mở. Bản trước render ô ghi chú phía TRÊN hàng
        nút, nên mở ghi chú xong thì "+ Chia tiền nhóm" nhảy xuống dưới ô nhập:
        cùng một màn hình mà hai bố cục khác nhau.

        Mỗi dòng tự lo trạng thái của nó, không có điều kiện chéo giữa hai bên.
      */}
        <div className="mt-[clamp(4px,1vh,10px)] flex shrink-0 flex-col gap-1.5">
          {/* --- Ghi chú --- */}
          {moGhiChu ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                  // Escape đóng ô — phản xạ quen thuộc, và là lối thoát thứ hai
                  // ngoài nút "Bỏ" cho người dùng bàn phím.
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    dongGhiChu()
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void luu()
                  }
                }}
                maxLength={120}
                placeholder="Ghi chú — ví dụ: đi chợ cuối tuần"
                aria-label="Ghi chú"
                data-testid="o-ghi-chu"
                className="h-[46px] min-w-0 flex-1 bg-men-sau px-3.5 text-[15px] outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
              />
              {/*
              Lối đóng ô ghi chú. Trước đây không có gì cả: mở ra rồi thì ô
              nằm lại vĩnh viễn, và chữ đã gõ cũng không bỏ được.
            */}
              <button
                type="button"
                onClick={dongGhiChu}
                data-testid="dong-ghi-chu"
                className="h-[46px] shrink-0 bg-men-phim px-3.5 text-[15px] font-medium text-muted transition-[filter] duration-[120ms] hover:brightness-110"
              >
                Bỏ
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setMoGhiChu(true)}
              data-testid="mo-ghi-chu"
              className="self-start py-0.5 text-[15px] font-medium text-muted underline underline-offset-4 transition-colors hover:text-foreground"
            >
              + Thêm ghi chú
            </button>
          )}

          {/* --- Chia tiền nhóm: chỉ có nghĩa với khoản CHI --- */}
          {type === 'expense' &&
            (dangChia && soNguoi !== null ? (
              <ChiaTien
                soNguoi={soNguoi}
                onSoNguoiChange={setSoNguoi}
                onTat={() => setSoNguoi(null)}
                amount={amount}
              />
            ) : (
              <button
                type="button"
                onClick={() => setSoNguoi(2)}
                data-testid="mo-chia-tien"
                className="self-start py-0.5 text-[15px] font-medium text-muted underline underline-offset-4 transition-colors hover:text-foreground"
              >
                + Chia tiền nhóm
              </button>
            ))}
        </div>
      </div>

      {status === 'error' && <SaveError onRetry={luu} />}

      <motion.button
        type="button"
        whileTap={reduceMotion || !sanSang ? undefined : { scale: 0.99 }}
        onClick={luu}
        disabled={!sanSang || dangLuu}
        data-testid="nut-ghi"
        className={cn(
          // sticky bottom-0: khối ghi giờ là vùng CUỘN (dải chia tiền có thể
          // đẩy nội dung dài hơn cột), và một nút trôi theo nội dung sẽ tuột
          // khỏi màn đúng lúc người dùng cần bấm. Dính đáy thì nó luôn ở đó,
          // đúng "The Reach Rule" của DESIGN.md.
          'mt-auto flex h-[clamp(48px,6.6vh,58px)] shrink-0 items-center justify-center gap-2 px-4',
          'text-[16px] font-semibold tracking-[.04em] uppercase',
          'transition-[filter,background-color] duration-[120ms]',
          sanSang
            ? 'bg-negative text-negative-foreground hover:brightness-110 active:brightness-95'
            : 'bg-men-phim text-muted',
        )}
      >
        {dangLuu ? 'Đang ghi…' : nhanNutGhi}
      </motion.button>
    </section>
  )
}

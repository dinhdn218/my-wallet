'use client'

import { useMemo } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { UNG_NHOM_CATEGORY, UNG_NHOM_ID, categoryOf } from '@/lib/categories'
import type { Category, CategoryId } from '@/lib/categories'
import { daysLeftInMonth } from '@/lib/format'
import { SEED_ACTIVE_MONTH } from '@/lib/seed-data'
import type { Budgets } from '@/lib/seed-data'
import { createClient } from '@/lib/supabase/client'
import {
  FK_VIOLATION,
  deleteBalanceMark,
  deleteBudget,
  deleteCategory,
  deleteTransaction,
  fetchSnapshot,
  insertCategoryIfMissing,
  insertTransaction,
  updateCategoryRow,
  updateTransactionRow,
  upsertBalanceMark,
  upsertBudget,
} from '@/lib/supabase/queries'
import type { BalanceMark } from '@/types/balance'
import type {
  NewTransaction,
  Transaction,
  TransactionPatch,
  TxType,
} from '@/types/transaction'

export type { NewTransaction, Transaction, TxType }
export type { BalanceMark }

/** Hạn mức chi theo tháng: budgets["2026-09"]["an-uong"] = 5_000_000 */
export type { Budgets }

/**
 * Kết quả xoá danh mục. Trả về union thay vì ném lỗi vì "danh mục còn giao
 * dịch" là kết quả nghiệp vụ bình thường, không phải sự cố.
 */
export type RemoveCategoryResult =
  | { ok: true }
  | { ok: false; reason: 'in-use' | 'network' }

/** Một lần ứng tiền cho nhóm, trước khi tách thành hai giao dịch. */
export interface SplitInput {
  /** TỔNG hoá đơn, tức số tiền thật sự rời khỏi ví. */
  amountVnd: number
  /** Tổng số người cùng chia, KỂ CẢ mình. Phải >= 2. */
  soNguoi: number
  /** Danh mục của phần mình tiêu ("an-uong"…), không phải danh mục ứng. */
  categoryId: CategoryId
  note?: string
  occurredAt: string
}

export interface SplitParts {
  /** Phần mình thật sự tiêu — vào danh mục đã chọn, tính là chi tiêu. */
  cuaMinh: number
  /** Phần ứng cho người khác — vào danh mục hệ thống, KHÔNG tính là chi. */
  ungRa: number
}

/**
 * Chia hoá đơn thành phần của mình và phần ứng ra.
 *
 * ⚠️ Phần LẺ rơi vào phần của mình, không phải phần ứng ra. Chia 500k cho 3
 * thì mình chịu 166.668đ còn hai người kia nợ đúng 166.666đ mỗi người. Lý do:
 * số nợ phải là con số đòi được — nói với bạn mình "đưa tao 166.666" thì được,
 * chứ sổ nợ mang số lẻ mà người ta trả số chẵn sẽ để lại vài đồng rác vĩnh
 * viễn trong "đang cho mượn". Mình chịu phần lẻ là cách duy nhất khiến sổ về
 * đúng 0 khi mọi người đã trả đủ.
 *
 * Hệ quả bắt buộc: cuaMinh + ungRa === amountVnd, LUÔN LUÔN. Bất biến này là
 * thứ giữ cho số dư khớp đời thực — vi phạm nó thì mỗi lần chia tiền lại làm
 * số dư lệch vài đồng, không bao giờ tự sửa.
 */
export function chiaHoaDon(amountVnd: number, soNguoi: number): SplitParts {
  const moiNguoi = Math.floor(amountVnd / soNguoi)
  const ungRa = moiNguoi * (soNguoi - 1)
  return { cuaMinh: amountVnd - ungRa, ungRa }
}

/** Trạng thái đồng bộ với server. Chỉ dùng cho chỉ báo, không chặn nội dung. */
export type SyncStatus = 'idle' | 'loading' | 'ready' | 'error'

interface ExpenseState {
  transactions: Transaction[]
  /** Danh mục sửa được (tên + màu) ở màn Danh mục. */
  categories: Category[]
  budgets: Budgets
  /**
   * Mốc số dư, MỚI NHẤT TRƯỚC. Số dư không được lưu — nó suy ra từ mốc gần
   * nhất cộng dòng tiền kể từ đó. Xem computeCurrentBalance.
   */
  balanceMarks: BalanceMark[]
  /** Tháng đang xem, dạng "2026-09". Chỉ là view state, không lưu lên server. */
  activeMonth: string
  /**
   * Đã THỬ nạp xong một lượt chưa — KHÔNG phải "nạp thành công chưa". Bật cả
   * khi nạp hỏng, để có gì vẽ nấy thay vì kẹt skeleton; việc báo số đang xem là
   * số cũ thuộc về SyncBanner. LATCH MỘT CHIỀU: false -> true, không bao giờ
   * quay lại. 10 component dùng nó để quyết định hiện skeleton hay số thật; cho
   * nó lật lại khi refetch thì mỗi lần đồng bộ nền cả dashboard sẽ nháy về
   * skeleton. Trạng thái đồng bộ chi tiết nằm ở `syncStatus`.
   * Chỉ đặt lại false khi đăng xuất (signOutAndClear).
   */
  hasHydrated: boolean
  syncStatus: SyncStatus
  /** Id người dùng đang đăng nhập; cần khi ghi để thoả policy RLS. */
  userId: string | null

  loadFromServer: (userId: string) => Promise<void>
  signOutAndClear: () => void

  addTransaction: (input: NewTransaction) => Promise<string>
  /**
   * Ứng tiền cho nhóm: ghi PHẦN MÌNH TIÊU vào danh mục đã chọn, và PHẦN ỨNG
   * RA cho người khác vào danh mục hệ thống "Ứng cho nhóm". Xem SplitInput.
   */
  addSplitTransaction: (input: SplitInput) => Promise<void>
  updateTransaction: (id: string, patch: TransactionPatch) => Promise<void>
  removeTransaction: (id: string) => Promise<void>
  setActiveMonth: (month: string) => void
  setHasHydrated: (value: boolean) => void

  updateCategory: (
    id: CategoryId,
    patch: Partial<Omit<Category, 'id'>>,
  ) => Promise<void>
  /** Chỉ xoá được danh mục không còn giao dịch nào. */
  removeCategory: (id: CategoryId) => Promise<RemoveCategoryResult>

  setBudget: (categoryId: CategoryId, limit: number, month?: string) => Promise<void>
  clearBudget: (categoryId: CategoryId, month?: string) => Promise<void>

  setBalanceMark: (asOf: string, amountVnd: number) => Promise<void>
  removeBalanceMark: (asOf: string) => Promise<void>
}

/**
 * Tháng của một giao dịch, theo **giờ địa phương**.
 * Không cắt chuỗi ISO: ISO là giờ UTC, nên ở UTC+7 mọi khoản ghi trước 07:00
 * sáng sẽ bị đẩy sang tháng trước — sai cả tổng tháng lẫn ngân sách.
 *
 * Đây là định nghĩa "tháng" DUY NHẤT của app. Postgres chỉ lưu occurred_at
 * dạng timestamptz và không bao giờ tự gom tháng — thêm date_trunc hay cột
 * tháng sinh tự động ở server sẽ tạo định nghĩa thứ hai, lệch âm thầm.
 */
const monthKey = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Khoản này có phải TIỀN ỨNG cho người khác không (cả lúc ứng ra lẫn lúc đòi về).
 *
 * ⚠️ Mọi phép tính CHI TIÊU phải loại nó ra: tiền ứng rời ví thật nhưng không
 * phải mình tiêu, nên tính vào "đã tiêu" sẽ thổi phồng báo cáo và đốt oan hạn
 * mức. Ngược lại, mọi phép tính SỐ DƯ phải GIỮ nó lại — tiền đã thật sự ra
 * khỏi ví, bỏ qua thì số dư suy ra không còn khớp đời thực.
 *
 * Ranh giới đó là lý do hàm này tồn tại thay vì lọc rải rác: xem
 * computeMonthlySummary (loại), computeCurrentBalance (giữ).
 */
export const laUngNhom = (t: Transaction) => t.categoryId === UNG_NHOM_ID

/** Mã lỗi Postgres đi kèm trong lỗi của supabase-js. */
const errorCode = (error: unknown): string | undefined =>
  typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : undefined

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      // Bắt đầu RỖNG: server mới là nguồn sự thật. Dữ liệu thật đến từ
      // loadFromServer, còn cache localStorage chỉ để lần sơn đầu đỡ trắng màn.
      transactions: [],
      categories: [],
      budgets: {},
      balanceMarks: [],
      activeMonth: SEED_ACTIVE_MONTH,
      hasHydrated: false,
      syncStatus: 'idle',
      userId: null,

      loadFromServer: async (userId) => {
        set({ syncStatus: 'loading', userId })
        try {
          const snapshot = await fetchSnapshot(createClient())
          set({
            transactions: snapshot.transactions,
            categories: snapshot.categories,
            budgets: snapshot.budgets,
            balanceMarks: snapshot.balanceMarks,
            syncStatus: 'ready',
            hasHydrated: true,
          })
        } catch {
          // Mất mạng: giữ nguyên cache đã đọc từ localStorage để vẫn xem được
          // số cũ, chỉ báo trạng thái lỗi.
          //
          // hasHydrated PHẢI bật cả ở đây chứ không riêng nhánh thành công: nó là
          // cờ "đã thử nạp xong một lượt, có gì vẽ nấy". Để nguyên false thì 10
          // component kẹt skeleton VĨNH VIỄN và lời hứa "vẫn xem được số cũ" ở
          // ngay trên không bao giờ thành sự thật. Việc nói cho người dùng biết
          // số đang xem là số cũ thuộc về SyncBanner, không phải cờ này.
          set({ syncStatus: 'error', hasHydrated: true })
        }
      },

      /**
       * Xoá sạch khi đăng xuất. Bắt buộc, không phải dọn dẹp cho gọn: máy này
       * có thể được người khác đăng nhập ngay sau đó, và cache localStorage sẽ
       * hiện thoáng số của tài khoản cũ trước khi fetch mới kịp về.
       */
      signOutAndClear: () => {
        set({
          transactions: [],
          categories: [],
          budgets: {},
          balanceMarks: [],
          activeMonth: SEED_ACTIVE_MONTH,
          hasHydrated: false,
          syncStatus: 'idle',
          userId: null,
        })
        try {
          localStorage.removeItem('vi-rieng/expenses')
        } catch {
          // Chế độ riêng tư chặn localStorage — state trong bộ nhớ đã sạch rồi.
        }
      },

      addTransaction: async (input) => {
        const userId = get().userId
        if (!userId) throw new Error('Chưa đăng nhập')

        const tx = await insertTransaction(createClient(), userId, input)
        set((s) => ({ transactions: [tx, ...s.transactions] }))
        return tx.id
      },

      /**
       * Ứng tiền cho nhóm = HAI giao dịch, không phải một khoản chi lớn:
       *   1. phần mình tiêu  -> danh mục đã chọn, tính là chi tiêu
       *   2. phần ứng ra     -> danh mục hệ thống, KHÔNG tính là chi tiêu
       *
       * Tổng hai khoản đúng bằng hoá đơn, nên số dư vẫn giảm đủ và khớp ví
       * thật; chỉ riêng con số "đã tiêu" là loại phần ứng ra.
       *
       * ⚠️ Nếu khoản thứ hai ghi hỏng, khoản thứ nhất PHẢI bị gỡ. Postgres
       * không có transaction xuyên hai lần gọi REST, nên phải tự dọn ở đây —
       * để lại một nửa nghĩa là người dùng thấy 100k tiền lẩu và không thấy
       * 400k đã ứng, tức là mất tiền trong sổ mà không có dấu vết gì.
       */
      addSplitTransaction: async ({
        amountVnd,
        soNguoi,
        categoryId,
        note,
        occurredAt,
      }) => {
        const userId = get().userId
        if (!userId) throw new Error('Chưa đăng nhập')
        if (soNguoi < 2) throw new Error('Chia tiền cần ít nhất 2 người')

        const { cuaMinh, ungRa } = chiaHoaDon(amountVnd, soNguoi)
        const supabase = createClient()

        // Danh mục hệ thống phải tồn tại TRƯỚC khi ghi: transactions có khoá
        // ngoại trỏ tới categories, thiếu nó thì khoản thứ hai văng 23503.
        await insertCategoryIfMissing(supabase, userId, UNG_NHOM_CATEGORY)
        if (!get().categories.some((c) => c.id === UNG_NHOM_ID)) {
          set((s) => ({ categories: [...s.categories, UNG_NHOM_CATEGORY] }))
        }

        const phanMinh = await insertTransaction(supabase, userId, {
          type: 'expense',
          amountVnd: cuaMinh,
          categoryId,
          note,
          occurredAt,
        })

        let phanUng: Transaction
        try {
          phanUng = await insertTransaction(supabase, userId, {
            type: 'expense',
            amountVnd: ungRa,
            categoryId: UNG_NHOM_ID,
            // Ghi luôn số người vào ghi chú: nhìn lại sau một tháng, "ứng
            // 400k" không nói được đã ứng cho mấy người, mà đó là thứ cần để
            // đối chiếu khi đòi.
            note: note ? `${note} · ứng ${soNguoi - 1} người` : `Ứng ${soNguoi - 1} người`,
            occurredAt,
          })
        } catch (error) {
          // Dọn khoản đã ghi để sổ không bị lệch một nửa. Dọn hỏng nữa thì
          // đành chịu — vẫn ném lỗi gốc để người dùng biết mà kiểm tra lại.
          try {
            await deleteTransaction(supabase, phanMinh.id)
          } catch {
            // Không nuốt im: khoản mồ côi sẽ hiện ở danh sách giao dịch, và
            // người dùng vừa thấy báo lỗi nên biết phải xem lại.
          }
          throw error
        }

        set((s) => ({ transactions: [phanUng, phanMinh, ...s.transactions] }))
      },

      updateTransaction: async (id, patch) => {
        const updated = await updateTransactionRow(createClient(), id, patch)
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === id ? updated : t)),
        }))
      },

      removeTransaction: async (id) => {
        await deleteTransaction(createClient(), id)
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }))
      },

      setActiveMonth: (activeMonth) => set({ activeMonth }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      updateCategory: async (id, patch) => {
        await updateCategoryRow(createClient(), id, patch)
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        }))
      },

      removeCategory: async (id) => {
        // Chặn sớm phía client để không phải đợi server nói điều đã biết.
        // Chốt chặn thật là khoá ngoại ON DELETE RESTRICT ở Postgres: mảng
        // trong máy có thể cũ (máy khác vừa thêm giao dịch).
        if (get().transactions.some((t) => t.categoryId === id)) {
          return { ok: false, reason: 'in-use' }
        }

        try {
          await deleteCategory(createClient(), id)
        } catch (error) {
          return {
            ok: false,
            reason: errorCode(error) === FK_VIOLATION ? 'in-use' : 'network',
          }
        }

        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          // Hạn mức của danh mục này biến mất ở MỌI tháng. Postgres đã lo bằng
          // ON DELETE CASCADE; đây là dọn lại bản cache cho khớp.
          budgets: Object.fromEntries(
            Object.entries(s.budgets).map(([month, limits]) => [
              month,
              Object.fromEntries(
                Object.entries(limits).filter(([key]) => key !== id),
              ),
            ]),
          ),
        }))
        return { ok: true }
      },

      setBudget: async (categoryId, limit, month) => {
        const { userId, activeMonth } = get()
        if (!userId) throw new Error('Chưa đăng nhập')
        // Chốt tháng TRƯỚC khi await: đổi tháng giữa chừng mà đọc sau thì hạn
        // mức sẽ ghi vào nhầm tháng.
        const key = month ?? activeMonth

        await upsertBudget(createClient(), userId, key, categoryId, limit)
        set((s) => ({
          budgets: {
            ...s.budgets,
            [key]: { ...(s.budgets[key] ?? {}), [categoryId]: limit },
          },
        }))
      },

      clearBudget: async (categoryId, month) => {
        const key = month ?? get().activeMonth

        await deleteBudget(createClient(), key, categoryId)
        set((s) => {
          const rest = Object.fromEntries(
            Object.entries(s.budgets[key] ?? {}).filter(([id]) => id !== categoryId),
          )
          return { budgets: { ...s.budgets, [key]: rest } }
        })
      },

      /**
       * Đặt/sửa một mốc số dư. Upsert theo (user_id, as_of) nên đặt lại mốc
       * cùng thời điểm là SỬA, không sinh mốc thứ hai.
       */
      setBalanceMark: async (asOf, amountVnd) => {
        const userId = get().userId
        if (!userId) throw new Error('Chưa đăng nhập')

        await upsertBalanceMark(createClient(), userId, asOf, amountVnd)
        set((s) => ({
          // Giữ MỚI NHẤT TRƯỚC, khớp thứ tự fetchSnapshot trả về.
          balanceMarks: [
            ...s.balanceMarks.filter((m) => m.asOf !== asOf),
            { asOf, amountVnd },
          ].sort((a, b) => Date.parse(b.asOf) - Date.parse(a.asOf)),
        }))
      },

      removeBalanceMark: async (asOf) => {
        await deleteBalanceMark(createClient(), asOf)
        set((s) => ({ balanceMarks: s.balanceMarks.filter((m) => m.asOf !== asOf) }))
      },
    }),
    {
      name: 'vi-rieng/expenses',
      // v3: dữ liệu chuyển lên Supabase. Bản lưu cũ là dữ liệu mẫu localStorage
      // hoặc dữ liệu thật chưa đẩy lên — bỏ đi ở đây thì mất, nên KHÔNG xoá:
      // giữ nguyên để luồng di trú (components/store-bootstrap.tsx) đọc và hỏi
      // người dùng có muốn đẩy lên tài khoản không.
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        transactions: s.transactions,
        categories: s.categories,
        budgets: s.budgets,
        balanceMarks: s.balanceMarks,
        // activeMonth là view state phía client, phải nằm lại đây để chọn tháng
        // xong tải lại trang vẫn giữ nguyên.
        activeMonth: s.activeMonth,
      }),
      // Hydrate từ một effect phía client (xem StoreBootstrap). Nếu không,
      // persist đọc localStorage ngay khi module nạp, nên lần render client
      // đầu tiên đã khác server render -> React báo hydration mismatch.
      skipHydration: true,
      // Bản v2 trở về trước có cùng hình dạng; giữ nguyên để luồng di trú xử lý.
      migrate: (persisted) => persisted as Partial<ExpenseState>,
    },
  ),
)

/* ------------------------------------------------------------------ *
 * Selectors — state DẪN XUẤT, không bao giờ lưu vào store.
 *
 * Mỗi hook lấy lát dữ liệu thô (tham chiếu ổn định) rồi tính trong
 * useMemo. Không truyền hàm tính trực tiếp vào useExpenseStore(...):
 * Zustand v5 đọc qua useSyncExternalStore, mà hàm trả về object/mảng mới
 * mỗi lần gọi sẽ tạo snapshot mới mỗi render -> vòng lặp render vô hạn.
 * ------------------------------------------------------------------ */

export interface MonthlySummary {
  income: number
  expense: number
  net: number
  savingRate: number
}

export function computeMonthlySummary(
  transactions: Transaction[],
  month: string,
): MonthlySummary {
  // Tiền ứng cho nhóm bị loại khỏi CẢ thu lẫn chi: ứng ra không phải mình
  // tiêu, và đòi về không phải mình kiếm được. Để lọt vào thu nhập thì
  // savingRate sẽ nhảy vô nghĩa mỗi lần đòi được nợ.
  const rows = transactions.filter(
    (t) => monthKey(t.occurredAt) === month && !laUngNhom(t),
  )
  const income = rows
    .filter((t) => t.type === 'income')
    .reduce((a, t) => a + t.amountVnd, 0)
  const expense = rows
    .filter((t) => t.type === 'expense')
    .reduce((a, t) => a + t.amountVnd, 0)
  // Tháng chưa có thu nhập -> savingRate 0, không chia cho 0.
  return {
    income,
    expense,
    net: income - expense,
    savingRate: income ? (income - expense) / income : 0,
  }
}

export function useMonthlySummary(month?: string): MonthlySummary {
  const transactions = useExpenseStore((s) => s.transactions)
  const activeMonth = useExpenseStore((s) => s.activeMonth)
  const key = month ?? activeMonth
  return useMemo(
    () => computeMonthlySummary(transactions, key),
    [transactions, key],
  )
}

/* ---------------- Số dư suy ra từ mốc ---------------- */

export interface BalanceAt {
  /** Số dư suy ra tại thời điểm được hỏi. ÂM ĐƯỢC. */
  amount: number
  /** Mốc dùng làm gốc — để màn hình nói rõ "tính từ ngày nào". */
  mark: BalanceMark
}

/**
 * Số dư tại một thời điểm = mốc gần nhất KHÔNG SAU thời điểm đó, cộng dòng
 * tiền phát sinh giữa hai mốc thời gian.
 *
 * ⚠️ Chưa có mốc nào thì trả `null`, KHÔNG phải 0. Đây là toàn bộ lý do tính
 * năng này tồn tại: `Σthu − Σchi` đếm từ một số 0 giả, và sai số của nó tích
 * luỹ vĩnh viễn qua từng khoản quên ghi. Trả 0 sẽ bị màn hình vẽ ra thành một
 * số dư trông như thật — đúng thứ nguyên tắc 2 của PRODUCT.md cấm.
 *
 * ⚠️ So sánh bằng Date.parse chứ không localeCompare trên chuỗi: ở đây trộn
 * mốc thời gian từ hai bảng khác nhau, và so chuỗi chỉ đúng khi cả hai cùng
 * một định dạng ISO. Mapper đã chuẩn hoá về 'Z', nhưng không nên phụ thuộc vào
 * điều đó ở một phép so sánh mang tính số học.
 *
 * Giao dịch xảy ra ĐÚNG tại mốc bị loại (so sánh nghiêm ngặt): mốc là lời
 * khẳng định "lúc đó tôi có đúng bấy nhiêu", nó đã bao hàm mọi thứ tại và
 * trước nó. Cộng lại là tính hai lần.
 */
export function computeCurrentBalance(
  transactions: Transaction[],
  marks: BalanceMark[],
  at: string,
): BalanceAt | null {
  const atMs = Date.parse(at)

  let base: BalanceMark | undefined
  let baseMs = -Infinity
  for (const m of marks) {
    const ms = Date.parse(m.asOf)
    if (ms <= atMs && ms > baseMs) {
      base = m
      baseMs = ms
    }
  }
  if (!base) return null

  let amount = base.amountVnd
  for (const t of transactions) {
    const ms = Date.parse(t.occurredAt)
    if (ms > baseMs && ms <= atMs) {
      amount += t.type === 'income' ? t.amountVnd : -t.amountVnd
    }
  }

  return { amount, mark: base }
}

/**
 * Chênh lệch khi đối soát: số người dùng nhập trừ đi số sổ sách suy ra.
 *
 * Âm = đã tiêu mà quên ghi. Dương = đã thu mà quên ghi.
 *
 * Trả `null` khi đây là mốc ĐẦU TIÊN — không có lịch sử nào để so, và bịa ra
 * một con số chênh lệch lúc đó là vô nghĩa.
 *
 * ⚠️ Chỉ tính trên các mốc NẰM TRƯỚC `asOf`. Đặt lại mốc cùng thời điểm là
 * sửa nó, nên phải so với những gì sổ suy ra từ lịch sử trước đó — so với
 * chính con số đang bị thay thì luôn ra đúng bằng hiệu hai lần nhập, vô dụng.
 */
export function computeDrift(
  transactions: Transaction[],
  marks: BalanceMark[],
  asOf: string,
  amountVnd: number,
): number | null {
  const asOfMs = Date.parse(asOf)
  const prior = marks.filter((m) => Date.parse(m.asOf) < asOfMs)
  const computed = computeCurrentBalance(transactions, prior, asOf)
  if (!computed) return null
  return amountVnd - computed.amount
}

export interface SoDu {
  /** null = chưa có mốc nào; màn hình phải mời đặt mốc thay vì hiện số. */
  balance: BalanceAt | null
  /** Thời điểm con số này nói tới, ISO. */
  at: string
  /** Tháng đang xem có phải tháng hiện tại không — đổi nhãn hiển thị. */
  laThangNay: boolean
}

/**
 * Mốc thời gian của số dư bám theo `activeMonth`, chặn trên bằng "bây giờ".
 *
 * activeMonth là nguồn sự thật cho mọi màn, nên xem tháng 8 phải thấy số dư
 * CUỐI THÁNG 8, không phải số dư hôm nay — nếu không, con số sẽ mâu thuẫn với
 * mọi con số khác trên cùng màn hình. Chặn trên vì số dư của tương lai là vô
 * nghĩa: tháng này chưa hết thì "cuối tháng" chưa xảy ra.
 */
export function useSoDu(month?: string): SoDu {
  const transactions = useExpenseStore((s) => s.transactions)
  const balanceMarks = useExpenseStore((s) => s.balanceMarks)
  const activeMonth = useExpenseStore((s) => s.activeMonth)
  const key = month ?? activeMonth

  return useMemo(() => {
    const [year, m] = key.split('-').map(Number)
    // Ngày 0 của tháng kế = ngày cuối tháng này, theo GIỜ ĐỊA PHƯƠNG — cùng
    // quy ước gom tháng với monthKey(). Cắt chuỗi ISO ở đây sẽ lệch ở UTC+7.
    const cuoiThang = new Date(year, m, 0, 23, 59, 59, 999)
    const now = new Date()
    const at = cuoiThang < now ? cuoiThang : now

    return {
      balance: computeCurrentBalance(transactions, balanceMarks, at.toISOString()),
      at: at.toISOString(),
      laThangNay: now.getFullYear() === year && now.getMonth() + 1 === m,
    }
  }, [transactions, balanceMarks, key])
}

export interface CategorySlice {
  categoryId: CategoryId
  amount: number
  /** 0..1 */
  share: number
}

export function computeExpenseByCategory(
  transactions: Transaction[],
  month: string,
): CategorySlice[] {
  // Loại tiền ứng: biểu đồ này trả lời "tiêu vào đâu", mà tiền ứng thì chưa
  // tiêu vào đâu cả — nó đang nằm ở túi người khác.
  const rows = transactions.filter(
    (t) => monthKey(t.occurredAt) === month && t.type === 'expense' && !laUngNhom(t),
  )
  const total = rows.reduce((a, t) => a + t.amountVnd, 0)
  const map = new Map<CategoryId, number>()
  for (const t of rows) {
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amountVnd)
  }
  return [...map.entries()]
    .map(([categoryId, amount]) => ({
      categoryId,
      amount,
      share: total ? amount / total : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

/** Chi theo danh mục, đã sắp giảm dần + kèm %. */
export function useExpenseByCategory(month?: string): CategorySlice[] {
  const transactions = useExpenseStore((s) => s.transactions)
  const activeMonth = useExpenseStore((s) => s.activeMonth)
  const key = month ?? activeMonth
  return useMemo(
    () => computeExpenseByCategory(transactions, key),
    [transactions, key],
  )
}

/* ---------------- Tiền đang cho mượn ---------------- */

export interface DangChoMuon {
  /** Ứng ra trừ đã đòi về, MỌI THÁNG. 0 = đã đòi xong hết. */
  conLai: number
  /** Tổng đã ứng ra từ trước tới giờ — để câu chữ nói rõ gốc con số. */
  daUng: number
  /** Tổng đã đòi về được. */
  daDoi: number
}

/**
 * Tiền mình ứng ra mà nhóm chưa trả — CỘNG DỒN MỌI THÁNG, cố ý không lọc theo
 * `activeMonth`.
 *
 * Đây là ngoại lệ duy nhất với quy tắc "mọi số liệu gom theo tháng" của
 * PRODUCT.md, và nó buộc phải thế: một khoản ứng tháng 8 chưa đòi vẫn là tiền
 * đang thiếu trong tháng 9. Lọc theo tháng sẽ làm nó biến mất khỏi màn hình
 * đúng lúc người dùng cần nhớ nhất — mà quên chính là thứ app này chống.
 *
 * `conLai` âm được: đòi về nhiều hơn đã ứng (ai đó trả dư, hoặc mình quên ghi
 * lúc ứng). Không kẹp về 0 — một số âm ở đây là tín hiệu sổ đang lệch, giấu đi
 * thì người dùng không bao giờ biết để sửa.
 */
export function computeDangChoMuon(transactions: Transaction[]): DangChoMuon {
  let daUng = 0
  let daDoi = 0
  for (const t of transactions) {
    if (!laUngNhom(t)) continue
    if (t.type === 'expense') daUng += t.amountVnd
    else daDoi += t.amountVnd
  }
  return { conLai: daUng - daDoi, daUng, daDoi }
}

export function useDangChoMuon(): DangChoMuon {
  const transactions = useExpenseStore((s) => s.transactions)
  return useMemo(() => computeDangChoMuon(transactions), [transactions])
}

/**
 * `month` bỏ trống thì lấy mọi tháng. Thẻ "Giao dịch gần đây" trên Tổng quan
 * luôn truyền tháng đang xem — nếu không, đổi sang tháng 8 sẽ ra cảnh tổng
 * tháng 8 nhưng danh sách vẫn là giao dịch tháng 9.
 */
export function computeRecentTransactions(
  transactions: Transaction[],
  limit: number,
  month?: string,
): Transaction[] {
  return transactions
    .filter((t) => !month || monthKey(t.occurredAt) === month)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, limit)
}

export function useRecentTransactions(limit = 6, month?: string): Transaction[] {
  const transactions = useExpenseStore((s) => s.transactions)
  const activeMonth = useExpenseStore((s) => s.activeMonth)
  const key = month ?? activeMonth
  return useMemo(
    () => computeRecentTransactions(transactions, limit, key),
    [transactions, limit, key],
  )
}

export interface CashflowPoint {
  month: string
  label: string
  income: number
  expense: number
}

export function computeCashflowSeries(
  transactions: Transaction[],
  months: number,
  from: string,
): CashflowPoint[] {
  const [y, m] = from.split('-').map(Number)
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(y, m - 1 - (months - 1 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    // Cùng quy ước với computeMonthlySummary: tiền ứng không phải thu, cũng
    // không phải chi. Không lọc ở đây thì cột tháng đi ăn nhóm sẽ vọt lên.
    const rows = transactions.filter(
      (t) => monthKey(t.occurredAt) === key && !laUngNhom(t),
    )
    return {
      month: key,
      label: `T${d.getMonth() + 1}`,
      income: rows
        .filter((t) => t.type === 'income')
        .reduce((a, t) => a + t.amountVnd, 0),
      expense: rows
        .filter((t) => t.type === 'expense')
        .reduce((a, t) => a + t.amountVnd, 0),
    }
  })
}

/* ---------------- Danh mục lúc chạy ---------------- */

/** Danh mục hiện hành (đã tính các sửa đổi của người dùng). */
export const useCategories = () => useExpenseStore((s) => s.categories)

/** Tra một danh mục theo id, dùng danh sách trong store. */
export function useCategoryLookup() {
  const categories = useCategories()
  return useMemo(
    () => (id: CategoryId) => categoryOf(id, categories),
    [categories],
  )
}

export function useTransaction(id: string | null): Transaction | undefined {
  const transactions = useExpenseStore((s) => s.transactions)
  return useMemo(
    () => (id ? transactions.find((t) => t.id === id) : undefined),
    [transactions, id],
  )
}

/* ---------------- Ngân sách (màn 2b) ---------------- */

export interface BudgetStatus {
  used: number
  limit: number
  /** 0..1 — đã kẹp ở 1 để thanh không vẽ quá 100%. */
  share: number
  over: boolean
  /** Phần vượt, 0 nếu chưa vượt. */
  overBy: number
}

export function computeBudgetStatus(used: number, limit: number): BudgetStatus {
  const over = limit > 0 && used > limit
  return {
    used,
    limit,
    share: limit > 0 ? Math.min(1, used / limit) : 0,
    over,
    overBy: over ? used - limit : 0,
  }
}

/**
 * Con số dẫn đầu của cả ứng dụng: "còn tiêu được tháng này".
 *
 * Đây là câu hỏi người dùng muốn trả lời trong 2 giây đầu, và nó thay thế
 * "Tổng số dư" của bản cũ — vốn là một con số gây hiểu lầm vì không có số dư
 * đầu kỳ.
 *
 * Số dư THẬT giờ đã có (computeCurrentBalance, suy từ mốc người dùng đặt),
 * nhưng nó vẫn ở màn Báo cáo chứ không lên đây: số dư không phải câu hỏi cần
 * trả lời lúc đang đứng ở quán, và hai con số tiền cạnh nhau mời đọc nhầm.
 *
 * ⚠️ Khi CHƯA đặt hạn mức nào, `coHanMuc` = false và `conLai` vô nghĩa: màn
 * chính phải hiện "đã tiêu tháng này" thay vì một con số còn lại bịa ra.
 * Đây là lý do hook trả về cờ chứ không trả về 0 — 0 sẽ hiện thành "còn 0đ",
 * đúng kiểu con số sai mà PRODUCT.md § Product Principles cấm.
 */
export interface ConTieuDuoc {
  coHanMuc: boolean
  daTieu: number
  hanMuc: number
  conLai: number
  /** 0..1, đã kẹp — cho thanh tiến độ. */
  share: number
  over: boolean
  soNgayConLai: number
  /** Chia đều phần còn lại cho số ngày còn lại; 0 khi đã vượt. */
  moiNgay: number
}

export function useConTieuDuoc(month?: string): ConTieuDuoc {
  const transactions = useExpenseStore((s) => s.transactions)
  const budgets = useExpenseStore((s) => s.budgets)
  const activeMonth = useExpenseStore((s) => s.activeMonth)
  const key = month ?? activeMonth

  return useMemo(() => {
    const daTieu = computeMonthlySummary(transactions, key).expense
    const hanMuc = Object.values(budgets[key] ?? {}).reduce((a, n) => a + n, 0)
    const status = computeBudgetStatus(daTieu, hanMuc)
    const conLai = Math.max(0, hanMuc - daTieu)
    const soNgayConLai = daysLeftInMonth(key)

    return {
      coHanMuc: hanMuc > 0,
      daTieu,
      hanMuc,
      conLai,
      share: status.share,
      over: status.over,
      soNgayConLai,
      moiNgay: conLai > 0 ? Math.round(conLai / soNgayConLai) : 0,
    }
  }, [transactions, budgets, key])
}

/** Tình trạng ngân sách cả tháng — thẻ "Cả tháng" ở cột phải màn 2b. */
export function useBudgetStatus(month?: string): BudgetStatus {
  const transactions = useExpenseStore((s) => s.transactions)
  const budgets = useExpenseStore((s) => s.budgets)
  const activeMonth = useExpenseStore((s) => s.activeMonth)
  const key = month ?? activeMonth

  return useMemo(() => {
    const used = computeMonthlySummary(transactions, key).expense
    const limit = Object.values(budgets[key] ?? {}).reduce((a, n) => a + n, 0)
    return computeBudgetStatus(used, limit)
  }, [transactions, budgets, key])
}

export interface CategoryBudgetRow extends BudgetStatus {
  categoryId: CategoryId
  /** Danh mục chưa đặt hạn mức — vẫn tính vào tổng chi, chỉ không có thanh. */
  unset: boolean
}

export function computeBudgetRows(
  transactions: Transaction[],
  budgets: Budgets,
  month: string,
): CategoryBudgetRow[] {
  const spent = new Map<CategoryId, number>()
  for (const t of transactions) {
    // Tiền ứng không đốt hạn mức — đây là lý do chính tính năng chia tiền tồn
    // tại. Ứng 400k tiền lẩu mà ăn mất 400k hạn mức Ăn uống là vô lý.
    if (t.type !== 'expense' || monthKey(t.occurredAt) !== month || laUngNhom(t)) {
      continue
    }
    spent.set(t.categoryId, (spent.get(t.categoryId) ?? 0) + t.amountVnd)
  }

  const limits = budgets[month] ?? {}
  const ids = new Set<CategoryId>([...spent.keys(), ...Object.keys(limits)])

  return [...ids]
    .map((categoryId) => {
      const limit = limits[categoryId] ?? 0
      return {
        categoryId,
        unset: !(categoryId in limits),
        ...computeBudgetStatus(spent.get(categoryId) ?? 0, limit),
      }
    })
    .sort((a, b) => {
      // Có hạn mức lên trước, rồi theo số đã chi giảm dần.
      if (a.unset !== b.unset) return a.unset ? 1 : -1
      return b.used - a.used
    })
}

export function useBudgetRows(month?: string): CategoryBudgetRow[] {
  const transactions = useExpenseStore((s) => s.transactions)
  const budgets = useExpenseStore((s) => s.budgets)
  const activeMonth = useExpenseStore((s) => s.activeMonth)
  const key = month ?? activeMonth
  return useMemo(
    () => computeBudgetRows(transactions, budgets, key),
    [transactions, budgets, key],
  )
}

/* ---------------- Danh mục (màn 2c) ---------------- */

export interface CategoryUsage {
  categoryId: CategoryId
  /** Tổng số giao dịch mọi tháng — quyết định có xoá được không. */
  count: number
  /** Chi trong tháng đang xem. */
  monthSpend: number
}

export function computeCategoryUsage(
  transactions: Transaction[],
  month: string,
): Map<CategoryId, CategoryUsage> {
  const map = new Map<CategoryId, CategoryUsage>()
  const get = (id: CategoryId) => {
    let row = map.get(id)
    if (!row) {
      row = { categoryId: id, count: 0, monthSpend: 0 }
      map.set(id, row)
    }
    return row
  }

  for (const t of transactions) {
    const row = get(t.categoryId)
    row.count += 1
    if (t.type === 'expense' && monthKey(t.occurredAt) === month) {
      row.monthSpend += t.amountVnd
    }
  }
  return map
}

export function useCategoryUsage(month?: string) {
  const transactions = useExpenseStore((s) => s.transactions)
  const activeMonth = useExpenseStore((s) => s.activeMonth)
  const key = month ?? activeMonth
  return useMemo(() => computeCategoryUsage(transactions, key), [transactions, key])
}

/* ---------------- Lọc giao dịch (màn 2a) ---------------- */

export interface TransactionFilter {
  type?: TxType | 'all'
  categoryIds?: CategoryId[]
  month?: string
  sort?: 'newest' | 'oldest' | 'amount'
}

export function filterTransactions(
  transactions: Transaction[],
  filter: TransactionFilter,
): Transaction[] {
  const { type = 'all', categoryIds = [], month, sort = 'newest' } = filter

  const rows = transactions.filter((t) => {
    if (month && monthKey(t.occurredAt) !== month) return false
    if (type !== 'all' && t.type !== type) return false
    if (categoryIds.length && !categoryIds.includes(t.categoryId)) return false
    return true
  })

  return rows.sort((a, b) => {
    if (sort === 'amount') return b.amountVnd - a.amountVnd
    const cmp = b.occurredAt.localeCompare(a.occurredAt)
    return sort === 'oldest' ? -cmp : cmp
  })
}

export function useFilteredTransactions(filter: TransactionFilter): Transaction[] {
  const transactions = useExpenseStore((s) => s.transactions)
  const { type, month, sort } = filter
  const categoryKey = (filter.categoryIds ?? []).join(',')

  return useMemo(
    () =>
      filterTransactions(transactions, {
        type,
        month,
        sort,
        categoryIds: categoryKey ? categoryKey.split(',') : [],
      }),
    [transactions, type, month, sort, categoryKey],
  )
}

/* ---------------- Báo cáo (màn 2d) ---------------- */

export interface MonthComparison {
  current: MonthlySummary
  previous: MonthlySummary
  /** Chênh lệch chi tiêu: âm = chi ít hơn tháng trước. */
  expenseDelta: number
  /** Tỉ lệ thay đổi chi tiêu, null khi tháng trước chưa chi gì. */
  expenseShare: number | null
  rows: Array<{ categoryId: CategoryId; delta: number; share: number | null }>
}

export function computeMonthComparison(
  transactions: Transaction[],
  month: string,
): MonthComparison {
  const [y, m] = month.split('-').map(Number)
  const prevDate = new Date(y, m - 2, 1)
  const prev = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

  const current = computeMonthlySummary(transactions, month)
  const previous = computeMonthlySummary(transactions, prev)

  const spendIn = (key: string) => {
    const map = new Map<CategoryId, number>()
    for (const t of transactions) {
      if (t.type !== 'expense' || monthKey(t.occurredAt) !== key || laUngNhom(t)) {
        continue
      }
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amountVnd)
    }
    return map
  }

  const now = spendIn(month)
  const before = spendIn(prev)
  const ids = new Set<CategoryId>([...now.keys(), ...before.keys()])

  const rows = [...ids]
    .map((categoryId) => {
      const a = now.get(categoryId) ?? 0
      const b = before.get(categoryId) ?? 0
      return {
        categoryId,
        delta: a - b,
        share: b > 0 ? (a - b) / b : null,
      }
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  return {
    current,
    previous,
    expenseDelta: current.expense - previous.expense,
    expenseShare:
      previous.expense > 0
        ? (current.expense - previous.expense) / previous.expense
        : null,
    rows,
  }
}

export function useMonthComparison(month?: string): MonthComparison {
  const transactions = useExpenseStore((s) => s.transactions)
  const activeMonth = useExpenseStore((s) => s.activeMonth)
  const key = month ?? activeMonth
  return useMemo(() => computeMonthComparison(transactions, key), [transactions, key])
}

/** Thu/chi 6 tháng gần nhất — cho mini bar ở Card 2. */
export function useCashflowSeries(months = 6, from?: string): CashflowPoint[] {
  const transactions = useExpenseStore((s) => s.transactions)
  const activeMonth = useExpenseStore((s) => s.activeMonth)
  const key = from ?? activeMonth
  return useMemo(
    () => computeCashflowSeries(transactions, months, key),
    [transactions, months, key],
  )
}

/* ---------------- Bộ chọn tháng ---------------- */

/**
 * Danh sách tháng chọn được, mới nhất trước. Gồm mọi tháng đã có giao dịch
 * hoặc đã đặt hạn mức, cộng thêm `activeMonth` (tháng đang xem có thể rỗng)
 * và tháng hiện tại — để luôn quay về được "tháng này" dù chưa ghi gì.
 */
export function computeAvailableMonths(
  transactions: Transaction[],
  budgets: Budgets,
  activeMonth: string,
  now = new Date(),
): string[] {
  const months = new Set<string>(transactions.map((t) => monthKey(t.occurredAt)))
  for (const [month, limits] of Object.entries(budgets)) {
    if (Object.keys(limits).length) months.add(month)
  }
  months.add(activeMonth)
  months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  return [...months].sort((a, b) => b.localeCompare(a))
}

export function useAvailableMonths(): string[] {
  const transactions = useExpenseStore((s) => s.transactions)
  const budgets = useExpenseStore((s) => s.budgets)
  const activeMonth = useExpenseStore((s) => s.activeMonth)
  return useMemo(
    () => computeAvailableMonths(transactions, budgets, activeMonth),
    [transactions, budgets, activeMonth],
  )
}

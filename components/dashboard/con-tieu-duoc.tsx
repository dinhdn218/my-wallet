"use client";

import { useReducedMotion } from "framer-motion";
import Link from "next/link";
import { AmountSkeleton } from "@/components/ui/glass-card";
import { formatVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useConTieuDuoc, useExpenseStore } from "@/store/useExpenseStore";

/**
 * Con số dẫn đầu — cột số sơn stencil của tấm bảng.
 *
 * Thay cho "Tổng số dư" của bản cũ, vốn gây hiểu lầm vì không có số dư đầu kỳ.
 * Đây là câu người dùng muốn trả lời trong 2 giây: còn tiêu được bao nhiêu.
 *
 * ⚠️ Chưa đặt hạn mức thì KHÔNG bịa ra con số "còn lại" — chuyển sang hiện
 * "đã tiêu tháng này" kèm lối đặt hạn mức. Xem useConTieuDuoc.
 */
export function ConTieuDuoc({
  compact,
  pending,
  className,
}: {
  /** Bản gọn cho mobile: số nhỏ hơn một nấc, bỏ dòng phụ thứ hai — để bàn
      phím số lên được trên mép màn hình. */
  compact?: boolean;
  /**
   * Số tiền đang gõ dở ở bàn phím. Con số lớn tụt xuống theo từng phím để
   * người dùng thấy ngay khoản này ăn vào phần còn lại bao nhiêu — đúng lời
   * hứa ở khối STORY của direction contract.
   */
  pending?: number;
  className?: string;
}) {
  const hasHydrated = useExpenseStore((s) => s.hasHydrated);
  const activeMonth = useExpenseStore((s) => s.activeMonth);
  const reduceMotion = useReducedMotion();
  const t = useConTieuDuoc();
  const thang = Number(activeMonth.split("-")[1]);

  const nhan = !t.coHanMuc
    ? `Đã tiêu tháng ${thang}`
    : t.over
      ? `Vượt hạn mức tháng ${thang}`
      : `Còn tiêu được tháng ${thang}`;

  // Khoản đang gõ làm con số tụt ngay, trước cả khi bấm Ghi.
  const truoc = !t.coHanMuc
    ? t.daTieu
    : t.over
      ? t.hanMuc - t.daTieu
      : t.conLai;
  const soChinh = !t.coHanMuc ? truoc + (pending ?? 0) : truoc - (pending ?? 0);
  const dangTru = (pending ?? 0) > 0;

  return (
    <div className={cn("flex flex-col", className)}>
      <p className="font-mono text-[11px] font-medium tracking-[.2em] text-muted uppercase">
        {nhan}
      </p>

      {hasHydrated ? (
        <p
          data-testid="con-tieu-duoc"
          className={cn(
            "mt-2 flex items-baseline gap-1.5 leading-[.86] font-semibold tracking-[-.035em] tabular-nums",
            // vh trong clamp: màn thấp thì số nhỏ lại để bàn phím còn chỗ.
            compact
              ? "text-[clamp(38px,9vw,52px)]"
              : "text-[clamp(40px,7vh,72px)]",
            (t.over || soChinh < 0) && "text-negative",
            // Ease-out mũ, xuất phát từ con số đang hiện — không fade-in từ rỗng.
            !reduceMotion && "transition-[color,opacity] duration-300 ease-out",
            dangTru && "opacity-90",
          )}
        >
          {formatVnd(soChinh, { unit: false })}
          <span className="text-[.38em] font-normal text-muted">đ</span>
        </p>
      ) : (
        <AmountSkeleton
          className={cn(
            "mt-2 w-[80%]",
            compact ? "h-[clamp(38px,9vw,52px)]" : "h-[clamp(40px,7vh,72px)]",
          )}
        />
      )}

      {hasHydrated &&
        (t.coHanMuc ? (
          <>
            <p className="mt-2.5 font-mono text-[11px] leading-relaxed text-muted">
              {!compact && (
                <>
                  Đã tiêu{" "}
                  <b className="font-bold text-foreground">
                    {formatVnd(t.daTieu)}
                  </b>{" "}
                  trên{" "}
                  <b className="font-bold text-foreground">
                    {formatVnd(t.hanMuc)}
                  </b>
                  <br />
                </>
              )}
              Còn{" "}
              <b className="font-bold text-foreground">{t.soNgayConLai} ngày</b>
              {t.over ? (
                <>
                  {" "}
                  · đã vượt{" "}
                  <b className="font-bold text-negative">
                    {formatVnd(t.daTieu - t.hanMuc)}
                  </b>
                </>
              ) : (
                <>
                  {" "}
                  · khoảng{" "}
                  <b className="font-bold text-foreground">
                    {formatVnd(t.moiNgay)}
                  </b>{" "}
                  mỗi ngày
                </>
              )}
            </p>

            {/*
              Vượt hạn mức báo bằng BA tín hiệu chồng nhau — màu, chữ ("Vượt hạn
              mức" ở nhãn trên), và hình (thanh đổi hướng lấp đầy). Người mù màu
              vẫn đọc được.
            */}
            <div className="mt-3 flex h-[9px] w-full bg-men-sau" aria-hidden>
              <div
                className={cn(
                  "h-full transition-[width] duration-500",
                  t.over ? "bg-negative" : "bg-foreground",
                )}
                style={{ width: `${Math.round(t.share * 100)}%` }}
              />
            </div>
          </>
        ) : (
          <p className="my-3 font-mono text-[11px] leading-relaxed text-muted">
            Chưa đặt hạn mức nào cho tháng này.{" "}
            <Link
              href="/ngan-sach"
              className="font-bold text-accent underline underline-offset-4"
            >
              Đặt hạn mức
            </Link>{" "}
            để thấy còn tiêu được bao nhiêu.
          </p>
        ))}
    </div>
  );
}

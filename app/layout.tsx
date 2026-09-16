import type { Metadata, Viewport } from "next";
import { Oswald, Roboto_Mono } from "next/font/google";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

/**
 * Oswald: grotesk hẹp, gốc từ chữ biển hiệu sơn tay — đúng giọng của tấm bảng
 * giá quán, và là một trong số ít face condensed có đủ dấu tiếng Việt.
 */
const sans = Oswald({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-oswald",
});

/** Roboto Mono cho nhãn đo đạc nhỏ — tương phản kích cỡ với cột số. */
const mono = Roboto_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "Ví Của Tôi — Quản lý chi tiêu",
  description: "Thu chi cá nhân, VND.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0F4C3A" },
    { media: "(prefers-color-scheme: light)", color: "#cfe0d2" },
  ],
};

/**
 * Layout gốc chỉ giữ khung trang, font và mặt bảng men — không có điều hướng.
 * Phần vỏ ứng dụng nằm ở app/(app)/layout.tsx để màn đăng nhập (nhóm (auth))
 * không hiện thanh điều hướng của người chưa đăng nhập.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      data-theme="dark"
      className={`${sans.variable} ${mono.variable}`}
      // data-theme được script dưới đây ghi đè trước khi paint.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="men-mat min-h-dvh font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}

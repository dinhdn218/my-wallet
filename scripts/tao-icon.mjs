/**
 * Kết xuất icon app từ app/icon.svg.
 *
 *     node scripts/tao-icon.mjs
 *
 * Vì sao cần script thay vì lưu sẵn mấy file PNG: PNG ở đây là BẢN DẪN XUẤT,
 * không phải bản gốc. Sửa logo mà quên kết xuất lại thì favicon một đằng, icon
 * trên màn hình chính một nẻo — mà không có gì báo, vì hai thứ đó không bao giờ
 * hiện cạnh nhau. Chạy lại script là xong.
 *
 * Mỗi cỡ được RASTER THẲNG ở đúng kích thước đó (đặt `density` theo cỡ) chứ
 * không vẽ một lần rồi thu nhỏ: thu nhỏ làm nhoè mép ô vàng và chân chữ V.
 *
 * `flatten` bỏ kênh alpha: hình vốn đã đục hoàn toàn, mà iOS không xử lý nền
 * trong suốt của apple-icon (nó ghép lên nền đen).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const goc = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Cạnh của viewBox trong app/icon.svg — dùng để tính density cho từng cỡ. */
const VIEWBOX = 32

const CAN_TAO = [
  // iOS đọc đúng file này cho màn hình chính. 180 là cỡ @3x của iPhone.
  { duong: 'app/apple-icon.png', canh: 180 },
  // Hai cỡ manifest yêu cầu cho Android.
  { duong: 'public/brand/logo-vuong-192.png', canh: 192 },
  { duong: 'public/brand/logo-vuong-512.png', canh: 512 },
]

const svg = await readFile(join(goc, 'app/icon.svg'))

for (const { duong, canh } of CAN_TAO) {
  const dich = join(goc, duong)
  await mkdir(dirname(dich), { recursive: true })
  const png = await sharp(svg, { density: (canh / VIEWBOX) * 72 })
    .resize(canh, canh)
    .flatten({ background: '#0f4c3a' })
    .png({ compressionLevel: 9 })
    .toBuffer()
  await writeFile(dich, png)
  console.log(`${duong} — ${canh}×${canh}, ${png.length} byte`)
}

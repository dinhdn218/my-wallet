import { expect, test } from '@playwright/test'
import { resetStore } from './helpers'

/**
 * Dải thẻ giá danh mục ở màn ghi: vừa kéo được, vừa bấm được.
 *
 * Hai mặt này từng đá nhau. Lớp chặn click tự viết trong DaiTheGia bật cờ bằng
 * sự kiện `scroll` của Embla — nổ ở MỌI khung hình có chuyển động, kể cả cú
 * nhích vài pixel vốn là một cú bấm — rồi tắt cờ trong setTimeout, chạy sau khi
 * `click` đã bay qua. Kết quả: thi thoảng bấm thẻ mà danh mục không đổi.
 *
 * `.click()` của Playwright KHÔNG bắt được lỗi này: nó đưa chuột tới tâm rồi
 * down/up, không nhích pixel nào. Nên hai test dưới đây điều khiển chuột tay,
 * mỗi test một bên của ngưỡng kéo 10px mà Embla dùng để phân biệt kéo với bấm.
 */

test.beforeEach(async ({ page }) => {
  await resetStore(page)
  await page.goto('/')
  await expect(page.getByTestId('nut-ghi')).not.toHaveText('Đang kết nối…')
})

/** Bấm giữ giữa thẻ, kéo ngang `dx` px rồi thả. */
async function bamVaNhich(
  page: import('@playwright/test').Page,
  testId: string,
  dx: number,
) {
  const box = (await page.getByTestId(testId).boundingBox())!
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  // steps > 1: phải có mousemove thật thì Embla mới chạy vòng animation, đúng
  // như tay người. Nhảy một phát tới đích thì không dựng lại được lỗi.
  await page.mouse.move(x + dx, y, { steps: 5 })
  await page.mouse.up()
}

test('nhích chuột vài pixel lúc bấm thẻ vẫn chọn được danh mục', async ({ page }) => {
  // 4px — dưới ngưỡng 10px, nên đây là một cú BẤM, không phải cú kéo.
  await bamVaNhich(page, 'the-gia-an-uong', 4)

  await expect(page.getByTestId('the-gia-an-uong')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByTestId('nut-ghi')).toHaveText(/Ăn uống|Gõ số tiền/)
})

test('chọn qua lại giữa hai danh mục liên tiếp đều ăn', async ({ page }) => {
  await bamVaNhich(page, 'the-gia-an-uong', 3)
  await expect(page.getByTestId('the-gia-an-uong')).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await bamVaNhich(page, 'the-gia-di-lai', 3)
  await expect(page.getByTestId('the-gia-di-lai')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByTestId('the-gia-an-uong')).toHaveAttribute(
    'aria-pressed',
    'false',
  )
})

test('kéo dải thẻ không chọn nhầm danh mục ở chỗ thả tay', async ({ page }) => {
  // 80px — quá ngưỡng, Embla phải tự nuốt cú click này.
  await bamVaNhich(page, 'the-gia-an-uong', -80)

  await expect(page.getByTestId('the-gia-an-uong')).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await expect(page.getByTestId('nut-ghi')).toHaveText('Gõ số tiền')
})

import { expect, test } from '@playwright/test'
import { resetStore } from './helpers'

/**
 * Ứng tiền cho cả nhóm: một hoá đơn phải thành HAI giao dịch, và chỉ phần
 * mình tiêu mới được tính là chi tiêu.
 *
 * Đây là luồng dễ hỏng âm thầm nhất trong app — hỏng thì không văng lỗi, chỉ
 * là các con số sai đi một cách hợp lý trông như thật.
 */

test.beforeEach(async ({ page }) => {
  await resetStore(page)
  await page.goto('/')
  // Chờ phiên sẵn sàng: nút Ghi bị vô hiệu tới khi store có userId, nên bấm
  // sớm sẽ không gửi gì cả.
  await expect(page.getByTestId('nut-ghi')).not.toHaveText('Đang kết nối…')
})

/** Gõ một hoá đơn nhóm và ghi. Trả về không có gì; test tự kiểm phần sau. */
async function ghiBuaNhom(
  page: import('@playwright/test').Page,
  { tong, soNguoi }: { tong: string; soNguoi: number },
) {
  await page.getByTestId('the-gia-an-uong').click()
  await page.getByTestId('o-nhap-so').fill(tong)
  await page.getByTestId('mo-chia-tien').click()
  await page.getByTestId(`chia-${soNguoi}`).click()
  await page.getByTestId('nut-ghi').click()
  // Đợi lưu xong hẳn: sau khi ghi, form xoá số và dải chia tiền tự tắt. Điều
  // hướng ngay sau cú bấm sẽ bỏ trang giữa lúc POST chưa xong.
  await expect(page.getByTestId('o-nhap-so')).toHaveValue('')
  await expect(page.getByTestId('mo-chia-tien')).toBeVisible()
}

test('chia 500k cho 5 người tách thành phần mình và phần ứng', async ({ page }) => {
  await page.getByTestId('the-gia-an-uong').click()
  await page.getByTestId('o-nhap-so').fill('500k')
  await page.getByTestId('mo-chia-tien').click()
  await page.getByTestId('chia-5').click()

  // Xem trước phải nói đúng cả hai phần TRƯỚC khi ghi. Dùng aria-live làm
  // mốc: đó là cả câu, còn getByText(/Bạn chịu/) chỉ khớp <span> con.
  const xemTruoc = page.locator('[aria-live="polite"]', { hasText: 'Bạn chịu' })
  await expect(xemTruoc).toContainText('100.000đ')
  await expect(xemTruoc).toContainText('400.000đ')
  await expect(xemTruoc).toContainText('ứng 4 người')

  // Nút ghi hứa đúng phần sẽ vào danh mục Ăn uống, không phải cả hoá đơn.
  await expect(page.getByTestId('nut-ghi')).toContainText('100.000đ')

  await page.getByTestId('nut-ghi').click()
  await expect(page.getByTestId('o-nhap-so')).toHaveValue('')

  // Hai dòng xuất hiện trên bảng giá.
  await page.goto('/giao-dich')
  const table = page.getByTestId('tx-table')
  await expect(table.getByText('100.000đ').first()).toBeVisible()
  await expect(table.getByText('400.000đ').first()).toBeVisible()
})

test('tiền ứng không vào biểu đồ chi tiêu, nhưng có ở sổ cho mượn', async ({
  page,
}) => {
  await ghiBuaNhom(page, { tong: '500k', soNguoi: 5 })

  await page.goto('/bao-cao')

  // Sổ cho mượn hiện đúng phần đang nợ.
  const soMuon = page.getByTestId('dang-cho-muon')
  await expect(soMuon).toBeVisible()
  await expect(soMuon.getByTestId('so-dang-cho-muon')).toContainText('400.000')
})

test('đòi nợ về thì sổ cho mượn trừ dần', async ({ page }) => {
  await ghiBuaNhom(page, { tong: '500k', soNguoi: 5 })

  // Ghi khoản THU vào danh mục ứng — cách duy nhất để tất toán.
  await page.goto('/')
  await page.getByRole('button', { name: 'THU' }).click()
  await page.getByTestId('the-gia-ung-nhom').click()
  await page.getByTestId('o-nhap-so').fill('300k')
  await page.getByTestId('nut-ghi').click()
  await expect(page.getByTestId('o-nhap-so')).toHaveValue('')

  await page.goto('/bao-cao')
  await expect(page.getByTestId('so-dang-cho-muon')).toContainText('100.000')
})

test('danh mục hệ thống không xoá và không sửa được', async ({ page }) => {
  // Phải ứng một lần thì danh mục mới được tạo.
  await ghiBuaNhom(page, { tong: '200k', soNguoi: 2 })

  await page.goto('/danh-muc')
  const row = page.getByTestId('cat-row-ung-nhom')
  await expect(row).toBeVisible()
  await expect(row.getByRole('button', { name: 'Sửa' })).toHaveCount(0)
  await expect(row.getByRole('button', { name: 'Xoá' })).toBeDisabled()
})

test('chuyển sang THU thì dải chia tiền biến mất', async ({ page }) => {
  await page.getByTestId('the-gia-an-uong').click()
  await page.getByTestId('o-nhap-so').fill('500k')
  await page.getByTestId('mo-chia-tien').click()
  await expect(page.getByTestId('chia-5')).toBeVisible()

  await page.getByRole('button', { name: 'THU' }).click()
  await expect(page.getByTestId('chia-5')).toBeHidden()
})

test('ghi chú mở rồi đóng lại được, và xoá chữ đã gõ', async ({ page }) => {
  await page.getByTestId('the-gia-an-uong').click()
  await page.getByTestId('o-nhap-so').fill('200k')

  await page.getByTestId('mo-ghi-chu').click()
  await page.getByTestId('o-ghi-chu').fill('Ăn trưa')

  // Bỏ = đóng ô VÀ quên chữ đã gõ. Giữ lại chữ sau khi ô biến mất nghĩa là
  // ghi kèm một ghi chú người dùng tưởng đã bỏ.
  await page.getByTestId('dong-ghi-chu').click()
  await expect(page.getByTestId('o-ghi-chu')).toHaveCount(0)
  await expect(page.getByTestId('mo-ghi-chu')).toBeVisible()

  await page.getByTestId('mo-ghi-chu').click()
  await expect(page.getByTestId('o-ghi-chu')).toHaveValue('')
})

test('hai lối phụ giữ nguyên thứ tự khi mở ghi chú', async ({ page }) => {
  await page.getByTestId('the-gia-an-uong').click()
  await page.getByTestId('o-nhap-so').fill('200k')

  const yCua = async (testId: string) => {
    const box = await page.getByTestId(testId).boundingBox()
    return box!.y
  }

  // Đóng: ghi chú trên, chia tiền dưới.
  expect(await yCua('mo-ghi-chu')).toBeLessThan(await yCua('mo-chia-tien'))

  // Mở ghi chú: thứ tự KHÔNG được đảo. Bản trước render ô ghi chú phía trên
  // hàng nút nên "+ Chia tiền nhóm" nhảy xuống dưới ô nhập.
  await page.getByTestId('mo-ghi-chu').click()
  expect(await yCua('o-ghi-chu')).toBeLessThan(await yCua('mo-chia-tien'))

  // Và dòng chia tiền không bị cắt mất nửa dưới.
  const box = await page.getByTestId('mo-chia-tien').boundingBox()
  const cuon = await page
    .locator('[aria-label="Ghi giao dịch"] > div')
    .first()
    .boundingBox()
  expect(box!.y + box!.height).toBeLessThanOrEqual(cuon!.y + cuon!.height + 1)
})

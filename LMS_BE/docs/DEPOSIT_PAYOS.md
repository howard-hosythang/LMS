# Thu tiền cọc qua payOS tại quầy

## Phạm vi và luồng thao tác

Áp dụng cho **Mượn trực tiếp**, **Xác nhận giao phiếu mượn chờ lấy** và **Xác nhận giao đặt trước** tại `Circulation.tsx`. Tái sử dụng `PayOsClient`, cùng cấu hình payOS và webhook đang dùng cho phí phạt; không thay đổi nghiệp vụ nộp phí phạt hoặc tính/hoàn/cấn trừ cọc.

1. Nhập MSSV + barcode ở Mượn trực tiếp, hoặc tra cứu phiếu mượn/đặt trước ở Xác nhận giao sách.
2. Chọn Chuyển khoản / QR, bấm **Tạo QR thu cọc**. Backend tự xác định bạn đọc, bản sao và số tiền từ chính sách; không nhận số tiền do client nhập.
3. Khung QR hiển thị họ tên, MSSV, tên sách, barcode, tiền cọc, nội dung chuyển khoản, mã đơn và link checkout payOS. Không tạo QR nếu chính sách không thu cọc.
4. Polling sync ngay một lần rồi mỗi 4 giây **sau khi request trước hoàn tất**. Không chồng request; bỏ phản hồi cũ khi đổi đối tượng/unmount; dừng khi PAID/CONSUMED/CANCELLED/EXPIRED. Lỗi hiển thị tại chỗ, polling có thể thử tiếp. Thông báo không chỉ dựa vào màu sắc, có nội dung trạng thái và nhãn truy cập theo checklist UI/UX.
5. Khi payOS xác nhận đủ tiền, hiển thị thông báo và mở nút **Cho mượn ngay / Xác nhận giao sách**. Thủ thư vẫn phải bấm giao sách; sync/webhook không tự phát sách hoặc tạo giao dịch mượn.
6. Giao sách gửi `paymentMethod=BANK_TRANSFER` và `depositOrderCode`. Backend khóa và kiểm tra đơn, gắn đơn vào giao dịch, ghi nhận cọc, rồi commit cùng giao sách. Thông báo giao sách hiển thị hình thức thu cọc thực tế. Giao dịch tiếp theo mặc định tiền mặt.

### Điểm thay đổi so với lựa chọn hình thức ở V60

Trước đây BANK_TRANSFER chỉ là ghi nhận thủ thư đã thu bằng chuyển khoản. Từ V61, khi có thu cọc, **BANK_TRANSFER bắt buộc có đơn payOS PAID khớp giao sách**. Chuyển khoản thủ công ngoài payOS không được dùng để vượt qua kiểm tra này. CASH vẫn dùng được cho lời gọi cũ không có `depositOrderCode`, miễn không có đơn cọc payOS đang mở cho cùng bạn đọc/bản sao.

## API (chỉ LIBRARIAN)

| API | Request | Response |
| --- | --- | --- |
| `POST /api/v1/deposits/payments/payos` | `{ "flow":"DIRECT", "studentId":"00123", "barcode":"BC1" }` hoặc `{ "flow":"TRANSACTION", "sourceId":"..." }` hoặc `{ "flow":"RESERVATION", "sourceId":"..." }` | Envelope có orderCode, status, amount, description, paymentLinkId, checkoutUrl, qrCode và thông tin bạn đọc/sách |
| `POST /api/v1/deposits/payments/payos/{orderCode}/sync` | Không có body | Cùng DTO, trạng thái hiện tại đã đối chiếu provider |
| `POST /api/v1/deposits/payments/payos/{orderCode}/cancel` | Không có body | Chỉ chuyển CANCELLED/EXPIRED sau khi provider xác nhận và chưa nhận tiền |
| `POST /api/v1/transactions/borrow-direct` | Body thêm `depositOrderCode` bên cạnh paymentMethod | Response giao sách như cũ |
| `POST /api/v1/transactions/{id}/confirm-pickup` | Query `paymentMethod=BANK_TRANSFER&depositOrderCode=...` | Response giao sách như cũ |
| `POST /api/v1/reservations/{id}/confirm-pickup` | Query tương tự | Response giao sách như cũ |

Webhook giữ nguyên URL **`POST /api/v1/fines/payments/payos/webhook`**. Controller phân phối cho nghiệp vụ phí phạt và cọc. Cả hai xác minh chữ ký; đơn cọc chỉ cập nhật PAID, không thanh toán fines. Không cần đổi webhook đang cấu hình trên payOS. Endpoint webhook là public có kiểm tra HMAC, không phải API được phép tự đặt trạng thái PAID.

## Kiến trúc và lưu trữ

- Migration mới **V61__deposit_payos_orders.sql**; không sửa V60 hoặc migration trước.
- `DepositPaymentController` → `DepositPaymentService` → `DepositPaymentOrderStore` / JDBC và `PayOsClient`.
- `DepositPaymentOrderStore.prepare` có transaction riêng, khóa bạn đọc/bản sao, kiểm tra điều kiện hiện tại, tái sử dụng đơn đang mở hoặc lưu đơn CREATING **trước** gọi provider. Service tạo link không bao trong transaction ấy, tránh rollback mất dấu đơn khi request provider bị timeout.
- `deposit_payment_orders` lưu user_id, item_id, flow, source_id, số tiền báo giá, provider, mã đơn, trạng thái, thông tin link/QR, người tạo, người sync, thời điểm thanh toán, thời điểm dùng và consumed_transaction_id.
- Sequence mã đơn cọc từ 2.000.000.000.000.000 đến 8.999.999.999.999.999, nằm trong miền số nguyên an toàn JavaScript, tách khỏi cách tạo mã phí phạt hiện tại. ID nội bộ vẫn dùng TsIdGenerator.
- Unique index chỉ cho **một đơn mở trên user_id + item_id** kể cả hai thủ thư dùng hai luồng khác nhau. consumed_transaction_id là UNIQUE/FK. CHECK giới hạn flow/status/số tiền và sự nhất quán CONSUMED.
- Các UseCase giao sách gọi `resolveForHandover` trong transaction hiện hữu, rồi `BorrowDepositService.collectForBorrow` với số tiền đã xác thực. Cọc và sự kiện COLLECTED chỉ ghi một lần khi giao sách, phương thức BANK_TRANSFER. Bảng đơn liên kết trở lại giao dịch để đối soát.

## Vòng đời đơn và kiểm tra bắt buộc

`CREATING → PENDING → PAID → CONSUMED`

`CREATING / PENDING → CANCELLED hoặc EXPIRED` chỉ sau phản hồi provider và chưa nhận tiền.

- Tạo QR kiểm tra bạn đọc ACTIVE, trạng thái bản sao và phiếu nhận sách/deadline hiện tại, giới hạn/đặt trùng ở luồng DIRECT và quy định nợ phạt. Không lấy user_id/item_id/amount từ client. Giao sách tiếp tục kiểm tra lại nghiệp vụ vốn có.
- Sync so khớp orderCode, paymentLinkId đã lưu, tổng tiền đơn và **amountPaid bằng đúng tiền cọc** khi status=PAID. PAID đã lưu/CONSUMED trả về idempotent.
- Webhook chữ ký hợp lệ, thành công, đúng mã đơn và một khoản chuyển bằng toàn bộ cọc mới được ghi PAID trực tiếp. Webhook khoản chuyển lẻ không đánh dấu toàn bộ cọc đã trả; sync đối chiếu tổng amountPaid để xử lý nhiều lần chuyển.
- Khi giao sách, đơn phải PAID, chưa dùng, khớp **user, copy, flow và source_id**. Request không thể dùng đơn của sinh viên khác/bản sao khác/phiếu khác. Consuming và giao sách chung transaction: lỗi giao sách không làm mất đơn đã trả.
- Nếu chính sách đổi giữa lúc trả tiền và giao sách, giữ đúng **số tiền báo giá đã thanh toán** trên đơn; không tự thu thêm hoặc thay cọc đã trả bằng chính sách mới.
- Cấm chuyển sang CASH để thu lần nữa khi tồn tại đơn CREATING/PENDING/PAID cùng bạn đọc/bản sao. Giao diện khóa mục tiêu và lựa chọn phương thức khi đang xử lý đơn; chỉ hủy đơn chưa nhận tiền rồi mới đổi được.
- Không cho hủy đơn PAID/CONSUMED hoặc đơn đã nhận một phần tiền. Thiếu/thừa tiền cần đối soát, không tự xóa lịch sử hoặc tự hoàn qua payOS.
- Timeout tạo link: thử lại cùng đối tượng dùng lại mã đơn, không sinh mã mới. Nếu POST đã thành công ở provider nhưng mất response, GET lấy lại ID; khi GET không trả payload VietQR, mở checkout của **chính đơn cũ** để xem QR trên payOS. Không giả QR link là VietQR chuyển khoản ngân hàng.

Tài liệu provider tham chiếu: [payOS API](https://payos.vn/docs/api/) — amountPaid, GET trạng thái, POST hủy, checkout URL và hạn chế độ dài description. Description cọc dùng `COC` + 6 chữ số (9 ký tự); MSSV/họ tên đầy đủ hiển thị trong UI/buyerName, không nhồi vào nội dung chuyển khoản.

## Ngoại lệ và đối soát vận hành

- PAID **chưa có nghĩa đã giao sách**. PAID chưa CONSUMED phải được tiếp tục giao đúng phiếu hoặc xử lý hoàn/đối soát thủ công nếu không thể giao (hết hạn, sách đổi trạng thái, chính sách/điều kiện bạn đọc đổi).
- Không giữ DB lock trong suốt thời gian độc giả quét QR, không tự tạo thêm phiếu mượn/đặt trước/giữ chỗ cho DIRECT. Thủ thư giữ bản sao thực tế tại quầy trong lúc thu cọc. Nếu điều kiện thay đổi sau thanh toán, use case có thể từ chối giao; đơn vẫn còn nguyên để đối soát, không chuyển tiền sang giao dịch khác.
- Reload/đổi ca: tra cứu lại cùng đối tượng và bấm tạo QR để lấy lại đơn PENDING/PAID còn mở. Nếu đối tượng không còn đủ điều kiện, không thu lần nữa; tra cứu mã đơn qua sync và đối soát bản ghi PAID chưa CONSUMED. Chưa bổ sung dashboard quản lý hoàn cọc payOS hoặc tự hoàn tiền.
- CREATING sau lỗi provider không bị xóa hoặc giả CANCELLED. Thử lại cùng mục tiêu để khôi phục; nếu provider không phản hồi/không có link phục hồi được thì cần đối soát kỹ thuật, không tự thu thêm để che lỗi.
- Báo cáo cọc lưu thông/Excel hiện dựa vào giao dịch và sự kiện cọc khi giao sách. **PAID chưa CONSUMED** còn nằm ở bảng đơn riêng, chưa được cộng vào cọc của sách đang lưu hành. Cần đối chiếu riêng danh sách này khi chốt ca; không xem số cọc đang giữ trên báo cáo lưu thông là toàn bộ tiền payOS vừa nhận nhưng chưa giao sách.
- Không gửi payment thành công hoặc phát sách theo tham số returnUrl/cancelUrl: đó chỉ là điều hướng, không phải bằng chứng thanh toán.

Đối soát read-only trên môi trường được phép:

```sql
SELECT order_code, user_id, item_id, flow, source_id, amount, status, paid_at, created_at
FROM deposit_payment_orders
WHERE status IN ('CREATING', 'PENDING', 'PAID')
ORDER BY created_at;
```

## Triển khai và kiểm thử

1. Deploy backend để Flyway áp dụng V61 trên database; sử dụng cấu hình payOS đang có (`payos.client-id`, `payos.api-key`, `payos.checksum-key`, `payos.base-url`, `base.frontend-url`). Không đưa secret vào frontend.
2. Deploy frontend cùng phiên bản. BANK_TRANSFER cũ không có đơn trả tiền sẽ bị backend từ chối như thiết kế mới.
3. Unit test store/service/controller/client dùng mock và HTTP giả lập, không gọi payOS thật. Test UI bao phủ cả ba luồng, QR, polling, lỗi và phản hồi cũ.
4. Test SQL/migration dùng PostgreSQL Testcontainers riêng; không nối database nghiệp vụ, có thể skip nếu Docker chưa chạy. Kiểm thử giao dịch trả tiền thật trên staging cần cấu hình payOS phù hợp và được người vận hành thực hiện; agent không tự tạo link hoặc chuyển tiền thật.

```powershell
# Trong LMS_BE
mvn test -pl library-circulation-module -am
mvn test -pl library-bootstrap -am '-Dtest=DepositPaymentSqlIntegrationTest' '-Dsurefire.failIfNoSpecifiedTests=false'
# Trong LMS_FE
npm test
npx tsc --noEmit
npm run build
```

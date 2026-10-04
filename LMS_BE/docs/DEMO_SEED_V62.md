# Bộ dữ liệu mô phỏng V62

Migration: `library-bootstrap/src/main/resources/db/migration/V62__coherent_demo_circulation_seed.sql`.
Đây là dữ liệu **mô phỏng phục vụ demo**, không phải số liệu sử dụng hay thanh toán thực tế.

## Khi nào chạy?

V62 nằm trong location Flyway mặc định `classpath:db/migration`: tự chạy một lần khi BE khởi động trên database chưa có V62. Flyway ghi nhận version/checksum; những lần khởi động sau không chèn lại. Không chỉnh migration đã áp dụng, không chạy thủ công từng đoạn, không sửa `flyway_schema_history` để seed lại.

Migration là một transaction PostgreSQL do Flyway quản lý. Các bảng manifest `v62_*` là bảng tạm, tự xóa khi commit. Lỗi SQL/kiểm tra cuối script làm rollback toàn bộ dữ liệu chèn trong V62 (sequence PostgreSQL có thể vẫn tăng, điều này bình thường).

## Dữ liệu được bổ sung

| Nhóm | Số lượng |
|---|---:|
| Sinh viên | 132: K21–K24 × 11 khoa × 3 người |
| Thủ thư mô phỏng | 2, một người mỗi cơ sở; LOCKED, không có mật khẩu |
| Bản sao demo của đầu sách hiện có | 132 |
| Lịch sử đã trả | 528, bốn lần mượn mỗi bản sao |
| Đang mượn / quá hạn | 48 / 12 |
| Chờ nhận / đã hủy vì không nhận | 8 / 4 |
| Tổng giao dịch | 600 |
| Đặt trước | 30: 2 READY_FOR_PICKUP, 4 EXPIRED, 8 CANCELLED, 16 COMPLETED |
| Khoản phạt | 40: 30 trễ hạn, 6 hỏng, 4 mất |
| Hàng đợi cất kệ đang chờ | 20: 12 trả sách, 4 hết hạn nhận, 4 đặt trước hết hạn |
| Đánh giá sách / vote hữu ích | 198 / 396 |
| Đánh giá hệ thống | 32 |
| Wishlist / mục wishlist | 132 / 132 |
| Lịch sử tìm kiếm | 396 |
| Ticket hỗ trợ | 20, đủ NEW / IN_PROGRESS / RESOLVED / CLOSED |

Ngoài ra có sự kiện thu/hoàn/cấn trừ cọc, lịch sử cất kệ đã hoàn tất, phản hồi đánh giá, tương tác BORROWED/WATCH/WISHLIST, hội thoại và ghi chú nội bộ ticket, thông báo trong app, ghi chú giao dịch, audit có `source=SEED_V62` và `synthetic=true`.

## Nhận diện và bảo toàn dữ liệu có sẵn

- Các trường hiển thị dùng tên, địa chỉ, ghi chú và thông báo tự nhiên, không có nhãn demo. Nguồn gốc mô phỏng vẫn được lưu trong audit và tài liệu này, không phải chứng từ hoạt động thực tế.
- Sinh viên có email `sv.<MSSV>@example.invalid`, thủ thư có email `lib<code>@example.invalid`. Miền `.invalid` không đại diện hộp thư thật. SĐT để NULL, không dùng số điện thoại cá nhân giả.
- MSSV có prefix 21/22/23/24, bắt đầu thử các số đuôi 99001; nếu trùng mã/email có sẵn thì lấy ứng viên khác. Thủ thư dùng mã LIB99xx chưa sử dụng.
- Mật khẩu sinh viên demo: `123456` (hash BCrypt có sẵn trong V41). Có 130 ACTIVE, một LOCKED, một INACTIVE; chỉ dùng tài khoản giả này để trình diễn, không gắn thông tin thật.
- Bản sao có barcode `BK-V62-<base>-<số>`, nguồn bổ sung hiển thị `Bổ sung thư viện`. Đây không phải sách thật trong kho. Chỉ thêm bản sao mới, không đổi trạng thái bản sao hiện có. Ticket dùng mã `LMS-<base>-<số>`.
- ID nằm trong block riêng được kiểm tra trùng trước khi chọn. Không dùng `MAX(id)+1`, không reset sequence.
- Chỉ UPDATE những user/item được tạo bởi V62 qua manifest tạm; không cập nhật policy, tài khoản/role cũ, sách cũ hay payment order cũ.
- Không gọi API, Kafka, email hoặc payOS trong migration. Các thông báo chèn chỉ dành cho bạn đọc demo. Nếu thao tác qua ứng dụng sau seed thì các side effect bình thường của ứng dụng vẫn có thể xảy ra.

## Quy tắc nghiệp vụ

- Thời điểm neo là ngày chạy V62 theo múi giờ Việt Nam. Lịch sử trải gần sáu tháng; có giao dịch đã trả gần đây, đang mượn tới hạn và quá hạn.
- Lịch sử mượn từng bản sao không chồng thời gian. Một bản sao tối đa một giao dịch đang mượn/chờ nhận; READY_FOR_PICKUP dùng các bản sao khác với giao dịch chờ nhận online.
- Tám giao dịch hiện tại đã gia hạn một lần: thời hạn mô phỏng tổng 28 ngày. Các giao dịch còn lại theo kỳ 14 ngày. Đây là snapshot lịch sử, không đổi cấu hình policy hiện hành.
- Cọc lịch sử mô phỏng 50.000đ; một nhóm không thu cọc. Thu cọc bằng CASH. Phạt trễ ba ngày theo mức lịch sử 1.000đ/ngày; phạt hỏng 80.000đ và mất 200.000đ.
- Phạt được cọc bù đủ giữ `fine_amount` và PAID; phạt bù một phần lưu số còn thiếu và UNPAID, giống `BorrowDepositService`. Sổ sự kiện và các trường quyết toán khớp nhau.
- Không seed đơn `deposit_payment_orders`, `fine_payment_orders`, `fine_payment_order_fines`: không giả lập xác nhận ngân hàng trên database sử dụng payOS thật. Các dữ liệu payment order đã có giữ nguyên.
- Không tạo PENDING đặt trước giả khi ấn phẩm còn có bản sao AVAILABLE. Bộ này tập trung READY_FOR_PICKUP và các trạng thái lịch sử.
- `reshelving_tasks` có nguồn đúng: hết hạn nhận không biến thành trả sách. Task WAITING chỉ gắn bản sao AVAILABLE; thông tin cất kệ giao dịch trả đồng bộ task RETURN. Cập nhật trạng thái bản sao trước khi chèn task để không bị trigger V59 xóa nhầm task mới.
- Review gắn đúng giao dịch đã trả, bạn đọc, đầu sách, barcode; viết sau trả 30 phút, trong cửa sổ bảy ngày. `helpful_count` khớp hai vote thực tế, không có tự vote. Điểm đóng góp là 5 điểm/review sách; điểm tín nhiệm phản ánh lần trả/vi phạm cuối.
- Staff mô phỏng có role LIBRARIAN nhưng bị khóa; họ chỉ là actor lịch sử, không tạo thêm tài khoản đặc quyền có mật khẩu công khai.

## Tác động lên báo cáo

Dữ liệu này được tính vào KPI, Excel/PDF, tồn kho khả dụng và gợi ý AI theo các truy vấn hiện tại. Đây là chủ ý cho website demo, **không được gọi các KPI này là số liệu vận hành thật**. Mốc thời gian và trạng thái đang mượn/chờ nhận tiếp tục thay đổi bởi scheduler và thao tác UI; V62 không tự làm mới dữ liệu mỗi ngày.

## Kiểm tra

`DemoSeedMigrationIntegrationTest` chạy full Flyway V1–V61, cố tình chèn tài khoản trùng block ID/MSSV ứng viên, sau đó chạy V62 trên PostgreSQL container riêng. Kiểm tra số lượng, khoa/khóa, bảo toàn tài khoản, không tăng payment orders, thời gian mượn không chồng nhau, trạng thái bản sao, review/vote, đối soát cọc/phạt và khởi động Flyway lần hai không seed thêm.

Test rollback chạy script trong transaction kiểm thử rồi cố tình ném lỗi cuối script: tất cả bảng phải giữ nguyên số lượng và history V62 đã hoàn tất không bị thay đổi. Thao tác này chỉ diễn ra trong container dùng một lần.

```powershell
cd LMS_BE
mvn test -pl library-bootstrap -am "-Dtest=DemoSeedMigrationIntegrationTest" "-Dsurefire.failIfNoSpecifiedTests=false"
```

Không dùng production datasource cho test. Không có thao tác xóa hoặc reset database thật trong script/test.

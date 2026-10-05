# Quy tắc kiểm thử Backend

Áp dụng cùng [quy tắc chung](../../CONTRIBUTING.md). Không thay đổi nghiệp vụ chỉ để test pass.

## 1. Công cụ và vị trí

- Java 21, Maven; JUnit 5, Mockito và AssertJ theo cấu hình các module.
- Unit test nằm trong `<module>/src/test/java`, cùng cấu trúc package với mã nguồn; tên lớp kết thúc bằng `Test`.
- Test SQL/tích hợp hiện có tại `library-bootstrap/src/test/java/com/library/integration`.
- Integration test database sử dụng Testcontainers/PostgreSQL; cần Docker hoạt động và tải được image cần thiết.

Tham khảo:

- [BorrowDepositServiceTest](../library-circulation-module/src/test/java/com/library/circulation/application/deposit/BorrowDepositServiceTest.java): validate phương thức, giá trị mặc định, ghi sự kiện và audit.
- [DepositPaymentSqlIntegrationTest](../library-bootstrap/src/test/java/com/library/integration/DepositPaymentSqlIntegrationTest.java): luồng cọc và truy vấn database.
- [ReshelvingSqlIntegrationTest](../library-bootstrap/src/test/java/com/library/integration/ReshelvingSqlIntegrationTest.java): trạng thái lưu thông/xếp giá.
- [DemoSeedMigrationIntegrationTest](../library-bootstrap/src/test/java/com/library/integration/DemoSeedMigrationIntegrationTest.java): migration và dữ liệu seed.

Các test có sẵn là ví dụ cấu trúc, không có nghĩa phải sao chép toàn bộ cách mock hoặc assertion.

## 2. Chọn đúng mức kiểm thử

| Mức | Mục tiêu | Cách thực hiện |
| --- | --- | --- |
| Unit | Quyết định nghiệp vụ, tính toán, validate | Mock repository/dịch vụ ngoài; không khởi động cả ứng dụng nếu không cần |
| Controller/API | Mapping request/response, validation, HTTP status, security | Dùng test context/MockMvc phù hợp; không mock bỏ qua security rồi kết luận phân quyền đúng |
| Integration SQL | JOIN, constraint, transaction, schema, khóa và dữ liệu thật | PostgreSQL biệt lập, chạy migration và kiểm tra trạng thái đã lưu |
| Tích hợp hệ thống | Hợp đồng với FE/AI/payOS | Môi trường test; mô phỏng nhà cung cấp hoặc sandbox được cho phép |

Assertion đối với lời gọi mock có thể bảo vệ việc truyền tham số nhưng không thay thế integration test cho câu SQL, constraint hoặc rollback thực tế.

## 3. Cách viết test

- Dùng `@ExtendWith(MockitoExtension.class)` cho unit test sử dụng Mockito.
- Tạo dữ liệu tối thiểu cho điều kiện đang kiểm tra; chỉ stub tương tác thực sự cần thiết.
- Kiểm tra cả kết quả trả về lẫn dữ liệu/tác dụng phụ quan trọng. Với lỗi, kiểm tra loại lỗi và mã lỗi nghiệp vụ nếu có.
- Dùng parameterized test cho các giá trị có cùng hành vi: `null`, rỗng, enum hợp lệ/không hợp lệ hoặc ranh giới số tiền.
- Tiền dùng `BigDecimal` khi nghiệp vụ yêu cầu; so sánh giá trị số thích hợp, không dựa vào khác biệt scale không có ý nghĩa nghiệp vụ.
- Với thời hạn, dùng mốc thời gian cố định/clock có thể kiểm soát; bao gồm đúng ngày mở gia hạn và đúng hạn trả.
- Với phân trang, kiểm tra dữ liệu nhiều trang, sort ổn định và tổng số phần tử đúng; không chỉ kiểm tra trang đầu.
- Với query tổng hợp, tạo nhiều rating/giao dịch cho cùng bản sao để phát hiện nhân bản dữ liệu do JOIN.

Ví dụ test điều chỉnh phí chưa thanh toán phải kiểm tra: thành công khi chưa trả; bị từ chối khi đã trả; tiền âm/vượt giới hạn; dữ liệu không bị ghi khi bị từ chối; ghi audit phù hợp. Chọn điều kiện theo hợp đồng nghiệp vụ thật của API, không tự đặt HTTP status khác với thiết kế.

## 4. Database và Flyway

- Không kết nối database production trong test. Không chạy `flyway clean` trên dữ liệu dùng chung.
- Migration mới phải có version duy nhất và tuân thủ schema hiện tại; không sửa checksum migration đã triển khai.
- Kiểm tra FK, UNIQUE, CHECK, giá trị mặc định và dữ liệu tồn tại trước thay đổi nếu có rủi ro nâng cấp.
- Với seed, kiểm tra quan hệ, tổng số hợp lý, tính nhất quán tài chính/trạng thái và không xung đột khóa với dữ liệu có sẵn.
- Kiểm tra rollback cho thao tác nhiều bảng khi thất bại; dùng kết nối/transaction phù hợp để assertion thấy được dữ liệu cần kiểm chứng.
- Test concurrency cần transaction/connection riêng nếu kiểm tra khóa; gọi tuần tự trên mock không chứng minh được chống cấp phát trùng.

Một số integration test cấu hình `disabledWithoutDocker=true`: Maven có thể thành công dù những test này bị skip. Thay đổi SQL/migration cần chạy các test liên quan với Docker và báo cáo không skip, hoặc ghi rõ chưa đủ điều kiện hoàn thành kiểm chứng.

## 5. Lệnh chạy

Chạy từ thư mục `LMS_BE`.

Toàn bộ Backend — bắt buộc trước PR thay đổi mã Backend:

```powershell
mvn --batch-mode --no-transfer-progress test
```

Test module lưu thông và các module phụ thuộc trong reactor:

```powershell
mvn test -pl library-circulation-module -am
```

Chạy một lớp khi phát triển:

```powershell
mvn test -pl library-circulation-module -am "-Dtest=BorrowDepositServiceTest" "-Dsurefire.failIfNoSpecifiedTests=false"
```

Chạy các test SQL liên quan tới cọc và xếp giá, có Docker:

```powershell
mvn test -pl library-bootstrap -am "-Dtest=DepositPaymentSqlIntegrationTest,ReshelvingSqlIntegrationTest" "-Dsurefire.failIfNoSpecifiedTests=false"
```

`failIfNoSpecifiedTests=false` dùng để các module phụ thuộc không có lớp được chọn không bị lỗi; phải kiểm tra báo cáo để chắc chắn lớp mục tiêu thực sự chạy. Test chọn lọc không thay cho toàn bộ suite trước PR.

## 6. Bằng chứng trong PR

- Ghi lệnh, kết quả PASS/FAIL/SKIP và điều kiện môi trường, đặc biệt Docker.
- Xem báo cáo tại `<module>/target/surefire-reports`; không coi `BUILD SUCCESS` là bằng chứng mọi integration test đã chạy.
- Ghi rõ endpoint/schema thay đổi và FE bị ảnh hưởng; bổ sung kiểm tra tích hợp khi đổi hợp đồng.
- `-DskipTests` chỉ phục vụ build nhanh, không đáp ứng yêu cầu kiểm thử. CI hiện chạy `mvn test` và build image; việc review độ đầy đủ của test vẫn cần người thực hiện.

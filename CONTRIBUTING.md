# Quy tắc đóng góp và kiểm thử LMS

## 1. Mục đích và phạm vi

Bộ quy tắc thống nhất cách viết, chạy và đánh giá test để thành viên mới có thể đóng góp mà không làm mất tính ổn định của hệ thống. Áp dụng cho Backend, Frontend và các thay đổi tích hợp AI.

Trong tài liệu này, **bắt buộc** là điều kiện nhóm cần kiểm tra trước khi chấp nhận PR; **khuyến nghị** là thực hành nên áp dụng tùy phạm vi. Tài liệu không đồng nghĩa với việc mọi điều kiện đã được GitHub tự động cưỡng chế.

Hướng dẫn cụ thể:

- [Backend: công cụ, vị trí test và lệnh chạy](LMS_BE/docs/TESTING.md).
- [Frontend: công cụ, tương tác và lệnh chạy](LMS_FE/docs/TESTING.md).
- [AI: bộ dữ liệu đánh giá và chỉ số chất lượng](LMS_AI/AI_TESTING_STRATEGY.md).

## 2. Quy trình làm việc chung

1. Tạo nhánh riêng cho tính năng hoặc bản sửa lỗi; không làm việc trực tiếp trên `main`.
2. Xác định hành vi cần thay đổi, điều kiện chấp nhận và các luồng có thể bị ảnh hưởng.
3. Viết hoặc cập nhật test cùng với mã nguồn. Với lỗi tái hiện được, bổ sung test hồi quy chứng minh lỗi trước khi sửa.
4. Chạy test liên quan trong quá trình phát triển, sau đó chạy kiểm tra toàn bộ thành phần bị thay đổi trước khi mở PR.
5. Mở PR theo [mẫu chung](.github/pull_request_template.md), ghi rõ lệnh chạy, kết quả và giới hạn kiểm chứng.
6. Reviewer đối chiếu yêu cầu, test và tác động tới API/database trước khi chấp nhận merge.

Khuyến nghị commit theo dạng `feat(FE): ...`, `fix(BE): ...`, `test(BE): ...`, `docs: ...`. PR nên tập trung vào một mục tiêu, tránh trộn refactor không liên quan.

## 3. Khi nào phải bổ sung test?

| Loại thay đổi | Yêu cầu kiểm thử tối thiểu |
| --- | --- |
| Thêm hoặc sửa nghiệp vụ | Trường hợp thành công, bị từ chối và giá trị biên liên quan |
| Sửa lỗi | Test hồi quy tái hiện đúng lỗi và xác nhận hành vi sau khi sửa |
| Thay đổi API | Request/response, validation, phân quyền và kiểm tra các client đang sử dụng |
| Query SQL, schema hoặc Flyway | Integration test trên PostgreSQL, dữ liệu có nhiều quan hệ và ràng buộc liên quan |
| UI có thao tác | Test tương tác người dùng, payload gửi đi, loading/error/success liên quan |
| Chỉ đổi layout hoặc CSS | Kiểm tra trình duyệt ở kích thước phù hợp; bổ sung test nếu hành vi bị ảnh hưởng |
| Refactor | Test cũ tiếp tục pass; bổ sung test nếu hành vi quan trọng chưa được bảo vệ |
| Chỉ sửa tài liệu | Kiểm tra nội dung, liên kết và `git diff --check`; không bắt buộc chạy toàn bộ test |

Không yêu cầu viết test vô nghĩa cho mỗi dòng code. Phải bảo vệ hành vi và rủi ro của thay đổi, không chỉ tăng số lượng test.

## 4. Tiêu chuẩn của một test

### 4.1. Dễ hiểu và kiểm tra đúng hành vi

- Tên test thể hiện tình huống và kết quả mong đợi, ví dụ `rejectsAdjustmentWhenFineIsPaid` hoặc `submitsSearchOnlyWhenEnterIsPressed`.
- Tổ chức theo **Arrange → Act → Assert**: chuẩn bị dữ liệu, thực hiện hành động, kiểm tra kết quả.
- Mỗi test có một mục tiêu rõ ràng; có thể dùng nhiều assertion để kiểm chứng đầy đủ mục tiêu đó.
- Kiểm tra giá trị/trạng thái cụ thể, không chỉ `not null`, không ném lỗi hoặc component render được.
- Khi thao tác bị từ chối, kiểm tra không phát sinh ghi dữ liệu, gọi thanh toán hoặc tác dụng phụ trái phép nếu phù hợp.
- Ưu tiên kết quả nghiệp vụ hơn chi tiết cài đặt. Chỉ kiểm tra câu SQL/call nội bộ khi đó chính là hợp đồng cần bảo vệ.

### 4.2. Độc lập và ổn định

- Test không phụ thuộc thứ tự chạy hoặc dữ liệu do test khác để lại.
- Dùng fixture nhỏ, có mục đích; giải thích những số liệu quan trọng.
- Kiểm soát thời gian, timezone và dữ liệu ngẫu nhiên khi chúng ảnh hưởng kết quả. Không dựa vào ngày hôm nay cho test giá trị biên.
- Không dùng chờ cố định để che lỗi bất đồng bộ; sử dụng cơ chế chờ assertion hoặc đồng hồ giả phù hợp.
- Dọn timer, mock, subscription và dữ liệu tạo ra. Không để test gọi dịch vụ bên ngoài thật ngoài ý muốn.
- Test phải chạy lại được trên máy thành viên khác và CI với cùng điều kiện môi trường đã ghi nhận.

### 4.3. Không làm yếu test để có kết quả xanh

- Không xóa assertion, đổi kỳ vọng sai nghiệp vụ, thêm `skip`/`disabled` hoặc bỏ test lỗi chỉ để CI pass.
- Test cũ được sửa khi yêu cầu nghiệp vụ thực sự thay đổi; PR phải giải thích thay đổi và được review.
- Một test flaky cần được điều tra. Tạm vô hiệu hóa chỉ khi có lý do, người review chấp thuận và đầu việc theo dõi để khôi phục.
- Báo cáo riêng số **PASS / FAIL / SKIP**. Test bị bỏ qua không được tính là đã kiểm chứng thành công.
- Coverage hỗ trợ tìm vùng thiếu test; không thay thế assertion chất lượng. Chưa đặt ngưỡng coverage bắt buộc toàn dự án khi chưa có baseline thống nhất.

## 5. Các nghiệp vụ rủi ro cao phải được bảo vệ

Chọn các trường hợp liên quan tới thay đổi, không máy móc áp dụng toàn bộ cho mọi PR:

- **Mượn/đặt trước/giao sách:** trạng thái hợp lệ và không hợp lệ, hết hạn nhận, không đến nhận, quyền thao tác và bản sao không thể cấp phát hai lần.
- **Gia hạn:** quá hạn, giới hạn lượt, cửa sổ gia hạn, hàng đợi đặt trước và nợ phạt; kiểm tra sát ranh giới chính sách.
- **Trả sách/xếp giá:** không tạo nhiệm vụ trùng khi xử lý lại, phân biệt sẵn có và chờ cất, lọc và xác nhận đúng cơ sở.
- **Cọc/phạt:** số tiền hợp lệ và giới hạn, khoản đã thanh toán không được sửa trái phép, sự nhất quán giữa giao dịch, sự kiện cọc và công nợ.
- **payOS:** sai số tiền/sai đơn/sai người, chưa thanh toán không được coi là đã thu, xử lý thông báo hoặc sync lặp không ghi nhận tiền hai lần, timeout/lỗi nhà cung cấp.
- **Phân quyền:** chưa đăng nhập, sai vai trò, truy cập dữ liệu không thuộc phạm vi được phép. Ẩn nút trên FE không thay cho bảo vệ BE.
- **Báo cáo/query tổng hợp:** không nhân số bản sao hoặc số tiền do JOIN, đúng loại ngày/khoảng ngày, trạng thái, cơ sở và định dạng xuất.

Với thay đổi nhiều bước ghi dữ liệu, kiểm tra rollback khi thất bại giữa chừng. Với cấp phát bản sao hoặc ghi nhận tiền, kiểm tra cạnh tranh/idempotency khi phạm vi thay đổi liên quan; unit test mock không chứng minh được tính đúng đắn của khóa database.

## 6. API, migration và dữ liệu kiểm thử

- Thay đổi API phải liệt kê endpoint, field, kiểu dữ liệu, nullability, trạng thái lỗi và FE/client bị ảnh hưởng.
- Test FE mock API phải cập nhật theo hợp đồng thật. Mock đúng kỳ vọng của FE không chứng minh BE đang trả đúng hợp đồng.
- Khi thay đổi hợp đồng BE/FE, bắt buộc kiểm tra cả hai phía và thử luồng tích hợp trên môi trường test/staging. Không mặc định BE CI xanh nghĩa là FE tương thích.
- Giữ chính xác ID lớn theo quy ước API; không ép ID sang JavaScript `Number` nếu vượt giới hạn số nguyên an toàn.
- Dữ liệu tiền gửi API là số nguyên bản, không chứa dấu phân cách/đơn vị hiển thị; kiểm tra đúng số tiền thực tế.
- Không sửa migration đã được áp dụng trên môi trường dùng chung; tạo version mới không trùng. Kiểm tra cả database mới và nâng cấp từ schema trước thay đổi khi cần.
- Dùng PostgreSQL test biệt lập cho SQL đặc thù; không thay bằng database khác rồi kết luận truy vấn production đã đúng.
- Không chạy test hoặc seed tự động vào production. Không dùng tài khoản thật, secret thật hay thanh toán thật trong test.
- Dữ liệu tổng hợp phải được nhận diện ở fixture/metadata hoặc tài liệu, không được trình bày như bằng chứng hoạt động thật.

## 7. Điều kiện hoàn thành PR

PR được chấp nhận khi:

1. Đạt điều kiện nghiệp vụ và có test phù hợp hoặc giải thích cụ thể vì sao không cần test tự động.
2. Các kiểm tra bắt buộc của thành phần bị ảnh hưởng đã pass; kết quả skip và kiểm tra chưa chạy được công khai.
3. Không còn lỗi mới, không giảm bảo vệ của test cũ và không chứa secret/dữ liệu nhạy cảm.
4. API, migration và tài liệu được cập nhật nếu có thay đổi tương ứng.
5. Reviewer đã kiểm tra checklist, bằng chứng và các rủi ro. Ngoại lệ phải nêu rõ lý do, rủi ro còn lại và việc cần làm tiếp.

Ghi bằng chứng như: `npm test -- --runInBand: PASS, ... tests; npx tsc --noEmit: PASS`. Không ghi “đã test” nếu chưa chạy; phân biệt unit/integration test với thao tác kiểm tra thủ công.

## 8. Cơ chế áp dụng và mức tự động hóa hiện tại

Đối chiếu các workflow trong repository tại thời điểm viết tài liệu:

| Kiểm tra | Hiện trạng |
| --- | --- |
| Backend CI | Chạy `mvn test` và build Docker image |
| Frontend CI | Chạy `npm ci`, Jest, Vite build và build Docker image |
| TypeScript đầy đủ | Quy định chạy `npx tsc --noEmit`; chưa có bước riêng trong Frontend CI |
| Tương thích BE/FE | Chưa có gate tích hợp chung; phải bổ sung bằng chứng theo phạm vi PR |
| Chọn workflow | CI dùng bộ lọc đường dẫn; sửa BE không tự kích hoạt FE CI |
| Bắt buộc review/chặn merge | Không thể xác nhận chỉ từ mã nguồn; phụ thuộc GitHub rulesets/branch protection |

**Đề xuất để ràng buộc thành viên:** dùng PR cho `main`, yêu cầu ít nhất một reviewer, giải quyết các review còn mở và các status check áp dụng phải thành công. Không để push trực tiếp bỏ qua quy trình nếu nhóm muốn cưỡng chế quy tắc.

Khi cấu hình required checks, cần xử lý việc workflow bị bỏ qua bởi path filter để PR chỉ sửa tài liệu hoặc một thành phần không bị chờ check vô thời hạn. Có thể thiết kế một gate luôn chạy và quyết định kiểm tra cần thiết theo phạm vi; đây là công việc cấu hình riêng, chưa được triển khai bởi tài liệu này.

Mẫu PR nhắc người viết cung cấp bằng chứng; reviewer chịu trách nhiệm đánh giá test có đúng và đủ hay không. CI kiểm tra tự động, nhưng không tự đánh giá đầy đủ ý nghĩa nghiệp vụ của test.

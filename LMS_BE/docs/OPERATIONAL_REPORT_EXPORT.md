# Xuất báo cáo vận hành thư viện

## Cách sử dụng

1. Đăng nhập Thủ thư, mở trang **Báo cáo**, chọn Hôm nay / Tuần này / Tháng này / khoảng ngày tùy chọn và áp dụng bộ lọc.
2. **Xuất Excel chi tiết** tải workbook `.xlsx` thực, tên `Bao_Cao_Van_Hanh_LMS_YYYY-MM-DD_YYYY-MM-DD.xlsx`.
3. **In / Xuất PDF** lấy dữ liệu mới từ backend rồi mở preview A4 ngay trong trang. Bấm **In / Lưu PDF**, chọn máy in hoặc “Save as PDF” của trình duyệt.

Cả hai thao tác dùng khoảng ngày của báo cáo đang hiển thị, không dùng khoảng ngày đang nhập nhưng chưa áp dụng. Khi xuất lỗi, giao diện thông báo lỗi, không thay thế bằng CSV thiếu dữ liệu. Giao diện nút/preview hỗ trợ Việt–Anh; workbook dùng tiếng Việt phục vụ đối soát tại thư viện. Preview áp dụng checklist UI/UX: nút có nhãn rõ ràng, trạng thái chờ, focus/đóng modal theo component dùng chung, bảng gọn và tương phản tốt khi in.

## Backend và phân quyền

Giữ namespace **`librarians`** của API hiện có (không đổi sang `librarian`):

```http
GET /api/v1/librarians/dashboard/report/export-excel?from=2026-10-01&to=2026-10-03
GET /api/v1/librarians/dashboard/report/print?from=2026-10-01&to=2026-10-03
```

- Yêu cầu vai trò `LIBRARIAN`; người lập lấy từ danh tính đăng nhập phía server, không nhận tên thủ thư từ client.
- Excel trả MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Content-Disposition: attachment` và `Cache-Control: no-store`.
- API print trả JSON trong `ApiResponseApp`, gồm báo cáo, thời điểm xuất, người lập, tỷ lệ trả đúng hạn, cọc đang giữ, lượt quá hạn trong kỳ và 10 bạn đọc ưu tiên.
- Ngày bắt buộc theo ISO, `from <= to`, tối đa 5 năm. Truy vấn dùng giờ `Asia/Ho_Chi_Minh`: từ đầu ngày `from` đến **trước** đầu ngày sau `to`.
- Toàn bộ dữ liệu mỗi lần xuất được đọc trong transaction `REPEATABLE_READ`, chỉ đọc, không sửa nghiệp vụ mượn/trả/phạt.
- Mỗi danh sách Excel tối đa 50.000 dòng; vượt ngưỡng thì báo lỗi, không âm thầm bỏ bớt dữ liệu. Sheet đang mượn và bạn đọc rủi ro là snapshot hiện tại, nên thu hẹp kỳ không làm giảm hai danh sách này.
- Dùng Apache POI để tạo workbook; không thêm migration hay thay đổi schema. API CSV cũ vẫn giữ tương thích, nhưng không còn là thao tác xuất Excel của trang Báo cáo.

## Sáu sheet Excel

| Sheet | Nguồn và phạm vi | Nội dung |
| --- | --- | --- |
| 1. Tổng quan vận hành | Báo cáo theo kỳ + snapshot hiện tại | Chỉ có 9 KPI: lượt mượn/trả, trả đúng hạn, đang lưu hành, quá hạn trong kỳ, cọc giữ/hoàn, phạt phát sinh/thanh toán; không chứa bảng Top |
| 2. Top 100 ấn phẩm mượn nhiều | SQL riêng lọc `borrowed_date >= start AND borrowed_date < end`, gom nhóm theo ấn phẩm, lượt mượn giảm dần, mã ấn phẩm tăng dần khi bằng lượt; `LIMIT 100` | STT, Mã ấn phẩm, Tên ấn phẩm, Số lượt mượn trong kỳ; không dùng danh sách Top 10 của dashboard |
| 3. Đang mượn và quá hạn | Tất cả `BORROWING` / `OVERDUE` tại lúc xuất, không giới hạn ngày mượn | STT, MSSV, họ tên, barcode, tên sách, ngày mượn, hạn trả, trạng thái tính theo hạn thực tế, ngày quá hạn, cọc giữ, số lần gia hạn |
| 4. Sách đã trả trong kỳ | `returned_date` trong khoảng ngày | STT, MSSV, họ tên, barcode, tên sách, ngày mượn/trả, người tiếp nhận, tình trạng khi trả, cọc hoàn, phí trễ/hỏng |
| 5. Đối soát cọc và phí | Ngày sự kiện cọc, ngày tạo phạt, ngày thanh toán phạt trong kỳ | Mã biên lai/GD, thời gian, MSSV, loại sự kiện, số tiền, hình thức nếu có bằng chứng, thủ thư nếu đã ghi nhận, ghi chú |
| 6. Bạn đọc cần theo dõi | Có sách quá hạn, nợ `UNPAID` hoặc tín nhiệm dưới 100 tại lúc xuất | MSSV, họ tên, khoa, email, SĐT, sách quá hạn, nợ phạt, tín nhiệm; không giới hạn Top 20 như dữ liệu bảng cũ |

Toàn bộ cell của cả 6 sheet dùng **Times New Roman**: font mặc định, body, numeric và header. Dòng tiêu đề bảng có nền xanh lá **#15803D**, chữ trắng đậm, border và wrap text. Tự điều chỉnh độ rộng có giới hạn, auto-filter, A4 ngang và không ép toàn bộ dữ liệu vào một trang in. Số tiền là cell số để cộng/lọc; MSSV, barcode và mã định danh là text để giữ số 0 đầu và tránh mất độ chính xác TSID. Nội dung người dùng bắt đầu bằng `=` vẫn là text, không trở thành công thức Excel.

**Chỉ ghim dòng tiêu đề cột:** tiêu đề cột nằm ngay dòng 1, dữ liệu từ dòng 2, `createFreezePane(0, 1)`. Không còn 5 dòng thông tin chung phía trên chiếm chỗ khi cuộn. Tiêu đề báo cáo, kỳ ngày, thời điểm xuất và người lập chuyển vào **Header trang in**; ghi chú nghiệp vụ chuyển vào **Footer trang in**, đều dùng Times New Roman. Để xem các thông tin này, dùng Page Layout / Print Preview (không hiển thị ở chế độ Normal). Dòng tiêu đề cột lặp lại khi in, auto-filter bắt đầu tại dòng 1.

### Định nghĩa KPI và giới hạn lịch sử

- **Trả đúng hạn** = lượt trả có ngày trả theo giờ Việt Nam không sau hạn trả / tổng lượt trả trong kỳ × 100. Không dùng tỷ lệ trả/mượn. Khi không có lượt trả, trả 0%.
- **Quá hạn trong kỳ** = giao dịch đã giao sách, hạn trả thuộc kỳ, hạn đã qua tại lúc xuất và không trả hoặc trả muộn. Không có nghĩa “đang quá hạn hiện tại” hay “số khoản phạt quá hạn tạo trong kỳ”.
- **Cọc giữ** = tổng `deposit_amount` của giao dịch còn `deposit_status = COLLECTED` tại lúc xuất.
- Công nợ và số sách quá hạn được tổng hợp độc lập theo bạn đọc để không nhân số tiền phạt lên theo số sách đang mượn.
- Hệ thống hiện **chưa lưu snapshot tình trạng sách khi trả**. Sheet 4 ghi **Chưa ghi nhận**, không lấy tình trạng hiện tại của bản sao để giả định lịch sử. Chưa phân biệt được “Mất trang” với các hư hỏng khác.
- Chưa có trường lớp trong hồ sơ: xuất khoa, không tự tạo lớp.
- Khoa trong Sheet 6 và API print được chuyển từ enum bằng `FacultyEnum.getName()` sang tên Việt có dấu (ví dụ **Khoa Điện - Điện tử**). Null/rỗng ghi **Chưa ghi nhận**; mã lạ giữ nguyên, không làm lỗi báo cáo. PDF dùng `facultyLabel` hỗ trợ cả mã enum lẫn tên Việt backend đã chuyển, và dịch sang tiếng Anh khi chọn `en`.
- Từ migration V60, thu cọc khi giao sách lưu `payment_method`: Sheet 5 ghi **Tiền mặt** hoặc **Chuyển khoản** theo sự kiện; cấn cọc ưu tiên **Trừ cọc**. Dữ liệu cọc lịch sử và sự kiện hoàn cọc chưa có lựa chọn riêng nhận mặc định kỹ thuật CASH, không phải bằng chứng xác minh phương thức thực tế. Thu phạt chỉ ghi **Chuyển khoản (PAYOS)** khi có order `PAID` liên kết khoản phạt; trường hợp không có bằng chứng vẫn chưa ghi nhận. Thủ thư của sự kiện chỉ lấy ID thực đã lưu. Xem [DEPOSIT_PAYMENT_METHOD.md](DEPOSIT_PAYMENT_METHOD.md).
- `fine_amount` có thể bị chỉnh sửa hoặc giảm khi cấn cọc một phần; hệ thống chưa có snapshot số phạt gốc và phân bổ cấn cọc theo từng fine. Vì vậy “Phạt phát sinh” và cột phí đã trả phản ánh **số tiền hiện đang lưu**, không bảo đảm tái dựng chính xác số tiền gốc tại thời điểm phát sinh.
- **Phí đã thanh toán có thể bao gồm cấn cọc**, không đồng nghĩa tiền mặt mới thu. Sheet 5 là nhật ký đối soát, chứa cả phát sinh công nợ, thanh toán và cấn cọc; **không cộng toàn bộ các dòng thành doanh thu**. Ghi chú này có trên file xuất.

## Bản in A4

Hai phần trang A4 theo CSS: header đơn vị/quốc hiệu/logo, kỳ/người lập/thời điểm, 9 KPI và Top 10; phần tiếp theo gồm tối đa 10 bạn đọc ưu tiên cùng hai ô ký Người lập biểu và Trưởng bộ phận thư viện. Ưu tiên quá hạn, nợ phạt, rồi điểm tín nhiệm. Các dữ liệu tồn là hiện tại, không phải snapshot cuối kỳ lịch sử.

Preview dùng iframe không cho chạy script, escape dữ liệu động trước khi tạo HTML, hỗ trợ đóng tại chỗ. CSS in dùng A4 và ngắt trang; số trang thực tế còn phụ thuộc dữ liệu dài và thiết lập máy in/trình duyệt. Không gọi dịch vụ PDF bên ngoài và không điều hướng trang hiện tại.

## Kiểm tra

```powershell
# Tại LMS_BE
mvn -pl library-circulation-module -am test
# Test SQL riêng trong PostgreSQL cô lập, cần Docker hoạt động
mvn -pl library-bootstrap -am test '-Dtest=DashboardReportSqlIntegrationTest' '-Dsurefire.failIfNoSpecifiedTests=false'

# Tại LMS_FE
npm test
npx tsc --noEmit
npm run build
```

Unit test kiểm tra workbook 6 sheet, Times New Roman cho mọi cell, nền xanh #15803D/chữ trắng đậm, chỉ ghim/lặp dòng 1, metadata/ghi chú trong Header/Footer trang in, KPI không chứa Top, truy vấn Top 100 riêng với khoảng ngày và 100 dòng, tiền dạng số, TSID text, tỷ lệ đúng hạn, giới hạn dòng, MIME/tên file và danh tính người lập. FE kiểm tra tải Excel/preview, lỗi API không sinh báo cáo giả, đóng preview không tải lại trang, A4/ký tên, giới hạn Top 10 và escape HTML. **PDF vẫn giữ Top 10** để bản in gọn; nâng lên Top 100 chỉ áp dụng cho Excel.

`DashboardReportSqlIntegrationTest` kiểm tra biên 23:59–00:00 theo giờ Việt Nam, sách đang mượn từ kỳ cũ, công nợ không nhân theo số sách, lọc ngày sự kiện và bằng chứng chuyển khoản. Test dùng Testcontainers `disabledWithoutDocker`: tự **skip** nếu Docker không hoạt động, không kết nối cơ sở dữ liệu thật.

Kiểm tra thủ công trước triển khai: đăng nhập Thủ thư, xuất dữ liệu có cả cấn cọc/thu chuyển khoản, so với giao dịch thật; mở workbook bằng Excel/LibreOffice; mở Print Preview trên trình duyệt triển khai, bật A4, tắt header/footer của trình duyệt và kiểm tra chữ ký/logo/ngắt trang. Do chứa thông tin liên hệ và tài chính bạn đọc, chỉ lưu/chia sẻ file theo quyền nội bộ thư viện.

### Kết quả chạy tại môi trường phát triển

- FE: toàn bộ Jest, TypeScript và Vite production build đã chạy thành công. Vite còn cảnh báo kích thước chunk chính trên 500 kB (không phải lỗi build).
- Circulation và các module phụ thuộc: test chạy thành công.
- Chạy `mvn test` toàn backend: các test không cần Docker chạy thành công; `BorrowFlowIntegrationTest` cũ báo lỗi vì Docker daemon chưa hoạt động. Các test PostgreSQL có `disabledWithoutDocker`, gồm 3 test SQL báo cáo mới, bị skip. Không sửa hoặc tắt test cũ để che lỗi môi trường.
- Chưa xác nhận bằng thao tác đăng nhập/in thật; cần hoàn thành checklist thủ công trên khi backend và trình duyệt triển khai sẵn sàng.

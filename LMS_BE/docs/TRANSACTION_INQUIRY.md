# Trung tâm tra cứu lưu thông và vòng đời sách

## Phạm vi nâng cấp

Trang `LMS_FE/pages/librarian_pages/TransactionList.tsx` giữ nguyên route hiện hữu,
ủy quyền hiển thị cho các component trong `components/librarian_pages/inquiry/`.
Giao diện gồm ba góc nhìn nghiệp vụ, song ngữ Vi/En qua `LanguageContext`, có style light/dark.
Đây là nơi tra cứu và bàn giao ghi chú; không đưa mượn/trả/gia hạn/thu hoặc sửa phí vào bảng.
Các nghiệp vụ tài chính và lưu thông vẫn ở trang Lưu thông.

## 1. Nhật ký giao dịch

- Tìm tên ấn phẩm, tên bạn đọc, MSSV, barcode hoặc mã giao dịch.
- Lọc trạng thái giao dịch, trạng thái phạt, ngày mượn hoặc ngày trả, khoảng ngày.
- Sắp theo ngày tạo/mượn/trả/hạn trả/phí, có chiều tăng/giảm, phân trang phía server.
- Bảng có ảnh bìa, tên sách, barcode, thông tin bạn đọc, ba mốc ngày, cọc/phạt và trạng thái.
- Ghi chú chỉ hiện biểu tượng/nhãn quan trọng và tooltip, không còn cột soạn ghi chú cồng kềnh.
- Bấm dòng hoặc nút Xem chi tiết mở Drawer; bấm tên sách/barcode mở Quick View riêng,
  không lan sự kiện sang dòng. Có nút để thao tác bằng bàn phím, không chỉ dựa vào click dòng.
- Tên sách và bản sao có link tab mới với `target="_blank"`, `rel="noopener noreferrer"`.

### Drawer chi tiết giao dịch

- Hiển thị thời điểm tạo, bàn giao, hạn trả hiện tại, nhận trả cùng thủ thư cấp phát/thu nhận.
- Hiển thị đầy đủ trường quyết toán: cọc, trạng thái cọc, phạt gốc quyết toán, cấn cọc, hoàn cọc, thu thêm.
- Bảng kê từng khoản phạt: ID, loại vi phạm, số tiền, trạng thái, ngày tạo/thanh toán và người thu riêng.
  Không tự gọi ID khoản phạt là số biên lai. Trường người thu tổng hợp của API cũ vẫn được giữ tương thích;
  khi có nhiều khoản, phải dùng bảng kê trong Drawer để đối soát đủ người thu.
- Ghi chú là danh sách theo thời gian; cho nhập nội dung và đánh dấu quan trọng.
- Giữ quyền xóa ghi chú riêng qua `editableByCurrentUser` và kiểm tra chủ sở hữu ở API hiện có.
- “Bổ sung từ ghi chú này” sao chép nội dung vào bản nháp, lưu thành ghi chú mới.
  Đây là hành vi thêm ghi chú của hệ thống hiện hữu, không giả định có API sửa nội dung từng note.
- Drawer tải chi tiết và ghi chú khi mở, không nạp toàn bộ chi tiết cho tất cả dòng danh sách.
- Đóng bằng nút, Escape hoặc nền ngoài; giữ focus trong Drawer và khôi phục focus khi đóng.
- Đóng/mở Drawer và đổi cơ sở/trang trong Quick View dùng state nội bộ, không thay đổi URL.
  Các tham số `transactionId`/`highlight` và `quick*` chỉ khởi tạo Drawer khi vào trang.
  Khôi phục focus với `preventScroll`; Layout giữ nguyên DOM và vị trí cuộn khi query thay đổi.
  Cơ chế ScrollToTop chỉ chạy khi chuyển sang pathname khác.

## 2. Tra cứu bạn đọc

- Gợi ý tìm kiếm theo MSSV hoặc tên, tối đa 20 kết quả; có tên và MSSV để phân biệt người trùng tên.
- Chọn kết quả bằng `userId`, không dùng tên làm bộ lọc lịch sử.
- Tái sử dụng API hồ sơ hiện có để hiển thị tín nhiệm, số đang mượn và tổng nợ phạt.
- Bảng đang mượn gồm `BORROWING`/`OVERDUE`, lọc theo ngày mượn.
- Bảng đã trả gồm `RETURNED`, lọc theo ngày trả.
- Hai bảng có khoảng ngày và trang riêng, đều truy vấn/phân trang phía server.
- Bên dưới hai bảng có Gợi ý sách AI, tải qua `getReaderRecommendationsForLibrarian(userId, faculty, 4)` sau khi hồ sơ đã có dữ liệu.
  Thẻ sách hiển thị ảnh bìa, tên, tác giả, năm xuất bản, bản sao có sẵn, đánh giá nếu có và link chi tiết mở tab mới.
  Hỗ trợ Việt/Anh, light/dark, trạng thái tải/lỗi/rỗng; bỏ qua kết quả cũ khi chuyển bạn đọc.

## 3. Vòng đời đầu sách và bản sao

- Tìm tên sách để chọn đầu sách và xem danh sách bản sao.
- Barcode được tra cứu chính xác; quét/nhập rồi xác nhận sẽ chọn thẳng đầu sách, bản sao và cơ sở tương ứng.
- Bộ lọc cơ sở áp dụng tổng quan và danh sách bản sao. Barcode xác định chính xác cơ sở của cuốn đang tra cứu.
- Tổng quan tách tổng, có sẵn không chờ cất, chờ cất, đang mượn, giữ chờ nhận, bảo trì và mất.
- `AVAILABLE` có task `WAITING` là chờ cất kệ; `AVAILABLE` không có task `WAITING` chỉ gọi
  “Có sẵn, không chờ cất”, không khẳng định vị trí vật lý đã được kiểm chứng trên kệ.
- Mỗi bản sao hiện barcode, cơ sở, vị trí, trạng thái, tình trạng hiện tại, bạn đọc đang giữ và hạn trả.
- Chọn bản sao mở timeline của riêng bản sao đó; không trộn vòng đời tất cả bản sao cùng đầu sách.
- Timeline phân trang và sắp mới nhất trước, có thứ tự phụ ổn định bằng ID sự kiện.

### Nguồn timeline thực tế

| Mốc | Nguồn |
|---|---|
| Nhập kho | `items.acquired_date`, chỉ độ chính xác ngày; null thì không tạo mốc |
| Tạo yêu cầu | `borrowing_transactions.created_at` |
| Bàn giao | `borrowed_date`, `librarian_id_issue` |
| Nhận trả | `returned_date`, `librarian_id_return` |
| Phát sinh/thanh toán phạt | `fines.created_at`, `paid_date`, loại/số tiền và người thu |
| Vào hàng chờ cất | `reshelving_tasks.queued_at`, nguồn giải phóng/trả/phục hồi |
| Xác nhận cất | `shelved_at`, `shelved_by_librarian_id`; chỉ khi có thời điểm xác nhận |
| Ghi chú | `transaction_notes.created_at`, nội dung và thủ thư |

Không tạo lịch sử bảo trì/tình trạng khi chưa có dữ liệu. Không dùng trạng thái giao dịch hiện tại
hoặc hạn trả đã gia hạn làm snapshot cho thời điểm yêu cầu/bàn giao trước đây.
Số tiền phạt và nội dung ghi chú phản ánh bản ghi đang lưu; không phải lịch sử phiên bản điều chỉnh.
Các bản sao cũ thiếu ngày nhập kho hoặc thiếu lịch sử cất kệ không được backfill giả.

## 4. URL là nguồn trạng thái tra cứu

| Góc nhìn | Query parameters |
|---|---|
| Chung | `tab=transactions|reader|lifecycle`, `transactionId` cho Drawer giao dịch |
| Nhật ký | `keyword`, `status`, `fineStatus`, `dateType=BORROWED|RETURNED`, `dateFrom`, `dateTo`, `sortBy`, `sortDir`, `page` |
| Bạn đọc | `readerKeyword`, `userId`, `activePage`, `activeFrom`, `activeTo`, `returnedPage`, `returnedFrom`, `returnedTo` |
| Vòng đời | `bookKeyword`, `barcode`, `branch`, `pubId`, `itemId`, `itemPage`, `timelinePage` |
| Quick View | `quickPubId`, `quickItemId`, `quickBranch`, `quickPage` |

F5, back/forward và link đối soát giữ đối tượng, bộ lọc và trang đang xem.
Đổi bộ lọc reset trang của bảng tương ứng; giữ query không liên quan như `source`.
Gõ tìm kiếm chỉ cập nhật state ô nhập, không cập nhật URL hay gửi request tự động.
Nhấn Enter mới đồng bộ từ khóa vào URL bằng replace, reset trang và gửi request tìm kiếm;
barcode hỗ trợ Enter hoặc nút Tra cứu. Khi đổi đối tượng/bộ lọc, response cũ bị bỏ qua.
URL `highlight` hiện hữu vẫn mở giao dịch tương ứng; không làm mất các link từ Dashboard.
ID giữ ở dạng chuỗi trên FE/JSON để không mất độ chính xác TSID.

Ví dụ:

```text
?tab=transactions&keyword=Java&dateType=RETURNED&dateFrom=2026-10-01&dateTo=2026-10-03&page=2
?tab=reader&userId=105&activePage=0&returnedPage=1&returnedFrom=2026-10-01
?tab=lifecycle&pubId=22&itemId=123&itemPage=0&timelinePage=1
```

## 5. Backend và hợp đồng API

Tất cả endpoint mới yêu cầu vai trò `LIBRARIAN`, chỉ GET, không thay đổi dữ liệu.
Service `CirculationInquiryService` là read model, transaction read-only.

### API giao dịch hiện hữu

- `GET /api/v1/transactions`: thêm `dateType` (mặc định BORROWED), `userId`, `scope=ACTIVE|RETURNED` tùy chọn.
- Response bổ sung `itemId`, `publicationId`, `publicationTitle`, `coverImageUrl`, `authors`, `branch`, `location`.
- JOIN tác giả bằng LATERAL aggregate theo tên/ID, không nhân số dòng, không cần `author_order` mới.
- `dateFrom`: đầu ngày Việt Nam; `dateTo`: đầu ngày kế tiếp, so sánh `<`, bao gồm trọn ngày cuối.
- Ngày sai, khoảng đảo hoặc dateType không hợp lệ trả HTTP 400; cột ngày và sắp xếp dùng whitelist.
- Giới hạn page size 1–100, offset dùng long, thứ tự phụ `t.id DESC` để tránh trôi trang khi ngày trùng.
- Overload use case `execute` cũ được giữ, mặc định ngày mượn, để tương thích code đang gọi.
- `GET /api/v1/transactions/items/{id}` giữ đường dẫn/phân trang và dùng cùng read query,
  trả thông tin sách/cọc/phạt đầy đủ thay cho projection bản sao trước đây.

### API tra cứu mới, tiền tố `/api/v1/librarians/inquiry`

| GET | Chức năng |
|---|---|
| `/readers?keyword=...` | Gợi ý bạn đọc |
| `/publications?keyword=...&branch=...` | Gợi ý đầu sách, có tìm barcode |
| `/publications/{id}?branch=...&page=0&size=10` | Thông tin đầu sách, counts và trang bản sao |
| `/items/barcode?barcode=...` | Tra cứu bản sao bằng barcode chính xác |
| `/items/{id}` | Thông tin bản sao/đầu sách và người đang mượn |
| `/items/{id}/timeline?page=0&size=20` | Trang sự kiện thực tế của bản sao |
| `/transactions/{id}` | Chi tiết giao dịch và từng khoản phạt |

`branch` là tên đầy đủ `Cơ sở 1 - Lý Thường Kiệt` hoặc `Cơ sở 2 - Dĩ An`;
bỏ query để xem tất cả, chuỗi khác bị từ chối. Đây là bộ lọc, không phải chính sách phân quyền cứng theo cơ sở.
Không tìm thấy đối tượng của API chi tiết/timeline/barcode trả HTTP 404.
Phân trang cùng envelope `ApiResponseApp`/`PageResponse` hiện có.
Các ngày trong read model được chuyển sang chuỗi ISO. Mốc nhập kho được neo đầu ngày Việt Nam
để sắp xếp, nhưng có `dateOnly=true` và chỉ hiển thị ngày, không tuyên bố có giờ nhập kho chính xác.

Không tạo migration hoặc bảng bảo trì/condition history. Cần database đã có các migration hiện hữu
cho metadata vật lý, người thu phạt, quyết toán cọc, ghi chú và `reshelving_tasks` (V59).

## 6. Kiểm thử và bàn giao

- Unit test SQL query: title/author aggregate, ngày trả, múi giờ/trọn ngày cuối, reader ID,
  phân trang ổn định, size clamp, dateType/ngày sai, giữ mặc định API cũ.
- Unit test inquiry: gợi ý rỗng không scan toàn bảng, cơ sở sai, đối tượng không tồn tại,
  timeline thực tế và phân trang.
- Controller test: barcode/TSID chuỗi, trang timeline, mọi endpoint mới có `RequiresRole` và GET.
- FE test: URL đầy đủ, reset trang và giữ tham số khác, Quick View không mở nhầm giao dịch,
  link tab mới, chi tiết người thu, thêm note, reader ID/phân trang độc lập, quét barcode,
  deep link vòng đời, nhãn tiếng Anh và response cũ không ghi đè kết quả mới.
- Integration `CirculationInquirySqlIntegrationTest`: PostgreSQL riêng do Testcontainers tạo;
  nhiều tác giả/phạt không nhân dòng, ngày trả trọn ngày cuối, phân cơ sở/chờ cất,
  bảng kê nhiều người thu và UNION timeline.

Lệnh kiểm tra:

```powershell
# Trong LMS_BE
mvn '-Dmaven.repo.local=C:\Users\thang\.m2\repository' test -pl '!library-bootstrap'
mvn '-Dmaven.repo.local=C:\Users\thang\.m2\repository' test -pl library-bootstrap -am '-Dtest=CirculationInquirySqlIntegrationTest' '-Dsurefire.failIfNoSpecifiedTests=false'
# Trong LMS_FE
npm test
npx tsc --noEmit
npm run build
```

Nếu Docker không chạy, integration bị SKIPPED: không tính là đã PASS SQL thật.
Không kiểm tra/ghi trực tiếp database production trong task này.
Sau triển khai cần đăng nhập thủ thư kiểm tra ba tab, thao tác bàn phím, F5/back/forward,
hai cơ sở, người trùng tên, sách nhiều tác giả, nhiều người thu phạt và barcode không tồn tại.

### Kết quả kiểm tra ngày 03/10/2026

| Kiểm tra | Kết quả |
|---|---|
| Backend các module nghiệp vụ, không gồm bootstrap integration | 166 tests PASS, 0 lỗi, 0 skip |
| Frontend | 24 suites / 116 tests PASS |
| TypeScript `npx tsc --noEmit` | PASS |
| Vite production build | PASS; còn cảnh báo chunk lớn >500 KB hiện hữu |
| Integration PostgreSQL mới | 4 tests SKIPPED vì Docker không khả dụng; không kết luận PASS SQL thực tế |
| `git diff --check` | PASS |

Chưa chạy kiểm tra trực tiếp bằng tài khoản thủ thư trên trình duyệt hoặc kiểm thử hiệu năng
với database lớn. Không sửa/xóa test cũ để đạt PASS; bổ sung bộ test tra cứu riêng.

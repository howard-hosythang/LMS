# Xếp giá sách: trả sách, giải phóng giữ sách và tìm lại sách mất

> Tài liệu tổng kết task cất kệ sách cho Thủ thư, cập nhật ngày **03/10/2026**.
> Nội dung mô tả code đã hiện thực, không phải xác nhận đã triển khai lên database
> hoặc production. Kết quả kiểm thử bên dưới là kết quả của lượt triển khai gần
> nhất; lần cập nhật tài liệu này không thay đổi code nghiệp vụ.

## Mục lục

- [1. Mục tiêu và kết quả](#1-mục-tiêu-và-kết-quả)
- [2. Hướng dẫn cho thủ thư](#2-hướng-dẫn-cho-thủ-thư)
- [3. Dữ liệu và nghiệp vụ](#3-dữ-liệu-và-nghiệp-vụ)
- [4. Ma trận tình huống đã rà soát](#4-ma-trận-tình-huống-đã-rà-soát)
- [5. API và phân quyền](#5-api-và-phân-quyền)
- [6. Giao diện và vận hành](#6-giao-diện-và-vận-hành)
- [7. Chi tiết xử lý backend](#7-chi-tiết-xử-lý-backend)
- [8. Danh sách file liên quan](#8-danh-sách-file-liên-quan)
- [9. Kiểm thử và kết quả](#9-kiểm-thử-và-kết-quả)
- [10. Triển khai và kiểm tra sau triển khai](#10-triển-khai-và-kiểm-tra-sau-triển-khai)
- [11. Báo cáo và đối soát](#11-báo-cáo-và-đối-soát)
- [12. Giới hạn và hướng phát triển](#12-giới-hạn-và-hướng-phát-triển)

## 1. Mục tiêu và kết quả

### Vấn đề ban đầu

Sách đã trả hoặc không được độc giả đến nhận có thể còn nằm ở quầy, xe đẩy hoặc
khu giữ sách. Trạng thái cho phép mượn không mô tả được công việc mang sách về
kệ. Nếu chỉ nhìn lịch sử giao dịch, ca sau khó biết còn bao nhiêu sách cần cất.

### Những phần đã hiện thực

- Thêm tab **Xếp giá sách** trong màn hình **Lưu thông** của thủ thư, có badge số
  sách đang chờ cất; đặt sau tab Trả sách và trước tab Tìm lại sách mất.
- Thêm widget **Sách chờ cất kệ** trên Dashboard, dẫn thẳng đến tab này.
- Lưu hàng chờ ở database, không phụ thuộc máy tính, phiên đăng nhập hay ca trực.
- Mặc định chọn tất cả; cho phép chọn từng cuốn, in phiếu A4, xác nhận toàn bộ
  các cuốn được chọn sau khi thực sự đã cất.
- Lưu thời điểm, người xác nhận và audit log; không thay đổi người/giờ cất khi
  xác nhận lặp.
- Đưa sách trả bình thường vào hàng chờ; không đưa sách giữ cho người đặt trước,
  sách hỏng/mất vào kệ chung.
- Tự đóng công việc chờ khi sách được mượn/giữ tiếp hoặc chuyển sang trạng thái
  khác không còn `AVAILABLE`.
- Bổ sung xử lý không đến nhận, hủy đặt trước đã giữ sách và tìm lại sách mất.
- Chặn giao sách quá hạn nhận và kiểm tra lại dữ liệu sau khi khóa để giảm rủi
  ro xử lý đồng thời giữa thủ thư và scheduler.
- Thêm nhãn lý do song ngữ trên danh sách và phiếu in; phân biệt sách trả với
  sách được giải phóng khỏi lượt giữ.
- Bổ sung test và tài liệu nghiệp vụ, API, triển khai, các giới hạn chưa xử lý.

### Hai giai đoạn thiết kế

1. **V58 — theo từng lượt trả:** thêm ba trường vào `borrowing_transactions`,
   phục vụ sách trả và lịch sử cất kệ của lượt trả đó.
2. **V59 — bao quát các nguồn công việc:** thêm `reshelving_tasks` vì đặt trước
   hết hạn/hủy có thể chưa có giao dịch mượn. Tab, badge, xác nhận và Dashboard
   chuyển sang đọc bảng công việc; ba trường V58 vẫn được đồng bộ cho báo cáo
   sách trả. Không sửa nội dung migration V58 để thay thế thiết kế đã có.

## 2. Hướng dẫn cho thủ thư

### Cuối ca hoặc khi giỏ tại quầy đã đầy

1. Vào **Lưu thông → Xếp giá sách**, hoặc bấm **Sách chờ cất kệ** trên Dashboard.
   Kiểm tra dropdown cơ sở đúng nơi đang trực; mặc định lấy cơ sở được Admin gán.
   Nếu đang xem Tất cả cơ sở, phải chọn CS1 hoặc CS2 trước khi xác nhận cất kệ.
2. Kiểm tra danh sách và đối chiếu barcode với sách thực tế ở quầy/khu giữ sách.
3. Danh sách mặc định chọn tất cả. Bỏ chọn các cuốn chưa định cất trong lượt này.
4. Bấm **In phiếu A4** để có danh sách kẻ bảng, ô đánh dấu và vị trí kệ; có thể
   chọn **Save as PDF** trong hộp thoại in của trình duyệt.
5. Đi cất sách, đánh dấu những cuốn đã hoàn thành. Sách đang `RESERVED` cần giữ
   riêng cho người nhận, không mang lên kệ chung.
6. Quay lại màn hình, chỉ chọn đúng các cuốn thực sự đã cất.
7. Bấm **Xác nhận đã cất (N)**, đọc hộp thoại xác nhận và đồng ý.
8. Danh sách làm mới. Các cuốn đã xác nhận biến mất khỏi hàng chờ, badge và
   Dashboard phản ánh số còn lại khi làm mới dữ liệu.

### Xử lý các thông báo

- **Không có sách đang chờ cất kệ:** hàng chờ tải thành công và đang trống.
- **Lỗi tải dữ liệu:** không được hiểu là giỏ đã trống. Kiểm tra kết nối, đăng
  nhập và migration backend; bấm **Làm mới**. Nút in/xác nhận bị vô hiệu khi có lỗi.
- **Một số sách đã được xử lý hoặc không còn ở giỏ chờ cất:** có thể ca khác đã
  xác nhận hoặc sách được mượn/giữ tiếp. Hệ thống chỉ xác nhận số còn hợp lệ.
- **Popup bị chặn:** cho phép cửa sổ bật lên để mở phiếu in.
- **Chưa có vị trí:** hệ thống vẫn liệt kê cuốn sách; thủ thư phải xác định vị
  trí đúng trước khi cất. Tính năng không tự tạo vị trí kệ.

**In phiếu không đồng nghĩa đã cất.** Chỉ thao tác xác nhận mới ghi `SHELVED`.
Không có nút hoàn tác cất kệ trong phạm vi task này; cần kiểm tra kỹ trước khi
xác nhận thay vì sử dụng nút đó như thao tác dọn danh sách.

## 3. Dữ liệu và nghiệp vụ

Flyway V58 bổ sung vào `borrowing_transactions` (giữ nguyên cho báo cáo lượt trả):

- `reshelving_status`: `WAITING`, `SHELVED`, `NOT_REQUIRED`.
- `shelved_at`: thời điểm xác nhận cất lên kệ.
- `shelved_by_librarian_id`: thủ thư đang đăng nhập đã xác nhận.

Flyway **V59** bổ sung `reshelving_tasks` làm hàng chờ công việc chung. Việc cất
kệ không nhất thiết phát sinh từ trả sách: đặt trước bị hủy/hết hạn có thể chưa
có giao dịch mượn. Không tạo giao dịch `RETURNED` giả cho những trường hợp này.

Mỗi công việc có ID riêng, bản sao, nguồn phát sinh, thời điểm vào hàng chờ,
trạng thái, người/thời điểm xác nhận, và tham chiếu đến giao dịch hoặc đặt trước.
Nguồn gồm `RETURN`, `PICKUP_EXPIRED`, `RESERVATION_EXPIRED`,
`RESERVATION_CANCELLED`, `LOST_RECOVERED`. Một bản sao có tối đa một công việc
`WAITING`. Công việc đã kết thúc không được mở lại để dùng cho sự kiện khác.

V59 chuyển các lượt V58 đang `WAITING` và đã `SHELVED` sang bảng công việc,
giữ nguyên thời gian/người cất. Các giao dịch lịch sử `NOT_REQUIRED` không được
suy đoán là còn ở giỏ. Không tự backfill các lượt giữ sách đã hết hạn từ trước.

Trigger trên `items.status` tự đóng công việc `WAITING` thành `NOT_REQUIRED` khi bản
sao rời trạng thái `AVAILABLE`, bao gồm mượn trực tiếp, giữ cho đặt trước và bảo
trì. Trigger không ghi thời điểm cất giả và không xóa lịch sử đã `SHELVED`.

Xác nhận cất kệ khóa các bản sao trước khi cập nhật công việc, chỉ cập nhật các
ID được chọn vẫn đang `WAITING` và có bản sao `AVAILABLE`. ID đã
được xử lý hoặc không còn hợp lệ được bỏ qua; gọi lại không thay đổi thời điểm
và người cất. Các cập nhật thực sự được ghi audit `CONFIRM_RESHELVING`.
Nếu nguồn là `RETURN`, ba trường V58 được đồng bộ để phục vụ báo cáo trả sách.
Với nguồn khác, không sửa trạng thái giao dịch/đặt trước hay lượt trả cũ.

**`AVAILABLE` nghĩa là có thể cho mượn, không có nghĩa là đã được cất trên kệ.**
Giữ sách online cũng chưa chứng minh sách đã được nhân viên mang khỏi kệ.
Hàng chờ giải phóng giữ sách vì vậy là nhắc việc thận trọng: thủ thư kiểm tra
vị trí thực tế rồi xác nhận, không tự ghi `SHELVED` theo suy đoán.

### Phân biệt các loại trạng thái độc lập

| Loại | Trường/bảng | Trả lời câu hỏi |
|---|---|---|
| Giao dịch mượn | `borrowing_transactions.status` | Độc giả đang chờ nhận, đang mượn, đã trả hay đã hủy? |
| Đặt trước | `reservations.status` | Đang đợi sách, đã có sách giữ, đã nhận, đã hủy hay hết hạn? |
| Bản sao | `items.status` | Bản sao có thể cho mượn, đang giữ, đã mượn, hỏng hay mất? |
| Công việc xếp giá | `reshelving_tasks.status` | Còn cần cất, đã được xác nhận cất, hay không còn cần cất? |

Trạng thái vật lý trên kệ không được suy ra trực tiếp từ trạng thái mượn. Xác
nhận cất kệ không đổi `items.status`, không làm giao dịch hết hạn thành giao
dịch trả và không biến đặt trước hết hạn thành đặt trước đã nhận.

### Cấu trúc ba trường V58

| Trường | Kiểu | Giá trị/ý nghĩa |
|---|---|---|
| `reshelving_status` | `VARCHAR(20) NOT NULL` | Mặc định `NOT_REQUIRED`; cho phép `WAITING`, `SHELVED`, `NOT_REQUIRED` |
| `shelved_at` | `TIMESTAMPTZ(6)`, nullable | Thời điểm xác nhận cất của lượt trả |
| `shelved_by_librarian_id` | `BIGINT`, nullable | FK đến `users.id`; `ON DELETE SET NULL` |

V58 có CHECK ràng buộc `WAITING` phải là lượt `RETURNED` có `returned_date`;
`SHELVED` tương ứng có `shelved_at`. Unique index chỉ cho phép một lượt trả
`WAITING` trên mỗi bản sao. Các ràng buộc này không được nới lỏng để chứa những
giao dịch bị hủy chưa từng được mượn.

### Cấu trúc `reshelving_tasks` — V59

| Trường | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | `BIGINT PRIMARY KEY` | TSID công việc; frontend dùng chuỗi |
| `item_id` | `BIGINT NOT NULL` | FK bản sao cần cất |
| `transaction_id` | `BIGINT`, nullable | FK giao dịch nguồn cho trả, hết hạn mượn online, tìm lại sách mất |
| `reservation_id` | `BIGINT`, nullable | FK đặt trước nguồn cho hết hạn/hủy đặt trước |
| `user_id` | `BIGINT`, nullable | Độc giả liên quan; FK `ON DELETE SET NULL` |
| `source` | `VARCHAR(30) NOT NULL` | Một trong năm nguồn phát sinh |
| `status` | `VARCHAR(20) NOT NULL` | Mặc định `WAITING`; ba trạng thái xếp giá |
| `queued_at` | `TIMESTAMPTZ(6) NOT NULL` | Thời điểm vào hàng chờ; trả sách lấy `returned_date`, các nguồn khác mặc định `NOW()` |
| `shelved_at` | `TIMESTAMPTZ(6)`, nullable | Thời điểm xác nhận cất |
| `shelved_by_librarian_id` | `BIGINT`, nullable | Thủ thư xác nhận, FK `ON DELETE SET NULL` |
| `updated_at` | `TIMESTAMPTZ(6) NOT NULL` | Thời điểm cập nhật gần nhất |

Ràng buộc V59:

- CHECK giới hạn `source` và `status` đúng các giá trị cho phép.
- CHECK `SHELVED` tương ứng với `shelved_at` khác null.
- Các nguồn giao dịch phải có `transaction_id`, không có `reservation_id`;
  các nguồn đặt trước phải có `reservation_id`, không có `transaction_id`.
- Unique index trên `item_id` khi `status = 'WAITING'`.
- Unique index trên `(transaction_id, source)` cho các dòng có giao dịch nguồn.
- Unique index trên `(reservation_id, source)` cho các dòng có đặt trước nguồn.
- INSERT dùng `ON CONFLICT DO NOTHING` để không tạo việc trùng cho cùng sự kiện
  hoặc tạo thêm việc chờ khi bản sao đã có một việc chờ.

### Các nguồn phát sinh và nhãn hiển thị

| `source` | Tiếng Việt | English | Liên kết nguồn |
|---|---|---|---|
| `RETURN` | Sách trả | Returned book | Giao dịch đã trả |
| `PICKUP_EXPIRED` | Hết hạn nhận sách mượn | Borrow pickup expired | Giao dịch mượn online bị hủy do quá hạn |
| `RESERVATION_EXPIRED` | Hết hạn nhận đặt trước | Reservation pickup expired | Đặt trước hết hạn |
| `RESERVATION_CANCELLED` | Hủy giữ sách đặt trước | Reservation cancelled | Đặt trước đã giữ sách bị hủy |
| `LOST_RECOVERED` | Tìm lại sách mất | Lost book recovered | Giao dịch liên quan sách báo mất |

### Vòng đời công việc

```text
Sự kiện trả / giải phóng giữ / phục hồi sách dùng được
  → Ưu tiên người đặt trước tiếp theo
      → Có người nhận: RESERVED, không tạo việc cất kệ chung
      → Không có người nhận: AVAILABLE + công việc mới WAITING
          → Thủ thư xác nhận đã cất: SHELVED + thời gian + người xác nhận
          → Bản sao được mượn/giữ/hỏng/mất: NOT_REQUIRED, không ghi giờ cất
```

`SHELVED` và `NOT_REQUIRED` là lịch sử đã kết thúc. Lần giải phóng giữ sách
sau đó phải tạo một công việc mới từ sự kiện nguồn mới, không mở lại việc cũ.

## 4. Ma trận tình huống đã rà soát

| Tình huống | Giao dịch / đặt trước | Bản sao | Công việc cất kệ |
|---|---|---|---|
| Mượn online, chưa đến nhận | `WAITING_FOR_PICKUP` | `RESERVED` | Công việc chờ cũ → `NOT_REQUIRED`, không cất kệ chung |
| Đặt trước còn trong hàng đợi, chưa có bản sao | `PENDING` | Không thay đổi | Không tạo công việc |
| Đặt trước được gán bản sao | `READY_FOR_PICKUP` | `RESERVED` | Chờ cũ → `NOT_REQUIRED`, giữ cho người nhận |
| Giao sách đúng hạn, kể cả nhận đặt trước qua mượn trực tiếp | `BORROWING` / đặt trước `COMPLETED` | `BORROWED` | Không chờ cất; giữ lịch sử đã `SHELVED` |
| Hết hạn mượn online, không có người đặt trước tiếp | `CANCELLED` | `AVAILABLE` | Tạo `WAITING` mới, nguồn `PICKUP_EXPIRED` |
| Hết hạn nhận đặt trước, không có người tiếp | `EXPIRED` | `AVAILABLE` | Tạo `WAITING` mới, nguồn `RESERVATION_EXPIRED` |
| Hủy đặt trước chưa được gán sách | `CANCELLED` | Không thay đổi | Không tạo công việc vật lý |
| Hủy đặt trước đã giữ sách, không có người tiếp | `CANCELLED` | `AVAILABLE` | Tạo `WAITING` mới, nguồn `RESERVATION_CANCELLED` |
| Hủy/hết hạn và có người đặt trước tiếp phù hợp cơ sở | Lượt cũ kết thúc, lượt tiếp `READY_FOR_PICKUP` | `RESERVED` | Không tạo công việc chờ cất |
| Trả bình thường hoặc trễ hạn, không có người đặt trước | `RETURNED` | `AVAILABLE` | `WAITING`, nguồn `RETURN`; phí trễ hạn xử lý riêng |
| Trả sách và gán ngay cho người đặt trước | `RETURNED` | `RESERVED` | Lượt trả `NOT_REQUIRED`, không chờ cất chung |
| Mượn/giữ sách đang ở hàng chờ | Theo luồng mượn/giữ | `BORROWED` / `RESERVED` | Chờ cũ → `NOT_REQUIRED`, không ghi giờ cất giả |
| Báo hỏng/mất | Theo luồng báo sự cố hiện có | `IN_MAINTENANCE` / `LOST` | Không cất lên kệ chung |
| Tìm lại sách mất, sách còn hỏng | Không tạo lượt trả mới | `IN_MAINTENANCE` | Không tạo công việc |
| Tìm lại sách mất, sử dụng được, không có người đặt trước | Không tạo lượt trả mới | `AVAILABLE` | `WAITING`, nguồn `LOST_RECOVERED` |
| Tìm lại sách mất, sử dụng được và có người đặt trước | Lượt đặt trước tiếp `READY_FOR_PICKUP` | `RESERVED` | Không chờ cất; response trả trạng thái cuối `RESERVED` |
| Xác nhận từng phần / gọi lại / dữ liệu màn hình đã cũ | Không thay đổi nghiệp vụ mượn | Không thay đổi | Chỉ ID vẫn `WAITING` + `AVAILABLE` → `SHELVED`; còn lại bỏ qua |
| Gia hạn, thanh toán/điều chỉnh phí | Theo nghiệp vụ tương ứng | Không thay đổi | Không tác động công việc cất kệ |

### Hết hạn và đồng thời

Hai scheduler hết hạn hiện chạy mỗi **1 giờ** (`fixedDelay = 3_600_000`), không
chạy đúng tức thì tại hạn chót. Trước lượt scheduler tiếp theo, bản sao có thể
vẫn `RESERVED`; API giao sách sẽ từ chối khi đã quá hạn nhận (`3023`).
Mượn trực tiếp cũng không được dùng để nhận đặt trước đã hết hạn.

Scheduler khóa bản sao, rồi UPDATE có điều kiện kiểm tra lại trạng thái, bản
sao được gán và deadline. Nếu giao dịch đã được nhận/hủy hoặc deadline được
thay đổi thì không giải phóng bản sao. Giao sách và hủy đặt trước refresh dữ
liệu JPA dưới khóa trước khi xử lý để tránh dùng snapshot cũ. Sau giải phóng,
ưu tiên gán người tiếp theo trước khi tạo công việc cất kệ.

### Các nghiệp vụ chưa có trong backend

- Chưa có API hủy riêng cho yêu cầu **mượn online** đang chờ nhận; hệ thống hiện
  giải phóng loại này qua scheduler hết hạn. Hủy đặt trước đã được bao quát.
- Chưa có use case backend hoàn tất sửa chữa/bảo trì trong repository hiện tại.
  Khi bổ sung, cần tạo công việc riêng sau khi bản sao sử dụng được và không
  được gán cho người đặt trước, không mở lại lượt trả cũ. Không tự suy đoán từ
  dữ liệu `IN_MAINTENANCE` hiện có.
- Tạo bản sao mới, nhập kho, kiểm kê và di chuyển kệ không được tự coi là một
  lượt trả/giải phóng giữ sách; không thêm nghiệp vụ mới cho các luồng này.

## 5. API và phân quyền

- `GET /api/v1/librarians/reshelving`: danh sách, sắp theo cơ sở và vị trí kệ; nhận query `branch` tùy chọn.
- `GET /api/v1/librarians/reshelving/count`: `{ "count": 12 }`, cùng bộ lọc `branch` với danh sách.
- `GET /api/v1/librarians/reshelving/default-branch`: cơ sở mặc định từ `users.librarian_campus` của người đăng nhập.
- `POST /api/v1/librarians/reshelving/confirm` với
  `{ "taskIds": ["123", "456"], "branch": "Cơ sở 1 - Lý Thường Kiệt" }`: trả `updatedCount`, `skippedCount`.
  Tối đa 10.000 ID mỗi yêu cầu; ID sử dụng chuỗi ở frontend để không mất độ
  chính xác TSID. ID này là **ID công việc**, không phải ID giao dịch mượn.
  Response danh sách có `taskId`, `source`, `queuedAt`; MSSV là độc giả liên quan,
  không nhất thiết là người vừa trả sách. Người xác nhận lấy từ phiên đăng nhập.
- Dashboard summary bổ sung `pendingActions.reshelvingWaiting`.

### Danh sách hàng chờ

`GET /api/v1/librarians/reshelving`

Ví dụ response, các ID/nội dung bên dưới chỉ là dữ liệu minh họa:

```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "taskId": "894138910475063549",
      "barcode": "BC001",
      "publicationTitle": "Giải tích 1",
      "location": "A1",
      "branch": "Cơ sở 1 - Lý Thường Kiệt",
      "queuedAt": "2026-10-03T08:00:00Z",
      "studentId": "2213214",
      "fullName": "Độc giả minh họa",
      "source": "PICKUP_EXPIRED"
    }
  ]
}
```

Điều kiện truy vấn: `reshelving_tasks.status = 'WAITING'` và
`items.status = 'AVAILABLE'`. Join ấn phẩm để lấy tên, left join người dùng để
lấy MSSV/tên. Query `branch` giới hạn theo `items.branch`; bỏ query để xem tất cả cơ sở.
Không lọc theo ngày trả hoặc người tạo công việc: vẫn bao gồm tồn từ ngày/ca trước tại cơ sở đã chọn.

Thứ tự hiện tại: **cơ sở ASC → vị trí ASC (null cuối) → thời điểm vào hàng chờ
DESC → ID ASC**. Sắp xếp vị trí là thứ tự chuỗi của database, chưa phải natural
sort cho mã kệ chứa số, ví dụ `A1`, `A10`, `A2`.

### Số lượng hàng chờ

`GET /api/v1/librarians/reshelving/count`

```json
{
  "code": 200,
  "message": "Success",
  "data": { "count": 12 }
}
```

Dashboard summary vẫn trả tổng chung qua `data.pendingActions.reshelvingWaiting`.
Widget cất kệ trên Dashboard lấy cơ sở mặc định và gọi `/reshelving/count?branch=...`,
không dùng tổng chung thay thế số lượng cơ sở. Lỗi tải số lượng hiển thị `—`, không giả định bằng 0.

### Xác nhận đã cất

`POST /api/v1/librarians/reshelving/confirm`

```json
{ "taskIds": ["894138910475063549", "894138910475063550"], "branch": "Cơ sở 1 - Lý Thường Kiệt" }
```

```json
{
  "code": 200,
  "message": "Success",
  "data": { "updatedCount": 1, "skippedCount": 1 }
}
```

- Payload chỉ có ID công việc, không nhận người xác nhận hoặc thời gian cất từ FE.
- Danh sách không được null/rỗng, tối đa 10.000 phần tử; từng ID không null và > 0.
- Sau kiểm tra đầu vào, service loại ID trùng và sắp ID tăng dần.
- `updatedCount`: số công việc thực sự được cập nhật trong lượt gọi này.
- `skippedCount`: số ID **khác nhau** được yêu cầu nhưng không được cập nhật.
- ID không tồn tại, đã `SHELVED`, đã `NOT_REQUIRED` hoặc bản sao không còn
  `AVAILABLE` được bỏ qua. API không giả vờ đã cất và không ghi đè lịch sử cũ.
- Gọi lại cùng danh sách có thể trả `updatedCount = 0`; đây là kết quả hợp lệ,
  không phải một lần cất mới. Không có audit mới nếu không cập nhật dòng nào.
- Cả ba endpoint có `@RequiresRole(LIBRARIAN)`, theo cơ chế kiểm tra quyền sẵn
  có của hệ thống. Tài khoản độc giả không được gọi API xác nhận của thủ thư.
- Payload không hợp lệ bị chặn bởi Bean Validation/Jackson hoặc guard service.
  Không coi lỗi quyền, lỗi mạng hoặc lỗi database là hàng chờ trống.

**Thay đổi hợp đồng API trong task:** bản đầu dùng `transactionId`,
`transactionIds`, `returnedAt`; bản hoàn thiện dùng **`taskId`, `taskIds`,
`queuedAt`, `source`**. BE và FE phải được triển khai đồng bộ. Không gửi ID
giao dịch mượn vào endpoint xác nhận mới.

## 6. Giao diện và vận hành

Đường dẫn trực tiếp: `/librarianpage/circulation?tab=reshelving`.
Mặc định chọn tất cả sách, có thể bỏ chọn từng cuốn. In phiếu A4 và xác nhận
chỉ áp dụng cho các cuốn được chọn. Sách mới đến sau khi mở hộp thoại xác nhận
không tự bị xác nhận cùng lượt đó.

Danh sách và badge làm mới sau thao tác tại quầy, khi cửa sổ nhận focus và mỗi
30 giây để nhận thay đổi từ thủ thư khác. Lỗi tải được hiển thị trong tab và
không bị coi là hàng chờ trống. Dashboard có widget dẫn thẳng đến tab này.

### Bảng và thao tác chọn

- Cột: checkbox, mã vạch, tên ấn phẩm, vị trí/cơ sở, lý do, thời điểm vào hàng
  chờ, MSSV liên quan; tên độc giả là tooltip của ô MSSV.
- Vị trí kệ in đậm/màu xanh; chưa có vị trí hiển thị nhãn thay thế.
- Lý do dùng badge có chữ, border/background cho cả light/dark, không chỉ dựa
  vào màu để thể hiện nghĩa. Phần nhãn mới hỗ trợ Vi/En.
- Có checkbox chọn tất cả và trạng thái chọn một phần; mặc định chọn tất cả
  ở lần tải đầu. Sách mới xuất hiện được chọn mặc định, các cuốn đã bỏ chọn
  không bị tự chọn lại nếu vẫn còn trong danh sách sau làm mới.
- Danh sách chọn được chụp lại **trước** khi mở hộp thoại xác nhận. Nếu có sách
  mới đến khi hộp thoại đang mở, chúng không được thêm vào payload đang xác nhận.
- Vô hiệu thao tác phù hợp khi tải/lưu/không có sách được chọn. Có toast thành
  công, thông báo các dòng bị bỏ qua và lỗi; sau xác nhận gọi lại API danh sách.
- Bảng có cuộn ngang, thanh nút/tab có thể xuống dòng để hỗ trợ màn hình nhỏ.
- Có `aria-busy`, vùng thông báo số lượng `aria-live`, thông báo lỗi `role=alert`
  và nhãn truy cập cho checkbox. Chưa thực hiện audit accessibility đầy đủ.

### Cách đồng bộ dữ liệu FE

Sự kiện nội bộ `lms:reshelving-changed` được phát sau thành công của xác nhận
giao mượn online, mượn trực tiếp, trả sách, báo hỏng/mất, phục hồi sách mất và
xác nhận cất kệ. Tab/badge/Dashboard đang mount lắng nghe để làm mới.

Các trang còn làm mới khi cửa sổ nhận focus và định kỳ 30 giây. Đây là **polling
và sự kiện trong cùng cửa sổ**, không phải WebSocket, SSE hay broadcast giữa
các máy. Thay đổi từ thủ thư khác/scheduler được nhìn thấy ở lần tải kế tiếp.
Nút Làm mới cho phép chủ động lấy dữ liệu hiện hành.

URL lưu tab bằng query parameter, giữ lại các query parameter khác. Badge chưa
có dữ liệu dùng `…`; khi lỗi lấy count, giữ số đã biết thay vì ép về 0. Lỗi
lấy danh sách được hiển thị trong tab. Màn hình Lưu thông vẫn sử dụng cơ chế
tải chính sách mượn trả trước khi hiển thị nội dung như các tab sẵn có.

### Phiếu in A4

- In **chỉ các cuốn được chọn**, theo thứ tự danh sách đang hiển thị.
- A4 dọc, lề 12 mm; bảng có đường kẻ, ô vuông để tích bằng bút, vị trí kệ in
  đậm, cột lý do và thời điểm vào hàng chờ.
- Có tổng số sách được chọn và thời điểm tạo phiếu; header bảng lặp khi in
  nhiều trang, hạn chế chia một dòng qua hai trang.
- Mở cửa sổ mới và hộp thoại in; có nút In phiếu trong cửa sổ đó để in lại.
- Nội dung động được escape HTML trước khi viết vào cửa sổ in; tách `opener`
  của popup. Test có kiểm tra chuỗi chứa `<script>` không được render thành script.
- Save as PDF là chức năng của trình duyệt, không phải API sinh PDF riêng.
- Ngày giờ trên màn hình/phiếu dùng locale Vi/En và múi giờ của trình duyệt;
  code hiện chưa ép múi giờ hiển thị về `Asia/Ho_Chi_Minh`.
- Chưa làm Excel, barcode dạng hình ảnh, kéo-thả thứ tự, lịch sử xác nhận hay phân trang.

### Bộ lọc cơ sở và chống xác nhận nhầm liên cơ sở

- Dropdown: **Tất cả cơ sở**, **Cơ sở 1 - Lý Thường Kiệt**, **Cơ sở 2 - Dĩ An**; hỗ trợ Vi/En và light/dark theo giao diện hiện có.
- Cơ sở mặc định lấy từ tài khoản đăng nhập: `CAMPUS_1` → CS1, `CAMPUS_2` → CS2.
  `ALL`, null hoặc chưa được gán cơ sở → Tất cả cơ sở; không tự đoán CS1 hay theo địa chỉ/IP.
  Đây là cơ sở được Admin gán, không phải hệ thống phân ca trực mới.
- Chưa tải xong cơ sở thì chưa tải danh sách. Nếu tải cơ sở lỗi, mở chế độ Tất cả chỉ xem/in và yêu cầu chọn rõ cơ sở trước khi xác nhận.
- Tất cả cơ sở **không cho xác nhận**. In được các sách đã chọn; mỗi dòng phiếu vẫn có cơ sở riêng.
- Đổi cơ sở tải lại danh sách, bỏ lựa chọn cũ và mặc định chọn các dòng mới của cơ sở đó.
  Response cũ không ghi đè response của cơ sở mới; khi đang mở xác nhận không cho đổi cơ sở.
- Chọn tất cả chỉ chọn các công việc trong kết quả đã lọc. Nội dung xác nhận ghi rõ cơ sở.
- Badge tab Lưu thông đếm cùng cơ sở đang lọc; Dashboard mặc định đếm cơ sở được gán tài khoản.
- GET danh sách/count nhận tên cơ sở đầy đủ như database (URL-encode query bằng HTTP client).
  Bỏ `branch` để xem tất cả. Chuỗi không hợp lệ, kể cả `branch=ALL`, bị từ chối;
  frontend chuyển ALL thành không gửi query.
- POST bắt buộc `branch` là một trong hai tên đầy đủ; thiếu/null/rỗng/ALL đều bị từ chối.
  Khóa bản sao và UPDATE đều giới hạn `items.branch = :branch`. ID khác cơ sở được bỏ qua,
  tính vào `skippedCount`; không cập nhật thời điểm/người cất hoặc trạng thái giao dịch tương ứng.
- Audit ghi thêm `branch` cùng ID thực sự cập nhật và số lượng.
- Không cần migration mới: dùng `items.branch` và `users.librarian_campus` hiện có.
- **Phạm vi bảo vệ:** chống thao tác hàng loạt lẫn hai cơ sở, chưa phải phân quyền cứng theo cơ sở.
  Thủ thư vẫn có thể chủ động chọn cơ sở khác; nếu cần cấm thao tác ngoài cơ sở được gán,
  cần bổ sung chính sách phân quyền riêng phía server.

## 7. Chi tiết xử lý backend

### `ReshelvingService`

| Phương thức | Trách nhiệm |
|---|---|
| `getWaiting(branch)` | Lấy công việc `WAITING` với bản sao `AVAILABLE`, lọc cơ sở nếu khác null, join thông tin và sắp theo vị trí |
| `countWaiting(branch)` | Đếm với cùng điều kiện; overload không tham số đếm tổng |
| `getDefaultBranch(librarianId)` | Đọc cơ sở được gán tài khoản, ánh xạ sang tên `items.branch`; không xác định thì ALL |
| `recordReturn(transactionId, assignedToReservation)` | Đồng bộ trường lượt trả; tạo việc `RETURN` khi không giữ cho đặt trước và bản sao còn `AVAILABLE` |
| `recordAvailable(itemId, transactionId, reservationId, userId, source)` | Tạo việc cho nguồn giải phóng/phục hồi hợp lệ khi bản sao `AVAILABLE` |
| `confirm(taskIds, librarianId, branch)` | Bắt buộc cơ sở cụ thể; khóa/cập nhật chỉ bản sao thuộc cơ sở đó, đồng bộ lượt trả và ghi audit |

Đọc dùng transaction read-only; ghi dùng `@Transactional`. Các luồng gọi
`recordReturn`/`recordAvailable` phải giữ khóa bản sao và xét việc gán đặt trước
trước khi ghi hàng chờ. Không dùng `recordAvailable` để chế tạo nguồn `RETURN`.

### Điểm tích hợp trong các use case

1. **Trả sách:** giữ luồng trả/phạt/quyết toán cọc hiện hữu. Flush giao dịch
   trước khi dùng JDBC; chạy `tryAssign`, rồi `recordReturn`. Sách giữ ngay cho
   đặt trước không vào hàng chờ chung.
2. **Hết hạn mượn online:** khóa bản sao; nếu không còn `RESERVED` thì bỏ qua.
   UPDATE có điều kiện đúng ID giao dịch, bản sao, trạng thái, deadline. Chỉ
   khi UPDATE thực sự thành công mới giải phóng, thông báo, gán người tiếp
   hoặc tạo nguồn `PICKUP_EXPIRED`. Thông báo bỏ giả định cứng “quá 24h”, dùng
   “quá hạn nhận sách” để không lệch cấu hình deadline.
3. **Hết hạn đặt trước:** tương tự, kiểm tra `assigned_item_id` bằng
   `IS NOT DISTINCT FROM` để xét đúng cả giá trị null. Chỉ bản sao thực sự
   được giữ và được giải phóng mới có việc cất; nguồn `RESERVATION_EXPIRED`.
4. **Hủy đặt trước:** kiểm tra quyền sở hữu; khóa bản sao nếu có, refresh entity
   dưới khóa ghi, kiểm tra lại trạng thái được phép hủy. Save/flush, giải phóng
   cuốn đã giữ và xét người tiếp trước khi tạo nguồn `RESERVATION_CANCELLED`.
   Đặt trước `PENDING` chưa có sách không tạo công việc vật lý.
5. **Xác nhận giao sách:** sau khóa bản sao, refresh entity dưới khóa ghi, kiểm
   tra lại trạng thái. Mượn online/nhận đặt trước quá deadline trả mã `3023`
   (`PICKUP_DEADLINE_EXPIRED`, HTTP 409), không giao sách.
6. **Mượn trực tiếp:** bản sao `AVAILABLE` được mượn như trước; khi nhận sách
   từ đặt trước `RESERVED`, truy vấn yêu cầu hold còn hạn và khóa dòng đặt
   trước. Không dùng luồng này để bỏ qua hạn nhận đã hết.
7. **Tìm lại sách mất:** giữ luồng đảo phí/ghi phục hồi hiện hữu. Nếu sử dụng
   được, xét đặt trước rồi mới tạo nguồn `LOST_RECOVERED`. Nếu chuyển bảo trì
   thì không tạo việc. Response trả trạng thái cuối `RESERVED` nếu đã gán
   người tiếp. Record phục hồi vẫn lưu trạng thái phục hồi yêu cầu; audit bổ
   sung `finalItemStatus` để phân biệt với trạng thái sau gán đặt trước.

### Bảo vệ dữ liệu và xử lý đồng thời

- Khóa bản sao trước khi khóa/cập nhật giao dịch, đặt trước hoặc công việc.
- Xác nhận nhiều cuốn khóa bản sao theo ID tăng dần. Scheduler cũng chọn các
  dòng theo thứ tự bản sao để giữ thứ tự xử lý nhất quán.
- Scheduler không dựa hoàn toàn vào danh sách đọc lúc bắt đầu chạy: kiểm tra
  lại trạng thái/deadline/bản sao trong UPDATE; kết quả 0 dòng thì không giải
  phóng, không gửi thông báo xử lý thành công và không tạo việc cất.
- Refresh JPA sau khi chờ khóa tránh entity đã được tải trước đó bị stale.
- Xác nhận dùng điều kiện `WAITING` + `AVAILABLE` ngay trong UPDATE và lấy ID
  thực sự được cập nhật qua `RETURNING`, không đếm theo payload.
- Trigger là lớp bảo vệ chung cho mọi đường cập nhật `items.status`, kể cả
  giữ sách sau thời điểm trả. Chỉ đóng việc `WAITING`, không thay đổi lịch sử
  `SHELVED` hoặc ghi thời điểm cất giả.
- Ghi lại một lượt trả đã `SHELVED` không reset ba trường lượt trả về `WAITING`;
  nguồn sự kiện trùng cũng không tạo thêm công việc.

Các guard này đã được kiểm thử bằng unit test/mô phỏng trạng thái thay đổi;
chưa phải bằng chứng đã chạy stress test đồng thời trên PostgreSQL thật.

### Audit xác nhận cất

Chỉ khi có cập nhật thật, service ghi:

- Actor: ID lấy từ phiên thủ thư đang đăng nhập; role `LIBRARIAN`.
- Action: `CONFIRM_RESHELVING`.
- Entity: `reshelving_tasks`; entity ID đơn lẻ để null vì là xác nhận nhiều dòng.
- Metadata: `taskIds` thực sự được cập nhật, `count` tương ứng và `branch` xác nhận.
- Đồng thời lưu `shelved_at`, `shelved_by_librarian_id` trên từng công việc.

Không có audit xác nhận mới khi mọi ID đều đã xử lý hoặc không còn hợp lệ.
Các lần tự chuyển `NOT_REQUIRED` bởi trigger không tạo audit xác nhận cất.

## 8. Danh sách file liên quan

Đường dẫn dưới đây tính từ gốc dự án; chỉ liệt kê thay đổi của task xếp giá,
không phải toàn bộ thay đổi có thể đang tồn tại trong worktree.

### Migration và backend

- `LMS_BE/library-bootstrap/src/main/resources/db/migration/V58__book_reshelving_queue.sql`:
  ba trường lượt trả, CHECK/unique index và trigger ban đầu.
- `LMS_BE/library-bootstrap/src/main/resources/db/migration/V59__reshelving_tasks_for_released_holds.sql`:
  bảng công việc, constraints/indexes, chuyển dữ liệu V58, mở rộng thân trigger.
- `LMS_BE/library-circulation-module/src/main/java/com/library/circulation/application/reshelving/ReshelvingService.java`:
  quản lý hàng chờ, xác nhận, đồng bộ lượt trả và audit.
- `LMS_BE/library-circulation-module/src/main/java/com/library/circulation/presentation/controller/ReshelvingController.java`:
  ba API thủ thư và validation request.
- `LMS_BE/library-circulation-module/src/main/java/com/library/circulation/dto/response/ReshelvingItemResponse.java`:
  DTO công việc hiển thị.
- `LMS_BE/library-circulation-module/src/main/java/com/library/circulation/application/transaction/impl/ReturnBookUseCaseImpl.java`:
  tạo hàng chờ sau trả/gán đặt trước.
- `LMS_BE/library-circulation-module/src/main/java/com/library/circulation/infrastructure/scheduler/ExpiredPickupScheduler.java`:
  giải phóng mượn online hết hạn, kiểm tra stale và tạo việc khi cần.
- `LMS_BE/library-circulation-module/src/main/java/com/library/circulation/infrastructure/scheduler/ExpiredReservationScheduler.java`:
  giải phóng đặt trước hết hạn, kiểm tra stale và tạo việc khi cần.
- `LMS_BE/library-circulation-module/src/main/java/com/library/circulation/application/reservation/impl/CancelReservationUseCaseImpl.java`:
  xử lý việc cất khi hủy sách đã giữ và recheck sau khóa.
- `LMS_BE/library-circulation-module/src/main/java/com/library/circulation/application/transaction/impl/ConfirmPickupUseCaseImpl.java`:
  refresh/recheck, từ chối giao mượn online hết hạn.
- `LMS_BE/library-circulation-module/src/main/java/com/library/circulation/application/reservation/impl/ConfirmReservationPickupUseCaseImpl.java`:
  refresh/recheck, từ chối nhận đặt trước hết hạn.
- `LMS_BE/library-circulation-module/src/main/java/com/library/circulation/application/transaction/impl/DirectBorrowUseCaseImpl.java`:
  kiểm tra hold còn hạn và khóa đặt trước khi nhận qua mượn trực tiếp.
- `LMS_BE/library-circulation-module/src/main/java/com/library/circulation/application/transaction/impl/RestoreLostBookUseCaseImpl.java`:
  gán người tiếp hoặc tạo việc phục hồi, trả trạng thái cuối và ghi audit tương ứng.
- `LMS_BE/library-circulation-module/src/main/java/com/library/circulation/application/dashboard/impl/DashboardSummaryUseCaseImpl.java`:
  đếm toàn bộ nguồn công việc còn chờ cho Dashboard.
- `LMS_BE/library-circulation-module/src/main/java/com/library/circulation/dto/response/DashboardSummaryResponse.java`:
  bổ sung `pendingActions.reshelvingWaiting`.
- `LMS_BE/library-shared/src/main/java/com/library/shared/exception/ErrorCode.java`:
  thêm `PICKUP_DEADLINE_EXPIRED` (`3023`).

`BorrowRequestUseCaseImpl`, `ReservationAssignmentService`, `ReportIssueUseCaseImpl`
và `ItemStatusPortImpl` là các luồng được rà soát; không cần thêm lời gọi dọn
hàng chờ riêng vào mọi nơi vì trigger theo dõi thay đổi trạng thái bản sao.

### Frontend

- `LMS_FE/pages/librarian_pages/Circulation.tsx`: tab, query parameter và badge.
- `LMS_FE/components/librarian_pages/ReshelvingTab.tsx`: chọn sách, làm mới,
  xác nhận, thông báo lỗi, bảng dữ liệu và lý do.
- `LMS_FE/api/reshelvingService.ts`: gọi API, kiểu dữ liệu và sự kiện nội bộ.
- `LMS_FE/utils/reshelvingLabels.ts`: nhãn nguồn Vi/En dùng chung cho bảng và in.
- `LMS_FE/utils/reshelvingPrint.ts`: sinh phiếu A4 và mở hộp thoại in.
- `LMS_FE/pages/librarian_pages/Dashboard.tsx`: widget và làm mới summary.
- `LMS_FE/api/librarianDashboardService.ts`: kiểu field số sách chờ cất.
- `LMS_FE/api/transactionsService.ts`: phát sự kiện hàng chờ sau thao tác liên quan.
- `LMS_FE/utils/errorMessages.ts`: thông báo hết hạn nhận sách song ngữ cho `3023`.

`Reports.tsx` chưa được sửa để xuất Excel trong task này. `TransactionList.tsx`
không phải nơi thực hiện cất kệ. `LMS_BE/README.md` không được sửa bởi task;
thay đổi README đang có thuộc phần làm việc của người dùng.

## 9. Kiểm thử và kết quả

### Kết quả lượt triển khai gần nhất (03/10/2026)

| Kiểm tra | Kết quả | Phạm vi/ghi chú |
|---|---|---|
| `mvn test -pl '!library-bootstrap'` | 152 test PASS, 0 lỗi, 0 skip | Các module nghiệp vụ; bao gồm kiểm tra branch, không bao gồm integration bootstrap |
| `npm test` | 23 suites / 106 test PASS | Frontend, gồm test cũ và bổ sung bộ lọc cơ sở |
| `npx tsc --noEmit` | PASS | Kiểm tra kiểu TypeScript riêng |
| `npm run build` | PASS | Build production FE; có cảnh báo chunk lớn, không phải lỗi build |
| Test `ReshelvingSqlIntegrationTest` | Biên dịch thành công; 8 test mục được báo SKIPPED | Docker không sẵn sàng; gồm test SQL xác nhận danh sách trộn hai cơ sở chưa chạy |
| `git diff --check` | PASS | Không có lỗi whitespace được báo |

**Không kết luận toàn bộ test backend bao gồm integration đã PASS.** Test
PostgreSQL bị skip không chứng minh SQL, migration, trigger hoặc khóa đã vận
hành đúng trên database thật. Chưa kiểm tra end-to-end có đăng nhập, in thực tế,
đa máy hoặc stress test đồng thời trong lượt triển khai này.

Không xóa/nới lỏng assertion test cũ để đạt PASS. Test trả sách hiện hữu được
bổ sung mock service mới và xác minh nhánh hàng chờ; bộ test API FE hiện hữu
được mở rộng cho endpoint xếp giá. Các test mới được bổ sung riêng.

Lượt bổ sung cơ sở cập nhật các test xác nhận để truyền `branch` bắt buộc và kiểm tra metadata audit mới.
Test mới kiểm tra: khóa/UPDATE cùng cơ sở, từ chối ALL/chuỗi sai, mặc định theo tài khoản,
POST thiếu cơ sở trả 400, GET chuyển bộ lọc xuống service, đổi dropdown tải lại đúng cơ sở,
Tất cả cơ sở khóa xác nhận. Integration SQL có test danh sách ID trộn CS1/CS2 chỉ cất CS1;
chưa thể xác minh thực thi test này cho đến khi Docker hoạt động.

Trong môi trường Windows này Maven cần dùng cache hiện có:
`mvn '-Dmaven.repo.local=C:\Users\thang\.m2\repository' test -pl '!library-bootstrap'`.

### Test backend liên quan

Các file unit test bên dưới nằm trong
`LMS_BE/library-circulation-module/src/test/java/com/library/circulation/`:

| File | Nội dung chính |
|---|---|
| `application/reshelving/ReshelvingServiceTest.java` | Chọn ID, loại trùng, thứ tự khóa, audit cập nhật thật, xác nhận stale/lặp, input không hợp lệ, nguồn công việc |
| `presentation/controller/ReshelvingControllerTest.java` | Count, payload ID chuỗi, actor đăng nhập, từ chối danh sách rỗng |
| `application/transaction/ReturnBookUseCaseTest.java` | Giữ test trả/phạt cũ; xác minh trả bình thường và giữ cho đặt trước |
| `infrastructure/scheduler/ExpiredHoldReshelvingTest.java` | Hai loại hết hạn; có/không người tiếp; không giải phóng bản sao đã giao; UPDATE 0 dòng |
| `application/reservation/CancelReservationReshelvingTest.java` | Hủy PENDING không tạo việc; hủy READY xét người tiếp trước cất |
| `application/transaction/PickupStateGuardTest.java` | Từ chối quá hạn nhận; refresh thấy hủy/hết hạn không giao theo dữ liệu cũ |
| `application/transaction/RestoreLostReshelvingTest.java` | Phục hồi AVAILABLE có/không người tiếp; phục hồi bảo trì không vào hàng chờ |

`LMS_BE/library-bootstrap/src/test/java/com/library/integration/ReshelvingSqlIntegrationTest.java`
được viết để chạy trên PostgreSQL test container riêng, dùng **nội dung thật
của migration V58/V59**, bao gồm:

- Nâng cấp trạng thái chờ/đã cất V58 sang V59 và giữ người cất.
- Lượt trả lịch sử `NOT_REQUIRED` không trở thành việc tồn; trả mới vào hàng chờ.
- Sách gán cho đặt trước không vào hàng chờ.
- Trigger đóng công việc khi bản sao chuyển sang BORROWED/RESERVED/bảo trì/mất.
- Xác nhận lưu người/giờ, gọi lại không cập nhật lại và không mở lại lượt đã cất.
- Xác nhận chỉ cuốn chọn, không cất nhầm sách mới đến chưa chọn.
- Các nguồn giải phóng/phục hồi tạo việc không trùng, không đổi giao dịch thành
  trả giả; xác nhận nguồn khác không làm ba trường lượt trả thành `SHELVED`.
- Một hold mới sau hold cũ tạo công việc mới khi giải phóng, không mở lại việc cũ.

Các kiểm tra SQL trên **đã viết nhưng chưa chạy thành công** do thiếu Docker.
Việc TRUNCATE trong test chỉ nhắm database container dùng cho test, không phải
database thư viện đang sử dụng.

### Test frontend liên quan

- `LMS_FE/src/components/ReshelvingTab.test.tsx`: mặc định chọn hết, chọn một
  phần, in/xác nhận đúng ID, hủy hộp thoại, stale selection, queue trống/lỗi,
  giữ lựa chọn khi làm mới và không đưa sách mới đến vào payload đang xác nhận.
- `LMS_FE/src/components/ReshelvingNavigation.test.tsx`: mở tab bằng URL, giữ
  query parameter khác, badge và link/count trên Dashboard.
- `LMS_FE/src/utils/reshelvingPrint.test.ts`: phiếu A4, ô checkbox, nhãn nguồn,
  MSSV có số 0 đầu, escape nội dung HTML.
- `LMS_FE/src/api/frontendServices.test.ts`: bổ sung GET danh sách/count và
  POST xác nhận với ID TSID chuỗi không bị mất độ chính xác.

### Lệnh chạy lại

```powershell
# Chạy trong thư mục LMS_BE
mvn test -pl '!library-bootstrap'
# Kiểm thử migration/trigger trên PostgreSQL test container; cần Docker
mvn test -pl library-bootstrap -am '-Dtest=ReshelvingSqlIntegrationTest' '-Dsurefire.failIfNoSpecifiedTests=false'

# Chạy trong thư mục LMS_FE
npm test
npx tsc --noEmit
npm run build
```

Integration test chỉ sử dụng PostgreSQL container riêng, không truy cập dữ
liệu thư viện. Test được skip nếu Docker không sẵn sàng; skip không chứng minh
migration/trigger đã chạy thành công trên PostgreSQL.

## 10. Triển khai và kiểm tra sau triển khai

### Điều kiện và thứ tự

1. Sao lưu database đích và kiểm tra quy trình triển khai hiện có trước khi áp
   dụng migration. Đây là hướng dẫn, task không tự thực hiện thao tác sao lưu
   hay migration vào database hiện hành.
2. Bật Docker theo quy trình của môi trường để chạy lại integration test, đọc
   report bảo đảm **không skip**. Không dùng việc Maven trả BUILD SUCCESS khi
   test bị skip để thay cho bước kiểm tra PostgreSQL.
3. Đưa backend mới lên và khởi động theo quy trình hiện có để Flyway áp dụng
   **V58 và V59**. Nếu đã có V58, áp dụng tiếp V59, không sửa/xóa lịch sử Flyway.
4. Kiểm tra log migration và schema; rồi triển khai frontend khớp API mới.
5. Đăng nhập thủ thư, thực hiện checklist nghiệm thu bên dưới trên dữ liệu
   kiểm thử phù hợp, không tùy tiện đổi trạng thái sách thật bằng SQL.

Việc tạo bảng/cột, kiểm tra dữ liệu nguồn và DB trigger chưa được xác minh trên
database triển khai trong các lượt làm task. Trạng thái database/production
thực tế cần được kiểm tra riêng; không suy ra từ tình trạng file trong repository.

### SQL kiểm tra chỉ đọc (sau migration)

```sql
SELECT version, description, success
FROM flyway_schema_history
WHERE version IN ('58', '59')
ORDER BY installed_rank;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('borrowing_transactions', 'reshelving_tasks')
  AND column_name IN ('reshelving_status', 'shelved_at', 'shelved_by_librarian_id',
                      'source', 'status', 'queued_at')
ORDER BY table_name, ordinal_position;

SELECT COUNT(*) AS waiting_count
FROM reshelving_tasks q JOIN items i ON i.id = q.item_id
WHERE q.status = 'WAITING' AND i.status = 'AVAILABLE';

SELECT q.id, i.barcode, q.status, q.source, q.queued_at,
       q.shelved_at, q.shelved_by_librarian_id
FROM reshelving_tasks q JOIN items i ON i.id = q.item_id
ORDER BY q.queued_at DESC, q.id DESC
LIMIT 50;
```

Các truy vấn này chỉ đọc; không phải thao tác tạo/cập nhật công việc. Nếu môi
trường dùng schema hoặc tên bảng lịch sử Flyway khác, điều chỉnh truy vấn theo
cấu hình thực tế trước khi chạy.

### Checklist nghiệm thu thủ công

- [ ] Trả sách bình thường không có người đặt trước: tab/badge xuất hiện cuốn đó.
- [ ] Trả sách có người đặt trước: giữ `RESERVED`, không xuất hiện trong giỏ chung.
- [ ] Mượn/giữ một cuốn đang chờ cất: việc cũ biến thành `NOT_REQUIRED`, không có giờ cất giả.
- [ ] Mượn online hết hạn, không người tiếp: scheduler hủy, tạo việc `PICKUP_EXPIRED`.
- [ ] Đặt trước hết hạn, không người tiếp: scheduler hết hạn, tạo việc `RESERVATION_EXPIRED`.
- [ ] Hủy đặt trước PENDING: không tạo việc; hủy READY không người tiếp: có việc.
- [ ] Có người tiếp khi hủy/hết hạn: giữ cho người đó, không tạo việc cất chung.
- [ ] Quá hạn nhưng scheduler chưa chạy: API giao sách từ chối; không thay đổi sang BORROWED.
- [ ] Tìm lại sách mất dùng được: có việc hoặc giữ người tiếp; còn hỏng: bảo trì, không có việc.
- [ ] In chỉ các cuốn chọn, bố cục A4 rõ ràng trên trình duyệt/máy in mục tiêu.
- [ ] Xác nhận một phần: chỉ cuốn chọn rời hàng chờ; số còn lại chính xác.
- [ ] Sách mới đến lúc hộp thoại đang mở không bị xác nhận cùng payload cũ.
- [ ] Gọi lại xác nhận hoặc dùng dữ liệu cũ: không ghi đè người/giờ cất.
- [ ] Đăng nhập thủ thư ca khác: đọc được hàng chờ tồn từ ca trước.
- [ ] Tài khoản không phải thủ thư không gọi được API xác nhận.
- [ ] Lỗi tải/mất kết nối không bị hiển thị như đã cất hết sách.
- [ ] Kiểm tra cả Vi/En, light/dark và màn hình nhỏ trên trình duyệt thực tế.

### Chẩn đoán thường gặp

| Hiện tượng | Điểm cần kiểm tra |
|---|---|
| API báo thiếu cột/bảng | Flyway V58/V59 đã được áp dụng tại đúng database/schema chưa? |
| Badge `…` hoặc báo lỗi tải | Kết nối API, JWT/role, cấu hình URL, log backend và migration |
| Số trên ca khác chưa đổi ngay | Polling 30 giây/focus/làm mới; chưa có push đa máy |
| Hết hạn nhưng vẫn `RESERVED` | Scheduler còn chạy không, đã đến lượt chưa, deadline thực tế; kiểm tra chỉ đọc/log |
| Xác nhận 0 cuốn, có thông báo bỏ qua | Các công việc có thể đã được xử lý hoặc sách không còn AVAILABLE; tải lại trước khi kết luận lỗi |
| Phiếu in không mở | Quyền popup trình duyệt; nút in có đang bị vô hiệu do tải/lỗi/không chọn sách không? |
| Hàng chờ không có dữ liệu lịch sử cũ | V58/V59 không tự biến NOT_REQUIRED hoặc hold đã kết thúc trước task thành backlog |

### Lưu ý khi rollback

Chưa viết migration rollback hoặc script xóa dữ liệu xếp giá. Không tự drop
bảng/cột/trigger hay xóa lịch sử Flyway khi muốn quay lại phiên bản trước.
V58/V59 có dữ liệu lịch sử nghiệp vụ; rollback phải được thiết kế theo backup,
phiên bản backend/frontend và dữ liệu đã phát sinh tại môi trường đích.

## 11. Báo cáo và đối soát

**Chưa triển khai xuất Excel nhiều sheet trong `Reports.tsx`.** Task hiện có
phiếu in A4; dữ liệu được chuẩn bị để phục vụ báo cáo bước sau.

Khi bổ sung báo cáo tồn quầy, lấy `reshelving_tasks.status = 'WAITING'` cùng bản
sao `AVAILABLE` để bao quát cả sách trả và sách không đến nhận. Báo cáo lượt
trả vẫn dùng ba trường V58; lịch sử cất kệ các nguồn khác nằm trong
`reshelving_tasks`. Không chỉ lọc `shelved_at IS NULL`: `NOT_REQUIRED` cũng có
thời điểm cất để trống.

Ví dụ truy vấn tồn quầy chỉ đọc:

```sql
SELECT q.id AS task_id, q.source, q.queued_at,
       i.barcode, p.title, i.branch, i.location,
       u.student_id, u.full_name
FROM reshelving_tasks q
JOIN items i ON i.id = q.item_id
JOIN publications p ON p.id = i.publication_id
LEFT JOIN users u ON u.id = q.user_id
WHERE q.status = 'WAITING' AND i.status = 'AVAILABLE'
ORDER BY i.branch, i.location ASC NULLS LAST, q.queued_at DESC, q.id;
```

Báo cáo tháng cần chọn mốc lọc phù hợp: `returned_date` cho thống kê sách trả,
`queued_at` cho việc phát sinh, `shelved_at` cho việc hoàn thành. Dùng khoảng
thời gian `[từ, đến)` và thống nhất múi giờ báo cáo, không trộn ba mốc thành một.
Tên người liên quan và người xác nhận là hai vai trò khác nhau, cần hai join
khác nhau nếu sheet hiển thị cả hai.

## 12. Giới hạn và hướng phát triển

### Chưa làm trong task này

- API hủy riêng yêu cầu mượn online đang chờ nhận.
- Use case backend hoàn tất sửa chữa/bảo trì và phát sinh việc cất sau sửa chữa.
- Xuất Excel nhiều sheet, file PDF server-side hoặc API lịch sử xếp giá.
- Hoàn tác/chỉnh sửa xác nhận cất sai; không có quyền sửa lịch sử qua UI.
- Xác nhận thủ thư đã lấy sách khỏi kệ để chuyển vào khu giữ riêng; `RESERVED`
  hiện là trạng thái giữ logic, không phải bằng chứng chuyển vị trí vật lý.
- Push đồng bộ tức thì đa máy, phân trang, giới hạn quyền
  theo cơ sở, natural sort vị trí kệ.
- Tự backfill sách có thể còn tồn quầy từ thời điểm trước khi tính năng được dùng.
- Nghiệp vụ nhập kho, di chuyển kệ, kiểm kê hoặc bản sao mới có hàng chờ riêng.
- End-to-end trên database thật, kiểm tra máy in thực tế và stress concurrency.

### Nguyên tắc cho phần mở rộng

1. Tạo công việc mới từ **sự kiện nguồn thực**, không sửa lượt trả lịch sử để
   giả lập sự kiện chưa từng xảy ra.
2. Khóa bản sao, xét đặt trước tiếp theo rồi mới đưa sách dùng được vào hàng chờ.
3. Không đổi `SHELVED` chỉ để dọn badge; giờ/người cất phải là xác nhận của thủ thư.
4. Thêm source, ràng buộc migration, nhãn song ngữ và test đồng bộ BE/FE.
5. Giữ quy tắc một công việc WAITING/bản sao, idempotency và bảo vệ dữ liệu stale.
6. Với sửa chữa hoàn tất, cân nhắc nguồn riêng và tham chiếu sự kiện sửa chữa;
   không tái dùng `RETURN` hoặc `LOST_RECOVERED` sai nghĩa.
7. Nếu cần nhận sách quá hạn theo quyết định thủ thư, phải thiết kế ngoại lệ
   riêng có quyền, audit và kiểm tra người đang được giữ sách; không bỏ guard
   deadline để xử lý tiện tại quầy.

Tài liệu này tổng kết **các luồng hiện có được rà soát trong phạm vi xếp giá**;
không tuyên bố mọi nghiệp vụ có thể phát sinh ngoài đời đều đã có API hoặc đã
được xác minh trên môi trường triển khai.

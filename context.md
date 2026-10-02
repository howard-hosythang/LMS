# LMS Project Context & Architecture Master Document

> **Mục đích tài liệu:** Tài liệu này tổng hợp toàn bộ bối cảnh kiến trúc, cấu trúc cơ sở dữ liệu, quy tắc nghiệp vụ, luồng xử lý AI, và hướng dẫn hiện thực các tính năng tiếp theo (đặc biệt là tính năng **Gia hạn - Renewal**) của dự án LMS. Tài liệu được tối ưu để các AI Agent (như OpenAI Codex, Claude, ChatGPT) và lập trình viên có thể nắm bắt 100% context và bắt tay vào hiện thực code ngay lập tức mà không làm sai lệch kiến trúc hiện hữu.

---

## 1. Thông tin Dự án & Metadata

- **Tên đề tài:** XÂY DỰNG HỆ THỐNG QUẢN LÝ THƯ VIỆN TRỰC TUYẾN TÍCH HỢP AI HỖ TRỢ TÌM KIẾM VÀ GỢI Ý SÁCH (Mã đề tài: HK253-DATN-076).
- **Sinh viên thực hiện:** Võ Quang Thắng (MSSV: 2213214).
- **Trường:** Đại học Bách Khoa – ĐHQG-HCM, Khoa Khoa học và Kỹ thuật Máy tính.
- **Giảng viên hướng dẫn:** TS. Trương Tuấn Anh, CN. Dương Huỳnh Anh Đức.
- **Giảng viên phản biện:** ThS. Trần Thị Quế Nguyệt.
- **Hệ thống Production:** `https://library74.uk` (Deploy trên Cloud VPS, reverse proxy Nginx, chứng chỉ SSL Cloudflare/Let's Encrypt).

---

## 2. Tổng quan Kiến trúc Hệ thống (System Architecture)

Hệ thống được thiết kế theo mô hình **Microservices lai (Hybrid Multi-service Architecture)** gồm 3 service chính độc lập:

```
                              ┌─────────────────────────────────────────┐
                              │           Frontend (LMS_FE)             │
                              │     React 18 + Vite + TypeScript        │
                              │       Tailwind CSS + Lucide Icons       │
                              └────────────────────┬────────────────────┘
                                                   │ HTTPS / REST API
                                                   ▼
                              ┌─────────────────────────────────────────┐
                              │      Backend Core (LMS_BE)              │
                              │  Java 21 + Spring Boot 3.3.4 (DDD/Hex)  │
                              │     Port: 8080 (REST / JWT Auth)        │
                              └───────┬─────────────────────────▲───────┘
                                      │                         │
                   WebClient REST API │                         │ Callback HMAC-SHA256
                                      ▼                         │
┌────────────────────────────────────────┐           ┌──────────┴──────────────────────────────┐
│       Database & Vector Store          │           │          AI Gateway & ETL (LMS_AI)      │
│            PostgreSQL 16               │◄──────────┤       Python 3.11 + FastAPI + Celery    │
│  - Schemas: public, ai_engine          │  SQL /    │  - Embedding: vietnamese-bi-encoder     │
│  - pgvector (HNSW Index cosine)        │  pgvector │  - LLM: Google Gemini 2.5 Flash Lite    │
│  - Flyway Migrations (V1 -> V47)       │           │  - Recommender: Implicit ALS + CBF      │
└────────────────────────────────────────┘           └─────────────────────────────────────────┘
```

---

## 3. Chi tiết Công nghệ & Cấu trúc Thư mục

### 3.1. Frontend (`LMS_FE`)
- **Stack:** React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Axios.
- **Cấu trúc thư mục:**
  - `src/api/`: Các service gọi REST API (e.g. `transactionsService.ts`, `catalogService.ts`, `recommendationService.ts`, `authService.ts`).
  - `src/pages/public_pages/`: Trang công cộng (Trang chủ `HomePage.tsx`, Đăng nhập `LoginPage.tsx`, Chi tiết sách `PublicationDetailPage.tsx`).
  - `src/pages/user_pages/`: Trang bạn đọc (`DashboardPage.tsx`, `MyBooksPage.tsx` - nơi quản lý sách đang mượn/đặt trước/lịch sử, `WishlistPage.tsx`).
  - `src/pages/librarian_pages/`: Trang nghiệp vụ thủ thư (Quản lý mượn trả tại quầy `CirculationDesk.tsx`, Báo cáo `Reports.tsx`, Độc giả 360 `Reader360Drawer.tsx`).
  - `src/types.ts`: Toàn bộ TypeScript interfaces & enum (Status, Transaction, Publication, User, Policy...).

### 3.2. Backend Core (`LMS_BE`)
- **Stack:** Java 21, Spring Boot 3.3.4, Spring Security, Spring Data JPA, NamedParameterJdbcTemplate, Flyway, MapStruct, Lombok.
- **Kiến trúc:** Domain-Driven Design (DDD) & Hexagonal / Modular Monolith chia thành các Maven module:
  - `library-bootstrap`: Entry point (`LibraryApplication.java`), Flyway migrations (`db/migration/V1__*.sql` đến `V47__*.sql`), Integration Tests (Testcontainers PostgreSQL).
  - `library-shared`: DTO dùng chung (`ApiResponseApp`, `PageResponse`), BaseEntity (TSID generator), Exceptions, SecurityEvaluator, `ErrorCode.java`.
  - `library-user-module`: Quản lý người dùng, tài khoản, xác thực JWT, phân quyền (`STUDENT`, `FACULTY`, `LIBRARIAN`, `ADMIN`), điểm tín nhiệm (`credit_score`).
  - `library-catalog-module`: Quản lý đầu sách (`Publication`), tác giả (`Author`), danh mục (`Category`), bản sao vật lý (`Item` với mã vạch `barcode`, trạng thái `AVAILABLE`, `BORROWED`, `RESERVED`, `IN_MAINTENANCE`, `LOST`).
  - `library-circulation-module`: Quản lý lưu thông (Mượn `borrow`, Trả `return`, Nhận sách `confirm-pickup`, Đặt trước `reservation`, Báo mất/hỏng `report-issue`, Phạt `fines`, Đặt cọc `deposits`, Chính sách lưu thông `CirculationPolicy`).
  - `library-recommendation-module`: Ghi nhận tương tác (`UserInteraction`), giao tiếp với AI Gateway qua `AiGatewayService.java`, fallback cache gợi ý (`ai_recommendations`).
  - `library-payment-module`: Thanh toán tiền cọc, tiền phạt (Momo, VNPAY, Stripe).

### 3.3. AI Engine (`LMS_AI`)
- **Stack:** Python 3.11, FastAPI, Celery + Redis, PyTorch, SentenceTransformers, `implicit`, NumPy, Pydantic v2, PostgreSQL driver (`psycopg2-binary`).
- **Mô hình AI sử dụng:**
  - **Embedding:** `bkai-foundation-models/vietnamese-bi-encoder` (768 chiều).
  - **Generative LLM:** `Google Gemini 2.5 Flash Lite` (Tóm tắt học thuật `Executive Summary`, Trích xuất `Tags & English Aliases`, Xác định `Target Audience`).
  - **LLM Guard:** Chặn ảo giác bằng Pydantic Model Strict Typing, kiểm tra độ dài, kiểm tra ngôn ngữ, kiểm tra từ khóa tiêu cực cấm (`forbidden_terms`). Điểm benchmark chất lượng đạt **95.46/100**.
  - **Gợi ý (Recommender):** Mô hình lai (Hybrid) gồm:
    - *Content-Based Filtering (CBF):* Vector người dùng 768-D = trung bình có trọng số các sách đã đọc, so khớp Cosine Distance `<=>` trên `pgvector` HNSW.
    - *Collaborative Filtering (Implicit ALS):* Ma trận thưa User-Item 32-D với $c_{ui} = 1 + 40 \cdot r_{ui}$, lưu model tại `models/als_model.pkl`.
    - *Metadata-based & Trending Fallback.*

---

## 4. Cơ sở Dữ liệu & Các Bảng Chính (Database Schema)

PostgreSQL 16 gồm 2 schema: `public` và `ai_engine`.

### 4.1. Bảng `publications` (Đầu sách)
- `id` (BIGINT PK)
- `title` (VARCHAR 255)
- `isbn` (VARCHAR 50)
- `description` (TEXT)
- `cover_image_url` (VARCHAR 500)
- `publication_year` (INT)
- `publisher` (VARCHAR 255)
- `academic_summary` (TEXT - do LLM sinh ra)
- `target_audience` (TEXT - do LLM sinh ra)
- `status` (VARCHAR - `ACTIVE`, `DRAFT`, `ARCHIVED`)

### 4.2. Bảng `items` (Bản sao vật lý trên kệ)
- `id` (BIGINT PK)
- `publication_id` (BIGINT FK)
- `barcode` (VARCHAR 50 UNIQUE) - Mã vạch dán trên gáy sách
- `price` (NUMERIC 15) - Giá trị đền bù khi mất sách
- `status` (VARCHAR) - `AVAILABLE` (sẵn sàng trên kệ), `BORROWED` (đang mượn), `RESERVED` (đã giữ chỗ cho người đặt trước), `IN_MAINTENANCE`, `LOST`

### 4.3. Bảng `borrowing_transactions` (Giao dịch Mượn - Trả)
- `id` (BIGINT PK)
- `user_id` (BIGINT FK)
- `item_id` (BIGINT FK)
- `librarian_id_issue` (BIGINT FK NULL)
- `librarian_id_return` (BIGINT FK NULL)
- `borrowed_date` (TIMESTAMPTZ NULL) - Thời điểm thủ thư giao sách
- `due_date` (DATE NOT NULL) - Hạn cuối phải trả sách
- `returned_date` (TIMESTAMPTZ NULL) - Thời điểm trả sách
- `picked_up_deadline` (TIMESTAMPTZ NOT NULL) - Hạn chót đến quầy nhận sách (nếu đặt giữ chỗ trước)
- `status` (VARCHAR 20) - `WAITING_FOR_PICKUP`, `BORROWING`, `RETURNED`, `OVERDUE`, `CANCELLED`
- `renewal_count` (INT NOT NULL DEFAULT 0) - **Đã có sẵn trong CSDL**
- `deposit_amount` (NUMERIC 15 DEFAULT 0)
- `deposit_status` (VARCHAR 30) - `NOT_REQUIRED`, `COLLECTED`, `REFUNDED`, `FORFEITED`

### 4.4. Bảng `reservations` (Hàng đợi Đặt trước)
- `id` (BIGINT PK)
- `user_id` (BIGINT FK)
- `publication_id` (BIGINT FK)
- `item_id` (BIGINT FK NULL) - Bản sao được gán khi có sách trả về
- `reservation_date` (TIMESTAMPTZ NOT NULL DEFAULT NOW())
- `status` (VARCHAR 20) - `WAITING_FOR_BOOK` (đang xếp hàng đợi sách), `ASSIGNED` (đã có sách, đang chờ bạn đọc đến lấy), `FULFILLED` (đã nhận sách thành công), `CANCELLED`, `EXPIRED`
- `queue_position` (INT) - Thứ tự ưu tiên trong hàng đợi (FIFO)
- `expiration_date` (TIMESTAMPTZ) - Hạn chót 48h để đến lấy sách sau khi được chuyển sang `ASSIGNED`

### 4.5. Bảng `user_interactions` (Lịch sử Hành vi phục vụ AI)
- `id` (BIGINT PK)
- `user_id` (BIGINT FK)
- `publication_id` (BIGINT FK)
- `type` (VARCHAR 20) - `WATCH` (Xem chi tiết = 1đ), `WISHLIST` (Thêm yêu thích = 5đ), `BORROWED` (Mượn thành công = 10đ)
- `created_at` (TIMESTAMPTZ)
- *Ghi chú:* Sự kiện `WATCH` có rate-limit chống spam (chỉ ghi tối đa 1 lượt / 24h / cặp user + publication).

### 4.6. Bảng `circulation_policies` (Chính sách Lưu thông - Singleton id=1)
- `id` (SMALLINT PK DEFAULT 1)
- `pickup_deadline_hours` (INT DEFAULT 24)
- `default_loan_days` (INT DEFAULT 14) - Thời hạn mượn mặc định (14 ngày)
- `max_active_borrows` (INT DEFAULT 5)
- `max_active_reservations` (INT DEFAULT 2)
- `overdue_fine_per_day` (NUMERIC 15 DEFAULT 1000 VNĐ/ngày)
- `block_borrow_when_unpaid_fines` (BOOLEAN DEFAULT TRUE)

### 4.7. Bảng `ai_engine.publication_vectors` (Vector Nhúng Ngữ nghĩa)
- `id` (BIGINT PK)
- `publication_id` (BIGINT FK)
- `chunk_text` (TEXT)
- `embedding` (VECTOR(768)) - Index `HNSW` với `vector_cosine_ops` (`m = 16`, `ef_construction = 64`)

---

## 5. Quy trình Nghiệp vụ Lưu thông Hiện tại (Circulation Business Flows)

### 5.1. Luồng Mượn sách
1. **Đặt mượn online:** Độc giả bấm mượn trên web $\rightarrow$ Tạo `BorrowingTransaction` trạng thái `WAITING_FOR_PICKUP` với hạn chót nhận sách `picked_up_deadline` (24h). Bản sách `item` chuyển thành `RESERVED`.
2. **Thủ thư xác nhận tại quầy (`confirm-pickup`):** Độc giả đến quầy, thủ thư quét mã vạch bản sách $\rightarrow$ Chuyển transaction thành `BORROWING`, cập nhật `borrowed_date = now()`, `due_date = today + policy.default_loan_days` (14 ngày), `item.status = 'BORROWED'`. Ghi nhận sự kiện `BORROWED` vào `user_interactions` cho AI.
3. **Mượn trực tiếp tại quầy (`borrow-direct`):** Thủ thư nhập MSSV + quét barcode $\rightarrow$ Tạo ngay transaction `BORROWING` với hạn 14 ngày.

### 5.2. Luồng Trả sách (`ReturnBookUseCase`)
1. Thủ thư quét barcode sách trả lại $\rightarrow$ Transaction chuyển sang `RETURNED`.
2. Tính toán phạt trễ hạn nếu `returned_date > due_date`: $\text{Tiền phạt} = \text{Số ngày trễ} \times \text{overdue_fine_per_day}$. Trừ điểm tín nhiệm độc giả nếu trễ hạn.
3. Hoàn trả tiền cọc (`deposit_status = REFUNDED`) nếu có.
4. **Tự động kích hoạt `ReservationAssignmentService`:** Kiểm tra xem đầu sách này có ai đang ở trạng thái `WAITING_FOR_BOOK` hay không:
   - **Nếu có:** Giữ nguyên bản sách ở trạng thái `RESERVED`, gán `item_id` cho người đặt trước đầu tiên (Queue position = 1), cập nhật `status = ASSIGNED`, hạn nhận sách trong 48h, gửi email/thông báo cho bạn đọc.
   - **Nếu không:** Đổi `item.status = 'AVAILABLE'` (trả về kệ cho người khác mượn).

---

## 6. Yêu cầu & Thiết kế Kỹ thuật Tính năng Gia hạn (Book Renewal Feature)

### 6.1. Mục tiêu Nghiệp vụ
Cho phép độc giả tự gia hạn thời gian mượn cuốn sách trên giao diện web ("My Books") hoặc cho phép thủ thư hỗ trợ gia hạn tại quầy, **với điều kiện bảo đảm tính công bằng tuyệt đối cho những sinh viên khác đang chờ đặt trước**.

### 6.2. Quy tắc Nghiệp vụ Gia hạn (Business Rules)
1. **Trạng thái hợp lệ:** Giao dịch mượn (`BorrowingTransaction`) phải đang ở trạng thái **`BORROWING`** (chưa trả, chưa báo mất/hư hỏng).
2. **Không quá hạn:** Sách **chưa bị quá hạn** tại thời điểm bấm gia hạn (`LocalDate.now() <= transaction.getDueDate()`). Nếu đã quá hạn (`OVERDUE`), khóa tính năng online, bắt buộc đến quầy nộp phạt và trả sách.
3. **Giới hạn số lần gia hạn:** Mỗi giao dịch mượn chỉ được phép gia hạn tối đa **1 lần** (`renewalCount < 1`).
4. **RÀO CHẮN ĐẶT TRƯỚC (QUAN TRỌNG NHẤT):**
   - Kiểm tra trong bảng `reservations`: Đầu sách tương ứng (`publication_id` của bản sách này) **KHÔNG ĐƯỢC CÓ BẤT KỲ ĐỘC GIẢ NÀO ĐANG Ở TRẠNG THÁI `WAITING_FOR_BOOK`**.
   - Nếu có ít nhất 1 người đang chờ: **Từ chối gia hạn ngay lập tức** kèm thông báo lỗi: *"Sách này đã có độc giả khác đặt trước. Bạn không thể gia hạn và vui lòng hoàn trả sách đúng hạn."*
5. **Điều kiện tài khoản:** Độc giả không có hóa đơn phạt trễ hạn chưa thanh toán (`unpaid fines > 0`).
6. **Thời gian gia hạn mới:**
   - Cộng thêm số ngày theo chính sách: $\text{dueDate mới} = \text{dueDate cũ} + \text{default_loan_days}$ (ví dụ +14 ngày).
   - Tăng `renewalCount = renewalCount + 1`.
7. **Phân quyền:**
   - Độc giả chỉ được gia hạn giao dịch của chính mình (`transaction.getUserId() == currentUserId`).
   - Thủ thư (`LIBRARIAN`) có quyền gia hạn cho bất kỳ độc giả nào (nếu thỏa mãn các điều kiện trên).

---

### 6.3. Chi tiết Cần Hiện thực trên Backend (`LMS_BE`)

#### Bước 1: Mã lỗi trong `ErrorCode.java`
Đã có sẵn:
```java
CANNOT_RENEW_TRANSACTION(3003, "Cannot renew transaction - renewal limit reached or transaction is overdue", "Không thể gia hạn: đã hết lượt, sách đang quá hạn hoặc có người đặt trước", HttpStatus.CONFLICT)
```

#### Bước 2: UseCase Interface & Implementation (`library-circulation-module`)
- Tạo interface: `RenewBookUseCase.java`:
  ```java
  public interface RenewBookUseCase {
      BorrowTransactionResponse execute(Long transactionId, Long actorUserId, boolean isLibrarian);
  }
  ```
- Tạo implementation: `RenewBookUseCaseImpl.java` (gắn `@Service`, `@Transactional`):
  - Bước 1: Tìm `BorrowingTransactionEntity` theo `transactionId` (báo lỗi `TRANSACTION_NOT_FOUND` nếu không tồn tại).
  - Bước 2: Kiểm tra quyền: nếu không phải `isLibrarian` thì bắt buộc `entity.getUserId().equals(actorUserId)`.
  - Bước 3: Kiểm tra trạng thái: `entity.getStatus() == TransactionStatus.BORROWING`.
  - Bước 4: Kiểm tra quá hạn: `LocalDate.now().isAfter(entity.getDueDate())` $\rightarrow$ ném lỗi.
  - Bước 5: Kiểm tra số lần gia hạn: `entity.getRenewalCount() >= 1` $\rightarrow$ ném lỗi.
  - Bước 6: Kiểm tra hàng đợi đặt trước:
    - Tìm `publicationId` từ `itemRepository.findById(entity.getItemId())`.
    - Gọi `reservationRepository.countByPublicationIdAndStatus(publicationId, ReservationStatus.WAITING_FOR_BOOK) > 0` $\rightarrow$ ném lỗi kèm message báo sách đã có người đặt trước!
  - Bước 7: Kiểm tra nợ phạt của user (gọi `FineRepository.existsByUserIdAndStatus(userId, FineStatus.PENDING)`).
  - Bước 8: Lấy `default_loan_days` từ `CirculationPolicyService` (mặc định 14 ngày).
  - Bước 9: Cập nhật:
    - `entity.setDueDate(entity.getDueDate().plusDays(loanDays))`
    - `entity.setRenewalCount(entity.getRenewalCount() + 1)`
    - `borrowingTransactionRepository.save(entity)`
  - Bước 10: Mapping sang `BorrowTransactionResponse` và trả về.

#### Bước 3: REST Controller Endpoint (`BorrowingTransactionController.java`)
Thêm endpoint:
```java
@PostMapping("/{id}/renew")
@RequiresAuthentication
@Operation(summary = "Renew a borrowing transaction (Reader or Librarian)")
public ApiResponseApp<BorrowTransactionResponse> renewTransaction(
    @PathVariable("id") Long transactionId) {
  Long currentUserId = security.getCurrentUserId();
  boolean isLibrarian = security.hasRole(RoleConstants.LIBRARIAN);
  return ApiResponseApp.success("Gia hạn sách thành công",
      renewBookUseCase.execute(transactionId, currentUserId, isLibrarian));
}
```

---

### 6.4. Chi tiết Cần Hiện thực trên Frontend (`LMS_FE`)

#### Bước 1: API Service (`src/api/transactionsService.ts`)
Thêm method gọi API:
```typescript
renewBook: async (transactionId: string | number): Promise<BorrowResponse> => {
  const response = await axiosInstance.post(`/transactions/${transactionId}/renew`);
  return response as any;
}
```

#### Bước 2: Giao diện Bạn đọc (`src/pages/user_pages/MyBooksPage.tsx`)
- Trên mỗi card sách trong tab "Đang mượn" (`BORROWING`):
  - Hiển thị thông tin lượt gia hạn: Ví dụ `Gia hạn: 0/1`.
  - Hiển thị nút **"Gia hạn sách"** (icon `RefreshCw` hoặc `Clock`).
  - **Logic disable nút:**
    - Disable nếu đã gia hạn (`renewalCount >= 1`).
    - Disable nếu đã quá hạn (`isOverdue(dueDate)`).
  - **Hành vi khi click:**
    - Hiển thị Modal/Dialog xác nhận: *"Bạn có muốn gia hạn cuốn sách '[Tên sách]' thêm 14 ngày? Hạn trả mới dự kiến: [Ngày mới]. Lưu ý: Không thể gia hạn nếu sách đã có độc giả khác đặt trước."*
    - Khi ấn xác nhận $\rightarrow$ Gọi `transactionsService.renewBook(tx.id)`.
    - Thông báo Toast thành công (màu xanh) hoặc hiển thị Toast lỗi chi tiết từ Backend (màu đỏ nếu có người đặt trước hoặc quá hạn).
    - Tải lại danh sách giao dịch để cập nhật hạn trả mới trên UI.

---

## 7. Quy ước Code & Best Practices

1. **Backend:**
   - Giữ nguyên cấu trúc Clean Architecture / DDD: Controller $\rightarrow$ UseCase $\rightarrow$ Repository / Domain Entity.
   - Luôn sử dụng `@Transactional` cho các thao tác cập nhật trạng thái giao dịch.
   - Trả về chuẩn `ApiResponseApp<T>` có message tiếng Việt thân thiện và mã lỗi chuẩn trong `ErrorCode.java`.
   - Viết Unit Test cho UseCase mới trong `library-circulation-module/src/test`.
2. **Frontend:**
   - Dùng Tailwind CSS với tông màu chuẩn của dự án (Blue / Slate / Indigo).
   - Đảm bảo i18n hỗ trợ song ngữ Tiếng Việt & Tiếng Anh nếu có sử dụng key language.
   - Thao tác API luôn có trạng thái `loading` (spinner) và xử lý lỗi bằng `try/catch` có Toast notification.

---

Tài liệu này là Single Source of Truth (SSOT) cho toàn bộ dự án LMS. Bất kỳ AI Agent hoặc lập trình viên nào đọc tài liệu này đều có đầy đủ thông số để triển khai tính năng một cách đồng bộ và chính xác.

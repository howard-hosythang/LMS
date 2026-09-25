# Kịch bản thuyết trình báo cáo LMS tích hợp AI

Gợi ý nhịp trình bày: 18-22 phút. Giai đoạn 1, tương ứng Chương 1-5, chỉ đi qua các ý nền tảng. Trọng tâm đặt ở giai đoạn 2: hiện thực, kiểm thử, kết quả đạt được, hạn chế và hướng phát triển.

## Cấu trúc tổng thể

1. Đặt vấn đề và mục tiêu hệ thống: 4 slide.
2. Phân tích và thiết kế hệ thống: 6 slide.
3. Hiện thực: 8 slide.
4. Kiểm thử: 4 slide.
5. Hạn chế và hướng phát triển: 2 slide.

Tổng: 24 slide.

---

## Slide 1. Tên đề tài

**Tiêu đề:** Hệ thống Quản lý Thư viện Trực tuyến tích hợp AI

**Nội dung trên slide:**
- Quản lý nghiệp vụ thư viện: ấn phẩm, bản sao, mượn--trả, đặt trước, phí phạt.
- Tích hợp AI: xử lý PDF, tìm kiếm ngữ nghĩa, gợi ý sách cá nhân hóa.
- Kiến trúc gồm Frontend, Backend và AI Service độc lập.

**Hình ảnh nên dùng:**
- `figures/common/hcmut.jpg` làm ảnh nền nhẹ hoặc đặt logo.
- Có thể thêm ảnh giao diện đẹp nhất: `figures/ch06/frontend/homepage` không có, thay bằng `figures/ch05/ui/public/homepage.png`.

**Lời dẫn:**
> Đề tài của nhóm là xây dựng một hệ thống quản lý thư viện trực tuyến tích hợp AI. Điểm chính không chỉ là tra cứu sách, mà là số hóa quy trình vận hành thư viện và dùng AI ở những nơi thật sự tạo giá trị: đọc nội dung PDF, tìm kiếm theo ngữ nghĩa và gợi ý tài liệu theo hành vi người dùng.

---

## Slide 2. Bối cảnh và vấn đề

**Tiêu đề:** Vì sao cần một hệ thống thư viện mới?

**Nội dung trên slide:**
- Hệ thống thư viện truyền thống chủ yếu tìm kiếm theo từ khóa.
- Nội dung PDF chưa được khai thác sâu.
- Nghiệp vụ mượn--trả, đặt trước, phí phạt, thông báo còn rời rạc.
- Người dùng cần trải nghiệm tìm kiếm và khám phá tài liệu tốt hơn.

**Hình ảnh nên dùng:**
- Sơ đồ 3 khối đơn giản tự vẽ trên Canva: `Hạn chế hiện tại -> Nhu cầu -> Giải pháp đề xuất`.
- Không cần dùng ảnh báo cáo ở slide này.

**Lời dẫn:**
> Qua khảo sát các hệ thống thư viện hiện có, nhóm nhận thấy phần quản lý cơ bản đã có, nhưng khả năng khám phá tri thức còn hạn chế. Người dùng thường phải nhớ đúng tên sách hoặc từ khóa. Trong khi đó, nhiều tài liệu PDF có nội dung giá trị nhưng không được index sâu để phục vụ tìm kiếm và gợi ý.

---

## Slide 3. Mục tiêu hệ thống

**Tiêu đề:** Mục tiêu của đề tài

**Nội dung trên slide:**
- Xây dựng hệ thống quản lý thư viện trực tuyến hoàn chỉnh.
- Hỗ trợ bạn đọc: tìm kiếm, xem chi tiết, mượn, đặt trước, phí phạt, wishlist, rating.
- Hỗ trợ thủ thư: quản lý ấn phẩm, bản sao, lưu thông, thanh toán, dashboard.
- Ứng dụng AI/NLP cho semantic search, recommendation và metadata từ PDF.
- Đảm bảo khả năng triển khai, kiểm thử và mở rộng.

**Hình ảnh nên dùng:**
- Icon/shape 3 cột: `Bạn đọc`, `Thủ thư`, `AI`.
- Có thể thêm `figures/ch06/frontend/search_page.png` nhỏ ở góc.

**Lời dẫn:**
> Mục tiêu của nhóm là tạo một sản phẩm có thể vận hành thử, không chỉ là demo một chức năng AI riêng lẻ. Vì vậy hệ thống phải có lõi nghiệp vụ thư viện đầy đủ, sau đó AI được đặt vào như một lớp hỗ trợ khám phá tài liệu.

---

## Slide 4. Phạm vi và người dùng

**Tiêu đề:** Phạm vi hệ thống

**Nội dung trên slide:**
- Nhóm người dùng chính: khách, bạn đọc, thủ thư, quản trị viên.
- Dữ liệu lõi: ấn phẩm, bản sao, tác giả, danh mục, tag, người dùng.
- Dữ liệu nghiệp vụ: mượn--trả, đặt trước, phí phạt, thanh toán, thông báo.
- Dữ liệu AI: PDF text, vector embedding, summary, audience, tag, interaction.

**Hình ảnh nên dùng:**
- `figures/ch05/usecase/overview.png`
- Nếu ảnh quá dày, crop lấy vùng tác nhân và nhóm chức năng chính.

**Lời dẫn:**
> Về phạm vi, hệ thống phục vụ cả phía người dùng cuối lẫn người vận hành thư viện. Điều này làm bài toán phức tạp hơn vì AI không thể đứng riêng, mà phải đi cùng dữ liệu nghiệp vụ như bản sao còn khả dụng, trạng thái mượn, phí phạt và phân quyền.

---

## Slide 5. Yêu cầu chức năng chính

**Tiêu đề:** Các nhóm chức năng cốt lõi

**Nội dung trên slide:**
- Xác thực và tài khoản: đăng ký, đăng nhập, Google OAuth2, JWT.
- Catalog: quản lý ấn phẩm, bản sao, tác giả, danh mục, tag.
- Circulation: mượn, nhận sách, trả sách, đặt trước, phí phạt.
- Discovery: tìm kiếm keyword, semantic search, sách tương tự.
- AI: xử lý PDF, sinh metadata, gợi ý sách.

**Hình ảnh nên dùng:**
- `figures/ch05/usecase/modules/02_discovery_catalog.png` hoặc `figures/ch05/usecase/modules/04_librarian_operations.png`.
- Nếu cần gọn, tự vẽ 5 module dạng card.

**Lời dẫn:**
> Nhóm chia yêu cầu chức năng theo các cụm nghiệp vụ. Điểm quan trọng là các chức năng AI như semantic search và recommendation không tách khỏi hệ thống, mà được nối trực tiếp với catalog, lịch sử tương tác, wishlist, rating và trạng thái bản sao.

---

## Slide 6. Yêu cầu phi chức năng

**Tiêu đề:** Các yêu cầu phi chức năng được kiểm soát

**Nội dung trên slide:**
- Usability: giao diện nhất quán, dễ dùng cho bạn đọc và thủ thư.
- Performance: phân trang, giới hạn kết quả, timeout.
- Reliability: fallback khi AI/Gemini lỗi.
- Security: JWT/role, HMAC callback, webhook signature, presigned upload.
- Maintainability: tách FE, BE, AI rõ ràng.

**Hình ảnh nên dùng:**
- Dùng icon checklist 5 dòng.
- Có thể kết nối với slide kiểm thử phi chức năng về sau.

**Lời dẫn:**
> Ngay từ yêu cầu, nhóm xác định các tiêu chí phi chức năng có thể kiểm chứng được. Ví dụ hiệu năng được kiểm soát bằng pagination, limit và timeout; độ tin cậy được kiểm soát bằng fallback; bảo mật được kiểm soát bằng JWT, chữ ký HMAC và presigned URL.

---

## Slide 7. Tổng quan thiết kế hệ thống

**Tiêu đề:** Kiến trúc tổng quan

**Nội dung trên slide:**
- Frontend React/Vite tiếp nhận thao tác người dùng.
- Backend Spring Boot là nguồn sự thật nghiệp vụ.
- AI Service FastAPI xử lý PDF, vector search và recommendation.
- PostgreSQL/pgvector lưu dữ liệu nghiệp vụ và vector.
- External services: S3, Gemini, PayOS, Google OAuth2, Email.

**Hình ảnh nên dùng:**
- `figures/ch05/architecture/system_architecture_overview.png`
- Hoặc `figures/ch08/deployment_detail.png` nếu muốn nhấn mạnh triển khai.

**Lời dẫn:**
> Về kiến trúc, nhóm chọn cách tách hệ thống thành ba phần rõ ràng. Backend vẫn là trung tâm nghiệp vụ; AI service chỉ xử lý các tác vụ ML/NLP và trả về kết quả suy luận. Cách này giúp hệ thống không phụ thuộc tuyệt đối vào AI.

---

## Slide 8. Lựa chọn kiến trúc

**Tiêu đề:** Vì sao chọn Modular Monolith + AI Satellite?

**Nội dung trên slide:**
- Backend dùng Modular Monolith để giữ giao dịch nghiệp vụ nhất quán.
- Các module tách theo bounded context: auth, user, catalog, circulation, recommendation.
- AI Service tách riêng vì workload khác biệt: PDF, embedding, vector, LLM.
- Ít phức tạp vận hành hơn microservices nhưng vẫn mở rộng được phần AI.

**Hình ảnh nên dùng:**
- `figures/ch05/architecture/compare-architecture.png`
- `figures/ch05/architecture/bounded_contexts.png`

**Lời dẫn:**
> Nhóm không chọn microservices hoàn chỉnh vì chi phí vận hành cao so với phạm vi đồ án. Thay vào đó, backend được tổ chức theo modular monolith để dễ kiểm soát transaction, còn AI service được tách riêng vì có hệ sinh thái, tài nguyên và tốc độ thay đổi khác với backend nghiệp vụ.

---

## Slide 9. Thiết kế cơ sở dữ liệu

**Tiêu đề:** Thiết kế dữ liệu nghiệp vụ và AI

**Nội dung trên slide:**
- Core data: publication, item, user, role, author, category, tag.
- Transactional data: borrowing, reservation, fine, notification.
- Behavioral/AI data: interaction, rating, wishlist, vector, ETL run.
- AI dùng `pgvector` để lưu embedding theo chunk.

**Hình ảnh nên dùng:**
- `figures/ch05/database/erd.png`
- Với Canva, nên crop/chia ERD thành 2 phần: nghiệp vụ lõi và AI/recommendation.

**Lời dẫn:**
> Thiết kế dữ liệu là nền để hệ thống vận hành ổn định. Nhóm phân biệt rõ ấn phẩm và bản sao vật lý, vì nghiệp vụ mượn trả xử lý trên từng bản sao. Phần AI không lưu rời rạc mà liên kết về publication id, giúp backend luôn lấy được metadata cuối cùng từ catalog.

---

## Slide 10. Thiết kế AI: nguyên tắc chính

**Tiêu đề:** AI không thay thế nghiệp vụ thư viện

**Nội dung trên slide:**
- AI xử lý những việc phù hợp: PDF, embedding, metadata, semantic search, recommendation.
- Backend quyết định nghiệp vụ: phân quyền, bản sao khả dụng, mượn--trả, phí phạt.
- AI chỉ trả metadata bổ trợ hoặc `publication_id`.
- Có fallback khi AI service hoặc Gemini lỗi.

**Hình ảnh nên dùng:**
- Tự vẽ lại sơ đồ 3 khối từ báo cáo: Frontend -> Backend -> AI Service -> pgvector.
- Có thể chụp từ trang báo cáo nếu cần: hình “Trách nhiệm giữa frontend, backend và AI service”.

**Lời dẫn:**
> Đây là điểm thiết kế quan trọng nhất của đề tài. Nhóm không biến LLM thành trung tâm. LLM chỉ hỗ trợ biên mục; semantic search dựa trên vector nội dung thật; recommendation dựa trên hành vi thật; còn mọi quyết định nghiệp vụ vẫn nằm ở backend.

---

## Slide 11. Thiết kế AI: xử lý PDF

**Tiêu đề:** Module AI 1: Xử lý PDF thành tri thức có thể tìm kiếm

**Nội dung trên slide:**
- Thủ thư upload PDF qua presigned URL.
- AI trích xuất text, làm sạch, chia chunk.
- Sinh embedding và lưu vào `ai_engine.publication_vectors`.
- Gemini reduce metadata: summary, audience, 5 tag tiếng Việt, alias tiếng Anh.
- Lưu trạng thái ETL: running/success/failed.

**Hình ảnh nên dùng:**
- `figures/ch06/ai/etl_run.png`
- `figures/ch06/ai/summary_tag.png`
- Hoặc tự vẽ pipeline: PDF -> Clean -> Chunk -> Embed -> LLM Reduce -> DB.

**Lời dẫn:**
> Khi thủ thư upload PDF, hệ thống không bắt người dùng chờ toàn bộ AI pipeline. Backend lưu tài liệu trước, sau đó AI xử lý nền. Kết quả là một cuốn sách không chỉ có metadata nhập tay, mà còn có summary, audience, tag và vector nội dung thật.

---

## Slide 12. Thiết kế AI: semantic search

**Tiêu đề:** Module AI 2: Tìm kiếm ngữ nghĩa

**Nội dung trên slide:**
- Query được encode thành vector.
- So khớp với vector chunk bằng cosine distance trong pgvector.
- Gom kết quả theo `publication_id`.
- Backend lấy lại metadata, rating và tình trạng bản sao.
- Keyword search vẫn được giữ để xử lý truy vấn ngắn/rõ tên.

**Hình ảnh nên dùng:**
- `figures/ch06/ai/semantic_search.png`
- Có thể thêm pseudo SQL ngắn:
  `ORDER BY embedding <=> query_vector LIMIT k`

**Lời dẫn:**
> Semantic search giúp người dùng tìm theo ý định, ví dụ “sách nhập môn cơ sở dữ liệu dễ hiểu”, thay vì phải nhớ chính xác tên sách. Tuy nhiên nhóm không thay thế hoàn toàn keyword search, vì với truy vấn ngắn như tên sách hoặc tác giả, lexical search vẫn chính xác hơn.

---

## Slide 13. Thiết kế AI: recommendation

**Tiêu đề:** Module AI 3: Gợi ý sách hybrid

**Nội dung trên slide:**
- Content-based: dựa trên vector nội dung sách người dùng đã tương tác.
- ALS collaborative filtering: học từ implicit feedback.
- Trending fallback: xử lý user mới, item mới hoặc lỗi model.
- Trọng số hành vi: watch < wishlist < borrowed.
- Lọc sách không còn bản sao khả dụng.

**Hình ảnh nên dùng:**
- `figures/ch06/ai/recommendation.png`
- Tự vẽ flow: User interaction -> CBF/ALS/Trending -> Merge -> Available books.

**Lời dẫn:**
> Với recommendation, nhóm chọn hướng hybrid vì dữ liệu thư viện thường thưa. Người dùng mới thì dùng trending; người dùng có ít tương tác thì dùng content-based realtime; khi đủ dữ liệu thì kết hợp thêm ALS. Kết quả cuối cùng vẫn phải lọc theo sách còn bản sao khả dụng để gợi ý có giá trị thực tế.

---

## Slide 14. Hiện thực Frontend

**Tiêu đề:** Frontend: trải nghiệm cho bạn đọc, thủ thư và admin

**Nội dung trên slide:**
- React + TypeScript + Vite.
- Route theo vai trò: public, reader, librarian, admin.
- Context: auth, language, theme, notification, upload.
- Service layer đóng gói API.
- Realtime notification, upload panel, PayOS QR, semantic search.

**Hình ảnh nên dùng:**
- `figures/ch06/frontend/frontend_structure.png`
- `figures/ch06/frontend/search_page.png`
- `figures/ch06/frontend/reader_dashboard.png`

**Lời dẫn:**
> Ở frontend, nhóm không chỉ làm giao diện tĩnh. Frontend điều phối phiên đăng nhập, phân quyền route, gọi service API, hiển thị trạng thái upload, nhận thông báo realtime và tích hợp các kết quả AI như semantic search, similar books và metadata AI.

---

## Slide 15. Demo UI phía bạn đọc

**Tiêu đề:** Luồng sử dụng của bạn đọc

**Nội dung trên slide:**
- Tìm kiếm tài liệu keyword/semantic.
- Xem chi tiết sách, summary/tag AI, bản sao khả dụng.
- Mượn hoặc đặt trước.
- Theo dõi sách đang mượn, phí phạt, wishlist, notification.
- Nhận gợi ý sách phù hợp.

**Hình ảnh nên dùng:**
- `figures/ch06/frontend/search_page.png`
- `figures/ch06/frontend/book_detail.png`
- `figures/ch06/frontend/borrow_book.png`
- `figures/ch06/frontend/reader_dashboard.png`

**Lời dẫn:**
> Với bạn đọc, nhóm tập trung vào luồng khám phá và sử dụng tài liệu. Người dùng có thể tìm kiếm, xem chi tiết, mượn hoặc đặt trước, sau đó theo dõi toàn bộ trạng thái trong dashboard cá nhân. Những tương tác này đồng thời trở thành dữ liệu đầu vào cho recommendation.

---

## Slide 16. Demo UI phía thủ thư/admin

**Tiêu đề:** Luồng vận hành của thủ thư và admin

**Nội dung trên slide:**
- Quản lý ấn phẩm và bản sao.
- Upload bìa/PDF, kích hoạt AI ETL.
- Xử lý yêu cầu mượn, nhận sách, trả sách, phí phạt.
- Dashboard vận hành và thông báo.
- Admin quản lý người dùng, thủ thư, chính sách, audit log.

**Hình ảnh nên dùng:**
- `figures/ch06/frontend/publication_management.png`
- `figures/ch06/frontend/upload_book.png`
- `figures/ch06/backend/catalog.png`
- `figures/ch06/backend/circulation.png`

**Lời dẫn:**
> Với thủ thư, hệ thống hỗ trợ toàn bộ vòng đời của một cuốn sách: tạo ấn phẩm, thêm bản sao, upload PDF để AI xử lý, sau đó vận hành mượn--trả và phí phạt. Với admin, hệ thống bổ sung các chức năng kiểm soát như tài khoản, chính sách và audit.

---

## Slide 17. Hiện thực Backend

**Tiêu đề:** Backend: modular monolith theo nghiệp vụ

**Nội dung trên slide:**
- Spring Boot 3.3.5, Java 21.
- Maven modules: bootstrap, shared, auth, user, catalog, circulation, recommendation.
- Clean Architecture trong từng module.
- Chuẩn hóa response, lỗi, phân trang.
- JWT/role, OAuth2, scheduler, WebSocket, Kafka/email.

**Hình ảnh nên dùng:**
- `figures/ch06/backend/backend_structure.png`
- `figures/ch06/backend/swagger.png`
- `figures/ch05/architecture/folder_structure_backend.png` nếu muốn nói thiết kế.

**Lời dẫn:**
> Backend là phần giữ tính nhất quán nghiệp vụ. Nhóm tách code theo module nghiệp vụ thay vì chia lớp kỹ thuật toàn cục. Nhờ đó auth, catalog, circulation và recommendation có ranh giới rõ, dễ kiểm thử và dễ mở rộng.

---

## Slide 18. Backend: các luồng nghiệp vụ nổi bật

**Tiêu đề:** Các luồng nghiệp vụ backend đã hiện thực

**Nội dung trên slide:**
- Auth/User: JWT, refresh token, email verification, Google OAuth2.
- Catalog: publication, item, author, category, tag, presigned upload.
- Circulation: borrow, pickup, return, reservation, fine, PayOS.
- Notification: Kafka event, email, WebSocket realtime.
- AI Gateway: semantic search, recommendation, signed callback.

**Hình ảnh nên dùng:**
- `figures/ch06/backend/google_oauth2.png`
- `figures/ch06/backend/notification.png`
- `figures/ch06/backend/ai_callback.png`

**Lời dẫn:**
> Các nghiệp vụ backend không tách rời nhau. Ví dụ khi thủ thư upload PDF, catalog lưu file, recommendation module gọi AI gateway, AI callback cập nhật trạng thái, notification báo cho người dùng. Điều này cho thấy hệ thống đã nối được các module thành luồng vận hành thật.

---

## Slide 19. Hiện thực AI Service

**Tiêu đề:** AI Service: FastAPI, ETL, Vector Search và Recommendation

**Nội dung trên slide:**
- FastAPI gateway cho semantic search, similar books, recommendation.
- Celery worker xử lý PDF bất đồng bộ.
- PyMuPDF extract text, SBERT embedding, pgvector HNSW.
- Gemini reduce metadata với JSON contract.
- Fallback local khi LLM lỗi/quota.

**Hình ảnh nên dùng:**
- `figures/ch06/ai/ai_structure.png`
- `figures/ch06/ai/vector_db.png`
- `figures/ch06/ai/summary_tag.png`

**Lời dẫn:**
> AI service được tách riêng để tận dụng Python và các thư viện ML/NLP. Service này vừa có API realtime cho search/recommendation, vừa có worker nền cho PDF ETL. Điểm quan trọng là pipeline có kiểm soát: có hash skip, có validate JSON, có fallback và có trạng thái xử lý.

---

## Slide 20. Tích hợp và triển khai

**Tiêu đề:** Đóng gói và triển khai hệ thống

**Nội dung trên slide:**
- FE, BE, AI đều có Dockerfile.
- Docker Compose cho PostgreSQL, Kafka, RabbitMQ, services.
- Nginx reverse proxy:
  - `/api/` -> Spring Boot.
  - `/ws` -> WebSocket backend.
  - `/` -> React SPA.
- Production cần quản lý env, secret, HTTPS.

**Hình ảnh nên dùng:**
- `figures/ch08/deployment_detail.png`
- `figures/ch08/docker_logo.png`
- Nếu nói domain/HTTPS: `figures/ch09/dns_flow.png`.

**Lời dẫn:**
> Về triển khai, nhóm đóng gói các thành phần bằng Docker. Nginx là cửa vào duy nhất cho người dùng, định tuyến REST API và WebSocket về backend, còn các request giao diện được phục vụ bởi React SPA. Đây là nền tảng để triển khai lên VPS hoặc môi trường production.

---

## Slide 21. Chiến lược kiểm thử

**Tiêu đề:** Kiểm thử phân tầng

**Nội dung trên slide:**
- Frontend: unit, context, component, service contract.
- Backend: unit, controller, integration PostgreSQL bằng Testcontainers.
- AI: pytest cho PDF, LLM, SQL contract, recommender, worker.
- Non-functional: usability, performance, reliability, security, maintainability.

**Hình ảnh nên dùng:**
- Tự vẽ pyramid hoặc 4 cột kiểm thử.
- Có thể dùng `figures/ch07/test-results/fe-jest-result.png`, `be-test-result.png`, `ai-pytest-result.png` ở slide sau.

**Lời dẫn:**
> Nhóm không chỉ test theo màn hình. Bộ test được tách theo tầng: frontend kiểm tra state và service contract, backend kiểm tra use case và SQL thật, AI kiểm tra pipeline và contract. Các yêu cầu phi chức năng cũng được đối chiếu với test cụ thể.

---

## Slide 22. Kết quả kiểm thử

**Tiêu đề:** Kết quả test đạt được

**Nội dung trên slide:**
- Frontend: 11/11 suites, 58/58 tests passed.
- Backend: 23 test classes, 79/79 tests passed.
- AI Service: 9 test files, 44 passed, 3 live integration skipped mặc định.
- Không có failures/errors trong các bộ test chính.
- Có artifact ảnh và log lưu trong báo cáo.

**Hình ảnh nên dùng:**
- `figures/ch07/test-results/fe-jest-result.png`
- `figures/ch07/test-results/be-test-result.png`
- `figures/ch07/test-results/ai-pytest-result.png`
- `figures/ch07/test-results/ai-gemini-live-result.png`

**Lời dẫn:**
> Kết quả kiểm thử cho thấy các phần chính đều pass. Frontend có 58 test, backend có 79 test, AI có 44 test offline pass và giữ thêm 3 test live để chạy khi môi trường tích hợp sẵn sàng. Với AI, nhóm còn có artifact gọi Gemini thật trên PDF mẫu.

---

## Slide 23. Kiểm thử phi chức năng

**Tiêu đề:** Đối chiếu yêu cầu phi chức năng

**Nội dung trên slide:**
- Usability: language/theme/notification/upload state được test.
- Performance: pagination, limit, timeout, latency live test.
- Reliability: fallback khi AI/Gemini/ALS lỗi.
- Security: JWT/role, PayOS signature, HMAC callback, presigned upload.
- Maintainability: module tách rõ, service contract ổn định.

**Hình ảnh nên dùng:**
- Tự vẽ bảng 5 dòng `NFR -> Cách kiểm chứng -> Kết quả`.
- Có thể dùng icon xanh “Pass” cho từng dòng.

**Lời dẫn:**
> Điểm đáng nói là nhóm không chỉ ghi yêu cầu phi chức năng ở chương 4, mà đã quay lại đối chiếu ở chương kiểm thử. Những tiêu chí đo được như limit, timeout, fallback, chữ ký callback, phân quyền và cấu trúc module đều có test hoặc contract tương ứng.

---

## Slide 24. Kết quả, hạn chế và hướng phát triển

**Tiêu đề:** Tổng kết và hướng phát triển

**Nội dung trên slide:**
- Đã hoàn thiện hệ thống FE/BE/AI có thể vận hành thử.
- Đã tích hợp AI có kiểm soát: PDF ETL, semantic search, hybrid recommendation.
- Hạn chế:
  - Gợi ý phụ thuộc lượng tương tác.
  - Gemini phụ thuộc quota/độ ổn định.
  - Dữ liệu kiểm thử chưa đủ lớn như thư viện thật.
- Hướng phát triển:
  - Incremental indexing.
  - Cải thiện recommendation bằng thêm tín hiệu hành vi.
  - Mở rộng dashboard thống kê và triển khai production hardening.

**Hình ảnh nên dùng:**
- Sơ đồ roadmap 3 bước.
- Có thể đặt ảnh `figures/ch08/deployment_detail.png` nhỏ để nhấn mạnh hệ thống đã sẵn sàng triển khai.

**Lời dẫn:**
> Tổng kết lại, nhóm đã xây dựng được một hệ thống quản lý thư viện trực tuyến có đủ lõi nghiệp vụ và AI service độc lập. Hạn chế lớn nhất hiện tại nằm ở dữ liệu và môi trường vận hành thật. Trong tương lai, hệ thống có thể phát triển theo hướng incremental indexing, recommendation tốt hơn và dashboard vận hành sâu hơn.

---

# Gợi ý phân bổ thời gian

| Phần | Slide | Thời lượng |
|---|---:|---:|
| Đặt vấn đề và mục tiêu | 1-6 | 4 phút |
| Phân tích và thiết kế | 7-13 | 6 phút |
| Hiện thực | 14-20 | 7 phút |
| Kiểm thử | 21-23 | 4 phút |
| Hạn chế và hướng phát triển | 24 | 1-2 phút |

# Slide nên làm kỹ nhất

Nếu thời gian thiết kế Canva hạn chế, ưu tiên làm đẹp các slide sau:

1. Slide 7: Kiến trúc tổng quan.
2. Slide 10: Ranh giới Backend và AI.
3. Slide 11: Pipeline PDF ETL.
4. Slide 13: Hybrid recommendation.
5. Slide 17: Backend modular monolith.
6. Slide 20: Deployment architecture.
7. Slide 22: Test results.

# Gợi ý demo miệng nếu hội đồng hỏi

**Nếu hỏi AI khác gì keyword search?**
> Keyword search cần từ khóa xuất hiện trong metadata hoặc nội dung. Semantic search encode truy vấn và chunk PDF vào cùng không gian vector, nên có thể tìm theo ý nghĩa gần nhau. Tuy nhiên hệ thống vẫn giữ keyword search để xử lý truy vấn ngắn, tên sách hoặc tên tác giả chính xác.

**Nếu hỏi vì sao không để LLM quyết định tất cả?**
> Vì nghiệp vụ thư viện cần ổn định và kiểm chứng được. LLM chỉ dùng để reduce metadata từ excerpt PDF. Tìm kiếm dùng vector, recommendation dùng hành vi và thuật toán hybrid, còn backend quyết định bản sao có được mượn hay không.

**Nếu hỏi recommendation xử lý user mới thế nào?**
> User mới dùng trending fallback. Khi có vài tương tác thì dùng content-based realtime. Khi có đủ dữ liệu hành vi thì kết hợp thêm ALS collaborative filtering.

**Nếu hỏi hệ thống có an toàn khi AI lỗi không?**
> Có. AI service lỗi thì catalog search, mượn--trả và thanh toán vẫn hoạt động. PDF ETL có trạng thái failed và fallback metadata. Recommendation fallback sang trending hoặc cache.

**Nếu hỏi kiểm thử đã đủ chưa?**
> Bộ test hiện tại đủ để chứng minh unit, controller, contract và integration database ở phạm vi đồ án. Hạn chế còn lại là E2E nhiều service và benchmark trên dữ liệu lớn, nhóm đã nêu trong hướng phát triển.

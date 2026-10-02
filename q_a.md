# 100 CÂU HỎI & ĐÁP PHẢN BIỆN ĐỒ ÁN TỐT NGHIỆP DỰ ÁN LIBRARY74

> **Đề tài:** XÂY DỰNG HỆ THỐNG QUẢN LÝ THƯ VIỆN TRỰC TUYẾN TÍCH HỢP AI HỖ TRỢ TÌM KIẾM VÀ GỢI Ý SÁCH  
> **Mã số đề tài:** HK253-DATN-076  
> **Sinh viên thực hiện:** Võ Quang Thắng (MSSV: 2213214)  
> **Giảng viên hướng dẫn:** TS. Trương Tuấn Anh, CN. Dương Huỳnh Anh Đức  
> **Giảng viên phản biện:** ThS. Trần Thị Quế Nguyệt  
> **Đơn vị:** Khoa Khoa học và Kỹ thuật Máy tính – Trường Đại học Bách Khoa, ĐHQG-HCM  
> **Địa chỉ triển khai thực tế:** [https://library74.uk](https://library74.uk)

---

## LƯU Ý CHIẾN LƯỢC KHI BẢO VỆ TRƯỚC HỘI ĐỒNG & GIẢNG VIÊN PHẢN BIỆN
1. **Không nói về cú pháp mã nguồn:** Thầy cô hội đồng và phản biện sẽ không đọc chi tiết từng dòng code. Hãy tập trung giải thích: **Bản chất bài toán $\rightarrow$ Kiến trúc & Quyết định thiết kế $\rightarrow$ Cơ chế xử lý trường hợp biên $\rightarrow$ Số liệu thực nghiệm chứng minh**.
2. **Luôn bảo vệ bằng số liệu định lượng (Data-driven Defense):** Thay vì nói *"hệ thống chạy nhanh và tìm kiếm tốt"*, hãy trả lời: *"Hệ thống đạt điểm tin cậy AI 95.46/100, Search Recall@5 đạt 87.5%, MRR đạt 1.000 tuyệt đối, độ trễ p95 đạt 540.90ms so với ngân sách SLA 3000ms; kiểm thử chịu tải 200 người dùng ảo duy trì tỷ lệ lỗi 0.00%"*.
3. **Thành thật về các giới hạn kỹ thuật (Honest Limitations):** Thầy cô đánh giá rất cao sinh viên biết rõ ranh giới của giải pháp (ví dụ: ALS khởi động nguội dựa trên trending fallback; Precision@5 đạt 63.3% do nhiễu tài liệu liên quan ở chủ đề hẹp).

---

# MỤC LỤC 100 CÂU HỎI THEO 6 PHÂN VÙNG KIẾN THỨC

- **Phần 1: Bối cảnh, Mục tiêu & Tổng quan Kiến trúc Hệ thống** *(Câu 1 – 15)*
- **Phần 2: Nghiệp vụ Quản trị Thư viện & Lưu thông Sách (Circulation & Core Business Logic)** *(Câu 16 – 35)*
- **Phần 3: Phân hệ Trí tuệ Nhân tạo & Khai phá Tri thức (AI, NLP, Search & Recommendation)** *(Câu 36 – 60)*
- **Phần 4: Bảo mật, Tích hợp & Tính Toàn vẹn Dữ liệu** *(Câu 61 – 70)*
- **Phần 5: Chiến lược, Thực nghiệm & Kết quả Kiểm thử (Chương 7)** *(Câu 71 – 85)*
- **Phần 6: Triển khai, Vận hành Thực tế, CI/CD & Giám sát (Chương 8)** *(Câu 86 – 100)*

---

# PHẦN 1: BỐI CẢNH, MỤC TIÊU & TỔNG QUAN KIẾN TRÚC HỆ THỐNG (Câu 1 – 15)

### Câu 1: Tại sao em lại chọn xây dựng một hệ thống thư viện mới thay vì triển khai các giải pháp nguồn mở có sẵn như Koha hay DSpace?
- **Ý đồ giám khảo:** Kiểm tra xem sinh viên có hiểu giá trị cốt lõi và bài toán thực tế của đề tài hay chỉ "phát minh lại cái bánh xe".
- **Trả lời:**  
  Koha và DSpace là các hệ thống ILS/kho tài liệu số kinh điển, rất mạnh về nghiệp vụ biên mục MARC21 truyền thống. Tuy nhiên, chúng có hai rào cản lớn hiện nay:
  1. *Khả năng tra cứu ngữ nghĩa:* Chúng phụ thuộc hoàn toàn vào tìm kiếm từ khóa chuỗi chính xác trên tiêu đề, tác giả hoặc mô tả tĩnh. Sinh viên không nhớ đúng tên sách chuyên ngành hoặc chỉ có nhu cầu học tập theo khái niệm sẽ không tìm được.
  2. *Kiến trúc công nghệ nguyên khối cũ:* Khó mở rộng để tích hợp các mô hình học sâu (deep learning), vector database và quy trình trích xuất tự động từ file PDF nguyên bản.  
  Library74 được thiết kế theo hướng hiện đại: tự động hóa khâu số hóa tài liệu bằng AI Pipeline, tìm kiếm ngữ nghĩa theo nội dung học thuật bên trong sách (chứ không chỉ bìa sách), tích hợp gợi ý cá nhân hóa và quy trình mượn - trả - phạt trực tuyến thông qua cổng thanh toán QR động.

---

### Câu 2: Trình bày kiến trúc tổng thể 3 tầng của hệ thống Library74?
- **Ý đồ giám khảo:** Đánh giá khả năng bao quát kiến trúc phần mềm và phân tách trách nhiệm.
- **Trả lời:**  
  Hệ thống được tổ chức thành 3 lớp phân tách rạch ròi:
  1. **Tầng Giao diện (Presentation Layer - Frontend):** Ứng dụng Single Page Application (SPA) xây dựng bằng React, TypeScript và Vite, đóng gói bên trong Nginx. Đảm nhận hiển thị theo vai trò (Độc giả, Thủ thư, Quản trị viên), quản lý trạng thái tập trung và kết nối realtime qua WebSocket.
  2. **Tầng Nghiệp vụ trung tâm (Core Business Backend):** Xây dựng bằng Spring Boot 3.3.5 (Java 21) theo kiến trúc Modular Monolith. Đây là nguồn dữ liệu duy nhất (Single Source of Truth) chịu trách nhiệm về toàn vẹn dữ liệu, xác thực phân quyền, quản lý mượn trả, giao dịch tài chính PayOS và đóng vai trò Gateway điều phối sang AI Service.
  3. **Tầng Trí tuệ Nhân tạo (AI & Knowledge Extraction Service):** Sử dụng Python 3.10, kết hợp FastAPI (gateway đồng bộ cho tìm kiếm/gợi ý) và Celery Worker chạy trên RabbitMQ (xử lý nền bất đồng bộ cho quy trình ETL PDF). Tầng này sử dụng PostgreSQL với extension `pgvector` để lưu trữ và truy vấn vector tương đồng.

---

### Câu 3: Tại sao Backend lại chọn kiến trúc Modular Monolith thay vì Microservices hoàn chỉnh?
- **Ý đồ giám khảo:** Kiểm tra tư duy thực tế về đánh đổi kiến trúc (Architectural Trade-offs).
- **Trả lời:**  
  Đây là một quyết định kỹ thuật có chủ đích dựa trên sự cân bằng giữa chi phí vận hành và tính module hóa:
  - *Hạn chế của Microservices:* Đối với quy mô một hệ thống thư viện đại học vừa và nhỏ, microservices sẽ mang lại độ phức tạp khổng lồ về distributed transaction (2PC hoặc Saga), độ trễ mạng giữa các service (network hops), chi phí đồng bộ dữ liệu và gánh nặng giám sát hạ tầng.
  - *Ưu thế của Modular Monolith:* Dự án chia mã nguồn thành các Bounded Context độc lập (`auth`, `user`, `admin`, `catalog`, `circulation`, `recommendation`) giao tiếp qua các Shared Port hoặc sự kiện nội bộ. Thiết kế này giúp đảm bảo tính cô lập cao (high cohesion, low coupling), bảo toàn tính toàn vẹn giao dịch ACID của cơ sở dữ liệu quan hệ, dễ dàng kiểm thử tích hợp nhưng vẫn giữ cấu trúc sẵn sàng để tách thành Microservices trong tương lai nếu lưu lượng tăng đột biến.

---

### Câu 4: Phân biệt vai trò của Apache Kafka và RabbitMQ trong hệ thống? Tại sao phải dùng cả hai Message Broker?
- **Ý đồ giám khảo:** Kiểm tra xem sinh viên có dùng bừa bãi công nghệ hay có lý do kỹ thuật rõ ràng.
- **Trả lời:**  
  Hệ thống sử dụng hai Message Broker cho hai mục đích hoàn toàn khác biệt:
  1. **Apache Kafka trong Backend (Event Streaming & Audit Log):** Đóng vai trò là xương sống xử lý luồng sự kiện phân tán. Khi một sự kiện lưu thông xảy ra (ví dụ: sách được trả, quá hạn, phát sinh phí phạt), sự kiện được bắn lên Kafka để các module khác (Notification, Audit, Statistics) tiêu thụ độc lập mà không làm nghẽn luồng xử lý chính. Kafka lưu trữ log sự kiện bền bỉ, cho phép replay lại sự kiện khi cần.
  2. **RabbitMQ trong AI Service (Task Queue cho Celery Worker):** Đóng vai trò là hàng đợi tác vụ truyền thống (Job Queue). Việc tải file PDF dung lượng lớn, bóc tách trang và gọi embedding đòi hỏi cơ chế phân phối tác vụ công bằng (round-robin), xác nhận nhận việc (ACK/NACK) và quản lý trạng thái tác vụ nền linh hoạt, điều mà Celery + RabbitMQ xử lý chuyên biệt và nhẹ nhàng hơn nhiều so với Kafka.

---

### Câu 5: Tại sao hệ thống lại sử dụng PostgreSQL 15 với extension `pgvector` thay vì một Vector Database chuyên dụng như Milvus, Pinecone hay Qdrant?
- **Ý đồ giám khảo:** Đánh giá hiểu biết về kiến trúc dữ liệu và chi phí bảo trì.
- **Trả lời:**  
  Việc tích hợp `pgvector` ngay trong PostgreSQL mang lại 3 lợi thế vượt trội:
  1. **Toàn vẹn quan hệ & Loại bỏ Dual-Write:** Dữ liệu vector nhúng liên kết trực tiếp với bảng `publications` và `chunks` bằng khóa ngoại (Foreign Key). Khi một cuốn sách bị xóa hoặc cập nhật, vector tương ứng được xử lý nhất quán trong cùng một transaction, tránh rủi ro lệch dữ liệu giữa hệ thống SQL và Vector DB bên ngoài.
  2. **Hỗ trợ Truy vấn lai (Hybrid Filtering):** Hệ thống có thể thực hiện câu lệnh kết hợp đồng thời giữa tính toán khoảng cách cosine trên vector với các điều kiện lọc nghiệp vụ quan hệ (theo thể loại, trạng thái sẵn sàng, chi nhánh) trong một câu lệnh SQL duy nhất mà không cần fetch danh sách ID rồi lọc thủ công ở tầng ứng dụng.
  3. **Tiết kiệm tài nguyên hạ tầng:** Không cần duy trì, cấp phát RAM và vận hành thêm một cụm máy chủ Vector DB độc lập trên môi trường sản xuất.

---

### Câu 6: Dữ liệu giữa Catalog (Ấn phẩm) và Circulation (Lưu thông) được phân tách như thế nào trong cơ sở dữ liệu?
- **Ý đồ giám khảo:** Kiểm tra hiểu biết căn bản về nghiệp vụ thư viện chuyên nghiệp.
- **Trả lời:**  
  Hệ thống phân biệt rạch ròi giữa hai khái niệm:
  - **Ấn phẩm (`Publication`):** Là bản ghi đại diện cho tác phẩm trừu tượng (chứa ISBN, tiêu đề, tác giả, nhà xuất bản, tóm tắt, tag AI, vector nhúng). Bạn đọc tìm kiếm là tìm kiếm trên thực thể Ấn phẩm.
  - **Bản sao vật lý (`Item` hoặc `Copy`):** Đại diện cho một cuốn sách cụ thể nằm trên giá sách thực tế. Mỗi bản sao có Barcode duy nhất, vị trí kệ (Shelf Location), chi nhánh sở hữu và trạng thái lưu thông riêng biệt (`AVAILABLE`, `BORROWED`, `RESERVED`, `DAMAGED`, `LOST`).  
  Cách thiết kế này cho phép một ấn phẩm có thể có nhiều cuốn sách vật lý ở các chi nhánh khác nhau với các trạng thái lưu thông hoàn toàn độc lập.

---

### Câu 7: Phân định ranh giới trách nhiệm giữa Spring Boot Backend và FastAPI AI Service như thế nào?
- **Ý đồ giám khảo:** Kiểm tra xem logic nghiệp vụ có bị rò rỉ (leak) sang tầng AI hay không.
- **Trả lời:**  
  Nguyên tắc thiết kế cốt lõi của dự án là: **AI Service chỉ là dịch vụ tính toán phụ trợ, không nắm giữ và không quyết định nghiệp vụ thư viện**.
  - *AI Service:* Chỉ chịu trách nhiệm trích xuất văn bản từ PDF, gọi embedding sinh vector, truy vấn tương đồng cosine trên bảng vector, gọi LLM trích xuất siêu dữ liệu và huấn luyện mô hình gợi ý ALS. Đầu ra của AI trả về cho Backend chỉ là danh sách ID ấn phẩm và điểm số tương đồng hoặc metadata dạng JSON.
  - *Spring Boot Backend:* Là nơi kiểm tra tính khả dụng của sách, áp dụng chính sách mượn trả, phân quyền người dùng, kiểm tra điểm tín nhiệm và định dạng phản hồi chuẩn cho client. Nếu AI Service gặp sự cố hoặc trả về kết quả rỗng, Backend tự động kích hoạt logic dự phòng (Fallback) mà không làm gián đoạn luồng người dùng.

---

### Câu 8: Mô hình giao tiếp giữa Frontend và Backend có những đặc điểm gì nổi bật?
- **Ý đồ giám khảo:** Đánh giá khả năng thiết kế API và kiến trúc client-server.
- **Trả lời:**  
  Frontend và Backend giao tiếp qua hai kênh chính:
  1. **RESTful API tiêu chuẩn:** Giao tiếp qua HTTP/2, đóng gói thống nhất qua đối tượng `ApiResponseApp` gồm mã trạng thái, thông điệp phản hồi đa ngôn ngữ (`Accept-Language: vi/en`) và payload dữ liệu. Mọi danh sách đều sử dụng cấu trúc phân trang chuẩn `PageResponse`.
  2. **WebSocket (STOMP qua SockJS):** Thiết lập kết nối hai chiều thời gian thực để đẩy thông báo trực tiếp đến từng người dùng cụ thể (User-destined notifications) khi có sự kiện mượn thành công, sách đặt trước đã có sẵn tại quầy, hoặc tiền phạt được xác nhận thanh toán.

---

### Câu 9: Tại sao dự án lại sử dụng Caddy làm Reverse Proxy bên ngoài cùng kết hợp với Nginx bên trong?
- **Ý đồ giám khảo:** Kiểm tra kiến trúc triển khai mạng và quản lý SSL/TLS.
- **Trả lời:**  
  Đây là mô hình phối hợp hai tầng proxy tối ưu cho môi trường sản xuất:
  - **Caddy ở lớp biên ngoài cùng (Edge Gateway):** Đóng vai trò là điểm tiếp nhận duy nhất trên cổng 80/443 của tên miền `library74.uk`. Caddy tự động quản lý vòng đời chứng chỉ TLS/HTTPS thông qua Let's Encrypt, thiết lập các tiêu đề bảo mật mạng (HSTS, CSP, nosniff) và định tuyến thông minh: đường dẫn `/api/*` vào Backend, `/ws/*` vào WebSocket, và các đường dẫn khác vào Frontend.
  - **Nginx bên trong container Frontend:** Đóng vai trò là máy chủ web tĩnh chuyên dụng, phục vụ các gói bundle đã biên dịch của React/Vite với hiệu năng cao, cấu hình rewrite URL cho React Router (`try_files $uri /index.html`) và thiết lập chính sách cache bất biến cho các tệp tĩnh có gắn mã băm (content hash).

---

### Câu 10: Nếu một dịch vụ như Kafka hoặc AI Service bị sập, hệ thống Library74 có dừng hoạt động hoàn toàn không?
- **Ý đồ giám khảo:** Kiểm tra tính chịu lỗi (Fault Tolerance) và nguyên lý suy thoái êm dịu (Graceful Degradation).
- **Trả lời:**  
  Hệ thống **không bị sập toàn bộ**, nhờ áp dụng cơ chế phân ly sự cố (Fault Isolation):
  - *Nếu AI Service sập:* Tính năng tìm kiếm ngữ nghĩa sẽ tự động suy thoái về tìm kiếm từ khóa SQL truyền thống kết hợp bộ lọc danh mục. Tính năng gợi ý cá nhân hóa chuyển sang hiển thị danh sách sách xu hướng (Trending / Popular books). Các nghiệp vụ mượn, trả, gia hạn, nộp phạt vẫn diễn ra bình thường 100%.
  - *Nếu Kafka sập:* Luồng giao dịch mượn trả tại quầy của thủ thư vẫn thành công vì ghi trực tiếp vào cơ sở dữ liệu quan hệ PostgreSQL; chỉ có các tác vụ bất đồng bộ như gửi thông báo realtime hoặc cập nhật thống kê bị hoãn lại và chờ phục hồi.

---

### Câu 11: Tại sao hệ thống lại sử dụng định danh TSID (Time-Sorted Unique Identifier) cho một số thực thể thay vì Auto-increment ID hay UUID?
- **Ý đồ giám khảo:** Kiểm tra hiểu biết chuyên sâu về thiết kế cơ sở dữ liệu phân tán và hiệu năng index.
- **Trả lời:**  
  - *Nhược điểm của Auto-increment ID:* Dễ bị tấn công vét cạn (enumeration attack), làm lộ số lượng dữ liệu và khó phân tán.
  - *Nhược điểm của UUID v4:* Sinh ngẫu nhiên hoàn toàn (không có tính thứ tự thời gian), dẫn đến việc ghi vào chỉ mục B-Tree của PostgreSQL gây phân mảnh trang dữ liệu nghiêm trọng (index fragmentation) và làm suy giảm hiệu năng ghi.
  - *Ưu thế của TSID (kết hợp giữa Epoch timestamp và chuỗi ngẫu nhiên):* Đảm bảo tính duy nhất toàn cục, độ dài 64-bit tối ưu lưu trữ tương đương số nguyên lớn (`BIGINT`), và quan trọng nhất là **được sắp xếp theo thời gian**. Điều này giúp các thao tác chèn bản ghi mới luôn ghi vào đuôi của B-Tree index, giữ cho bộ nhớ đệm index luôn đạt hiệu quả cao nhất.

---

### Câu 12: Hệ thống xử lý đa ngôn ngữ (Việt - Anh) như thế nào ở cả tầng Frontend và Backend?
- **Ý đồ giám khảo:** Đánh giá tính hoàn thiện và trải nghiệm người dùng quốc tế.
- **Trả lời:**  
  Hệ thống xử lý đa ngôn ngữ đồng bộ ở cả hai tầng:
  - *Ở Frontend:* Sử dụng `LanguageContext` kết hợp từ điển i18n để chuyển đổi giao diện tức thì, lưu cấu hình vào `localStorage` và tự động cập nhật thuộc tính `document.lang` phục vụ khả năng truy cập (Accessibility).
  - *Ở Backend:* Mọi request gửi lên từ client đều đính kèm tiêu đề HTTP `Accept-Language: vi` hoặc `en`. `GlobalExceptionHandler` và các service đọc message từ tệp tài nguyên `messages_vi.properties` và `messages_en.properties` để trả về thông điệp lỗi nghiệp vụ đúng ngôn ngữ của người dùng.

---

### Câu 13: Hệ sinh thái công nghệ của hệ thống gồm những phiên bản cụ thể nào và vì sao lại chọn các phiên bản này?
- **Ý đồ giám khảo:** Kiểm tra tính thực tế và tính cập nhật công nghệ của sinh viên.
- **Trả lời:**  
  - **Java 21 LTS & Spring Boot 3.3.5:** Bản phát hành hỗ trợ dài hạn (LTS) ổn định nhất của Java, hỗ trợ Virtual Threads, tối ưu hóa bộ nhớ và các tính năng bảo mật mới của Spring Security 6.
  - **Python 3.10:** Tương thích tốt nhất với hệ sinh thái học máy (PyTorch, PyMuPDF, Sentence-Transformers, Celery) mà không gặp xung đột về phiên bản thư viện C-extensions.
  - **React 18 & TypeScript 5 & Vite:** Cung cấp trải nghiệm phát triển hiện đại, kiểm tra kiểu tĩnh nghiêm ngặt (Static typing) giúp giảm thiểu lỗi runtime, và tốc độ đóng gói tối ưu.
  - **PostgreSQL 15:** Hỗ trợ ổn định cho extension `pgvector` và khả năng xử lý truy vấn JSONB linh hoạt.

---

### Câu 14: Tại sao trong kiến trúc hệ thống lại sử dụng đồng thời cả lưu trữ S3 và lưu trữ cục bộ?
- **Ý đồ giám khảo:** Đánh giá giải pháp quản lý tài nguyên tĩnh và tài liệu số.
- **Trả lời:**  
  - *Lưu trữ tương thích S3 (Object Storage):* Được dùng để lưu trữ các tệp nhị phân có dung lượng lớn và giá trị lâu dài như file PDF sách gốc và ảnh bìa chất lượng cao. Việc này giúp tách rời trạng thái lưu trữ ra khỏi container (Stateless Containers), cho phép mở rộng không gian lưu trữ không giới hạn mà không làm đầy ổ đĩa máy chủ.
  - *Lưu trữ cục bộ / Docker Volumes:* Chỉ dùng để lưu trữ tạm thời các chunk dữ liệu trong quá trình worker bóc tách PDF, các file dump sao lưu cơ sở dữ liệu hàng ngày và bộ nhớ đệm weights của mô hình nhúng Sentence-Transformers trên VPS nhằm tránh việc tải lại qua internet.

---

### Câu 15: Hệ thống tài liệu hóa API được thiết kế như thế nào để phục vụ việc tích hợp giữa các nhóm phát triển?
- **Ý đồ giám khảo:** Đánh giá tính chuẩn mực trong phát triển phần mềm theo nhóm.
- **Trả lời:**  
  Hệ thống sử dụng **OpenAPI 3.0 / Swagger UI** được tích hợp tự động qua thư viện `springdoc-openapi` tại module `library-bootstrap`.  
  Mọi endpoint đều được định nghĩa rõ ràng về URL, phương thức HTTP, mô hình yêu cầu (Request Body), cấu trúc phản hồi thành công và các mã lỗi nghiệp vụ dự kiến. Nhờ đó, lập trình viên Frontend và kỹ sư AI có thể đối chiếu chính xác hợp đồng dữ liệu (API Contract) mà không cần trao đổi thủ công, hạn chế tối đa lỗi bất tương thích schema.

---

# PHẦN 2: NGHIỆP VỤ QUẢN TRỊ THƯ VIỆN & LƯU THÔNG SÁCH (Câu 16 – 35)

### Câu 16: Trình bày vòng đời trạng thái (State Machine) của một bản sao sách vật lý (`Item`)?
- **Ý đồ giám khảo:** Đánh giá khả năng mô hình hóa nghiệp vụ cốt lõi của thư viện.
- **Trả lời:**  
  Một bản sao sách vật lý trải qua các trạng thái nghiêm ngặt:
  1. `AVAILABLE`: Sách đang nằm trên giá, sẵn sàng cho bạn đọc mượn tại quầy hoặc đặt trước.
  2. `RESERVED`: Sách được hệ thống giữ riêng cho một bạn đọc cụ thể trong danh sách chờ đặt trước (có thời hạn giữ sách).
  3. `BORROWED`: Sách đã được thủ thư quét mã barcode bàn giao cho độc giả mang về.
  4. `MAINTENANCE`: Sách đang trong quá trình bảo quản, đóng bìa hoặc phục chế kỹ thuật.
  5. `DAMAGED`: Sách bị rách nát, hư hỏng trong quá trình mượn, chuyển sang quy trình thẩm định bồi thường.
  6. `LOST`: Sách bị mất do độc giả làm thất lạc hoặc kiểm kê thất thoát, chuyển sang xử lý phạt đền bù theo giá bìa.

---

### Câu 17: Quy trình mượn sách trực tiếp tại quầy của thủ thư diễn ra như thế nào?
- **Ý đồ giám khảo:** Kiểm tra xem sinh viên có hiểu nghiệp vụ quầy thực tế hay không.
- **Trả lời:**  
  Quy trình mượn tại quầy gồm 5 bước được kiểm soát nguyên tử (Atomic transaction):
  1. Thủ thư quét thẻ sinh viên hoặc tra cứu mã độc giả trên màn hình mượn trả. Hệ thống kiểm tra điều kiện tài khoản: tài khoản còn hoạt động không, có khoản nợ phạt quá hạn chưa thanh toán không, và số sách đang mượn có vượt hạn ngạch chính sách không.
  2. Thủ thư quét mã Barcode dán trên cuốn sách vật lý.
  3. Hệ thống xác thực trạng thái của bản sao sách phải là `AVAILABLE` (hoặc `RESERVED` nhưng đúng cho độc giả hiện tại).
  4. Hệ thống tạo bản ghi giao dịch mượn (`Borrowing Transaction`), tính toán ngày hẹn trả (Due Date) theo chính sách của nhóm bạn đọc, cập nhật trạng thái bản sao thành `BORROWED`.
  5. Phát sự kiện Kafka để ghi vết kiểm toán (Audit Log) và gửi thông báo xác nhận mượn thành công qua WebSocket/Email đến độc giả.

---

### Câu 18: Khi một độc giả trả sách tại quầy, cơ chế phân bổ tự động cho hàng đợi đặt trước (Reservation Auto-Assignment) hoạt động ra sao?
- **Ý đồ giám khảo:** Kiểm tra logic thuật toán xử lý hàng đợi và tính tự động hóa của hệ thống.
- **Trả lời:**  
  Khi thủ thư xác nhận trả sách thành công, hệ thống không đưa sách ngay về trạng thái `AVAILABLE` mà thực hiện kiểm tra hàng đợi đặt trước:
  1. Truy vấn bảng `reservations` tìm danh sách các yêu cầu đặt trước cho ấn phẩm này có trạng thái `PENDING`, sắp xếp theo độ ưu tiên: vị trí hàng đợi (Queue Position theo nguyên tắc FIFO) kết hợp điểm tín nhiệm.
  2. Nếu có người trong danh sách chờ:
     - Gán mã bản sao vật lý đó vào phiếu đặt trước của người đứng đầu hàng đợi.
     - Cập nhật trạng thái bản sao thành `RESERVED`.
     - Kích hoạt thời hạn giữ sách (Hold Expiration Time, ví dụ: 48 giờ) và tính toán deadline nhận sách.
     - Bắn sự kiện gửi thông báo Realtime/Email cho người dùng: *"Sách bạn đặt trước đã sẵn sàng, vui lòng đến quầy nhận trước [Deadline]"*.
  3. Nếu hàng đợi rỗng: Cập nhật trạng thái bản sao thành `AVAILABLE` để phục vụ độc giả vãng lai.

---

### Câu 19: Nếu người đặt trước không đến nhận sách đúng thời hạn 48 giờ thì hệ thống xử lý như thế nào?
- **Ý đồ giám khảo:** Kiểm tra tính năng chạy nền tự động (Background Scheduler) và giải quyết tồn đọng tài nguyên.
- **Trả lời:**  
  Hệ thống vận hành một tác vụ nền (`Scheduled Task`) chạy định kỳ:
  1. Quét các phiếu đặt trước đang ở trạng thái giữ sách (`WAITING_FOR_PICKUP`) có thời gian giữ sách vượt quá thời điểm hiện tại (`hold_expiration_time < NOW()`).
  2. Tự động cập nhật trạng thái phiếu đặt trước đó thành `CANCELLED_EXPIRED`.
  3. Trừ điểm tín nhiệm của độc giả vi phạm vì hành vi chiếm dụng tài nguyên nhưng không đến nhận.
  4. Lấy lại bản sao vật lý đó và tự động chạy lại thuật toán phân bổ cho người tiếp theo trong hàng đợi (nếu còn người chờ) hoặc chuyển sách về trạng thái `AVAILABLE`.

---

### Câu 20: Điểm tín nhiệm (Credit Score) của độc giả được thiết kế như thế nào và có tác động gì đến nghiệp vụ?
- **Ý đồ giám khảo:** Đánh giá tính sáng tạo và khả năng ứng dụng cơ chế khuyến khích hành vi người dùng (Gamification/Incentive Mechanism).
- **Trả lời:**  
  Điểm tín nhiệm được chuẩn hóa trên thang điểm từ 0 đến 100:
  - *Cơ chế cộng điểm:* Trả sách đúng hạn (+2 điểm), tích cực đánh giá/review sách có giá trị (+1 điểm), hoàn tất các khoản nợ phạt nhanh chóng.
  - *Cơ chế trừ điểm:* Trả sách quá hạn (-5 điểm/ngày trễ), làm hư hỏng sách (-20 điểm), đặt trước nhưng bỏ không nhận sách (-10 điểm).
  - *Tác động nghiệp vụ:*
    + Độc giả có điểm tín nhiệm cao ($\ge 80$): Được nâng hạn ngạch mượn sách tối đa (từ 3 lên 5 cuốn), thời gian mượn dài hơn và được ưu tiên cao hơn khi xếp hàng đặt trước.
    + Độc giả có điểm tín nhiệm thấp ($< 50$): Bị giới hạn số lượng mượn (chỉ 1 cuốn), yêu cầu đóng tiền cọc sách 100% giá bìa.
    + Điểm tín nhiệm rơi xuống dưới 30: Hệ thống tự động khóa quyền mượn và đặt trước sách trực tuyến.

---

### Câu 21: Phí phạt quá hạn (Overdue Fine) được tính toán như thế nào và có giới hạn trần không?
- **Ý đồ giám khảo:** Kiểm tra logic tài chính và bảo vệ người dùng tránh phạt vô lý.
- **Trả lời:**  
  - *Công thức tính phí:* Khi độc giả trả sách quá hạn, hệ thống tính số ngày trễ dựa trên chênh lệch giữa thời điểm trả thực tế và ngày hẹn trả ban đầu (`overdue_days = return_date - due_date`). Phí phạt = `overdue_days` $\times$ `fine_rate_per_day` (được cấu hình trong chính sách lưu thông, ví dụ: 5.000 VNĐ/ngày).
  - *Cơ chế trần phạt (Maximum Fine Cap):* Để tránh tình trạng độc giả quên trả sách trong nhiều tháng khiến tiền phạt vượt quá giá trị thực của cuốn sách, hệ thống áp dụng trần phạt tối đa bằng **100% giá trị ấn phẩm** (`max_fine = publication.price`). Khi chạm trần, tiền phạt dừng tăng và thủ thư sẽ liên hệ để tiến hành quy trình báo mất sách.

---

### Câu 22: Cơ chế tích hợp cổng thanh toán PayOS được hiện thực như thế nào?
- **Ý đồ giám khảo:** Đánh giá khả năng tích hợp hệ thống thanh toán điện tử thời gian thực.
- **Trả lời:**  
  Quy trình tích hợp gồm 4 bước khép kín:
  1. **Khởi tạo giao dịch:** Khi bạn đọc hoặc thủ thư chọn thanh toán khoản phạt, Backend gọi API của PayOS với mã đơn hàng duy nhất, số tiền cần trả và nội dung chuyển khoản. PayOS trả về mã QR chuẩn VietQR và liên kết thanh toán.
  2. **Hiển thị & Polling:** Frontend nhận thông tin và hiển thị mã QR động để người dùng quét ứng dụng ngân hàng. Đồng thời, giao diện duy trì một tiến trình kiểm tra trạng thái thanh toán.
  3. **Xác nhận qua Webhook:** Khi người dùng chuyển khoản thành công, máy chủ PayOS gửi một Webhook HTTP POST về endpoint của Backend. Backend xác thực chữ ký dữ liệu để chống giả mạo, sau đó cập nhật phiếu phạt sang trạng thái `PAID`.
  4. **Đồng bộ thời gian thực:** Ngay khi hóa đơn được gạch nợ thành công trong DB, Backend bắn thông báo WebSocket đến màn hình Frontend, mã QR tự động đóng lại và giao diện cập nhật trạng thái "Đã thanh toán".

---

### Câu 23: Làm thế nào hệ thống phòng chống việc giả mạo Webhook nộp phạt từ PayOS?
- **Ý đồ giám khảo:** Kiểm tra năng lực bảo mật giao dịch tài chính.
- **Trả lời:**  
  Hệ thống sử dụng cơ chế xác thực chữ ký kiểm tra tính toàn vẹn (Checksum Signature):
  - PayOS cung cấp một `CHECKSUM_KEY` bí mật chỉ được lưu trong biến môi trường của Backend.
  - Khi gửi webhook, PayOS gửi kèm một chuỗi mã băm `signature` được tạo bằng thuật toán HMAC-SHA256 trên toàn bộ payload giao dịch (mã đơn hàng, số tiền, mã ngân hàng, timestamp).
  - Khi Backend nhận request, nó trích xuất dữ liệu, sắp xếp các trường theo đúng quy chuẩn và tính lại mã băm với `CHECKSUM_KEY`.
  - Nếu mã băm tính toán khớp chính xác với `signature` nhận được, giao dịch mới được xác nhận hợp lệ. Nếu sai lệch dù chỉ 1 ký tự, request bị từ chối ngay lập tức với mã lỗi HTTP 400.

---

### Câu 24: Làm sao giải quyết bài toán Race Condition khi hai người dùng cùng bấm nút mượn hoặc đặt trước cuốn sách cuối cùng cùng một giây?
- **Ý đồ giám khảo:** Kiểm tra kiến thức về tính đồng thời (Concurrency Control) và toàn vẹn cơ sở dữ liệu.
- **Trả lời:**  
  Hệ thống áp dụng kỹ thuật **Pessimistic Locking (Khóa bi quan)** ở tầng cơ sở dữ liệu:
  - Khi một yêu cầu mượn hoặc đặt trước được xử lý trong transaction, câu lệnh truy vấn tìm bản sao khả dụng sử dụng cú pháp `SELECT ... FOR UPDATE` trên bảng `items`.
  - Cơ sở dữ liệu PostgreSQL sẽ khóa dòng bản ghi của cuốn sách đó lại. Yêu cầu thứ hai đến cùng thời điểm sẽ phải chờ khóa được giải phóng.
  - Yêu cầu thứ nhất kiểm tra trạng thái là `AVAILABLE`, chuyển thành `BORROWED`/`RESERVED` và commit transaction.
  - Khi khóa được mở, yêu cầu thứ hai đọc lại dòng dữ liệu, thấy trạng thái không còn là `AVAILABLE` nữa nên nghiệp vụ lập tức ném ra ngoại lệ `ItemNotAvailableException` và thông báo cho người thứ hai rằng sách vừa được người khác mượn/đặt trước.

---

### Câu 25: Chính sách lưu thông (Circulation Policy) được quản lý cứng trong mã nguồn hay cấu hình động?
- **Ý đồ giám khảo:** Đánh giá tính linh hoạt và khả năng cấu hình của phần mềm thương mại.
- **Trả lời:**  
  Chính sách lưu thông được **cấu hình hoàn toàn động trong cơ sở dữ liệu** và quản lý thông qua giao diện Quản trị viên (`/adminpage`):
  - Bảng `circulation_policies` lưu trữ các tham số: số lượng sách mượn tối đa, thời hạn mượn (số ngày), số lần gia hạn cho phép, đơn giá phạt trễ hạn mỗi ngày, và tỷ lệ tiền cọc sách.
  - Các tham số này được phân loại theo đối tượng người dùng (Sinh viên, Giảng viên, Nghiên cứu sinh).
  - Khi thủ thư hoặc bạn đọc thực hiện thao tác, hệ thống truy vấn chính sách hiệu lực tại thời điểm đó để áp dụng, giúp nhà trường dễ dàng thay đổi quy định (ví dụ: tăng ngày mượn vào mùa thi) mà không cần lập trình viên phải sửa code và build lại hệ thống.

---

### Câu 26: Nghiệp vụ bồi thường khi bạn đọc làm hư hỏng hoặc mất sách được xử lý như thế nào?
- **Ý đồ giám khảo:** Kiểm tra độ bao phủ các kịch bản ngoại lệ của lưu thông thực tế.
- **Trả lời:**  
  Quy trình xử lý gồm 4 bước:
  1. Thủ thư kiểm tra sách tại quầy trả, nếu phát hiện hư hỏng (rách bìa, vẽ bậy, mất trang) hoặc độc giả khai báo mất, thủ thư chọn chức năng "Báo Hư hỏng/Mất sách".
  2. Trạng thái bản sao được cập nhật tương ứng thành `DAMAGED` hoặc `LOST` để loại bỏ khỏi danh mục có thể lưu thông.
  3. Hệ thống tự động tính toán phiếu bồi thường:
     - Trường hợp hư hỏng nhẹ: Phí phục chế (theo tỷ lệ phần trăm thiệt hại do thủ thư đánh giá).
     - Trường hợp hư hỏng nặng hoặc mất sách: Bồi thường = 100% Giá trị bìa ấn phẩm + Phí quản lý xử lý sách (ví dụ: 20.000 VNĐ chi phí biên mục, dán mã lại).
  4. Nếu độc giả đã đóng tiền cọc trước đó, hệ thống sẽ khấu trừ trực tiếp vào tiền cọc; số tiền thiếu hoặc thừa sẽ được giải quyết qua PayOS hoặc tiền mặt.

---

### Câu 27: Tiền cọc sách (Book Deposit) được vận hành như thế nào trong hệ thống?
- **Ý đồ giám khảo:** Đánh giá tính năng quản lý tài chính an toàn cho thư viện.
- **Trả lời:**  
  - Đối với các ấn phẩm quý hiếm, sách chuyên khảo có giá trị cao hoặc các độc giả có điểm tín nhiệm thấp, chính sách lưu thông yêu cầu người mượn phải ký quỹ một khoản tiền cọc (thường bằng 50% đến 100% giá bìa sách).
  - Khoản tiền cọc này được ghi nhận vào tài khoản tạm giữ của giao dịch mượn.
  - Khi độc giả trả lại sách nguyên vẹn và đúng hạn, hệ thống kích hoạt hoàn cọc 100%. Nếu có phát sinh phí trễ hạn hoặc sách bị hư hại, tiền cọc sẽ được tự động cấn trừ trước khi yêu cầu độc giả đóng thêm phần chênh lệch (nếu có).

---

### Câu 28: Hệ thống hỗ trợ thủ thư quản lý vị trí sách vật lý trong kho như thế nào?
- **Ý đồ giám khảo:** Đánh giá khả năng giải quyết bài toán định vị tài liệu thực tế trong thư viện lớn.
- **Trả lời:**  
  Mỗi bản sao sách (`Item`) đều gắn liền với thông tin định vị 3 cấp:
  - **Chi nhánh (Branch):** Thư viện cơ sở 1 (Lý Thường Kiệt) hoặc cơ sở 2 (Dĩ An).
  - **Dãy kệ / Tầng (Shelf Location / Floor):** Ví dụ: Kệ A3, Tầng 2, Khu vực Khoa học Máy tính.
  - **Mã phân loại DDC / Số định danh xếp giá:** Giúp thủ thư và độc giả sau khi tra cứu trên web có thể đi thẳng tới đúng vị trí ngăn kệ để lấy sách vật lý trong vài phút.

---

### Câu 29: Tính năng tự động điền thông tin từ mã ISBN (ISBN Auto-fill) giúp ích gì cho thủ thư và cơ chế hoạt động ra sao?
- **Ý đồ giám khảo:** Kiểm tra mức độ tiện ích và tự động hóa thao tác biên mục.
- **Trả lời:**  
  - *Giá trị thực tiễn:* Thủ thư không cần phải ngồi gõ tay từng trường thông tin (Tên sách, tác giả, nhà xuất bản, năm xuất bản, ảnh bìa, số trang), giúp giảm 80% thời gian nhập liệu một cuốn sách mới và tránh lỗi chính tả.
  - *Cơ chế hoạt động:* Thủ thư chỉ cần nhập hoặc dùng máy quét mã vạch quét mã ISBN 10 hoặc 13 số. Backend lập tức gửi yêu cầu tới các kho dữ liệu thư viện mở quốc tế (Google Books API, Open Library API). Dữ liệu JSON trả về được chuẩn hóa và tự động điền vào các ô trên form, thủ thư chỉ cần kiểm tra nhanh và nhấn lưu.

---

### Câu 30: Báo cáo điều hành cho thủ thư (`/librarianpage/reports`) cung cấp những thông tin gì để hỗ trợ ra quyết định?
- **Ý đồ giám khảo:** Đánh giá năng lực Business Intelligence (BI) và phân tích dữ liệu vận hành.
- **Trả lời:**  
  Trang báo cáo điều hành tổng hợp các chỉ số định lượng theo thời gian thực:
  - **Tỷ lệ quay vòng tài liệu (Circulation Turnover Rate):** Top những cuốn sách được mượn nhiều nhất và những cuốn sách nằm yên trên kệ không ai mượn để có kế hoạch luân chuyển kho hoặc thanh lý.
  - **Tỷ lệ sách quá hạn & Nợ phạt:** Thống kê tổng số tiền phạt chưa thu, tỷ lệ độc giả trễ hạn theo từng khoa/ngành.
  - **Nhu cầu đặt trước:** Các ấn phẩm có danh sách chờ đặt trước quá dài, gợi ý nhà trường cần mua bổ sung thêm bao nhiêu bản sao vật lý để đáp ứng nhu cầu học tập của sinh viên.

---

### Câu 31: Hệ thống kiểm soát quyền hạn (RBAC) của người dùng như thế nào? Có bao nhiêu vai trò?
- **Ý đồ giám khảo:** Kiểm tra kiến trúc phân quyền và bảo mật ứng dụng.
- **Trả lời:**  
  Hệ thống chia làm 3 nhóm vai trò rõ ràng:
  1. `ROLE_STUDENT` (Bạn đọc): Tra cứu sách, tìm kiếm ngữ nghĩa, xem chi tiết, đặt trước, yêu cầu mượn, xem lịch sử, thanh toán phạt qua PayOS, đánh giá và nhận thông báo.
  2. `ROLE_LIBRARIAN` (Thủ thư): Thực hiện nghiệp vụ quầy (cho mượn, nhận trả, thu phạt trực tiếp), biên mục ấn phẩm, in barcode, upload tài liệu PDF để AI xử lý, xem báo cáo vận hành.
  3. `ROLE_ADMIN` (Quản trị viên): Toàn quyền quản trị tài khoản (tạo thủ thư, khóa tài khoản vi phạm), cấu hình chính sách mượn trả hệ thống, xem nhật ký kiểm toán (Audit Logs) và giám sát hạ tầng.  
  Việc phân quyền được thực thi chặt chẽ ở Backend bằng annotation `@PreAuthorize("hasRole('...')")` trên từng phương thức Controller kết hợp với Route Protection ở React Frontend.

---

### Câu 32: Audit Log (Nhật ký kiểm toán) ghi nhận những thao tác nào và nhằm mục đích gì?
- **Ý đồ giám khảo:** Đánh giá tính minh bạch và khả năng phát hiện gian lận nội bộ.
- **Trả lời:**  
  - *Nội dung ghi nhận:* Mọi thao tác làm thay đổi dữ liệu nhạy cảm của hệ thống đều được AOP Aspect tự động ghi vào bảng `audit_logs`: ai thực hiện (User ID, Role), địa chỉ IP, hành động (Xóa sách, Sửa trạng thái phạt, Khóa tài khoản, Thay đổi cấu hình chính sách), thời điểm thực hiện và giá trị dữ liệu trước/sau khi đổi.
  - *Mục đích:* Phục vụ công tác thanh tra, bảo vệ tính toàn vẹn dữ liệu, xác định nguyên nhân sự cố và ngăn chặn hành vi tiêu cực nội bộ (ví dụ: thủ thư tự ý xóa nợ phạt cho người quen mà không có giao dịch tiền mặt hoặc chuyển khoản).

---

### Câu 33: Hệ thống xử lý như thế nào đối với các độc giả cố tình không trả sách và nợ phạt kéo dài?
- **Ý đồ giám khảo:** Kiểm tra quy trình xử lý rủi ro pháp lý và quản trị của nhà trường.
- **Trả lời:**  
  Hệ thống thiết lập quy trình chế tài theo các mức độ leo thang tự động:
  - *Mức 1 (Quá hạn 1 - 7 ngày):* Hệ thống gửi thông báo nhắc nhở hàng ngày qua Email và ứng dụng, khóa tính năng mượn cuốn sách mới.
  - *Mức 2 (Quá hạn > 14 ngày):* Tự động trừ điểm tín nhiệm về mức nguy hiểm ($< 30$), khóa toàn bộ quyền đặt trước sách mới.
  - *Mức 3 (Quá hạn > 30 ngày):* Đưa vào danh sách "Độc giả rủi ro cao" (Risky Users) trên Dashboard của Quản trị viên. Hệ thống xuất danh sách mã số sinh viên vi phạm để gửi sang phòng Đào tạo và Công tác Sinh viên nhằm giữ bằng tốt nghiệp hoặc tạm ngưng đăng ký học phần cho đến khi hoàn tất nghĩa vụ với thư viện.

---

### Câu 34: Độc giả có thể tự hủy phiếu đặt trước không, và vị trí của những người phía sau thay đổi thế nào?
- **Ý đồ giám khảo:** Kiểm tra logic cập nhật hàng đợi động (Dynamic Queue Management).
- **Trả lời:**  
  - Độc giả hoàn toàn có thể chủ động hủy phiếu đặt trước trên giao diện nếu không còn nhu cầu.
  - Khi một phiếu đặt trước bị hủy, transaction cơ sở dữ liệu sẽ tự động thực hiện tái lập chỉ số hàng đợi: tất cả các phiếu đặt trước phía sau cuốn sách đó có `queue_position > position_vừa_hủy` sẽ được giảm đi 1 bậc (`UPDATE reservations SET queue_position = queue_position - 1 WHERE publication_id = ? AND queue_position > ?`).
  - Nếu phiếu đặt trước bị hủy khi cuốn sách đã được giữ ở quầy (`WAITING_FOR_PICKUP`), hệ thống lập tức kích hoạt lại quy trình phân bổ sách cho người đang có `queue_position = 1` mới.

---

### Câu 35: Tính năng đánh giá và nhận xét sách (Review & Rating) được kiểm soát như thế nào để tránh đánh giá rác?
- **Ý đồ giám khảo:** Đánh giá tính xác thực của dữ liệu tương tác người dùng.
- **Trả lời:**  
  Hệ thống áp dụng chính sách **Verified Borrower (Người mượn đã xác thực)**:
  - Chỉ những độc giả **đã từng hoàn thành việc mượn và trả cuốn sách đó thành công** mới có quyền chấm điểm (1 - 5 sao) và viết nhận xét cho ấn phẩm.
  - Người dùng chưa từng mượn chỉ có quyền xem nhận xét.
  - Độc giả chỉ được gửi 1 đánh giá duy nhất cho mỗi đầu sách (có thể cập nhật lại sau).
  - Thủ thư có quyền phản hồi chính thức dưới tư cách đại diện thư viện hoặc ẩn các nhận xét có nội dung thô tục, vi phạm thuần phong mỹ tục.

---

# PHẦN 3: PHÂN HỆ TRÍ TUỆ NHÂN TẠO & KHAI PHÁ TRI THỨC (Câu 36 – 60)

### Câu 36: Trình bày chi tiết luồng xử lý và số hóa tài liệu (ETL Pipeline) cho file PDF tải lên?
- **Ý đồ giám khảo:** Kiểm tra khả năng nắm vững quy trình xử lý dữ liệu phi cấu trúc bằng AI.
- **Trả lời:**  
  Quy trình ETL diễn ra hoàn toàn bất đồng bộ gồm 6 bước liên hoàn:
  1. **Tiếp nhận & Lưu trữ:** Thủ thư tải file PDF lên S3 qua Presigned URL, Backend tạo bản ghi `etl_runs` với trạng thái `RUNNING` và gửi thông điệp chứa URL file sang hàng đợi RabbitMQ.
  2. **Bóc tách văn bản (Text Extraction):** Celery Worker tiếp nhận task, sử dụng thư viện `PyMuPDF` đọc từng trang của file PDF.
  3. **Làm sạch nhiễu (Text Cleaning):** Áp dụng regex và heuristic để lọc bỏ triệt để các thành phần rác: tiêu đề đầu trang (header), chân trang (footer), số trang, watermark và các ký tự mã hóa lỗi font.
  4. **Phân đoạn văn bản (Text Chunking):** Sử dụng kỹ thuật Cửa sổ trượt (Sliding Window) để chia nhỏ nội dung sách thành các đoạn văn ngắn có độ dài cố định kèm đoạn gối đầu (overlap) để giữ ngữ cảnh.
  5. **Sinh Vector nhúng (Embedding Generation):** Đưa các chunks qua mô hình Sentence-Transformers tiếng Việt để sinh các vector 768 chiều và lưu vào PostgreSQL qua `pgvector`.
  6. **Đúc kết tri thức bằng LLM (Metadata Enrichment):** Chọn các chunk tiêu biểu gửi sang Google Gemini để sinh: Tóm tắt học thuật (Executive Summary), Đối tượng độc giả phù hợp (Target Audience), và Bộ từ khóa/nhãn song ngữ (Tags & English Aliases). Sau khi hoàn tất, gửi callback có ký HMAC về Backend để cập nhật thông tin sách.

---

### Câu 37: Kỹ thuật phân mảnh văn bản (Sliding Window Chunking) được cấu hình như thế nào và vì sao phải có Overlap?
- **Ý đồ giám khảo:** Đánh giá hiểu biết sâu sắc về kỹ thuật tiền xử lý văn bản cho các tác vụ NLP/RAG.
- **Trả lời:**  
  - *Cấu hình tham số:* Trong mã nguồn (`config.py`), hệ thống cấu hình `chunk_size = 1500` ký tự (tương đương khoảng 300 từ / ~450–500 tokens) và độ gối đầu `chunk_overlap = 150` ký tự (tỷ lệ gối đầu chuẩn 10%).
  - *Ý nghĩa của Overlap:* Nếu cắt văn bản theo ranh giới cứng (Fixed-size without overlap), một câu hoặc một luận điểm khoa học có thể bị cắt làm đôi ở giữa hai chunk liền kề. Điều này làm mất ngữ nghĩa của cả hai nửa câu, khiến mô hình embedding không thể nắm bắt được trọn vẹn thông điệp của tác giả. Khoảng gối đầu 150 ký tự đảm bảo các câu ở ranh giới phân đoạn luôn xuất hiện trọn vẹn trong ít nhất một chunk liền kề mà không làm đứt đoạn ngữ cảnh.

---

### Câu 38: Tại sao lại chọn mô hình `bkai-foundation-models/vietnamese-bi-encoder` thay vì dùng OpenAI Embeddings hay Multilingual BERT?
- **Ý đồ giám khảo:** Kiểm tra lý do lựa chọn mô hình và tính tối ưu cho ngôn ngữ bản địa.
- **Trả lời:**  
  Đây là quyết định cân nhắc kỹ lưỡng về cả mặt ngôn ngữ học và tính độc lập hạ tầng:
  1. **Hiểu sâu sắc cấu trúc tiếng Việt:** Đây là mô hình Bi-Encoder được nhóm nghiên cứu BKAI huấn luyện chuyên biệt trên tập dữ liệu tiếng Việt quy mô lớn, nắm bắt rất tốt hiện tượng từ ghép, thanh điệu và ngữ cảnh học thuật đặc thù của tiếng Việt, vượt trội hơn các mô hình đa ngôn ngữ tổng quát (Multilingual BERT thường bị phân tán không gian biểu diễn cho hàng trăm ngôn ngữ).
  2. **Kích thước vector chuẩn mực (768 chiều):** Cân bằng hoàn hảo giữa năng lực biểu diễn ngữ nghĩa và hiệu năng tính toán/lưu trữ trong PostgreSQL (so với vector 1536 chiều của OpenAI tốn gấp đôi RAM và dung lượng index).
  3. **Tự chủ và miễn phí vận hành:** Mô hình chạy trực tiếp trên máy chủ cục bộ (On-premise inference), không phụ thuộc vào kết nối internet ra ngoài, không phát sinh chi phí trả phí theo token như OpenAI và đảm bảo an toàn dữ liệu nội bộ của thư viện.

---

### Câu 39: Tìm kiếm ngữ nghĩa (Semantic Search) trong hệ thống hoạt động như thế nào?
- **Ý đồ giám khảo:** Đánh giá hiểu biết về cơ chế Vector Search và chuyển đổi ngôn ngữ tự nhiên thành truy vấn toán học.
- **Trả lời:**  
  Quy trình tìm kiếm ngữ nghĩa diễn ra theo luồng sau:
  1. Người dùng nhập câu truy vấn bằng ngôn ngữ tự nhiên (ví dụ: *"giáo trình đại số giải hệ phương trình tuyến tính"*).
  2. Backend chuyển câu truy vấn sang FastAPI AI Gateway.
  3. AI Gateway sử dụng mô hình Bi-Encoder để mã hóa câu truy vấn thành một vector nhúng 768 chiều duy nhất.
  4. Thực hiện câu lệnh SQL tìm kiếm vector trên bảng `chunks` trong PostgreSQL bằng toán tử `<=>` (Cosine Distance) của `pgvector` để tìm Top-K các chunk có khoảng cách nhỏ nhất (tương đồng cao nhất).
  5. Gom nhóm (Group By) các chunk tìm được theo `publication_id`, tính điểm tương đồng tổng hợp cho từng cuốn sách và trả về cho Backend danh sách ấn phẩm phù hợp nhất để hiển thị cho người dùng.

---

### Câu 40: Tìm kiếm lai (Hybrid Search) kết hợp những thành phần nào và giải quyết bài toán gì?
- **Ý đồ giám khảo:** Kiểm tra xem sinh viên có nhận thức được điểm yếu của tìm kiếm vector thuần túy hay không.
- **Trả lời:**  
  - *Hạn chế của Vector Search thuần túy:* Rất kém khi người dùng tìm kiếm từ khóa chính xác tuyệt đối như mã ISBN, mã môn học (ví dụ: `CO3005`), tên riêng tác giả hiếm, hoặc năm xuất bản.
  - *Giải pháp Tìm kiếm lai của Library74:* Kết hợp đồng thời 3 cơ chế:
    1. **Full-Text Search / Trigram:** So khớp chuỗi chính xác và chuỗi mờ trên tiêu đề, tên tác giả, tên nhà xuất bản.
    2. **Bộ lọc danh mục quan hệ:** Lọc cứng theo thể loại, trạng thái có sẵn sách ở chi nhánh, ngôn ngữ xuất bản.
    3. **Semantic Search:** Truy xuất theo ngữ nghĩa nội dung cốt lõi của tài liệu.  
  Sự kết hợp này giúp hệ thống vừa phục vụ tốt người dùng tìm đích danh cuốn sách, vừa thỏa mãn người dùng tìm kiếm tài liệu học tập theo ý niệm trừu tượng.

---

### Câu 41: Mô hình Ngôn ngữ Lớn (LLM Google Gemini) được sử dụng cho những tác vụ nào và tại sao không dùng cho toàn bộ hệ thống?
- **Ý đồ giám khảo:** Đánh giá sự tỉnh táo trong việc sử dụng công nghệ tạo sinh (Generative AI) đúng chỗ, tránh lãng phí.
- **Trả lời:**  
  LLM Google Gemini chỉ được dùng cho 3 tác vụ chuyên biệt trong tiến trình ETL nền:
  1. Đọc các đoạn nội dung tiêu biểu để viết **Bản tóm tắt học thuật (Executive Summary)** súc tích trong khoảng 200 - 300 từ.
  2. Xác định **Đối tượng độc giả mục tiêu (Target Audience)** (ví dụ: Sinh viên năm 1, Kỹ sư phần mềm, Nghiên cứu sinh).
  3. Trích xuất **Bộ nhãn chuyên môn (Tags)** bằng tiếng Việt và ánh xạ sang thuật ngữ tiếng Anh tương đương (`tags_en`).  
  *Lý do không dùng LLM cho tìm kiếm và gợi ý thời gian thực:* LLM có độ trễ lớn (thường mất 2 - 5 giây), chi phí API cao nếu gọi liên tục ở mỗi lượt search, và có nguy cơ sinh thông tin sai lệch (ảo giác). Việc dùng mô hình Embedding chuyên biệt cho tìm kiếm giúp đạt độ trễ cực thấp (p95 = 540ms) và đảm bảo tính tất định.

---

### Câu 42: Làm thế nào để ép LLM trả về cấu trúc JSON chính xác mà không chứa các đoạn chat tự do?
- **Ý đồ giám khảo:** Kiểm tra kỹ năng Prompt Engineering và Structured Output.
- **Trả lời:**  
  Hệ thống áp dụng kỹ thuật 3 lớp bảo vệ:
  1. **API Configuration:** Bật chế độ `response_mime_type: "application/json"` trong tham số cấu hình gọi Gemini API để mô hình tự động kích hoạt bộ giải mã ngữ pháp JSON (Grammar-guided decoding).
  2. **System Prompt nghiêm ngặt:** Cung cấp lược đồ JSON Schema mẫu cụ thể trong prompt và chỉ thị rõ ràng: *"Chỉ trả về duy nhất chuỗi JSON hợp lệ theo schema dưới đây. Không thêm lời chào, không giải thích, không bọc trong markdown ```json"*.
  3. **Robust Fallback Parser ở mã nguồn Python:** Sử dụng bộ bóc tách JSON an toàn. Nếu chuỗi trả về vô tình có ký tự thừa hoặc định dạng lỗi nhẹ, parser sẽ dùng biểu thức chính quy để trích xuất khối `{...}` hợp lệ đầu tiên trước khi gọi `json.loads()`. Nếu vẫn lỗi, hệ thống kích hoạt fallback trích xuất từ khóa cục bộ.

---

### Câu 43: Cơ chế Rào chắn Chống ảo giác (Hallucination Guard) trong bài tóm tắt sách hoạt động ra sao?
- **Ý đồ giám khảo:** Đánh giá tính an toàn học thuật và kiểm soát rủi ro của AI.
- **Trả lời:**  
  Hệ thống xây dựng kịch bản kiểm định tự động với 3 quy tắc chặn:
  1. **Grounding Context:** LLM chỉ được phép tóm tắt dựa trên đúng tập hợp các chunk văn bản thực tế được bóc tách từ file PDF truyền vào trong prompt, cấm sử dụng kiến thức bên ngoài nếu mâu thuẫn với sách.
  2. **Keyword Overlap Verification:** Sau khi nhận bản tóm tắt, hệ thống tính toán tỷ lệ giao thoa từ khóa (Keyword Coverage) giữa bản tóm tắt và văn bản gốc. Nếu tỷ lệ này dưới ngưỡng an toàn (ví dụ: < 70% từ khóa cốt lõi xuất hiện trong sách), kết quả sẽ bị nghi ngờ là ảo giác và bị từ chối.
  3. **Length & Structure Constraint:** Kiểm tra độ dài chặt chẽ. Kết quả thực nghiệm trong Chương 7 chứng minh: hệ thống đạt **100.0% Hallucination Guard** trên bộ dữ liệu kiểm thử sản xuất.

---

### Câu 44: Vì sao sách dài hàng trăm trang mà hệ thống không bị tràn Context Window của LLM khi tóm tắt?
- **Ý đồ giám khảo:** Kiểm tra giải pháp xử lý tài liệu dài (Long Document Processing).
- **Trả lời:**  
  Hệ thống không ném toàn bộ cuốn sách hàng trăm nghìn từ vào LLM, mà sử dụng thuật toán **Chọn lọc các đoạn đại diện (Representative Chunks Selection)**:
  - Bóc tách trang mục lục (Table of Contents), lời tựa (Preface) và chương giới thiệu đầu tiên.
  - Chọn đoạn mở đầu và đoạn kết luận của các chương chính giữa sách.
  - Sử dụng thuật toán đa dạng hóa MMR (Maximal Marginal Relevance) trên các vector chunk để chọn ra 5 - 8 chunk có tính bao quát nội dung cao nhất nhưng không trùng lặp ý nhau.  
  Tập hợp các đoạn tinh lọc này hoàn toàn nằm gọn trong khoảng 4.000 - 8.000 tokens, vừa tiết kiệm 90% chi phí gọi token, vừa giúp LLM tập trung đúc kết được bức tranh tổng thể của tài liệu mà không bị nhiễu.

---

### Câu 45: Nếu Gemini API bị nghẽn mạng, hết hạn ngạch (quota) hoặc sập, quy trình xử lý sách có bị hỏng không?
- **Ý đồ giám khảo:** Kiểm tra thiết kế khả năng phục hồi (Resilience & Fallback Strategy).
- **Trả lời:**  
  Quy trình xử lý hoàn toàn không bị hỏng, nhờ vào cơ chế dự phòng nhiều tầng (Multi-tier Fallback):
  - *Tầng 1 (Retry with Exponential Backoff):* Thử lại tự động 3 lần với khoảng cách thời gian tăng dần nếu lỗi do mạng tạm thời hoặc chạm ngưỡng giới hạn tốc độ (Rate Limit 429).
  - *Tầng 2 (Local Heuristic Fallback):* Nếu sau 3 lần vẫn thất bại, pipeline kích hoạt module xử lý cục bộ:
    + Tóm tắt được lấy từ 300 từ đầu tiên của phần giới thiệu sách đã bóc tách.
    + Nhãn sách (Tags) được trích xuất bằng thuật toán thống kê từ khóa TF-IDF/RAKE chạy trực tiếp trên máy chủ.
    + Ghi nhận trạng thái hoàn tất có fallback vào `etl_runs`.  
  Cuốn sách vẫn được đưa vào lưu thông và có dữ liệu để người dùng tìm kiếm bình thường mà không bị kẹt ở trạng thái lỗi.

---

### Câu 46: Trình bày nguyên lý hoạt động của mô hình Gợi ý sách cá nhân hóa dựa trên Phản hồi ẩn (ALS Implicit Feedback)?
- **Ý đồ giám khảo:** Đánh giá hiểu biết về thuật toán lọc cộng tác (Collaborative Filtering).
- **Trả lời:**  
  Trong thư viện, người dùng hiếm khi chủ động chấm điểm (explicit rating) cho tất cả các cuốn sách họ đọc. Vì vậy, hệ thống sử dụng thuật toán **ALS (Alternating Least Squares)** cho dữ liệu phản hồi ẩn (Implicit Feedback):
  - Hệ thống thu thập các hành vi tự nhiên của độc giả: số lần xem chi tiết sách, thao tác thêm vào wishlist, lịch sử mượn sách thành công, và đánh giá.
  - Ma trận Người dùng - Ấn phẩm được xây dựng dựa trên mức độ tin cậy của tương tác thay vì điểm số đơn thuần.
  - Thuật toán ALS phân rã ma trận này thành hai ma trận không gian ẩn (latent factors): vector đặc trưng của Người dùng và vector đặc trưng của Cuốn sách.
  - Dự đoán mức độ yêu thích bằng tích vô hướng giữa vector người dùng và vector sách để gợi ý danh sách Top-N ấn phẩm phù hợp nhất.

---

### Câu 47: Trọng số hành vi (Behavior Weights) trong mô hình phản hồi ẩn được quy định như thế nào?
- **Ý đồ giám khảo:** Kiểm tra xem sinh viên có định lượng được giá trị của từng loại tương tác hay không.
- **Trả lời:**  
  Các hành vi được gán trọng số tăng dần theo mức độ cam kết của độc giả:
  - **Xem trang chi tiết sách (`VIEW`):** Trọng số = 1 (Tín hiệu quan tâm mức cơ bản).
  - **Thêm vào danh sách yêu thích (`WISHLIST`):** Trọng số = 3 (Thể hiện rõ nhu cầu muốn đọc trong tương lai).
  - **Thao tác Mượn sách thực tế (`BORROW`):** Trọng số = 5 (Hành động có cam kết cao nhất, tốn công sức đến thư viện nhận sách).
  - **Đánh giá cao 4 - 5 sao (`POSITIVE_RATING`):** Trọng số = 4 (Tín hiệu hài lòng sau khi đọc xong).  
  Tổng hợp các trọng số này tạo nên mức độ ưu tiên vững chắc để mô hình học máy phân biệt chính xác mức độ quan tâm của độc giả đối với từng chủ đề học liệu.

---

### Câu 48: Giải quyết bài toán Khởi động nguội (Cold Start Problem) cho bạn đọc mới và cuốn sách mới như thế nào?
- **Ý đồ giám khảo:** Đánh giá khả năng giải quyết bài toán kinh điển trong hệ thống khuyến nghị.
- **Trả lời:**  
  Hệ thống xử lý linh hoạt theo từng đối tượng:
  1. **Đối với Bạn đọc mới (chưa có bất kỳ lịch sử tương tác nào):** Hệ thống kích hoạt **Trending Fallback**: đề xuất các cuốn sách đang được mượn nhiều nhất trong tháng, sách mới xuất bản và sách có điểm đánh giá trung bình cao nhất từ cộng đồng sinh viên.
  2. **Đối với Bạn đọc mới có một vài lượt tương tác đầu tiên:** Kết hợp Content-based: lấy các cuốn sách có vector nội dung gần nhất với cuốn sách họ vừa xem.
  3. **Đối với Cuốn sách mới nhập (chưa có ai mượn):** Sử dụng tương đồng vector nhúng (Cosine Similarity trên `pgvector`) dựa trên nội dung trích xuất từ PDF để liên kết cuốn sách mới vào mục "Sách tương tự" của các ấn phẩm cùng chuyên ngành, giúp sách mới tiếp cận người đọc ngay lập tức.

---

### Câu 49: Tính năng "Sách tương tự" (Similar Books) tại trang chi tiết hoạt động như thế nào?
- **Ý đồ giám khảo:** Phân biệt giữa gợi ý theo người dùng (User-to-Item) và gợi ý theo sản phẩm (Item-to-Item).
- **Trả lời:**  
  Tính năng này là gợi ý Item-to-Item thuần túy dựa trên nội dung:
  - Mỗi ấn phẩm có một vector đại diện được tổng hợp từ các chunk tiêu biểu của nó trong cơ sở dữ liệu.
  - Khi độc giả vào xem trang chi tiết của ấn phẩm $A$, Backend gửi yêu cầu sang AI Gateway với ID của $A$.
  - AI Gateway truy vấn cơ sở dữ liệu để tìm ra Top 5 ấn phẩm có vector nhúng gần với vector của $A$ nhất bằng khoảng cách Cosine, loại trừ chính ấn phẩm $A$.
  - Kết quả trả về danh sách các sách có cùng chủ đề học thuật sâu (ví dụ: đang xem sách về *Machine Learning* sẽ gợi ý sách về *Deep Learning* hoặc *Toán cho Trí tuệ Nhân tạo*).

---

### Câu 50: Pipeline chuẩn hóa và làm sạch nhãn (`tag_quality.py`) giải quyết vấn đề gì?
- **Ý đồ giám khảo:** Kiểm tra nhận thức về chất lượng dữ liệu (Data Quality) trong học máy.
- **Trả lời:**  
  Khi LLM sinh nhãn tự do, nó thường tạo ra các nhãn rác, nhãn quá chung chung hoặc nhãn trùng ngữ nghĩa (ví dụ: *"sách hay"*, *"giáo trình"*, *"tài liệu học tập"*). Pipeline làm sạch thực hiện:
  1. **Lọc Stop-words & Generic Tags:** Loại bỏ hoàn toàn danh sách các từ vô nghĩa đối với việc phân loại học thuật.
  2. **Chuẩn hóa chữ hoa/thường và dấu tiếng Việt:** Đưa về định dạng thống nhất để tránh trùng lặp giữa `"Trí tuệ nhân tạo"` và `"trí tuệ nhân tạo"`.
  3. **Ánh xạ song ngữ 1 - 1 (`tags_en`):** Map nhãn tiếng Việt sang thuật ngữ tiếng Anh tương đương chuẩn quốc tế (ví dụ: *"Đại số tuyến tính"* $\rightarrow$ *"Linear Algebra"*). Điều này giúp độc giả tìm kiếm bằng thuật ngữ tiếng Anh vẫn tìm thấy sách giáo trình tiếng Việt.

---

### Câu 51: Chữ ký HMAC (Hash-based Message Authentication Code) bảo vệ kết nối giữa AI Worker và Backend như thế nào?
- **Ý đồ giám khảo:** Đánh giá an toàn thông tin trong kiến trúc phân tán đa nền tảng.
- **Trả lời:**  
  Vì AI Worker và Backend là hai tiến trình độc lập chạy trên hai nền tảng khác nhau (Python và Java), kết nối Webhook trả kết quả ETL về Backend tiềm ẩn nguy cơ bị kẻ xấu giả mạo request để ghi đè dữ liệu sách.
  - *Cơ chế bảo vệ:*
    + Hai bên chia sẻ chung một khóa bí mật `AI_CALLBACK_SECRET`.
    + Khi gửi kết quả, Worker tạo một chữ ký bằng cách băm toàn bộ body JSON kết hợp với Timestamp hiện tại qua thuật toán `HMAC-SHA256`, gửi kèm trên tiêu đề `X-AI-Signature` và `X-AI-Timestamp`.
    + Backend nhận request, kiểm tra xem timestamp có bị lệch quá thời gian cho phép không (chống tấn công Replay Attack), sau đó tính lại chữ ký. Nếu chữ ký không khớp, Backend từ chối cập nhật ngay lập tức.

---

### Câu 52: Cơ chế Retry và Dead Letter Queue (DLQ) trong Celery/RabbitMQ hoạt động ra sao khi gặp file PDF lỗi?
- **Ý đồ giám khảo:** Kiểm tra tính năng chịu lỗi trong xử lý tác vụ nền bất đồng bộ.
- **Trả lời:**  
  - Nếu file PDF bị hỏng cấu trúc (corrupted file) hoặc không đọc được bằng PyMuPDF, Celery Worker sẽ bắt ngoại lệ, không để sập tiến trình daemon.
  - Task được cấu hình tự động thử lại tối đa 3 lần với cơ chế trì hoãn (Backoff Delay).
  - Nếu sau 3 lần vẫn thất bại, task được chuyển sang hàng đợi chết **Dead Letter Queue (DLQ)** để cách ly, tránh làm nghẽn các tác vụ khác trong hàng đợi.
  - Đồng thời, một bản tin trạng thái lỗi `status = FAILED` kèm mã lỗi chi tiết được gửi về Backend để thủ thư nhìn thấy trên màn hình quản lý: *"Tệp tài liệu hỏng hoặc không đúng định dạng PDF chuẩn"*.

---

### Câu 53: Độ trễ của tìm kiếm ngữ nghĩa là bao nhiêu và làm thế nào để tối ưu dưới 1 giây?
- **Ý đồ giám khảo:** Đánh giá việc đo lường hiệu năng thực tế dựa trên số liệu Chương 7.
- **Trả lời:**  
  Theo số liệu thực nghiệm đo đạc trong Chương 7:
  - Thời gian phản hồi trung vị **p50 đạt 283.31ms** và **p95 đạt 540.90ms**, vượt xa ngân sách mục tiêu SLA đề ra ban đầu là 3.000ms.
  - *Giải pháp tối ưu để đạt được tốc độ này:*
    1. Mô hình Bi-Encoder được nạp sẵn lên RAM của máy chủ khi khởi động (Warm-up inference), không tốn thời gian tải lại mô hình.
    2. Sử dụng chỉ mục **IVFFlat / HNSW** trên PostgreSQL giúp tăng tốc độ tìm kiếm vector gần đúng (ANN) theo cấp số nhân thay vì quét tuần tự toàn bộ bảng.
    3. Giới hạn không gian tìm kiếm: chỉ truy vấn Top-20 chunks có độ tương đồng cao nhất rồi gom nhóm, không fetch toàn bộ văn bản về phía ứng dụng.

---

### Câu 54: Tại sao trong báo cáo Chương 7, nhóm tác giả lại trung thực ghi nhận "Tạm thời chưa chấm điểm định lượng cho hệ thống gợi ý ALS"?
- **Ý đồ giám khảo:** Kiểm tra tính trung thực khoa học và đạo đức nghiên cứu của sinh viên.
- **Trả lời:**  
  Đây là sự trung thực học thuật cần thiết:
  - Để đánh giá định lượng chính xác một thuật toán gợi ý học máy (bằng các chỉ số như Precision@K, Recall@K, MAP), cần có một tập dữ liệu chuẩn (Ground Truth) ghi nhận hành vi tương tác dài hạn của hàng nghìn người dùng thật trong nhiều tháng.
  - Tại thời điểm nghiệm thu đồ án, hệ thống mới vừa triển khai lên môi trường sản xuất `library74.uk`, số lượng tài khoản và lượt mượn thực tế chưa đủ lớn để tạo ra tập kiểm thử có ý nghĩa thống kê.
  - Thay vì tự sinh dữ liệu giả (fake data) để báo cáo số liệu đẹp, nhóm quyết định bảo vệ hệ thống gợi ý bằng các bài Unit/Contract test nghiêm ngặt kết hợp các logic dự phòng an toàn (Trending fallback), và sẵn sàng đo lường các chỉ số này khi hệ thống tích lũy đủ dữ liệu vận hành thực tế.

---

### Câu 55: Hệ thống xử lý thế nào với tài liệu PDF scan (chỉ toàn hình ảnh, không có lớp văn bản)?
- **Ý đồ giám khảo:** Kiểm tra nhận thức về giới hạn kỹ thuật và phương án mở rộng.
- **Trả lời:**  
  - *Hiện trạng:* Module `pdf_processing.py` sử dụng `PyMuPDF` để trích xuất trực tiếp lớp văn bản số (digital text layer). Nếu gặp file scan thuần túy (image-only PDF), lượng text bóc tách được sẽ bằng 0.
  - *Cơ chế kiểm soát:* Hệ thống phát hiện văn bản bóc tách rỗng sẽ kích hoạt cảnh báo, không đưa vào sinh vector rác, và ghi nhận trạng thái thông báo cho thủ thư rằng tài liệu là bản scan.
  - *Giải pháp kiến trúc mở rộng:* Hệ thống đã thiết kế sẵn cổng tích hợp mô hình OCR (Optical Character Recognition) mã nguồn mở như Tesseract hoặc PaddleOCR vào worker để tự động nhận dạng ký tự quang học trước khi đẩy sang khâu chunking khi máy chủ được nâng cấp phần cứng.

---

### Câu 56: Kích thước chiều của vector nhúng là 768 có ý nghĩa gì và tại sao không giảm xuống 128 hay 256 để chạy nhanh hơn?
- **Ý đồ giám khảo:** Kiểm tra kiến thức nền tảng về Deep Learning và NLP.
- **Trả lời:**  
  - 768 là kích thước không gian tiềm ẩn (hidden dimension size) tự nhiên của kiến trúc mạng Transformer chuẩn (dựa trên cấu trúc BERT-base).
  - Không gian 768 chiều đủ lớn để phân tách được các mối quan hệ ngữ nghĩa tinh tế và phức tạp giữa các khái niệm khoa học chuyên ngành trong tiếng Việt.
  - Nếu giảm chiều (ví dụ: dùng PCA hoặc AutoEncoder nén xuống 128 chiều), thông tin ngữ nghĩa sẽ bị suy hao nghiêm trọng (lossy compression), dẫn đến hiện tượng các cuốn sách thuộc các lĩnh vực khác nhau bị gộp chung vào cùng một cụm, làm giảm tính chính xác của tìm kiếm. 768 chiều hiện là chuẩn công nghiệp tối ưu được hỗ trợ tăng tốc phần cứng tốt nhất bởi `pgvector`.

---

### Câu 57: Khái niệm "Representative Chunks Selection" được hiện thực bằng giải pháp toán học nào?
- **Ý đồ giám khảo:** Đánh giá tư duy thuật toán xử lý dữ liệu.
- **Trả lời:**  
  Thuật toán lựa chọn các chunk đại diện được kết hợp giữa vị trí văn bản và độ đa dạng ngữ nghĩa:
  - Lấy các chunk ở vị trí chiến lược (Trang đầu, Mục lục, Trang cuối).
  - Đối với nội dung thân bài: Tính toán khoảng cách cosine giữa các vector của từng chunk. Áp dụng thuật toán gom cụm (Clustering) hoặc phương pháp lựa chọn theo độ phân tán lớn nhất (Maximal Marginal Relevance - MMR) để chọn ra các chunk có khoảng cách xa nhau nhất trong không gian vector. Điều này đảm bảo mỗi chunk được chọn sẽ đại diện cho một chủ đề/chương hoàn toàn khác nhau trong cuốn sách, giúp bản tóm tắt bao quát toàn diện toàn bộ tác phẩm.

---

### Câu 58: Tại sao không gọi trực tiếp API của LLM từ trình duyệt Frontend mà phải qua Backend và Worker?
- **Ý đồ giám khảo:** Kiểm tra tư duy cơ bản về bảo mật API key và kiến trúc web.
- **Trả lời:**  
  Có 3 lý do sống còn về mặt kỹ thuật:
  1. **Bảo mật tuyệt đối API Key:** Nếu gọi trực tiếp từ Frontend, khóa bí mật `GEMINI_API_KEY` sẽ bị lộ trong mã JavaScript nguồn của client, bất kỳ ai cũng có thể trích xuất và đánh cắp hạn ngạch sử dụng.
  2. **Quản trị chi phí và Rate Limit:** Backend và Worker đóng vai trò chốt chặn để điều phối, xếp hàng đợi, giới hạn tần suất gọi (throttling), lưu bộ nhớ đệm (caching) kết quả nhằm tránh việc người dùng bấm liên tục gây tốn kém chi phí.
  3. **Thời gian xử lý kéo dài (Long-running process):** Việc đọc sách và tóm tắt có thể mất từ 10 đến 30 giây; nếu chạy trên trình duyệt sẽ làm treo UI hoặc mất kết nối khi người dùng tắt tab. Chuyển sang Worker xử lý nền giúp trải nghiệm của người dùng hoàn toàn mượt mà.

---

### Câu 59: Điểm tin cậy AI (Reliability Score) đạt 95.46/100 trong Chương 7 được tính toán dựa trên những trọng số nào?
- **Ý đồ giám khảo:** Kiểm tra xem sinh viên có nhớ và hiểu công thức benchmark trong báo cáo hay không.
- **Trả lời:**  
  Điểm tin cậy tổng hợp 95.46/100 là thước đo toàn diện được tính toán từ script `ai_quality_benchmark.py` dựa trên 4 trụ cột có trọng số:
  1. **Chất lượng siêu dữ liệu (Metadata & Tag Consistency):** Trọng số 25% (đo độ chính xác của nhãn, tóm tắt và rào chắn chống ảo giác).
  2. **Năng lực tìm kiếm ngữ nghĩa (Semantic Search Accuracy):** Trọng số 35% (tính từ các chỉ số xếp hạng Recall@5, MRR và nDCG@5).
  3. **Độ phủ truy vấn (Query Coverage):** Trọng số 20% (tỷ lệ các truy vấn trả về kết quả hợp lệ, không bị lỗi rỗng, đạt 100%).
  4. **Hiệu năng thời gian đáp ứng (Latency Compliance):** Trọng số 20% (mức độ tuân thủ ngân sách độ trễ SLA dưới 3000ms).

---

### Câu 60: Chi phí tính toán và tiêu thụ tài nguyên của phân hệ AI trên môi trường VPS được kiểm soát như thế nào?
- **Ý đồ giám khảo:** Đánh giá tính khả thi về mặt kinh tế và tối ưu hóa hạ tầng của dự án.
- **Trả lời:**  
  Hệ thống được tối ưu hóa đặc biệt để chạy ổn định trên cấu hình máy chủ chi phí thấp:
  - Tiến trình FastAPI API Server duy trì mức tiêu thụ RAM ổn định **dưới 400MB**.
  - Mô hình Bi-Encoder chạy hoàn toàn trên CPU thông qua thư viện `PyTorch CPU-only` được biên dịch tinh giản, không đòi hỏi card đồ họa rời GPU đắt đỏ.
  - Các tác vụ nặng về xử lý file PDF được Celery Worker thực hiện theo cơ chế tuần tự (Concurrency = 1 hoặc 2) để tránh việc worker chiếm dụng 100% CPU làm tê liệt máy chủ web.

---

# PHẦN 4: BẢO MẬT, TÍCH HỢP & TÍNH TOÀN VẸN DỮ LIỆU (Câu 61 – 70)

### Câu 61: Cơ chế xác thực không trạng thái (Stateless Authentication) bằng JWT hoạt động như thế nào?
- **Ý đồ giám khảo:** Đánh giá kiến thức nền tảng về Web Security hiện đại.
- **Trả lời:**  
  Hệ thống sử dụng mô hình mã hóa xác thực kép:
  - **Access Token:** Có thời hạn sống ngắn (ví dụ: 15 - 30 phút), chứa thông tin định danh (`userId`, `email`, `roles`). Mỗi request gửi từ client đều đính kèm token này trên tiêu đề `Authorization: Bearer <token>`. Máy chủ Spring Boot giải mã và xác thực chữ ký số bằng thuật toán RSA/HMAC mà không cần truy vấn cơ sở dữ liệu để tìm session (hoàn toàn stateless).
  - **Refresh Token:** Có thời hạn sống dài hơn (ví dụ: 7 ngày), được mã hóa và lưu trữ an toàn trong cơ sở dữ liệu gắn với từng phiên người dùng, dùng để xin cấp Access Token mới khi token cũ hết hạn mà không bắt người dùng phải đăng nhập lại.

---

### Câu 62: Làm thế nào Frontend xử lý bài toán xung đột Refresh Token (Race Condition) khi nhiều API cùng hết hạn một lúc?
- **Ý đồ giám khảo:** Đánh giá kỹ năng xử lý trường hợp biên phức tạp ở tầng Frontend.
- **Trả lời:**  
  Nếu người dùng mở một trang tải đồng thời 5 API (ví dụ: lấy thông tin cá nhân, danh sách sách mượn, thông báo, sách gợi ý, phí phạt) và Access Token vừa hết hạn, cả 5 request sẽ đồng loạt nhận mã lỗi HTTP 401. Nếu không kiểm soát, Frontend sẽ gửi 5 request refresh token cùng lúc gây lãng phí và xung đột phiên.
  - *Giải pháp hàng đợi (Refresh Token Queue):*
    + Axios Interceptor bắt mã lỗi 401 đầu tiên, thiết lập một biến cờ `isRefreshing = true` và gọi API cấp token mới.
    + 4 request bị lỗi 401 tiếp theo được đưa vào một **Hàng đợi lời hứa (Promise Queue)** tạm dừng.
    + Khi request refresh token đầu tiên thành công và có Access Token mới, hệ thống cập nhật token và giải phóng hàng đợi, thực hiện lại đồng loạt 4 request bị tạm dừng một cách êm thấm mà người dùng không hề hay biết.

---

### Câu 63: Luồng đăng nhập mạng xã hội bằng Google OAuth2 được thiết kế như thế nào để đảm bảo an toàn?
- **Ý đồ giám khảo:** Kiểm tra hiểu biết về giao thức OAuth 2.0 chuẩn quốc tế.
- **Trả lời:**  
  Hệ thống tuân thủ nghiêm ngặt quy trình **Authorization Code Grant Flow**:
  1. Người dùng bấm "Đăng nhập Google", trình duyệt chuyển hướng sang máy chủ Google Identity.
  2. Người dùng đồng ý cấp quyền, Google chuyển hướng trở lại Frontend kèm một mã ủy quyền tạm thời (`authorization_code`).
  3. Frontend gửi `authorization_code` này về Spring Boot Backend.
  4. Backend bí mật dùng `code` kết hợp với `GOOGLE_CLIENT_SECRET` gọi trực tiếp sang máy chủ Google API để đổi lấy thông tin người dùng đã được Google xác thực (`sub`, `email`, `name`).
  5. Backend kiểm tra email: nếu tài khoản chưa tồn tại thì tự động tạo tài khoản mới với vai trò `ROLE_STUDENT`; sau đó cấp cặp JWT của hệ thống Library74 trả về cho client. Cách làm này loại trừ nguy cơ client tự chế tạo thông tin giả để chiếm đoạt tài khoản.

---

### Câu 64: Cơ chế tải tệp lên AWS S3 bằng Presigned URL mang lại lợi ích gì về mặt kiến trúc và hiệu năng?
- **Ý đồ giám khảo:** Đánh giá tư duy tối ưu hóa băng thông máy chủ.
- **Trả lời:**  
  - *Cách truyền thống:* Client upload file lên Backend $\rightarrow$ Backend nhận toàn bộ dữ liệu vào bộ nhớ đệm $\rightarrow$ Backend upload tiếp lên S3. Cách này làm tăng gấp đôi độ trễ mạng, tốn RAM và làm nghẽn băng thông của máy chủ Backend khi nhiều thủ thư cùng upload file PDF hàng trăm MB.
  - *Giải pháp Presigned URL của Library74:*
    1. Frontend gửi yêu cầu xin quyền tải lên tới Backend kèm tên tệp và định dạng MIME.
    2. Backend xác thực quyền của thủ thư và sinh một đường dẫn ký trước có chữ ký số mã hóa và thời hạn ngắn (ví dụ: 15 phút).
    3. Frontend dùng đường dẫn này để đẩy trực tiếp dữ liệu nhị phân của tệp từ trình duyệt lên máy chủ lưu trữ S3 qua phương thức HTTP PUT.
    4. Máy chủ Backend hoàn toàn giải phóng khỏi luồng dữ liệu nặng, chỉ nhận thông báo URL sau khi việc upload thành công.

---

### Câu 65: Các tiêu đề bảo mật mạng (Security Headers) nào đã được kích hoạt trên hệ thống sản xuất và tác dụng của chúng là gì?
- **Ý đồ giám khảo:** Đánh giá kiến thức an ninh mạng trên môi trường triển khai thực tế.
- **Trả lời:**  
  Theo kết quả kiểm tra an ninh trong Bảng 7.5 của báo cáo, Caddy và Backend kích hoạt đầy đủ các tiêu chuẩn bảo mật web cao nhất:
  - **HSTS (Strict-Transport-Security):** Ép buộc mọi trình duyệt chỉ được phép giao tiếp qua kết nối mã hóa HTTPS, ngăn chặn tấn công hạ cấp giao thức (SSL Stripping).
  - **CSP (Content-Security-Policy):** Kiểm soát nghiêm ngặt các nguồn tài nguyên (script, style, iframe) được phép nạp vào trang web, ngăn chặn tấn công tiêm mã độc XSS.
  - **X-Content-Type-Options: nosniff:** Ngăn chặn trình duyệt tự ý đoán định kiểu MIME khác với kiểu máy chủ khai báo, chống tấn công MIME-confusion.
  - **X-Frame-Options: DENY:** Cấm việc nhúng trang web vào thẻ iframe của các trang web khác, ngăn chặn tấn công Clickjacking.

---

### Câu 66: Các điểm cuối giám sát sức khỏe (Spring Actuator Endpoints) được bảo vệ như thế nào trước nguy cơ lộ thông tin hệ thống?
- **Ý đồ giám khảo:** Kiểm tra nhận thức về bảo mật hạ tầng và thông tin nhạy cảm.
- **Trả lời:**  
  Spring Actuator cung cấp các thông tin rất nhạy cảm về hệ thống (cấu hình môi trường, heap dump, luồng xử lý, metric). Để bảo vệ tuyệt đối:
  - Trên mạng công cộng (Internet): Caddy Reverse Proxy chặn hoàn toàn mọi request từ bên ngoài truy cập vào các đường dẫn `/actuator/*` (hoặc yêu cầu xác thực quản trị cao cấp trả về mã lỗi HTTP 401).
  - Trong mạng nội bộ: Cổng giám sát Actuator chỉ được ánh xạ cục bộ cho máy chủ Prometheus và cAdvisor thu thập số liệu thông qua mạng ảo nội bộ của Docker (`bridge network`), hoàn toàn vô hình đối với người dùng bên ngoài Internet.

---

### Câu 67: Hệ thống quản lý các biến môi trường nhạy cảm (Secrets Management) như thế nào để không bao giờ bị lộ lọt vào Git?
- **Ý đồ giám khảo:** Đánh giá tính kỷ luật trong quản lý mã nguồn và bảo mật DevSecOps.
- **Trả lời:**  
  Hệ thống phân tách nghiêm ngặt thành 3 tầng quản lý bí mật:
  1. **Tầng Mã nguồn (Git):** Mọi tệp `.env`, `.env.prod`, khóa SSH, mật khẩu cơ sở dữ liệu đều được đưa vào `.gitignore`. Trong kho mã nguồn chỉ lưu tệp mẫu `.env.example` chứa tên biến mà không chứa giá trị thực.
  2. **Tầng CI/CD (GitHub Secrets):** Các khóa triển khai như `DEPLOY_SSH_KEY`, `DEPLOY_HOST`, `DEPLOY_USER` được mã hóa an toàn trên kho lưu trữ GitHub Secrets, chỉ nạp vào máy ảo runner tại thời điểm thực thi workflow.
  3. **Tầng Máy chủ Sản xuất (Production Host):** Tệp `.env.prod` được thiết lập trực tiếp trên VPS và phân quyền truy cập nghiêm ngặt bằng lệnh `chmod 600`, chỉ duy nhất người dùng quản trị `root` mới có quyền đọc và ghi tệp.

---

### Câu 68: Công cụ Flyway Migration giải quyết bài toán đồng bộ cơ sở dữ liệu giữa các môi trường như thế nào?
- **Ý đồ giám khảo:** Kiểm tra hiểu biết về quản trị vòng đời cơ sở dữ liệu (Database Lifecycle Management).
- **Trả lời:**  
  - *Vấn đề:* Nếu sửa đổi bảng biểu trực tiếp bằng tay trên DB, các môi trường (Development, Testing, Production) sẽ bị lệch cấu trúc, dẫn đến lỗi ứng dụng khi triển khai.
  - *Giải pháp Flyway của Library74:*
    + Mọi thay đổi schema đều được viết dưới dạng các tệp script SQL có phiên bản cố định tăng dần (ví dụ: `V1__create_schema.sql`, `V8__ai_publication_etl_status.sql`, `V56__generate_missing_items.sql`).
    + Khi ứng dụng Spring Boot khởi động, Flyway tự động đối soát bảng lịch sử `flyway_schema_history`.
    + Các script mới chưa từng chạy sẽ được thực thi tuần tự trong một transaction duy nhất trước khi ứng dụng chính thức mở cổng đón nhận request, đảm bảo schema luôn khớp 100% với phiên bản mã nguồn của ứng dụng.

---

### Câu 69: Làm thế nào hệ thống đảm bảo dữ liệu hiển thị không bị lỗi làm tròn hoặc mất độ chính xác khi truyền số nguyên lớn (Long/TSID) từ Backend sang Frontend?
- **Ý đồ giám khảo:** Kiểm tra kinh nghiệm giải quyết lỗi kỹ thuật kinh điển giữa Java và JavaScript.
- **Trả lời:**  
  - *Vấn đề cốt lõi:* Kiểu số nguyên lớn `Long` trong Java (64-bit) có thể đạt giá trị tối đa $9 \times 10^{18}$, trong khi kiểu số `Number` trong JavaScript sử dụng chuẩn IEEE 754 có giới hạn an toàn chỉ tới $2^{53} - 1$ ($\approx 9 \times 10^{15}$). Khi truyền trực tiếp TSID dạng số lớn sang Frontend, các chữ số cuối sẽ bị làm tròn về số 0, gây ra lỗi sai lệch ID và phát sinh lỗi nghiêm trọng khi gọi API (ví dụ lỗi foreign key violation).
  - *Giải pháp triệt để:*
    + Tại Backend: Sử dụng annotation `@JsonSerialize(using = ToStringSerializer.class)` trên tất cả các trường định danh ID trong các lớp DTO/Response để tự động chuyển đổi số lớn thành chuỗi văn bản (`String`) khi tuần tự hóa JSON.
    + Tại Frontend: Giữ nguyên ID dưới dạng chuỗi `string`, không dùng `parseInt()` để ép kiểu toán học, đảm bảo tính toàn vẹn 100% của định danh.

---

### Câu 70: Hệ thống xử lý bài toán khôi phục dữ liệu tức thì (Disaster Recovery) như thế nào nếu bản cập nhật phần mềm mới làm hỏng cơ sở dữ liệu?
- **Ý đồ giám khảo:** Đánh giá phương án dự phòng rủi ro vận hành trong môi trường sản xuất.
- **Trả lời:**  
  Dự án áp dụng chiến lược sao lưu tự động trước mọi biến động:
  - Trước khi bất kỳ phiên bản Backend mới nào được kéo về và khởi chạy trên VPS, pipeline CD kích hoạt một container chuyên dụng chụp ngay bản sao lưu nhị phân nén của PostgreSQL (`library-YYYYMMDD-HHMMSS.dump`).
  - Nếu quá trình Flyway migration gặp lỗi hoặc ứng dụng mới khởi động thất bại, script kiểm tra sức khỏe sẽ báo động `Deployment Failed`.
  - Quản trị viên chỉ cần thực thi lệnh phục hồi chuẩn bằng `pg_restore` để đưa cơ sở dữ liệu quay trở lại trạng thái hoàn hảo ngay trước thời điểm deploy chỉ trong vòng chưa đầy 60 giây, đảm bảo nguyên tắc an toàn dữ liệu tuyệt đối (Zero Data Loss).

---

# PHẦN 5: CHIẾN LƯỢC, THỰC NGHIỆM & KẾT QUẢ KIỂM THỬ (CHƯƠNG 7) (Câu 71 – 85)

### Câu 71: Trình bày chiến lược kiểm thử phân tầng dạng phễu (Testing Funnel) của hệ thống Library74?
- **Ý đồ giám khảo:** Đánh giá tư duy chiến lược về đảm bảo chất lượng phần mềm (QA Strategy).
- **Trả lời:**  
  Chiến lược kiểm thử được thiết kế phân tầng từ thấp lên cao theo 4 cấp độ:
  1. **Tầng Mã nguồn (Unit & Contract Tests):** Chạy nhanh trong môi trường cô lập để bắt lỗi logic nghiệp vụ và sai lệch hợp đồng dữ liệu ngay khi lập trình viên sửa code.
  2. **Tầng Tích hợp (Integration Tests):** Kiểm tra sự phối hợp giữa mã nguồn với cơ sở dữ liệu PostgreSQL thật (sử dụng Testcontainers) và giao tiếp giữa các service.
  3. **Tầng Môi trường Triển khai (Production Smoke & Security Tests):** Xác nhận phiên bản đóng gói container thật vận hành ổn định trên tên miền công khai `library74.uk`.
  4. **Tầng Chuyên sâu (AI Benchmark & Load Testing):** Đo lường năng lực học máy bằng các độ đo toán học và kiểm tra sức chịu tải đồng thời của hệ thống.

---

### Câu 72: Kết quả kiểm thử Frontend ở tầng mã nguồn đạt được những chỉ số cụ thể nào?
- **Ý đồ giám khảo:** Kiểm tra việc nắm bắt số liệu thực nghiệm trong Bảng 7.2 của báo cáo.
- **Trả lời:**  
  Bộ kiểm thử Frontend sử dụng Jest, React Testing Library và môi trường giả lập `jsdom`:
  - **12/12 Test Suites passed** tuyệt đối (100%).
  - **62/62 Test Cases passed** toàn bộ.
  - Tổng thời gian thực thi cực nhanh: chỉ khoảng **1.31 giây**.
  - Phạm vi bao phủ: Kiểm tra toàn diện các context cốt lõi (`AuthContext`, `LanguageContext`, `ThemeContext`), các bộ bảo vệ tuyến đường (`ProtectedRoute`), các component dùng chung và hợp đồng giao tiếp HTTP Service.

---

### Câu 73: Bộ kiểm thử Backend được tổ chức như thế nào và số lượng test case của từng module là bao nhiêu?
- **Ý đồ giám khảo:** Đánh giá tính xác thực của số liệu kiểm thử Backend trong Bảng 7.3.
- **Trả lời:**  
  Backend đạt kết quả kiểm thử hoàn hảo với **23 Test Classes** và **79/79 Test Cases passed** (100%), phân bổ cụ thể theo từng phân hệ nghiệp vụ:
  - `library-auth-module`: 1 class, 3 tests (Đăng ký, xác thực email, sinh token).
  - `library-user-module`: 3 classes, 10 tests (Hồ sơ, phân trang thông báo, đánh dấu đã đọc).
  - `library-catalog-module`: 5 classes, 12 tests (Tạo ấn phẩm, upload URL, truy vấn SQL public search).
  - `library-circulation-module`: 5 classes, 24 tests (Luồng mượn trả, phạt, đặt trước, chính sách).
  - `library-recommendation-module`: 7 classes, 24 tests (Wishlist, rating, AI gateway fallback, HMAC callback).
  - `library-bootstrap`: 2 classes, 6 tests (Kiểm thử tích hợp trên PostgreSQL thật với Testcontainers).

---

### Câu 74: Tại sao trong kiểm thử Backend lại sử dụng Testcontainers thay vì cơ sở dữ liệu trong bộ nhớ H2 Database?
- **Ý đồ giám khảo:** Đánh giá hiểu biết sâu sắc về kiểm thử cơ sở dữ liệu thực tế.
- **Trả lời:**  
  - *Nhược điểm của H2 Database:* H2 là DB giả lập trong bộ nhớ, cú pháp SQL và các hàm chuyên biệt khác xa PostgreSQL. Đặc biệt, H2 **không hỗ trợ extension `pgvector`** và các toán tử tính toán vector (`<=>`), cũng như không hỗ trợ chính xác kiểu dữ liệu JSONB và cú pháp khóa hàng bi quan (`SELECT FOR UPDATE`). Sử dụng H2 có thể test pass ở local nhưng lại sập khi đưa lên production.
  - *Ưu thế của Testcontainers:* Khởi chạy một container PostgreSQL thật giống hệt môi trường sản xuất ngay trong quá trình chạy test JUnit. Mọi truy vấn native SQL, migration của Flyway và logic chỉ mục vector đều được xác thực trên môi trường chuẩn 100%.

---

### Câu 75: Bộ kiểm thử AI Service trên Pytest bao phủ những khía cạnh nào và tại sao lại có 3 test bị skip?
- **Ý đồ giám khảo:** Kiểm tra số liệu Bảng 7.4 và lý do kỹ thuật đằng sau các test case.
- **Trả lời:**  
  Bộ kiểm thử AI Service đạt **72 passed và 3 skipped** trên tổng số 75 ca kiểm thử:
  - *72 ca kiểm thử passed:* Bao phủ toàn bộ pipeline xử lý văn bản PDF, làm sạch header/footer, thuật toán sliding window, bóc tách JSON an toàn từ LLM, lọc tag chất lượng, kiểm tra schema bảng vector, logic hybrid search, thuật toán ALS và cơ chế ký HMAC callback.
  - *3 ca kiểm thử skipped:* Đây là các bài kiểm tra tích hợp trực tiếp (`integration_live`) đòi hỏi phải kết nối mạng ra bên ngoài để gọi trực tiếp vào API Gemini thật và PostgreSQL production. Các test này được cấu hình bỏ qua mặc định trong môi trường CI cục bộ để tránh tiêu tốn hạn ngạch API và đảm bảo pipeline CI chạy nhanh, không bị phụ thuộc vào kết nối internet bên ngoài.

---

### Câu 76: Kịch bản Production Smoke Test trên domain `library74.uk` đã kiểm tra những gì và kết quả ra sao?
- **Ý đồ giám khảo:** Kiểm tra bằng chứng thực nghiệm trên môi trường thật (Bảng 7.5).
- **Trả lời:**  
  Hệ thống thực hiện kiểm thử tự động 8 kịch bản chỉ đọc trực tiếp trên domain công khai:
  - Tải tài nguyên trang chủ: HTTP 200, độ trễ **95.58ms**.
  - Khởi xuất dữ liệu thống kê: HTTP 200, độ trễ **251.25ms**.
  - Tra cứu danh mục sách: HTTP 200, độ trễ **136.23ms**.
  - Tìm kiếm ngữ nghĩa AI: HTTP 200, độ trễ **344.91ms**.
  - Ràng buộc đăng nhập sai: HTTP 400, độ trễ **135.29ms** (bắt lỗi chính xác).
  - Lọc quyền truy cập quản trị không token: HTTP 401, độ trễ **120.12ms** (tường lửa hoạt động tốt).
  - Tiêm cấu trúc dữ liệu lỗi (Malformed payload): HTTP 200/handled, độ trễ **100.85ms** (không bị crash server).  
  $\rightarrow$ **Kết luận: 100% kịch bản (8/8) vượt qua quy trình kiểm định với phản hồi tức thời.**

---

### Câu 77: Năng lực Tìm kiếm Ngữ nghĩa đạt được các chỉ số định lượng nào trong bài benchmark AI (Bảng 7.6)?
- **Ý đồ giám khảo:** Đánh giá khả năng hiểu các độ đo chuẩn trong lĩnh vực Truy xuất Thông tin (Information Retrieval).
- **Trả lời:**  
  Dựa trên kịch bản `ai_quality_benchmark.py` chạy trên các ấn phẩm chuyên ngành thực tế của thư viện:
  - **MRR (Mean Reciprocal Rank) = 1.000 (Tuyệt đối):** Tài liệu liên quan chính xác nhất luôn xuất hiện ngay ở vị trí đầu tiên (Rank 1) trên toàn bộ các truy vấn thử nghiệm.
  - **Recall@5 = 87.5%:** Đại đa số các tài liệu có liên quan trong kho đều được tìm thấy và ưu tiên xếp vào nhóm 5 kết quả đầu tiên.
  - **nDCG@5 = 0.907:** Thước đo phản ánh thứ hạng lý tưởng của kết quả tìm kiếm đạt điểm số rất cao (tiệm cận mức hoàn hảo 1.0).
  - **Độ phủ (Coverage) = 100.0%:** Không có bất kỳ truy vấn nào bị lỗi hoặc trả về kết quả rỗng.

---

### Câu 78: Tại sao chỉ số Precision@5 của tìm kiếm ngữ nghĩa chỉ đạt 63.3%? Đây có phải là lỗi không?
- **Ý đồ giám khảo:** Kiểm tra xem sinh viên có hiểu bản chất của độ đo hay chỉ học vẹt số liệu.
- **Trả lời:**  
  Đây **không phải là lỗi**, mà là hiện tượng toán học tự nhiên trong bài toán truy xuất thông tin:
  - Độ đo `Precision@5` tính tỷ lệ tài liệu liên quan nằm trong đúng 5 kết quả đầu tiên trả về.
  - Trong kho tài liệu thử nghiệm, có những chủ đề chuyên ngành rất hẹp (ví dụ: *"polymer / công nghệ nano"*), kho sách thư viện chỉ có duy nhất 1 hoặc 2 cuốn sách chính xác tuyệt đối về chủ đề này.
  - Do thuật toán luôn cố gắng lấp đầy Top-5 kết quả, các vị trí số 3, 4, 5 sẽ được điền bởi các cuốn sách về *"khoa học vật liệu tổng quát"*. Mặc dù cuốn đúng nhất đã đứng ở vị trí số 1 (`MRR = 1.000`), nhưng vì mẫu số của Precision@5 luôn là 5, nên việc chỉ có 2/5 cuốn liên quan trực tiếp khiến chỉ số này dừng ở mức 63.3%. Điều này hoàn toàn bình thường đối với các tập dữ liệu chuyên ngành có dung lượng vừa phải.

---

### Câu 79: Con số F1-Score = 100% của tính nhất quán nhãn (Tag Consistency) trong báo cáo được hiểu như thế nào cho đúng?
- **Ý đồ giám khảo:** Kiểm tra tính trung thực trong việc diễn giải kết quả nghiên cứu.
- **Trả lời:**  
  Báo cáo tại Chương 7 đã giải thích rất minh bạch:
  - Con số $F1 = 100.0\%$ đại diện cho **sự nhất quán tuyệt đối giữa metadata do AI sinh ra so với bộ nhãn đã được con người giám tuyển (curated tags)** đang lưu trữ trên cơ sở dữ liệu sản xuất.
  - Nhóm tác giả **không diễn giải số liệu này thành năng lực suy luận độc lập tuyệt đối 100% của mô hình trên tài liệu lạ**. Nó chứng minh pipeline trích xuất nhãn và các quy tắc chuẩn hóa từ vựng tiếng Việt hoạt động hoàn toàn chính xác, không làm sai lệch hay mất mát các nhãn chuyên ngành đã được quy định chuẩn.

---

### Câu 80: Đánh giá chất lượng tóm tắt sách đạt những tiêu chuẩn cụ thể nào?
- **Ý đồ giám khảo:** Kiểm tra số liệu định lượng về chất lượng văn bản sinh ra từ LLM.
- **Trả lời:**  
  Chất lượng tóm tắt được đo lường bằng 3 tiêu chí khách quan:
  1. **Keyword Coverage = 90.0%:** 90% các từ khóa chuyên ngành học thuật cốt lõi của cuốn sách xuất hiện chuẩn xác trong đoạn tóm tắt.
  2. **Length Compliance = 100.0%:** 100% các bản tóm tắt tuân thủ nghiêm ngặt giới hạn độ dài học thuật (từ 200 đến 300 từ), không bị hiện tượng câu cụt hoặc viết lan man.
  3. **Hallucination Guard = 100.0%:** Toàn bộ nội dung tóm tắt đều được neo (grounded) trên ngữ cảnh thực tế của tài liệu, không phát sinh thông tin bịa đặt.

---

### Câu 81: Tại sao kịch bản Kiểm thử chịu tải (Load Testing) lại chọn endpoint tìm kiếm catalog mà không chọn endpoint mượn sách?
- **Ý đồ giám khảo:** Đánh giá phương pháp luận kiểm thử hiệu năng an toàn trên môi trường thật.
- **Trả lời:**  
  Có hai lý do kỹ thuật quan trọng:
  1. **Tính chất an toàn trên môi trường sản xuất thật (`library74.uk`):** Việc kiểm thử chịu tải được thực hiện trực tiếp trên hệ thống đang chạy thật. Endpoint tìm kiếm catalog là tác vụ chỉ đọc dữ liệu (`Read-only`), không làm thay đổi trạng thái cơ sở dữ liệu, không tạo ra dữ liệu rác, không làm lệch số liệu thống kê hay ảnh hưởng đến giao dịch thực của người dùng.
  2. **Giá trị đại diện thực tế:** Trong một hệ thống thư viện, tần suất người dùng tra cứu, tìm kiếm và lọc sách luôn chiếm tới 80% - 90% tổng lưu lượng truy cập của toàn hệ thống, cao hơn rất nhiều so với tần suất thực hiện giao dịch mượn trả tại quầy.

---

### Câu 82: Kết quả kiểm thử chịu tải ở các mức 50, 100 và 200 người dùng ảo đồng thời (Bảng 7.7) cho thấy điều gì?
- **Ý đồ giám khảo:** Đánh giá khả năng phân tích biểu đồ và số liệu chịu tải.
- **Trả lời:**  
  Kết quả thực nghiệm cho thấy các đặc tính quan trọng của hệ thống:
  - **Mức 50 users:** Thực hiện 1.205 requests trong 31.55s; thông lượng đạt **38.19 req/s**; độ trễ trung bình 1.286ms, p95 đạt **2.297ms**; tỷ lệ lỗi **0.00%**.
  - **Mức 100 users:** Thực hiện 1.349 requests trong 32.03s; thông lượng đạt **42.11 req/s**; độ trễ trung bình 2.324ms, p95 đạt **4.191ms**; tỷ lệ lỗi **0.00%**.
  - **Mức 200 users:** Thực hiện 1.454 requests trong 32.79s; thông lượng bão hòa ở mức **44.34 req/s**; p95 đạt **7.678ms**; tỷ lệ lỗi vẫn duy trì tuyệt đối **0.00%** (100% trả về mã HTTP 200).

---

### Câu 83: Tại sao ở mức 200 người dùng ảo, độ trễ p95 lại tăng lên 7.68 giây nhưng hệ thống vẫn được đánh giá là hoạt động tốt?
- **Ý đồ giám khảo:** Kiểm tra nhận thức về hành vi của hệ thống khi chạm ngưỡng bão hòa phần cứng (Saturation Point).
- **Trả lời:**  
  - *Hiện tượng bão hòa thông lượng:* Từ mức 100 lên 200 users, thông lượng chỉ tăng nhẹ từ 42.11 lên 44.34 req/s. Điều này chứng minh CPU và nhóm kết nối cơ sở dữ liệu (Database Connection Pool) của máy chủ đã chạm ngưỡng xử lý tối đa của gói cấu hình phần cứng hiện tại.
  - *Ý nghĩa của tỷ lệ lỗi 0.00%:* Điểm đáng khen nhất là hệ thống **không hề bị sập (crash), không tràn bộ nhớ (OOM) và không trả về bất kỳ mã lỗi HTTP 500 hay 502 nào**. Hệ thống tự động chuyển sang cơ chế xếp hàng đợi an toàn (Request Queuing) để xử lý tuần tự từng request. Đối với một hệ thống thư viện chạy trên cấu hình VPS tiết kiệm, việc giữ vững tính toàn vẹn và không đánh rơi request của người dùng dưới áp lực tải gấp 4 lần bình thường là minh chứng cho độ ổn định cao.

---

### Câu 84: Tại sao nhóm không tiếp tục ép tải lên các mức cao hơn như 500 hay 1000 người dùng ảo?
- **Ý đồ giám khảo:** Đánh giá tính thực tế và sự cẩn trọng trong vận hành môi trường thật.
- **Trả lời:**  
  Báo cáo tại Mục 7.4 đã nêu rõ: bài kiểm thử được thực hiện theo phương pháp thăm dò có kiểm soát (Controlled Load Probe) trực tiếp trên máy chủ production đang phục vụ người dùng thật. Khi nhận thấy tại mức 200 người dùng ảo, thông lượng đã bão hòa quanh 44 req/s và độ trễ p95 đã tiệm cận mức 7.6 giây, việc tiếp tục ép tải cao hơn chắc chắn sẽ làm nghẽn máy chủ (Denial of Service tự gây ra) và ảnh hưởng đến tính sẵn sàng của tên miền `library74.uk`. Mục tiêu kiểm thử là xác định ranh giới vận hành an toàn chứ không phải phá hủy hệ thống.

---

### Câu 85: Những hạn chế kỹ thuật nào được nhóm tác giả tự đánh giá và đề xuất hướng nâng cấp trong tương lai?
- **Ý đồ giám khảo:** Đánh giá tính tự phê phán khoa học (Critical Thinking).
- **Trả lời:**  
  Nhóm thẳng thắn nhìn nhận 3 hạn chế và đưa ra giải pháp rõ ràng:
  1. **Về đánh giá trích xuất nhãn:** Cần xây dựng một bộ dữ liệu kiểm thử độc lập hoàn toàn với các tài liệu mới chưa từng có trong hệ thống để đo lường năng lực suy luận tổng quát của mô hình.
  2. **Về hệ thống gợi ý cá nhân hóa:** Cần thêm thời gian vận hành thực tế để thu thập đủ lịch sử tương tác dài hạn của sinh viên, từ đó tiến hành tính toán các chỉ số `Precision@K` và `nDCG@K` cho phân hệ ALS.
  3. **Về sức chịu tải:** Trong tương lai, cần đưa hệ thống vào môi trường Staging độc lập để thực hiện bài Stress Test cực hạn nhằm xác định chính xác điểm gãy phần cứng (Breaking Point), đồng thời tích hợp thêm Redis Cache cho tầng truy vấn danh mục để nâng thông lượng vượt qua ngưỡng 100 req/s.

---

# PHẦN 6: TRIỂN KHAI, VẬN HÀNH THỰC TẾ, CI/CD & GIÁM SÁT (CHƯƠNG 8) (Câu 86 – 100)

### Câu 86: Trình bày kiến trúc đóng gói và vận hành của hệ thống trên máy chủ VPS?
- **Ý đồ giám khảo:** Đánh giá khả năng làm chủ hạ tầng container hóa và triển khai sản xuất.
- **Trả lời:**  
  Toàn bộ hệ thống được đóng gói thông qua các container Docker độc lập, phối hợp vận hành trên cùng một mạng máy chủ:
  - **Lớp Biên & Định tuyến:** Caddy Reverse Proxy tiếp nhận HTTPS bên ngoài, kết nối tới Nginx container phục vụ Frontend và các container nội bộ.
  - **Lớp Ứng dụng:** Container Spring Boot Backend (chạy trên JDK 21), Container FastAPI AI API và Container Celery AI Worker (chạy trên Python 3.10).
  - **Lớp Hạ tầng Dữ liệu:** Container PostgreSQL 15 tích hợp `pgvector`, cụm Apache Kafka xử lý sự kiện, và RabbitMQ làm Message Broker cho tác vụ nền.
  - Các cổng dịch vụ nội bộ (PostgreSQL 5432, Kafka 9092, RabbitMQ 5672) được cô lập hoàn toàn bên trong Docker Network, không mở ra ngoài Internet.

---

### Câu 87: Tại sao giá trị cấu hình `KAFKA_CFG_ADVERTISED_LISTENERS` phải thay đổi giữa môi trường phát triển (Local) và sản xuất (Docker)?
- **Ý đồ giám khảo:** Kiểm tra kiến thức thực chiến về mạng trong Docker và Kafka broker.
- **Trả lời:**  
  Đây là một điểm cấu hình rất dễ gây lỗi trong triển khai thực tế:
  - *Ở môi trường phát triển (Local):* Spring Boot chạy trực tiếp trên máy tính của lập trình viên (Host machine), trong khi Kafka chạy trong Docker. Do đó, Kafka phải khai báo địa chỉ lắng nghe công khai là `PLAINTEXT://localhost:9092` để ứng dụng từ máy host kết nối vào được.
  - *Ở môi trường sản xuất (Production Containers):* Cả Spring Boot và Kafka đều nằm bên trong các container Docker riêng biệt cùng kết nối vào một Docker Bridge Network. Các container giao tiếp với nhau bằng cơ chế phân giải tên dịch vụ (DNS nội bộ của Docker). Do đó, cấu hình bắt buộc phải đổi thành `PLAINTEXT://kafka:9092` thì Spring Boot mới có thể tìm thấy Kafka broker.

---

### Câu 88: Trình bày mục tiêu cốt lõi của hệ thống CI/CD Pipeline được xây dựng trong đồ án?
- **Ý đồ giám khảo:** Đánh giá nhận thức về tự động hóa quy trình phần mềm (DevOps).
- **Trả lời:**  
  Hệ thống CI/CD dựa trên GitHub Actions được thiết kế nhằm đạt được 4 mục tiêu sống còn:
  1. **Tự động hóa toàn diện 100%:** Loại bỏ hoàn toàn các thao tác thủ công rủi ro của con người (không cần đăng nhập SSH gõ lệnh bằng tay khi phát hành bản mới).
  2. **Kiểm soát chất lượng bằng Quality Gate:** Bắt buộc 100% các bài kiểm thử tự động (Unit, Contract, Build test) phải pass trước khi mã nguồn được phép chạm vào server.
  3. **An toàn dữ liệu tuyệt đối (Zero Data Loss):** Luôn tự động sao lưu dữ liệu cơ sở dữ liệu trước khi nâng cấp backend.
  4. **Kiểm tra sức khỏe tự động sau triển khai (Post-deployment Health Check):** Tự động phát hiện lỗi và cảnh báo ngay trong 3 phút đầu nếu container mới không phản hồi.

---

### Câu 89: Cơ chế Lọc đường dẫn (Path-filtered Trigger) trong CI/CD giải quyết bài toán gì cho dự án Monorepo?
- **Ý đồ giám khảo:** Kiểm tra kiến thức tối ưu hóa tài nguyên và thời gian build trong pipeline CI/CD.
- **Trả lời:**  
  Dự án quản lý mã nguồn theo mô hình Monorepo (chứa đồng thời `LMS_BE`, `LMS_FE` và `LMS-AI` trong cùng một repository).
  - *Nếu không có bộ lọc đường dẫn:* Bất kỳ một sửa đổi nhỏ nào (ví dụ: chỉ sửa một dòng chữ ở giao diện Frontend) cũng sẽ kích hoạt chạy lại toàn bộ test và build lại cả 3 phân hệ, gây lãng phí nghiêm trọng quota tính giờ của GitHub Actions và tốn thời gian chờ đợi.
  - *Giải pháp:* Sử dụng bộ lọc đường dẫn thay đổi (`paths: ['LMS_FE/**']`, `paths: ['LMS_BE/**']`, `paths: ['LMS-AI/**']`). Thay đổi thuộc phân hệ nào sẽ chỉ kích hoạt duy nhất pipeline CI/CD của phân hệ đó, giúp tiết kiệm tài nguyên và rút ngắn thời gian phát hành xuống dưới 3 phút.

---

### Câu 90: Giải thích quyết định kiến trúc: "Bỏ bước Docker Build của phân hệ AI trên GitHub Actions Runner và chuyển sang build trên VPS"?
- **Ý đồ giám khảo:** Đánh giá khả năng tối ưu hóa sâu sắc dựa trên đặc thù công nghệ.
- **Trả lời:**  
  Báo cáo tại Mục 8.3 đã phân tích rất rõ sự đánh đổi kỹ thuật này:
  - Phân hệ AI sử dụng các thư viện tính toán khoa học và học máy rất nặng như `torch` (~1GB), `sentence-transformers`, `scipy`.
  - Nếu thực hiện `docker build` trên máy ảo sạch của GitHub-hosted Runner, máy ảo sẽ phải tải lại toàn bộ PyTorch và model weights từ đầu qua mạng internet mà không có bộ nhớ đệm cục bộ, làm thời gian chạy CI kéo dài từ **12 đến 15 phút**.
  - *Giải pháp tối ưu của nhóm:* Phân hệ AI CI trên GitHub Runner chỉ làm nhiệm vụ kiểm tra cú pháp mã nguồn (`compileall`) và chạy Pytest thuần túy (mất ~1 phút). Việc đóng gói Docker image được chuyển giao hoàn toàn cho máy chủ VPS trong giai đoạn CD. Tại VPS, Docker Daemon đã lưu sẵn các layer cơ sở nặng của PyTorch trong bộ nhớ đệm cục bộ, do đó quá trình build lại image khi có cập nhật code mới **chỉ tiêu tốn từ 3 đến 5 giây**.

---

### Câu 91: Kết nối SSH từ GitHub Actions Runner tới VPS được bảo mật như thế nào?
- **Ý đồ giám khảo:** Kiểm tra kiến thức bảo mật đường truyền trong quy trình CD.
- **Trả lời:**  
  Quy trình CD áp dụng tiêu chuẩn bảo mật cao cấp:
  1. Không sử dụng mật khẩu tài khoản (Zero Password Authentication).
  2. Sử dụng cặp khóa mã hóa hiện đại chuẩn **`ed25519`** (vượt trội hơn RSA truyền thống về cả độ dài khóa ngắn hơn và khả năng chống giải mã).
  3. Khóa bí mật (`DEPLOY_SSH_KEY`) được mã hóa trong GitHub Secrets.
  4. Trước khi thiết lập phiên làm việc, Runner thực hiện đối soát dấu vân tay máy chủ thông qua biến `DEPLOY_KNOWN_HOSTS` được định cấu hình từ trước, loại trừ hoàn toàn nguy cơ bị tấn công giả mạo máy chủ trung gian (Man-in-the-Middle).

---

### Câu 92: Tại sao trong lệnh đồng bộ mã nguồn trên VPS lại bắt buộc sử dụng cờ `--ff-only` (`git pull --ff-only origin main`)?
- **Ý đồ giám khảo:** Kiểm tra tính kỷ luật trong quản lý mã nguồn trên máy chủ sản xuất.
- **Trả lời:**  
  Lệnh `git pull --ff-only origin main` (Fast-forward only) đảm bảo rằng:
  - Nhánh `main` trên máy chủ sản xuất chỉ được phép cập nhật nếu lịch sử commit là một đường thẳng khớp tuyệt đối với commit đã vượt qua toàn bộ các bài test trên GitHub.
  - Nếu trên máy chủ vô tình có ai đó vào sửa file trực tiếp hoặc xung đột nhánh, cờ `--ff-only` sẽ lập tức từ chối việc kéo code và báo lỗi, ngăn chặn tuyệt đối tình trạng máy chủ tự động sinh ra các **Merge Commit ngoài tầm kiểm soát**, giữ cho môi trường production luôn đồng nhất và có thể kiểm toán được.

---

### Câu 93: Quy trình tự động sao lưu cơ sở dữ liệu trước khi triển khai Backend diễn ra như thế nào?
- **Ý đồ giám khảo:** Kiểm tra cơ chế đảm bảo an toàn dữ liệu tự động trong Bảng 8.4.
- **Trả lời:**  
  Trong workflow `backend-cd.yml`, trước khi câu lệnh cập nhật container backend được thực thi:
  1. Pipeline kích hoạt container phụ trợ `postgres-backup` thông qua lệnh:  
     `docker compose --profile backup run --rm postgres-backup`.
  2. Container này thực thi lệnh `pg_dump` ở định dạng nhị phân nén tùy chỉnh (`custom binary format`), tạo ra tệp snapshot có định dạng tên theo thời gian thực: `library-YYYYMMDD-HHMMSS.dump`.
  3. Tệp sao lưu được lưu trữ trên một volume vật lý độc lập trên máy chủ.
  4. Chỉ sau khi bản snapshot được tạo thành công, tiến trình cập nhật ứng dụng và chạy migration mới được phép tiếp tục.

---

### Câu 94: Cơ chế "Cập nhật dịch vụ độc lập không gián đoạn" (Zero Interruption Update) hoạt động ra sao?
- **Ý đồ giám khảo:** Đánh giá khả năng hạn chế thời gian chết (Downtime) của dịch vụ.
- **Trả lời:**  
  Hệ thống áp dụng cơ chế cập nhật nhắm đích theo từng container cụ thể:
  - Khi có bản phát hành mới của Backend, hệ thống chỉ thực thi:  
    `docker compose up -d --build backend`.
  - Docker Compose sẽ chỉ đóng gói lại image backend và thay thế container backend cũ bằng container mới.
  - Toàn bộ các dịch vụ hạ tầng nền tảng khác như: PostgreSQL Database, Kafka, RabbitMQ, Celery Worker và đặc biệt là Caddy Reverse Proxy **vẫn duy trì kết nối liên tục 100%, không hề bị khởi động lại**.
  - Các kết nối đang truy cập vào Frontend hoặc các tác vụ nền đang chạy không bị ngắt quãng giữa chừng.

---

### Câu 95: Vòng lặp thăm dò sức khỏe dịch vụ (Post-deployment Health Check Polling) được cấu hình như thế nào?
- **Ý đồ giám khảo:** Kiểm tra cơ chế tự động xác thực trạng thái sau phát hành.
- **Trả lời:**  
  Script triển khai không dừng lại ngay sau khi lệnh Docker hoàn tất, mà thực hiện một vòng lặp kiểm tra trạng thái chủ động:
  - **Tần suất thăm dò:** Tối đa 36 lần, mỗi lần cách nhau 5 giây (tổng thời gian chờ tối đa là 180 giây / 3 phút).
  - **Nội dung kiểm tra:**
    + *Với Backend:* Dùng `wget` gọi trực tiếp vào endpoint nội bộ `http://127.0.0.1:8080/actuator/health` và tìm kiếm chuỗi trạng thái `"UP"`.
    + *Với AI Service:* Gọi vào `http://127.0.0.1:8001/health`.
    + *Với Frontend:* Kiểm tra đồng thời mã HTTP 200 từ Nginx nội bộ và domain công khai `https://library74.uk`.
  - Nếu sau 3 phút mà dịch vụ không phản hồi thành công, pipeline tự động đánh dấu `FAILED` và gửi cảnh báo để người quản trị can thiệp kịp thời.

---

### Câu 96: So sánh định lượng hiệu quả vận hành trước và sau khi áp dụng CI/CD trong dự án (Bảng 8.4)?
- **Ý đồ giám khảo:** Đánh giá khả năng tổng kết giá trị cải tiến kỹ thuật dựa trên số liệu thực tế.
- **Trả lời:**  
  Báo cáo tại Chương 8 đã đúc kết sự chuyển đổi vượt bậc qua 5 tiêu chí định lượng:
  1. **Thời gian phát hành:** Giảm từ 15 - 30 phút (thao tác thủ công) xuống **dưới 3 phút** (tự động hóa 100%).
  2. **Kiểm định chất lượng mã nguồn:** Từ việc dễ bỏ sót test sang **100% tự động vượt qua toàn bộ test suite** trước khi được deploy.
  3. **An toàn dữ liệu:** Từ việc sao lưu thủ công dễ bị quên sang **100% tự động chụp snapshot nhị phân** trước mỗi lần cập nhật.
  4. **Gián đoạn dịch vụ (Downtime):** Tối thiểu hóa tối đa nhờ việc cập nhật tách biệt từng container chuyên trách.
  5. **Phát hiện lỗi phát hành:** Từ việc phát hiện muộn qua phàn nàn của người dùng sang việc **bắt lỗi tự động ngay trong 3 phút đầu** nhờ vòng lặp Health Check.

---

### Câu 97: Trình bày cơ chế bảo mật và phân quyền tài nguyên máy chủ thông qua Docker cgroups?
- **Ý đồ giám khảo:** Kiểm tra nhận thức về tối ưu hóa và chống cạn kiệt tài nguyên hệ thống (Resource Starvation).
- **Trả lời:**  
  Để đảm bảo các dịch vụ không tranh chấp bộ nhớ làm treo hệ điều hành của VPS:
  - Mỗi dịch vụ trong `docker-compose.prod.yml` đều được thiết lập ngưỡng giới hạn tài nguyên cứng (Hard Limits):
    + Backend Spring Boot được cấp phát bộ nhớ JVM tối đa với tham số `-Xmx512m`, tổng mức tiêu thụ container duy trì dưới **600MB RAM**.
    + AI FastAPI Server duy trì dưới **400MB RAM**.
    + PostgreSQL và Kafka được cấu hình bộ đệm phù hợp với dung lượng máy chủ.  
  Thiết kế này ngăn chặn triệt để trường hợp một tiến trình bị rò rỉ bộ nhớ (memory leak) chiếm dụng toàn bộ tài nguyên máy chủ, bảo vệ sự ổn định lâu dài của hệ thống.

---

### Câu 98: Tên miền và luồng phân giải DNS của `library74.uk` được tổ chức như thế nào?
- **Ý đồ giám khảo:** Đánh giá hiểu biết về hạ tầng mạng Internet và CDN.
- **Trả lời:**  
  - Tên miền quốc tế `library74.uk` được đăng ký chính thức để tạo địa chỉ truy cập duy nhất cho người dùng thay vì ghi nhớ IP máy chủ.
  - Bản ghi DNS của tên miền được quản lý tập trung thông qua **Cloudflare DNS**, trỏ trực tiếp về địa chỉ IP tĩnh của máy chủ VPS trên nền tảng Google Cloud Platform (GCP).
  - Tại máy chủ GCP, Caddy tiếp nhận các kết nối trên cổng 80 và 443, tự động chuyển tiếp toàn bộ traffic HTTP sang kết nối an toàn HTTPS và định tuyến vào các dịch vụ tương ứng bên trong máy chủ.

---

### Câu 99: Tổng chi phí vận hành cố định của hệ thống trong cấu hình sản xuất thực tế là bao nhiêu (Bảng 8.5)?
- **Ý đồ giám khảo:** Đánh giá tính toán kinh tế kỹ thuật của đồ án tốt nghiệp.
- **Trả lời:**  
  Hệ thống được thiết kế với tiêu chí tối ưu hóa chi phí tối đa cho nhà trường:
  - **Tên miền `library74.uk`:** 5,3 USD / năm.
  - **Chứng chỉ bảo mật SSL/HTTPS:** Miễn phí (tự động cấp phát qua Let's Encrypt).
  - **Máy chủ Google Cloud Platform (GCP VPS):** Ước tính khoảng 92 USD / năm (hiện tại đang tận dụng gói ưu đãi miễn phí 3 tháng đầu của Google Cloud).
  - **Lưu trữ tài liệu và API ngoài:** Sử dụng dung lượng thực tế và hạn ngạch thử nghiệm miễn phí của Gemini API, PayOS sandbox, Gmail SMTP.  
  $\rightarrow$ **Tổng chi phí cố định tối thiểu chỉ khoảng 97,3 USD / năm** (~ 2,4 triệu VNĐ/năm). Đây là mức ngân sách cực kỳ tiết kiệm cho một hệ thống quản lý thư viện trực tuyến hoàn chỉnh có tích hợp AI hiện đại.

---

### Câu 100: Nếu được tiếp tục phát triển dự án này lên quy mô toàn Đại học Quốc gia (phục vụ hàng chục nghìn sinh viên), em sẽ cải tiến kiến trúc như thế nào?
- **Ý đồ giám khảo:** Câu hỏi chốt hạ để đánh giá tầm nhìn kiến trúc sư phần mềm (Software Architect Vision) của sinh viên khi tốt nghiệp.
- **Trả lời:**  
  Để mở rộng hệ thống lên quy mô phục vụ hàng chục trường đại học thành viên, em sẽ nâng cấp kiến trúc theo 4 hướng chiến lược:
  1. **Chuyển dịch sang Kubernetes (K8s):** Thay thế Docker Compose bằng cụm Kubernetes để hỗ trợ tự động mở rộng quy mô ngang (Horizontal Pod Autoscaling - HPA) cho Backend và AI API theo lưu lượng tải thực tế.
  2. **Bộ nhớ đệm phân tán Redis (Distributed Caching):** Bổ sung tầng Redis Cache ở phía trước cơ sở dữ liệu để lưu trữ các kết quả tìm kiếm danh mục phổ biến, thông tin người dùng và session, giúp giải phóng tải cho PostgreSQL và đẩy thông lượng vượt qua ngưỡng 500 req/s.
  3. **Tách cụm Worker chuyên biệt có GPU:** Tách tiến trình Celery Worker sang các node xử lý độc lập có trang bị GPU chuyên dụng để tăng tốc độ nhúng vector và xử lý hàng nghìn tài liệu PDF cùng lúc.
  4. **Đồng bộ hóa đa chi nhánh (Multi-tenant Database):** Nâng cấp kiến trúc dữ liệu hỗ trợ cơ chế đa khách thuê (Multi-tenancy), cho phép mỗi trường thành viên quản lý độc lập kho sách và chính sách lưu thông riêng nhưng vẫn dùng chung nền tảng tìm kiếm ngữ nghĩa và trí tuệ nhân tạo tập trung của hệ thống.

---

### LỜI KẾT DÀNH CHO SINH VIÊN BẢO VỆ
> *"Khi trả lời hội đồng, hãy giữ phong thái đĩnh đạc, bình tĩnh, nhìn thẳng vào thầy cô. Luôn bắt đầu bằng việc xác nhận trọng tâm câu hỏi của thầy cô, trả lời dứt khoát vào bản chất kỹ thuật, và luôn đưa ra số liệu từ các bảng trong báo cáo Chương 6, 7, 8 làm bằng chứng. Chúc em có một buổi bảo vệ đồ án tốt nghiệp xuất sắc và đạt điểm tối đa!"*

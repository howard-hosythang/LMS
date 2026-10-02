# Kịch bản thuyết trình và Demo đồ án LMS tích hợp AI

> **Quy chuẩn thời gian:** **Tổng cộng < 15 phút**
> - **Phần 1: Thuyết trình Slide (Slide 1 – 17, 19):** **Đúng 8 phút** (480 giây, nhịp nói dứt khoát ~130 từ/phút).
> - **Phần 2: Live Demo hệ thống (Slide 18):** **Đúng 7 phút** (thao tác trực tiếp trên domain thực tế `https://library74.uk`).
> - **Phần 3: Q&A Phản biện Hội đồng:** 10 – 15 phút tiếp theo.

---

## BẢNG PHÂN BỔ THỜI GIAN CHI TIẾT (8 PHÚT SLIDE + 7 PHÚT DEMO)

| Nội dung | Slide / Thao tác | Thời lượng | Tích lũy | Trọng tâm cần thể hiện |
|---|:---:|:---:|:---:|---|
| **Mở đầu & Bối cảnh** | Slide 1 – 5 | 2.0 phút | 02:00 | Giới thiệu, 4 điểm nghẽn, khảo sát Koha/OPAC, giải pháp 3 trụ cột, lợi ích |
| **So sánh Kiến trúc & Công nghệ** | Slide 6 – 10 | 2.5 phút | 04:30 | **Trọng tâm 1:** Modular Monolith, React+TS, Spring Boot `@Transactional`, FastAPI+Celery, PostgreSQL+`pgvector` |
| **Luồng AI & Nghiệp vụ** | Slide 11 – 12 | 1.0 phút | 05:30 | 3 module AI (ETL/Search/Recom) và luồng mượn-trả-phạt PayOS |
| **Kiểm thử, Benchmark & Vận hành** | Slide 13 – 17 | 2.0 phút | 07:30 | **Trọng tâm 2:** 6 tầng kiểm thử, AI benchmark (MRR 1.0, p95 540ms), Caddy Docker, giới hạn, kết luận |
| **Chuyển tiếp sang Live Demo** | Slide 18 | 0.5 phút | 08:00 | Mở trình duyệt, chuyển giao diện sang domain `library74.uk` |
| **LIVE DEMO THỰC CHIẾN** | **Demo 5 kịch bản** | **7.0 phút** | **15:00** | **Trọng tâm 3:** Semantic search, đặt trước, duyệt quầy, PayOS QR, AI ETL PDF, Admin policy |
| **Lời cảm ơn & Bắt đầu Q&A** | Slide 19 | Chuyển tiếp | — | Cảm ơn Thầy Cô, sẵn sàng trả lời phản biện |

---

# PHẦN 1: KỊCH BẢN THUYẾT TRÌNH 19 SLIDE (ĐÚNG 8 PHÚT)

---

### Slide 1. Tên đề tài
**Tiêu đề:** ĐỀ TÀI: XÂY DỰNG HỆ THỐNG QUẢN LÝ THƯ VIỆN TRỰC TUYẾN TÍCH HỢP AI HỖ TRỢ TÌM KIẾM VÀ GỢI Ý SÁCH  
**Nội dung trên slide:** Mã số HK253-DATN-076; SV: Võ Quang Thắng (2213214); GVHD: TS. Trương Tuấn Anh, CN. Dương Huỳnh Anh Đức; GVPB: ThS. Trần Thị Quế Nguyệt; ĐH Bách Khoa ĐHQG-HCM.  
**Thời lượng:** 20 giây | **Tích lũy:** 00:20  

> **Lời dẫn:**  
> Kính chào quý Thầy Cô trong Hội đồng. Em là Võ Quang Thắng, MSSV 2213214. Hôm nay em xin báo cáo đồ án tốt nghiệp: "Xây dựng hệ thống quản lý thư viện trực tuyến tích hợp AI hỗ trợ tìm kiếm và gợi ý sách", do TS. Trương Tuấn Anh và thầy Dương Huỳnh Anh Đức hướng dẫn; cô phản biện là ThS. Trần Thị Quế Nguyệt. Đề tài tập trung hoàn thiện một sản phẩm end-to-end, số hóa nghiệp vụ thư viện và dùng AI ở những nơi thật sự tạo giá trị. Hiện hệ thống đang vận hành thực tế tại domain `library74.uk`.

---

### Slide 2. Đặt vấn đề & Bối cảnh
**Tiêu đề:** ĐẶT VẤN ĐỀ & BỐI CẢNH  
**Nội dung trên slide:** Bạn đọc khó tìm tài liệu nếu không nhớ đúng từ khóa; Tài liệu PDF chưa được khai thác ngữ nghĩa; Dữ liệu phân tán khó thống kê; Thủ thư mất nhiều thời gian nhập liệu, mượn trả và đối soát phí.  
**Thời lượng:** 25 giây | **Tích lũy:** 00:45  

> **Lời dẫn:**  
> Khảo sát thực tế cho thấy thư viện truyền thống gặp 4 điểm nghẽn: bạn đọc khó tìm tài liệu nếu không nhớ đúng từ khóa; nội dung sâu trong file PDF chưa được bóc tách phục vụ tìm kiếm ngữ nghĩa; thủ thư mất nhiều thời gian nhập liệu và đối soát mượn trả thủ công; còn nhà trường thiếu dữ liệu lưu thông tập trung để ra quyết định đầu tư học liệu.

---

### Slide 3. Một số công trình liên quan
**Tiêu đề:** MỘT SỐ CÔNG TRÌNH LIÊN QUAN  
**Nội dung trên slide:** Koha (mã nguồn mở, giao diện cũ, khó tích hợp AI); OPAC-HCMUT-VNU (ổn định nhưng tìm từ khóa chuỗi tĩnh, chưa gợi ý theo hành vi); Aleph (chi phí rất cao, đóng kín, không phù hợp quy mô vừa và nhỏ).  
**Thời lượng:** 25 giây | **Tích lũy:** 01:10  

> **Lời dẫn:**  
> Em đã khảo sát 3 hệ thống tiêu biểu: Koha và Aleph rất mạnh về biên mục truyền thống nhưng kiến trúc cũ hoặc chi phí quá lớn, khó tích hợp deep learning; OPAC trường ta vận hành rất ổn định nhưng vẫn tra cứu từ khóa tĩnh và chưa gợi ý theo hành vi. Đồ án chọn hướng xây dựng nền tảng mới, làm chủ mã nguồn nghiệp vụ và gắn AI như một dịch vụ vệ tinh mở rộng.

---

### Slide 4. Giải pháp đề xuất
**Tiêu đề:** GIẢI PHÁP ĐỀ XUẤT  
**Nội dung trên slide:** Nền tảng Web nhiều vai trò (Khách, Bạn đọc, Thủ thư, Admin); Tích hợp AI như dịch vụ vệ tinh (Semantic search, Recommender, PDF ETL, Metadata); Triển khai Production tại `library74.uk`.  
**Thời lượng:** 25 giây | **Tích lũy:** 01:35  

> **Lời dẫn:**  
> Đề tài đề xuất giải pháp dựa trên 3 trụ cột: Thứ nhất, nền tảng web đa vai trò cho bạn đọc, thủ thư và admin. Thứ hai, phân hệ AI vệ tinh đảm nhận semantic search, gợi ý sách và bóc tách PDF tự động. Thứ ba, sản phẩm được kiểm chứng thực tế, hiện đã đóng gói và chạy production tại domain `library74.uk`.

---

### Slide 5. Lợi ích thực tế của hệ thống
**Tiêu đề:** LỢI ÍCH THỰC TẾ CỦA HỆ THỐNG  
**Nội dung trên slide:** Bạn đọc: Tìm sách nhanh, tự theo dõi mượn/trả/phí, wishlist; Thủ thư: Giảm nhập liệu qua ISBN autofill, PDF AI; Quản trị viên: Quản lý người dùng, chính sách, audit logs; Nhà trường: Thống kê tập trung.  
**Thời lượng:** 25 giây | **Tích lũy:** 02:00  

> **Lời dẫn:**  
> Hệ thống mang lại giá trị cho 4 nhóm: bạn đọc chủ động tìm sách theo ý niệm, đặt trước và thanh toán phạt online; thủ thư giảm 70% thao tác lặp nhờ autofill ISBN và AI xử lý PDF; quản trị viên kiểm soát phân quyền và chính sách mượn trả; còn nhà trường có báo cáo thống kê tập trung để định hướng bổ sung tài liệu.

---

### Slide 6. So sánh kiến trúc và lý do chọn
**Tiêu đề:** SO SÁNH KIẾN TRÚC VÀ LÝ DO CHỌN  
**Nội dung trên slide:** Bảng so sánh: Monolith (dễ rối khi nghiệp vụ lớn, khó tách AI) vs Microservices (phức tạp vận hành, distributed transaction, quá nặng) vs Modular Monolith + AI vệ tinh (phù hợp nhất, dễ test, dễ triển khai).  
**Thời lượng:** 35 giây | **Tích lũy:** 02:35  

> **Lời dẫn:**  
> Về kiến trúc, em không chọn Monolith vì khó bảo trì khi nghiệp vụ lớn và khó tách AI Python; cũng không chọn Microservices toàn phần vì làm phức tạp giao dịch phân tán và vận hành. Em chọn **Modular Monolith kết hợp dịch vụ AI vệ tinh**: Backend Spring Boot giữ tính giao dịch ACID cho các nghiệp vụ mượn, trả và tiền phạt; còn AI Service tách riêng để tận dụng hệ sinh thái Python và xử lý tính toán học máy độc lập.

---

### Slide 7. Frontend: So sánh công nghệ và quyết định chọn
**Tiêu đề:** FRONTEND: SO SÁNH CÔNG NGHỆ VÀ QUYẾT ĐỊNH CHỌN  
**Nội dung trên slide:** Bảng so sánh: React + TypeScript (linh hoạt, hệ sinh thái phong phú, TS kiểm soát kiểu) vs Vue (chưa tạo khác biệt lớn) vs Angular (nặng quy ước ban đầu). Kết luận: Chọn React + TypeScript.  
**Thời lượng:** 25 giây | **Tích lũy:** 03:00  

> **Lời dẫn:**  
> Ở tầng Frontend, Angular quá nặng quy ước cho nhóm nhỏ; Vue dễ tiếp cận nhưng hệ sinh thái thư viện ngoài chưa phong phú bằng. Em chọn **React kết hợp TypeScript** vì component và custom hook rất linh hoạt cho các luồng phân vai trò, đồng thời TypeScript giúp kiểm soát chặt chẽ kiểu dữ liệu từ API Backend, triệt tiêu lỗi runtime giao diện.

---

### Slide 8. Backend: So sánh công nghệ và quyết định chọn
**Tiêu đề:** BACKEND: SO SÁNH CÔNG NGHỆ VÀ QUYẾT ĐỊNH CHỌN  
**Nội dung trên slide:** Bảng so sánh: Spring Boot (`@Transactional` quản lý ranh giới giao dịch, Spring Security mạnh, module hóa) vs NestJS (tự tích hợp transaction giữa nhiều thư viện) vs Django (gò bó theo mô hình app).  
**Thời lượng:** 35 giây | **Tích lũy:** 03:35  

> **Lời dẫn:**  
> Với Backend, yếu tố sống còn là **quản lý giao dịch**. Nghiệp vụ thư viện có chuỗi thao tác liên hoàn: trả sách, đổi trạng thái bản sao, gán đặt trước và tạo phí phạt bắt buộc phải all-or-nothing. NestJS hay Django đòi hỏi tự tích hợp thêm nhiều thư viện để xử lý giao dịch sâu. Em chọn **Spring Boot 3** vì annotation `@Transactional` và Spring Security quản lý ranh giới giao dịch và bảo mật tập trung vững chắc nhất.

---

### Slide 9. AI Service: Tách riêng để xử lý workload AI
**Tiêu đề:** AI SERVICE: TÁCH RIÊNG ĐỂ XỬ LÝ WORKLOAD AI  
**Nội dung trên slide:** Bảng so sánh: Nhúng trong BE (tranh chấp CPU) vs FastAPI đồng bộ (PDF dễ timeout) vs FastAPI + RabbitMQ/Celery (tách API và worker, PDF chạy nền, retry tự động).  
**Thời lượng:** 30 giây | **Tích lũy:** 04:05  

> **Lời dẫn:**  
> Phân hệ AI có hai loại tải đối lập: semantic search cần phản hồi tức thì dưới 1 giây, còn bóc tách PDF và embedding lại tốn CPU kéo dài vài chục giây đến vài phút. Nếu để chung hoặc xử lý đồng bộ sẽ gây nghẽn web. Em chọn **FastAPI kết hợp RabbitMQ và Celery Worker**: FastAPI xử lý truy vấn tìm kiếm đồng bộ, còn Celery nhận job từ RabbitMQ bóc tách PDF ngầm dưới nền, sau đó gọi webhook callback về Backend.

---

### Slide 10. Database: PostgreSQL + pgvector
**Tiêu đề:** DATABASE: PostgreSQL + pgvector  
**Nội dung trên slide:** Bảng so sánh: MySQL + Vector DB riêng (nguy cơ dual-write, lệch dữ liệu) vs MongoDB (không tối ưu giao dịch quan hệ) vs PostgreSQL + hệ extension (`pgvector`, `pg_trgm`, `unaccent`, `JSONB`).  
**Thời lượng:** 35 giây | **Tích lũy:** 04:40  

> **Lời dẫn:**  
> Ở tầng CSDL, dùng MySQL cùng Vector DB riêng sẽ đối mặt bài toán dual-write và rủi ro lệch dữ liệu. Em chọn **PostgreSQL với extension `pgvector`**. Ưu thế vượt trội là hỗ trợ **Hybrid Query**: vừa tính khoảng cách vector cosine bằng chỉ mục HNSW, vừa JOIN trực tiếp với bảng ấn phẩm và kiểm tra trạng thái bản sao còn khả dụng trong duy nhất một câu lệnh SQL, đảm bảo toàn vẹn dữ liệu tuyệt đối.

---

### Slide 11. Luồng xử lý AI: 03 Module chính
**Tiêu đề:** LUỒNG XỬ LÝ AI: 03 MODULE CHÍNH  
**Nội dung trên slide:** Module 1: Xử lý PDF (PyMuPDF/OCR $\rightarrow$ Chunking $\rightarrow$ Vietnamese Bi-Encoder embedding $\rightarrow$ LLM Guard với Gemini $\rightarrow$ pgvector $\rightarrow$ Callback); Module 2: Semantic search (HNSW Cosine); Module 3: Hybrid Recommendation (Cold-start $\rightarrow$ Content-based + ALS).  
**Thời lượng:** 35 giây | **Tích lũy:** 05:15  

> **Lời dẫn:**  
> Phân hệ AI gồm 3 module chính:  
> 1. **Xử lý PDF:** Celery trích xuất text qua PyMuPDF kèm OCR fallback, chia chunk có overlap, sinh vector bằng mô hình `vietnamese-bi-encoder` và dùng LLM Guard bọc quanh Gemini để trích xuất JSON metadata chống ảo giác, sau đó lưu vào pgvector.  
> 2. **Semantic Search:** Truy vấn được encode thành vector bằng Bi-Encoder và tìm kiếm cosine HNSW trong PostgreSQL, kết hợp bộ lọc quyền riêng tư.  
> 3. **Gợi ý sách:** Thiết kế hybrid; người dùng mới fallback sang sách mượn nhiều nhất; khi có tương tác sẽ kết hợp vector nội dung và thuật toán phân rã ma trận ALS.

---

### Slide 12. Luồng nghiệp vụ tiêu biểu
**Tiêu đề:** LUỒNG NGHIỆP VỤ TIÊU BIỂU (MƯỢN - ĐẶT TRƯỚC - TRẢ SÁCH)  
**Nội dung trên slide:** Sơ đồ 3 cột: Bạn đọc xem bản sao & gửi yêu cầu $\rightarrow$ Backend kiểm tra policy & thủ thư duyệt barcode $\rightarrow$ Trả sách tính quá hạn/hư hỏng, thanh toán PayOS QR động qua webhook HMAC.  
**Thời lượng:** 30 giây | **Tích lũy:** 05:45  

> **Lời dẫn:**  
> Slide 12 thể hiện luồng nghiệp vụ mượn - đặt trước - trả sách:  
> Bạn đọc tra cứu trạng thái từng bản sao cụ thể; nếu hết sách có thể bấm đặt trước để xếp hàng. Backend kiểm tra điều kiện mượn tự động; thủ thư quét barcode để bàn giao sách. Khi trả sách quá hạn, hệ thống tự tính phí phạt. Bạn đọc có thể thanh toán online qua mã QR PayOS, Backend xác thực chữ ký HMAC từ webhook để tự động gạch nợ minh bạch.

---

### Slide 13. Kiểm thử hệ thống
**Tiêu đề:** KIỂM THỬ HỆ THỐNG  
**Nội dung trên slide:** Bảng 6 tầng kiểm thử: Frontend Jest (62/62 pass); Backend JUnit Testcontainers PostgreSQL thật (79/79 pass); AI pytest (72 pass); Production smoke library74.uk (8/8 pass); Security headers pass; Load test 200 VUs lỗi 0.00%.  
**Thời lượng:** 35 giây | **Tích lũy:** 06:20  

> **Lời dẫn:**  
> Hệ thống được kiểm thử 6 tầng độc lập: Frontend đạt 62/62 test pass; Backend đạt 79/79 test pass, sử dụng **Testcontainers** dựng PostgreSQL Docker thật để kiểm tra chính xác các ràng buộc khóa ngoại và SQL; AI Service đạt 72 test pass kiểm chứng toàn bộ pipeline. Trên production, smoke test đạt 8/8 pass trên domain thật và kiểm thử tải với 200 người dùng ảo đồng thời duy trì tỷ lệ lỗi 0.00%.

---

### Slide 14. Kiểm thử AI bằng số liệu - Benchmark
**Tiêu đề:** KIỂM THỬ AI BẰNG SỐ LIỆU - BENCHMARK  
**Nội dung trên slide:** Đánh giá trên 6 chuyên ngành thực tế: Điểm tin cậy 95.46/100; Semantic Search MRR = 1.000, Recall@5 = 87.5%, nDCG@5 = 0.907; Tóm tắt phủ từ khóa 90.0%, 100% vượt rào chống ảo giác; Độ trễ p95 = 540.90ms (< SLA 3000ms).  
**Thời lượng:** 35 giây | **Tích lũy:** 06:55  

> **Lời dẫn:**  
> Hiệu quả AI được đo lường định lượng trên tập benchmark 6 chuyên ngành: Semantic search đạt **MRR tuyệt đối 1.000**, nghĩa là tài liệu đúng luôn ở vị trí đầu tiên; **Recall@5 đạt 87.5%** và **nDCG@5 đạt 0.907**. Về tóm tắt, **100%** bản tóm tắt vượt rào chống ảo giác, F1-Score gán nhãn đạt 100%. Độ trễ p95 chỉ đạt **540ms**, nhanh hơn nhiều ngưỡng SLA 3 giây. Điểm tin cậy tổng thể đạt **95.46/100**.

---

### Slide 15. Triển khai Production và Bảo mật
**Tiêu đề:** TRIỂN KHAI PRODUCTION VÀ BẢO MẬT  
**Nội dung trên slide:** Caddy reverse proxy HTTPS tự động 1 domain duy nhất; AI xử lý nền qua RabbitMQ/Celery callback; Bảo mật: Docker network cô lập CSDL/Queue, JWT/RBAC, HMAC callback; Pass 8/8 smoke test thật.  
**Thời lượng:** 25 giây | **Tích lũy:** 07:20  

> **Lời dẫn:**  
> Về hạ tầng production, hệ thống đóng gói Docker triển khai trên VPS: Caddy làm reverse proxy tiếp nhận HTTPS và điều hướng request cho cả FE và BE trên một domain `library74.uk`. Toàn bộ CSDL, Queue và Backend đều nằm trong mạng nội bộ kín Docker. Xác thực người dùng bằng JWT/RBAC, và bảo vệ webhook callback bằng chữ ký HMAC SHA256.

---

### Slide 16. Kết quả - Giới hạn - Hướng phát triển
**Tiêu đề:** KẾT QUẢ - GIỚI HẠN - HƯỚNG PHÁT TRIỂN  
**Nội dung trên slide:** Kết quả: Hoàn thành hệ thống, AI benchmark, deploy thật; Giới hạn: Tải mới test 200 VUs, Cold-start recommendation, OCR cơ bản với bản scan mờ; Hướng phát triển: Stress test điểm gãy, implicit feedback cho ALS, nâng cấp OCR layout analysis.  
**Thời lượng:** 25 giây | **Tích lũy:** 07:45  

> **Lời dẫn:**  
> Em nhìn nhận rõ các giới hạn thực tế: dữ liệu người dùng mới nên hệ thống gợi ý chủ yếu chạy fallback trending; test tải mới dừng ở 200 người dùng ảo; và OCR cần nâng cấp để xử lý tốt PDF scan 2 cột. Hướng phát triển tiếp theo là stress test dài hạn, thu thập thêm dữ liệu tương tác để huấn luyện mô hình ALS và tích hợp công cụ OCR chuyên sâu.

---

### Slide 17. Kết luận
**Tiêu đề:** KẾT LUẬN  
**Nội dung trên slide:** 7 luận điểm: Sản phẩm End-to-End; Bao phủ nghiệp vụ; Trải nghiệm Bạn đọc; Tối ưu Thủ thư; Năng lực Quản trị; AI đúng vai trò trợ lý; Kỹ thuật nghiêm túc.  
**Thời lượng:** 15 giây | **Tích lũy:** 08:00  

> **Lời dẫn:**  
> Tóm lại, đồ án đã hoàn thành một sản phẩm end-to-end có thể vận hành thật, bao phủ đầy đủ nghiệp vụ lưu thông và đặt AI vào đúng vai trò trợ lý: hỗ trợ đọc hiểu tài liệu và tìm kiếm ngữ nghĩa, trong khi Backend giữ vững quyền kiểm soát nghiệp vụ và tính toàn vẹn dữ liệu.

---

# PHẦN 2: KỊCH BẢN LIVE DEMO THỰC CHIẾN (ĐÚNG 7 PHÚT)
*(Trình chiếu trực tiếp tại Slide 18 – Domain: `https://library74.uk`)*

### Chuẩn bị trước khi demo:
- **Cửa sổ 1 (Sinh viên):** Đã đăng nhập `user1@hcmut.edu.vn` (Pass: `123456`).
- **Cửa sổ 2 (Thủ thư):** Đã đăng nhập `librarian1@hcmut.edu.vn` (Pass: `123456`).
- **Cửa sổ 3 (Quản trị viên):** Mở sẵn trang đăng nhập Admin `admin@hcmut.edu.vn`.

---

### Phút 1 (0:00 – 01:30): Demo AI Semantic Search & Khám phá tri thức
1. Tại Cửa sổ 1 (Sinh viên), chọn tab **"Tìm kiếm ngữ nghĩa (AI)"**.
2. Gõ câu truy vấn tự nhiên: *"tài liệu học máy và đại số tuyến tính cho sinh viên máy tính"*. Bấm Enter.
3. **Thuyết minh:** *"Chỉ sau khoảng 500ms, hệ thống trả về chính xác giáo trình Đại số tuyến tính và Machine Learning nhờ tính toán khoảng cách cosine trên pgvector. Kết quả có highlight đoạn trích liên quan và điểm tương đồng."*
4. Click mở chi tiết 1 cuốn sách:
   - Chỉ vào bản tóm tắt **AI Summary** và **Auto Tags** được sinh tự động.
   - Kéo xuống bảng **Bản sao vật lý (Item Copies)**: Xem barcode `BK-xxx` và trạng thái `AVAILABLE`.
   - Chọn một cuốn sách đang hết bản sao $\rightarrow$ Bấm nút **"Đặt trước" (Reservation)** để xếp hàng chờ.

---

### Phút 2 – 3 (01:30 – 03:00): Demo Nghiệp vụ Thủ thư tại quầy (Circulation)
1. Chuyển sang Cửa sổ 2 (Thủ thư), vào mục **"Quản lý lưu thông / Mượn trả"**.
2. Màn hình ngay lập tức hiển thị yêu cầu đặt trước vừa được tạo từ tài khoản sinh viên ở Phút 1.
3. Nhập/chọn mã Barcode bản sao $\rightarrow$ Bấm **"Xác nhận giao sách"**.
4. **Thuyết minh:** *"Backend Spring Boot thực hiện trong một `@Transactional` duy nhất: kiểm tra điều kiện mượn, cập nhật item sang `BORROWED`, tạo bản ghi mượn sách và bắn thông báo thời gian thực về tài khoản độc giả."*
5. Quay lại Cửa sổ 1 (Sinh viên) $\rightarrow$ Xem chuông thông báo nhảy số `+1` và mục "Sách đang mượn" đã cập nhật.

---

### Phút 4 (03:00 – 04:15): Demo Trả sách quá hạn & Thanh toán PayOS realtime
1. Tại Cửa sổ 2 (Thủ thư), chọn chức năng **"Trả sách"** cho một giao dịch mô phỏng quá hạn 3 ngày.
2. Hệ thống tự động tính phí phạt: hiển thị popup phạt `10,000 VNĐ`.
3. Chọn hình thức: **"Thanh toán trực tuyến PayOS"**.
4. Màn hình lập tức hiển thị **mã QR PayOS động** với số tiền và nội dung chuyển khoản mã hóa.
5. **Thuyết minh:** *"Khi sinh viên quét mã chuyển khoản qua app ngân hàng, PayOS gửi Webhook có ký chữ ký bảo mật HMAC SHA256 về Backend để tự động xác nhận gạch nợ tức thì mà thủ thư không phải đối soát thủ công."*

---

### Phút 5 (04:15 – 05:30): Demo AI Automation Pipeline (ETL bóc tách PDF)
1. Tại giao diện Thủ thư, vào mục **"Thêm mới ấn phẩm / Upload tài liệu"**.
2. Nhập một mã ISBN mẫu (ví dụ: `9780134685991`) $\rightarrow$ Bấm **"Tự động điền" (Autofill)**: Tên sách, tác giả, nhà xuất bản tự động nhảy vào các ô.
3. Kéo thả một file PDF giáo trình vào khu vực upload $\rightarrow$ Bấm **"Lưu và Xử lý AI"**.
4. **Thuyết minh:** *"Hệ thống phản hồi lưu thành công ngay lập tức; tác vụ bóc tách PDF được Spring Boot đẩy vào RabbitMQ để Celery Worker chạy ngầm dưới nền: đọc text qua PyMuPDF, chia chunk, gọi Gemini sinh vector và nạp vào pgvector. Web không hề bị đơ (freeze). Khi xử lý xong, worker callback báo Backend cập nhật trạng thái."*

---

### Phút 6 – 7 (05:30 – 07:00): Demo Quản trị, Chính sách & Giám sát Production
1. Chuyển sang Cửa sổ 3, đăng nhập tài khoản **Admin**.
2. Vào mục **"Cấu hình chính sách (Policy)"**:
   - Chỉ vào các tham số động: Số ngày mượn tối đa, số sách tối đa, mức phạt theo ngày (`5,000 VNĐ/ngày`).
   - Thao tác sửa nhanh 1 tham số $\rightarrow$ Bấm Lưu $\rightarrow$ Hệ thống áp dụng ngay lập tức cho toàn bộ các giao dịch mượn mới mà không cần restart server.
3. Vào mục **"Nhật ký kiểm toán (Audit Logs)"**: Xem danh sách ghi vết đầy đủ: ai đã mượn sách nào, ai duyệt, IP và thời gian cụ thể.
4. Mở tab phụ chỉ vào **Uptime Kuma / Telegram Bot**:
   - **Thuyết minh:** *"Hệ thống có bot giám sát tự động 24/7 trên Telegram, liên tục kiểm tra healthcheck của Caddy, Backend và AI Service; nếu có sự cố sẽ bắn cảnh báo tức thời."*

---

# PHẦN 3: KẾT THÚC & CHUYỂN SANG PHẢN BIỆN (SLIDE 19)

### Slide 19. Lời cảm ơn (Thank you for listening)
**Tiêu đề:** THANK YOU FOR YOUR LISTENING  
**Thời lượng:** 15 giây | **Tích lũy:** 15:15  

> **Lời dẫn:**  
> Phần trình bày báo cáo và demo của em đến đây là kết thúc. Em xin chân thành cảm ơn thầy hướng dẫn TS. Trương Tuấn Anh, thầy Dương Huỳnh Anh Đức, cô phản biện ThS. Trần Thị Quế Nguyệt và quý Thầy Cô trong Hội đồng đã dành thời gian theo dõi. Em xin sẵn sàng lắng nghe các ý kiến nhận xét và giải đáp các câu hỏi phản biện từ quý Thầy Cô!

---

# GỢI Ý PHẢN XẠ NHANH CÂU HỎI PHẢN BIỆN TRỌNG TÂM CỦA HỘI ĐỒNG

| Câu hỏi của Hội đồng | Câu trả lời dứt khoát trong 30 giây |
|---|---|
| **1. Tại sao không làm Microservices?** | Microservices làm phức tạp distributed transaction (Saga) trong khi nghiệp vụ mượn/trả/phạt cần giao dịch ACID quan hệ chặt chẽ. Modular Monolith giữ ranh giới module rõ, bảo toàn ACID, dễ test và tối ưu chi phí vận hành cho quy mô đồ án. |
| **2. Tại sao dùng PostgreSQL + `pgvector` thay vì Pinecone/Milvus?** | Tránh hoàn toàn bài toán Dual-write và nguy cơ lệch dữ liệu giữa SQL và Vector DB. `pgvector` cho phép truy vấn lai trong 1 câu SQL: vừa tính khoảng cách vector cosine HNSW vừa join trực tiếp với bảng sách và kiểm tra trạng thái bản sao còn khả dụng. |
| **3. Làm sao đảm bảo AI không bị ảo giác (hallucination)?** | Em áp dụng Pydantic Schema Validation, ràng buộc JSON mode và chỉ trích xuất từ các chunk văn bản thực của cuốn sách. Kết quả kiểm thử benchmark trên 6 chuyên ngành đạt 100% guard pass. |
| **4. Hệ thống giải quyết bài toán Cold-start của Gợi ý thế nào?** | Phân tầng Fallback: người dùng mới chưa có tương tác sẽ được gợi ý theo Trending/Popularity dựa trên sách được mượn nhiều nhất; khi có hành vi xem/mượn sẽ kết hợp vector nội dung và mô hình ALS. |
| **5. Tác vụ PDF nặng có làm nghẽn Backend không?** | Không. Tác vụ PDF được Spring Boot đẩy vào RabbitMQ để Celery Worker xử lý nền độc lập; khi hoàn tất worker mới gọi webhook callback về Backend nên giao diện người dùng hoàn toàn không bị ảnh hưởng. |

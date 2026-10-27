# Ngữ cảnh thảo luận nâng cấp chatbot Library74 sang RAG

Ngày cập nhật: **27/10/2026** (Asia/Bangkok).

## 1. Mục đích và trạng thái

Tài liệu lưu lại cuộc thảo luận để tiếp tục trong phiên làm việc sau. **Các phương án RAG và crawl website dưới đây chưa được hiện thực.** Sau khi lưu ngữ cảnh, người dùng đã yêu cầu chuyển BrowserRouter; phần này đã được hiện thực trong mã nguồn ngày 27/10/2026, chưa tự deploy production. Xem mục 9. Không tự tiếp tục RAG hoặc triển khai production chỉ từ tài liệu này.

Người dùng đánh giá tích cực phương án RAG và muốn thảo luận thêm để hoàn thiện trước khi thực hiện. Chưa chốt nguồn lấy nội dung, lịch đồng bộ hoặc cấu trúc bảng cuối cùng. Việc chuyển router đã được yêu cầu riêng sau cuộc thảo luận.

Tài liệu mô tả chatbot đang hoạt động: [FAQ_CHATBOT.md](FAQ_CHATBOT.md).

## 2. Mục tiêu và giới hạn người dùng mong muốn

- Chatbot trả lời câu hỏi và hướng dẫn sử dụng Library74, ví dụ người tạo website hoặc cách mượn sách.
- Câu trả lời tự nhiên, ngắn gọn, dễ đọc; có tóm tắt, các bước, gạch đầu dòng và lưu ý khi phù hợp.
- Nội dung phải dựa trên tài liệu hướng dẫn của hệ thống, không tự bổ sung thông tin từ Internet hoặc kiến thức ngoài nguồn.
- Chưa có yêu cầu truy vấn hồ sơ, nợ phạt, tồn kho trực tiếp hoặc thực hiện mượn/gia hạn/thanh toán thay người dùng.
- Trước đây người dùng không muốn chatbot truy cập database/source code. Trong thảo luận mới, người dùng đề xuất dùng PostgreSQL/pgvector lưu kho nội dung hướng dẫn. Cần phân biệt **đọc kho tri thức riêng** với **truy vấn dữ liệu nghiệp vụ**; chưa có quyền mở rộng sang dữ liệu cá nhân/nghiệp vụ.
- Không crawl source code, tài liệu bảo vệ, secret hoặc nội dung nội bộ làm nguồn trả lời cho bạn đọc.

## 3. Hiện trạng đã triển khai trước cuộc thảo luận RAG

- Widget React hỗ trợ Việt/Anh, light/dark, Enter gửi, Shift+Enter xuống dòng, gợi ý câu hỏi, nguồn hướng dẫn, xóa hội thoại và Escape đóng.
- Nguồn hiện tại là 20 FAQ song ngữ trong resource JSON đóng gói của backend.
- Khớp chính xác câu hỏi/alias: trả nguồn có cấu trúc ngay, không gọi LLM.
- Câu hỏi khác: một lần gọi Gemini vừa chọn FAQ vừa viết lại câu trả lời dựa trên nội dung FAQ theo ngôn ngữ được chọn.
- Backend kiểm tra JSON, ID nguồn, cấu trúc/độ dài, trích dẫn nguồn, số liệu và URL/HTML. Nếu chọn được nguồn nhưng phần soạn lại không hợp lệ, dùng nội dung nguồn; nếu không xác định được nguồn, trả thông báo phù hợp và hướng về gợi ý.
- Liên kết nguồn do backend lấy từ allowlist, không dùng URL do LLM tạo. FE render text và danh sách, không render HTML/Markdown tùy ý.
- Model mặc định theo cấu hình hiện có: `gemini-3.5-flash-lite`; dự phòng `gemini-3.1-flash-lite`. Đây là tên đang cấu hình, không phải xác nhận quyền truy cập hoặc quota thực tế của project.
- Có fallback/cooldown theo lỗi provider, tối đa hai lần gọi HTTP cho chuỗi model và bốn lượt xử lý AI đồng thời. Không áp các trần request/phút/ngày tự đặt đã bị người dùng yêu cầu bỏ.
- Không gửi lịch sử hội thoại, danh tính hoặc token tài khoản sang AI. Hội thoại chỉ giữ trong state FE, không lưu database.
- Đã bỏ hai dòng thông báo UI theo yêu cầu: đoạn bắt đầu “Chỉ hướng dẫn sử dụng, không tra cứu tài khoản...” và “Chỉ dùng câu trả lời đã duyệt”. Không tự thêm lại chúng khi làm RAG.
- Đã push: `66edb44` — nâng cấp chatbot có cấu trúc và fallback; `384f816` — cập nhật liên kết Facebook.
- Lần kiểm tra trước: 116 test BE ở recommendation/auth và module phụ thuộc; 191 test FE/31 suites; TypeScript và build pass. Build có cảnh báo chunk lớn. Chưa gọi Gemini thật hoặc kiểm tra giao diện bằng trình duyệt thật trong lượt đó. Đây là kết quả lịch sử, không thay cho việc chạy lại sau thay đổi mới.

Các vị trí chính:

| Thành phần | Đường dẫn từ thư mục gốc |
|---|---|
| Catalog nguồn | `LMS_BE/library-recommendation-module/src/main/resources/chatbot/faq.json` |
| Điều phối chatbot | `LMS_BE/library-recommendation-module/src/main/java/com/library/recommendation/application/chatbot/FaqChatbotService.java` |
| DTO nội dung | `LMS_BE/library-recommendation-module/src/main/java/com/library/recommendation/application/chatbot/FaqContent.java` |
| Gọi Gemini | `LMS_BE/library-recommendation-module/src/main/java/com/library/recommendation/infrastructure/ai/FaqIntentSelector.java` |
| Cooldown | `LMS_BE/library-recommendation-module/src/main/java/com/library/recommendation/infrastructure/ai/FaqModelCooldown.java` |
| Giao diện/API FE | `LMS_FE/components/FaqChatbot.tsx`, `LMS_FE/api/chatbotService.ts` |

## 4. Phương án RAG người dùng đề xuất và hướng đã trao đổi

Người dùng đề xuất thêm bảng, crawl website, chia chunk, embedding bằng model hiện có; khi có câu hỏi thì embedding câu hỏi, tìm chunk gần nhất bằng cosine và đưa cho LLM viết câu trả lời.

Đây là luồng RAG hợp lý. Đề xuất tách thành hai quá trình:

```text
Nạp/cập nhật tri thức — chạy khi tài liệu thay đổi:
Nguồn công khai được phép → lấy nội dung → làm sạch → chia chunk
                          → embedding → lưu kho tri thức pgvector

Trả lời — chạy theo từng câu hỏi:
FAQ/alias khớp chính xác → trả ngay, không cần LLM
Câu hỏi khác → embedding → truy xuất các chunk liên quan
            → kiểm tra đủ thông tin → LLM diễn đạt → câu trả lời kèm nguồn
Không đủ thông tin → hỏi lại hoặc thông báo chưa tìm thấy
```

Không crawl hoặc embedding lại toàn bộ website cho mỗi câu hỏi. RAG thay bước gửi toàn bộ catalog bằng truy xuất nội dung phù hợp; có thể giữ widget, cấu trúc phản hồi, liên kết nguồn và fallback hiện tại.

## 5. Hạ tầng có thể tái sử dụng — đã kiểm tra source

- `LMS_AI/ai_etl/config.py`: model embedding mặc định là `bkai-foundation-models/vietnamese-bi-encoder`, có thể bị cấu hình môi trường ghi đè.
- `LMS_AI/ai_etl/embedding_client.py`: dùng `SentenceTransformer`, `encode(..., normalize_embeddings=True)`.
- `LMS_AI/init_schema.sql`: có bảng `ai_engine.publication_vectors`, cột `embedding vector(768)`, index HNSW `vector_cosine_ops`.
- `LMS_AI/api_service.py`: đã có truy xuất vector bằng toán tử `<=>`.
- Có thể tái sử dụng model/service embedding, không nhất thiết thêm vector database hoặc tải thêm một bản model riêng cho chatbot.
- Cần kiểm tra model và kích thước vector thực tế trước khi chốt migration; source mặc định không chứng minh cấu hình production hiện tại.
- Tài liệu và câu hỏi phải dùng cùng model/cấu hình embedding. Đổi model cần tạo lại embedding tài liệu, kể cả khi cùng số chiều.
- `<=>` là cosine distance: nhỏ hơn là gần hơn; cosine similarity tương ứng bằng `1 - distance`.

## 6. Nguồn nội dung và vấn đề crawl

### Phạm vi ban đầu được đề xuất

Chỉ nạp nội dung công khai đã kiểm soát: Giới thiệu, Hướng dẫn, FAQ, Liên hệ và quy định công khai. Không trộn với nội dung sách, đánh giá người dùng, trang tài khoản hoặc giao dịch. Không dùng bản crawl làm nguồn khẳng định số liệu đang thay đổi như nợ cá nhân hoặc tồn kho hiện tại.

### Hai cách lấy nội dung đã thảo luận

| Phương án | Ưu điểm | Đánh đổi |
|---|---|---|
| Trình duyệt tự động như Playwright, mở danh sách URL cho phép rồi lấy nội dung đã render | Lấy đúng nội dung website đang hiển thị, hỗ trợ React | Tốn tài nguyên và cần xử lý chờ render, ngôn ngữ, selector, nội dung lặp |
| JSON/Markdown hoặc endpoint nội dung hướng dẫn công khai | Dễ kiểm soát, cập nhật, kiểm thử; phù hợp vì sở hữu website | Cần tổ chức nguồn nội dung và bảo đảm đồng nhất với UI |

Đề xuất của trợ lý: ưu tiên nguồn nội dung có cấu trúc; có thể đưa chính FAQ hiện tại vào pgvector trước để kiểm tra truy xuất, rồi bổ sung crawl khi cần. Người dùng chưa chốt lựa chọn cuối cùng.

Nếu crawl: giới hạn domain/route được phép, chỉ lấy nội dung chính; loại menu, footer, nút và nội dung trùng. Nội dung crawl là dữ liệu tham khảo, không được ghi đè chỉ dẫn của chatbot. Chưa chọn kích thước chunk/overlap cuối cùng; nên giữ tiêu đề và điều kiện nghiệp vụ cùng nội dung liên quan.

## 7. Bảng tri thức đề xuất — chưa phải schema cuối cùng

Một bảng riêng có thể đủ cho bản đầu, ví dụ `ai_engine.website_knowledge_chunks`:

| Trường dự kiến | Ý nghĩa |
|---|---|
| `id` | Định danh chunk |
| `source_url`, `page_title` | Nguồn và tiêu đề để trả dẫn chứng |
| `section_title`, `chunk_index` | Ngữ cảnh và thứ tự trong trang |
| `content` | Văn bản nguồn |
| `embedding` | Vector đúng số chiều model thực tế |
| `language` | Lọc nguồn theo ngôn ngữ |
| `content_hash`, `indexed_at` | Phát hiện thay đổi và thời điểm lập chỉ mục |

Không dùng chung bảng vector sách. Khi nội dung đổi, thay các chunk cũ tương ứng, tránh để hướng dẫn cũ và mới cùng được truy xuất. Khi trang bị xóa, cần xử lý chunk không còn hợp lệ. Chưa chốt cơ chế version/publish, lịch chạy, endpoint quản trị hoặc index; không tự coi tên bảng/trường trên là migration được duyệt.

## 8. Điều kiện để truy xuất và trả lời đáng tin cậy

- Top-k gần nhất vẫn có thể không liên quan: câu hỏi về mượn laptop có thể lấy nhầm hướng dẫn mượn sách nếu kho không có laptop.
- Cần đánh giá độ liên quan và khả năng trả lời, không chỉ luôn lấy ba hoặc năm chunk rồi buộc LLM trả lời.
- Chưa chốt top-k hoặc ngưỡng cosine; phải hiệu chỉnh bằng câu hỏi thực tế, không chọn ngưỡng tùy tiện và coi đó là bảo đảm.
- Chỉ dùng nội dung truy xuất có nguồn hợp lệ; trả nguồn đi kèm câu trả lời, không cho LLM tự tạo URL.
- Thiếu bằng chứng thì hỏi lại hoặc từ chối phù hợp; không khẳng định “không có dịch vụ” chỉ vì không tìm thấy tài liệu.
- RAG, prompt, schema và trích dẫn giúp giảm rủi ro nhưng không chứng minh tuyệt đối mọi câu diễn đạt đều đúng nguồn.
- Cần bộ đánh giá Việt/Anh, không dấu, paraphrase, thiếu thông tin, ngoài phạm vi, nhiều ý, prompt injection, nguồn cũ/mâu thuẫn và provider lỗi.
- Chạy embedding local không dùng quota Gemini, nhưng bước LLM sinh câu trả lời vẫn chịu quota provider. RAG không tự giải quyết giới hạn phục vụ đồng thời hoặc hạn mức sinh nội dung.

## 9. Bỏ dấu # trên URL — đã hiện thực mã nguồn theo yêu cầu tiếp theo

Ngày 27/10/2026: đã chuyển sang BrowserRouter, thêm tương thích link hash cũ và cập nhật link FE, callback email/payOS ở BE, canonical/sitemap cùng kiểm thử. Chi tiết và thứ tự phát hành FE trước BE: [BROWSER_ROUTER_MIGRATION.md](../../LMS_FE/docs/BROWSER_ROUTER_MIGRATION.md). Chưa tự push/deploy. Các đoạn bên dưới lưu bối cảnh đã thảo luận trước khi hiện thực.

Tại thời điểm bắt đầu thảo luận, `LMS_FE/App.tsx` dùng `HashRouter`:

```text
Hiện tại: https://library74.uk/#/publicpage/guide
Đề xuất:  https://library74.uk/publicpage/guide
```

Có thể thay bằng `BrowserRouter` dùng History API. Trợ lý nghiêng về chuyển cho hướng phát triển lâu dài, nhưng **không bắt buộc để làm RAG**. Bỏ dấu `#` cũng không tự làm HTML chứa đủ nội dung React; crawler vẫn có thể cần chạy JavaScript hoặc lấy nguồn có cấu trúc/prerender/SSR.

### Hạ tầng đã kiểm tra

`LMS_FE/nginx-fe.conf` đã có:

```nginx
try_files $uri $uri/ /index.html;
```

Đây là nền tảng SPA fallback cho F5/link trực tiếp. Chưa xác minh reverse proxy production có chuyển mọi đường dẫn FE đúng cách; phải kiểm tra trước khi triển khai. Không để SPA fallback che đường dẫn API hoặc tài nguyên thiếu.

### Các điểm phụ thuộc hash đã phát hiện trong source

- `LMS_FE/pages/public_pages/OAuth2CallbackPage.tsx`: chuyển trang sau đăng nhập Google.
- `LMS_FE/api/axiosInstance.ts`: chuyển về đăng nhập khi hết phiên.
- `LMS_FE/pages/error_pages/ForbiddenPage.tsx`: liên kết FAQ.
- `LMS_FE/components/librarian_pages/inquiry/ReaderHistory.tsx`: liên kết tra cứu mở tab.
- `LMS_FE/pages/public_pages/HomePage.tsx`, `SystemReviewsPage.tsx`: nhận diện đường dẫn bằng `window.location.hash`.
- `LMS_FE/components/Seo.tsx`: tạo URL dựa trên hash.
- Backend auth: `ForgotPasswordUseCaseImpl.java` tạo link reset mật khẩu; `AuthController.java` tạo redirect xác minh email.

Đây là danh sách đã tìm thấy, **không phải danh sách đầy đủ**. Khi thực hiện phải rà soát lại toàn repo, cấu hình môi trường, test, sitemap/canonical, OAuth, URL quay về payOS và liên kết gửi ra ngoài.

### Lợi ích và đánh đổi đã trao đổi

- URL gọn, đường dẫn thông thường thuận lợi hơn cho chia sẻ và tổ chức URL tìm kiếm.
- Cần server fallback chính xác; nếu sai, F5/mở trực tiếp có thể 404.
- Thay đổi không chỉ một import router: bỏ sót link hardcode có thể làm hỏng đăng nhập, email, thanh toán hoặc mở tab mới.
- Không coi đổi router là đã giải quyết SEO, preview mạng xã hội hoặc crawl; có thể cần prerender các trang công khai về sau.
- Giữ tương thích link cũ `/#/...` bằng bước chuyển ở frontend, bảo toàn query params, đặc biệt token email. Server không nhận phần fragment nên không thể chỉ cấu hình redirect Nginx dựa trên hash.
- Kiểm thử F5, mở trực tiếp, Back/Forward, query params, link cũ, xác thực/email/thanh toán và link tab mới.

## 10. Cách tiếp tục khi quay lại

1. Đọc tài liệu này cùng `FAQ_CHATBOT.md`, kiểm tra code/config mới nhất; không mặc định môi trường production giống source mặc định.
2. Xác nhận người dùng muốn tiếp tục RAG hay đổi router trước. Hai việc độc lập, nên tách task/commit/kiểm thử.
3. Nếu RAG: chốt nguồn nội dung, phạm vi crawl nếu có, nơi điều phối BE/AI gateway, cập nhật/xóa tri thức và cách đánh giá truy xuất.
4. Kiểm tra Flyway hiện tại trước khi chọn version migration; chưa có migration RAG trong cuộc thảo luận này.
5. Giữ các chức năng, fallback và định dạng chatbot đã có; không tự mở quyền truy vấn dữ liệu nghiệp vụ.
6. Tạo thay đổi có thể review và kiểm thử, không tự push/deploy hoặc chạy crawl/ghi production chỉ vì tài liệu ghi phương án.

## 11. Tài liệu tham khảo đã đối chiếu

- [pgvector: toán tử, cosine và truy xuất](https://github.com/pgvector/pgvector#querying)
- [React Router: HashRouter](https://reactrouter.com/api/declarative-routers/HashRouter)
- [React Router: BrowserRouter](https://reactrouter.com/api/declarative-routers/BrowserRouter)
- [Google: crawl và render website JavaScript](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)

# Trợ lý FAQ Library74

## Phạm vi đã hiện thực

Widget hướng dẫn xuất hiện trong ứng dụng, hỗ trợ Việt/Anh qua LanguageContext và light/dark. Có nhập câu hỏi, Enter để gửi (Shift+Enter xuống dòng), danh sách câu hỏi gợi ý, nguồn hướng dẫn, xóa hội thoại và Escape/đóng. Khung chat không khóa cuộn trang, không đổi URL khi mở/đóng; chỉ liên kết hướng dẫn mới điều hướng.

Khi panel tải tài liệu đang có nội dung, chatbot tạm ẩn và hủy request đang chờ để không chồng lên tiến độ upload ở cùng góc. Hội thoại tạm được xóa khi widget bị unmount trong tình huống này.

Đây là chatbot FAQ, không phải agent hay RAG đọc dữ liệu thư viện:

- Không có dependency repository, JDBC, database connection hoặc truy vấn hồ sơ trong luồng chatbot.
- Không đọc source, PDF, q_a.md hoặc crawl website. Chỉ nạp một resource JSON cố định khi khởi tạo.
- Không có công cụ tìm Internet, đọc URL, SQL, function calling hay thực hiện giao dịch.
- Không lấy danh tính, token, route hiện tại hoặc lịch sử hội thoại để gửi AI.
- Không tạo QR, nhận thanh toán, gia hạn hoặc tự gửi ticket.
- Không trả số liệu hiện tại, mức cọc/số ngày đang áp dụng hoặc thông tin của bạn đọc cụ thể.

Ứng dụng Backend chính vẫn có database cho các chức năng LMS khác; cam kết trên là về luồng chatbot, không phải toàn tiến trình BE chạy không cần database.

## Kiến trúc và giới hạn trả lời

1. FE gửi duy nhất câu hỏi hiện tại (tối đa 500 ký tự) và ngôn ngữ.
2. BE kiểm tra validation và ngân sách request.
3. Nếu khớp chính xác câu hỏi/alias đã duyệt sau chuẩn hóa dấu, hoa/thường, dấu câu: trả đáp án ngay, không gọi provider.
4. Nếu chưa khớp và có cấu hình Gemini, gửi câu hỏi + ID/tên chủ đề/aliases đã duyệt để chọn một FAQ hoặc NONE. **Không gửi đáp án, source code hay dữ liệu tài khoản.**
5. Schema đầu ra chỉ có faqId. BE yêu cầu response hoàn tất, đúng cấu trúc, không có nội dung phụ và ID nằm trong allowlist.
6. BE lấy nguyên văn đáp án và sourcePath từ catalog; không dùng model text làm câu trả lời hoặc URL.
7. NONE trả UNSUPPORTED. Thiếu key, timeout, provider lỗi, mã lạ, output sai hoặc quá tải classifier trả UNAVAILABLE, hướng người dùng sang gợi ý/hướng dẫn. Không fallback sang câu trả lời tự do.

AI vẫn có thể chọn nhầm một FAQ hợp lệ. Allowlist ngăn nó tạo nội dung ngoài catalog, không chứng minh ý định luôn được nhận diện đúng. Prompt không phải hàng rào tuyệt đối; cần đánh giá thực tế với câu hỏi ngoài phạm vi, nhiều ý và prompt injection trước khi công bố độ chính xác. FAQ cũ/sai cũng tạo câu trả lời sai dù model chọn đúng; quản lý nội dung là trách nhiệm vận hành.

Tài liệu kỹ thuật provider: [Gemini structured output](https://ai.google.dev/gemini-api/docs/generate-content/structured-output). Schema không tự chứng minh đáp án phù hợp về ngữ nghĩa.

## Nguồn nội dung và cách cập nhật

Catalog tại [faq.json](../library-recommendation-module/src/main/resources/chatbot/faq.json), hiện có 20 chủ đề công khai: tác giả, tổng quan, tài khoản, tìm/mượn/đặt trước/nhận/gia hạn/trả, xem lịch sử, tìm quy định, phạt/cọc, mất/hỏng, yêu thích, thông báo, liên hệ và giới hạn riêng tư.

Mỗi mục gồm:

```json
{
  "id": "borrow",
  "sourcePath": "/publicpage/guide",
  "vi": {
    "question": "Làm cách nào để mượn sách?",
    "answer": "Nội dung hướng dẫn được duyệt...",
    "aliases": ["Hướng dẫn mượn sách"]
  },
  "en": {
    "question": "How can I borrow a book?",
    "answer": "Reviewed instructions...",
    "aliases": ["How do I borrow books?"]
  }
}
```

- Duyệt nội dung theo UI/nghiệp vụ thật, không chép nguyên tài liệu bảo vệ hoặc ghi thông tin kỹ thuật nhạy cảm.
- ID duy nhất dạng chữ thường/gạch dưới; câu hỏi/alias phải không trùng sau chuẩn hóa, kể cả giữa hai ngôn ngữ.
- SourcePath chỉ cho phép các trang công khai guide, faq, about, contact, privacy-policy. Đây là link đọc thêm, không phải bằng chứng bot đã crawl/kiểm chứng nội dung trang tại thời điểm trả lời.
- Không chép cứng mức cọc, ngày mượn, tồn kho hoặc nợ đang thay đổi. Hướng dẫn người dùng xem màn hình chính thức.
- Chạy test, review và deploy lại BE sau khi sửa catalog. Không cần migration hoặc index vector.

## API

Hai endpoint công khai, chỉ mở đúng HTTP method, response có Cache-Control: no-store. FE đánh dấu public để không gửi Bearer token cũ hoặc kích hoạt refresh/login không cần thiết.

```http
GET /api/v1/chatbot/faqs?language=vi
POST /api/v1/chatbot/messages
Content-Type: application/json

{"message":"Làm cách nào để mượn sách?","language":"vi"}
```

Danh sách gợi ý trả các id/question, không chứa đáp án. POST dùng ApiResponseApp, data gồm:

```json
{
  "status": "ANSWERED",
  "faqId": "borrow",
  "answer": "Đáp án nguyên văn từ catalog",
  "sourceTitle": "Làm cách nào để mượn sách?",
  "sourcePath": "/publicpage/guide"
}
```

Các status nghiệp vụ: ANSWERED, UNSUPPORTED, UNAVAILABLE; hai trạng thái sau không giả mạo nguồn. Request rỗng/quá dài/ngôn ngữ POST không hợp lệ trả HTTP 400. Vượt ngân sách trả 429. Ngôn ngữ mặc định tiếng Việt.

## Cấu hình và triển khai

Đặt trên **Backend** qua môi trường, không đặt khóa vào biến VITE hoặc commit secret:

```dotenv
CHATBOT_GEMINI_API_KEY=
CHATBOT_GEMINI_MODEL=gemini-2.5-flash-lite
CHATBOT_REQUESTS_PER_MINUTE=60
```

- Khóa trống: hệ thống vẫn khởi động; gợi ý/câu mẫu và alias chính xác hoạt động, câu khác trả UNAVAILABLE. Không tự lấy key AI ETL để phát sinh phí ngoài ý muốn.
- Có khóa: phân loại cách diễn đạt khác bằng model được cấu hình. Model phải hỗ trợ endpoint generateContent và structured JSON output; người vận hành xác nhận quyền truy cập/quota. Lượt triển khai này không gọi Gemini thật hay xác nhận key production.
- docker-compose.prod.yml đã truyền .env.prod vào backend bằng env_file; thêm biến vào file môi trường trên máy chủ và recreate/redeploy BE, không chỉ đổi biến phía FE. Không cần chạy AI gateway hoặc worker để phục vụ FAQ.
- Timeout kết nối provider 2 giây, đọc 8 giây, tối đa 4 lời gọi đồng thời, không retry tự động. FE timeout 15 giây.
- Ngân sách mặc định 60 POST/phút cho **toàn bộ một instance**, kể cả exact match; reset khi restart. Đây không phải hạn mức từng người/IP, quota phân tán hoặc cơ chế chống DDoS. Bổ sung giới hạn ở gateway và budget/quota provider khi public rộng.

## Riêng tư và hiển thị

Hội thoại chỉ giữ trong state FE, tối đa 40 tin; không lưu localStorage, sessionStorage hay database. F5 xóa hội thoại; đóng/mở trong cùng phiên giữ tin, đổi ngôn ngữ/xóa sẽ reset. Đóng/xóa/unmount hủy request FE và bỏ qua phản hồi cũ. Abort ở trình duyệt **không bảo đảm** hủy được lời gọi provider đã bắt đầu ở BE.

Widget thông báo câu hỏi có thể được gửi sang AI bên ngoài, yêu cầu không nhập dữ liệu nhạy cảm. Không có cơ chế tự động phát hiện/che mọi thông tin cá nhân người dùng tự gõ. Hạ tầng/proxy có thể có access log theo cấu hình riêng; cần kiểm tra không ghi request body, key hoặc thông tin nhạy cảm. Code chatbot không log câu hỏi, provider body hay exception chứa secret.

Đáp án được render như text, không dùng dangerouslySetInnerHTML/Markdown. Link dùng React Router Link để tương thích HashRouter; FE kiểm tra allowlist nguồn. Dialog là **non-modal**, hỗ trợ mở/focus, Escape, khôi phục focus; không trap focus hoặc khóa trang như modal.

## Kiểm thử và checklist

BE: FaqChatbotServiceTest, FaqIntentSelectorTest, FaqChatbotControllerTest. Provider dùng MockRestServiceServer, không tạo request thật. Kiểm tra catalog, alias không dấu, nguyên văn đáp án, NONE, mã lạ/free text/output cắt cụt, thiếu key, lỗi HTTP, validation và 429.

FE: FaqChatbot.test.tsx, chatbotService.test.ts. Kiểm tra không gửi khi gõ, Enter/Shift+Enter, gợi ý, request đơn, focus/Escape, abort/response cũ, lỗi/429, đổi ngôn ngữ, render text an toàn và nguồn allowlist.

```powershell
# LMS_BE
mvn test -pl library-recommendation-module,library-auth-module -am
# LMS_FE
npm test -- --runInBand
npx tsc --noEmit
npm run build
```

Trước production, kiểm tra trên trình duyệt ở 320/375px, desktop, zoom, light/dark; xác nhận không che banner cookie, thông báo/quầy và không làm trang nhảy cuộn. jsdom không chứng minh được bố cục thực tế.

Kiểm tra với key thật chỉ trên môi trường được phép: paraphrase tiếng Việt/không dấu/tiếng Anh, ngoài phạm vi, hỏi nợ cá nhân, yêu cầu hành động, câu trộn nhiều chủ đề và injection. Test mock cho NONE chỉ bảo vệ nhánh xử lý, không chứng minh Gemini thực tế phân loại đúng mọi câu. Không công bố tỷ lệ chính xác nếu chưa có bộ đánh giá và kết quả thật.

### Kết quả kiểm tra ngày 26/10/2026

- 30 test mới BE: 28 test catalog/service/provider/API và 2 test qua security chain thật, đều pass, không skip.
- Toàn bộ FE: 31 suites, 188 test pass; có 14 test mới cho widget/service. TypeScript noEmit pass; Vite build pass, còn cảnh báo chunk lớn trên 500 kB.
- Toàn bộ BE: 55 classes, 304 test; 278 pass, 25 skip, 1 error. Các module user/catalog/circulation/recommendation/auth pass; Bootstrap integration không tìm được Docker. Không tắt hoặc sửa test cũ để báo xanh.
- Không chạy Gemini thật, không sửa secret/môi trường production, không thay đổi schema/database. Chưa kiểm tra bố cục bằng trình duyệt thật; cần thực hiện checklist ở trên trước khi kết luận thị giác.

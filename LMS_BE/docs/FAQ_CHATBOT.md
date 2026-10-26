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
2. BE kiểm tra validation, không áp trần số request/phút hoặc ngày tự đặt.
3. Nếu khớp chính xác câu hỏi/alias sau chuẩn hóa: trả nội dung nguồn có bố cục tóm tắt, bước thực hiện hoặc gạch đầu dòng, không gọi provider.
4. Nếu chưa khớp và có Gemini, gửi câu hỏi hiện tại cùng các FAQ và nội dung tham khảo theo ngôn ngữ được chọn. Trong **một lần gọi**, AI chọn một FAQ và diễn đạt lại phù hợp câu hỏi. Model chính/dự phòng giữ nguyên. Không gửi source code, hồ sơ tài khoản hoặc lịch sử hội thoại.
5. Schema đầu ra gồm faqId, summary, steps, bullets, note, evidence. BE yêu cầu response hoàn tất, JSON hợp lệ, ID trong allowlist; kiểm tra độ dài, kiểu dữ liệu, trích dẫn nguyên văn từ FAQ được chọn, số liệu và URL/HTML. NONE không có nội dung trả lời.
6. Nội dung soạn lại hợp lệ được trả trong content; answer vẫn chứa bản text để tương thích. SourceTitle/sourcePath luôn lấy từ catalog. Nếu đã chọn FAQ hợp lệ nhưng phần soạn lại thiếu hoặc không đạt kiểm tra, trả đáp án nguồn có cấu trúc, không gọi AI lần nữa.
7. NONE trả UNSUPPORTED và dừng, không hỏi model dự phòng để tìm một kết quả khác. Thiếu key, hết khả năng xử lý, JSON lỗi, nguồn không hợp lệ hoặc safety block trả UNAVAILABLE, hướng người dùng sang gợi ý/hướng dẫn. Không fallback sang câu trả lời tự do.

### Luồng model dự phòng

```text
Câu mẫu/alias → FAQ đã duyệt, không gọi AI
Cách hỏi khác → model chính nếu không trong thời gian nghỉ sau lỗi provider
  → nội dung hợp lệ / FAQ có đáp án gốc dự phòng / NONE: kết thúc, không gọi dự phòng
  → safety block / output không hợp lệ: kết thúc an toàn, không gọi dự phòng
  → 429, 408, 5xx, timeout/mạng hoặc model 404: tạm nghỉ model chính và thử model dự phòng
  → model dự phòng lỗi/đang nghỉ: trả UNAVAILABLE + hướng về FAQ gợi ý
```

- Mỗi câu hỏi tối đa hai HTTP request AI, mỗi model tối đa một lần; không vòng lặp retry, không sleep chặn request. Fallback có thể trả NONE và vẫn phải dừng.
- Bỏ qua model đang nghỉ sau lỗi thực tế; model khác vẫn có thể xử lý. Model cấu hình trùng chỉ được gọi một lần; để fallback rỗng nếu muốn tắt dự phòng. Không có bộ đếm hạn mức cục bộ.
- 400/401/402/403 và các lỗi HTTP khác ngoài nhóm cho phép không gọi dự phòng; tạm ngừng toàn bộ classifier 60 giây để tránh lặp request sai key/cấu hình. Không log key, câu hỏi, response body hoặc exception raw.
- 429 nghỉ ít nhất 60 giây, tôn trọng thời điểm muộn hơn từ Retry-After (số giây hoặc HTTP date) và RetryInfo.retryDelay. Nếu QuotaFailure có quotaId/quotaMetric cho biết hết ngày, nghỉ đến lần reset nửa đêm Pacific tiếp theo, hoặc lâu hơn nếu provider yêu cầu.
- 404 nghỉ 10 phút; lỗi mạng/408/5xx nghỉ ít nhất 15 giây, HTTP 408/5xx còn tôn trọng Retry-After. Hết thời gian nghỉ mới được thử lại trong câu hỏi sau.
- Không coi model dự phòng là quyền vượt quota, không hứa hai hạn mức 500 sẽ thành 1.000 câu trả lời. Quota provider vẫn có thể bị dùng bởi phần metadata, project khác luồng hoặc giới hạn bổ sung.
- Generation config không gửi temperature/topP/topK cũ khi chuyển Gemini 3.x. Yêu cầu JSON có cấu trúc, giới hạn output 1536 token. Không bật search, URL tools hoặc công cụ khác.

Tham khảo: [quota và reset Pacific](https://ai.google.dev/gemini-api/docs/rate-limits), [chuyển Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/generate-content/whats-new-gemini-3.6), [lỗi và retry](https://ai.google.dev/gemini-api/docs/troubleshooting).

AI vẫn có thể chọn nhầm FAQ hoặc diễn đạt sai. Kiểm tra schema, trích dẫn và số liệu chỉ giảm rủi ro; không chứng minh mọi mệnh đề đều được nguồn hỗ trợ. Không cam kết loại bỏ hoàn toàn hallucination. Prompt không phải hàng rào tuyệt đối; cần đánh giá thực tế với câu hỏi ngoài phạm vi, nhiều ý và prompt injection trước khi công bố độ chính xác. FAQ cũ/sai cũng tạo câu trả lời sai dù model chọn đúng; quản lý nội dung là trách nhiệm vận hành.

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
  "answer": "Bản text của câu trả lời",
  "content": {
    "summary": "Tóm tắt ngắn",
    "steps": ["Bước thực hiện khi cần"],
    "bullets": [],
    "note": ""
  },
  "sourceTitle": "Làm cách nào để mượn sách?",
  "sourcePath": "/publicpage/guide"
}
```

Các status nghiệp vụ: ANSWERED, UNSUPPORTED, UNAVAILABLE; hai trạng thái sau không giả mạo nguồn. Request rỗng/quá dài/ngôn ngữ POST không hợp lệ trả HTTP 400. Google trả 429 được xử lý bên trong chuỗi dự phòng; nếu không còn model dùng được thì API trả data.status=UNAVAILABLE, không tự tạo lỗi quota 429 theo số lượt của ứng dụng. Gateway triển khai riêng vẫn có thể trả HTTP 429. Ngôn ngữ mặc định tiếng Việt.

## Cấu hình và triển khai

Đặt trên **Backend** qua môi trường, không đặt khóa vào biến VITE hoặc commit secret:

```dotenv
CHATBOT_GEMINI_API_KEY=
CHATBOT_GEMINI_MODEL=gemini-3.5-flash-lite
CHATBOT_GEMINI_FALLBACK_MODEL=gemini-3.1-flash-lite
```

- Khóa trống: hệ thống vẫn khởi động; gợi ý/câu mẫu và alias chính xác hoạt động, câu khác trả UNAVAILABLE. Không tự lấy key AI ETL để phát sinh phí ngoài ý muốn.
- Có khóa: nhận diện câu hỏi và viết lại nội dung tham khảo bằng model được cấu hình trong cùng một lần gọi. Model phải hỗ trợ endpoint generateContent và structured JSON output; người vận hành xác nhận quyền truy cập/quota. Lượt triển khai này không gọi Gemini thật hay xác nhận key production.
- docker-compose.prod.yml đã truyền .env.prod vào backend bằng env_file; thêm biến vào file môi trường trên máy chủ và recreate/redeploy BE, không chỉ đổi biến phía FE. Không cần chạy AI gateway hoặc worker để phục vụ FAQ.
- Timeout mỗi lần gọi: kết nối 1 giây, đọc 4 giây; tối đa 4 lượt phân loại đồng thời cho cả chuỗi, không có hàng đợi. Hai lần gọi tuần tự thông thường nằm trong timeout FE 15 giây; đây không phải SLA hoặc deadline tuyệt đối cho mọi điều kiện mạng.
- Đã bỏ mọi bộ đếm RPM/RPD/TPM tự đặt và trần tổng POST. Chỉ Google quyết định quota provider; khi nâng cấp tài khoản không cần sửa mức 12/450/60 trong ứng dụng. Ba biến hạn mức cũ không còn được đọc, có thể xóa khỏi .env.prod; không cần thay bằng giá trị lớn hơn.
- Chỉ lưu thời điểm nghỉ trong RAM **sau lỗi thực tế**. Đây là chống gọi lặp lúc provider lỗi, không phải quota. Nếu đã nhận lỗi hết ngày rồi mới nâng cấp quota, cần chờ cooldown hiện tại hoặc recreate BE để xóa thời điểm nghỉ; model dự phòng vẫn có thể dùng trong thời gian đó. Restart/multi-instance không làm tăng quota thật của project.
- Không có rate limiter hoặc giới hạn chi phí ứng dụng trong luồng này. Khi public rộng hoặc dùng gói tính phí, người vận hành cần thiết lập bảo vệ phù hợp ở gateway/provider và theo dõi sử dụng. Tối đa 4 lượt phân loại đồng thời chỉ bảo vệ tài nguyên xử lý, không chống spam hoặc bảo đảm phục vụ vô hạn.
- Nếu .env.prod đã đặt model cũ thì giá trị đó vẫn ghi đè default mới: cần sửa rõ CHATBOT_GEMINI_MODEL và bổ sung CHATBOT_GEMINI_FALLBACK_MODEL, rồi recreate BE. Không tự đổi model hoặc khóa metadata. Không có cache câu hỏi hoặc gom request trùng trong bản cập nhật này.

## Riêng tư và hiển thị

Hội thoại chỉ giữ trong state FE, tối đa 40 tin; không lưu localStorage, sessionStorage hay database. F5 xóa hội thoại; đóng/mở trong cùng phiên giữ tin, đổi ngôn ngữ/xóa sẽ reset. Đóng/xóa/unmount hủy request FE và bỏ qua phản hồi cũ. Abort ở trình duyệt **không bảo đảm** hủy được lời gọi provider đã bắt đầu ở BE.

Đã bỏ hai dòng thông báo phạm vi và “Chỉ dùng câu trả lời đã duyệt” khỏi widget theo yêu cầu. FAQ riêng tư vẫn giải thích rằng câu hỏi và nội dung hướng dẫn có thể được gửi tới AI để soạn câu trả lời. Không có cơ chế tự động phát hiện/che mọi thông tin cá nhân người dùng tự gõ. Hạ tầng/proxy có thể có access log theo cấu hình riêng; cần kiểm tra không ghi request body, key hoặc thông tin nhạy cảm. Code chatbot không log câu hỏi, provider body hay exception chứa secret.

Đáp án được render bằng đoạn văn, danh sách ol/ul và phần lưu ý riêng; hỗ trợ light/dark, Việt/Anh. Không dùng dangerouslySetInnerHTML/Markdown, không render link do AI tạo. FE cũ vẫn đọc answer; FE mới vẫn nhận được response cũ không có content. Link dùng React Router Link để tương thích HashRouter; FE kiểm tra allowlist nguồn. Dialog là **non-modal**, hỗ trợ mở/focus, Escape, khôi phục focus; không trap focus hoặc khóa trang như modal.

## Kiểm thử và checklist

BE: FaqChatbotServiceTest, FaqIntentSelectorTest, FaqModelCooldownTest, FaqChatbotControllerTest và FaqPublicSecurityTest. Provider dùng MockRestServiceServer, không tạo request thật. Ngoài các guard cũ, test kiểm tra model chính/dự phòng, NONE/safety/output lỗi không failover, 429/Retry-After/RetryInfo, lỗi hết ngày/reset Pacific, mạng/timeout, model không tồn tại và key/payload sai. Test hồi quy chứng minh FAQ không bị chặn sau 60 request, 501 lần gọi AI tuần tự tại cùng mốc thời gian vẫn được xử lý khi provider mock chấp nhận, nhưng vẫn chỉ có 4 lượt xử lý AI đồng thời.

FE: FaqChatbot.test.tsx, chatbotService.test.ts. Kiểm tra bố cục summary/steps/bullets/note, dự phòng khi content lỗi, escape HTML, bỏ hai dòng thông báo, không gửi khi gõ, Enter/Shift+Enter, gợi ý, request đơn, focus/Escape, abort/response cũ, lỗi/429, đổi ngôn ngữ, render text an toàn và nguồn allowlist.

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

### Kết quả bản FAQ ban đầu ngày 26/10/2026 (trước nâng cấp dự phòng)

- 30 test mới BE: 28 test catalog/service/provider/API và 2 test qua security chain thật, đều pass, không skip.
- Toàn bộ FE: 31 suites, 188 test pass; có 14 test mới cho widget/service. TypeScript noEmit pass; Vite build pass, còn cảnh báo chunk lớn trên 500 kB.
- Toàn bộ BE: 55 classes, 304 test; 278 pass, 25 skip, 1 error. Các module user/catalog/circulation/recommendation/auth pass; Bootstrap integration không tìm được Docker. Không tắt hoặc sửa test cũ để báo xanh.
- Không chạy Gemini thật, không sửa secret/môi trường production, không thay đổi schema/database. Chưa kiểm tra bố cục bằng trình duyệt thật; cần thực hiện checklist ở trên trước khi kết luận thị giác.

### Kiểm tra bản dự phòng model ngày 26/10/2026 (trước khi bỏ trần cục bộ)

- 55 test FAQ/security pass: service 12, selector 29, ngân sách 6, controller 6, security 2; không skip. Các test provider dùng HTTP giả lập, không chứng minh key/quota hoặc độ chính xác của model thật.
- Chạy toàn bộ module recommendation/auth và các module phụ thuộc: thành công.
- Toàn bộ FE: 31 suites, 188 test pass; TypeScript và build pass. Không sửa FE trong task dự phòng; thay đổi Facebook có sẵn trong workspace được giữ riêng.
- Đã chạy toàn bộ BE: các module nghiệp vụ thành công, Bootstrap vẫn có 1 lỗi và 25 skip do Docker không hoạt động. Không chỉnh test cũ để che lỗi.
- Không gọi Gemini thật, không đọc/sửa .env.prod, không deploy, không thêm database hoặc migration. Kiểm tra với key/model của project trên môi trường được phép vẫn cần được thực hiện trước khi xác nhận vận hành thực tế.

### Kiểm tra sau khi bỏ trần cục bộ ngày 26/10/2026

- Đã bỏ ba tham số giới hạn, mọi bộ đếm request/phút/ngày và test yêu cầu chặn theo hạn mức tự đặt. Những test đó được thay bằng hồi quy cho yêu cầu mới, không bỏ guard về nguồn, quyền, validation hoặc output AI.
- Clean build recommendation/auth và các module phụ thuộc: 109 test pass, gồm 53 test FAQ/security. Test dùng provider giả lập để xác nhận vượt các mốc cũ vẫn gọi được khi provider chấp nhận; không dùng kết quả này để tuyên bố Google đã cấp quota tương ứng.
- Vẫn có test cooldown theo lỗi quota Google, Retry-After/RetryInfo, model dự phòng và giới hạn 4 lượt phân loại đồng thời. Không có cache hoặc database mới.
- Toàn bộ FE: 31 suites, 188 test pass; TypeScript và build pass. Còn cảnh báo chunk lớn như trước; không sửa giao diện Facebook đang có trong workspace.
- Không gọi Gemini thật, sửa .env.prod hoặc deploy. Chỉ giữ key và tên hai model trong cấu hình ví dụ; khi triển khai cần cập nhật server theo phiên bản mới.

### Kiểm tra bản AI diễn đạt từ nội dung tham khảo ngày 26/10/2026

- Một lần gọi AI vừa chọn FAQ vừa viết lại nội dung theo câu hỏi; schema gồm tóm tắt, bước thực hiện, gạch đầu dòng, lưu ý và trích dẫn kiểm tra nội bộ. Không có lần gọi AI thứ hai chỉ để viết lại.
- Câu gợi ý/alias chính xác vẫn trả nguồn ngay để hoạt động khi không có key hoặc hết quota. Nội dung dự phòng được tách thành đoạn/danh sách; không lặp bước đầu ở phần tóm tắt. Câu hỏi tự do không xác định được nguồn sẽ được hướng về gợi ý, không tự đoán đáp án.
- Kiểm thử mới kiểm tra dữ liệu tham khảo theo ngôn ngữ, viết lại trong một request, trích dẫn giả, số liệu ngoài nguồn, URL/HTML, nguồn liên kết do server quản lý và API content tương thích answer cũ.
- Backend: recommendation/auth và các module phụ thuộc có 116 test pass, 0 failure/error/skip; gồm 60 test FAQ/security. Không sửa test nghiệp vụ khác để đạt kết quả này. Không chạy lại toàn bộ Bootstrap trong lượt này; giới hạn Docker của lần chạy trước vẫn được ghi trong lịch sử trên.
- Frontend: 31 suites, 191 test pass; TypeScript noEmit và Vite build pass. Có kiểm tra danh sách bước, gạch đầu dòng, lưu ý, fallback khi content thiếu/sai và escape HTML. Đã bỏ hai dòng thông báo theo yêu cầu, cùng aria-describedby không còn đích tham chiếu. Build còn cảnh báo chunk trên 500 kB như trước.
- Không gọi Gemini thật, kiểm thử trình duyệt thật, đọc/sửa .env.prod hoặc deploy. Prompt và trích dẫn chưa đủ để chứng minh model không bao giờ diễn đạt sai; cần đánh giá với key/model thực tế trước khi công bố chất lượng trả lời.

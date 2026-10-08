# 200 câu hỏi & trả lời luyện bảo vệ đồ án Library74

> Đề tài: Xây dựng hệ thống quản lý thư viện trực tuyến tích hợp AI hỗ trợ tìm kiếm và gợi ý sách.
>
> Sinh viên: Võ Quang Thắng — MSSV 2213214 — Mã đề tài HK253-DATN-076.
>
> Hướng dẫn: TS. Trương Tuấn Anh, CN. Dương Huỳnh Anh Đức. Phản biện: ThS. Trần Thị Quế Nguyệt.
>
> Đơn vị: Khoa Khoa học và Kỹ thuật Máy tính, Trường Đại học Bách Khoa, ĐHQG-HCM.
>
> Cập nhật tài liệu: **06/10/2026**. Đây là tài liệu luyện trả lời, không phải biên bản nghiệm thu production.

## Cách dùng trước hội đồng

Hội đồng có thể chưa đọc kỹ báo cáo hoặc chưa hiểu tên công nghệ. Mỗi câu dưới đây bắt đầu từ điều thầy cô nhìn thấy trên demo, rồi giải thích bài toán, cách xử lý và giới hạn. Không cần đọc thuộc tên class, câu SQL hoặc cú pháp.

Cách trả lời: **trả lời thẳng → ví dụ nghiệp vụ → cơ chế bảo vệ hoặc bằng chứng**. Mỗi đáp án là khung nói khoảng 20–45 giây; chỉ đi sâu công nghệ khi được hỏi tiếp. Thầy cô hỏi “dùng gì” thì nói tên công cụ và nó giải quyết việc gì, không liệt kê toàn bộ stack.

**Quy tắc trung thực khi bảo vệ:**

- Phân biệt “đã hiện thực trong source”, “đã chạy test”, “đã triển khai” và “đã dùng thật”. Một việc không tự chứng minh ba việc còn lại.
- Dữ liệu seed phục vụ minh họa là dữ liệu tổng hợp, không phải hoạt động của sinh viên thật. Tên hiển thị tự nhiên không thay đổi bản chất đó.
- Không khẳng định AI luôn đúng, chống mọi gian lận, không downtime hoặc test bao phủ 100%.
- Benchmark cần ngày đo, tập dữ liệu và phạm vi. Không so sánh chê hệ thống khác khi chưa khảo sát.
- Điểm chưa triển khai nói rõ là hướng phát triển; đừng gọi test mock là E2E thật.

### Mốc kiểm thử đang có để cập nhật slide

| Hạng mục | Bằng chứng và giới hạn |
| --- | --- |
| FE | Lượt chạy ngày 06/10/2026: **29 suites, 174/174 pass** |
| BE | Lượt chạy ngày 06/10/2026: **51 classes, 274 test; 248 pass, 25 skip, 1 error**. Testcontainers không tìm được Docker; chưa thể ghi toàn bộ pass |
| AI | Báo cáo lưu ngày 27/05/2026: **72 pass, 3 skip**; chưa chạy lại trong lượt cập nhật tài liệu này |
| Production smoke | Báo cáo lưu ngày 27/05/2026: **8/8 pass**, không phải kiểm tra đầy đủ mọi nghiệp vụ |
| Load probe | Báo cáo lưu ngày 27/05/2026: **0% lỗi ở 50/100/200 VUs** trong kịch bản đọc đã đo; p95 tăng theo tải |

Số liệu trên không được cộng thành một con số “độ chính xác hệ thống”. Trước buổi bảo vệ nên lấy kết quả CI/môi trường test mới nhất và cập nhật ngày đo. Không chạy load test hoặc thanh toán thật trên production chỉ để có số đẹp.

## Mục lục

| Phần | Chủ đề | Câu |
| --- | --- | --- |
| 1 | Bài toán, phạm vi và giá trị | 1–10 |
| 2 | Vai trò, tài khoản và chính sách | 11–20 |
| 3 | Quản lý sách, bản sao và ISBN | 21–30 |
| 4 | Tìm kiếm và gợi ý AI | 31–40 |
| 5 | Mượn sách online và tại quầy | 41–50 |
| 6 | Đặt trước, giữ sách và không đến nhận | 51–60 |
| 7 | Giao sách và thu cọc | 61–70 |
| 8 | Gia hạn | 71–80 |
| 9 | Trả sách, hỏng/mất và tín nhiệm | 81–90 |
| 10 | Phí phạt và quyết toán tiền | 91–100 |
| 11 | Thanh toán payOS và ngoại lệ | 101–110 |
| 12 | Xếp giá sách và hai cơ sở | 111–120 |
| 13 | Tra cứu giao dịch và vòng đời bản sao | 121–130 |
| 14 | Excel, PDF và đối soát | 131–140 |
| 15 | Cộng đồng, hỗ trợ và thông báo | 141–150 |
| 16 | Testing: giải thích cho người không đọc code | 151–160 |
| 17 | Testing: tình huống nghiệp vụ và dữ liệu | 161–170 |
| 18 | Testing: API, AI, tải và bằng chứng | 171–180 |
| 19 | Triển khai và vận hành | 181–190 |
| 20 | CI/CD, giới hạn và câu hỏi chốt | 191–200 |

## Phần 1 — Bài toán, phạm vi và giá trị

### Câu 1: Nói ngắn gọn, hệ thống của em giải quyết việc gì?
**Trả lời:** Hệ thống giúp bạn đọc tìm sách, yêu cầu mượn, theo dõi hạn trả và phí phạt; giúp thủ thư giao nhận, quản lý bản sao và đối soát. AI hỗ trợ tìm theo nhu cầu và gợi ý sách, không thay thủ thư quyết định nghiệp vụ.

### Câu 2: Đây là website giới thiệu sách hay phần mềm quản lý thư viện?
**Trả lời:** Là phần mềm quản lý thư viện có trang tra cứu công khai. Khác biệt nằm ở quản lý từng bản sao, người đang giữ, thời hạn, cọc/phạt và lịch sử xử lý, chứ không chỉ đăng tên và ảnh sách.

### Câu 3: Bạn đọc được lợi gì so với hỏi trực tiếp thủ thư?
**Trả lời:** Bạn đọc có thể tra cứu trước khi đến, biết sách còn khả dụng, theo dõi yêu cầu và hạn trả. Những việc cần kiểm tra sách vật lý hoặc giao nhận vẫn thực hiện tại quầy; hệ thống không loại bỏ vai trò thủ thư.

### Câu 4: Thủ thư được giảm công việc nào?
**Trả lời:** Giảm tra sổ tìm người mượn, tính phí trễ thủ công và gom danh sách cuối ca. Tra cứu theo MSSV/barcode, hàng chờ xếp giá và báo cáo Excel giúp xử lý có dữ liệu và lưu dấu người thực hiện.

### Câu 5: AI có phải phần chính, còn nghiệp vụ chỉ để minh họa không?
**Trả lời:** Không. Nghiệp vụ lưu thông là nền tảng; AI là lớp hỗ trợ khai thác tài liệu. Một gợi ý hay nhưng số bản sao, quyền mượn hoặc công nợ sai thì hệ thống vẫn không sử dụng được.

### Câu 6: Điểm nổi bật của đề tài là gì?
**Trả lời:** Em kết hợp tra cứu nội dung bằng AI với vòng đời sách thực tế: yêu cầu, giao, gia hạn, trả, quyết toán và cất kệ. Giá trị nằm ở luồng hoàn chỉnh và việc giải thích trạng thái cho người dùng, không chỉ số màn hình.

### Câu 7: Vì sao không dùng một phần mềm thư viện có sẵn?
**Trả lời:** Đồ án nhằm nghiên cứu và hiện thực luồng tích hợp AI, nghiệp vụ và kiểm thử trong một hệ thống cụ thể. Em không khẳng định sản phẩm tốt hơn mọi giải pháp có sẵn; triển khai chính thức vẫn cần đánh giá chi phí và mức đáp ứng nghiệp vụ.

### Câu 8: Em đã triển khai cho trường sử dụng chính thức chưa?
**Trả lời:** Hệ thống có địa chỉ triển khai để truy cập và demo. Điều đó chưa đồng nghĩa trường đã nghiệm thu hay dùng chính thức; em phân biệt môi trường trình diễn với việc tích hợp dữ liệu, quy trình và trách nhiệm vận hành của nhà trường.

### Câu 9: Những sinh viên và giao dịch trên demo là thật hết à?
**Trả lời:** Không. Có dữ liệu tổng hợp để minh họa các khóa, khoa và tình huống mượn–trả. Dữ liệu seed có dấu nhận diện phục vụ kiểm tra; em không dùng nó để chứng minh số người dùng thực hay hiệu quả sử dụng ngoài thực tế.

### Câu 10: Nếu chỉ được demo một luồng để chứng minh hệ thống, em chọn gì?
**Trả lời:** Em chọn bạn đọc tìm sách, thủ thư giao và thu cọc, sau đó nhận trả và quyết toán, rồi sách vào hàng chờ xếp giá. Luồng này cho thấy quan hệ giữa người dùng, bản sao, tiền và công việc cuối ca.

## Phần 2 — Vai trò, tài khoản và chính sách

### Câu 11: Hệ thống có những nhóm người dùng nào?
**Trả lời:** Có khách tra cứu công khai, bạn đọc, thủ thư và quản trị viên. Bạn đọc thao tác với nhu cầu của mình, thủ thư xử lý lưu thông, còn quản trị viên quản lý tài khoản và chính sách; quyền chi tiết do Backend kiểm tra.

### Câu 12: Không đăng nhập có sử dụng được không?
**Trả lời:** Khách vẫn xem và tìm sách công khai. Mượn, đặt trước, xem công nợ cá nhân hoặc gửi hỗ trợ theo tài khoản cần đăng nhập, vì hệ thống phải xác định ai đang chịu trách nhiệm cho thao tác.

### Câu 13: Bạn đọc có tự đánh dấu đã trả sách được không?
**Trả lời:** Không. Việc trả cần thủ thư tiếp nhận và kiểm tra bản sao thực tế. Nếu bạn đọc tự đánh dấu thì trạng thái trên web có thể đã trả nhưng sách chưa quay về thư viện.

### Câu 14: Admin có phải làm được mọi việc của thủ thư không?
**Trả lời:** Không mặc định như vậy. Quyền gắn với trách nhiệm, không chỉ cấp bậc; ví dụ ở hỗ trợ, admin có thể giám sát nhưng không thay thủ thư trả lời và xử lý ticket. Các chức năng khác cần đối chiếu quyền riêng của endpoint.

### Câu 15: Chỉ ẩn nút trên màn hình có đủ bảo vệ quyền không?
**Trả lời:** Không. Người dùng có thể gửi request không qua giao diện. Vì vậy Backend phải kiểm tra đăng nhập, vai trò và quyền trên đối tượng; giao diện chỉ giúp tránh thao tác nhầm và dễ sử dụng.

### Câu 16: Hai bạn đọc có xem được lịch sử hoặc nợ của nhau không?
**Trả lời:** Luồng cá nhân phải kiểm tra chủ sở hữu phía Backend. Thủ thư có quyền tra cứu phục vụ nghiệp vụ, còn bạn đọc không được đổi mã người dùng trong request để xem tài khoản khác.

### Câu 17: Ai được thay đổi số ngày mượn và mức phạt?
**Trả lời:** Quản trị viên thay đổi chính sách lưu thông. Thủ thư xem chính sách hiện hành tại trang quy định; tách quyền này để nhân viên quầy không tùy ý thay quy chế khi xử lý từng giao dịch.

### Câu 18: Các giới hạn mượn của em có cố định không?
**Trả lời:** Không nên xem số trên demo là quy định bất biến. Số sách, thời hạn nhận, tiền cọc, phí trễ và giới hạn gia hạn lấy từ chính sách; khi bảo vệ em sẽ chỉ ra cấu hình đang áp dụng thay vì học thuộc một con số.

### Câu 19: Nếu quy định thay đổi, các giao dịch cũ có bị viết lại không?
**Trả lời:** Không được hiểu là mọi dữ liệu cũ tự đổi theo chính sách mới. Hạn trả đã ghi và tiền đã thu là dấu vết giao dịch; một số quyết định tiếp theo dùng chính sách hiện hành. Cần giải thích theo từng nghiệp vụ, không hứa hồi tố toàn bộ.

### Câu 20: Nếu bạn đọc quên mật khẩu hoặc chưa xác minh email thì sao?
**Trả lời:** Có luồng xác minh email và khôi phục mật khẩu qua thông tin tài khoản. Đây là bước xác thực và hỗ trợ truy cập, không phải thủ thư tự xem hoặc gửi lại mật khẩu gốc cho người dùng.

## Phần 3 — Quản lý sách, bản sao và ISBN

### Câu 21: Một cuốn sách trên màn hình là một đầu sách hay một bản sao?
**Trả lời:** Trang giới thiệu thường là đầu sách, còn mượn–trả gắn với bản sao cụ thể. Một đầu sách có thể có nhiều barcode, vị trí và trạng thái khác nhau; không thể lấy trạng thái một bản sao đại diện cho tất cả.

### Câu 22: Vì sao em cần cả ISBN và barcode?
**Trả lời:** ISBN nhận diện phiên bản xuất bản; barcode nhận diện cuốn thư viện đang quản lý. Hai bản sao cùng phiên bản có thể cùng ISBN nhưng phải có barcode riêng để biết cuốn nào được giao và ai đang giữ.

### Câu 23: Thêm đầu sách có nghĩa đã có sách để cho mượn chưa?
**Trả lời:** Chưa. Đầu sách là thông tin biên mục; cần tạo bản sao vật lý, gán cơ sở, barcode và trạng thái phù hợp. Có bản ghi sách nhưng không có bản sao khả dụng thì không được báo là có sách để giao.

### Câu 24: Nhập ISBN thì hệ thống tự lấy thông tin từ đâu?
**Trả lời:** Luồng tra cứu dùng Google Books và Open Library để lấy thông tin có sẵn, rồi thủ thư kiểm tra trước khi lưu. Đây là nhập liệu hỗ trợ, không phải mọi ISBN đều có đầy đủ dữ liệu hoặc mọi thông tin bên ngoài đều chính xác.

### Câu 25: Nếu ISBN không tìm thấy thì em có cho tạo sách không?
**Trả lời:** Việc không có kết quả từ dịch vụ ngoài không đồng nghĩa sách không tồn tại. Thủ thư có thể nhập thông tin phù hợp và tuân thủ validation; hệ thống không nên biến dịch vụ tra cứu ngoài thành điều kiện duy nhất để biên mục.

### Câu 26: Mã xếp giá dùng để làm gì?
**Trả lời:** Mã xếp giá giúp phân loại và sắp sách theo thứ tự trong kệ. Vị trí kệ trả lời “đến đâu”, mã xếp giá trả lời “tìm ở vị trí nào theo thứ tự”, còn barcode trả lời “đây là bản sao nào”.

### Câu 27: ISBN có chứa mã xếp giá để em tách ra không?
**Trả lời:** Không. ISBN được dùng làm khóa tra cứu dữ liệu phân loại. Backend ưu tiên DDC từ Open Library, thiếu thì có thể lấy LC; nút tra DDC trên form chỉ lấy DDC. Đây là hai hệ phân loại khác nhau, không nên gọi mọi kết quả là DDC.

### Câu 28: Em có tự tạo được mã xếp giá hoàn chỉnh cho mọi sách không?
**Trả lời:** Chưa thể khẳng định. Dữ liệu ngoài có thể chỉ cung cấp số phân loại; ký hiệu tác giả hoặc quy ước nội bộ vẫn cần thủ thư hoàn thiện. Phần mềm hỗ trợ tra cứu và lưu mã, không thay chuyên môn biên mục.

### Câu 29: Sách hỏng hoặc mất có còn tính là khả dụng không?
**Trả lời:** Không. Số có thể mượn phải dựa vào trạng thái từng bản sao. Tổng số bản sao và số khả dụng là hai chỉ số khác nhau; cách hiển thị còn cần phân biệt sách chờ cất với vị trí đã xác nhận.

### Câu 30: Tại sao trước đây số bản sao hiển thị có thể lớn hơn số thực?
**Trả lời:** Khi ghép bản sao với nhiều lượt mượn và đánh giá, cùng một bản sao có thể lặp thành nhiều dòng. Em đã xử lý việc đếm theo bản sao duy nhất; kiểm tra cần có dữ liệu nhiều quan hệ, không chỉ một sách và một lượt mượn.

## Phần 4 — Tìm kiếm và gợi ý AI

### Câu 31: Tìm kiếm AI khác tìm kiếm tên sách ở điểm nào?
**Trả lời:** Tìm tên đối chiếu từ khóa với thông tin sách; tìm ngữ nghĩa đối chiếu ý nghĩa nhu cầu với nội dung đã xử lý. Bạn đọc có thể diễn đạt mục tiêu học mà chưa nhớ tên sách, nhưng kết quả vẫn cần kiểm tra mức phù hợp.

### Câu 32: Em dùng công nghệ gì để hiểu ý nghĩa câu tìm kiếm?
**Trả lời:** Em dùng mô hình embedding để chuyển câu hỏi và nội dung thành vector, rồi so độ gần trong PostgreSQL với pgvector. Vector là biểu diễn phục vụ tìm kiếm, không có nghĩa hệ thống hiểu đúng mọi ngữ cảnh như con người.

### Câu 33: Có phải mỗi lần tìm sách đều hỏi Gemini không?
**Trả lời:** Không. Gemini chủ yếu hỗ trợ sinh metadata ở quá trình xử lý tài liệu. Tìm kiếm ngữ nghĩa dùng embedding và dữ liệu vector đã lưu, nên không phải gửi toàn bộ PDF cho LLM mỗi lần người dùng tìm.

### Câu 34: Không có PDF thì sách có biến mất khỏi hệ thống không?
**Trả lời:** Không. Sách vẫn có metadata và có thể tra cứu theo thông tin biên mục. Tuy nhiên em không thể khẳng định đã tìm sâu nội dung của cuốn đó khi chưa có tài liệu được xử lý và vector tương ứng.

### Câu 35: Tại sao phải chia PDF thành nhiều đoạn?
**Trả lời:** Một sách dài chứa nhiều chủ đề và vượt giới hạn xử lý của mô hình. Chia đoạn giúp truy xuất phần liên quan, kiểm soát chi phí và chọn nội dung đại diện; chất lượng còn phụ thuộc cách làm sạch và giữ ngữ cảnh giữa đoạn.

### Câu 36: PDF scan hoặc văn bản lỗi có xử lý tốt như sách số không?
**Trả lời:** Không chắc. Chất lượng trích xuất/OCR phụ thuộc nguồn và cấu hình; file scan kém có thể thiếu nội dung hoặc gây nhiễu. Em cần nhận biết lỗi/fallback và không trình bày tóm tắt như đã được xác minh toàn bộ.

### Câu 37: Gợi ý sách dựa vào đâu, hay chỉ chọn ngẫu nhiên?
**Trả lời:** Dựa vào tín hiệu xem, yêu thích, mượn và thông tin nội dung; hệ thống có các cách gợi ý theo hành vi, nội dung hoặc fallback. Kết quả là ưu tiên tham khảo, không phải suy luận chắc chắn về năng lực hay nhu cầu người đọc.

### Câu 38: Người mới chưa mượn sách thì lấy gì để gợi ý?
**Trả lời:** Có thể dùng khoa, metadata hoặc xu hướng làm fallback khi lịch sử chưa đủ. Chưa có hành vi thì chưa thể gọi là cá nhân hóa sâu; hệ thống cần cập nhật gợi ý khi người dùng có thêm tương tác.

### Câu 39: Thủ thư xem gợi ý AI cho bạn đọc để làm gì?
**Trả lời:** Để tư vấn khi tra cứu hồ sơ, kết hợp khoa và lịch sử đọc với sách hiện có. Thủ thư vẫn xem tác giả, năm, bản sao và vị trí, chứ không giao sách chỉ vì AI xếp nó ở đầu danh sách.

### Câu 40: AI lỗi thì hệ thống có ngừng cho mượn không?
**Trả lời:** Nghiệp vụ mượn–trả nằm ở Backend, không phụ thuộc một câu trả lời AI để quyết định. Luồng gợi ý/tìm kiếm cần fallback hoặc thông báo phù hợp; không đồng nghĩa mọi chức năng AI vẫn giữ nguyên chất lượng khi dịch vụ lỗi.

## Phần 5 — Mượn sách online và tại quầy

### Câu 41: Bạn đọc bấm “Mượn” là sách đã được giao chưa?
**Trả lời:** Chưa. Luồng online tạo yêu cầu chờ nhận và giữ bản sao phù hợp. Chỉ khi thủ thư xác nhận bàn giao mới ghi thời điểm mượn thực tế và chuyển bản sao sang đang mượn.

### Câu 42: Mượn online và mượn trực tiếp khác nhau thế nào?
**Trả lời:** Online có bước chờ bạn đọc đến quầy; trực tiếp xác định bạn đọc và barcode khi sách đang ở quầy, rồi giao ngay sau kiểm tra và thu cọc nếu cần. Cả hai vẫn phải tuân thủ chính sách.

### Câu 43: Làm sao biết cuốn sách được giao đúng cho người đang đứng ở quầy?
**Trả lời:** Thủ thư tra cứu MSSV và đối chiếu bạn đọc thực tế, rồi xác định barcode/phiếu nhận. Phần mềm hỗ trợ định danh và kiểm tra phiếu, nhưng không tự xác thực người đứng trước quầy nếu nhân viên bỏ qua bước đối chiếu.

### Câu 44: Bạn đọc có thể mượn vô hạn sách không?
**Trả lời:** Không. Backend kiểm tra giới hạn mượn theo chính sách và tình trạng bạn đọc. Chặn ở Backend cần thiết vì tắt nút trên web không ngăn người dùng gửi thêm request.

### Câu 45: Nếu đang nợ phạt thì có được mượn tiếp không?
**Trả lời:** Luồng mượn kiểm tra chính sách chặn khi có phí chưa trả. Thủ thư xử lý ở khu vực thu phí; không nên sửa trạng thái nợ để “cho qua”. Điều kiện gia hạn cũng có kiểm tra nợ riêng.

### Câu 46: Hai người cùng bấm mượn cuốn cuối cùng thì sao?
**Trả lời:** Khi cấp phát phải kiểm tra và khóa/cập nhật bản sao trong giao dịch, không dựa vào số còn lại trên màn hình đã cũ. Một người được cấp phát; người còn lại phải nhận kết quả không còn khả dụng hoặc chuyển sang đặt trước.

### Câu 47: Nếu người dùng nhấn nút hai lần thì có hai phiếu mượn không?
**Trả lời:** FE cần ngăn gửi lặp trong khi xử lý; BE phải kiểm tra trạng thái và các ràng buộc để không cấp phát lại cùng bản sao. Không nên khẳng định mọi endpoint đều idempotent nếu chưa có cơ chế và test tương ứng.

### Câu 48: Ngày bắt đầu mượn tính từ lúc bấm trên web hay lúc nhận sách?
**Trả lời:** Từ lúc giao nhận được xác nhận. Thời gian giữ để nhận sách và thời gian sử dụng sách là hai giai đoạn khác nhau; không được tính người chưa nhận như đã mang sách ra khỏi thư viện.

### Câu 49: Đang tạo phiếu mà lỗi giữa chừng thì dữ liệu ra sao?
**Trả lời:** Các cập nhật nghiệp vụ liên quan cần nằm trong transaction để tránh có phiếu mà trạng thái bản sao chưa đổi hoặc ngược lại. Transaction database không tự bảo đảm email, broker và nhà cung cấp ngoài cùng rollback; đó là ranh giới cần nói rõ.

### Câu 50: Có thể mượn sách của cơ sở khác ngay tại quầy này không?
**Trả lời:** Bản sao có cơ sở cụ thể; thủ thư phải tra đúng barcode và đối chiếu nơi giữ sách. Hai cơ sở không có nghĩa sách tự chuyển địa điểm, và đề tài không mặc định đã có luồng luân chuyển liên cơ sở tự động.

## Phần 6 — Đặt trước, giữ sách và không đến nhận

### Câu 51: “Đặt trước” khác “Mượn online” chỗ nào?
**Trả lời:** Mượn online giữ một bản sao có thể cấp phát để chờ nhận; đặt trước đưa bạn đọc vào hàng đợi khi chưa có sách phù hợp. Có lượt đặt trước không đồng nghĩa có một cuốn cụ thể đang giữ cho người đó.

### Câu 52: Khi nào người đặt trước biết đã có sách?
**Trả lời:** Khi hệ thống gán được bản sao phù hợp, yêu cầu chuyển sang sẵn sàng nhận và có hạn đến lấy. Thông báo giúp bạn đọc biết bước tiếp theo; vẫn phải xem đúng cơ sở và phiếu để nhận.

### Câu 53: Một cuốn được trả thì ưu tiên ai?
**Trả lời:** Hệ thống xem hàng đợi đặt trước và điều kiện cơ sở để gán cho người đủ điều kiện tiếp theo. Nếu đã giữ cho người đó thì không đưa lên kệ chung như sách tự do, tránh cấp phát sai người.

### Câu 54: Có được đặt trước quá nhiều sách không?
**Trả lời:** Không. Chính sách giới hạn số yêu cầu hoạt động và luồng xử lý kiểm tra đặt trùng liên quan. Mục đích là tránh một người chiếm nhiều lượt giữ trong khi người khác cần tiếp cận tài liệu.

### Câu 55: Nếu người đặt trước không đến nhận thì cuốn đó bị giữ mãi à?
**Trả lời:** Không. Hết hạn nhận, tác vụ định kỳ giải phóng yêu cầu và xem người chờ tiếp theo. Nếu không gán lại thì bản sao có thể cho mượn và phát sinh công việc kiểm tra/cất kệ, chứ không tạo lượt trả giả.

### Câu 56: Yêu cầu mượn online không đến lấy có giống quá hạn trả không?
**Trả lời:** Không. Chưa được bàn giao là hết hạn nhận và hủy yêu cầu, không phải đang mượn quá hạn. Không được tính phí trễ trả cho thời gian chưa có sách; hai loại hạn phải hiển thị và xử lý riêng.

### Câu 57: Chưa tới lượt mà bạn đọc hủy đặt trước thì sao?
**Trả lời:** Nếu chưa được gán bản sao thì chỉ kết thúc yêu cầu trong hàng đợi. Không có cuốn vật lý được giải phóng nên không tạo công việc cất kệ chỉ vì một lượt chờ bị hủy.

### Câu 58: Đã giữ sách rồi mà bạn đọc hủy thì sao?
**Trả lời:** Hệ thống giải phóng bản sao, ưu tiên gán tiếp cho hàng đợi phù hợp. Nếu không có người tiếp theo thì tạo nhắc việc xếp giá; trạng thái khả dụng không được coi là bằng chứng cuốn đã nằm trên kệ.

### Câu 59: Tác vụ hết hạn chạy chậm thì người đến muộn vẫn nhận được à?
**Trả lời:** Khi xác nhận giao, hệ thống còn phải kiểm tra deadline hiện tại, không chỉ chờ tác vụ nền đổi trạng thái. Tác vụ dọn hàng đợi chạy định kỳ nên màn hình có thể chưa phản ánh tức thì mọi trường hợp hết hạn.

### Câu 60: Cùng lúc thủ thư giao sách và tác vụ nền hủy phiếu thì sao?
**Trả lời:** Cần khóa và kiểm tra lại dữ liệu sống trước khi quyết định. Tác vụ không được dùng danh sách lấy từ trước để hủy một phiếu đã được nhận; đây là trường hợp cạnh tranh phải kiểm chứng trên database.

## Phần 7 — Giao sách và thu cọc

### Câu 61: Cọc được thu lúc đăng ký mượn hay lúc giao sách?
**Trả lời:** Cọc của giao dịch được ghi nhận khi hoàn tất giao sách. Thanh toán chuyển khoản có thể được xác nhận trước bước đó qua đơn payOS; tiền đã trả nhưng chưa giao vẫn phải có bản ghi riêng để đối soát.

### Câu 62: Tiền cọc dựa vào giá sách hay cấu hình nào?
**Trả lời:** Luồng hiện tại lấy số tiền cọc theo chính sách lưu thông đang áp dụng. Không nên nói tự bằng giá bìa hoặc một tỷ lệ cố định nếu source không quy định như vậy; giá đền bù là dữ liệu khác.

### Câu 63: Thủ thư có thể chọn tiền mặt hoặc chuyển khoản không?
**Trả lời:** Có, ở mượn trực tiếp và các luồng xác nhận giao sách. Tiền mặt là xác nhận thu tại quầy; chuyển khoản dùng đơn thanh toán và kiểm tra trạng thái, không chỉ gắn nhãn chuyển khoản cho một giao dịch chưa có bằng chứng.

### Câu 64: Nếu chính sách không thu cọc thì vẫn phải quét QR à?
**Trả lời:** Không. QR thu cọc chỉ có ý nghĩa khi có tiền cần thu. Luồng không yêu cầu cọc phải xử lý theo chính sách, không tạo thanh toán giả để hoàn thành thủ tục.

### Câu 65: Ai quyết định số tiền trên QR, FE có sửa được không?
**Trả lời:** Backend xác định người nhận sách, bản sao và tiền theo chính sách; không tin số tiền do giao diện tự gửi. Như vậy người dùng không thể đổi payload thành số nhỏ hơn mà vẫn coi là đã đủ cọc.

### Câu 66: Nội dung chuyển khoản cọc của em là gì?
**Trả lời:** Mẫu hiện tại là `LMS COC <MSSV>`, lấy MSSV từ dữ liệu bạn đọc ở Backend. Mã đơn vẫn cần để phân biệt thanh toán; nội dung dễ đọc không đủ thay cho định danh và xác minh trạng thái.

### Câu 67: Thủ thư thấy ảnh chuyển khoản thành công có giao sách luôn không?
**Trả lời:** Với luồng payOS, ảnh không phải bằng chứng hệ thống tự chấp nhận. Backend xác nhận đơn đã trả đúng tiền và đúng đối tượng, sau đó thủ thư hoàn tất bàn giao; không dựa riêng vào ảnh hoặc lời báo của bạn đọc.

### Câu 68: Thu cọc xong có cần thủ thư bấm giao nữa không?
**Trả lời:** Có. Đã nhận tiền không chứng minh cuốn sách đã được trao cho bạn đọc. Hệ thống tách thanh toán và bàn giao để không ghi sai người đang giữ sách khi bạn đọc quét xong nhưng chưa nhận.

### Câu 69: Cọc có lưu được ai thu và thu bằng gì không?
**Trả lời:** Giao dịch và các sự kiện cọc lưu dấu phục vụ đối soát, gồm số tiền, phương thức và nhân sự liên quan theo luồng. Báo cáo phải dùng dữ liệu đã ghi nhận, không tự đoán tiền mặt hay chuyển khoản từ tên người dùng.

### Câu 70: Hai thủ thư cùng thu cho một bạn đọc và bản sao có tạo hai QR không?
**Trả lời:** Đơn cọc có ràng buộc một đơn mở cho cùng bạn đọc và bản sao. Khi xử lý lại, cần dùng đơn hiện hữu thay vì thu thêm; ràng buộc này không tự giữ cuốn vật lý trên quầy, nhân viên vẫn phải phối hợp.

## Phần 8 — Gia hạn

### Câu 71: Tại sao cần gia hạn thay vì trả rồi mượn lại?
**Trả lời:** Gia hạn nối dài thời gian của lượt đang mượn khi đủ điều kiện, tránh tạo giao nhận giả. Trả rồi mượn lại có thể vượt qua giới hạn lượt hoặc quyền ưu tiên của người đang đặt trước.

### Câu 72: Những điều kiện nào làm không thể gia hạn?
**Trả lời:** Giao dịch không còn đang mượn hợp lệ, đã quá hạn, hết lượt, chưa vào cửa sổ gia hạn, có người đặt trước hoặc còn phí chưa thanh toán. Hệ thống trả lý do cụ thể để thủ thư giải thích, không chỉ hiện “thất bại”.

### Câu 73: Vì sao phải gần hạn trả mới cho gia hạn?
**Trả lời:** Chính sách đặt cửa sổ trước hạn để bạn đọc xác định nhu cầu thực sự và tránh kéo dài từ quá sớm. Số ngày này do cấu hình, không phải luôn cố định hai ngày cho mọi thư viện.

### Câu 74: Nếu đến đúng ngày cuối cùng thì có được gia hạn không?
**Trả lời:** Cần xét ngày theo múi giờ nghiệp vụ và điều kiện chính sách. Khi chưa qua hạn và đủ điều kiện khác thì có thể hợp lệ; phải test ranh giới đúng hạn, không dùng giờ máy khác múi giờ để suy luận.

### Câu 75: Gia hạn thêm tính từ hôm nay hay từ hạn cũ?
**Trả lời:** Luồng hiện tại cộng thời hạn mượn của chính sách vào hạn trả cũ, rồi tăng số lượt gia hạn. Cách này không làm mất những ngày còn lại và cần hiển thị hạn mới rõ ràng sau khi thành công.

### Câu 76: Vì sao có người đặt trước thì không cho gia hạn?
**Trả lời:** Để bảo vệ quyền tiếp cận của người đang chờ cùng đầu sách. Nếu người đang giữ kéo dài liên tục thì hàng đợi không có ý nghĩa; đây là đánh đổi công bằng theo chính sách hiện thực.

### Câu 77: Thủ thư có thể gia hạn cho bạn đọc không?
**Trả lời:** Có, tại tra cứu sách đang mượn trong trang Lưu thông. Thủ thư vẫn chịu các điều kiện nghiệp vụ, không phải có quyền nhân viên thì được bỏ qua quá hạn, công nợ hoặc giới hạn lượt.

### Câu 78: Sao không đặt nút gia hạn ở Lịch sử giao dịch?
**Trả lời:** Lịch sử chứa cả giao dịch đã trả và đã hủy, dễ gây thao tác sai ngữ cảnh. Gia hạn được đưa về danh sách đang mượn tại quầy; trang lịch sử tập trung tra cứu và đối soát.

### Câu 79: Nút đang sáng mà bấm gia hạn lại bị từ chối thì lỗi à?
**Trả lời:** Có thể dữ liệu đã đổi giữa lúc tải và bấm, như phát sinh đặt trước hoặc nợ. Backend kiểm tra lại là cần thiết; FE phải hiển thị lý do mới và làm mới dữ liệu, không coi trạng thái nút là quyền quyết định cuối cùng.

### Câu 80: Gia hạn nhiều lần có mất dấu số lượt không?
**Trả lời:** Giao dịch lưu số lượt gia hạn và hạn trả hiện tại. Nhưng không nên đồng nhất hai trường này với một bảng lịch sử chi tiết từng lần nếu hệ thống chưa lưu mọi snapshot và tác giả gia hạn.

## Phần 9 — Trả sách, hỏng/mất và tín nhiệm

### Câu 81: Quy trình trả sách tại quầy diễn ra thế nào?
**Trả lời:** Thủ thư xác định barcode, tìm lượt đang mượn, tiếp nhận và xử lý tình trạng sách. Hệ thống ghi người nhận, thời điểm trả, phạt nếu có và quyết toán cọc, rồi xem đặt trước hoặc hàng chờ xếp giá.

### Câu 82: Quét nhầm sách không có lượt đang mượn thì sao?
**Trả lời:** Không được tự tạo lượt trả. Backend phải báo không có giao dịch phù hợp, để thủ thư kiểm tra barcode và tình huống thực tế; tránh hợp thức hóa một cuốn chưa được cho mượn.

### Câu 83: Sách quá hạn được xác định thế nào?
**Trả lời:** Đối chiếu hạn trả với ngày nghiệp vụ khi còn đang mượn hoặc lúc trả. Một nhãn cập nhật nền có thể chậm, nên các màn hình/báo cáo quan trọng cần kiểm tra ngày thực tế, không chỉ tin trạng thái cũ.

### Câu 84: Tiền phạt trễ tính bằng cách nào?
**Trả lời:** Luồng nhận trả lấy số ngày trễ nhân mức phạt mỗi ngày theo chính sách. Em cần chỉ rõ ngày nào và mức nào áp dụng; không nói mọi khoản phạt đều tự tăng liên tục nếu luồng chỉ tạo tiền tại thời điểm xử lý.

### Câu 85: Thủ thư có phân biệt sách bình thường, hỏng và mất không?
**Trả lời:** Có các thao tác xử lý sự cố riêng với trả bình thường. Sách hỏng/mất cần cập nhật tình trạng và khoản bồi thường phù hợp, không đưa về khả dụng chung chỉ vì đã đóng giao dịch mượn.

### Câu 86: Báo mất có nghĩa bạn đọc đã trả cuốn sách không?
**Trả lời:** Không về mặt vật lý. Đây là xử lý sự cố và trách nhiệm bồi thường; bản sao vẫn cần trạng thái mất. Khi trình bày lịch sử phải phân biệt mốc kết thúc nghiệp vụ với việc đã tiếp nhận cuốn dùng được.

### Câu 87: Nếu sau đó tìm lại sách đã báo mất thì sao?
**Trả lời:** Có luồng ghi nhận tìm lại để đưa bản sao trở về quy trình phù hợp với tình trạng thực tế. Tiền phạt đã trả không tự hoàn lại chỉ vì cuốn xuất hiện; vấn đề tài chính cần đối soát riêng, không xóa lịch sử.

### Câu 88: Tìm lại sách mất là tự động cất lên kệ luôn à?
**Trả lời:** Không. Nếu sách dùng được, hệ thống xem nhu cầu giữ cho đặt trước; nếu không có người nhận thì tạo nhắc việc cất kệ. Thủ thư vẫn kiểm tra vật lý và xác nhận sau khi thực sự cất.

### Câu 89: Điểm tín nhiệm có phải điểm AI đánh giá sinh viên không?
**Trả lời:** Không. Đây là chỉ số nghiệp vụ từ hành vi lưu thông và quy tắc đã thiết kế, khác điểm chất lượng gợi ý AI. Nó giúp nhận biết rủi ro, không phải kết luận học lực, đạo đức hay xếp hạng cá nhân toàn diện.

### Câu 90: Trả đúng hạn nhưng sách hỏng thì vẫn được coi là tốt hết à?
**Trả lời:** Không nên gộp mọi việc vào một chỉ số. Đúng hạn là khía cạnh thời gian; tình trạng sách và trách nhiệm bồi thường là khía cạnh khác. Giao diện và báo cáo cần giữ thông tin riêng để thủ thư xử lý đúng.

## Phần 10 — Phí phạt và quyết toán tiền

### Câu 91: Thủ thư nhập nhầm phí phạt thì sửa ở đâu?
**Trả lời:** Tại khu vực thu phí trong Lưu thông, với khoản chưa thanh toán. Trang tra cứu giao dịch vẫn hiển thị phạt và người thu nhưng không có nút sửa, để tách nhật ký đối soát khỏi quầy xử lý.

### Câu 92: Phí đã thanh toán có sửa được không?
**Trả lời:** Không qua chức năng điều chỉnh hiện tại. Đã có dòng tiền thì cần quy trình điều chỉnh/hoàn riêng; sửa trực tiếp sẽ khiến biên nhận và số tiền đã thu không khớp. Đây là guardrail bảo vệ tài chính.

### Câu 93: Số tiền mới được nhập tùy ý à?
**Trả lời:** Không. Luồng hiện tại chấp nhận số nguyên từ 1 đến 10.000.000đ, có giới hạn độ dài lý do và kiểm tra ở Backend. Trên giao diện định dạng đẹp không thay cho việc chặn số âm, số lẻ hoặc vượt giới hạn.

### Câu 94: Khoản chưa trả nhưng đã có QR đang chờ thanh toán thì có sửa không?
**Trả lời:** Luồng điều chỉnh từ chối khi khoản phạt nằm trong đơn thanh toán đang chờ. Nếu thay số tiền trong lúc người dùng trả QR cũ, hệ thống không còn đối chiếu được số đã trả với công nợ đúng.

### Câu 95: Làm sao biết ai đã sửa từ bao nhiêu sang bao nhiêu?
**Trả lời:** Chức năng ghi audit người sửa, số cũ, số mới và lý do nếu có. Audit giúp truy vết trách nhiệm, nhưng không có nghĩa mọi trường trên toàn hệ thống đều có lịch sử phiên bản đầy đủ.

### Câu 96: Đổi tiền phạt có làm tính lại và hoàn cọc lần nữa không?
**Trả lời:** Không. Luồng sửa đồng bộ phần công nợ/quyết toán liên quan nhưng không tự thu lại, cấn lại hoặc viết lại khoản tiền đã hoàn. Dấu vết tiền thực tế phải giữ; điều chỉnh còn lại cần có quy tắc rõ.

### Câu 97: Dấu chấm hàng nghìn có làm API nhận sai số tiền không?
**Trả lời:** Không nếu xử lý đúng. Ô nhập hiển thị `100.000`, nhưng payload phải là số nguyên bản `100000`. Test cần kiểm tra cả người dùng thấy gì và service gửi gì, không chỉ kiểm tra chuỗi hiển thị.

### Câu 98: Tiền cọc có tự coi là tiền phạt không?
**Trả lời:** Không. Cọc là tiền giữ trước, phạt là nghĩa vụ phát sinh. Khi quyết toán có thể cấn cọc vào phạt rồi hoàn phần còn lại hoặc thu thêm, nhưng phải lưu dấu từng phần để không đếm hai lần.

### Câu 99: Cho ví dụ cụ thể quyết toán cọc và phạt?
**Trả lời:** Nếu cọc 50.000đ và phạt 20.000đ, cấn 20.000đ rồi hoàn 30.000đ. Nếu phạt 80.000đ, cấn tối đa 50.000đ và còn nợ 30.000đ. Đây là ví dụ minh họa, số tiền thực tế lấy từ giao dịch và chính sách.

### Câu 100: Cọc thu bằng chuyển khoản thì hệ thống tự chuyển trả qua ngân hàng không?
**Trả lời:** Không được khẳng định vậy. Ghi nhận quyết toán/hoàn cọc trong hệ thống khác việc tự gửi tiền qua ngân hàng; hiện chưa có cơ chế hoàn tiền payOS tự động trong phạm vi tài liệu. Nhân viên phải đối soát dòng tiền thực tế.

## Phần 11 — Thanh toán payOS và ngoại lệ

### Câu 101: Em dùng gì để thanh toán online?
**Trả lời:** Dùng payOS để tạo link/QR và đối chiếu trạng thái thu tiền. Backend giữ thông tin đơn và khóa tích hợp; FE hiển thị cho người dùng. Em không xây một ngân hàng hay tự xử lý toàn bộ giao dịch tài khoản.

### Câu 102: QR của em là ảnh số tài khoản cố định hay gắn với từng lần thu?
**Trả lời:** Luồng dùng đơn có mã, số tiền và link/QR thanh toán tương ứng. Nó giúp ghép tiền nhận với yêu cầu cụ thể; vẫn phải xác minh trạng thái từ provider chứ không coi việc hiển thị QR là đã thu.

### Câu 103: Quét xong thì màn hình biết đã trả bằng cách nào?
**Trả lời:** FE polling API sync và Backend đối chiếu payOS; webhook hợp lệ cũng có thể cập nhật. FE không tự gắn PAID theo lời người dùng. Polling là hỏi lại có chu kỳ, không bảo đảm mọi thay đổi hiện tức thì.

### Câu 104: Vì sao vừa webhook vừa polling, có dư thừa không?
**Trả lời:** Hai cách hỗ trợ độ tin cậy: webhook thông báo từ nhà cung cấp, polling phục vụ cập nhật khi người dùng đang chờ hoặc cần khôi phục trạng thái. Cả hai phải xử lý lặp an toàn để không ghi nhận tiền hai lần.

### Câu 105: Ai đó tự gửi request “đã thanh toán” thì hệ thống tin à?
**Trả lời:** Không. Cần xác minh nguồn/chữ ký và đối chiếu mã đơn, số tiền cùng trạng thái provider. Tham số trên URL quay về hoặc màn hình thành công không đủ làm bằng chứng tiền đã nhận.

### Câu 106: Chuyển thiếu hoặc thừa tiền thì có giao sách không?
**Trả lời:** Đơn cọc phải được xác minh đã trả đúng tiền theo quy tắc hiện tại. Thiếu/thừa hoặc chuyển nhiều lần cần đối chiếu, không mặc định đủ. Không tự xóa đơn hay hoàn qua ngân hàng khi chưa có quy trình được phép.

### Câu 107: Chuyển tiền rồi nhưng mạng mất, người dùng phải trả lại à?
**Trả lời:** Không nên thu lại. Tra đơn hiện hữu và sync/khôi phục theo mã đã lưu; timeout có thể là mất phản hồi dù provider đã nhận. Nếu không xác minh được thì giữ dấu vết và đối soát, không tự kết luận chưa trả.

### Câu 108: Có thể dùng QR đã trả cho một cuốn để nhận cuốn khác không?
**Trả lời:** Không. Đơn cọc gắn với bạn đọc, bản sao, luồng và nguồn phiếu; khi giao phải đối chiếu và chỉ dùng một lần. Đơn PAID không phải chứng từ tự do chuyển sang bất kỳ giao dịch nào.

### Câu 109: Đã trả cọc nhưng phiếu hết hạn hoặc sách không thể giao thì xử lý sao?
**Trả lời:** Không giả lập giao để hợp thức hóa tiền. Đơn đã trả nhưng chưa dùng phải giữ cho đối soát/hoàn theo quy trình nhân sự. Đây là ngoại lệ hiện còn cần xử lý vận hành, không có tự hoàn payOS đầy đủ.

### Câu 110: Đang chờ chuyển khoản, thủ thư đổi sang tiền mặt cho nhanh được không?
**Trả lời:** Không được thu lần nữa khi đơn mở hoặc đã nhận tiền chưa được giải quyết. Chỉ hủy đơn chưa nhận tiền sau xác nhận provider rồi đổi phương thức; đơn đã trả hoặc có tiền một phần phải đối soát.

## Phần 12 — Xếp giá sách và hai cơ sở

### Câu 111: Sách đã trả rồi, sao còn cần tab Xếp giá?
**Trả lời:** Tiếp nhận và đưa về kệ là hai việc khác nhau, có thể do hai ca thực hiện. Tab này lưu danh sách công việc còn ở quầy/giỏ, giúp ca sau biết còn phải cất gì thay vì suy đoán từ lịch sử trả.

### Câu 112: “Có sẵn” có nghĩa sách đang nằm trên kệ không?
**Trả lời:** Không. AVAILABLE là trạng thái có thể cấp phát; cuốn có thể còn chờ cất ở quầy. Hệ thống tách công việc xếp giá để không dùng một trạng thái mô tả cả quyền mượn lẫn vị trí vật lý.

### Câu 113: Chỉ trả sách mới sinh công việc xếp giá à?
**Trả lời:** Không. Còn có hết hạn nhận mượn online, hủy/hết hạn giữ đặt trước và tìm lại sách mất dùng được. Những sự kiện này có thể giải phóng sách mà chưa từng có lượt trả, nên cần hàng công việc riêng.

### Câu 114: Trả sách mà có người đặt trước thì cất lên kệ luôn không?
**Trả lời:** Không theo luồng xếp giá chung. Bản sao được ưu tiên giữ cho người chờ phù hợp; thủ thư để ở khu nhận sách. Cất cùng sách tự do dễ khiến người khác lấy mất bản đã giữ.

### Câu 115: Thủ thư biết mang sách đến đâu và theo thứ tự nào?
**Trả lời:** Danh sách có cơ sở, vị trí và barcode, sắp xếp phục vụ đi cất theo kệ. Nếu thiếu vị trí phải kiểm tra/biên mục lại; phần mềm không tự tạo vị trí chính xác cho một cuốn chưa có dữ liệu.

### Câu 116: Bấm in phiếu xếp giá thì danh sách có bị xóa không?
**Trả lời:** Không. In chỉ phục vụ mang theo và đánh dấu thực tế. Sau khi cất, thủ thư chọn đúng các cuốn đã hoàn thành và xác nhận; không dùng nút xác nhận để dọn danh sách cho đẹp.

### Câu 117: Nếu chỉ cất được một nửa giỏ thì sao?
**Trả lời:** Chọn các cuốn đã cất và xác nhận riêng. Phần còn lại giữ trong hàng chờ database để ca sau tiếp tục. Mặc định chọn nhiều không có nghĩa được xác nhận cả những cuốn chưa xử lý.

### Câu 118: Hai cơ sở có bị xác nhận cất lẫn nhau không?
**Trả lời:** Có bộ lọc cơ sở để giới hạn danh sách và phạm vi xử lý; thủ thư phải kiểm tra cơ sở đang chọn. Không nói hệ thống tự biết vị trí ca trực nếu chưa có nguồn dữ liệu tin cậy xác định cơ sở nhân viên.

### Câu 119: Cuốn đang chờ cất được mượn ngay tại quầy thì task cũ thế nào?
**Trả lời:** Khi bản sao rời trạng thái khả dụng, việc chờ cất được kết thúc là không còn cần thực hiện. Không ghi thành đã cất và không tạo thời điểm cất giả; lần trả sau tạo công việc mới.

### Câu 120: Người khác xác nhận rồi mà em bấm lại thì sao?
**Trả lời:** Xác nhận chỉ cập nhật task còn chờ và bản sao hợp lệ; bản đã xử lý được bỏ qua, không viết đè người/giờ cất. Thủ thư xem số thực sự xác nhận và làm mới, không coi mọi ID gửi lên đều thành công.

## Phần 13 — Tra cứu giao dịch và vòng đời bản sao

### Câu 121: Tại sao trang giao dịch có ba tab?
**Trả lời:** Ba câu hỏi khác nhau: “giao dịch nào đã diễn ra?”, “bạn đọc này đang giữ/nợ gì?” và “cuốn này từng được xử lý ra sao?”. Tách góc nhìn giúp tìm nhanh mà vẫn dựa vào cùng dữ liệu lưu thông.

### Câu 122: Tra cứu được bằng thông tin gì?
**Trả lời:** Nhật ký hỗ trợ mã giao dịch, MSSV, tên bạn đọc, barcode và tên sách; có bộ lọc trạng thái và thời gian. Không yêu cầu thủ thư nhớ ID nội bộ của database khi tiếp nhận nhu cầu tại quầy.

### Câu 123: Chọn khoảng thời gian là lọc ngày mượn hay ngày trả?
**Trả lời:** Nhật ký cho chọn loại ngày. Sách mượn tháng trước nhưng trả hôm nay phải xuất hiện khi lọc ngày trả hôm nay; chỉ lọc ngày mượn sẽ bỏ sót công việc tiếp nhận của ca.

### Câu 124: Chi tiết giao dịch giúp đối soát được gì?
**Trả lời:** Drawer hiển thị các mốc giao/nhận, người thực hiện, cọc/phạt và ghi chú. Với nhiều khoản phạt cần xem từng khoản và người thu, không coi một tên tổng hợp hoặc ID khoản phạt là biên lai đầy đủ.

### Câu 125: Thủ thư có sửa phạt hoặc cho mượn ngay tại trang lịch sử không?
**Trả lời:** Không trong thiết kế hiện tại. Nhật ký phục vụ tra cứu, đối soát và ghi chú; thao tác lưu thông/tài chính ở quầy Lưu thông. Tách này giảm nhầm giữa xem quá khứ và thay đổi nghiệp vụ.

### Câu 126: Tra cứu theo tên bạn đọc trùng nhau có bị lẫn không?
**Trả lời:** Danh sách gợi ý có MSSV và chọn bằng định danh tài khoản, không dùng tên làm khóa lịch sử. Thủ thư vẫn đối chiếu người thực tế và thông tin hồ sơ khi có nhiều người cùng họ tên.

### Câu 127: Vòng đời đầu sách có giống vòng đời một bản sao không?
**Trả lời:** Không. Đầu sách cho tổng quan nhiều bản sao; timeline phải chọn đúng một barcode. Nếu trộn mọi lượt mượn của các cuốn cùng tên thì không xác định được ai từng giữ cuốn đang kiểm tra.

### Câu 128: Timeline có ghi mọi lần hỏng và bảo trì từ lúc nhập kho không?
**Trả lời:** Chỉ hiển thị các mốc có dữ liệu thực tế, như nhập, yêu cầu, giao, trả, phạt và xếp giá. Không dựng lịch sử bảo trì hoặc tình trạng quá khứ từ trạng thái hiện tại nếu hệ thống chưa lưu snapshot đó.

### Câu 129: F5 hoặc quay lại có mất bộ lọc không?
**Trả lời:** Các bộ lọc, tab và trang số được giữ trên URL để khôi phục. Drawer dùng state tại chỗ và có thể khởi tạo từ tham số khi vào trang; không nên hứa mọi trạng thái popup mở/đóng đều luôn được ghi ngược lên URL.

### Câu 130: Vì sao tìm kiếm phải Enter, và mở chi tiết không rời trang?
**Trả lời:** Enter giúp thủ thư gõ/quét xong mới gửi tìm kiếm, tránh request mỗi ký tự. Drawer cho xem tại chỗ giữ cuộn; liên kết tab mới dùng đường dẫn phù hợp HashRouter để không mất phiên tra cứu hiện tại.

## Phần 14 — Excel, PDF và đối soát

### Câu 131: Có bảng trên web rồi, xuất Excel làm gì?
**Trả lời:** Web phục vụ tra cứu và xử lý tại quầy; Excel giúp lọc, đối chiếu và bàn giao số liệu ngoài hệ thống. File phải chứa dữ liệu có phạm vi rõ, không chỉ ảnh chụp hoặc phần trang hiện đang xem.

### Câu 132: Vì sao chuyển từ CSV sang Excel?
**Trả lời:** Excel hỗ trợ nhiều sheet, kiểu số, định dạng bảng và bản in trong một workbook. CSV vẫn hữu ích cho dữ liệu phẳng nhưng khó tổ chức đồng thời tổng quan, sách ngoài thư viện và đối soát tiền một cách dễ dùng.

### Câu 133: File hiện có bao nhiêu sheet và gồm gì?
**Trả lời:** Sáu sheet: tổng quan, Top 100 ấn phẩm mượn nhiều, đang mượn/quá hạn, đã trả trong kỳ, đối soát cọc/phí và bạn đọc cần theo dõi. Em mô tả theo mục đích sử dụng, không chỉ đọc tên sheet.

### Câu 134: Chọn “Hôm nay” thì sách mượn từ tuần trước có trong file không?
**Trả lời:** Có trong sheet đang mượn nếu vẫn còn ngoài thư viện, vì đó là snapshot hiện tại. Sheet đã trả và các sự kiện theo kỳ mới lọc theo thời gian; không dùng một điều kiện ngày cho mọi loại danh sách.

### Câu 135: Cuốn đã trả hôm nay nhưng mượn tháng trước có bị bỏ sót không?
**Trả lời:** Không nếu lọc đúng ngày trả thực tế. Báo cáo tiếp nhận hôm nay dựa vào returned_date, độc lập với ngày mượn; đây là tình huống cần dùng để chứng minh báo cáo đúng mục đích vận hành.

### Câu 136: Ai lập báo cáo, thủ thư có tự nhập tên người khác được không?
**Trả lời:** API lấy người lập từ danh tính đăng nhập phía server. File có kỳ và thời điểm xuất để truy nguồn; tên người lập không nên tin vào ô nhập tùy ý của client.

### Câu 137: File chứa tiền dạng chữ thì có tính tổng được không?
**Trả lời:** Excel giữ tiền/lượt dạng số với định dạng hiển thị phù hợp; ID dài giữ dạng text để tránh mất chữ số. Số nguyên không thêm phần thập phân vô nghĩa, còn chỉ số có phần lẻ dùng kiểu định dạng riêng.

### Câu 138: Báo cáo có thể bị lẫn dữ liệu lúc người khác đang trả sách không?
**Trả lời:** Lần xuất đọc dữ liệu trong transaction có snapshot nhất quán theo thiết kế. Điều đó giúp các sheet cùng phản ánh một thời điểm đọc, nhưng file vẫn là ảnh chụp dữ liệu tại lúc xuất, không cập nhật trực tiếp sau tải.

### Câu 139: Cọc trên báo cáo có bao gồm tiền QR đã trả nhưng chưa giao sách không?
**Trả lời:** Báo cáo lưu thông dựa vào giao dịch và sự kiện cọc khi giao; đơn PAID chưa CONSUMED cần đối chiếu riêng. Không nên gọi số cọc lưu thông là toàn bộ tiền ngân hàng vừa nhận nếu còn đơn chưa bàn giao.

### Câu 140: Xuất PDF là tạo PDF ở server hay in từ trình duyệt?
**Trả lời:** Luồng hiện tại lấy dữ liệu báo cáo và mở preview A4 để in hoặc lưu PDF qua trình duyệt. Excel dùng Apache POI ở Backend; PDF gọn cho ký duyệt, không bê toàn bộ hàng nghìn dòng Excel vào bản in.

## Phần 15 — Cộng đồng, hỗ trợ và thông báo

### Câu 141: Đánh giá sách có giúp ích gì ngoài làm website phong phú?
**Trả lời:** Giúp bạn đọc tham khảo trải nghiệm và trao đổi về tài liệu. Điểm sao/tags là ý kiến cộng đồng, không phải chứng nhận chất lượng; hệ thống cần giữ rõ ai đánh giá và nội dung phản hồi thay vì biến thành lời quảng cáo AI.

### Câu 142: Tại sao nhãn đánh giá phải tách khỏi lời nhận xét?
**Trả lời:** Nhãn giúp đọc nhanh sắc thái, còn nội dung chứa giải thích cụ thể. FE tách prefix được lưu để hiển thị badge và phần nhận xét riêng; việc hiển thị đẹp không đồng nghĩa database đã có bảng tags đánh giá độc lập.

### Câu 143: Yêu thích sách có đồng nghĩa giữ chỗ không?
**Trả lời:** Không. Wishlist thể hiện quan tâm và có thể hỗ trợ gợi ý/thông báo, không chiếm một bản sao. Muốn có quyền nhận theo hàng đợi thì phải đặt trước theo nghiệp vụ tương ứng.

### Câu 144: Tại sao cần lưu lịch sử tìm kiếm và tương tác?
**Trả lời:** Để hỗ trợ trải nghiệm tra cứu/gợi ý khi có dữ liệu thích hợp. Không nên thu vô hạn mọi thông tin; triển khai chính thức cần mục đích, quyền truy cập và chính sách lưu giữ rõ ràng cho dữ liệu cá nhân.

### Câu 145: Thông báo có làm thay đổi trạng thái sách không?
**Trả lời:** Không. Thông báo là kênh báo kết quả/sự kiện, trạng thái nghiệp vụ nằm trong database. Nếu email đến chậm, phải tra hệ thống để xác nhận; không lấy thời điểm nhận email làm thời điểm mượn hoặc trả.

### Câu 146: Form liên hệ khác hệ thống ticket của em thế nào?
**Trả lời:** Ticket có mã, trạng thái, người phụ trách và hội thoại, giúp theo dõi một vấn đề tới khi xử lý. Bạn đọc không chỉ gửi rồi mất dấu, thủ thư cũng có ngữ cảnh và trách nhiệm bàn giao.

### Câu 147: Hai thủ thư cùng nhận một ticket có cùng trả lời không?
**Trả lời:** Luồng nhận xử lý kiểm tra quyền và trạng thái, có cơ chế đồng bộ để xác định người phụ trách. Reply/resolve phải theo người được giao; không nên cho mọi nhân viên trả lời tự do rồi không biết ai chịu trách nhiệm.

### Câu 148: Admin xem được ticket thì có sửa câu trả lời không?
**Trả lời:** Theo thiết kế hiện tại admin giám sát read-only, còn thủ thư được phân công xử lý. Ghi chú nội bộ khác tin nhắn gửi bạn đọc; người dùng không được xem dữ liệu bàn giao nội bộ chỉ vì biết mã ticket.

### Câu 149: Thủ thư đánh dấu xong nhưng bạn đọc chưa hài lòng thì sao?
**Trả lời:** Ticket có cơ chế phản hồi/đánh giá và yêu cầu mở lại trong trạng thái phù hợp. “Đã xử lý” là mốc nhân viên hoàn tất việc, không được coi là bạn đọc mặc nhiên hài lòng.

### Câu 150: Thông báo realtime có nghĩa mọi thay đổi cập nhật tức thì 100% không?
**Trả lời:** Không. Hệ thống dùng kênh cập nhật và có thể phải tải lại/khôi phục khi mất kết nối. Mỗi màn hình cần mô tả hành vi thực tế; realtime không phải bảo đảm không mất tin hoặc đồng bộ mọi widget trong mọi tình huống.

## Phần 16 — Testing: giải thích cho người không đọc code

### Câu 151: Em nói “đã test”, cụ thể em test cái gì?
**Trả lời:** Em kiểm tra logic, thao tác giao diện, API và dữ liệu PostgreSQL bằng các nhóm test phù hợp; có thêm bằng chứng smoke/tải đã lưu. Mỗi nhóm có phạm vi, không dùng một kết quả xanh để kết luận toàn bộ hệ thống hoàn hảo.

### Câu 152: Em dùng những công cụ kiểm thử nào?
**Trả lời:** FE dùng Jest và Testing Library; BE dùng JUnit, Mockito, MockMvc và Testcontainers; AI dùng pytest và benchmark. Em giải thích công cụ kiểm tra phần nào: giao diện, quyết định nghiệp vụ, HTTP, database thật hay chất lượng xếp hạng.

### Câu 153: Unit test là gì, nói ví dụ nghiệp vụ thôi?
**Trả lời:** Là kiểm tra một phần nhỏ có điều kiện rõ. Ví dụ khoản đã PAID thì sửa số tiền phải bị từ chối và không ghi dữ liệu. Nó giúp phát hiện sai quy tắc nhanh, nhưng chưa chứng minh cả quy trình trình duyệt–server hoạt động.

### Câu 154: Integration test khác unit test thế nào?
**Trả lời:** Integration test kiểm tra các phần phối hợp, như query và constraint trên PostgreSQL thật trong môi trường biệt lập. Mock repository có thể trả dữ liệu đúng giả định trong khi câu SQL thật sai; vì vậy cần mức này cho dữ liệu và giao dịch.

### Câu 155: Vì sao không chỉ tự bấm thử trên web?
**Trả lời:** Bấm thử quan trọng cho bố cục và trải nghiệm, nhưng khó lặp đầy đủ sau mỗi lần sửa. Test tự động bảo vệ các trường hợp xác định; kiểm tra thủ công bổ sung phần thị giác, tích hợp hoặc ngoại lệ chưa tự động hóa.

### Câu 156: Test FE có mở trình duyệt thật không?
**Trả lời:** Jest hiện chủ yếu chạy trong jsdom với mock và tương tác mô phỏng. Nó kiểm tra hành vi component, không đo chính xác bố cục, scroll hay quy trình với BE thật. Không nên gọi mọi test FE là E2E trình duyệt.

### Câu 157: Mock là gì, dùng mock có phải gian lận kết quả không?
**Trả lời:** Mock thay một phụ thuộc bằng phản hồi kiểm soát để kiểm tra điều kiện cụ thể, như payOS lỗi. Nó là công cụ hợp lệ nếu nói rõ phạm vi; sai là dùng mock rồi tuyên bố đã xác nhận provider/database thật hoạt động.

### Câu 158: Có nhiều test thì có nghĩa chất lượng cao không?
**Trả lời:** Không đủ. Test phải kiểm tra kết quả đúng và rủi ro quan trọng; nhiều test chỉ kiểm tra render được vẫn có thể bỏ sót tiền/phân quyền. Em trình bày ví dụ lỗi được bắt, không dùng số lượng thay cho chất lượng.

### Câu 159: “100% pass” có nghĩa không còn bug không?
**Trả lời:** Không. Nó chỉ nói các trường hợp đã chạy đều đạt kỳ vọng tại phiên bản và môi trường đó. Coverage 100% cũng khác pass 100%; cả hai không chứng minh mọi nhu cầu thực tế hoặc mọi dữ liệu đều đã được kiểm tra.

### Câu 160: Bộ quy tắc viết test của em để làm gì khi có người mới?
**Trả lời:** Quy định khi nào cần test, cách đặt tên, chuẩn bị dữ liệu, kiểm tra thành công/lỗi/biên và lệnh chạy. CONTRIBUTING, tài liệu BE/FE và checklist PR giúp người mới áp dụng; CI và review mới giúp kiểm tra việc tuân thủ.

## Phần 17 — Testing: tình huống nghiệp vụ và dữ liệu

### Câu 161: Sửa một lỗi rồi em làm gì để nó không quay lại?
**Trả lời:** Bổ sung test hồi quy tái hiện đúng điều kiện lỗi, rồi xác nhận hành vi sau sửa. Ví dụ tìm kiếm không gửi mỗi ký tự, hoặc khoản đã thanh toán không được chỉnh sửa; test không chỉ kiểm tra thông báo thành công chung chung.

### Câu 162: Em kiểm tra gia hạn bằng các trường hợp nào?
**Trả lời:** Cần có đủ điều kiện, quá hạn, hết lượt, trước cửa sổ, có đặt trước và còn nợ. Ranh giới đúng ngày mở/đúng hạn rất quan trọng; thời gian phải được kiểm soát để test không đổi kết quả chỉ vì sang ngày mới.

### Câu 163: Kiểm tra phân quyền thì chỉ đăng nhập admin và thủ thư là đủ à?
**Trả lời:** Chưa. Cần chưa đăng nhập, sai vai trò và truy cập đối tượng của người khác. FE có thể ẩn nút đúng nhưng API vẫn hở; test phải kiểm tra phía server và không mock bỏ qua chính cơ chế quyền cần xác minh.

### Câu 164: Em kiểm tra xếp giá ngoài trường hợp sách trả bình thường thế nào?
**Trả lời:** Có các tình huống giải phóng giữ, gán lại cho đặt trước, mượn ngay khi đang chờ cất và xác nhận lặp. Cần thêm phạm vi cơ sở và trạng thái đổi trong lúc thao tác, không chỉ kiểm tra danh sách trống sau bấm.

### Câu 165: Chống hai người mượn cùng bản sao được chứng minh bằng mock không?
**Trả lời:** Không đầy đủ. Mock có thể chứng minh thứ tự gọi nhưng không chứng minh khóa/constraint thực tế. Trường hợp cạnh tranh cần transaction hoặc connection riêng trên PostgreSQL và xác nhận chỉ một kết quả cấp phát hợp lệ.

### Câu 166: Vì sao phải dùng PostgreSQL trong test SQL?
**Trả lời:** Dự án dùng tính năng và quy tắc của PostgreSQL; database thay thế có thể khác kiểu dữ liệu, JOIN, constraint hoặc khóa. Testcontainers dựng database test riêng để kiểm chứng mà không đụng dữ liệu thư viện thật.

### Câu 167: Docker không chạy thì em bỏ test cho xanh được không?
**Trả lời:** Không nên che lỗi. Lượt chạy hiện có 248 pass, 25 skip và 1 error do môi trường Docker; em phải báo rõ và chạy lại khi đủ điều kiện. Test skip không chứng minh nghiệp vụ SQL đã đúng trong lượt đó.

### Câu 168: Test migration cần kiểm tra gì ngoài việc file SQL chạy được?
**Trả lời:** Cần kiểm tra quan hệ, default/constraint, dữ liệu có sẵn và nâng cấp schema liên quan. Với seed phải kiểm tra không xung đột khóa và không làm lệch công nợ/trạng thái; database trống chạy được chưa chứng minh nâng cấp an toàn.

### Câu 169: Lỗi đếm bản sao do JOIN thì test như thế nào?
**Trả lời:** Tạo một đầu sách có vài bản sao và nhiều lượt đánh giá/mượn, rồi kiểm tra số khả dụng vẫn bằng số bản sao thật. Dữ liệu chỉ một dòng mỗi bảng không lộ việc nhân bản khi JOIN.

### Câu 170: Test báo cáo tài chính có cần dùng tiền thật không?
**Trả lời:** Không. Dữ liệu test có các sự kiện thu, hoàn, cấn cọc và phạt đủ để đối chiếu tổng đúng. Test tích hợp provider có thể cần sandbox/cấu hình được phép, nhưng unit test và SQL test không tạo chuyển khoản production.

## Phần 18 — Testing: API, AI, tải và bằng chứng

### Câu 171: Backend sửa API thì làm sao biết Frontend không bị hỏng?
**Trả lời:** Backend CI hiện chạy thêm Jest, TypeScript và build FE. Đây là lớp kiểm tra chéo ban đầu; nếu đổi hợp đồng API phải cập nhật test hai phía và kiểm chứng tích hợp, vì mock cũ có thể khiến FE vẫn xanh.

### Câu 172: Hợp đồng API là gì mà cần kiểm tra?
**Trả lời:** Là cách hai phía thỏa thuận endpoint, tham số, field, kiểu, nullability và lỗi. Ví dụ BE đổi fineAmount sang amount nhưng FE vẫn đọc tên cũ thì màn hình sai dù HTTP trả 200 và unit test riêng có thể vẫn pass.

### Câu 173: CI hiện đã tự mở website gọi BE thật để test toàn luồng chưa?
**Trả lời:** Chưa có bộ E2E chung như vậy trong phạm vi đã xác minh. Hướng tiếp theo là dựng database, BE và FE biệt lập, rồi dùng công cụ trình duyệt như Playwright kiểm tra luồng trọng yếu; em không gọi cấu hình này là đã hoàn thành.

### Câu 174: Làm sao kiểm tra chất lượng AI chứ không chỉ API trả 200?
**Trả lời:** Dùng bộ câu hỏi/tài liệu có tiêu chí và kết quả liên quan để đo tìm kiếm, gợi ý, tags/tóm tắt. HTTP 200 là hoạt động kỹ thuật; trả đúng sách, đúng nội dung và trong thời gian chấp nhận được mới là chất lượng sử dụng.

### Câu 175: Precision, Recall và MRR giải thích dễ hiểu như thế nào?
**Trả lời:** Precision hỏi trong các kết quả đưa ra có bao nhiêu đúng; Recall hỏi tìm được bao nhiêu trong các tài liệu liên quan; MRR phản ánh kết quả đúng đầu tiên có ở vị trí sớm không. Các chỉ số không thay thế nhau.

### Câu 176: Điểm benchmark AI cao có nghĩa mọi câu hỏi thực tế đều đúng không?
**Trả lời:** Không. Điểm chỉ đại diện tập đánh giá, cách gán nhãn và điều kiện chạy. Cần nói rõ mẫu, ngày đo, phiên bản và các trường hợp yếu; không gọi một điểm tổng hợp do đề tài thiết kế là chứng nhận độc lập.

### Câu 177: Ba test AI bị skip nghĩa là gì?
**Trả lời:** Báo cáo lưu có 72 pass, 3 skip; test live yêu cầu dịch vụ/cấu hình phù hợp nên không được hiểu là đã pass. Khi trình bày phải ghi ngày và điều kiện, không nói tất cả live API đều được kiểm chứng trong lượt offline đó.

### Câu 178: Tóm tắt AI nghe đúng thì có cần kiểm tra nữa không?
**Trả lời:** Có. Guard JSON/độ dài không chứng minh đúng nội dung; cần đối chiếu tài liệu nguồn và rubric. Đánh giá trên output mới có truy vết phiên bản, giữ cả các ca khó/thất bại, không chọn riêng kết quả đẹp để kết luận chất lượng.

### Câu 179: Em nói chịu được 200 người dùng, có phải 200 sinh viên dùng thật đồng thời không?
**Trả lời:** Không. Báo cáo là 200 người dùng ảo trong kịch bản đọc và thời gian xác định. Tỷ lệ lỗi 0% nhưng độ trễ tăng; không suy rộng sang 200 người cùng giao sách, thanh toán hoặc xử lý PDF.

### Câu 180: Smoke test 8/8 pass thì có cần các test khác không?
**Trả lời:** Có. Smoke chỉ xác nhận một số đường truy cập/guard quan trọng còn hoạt động. Không bao phủ mọi mượn–trả, tài chính hoặc bảo mật; báo cáo production cũ phải ghi ngày, không coi là kiểm tra trực tiếp hôm nay.

## Phần 19 — Triển khai và vận hành

### Câu 181: Website của em đang chạy như thế nào ngoài máy cá nhân?
**Trả lời:** Có cấu hình triển khai bằng Docker Compose trên máy chủ, phục vụ qua domain và reverse proxy. FE, BE, AI và các phụ thuộc chạy thành dịch vụ; cần phân biệt cấu hình có trong repo với dịch vụ/profile thực sự đã bật.

### Câu 182: Em dùng công nghệ gì cho các phần chính?
**Trả lời:** React/TypeScript cho giao diện, Spring Boot/Java cho nghiệp vụ, PostgreSQL cho dữ liệu và Python/FastAPI cho AI. Khi hỏi vì sao, em gắn mỗi công nghệ với vai trò; không cần đọc tất cả phiên bản để chứng minh hiểu dự án.

### Câu 183: Backend của em là microservices hết à?
**Trả lời:** Không. Backend nghiệp vụ là modular monolith: chia module nhưng triển khai cùng ứng dụng; AI tách dịch vụ riêng. Cách này giữ transaction nghiệp vụ dễ quản lý mà vẫn tách tải và thư viện AI, không đánh đồng nhiều container với microservices hoàn chỉnh.

### Câu 184: Docker giúp gì, có tự làm hệ thống an toàn không?
**Trả lời:** Docker đóng gói môi trường và dependencies để chạy nhất quán, Compose mô tả cách dịch vụ phối hợp. Bảo mật, backup và cấu hình vẫn phải làm riêng; container không tự chứng minh hệ thống không có lỗi hoặc không mất dữ liệu.

### Câu 185: Ai nhận request từ domain rồi chuyển tới các dịch vụ?
**Trả lời:** Cấu hình production dùng Caddy làm cửa vào HTTPS/reverse proxy, FE có Nginx phục vụ file đã build. Người dùng không cần biết từng cổng nội bộ; không nên chỉ nói “Nginx làm hết” khi sơ đồ triển khai có cả hai vai trò.

### Câu 186: Database có bị xóa mỗi lần build/deploy không?
**Trả lời:** Dữ liệu PostgreSQL được giữ trong volume riêng, không nằm chỉ trong lớp container ứng dụng. Deploy bình thường không xóa volume; lệnh phá hủy volume vẫn nguy hiểm. Volume tồn tại cũng không thay cho backup.

### Câu 187: Flyway để làm gì khi cập nhật hệ thống?
**Trả lời:** Flyway quản lý thay đổi database theo version và checksum, giúp môi trường biết migration nào đã áp dụng. Không sửa migration đã chạy để làm lại tùy ý; nâng cấp cần file mới, kiểm tra trước và kế hoạch phục hồi.

### Câu 188: Mật khẩu database và khóa payOS đặt ở đâu?
**Trả lời:** Dùng cấu hình môi trường/secret của triển khai và CI, không đưa vào FE hay commit mã nguồn. Biến VITE được build vào client không phải nơi giữ bí mật; việc không thấy trên UI không có nghĩa người dùng không đọc được.

### Câu 189: Tại sao cần Kafka và RabbitMQ, dùng một cái không được à?
**Trả lời:** Hiện Kafka phục vụ các sự kiện/thông báo phía BE, RabbitMQ phục vụ hàng tác vụ Celery của AI. Có thể nghiên cứu hợp nhất nếu phù hợp, nhưng thiết kế hiện tách hai mục đích; broker không tự bảo đảm mọi hiệu ứng đúng một lần.

### Câu 190: Upload PDF lâu thì người dùng có phải chờ trang treo không?
**Trả lời:** Xử lý tài liệu có worker/tác vụ nền và trạng thái để theo dõi. HTTP tiếp nhận thành công không đồng nghĩa vector/tóm tắt đã sẵn sàng; giao diện cần phản ánh đang xử lý hoặc lỗi, không tự dùng kết quả chưa hoàn thành.

## Phần 20 — CI/CD, giới hạn và câu hỏi chốt

### Câu 191: CI/CD là gì, em giải thích bằng quy trình dự án?
**Trả lời:** CI tự kiểm tra test/build khi thay đổi phù hợp; CD thực hiện triển khai theo điều kiện workflow. Mục tiêu là lặp lại quy trình có kiểm soát, không phải cứ push là bỏ qua mọi kiểm chứng và cập nhật server.

### Câu 192: Sửa BE thì test FE có chạy không, FE có bị deploy lại không?
**Trả lời:** Có job kiểm tra FE trong Backend CI, chạy cùng job BE. Job đó không kích hoạt Frontend CD riêng; BE/FE checks đều cần thành công để Backend CD tự động chạy theo workflow hiện tại.

### Câu 193: Nếu một test FE lỗi thì Backend còn được deploy không?
**Trả lời:** Nhánh triển khai tự động sau Backend CI thành công sẽ không chạy khi workflow thất bại. Tuy nhiên vẫn có workflow_dispatch triển khai thủ công; không nên nói mọi đường deploy đều bị chặn tuyệt đối bởi gate nếu cấu hình còn cho phép cách đó.

### Câu 194: Người mới có thể bỏ qua checklist rồi push thẳng main không?
**Trả lời:** Checklist và tài liệu không tự chặn push. Muốn cưỡng chế cần ruleset/branch protection, review và required checks phù hợp; em phải kiểm tra cài đặt GitHub thực tế trước khi tuyên bố đã bắt buộc mọi thành viên.

### Câu 195: Nếu FE chạy nhanh hơn BE thì có bị lệch phiên bản không?
**Trả lời:** Có rủi ro khi deploy độc lập và thay API không tương thích. Kiểm tra FE trong Backend CI giảm một phần rủi ro nhưng không đồng bộ mọi đợt deploy; nên giữ API tương thích và tiến tới kiểm tra tích hợp/triển khai cùng phiên bản xác định.

### Câu 196: CI đã kiểm tra một commit thì server chắc chắn chạy đúng commit đó chưa?
**Trả lời:** Chưa được khẳng định tuyệt đối khi script deploy còn pull main lúc triển khai, vì main có thể tiến thêm. Hướng cải thiện là dùng SHA/image đã kiểm tra và kiểm tra sau deploy; không nói đã có cơ chế ghim phiên bản nếu chưa hiện thực.

### Câu 197: Nếu deploy lỗi hoặc migration sai thì xử lý thế nào?
**Trả lời:** Dừng thao tác gây thêm dữ liệu, xem log/health và đối chiếu phiên bản. Workflow BE có bước backup trước triển khai; phục hồi hoặc quay bản ứng dụng cần xét schema, không chỉ pull code cũ rồi mong database tự quay lại.

### Câu 198: Em giám sát và kiểm tra sau triển khai bằng gì?
**Trả lời:** Có healthcheck, log và cấu hình observability/backup trong dự án; một số profile cần bật riêng. Endpoint health thành công chưa chứng minh quầy mượn hoạt động đúng, nên cần smoke/kiểm tra luồng phù hợp và không tuyên bố profile có cấu hình là đang chạy.

### Câu 199: Theo em hệ thống còn hạn chế gì đáng nói nhất?
**Trả lời:** Chưa có gate E2E FE–BE chung; AI còn phụ thuộc chất lượng dữ liệu và tập đánh giá; ngoại lệ tiền đã trả nhưng chưa giao cần đối soát vận hành. Triển khai chính thức còn cần chính sách dữ liệu, kiểm thử tải sát nghiệp vụ và quy trình nhân sự.

### Câu 200: Nếu tiếp tục đề tài, em ưu tiên làm gì trước?
**Trả lời:** Em ưu tiên độ tin cậy trước thêm tính năng: hoàn thiện E2E trọng yếu, triển khai đúng artifact đã kiểm tra, đối soát/hoàn tiền có quy trình và cải thiện dữ liệu đánh giá AI. Các bước này trực tiếp giảm rủi ro khi đưa vào sử dụng thực tế.

## Tài liệu đối chiếu khi luyện trả lời

- [Quy tắc đóng góp và kiểm thử](CONTRIBUTING.md), [test BE](LMS_BE/docs/TESTING.md), [test FE](LMS_FE/docs/TESTING.md).
- [Xếp giá sách](LMS_BE/docs/RESHELVING.md), [thu cọc payOS](LMS_BE/docs/DEPOSIT_PAYOS.md), [phương thức thu cọc](LMS_BE/docs/DEPOSIT_PAYMENT_METHOD.md).
- [Trung tâm tra cứu](LMS_BE/docs/TRANSACTION_INQUIRY.md), [xuất báo cáo](LMS_BE/docs/OPERATIONAL_REPORT_EXPORT.md), [nguồn gốc seed](LMS_BE/docs/DEMO_SEED_V62.md).
- [Tổng quan dự án](learn/07_PROJECT_DEEP_DIVE.md), [ticket hỗ trợ](learn/08_CONTACT_TICKETS.md), [chiến lược đánh giá AI](LMS_AI/AI_TESTING_STRATEGY.md).
- [Bằng chứng kiểm thử đã lưu](LMS_LATEX/figures/test-results), [Backend CI](.github/workflows/backend-ci.yml), [Backend CD](.github/workflows/backend-cd.yml), [cấu hình production](docker-compose.prod.yml).

## Gợi ý luyện tập

1. Lượt đầu luyện câu 1–150 bằng cách đi theo màn hình demo, không mở code.
2. Lượt sau luyện câu 151–200 và tập phân biệt “có test” với “đã kiểm chứng tích hợp thật”.
3. Khi bị hỏi tình huống mới, xác định người thực hiện, đối tượng, trạng thái trước/sau và dữ liệu tiền liên quan rồi mới nêu cách xử lý.
4. Nếu không nhớ con số, xin đối chiếu báo cáo; không đoán hoặc trộn kết quả các thời điểm.
5. Có thể nói “phần này hiện chưa tự động, em đề xuất…” khi đúng thực trạng. Trả lời rõ giới hạn tốt hơn khẳng định quá mức.

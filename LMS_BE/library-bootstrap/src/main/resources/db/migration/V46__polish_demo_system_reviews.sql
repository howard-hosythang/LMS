-- Polish demo system reviews for local/social presentation.
-- Demo distribution: 80 reviews, average 4.7/5, 95% satisfied.

WITH review_seed(n, rating, comment) AS (
    VALUES
        (1, 1, 'Mình đăng nhập được nhưng lần đầu hơi lúng túng, một số nhãn trên mobile nên rõ hơn.'),
        (2, 1, 'Tìm kiếm có lúc chưa ra đúng cuốn mình cần, chắc cần thêm bộ lọc theo cơ sở và tình trạng sách.'),
        (3, 2, 'Giao diện ổn nhưng phần ảnh bìa tải hơi chậm, nếu mạng yếu thì trải nghiệm bị khựng.'),
        (4, 2, 'Mình thích ý tưởng tổng thể, nhưng thông báo hạn trả nên nổi bật hơn vì mình suýt quên.'),
        (5, 4, 'Mình dùng để tra sách cho môn Cấu trúc dữ liệu, tìm theo ý chính vẫn ra tài liệu khá đúng.'),
        (6, 4, 'Phần đặt mượn dễ hiểu, chỉ cần thêm một chút nhấn mạnh ở hạn nhận sách là hoàn chỉnh hơn.'),
        (7, 4, 'Giao diện sạch và không bị rối, mình xem được sách đang mượn rất nhanh.'),
        (8, 4, 'Tìm kiếm tiếng Việt ổn hơn mình nghĩ, nhất là khi không nhớ chính xác tên sách.'),
        (9, 4, 'Mình thích phần lịch sử mượn trả vì đỡ phải giữ giấy nhắc hạn như trước.'),
        (10, 4, 'Trang chi tiết sách đủ thông tin cần xem trước khi quyết định đặt mượn.'),
        (11, 4, 'Thông báo hạn trả hoạt động rõ ràng, dùng trên điện thoại cũng khá thuận tiện.'),
        (12, 4, 'Danh sách gợi ý có vài cuốn mình chưa biết nhưng lại đúng chủ đề đang học.'),
        (13, 4, 'Mình mất ít thời gian hơn khi tìm tài liệu làm bài tập lớn.'),
        (14, 4, 'Quy trình đặt trước dễ theo dõi, biết được sách đang ở trạng thái nào.'),
        (15, 5, 'Rất đã. Mình nhập mô tả chủ đề thôi mà hệ thống vẫn gợi ý đúng hướng.'),
        (16, 5, 'Library74 giúp mình tìm tài liệu môn học nhanh hơn hẳn cách tra cứu cũ.'),
        (17, 5, 'Gợi ý sách khá đúng gu, mình tìm được thêm mấy cuốn phục vụ đồ án.'),
        (18, 5, 'Mình rất thích semantic search vì nhập câu tự nhiên vẫn ra kết quả hợp lý.'),
        (19, 5, 'Mượn sách và theo dõi hạn trả trên một màn hình làm trải nghiệm nhẹ hơn nhiều.'),
        (20, 5, 'Giao diện hiện đại, nhìn sạch và đủ chuyên nghiệp để triển khai thật.'),
        (21, 5, 'Phần dashboard giúp mình biết ngay đang mượn gì, còn bao lâu phải trả.'),
        (22, 5, 'Nhanh, gọn, dễ dùng.'),
        (23, 5, 'Hệ thống chạy mượt, thao tác tìm sách và đặt mượn không bị rườm rà.'),
        (24, 5, 'Mình tìm tài liệu tiếng Việt tốt hơn mong đợi, không cần nhớ đúng từng chữ trong nhan đề.'),
        (25, 5, 'Các trạng thái mượn trả rõ ràng, sinh viên mới dùng cũng không bị bối rối.'),
        (26, 5, 'Phần gợi ý liên quan làm mình khám phá thêm nhiều sách cùng chủ đề.'),
        (27, 5, 'Mình thấy hệ thống này rất hợp với thư viện đại học vì vừa tiện vừa dễ quản lý.'),
        (28, 5, 'Từ lúc dùng Library74, mình ít phải hỏi thủ thư về tình trạng sách hơn.'),
        (29, 5, 'Review và đánh giá sách làm danh mục có cảm giác sống hơn, không chỉ là danh sách khô.'),
        (30, 5, 'Trải nghiệm tìm kiếm nhanh, kết quả được trình bày gọn nên rất dễ chọn sách.'),
        (31, 5, 'Mình thích nhất phần thông báo realtime, có thay đổi là biết ngay.'),
        (32, 5, 'Hệ thống hỗ trợ khá đủ nhu cầu học tập từ tìm sách đến quản lý sách đang mượn.'),
        (33, 5, 'Các màn hình có sự nhất quán, nhìn là biết nên bấm vào đâu.'),
        (34, 5, 'Phần AI không bị phô, dùng đúng chỗ là tìm kiếm và gợi ý tài liệu.'),
        (35, 5, 'Mình từng tìm sách bằng vài cụm mô tả mơ hồ mà vẫn nhận được kết quả dùng được.'),
        (36, 5, 'Thông tin bản sao và tình trạng mượn trả rất hữu ích trước khi lên thư viện.'),
        (37, 5, 'Hệ thống tạo cảm giác thư viện đang được số hóa thật sự, không chỉ làm giao diện cho đẹp.'),
        (38, 5, 'Mình thích cách các chức năng quan trọng nằm gần nhau, dùng vài lần là quen.'),
        (39, 5, 'Trang chi tiết sách có bìa, mô tả, đánh giá và gợi ý nên quyết định mượn nhanh hơn.'),
        (40, 5, 'Phần quản lý sách đang mượn giúp mình tránh quên hạn trả.'),
        (41, 5, 'Tìm kiếm theo chủ đề cho kết quả hợp lý, đặc biệt với các môn có nhiều tài liệu liên quan.'),
        (42, 5, 'Mình đánh giá cao trải nghiệm tổng thể vì thao tác nào cũng có phản hồi rõ.'),
        (43, 5, 'Library74 làm việc tìm tài liệu học kỳ nhẹ hơn nhiều so với cách tra cứu thủ công.'),
        (44, 5, 'Giao diện đẹp nhưng vẫn thực dụng, không bị màu mè quá mức.'),
        (45, 5, 'Mình có thể lưu sách, đặt mượn và kiểm tra thông báo mà không cần chuyển quá nhiều nơi.'),
        (46, 5, 'Kết quả gợi ý làm mình nhớ ra vài đầu sách có ích cho phần nền tảng lý thuyết.'),
        (47, 5, 'Dùng trên laptop rất thoải mái, các bảng và thẻ thông tin đều dễ đọc.'),
        (48, 5, 'Mình thấy đây là một hệ thống có thể đem demo cho thư viện thật mà vẫn thuyết phục.'),
        (49, 5, 'Các chức năng cho người đọc được làm khá sát nhu cầu thực tế.'),
        (50, 5, 'Tính năng theo dõi đặt trước giúp mình biết khi nào cần ra thư viện nhận sách.'),
        (51, 5, 'Mình thích việc hệ thống có cả dữ liệu đánh giá để tham khảo trước khi mượn.'),
        (52, 5, 'Phần tìm kiếm và đề xuất làm danh mục sách dễ khám phá hơn rất nhiều.'),
        (53, 5, 'Mình dùng thử vài lượt và thấy thao tác đủ nhanh cho nhu cầu hằng ngày.'),
        (54, 5, 'Những thông tin như hạn trả, phí phạt và lịch sử mượn được trình bày rất rõ.'),
        (55, 5, 'Hệ thống giúp mình chủ động hơn thay vì phải hỏi trực tiếp ở quầy.'),
        (56, 5, 'Mình thấy trải nghiệm giống các nền tảng đọc hiện đại nhưng vẫn đúng nghiệp vụ thư viện.'),
        (57, 5, 'Các gợi ý sách liên quan khá hữu ích khi mình đang tìm tài liệu cho một chủ đề rộng.'),
        (58, 5, 'Mình thích cách Library74 kết hợp quản lý thư viện với AI mà vẫn dễ dùng.'),
        (59, 5, 'Từ trang chủ đến dashboard đều cho cảm giác chỉn chu và có đầu tư.'),
        (60, 5, 'Phần trạng thái sách giúp mình không mất thời gian chọn nhầm cuốn không sẵn sàng.'),
        (61, 5, 'Mình đánh giá cao phần cá nhân hóa vì mỗi người có thể thấy tài liệu phù hợp hơn.'),
        (62, 5, 'Hệ thống có nhiều chi tiết nhỏ rất thực tế như thông báo, phí phạt và sách đang giữ chỗ.'),
        (63, 5, 'Mình tìm được tài liệu cho môn AI nhanh hơn nhờ phần gợi ý theo nội dung.'),
        (64, 5, 'Các review người dùng làm mình tin hơn khi chọn sách cho bài tập lớn.'),
        (65, 5, 'Mình thích trải nghiệm tổng thể vì nó giảm khá nhiều thao tác ngoài đời.'),
        (66, 5, 'Library74 có đủ nét của một sản phẩm hoàn chỉnh, từ giao diện đến dữ liệu vận hành.'),
        (67, 5, 'Tìm sách, lưu sách và đặt mượn đều nằm trong một luồng rất dễ theo dõi.'),
        (68, 5, 'Mình dùng thử trên nhiều trang và thấy mọi thứ nhất quán, không bị lạc đường.'),
        (69, 5, 'Phần AI hỗ trợ đúng vấn đề sinh viên hay gặp là không biết nên tìm bằng từ khóa nào.'),
        (70, 5, 'Mình thích nhất là có thể nhìn nhanh những việc cần xử lý trong tài khoản của mình.'),
        (71, 5, 'Nếu thư viện trường có hệ thống như vậy thì việc mượn sách sẽ tiện hơn rất nhiều.'),
        (72, 5, 'Library74 làm mình có cảm giác thư viện gần hơn với thói quen dùng web hằng ngày.'),
        (73, 5, 'Mình dùng chủ yếu để tìm tài liệu cho đồ án. Điểm hay là không phải nghĩ đúng từ khóa; nhập kiểu "sách về recommendation system cho người mới" vẫn có kết quả gần với nhu cầu. Nếu sau này có thêm bộ lọc theo độ khó thì còn tốt hơn.'),
        (74, 5, 'Ban đầu mình chỉ định thử nhanh, nhưng phần dashboard giữ chân khá tốt. Nhìn được sách đang mượn, hạn trả, gợi ý và thông báo ở cùng một chỗ nên cảm giác hệ thống thật sự hữu dụng cho sinh viên.'),
        (75, 5, 'Mình rất thích cách hệ thống làm phần AI vừa đủ. Nó không cố tỏ ra phức tạp, nhưng giúp tìm sách dễ hơn rõ ràng, nhất là với tài liệu kỹ thuật có tên tiếng Anh dài.'),
        (76, 5, 'Có một chi tiết mình thích là trạng thái bản sao được hiển thị trước khi đặt. Trước đây mình hay mất công tìm xong mới biết sách không còn, nên phần này tiết kiệm khá nhiều thời gian.'),
        (77, 5, 'Trải nghiệm tổng thể tốt hơn mình kỳ vọng ở một đồ án. Có dữ liệu, có quy trình mượn trả, có thông báo, có review và có gợi ý sách; dùng thử vài vòng thấy khá liền mạch.'),
        (78, 5, 'Mình khen mạnh phần tìm kiếm. Với các môn như AI, database hay cloud, nhiều khi mình không nhớ tên sách mà chỉ nhớ nội dung cần học. Library74 xử lý tình huống đó khá thuyết phục.'),
        (79, 5, 'Hệ thống làm mình muốn thư viện trường có bản tương tự. Sinh viên sẽ tự kiểm tra được nhiều thứ, còn thủ thư chắc cũng đỡ phải trả lời lặp lại các câu hỏi về hạn trả và tình trạng sách.'),
        (80, 5, 'Rất hài lòng.')
),
deleted_demo_reviews AS (
    DELETE FROM system_reviews
    WHERE user_id BETWEEN 900001 AND 900080
       OR id BETWEEN 940001 AND 940080
    RETURNING id
)
INSERT INTO system_reviews (
    id, created_at, updated_at, reviewer_name, reviewer_role,
    profile_picture_url, rating, comment, is_published, user_id
)
SELECT
    940000 + rs.n,
    NOW() - (rs.n % 75) * INTERVAL '1 day',
    NOW(),
    u.full_name,
    CASE
        WHEN u.student_id LIKE '18%' THEN 'Cựu sinh viên K18'
        WHEN u.student_id LIKE '19%' THEN 'Sinh viên K19'
        WHEN u.student_id LIKE '20%' THEN 'Sinh viên K20'
        WHEN u.student_id LIKE '21%' THEN 'Sinh viên K21'
        WHEN u.student_id LIKE '22%' THEN 'Sinh viên K22'
        WHEN u.student_id LIKE '23%' THEN 'Sinh viên K23'
        WHEN u.student_id LIKE '24%' THEN 'Sinh viên K24'
        ELSE 'Sinh viên K25'
    END,
    u.profile_picture_url,
    rs.rating,
    rs.comment,
    TRUE,
    u.id
FROM review_seed rs
JOIN users u ON u.id = 900000 + rs.n
ON CONFLICT (id) DO NOTHING;

UPDATE system_reviews
SET comment = regexp_replace(comment, '\s+#\d+\s*$', '')
WHERE comment ~ '\s+#\d+\s*$';

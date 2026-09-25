-- Seed 88 public system reviews from existing active non-admin accounts.
-- Rating distribution: 53x5, 29x4, 4x3, 1x2, 1x1 = 396 / 88 = 4.50.

WITH target_users AS (
    SELECT
        u.id,
        u.full_name,
        u.profile_picture_url,
        u.student_id,
        u.faculty,
        COALESCE(r.role_name, 'STUDENT') AS role_name,
        row_number() OVER (ORDER BY u.id) AS rn
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    WHERE u.status = 'ACTIVE'
      AND COALESCE(r.role_name, 'STUDENT') <> 'ADMIN'
    ORDER BY u.id
    LIMIT 88
),
review_seed(rn, rating, comment) AS (
    VALUES
        (1, 1, 'Mình thấy ý tưởng tốt nhưng lần đầu dùng hơi rối. Một vài nút trên mobile chưa đủ nổi bật nên phải mò khá lâu mới biết đặt mượn ở đâu.'),
        (2, 2, 'Tra cứu được, nhưng đôi lúc ảnh bìa và kết quả tải chậm. Nếu tối ưu thêm tốc độ thì trải nghiệm sẽ ổn hơn nhiều.'),
        (3, 3, 'Hệ thống đủ dùng cho việc tìm sách và xem tình trạng bản sao. Mình chưa dùng nhiều phần gợi ý nên chỉ đánh giá ở mức ổn.'),
        (4, 3, 'Giao diện sạch, thao tác cơ bản dễ hiểu. Điểm mình chưa thích là một số thông báo cần nhấn mạnh hơn để đỡ bỏ sót hạn trả.'),
        (5, 3, 'Tìm kiếm sách khá ổn khi nhập đúng từ khóa. Với những câu mô tả dài thì có lúc kết quả còn hơi rộng, nhưng vẫn có tài liệu dùng được.'),
        (6, 3, 'Mình dùng trên điện thoại là chính. Các chức năng chính chạy được, chỉ mong phần lọc và sắp xếp gọn hơn một chút.'),
        (7, 4, 'Mình thích phần xem sách đang mượn và hạn trả. Không cần hỏi lại thủ thư nhiều như trước.'),
        (8, 4, 'Tìm kiếm tiếng Việt ổn hơn mình nghĩ, nhất là khi không nhớ chính xác nhan đề sách.'),
        (9, 4, 'Trang chi tiết sách có đủ thông tin cần xem trước khi đặt mượn. Bố cục nhìn rõ và không bị rối.'),
        (10, 4, 'Phần đặt trước dễ theo dõi. Biết sách đang ở trạng thái nào nên chủ động hơn.'),
        (11, 4, 'Hệ thống chạy khá mượt trên laptop. Mình thích cách các mục mượn, trả và phí phạt được gom lại rõ ràng.'),
        (12, 4, 'Gợi ý sách có vài cuốn đúng chủ đề mình đang làm bài tập lớn. Không phải kết quả nào cũng hoàn hảo nhưng nhìn chung hữu ích.'),
        (13, 4, 'Mình thấy dashboard dễ đọc. Chỉ cần mở lên là biết còn sách nào chưa trả.'),
        (14, 4, 'Luồng mượn sách khá thẳng. Nếu thêm trạng thái nổi bật hơn cho hạn nhận sách thì sẽ hoàn chỉnh.'),
        (15, 4, 'Dùng thử vài lần thấy ổn định. Phần review sách giúp mình chọn tài liệu tự tin hơn.'),
        (16, 4, 'Tính năng tìm theo nội dung rất tiện khi mình chỉ nhớ chủ đề chứ không nhớ tên sách.'),
        (17, 4, 'Giao diện hiện đại, không quá màu mè. Các nút quan trọng cũng dễ tìm.'),
        (18, 4, 'Mình đánh giá cao việc có thông báo trong hệ thống. Nó làm quy trình mượn trả rõ ràng hơn.'),
        (19, 4, 'Tốc độ tìm kiếm ổn trong hầu hết trường hợp. Có lúc kết quả hơi nhiều, nhưng bộ lọc giúp thu lại nhanh.'),
        (20, 4, 'Phần wishlist tiện. Mình lưu trước mấy cuốn cho đồ án rồi quay lại đặt sau.'),
        (21, 4, 'Sách, bản sao, đánh giá và gợi ý nằm cùng một trang nên quyết định mượn nhanh hơn.'),
        (22, 4, 'Mình thích cảm giác hệ thống có dữ liệu thật, không giống một giao diện demo rỗng.'),
        (23, 4, 'Các trạng thái mượn trả dễ hiểu. Sinh viên mới dùng chắc cũng không mất nhiều thời gian làm quen.'),
        (24, 4, 'Tìm sách cho môn cơ sở dữ liệu nhanh hơn cách tra thủ công. Kết quả trình bày gọn, dễ chọn.'),
        (25, 4, 'Phần thông tin phí phạt rõ ràng. Có thể kiểm tra trước khi lên quầy nên đỡ bị bất ngờ.'),
        (26, 4, 'Mình thích trang public vì chưa đăng nhập vẫn tra cứu được catalog. Rất hợp khi chỉ cần xem nhanh tài liệu.'),
        (27, 4, 'Hệ thống có khá nhiều chức năng nhưng không làm mình bị ngợp. Dùng vài phút là nắm được luồng chính.'),
        (28, 4, 'Gợi ý tài liệu liên quan giúp mình mở rộng thêm nguồn đọc. Với môn kỹ thuật thì điểm này khá đáng giá.'),
        (29, 4, 'Mượn trả minh bạch hơn vì mọi trạng thái đều có trên tài khoản. Mình không phải ghi chú riêng nhiều nữa.'),
        (30, 4, 'Trải nghiệm tổng thể tốt. Mình chỉ mong phần tìm kiếm nâng cao có thêm lọc theo năm xuất bản.'),
        (31, 4, 'Hệ thống phù hợp với thư viện đại học. Các thông tin cần cho sinh viên đều xuất hiện đúng chỗ.'),
        (32, 4, 'Mình hay quên hạn trả nên dashboard và thông báo thật sự hữu ích.'),
        (33, 4, 'Trang sách có review làm danh mục bớt khô. Đọc nhận xét của người khác trước khi mượn khá tiện.'),
        (34, 4, 'Tìm kiếm AI không phải lúc nào cũng trúng ngay, nhưng thường đưa mình đến đúng nhóm tài liệu.'),
        (35, 4, 'Dùng trên mobile tương đối ổn. Một vài đoạn chữ hơi dài nhưng không ảnh hưởng nhiều đến thao tác.'),
        (36, 5, 'Rất hài lòng. Mình nhập mô tả chủ đề thôi mà hệ thống vẫn gợi ý đúng hướng.'),
        (37, 5, 'Library74 giúp mình tìm tài liệu môn học nhanh hơn hẳn cách tra cứu cũ.'),
        (38, 5, 'Gợi ý sách khá đúng nhu cầu, mình tìm được thêm vài cuốn phục vụ đồ án.'),
        (39, 5, 'Semantic search là phần mình thích nhất. Nhập câu tự nhiên vẫn có kết quả hợp lý.'),
        (40, 5, 'Mượn sách và theo dõi hạn trả trên một màn hình làm trải nghiệm nhẹ hơn nhiều.'),
        (41, 5, 'Giao diện nhìn sạch và đủ chuyên nghiệp để triển khai thật trong thư viện.'),
        (42, 5, 'Dashboard giúp mình biết ngay đang mượn gì, còn bao lâu phải trả.'),
        (43, 5, 'Nhanh, gọn, dễ dùng.'),
        (44, 5, 'Tìm sách và đặt mượn không bị rườm rà. Mình làm được gần như mọi thứ trong vài bước.'),
        (45, 5, 'Mình tìm tài liệu tiếng Việt tốt hơn mong đợi, không cần nhớ đúng từng chữ trong nhan đề.'),
        (46, 5, 'Các trạng thái mượn trả rõ ràng. Nhìn vào là biết việc nào đang chờ mình xử lý.'),
        (47, 5, 'Phần gợi ý liên quan làm mình khám phá thêm nhiều sách cùng chủ đề.'),
        (48, 5, 'Từ lúc dùng Library74, mình ít phải hỏi thủ thư về tình trạng sách hơn.'),
        (49, 5, 'Review và đánh giá sách làm danh mục có cảm giác sống hơn, không chỉ là danh sách khô.'),
        (50, 5, 'Trải nghiệm tìm kiếm nhanh, kết quả được trình bày gọn nên rất dễ chọn sách.'),
        (51, 5, 'Mình thích nhất phần thông báo realtime, có thay đổi là biết ngay.'),
        (52, 5, 'Hệ thống hỗ trợ khá đủ nhu cầu học tập từ tìm sách đến quản lý sách đang mượn.'),
        (53, 5, 'Các màn hình nhất quán, nhìn là biết nên bấm vào đâu.'),
        (54, 5, 'Phần AI không bị phô, dùng đúng chỗ là tìm kiếm và gợi ý tài liệu.'),
        (55, 5, 'Mình từng tìm sách bằng vài cụm mô tả mơ hồ mà vẫn nhận được kết quả dùng được.'),
        (56, 5, 'Thông tin bản sao và tình trạng mượn trả rất hữu ích trước khi lên thư viện.'),
        (57, 5, 'Hệ thống tạo cảm giác thư viện đang được số hóa thật sự, không chỉ làm giao diện cho đẹp.'),
        (58, 5, 'Mình thích cách các chức năng quan trọng nằm gần nhau, dùng vài lần là quen.'),
        (59, 5, 'Trang chi tiết sách có bìa, mô tả, đánh giá và gợi ý nên quyết định mượn nhanh hơn.'),
        (60, 5, 'Phần quản lý sách đang mượn giúp mình tránh quên hạn trả.'),
        (61, 5, 'Tìm kiếm theo chủ đề cho kết quả hợp lý, đặc biệt với các môn có nhiều tài liệu liên quan.'),
        (62, 5, 'Mình đánh giá cao trải nghiệm tổng thể vì thao tác nào cũng có phản hồi rõ.'),
        (63, 5, 'Library74 làm việc tìm tài liệu học kỳ nhẹ hơn nhiều so với cách tra cứu thủ công.'),
        (64, 5, 'Giao diện đẹp nhưng vẫn thực dụng, không bị màu mè quá mức.'),
        (65, 5, 'Mình có thể lưu sách, đặt mượn và kiểm tra thông báo mà không cần chuyển quá nhiều nơi.'),
        (66, 5, 'Kết quả gợi ý làm mình nhớ ra vài đầu sách có ích cho phần nền tảng lý thuyết.'),
        (67, 5, 'Dùng trên laptop rất thoải mái, các bảng và thẻ thông tin đều dễ đọc.'),
        (68, 5, 'Mình thấy đây là một hệ thống có thể đem demo cho thư viện thật mà vẫn thuyết phục.'),
        (69, 5, 'Các chức năng cho người đọc được làm khá sát nhu cầu thực tế.'),
        (70, 5, 'Tính năng theo dõi đặt trước giúp mình biết khi nào cần ra thư viện nhận sách.'),
        (71, 5, 'Mình thích việc hệ thống có cả dữ liệu đánh giá để tham khảo trước khi mượn.'),
        (72, 5, 'Phần tìm kiếm và đề xuất làm danh mục sách dễ khám phá hơn rất nhiều.'),
        (73, 5, 'Mình dùng thử vài lượt và thấy thao tác đủ nhanh cho nhu cầu hằng ngày.'),
        (74, 5, 'Những thông tin như hạn trả, phí phạt và lịch sử mượn được trình bày rất rõ.'),
        (75, 5, 'Hệ thống giúp mình chủ động hơn thay vì phải hỏi trực tiếp ở quầy.'),
        (76, 5, 'Mình thấy trải nghiệm giống các nền tảng đọc hiện đại nhưng vẫn đúng nghiệp vụ thư viện.'),
        (77, 5, 'Các gợi ý sách liên quan khá hữu ích khi mình đang tìm tài liệu cho một chủ đề rộng.'),
        (78, 5, 'Mình thích cách Library74 kết hợp quản lý thư viện với AI mà vẫn dễ dùng.'),
        (79, 5, 'Từ trang chủ đến dashboard đều cho cảm giác chỉn chu và có đầu tư.'),
        (80, 5, 'Phần trạng thái sách giúp mình không mất thời gian chọn nhầm cuốn không sẵn sàng.'),
        (81, 5, 'Mình đánh giá cao phần cá nhân hóa vì mỗi người có thể thấy tài liệu phù hợp hơn.'),
        (82, 5, 'Hệ thống có nhiều chi tiết nhỏ rất thực tế như thông báo, phí phạt và sách đang giữ chỗ.'),
        (83, 5, 'Mình tìm được tài liệu cho môn AI nhanh hơn nhờ phần gợi ý theo nội dung.'),
        (84, 5, 'Các review người dùng làm mình tin hơn khi chọn sách cho bài tập lớn.'),
        (85, 5, 'Mình dùng chủ yếu để tìm tài liệu cho đồ án. Điểm hay là không phải nghĩ đúng từ khóa; nhập kiểu sách về recommendation system cho người mới vẫn có kết quả gần với nhu cầu.'),
        (86, 5, 'Ban đầu mình chỉ định thử nhanh, nhưng phần dashboard giữ chân khá tốt. Nhìn được sách đang mượn, hạn trả, gợi ý và thông báo ở cùng một chỗ nên hệ thống thật sự hữu dụng.'),
        (87, 5, 'Mình rất thích cách hệ thống làm phần AI vừa đủ. Nó không cố tỏ ra phức tạp, nhưng giúp tìm sách dễ hơn rõ ràng, nhất là với tài liệu kỹ thuật có tên tiếng Anh dài.'),
        (88, 5, 'Trải nghiệm tổng thể tốt hơn mình kỳ vọng. Có dữ liệu, có quy trình mượn trả, có thông báo, có review và có gợi ý sách; dùng thử vài vòng thấy khá liền mạch.')
),
deleted_existing AS (
    DELETE FROM system_reviews sr
    USING target_users tu
    WHERE sr.user_id = tu.id
       OR sr.user_id IS NULL
    RETURNING sr.id
)
INSERT INTO system_reviews (
    id, created_at, updated_at, reviewer_name, reviewer_role,
    profile_picture_url, rating, comment, is_published, user_id
)
SELECT
    960000 + rs.rn,
    NOW() - ((89 - rs.rn) % 90) * INTERVAL '1 day',
    NOW() - (rs.rn % 12) * INTERVAL '6 hours',
    tu.full_name,
    CASE
        WHEN tu.role_name = 'LIBRARIAN' THEN 'Thủ thư Library74'
        WHEN tu.student_id LIKE '18%' THEN 'Cựu sinh viên K18'
        WHEN tu.student_id LIKE '19%' THEN 'Sinh viên K19'
        WHEN tu.student_id LIKE '20%' THEN 'Sinh viên K20'
        WHEN tu.student_id LIKE '21%' THEN 'Sinh viên K21'
        WHEN tu.student_id LIKE '22%' THEN 'Sinh viên K22'
        WHEN tu.student_id LIKE '23%' THEN 'Sinh viên K23'
        WHEN tu.student_id LIKE '24%' THEN 'Sinh viên K24'
        WHEN tu.student_id LIKE '25%' THEN 'Sinh viên K25'
        ELSE 'Người dùng Library74'
    END,
    tu.profile_picture_url,
    rs.rating,
    rs.comment,
    TRUE,
    tu.id
FROM review_seed rs
JOIN target_users tu ON tu.rn = rs.rn
CROSS JOIN (SELECT COUNT(*) AS deleted_count FROM deleted_existing) deleted_marker
ON CONFLICT (id) DO UPDATE SET
    updated_at = EXCLUDED.updated_at,
    reviewer_name = EXCLUDED.reviewer_name,
    reviewer_role = EXCLUDED.reviewer_role,
    profile_picture_url = EXCLUDED.profile_picture_url,
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    is_published = TRUE,
    user_id = EXCLUDED.user_id;

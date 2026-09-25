-- V32: Rich Vietnamese demo activity for production presentation.
-- This keeps the existing catalog intact and makes the site look operated with real users,
-- transactions, reviews, fines, notes, search history and audit events.

UPDATE users SET
    full_name = 'Nguyễn Minh Khang',
    email = 'khang.nguyen.lib@hcmut.edu.vn',
    phone_number = '0902371846',
    student_id = 'LIB002',
    address = 'Thư viện Cơ sở 1 - Lý Thường Kiệt',
    profile_picture_url = 'https://randomuser.me/api/portraits/men/41.jpg',
    is_verified = TRUE
WHERE id = 2;

UPDATE users SET
    full_name = 'Lê Hoài Phương',
    email = 'phuong.le.lib@hcmut.edu.vn',
    phone_number = '0914827360',
    student_id = 'LIB003',
    address = 'Thư viện Cơ sở 2 - Dĩ An',
    profile_picture_url = 'https://randomuser.me/api/portraits/women/42.jpg',
    is_verified = TRUE
WHERE id = 3;

UPDATE users SET
    full_name = 'Võ Thành Đạt',
    email = 'dat.vo21@hcmut.edu.vn',
    phone_number = '0901000004',
    faculty = 'KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH',
    address = 'Thủ Đức, TP. Hồ Chí Minh',
    profile_picture_url = 'https://randomuser.me/api/portraits/men/44.jpg',
    is_verified = TRUE
WHERE id = 4;

UPDATE users SET
    full_name = 'Trần Bảo Ngọc',
    email = 'ngoc.tran21@hcmut.edu.vn',
    phone_number = '0901000005',
    faculty = 'KHOA_DIEN_DIEN_TU',
    address = 'Bình Thạnh, TP. Hồ Chí Minh',
    profile_picture_url = 'https://randomuser.me/api/portraits/women/45.jpg',
    is_verified = TRUE
WHERE id = 5;

UPDATE users SET
    full_name = 'Lê Minh Quân',
    email = 'quan.le21@hcmut.edu.vn',
    phone_number = '0909000006',
    student_id = '2199999',
    faculty = 'KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH',
    address = 'TP. Hồ Chí Minh',
    profile_picture_url = 'https://randomuser.me/api/portraits/men/46.jpg',
    is_verified = TRUE
WHERE id = 6;

WITH source AS (
    SELECT
        900000 + n AS id,
        names[n] AS full_name,
        CASE
            WHEN n <= 8 THEN 18
            WHEN n <= 16 THEN 19
            WHEN n <= 24 THEN 20
            WHEN n <= 32 THEN 21
            WHEN n <= 55 THEN 22
            WHEN n <= 63 THEN 23
            WHEN n <= 72 THEN 24
            ELSE 25
        END AS cohort,
        n
    FROM generate_series(1, 80) AS g(n)
    CROSS JOIN LATERAL (
        SELECT ARRAY[
            'Nguyễn Anh Tuấn','Trần Minh Anh','Lê Hoàng Nam','Phạm Khánh Linh','Võ Gia Hân',
            'Huỳnh Đức Huy','Đặng Bảo Trân','Bùi Quốc Thịnh','Nguyễn Ngọc Mai','Trần Gia Bảo',
            'Lê Phương Thảo','Phạm Nhật Minh','Võ Thanh Tâm','Huỳnh Kim Ngân','Đặng Tuấn Kiệt',
            'Bùi Hà My','Nguyễn Hoài An','Trần Quang Vinh','Lê Cẩm Tú','Phạm Đức Long',
            'Võ Yến Nhi','Huỳnh Minh Khoa','Đặng Thảo Vy','Bùi Quốc Huy','Nguyễn Tấn Phát',
            'Trần Bảo Châu','Lê Minh Khôi','Phạm Gia Linh','Võ Hoàng Phúc','Huỳnh Khánh Duy',
            'Đặng Ngọc Ánh','Bùi Thiên Kim','Nguyễn Nhật Quang','Trần Uyên Nhi','Lê Đức Anh',
            'Phạm Hoài Nam','Võ Bảo Ngọc','Huỳnh Tuấn Anh','Đặng Mai Chi','Bùi Minh Triết',
            'Nguyễn Thanh Bình','Trần Hồng Nhung','Lê Quốc Bảo','Phạm Ngọc Diệp','Võ Minh Tâm',
            'Huỳnh Anh Khoa','Đặng Phương Linh','Bùi Đức Thành','Nguyễn Hải Đăng','Trần Khánh Hòa',
            'Lê Gia Khánh','Phạm Quỳnh Anh','Võ Nhật Linh','Huỳnh Bảo Long','Đặng Hà Vy',
            'Bùi Minh Châu','Nguyễn Phúc Hưng','Trần Cát Tường','Lê Tuấn Minh','Phạm Hữu Nghĩa',
            'Võ Thùy Dương','Huỳnh Nam Phong','Đặng Nhật Hạ','Bùi Quang Huy','Nguyễn Hoàng Yến',
            'Trần Đức Mạnh','Lê Bảo Anh','Phạm Thiên Ân','Võ Minh Đức','Huỳnh Ngọc Hân',
            'Đặng Quốc Việt','Bùi Phương Uyên','Nguyễn Minh Nhật','Trần Gia Tuệ','Lê Khánh An',
            'Phạm Nhật Hào','Võ Bảo An','Huỳnh Thiên Phúc','Đặng Minh Thư','Bùi Thanh Tùng'
        ] AS names
    ) AS name_list
),
students AS (
    SELECT
        id,
        full_name,
        (cohort * 100000 + n)::text AS student_id,
        'sv' || (cohort * 100000 + n)::text || '@hcmut.edu.vn' AS email,
        faculties[((n - 1) % array_length(faculties, 1)) + 1] AS faculty,
        CASE WHEN n % 9 = 0 THEN 'LOCKED' WHEN n % 17 = 0 THEN 'INACTIVE' ELSE 'ACTIVE' END AS status,
        70 + ((n * 7) % 31) AS credit_score,
        '09' || lpad(((12000000 + n * 7919) % 100000000)::text, 8, '0') AS phone_number,
        addresses[((n - 1) % array_length(addresses, 1)) + 1] AS address,
        CASE WHEN n % 2 = 0
            THEN 'https://randomuser.me/api/portraits/women/' || (10 + (n % 70)) || '.jpg'
            ELSE 'https://randomuser.me/api/portraits/men/' || (10 + (n % 70)) || '.jpg'
        END AS avatar,
        n
    FROM source
    CROSS JOIN LATERAL (
        SELECT ARRAY[
            'KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH','KHOA_DIEN_DIEN_TU','KHOA_CO_KHI',
            'KHOA_KY_THUAT_HOA_HOC','KHOA_KY_THUAT_XAY_DUNG','KHOA_KY_THUAT_GIAO_THONG',
            'KHOA_QUAN_LY_CONG_NGHIEP','KHOA_MOI_TRUONG_VA_TAI_NGUYEN',
            'KHOA_CONG_NGHE_VAT_LIEU','KHOA_KHOA_HOC_UNG_DUNG',
            'KHOA_KY_THUAT_DIA_CHAT_VA_DAU_KHI'
        ] AS faculties
    ) AS faculty_list
    CROSS JOIN LATERAL (
        SELECT ARRAY[
            'Ký túc xá khu B, Dĩ An','Thủ Đức, TP. Hồ Chí Minh','Quận 10, TP. Hồ Chí Minh',
            'Bình Thạnh, TP. Hồ Chí Minh','Gò Vấp, TP. Hồ Chí Minh','Tân Bình, TP. Hồ Chí Minh',
            'Biên Hòa, Đồng Nai','Dĩ An, Bình Dương','Quận 7, TP. Hồ Chí Minh','Cần Thơ'
        ] AS addresses
    ) AS address_list
)
INSERT INTO users (
    id, created_at, updated_at, full_name, email, hashed_password,
    status, credit_score, date_of_birth,
    phone_number, faculty, student_id, address, provider, provider_id,
    profile_picture_url, last_login_at, contribution_score, is_verified
)
SELECT
    id,
    NOW() - (95 - n) * INTERVAL '1 day',
    NOW() - (n % 11) * INTERVAL '1 day',
    full_name,
    email,
    '$2a$10$B0AIAFUtwqSvnO46IogPfeaUR/SRYXGgQcezUasUWpbBMM9R/DCB6',
    status,
    credit_score,
    make_date(2000 + (student_id::int / 100000), ((n - 1) % 12) + 1, ((n - 1) % 25) + 1),
    phone_number,
    faculty,
    student_id,
    address,
    NULL,
    NULL,
    avatar,
    CASE WHEN status = 'ACTIVE' THEN NOW() - (n % 20) * INTERVAL '3 hours' ELSE NOW() - (20 + n) * INTERVAL '1 day' END,
    (n * 13) % 180,
    TRUE
FROM students
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    status = EXCLUDED.status,
    credit_score = EXCLUDED.credit_score,
    phone_number = EXCLUDED.phone_number,
    faculty = EXCLUDED.faculty,
    student_id = EXCLUDED.student_id,
    address = EXCLUDED.address,
    profile_picture_url = EXCLUDED.profile_picture_url,
    last_login_at = EXCLUDED.last_login_at,
    contribution_score = EXCLUDED.contribution_score,
    is_verified = EXCLUDED.is_verified,
    updated_at = NOW();

INSERT INTO users (
    id, created_at, updated_at, full_name, email, hashed_password,
    status, credit_score, date_of_birth,
    phone_number, faculty, student_id, address, provider, provider_id,
    profile_picture_url, last_login_at, contribution_score, is_verified
) VALUES
    (900201, NOW() - INTERVAL '130 days', NOW(), 'Nguyễn Hữu Tín', 'tin.nguyen.lib@hcmut.edu.vn', '$2a$10$B0AIAFUtwqSvnO46IogPfeaUR/SRYXGgQcezUasUWpbBMM9R/DCB6', 'ACTIVE', 100, '1989-04-12', '0908123401', NULL, 'LIB201', 'Thư viện Cơ sở 1 - Lý Thường Kiệt', NULL, NULL, 'https://randomuser.me/api/portraits/men/61.jpg', NOW() - INTERVAL '1 hour', 0, TRUE),
    (900202, NOW() - INTERVAL '128 days', NOW(), 'Lê Thị Ngọc Hà', 'ha.le.lib@hcmut.edu.vn', '$2a$10$B0AIAFUtwqSvnO46IogPfeaUR/SRYXGgQcezUasUWpbBMM9R/DCB6', 'ACTIVE', 100, '1991-08-22', '0917345208', NULL, 'LIB202', 'Thư viện Cơ sở 2 - Dĩ An', NULL, NULL, 'https://randomuser.me/api/portraits/women/62.jpg', NOW() - INTERVAL '3 hours', 0, TRUE),
    (900203, NOW() - INTERVAL '120 days', NOW(), 'Trần Quốc Việt', 'viet.tran.lib@hcmut.edu.vn', '$2a$10$B0AIAFUtwqSvnO46IogPfeaUR/SRYXGgQcezUasUWpbBMM9R/DCB6', 'ACTIVE', 100, '1987-11-05', '0982017345', NULL, 'LIB203', 'Kho lưu thông - Cơ sở 1', NULL, NULL, 'https://randomuser.me/api/portraits/men/63.jpg', NOW() - INTERVAL '5 hours', 0, TRUE),
    (900204, NOW() - INTERVAL '118 days', NOW(), 'Võ Thanh Huyền', 'huyen.vo.lib@hcmut.edu.vn', '$2a$10$B0AIAFUtwqSvnO46IogPfeaUR/SRYXGgQcezUasUWpbBMM9R/DCB6', 'ACTIVE', 100, '1993-01-30', '0973145802', NULL, 'LIB204', 'Quầy mượn trả - Cơ sở 2', NULL, NULL, 'https://randomuser.me/api/portraits/women/64.jpg', NOW() - INTERVAL '2 hours', 0, TRUE),
    (900205, NOW() - INTERVAL '112 days', NOW(), 'Phạm Minh Hoàng', 'hoang.pham.lib@hcmut.edu.vn', '$2a$10$B0AIAFUtwqSvnO46IogPfeaUR/SRYXGgQcezUasUWpbBMM9R/DCB6', 'ACTIVE', 100, '1990-06-18', '0965201837', NULL, 'LIB205', 'Phòng xử lý nghiệp vụ', NULL, NULL, 'https://randomuser.me/api/portraits/men/65.jpg', NOW() - INTERVAL '4 hours', 0, TRUE),
    (900206, NOW() - INTERVAL '108 days', NOW(), 'Bùi Khánh Vân', 'van.bui.lib@hcmut.edu.vn', '$2a$10$B0AIAFUtwqSvnO46IogPfeaUR/SRYXGgQcezUasUWpbBMM9R/DCB6', 'ACTIVE', 100, '1994-09-09', '0928173645', NULL, 'LIB206', 'Quầy hỗ trợ bạn đọc', NULL, NULL, 'https://randomuser.me/api/portraits/women/66.jpg', NOW() - INTERVAL '6 hours', 0, TRUE)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone_number = EXCLUDED.phone_number,
    student_id = EXCLUDED.student_id,
    address = EXCLUDED.address,
    profile_picture_url = EXCLUDED.profile_picture_url,
    status = EXCLUDED.status,
    is_verified = TRUE,
    updated_at = NOW();

INSERT INTO user_roles (user_id, role_id)
SELECT id, 3 FROM users WHERE id BETWEEN 900001 AND 900080
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT id, 2 FROM users WHERE id BETWEEN 900201 AND 900206
ON CONFLICT DO NOTHING;

INSERT INTO wish_lists (id, created_at, updated_at, user_id)
SELECT 901000 + n, NOW() - n * INTERVAL '1 day', NOW(), 900000 + n
FROM generate_series(1, 80) AS g(n)
ON CONFLICT (id) DO NOTHING;

INSERT INTO wish_lists_item (id, created_at, updated_at, wish_list_id, publication_id, added_at)
SELECT
    902000 + n,
    NOW() - (n % 45) * INTERVAL '1 day',
    NOW(),
    901000 + (((n - 1) % 80) + 1),
    picked_publication.id,
    NOW() - (n % 45) * INTERVAL '1 day'
FROM generate_series(1, 220) AS g(n)
JOIN LATERAL (
    SELECT id
    FROM (
        SELECT id, row_number() OVER (ORDER BY id) AS rn, count(*) OVER () AS total
        FROM publications
    ) ranked_publications
    WHERE rn = ((n * 7 - 1) % total) + 1
) picked_publication ON TRUE
ON CONFLICT DO NOTHING;

INSERT INTO borrowing_transactions (
    id, created_at, updated_at, item_id, user_id, librarian_id_issue, librarian_id_return,
    borrowed_date, due_date, picked_up_deadline, returned_date, renewal_count, status
)
SELECT
    910000 + n,
    NOW() - (120 - (n % 95)) * INTERVAL '1 day',
    NOW() - (n % 9) * INTERVAL '1 day',
    picked_item.id,
    900001 + ((n - 1) % 80),
    (ARRAY[2,3,900201,900202,900203,900204,900205,900206])[((n - 1) % 8) + 1],
    CASE WHEN n <= 155 THEN (ARRAY[3,2,900202,900204,900206,900201,900203,900205])[((n - 1) % 8) + 1] ELSE NULL END,
    CASE WHEN n > 205 THEN NULL ELSE NOW() - (80 - (n % 70)) * INTERVAL '1 day' END,
    CASE
        WHEN n <= 155 THEN (CURRENT_DATE - ((n % 50) + 10))
        WHEN n <= 185 THEN (CURRENT_DATE + ((n % 12) + 3))
        WHEN n <= 205 THEN (CURRENT_DATE - ((n % 14) + 1))
        ELSE (CURRENT_DATE + ((n % 7) + 1))
    END,
    CASE
        WHEN n > 205 THEN NOW() + ((n % 36) + 6) * INTERVAL '1 hour'
        ELSE NOW() - (79 - (n % 70)) * INTERVAL '1 day'
    END,
    CASE WHEN n <= 155 THEN NOW() - (55 - (n % 45)) * INTERVAL '1 day' ELSE NULL END,
    CASE WHEN n % 11 = 0 THEN 1 ELSE 0 END,
    CASE
        WHEN n <= 155 THEN 'RETURNED'
        WHEN n <= 185 THEN 'BORROWING'
        WHEN n <= 205 THEN 'OVERDUE'
        ELSE 'WAITING_FOR_PICKUP'
    END
FROM generate_series(1, 220) AS g(n)
JOIN LATERAL (
    SELECT id
    FROM (
        SELECT id, row_number() OVER (ORDER BY id) AS rn, count(*) OVER () AS total
        FROM items
    ) ranked_items
    WHERE rn = ((n - 1) % total) + 1
) picked_item ON TRUE
ON CONFLICT (id) DO NOTHING;

INSERT INTO fines (id, created_at, updated_at, transaction_id, fine_amount, payment_status, type, paid_date, paid_by_librarian_id)
SELECT
    920000 + n,
    NOW() - (n % 60) * INTERVAL '1 day',
    NOW() - (n % 20) * INTERVAL '1 day',
    910000 + (((n * 3 - 1) % 220) + 1),
    (CASE WHEN n % 10 = 0 THEN 120000 ELSE 15000 + ((n % 9) * 10000) END)::numeric,
    CASE WHEN n <= 64 THEN 'PAID' ELSE 'UNPAID' END,
    CASE WHEN n % 13 = 0 THEN 'DAMAGED_BOOK' WHEN n % 29 = 0 THEN 'LOST_BOOK' ELSE 'OVERDUE_RETURN' END,
    CASE WHEN n <= 64 THEN NOW() - (n % 18) * INTERVAL '1 day' ELSE NULL END,
    CASE WHEN n <= 64 THEN (ARRAY[2,3,900201,900202,900203,900204,900205,900206])[((n - 1) % 8) + 1] ELSE NULL END
FROM generate_series(1, 90) AS g(n)
ON CONFLICT (id) DO NOTHING;

INSERT INTO fine_payment_orders (
    id, created_at, updated_at, student_id, user_id, order_code, amount, fine_count, fine_ids,
    description, provider, status, payment_link_id, checkout_url, qr_code, paid_at, reference,
    created_by_librarian_id, paid_by_librarian_id
)
SELECT
    921000 + n,
    NOW() - (n % 50) * INTERVAL '1 day',
    NOW() - (n % 12) * INTERVAL '1 day',
    u.student_id,
    u.id,
    8800000000 + n,
    f.fine_amount,
    1,
    f.id::text,
    'Thanh toán phí thư viện #' || f.id,
    'PAYOS',
    CASE WHEN n <= 52 THEN 'PAID' WHEN n <= 62 THEN 'PENDING' WHEN n <= 67 THEN 'EXPIRED' ELSE 'CANCELLED' END,
    'demo-payos-' || n,
    'https://library74.uk/#/userpage/fines',
    NULL,
    CASE WHEN n <= 52 THEN NOW() - (n % 10) * INTERVAL '1 day' ELSE NULL END,
    'L74-FINE-' || n,
    (ARRAY[2,3,900201,900202,900203,900204,900205,900206])[((n - 1) % 8) + 1],
    CASE WHEN n <= 52 THEN (ARRAY[2,3,900201,900202,900203,900204,900205,900206])[((n + 2) % 8) + 1] ELSE NULL END
FROM generate_series(1, 72) AS g(n)
JOIN fines f ON f.id = 920000 + n
JOIN borrowing_transactions bt ON bt.id = f.transaction_id
JOIN users u ON u.id = bt.user_id
ON CONFLICT (id) DO NOTHING;

INSERT INTO fine_payment_order_fines (order_id, fine_id)
SELECT 921000 + n, 920000 + n
FROM generate_series(1, 72) AS g(n)
ON CONFLICT DO NOTHING;

INSERT INTO ratings (id, created_at, updated_at, publication_id, user_id, star, comment, helpful_count, verified_borrow, transaction_id, item_barcode)
SELECT
    930000 + n,
    NOW() - (n % 70) * INTERVAL '1 day',
    NOW() - (n % 15) * INTERVAL '1 day',
    picked_publication.id,
    900001 + ((n - 1) % 80),
    CASE WHEN n <= 5 THEN 1 WHEN n <= 15 THEN 2 WHEN n <= 55 THEN 3 WHEN n <= 130 THEN 4 ELSE 5 END,
    CASE
        WHEN n <= 5 THEN 'Mình gặp bản sách hơi cũ và gáy sách lỏng, mong thư viện kiểm tra lại trước khi cho mượn.'
        WHEN n <= 15 THEN 'Nội dung có ích nhưng bản in đã xuống màu, đọc buổi tối hơi mỏi mắt.'
        WHEN n <= 55 THEN 'Sách dùng ổn cho học phần, vài chương cần đọc thêm tài liệu ngoài mới hiểu kỹ.'
        WHEN n <= 130 THEN 'Tài liệu rõ ràng, ví dụ sát môn học, mình mượn về làm bài tập lớn khá thuận tiện.'
        ELSE 'Rất đáng đọc, sách còn tốt và phần gợi ý liên quan trên hệ thống giúp mình tìm thêm tài liệu nhanh.'
    END || ' #' || n,
    (n * 3) % 19,
    n <= 155,
    CASE WHEN n <= 155 THEN 910000 + n ELSE NULL END,
    CASE WHEN n <= 155 THEN i.barcode ELSE NULL END
FROM generate_series(1, 260) AS g(n)
JOIN LATERAL (
    SELECT id
    FROM (
        SELECT id, row_number() OVER (ORDER BY id) AS rn, count(*) OVER () AS total
        FROM publications
    ) ranked_publications
    WHERE rn = ((n * 5 - 1) % total) + 1
) picked_publication ON TRUE
LEFT JOIN borrowing_transactions bt ON bt.id = 910000 + n
LEFT JOIN items i ON i.id = bt.item_id
ON CONFLICT (id) DO NOTHING;

INSERT INTO system_reviews (id, created_at, updated_at, reviewer_name, reviewer_role, profile_picture_url, rating, comment, is_published, user_id)
SELECT
    940000 + n,
    NOW() - (n % 75) * INTERVAL '1 day',
    NOW() - (n % 9) * INTERVAL '1 day',
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
    CASE WHEN n <= 2 THEN 1 WHEN n <= 7 THEN 2 WHEN n <= 25 THEN 3 WHEN n <= 50 THEN 4 ELSE 5 END,
    CASE
        WHEN n <= 2 THEN 'Có lúc tìm kiếm hơi chậm khi mạng yếu, nhưng luồng mượn trả vẫn rõ ràng.'
        WHEN n <= 7 THEN 'Hệ thống dùng được, mình mong phần thông báo hạn trả nổi bật hơn trên mobile.'
        WHEN n <= 25 THEN 'Tra cứu sách và xem tình trạng bản sao ổn, đủ dùng cho nhu cầu học kỳ này.'
        WHEN n <= 50 THEN 'Mình thích việc theo dõi đặt trước và phí phạt ở cùng một chỗ, đỡ phải hỏi quầy.'
        ELSE 'Library 74 giúp mình tìm tài liệu nhanh, mượn trả minh bạch và cảm giác như thư viện đang vận hành thật sự.'
    END || ' #' || n,
    TRUE,
    u.id
FROM generate_series(1, 80) AS g(n)
JOIN users u ON u.id = 900000 + n
ON CONFLICT (id) DO NOTHING;

INSERT INTO rating_replies (id, created_at, updated_at, rating_id, librarian_id, content)
SELECT
    950000 + n,
    NOW() - (n % 30) * INTERVAL '1 day',
    NOW() - (n % 12) * INTERVAL '1 day',
    930000 + n,
    (ARRAY[2,3,900201,900202,900203,900204,900205,900206])[((n - 1) % 8) + 1],
    CASE
        WHEN n % 4 = 0 THEN 'Thư viện đã ghi nhận tình trạng bản sách và sẽ kiểm tra lại trước khi xếp kệ.'
        WHEN n % 4 = 1 THEN 'Cảm ơn bạn đã review chi tiết. Gợi ý này giúp các bạn khác chọn tài liệu tốt hơn.'
        WHEN n % 4 = 2 THEN 'Thư viện sẽ ưu tiên bổ sung thêm bản in cho tài liệu này trong đợt nhập sách tới.'
        ELSE 'Cảm ơn phản hồi của bạn, thủ thư đã cập nhật ghi chú lưu thông cho đầu sách liên quan.'
    END
FROM generate_series(1, 80) AS g(n)
ON CONFLICT (id) DO NOTHING;

INSERT INTO transaction_notes (id, created_at, updated_at, transaction_id, librarian_id, important, note)
SELECT
    960000 + n,
    NOW() - (n % 55) * INTERVAL '1 day',
    NOW() - (n % 20) * INTERVAL '1 day',
    910000 + (((n * 2 - 1) % 220) + 1),
    (ARRAY[2,3,900201,900202,900203,900204,900205,900206])[((n - 1) % 8) + 1],
    n % 5 = 0,
    CASE
        WHEN n % 6 = 0 THEN 'Bạn đọc báo cần giữ sách thêm vài ngày để hoàn tất bài tập lớn, đã nhắc kiểm tra gia hạn.'
        WHEN n % 6 = 1 THEN 'Sách trả đúng hạn, bìa và mã vạch còn tốt, có thể đưa lại lên kệ ngay.'
        WHEN n % 6 = 2 THEN 'Có vết gấp nhẹ ở trang đầu, đã chụp lưu hồ sơ và chưa tính phí.'
        WHEN n % 6 = 3 THEN 'Bạn đọc thanh toán phí tại quầy, thủ thư đã đối soát biên nhận.'
        WHEN n % 6 = 4 THEN 'Yêu cầu giữ sách cho nhóm học phần, ưu tiên thông báo khi có bản rảnh.'
        ELSE 'Đã hướng dẫn bạn đọc dùng chức năng wishlist và nhận thông báo sách sẵn sàng.'
    END || ' #' || n
FROM generate_series(1, 150) AS g(n)
ON CONFLICT (id) DO NOTHING;

INSERT INTO search_history (id, created_at, updated_at, user_id, search_query)
SELECT
    970000 + n,
    NOW() - (n % 60) * INTERVAL '1 day',
    NOW() - (n % 60) * INTERVAL '1 day',
    900001 + ((n - 1) % 80),
    (ARRAY[
        'clean code spring boot','domain driven design aggregate','giải thuật đồ thị',
        'cơ sở dữ liệu transaction','operating system process','machine learning cơ bản',
        'computer network tcp ip','compiler parser lexer','javascript closure',
        'python automation','deep learning neural network','full stack react node'
    ])[((n - 1) % 12) + 1]
FROM generate_series(1, 180) AS g(n)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_interactions (id, created_at, updated_at, user_id, publication_id, type)
SELECT
    980000 + n,
    NOW() - (n % 80) * INTERVAL '1 day',
    NOW(),
    900001 + ((n - 1) % 80),
    picked_publication.id,
    (ARRAY['WATCH','WISHLIST','BORROWED','WATCH','BORROWED'])[((n - 1) % 5) + 1]
FROM generate_series(1, 260) AS g(n)
JOIN LATERAL (
    SELECT id
    FROM (
        SELECT id, row_number() OVER (ORDER BY id) AS rn, count(*) OVER () AS total
        FROM publications
    ) ranked_publications
    WHERE rn = ((n * 11 - 1) % total) + 1
) picked_publication ON TRUE
ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (id, created_at, updated_at, title, type, message, link, reference_id)
SELECT
    990000 + n,
    NOW() - (n % 20) * INTERVAL '1 day',
    NOW() - (n % 10) * INTERVAL '1 day',
    (ARRAY['Sách đã sẵn sàng','Nhắc hạn trả','Ghi nhận thanh toán','Đặt trước thành công','Thông báo hệ thống'])[((n - 1) % 5) + 1],
    (ARRAY['BOOK_AVAILABLE','RETURN_REMINDER','FINE_PAID','BOOK_RESERVED','SYSTEM_MAINTENANCE'])[((n - 1) % 5) + 1],
    (ARRAY[
        'Tài liệu bạn quan tâm đã có bản rảnh tại quầy.',
        'Bạn còn ít ngày trước hạn trả, vui lòng kiểm tra trang sách của tôi.',
        'Khoản phí đã được thủ thư xác nhận thanh toán.',
        'Yêu cầu đặt trước đã được đưa vào hàng chờ.',
        'Library 74 đã cập nhật dữ liệu lưu thông mới nhất.'
    ])[((n - 1) % 5) + 1],
    (ARRAY['/userpage/reservations','/userpage/my-books','/userpage/fines','/userpage/reservations','/publicpage'])[((n - 1) % 5) + 1],
    NULL
FROM generate_series(1, 90) AS g(n)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_notifications (id, created_at, updated_at, user_id, notification_id, is_read, read_at)
SELECT
    991000 + n,
    NOW() - (n % 20) * INTERVAL '1 day',
    NOW() - (n % 10) * INTERVAL '1 day',
    900001 + ((n - 1) % 80),
    990000 + (((n - 1) % 90) + 1),
    n % 3 <> 0,
    CASE WHEN n % 3 <> 0 THEN NOW() - (n % 8) * INTERVAL '1 day' ELSE NULL END
FROM generate_series(1, 120) AS g(n)
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_logs (id, created_at, actor_user_id, actor_role, action, entity_type, entity_id, summary, details)
SELECT
    992000 + n,
    NOW() - (n % 35) * INTERVAL '1 day',
    (ARRAY[1,2,3,900201,900202,900203,900204,900205,900206])[((n - 1) % 9) + 1],
    CASE WHEN n % 9 = 1 THEN 'ADMIN' ELSE 'LIBRARIAN' END,
    (ARRAY['USER_VERIFIED','DIRECT_BORROW','RETURN_BOOK','PAY_FINE_CASH','RESERVATION_READY','UPDATE_COPY_STATUS'])[((n - 1) % 6) + 1],
    (ARRAY['USER','BORROWING_TRANSACTION','BORROWING_TRANSACTION','FINE','RESERVATION','ITEM'])[((n - 1) % 6) + 1],
    (900000 + n)::text,
    (ARRAY[
        'Xác minh hồ sơ bạn đọc sau khi đối chiếu MSSV.',
        'Tạo giao dịch mượn trực tiếp tại quầy lưu thông.',
        'Xác nhận trả sách và cập nhật tình trạng bản sao.',
        'Ghi nhận thanh toán phí phạt tại quầy.',
        'Gán bản sách cho yêu cầu đặt trước.',
        'Cập nhật trạng thái bản sao sau kiểm kê nhanh.'
    ])[((n - 1) % 6) + 1],
    jsonb_build_object('source', 'rich-demo-seed', 'sequence', n)
FROM generate_series(1, 90) AS g(n)
ON CONFLICT (id) DO NOTHING;

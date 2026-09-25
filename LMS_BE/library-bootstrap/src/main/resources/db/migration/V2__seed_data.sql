-- ============================================================
-- V2: Seed data — cập nhật theo schema hiện tại
-- ============================================================

-- ============================================================
-- ROLES
-- ============================================================
INSERT INTO roles (id, created_at, updated_at, role_name, description) VALUES
    (1, NOW(), NOW(), 'ADMIN',     'Quản trị viên hệ thống'),
    (2, NOW(), NOW(), 'LIBRARIAN', 'Thủ thư quản lý sách và giao dịch'),
    (3, NOW(), NOW(), 'STUDENT',   'Sinh viên mượn sách');

-- ============================================================
-- PUBLISHERS
-- ============================================================
INSERT INTO publishers (id, created_at, updated_at, name, address) VALUES
    (1, NOW(), NOW(), 'NXB Giáo Dục',          'Hà Nội, Việt Nam'),
    (2, NOW(), NOW(), 'NXB Khoa Học Kỹ Thuật', 'Hà Nội, Việt Nam'),
    (3, NOW(), NOW(), 'NXB Trẻ',               'TP. Hồ Chí Minh, Việt Nam'),
    (4, NOW(), NOW(), 'Pearson Education',      'London, United Kingdom'),
    (5, NOW(), NOW(), 'O''Reilly Media',        'Sebastopol, CA, USA');

-- ============================================================
-- AUTHORS
-- ============================================================
INSERT INTO authors (id, created_at, updated_at, name, bio, date_of_birth, date_of_death) VALUES
    (1, NOW(), NOW(), 'Robert C. Martin',   'Tác giả cuốn Clean Code, chuyên gia về kiến trúc phần mềm',          '1952-12-05', NULL),
    (2, NOW(), NOW(), 'Eric Evans',         'Tác giả Domain-Driven Design, người đặt nền móng cho DDD',            '1963-01-01', NULL),
    (3, NOW(), NOW(), 'Martin Fowler',      'Kiến trúc sư phần mềm nổi tiếng, tác giả Refactoring',               '1963-12-18', NULL),
    (4, NOW(), NOW(), 'Nguyễn Văn Linh',   'Giảng viên ĐHBK TP.HCM, chuyên ngành Cơ sở dữ liệu',                '1970-05-20', NULL),
    (5, NOW(), NOW(), 'Trần Thị Minh Hoa', 'Tác giả nhiều giáo trình Lập trình Java được sử dụng tại các trường', '1975-09-15', NULL);

-- ============================================================
-- TAGS
-- ============================================================
INSERT INTO tags (id, created_at, updated_at, name) VALUES
    (1, NOW(), NOW(), 'Java'),
    (2, NOW(), NOW(), 'Clean Code'),
    (3, NOW(), NOW(), 'Architecture'),
    (4, NOW(), NOW(), 'Database'),
    (5, NOW(), NOW(), 'Machine Learning');

-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT INTO categories (id, created_at, updated_at, name, bio, parent_category_id) VALUES
    (1, NOW(), NOW(), 'Công Nghệ Thông Tin', 'Sách về lĩnh vực CNTT',                  NULL),
    (2, NOW(), NOW(), 'Lập Trình',           'Sách về ngôn ngữ và kỹ thuật lập trình',  1),
    (3, NOW(), NOW(), 'Kiến Trúc Phần Mềm', 'Sách về thiết kế và kiến trúc hệ thống',  1),
    (4, NOW(), NOW(), 'Cơ Sở Dữ Liệu',      'Sách về CSDL quan hệ và phi quan hệ',     1),
    (5, NOW(), NOW(), 'Toán Ứng Dụng',       'Sách toán phục vụ kỹ thuật',              NULL);

-- ============================================================
-- PUBLICATIONS (có call_number DDC)
-- ============================================================
INSERT INTO publications (id, created_at, updated_at, title, subtitle, isbn, language, edition,
                          publication_year, number_of_pages, description, publisher_id,
                          cover_image_url, file_url, ai_summary, ai_target_audience,
                          size, weight, call_number) VALUES
    (1, NOW(), NOW(),
     'Clean Code', 'A Handbook of Agile Software Craftsmanship',
     '9780132350884', 'English', 1, 2008, 431,
     'Hướng dẫn viết code sạch, dễ bảo trì và mở rộng. Cuốn sách kinh điển của Robert C. Martin.',
     5, NULL, NULL, NULL, NULL, '23x18cm', 0.72,
     '005.13 M376c'),

    (2, NOW(), NOW(),
     'Domain-Driven Design', 'Tackling Complexity in the Heart of Software',
     '9780321125217', 'English', 1, 2003, 560,
     'Sách nền tảng về DDD, giúp thiết kế hệ thống phức tạp theo nghiệp vụ.',
     4, NULL, NULL, NULL, NULL, '23x18cm', 0.85,
     '005.117 E92d'),

    (3, NOW(), NOW(),
     'Refactoring', 'Improving the Design of Existing Code',
     '9780134757599', 'English', 2, 2018, 448,
     'Kỹ thuật tái cấu trúc code mà không làm thay đổi hành vi hệ thống.',
     4, NULL, NULL, NULL, NULL, '23x18cm', 0.78,
     '005.13 F679r'),

    (4, NOW(), NOW(),
     'Giáo Trình Cơ Sở Dữ Liệu', NULL,
     '9786040234567', 'Vietnamese', 3, 2020, 380,
     'Giáo trình CSDL dành cho sinh viên đại học kỹ thuật, bao gồm mô hình quan hệ và SQL.',
     1, NULL, NULL, NULL, 'KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH', '24x17cm', 0.65,
     '005.74 N573g'),

    (5, NOW(), NOW(),
     'Lập Trình Java Hướng Đối Tượng', NULL,
     '9786040345678', 'Vietnamese', 2, 2021, 420,
     'Giáo trình Java OOP dành cho sinh viên năm 2, từ cơ bản đến design patterns.',
     2, NULL, NULL, NULL, 'KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH', '24x17cm', 0.70,
     '005.133 T764l');

-- ============================================================
-- PUBLICATION_AUTHORS
-- ============================================================
INSERT INTO publication_authors (id, publication_id, author_id) VALUES
    (1, 1, 1),  -- Clean Code → Robert C. Martin
    (2, 2, 2),  -- DDD → Eric Evans
    (3, 3, 3),  -- Refactoring → Martin Fowler
    (4, 4, 4),  -- Giáo trình CSDL → Nguyễn Văn Linh
    (5, 5, 5);  -- Lập trình Java → Trần Thị Minh Hoa

-- ============================================================
-- PUBLICATION_CATEGORIES
-- ============================================================
INSERT INTO publication_categories (id, publication_id, category_id) VALUES
    (1, 1, 2),  -- Clean Code → Lập Trình
    (2, 1, 3),  -- Clean Code → Kiến Trúc Phần Mềm
    (3, 2, 3),  -- DDD → Kiến Trúc Phần Mềm
    (4, 4, 4),  -- Giáo trình CSDL → Cơ Sở Dữ Liệu
    (5, 5, 2);  -- Lập trình Java → Lập Trình

-- ============================================================
-- PUBLICATION_TAGS
-- ============================================================
INSERT INTO publication_tags (id, publication_id, tag_id) VALUES
    (1, 1, 2),  -- Clean Code → Clean Code
    (2, 1, 3),  -- Clean Code → Architecture
    (3, 2, 3),  -- DDD → Architecture
    (4, 4, 4),  -- Giáo trình CSDL → Database
    (5, 5, 1);  -- Lập trình Java → Java

-- ============================================================
-- ITEMS
-- branch: đúng tên cơ sở theo ứng dụng
-- location: vị trí vật lý (tòa / phòng / kệ)
-- ============================================================
INSERT INTO items (id, created_at, updated_at, barcode, publication_id,
                   status, condition, branch, location) VALUES
    (1,  NOW(), NOW(), 'BK-CC-001',   1, 'RESERVED',       'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 301'),
    (2,  NOW(), NOW(), 'BK-CC-002',   1, 'BORROWED',        'OLD', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 301'),
    (3,  NOW(), NOW(), 'BK-DDD-001',  2, 'AVAILABLE',       'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 201'),
    (4,  NOW(), NOW(), 'BK-DB-001',   4, 'BORROWED',        'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 302'),
    (5,  NOW(), NOW(), 'BK-JAVA-001', 5, 'IN_MAINTENANCE',  'OLD', 'Cơ sở 2 - Dĩ An',          'H6 - 202'),
    (6,  NOW(), NOW(), 'BK-REF-001',  3, 'BORROWED',        'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 303'),
    (7,  NOW(), NOW(), 'BK-REF-002',  3, 'BORROWED',        'OLD', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 303'),
    (8,  NOW(), NOW(), 'BK-DDD-002',  2, 'AVAILABLE',       'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 201'),
    (9,  NOW(), NOW(), 'BK-CC-003',   1, 'AVAILABLE',       'OLD', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 304'),
    (10, NOW(), NOW(), 'BK-DB-002',   4, 'BORROWED',        'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 302'),
    (11, NOW(), NOW(), 'BK-JAVA-002', 5, 'BORROWED',        'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 203'),
    (12, NOW(), NOW(), 'BK-DDD-003',  2, 'BORROWED',        'OLD', 'Cơ sở 2 - Dĩ An',          'H6 - 201'),
    (13, NOW(), NOW(), 'BK-CC-004',   1, 'BORROWED',        'OLD', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 304'),
    (14, NOW(), NOW(), 'BK-REF-003',  3, 'RESERVED',        'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 303'),
    (15, NOW(), NOW(), 'BK-DB-003',   4, 'RESERVED',        'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 302');

-- ============================================================
-- USERS (password = 'Password@123', bcrypt cost 10)
-- ============================================================
INSERT INTO users (id, created_at, updated_at, full_name, email, hashed_password,
                   status, ai_personalization_enabled, credit_score,
                   date_of_birth, phone_number, faculty, student_id,
                   address, provider, provider_id, profile_picture_url, last_login_at) VALUES
    (1, NOW(), NOW(), 'Nguyễn Quản Trị', 'admin@hcmut.edu.vn',
     '$2a$10$B0AIAFUtwqSvnO46IogPfeaUR/SRYXGgQcezUasUWpbBMM9R/DCB6',
     'ACTIVE', FALSE, 100, '1990-01-15', '0901000001', NULL, NULL,
     'TP. Hồ Chí Minh', NULL, NULL, NULL, NULL),

    (2, NOW(), NOW(), 'Trần Thủ Thư', 'librarian1@hcmut.edu.vn',
     '$2a$10$B0AIAFUtwqSvnO46IogPfeaUR/SRYXGgQcezUasUWpbBMM9R/DCB6',
     'ACTIVE', FALSE, 100, '1988-06-20', '0901000002', NULL, NULL,
     'Bình Dương', NULL, NULL, NULL, NULL),

    (3, NOW(), NOW(), 'Lê Thị Thủ Thư', 'librarian2@hcmut.edu.vn',
     '$2a$10$B0AIAFUtwqSvnO46IogPfeaUR/SRYXGgQcezUasUWpbBMM9R/DCB6',
     'ACTIVE', FALSE, 100, '1992-03-10', '0901000003', NULL, NULL,
     'TP. Hồ Chí Minh', NULL, NULL, NULL, NULL),

    (4, NOW(), NOW(), 'Phạm Văn Sinh Viên', 'phamvan.2151234@hcmut.edu.vn',
     '$2a$10$B0AIAFUtwqSvnO46IogPfeaUR/SRYXGgQcezUasUWpbBMM9R/DCB6',
     'ACTIVE', TRUE, 95, '2003-08-25', '0901000004',
     'KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH', '2151234',
     'Thủ Đức, TP. Hồ Chí Minh', NULL, NULL, NULL, NULL),

    (5, NOW(), NOW(), 'Nguyễn Thị Học Viên', 'nguyenthi.2152345@hcmut.edu.vn',
     '$2a$10$B0AIAFUtwqSvnO46IogPfeaUR/SRYXGgQcezUasUWpbBMM9R/DCB6',
     'ACTIVE', TRUE, 100, '2003-11-30', '0901000005',
     'KHOA_DIEN_DIEN_TU', '2152345',
     'Bình Thạnh, TP. Hồ Chí Minh', NULL, NULL, NULL, NULL);

-- ============================================================
-- USER_ROLES
-- ============================================================
INSERT INTO user_roles (user_id, role_id) VALUES
    (1, 1),  -- admin → ADMIN
    (2, 2),  -- librarian1 → LIBRARIAN
    (3, 2),  -- librarian2 → LIBRARIAN
    (4, 3),  -- sinh viên 1 → STUDENT
    (5, 3);  -- sinh viên 2 → STUDENT

-- ============================================================
-- REFRESH_TOKENS
-- ============================================================
INSERT INTO refresh_tokens (uuid_token, user_id, device_id, revoked, expiry_date) VALUES
    ('tok-uuid-0001', 4, 'device-chrome-win',   FALSE, NOW() + INTERVAL '7 days'),
    ('tok-uuid-0002', 5, 'device-safari-mac',   FALSE, NOW() + INTERVAL '7 days'),
    ('tok-uuid-0003', 2, 'device-firefox-win',  FALSE, NOW() + INTERVAL '7 days'),
    ('tok-uuid-0004', 1, 'device-chrome-linux', FALSE, NOW() + INTERVAL '7 days'),
    ('tok-uuid-0005', 4, 'device-mobile-ios',   TRUE,  NOW() - INTERVAL '1 day');

-- ============================================================
-- BORROWING_TRANSACTIONS
-- ============================================================
INSERT INTO borrowing_transactions (id, created_at, updated_at, item_id, user_id,
                                    librarian_id_issue, librarian_id_return,
                                    borrowed_date, due_date, picked_up_deadline,
                                    returned_date, renewal_count, status) VALUES
    -- tx đang mượn bình thường
    (1,  NOW(), NOW(), 2,  4, 2, NULL,
     NOW() - INTERVAL '10 days', (CURRENT_DATE + INTERVAL '4 days')::date,
     NOW() - INTERVAL '9 days',  NULL, 0, 'BORROWING'),

    -- tx đã trả
    (2,  NOW(), NOW(), 3,  5, 2, 3,
     NOW() - INTERVAL '20 days', (CURRENT_DATE - INTERVAL '6 days')::date,
     NOW() - INTERVAL '19 days', NOW() - INTERVAL '7 days', 0, 'RETURNED'),

    -- tx overdue cũ
    (3,  NOW(), NOW(), 4,  4, 3, NULL,
     NOW() - INTERVAL '30 days', (CURRENT_DATE - INTERVAL '2 days')::date,
     NOW() - INTERVAL '29 days', NULL, 1, 'OVERDUE'),

    -- tx đang chờ lấy
    (4,  NOW(), NOW(), 1,  5, 2, NULL,
     NULL, (CURRENT_DATE + INTERVAL '2 days')::date,
     NOW() + INTERVAL '1 day',  NULL, 0, 'WAITING_FOR_PICKUP'),

    -- tx đã trả cũ
    (5,  NOW(), NOW(), 3,  4, 3, 3,
     NOW() - INTERVAL '45 days', (NOW() - INTERVAL '31 days')::date,
     NOW() - INTERVAL '44 days', NOW() - INTERVAL '32 days', 1, 'RETURNED'),

    -- mượn HÔM NAY (borrowedToday = 2)
    (6,  NOW(), NOW(), 6,  4, 2, NULL,
     NOW(), (CURRENT_DATE + INTERVAL '14 days')::date,
     NOW() - INTERVAL '1 hour', NULL, 0, 'BORROWING'),

    (7,  NOW(), NOW(), 7,  5, 3, NULL,
     NOW(), (CURRENT_DATE + INTERVAL '14 days')::date,
     NOW() - INTERVAL '1 hour', NULL, 0, 'BORROWING'),

    -- trả HÔM NAY (returnedToday = 2)
    (8,  NOW(), NOW(), 8,  4, 2, 3,
     NOW() - INTERVAL '14 days', (CURRENT_DATE + INTERVAL '1 day')::date,
     NOW() - INTERVAL '13 days', NOW(), 0, 'RETURNED'),

    (9,  NOW(), NOW(), 9,  5, 2, 3,
     NOW() - INTERVAL '15 days', (CURRENT_DATE - INTERVAL '1 day')::date,
     NOW() - INTERVAL '14 days', NOW(), 0, 'RETURNED'),

    -- hết hạn HÔM NAY (newlyOverdueToday = 2)
    (10, NOW(), NOW(), 10, 4, 3, NULL,
     NOW() - INTERVAL '14 days', CURRENT_DATE,
     NOW() - INTERVAL '13 days', NULL, 0, 'OVERDUE'),

    (11, NOW(), NOW(), 11, 5, 2, NULL,
     NOW() - INTERVAL '14 days', CURRENT_DATE,
     NOW() - INTERVAL '13 days', NULL, 0, 'OVERDUE'),

    -- overdue từ trước
    (12, NOW(), NOW(), 12, 4, 3, NULL,
     NOW() - INTERVAL '18 days', (CURRENT_DATE - INTERVAL '4 days')::date,
     NOW() - INTERVAL '17 days', NULL, 0, 'OVERDUE'),

    (13, NOW(), NOW(), 13, 5, 2, NULL,
     NOW() - INTERVAL '25 days', (CURRENT_DATE - INTERVAL '11 days')::date,
     NOW() - INTERVAL '24 days', NULL, 1, 'OVERDUE'),

    -- WAITING_FOR_PICKUP
    (14, NOW(), NOW(), 14, 4, 2, NULL,
     NULL, (CURRENT_DATE + INTERVAL '3 days')::date,
     NOW() + INTERVAL '1 day',  NULL, 0, 'WAITING_FOR_PICKUP'),

    (15, NOW(), NOW(), 15, 5, 3, NULL,
     NULL, (CURRENT_DATE + INTERVAL '3 days')::date,
     NOW() + INTERVAL '2 days', NULL, 0, 'WAITING_FOR_PICKUP');

-- ============================================================
-- FINES
-- ============================================================
INSERT INTO fines (id, created_at, updated_at, transaction_id, fine_amount,
                   payment_status, type, paid_date) VALUES
    (1, NOW(), NOW(), 3,  50000,  'UNPAID', 'OVERDUE_RETURN', NULL),
    (2, NOW(), NOW(), 5,  30000,  'PAID',   'OVERDUE_RETURN', NOW() - INTERVAL '30 days'),
    (3, NOW(), NOW(), 2,  100000, 'PAID',   'DAMAGED_BOOK',   NOW() - INTERVAL '6 days'),
    (4, NOW(), NOW(), 9,  40000,  'PAID',   'OVERDUE_RETURN', NOW()),
    (5, NOW(), NOW(), 10, 50000,  'UNPAID', 'OVERDUE_RETURN', NULL),
    (6, NOW(), NOW(), 11, 50000,  'UNPAID', 'OVERDUE_RETURN', NULL),
    (7, NOW(), NOW(), 12, 80000,  'UNPAID', 'OVERDUE_RETURN', NULL),
    (8, NOW(), NOW(), 13, 150000, 'UNPAID', 'OVERDUE_RETURN', NULL);

-- ============================================================
-- RESERVATIONS
-- status: COMPLETED (thay FULFILLED cũ), PENDING, CANCELLED, EXPIRED
-- preferred_branch: cơ sở ưu tiên
-- assigned_item_id: NULL = chưa gán, có giá trị = đã gán item cho READY_FOR_PICKUP
-- ============================================================
INSERT INTO reservations (id, created_at, updated_at, user_id, publication_id,
                          reservation_date, status, queue_position,
                          hold_expiration_time, preferred_branch, assigned_item_id) VALUES
    (1, NOW(), NOW(), 5, 1,
     NOW() - INTERVAL '5 days',  'PENDING',   1, NULL,
     'Cơ sở 1 - Lý Thường Kiệt', NULL),

    (2, NOW(), NOW(), 4, 2,
     NOW() - INTERVAL '3 days',  'PENDING',   1, NULL,
     'ANY', NULL),

    (3, NOW(), NOW(), 5, 5,
     NOW() - INTERVAL '15 days', 'COMPLETED', 1, NULL,
     'Cơ sở 2 - Dĩ An', NULL),

    (4, NOW(), NOW(), 4, 3,
     NOW() - INTERVAL '20 days', 'CANCELLED', 1, NULL,
     'ANY', NULL),

    (5, NOW(), NOW(), 5, 4,
     NOW() - INTERVAL '25 days', 'EXPIRED',   1, NULL,
     'Cơ sở 1 - Lý Thường Kiệt', NULL);

-- ============================================================
-- RATINGS
-- ============================================================
INSERT INTO ratings (id, created_at, updated_at, publication_id, user_id,
                     star, comment, helpful_count, verified_borrow) VALUES
    (1, NOW(), NOW(), 1, 4, 5, 'Sách rất hay, giúp tôi viết code sạch hơn rất nhiều!',       10, TRUE),
    (2, NOW(), NOW(), 2, 5, 4, 'Nội dung sâu sắc nhưng khá khó đọc với người mới.',           5,  TRUE),
    (3, NOW(), NOW(), 4, 4, 5, 'Giáo trình dễ hiểu, ví dụ thực tế rõ ràng.',                  3,  TRUE),
    (4, NOW(), NOW(), 3, 5, 4, 'Refactoring rất hữu ích, nhiều kỹ thuật áp dụng được ngay.',  7,  FALSE),
    (5, NOW(), NOW(), 5, 4, 3, 'Nội dung ổn nhưng ví dụ hơi cũ so với Java hiện đại.',        2,  TRUE);

-- ============================================================
-- WISH_LISTS & ITEMS
-- ============================================================
INSERT INTO wish_lists (id, created_at, updated_at, user_id) VALUES
    (1, NOW(), NOW(), 4),
    (2, NOW(), NOW(), 5);

INSERT INTO wish_lists_item (id, created_at, updated_at, wish_list_id, publication_id, added_at) VALUES
    (1, NOW(), NOW(), 1, 2, NOW() - INTERVAL '5 days'),
    (2, NOW(), NOW(), 1, 3, NOW() - INTERVAL '3 days'),
    (3, NOW(), NOW(), 2, 1, NOW() - INTERVAL '7 days'),
    (4, NOW(), NOW(), 2, 5, NOW() - INTERVAL '2 days'),
    (5, NOW(), NOW(), 1, 5, NOW() - INTERVAL '1 day');

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
INSERT INTO notifications (id, created_at, updated_at, type, message, link) VALUES
    (1, NOW(), NOW(), 'BOOK_AVAILABLE', 'Sách "Clean Code" đã có sẵn để mượn.',                    '/publications/1'),
    (2, NOW(), NOW(), 'BOOK_RESERVED',  'Bạn đã đặt trước "Domain-Driven Design" thành công.',     '/reservations/2'),
    (3, NOW(), NOW(), 'BORROW_SUCCESS', 'Bạn đã mượn thành công sách "Giáo Trình CSDL".',          '/transactions/1'),
    (4, NOW(), NOW(), 'BOOK_AVAILABLE', 'Sách "Refactoring" bạn đặt trước đã có sẵn.',              '/publications/3'),
    (5, NOW(), NOW(), 'BORROW_SUCCESS', 'Bạn đã mượn thành công sách "Lập Trình Java".',           '/transactions/4');

-- ============================================================
-- USER_NOTIFICATIONS
-- ============================================================
INSERT INTO user_notifications (id, created_at, updated_at, user_id, notification_id, is_read) VALUES
    (1, NOW(), NOW(), 4, 1, TRUE),
    (2, NOW(), NOW(), 5, 2, FALSE),
    (3, NOW(), NOW(), 4, 3, TRUE),
    (4, NOW(), NOW(), 5, 4, FALSE),
    (5, NOW(), NOW(), 5, 5, TRUE);

-- ============================================================
-- SEARCH_HISTORY
-- ============================================================
INSERT INTO search_history (id, created_at, updated_at, user_id, search_query) VALUES
    (1, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 4, 'clean code'),
    (2, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', 4, 'java spring boot'),
    (3, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 5, 'domain driven design'),
    (4, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 5, 'cơ sở dữ liệu'),
    (5, NOW() - INTERVAL '1 day',  NOW() - INTERVAL '1 day',  4, 'refactoring martin fowler');

-- ============================================================
-- USER_INTERACTIONS
-- ============================================================
INSERT INTO user_interactions (id, created_at, updated_at, user_id, publication_id, type) VALUES
    (1, NOW() - INTERVAL '10 days', NOW(), 4, 1, 'BORROWED'),
    (2, NOW() - INTERVAL '8 days',  NOW(), 4, 2, 'WISHLIST'),
    (3, NOW() - INTERVAL '6 days',  NOW(), 5, 1, 'WATCH'),
    (4, NOW() - INTERVAL '4 days',  NOW(), 5, 3, 'WISHLIST'),
    (5, NOW() - INTERVAL '2 days',  NOW(), 4, 5, 'WATCH');

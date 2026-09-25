-- V6: Danh mục nền tảng cho thư viện đại học.
-- Librarian vẫn có thể thêm danh mục mới, nhưng bộ này giúp public page/category luôn đầy đủ.

INSERT INTO categories (id, created_at, updated_at, name, bio, parent_category_id) VALUES
    (100, NOW(), NOW(), 'Kinh Tế - Tài Chính', 'Kinh tế học, tài chính doanh nghiệp, ngân hàng, đầu tư', NULL),
    (101, NOW(), NOW(), 'Quản Trị Kinh Doanh', 'Quản trị, chiến lược, vận hành, quản trị nhân sự', NULL),
    (102, NOW(), NOW(), 'Marketing', 'Marketing căn bản, truyền thông, thương hiệu, hành vi khách hàng', 101),
    (103, NOW(), NOW(), 'Kế Toán - Kiểm Toán', 'Kế toán tài chính, kế toán quản trị, kiểm toán', 100),
    (104, NOW(), NOW(), 'Dược - Y Sinh', 'Dược học, y sinh, sinh học phân tử, công nghệ sinh học', NULL),
    (105, NOW(), NOW(), 'Y Học', 'Y học cơ sở, y học lâm sàng, chăm sóc sức khỏe', 104),
    (106, NOW(), NOW(), 'Ngoại Ngữ', 'Tiếng Anh, tiếng Pháp, tiếng Trung, IELTS, TOEIC, học thuật ngôn ngữ', NULL),
    (107, NOW(), NOW(), 'Kỹ Năng Mềm', 'Giao tiếp, làm việc nhóm, lãnh đạo, tư duy phản biện, quản lý thời gian', NULL),
    (108, NOW(), NOW(), 'Luật - Chính Trị', 'Luật dân sự, luật kinh tế, chính trị học, chính sách công', NULL),
    (109, NOW(), NOW(), 'Luận Văn - Khóa Luận', 'Luận văn, khóa luận, đồ án tốt nghiệp, nghiên cứu học thuật', NULL),
    (110, NOW(), NOW(), 'Điện - Điện Tử', 'Mạch điện, điện tử, viễn thông, hệ thống nhúng, điều khiển', NULL),
    (111, NOW(), NOW(), 'Cơ Khí', 'Cơ học, thiết kế máy, chế tạo, robot, tự động hóa', NULL),
    (112, NOW(), NOW(), 'Xây Dựng', 'Kết cấu, vật liệu xây dựng, quản lý dự án, hạ tầng đô thị', NULL),
    (113, NOW(), NOW(), 'Hóa Học - Kỹ Thuật Hóa Học', 'Hóa đại cương, hóa phân tích, hóa hữu cơ, kỹ thuật hóa học', NULL),
    (114, NOW(), NOW(), 'Môi Trường - Tài Nguyên', 'Môi trường, tài nguyên nước, khí hậu, phát triển bền vững', NULL),
    (115, NOW(), NOW(), 'Công Nghệ Vật Liệu', 'Vật liệu kim loại, polymer, composite, vật liệu bán dẫn', NULL),
    (116, NOW(), NOW(), 'Giao Thông - Logistics', 'Kỹ thuật giao thông, vận tải, logistics, chuỗi cung ứng', NULL),
    (117, NOW(), NOW(), 'Toán - Thống Kê', 'Toán cao cấp, xác suất thống kê, tối ưu hóa, phân tích dữ liệu', NULL),
    (118, NOW(), NOW(), 'Vật Lý', 'Cơ học, điện từ, quang học, vật lý hiện đại, vật lý kỹ thuật', NULL),
    (119, NOW(), NOW(), 'Thiết Kế - Kiến Trúc', 'Thiết kế, kiến trúc, quy hoạch, đồ họa, mỹ thuật ứng dụng', NULL)
ON CONFLICT (name) DO UPDATE SET
    bio = EXCLUDED.bio,
    parent_category_id = COALESCE(categories.parent_category_id, EXCLUDED.parent_category_id),
    updated_at = NOW();

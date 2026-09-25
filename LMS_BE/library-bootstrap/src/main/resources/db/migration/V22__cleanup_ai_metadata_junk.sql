-- Clean low-quality AI metadata created by earlier loose prompts/fallbacks.
-- Keep categories: unused category rows are intentional browsing/classification data.

CREATE TEMP TABLE tmp_tag_rename_map (
    source_name TEXT PRIMARY KEY,
    target_name TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO tmp_tag_rename_map (source_name, target_name) VALUES
    ('Algorithms', 'Thuật Toán'),
    ('Architecture', 'Kiến Trúc Phần Mềm'),
    ('Binary', 'Hệ Nhị Phân'),
    ('Circuit', 'Mạch Điện'),
    ('Compiler Design', 'Trình Biên Dịch'),
    ('Database', 'Cơ Sở Dữ Liệu'),
    ('Differential', 'Phương Trình Vi Phân'),
    ('Electrical', 'Kỹ Thuật Điện'),
    ('Java', 'Lập Trình Java'),
    ('JavaScript', 'Lập Trình JavaScript'),
    ('Linux', 'Hệ Điều Hành Linux'),
    ('Machine Learning', 'Học Máy'),
    ('Mathematics', 'Toán Học'),
    ('Mechatronics', 'Cơ Điện Tử'),
    ('Networking', 'Mạng Máy Tính'),
    ('Neural Networks', 'Học Sâu'),
    ('Operating Systems', 'Hệ Điều Hành'),
    ('Python', 'Lập Trình Python'),
    ('Web Development', 'Lập Trình Web');

WITH missing_targets AS (
    SELECT DISTINCT target_name
    FROM tmp_tag_rename_map map
    WHERE EXISTS (SELECT 1 FROM tags source WHERE LOWER(source.name) = LOWER(map.source_name))
      AND NOT EXISTS (SELECT 1 FROM tags target WHERE LOWER(target.name) = LOWER(map.target_name))
)
INSERT INTO tags (id, created_at, updated_at, name)
SELECT
    760220000000000000 + ROW_NUMBER() OVER (ORDER BY target_name),
    NOW(),
    NOW(),
    target_name
FROM missing_targets;

WITH resolved AS (
    SELECT source.id AS source_id, target.id AS target_id
    FROM tmp_tag_rename_map map
    JOIN tags source ON LOWER(source.name) = LOWER(map.source_name)
    JOIN tags target ON LOWER(target.name) = LOWER(map.target_name)
    WHERE source.id <> target.id
)
UPDATE publication_tags pt
SET tag_id = resolved.target_id
FROM resolved
WHERE pt.tag_id = resolved.source_id
  AND NOT EXISTS (
      SELECT 1
      FROM publication_tags existing
      WHERE existing.publication_id = pt.publication_id
        AND existing.tag_id = resolved.target_id
  );

WITH resolved AS (
    SELECT source.id AS source_id, target.id AS target_id
    FROM tmp_tag_rename_map map
    JOIN tags source ON LOWER(source.name) = LOWER(map.source_name)
    JOIN tags target ON LOWER(target.name) = LOWER(map.target_name)
    WHERE source.id <> target.id
)
DELETE FROM publication_tags pt
USING resolved
WHERE pt.tag_id = resolved.source_id;

DELETE FROM tag_translations tr
USING tmp_tag_rename_map map, tags source
WHERE LOWER(source.name) = LOWER(map.source_name)
  AND tr.tag_id = source.id;

DELETE FROM tags source
USING tmp_tag_rename_map map
WHERE LOWER(source.name) = LOWER(map.source_name)
  AND NOT EXISTS (
      SELECT 1
      FROM publication_tags pt
      WHERE pt.tag_id = source.id
  );

DELETE FROM publication_tags pt
USING tags t
WHERE pt.tag_id = t.id
  AND LOWER(t.name) IN ('công nghệ thông tin', 'lập trình');

WITH junk_tag_names(name) AS (
    VALUES
        ('Aaaaaaaaaaaaaaaa'),
        ('Bai'),
        ('Bang'),
        ('Because'),
        ('Cach'),
        ('Computers'),
        ('Digital Design and Computer Architecture'),
        ('Essentials of Mechatronics'),
        ('Ham'),
        ('Numbers'),
        ('Publication'),
        ('Result'),
        ('Science'),
        ('Technology Engineering'),
        ('Toan'),
        ('Two'),
        ('Variables')
),
junk_tag_ids AS (
    SELECT t.id
    FROM tags t
    JOIN junk_tag_names junk ON LOWER(t.name) = LOWER(junk.name)
)
DELETE FROM publication_tags pt
USING junk_tag_ids junk
WHERE pt.tag_id = junk.id;

DELETE FROM publication_tags pt
USING tags t, publications p
WHERE pt.tag_id = t.id
  AND pt.publication_id = p.id
  AND LOWER(t.name) = LOWER(p.title);

DELETE FROM tag_translations tr
USING tags t
WHERE tr.tag_id = t.id
  AND NOT EXISTS (
      SELECT 1
      FROM publication_tags pt
      WHERE pt.tag_id = t.id
  );

DELETE FROM tags t
WHERE NOT EXISTS (
    SELECT 1
    FROM publication_tags pt
    WHERE pt.tag_id = t.id
);

WITH tag_translation_seed(vi_name, en_name) AS (
    VALUES
        ('Học Máy', 'Machine Learning'),
        ('Học Sâu', 'Deep Learning'),
        ('Học Có Giám Sát', 'Supervised Learning'),
        ('Kỹ Thuật Đặc Trưng', 'Feature Engineering'),
        ('Đánh Giá Mô Hình', 'Model Validation'),
        ('Trí Tuệ Nhân Tạo', 'Artificial Intelligence'),
        ('Khoa Học Dữ Liệu', 'Data Science'),
        ('Cơ Sở Dữ Liệu', 'Database'),
        ('Chuẩn Hóa Dữ Liệu', 'Database Normalization'),
        ('Xử Lý Truy Vấn', 'Query Processing'),
        ('Giao Dịch Dữ Liệu', 'Database Transactions'),
        ('Dữ Liệu Lớn', 'Big Data'),
        ('Thuật Toán', 'Algorithms'),
        ('Cấu Trúc Dữ Liệu', 'Data Structures'),
        ('Lập Trình Python', 'Python Programming'),
        ('Lập Trình Java', 'Java Programming'),
        ('Lập Trình JavaScript', 'JavaScript Programming'),
        ('Lập Trình Web', 'Web Development'),
        ('Kiến Trúc Phần Mềm', 'Software Architecture'),
        ('Mã Sạch', 'Clean Code'),
        ('Thiết Kế Hướng Miền', 'Domain Driven Design'),
        ('Kiểm Thử Phần Mềm', 'Software Testing'),
        ('Hệ Điều Hành', 'Operating Systems'),
        ('Hệ Điều Hành Linux', 'Linux Operating System'),
        ('Mạng Máy Tính', 'Computer Networks'),
        ('Bảo Mật Thông Tin', 'Cybersecurity'),
        ('Hệ Phân Tán', 'Distributed Systems'),
        ('Điện Toán Đám Mây', 'Cloud Computing'),
        ('Trình Biên Dịch', 'Compiler Design'),
        ('Kiến Trúc Máy Tính', 'Computer Architecture'),
        ('Hệ Nhị Phân', 'Binary Systems'),
        ('Toán Học', 'Mathematics'),
        ('Toán Rời Rạc', 'Discrete Mathematics'),
        ('Xác Suất Thống Kê', 'Probability And Statistics'),
        ('Đại Số Tuyến Tính', 'Linear Algebra'),
        ('Phương Trình Vi Phân', 'Differential Equations'),
        ('Tối Ưu Hóa', 'Optimization'),
        ('Kỹ Thuật Điện', 'Electrical Engineering'),
        ('Mạch Điện', 'Electrical Circuits'),
        ('Mạch Điện Tử', 'Electronic Circuits'),
        ('Hệ Thống Nhúng', 'Embedded Systems'),
        ('Điều Khiển Tự Động', 'Control Systems'),
        ('Cơ Điện Tử', 'Mechatronics'),
        ('Cơ Học Kỹ Thuật', 'Engineering Mechanics'),
        ('Thiết Kế Cơ Khí', 'Mechanical Design'),
        ('Robot', 'Robotics'),
        ('Kết Cấu Xây Dựng', 'Structural Engineering'),
        ('Kỹ Thuật Hóa Học', 'Chemical Engineering'),
        ('Môi Trường', 'Environment'),
        ('Công Nghệ Vật Liệu', 'Materials Science'),
        ('Hậu Cần', 'Logistics'),
        ('Tài Chính', 'Finance'),
        ('Marketing', 'Marketing'),
        ('Nghiên Cứu Khoa Học', 'Research Methods')
)
INSERT INTO tag_translations (tag_id, language_code, name)
SELECT t.id, 'en', seed.en_name
FROM tag_translation_seed seed
JOIN tags t ON LOWER(t.name) = LOWER(seed.vi_name)
ON CONFLICT (tag_id, language_code) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

UPDATE publications
SET ai_summary = NULL,
    updated_at = NOW()
WHERE ai_summary IS NOT NULL
  AND (
      LOWER(ai_summary) LIKE '%hệ thống ai%'
      OR LOWER(ai_summary) LIKE '%lập chỉ mục%'
      OR LOWER(ai_summary) LIKE '%metadata%'
      OR LOWER(ai_summary) LIKE '%dummy pdf file%'
      OR LOWER(ai_summary) LIKE 'title:%'
      OR LOWER(ai_summary) LIKE '%' || LOWER(title) || ' của % là tài liệu%'
  );

DELETE FROM publication_translations tr
WHERE NOT EXISTS (
    SELECT 1
    FROM publications p
    WHERE p.id = tr.publication_id
);

DELETE FROM category_translations tr
WHERE NOT EXISTS (
    SELECT 1
    FROM categories c
    WHERE c.id = tr.category_id
);

DELETE FROM tag_translations tr
WHERE NOT EXISTS (
    SELECT 1
    FROM tags t
    WHERE t.id = tr.tag_id
);

-- V7: Đánh giá hệ thống SmartLibrary, tách khỏi review sách.

CREATE TABLE IF NOT EXISTS system_reviews (
    id                  BIGINT NOT NULL,
    created_at          TIMESTAMPTZ(6) NULL,
    updated_at          TIMESTAMPTZ(6) NULL,
    reviewer_name       VARCHAR(100) NOT NULL,
    reviewer_role       VARCHAR(150) NULL,
    profile_picture_url TEXT NULL,
    rating              INT NOT NULL,
    comment             TEXT NOT NULL,
    is_published        BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT system_reviews_pkey PRIMARY KEY (id),
    CONSTRAINT system_reviews_rating_check CHECK (rating BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_system_reviews_published
ON system_reviews(is_published, rating DESC, created_at DESC);

INSERT INTO system_reviews (
    id, created_at, updated_at, reviewer_name, reviewer_role,
    profile_picture_url, rating, comment, is_published
) VALUES
    (1, NOW(), NOW(), 'Nguyễn Thị Mai', 'Sinh viên Công nghệ thông tin',
     'https://randomuser.me/api/portraits/women/44.jpg', 5,
     'Tìm kiếm AI giúp tôi tìm tài liệu đúng chủ đề nhanh hơn rất nhiều so với cách tìm theo từ khóa trước đây.', TRUE),
    (2, NOW(), NOW(), 'Trần Văn Nam', 'Sinh viên Quản lý công nghiệp',
     'https://randomuser.me/api/portraits/men/32.jpg', 5,
     'Theo dõi sách đang mượn, đặt trước và nhận thông báo rất rõ ràng. Trải nghiệm mượn trả gọn hơn nhiều.', TRUE),
    (3, NOW(), NOW(), 'Lê Thị Hương', 'Sinh viên Kỹ thuật hóa học',
     'https://randomuser.me/api/portraits/women/65.jpg', 5,
     'Gợi ý cá nhân hóa giúp tôi phát hiện thêm nhiều tài liệu liên quan đến môn học mà trước đó tôi không biết.', TRUE)
ON CONFLICT (id) DO UPDATE SET
    reviewer_name = EXCLUDED.reviewer_name,
    reviewer_role = EXCLUDED.reviewer_role,
    profile_picture_url = EXCLUDED.profile_picture_url,
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    is_published = EXCLUDED.is_published,
    updated_at = NOW();

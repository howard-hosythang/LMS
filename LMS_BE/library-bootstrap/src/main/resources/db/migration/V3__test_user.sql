-- ============================================================
-- V3: Add clean test user for Postman / integration testing
-- email: test.student@hcmut.edu.vn
-- password: Password@123  (bcrypt cost 10)
-- No fines, no active transactions
-- ============================================================

INSERT INTO users (id, created_at, updated_at, full_name, email, hashed_password,
                   status, ai_personalization_enabled, credit_score,
                   date_of_birth, phone_number, faculty, student_id,
                   address, provider, provider_id, profile_picture_url, last_login_at)
VALUES (6, NOW(), NOW(), 'Nguyễn Test Sinh Viên', 'test.student@hcmut.edu.vn',
        '$2a$10$B0AIAFUtwqSvnO46IogPfeaUR/SRYXGgQcezUasUWpbBMM9R/DCB6',
        'ACTIVE', FALSE, 100, '2003-01-01', '0909000006',
        'KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH', '2199999',
        'TP. Hồ Chí Minh', NULL, NULL, NULL, NULL);

INSERT INTO user_roles (user_id, role_id) VALUES (6, 3); -- STUDENT

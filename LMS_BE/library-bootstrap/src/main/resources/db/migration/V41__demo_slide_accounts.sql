-- Demo accounts for instructor walkthrough.
-- User password: 123456. Admin password is handled by earlier migrations.

WITH demo_accounts AS (
    SELECT *
    FROM (VALUES
        (910001::BIGINT, 'Nguyễn Minh User 1', 'user1@hcmut.edu.vn', '2250001', 'KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH', NULL::VARCHAR, 'STUDENT', '0902000001', 'TP.HCM'),
        (910002::BIGINT, 'Trần Minh User 2', 'user2@hcmut.edu.vn', '2250002', 'KHOA_DIEN_DIEN_TU', NULL::VARCHAR, 'STUDENT', '0902000002', 'TP.HCM'),
        (910003::BIGINT, 'Lê Minh User 3', 'user3@hcmut.edu.vn', '2250003', 'KHOA_QUAN_LY_CONG_NGHIEP', NULL::VARCHAR, 'STUDENT', '0902000003', 'TP.HCM'),
        (910101::BIGINT, 'Librarian 1', 'librarian1@hcmut.edu.vn', 'LIB0901', NULL::VARCHAR, 'CAMPUS_1', 'LIBRARIAN', '0903000001', 'Thư viện Cơ sở 1 - Lý Thường Kiệt'),
        (910102::BIGINT, 'Librarian 2', 'librarian2@hcmut.edu.vn', 'LIB0902', NULL::VARCHAR, 'CAMPUS_2', 'LIBRARIAN', '0903000002', 'Thư viện Cơ sở 2 - Dĩ An'),
        (910103::BIGINT, 'Librarian 3', 'librarian3@hcmut.edu.vn', 'LIB0903', NULL::VARCHAR, 'ALL', 'LIBRARIAN', '0903000003', 'Library74')
    ) AS v(id, full_name, email, identity_code, faculty, librarian_campus, role_name, phone_number, address)
),
upserted AS (
    INSERT INTO users (
        id, created_at, updated_at, full_name, email, hashed_password,
        status, credit_score, date_of_birth,
        phone_number, faculty, student_id, address, provider, provider_id,
        profile_picture_url, last_login_at, contribution_score, is_verified, librarian_campus
    )
    SELECT
        id,
        NOW(),
        NOW(),
        full_name,
        email,
        '$2a$10$hgmel/e7IGHnvLry9joFjegPQIse5WPwNEwr2ybB1fs9fHNp6PjNy',
        'ACTIVE',
        100,
        CASE WHEN role_name = 'STUDENT' THEN DATE '2004-01-01' ELSE DATE '1990-01-01' END,
        phone_number,
        faculty,
        identity_code,
        address,
        NULL,
        NULL,
        NULL,
        NULL,
        0,
        TRUE,
        librarian_campus
    FROM demo_accounts
    ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        hashed_password = EXCLUDED.hashed_password,
        status = 'ACTIVE',
        credit_score = 100,
        phone_number = EXCLUDED.phone_number,
        faculty = EXCLUDED.faculty,
        student_id = EXCLUDED.student_id,
        address = EXCLUDED.address,
        contribution_score = EXCLUDED.contribution_score,
        is_verified = TRUE,
        librarian_campus = EXCLUDED.librarian_campus,
        updated_at = NOW()
    RETURNING id, email
)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN demo_accounts d ON d.email = u.email
JOIN roles r ON r.role_name = d.role_name
ON CONFLICT DO NOTHING;

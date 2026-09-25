UPDATE users
SET hashed_password = '$2a$10$y5f4WDcKOB0IKNRpmxOiUeCQU6OZe/DNynWxOv0sxBGlkU928wsoW',
    updated_at = NOW()
WHERE hashed_password = '$2a$10$B0AIAFUtwqSvnO46IogPfeaUR/SRYXGgQcezUasUWpbBMM9R/DCB6';

UPDATE users
SET hashed_password = '$2a$10$y5f4WDcKOB0IKNRpmxOiUeCQU6OZe/DNynWxOv0sxBGlkU928wsoW',
    status = 'ACTIVE',
    updated_at = NOW()
WHERE email = 'admin@hcmut.edu.vn';

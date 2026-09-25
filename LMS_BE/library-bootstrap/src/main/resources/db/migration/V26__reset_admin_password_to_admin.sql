UPDATE users
SET hashed_password = '$2a$10$yQr0GqkYGvj/VQNTtfuucOeDj.TmnPOgqZ6o6pwqO5C5yLY.Q74ei',
    status = 'ACTIVE',
    updated_at = NOW()
WHERE email = 'admin@hcmut.edu.vn';

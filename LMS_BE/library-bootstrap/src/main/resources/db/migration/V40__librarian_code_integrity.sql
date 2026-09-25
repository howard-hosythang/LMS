UPDATE users u
SET student_id = 'LIB' || LPAD(SUBSTRING(u.student_id FROM 4), 4, '0')
WHERE u.student_id ~ '^LIB[0-9]{1,3}$'
  AND NOT EXISTS (
      SELECT 1
      FROM users existing
      WHERE existing.student_id = 'LIB' || LPAD(SUBSTRING(u.student_id FROM 4), 4, '0')
  );

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_librarian_code
    ON users (student_id)
    WHERE student_id ~ '^LIB[0-9]{4}$';

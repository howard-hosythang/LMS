WITH demo_roles AS (
    SELECT *
    FROM (VALUES
        ('user1@hcmut.edu.vn', 'STUDENT'),
        ('user2@hcmut.edu.vn', 'STUDENT'),
        ('user3@hcmut.edu.vn', 'STUDENT'),
        ('librarian1@hcmut.edu.vn', 'LIBRARIAN'),
        ('librarian2@hcmut.edu.vn', 'LIBRARIAN'),
        ('librarian3@hcmut.edu.vn', 'LIBRARIAN')
    ) AS v(email, role_name)
)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM demo_roles d
JOIN users u ON u.email = d.email
JOIN roles r ON r.role_name = d.role_name
ON CONFLICT DO NOTHING;

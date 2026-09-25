-- V4__batch_publications.sql
-- Batch insert: 27 new publications + authors + publishers + categories + items
-- Skips Clean Code (pub 1) and Refactoring (pub 3) — already in V2

-- ============================================================
-- PUBLISHERS (id 6–13)
-- ============================================================
INSERT INTO publishers (id, created_at, updated_at, name, address) VALUES
    (6,  NOW(), NOW(), 'MIT Press',                  'Cambridge, MA, USA'),
    (7,  NOW(), NOW(), 'Wiley',                      'Hoboken, NJ, USA'),
    (8,  NOW(), NOW(), 'McGraw-Hill Education',      'New York, NY, USA'),
    (9,  NOW(), NOW(), 'Morgan Kaufmann',            'Burlington, MA, USA'),
    (10, NOW(), NOW(), 'Microsoft Press',            'Redmond, WA, USA'),
    (11, NOW(), NOW(), 'No Starch Press',            'San Francisco, CA, USA'),
    (12, NOW(), NOW(), 'Cambridge University Press', 'Cambridge, United Kingdom'),
    (13, NOW(), NOW(), 'Open Source / Online',       'Internet');

-- ============================================================
-- AUTHORS (id 6–55)
-- ============================================================
INSERT INTO authors (id, created_at, updated_at, name, bio, date_of_birth, date_of_death) VALUES
    (6,  NOW(), NOW(), 'Harold Abelson',        'Professor MIT, co-author SICP',                                          '1947-04-26', NULL),
    (7,  NOW(), NOW(), 'Gerald Jay Sussman',    'Professor MIT, co-author SICP',                                          '1947-02-08', NULL),
    (8,  NOW(), NOW(), 'Nell Dale',             'Professor UT Austin, CS educator',                                       '1945-01-01', NULL),
    (9,  NOW(), NOW(), 'John Lewis',            'Professor Virginia Tech, CS educator',                                   '1958-01-01', NULL),
    (10, NOW(), NOW(), 'J. Glenn Brookshear',   'Professor Marquette University, author CS: An Overview',                 '1950-01-01', NULL),
    (11, NOW(), NOW(), 'Allen B. Downey',       'Professor Olin College, author Think Python and How to Think',           '1967-01-01', NULL),
    (12, NOW(), NOW(), 'Ronald L. Graham',      'Mathematician, co-author Concrete Mathematics',                          '1935-10-31', '2020-07-06'),
    (13, NOW(), NOW(), 'Donald E. Knuth',       'Professor Stanford, The Art of Computer Programming',                    '1938-01-10', NULL),
    (14, NOW(), NOW(), 'Oren Patashnik',        'Computer scientist, co-author Concrete Mathematics',                     '1954-01-01', NULL),
    (15, NOW(), NOW(), 'N. David Mermin',       'Professor Cornell, author Quantum Computer Science',                     '1935-03-30', NULL),
    (16, NOW(), NOW(), 'Boaz Barak',            'Professor Harvard, author Introduction to Theoretical CS',               '1974-01-01', NULL),
    (17, NOW(), NOW(), 'Eric Lehman',           'Co-author Mathematics for Computer Science (MIT)',                       '1970-01-01', NULL),
    (18, NOW(), NOW(), 'F. Thomson Leighton',   'Professor MIT, co-author Mathematics for Computer Science',              '1956-11-06', NULL),
    (19, NOW(), NOW(), 'Albert R. Meyer',       'Professor MIT, co-author Mathematics for Computer Science',              '1941-01-01', NULL),
    (20, NOW(), NOW(), 'Thomas H. Cormen',      'Professor Dartmouth, co-author Introduction to Algorithms',              '1956-01-01', NULL),
    (21, NOW(), NOW(), 'Charles E. Leiserson',  'Professor MIT, co-author Introduction to Algorithms',                   '1953-01-01', NULL),
    (22, NOW(), NOW(), 'Ronald L. Rivest',      'Professor MIT, co-author CLRS, RSA inventor',                           '1947-05-06', NULL),
    (23, NOW(), NOW(), 'Clifford Stein',        'Professor Columbia, co-author Introduction to Algorithms',               '1965-01-01', NULL),
    (24, NOW(), NOW(), 'Erich Gamma',           'Software engineer, Gang of Four, Eclipse architect',                     '1961-03-13', NULL),
    (25, NOW(), NOW(), 'Richard Helm',          'Software engineer, Gang of Four',                                        '1960-01-01', NULL),
    (26, NOW(), NOW(), 'Ralph Johnson',         'Professor UIUC, Gang of Four',                                           '1955-01-01', NULL),
    (27, NOW(), NOW(), 'John Vlissides',        'Software engineer, Gang of Four',                                        '1961-08-02', '2005-11-24'),
    (28, NOW(), NOW(), 'Abraham Silberschatz',  'Professor Yale, co-author OS Concepts and Database Concepts',            '1952-01-01', NULL),
    (29, NOW(), NOW(), 'Peter B. Galvin',       'Co-author Operating System Concepts',                                    '1960-01-01', NULL),
    (30, NOW(), NOW(), 'Greg Gagne',            'Professor Westminster College, co-author OS Concepts',                   '1965-01-01', NULL),
    (31, NOW(), NOW(), 'Andrew S. Tanenbaum',   'Professor VU Amsterdam, author Modern OS and Computer Networks',         '1944-03-16', NULL),
    (32, NOW(), NOW(), 'Stuart Russell',        'Professor UC Berkeley, co-author AI: A Modern Approach',                 '1962-01-01', NULL),
    (33, NOW(), NOW(), 'Peter Norvig',          'Director of Research Google, co-author AI: A Modern Approach',           '1956-12-14', NULL),
    (34, NOW(), NOW(), 'Ian Goodfellow',        'Research scientist, author Deep Learning textbook',                      '1985-01-01', NULL),
    (35, NOW(), NOW(), 'Yoshua Bengio',         'Professor Université de Montréal, Turing Award winner',                  '1964-03-05', NULL),
    (36, NOW(), NOW(), 'Aaron Courville',       'Professor Université de Montréal, co-author Deep Learning',              '1980-01-01', NULL),
    (37, NOW(), NOW(), 'Aurélien Géron',        'Author Hands-On Machine Learning with Scikit-Learn, Keras, TF',         '1973-01-01', NULL),
    (38, NOW(), NOW(), 'Henry S. Korth',        'Professor Lehigh, co-author Database System Concepts',                  '1955-01-01', NULL),
    (39, NOW(), NOW(), 'S. Sudarshan',          'Professor IIT Bombay, co-author Database System Concepts',              '1966-01-01', NULL),
    (40, NOW(), NOW(), 'Alfred V. Aho',         'Professor Columbia, co-author Compilers (Dragon Book)',                  '1941-08-09', NULL),
    (41, NOW(), NOW(), 'Monica S. Lam',         'Professor Stanford, co-author Compilers',                               '1961-01-01', NULL),
    (42, NOW(), NOW(), 'Ravi Sethi',            'VP Avaya, co-author Compilers',                                          '1947-01-01', NULL),
    (43, NOW(), NOW(), 'Jeffrey D. Ullman',     'Professor Stanford emeritus, co-author Compilers',                       '1942-11-22', NULL),
    (44, NOW(), NOW(), 'David A. Patterson',    'Professor UC Berkeley, co-author Computer Organization and Design',      '1947-11-16', NULL),
    (45, NOW(), NOW(), 'John L. Hennessy',      'President Stanford, co-author Computer Organization and Design',         '1952-09-22', NULL),
    (46, NOW(), NOW(), 'Steve McConnell',       'Author Code Complete, software engineering expert',                      '1962-01-01', NULL),
    (47, NOW(), NOW(), 'Kyle Simpson',          'Author You Don''t Know JS series',                                       '1980-01-01', NULL),
    (48, NOW(), NOW(), 'Marijn Haverbeke',      'Author Eloquent JavaScript',                                             '1983-01-01', NULL),
    (49, NOW(), NOW(), 'Al Sweigart',           'Author Automate the Boring Stuff with Python',                           '1982-01-01', NULL),
    (50, NOW(), NOW(), 'William Shotts',        'Author The Linux Command Line',                                          '1963-01-01', NULL),
    (51, NOW(), NOW(), 'Aston Zhang',           'Amazon, co-author Dive Into Deep Learning',                              '1988-01-01', NULL),
    (52, NOW(), NOW(), 'Zachary C. Lipton',     'Professor CMU, co-author Dive Into Deep Learning',                      '1990-01-01', NULL),
    (53, NOW(), NOW(), 'Mu Li',                 'Amazon, co-author Dive Into Deep Learning',                              '1985-01-01', NULL),
    (54, NOW(), NOW(), 'Alexander J. Smola',    'Amazon, co-author Dive Into Deep Learning',                              '1972-08-02', NULL),
    (55, NOW(), NOW(), 'Matti Luukkainen',      'Professor University of Helsinki, creator Full Stack Open',              '1978-01-01', NULL);

-- ============================================================
-- CATEGORIES (id 6–13)
-- ============================================================
INSERT INTO categories (id, created_at, updated_at, name, bio, parent_category_id) VALUES
    (6,  NOW(), NOW(), 'Trí Tuệ Nhân Tạo',              'AI, Machine Learning, Deep Learning',              1),
    (7,  NOW(), NOW(), 'Hệ Điều Hành',                   'Sách về hệ điều hành và quản lý tài nguyên',      1),
    (8,  NOW(), NOW(), 'Mạng Máy Tính',                  'Sách về giao thức mạng và hạ tầng mạng',          1),
    (9,  NOW(), NOW(), 'Thuật Toán & Cấu Trúc Dữ Liệu', 'Sách về giải thuật và data structures',            2),
    (10, NOW(), NOW(), 'Khoa Học Máy Tính Cơ Bản',       'Nền tảng khoa học máy tính và lý thuyết',         1),
    (11, NOW(), NOW(), 'Lập Trình Web',                  'Web development: frontend, backend, fullstack',     2),
    (12, NOW(), NOW(), 'Kiến Trúc Máy Tính',             'Computer organization và kiến trúc phần cứng',     1),
    (13, NOW(), NOW(), 'Trình Biên Dịch',                'Compiler design và lý thuyết ngôn ngữ lập trình',  1);

-- ============================================================
-- TAGS (id 6–15)
-- ============================================================
INSERT INTO tags (id, created_at, updated_at, name) VALUES
    (6,  NOW(), NOW(), 'Python'),
    (7,  NOW(), NOW(), 'JavaScript'),
    (8,  NOW(), NOW(), 'Linux'),
    (9,  NOW(), NOW(), 'Algorithms'),
    (10, NOW(), NOW(), 'Neural Networks'),
    (11, NOW(), NOW(), 'Web Development'),
    (12, NOW(), NOW(), 'Operating Systems'),
    (13, NOW(), NOW(), 'Networking'),
    (14, NOW(), NOW(), 'Compiler Design'),
    (15, NOW(), NOW(), 'Mathematics');

-- ============================================================
-- PUBLICATIONS (id 6–32)
-- ============================================================
INSERT INTO publications (id, created_at, updated_at, title, subtitle, isbn, language, edition,
                          publication_year, number_of_pages, description, publisher_id,
                          cover_image_url, file_url, ai_summary, ai_target_audience,
                          size, weight, call_number) VALUES

    -- 1. SICP
    (6, NOW(), NOW(),
     'Structure and Interpretation of Computer Programs',
     'Second Edition',
     '9780262510875', 'English', 2, 1996, 657,
     'Cuốn sách kinh điển của MIT, dùng ngôn ngữ Scheme để dạy lập trình theo phong cách hàm, trừu tượng hóa, và meta-circular evaluation.',
     6, NULL, NULL, NULL, NULL, '24x18cm', 1.1, '005.133 A138s'),

    -- 2. Computer Science Illuminated
    (7, NOW(), NOW(),
     'Computer Science Illuminated',
     'An Introduction to the Science and Technology of Computing',
     '9781284155617', 'English', 7, 2019, 602,
     'Cái nhìn tổng quan toàn diện về khoa học máy tính: từ hệ nhị phân, phần cứng, hệ điều hành đến mạng và bảo mật. Lý tưởng cho sinh viên năm nhất.',
     8, NULL, NULL, NULL, NULL, '27x21cm', 1.2, '004 D138c'),

    -- 3. CS: An Overview
    (8, NOW(), NOW(),
     'Computer Science: An Overview',
     'Twelfth Edition',
     '9780133760064', 'English', 12, 2014, 675,
     'Khảo sát toàn bộ lĩnh vực khoa học máy tính từ lịch sử hình thành đến xu hướng hiện đại như cloud và IoT. Phù hợp cho môn nhập môn đại học.',
     4, NULL, NULL, NULL, NULL, '26x21cm', 1.3, '004 B873c'),

    -- 4. How to Think Like a CS
    (9, NOW(), NOW(),
     'How to Think Like a Computer Scientist',
     'Learning with Python 3',
     '9780987566331', 'English', 3, 2012, 242,
     'Nhập môn lập trình Python theo tư duy khoa học máy tính: từ biến, hàm, đệ quy đến OOP. Miễn phí và mã nguồn mở.',
     13, NULL, NULL, NULL, NULL, '23x18cm', 0.5, '005.133 D748h'),

    -- 5. Concrete Mathematics
    (10, NOW(), NOW(),
     'Concrete Mathematics',
     'A Foundation for Computer Science',
     '9780201558029', 'English', 2, 1994, 657,
     'Nền tảng toán học bắt buộc cho CS: tổng quát hóa hàm đệ quy, toán tổ hợp, lý thuyết số và giải tích rời rạc.',
     4, NULL, NULL, NULL, NULL, '24x18cm', 1.2, '510.285 G739c'),

    -- 6. Quantum CS
    (11, NOW(), NOW(),
     'Quantum Computer Science',
     'An Introduction',
     '9780521876582', 'English', 1, 2007, 263,
     'Giới thiệu về máy tính lượng tử: qubit, thuật toán Shor và Grover, mạch lượng tử và lý thuyết phức tạp lượng tử. Không cần nền tảng vật lý lượng tử.',
     12, NULL, NULL, NULL, NULL, '24x17cm', 0.6, '004.1 M565q'),

    -- 7. Introduction to Theoretical CS
    (12, NOW(), NOW(),
     'Introduction to Theoretical Computer Science',
     'Computation and Complexity',
     '9781734662559', 'English', 1, 2020, 446,
     'Lý thuyết tính toán hiện đại: automata, ngôn ngữ hình thức, NP-completeness, mật mã học và proof complexity. Sách mở miễn phí của Harvard.',
     13, NULL, NULL, NULL, NULL, '24x18cm', 0.9, '004.01 B224i'),

    -- 8. Mathematics for CS
    (13, NOW(), NOW(),
     'Mathematics for Computer Science',
     'MIT OpenCourseWare Edition',
     '9780262042925', 'English', 1, 2018, 979,
     'Tài liệu toán cho CS của MIT: logic mệnh đề, bằng chứng, lý thuyết đồ thị, xác suất và đại số tuyến tính. Tài liệu khóa 6.042J.',
     6, NULL, NULL, NULL, NULL, '27x21cm', 1.5, '510.285 L519m'),

    -- 9. Introduction to Algorithms (CLRS)
    (14, NOW(), NOW(),
     'Introduction to Algorithms',
     'Fourth Edition',
     '9780262046305', 'English', 4, 2022, 1312,
     'Sách giáo khoa thuật toán kinh điển nhất thế giới. Phân tích chi tiết: sắp xếp, tìm kiếm, đồ thị, lập trình động, NP và thuật toán xấp xỉ.',
     6, NULL, NULL, NULL, NULL, '25x19cm', 2.1, '005.1 C813i'),

    -- 10. Design Patterns (GoF)
    (15, NOW(), NOW(),
     'Design Patterns',
     'Elements of Reusable Object-Oriented Software',
     '9780201633610', 'English', 1, 1994, 395,
     'Cuốn sách Gang of Four định nghĩa 23 design pattern kinh điển. Cẩm nang không thể thiếu cho lập trình hướng đối tượng chuyên nghiệp.',
     4, NULL, NULL, NULL, NULL, '23x18cm', 0.8, '005.12 G186d'),

    -- 11. Operating System Concepts
    (16, NOW(), NOW(),
     'Operating System Concepts',
     'Eighth Edition (Dinosaur Book)',
     '9780470128725', 'English', 8, 2008, 976,
     'Sách giáo khoa hệ điều hành toàn diện: quản lý tiến trình, bộ nhớ, file system, I/O và bảo mật. Được dùng tại hàng nghìn trường đại học.',
     7, NULL, NULL, NULL, NULL, '25x19cm', 1.8, '005.43 S587o'),

    -- 12. Computer Networks
    (17, NOW(), NOW(),
     'Computer Networks',
     'Fifth Edition',
     '9780132126953', 'English', 5, 2010, 960,
     'Phân tích toàn diện mạng máy tính theo mô hình phân lớp 5 tầng: từ tầng vật lý (Ethernet, WiFi) đến tầng ứng dụng (HTTP, DNS, P2P).',
     4, NULL, NULL, NULL, NULL, '25x19cm', 1.8, '004.6 T164c'),

    -- 13. AI: A Modern Approach
    (18, NOW(), NOW(),
     'Artificial Intelligence: A Modern Approach',
     'Fourth Edition',
     '9780134610993', 'English', 4, 2020, 1132,
     'Sách giáo khoa AI toàn diện nhất: search, game playing, planning, probabilistic reasoning, machine learning, NLP và computer vision.',
     4, NULL, NULL, NULL, NULL, '26x21cm', 2.2, '006.3 R961a'),

    -- 14. Deep Learning (Goodfellow)
    (19, NOW(), NOW(),
     'Deep Learning',
     'An MIT Press Book',
     '9780262035613', 'English', 1, 2016, 800,
     'Nền tảng lý thuyết về deep learning: MLP, CNN, RNN, regularization, optimization, generative models và practical methodology.',
     6, NULL, NULL, NULL, NULL, '24x19cm', 1.6, '006.31 G649d'),

    -- 15. Hands-On ML
    (20, NOW(), NOW(),
     'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow',
     'Third Edition',
     '9781098125974', 'English', 3, 2022, 861,
     'Học ML thực hành từ A-Z: regression, SVM, decision trees với scikit-learn; CNN, RNN, Transformer, GANs với Keras/TensorFlow.',
     5, NULL, NULL, NULL, NULL, '24x18cm', 1.4, '006.31 G384h'),

    -- 16. Database System Concepts
    (21, NOW(), NOW(),
     'Database System Concepts',
     'Seventh Edition',
     '9780078022159', 'English', 7, 2019, 1392,
     'Sách giáo khoa CSDL toàn diện: mô hình quan hệ, SQL, thiết kế bình thường hóa, transaction, concurrency control và NoSQL.',
     8, NULL, NULL, NULL, NULL, '26x21cm', 2.3, '005.74 S587d'),

    -- 17. Modern Operating Systems
    (22, NOW(), NOW(),
     'Modern Operating Systems',
     'Fourth Edition',
     '9780133591620', 'English', 4, 2014, 1137,
     'Phân tích sâu kiến trúc hệ điều hành: UNIX, Windows, Linux, Android, virtualization và distributed systems.',
     4, NULL, NULL, NULL, NULL, '25x19cm', 1.9, '005.43 T164m'),

    -- 18. Compilers (Dragon Book)
    (23, NOW(), NOW(),
     'Compilers: Principles, Techniques, and Tools',
     'Second Edition (Dragon Book)',
     '9780321486813', 'English', 2, 2006, 1009,
     'Sách kinh điển về xây dựng trình biên dịch: lexer, parser, semantic analysis, intermediate code, optimization và code generation.',
     4, NULL, NULL, NULL, NULL, '25x19cm', 1.8, '005.453 A284c'),

    -- 19. Computer Organization and Design (RISC-V)
    (24, NOW(), NOW(),
     'Computer Organization and Design',
     'RISC-V Edition, Second Edition',
     '9780128203316', 'English', 2, 2020, 736,
     'Kiến trúc máy tính theo RISC-V: datapath, control unit, pipeline, memory hierarchy, I/O và giới thiệu parallelism.',
     9, NULL, NULL, NULL, NULL, '25x19cm', 1.5, '004.22 P317c'),

    -- 20. Code Complete
    (25, NOW(), NOW(),
     'Code Complete',
     'Second Edition',
     '9780735619678', 'English', 2, 2004, 960,
     'Bách khoa toàn thư về xây dựng phần mềm: từ construction fundamentals, naming, routines, OOP đến testing, debugging và code quality.',
     10, NULL, NULL, NULL, NULL, '24x18cm', 1.5, '005.1 M139c'),

    -- 21. You Don't Know JS Yet
    (26, NOW(), NOW(),
     'You Don''t Know JS Yet',
     'Get Started (Series Book 1)',
     '9781491924464', 'English', 2, 2020, 143,
     'Khám phá cơ chế nội tại của JavaScript: hoisting, scope, closures, prototype chain, this và async patterns. Sách miễn phí trên GitHub.',
     5, NULL, NULL, NULL, NULL, '23x15cm', 0.3, '005.133 S592y'),

    -- 22. Eloquent JavaScript
    (27, NOW(), NOW(),
     'Eloquent JavaScript',
     'A Modern Introduction to Programming',
     '9781593279509', 'English', 3, 2018, 472,
     'Học JavaScript hiệu quả: từ căn bản, lập trình hàm, OOP đến DOM manipulation, Node.js và regular expressions. Miễn phí online.',
     11, NULL, NULL, NULL, NULL, '23x18cm', 0.8, '005.133 H394e'),

    -- 23. Automate the Boring Stuff
    (28, NOW(), NOW(),
     'Automate the Boring Stuff with Python',
     'Second Edition',
     '9781593279929', 'English', 2, 2019, 592,
     'Học Python qua dự án thực tế: xử lý file và folder, web scraping, Excel/Word/PDF, email, lịch, GUI automation với PyAutoGUI.',
     11, NULL, NULL, NULL, NULL, '23x18cm', 0.9, '005.133 S972a'),

    -- 24. The Linux Command Line
    (29, NOW(), NOW(),
     'The Linux Command Line',
     'A Complete Introduction, Second Edition',
     '9781593273897', 'English', 2, 2019, 504,
     'Hướng dẫn toàn diện về Linux shell: điều hướng filesystem, text processing, shell scripting, permissions, job control và networking tools.',
     11, NULL, NULL, NULL, NULL, '23x18cm', 0.8, '005.432 S558l'),

    -- 25. Think Python
    (30, NOW(), NOW(),
     'Think Python',
     'How to Think Like a Computer Scientist, Second Edition',
     '9781491939369', 'English', 2, 2015, 291,
     'Nhập môn lập trình Python cho người mới: tư duy thuật toán, hàm, đệ quy, data structures và OOP. Miễn phí online.',
     5, NULL, NULL, NULL, NULL, '23x18cm', 0.5, '005.133 D748t'),

    -- 26. Dive Into Deep Learning
    (31, NOW(), NOW(),
     'Dive Into Deep Learning',
     'Interactive Deep Learning Book with PyTorch, JAX, MXNet, and TensorFlow',
     '9781009389433', 'English', 1, 2023, 1200,
     'Tài liệu deep learning tương tác từ Amazon: lý thuyết kèm code PyTorch/TensorFlow, từ linear regression đến Transformer và GAN.',
     12, NULL, NULL, NULL, NULL, '26x21cm', 2.0, '006.31 Z63d'),

    -- 27. Full Stack Open
    (32, NOW(), NOW(),
     'Full Stack Open',
     'Deep Dive Into Modern Web Development',
     '9789521430046', 'English', 1, 2023, 800,
     'Khóa học full-stack miễn phí của ĐH Helsinki: React, Redux, Node.js, MongoDB, TypeScript, GraphQL, React Native. Được dùng trong chương trình đại học.',
     13, NULL, NULL, NULL, NULL, '27x21cm', 1.2, '005.2762 L959f');

-- ============================================================
-- PUBLICATION ↔ AUTHORS  (id 6–58)
-- ============================================================
INSERT INTO publication_authors (id, publication_id, author_id) VALUES
    -- pub 6: SICP
    (6,  6,  6),   -- Harold Abelson
    (7,  6,  7),   -- Gerald Jay Sussman
    -- pub 7: CS Illuminated
    (8,  7,  8),   -- Nell Dale
    (9,  7,  9),   -- John Lewis
    -- pub 8: CS Overview
    (10, 8,  10),  -- J. Glenn Brookshear
    -- pub 9: How to Think
    (11, 9,  11),  -- Allen B. Downey
    -- pub 10: Concrete Mathematics
    (12, 10, 12),  -- Ronald L. Graham
    (13, 10, 13),  -- Donald E. Knuth
    (14, 10, 14),  -- Oren Patashnik
    -- pub 11: Quantum CS
    (15, 11, 15),  -- N. David Mermin
    -- pub 12: Theoretical CS
    (16, 12, 16),  -- Boaz Barak
    -- pub 13: Math for CS
    (17, 13, 17),  -- Eric Lehman
    (18, 13, 18),  -- F. Thomson Leighton
    (19, 13, 19),  -- Albert R. Meyer
    -- pub 14: CLRS
    (20, 14, 20),  -- Thomas H. Cormen
    (21, 14, 21),  -- Charles E. Leiserson
    (22, 14, 22),  -- Ronald L. Rivest
    (23, 14, 23),  -- Clifford Stein
    -- pub 15: Design Patterns (GoF)
    (24, 15, 24),  -- Erich Gamma
    (25, 15, 25),  -- Richard Helm
    (26, 15, 26),  -- Ralph Johnson
    (27, 15, 27),  -- John Vlissides
    -- pub 16: OS Concepts
    (28, 16, 28),  -- Abraham Silberschatz
    (29, 16, 29),  -- Peter B. Galvin
    (30, 16, 30),  -- Greg Gagne
    -- pub 17: Computer Networks
    (31, 17, 31),  -- Andrew S. Tanenbaum
    -- pub 18: AI
    (32, 18, 32),  -- Stuart Russell
    (33, 18, 33),  -- Peter Norvig
    -- pub 19: Deep Learning
    (34, 19, 34),  -- Ian Goodfellow
    (35, 19, 35),  -- Yoshua Bengio
    (36, 19, 36),  -- Aaron Courville
    -- pub 20: Hands-On ML
    (37, 20, 37),  -- Aurélien Géron
    -- pub 21: Database System Concepts
    (38, 21, 28),  -- Abraham Silberschatz (reuse)
    (39, 21, 38),  -- Henry S. Korth
    (40, 21, 39),  -- S. Sudarshan
    -- pub 22: Modern OS
    (41, 22, 31),  -- Andrew S. Tanenbaum (reuse)
    -- pub 23: Compilers (Dragon Book)
    (42, 23, 40),  -- Alfred V. Aho
    (43, 23, 41),  -- Monica S. Lam
    (44, 23, 42),  -- Ravi Sethi
    (45, 23, 43),  -- Jeffrey D. Ullman
    -- pub 24: Computer Organization and Design
    (46, 24, 44),  -- David A. Patterson
    (47, 24, 45),  -- John L. Hennessy
    -- pub 25: Code Complete
    (48, 25, 46),  -- Steve McConnell
    -- pub 26: YDKJS
    (49, 26, 47),  -- Kyle Simpson
    -- pub 27: Eloquent JavaScript
    (50, 27, 48),  -- Marijn Haverbeke
    -- pub 28: Automate the Boring Stuff
    (51, 28, 49),  -- Al Sweigart
    -- pub 29: The Linux Command Line
    (52, 29, 50),  -- William Shotts
    -- pub 30: Think Python
    (53, 30, 11),  -- Allen B. Downey (reuse)
    -- pub 31: Dive Into Deep Learning
    (54, 31, 51),  -- Aston Zhang
    (55, 31, 52),  -- Zachary C. Lipton
    (56, 31, 53),  -- Mu Li
    (57, 31, 54),  -- Alexander J. Smola
    -- pub 32: Full Stack Open
    (58, 32, 55);  -- Matti Luukkainen

-- ============================================================
-- PUBLICATION ↔ CATEGORIES  (id 6–49)
-- ============================================================
INSERT INTO publication_categories (id, publication_id, category_id) VALUES
    (6,  6,  2),   -- SICP → Lập Trình
    (7,  6,  10),  -- SICP → CS Cơ Bản
    (8,  7,  10),  -- CS Illuminated → CS Cơ Bản
    (9,  7,  1),   -- CS Illuminated → CNTT
    (10, 8,  10),  -- CS Overview → CS Cơ Bản
    (11, 8,  1),   -- CS Overview → CNTT
    (12, 9,  2),   -- How to Think → Lập Trình
    (13, 9,  10),  -- How to Think → CS Cơ Bản
    (14, 10, 5),   -- Concrete Math → Toán Ứng Dụng
    (15, 10, 9),   -- Concrete Math → Thuật Toán
    (16, 11, 10),  -- Quantum CS → CS Cơ Bản
    (17, 12, 10),  -- Theoretical CS → CS Cơ Bản
    (18, 12, 9),   -- Theoretical CS → Thuật Toán
    (19, 13, 5),   -- Math for CS → Toán Ứng Dụng
    (20, 13, 9),   -- Math for CS → Thuật Toán
    (21, 14, 9),   -- CLRS → Thuật Toán
    (22, 14, 2),   -- CLRS → Lập Trình
    (23, 15, 3),   -- Design Patterns → Kiến Trúc Phần Mềm
    (24, 15, 2),   -- Design Patterns → Lập Trình
    (25, 16, 7),   -- OS Concepts → Hệ Điều Hành
    (26, 17, 8),   -- Computer Networks → Mạng Máy Tính
    (27, 18, 6),   -- AI → Trí Tuệ Nhân Tạo
    (28, 19, 6),   -- Deep Learning → Trí Tuệ Nhân Tạo
    (29, 20, 6),   -- Hands-On ML → Trí Tuệ Nhân Tạo
    (30, 20, 2),   -- Hands-On ML → Lập Trình
    (31, 21, 4),   -- DB Concepts → Cơ Sở Dữ Liệu
    (32, 22, 7),   -- Modern OS → Hệ Điều Hành
    (33, 23, 13),  -- Compilers → Trình Biên Dịch
    (34, 23, 2),   -- Compilers → Lập Trình
    (35, 24, 12),  -- Computer Org → Kiến Trúc Máy Tính
    (36, 25, 3),   -- Code Complete → Kiến Trúc Phần Mềm
    (37, 25, 2),   -- Code Complete → Lập Trình
    (38, 26, 2),   -- YDKJS → Lập Trình
    (39, 26, 11),  -- YDKJS → Lập Trình Web
    (40, 27, 2),   -- Eloquent JS → Lập Trình
    (41, 27, 11),  -- Eloquent JS → Lập Trình Web
    (42, 28, 2),   -- Automate → Lập Trình
    (43, 28, 11),  -- Automate → Lập Trình Web (scripting)
    (44, 29, 2),   -- Linux CLI → Lập Trình
    (45, 30, 2),   -- Think Python → Lập Trình
    (46, 30, 10),  -- Think Python → CS Cơ Bản
    (47, 31, 6),   -- D2L → Trí Tuệ Nhân Tạo
    (48, 32, 11),  -- Full Stack Open → Lập Trình Web
    (49, 32, 2);   -- Full Stack Open → Lập Trình

-- ============================================================
-- PUBLICATION ↔ TAGS  (id 6–24)
-- ============================================================
INSERT INTO publication_tags (id, publication_id, tag_id) VALUES
    (6,  9,  6),   -- How to Think → Python
    (7,  12, 9),   -- Theoretical CS → Algorithms
    (8,  14, 9),   -- CLRS → Algorithms
    (9,  18, 10),  -- AI → Neural Networks
    (10, 19, 10),  -- Deep Learning → Neural Networks
    (11, 20, 10),  -- Hands-On ML → Neural Networks
    (12, 26, 7),   -- YDKJS → JavaScript
    (13, 27, 7),   -- Eloquent JS → JavaScript
    (14, 28, 6),   -- Automate → Python
    (15, 29, 8),   -- Linux CLI → Linux
    (16, 30, 6),   -- Think Python → Python
    (17, 31, 10),  -- D2L → Neural Networks
    (18, 32, 11),  -- Full Stack Open → Web Development
    (19, 10, 15),  -- Concrete Math → Mathematics
    (20, 13, 15),  -- Math for CS → Mathematics
    (21, 16, 12),  -- OS Concepts → Operating Systems
    (22, 22, 12),  -- Modern OS → Operating Systems
    (23, 17, 13),  -- Computer Networks → Networking
    (24, 23, 14);  -- Compilers → Compiler Design

-- ============================================================
-- ITEMS — 2 bản sao mỗi ấn phẩm (id 16–69)
-- ============================================================
INSERT INTO items (id, created_at, updated_at, barcode, publication_id, status, condition, branch, location) VALUES
    -- pub 6: SICP
    (16, NOW(), NOW(), 'BK-SICP-001', 6,  'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 301'),
    (17, NOW(), NOW(), 'BK-SICP-002', 6,  'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 201'),
    -- pub 7: CS Illuminated
    (18, NOW(), NOW(), 'BK-CSI-001',  7,  'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 302'),
    (19, NOW(), NOW(), 'BK-CSI-002',  7,  'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 202'),
    -- pub 8: CS Overview
    (20, NOW(), NOW(), 'BK-CSO-001',  8,  'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 303'),
    (21, NOW(), NOW(), 'BK-CSO-002',  8,  'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 203'),
    -- pub 9: How to Think
    (22, NOW(), NOW(), 'BK-HTCS-001', 9,  'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 304'),
    (23, NOW(), NOW(), 'BK-HTCS-002', 9,  'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 204'),
    -- pub 10: Concrete Mathematics
    (24, NOW(), NOW(), 'BK-CM-001',   10, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 305'),
    (25, NOW(), NOW(), 'BK-CM-002',   10, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 205'),
    -- pub 11: Quantum CS
    (26, NOW(), NOW(), 'BK-QCS-001',  11, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 306'),
    (27, NOW(), NOW(), 'BK-QCS-002',  11, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 206'),
    -- pub 12: Theoretical CS
    (28, NOW(), NOW(), 'BK-TCS-001',  12, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 307'),
    (29, NOW(), NOW(), 'BK-TCS-002',  12, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 207'),
    -- pub 13: Math for CS
    (30, NOW(), NOW(), 'BK-MCS-001',  13, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 308'),
    (31, NOW(), NOW(), 'BK-MCS-002',  13, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 208'),
    -- pub 14: CLRS
    (32, NOW(), NOW(), 'BK-CLRS-001', 14, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 309'),
    (33, NOW(), NOW(), 'BK-CLRS-002', 14, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 209'),
    -- pub 15: Design Patterns
    (34, NOW(), NOW(), 'BK-DP-001',   15, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 310'),
    (35, NOW(), NOW(), 'BK-DP-002',   15, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 210'),
    -- pub 16: OS Concepts
    (36, NOW(), NOW(), 'BK-OSC-001',  16, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 311'),
    (37, NOW(), NOW(), 'BK-OSC-002',  16, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 211'),
    -- pub 17: Computer Networks
    (38, NOW(), NOW(), 'BK-CN-001',   17, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 312'),
    (39, NOW(), NOW(), 'BK-CN-002',   17, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 212'),
    -- pub 18: AI
    (40, NOW(), NOW(), 'BK-AI-001',   18, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 313'),
    (41, NOW(), NOW(), 'BK-AI-002',   18, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 213'),
    -- pub 19: Deep Learning (Goodfellow)
    (42, NOW(), NOW(), 'BK-DLG-001',  19, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 314'),
    (43, NOW(), NOW(), 'BK-DLG-002',  19, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 214'),
    -- pub 20: Hands-On ML
    (44, NOW(), NOW(), 'BK-HML-001',  20, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 315'),
    (45, NOW(), NOW(), 'BK-HML-002',  20, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 215'),
    -- pub 21: Database System Concepts
    (46, NOW(), NOW(), 'BK-DBC-001',  21, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 316'),
    (47, NOW(), NOW(), 'BK-DBC-002',  21, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 216'),
    -- pub 22: Modern OS
    (48, NOW(), NOW(), 'BK-MOS-001',  22, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 317'),
    (49, NOW(), NOW(), 'BK-MOS-002',  22, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 217'),
    -- pub 23: Compilers
    (50, NOW(), NOW(), 'BK-CPL-001',  23, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 318'),
    (51, NOW(), NOW(), 'BK-CPL-002',  23, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 218'),
    -- pub 24: Computer Organization and Design
    (52, NOW(), NOW(), 'BK-COD-001',  24, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 319'),
    (53, NOW(), NOW(), 'BK-COD-002',  24, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 219'),
    -- pub 25: Code Complete
    (54, NOW(), NOW(), 'BK-CC2-001',  25, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 320'),
    (55, NOW(), NOW(), 'BK-CC2-002',  25, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 220'),
    -- pub 26: YDKJS
    (56, NOW(), NOW(), 'BK-YDKJS-001',26, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 321'),
    (57, NOW(), NOW(), 'BK-YDKJS-002',26, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 221'),
    -- pub 27: Eloquent JavaScript
    (58, NOW(), NOW(), 'BK-EJS-001',  27, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 322'),
    (59, NOW(), NOW(), 'BK-EJS-002',  27, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 222'),
    -- pub 28: Automate the Boring Stuff
    (60, NOW(), NOW(), 'BK-ATBS-001', 28, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 323'),
    (61, NOW(), NOW(), 'BK-ATBS-002', 28, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 223'),
    -- pub 29: The Linux Command Line
    (62, NOW(), NOW(), 'BK-TLCL-001', 29, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 324'),
    (63, NOW(), NOW(), 'BK-TLCL-002', 29, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 224'),
    -- pub 30: Think Python
    (64, NOW(), NOW(), 'BK-TPY-001',  30, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 325'),
    (65, NOW(), NOW(), 'BK-TPY-002',  30, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 225'),
    -- pub 31: Dive Into Deep Learning
    (66, NOW(), NOW(), 'BK-D2L-001',  31, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 326'),
    (67, NOW(), NOW(), 'BK-D2L-002',  31, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 226'),
    -- pub 32: Full Stack Open
    (68, NOW(), NOW(), 'BK-FSO-001',  32, 'AVAILABLE', 'NEW', 'Cơ sở 1 - Lý Thường Kiệt', 'B4 - 327'),
    (69, NOW(), NOW(), 'BK-FSO-002',  32, 'AVAILABLE', 'NEW', 'Cơ sở 2 - Dĩ An',          'H6 - 227');

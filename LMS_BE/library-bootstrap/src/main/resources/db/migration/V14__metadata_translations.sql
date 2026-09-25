-- Metadata i18n layer for public catalogue content.
-- The base catalogue remains Vietnamese-first; these tables provide optional localized overlays.

CREATE TABLE IF NOT EXISTS publication_translations (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    publication_id BIGINT NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    title TEXT,
    subtitle TEXT,
    description TEXT,
    ai_summary TEXT,
    table_of_contents TEXT,
    CONSTRAINT uk_publication_translation_locale UNIQUE (publication_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_publication_translations_publication
    ON publication_translations(publication_id);

CREATE INDEX IF NOT EXISTS idx_publication_translations_language
    ON publication_translations(language_code);

CREATE TABLE IF NOT EXISTS category_translations (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    name VARCHAR(150),
    bio TEXT,
    CONSTRAINT uk_category_translation_locale UNIQUE (category_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_category_translations_category
    ON category_translations(category_id);

CREATE INDEX IF NOT EXISTS idx_category_translations_language
    ON category_translations(language_code);

CREATE TABLE IF NOT EXISTS tag_translations (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    name VARCHAR(100),
    CONSTRAINT uk_tag_translation_locale UNIQUE (tag_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_tag_translations_tag
    ON tag_translations(tag_id);

CREATE INDEX IF NOT EXISTS idx_tag_translations_language
    ON tag_translations(language_code);

INSERT INTO category_translations (category_id, language_code, name, bio)
SELECT c.id, 'en', source.en_name, source.en_bio
FROM (
    VALUES
        ('Công Nghệ Thông Tin', 'Information Technology', 'Books and learning resources in information technology.'),
        ('Lập Trình', 'Programming', 'Programming languages, software construction, and coding practices.'),
        ('Kiến Trúc Phần Mềm', 'Software Architecture', 'System design, software architecture, and maintainable engineering practices.'),
        ('Cơ Sở Dữ Liệu', 'Databases', 'Relational databases, SQL, NoSQL, and data management.'),
        ('Toán Ứng Dụng', 'Applied Mathematics', 'Mathematics for engineering, computing, and applied sciences.'),
        ('Trí Tuệ Nhân Tạo', 'Artificial Intelligence', 'Artificial intelligence, machine learning, and deep learning.'),
        ('Hệ Điều Hành', 'Operating Systems', 'Operating systems, process management, memory, file systems, and security.'),
        ('Mạng Máy Tính', 'Computer Networks', 'Network protocols, distributed systems, and network infrastructure.'),
        ('Thuật Toán & Cấu Trúc Dữ Liệu', 'Algorithms & Data Structures', 'Algorithms, data structures, complexity, and problem solving.'),
        ('Khoa Học Máy Tính Cơ Bản', 'Computer Science Fundamentals', 'Foundational computer science and theory.'),
        ('Lập Trình Web', 'Web Development', 'Frontend, backend, full-stack, and modern web engineering.'),
        ('Kiến Trúc Máy Tính', 'Computer Architecture', 'Computer organization, hardware architecture, and systems design.'),
        ('Trình Biên Dịch', 'Compilers', 'Compiler design, programming languages, parsing, and code generation.'),
        ('Kinh Tế - Tài Chính', 'Economics & Finance', 'Economics, corporate finance, banking, and investment.'),
        ('Quản Trị Kinh Doanh', 'Business Administration', 'Management, strategy, operations, and human resources.'),
        ('Marketing', 'Marketing', 'Marketing foundations, communications, branding, and consumer behavior.'),
        ('Kế Toán - Kiểm Toán', 'Accounting & Auditing', 'Financial accounting, managerial accounting, and auditing.'),
        ('Dược - Y Sinh', 'Pharmacy & Biomedical Sciences', 'Pharmacy, biomedicine, molecular biology, and biotechnology.'),
        ('Y Học', 'Medicine', 'Basic medicine, clinical medicine, and health care.'),
        ('Ngoại Ngữ', 'Foreign Languages', 'English, French, Chinese, IELTS, TOEIC, and academic languages.'),
        ('Kỹ Năng Mềm', 'Soft Skills', 'Communication, teamwork, leadership, critical thinking, and time management.'),
        ('Luật - Chính Trị', 'Law & Politics', 'Civil law, economic law, political science, and public policy.'),
        ('Luận Văn - Khóa Luận', 'Theses & Graduation Projects', 'Theses, dissertations, capstone projects, and academic research.'),
        ('Điện - Điện Tử', 'Electrical & Electronics Engineering', 'Circuits, electronics, telecommunications, embedded systems, and control.'),
        ('Cơ Khí', 'Mechanical Engineering', 'Mechanics, machine design, manufacturing, robotics, and automation.'),
        ('Xây Dựng', 'Civil Engineering', 'Structures, construction materials, project management, and urban infrastructure.'),
        ('Hóa Học - Kỹ Thuật Hóa Học', 'Chemistry & Chemical Engineering', 'General chemistry, analytical chemistry, organic chemistry, and chemical engineering.'),
        ('Môi Trường - Tài Nguyên', 'Environment & Natural Resources', 'Environment, water resources, climate, and sustainable development.'),
        ('Công Nghệ Vật Liệu', 'Materials Science', 'Metals, polymers, composites, semiconductors, and advanced materials.'),
        ('Giao Thông - Logistics', 'Transportation & Logistics', 'Transportation engineering, logistics, and supply chain management.'),
        ('Toán - Thống Kê', 'Mathematics & Statistics', 'Advanced mathematics, probability, statistics, optimization, and data analysis.'),
        ('Vật Lý', 'Physics', 'Mechanics, electromagnetism, optics, modern physics, and engineering physics.'),
        ('Thiết Kế - Kiến Trúc', 'Design & Architecture', 'Design, architecture, planning, graphics, and applied arts.')
) AS source(vi_name, en_name, en_bio)
JOIN categories c ON c.name = source.vi_name
ON CONFLICT (category_id, language_code) DO UPDATE SET
    name = EXCLUDED.name,
    bio = EXCLUDED.bio,
    updated_at = NOW();

INSERT INTO tag_translations (tag_id, language_code, name)
SELECT id, 'en', name
FROM tags
WHERE name IN (
    'Java', 'Clean Code', 'Architecture', 'Database', 'Machine Learning',
    'Python', 'JavaScript', 'Linux', 'Algorithms', 'Neural Networks',
    'Web Development', 'Operating Systems', 'Networking', 'Compiler Design',
    'Mathematics'
)
ON CONFLICT (tag_id, language_code) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

INSERT INTO publication_translations (publication_id, language_code, title, subtitle, description)
VALUES
    (1, 'en', 'Clean Code', 'A Handbook of Agile Software Craftsmanship',
     'A classic guide to writing clean, readable, and maintainable code. Robert C. Martin explains naming, functions, classes, testing, refactoring, and professional software craftsmanship.'),
    (2, 'en', 'Domain-Driven Design', 'Tackling Complexity in the Heart of Software',
     'A foundational book on domain-driven design, showing how to model complex business domains and align software architecture with real business rules.'),
    (3, 'en', 'Refactoring', 'Improving the Design of Existing Code',
     'A practical catalogue of refactoring techniques for improving code structure without changing observable behavior, with emphasis on tests and incremental design.'),
    (4, 'en', 'Database Fundamentals Textbook', NULL,
     'A database textbook for engineering students covering the relational model, SQL, schema design, normalization, transactions, and core database concepts.'),
    (5, 'en', 'Object-Oriented Java Programming', NULL,
     'A Java OOP textbook for second-year students, progressing from object-oriented foundations to inheritance, polymorphism, interfaces, exceptions, collections, and design patterns.'),
    (6, 'en', 'Structure and Interpretation of Computer Programs', 'Second Edition',
     'The MIT classic that teaches abstraction, functional programming, interpreters, and metacircular evaluation through Scheme.'),
    (7, 'en', 'Computer Science Illuminated', 'An Introduction to the Science and Technology of Computing',
     'A broad introduction to computer science, from binary representation and hardware to operating systems, networking, security, and social impact.'),
    (8, 'en', 'Computer Science: An Overview', 'Twelfth Edition',
     'A survey of computer science that connects historical foundations with modern topics such as operating systems, networking, databases, artificial intelligence, and cloud computing.'),
    (9, 'en', 'How to Think Like a Computer Scientist', 'Learning with Python 3',
     'An introductory Python text that builds computational thinking through variables, functions, recursion, data structures, and object-oriented programming.'),
    (10, 'en', 'Concrete Mathematics', 'A Foundation for Computer Science',
     'A rigorous mathematical foundation for computer science, covering recurrence relations, sums, integer functions, number theory, binomial coefficients, and discrete probability.'),
    (11, 'en', 'Quantum Computer Science', 'An Introduction',
     'An accessible introduction to quantum computing, including qubits, quantum gates, circuits, Shor and Grover algorithms, and quantum complexity.'),
    (12, 'en', 'Introduction to Theoretical Computer Science', 'Computation and Complexity',
     'A modern introduction to computation theory, formal languages, automata, computability, NP-completeness, cryptography, and proof complexity.'),
    (13, 'en', 'Mathematics for Computer Science', 'MIT OpenCourseWare Edition',
     'MIT course material covering logic, proof techniques, graph theory, number theory, probability, and discrete mathematics for computer science.'),
    (14, 'en', 'Introduction to Algorithms', 'Fourth Edition',
     'The standard algorithms textbook covering sorting, searching, graph algorithms, dynamic programming, greedy algorithms, amortized analysis, NP-completeness, and approximation algorithms.'),
    (15, 'en', 'Design Patterns', 'Elements of Reusable Object-Oriented Software',
     'The Gang of Four catalogue of 23 object-oriented design patterns for creating reusable, flexible, and maintainable software designs.'),
    (16, 'en', 'Operating System Concepts', 'Eighth Edition (Dinosaur Book)',
     'A comprehensive operating systems textbook covering process control, threads, CPU scheduling, synchronization, deadlocks, memory management, file systems, I/O, protection, and security.'),
    (17, 'en', 'Computer Networks', 'Fifth Edition',
     'A layered treatment of computer networks, including physical links, Ethernet, wireless networks, routing, congestion control, DNS, HTTP, peer-to-peer systems, and network security.'),
    (18, 'en', 'Artificial Intelligence: A Modern Approach', 'Fourth Edition',
     'A comprehensive AI textbook covering search, game playing, planning, probabilistic reasoning, machine learning, natural language processing, robotics, and computer vision.'),
    (19, 'en', 'Deep Learning', 'An MIT Press Book',
     'A theoretical foundation for deep learning, covering neural networks, optimization, regularization, convolutional and recurrent networks, generative models, and practical methodology.'),
    (20, 'en', 'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow', 'Third Edition',
     'A practical machine learning guide using Python, scikit-learn, Keras, and TensorFlow, from classical models to deep learning, transformers, and generative adversarial networks.'),
    (21, 'en', 'Database System Concepts', 'Seventh Edition',
     'A comprehensive database systems textbook covering SQL, relational design, normalization, indexing, transactions, concurrency control, recovery, distributed databases, and NoSQL.'),
    (22, 'en', 'Modern Operating Systems', 'Fourth Edition',
     'An in-depth operating systems text covering processes, memory management, file systems, input/output, virtualization, security, UNIX, Windows, Linux, Android, and distributed systems.'),
    (23, 'en', 'Compilers: Principles, Techniques, and Tools', 'Second Edition (Dragon Book)',
     'The classic compiler construction textbook covering lexical analysis, parsing, semantic analysis, intermediate representations, optimization, and code generation.'),
    (24, 'en', 'Computer Organization and Design', 'RISC-V Edition, Second Edition',
     'A RISC-V based introduction to computer organization, datapaths, control, pipelining, memory hierarchy, input/output, and parallelism.'),
    (25, 'en', 'Code Complete', 'Second Edition',
     'A broad software construction handbook covering design, coding style, naming, routines, classes, defensive programming, debugging, testing, and code quality.'),
    (26, 'en', 'You Don''t Know JS Yet', 'Get Started (Series Book 1)',
     'A deep exploration of JavaScript fundamentals, including scope, closures, prototypes, this, types, asynchronous programming, and the language model behind everyday code.'),
    (27, 'en', 'Eloquent JavaScript', 'A Modern Introduction to Programming',
     'A modern JavaScript introduction covering programming fundamentals, functional programming, object-oriented programming, the browser DOM, Node.js, and regular expressions.'),
    (28, 'en', 'Automate the Boring Stuff with Python', 'Second Edition',
     'A project-based Python book for automating practical tasks such as file handling, web scraping, spreadsheets, documents, email, scheduling, and GUI automation.'),
    (29, 'en', 'The Linux Command Line', 'A Complete Introduction, Second Edition',
     'A complete introduction to the Linux shell, file system navigation, text processing, permissions, processes, job control, package management, shell scripting, and networking tools.'),
    (30, 'en', 'Think Python', 'How to Think Like a Computer Scientist, Second Edition',
     'A beginner-friendly Python programming text that builds algorithmic thinking through functions, recursion, lists, dictionaries, objects, and problem solving.'),
    (31, 'en', 'Dive Into Deep Learning', 'Interactive Deep Learning Book with PyTorch, JAX, MXNet, and TensorFlow',
     'An interactive deep learning book with mathematical explanations and executable code, covering linear models, multilayer perceptrons, convolutional networks, recurrent networks, attention, transformers, and GANs.'),
    (32, 'en', 'Full Stack Open', 'Deep Dive Into Modern Web Development',
     'A university-level full-stack web development course covering React, Redux, Node.js, Express, MongoDB, TypeScript, GraphQL, testing, CI/CD, containers, and React Native.')
ON CONFLICT (publication_id, language_code) DO UPDATE SET
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    description = EXCLUDED.description,
    updated_at = NOW();

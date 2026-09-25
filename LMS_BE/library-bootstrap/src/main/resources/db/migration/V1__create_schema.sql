CREATE TABLE authors (
    id            BIGINT NOT NULL,
    created_at    TIMESTAMPTZ(6) NULL,
    updated_at    TIMESTAMPTZ(6) NULL,
    bio           TEXT NULL,
    date_of_birth DATE NULL,
    date_of_death DATE NULL,
    name          VARCHAR(100) NOT NULL,
    CONSTRAINT authors_pkey PRIMARY KEY (id)
);

CREATE TABLE categories (
    id                 BIGINT NOT NULL,
    created_at         TIMESTAMPTZ(6) NULL,
    updated_at         TIMESTAMPTZ(6) NULL,
    bio                TEXT NULL,
    name               VARCHAR(100) NOT NULL,
    parent_category_id BIGINT NULL,
    CONSTRAINT categories_pkey  PRIMARY KEY (id),
    CONSTRAINT idx_category_name UNIQUE (name)
);

CREATE INDEX idx_parent_category ON categories USING btree (parent_category_id);

CREATE TABLE publishers (
    id         BIGINT NOT NULL,
    created_at TIMESTAMPTZ(6) NULL,
    updated_at TIMESTAMPTZ(6) NULL,
    address    VARCHAR(255) NULL,
    name       VARCHAR(100) NOT NULL,
    CONSTRAINT publishers_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_publisher_name ON publishers USING btree (name);

CREATE TABLE tags (
    id         BIGINT NOT NULL,
    created_at TIMESTAMPTZ(6) NULL,
    updated_at TIMESTAMPTZ(6) NULL,
    name       VARCHAR(50) NOT NULL,
    CONSTRAINT idx_tag_name UNIQUE (name),
    CONSTRAINT tags_pkey    PRIMARY KEY (id)
);

CREATE TABLE roles (
    id          BIGINT NOT NULL,
    created_at  TIMESTAMPTZ(6) NULL,
    updated_at  TIMESTAMPTZ(6) NULL,
    description VARCHAR(255) NULL,
    role_name   VARCHAR(50) NOT NULL,
    CONSTRAINT idx_role_name UNIQUE (role_name),
    CONSTRAINT roles_pkey    PRIMARY KEY (id)
);


CREATE TABLE notifications (
    id           BIGINT NOT NULL,
    created_at   TIMESTAMPTZ(6) NULL,
    updated_at   TIMESTAMPTZ(6) NULL,
    title        VARCHAR(255) NOT NULL DEFAULT '',
    message      TEXT NOT NULL,
    link         VARCHAR(255) NULL,
    reference_id BIGINT NULL,
    type         VARCHAR(30) NOT NULL,
    CONSTRAINT notifications_pkey PRIMARY KEY (id),
    CONSTRAINT notifications_type_check CHECK (type IN (
        'BOOK_RESERVED', 'BOOK_AVAILABLE',
        'BORROW_SUCCESS', 'BORROW_CANCELLED_EXPIRED',
        'OVERDUE_WARNING', 'FINE_ISSUED',
        'SYSTEM_MAINTENANCE', 'RETURN_REMINDER',
        'PICKUP_CONFIRMED', 'RETURN_CONFIRMED', 'FINE_PAID'
    ))
);

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id                         BIGINT NOT NULL,
    created_at                 TIMESTAMPTZ(6) NULL,
    updated_at                 TIMESTAMPTZ(6) NULL,
    address                    VARCHAR(255) NULL,
    ai_personalization_enabled BOOLEAN NOT NULL,
    credit_score               INT NOT NULL DEFAULT 100,
    date_of_birth              DATE NULL,
    email                      VARCHAR(100) NOT NULL,
    faculty                    VARCHAR(255) NULL,
    full_name                  VARCHAR(100) NOT NULL,
    hashed_password            VARCHAR(255) NULL,
    last_login_at              TIMESTAMP(6) NULL,
    phone_number               VARCHAR(20) NULL,
    profile_picture_url        VARCHAR(255) NULL,
    provider                   VARCHAR(255) NULL,
    provider_id                VARCHAR(255) NULL,
    status                     VARCHAR(255) NOT NULL,
    student_id                 VARCHAR(7) NULL,
    CONSTRAINT users_pkey        PRIMARY KEY (id),
    CONSTRAINT uk6dotkott2kjsp8vw4d0m25fb7 UNIQUE (email),
    CONSTRAINT users_status_check CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED', 'BANNED')),
    CONSTRAINT users_faculty_check CHECK (faculty IN (
        'KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH', 'KHOA_DIEN_DIEN_TU',
        'KHOA_CO_KHI', 'KHOA_KY_THUAT_HOA_HOC', 'KHOA_KY_THUAT_XAY_DUNG',
        'KHOA_KY_THUAT_GIAO_THONG', 'KHOA_QUAN_LY_CONG_NGHIEP',
        'KHOA_MOI_TRUONG_VA_TAI_NGUYEN', 'KHOA_CONG_NGHE_VAT_LIEU',
        'KHOA_KHOA_HOC_UNG_DUNG', 'KHOA_KY_THUAT_DIA_CHAT_VA_DAU_KHI'
    ))
);

CREATE INDEX idx_email ON users USING btree (email);

-- ============================================================
-- PUBLICATIONS (+ call_number từ V9)
-- ============================================================

CREATE TABLE publications (
    id                 BIGINT NOT NULL,
    created_at         TIMESTAMPTZ(6) NULL,
    updated_at         TIMESTAMPTZ(6) NULL,
    ai_summary         TEXT NULL,
    ai_target_audience TEXT NULL,
    call_number        VARCHAR(100) NULL,
    cover_image_url    TEXT NULL,
    description        TEXT NULL,
    edition            INT NULL,
    file_url           TEXT NULL,
    isbn               VARCHAR(100) NULL,
    language           VARCHAR(50) NOT NULL,
    number_of_pages    INT NULL,
    publication_year   INT NULL,
    publisher_id       BIGINT NULL,
    size               VARCHAR(50) NULL,
    subtitle           VARCHAR(255) NULL,
    title              VARCHAR(255) NOT NULL,
    weight             FLOAT8 NULL,
    CONSTRAINT publications_pkey PRIMARY KEY (id),
    CONSTRAINT uke6kemjuf6bi5uyyba0eyit1cx UNIQUE (isbn),
    CONSTRAINT publications_ai_target_audience_check CHECK (ai_target_audience IN (
        'KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH', 'KHOA_DIEN_DIEN_TU',
        'KHOA_CO_KHI', 'KHOA_KY_THUAT_HOA_HOC', 'KHOA_KY_THUAT_XAY_DUNG',
        'KHOA_KY_THUAT_GIAO_THONG', 'KHOA_QUAN_LY_CONG_NGHIEP',
        'KHOA_MOI_TRUONG_VA_TAI_NGUYEN', 'KHOA_CONG_NGHE_VAT_LIEU',
        'KHOA_KHOA_HOC_UNG_DUNG', 'KHOA_KY_THUAT_DIA_CHAT_VA_DAU_KHI'
    )),
    CONSTRAINT fk_publication_publisher FOREIGN KEY (publisher_id) REFERENCES publishers(id)
);

CREATE INDEX idx_publication_publisher ON publications USING btree (publisher_id);
CREATE INDEX idx_publication_title     ON publications USING btree (title);

-- ============================================================
-- ITEMS (location thay shelf từ V9)
-- ============================================================

CREATE TABLE items (
    id             BIGINT NOT NULL,
    created_at     TIMESTAMPTZ(6) NULL,
    updated_at     TIMESTAMPTZ(6) NULL,
    barcode        VARCHAR(50) NOT NULL,
    branch         VARCHAR(100) NULL,
    condition      VARCHAR(20) NULL,
    location       VARCHAR(100) NULL,
    publication_id BIGINT NOT NULL,
    status         VARCHAR(20) NOT NULL,
    CONSTRAINT items_pkey PRIMARY KEY (id),
    CONSTRAINT uk863wqhi5cukg9lfl6i36lyhfu UNIQUE (barcode),
    CONSTRAINT items_status_check    CHECK (status    IN ('AVAILABLE', 'BORROWED', 'RESERVED', 'IN_MAINTENANCE', 'LOST')),
    CONSTRAINT items_condition_check CHECK (condition IN ('NEW', 'OLD')),
    CONSTRAINT fk_item_publication FOREIGN KEY (publication_id) REFERENCES publications(id)
);

CREATE INDEX idx_item_publication_id ON items USING btree (publication_id);

-- ============================================================
-- JUNCTION TABLES
-- ============================================================

CREATE TABLE publication_authors (
    id             BIGINT NOT NULL,
    author_id      BIGINT NULL,
    publication_id BIGINT NULL,
    CONSTRAINT publication_authors_pkey      PRIMARY KEY (id),
    CONSTRAINT fk_pub_author_author          FOREIGN KEY (author_id)      REFERENCES authors(id),
    CONSTRAINT fk_pub_author_publication     FOREIGN KEY (publication_id) REFERENCES publications(id)
);

CREATE TABLE publication_categories (
    id             BIGINT NOT NULL,
    category_id    BIGINT NULL,
    publication_id BIGINT NULL,
    CONSTRAINT publication_categories_pkey      PRIMARY KEY (id),
    CONSTRAINT fk_pub_category_category         FOREIGN KEY (category_id)    REFERENCES categories(id),
    CONSTRAINT fk_pub_category_publication      FOREIGN KEY (publication_id) REFERENCES publications(id)
);

CREATE TABLE publication_tags (
    id             BIGINT NOT NULL,
    publication_id BIGINT NOT NULL,
    tag_id         BIGINT NOT NULL,
    CONSTRAINT publication_tags_pkey      PRIMARY KEY (id),
    CONSTRAINT fk_pub_tag_publication     FOREIGN KEY (publication_id) REFERENCES publications(id),
    CONSTRAINT fk_pub_tag_tag             FOREIGN KEY (tag_id)         REFERENCES tags(id)
);

-- ============================================================
-- USER-DEPENDENT TABLES
-- ============================================================

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    CONSTRAINT user_roles_pkey          PRIMARY KEY (user_id, role_id),
    CONSTRAINT fkhfh9dx7w3ubf1co1vdev94g3f FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fkh8ciramu9cc9q3qcqiv4ue8a6 FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE refresh_tokens (
    uuid_token  VARCHAR(255) NOT NULL,
    device_id   VARCHAR(255) NULL,
    expiry_date TIMESTAMPTZ(6) NULL,
    revoked     BOOLEAN NOT NULL DEFAULT FALSE,
    user_id     BIGINT NULL,
    CONSTRAINT refresh_tokens_pkey          PRIMARY KEY (uuid_token),
    CONSTRAINT uk2m0kbqvkxcesg5q10ey1tu5o0 UNIQUE (user_id, device_id),
    CONSTRAINT fk_refresh_token_user        FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens USING btree (user_id);

CREATE TABLE search_history (
    id           BIGINT NOT NULL,
    created_at   TIMESTAMPTZ(6) NULL,
    updated_at   TIMESTAMPTZ(6) NULL,
    search_query TEXT NOT NULL,
    user_id      BIGINT NOT NULL,
    CONSTRAINT search_history_pkey     PRIMARY KEY (id),
    CONSTRAINT fk_search_history_user  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_search_user_id ON search_history USING btree (user_id);

CREATE TABLE user_notifications (
    id              BIGINT NOT NULL,
    created_at      TIMESTAMPTZ(6) NULL,
    updated_at      TIMESTAMPTZ(6) NULL,
    is_read         BOOLEAN NOT NULL,
    read_at         TIMESTAMPTZ NULL,
    notification_id BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    CONSTRAINT user_notifications_pkey                  PRIMARY KEY (id),
    CONSTRAINT fk_user_notification_notification        FOREIGN KEY (notification_id) REFERENCES notifications(id),
    CONSTRAINT fk_user_notification_user                FOREIGN KEY (user_id)         REFERENCES users(id)
);

CREATE INDEX idx_user_notification_user_id ON user_notifications USING btree (user_id);

CREATE TABLE wish_lists (
    id         BIGINT NOT NULL,
    created_at TIMESTAMPTZ(6) NULL,
    updated_at TIMESTAMPTZ(6) NULL,
    user_id    BIGINT NULL,
    CONSTRAINT wish_lists_pkey     PRIMARY KEY (id),
    CONSTRAINT fk_wish_list_user   FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE wish_lists_item (
    id             BIGINT NOT NULL,
    created_at     TIMESTAMPTZ(6) NULL,
    updated_at     TIMESTAMPTZ(6) NULL,
    added_at       TIMESTAMPTZ(6) NULL,
    publication_id BIGINT NULL,
    wish_list_id   BIGINT NULL,
    CONSTRAINT wish_lists_item_pkey              PRIMARY KEY (id),
    CONSTRAINT fk_wish_list_item_wish_list       FOREIGN KEY (wish_list_id)   REFERENCES wish_lists(id),
    CONSTRAINT fk_wish_list_item_publication     FOREIGN KEY (publication_id) REFERENCES publications(id)
);

CREATE TABLE ratings (
    id              BIGINT NOT NULL,
    created_at      TIMESTAMPTZ(6) NULL,
    updated_at      TIMESTAMPTZ(6) NULL,
    comment         TEXT NULL,
    helpful_count   INT NOT NULL,
    publication_id  BIGINT NOT NULL,
    star            INT NOT NULL,
    user_id         BIGINT NOT NULL,
    verified_borrow BOOLEAN NULL,
    CONSTRAINT ratings_pkey          PRIMARY KEY (id),
    CONSTRAINT fk_rating_publication FOREIGN KEY (publication_id) REFERENCES publications(id),
    CONSTRAINT fk_rating_user        FOREIGN KEY (user_id)        REFERENCES users(id),
    CONSTRAINT uk_user_publication   UNIQUE (user_id, publication_id)
);

CREATE INDEX idx_rating_publication_id ON ratings USING btree (publication_id);
CREATE INDEX idx_rating_star           ON ratings USING btree (star);
CREATE INDEX idx_rating_user_id        ON ratings USING btree (user_id);

CREATE TABLE user_interactions (
    id             BIGINT NOT NULL,
    created_at     TIMESTAMPTZ(6) NULL,
    updated_at     TIMESTAMPTZ(6) NULL,
    publication_id BIGINT NOT NULL,
    type           VARCHAR(30) NOT NULL,
    user_id        BIGINT NOT NULL,
    CONSTRAINT user_interactions_pkey       PRIMARY KEY (id),
    CONSTRAINT user_interactions_type_check CHECK (type IN ('WATCH', 'WISHLIST', 'BORROWED')),
    CONSTRAINT fk_interaction_publication   FOREIGN KEY (publication_id) REFERENCES publications(id),
    CONSTRAINT fk_interaction_user          FOREIGN KEY (user_id)        REFERENCES users(id)
);

CREATE INDEX idx_interaction_timestamp ON user_interactions USING btree (created_at);
CREATE INDEX idx_interaction_user_id   ON user_interactions USING btree (user_id);

-- ============================================================
-- BORROWING & RELATED TABLES
-- status bao gồm CANCELLED (V3) và OVERDUE
-- ============================================================

CREATE TABLE borrowing_transactions (
    id                  BIGINT NOT NULL,
    created_at          TIMESTAMPTZ(6) NULL,
    updated_at          TIMESTAMPTZ(6) NULL,
    borrowed_date       TIMESTAMPTZ(6) NULL,
    due_date            DATE NOT NULL,
    item_id             BIGINT NOT NULL,
    librarian_id_issue  BIGINT NULL,
    librarian_id_return BIGINT NULL,
    picked_up_deadline  TIMESTAMPTZ(6) NOT NULL,
    renewal_count       INT NOT NULL,
    returned_date       TIMESTAMPTZ(6) NULL,
    status              VARCHAR(20) NOT NULL,
    user_id             BIGINT NOT NULL,
    CONSTRAINT borrowing_transactions_pkey         PRIMARY KEY (id),
    CONSTRAINT borrowing_transactions_status_check CHECK (status IN (
        'WAITING_FOR_PICKUP', 'BORROWING', 'RETURNED', 'OVERDUE', 'CANCELLED'
    )),
    CONSTRAINT fk_borrow_item             FOREIGN KEY (item_id)             REFERENCES items(id),
    CONSTRAINT fk_borrow_user             FOREIGN KEY (user_id)             REFERENCES users(id),
    CONSTRAINT fk_borrow_librarian_issue  FOREIGN KEY (librarian_id_issue)  REFERENCES users(id),
    CONSTRAINT fk_borrow_librarian_return FOREIGN KEY (librarian_id_return) REFERENCES users(id)
);

CREATE INDEX idx_borrow_due_date ON borrowing_transactions USING btree (due_date);
CREATE INDEX idx_borrow_item_id  ON borrowing_transactions USING btree (item_id);
CREATE INDEX idx_borrow_user_id  ON borrowing_transactions USING btree (user_id);

-- ============================================================
-- RESERVATIONS
-- status cập nhật từ V8 (READY_FOR_PICKUP, COMPLETED thay FULFILLED)
-- preferred_branch và assigned_item_id từ V8
-- ============================================================

CREATE TABLE reservations (
    id                   BIGINT NOT NULL,
    created_at           TIMESTAMPTZ(6) NULL,
    updated_at           TIMESTAMPTZ(6) NULL,
    hold_expiration_time TIMESTAMPTZ(6) NULL,
    preferred_branch     VARCHAR(50) NOT NULL DEFAULT 'ANY',
    assigned_item_id     BIGINT NULL,
    publication_id       BIGINT NOT NULL,
    queue_position       INT NOT NULL,
    reservation_date     TIMESTAMPTZ(6) NOT NULL,
    status               VARCHAR(20) NOT NULL,
    user_id              BIGINT NOT NULL,
    CONSTRAINT reservations_pkey         PRIMARY KEY (id),
    CONSTRAINT reservations_status_check CHECK (status IN (
        'PENDING', 'READY_FOR_PICKUP', 'CANCELLED', 'EXPIRED', 'COMPLETED'
    )),
    CONSTRAINT fk_reservation_publication   FOREIGN KEY (publication_id) REFERENCES publications(id),
    CONSTRAINT fk_reservation_user          FOREIGN KEY (user_id)        REFERENCES users(id),
    CONSTRAINT fk_reservation_assigned_item FOREIGN KEY (assigned_item_id) REFERENCES items(id)
);

CREATE INDEX idx_reservation_publication_id  ON reservations USING btree (publication_id);
CREATE INDEX idx_reservation_status          ON reservations USING btree (status);
CREATE INDEX idx_reservation_user_id         ON reservations USING btree (user_id);
CREATE INDEX idx_reservation_assigned_item   ON reservations USING btree (assigned_item_id);

-- ============================================================
-- FINES
-- Bỏ UNIQUE trên transaction_id (V5): cho phép nhiều fine/transaction
-- ============================================================

CREATE TABLE fines (
    id             BIGINT NOT NULL,
    created_at     TIMESTAMPTZ(6) NULL,
    updated_at     TIMESTAMPTZ(6) NULL,
    fine_amount    NUMERIC(15) NOT NULL,
    paid_date      TIMESTAMPTZ(6) NULL,
    payment_status VARCHAR(20) NOT NULL,
    transaction_id BIGINT NOT NULL,
    type           VARCHAR(30) NULL,
    CONSTRAINT fines_pkey                PRIMARY KEY (id),
    CONSTRAINT fines_payment_status_check CHECK (payment_status IN ('UNPAID', 'PAID')),
    CONSTRAINT fines_type_check           CHECK (type IN ('DAMAGED_BOOK', 'OVERDUE_RETURN', 'LOST_BOOK')),
    CONSTRAINT fk_fine_transaction        FOREIGN KEY (transaction_id) REFERENCES borrowing_transactions(id)
);

CREATE INDEX idx_fine_transaction_id ON fines USING btree (transaction_id);

-- ============================================================
-- SELF-REFERENCING FK
-- ============================================================

ALTER TABLE categories
    ADD CONSTRAINT fk_category_parent
        FOREIGN KEY (parent_category_id) REFERENCES categories(id);

-- ============================================================
-- PASSWORD RESET TOKENS
-- ============================================================

CREATE TABLE password_reset_tokens (
    token      VARCHAR(36) NOT NULL,
    user_id    BIGINT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (token)
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens (user_id);

CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id BIGINT NOT NULL,
    created_at TIMESTAMPTZ(6) NULL,
    updated_at TIMESTAMPTZ(6) NULL,
    user_id BIGINT NOT NULL,
    due_date_in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    due_date_email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    reservation_in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    reservation_email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    fine_in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    system_in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    new_book_email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    weekly_digest_email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT user_notification_preferences_pkey PRIMARY KEY (id),
    CONSTRAINT uk_user_notification_preferences_user UNIQUE (user_id),
    CONSTRAINT fk_user_notification_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id
ON user_notification_preferences USING btree (user_id);

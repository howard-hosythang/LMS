# Library 74 LMS - Database / ERD Summary

Generated: 2026-05-19 11:44 +0700

This file summarizes the final ERD after Flyway `V20__schema_cleanup_and_ai_indexes.sql`.
Use it as the drawing checklist for the graduation report ERD.

## 1. Final Schema Decision

| Area | Decision | Reason |
|---|---|---|
| Tag taxonomy | Keep `public.tags` and `public.publication_tags`; drop `ai_engine.tags` and `ai_engine.publication_tags`. | Backend and frontend read the public tables. The AI duplicate tag tables were not part of the product flow. |
| Recommendation cache | Keep `public.ai_recommendations`; drop `ai_engine.recommendation_cache`. | Backend fallback reads `public.ai_recommendations`; the AI cache copy was only written, not read. |
| AI vectors | Keep `ai_engine.publication_vectors`. | Required for semantic search, similar books, and content-based recommendation. |
| AI ETL state | Keep `ai_engine.publication_etl_runs`. | Required for processing status, hash skip, retry/error visibility. |
| AI search logs | Keep `ai_engine.search_logs`. | Useful as query audit/analytics data for AI search. |
| Metadata translations | Keep `publication_translations`, `category_translations`, `tag_translations`. | Used to provide optional English overlays without duplicating base entities. |

## 2. ERD Table Groups

| Group | Tables | Role in ERD |
|---|---|---|
| Catalogue core | `publications`, `items`, `authors`, `publishers`, `categories`, `tags` | Bibliographic metadata and physical copies. |
| Catalogue M:N | `publication_authors`, `publication_categories`, `publication_tags` | Many-to-many links from publications to authors/categories/tags. |
| Localization | `publication_translations`, `category_translations`, `tag_translations` | Optional translated metadata by `language_code`. |
| Identity/Auth | `users`, `roles`, `user_roles`, `refresh_tokens`, `password_reset_tokens` | User identity, role mapping and session/auth support. |
| Notification | `notifications`, `user_notifications` | Notification content and per-user read state. |
| Circulation | `borrowing_transactions`, `reservations`, `fines`, `transaction_notes`, `fine_payment_orders` | Borrow/return/reservation/fine/payment workflows. |
| Social/recommendation | `ratings`, `rating_helpful_votes`, `rating_replies`, `wish_lists`, `wish_lists_item`, `user_interactions`, `ai_recommendations`, `system_reviews` | Ratings, wishlist, interaction tracking and recommendation cache. |
| AI engine | `ai_engine.publication_vectors`, `ai_engine.publication_etl_runs`, `ai_engine.search_logs` | Vector search, ETL state and AI search audit. |

## 3. Main Entities and Relationships

| Entity/Table | Primary Key | Main Foreign Keys | Important Constraints / Indexes | ERD Notes |
|---|---|---|---|---|
| `users` | `id` | none | unique `email`; checks `status`, `faculty`; index `email` | Central actor for student/librarian/admin. |
| `roles` | `id` | none | unique `role_name` | Role lookup. |
| `user_roles` | `(user_id, role_id)` | `user_id -> users`, `role_id -> roles` | composite PK | M:N user-role. |
| `publications` | `id` | `publisher_id -> publishers` | unique `isbn`; check `ai_target_audience`; trigram indexes on title/subtitle/description/ai_summary | Main book/publication metadata. |
| `items` | `id` | `publication_id -> publications` | unique `barcode`; checks `status`, `condition`; indexes `(publication_id, branch, status)`, available partial index | Physical copy of a publication. |
| `authors` | `id` | none | trigram index on `name` | Author lookup. |
| `publishers` | `id` | none | index `name` | Publisher lookup. |
| `categories` | `id` | `parent_category_id -> categories` | unique `name`; index parent; trigram index `name` | Hierarchical categories. |
| `tags` | `id` | none | unique `name` | Canonical tag taxonomy for frontend/backend/AI. |
| `publication_authors` | `id` | `publication_id -> publications`, `author_id -> authors` | unique `(publication_id, author_id)` | M:N publication-author. |
| `publication_categories` | `id` | `publication_id -> publications`, `category_id -> categories` | unique `(publication_id, category_id)` | M:N publication-category. |
| `publication_tags` | `id` | `publication_id -> publications`, `tag_id -> tags` | unique `(publication_id, tag_id)` | M:N publication-tag; AI writes here. |
| `publication_translations` | `id` | `publication_id -> publications` | unique `(publication_id, language_code)` | Localized title/subtitle/description/summary/TOC. |
| `category_translations` | `id` | `category_id -> categories` | unique `(category_id, language_code)` | Localized category metadata. |
| `tag_translations` | `id` | `tag_id -> tags` | unique `(tag_id, language_code)` | Localized tag names. |
| `borrowing_transactions` | `id` | `user_id -> users`, `item_id -> items`, `librarian_id_issue/return -> users` | check `status`; indexes `due_date`, `item_id`, `user_id`, `(user_id,status)` active partial | Borrow lifecycle. |
| `reservations` | `id` | `user_id -> users`, `publication_id -> publications`, `assigned_item_id -> items` | check `status`; active queue index `(publication_id, preferred_branch, status, reservation_date, id)` | Reservation queue and hold flow. |
| `fines` | `id` | `transaction_id -> borrowing_transactions` | checks `payment_status`, `type`; index `(payment_status, transaction_id)` | Fine per transaction; multiple fines allowed. |
| `fine_payment_orders` | `id` | none | unique `order_code`; checks `provider`, `status`; indexes `(student_id,status)`, `payment_link_id` | PayOS order state. |
| `transaction_notes` | `id` | `transaction_id -> borrowing_transactions`, `librarian_id -> users` | unique `transaction_id` | Librarian note/report issue. |
| `ratings` | `id` | `user_id -> users`, `publication_id -> publications`, `transaction_id -> borrowing_transactions` | unique partial `transaction_id`; indexes publication/user/star/created | Rating is tied to a borrow transaction after V19. |
| `rating_helpful_votes` | `id` | `rating_id -> ratings`, `user_id -> users` | unique `(rating_id, user_id)` | One helpful vote per user/rating. |
| `rating_replies` | `id` | `rating_id -> ratings`, `librarian_id -> users` | index `(rating_id, created_at)` | Librarian response to rating. |
| `wish_lists` | `id` | `user_id -> users` | unique partial `user_id` | One wishlist per user. |
| `wish_lists_item` | `id` | `wish_list_id -> wish_lists`, `publication_id -> publications` | unique partial `(wish_list_id, publication_id)` | Wishlist items. |
| `user_interactions` | `id` | `user_id -> users`, `publication_id -> publications` | check `type`; indexes `(user_id, publication_id)`, `(publication_id, created_at)` | WATCH/WISHLIST/BORROWED signals for AI. |
| `ai_recommendations` | `user_id` | `user_id -> users` | index `computed_at` | Backend-readable recommendation cache. |
| `notifications` | `id` | none | check `type` | Notification message content. |
| `user_notifications` | `id` | `user_id -> users`, `notification_id -> notifications` | index `user_id` | User read/unread state. |
| `refresh_tokens` | `uuid_token` | `user_id -> users` | unique `(user_id, device_id)` | Refresh-token/session state. |
| `password_reset_tokens` | `token` | `user_id -> users` | index `user_id` | Password reset flow. |
| `system_reviews` | `id` | none | check rating 1-5; index published | Public system feedback/testimonial data. |
| `ai_engine.publication_vectors` | `id` | `publication_id -> public.publications` | HNSW vector index; publication index; trigram chunk index | Semantic search and content-based recommendation. |
| `ai_engine.publication_etl_runs` | `publication_id` | `publication_id -> public.publications` | indexes `status`, `(status, updated_at)` | AI processing state and idempotency hash. |
| `ai_engine.search_logs` | `id` | none | append-only log | AI search audit; not required in core relational ERD if diagram is crowded. |

## 4. Relationships to Draw

| Relationship | Cardinality | Draw |
|---|---|---|
| Publisher - Publication | `publishers 1 -- N publications` | FK `publications.publisher_id`. |
| Publication - Item | `publications 1 -- N items` | Physical copies. |
| Publication - Author | `publications N -- N authors` | Through `publication_authors`. |
| Publication - Category | `publications N -- N categories` | Through `publication_categories`. |
| Publication - Tag | `publications N -- N tags` | Through `publication_tags`. |
| Category hierarchy | `categories 1 -- N categories` | Self FK `parent_category_id`. |
| User - Role | `users N -- N roles` | Through `user_roles`. |
| User - BorrowingTransaction | `users 1 -- N borrowing_transactions` | Borrower. |
| Item - BorrowingTransaction | `items 1 -- N borrowing_transactions` | Copy being borrowed. |
| BorrowingTransaction - Fine | `borrowing_transactions 1 -- N fines` | Multiple fine types per transaction. |
| BorrowingTransaction - TransactionNote | `borrowing_transactions 1 -- 0..1 transaction_notes` | One issue/note per transaction. |
| User - Reservation | `users 1 -- N reservations` | Student reservation queue. |
| Publication - Reservation | `publications 1 -- N reservations` | Queue by publication/branch. |
| Item - Reservation | `items 1 -- N reservations` optional | Assigned item for pickup. |
| User - Wishlist - Publication | `users 1 -- 0..1 wish_lists`, `wish_lists N -- N publications` | Through `wish_lists_item`. |
| User - Rating - Publication | `users 1 -- N ratings`, `publications 1 -- N ratings` | Rating belongs to a borrow transaction when available. |
| Rating - HelpfulVote/Reply | `ratings 1 -- N rating_helpful_votes`, `ratings 1 -- N rating_replies` | Social/review metadata. |
| User - Notification | `users N -- N notifications` | Through `user_notifications`, with read state. |
| Publication - AI vectors | `publications 1 -- N ai_engine.publication_vectors` | Semantic chunks. |
| Publication - AI ETL run | `publications 1 -- 0..1 ai_engine.publication_etl_runs` | One latest ETL state per publication. |
| User - AI recommendation cache | `users 1 -- 0..1 ai_recommendations` | Latest recommendation list. |
| User/Publication - Interaction | `users 1 -- N user_interactions`, `publications 1 -- N user_interactions` | Recommendation signals. |

## 5. Suggested ERD Layout

| Zone | Put These Tables Together |
|---|---|
| Center | `publications`, `items`, `borrowing_transactions`, `users` |
| Left catalogue | `authors`, `publishers`, `categories`, `tags`, junction tables, translation tables |
| Right circulation | `reservations`, `fines`, `fine_payment_orders`, `transaction_notes` |
| Bottom social/AI | `ratings`, `wishlist`, `user_interactions`, `ai_recommendations`, `ai_engine.publication_vectors`, `ai_engine.publication_etl_runs` |
| Top auth/notification | `roles`, `user_roles`, `refresh_tokens`, `password_reset_tokens`, `notifications`, `user_notifications` |

## 6. Data Quality Notes for Defense

| Topic | What Was Tightened |
|---|---|
| Duplicate relation rows | Added unique composite indexes for publication-author, publication-category and publication-tag. |
| Canonical tag model | Removed unused AI-side tag tables; AI now writes only to backend-visible `public.tags/publication_tags`. |
| Search performance | Added trigram indexes for publication title/subtitle/description/AI summary and author/category names. |
| Circulation constraints | Added active borrow, reservation queue, fine payment and item availability indexes. |
| Wishlist integrity | Enforced one wishlist per user and one row per wishlist-publication pair. |
| AI processing | Kept vectors and ETL status in `ai_engine`; removed unused duplicate recommendation cache. |

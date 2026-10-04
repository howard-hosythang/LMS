-- Synthetic presentation data, NOT evidence of real usage or bank payments.
-- Runs once through the default Flyway location. Never edits existing accounts,
-- copies, policies, payment orders or migration history. All UPDATEs below join
-- the temporary manifest of rows INSERTed by this migration.
SET LOCAL TIME ZONE 'Asia/Ho_Chi_Minh';

CREATE TEMP TABLE v62_context (base BIGINT NOT NULL, anchor TIMESTAMPTZ NOT NULL) ON COMMIT DROP;
DO $$
DECLARE seed_base BIGINT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM publications) THEN
        RAISE EXCEPTION 'V62 requires at least one existing publication';
    END IF;
    -- Pick an unused positive ID block instead of assuming hardcoded IDs are free.
    SELECT candidate INTO seed_base
    FROM generate_series(0, 1000) blocks(n)
    CROSS JOIN LATERAL (SELECT 762620000000000000::BIGINT + n * 1000000 AS candidate) b
    WHERE NOT EXISTS (
        SELECT 1 FROM (
            SELECT id FROM users UNION ALL SELECT id FROM items
            UNION ALL SELECT id FROM borrowing_transactions UNION ALL SELECT id FROM reservations
            UNION ALL SELECT id FROM borrow_deposit_events UNION ALL SELECT id FROM fines
            UNION ALL SELECT id FROM reshelving_tasks UNION ALL SELECT id FROM ratings
            UNION ALL SELECT id FROM rating_helpful_votes UNION ALL SELECT id FROM rating_replies
            UNION ALL SELECT id FROM system_reviews UNION ALL SELECT id FROM wish_lists
            UNION ALL SELECT id FROM wish_lists_item UNION ALL SELECT id FROM search_history
            UNION ALL SELECT id FROM notifications UNION ALL SELECT id FROM user_notifications
            UNION ALL SELECT id FROM audit_logs UNION ALL SELECT id FROM transaction_notes
            UNION ALL SELECT id FROM user_interactions
        ) occupied WHERE id BETWEEN candidate AND candidate + 999999
    ) AND NOT EXISTS (SELECT 1 FROM items WHERE barcode LIKE 'BK-V62-' || candidate || '-%')
    ORDER BY candidate LIMIT 1;
    IF seed_base IS NULL THEN RAISE EXCEPTION 'V62 could not allocate an unused seed ID block'; END IF;
    IF (SELECT COUNT(*) FROM roles WHERE role_name IN ('STUDENT','LIBRARIAN')) <> 2 THEN
        RAISE EXCEPTION 'V62 requires STUDENT and LIBRARIAN roles';
    END IF;
    INSERT INTO v62_context VALUES (seed_base, NOW());
END $$;

CREATE TEMP TABLE v62_readers ON COMMIT DROP AS
WITH candidates AS (
    SELECT cohort, k, cohort::TEXT || LPAD((99000 + k)::TEXT, 5, '0') AS student_id
    FROM generate_series(21,24) cohorts(cohort) CROSS JOIN generate_series(1,999) candidates(k)
), free AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY cohort ORDER BY k) AS rn
    FROM candidates c WHERE NOT EXISTS (
        SELECT 1 FROM users u WHERE u.student_id = c.student_id
            OR LOWER(u.email) = 'sv.' || c.student_id || '@example.invalid'
    )
), numbered AS (
    SELECT *, (cohort - 21) * 33 + rn AS n FROM free WHERE rn <= 33
)
SELECT c.base + 1000 + n AS id, n::INT AS n, cohort, student_id,
    'sv.' || student_id || '@example.invalid' AS email,
    (ARRAY['Nguyễn','Trần','Lê','Phạm','Võ','Huỳnh'])[1 + ((n - 1) / 22)::INT] || ' ' ||
    (ARRAY['Minh Anh','Hoàng Nam','Khánh Linh','Gia Hân','Đức Huy','Bảo Trân','Quốc Thịnh',
        'Ngọc Mai','Gia Bảo','Phương Thảo','Nhật Minh','Thanh Tâm','Kim Ngân','Tuấn Kiệt',
        'Hà My','Hoài An','Quang Vinh','Cẩm Tú','Đức Long','Yến Nhi','Minh Khoa','Thảo Vy'])
        [1 + ((n - 1) % 22)::INT] AS full_name,
    (ARRAY['KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH','KHOA_DIEN_DIEN_TU','KHOA_CO_KHI',
        'KHOA_KY_THUAT_HOA_HOC','KHOA_KY_THUAT_XAY_DUNG','KHOA_KY_THUAT_GIAO_THONG',
        'KHOA_QUAN_LY_CONG_NGHIEP','KHOA_MOI_TRUONG_VA_TAI_NGUYEN','KHOA_CONG_NGHE_VAT_LIEU',
        'KHOA_KHOA_HOC_UNG_DUNG','KHOA_KY_THUAT_DIA_CHAT_VA_DAU_KHI'])[1 + ((n - 1) % 11)::INT] AS faculty
FROM numbered CROSS JOIN v62_context c;

-- Dedicated fictional staff: do not attribute fabricated events to real staff.
CREATE TEMP TABLE v62_staff ON COMMIT DROP AS
WITH free AS (
    SELECT k, ROW_NUMBER() OVER (ORDER BY k) AS n FROM generate_series(9901,9999) codes(k)
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.student_id = 'LIB' || k
        OR LOWER(u.email) = 'lib' || k || '@example.invalid')
)
SELECT c.base + 2000 + n AS id, n::INT AS n, 'LIB' || k AS code,
    'lib' || k || '@example.invalid' AS email,
    CASE WHEN n = 1 THEN 'Nguyễn Minh Khang' ELSE 'Lê Hoài Phương' END AS full_name,
    CASE WHEN n = 1 THEN 'Cơ sở 1 - Lý Thường Kiệt' ELSE 'Cơ sở 2 - Dĩ An' END AS branch
FROM free CROSS JOIN v62_context c WHERE n <= 2;

DO $$ BEGIN
    IF (SELECT COUNT(*) FROM v62_readers) <> 132 OR (SELECT COUNT(*) FROM v62_staff) <> 2 THEN
        RAISE EXCEPTION 'V62 could not allocate unique seed account identifiers';
    END IF;
END $$;

-- Readers use the existing presentation password hash (123456). Staff are LOCKED and
-- have no password: audit actors only, not new public privileged login accounts.
INSERT INTO users(id,created_at,updated_at,full_name,email,hashed_password,status,credit_score,
    date_of_birth,faculty,student_id,address,contribution_score,is_verified,account_activated_at)
SELECT r.id, c.anchor - INTERVAL '220 days', c.anchor, r.full_name, r.email,
    '$2a$10$hgmel/e7IGHnvLry9joFjegPQIse5WPwNEwr2ybB1fs9fHNp6PjNy',
    CASE WHEN n = 131 THEN 'LOCKED' WHEN n = 132 THEN 'INACTIVE' ELSE 'ACTIVE' END, 100,
    MAKE_DATE(1982 + cohort, 1 + n % 12, 1 + n % 25), faculty, student_id,
    CASE WHEN n%2=0 THEN 'Ký túc xá khu B, Dĩ An' ELSE 'Thủ Đức, TP. Hồ Chí Minh' END,
    0, TRUE, c.anchor - INTERVAL '220 days'
FROM v62_readers r CROSS JOIN v62_context c;
INSERT INTO users(id,created_at,updated_at,full_name,email,status,student_id,address,librarian_campus,is_verified)
SELECT s.id,c.anchor - INTERVAL '220 days',c.anchor,s.full_name,s.email,'LOCKED',s.code,
    s.branch,CASE WHEN n = 1 THEN 'CAMPUS_1' ELSE 'CAMPUS_2' END,TRUE
FROM v62_staff s CROSS JOIN v62_context c;
INSERT INTO user_roles(user_id,role_id)
SELECT u.id,r.id FROM (
    SELECT id,'STUDENT' AS role_name FROM v62_readers UNION ALL SELECT id,'LIBRARIAN' FROM v62_staff
) u JOIN roles r ON r.role_name = u.role_name;

CREATE TEMP TABLE v62_copies ON COMMIT DROP AS
SELECT c.base + 10000 + r.n AS id, r.n, p.id AS publication_id, s.id AS staff_id, s.branch,
    'BK-V62-' || c.base || '-' || LPAD(r.n::TEXT,3,'0') AS barcode
FROM v62_readers r CROSS JOIN v62_context c
JOIN v62_staff s ON s.n = 1 + r.n % 2
CROSS JOIN LATERAL (
    SELECT id FROM publications
    ORDER BY CASE WHEN ai_target_audience = r.faculty THEN 0
        WHEN ai_target_audience = 'TOAN_BO_SINH_VIEN_BKU' THEN 1 ELSE 2 END, id
    OFFSET ((r.n - 1) / 11) % LEAST(12, (SELECT COUNT(*) FROM publications)) LIMIT 1
) p;
INSERT INTO items(id,created_at,updated_at,barcode,publication_id,status,condition,branch,location,
    copy_type,binding_type,condition_note,acquired_date,acquisition_source)
SELECT i.id,c.anchor - INTERVAL '210 days',c.anchor,i.barcode,i.publication_id,'AVAILABLE','NEW',i.branch,
    CASE WHEN i.branch = 'Cơ sở 1 - Lý Thường Kiệt' THEN 'B4 - Kệ ' ELSE 'H6 - Kệ ' END || LPAD((1+i.n%8)::TEXT,2,'0'),
    'ORIGINAL','PAPERBACK','Bìa và trang sách nguyên vẹn, mã vạch rõ ràng.',
    (c.anchor - INTERVAL '210 days')::DATE,'Bổ sung thư viện'
FROM v62_copies i CROSS JOIN v62_context c;

-- Four non-overlapping completed loans per copy, then at most one live loan.
CREATE TEMP TABLE v62_loans ON COMMIT DROP AS
WITH history AS (
    SELECT i.n, (round - 1) * 132 + i.n AS seq, round,
        c.anchor - CASE round WHEN 1 THEN INTERVAL '170 days' WHEN 2 THEN INTERVAL '110 days'
            WHEN 3 THEN INTERVAL '50 days'
            ELSE (CASE WHEN i.n <= 8 THEN 30 + i.n % 3 WHEN i.n BETWEEN 49 AND 60 THEN 24 + i.n % 7
                WHEN i.n <= 68 THEN 15 + i.n % 7 WHEN i.n BETWEEN 81 AND 98 THEN 5 + i.n % 3
                ELSE i.n % 7 END) * INTERVAL '1 day' + INTERVAL '4 hours' END AS returned_at
    FROM v62_copies i CROSS JOIN generate_series(1,4) rounds(round) CROSS JOIN v62_context c
)
SELECT c.base + 20000 + h.seq AS id, i.id AS item_id,r.id AS user_id,i.staff_id,h.n,h.seq,
    h.returned_at - CASE WHEN round = 4 AND h.n % 4 = 0 AND h.n < 121 THEN INTERVAL '17 days'
        ELSE INTERVAL '10 days' END AS borrowed_at,
    h.returned_at, 'RETURNED'::TEXT AS status,
    CASE WHEN round = 4 AND h.n BETWEEN 121 AND 126 THEN 80000
        WHEN round = 4 AND h.n BETWEEN 127 AND 130 THEN 200000
        WHEN round = 4 AND h.n % 4 = 0 AND h.n < 121 THEN 3000 ELSE 0 END::NUMERIC AS gross_fine,
    CASE WHEN round = 4 AND h.n BETWEEN 121 AND 126 THEN 'DAMAGED_BOOK'
        WHEN round = 4 AND h.n BETWEEN 127 AND 130 THEN 'LOST_BOOK'
        WHEN round = 4 AND h.n % 4 = 0 AND h.n < 121 THEN 'OVERDUE_RETURN' ELSE NULL END::TEXT AS fine_type,
    CASE WHEN h.n % 4 = 1 THEN 0 ELSE 50000 END::NUMERIC AS deposit
FROM history h JOIN v62_copies i ON i.n = h.n JOIN v62_readers r ON r.n = h.n CROSS JOIN v62_context c;

INSERT INTO v62_loans
SELECT c.base + 20000 + 528 + i.n,i.id,r.id,i.staff_id,i.n,528+i.n,
    CASE WHEN i.n <= 8 THEN c.anchor - INTERVAL '26 days' WHEN i.n <= 48 THEN c.anchor - INTERVAL '12 days'
        WHEN i.n <= 60 THEN c.anchor - INTERVAL '20 days' ELSE NULL END,
    NULL,CASE WHEN i.n <= 48 THEN 'BORROWING' WHEN i.n <= 60 THEN 'OVERDUE' ELSE 'WAITING_FOR_PICKUP' END,
    0,NULL,CASE WHEN i.n > 60 OR i.n % 4 = 1 THEN 0 ELSE 50000 END
FROM v62_copies i JOIN v62_readers r ON r.n = i.n CROSS JOIN v62_context c WHERE i.n <= 68;

INSERT INTO borrowing_transactions(id,created_at,updated_at,item_id,user_id,librarian_id_issue,librarian_id_return,
    borrowed_date,due_date,picked_up_deadline,returned_date,renewal_count,status,
    deposit_amount,deposit_status,deposit_collected_at,deposit_collected_by_librarian_id,
    deposit_settled_at,deposit_settled_by_librarian_id,deposit_gross_fine_amount,deposit_applied_amount,
    deposit_refund_amount,deposit_additional_amount_due,reshelving_status,shelved_at,shelved_by_librarian_id)
SELECT l.id,COALESCE(borrowed_at - INTERVAL '1 day',c.anchor - INTERVAL '1 hour'),COALESCE(returned_at,c.anchor),
    item_id,user_id,CASE WHEN borrowed_at IS NOT NULL THEN staff_id END,CASE WHEN returned_at IS NOT NULL THEN staff_id END,
    borrowed_at,COALESCE((borrowed_at + CASE WHEN seq>528 AND n<=8 THEN INTERVAL '28 days' ELSE INTERVAL '14 days' END)::DATE,
        (c.anchor + INTERVAL '14 days')::DATE),
    COALESCE(borrowed_at + INTERVAL '1 day',c.anchor + INTERVAL '20 hours'),returned_at,CASE WHEN seq>528 AND n<=8 THEN 1 ELSE 0 END,status,
    deposit,CASE WHEN deposit = 0 THEN 'NOT_REQUIRED' WHEN returned_at IS NULL THEN 'COLLECTED'
        WHEN gross_fine > deposit THEN 'ADDITIONAL_DUE' WHEN gross_fine > 0 THEN 'APPLIED_TO_FINE' ELSE 'REFUNDED' END,
    CASE WHEN deposit > 0 THEN borrowed_at END,CASE WHEN deposit > 0 THEN staff_id END,
    returned_at,CASE WHEN returned_at IS NOT NULL THEN staff_id END,gross_fine,LEAST(deposit,gross_fine),
    CASE WHEN returned_at IS NOT NULL THEN GREATEST(0,deposit-gross_fine) ELSE 0 END,GREATEST(0,gross_fine-deposit),
    CASE WHEN returned_at IS NULL OR fine_type IN ('DAMAGED_BOOK','LOST_BOOK') THEN 'NOT_REQUIRED'
        WHEN seq > 396 AND n BETWEEN 69 AND 80 THEN 'WAITING' ELSE 'SHELVED' END,
    CASE WHEN returned_at IS NOT NULL AND fine_type IS DISTINCT FROM 'DAMAGED_BOOK' AND fine_type IS DISTINCT FROM 'LOST_BOOK'
        AND NOT (seq > 396 AND n BETWEEN 69 AND 80) THEN returned_at + INTERVAL '20 minutes' END,
    CASE WHEN returned_at IS NOT NULL AND fine_type IS DISTINCT FROM 'DAMAGED_BOOK' AND fine_type IS DISTINCT FROM 'LOST_BOOK'
        AND NOT (seq > 396 AND n BETWEEN 69 AND 80) THEN staff_id END
FROM v62_loans l CROSS JOIN v62_context c;

-- Match settlement semantics: fully covered fines retain their original amount;
-- partially covered UNPAID fines store only the remaining amount.
INSERT INTO fines(id,created_at,updated_at,transaction_id,fine_amount,payment_status,type,paid_date,paid_by_librarian_id)
SELECT c.base + 30000 + l.seq,l.returned_at,l.returned_at,l.id,
    CASE WHEN gross_fine > deposit THEN gross_fine-deposit ELSE gross_fine END,
    CASE WHEN gross_fine <= deposit THEN 'PAID' ELSE 'UNPAID' END,fine_type,
    CASE WHEN gross_fine <= deposit THEN returned_at END,CASE WHEN gross_fine <= deposit THEN staff_id END
FROM v62_loans l CROSS JOIN v62_context c WHERE gross_fine > 0;

INSERT INTO borrow_deposit_events(id,created_at,transaction_id,user_id,item_id,librarian_id,event_type,
    amount,gross_fine_amount,deposit_balance_before,deposit_balance_after,note,payment_method)
SELECT c.base + 40000 + l.seq * 4 + e.slot,e.occurred_at,l.id,l.user_id,l.item_id,l.staff_id,e.kind,
    e.amount,l.gross_fine,e.before_balance,e.after_balance,
    CASE e.kind WHEN 'COLLECTED' THEN 'Thu tiền cọc (Tiền mặt) khi giao sách'
        WHEN 'APPLIED_TO_FINE' THEN 'Khấu trừ tiền cọc vào phí phạt khi trả sách'
        WHEN 'REFUNDED' THEN 'Hoàn tiền cọc còn lại cho bạn đọc'
        ELSE 'Phí phạt vượt quá tiền cọc, bạn đọc cần đóng thêm' END,'CASH'
FROM v62_loans l CROSS JOIN v62_context c CROSS JOIN LATERAL (
    SELECT 0 AS slot,'COLLECTED' AS kind,l.borrowed_at AS occurred_at,l.deposit AS amount,0::NUMERIC AS before_balance,l.deposit AS after_balance
        WHERE l.deposit > 0
    UNION ALL SELECT 1,'APPLIED_TO_FINE',l.returned_at,LEAST(l.deposit,l.gross_fine),l.deposit,GREATEST(0,l.deposit-l.gross_fine)
        WHERE l.returned_at IS NOT NULL AND l.deposit > 0 AND l.gross_fine > 0
    UNION ALL SELECT 2,'REFUNDED',l.returned_at,GREATEST(0,l.deposit-l.gross_fine),GREATEST(0,l.deposit-l.gross_fine),0
        WHERE l.returned_at IS NOT NULL AND l.deposit > l.gross_fine
    UNION ALL SELECT 3,'ADDITIONAL_DUE',l.returned_at,l.gross_fine-l.deposit,0,0
        WHERE l.returned_at IS NOT NULL AND l.deposit > 0 AND l.gross_fine > l.deposit
) e;

-- Historical online requests that were never collected; NOT fabricated returns.
INSERT INTO borrowing_transactions(id,created_at,updated_at,item_id,user_id,picked_up_deadline,due_date,renewal_count,status)
SELECT c.base + 21000+i.n,c.anchor-INTERVAL '3 days',c.anchor-INTERVAL '1 day',i.id,r.id,
    c.anchor-INTERVAL '1 day',(c.anchor+INTERVAL '11 days')::DATE,0,'CANCELLED'
FROM v62_copies i JOIN v62_readers r ON r.n=i.n CROSS JOIN v62_context c WHERE i.n BETWEEN 83 AND 86;

CREATE TEMP TABLE v62_reservations ON COMMIT DROP AS
SELECT c.base+50000+i.n AS id,i.n,i.id AS item_id,r.id AS user_id,i.publication_id,i.staff_id,i.branch,
    CASE WHEN i.n <= 82 THEN 'READY_FOR_PICKUP' WHEN i.n <= 90 THEN 'EXPIRED'
        WHEN i.n <= 98 THEN 'CANCELLED' ELSE 'COMPLETED' END AS status,
    CASE WHEN i.n >= 99 THEN l.borrowed_at-INTERVAL '1 day' ELSE c.anchor-INTERVAL '3 days' END AS requested_at,
    CASE WHEN i.n <= 82 THEN c.anchor+INTERVAL '20 hours' WHEN i.n >= 99 THEN l.borrowed_at+INTERVAL '1 day'
        ELSE c.anchor-INTERVAL '1 day' END AS expires_at
FROM v62_copies i JOIN v62_readers r ON r.n=i.n JOIN v62_loans l ON l.n=i.n AND l.seq=396+i.n
CROSS JOIN v62_context c WHERE i.n BETWEEN 81 AND 82 OR i.n BETWEEN 87 AND 114;
INSERT INTO reservations(id,created_at,updated_at,user_id,publication_id,reservation_date,status,queue_position,
    hold_expiration_time,preferred_branch,assigned_item_id)
SELECT id,requested_at,CASE WHEN status='COMPLETED' THEN requested_at+INTERVAL '1 day'
    WHEN status='READY_FOR_PICKUP' THEN c.anchor ELSE expires_at END,user_id,publication_id,requested_at,status,1,
    expires_at,branch,item_id FROM v62_reservations CROSS JOIN v62_context c;

-- Final copy states FIRST: V59's trigger clears stale WAITING tasks on status changes.
UPDATE items target SET status=CASE WHEN i.n <= 60 THEN 'BORROWED' WHEN i.n <= 68 OR i.n BETWEEN 81 AND 82 THEN 'RESERVED'
    WHEN i.n BETWEEN 121 AND 126 THEN 'IN_MAINTENANCE' WHEN i.n BETWEEN 127 AND 130 THEN 'LOST' ELSE 'AVAILABLE' END,
    condition=CASE WHEN i.n >= 121 AND i.n <= 130 THEN 'OLD' ELSE 'NEW' END
FROM v62_copies i WHERE target.id=i.id;
INSERT INTO reshelving_tasks(id,item_id,transaction_id,user_id,source,status,queued_at,shelved_at,shelved_by_librarian_id)
SELECT c.base+60000+l.seq,l.item_id,l.id,l.user_id,'RETURN',t.reshelving_status,t.returned_date,t.shelved_at,t.shelved_by_librarian_id
FROM v62_loans l JOIN borrowing_transactions t ON t.id=l.id CROSS JOIN v62_context c
WHERE t.reshelving_status IN ('WAITING','SHELVED');
INSERT INTO reshelving_tasks(id,item_id,transaction_id,user_id,source,status,queued_at)
SELECT c.base+61000+i.n,i.id,c.base+21000+i.n,r.id,'PICKUP_EXPIRED','WAITING',c.anchor-INTERVAL '1 day'
FROM v62_copies i JOIN v62_readers r ON r.n=i.n CROSS JOIN v62_context c WHERE i.n BETWEEN 83 AND 86;
INSERT INTO reshelving_tasks(id,item_id,reservation_id,user_id,source,status,queued_at,shelved_at,shelved_by_librarian_id)
SELECT c.base+62000+r.n,r.item_id,r.id,r.user_id,
    CASE WHEN r.status='EXPIRED' THEN 'RESERVATION_EXPIRED' ELSE 'RESERVATION_CANCELLED' END,
    CASE WHEN r.n BETWEEN 87 AND 90 THEN 'WAITING' ELSE 'SHELVED' END,r.expires_at,
    CASE WHEN r.n NOT BETWEEN 87 AND 90 THEN r.expires_at+INTERVAL '20 minutes' END,
    CASE WHEN r.n NOT BETWEEN 87 AND 90 THEN r.staff_id END
FROM v62_reservations r CROSS JOIN v62_context c WHERE r.status IN ('EXPIRED','CANCELLED');

-- No PENDING reservation is manufactured for a publication with available copies.
-- No deposit_payment_orders/fine_payment_orders: fictional PAID/PENDING bank orders
-- must never be reused by the live payOS payment/handover paths.

INSERT INTO wish_lists(id,created_at,updated_at,user_id)
SELECT c.base+70000+r.n,c.anchor-INTERVAL '190 days',c.anchor,r.id FROM v62_readers r CROSS JOIN v62_context c;
INSERT INTO wish_lists_item(id,created_at,updated_at,wish_list_id,publication_id,added_at)
SELECT c.base+71000+r.n,c.anchor-INTERVAL '20 days',c.anchor,c.base+70000+r.n,i.publication_id,c.anchor-INTERVAL '20 days'
FROM v62_readers r JOIN v62_copies i ON i.n=r.n CROSS JOIN v62_context c;

CREATE TEMP TABLE v62_reviews ON COMMIT DROP AS
SELECT c.base+72000+l.seq AS id,l.id AS transaction_id,l.user_id,i.publication_id,i.barcode,l.seq,l.n,
    l.returned_at+INTERVAL '30 minutes' AS reviewed_at,
    CASE WHEN l.n BETWEEN 121 AND 130 THEN 3 WHEN l.n%5=0 THEN 4 ELSE 5 END AS star
FROM v62_loans l JOIN v62_copies i ON i.id=l.item_id CROSS JOIN v62_context c
WHERE (l.seq BETWEEN 265 AND 330 OR l.seq > 396) AND l.returned_at IS NOT NULL;
INSERT INTO ratings(id,created_at,updated_at,publication_id,user_id,star,comment,helpful_count,verified_borrow,transaction_id,item_barcode)
SELECT v.id,v.reviewed_at,v.reviewed_at,v.publication_id,v.user_id,v.star,
    CASE WHEN n BETWEEN 121 AND 130 THEN 'Nhãn: Nhiều lý thuyết, Khó hiểu' || E'\n\n' || 'Cần đọc chậm và kết hợp bài giảng để nắm chắc các chương chuyên sâu.'
        ELSE 'Nhãn: Đáng đọc, Ví dụ rõ ràng' || E'\n\n' ||
        (ARRAY['Tài liệu hỗ trợ tốt cho bài tập lớn, phần ví dụ giúp mình đối chiếu lý thuyết với thực hành.',
            'Mình dùng cuốn này để ôn học phần. Các chương được trình bày có hệ thống, dễ ghi chú.',
            'Nội dung hữu ích cho đồ án; nên đọc thêm tài liệu liên quan để hiểu sâu các phần nâng cao.',
            'Phần nền tảng khá rõ, phù hợp để bắt đầu tìm hiểu chủ đề trước khi đọc nghiên cứu chuyên sâu.'])[1+n%4] END,
    2,TRUE,v.transaction_id,v.barcode FROM v62_reviews v;
INSERT INTO rating_helpful_votes(id,created_at,rating_id,user_id)
SELECT c.base+73000+v.seq*2+k,v.reviewed_at+INTERVAL '1 hour',v.id,r.id
FROM v62_reviews v CROSS JOIN generate_series(1,2) votes(k)
JOIN v62_readers r ON r.n=1+(v.n-1+k)%132 CROSS JOIN v62_context c;
INSERT INTO rating_replies(id,created_at,updated_at,rating_id,librarian_id,content)
SELECT c.base+75000+v.seq,v.reviewed_at+INTERVAL '2 hours',v.reviewed_at+INTERVAL '2 hours',v.id,i.staff_id,
    'Cảm ơn bạn đã chia sẻ. Thư viện ghi nhận phản hồi và sẽ kiểm tra tài liệu để hỗ trợ việc học tốt hơn.'
FROM v62_reviews v JOIN v62_copies i ON i.n=v.n CROSS JOIN v62_context c WHERE v.n%3=0;
INSERT INTO system_reviews(id,created_at,updated_at,user_id,reviewer_name,reviewer_role,rating,comment,is_published)
SELECT c.base+76000+r.n,c.anchor-INTERVAL '2 days',c.anchor-INTERVAL '2 days',r.id,r.full_name,'Sinh viên K'||r.cohort,
    CASE WHEN r.n%7=0 THEN 3 WHEN r.n%3=0 THEN 4 ELSE 5 END,
    (ARRAY['Tra cứu bản sao và hạn trả thuận tiện; mình chủ động hơn khi chuẩn bị tài liệu cho học kỳ.',
        'Gợi ý tài liệu theo khoa khá hữu ích. Mong có thêm nhiều đầu sách chuyên ngành.',
        'Theo dõi lịch sử mượn và phí phạt rõ ràng; bộ lọc giúp tìm lại giao dịch nhanh.',
        'Đặt trước dễ theo dõi, nhưng trên điện thoại mình muốn thông báo hạn nhận nổi bật hơn.'])[1+r.n%4],TRUE
FROM v62_readers r CROSS JOIN v62_context c WHERE r.n<=32;
INSERT INTO search_history(id,created_at,updated_at,user_id,search_query)
SELECT c.base+77000+r.n*3+k,c.anchor-k*INTERVAL '1 day',c.anchor-k*INTERVAL '1 day',r.id,
    CASE k WHEN 1 THEN p.title WHEN 2 THEN 'tài liệu nền tảng '||LOWER(p.title) ELSE 'ứng dụng và bài tập '||LOWER(p.title) END
FROM v62_readers r JOIN v62_copies i ON i.n=r.n JOIN publications p ON p.id=i.publication_id
CROSS JOIN generate_series(1,3) searches(k) CROSS JOIN v62_context c;
INSERT INTO user_interactions(id,created_at,updated_at,user_id,publication_id,type)
SELECT c.base+78000+l.seq,l.borrowed_at,l.borrowed_at,l.user_id,i.publication_id,'BORROWED'
FROM v62_loans l JOIN v62_copies i ON i.id=l.item_id CROSS JOIN v62_context c WHERE l.borrowed_at IS NOT NULL;
INSERT INTO user_interactions(id,created_at,updated_at,user_id,publication_id,type)
SELECT c.base+79000+r.n*2+k,c.anchor-k*INTERVAL '1 day',c.anchor-k*INTERVAL '1 day',r.id,i.publication_id,
    CASE WHEN k=1 THEN 'WATCH' ELSE 'WISHLIST' END
FROM v62_readers r JOIN v62_copies i ON i.n=r.n CROSS JOIN generate_series(1,2) actions(k) CROSS JOIN v62_context c;

-- BIGSERIAL contact tables: use their sequences (never setval/reset shared sequences).
CREATE TEMP TABLE v62_tickets ON COMMIT DROP AS
SELECT NEXTVAL(pg_get_serial_sequence('contact_messages','id')) AS id,r.id AS user_id,r.n,r.full_name,r.email,i.staff_id,
    'LMS-'||c.base||'-'||r.n AS code,c.anchor-(1+r.n%10)*INTERVAL '1 day' AS opened_at,
    (ARRAY['NEW','IN_PROGRESS','RESOLVED','CLOSED'])[1+r.n%4] AS status,
    (ARRAY['CIRCULATION','BOOK_SUGGESTION','ACCOUNT','SYSTEM_ERROR'])[1+r.n%4] AS category
FROM v62_readers r JOIN v62_copies i ON i.n=r.n CROSS JOIN v62_context c WHERE r.n<=20;
INSERT INTO contact_messages(id,ticket_code,sender_user_id,sender_name,sender_email,category,subject,message,status,
    assigned_to_user_id,handled_by_user_id,reply_message,replied_at,closed_at,satisfaction_rating,feedback_note,created_at,updated_at)
SELECT t.id,t.code,t.user_id,t.full_name,t.email,t.category,
    CASE t.category WHEN 'CIRCULATION' THEN 'Hướng dẫn theo dõi hạn trả sách'
        WHEN 'BOOK_SUGGESTION' THEN 'Đề xuất bổ sung tài liệu học phần'
        WHEN 'ACCOUNT' THEN 'Hỗ trợ thông tin tài khoản bạn đọc' ELSE 'Hỗ trợ tra cứu tài liệu trên hệ thống' END,
    'Nhờ thư viện hướng dẫn tra cứu tài liệu, theo dõi hạn trả và sử dụng tài khoản cho học kỳ mới.',t.status,
    CASE WHEN t.status<>'NEW' THEN t.staff_id END,CASE WHEN t.status IN ('RESOLVED','CLOSED') THEN t.staff_id END,
    CASE WHEN t.status<>'NEW' THEN 'Thư viện đã tiếp nhận; bạn có thể kiểm tra mục Sách của tôi và liên hệ quầy nếu cần hỗ trợ thêm.' END,
    CASE WHEN t.status<>'NEW' THEN t.opened_at+INTERVAL '2 hours' END,
    CASE WHEN t.status='CLOSED' THEN t.opened_at+INTERVAL '4 hours' END,
    CASE WHEN t.status IN ('RESOLVED','CLOSED') THEN 4 END,
    CASE WHEN t.status IN ('RESOLVED','CLOSED') THEN 'Hướng dẫn rõ ràng, cảm ơn thư viện.' END,t.opened_at,
    CASE WHEN t.status='NEW' THEN t.opened_at ELSE t.opened_at+INTERVAL '4 hours' END FROM v62_tickets t;
INSERT INTO contact_message_comments(contact_message_id,author_user_id,author_name,author_email,author_role,body,created_at)
SELECT t.id,t.user_id,t.full_name,t.email,'USER',cm.message,t.opened_at
FROM v62_tickets t JOIN contact_messages cm ON cm.id=t.id
UNION ALL SELECT t.id,s.id,s.full_name,s.email,'LIBRARIAN',cm.reply_message,t.opened_at+INTERVAL '2 hours'
FROM v62_tickets t JOIN contact_messages cm ON cm.id=t.id JOIN v62_staff s ON s.id=t.staff_id WHERE t.status<>'NEW';
INSERT INTO contact_message_internal_notes(contact_message_id,author_user_id,body,created_at,updated_at)
SELECT t.id,t.staff_id,'Đã đối chiếu hồ sơ và hướng dẫn bạn đọc sử dụng chức năng tra cứu, theo dõi mượn trả.',
    t.opened_at+INTERVAL '1 hour',t.opened_at+INTERVAL '1 hour' FROM v62_tickets t WHERE t.status<>'NEW';

CREATE TEMP TABLE v62_messages ON COMMIT DROP AS
SELECT c.base+80000+l.seq AS id,l.user_id,l.id AS reference_id,
    COALESCE(l.returned_at,l.borrowed_at,c.anchor) AS occurred_at,
    CASE WHEN l.returned_at IS NOT NULL THEN 'RETURN_CONFIRMED' WHEN l.status='OVERDUE' THEN 'OVERDUE_WARNING'
        WHEN l.status='WAITING_FOR_PICKUP' THEN 'BOOK_RESERVED' ELSE 'BORROW_SUCCESS' END AS type,
    CASE WHEN l.returned_at IS NOT NULL THEN 'Xác nhận trả sách' WHEN l.status='OVERDUE' THEN 'Nhắc nhở sách quá hạn'
        WHEN l.status='WAITING_FOR_PICKUP' THEN 'Sách đang chờ nhận' ELSE 'Mượn sách thành công' END AS title,
    CASE WHEN l.returned_at IS NOT NULL THEN 'Thư viện đã ghi nhận trả sách "'||p.title||'".'
        WHEN l.status='OVERDUE' THEN 'Sách "'||p.title||'" đã quá hạn. Vui lòng liên hệ quầy để hoàn trả.'
        WHEN l.status='WAITING_FOR_PICKUP' THEN 'Sách "'||p.title||'" đã được giữ tại quầy. Vui lòng đến nhận trước hạn.'
        ELSE 'Bạn đã mượn sách "'||p.title||'". Vui lòng kiểm tra hạn trả trong mục Sách của tôi.' END AS message,
    '/userpage/my-books?highlight='||l.id AS link
FROM v62_loans l JOIN v62_copies i ON i.id=l.item_id JOIN publications p ON p.id=i.publication_id
CROSS JOIN v62_context c WHERE l.seq>396;
INSERT INTO notifications(id,created_at,updated_at,title,message,link,reference_id,type)
SELECT id,occurred_at,occurred_at,LEFT(title,255),message,link,reference_id,type FROM v62_messages;
INSERT INTO user_notifications(id,created_at,updated_at,user_id,notification_id,is_read,read_at)
SELECT m.id+1000,m.occurred_at,m.occurred_at,m.user_id,m.id,m.type='RETURN_CONFIRMED',
    CASE WHEN m.type='RETURN_CONFIRMED' THEN m.occurred_at+INTERVAL '1 hour' END FROM v62_messages m;
INSERT INTO transaction_notes(id,created_at,updated_at,transaction_id,librarian_id,important,note)
SELECT c.base+83000+l.seq,COALESCE(l.returned_at,l.borrowed_at,c.anchor),COALESCE(l.returned_at,l.borrowed_at,c.anchor),
    l.id,l.staff_id,l.gross_fine>0,
    CASE WHEN l.fine_type='LOST_BOOK' THEN 'Bạn đọc báo mất sách; đã ghi nhận phí bồi thường và quyết toán cọc.'
        WHEN l.fine_type='DAMAGED_BOOK' THEN 'Sách bị hư hỏng; đã ghi nhận phí và chuyển bản sao sang bảo trì.'
        WHEN l.gross_fine>0 THEN 'Sách trả trễ hạn; đã khấu trừ tiền cọc vào khoản phạt.'
        WHEN l.returned_at IS NOT NULL THEN 'Đã tiếp nhận sách trả và hoàn tất quyết toán tiền cọc.'
        WHEN l.status='OVERDUE' THEN 'Sách quá hạn; cần nhắc bạn đọc sắp xếp hoàn trả.'
        WHEN l.status='WAITING_FOR_PICKUP' THEN 'Đã giữ bản sao tại quầy, chờ bạn đọc đến nhận.'
        ELSE 'Đã bàn giao sách và hướng dẫn bạn đọc kiểm tra hạn trả.' END
FROM v62_loans l CROSS JOIN v62_context c WHERE l.seq>396;
INSERT INTO audit_logs(id,created_at,actor_user_id,actor_role,action,entity_type,entity_id,summary,details)
SELECT c.base+84000+l.seq,COALESCE(l.returned_at,l.borrowed_at,c.anchor),l.staff_id,'LIBRARIAN',
    'SEED_V62','borrowing_transactions',l.id::TEXT,'Khởi tạo hồ sơ lưu thông từ bộ dữ liệu V62',
    JSONB_BUILD_OBJECT('source','SEED_V62','synthetic',TRUE,'transactionId',l.id::TEXT,'userId',l.user_id::TEXT,
        'itemId',l.item_id::TEXT,'status',l.status,'grossFine',l.gross_fine,'deposit',l.deposit)
FROM v62_loans l CROSS JOIN v62_context c;

UPDATE users u SET contribution_score=(SELECT COUNT(*)*5 FROM v62_reviews v WHERE v.user_id=u.id),
    credit_score=CASE WHEN r.n BETWEEN 127 AND 130 THEN 65 WHEN r.n BETWEEN 121 AND 126 THEN 80
        WHEN r.n%4=0 AND r.n<121 THEN 85 ELSE 100 END
FROM v62_readers r WHERE u.id=r.id;

-- Fail atomically rather than leave a partially coherent seeded dataset.
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM v62_loans l JOIN borrowing_transactions t ON t.id=l.id
        WHERE t.returned_date<t.borrowed_date OR t.due_date<t.borrowed_date::DATE
            OR (t.returned_date IS NOT NULL AND t.deposit_amount<>t.deposit_applied_amount+t.deposit_refund_amount)
            OR t.deposit_gross_fine_amount<>t.deposit_applied_amount+t.deposit_additional_amount_due) THEN
        RAISE EXCEPTION 'V62 loan chronology/deposit reconciliation failed';
    END IF;
    IF EXISTS (SELECT 1 FROM reshelving_tasks q JOIN v62_copies i ON i.id=q.item_id JOIN items actual ON actual.id=i.id
        WHERE q.status='WAITING' AND actual.status<>'AVAILABLE') THEN
        RAISE EXCEPTION 'V62 shelving queue contains an unavailable copy';
    END IF;
    IF EXISTS (SELECT 1 FROM v62_reviews v JOIN borrowing_transactions t ON t.id=v.transaction_id JOIN items i ON i.id=t.item_id
        WHERE v.user_id<>t.user_id OR v.publication_id<>i.publication_id OR v.barcode<>i.barcode
            OR v.reviewed_at<t.returned_date OR v.reviewed_at>t.returned_date+INTERVAL '7 days') THEN
        RAISE EXCEPTION 'V62 review provenance failed';
    END IF;
    IF EXISTS (SELECT 1 FROM (
        SELECT borrowed_date,LAG(returned_date) OVER (PARTITION BY item_id ORDER BY borrowed_date,id) AS previous_return
        FROM borrowing_transactions WHERE item_id IN (SELECT id FROM v62_copies) AND borrowed_date IS NOT NULL
    ) timeline WHERE borrowed_date<previous_return) THEN
        RAISE EXCEPTION 'V62 copy loan periods overlap';
    END IF;
    IF EXISTS (SELECT item_id FROM borrowing_transactions WHERE item_id IN (SELECT id FROM v62_copies)
        AND status IN ('BORROWING','OVERDUE','WAITING_FOR_PICKUP') GROUP BY item_id HAVING COUNT(*)>1) THEN
        RAISE EXCEPTION 'V62 copy has multiple active loans';
    END IF;
END $$;

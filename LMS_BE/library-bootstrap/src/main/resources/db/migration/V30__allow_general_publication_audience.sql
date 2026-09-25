ALTER TABLE publications
    DROP CONSTRAINT IF EXISTS publications_ai_target_audience_check;

ALTER TABLE publications
    ADD CONSTRAINT publications_ai_target_audience_check CHECK (ai_target_audience IN (
        'TOAN_BO_SINH_VIEN_BKU',
        'KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH', 'KHOA_DIEN_DIEN_TU',
        'KHOA_CO_KHI', 'KHOA_KY_THUAT_HOA_HOC', 'KHOA_KY_THUAT_XAY_DUNG',
        'KHOA_KY_THUAT_GIAO_THONG', 'KHOA_QUAN_LY_CONG_NGHIEP',
        'KHOA_MOI_TRUONG_VA_TAI_NGUYEN', 'KHOA_CONG_NGHE_VAT_LIEU',
        'KHOA_KHOA_HOC_UNG_DUNG', 'KHOA_KY_THUAT_DIA_CHAT_VA_DAU_KHI'
    ));

export const facultyOptions = [
  { value: 'KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH', label: 'Khoa học và Kỹ thuật Máy tính', labelEn: 'Computer Science and Engineering' },
  { value: 'KHOA_DIEN_DIEN_TU', label: 'Điện - Điện tử', labelEn: 'Electrical and Electronics Engineering' },
  { value: 'KHOA_CO_KHI', label: 'Cơ khí', labelEn: 'Mechanical Engineering' },
  { value: 'KHOA_KY_THUAT_HOA_HOC', label: 'Kỹ thuật Hóa học', labelEn: 'Chemical Engineering' },
  { value: 'KHOA_KY_THUAT_XAY_DUNG', label: 'Kỹ thuật Xây dựng', labelEn: 'Civil Engineering' },
  { value: 'KHOA_KY_THUAT_GIAO_THONG', label: 'Kỹ thuật Giao thông', labelEn: 'Transportation Engineering' },
  { value: 'KHOA_QUAN_LY_CONG_NGHIEP', label: 'Quản lý Công nghiệp', labelEn: 'Industrial Management' },
  { value: 'KHOA_MOI_TRUONG_VA_TAI_NGUYEN', label: 'Môi trường và Tài nguyên', labelEn: 'Environment and Natural Resources' },
  { value: 'KHOA_CONG_NGHE_VAT_LIEU', label: 'Công nghệ Vật liệu', labelEn: 'Materials Technology' },
  { value: 'KHOA_KHOA_HOC_UNG_DUNG', label: 'Khoa học Ứng dụng', labelEn: 'Applied Science' },
  { value: 'KHOA_KY_THUAT_DIA_CHAT_VA_DAU_KHI', label: 'Kỹ thuật Địa chất và Dầu khí', labelEn: 'Geology and Petroleum Engineering' },
];

export const facultyLabel = (value?: string | null, language: 'vi' | 'en' = 'vi') => {
  const normalized = value?.trim();
  if (!normalized) return language === 'en' ? 'No faculty' : 'Chưa có khoa';
  if (normalized === 'Chưa ghi nhận') return language === 'en' ? 'Not recorded' : normalized;
  const faculty = facultyOptions.find((item) => item.value === normalized || item.label === normalized || `Khoa ${item.label}` === normalized);
  if (!faculty) return value!;
  return language === 'en' ? faculty.labelEn : normalized === `Khoa ${faculty.label}` ? normalized : faculty.label;
};

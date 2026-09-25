import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usersService, { OnboardingProfileRequest } from '../../api/usersService';
import { Button, Input } from '../../components/ui';
import { Header } from '../../components/public_pages/Layout';
import { toast } from 'sonner';
import { useTranslation } from '../../contexts/LanguageContext';
import { getFriendlyErrorMessage } from '../../utils/errorMessages';

const OnboardingPage = () => {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identityType: 'STUDENT' as 'STUDENT' | 'LECTURER',
    studentId: '',
    phoneNumber: '',
    faculty: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.phoneNumber || !formData.faculty) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const code = formData.studentId.trim();
    if (formData.identityType === 'STUDENT' && !/^\d{7}$/.test(code)) {
        toast.error('MSSV phải gồm đúng 7 chữ số');
        return;
    }
    if (formData.identityType === 'LECTURER' && !/^[A-Za-z0-9]{3,20}$/.test(code)) {
        toast.error('MSCB phải gồm 3-20 ký tự chữ hoặc số');
        return;
    }
    if (!/^[0-9+\-\s()]{8,20}$/.test(formData.phoneNumber.trim())) {
      toast.error('Số điện thoại không hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const payload: OnboardingProfileRequest = {
        studentId: code,
        identityType: formData.identityType,
        phoneNumber: formData.phoneNumber.trim(),
        faculty: formData.faculty
      };
      const response = await usersService.onboardingProfile(payload);
      if (response && response.code === 200) {
        toast.success(response.message || 'Cập nhật thông tin thành công!');
        navigate('/userpage/dashboard');
      } else {
        toast.error(getFriendlyErrorMessage(response, language));
      }
    } catch (error: any) {
      toast.error(getFriendlyErrorMessage(error, language));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-6">
            Hoàn tất hồ sơ đăng nhập
          </h2>
          <p className="text-sm text-gray-600 text-center mb-8">
            Vui lòng cung cấp thêm thông tin để hoàn tất việc đăng nhập Google
          </p>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò tài khoản *
              </label>
              <div className="relative">
                <select
                  name="identityType"
                  value={formData.identityType}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-700"
                >
                  <option value="STUDENT">Sinh viên</option>
                  <option value="LECTURER">Giảng viên</option>
                </select>
              </div>
            </div>

            <Input
              label={formData.identityType === 'LECTURER' ? 'Mã số cán bộ (MSCB) *' : 'Mã số sinh viên (MSSV) *'}
              name="studentId"
              value={formData.studentId}
              onChange={handleInputChange}
              required
              placeholder={formData.identityType === 'LECTURER' ? 'Ví dụ: CB001' : 'Ví dụ: 2213188'}
            />

            <Input
              label="Số điện thoại *"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
              placeholder="Ví dụ: 0886765392"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Khoa / Ngành *
              </label>
              <div className="relative">
                <select 
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-500"
                >
                  <option value="">Chọn khoa / ngành</option>
                  <option value="KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH">Khoa Khoa học và Kỹ thuật Máy tính</option>
                  <option value="KHOA_DIEN_DIEN_TU">Khoa Điện - Điện tử</option>
                  <option value="KHOA_CO_KHI">Khoa Cơ khí</option>
                  <option value="KHOA_KY_THUAT_HOA_HOC">Khoa Kỹ thuật Hóa học</option>
                  <option value="KHOA_KY_THUAT_XAY_DUNG">Khoa Kỹ thuật Xây dựng</option>
                  <option value="KHOA_KY_THUAT_GIAO_THONG">Khoa Kỹ thuật Giao thông</option>
                  <option value="KHOA_QUAN_LY_CONG_NGHIEP">Khoa Quản lý Công nghiệp</option>
                  <option value="KHOA_MOI_TRUONG_VA_TAI_NGUYEN">Khoa Môi trường và Tài nguyên</option>
                  <option value="KHOA_CONG_NGHE_VAT_LIEU">Khoa Công nghệ Vật liệu</option>
                  <option value="KHOA_KHOA_HOC_UNG_DUNG">Khoa Khoa học Ứng dụng</option>
                  <option value="KHOA_KY_THUAT_DIA_CHAT_VA_DAU_KHI">Khoa Kỹ thuật Địa chất và Dầu khí</option>
                </select>
              </div>
            </div>

            <Button fullWidth size="lg" type="submit" disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Hoàn tất'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;

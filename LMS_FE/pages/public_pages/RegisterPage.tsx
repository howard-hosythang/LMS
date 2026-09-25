import {
  CheckCircle,
  CreditCard,
  GraduationCap,
  Lock,
  Mail,
  Shield,
  User,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import authService, { RegisterRequest } from '../../api/authService';
import { Header } from '../../components/public_pages/Layout';
import { Button, Input } from '../../components/ui';
import { useTranslation } from '../../contexts/LanguageContext';
import { toast } from 'sonner';
import { getFriendlyErrorMessage } from '../../utils/errorMessages';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { language, t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: '',
    identityType: 'STUDENT' as 'STUDENT' | 'LECTURER',
    studentId: '',
    email: '',
    password: '',
    confirmPassword: '',
    faculty: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error(language === 'en' ? 'Password confirmation does not match!' : 'Mật khẩu xác nhận không khớp!');
      return;
    }
    if (!formData.faculty) {
      toast.error(language === 'en' ? 'Please select your faculty / major!' : 'Vui lòng chọn khoa / ngành!');
      return;
    }
    const code = formData.studentId.trim();
    if (formData.identityType === 'STUDENT' && !/^\d{7}$/.test(code)) {
      toast.error(language === 'en' ? 'Student ID must be exactly 7 digits.' : 'MSSV phải gồm đúng 7 chữ số.');
      return;
    }
    if (formData.identityType === 'LECTURER' && !/^[A-Za-z0-9]{3,20}$/.test(code)) {
      toast.error(language === 'en' ? 'Staff ID must be 3-20 letters or digits.' : 'MSCB phải gồm 3-20 ký tự chữ hoặc số.');
      return;
    }
    
    if (!/^[a-zA-Z0-9._%+-]+@(gmail\.com|hcmut\.edu\.vn)$/i.test(formData.email)) {
      toast.error(language === 'en' ? 'Invalid email. Please use a Gmail address.' : 'Email không hợp lệ. Vui lòng dùng email Gmail.');
      return;
    }
    
    setLoading(true);
    try {
      const payload: RegisterRequest = {
        ...formData,
        studentId: formData.studentId.trim()
      };
      const response = await authService.register(payload);
      if (response && response.code === 200) {
        toast.success(response.message || (language === 'en' ? 'Registration successful!' : 'Đăng ký thành công!'));
        navigate('/publicpage/check-email');
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
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="flex flex-col md:flex-row flex-1">
        {/* Left Side (Benefits/Branding) - Blue side */}
        <div className="hidden md:flex w-2/5 bg-blue-600 text-white p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600 to-blue-800"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold mb-6">
              {language === 'en' ? 'Discover knowledge with AI' : 'Khám phá tri thức với AI'}
            </h2>
            <p className="text-blue-100 text-lg mb-8">
              {language === 'en'
                ? 'Join the smart library, search books with natural language, and receive personalized recommendations.'
                : 'Tham gia hệ thống thư viện thông minh, tìm kiếm sách bằng ngôn ngữ tự nhiên và nhận gợi ý cá nhân hóa.'}
            </p>

            <div className="space-y-8">
              <div className="flex">
                <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold">{language === 'en' ? 'Smart search' : 'Tìm kiếm thông minh'}</h3>
                  <p className="text-blue-200 text-sm">
                    {language === 'en' ? 'AI understands meaning and finds the right materials' : 'AI hiểu ngữ nghĩa, tìm đúng tài liệu bạn cần'}
                  </p>
                </div>
              </div>
              <div className="flex">
                <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold">{language === 'en' ? 'Personalized recommendations' : 'Gợi ý cá nhân hóa'}</h3>
                  <p className="text-blue-200 text-sm">
                    {language === 'en' ? 'Books matched to your major and interests' : 'Sách phù hợp với ngành học và sở thích của bạn'}
                  </p>
                </div>
              </div>
              <div className="flex">
                <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold">{language === 'en' ? 'Easy management' : 'Quản lý dễ dàng'}</h3>
                  <p className="text-blue-200 text-sm">
                    {language === 'en' ? 'Track borrowing and renew online conveniently' : 'Theo dõi mượn trả, gia hạn online tiện lợi'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center text-sm text-blue-200 mt-auto">
            <Shield size={14} className="mr-2" /> {language === 'en' ? 'Your data is protected securely' : 'Dữ liệu được bảo mật an toàn'}
          </div>
        </div>

        {/* Right Side (Form) */}
        <div className="w-full md:w-3/5 p-8 md:p-16 overflow-y-auto">
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {language === 'en' ? 'Create account' : 'Tạo tài khoản'}
            </h2>
            <p className="text-gray-500 mb-8">
              {language === 'en' ? 'Sign up to access the library system' : 'Đăng ký để truy cập hệ thống thư viện'}
            </p>

            <form className="space-y-5" onSubmit={handleRegister}>
              <Input
                label={language === 'en' ? 'Full name *' : 'Họ và tên *'}
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                placeholder="Nguyễn Văn A"
                icon={<User size={18} />}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Account type *' : 'Vai trò tài khoản *'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <GraduationCap size={18} />
                  </div>
                  <select
                    name="identityType"
                    value={formData.identityType}
                    onChange={handleInputChange}
                    required
                    className="block w-full rounded-md border-gray-300 shadow-sm border p-2 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
                  >
                  <option value="STUDENT">{language === 'en' ? 'Student' : 'Sinh viên'}</option>
                  <option value="LECTURER">{language === 'en' ? 'Lecturer' : 'Giảng viên'}</option>
                  </select>
                </div>
              </div>

              <Input
                label={formData.identityType === 'LECTURER'
                  ? (language === 'en' ? 'Staff ID *' : 'Mã số cán bộ (MSCB) *')
                  : (language === 'en' ? 'Student ID *' : 'Mã số sinh viên (MSSV) *')}
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                required
                placeholder={formData.identityType === 'LECTURER' ? 'CB001' : '2213188'}
                icon={<CreditCard size={18} />}
              />

              <Input
                label={language === 'en' ? 'Email *' : 'Email *'}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="yourname@gmail.com"
                icon={<Mail size={18} />}
              />

              <Input
                label={language === 'en' ? 'Password *' : 'Mật khẩu *'}
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder={language === 'en' ? 'At least 8 characters' : 'Tối thiểu 8 ký tự'}
                icon={<Lock size={18} />}
              />

              <Input
                label={language === 'en' ? 'Confirm password *' : 'Xác nhận mật khẩu *'}
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder={language === 'en' ? 'Re-enter password' : 'Nhập lại mật khẩu'}
                icon={<Lock size={18} />}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Faculty / Major *' : 'Khoa / Ngành *'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <GraduationCap size={18} />
                  </div>
                  <select 
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleInputChange}
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-500"
                  >
                    <option value="">{language === 'en' ? 'Select faculty / major' : 'Chọn khoa / ngành'}</option>
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

              <div className="flex items-start">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                />
                <span className="ml-2 text-sm text-gray-600">
                  {language === 'en' ? 'I agree to the ' : 'Tôi đồng ý với '}
                  <Link to="/publicpage/terms" className="text-blue-600 hover:underline">
                    {language === 'en' ? 'Terms of use' : 'Điều khoản sử dụng'}
                  </Link>{' '}
                  {language === 'en' ? ' and ' : 'và '}
                  <Link to="/publicpage/privacy-policy" className="text-blue-600 hover:underline">
                    {language === 'en' ? 'Privacy policy' : 'Chính sách bảo mật'}
                  </Link>{' '}
                  {language === 'en' ? '' : 'của hệ thống'}
                </span>
              </div>

              <Button fullWidth size="lg" className="mt-2" type="submit" disabled={loading}>
                {loading ? (language === 'en' ? 'Signing up...' : 'Đang đăng ký...') : (language === 'en' ? 'Create account' : 'Đăng ký tài khoản')}
              </Button>

              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Already have an account?' : 'Đã có tài khoản?'}{' '}
                  <Link
                    to="/publicpage/login"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    {language === 'en' ? 'Log in now' : 'Đăng nhập ngay'}
                  </Link>
                </p>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

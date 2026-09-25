import { CheckCircle, Lock, User } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../../components/public_pages/Layout';
import { Button, Input } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../api/authService';
import { useTranslation } from '../../contexts/LanguageContext';
import { toast } from 'sonner';
import { getFriendlyErrorMessage } from '../../utils/errorMessages';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { language, t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const from = typeof location.state?.from === 'string'
    ? location.state.from
    : '/userpage/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Gọi API đăng nhập và lưu tokens, lấy về role decoded từ JWT
      const role = await login(username, password);
      
      // Redirect dựa trên role thực tế
      if (role === 'librarian') {
        navigate('/librarianpage/dashboard');
      } else if (role === 'admin') {
        navigate('/adminpage/librarians');
      } else {
        navigate(from.startsWith('/publicpage') || from.startsWith('/userpage') ? from : '/userpage/dashboard', {
          replace: true,
        });
      }
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e, language));
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="flex flex-col md:flex-row flex-1">
        {/* Left Side (Form) */}
        <div className="w-full md:w-1/2 flex flex-col p-8 md:p-16 lg:p-24 justify-center">
          <div className="mb-10">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <User size={32} />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
              {t('nav.login')}
            </h2>
            <p className="text-center text-gray-500">
              {language === 'en' ? 'Access the smart library system' : 'Truy cập vào hệ thống thư viện thông minh'}
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="space-y-6 max-w-sm mx-auto w-full"
          >
            <Input
              label="Email"
              icon={<User size={18} />}
              type="text"
              placeholder="Ví dụ: yourname@gmail.com"
              value={username}
              onChange={(e: any) => setUsername(e.target.value)}
            />
            <Input
              label={language === 'en' ? 'Password' : 'Mật khẩu'}
              icon={<Lock size={18} />}
              type="password"
              placeholder={language === 'en' ? 'Enter password' : 'Nhập mật khẩu'}
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-end">
              <Link
                to="/publicpage/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                {language === 'en' ? 'Forgot password?' : 'Quên mật khẩu?'}
              </Link>
            </div>

            <Button fullWidth size="lg" type="submit">
              {t('nav.login')}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{language === 'en' ? 'or' : 'hoặc'}</span>
              </div>
            </div>

            <Button
              fullWidth
              variant="outline"
              type="button"
              onClick={async () => {
                try {
                  const res = await authService.getGoogleLoginUrl();
                  if (res && res.data) {
                    window.location.href = res.data;
                  }
                } catch (e: any) {
                  toast.error(`${language === 'en' ? 'Unable to load Google login configuration' : 'Không thể lấy cấu hình đăng nhập Google'}: ${getFriendlyErrorMessage(e, language)}`);
                }
              }}
            >
              {language === 'en' ? 'Continue with Google' : 'Đăng nhập với Google'}
            </Button>

            <p className="text-center text-sm text-gray-600">
              {language === 'en' ? 'No account yet?' : 'Chưa có tài khoản?'}{' '}
              <Link
                to="/publicpage/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {language === 'en' ? 'Sign up now' : 'Đăng ký ngay'}
              </Link>
            </p>
          </form>
        </div>

        {/* Right Side (Info/Benefits) */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 text-white p-12 lg:p-20 flex-col justify-center relative overflow-hidden">
          {/* Abstract shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 opacity-20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

          <div className="relative z-10 max-w-lg mx-auto">
            <h2 className="text-3xl font-bold mb-8">{language === 'en' ? 'Benefits of signing in' : 'Lợi ích khi đăng nhập'}</h2>
            <ul className="space-y-6">
              <li className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center mt-0.5">
                  <CheckCircle size={14} className="text-white" />
                </div>
                <p className="ml-4 text-lg text-blue-100">
                  {language === 'en' ? 'AI semantic search and personalized recommendations' : 'Tìm kiếm thông minh với AI và gợi ý cá nhân hóa'}
                </p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center mt-0.5">
                  <CheckCircle size={14} className="text-white" />
                </div>
                <p className="ml-4 text-lg text-blue-100">
                  {language === 'en' ? 'Manage borrowing, returns, and reservations easily' : 'Quản lý mượn trả và đặt trước sách dễ dàng'}
                </p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center mt-0.5">
                  <CheckCircle size={14} className="text-white" />
                </div>
                <p className="ml-4 text-lg text-blue-100">
                  {language === 'en' ? 'Receive alerts for saved books and due dates' : 'Nhận thông báo về sách yêu thích và hạn trả'}
                </p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center mt-0.5">
                  <CheckCircle size={14} className="text-white" />
                </div>
                <p className="ml-4 text-lg text-blue-100">
                  {language === 'en' ? 'Access digital materials and ebooks' : 'Truy cập kho tài liệu số và ebook miễn phí'}
                </p>
              </li>
            </ul>

            <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <h4 className="font-bold">{language === 'en' ? 'Personal dashboard' : 'Dashboard cá nhân'}</h4>
                  <p className="text-sm text-blue-200">
                    {language === 'en' ? 'Track your learning activity' : 'Theo dõi hoạt động học tập'}
                  </p>
                </div>
              </div>
              <div className="h-24 bg-gradient-to-r from-blue-500/50 to-purple-500/50 rounded-lg flex items-end p-2 space-x-2">
                <div className="w-full bg-white/30 rounded-t h-[40%]"></div>
                <div className="w-full bg-white/50 rounded-t h-[70%]"></div>
                <div className="w-full bg-white/30 rounded-t h-[50%]"></div>
                <div className="w-full bg-white/80 rounded-t h-[85%] relative">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-white text-blue-900 text-[10px] px-1.5 py-0.5 rounded font-bold">
                    New
                  </div>
                </div>
                <div className="w-full bg-white/30 rounded-t h-[60%]"></div>
              </div>
              <p className="text-sm mt-3 text-blue-100">
                {language === 'en'
                  ? 'Track borrowed books, history, and receive recommendations aligned with your major.'
                  : 'Theo dõi sách đang mượn, lịch sử và nhận gợi ý phù hợp với chuyên ngành.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

import React, { useState, useEffect } from 'react';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../../components/public_pages/Layout';
import { Button, Input } from '../../components/ui';
import authService from '../../api/authService';
import { toast } from 'sonner';
import { useTranslation } from '../../contexts/LanguageContext';
import { getFriendlyErrorMessage } from '../../utils/errorMessages';

const ResetPasswordPage = () => {
  const { language } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Đường dẫn không hợp lệ hoặc thiếu Token!');
      navigate('/publicpage/login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword.length < 8) {
      toast.error('Mật khẩu phải dài tối thiểu 8 ký tự!');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      };
      const res = await authService.resetPassword(payload);
      if (res && res.code === 200) {
        setIsSuccess(true);
      } else {
        toast.error(getFriendlyErrorMessage(res, language));
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
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {!isSuccess ? (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 text-blue-600 shadow-sm">
                  <Lock size={32} />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
                  Đặt lại mật khẩu mới
                </h2>
                <p className="text-gray-500 text-sm">
                  Vui lòng nhập mật khẩu mới của bạn (tối thiểu 8 ký tự).
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Mật khẩu mới"
                  icon={<Lock size={18} />}
                  type="password"
                  placeholder="Tối thiểu 8 ký tự"
                  value={formData.newPassword}
                  onChange={(e: any) => setFormData({ ...formData, newPassword: e.target.value })}
                  disabled={loading}
                />
                
                <Input
                  label="Xác nhận mật khẩu"
                  icon={<Lock size={18} />}
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={formData.confirmPassword}
                  onChange={(e: any) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  disabled={loading}
                />
                
                <Button fullWidth size="lg" type="submit" disabled={loading} className="mt-2">
                  {loading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4">
                Cập nhật thành công!
              </h2>
              <p className="text-gray-600 mb-8 text-md">
                Mật khẩu của bạn đã được thay đổi thành công. Bạn đã có thể đăng nhập bằng mật khẩu mới.
              </p>
              <Link to="/publicpage/login" className="block w-full">
                <Button fullWidth size="lg" className="shadow-md">
                  Về trang Đăng nhập
                </Button>
              </Link>
            </div>
          )}

          {!isSuccess && (
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <Link
                to="/publicpage/login"
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={16} className="mr-2" />
                Hủy và quay lại
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

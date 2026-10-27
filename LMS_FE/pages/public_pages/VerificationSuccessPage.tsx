import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/public_pages/Layout';
import { Button } from '../../components/ui';
import { useTranslation } from '../../contexts/LanguageContext';

const VerificationSuccessPage = ({ failed = false }: { failed?: boolean }) => {
  const { t, language } = useTranslation();
  const en = language === 'en';
  const StatusIcon = failed ? XCircle : CheckCircle;
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 ${failed ? 'bg-red-100' : 'bg-green-100'}`}>
            <StatusIcon size={48} className={failed ? 'text-red-600' : 'text-green-600'} />
          </div>
          
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            {failed ? (en ? 'Email verification failed' : 'Xác minh email không thành công') : t('verifySuccess.title', 'Xác minh thành công!')}
          </h2>
          
          <div className="space-y-4 text-gray-600 mb-8 text-md leading-relaxed">
            <p>
              {failed ? (en ? 'The verification link may be invalid or expired.' : 'Liên kết xác minh có thể không hợp lệ hoặc đã hết hạn.') : t('verifySuccess.desc1', 'Cảm ơn bạn đã xác minh địa chỉ email. Tài khoản của bạn đã được kích hoạt thành công.')}
            </p>
            <p>
              {failed ? (en ? 'Please contact the library for help verifying your account.' : 'Vui lòng liên hệ thư viện để được hỗ trợ xác minh tài khoản.') : t('verifySuccess.desc2', 'Bây giờ bạn đã có thể đăng nhập vào hệ thống để bắt đầu khám phá các tính năng của thư viện.')}
            </p>
          </div>
          
          <Link to="/publicpage/login" className="block w-full">
            <Button fullWidth size="lg" className="group text-lg py-6 shadow-md hover:shadow-lg transition-all duration-300">
              {failed ? (en ? 'Back to sign in' : 'Quay lại đăng nhập') : t('verifySuccess.loginNow', 'Đăng nhập ngay')}
              <ArrowRight size={20} className="ml-2 group-hover:translate-x-1.5 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerificationSuccessPage;

import { CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/public_pages/Layout';
import { Button } from '../../components/ui';
import { useTranslation } from '../../contexts/LanguageContext';

const VerificationSuccessPage = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            {t('verifySuccess.title', 'Xác minh thành công!')}
          </h2>
          
          <div className="space-y-4 text-gray-600 mb-8 text-md leading-relaxed">
            <p>
              {t('verifySuccess.desc1', 'Cảm ơn bạn đã xác minh địa chỉ email. Tài khoản của bạn đã được kích hoạt thành công.')}
            </p>
            <p>
              {t('verifySuccess.desc2', 'Bây giờ bạn đã có thể đăng nhập vào hệ thống để bắt đầu khám phá các tính năng của thư viện.')}
            </p>
          </div>
          
          <Link to="/publicpage/login" className="block w-full">
            <Button fullWidth size="lg" className="group text-lg py-6 shadow-md hover:shadow-lg transition-all duration-300">
              {t('verifySuccess.loginNow', 'Đăng nhập ngay')}
              <ArrowRight size={20} className="ml-2 group-hover:translate-x-1.5 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerificationSuccessPage;

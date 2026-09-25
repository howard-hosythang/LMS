import { Settings } from 'lucide-react';
import OperationalAccountSettings from '../../components/account/OperationalAccountSettings';
import { useLanguage } from '../../contexts/LanguageContext';

const AdminSettingsPage = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <div>
        <div className="flex items-center gap-2 text-sm font-bold uppercase text-blue-600">
          <Settings size={18} />
          {isEn ? 'PERSONAL INFORMATION' : 'THÔNG TIN CÁ NHÂN'}
        </div>
        <h1 className="mt-2 text-3xl font-bold">{isEn ? 'ACCOUNT SETTINGS' : 'CÀI ĐẶT TÀI KHOẢN'}</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {isEn ? 'Change password and update personal information.' : 'Đổi mật khẩu, cập nhật các thông tin cá nhân.'}
        </p>
      </div>
      <OperationalAccountSettings title={isEn ? 'Admin account' : 'Tài khoản admin'} />
    </div>
  );
};

export default AdminSettingsPage;

import { Award, Languages, Laptop, Lock, RefreshCcw, Save, Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button, Input } from '../../components/ui';
import usersService from '../../api/usersService';
import { Language, useTranslation } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

const SettingsPage = () => {
  const { language, setLanguage, t } = useTranslation();
  const { themeMode, setThemeMode } = useTheme();
  const [profileScore, setProfileScore] = useState<{ creditScore: number; contributionScore: number } | null>(null);
  const [canChangePassword, setCanChangePassword] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false);

  useEffect(() => {
    usersService.getMyProfile()
      .then((response) => {
        setProfileScore({
          creditScore: response.data.creditScore ?? 100,
          contributionScore: response.data.contributionScore ?? 0,
        });
        setCanChangePassword(response.data.canChangePassword !== false);
      })
      .catch(() => setProfileScore(null));
  }, []);

  const handleCancel = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error(t('settings.fillPassword'));
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error(t('settings.passwordLength'));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('settings.passwordMismatch'));
      return;
    }

    try {
      setIsSaving(true);
      await usersService.changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success(t('settings.saved'));
    } catch (error: any) {
      toast.error(error?.message || t('settings.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleExchangeContribution = async () => {
    setIsExchanging(true);
    try {
      const response = await usersService.exchangeContribution();
      setProfileScore({
        creditScore: response.data.creditScore,
        contributionScore: response.data.contributionScore,
      });
      if (response.data.exchangedCredit > 0) {
        toast.success(`Đã đổi ${response.data.spentContribution} điểm đóng góp thành ${response.data.exchangedCredit} điểm tín nhiệm.`);
      } else {
        toast.info('Chưa đủ điều kiện đổi điểm hoặc điểm tín nhiệm đã đạt tối đa.');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Không thể đổi điểm lúc này.');
    } finally {
      setIsExchanging(false);
    }
  };

  const exchangeableCredit = profileScore
    ? Math.min(Math.max(0, 100 - profileScore.creditScore), Math.floor(profileScore.contributionScore / 20))
    : 0;

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-gray-500 text-sm">
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
          <Sun className="w-5 h-5 text-gray-600" />
          <h3 className="font-bold text-gray-900">{t('settings.interface')}</h3>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">{t('settings.theme')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${
                  themeMode === 'light'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Sun size={16} /> {t('settings.light')}
              </button>
              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${
                  themeMode === 'dark'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Moon size={16} /> {t('settings.dark')}
              </button>
              <button
                type="button"
                onClick={() => setThemeMode('system')}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${
                  themeMode === 'system'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Laptop size={16} /> {t('settings.system')}
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Languages size={16} /> {t('common.language')}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="vi">{t('common.vietnamese')}</option>
              <option value="en">{t('common.english')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-gray-900">Đổi điểm đóng góp</h3>
        </div>
        <div className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Công thức cân bằng hiện tại: <span className="font-bold text-gray-900">20 điểm đóng góp = 1 điểm tín nhiệm</span>, tối đa 100 điểm tín nhiệm.
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                Tín nhiệm: {profileScore?.creditScore ?? '--'}/100
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                Đóng góp: {profileScore?.contributionScore ?? '--'}
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                Có thể đổi: +{exchangeableCredit}
              </span>
            </div>
          </div>
          <Button onClick={handleExchangeContribution} disabled={isExchanging || exchangeableCredit <= 0} className="gap-2">
            <RefreshCcw size={16} />
            {isExchanging ? 'Đang đổi...' : 'Đổi điểm'}
          </Button>
        </div>
      </div>

      {/* Security Settings */}
      {canChangePassword ? (
      <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
          <Lock className="w-5 h-5 text-gray-600" />
          <h3 className="font-bold text-gray-900">{t('settings.security')}</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-4">
              {t('settings.changePassword')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="password"
                placeholder={t('settings.currentPassword')}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
              <Input
                type="password"
                placeholder={t('settings.newPassword')}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
              <Input
                type="password"
                placeholder={t('settings.confirmPassword')}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t('settings.passwordHint')}
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleCancel} disabled={isSaving}>{t('common.cancel')}</Button>
        <Button className="flex items-center px-6" onClick={handleChangePassword} disabled={isSaving}>
          <Save size={18} className="mr-2" /> {isSaving ? t('common.saving') : t('settings.changePassword')}
        </Button>
      </div>
      </>
      ) : (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-700">
          Tài khoản này đăng nhập qua Google nên không có mật khẩu riêng trong hệ thống. Nếu cần đổi mật khẩu, hãy đổi trong tài khoản Google.
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

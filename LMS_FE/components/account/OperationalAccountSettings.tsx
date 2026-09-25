import { Camera, Edit2, Lock, Save, UserRound, X } from 'lucide-react';
import { ChangeEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import usersService, { UserProfileResponse } from '../../api/usersService';
import { useLanguage } from '../../contexts/LanguageContext';

const emptyPassword = { currentPassword: '', newPassword: '', confirmPassword: '' };

const OperationalAccountSettings = ({ title = 'Tài khoản của tôi' }: { title?: string }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [profile, setProfile] = useState<UserProfileResponse['data'] | null>(null);
  const [profileForm, setProfileForm] = useState({ fullName: '', phoneNumber: '', address: '', dateOfBirth: '' });
  const [passwordForm, setPasswordForm] = useState(emptyPassword);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await usersService.getMyProfile();
      setProfile(response.data);
      setProfileForm({
        fullName: response.data.fullName || '',
        phoneNumber: response.data.phoneNumber || '',
        address: response.data.address || '',
        dateOfBirth: response.data.dateOfBirth || '',
      });
      setIsEditingProfile(false);
    } catch (error: any) {
      toast.error(error?.message || (isEn ? 'Could not load account information' : 'Không tải được thông tin tài khoản'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const response = await usersService.updateMyProfile({
        fullName: profileForm.fullName.trim(),
        phoneNumber: profileForm.phoneNumber.trim() || undefined,
        address: profileForm.address.trim() || undefined,
        dateOfBirth: profileForm.dateOfBirth || undefined,
      });
      setProfile(response.data);
      setIsEditingProfile(false);
      toast.success(isEn ? 'Account information updated' : 'Đã cập nhật thông tin tài khoản');
    } catch (error: any) {
      toast.error(error?.message || (isEn ? 'Could not update account' : 'Cập nhật tài khoản thất bại'));
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error(isEn ? 'Please fill in all password fields' : 'Vui lòng nhập đầy đủ thông tin mật khẩu');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(isEn ? 'New password and confirmation do not match' : 'Mật khẩu mới và xác nhận không khớp');
      return;
    }
    setSavingPassword(true);
    try {
      await usersService.changePassword(passwordForm);
      setPasswordForm(emptyPassword);
      toast.success(isEn ? 'Password changed' : 'Đã đổi mật khẩu');
    } catch (error: any) {
      toast.error(error?.message || (isEn ? 'Could not change password' : 'Đổi mật khẩu thất bại'));
    } finally {
      setSavingPassword(false);
    }
  };

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    await uploadAvatarFile(file);
    event.target.value = '';
  };

  const uploadAvatarFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(isEn ? 'Please choose an image file' : 'Vui lòng chọn file hình ảnh');
      return;
    }
    setUploading(true);
    try {
      const response = await usersService.updateAvatar(file);
      setProfile(response.data);
      toast.success(isEn ? 'Avatar updated' : 'Đã cập nhật ảnh đại diện');
    } catch (error: any) {
      toast.error(error?.message || (isEn ? 'Could not update avatar' : 'Cập nhật ảnh thất bại'));
    } finally {
      setUploading(false);
    }
  };

  const cancelProfileEdit = () => {
    if (!profile) return;
    setProfileForm({
      fullName: profile.fullName || '',
      phoneNumber: profile.phoneNumber || '',
      address: profile.address || '',
      dateOfBirth: profile.dateOfBirth || '',
    });
    setIsEditingProfile(false);
  };

  if (loading) {
    return <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">{isEn ? 'Loading account...' : 'Đang tải tài khoản...'}</section>;
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
        <h2 className="font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{isEn ? 'Update avatar, phone number, and login password.' : 'Cập nhật ảnh đại diện, số điện thoại và mật khẩu đăng nhập.'}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <div className="flex flex-col items-center rounded-xl border border-slate-200 p-5 text-center">
            <div className="relative h-28 w-28 overflow-hidden rounded-full bg-slate-100">
              {profile?.profilePictureUrl ? (
                <img src={profile.profilePictureUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <UserRound size={42} />
                </div>
              )}
            </div>
            <div className="mt-3 font-bold">{profile?.fullName}</div>
            <div className="text-xs text-slate-500">{profile?.email}</div>
            <label
              className={`mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                isEditingProfile
                  ? 'cursor-pointer border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
              }`}
            >
              <Camera size={16} />
              {uploading ? (isEn ? 'Uploading...' : 'Đang tải...') : (isEn ? 'Choose new photo' : 'Chọn ảnh mới')}
              <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading || !isEditingProfile} />
            </label>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold uppercase text-slate-500">{isEn ? 'Contact information' : 'Thông tin liên hệ'}</h3>
              {isEditingProfile ? (
                <button type="button" onClick={cancelProfileEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  <X size={14} /> {isEn ? 'Cancel' : 'Hủy'}
                </button>
              ) : (
                <button type="button" onClick={() => setIsEditingProfile(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100">
                  <Edit2 size={14} /> {isEn ? 'Edit information' : 'Sửa thông tin'}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input disabled={!isEditingProfile || savingProfile} className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500" placeholder={isEn ? 'Full name' : 'Họ tên'} value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} />
              <input disabled={!isEditingProfile || savingProfile} className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500" placeholder={isEn ? 'Phone number' : 'Số điện thoại'} value={profileForm.phoneNumber} onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })} />
              <input disabled={!isEditingProfile || savingProfile} type="date" className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500" value={profileForm.dateOfBirth} onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })} />
              <input disabled={!isEditingProfile || savingProfile} className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500" placeholder={isEn ? 'Address' : 'Địa chỉ'} value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
            </div>
            {isEditingProfile && (
              <button type="button" onClick={saveProfile} disabled={savingProfile} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                <Save size={16} />
                {savingProfile ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Save information' : 'Lưu thông tin')}
              </button>
            )}
          </div>

          {profile?.canChangePassword === false ? (
            <div className="border-t border-slate-100 pt-6">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase text-slate-500">
                <Lock size={16} />
                {isEn ? 'System password' : 'Mật khẩu hệ thống'}
              </h3>
              <p className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {isEn ? 'This account signs in with Google and does not have a separate system password. If you need to change the password, update it in your Google account.' : 'Tài khoản này đăng nhập qua Google nên không có mật khẩu riêng trong hệ thống. Nếu cần đổi mật khẩu, hãy đổi trong tài khoản Google.'}
              </p>
            </div>
          ) : (
          <div className="border-t border-slate-100 pt-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-slate-500">
              <Lock size={16} />
              {isEn ? 'Change password' : 'Đổi mật khẩu'}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <input disabled={!isEditingProfile || savingPassword} type="password" className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400" placeholder={isEn ? 'Current password' : 'Mật khẩu hiện tại'} value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
              <input disabled={!isEditingProfile || savingPassword} type="password" className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400" placeholder={isEn ? 'New password' : 'Mật khẩu mới'} value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
              <input disabled={!isEditingProfile || savingPassword} type="password" className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400" placeholder={isEn ? 'Confirm new password' : 'Xác nhận mật khẩu mới'} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
            </div>
            <button type="button" onClick={changePassword} disabled={savingPassword || !isEditingProfile} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              <Lock size={16} />
              {savingPassword ? (isEn ? 'Changing...' : 'Đang đổi...') : (isEn ? 'Change password' : 'Đổi mật khẩu')}
            </button>
          </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default OperationalAccountSettings;

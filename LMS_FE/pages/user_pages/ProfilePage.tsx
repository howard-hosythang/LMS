import {
  Edit2, Save, User, Image as ImageIcon,
  Hash, Mail, CreditCard, GraduationCap, Shield, Award, Camera
} from 'lucide-react';
import { Button, Input, DatePickerField } from '../../components/ui';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import usersService, { UserProfileResponse } from '../../api/usersService';
import { useTranslation } from '../../contexts/LanguageContext';
import { getFriendlyErrorMessage } from '../../utils/errorMessages';

const ProfilePage = () => {
  const { language, t } = useTranslation();
  const [profile, setProfile] = useState<UserProfileResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    fullName: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    faculty: ''
  });
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isViewingAvatar, setIsViewingAvatar] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const uploadAvatarFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.invalidAvatar', 'Vui lòng chọn file hình ảnh.'));
      return;
    }
    try {
      setIsUploadingAvatar(true);
      const res = await usersService.updateAvatar(file);

      const newUrl = res?.data?.profilePictureUrl || URL.createObjectURL(file);
      setProfile(prev => prev ? { ...prev, profilePictureUrl: newUrl } : null);
      toast.success(t('profile.avatarUpdated', 'Cập nhật ảnh đại diện thành công!'));
    } catch (error: any) {
      toast.error(`${t('profile.avatarUpdateFailed', 'Cập nhật ảnh thất bại')}: ${getFriendlyErrorMessage(error, language)}`);
    } finally {
      setIsUploadingAvatar(false);
      setIsAvatarModalOpen(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatarFile(file);
  };

  const FACULTY_LABELS: Record<string, { vi: string; en: string }> = {
    KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH: { vi: "Khoa Khoa học và Kỹ thuật Máy tính", en: "Faculty of Computer Science and Engineering" },
    KHOA_DIEN_DIEN_TU: { vi: "Khoa Điện - Điện tử", en: "Faculty of Electrical and Electronics Engineering" },
    KHOA_CO_KHI: { vi: "Khoa Cơ khí", en: "Faculty of Mechanical Engineering" },
    KHOA_KY_THUAT_HOA_HOC: { vi: "Khoa Kỹ thuật Hóa học", en: "Faculty of Chemical Engineering" },
    KHOA_KY_THUAT_XAY_DUNG: { vi: "Khoa Kỹ thuật Xây dựng", en: "Faculty of Civil Engineering" },
    KHOA_KY_THUAT_GIAO_THONG: { vi: "Khoa Kỹ thuật Giao thông", en: "Faculty of Transportation Engineering" },
    KHOA_QUAN_LY_CONG_NGHIEP: { vi: "Khoa Quản lý Công nghiệp", en: "Faculty of Industrial Management" },
    KHOA_MOI_TRUONG_VA_TAI_NGUYEN: { vi: "Khoa Môi trường và Tài nguyên", en: "Faculty of Environment and Natural Resources" },
    KHOA_CONG_NGHE_VAT_LIEU: { vi: "Khoa Công nghệ Vật liệu", en: "Faculty of Materials Technology" },
    KHOA_KHOA_HOC_UNG_DUNG: { vi: "Khoa Khoa học Ứng dụng", en: "Faculty of Applied Science" },
    KHOA_KY_THUAT_DIA_CHAT_VA_DAU_KHI: { vi: "Khoa Kỹ thuật Địa chất và Dầu khí", en: "Faculty of Geology and Petroleum Engineering" }
  };
  const facultyLabel = (code?: string | null) =>
    code && FACULTY_LABELS[code] ? FACULTY_LABELS[code][language] : t('common.none', 'Không có');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await usersService.getMyProfile();
        if (res && res.data) {
          setProfile(res.data);
          setEditData({
            fullName: res.data.fullName || '',
            phoneNumber: res.data.phoneNumber || '',
            dateOfBirth: res.data.dateOfBirth || '',
            address: res.data.address || '',
            faculty: res.data.faculty || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleEditToggle = () => {
    if (isEditing && profile) {
      // Revert if cancelling
      setEditData({
        fullName: profile.fullName || '',
        phoneNumber: profile.phoneNumber || '',
        dateOfBirth: profile.dateOfBirth || '',
        address: profile.address || '',
        faculty: profile.faculty || '',
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await usersService.updateMyProfile(editData);
      if (res && res.data) {
        setProfile(res.data);
        setIsEditing(false);
        toast.success(t('profile.updateSuccess', 'Cập nhật thông tin thành công!'));
      }
    } catch (e: any) {
      toast.error(`${t('profile.updateFailed', 'Cập nhật thất bại')}: ${getFriendlyErrorMessage(e, language)}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-10 text-gray-500">
        {t('profile.loadFailed', 'Không thể tải thông tin người dùng.')}
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto pb-10">
      {/* Profile Header / Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        </div>
        <div className="px-6 pb-6 relative flex flex-col md:flex-row justify-between items-center md:items-end">
          <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-12 w-full md:w-auto text-center md:text-left">
            <div
              className={`w-32 h-32 rounded-full border-4 border-white shadow-md bg-white overflow-hidden relative group ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
              onClick={() => {
                if (isEditing) setIsAvatarModalOpen(true);
                else if (profile.profilePictureUrl) setIsViewingAvatar(true);
              }}
            >
              {profile.profilePictureUrl ? (
                <img src={profile.profilePictureUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <User size={48} className="text-gray-400" />
                </div>
              )}
              {/* Overlay on hover */}
              {isEditing && (
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={28} />
                </div>
              )}
            </div>
            <div className="mt-4 md:mt-0 md:ml-5 pb-2">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{profile.fullName}</h2>
              <p className="text-sm font-medium text-blue-600 mt-1 uppercase tracking-wider">{profile.roles?.[0]?.roleName || 'STUDENT'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900">{t('profile.basicInfo', 'Thông tin cơ bản')}</h3>
          <Button
            size="sm"
            variant={isEditing ? "primary" : "outline"}
            className="text-xs h-8"
            onClick={handleEditToggle}
            disabled={isSaving}
          >
            {isEditing ? (
              t('profile.cancelEdit', 'Hủy chỉnh sửa')
            ) : (
              <><Edit2 size={12} className="mr-1" /> {t('profile.edit', 'Chỉnh sửa')}</>
            )}
          </Button>
        </div>

        <div className="p-6">
          {/* Read-only Immutable Info Cards */}
          <div className="bg-blue-50/40 rounded-xl p-5 border border-blue-100 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-5 mb-8">
            <div className="xl:col-span-2">
              <p className="text-xs text-blue-400 mb-1 font-semibold flex items-center uppercase tracking-wider"><Hash size={12} className="mr-1" /> {t('profile.systemId', 'ID Hệ thống')}</p>
              <p className="text-sm font-semibold text-gray-800">{profile.id}</p>
            </div>
            <div className="xl:col-span-2">
              <p className="text-xs text-blue-400 mb-1 font-semibold flex items-center uppercase tracking-wider"><Mail size={12} className="mr-1" /> Email</p>
              <p className="text-sm font-semibold text-gray-800 break-all">{profile.email}</p>
            </div>
            <div className="xl:col-span-2">
              <p className="text-xs text-blue-400 mb-1 font-semibold flex items-center uppercase tracking-wider"><CreditCard size={12} className="mr-1" /> {t('profile.studentCode', 'Mã SV/GV')}</p>
              <p className="text-sm font-semibold text-gray-800">{profile.studentId || t('common.none', 'Không có')}</p>
            </div>
            <div className="xl:col-span-2">
              <p className="text-xs text-blue-400 mb-1 font-semibold flex items-center uppercase tracking-wider"><GraduationCap size={12} className="mr-1" /> {t('profile.faculty', 'Khoa/Ngành')}</p>
              <p className="text-sm font-semibold text-gray-800">
                {facultyLabel(profile.faculty)}
              </p>
            </div>
            <div className="xl:col-span-2">
              <p className="text-xs text-blue-400 mb-1 font-semibold flex items-center uppercase tracking-wider"><Shield size={12} className="mr-1" /> {t('profile.role', 'Vai trò')}</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {profile.roles?.[0]?.roleName || 'N/A'}
              </span>
            </div>
            <div className="md:col-span-2 xl:col-span-6">
              <p className="text-xs text-blue-400 mb-1 font-semibold flex items-center uppercase tracking-wider"><Award size={12} className="mr-1" /> {t('profile.creditStatus', 'Điểm tín nhiệm / Trạng thái')}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="inline-flex min-w-[74px] justify-center items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm whitespace-nowrap">
                  ⭐ {profile.creditScore ?? 100}
                </span>
                <span className="inline-flex min-w-[130px] justify-center items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 shadow-sm whitespace-nowrap">
                  + {profile.contributionScore ?? 0} {t('profile.contributionPoints', 'đóng góp')}
                </span>
                {profile.status === 'ACTIVE' ? (
                  <span className="inline-flex min-w-[96px] justify-center items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                    {t('profile.active', 'Hoạt động')}
                  </span>
                ) : (
                  <span className="inline-flex min-w-[96px] justify-center items-center px-3 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap">
                    🔴 {profile.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          <h4 className="text-sm font-bold text-gray-700 mb-4 border-b border-gray-100 pb-2">{t('profile.editableInfo', 'Thông tin có thể can thiệp')}</h4>
          <div className="mb-6 border-b border-gray-100 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <Input
                label={t('profile.fullName', 'Họ tên')}
                value={editData.fullName}
                onChange={(e: any) => setEditData({ ...editData, fullName: e.target.value })}
                disabled={!isEditing || isSaving}
                className={!isEditing ? "bg-gray-50" : ""}
              />
              <Input
                label={t('profile.phone', 'Số điện thoại')}
                value={editData.phoneNumber}
                onChange={(e: any) => setEditData({ ...editData, phoneNumber: e.target.value })}
                disabled={!isEditing || isSaving}
                className={!isEditing ? "bg-gray-50" : ""}
              />
              <DatePickerField
                label={t('profile.birthDate', 'Ngày sinh')}
                value={editData.dateOfBirth}
                onChange={(val) => setEditData({ ...editData, dateOfBirth: val })}
                disabled={!isEditing || isSaving}
              />
              <Input
                label={t('profile.address', 'Địa chỉ')}
                value={editData.address}
                onChange={(e: any) => setEditData({ ...editData, address: e.target.value })}
                disabled={!isEditing || isSaving}
                className={!isEditing ? "bg-gray-50" : ""}
              />
              <div>
                <label className="text-sm font-medium text-gray-700">{t('profile.faculty', 'Khoa/Ngành')}</label>
                <select
                  value={editData.faculty || ''}
                  onChange={(e) => setEditData({ ...editData, faculty: e.target.value })}
                  disabled={!isEditing || isSaving}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">{t('profile.selectFaculty', 'Chọn khoa')}</option>
                  {Object.entries(FACULTY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label[language]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end mt-5 border-t border-gray-100 pt-5">
              <Button
                className="flex items-center px-6 md:mt-0 shadow-md"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save size={18} className="mr-2" />
                {isSaving ? t('common.saving', 'Đang lưu...') : t('common.saveChanges', 'Lưu thay đổi')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Avatar Modals */}
      {isAvatarModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-fade-in">
            <h3 className="text-lg font-extrabold text-gray-900 mb-6 text-center">{t('profile.avatarOptions', 'Tùy chọn ảnh đại diện')}</h3>
            <div className="space-y-3">
              <Button fullWidth variant="outline" onClick={() => { setIsViewingAvatar(true); setIsAvatarModalOpen(false); }}>
                <ImageIcon size={18} className="mr-2" /> {t('profile.viewAvatar', 'Xem ảnh lớn')}
              </Button>
              <button
                type="button"
                onClick={() => document.getElementById('avatar-upload')?.click()}
                disabled={isUploadingAvatar}
                className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50 px-4 py-5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
              >
                <Camera size={20} className="mb-2" />
                {isUploadingAvatar ? t('profile.uploading', 'Đang tải lên...') : t('profile.updateAvatar', 'Chọn ảnh mới')}
              </button>
              <input type="file" id="avatar-upload" hidden accept="image/*" onChange={handleAvatarChange} />
            </div>
            <div className="mt-5 pt-3 border-t border-gray-100">
              <Button variant="ghost" fullWidth onClick={() => setIsAvatarModalOpen(false)} className="text-gray-500">{t('common.close', 'Đóng')}</Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isViewingAvatar && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90 p-4 cursor-pointer" onClick={() => setIsViewingAvatar(false)}>
          <img
            src={profile.profilePictureUrl || ''}
            alt="Avatar Enlarge"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>,
        document.body
      )}

    </div>
  );
};

export default ProfilePage;

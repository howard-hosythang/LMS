import { BadgeCheck, CalendarClock, Filter, LockKeyhole, Pencil, Plus, RefreshCcw, Save, Search, ShieldAlert, UnlockKeyhole, UserRound, Users, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import adminService, { AccountStatus, AdminUserAccount } from '../../api/adminService';
import { useAppDialog } from '../../contexts/AppDialogContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { facultyLabel, facultyOptions } from '../../utils/facultyLabels';

const faculties = facultyOptions.map((item) => item.value);

const emptyCreateForm = {
  fullName: '',
  studentId: '',
  email: '',
  password: '',
  confirmPassword: '',
  faculty: faculties[0],
  phoneNumber: '',
  address: '',
  avatar: null as File | null,
};

const statusClass = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'border-emerald-100 bg-emerald-50 text-emerald-700';
    case 'LOCKED':
      return 'border-red-100 bg-red-50 text-red-700';
    case 'BANNED':
      return 'border-slate-900 bg-slate-900 text-white';
    default:
      return 'border-amber-100 bg-amber-50 text-amber-700';
  }
};

const formatRelativeLogin = (value?: string | null, isEn = false) => {
  if (!value) return isEn ? 'Never logged in' : 'Chưa đăng nhập';
  const timestamp = new Date(value).getTime();
  const diffMs = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return isEn ? 'Just now' : 'Vừa xong';
  if (diffMs < hour) return isEn ? `${Math.floor(diffMs / minute)} minutes ago` : `${Math.floor(diffMs / minute)} phút trước`;
  if (diffMs < day) return isEn ? `${Math.floor(diffMs / hour)} hours ago` : `${Math.floor(diffMs / hour)} giờ trước`;
  if (diffMs < 30 * day) return isEn ? `${Math.floor(diffMs / day)} days ago` : `${Math.floor(diffMs / day)} ngày trước`;
  return new Date(value).toLocaleDateString('vi-VN');
};

const formatActivationTime = (value?: string | null, isEn = false) => {
  if (!value) return isEn ? 'No activation time' : 'Chưa có mốc kích hoạt';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isOnline = (value?: string | null) =>
  Boolean(value && Date.now() - new Date(value).getTime() <= 30 * 60 * 1000);

const AdminUsersPage = () => {
  const dialog = useAppDialog();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [users, setUsers] = useState<AdminUserAccount[]>([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('ALL');
  const [faculty, setFaculty] = useState('ALL');
  const [verifiedFilter, setVerifiedFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'createdAt' | 'lastLoginAt' | 'fullName' | 'studentId' | 'faculty' | 'status'>('createdAt');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminUserAccount | null>(null);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editAvatar, setEditAvatar] = useState<File | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    studentId: '',
    faculty: faculties[0],
    phoneNumber: '',
    address: '',
  });
  const text = {
    loadFailed: isEn ? 'Could not load users' : 'Không tải được danh sách người dùng',
    createConfirmTitle: isEn ? 'Create user account?' : 'Tạo tài khoản người dùng?',
    createConfirmText: isEn ? 'Create account' : 'Tạo tài khoản',
    createSuccess: isEn ? 'User account created' : 'Đã tạo tài khoản người dùng',
    createFailed: isEn ? 'Could not create account' : 'Tạo tài khoản thất bại',
    lockTitle: isEn ? 'Confirm account lock' : 'Xác nhận khóa tài khoản',
    activateTitle: isEn ? 'Confirm account activation' : 'Xác nhận kích hoạt tài khoản',
    lockText: isEn ? 'Lock account' : 'Khóa tài khoản',
    activateText: isEn ? 'Activate' : 'Kích hoạt',
    lockSuccess: isEn ? 'User account locked' : 'Đã khóa tài khoản người dùng',
    activateSuccess: isEn ? 'User account activated' : 'Đã kích hoạt tài khoản người dùng',
    statusFailed: isEn ? 'Could not update status' : 'Cập nhật trạng thái thất bại',
    verifyTitle: isEn ? 'Confirm account verification' : 'Xác nhận verify tài khoản',
    verifyText: isEn ? 'Verify' : 'Verify',
    verifySuccess: isEn ? 'User account verified' : 'Đã verify tài khoản người dùng',
    verifyFailed: isEn ? 'Could not verify account' : 'Verify tài khoản thất bại',
    updateSuccess: isEn ? 'User information updated' : 'Đã cập nhật thông tin người dùng',
    updateFailed: isEn ? 'Could not update information' : 'Cập nhật thông tin thất bại',
  };

  const summary = useMemo(() => ({
    total: users.length,
    active: users.filter((item) => item.status === 'ACTIVE').length,
    verified: users.filter((item) => item.verified).length,
    locked: users.filter((item) => item.status === 'LOCKED' || item.status === 'BANNED').length,
  }), [users]);

  const filteredUsers = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const rows = users.filter((item) => {
      if (status === 'LOCKED_OR_BANNED' && item.status !== 'LOCKED' && item.status !== 'BANNED') return false;
      if (status !== 'ALL' && status !== 'LOCKED_OR_BANNED' && item.status !== status) return false;
      if (faculty !== 'ALL' && item.faculty !== faculty) return false;
      if (verifiedFilter === 'VERIFIED' && !item.verified) return false;
      if (verifiedFilter === 'UNVERIFIED' && item.verified) return false;
      if (!q) return true;
      return [
        item.fullName,
        item.email,
        item.studentId,
        item.phoneNumber,
        item.address,
        item.faculty,
      ].some((value) => (value || '').toLowerCase().includes(q));
    });
    const direction = sortDir === 'ASC' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const left = String((a as any)[sortBy] || '').toLowerCase();
      const right = String((b as any)[sortBy] || '').toLowerCase();
      return left.localeCompare(right, 'vi') * direction;
    });
  }, [users, keyword, status, faculty, verifiedFilter, sortBy, sortDir]);

  const load = async () => {
    setLoading(true);
    try {
      const response = await adminService.listUsers({ role: 'STUDENT' });
      setUsers(response.data || []);
    } catch {
      toast.error(text.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createUser = async (event: FormEvent) => {
    event.preventDefault();
    const confirmed = await dialog.confirm({
      title: text.createConfirmTitle,
      message: isEn
        ? `Account ${createForm.fullName.trim()} will be created as ACTIVE and email verification will be skipped.`
        : `Tài khoản ${createForm.fullName.trim()} sẽ được tạo ở trạng thái ACTIVE và bỏ qua bước verify email.`,
      confirmText: text.createConfirmText,
      variant: 'warning',
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      const response = await adminService.createUser({
        fullName: createForm.fullName.trim(),
        studentId: createForm.studentId.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        confirmPassword: createForm.confirmPassword,
        faculty: createForm.faculty,
        phoneNumber: createForm.phoneNumber.trim() || null,
        address: createForm.address.trim() || null,
        avatar: createForm.avatar,
      });
      setUsers((current) => [response.data, ...current]);
      setCreateForm(emptyCreateForm);
      setShowCreate(false);
      toast.success(text.createSuccess);
    } catch (error: any) {
      toast.error(error?.message || text.createFailed);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (userId: string, nextStatus: AccountStatus) => {
    const target = users.find((item) => item.id === userId);
    const confirmed = await dialog.confirm({
      title: nextStatus === 'LOCKED' ? text.lockTitle : text.activateTitle,
      message: isEn
        ? `Are you sure you want to ${nextStatus === 'LOCKED' ? 'lock' : 'activate'} account ${target?.fullName || userId}?`
        : `Bạn có chắc chắn ${nextStatus === 'LOCKED' ? 'khóa' : 'kích hoạt'} tài khoản ${target?.fullName || userId}?`,
      confirmText: nextStatus === 'LOCKED' ? text.lockText : text.activateText,
      variant: nextStatus === 'LOCKED' ? 'danger' : 'warning',
    });
    if (!confirmed) return;
    setUpdatingId(userId);
    try {
      const response = await adminService.updateUserStatus(userId, nextStatus);
      setUsers((current) => current.map((item) => (item.id === userId ? response.data : item)));
      toast.success(nextStatus === 'LOCKED' ? text.lockSuccess : text.activateSuccess);
    } catch (error: any) {
      toast.error(error?.message || text.statusFailed);
    } finally {
      setUpdatingId(null);
    }
  };

  const verify = async (userId: string) => {
    const target = users.find((item) => item.id === userId);
    const confirmed = await dialog.confirm({
      title: text.verifyTitle,
      message: isEn
        ? `Are you sure you want to verify account ${target?.fullName || userId}?`
        : `Bạn có chắc chắn verify tài khoản ${target?.fullName || userId}?`,
      confirmText: text.verifyText,
      variant: 'warning',
    });
    if (!confirmed) return;
    setUpdatingId(userId);
    try {
      const response = await adminService.verifyUser(userId);
      setUsers((current) => current.map((item) => item.id === userId ? response.data : item));
      toast.success(text.verifySuccess);
    } catch (error: any) {
      toast.error(error?.message || text.verifyFailed);
    } finally {
      setUpdatingId(null);
    }
  };

  const openEdit = (item: AdminUserAccount) => {
    setEditing(item);
    setEditForm({
      fullName: item.fullName || '',
      email: item.email || '',
      studentId: item.studentId || '',
      faculty: item.faculty || faculties[0],
      phoneNumber: item.phoneNumber || '',
      address: item.address || '',
    });
    setEditAvatar(null);
  };

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setUpdatingId(editing.id);
    try {
      const response = await adminService.updateManagedUser(editing.id, {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        studentId: editForm.studentId.trim(),
        faculty: editForm.faculty,
        phoneNumber: editForm.phoneNumber.trim() || null,
        address: editForm.address.trim() || null,
      });
      const updated = editAvatar
        ? await adminService.uploadManagedUserAvatar(editing.id, editAvatar)
        : response;
      setUsers((current) => current.map((item) => item.id === editing.id ? updated.data : item));
      setEditing(null);
      setEditAvatar(null);
      toast.success(text.updateSuccess);
    } catch (error: any) {
      toast.error(error?.message || text.updateFailed);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1680px] space-y-6 p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold uppercase text-blue-600">
            <Users size={18} />
            {isEn ? 'User management' : 'Quản lý người dùng'}
          </div>
          <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{isEn ? 'USER ACCOUNTS' : 'TÀI KHOẢN NGƯỜI DÙNG'}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{isEn ? 'Track profiles, status, faculty, and activity history for Library74 users.' : 'Theo dõi hồ sơ, trạng thái, khoa và lịch sử hoạt động của người dùng Library74.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
            <Plus size={16} />
            {isEn ? 'Create account' : 'Tạo tài khoản mới'}
          </button>
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <RefreshCcw size={16} />
            {isEn ? 'Refresh' : 'Làm mới'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <button type="button" onClick={() => { setStatus('ALL'); setVerifiedFilter('ALL'); }} className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-200">
          <div className="flex items-center justify-between"><span className="text-xs font-black uppercase text-slate-500">{isEn ? 'Total accounts' : 'Tổng tài khoản'}</span><Users className="text-blue-600" size={20} /></div>
          <p className="mt-3 text-3xl font-black">{summary.total}</p>
          <p className="text-xs text-slate-500">{isEn ? 'users' : 'người dùng'}</p>
        </button>
        <button type="button" onClick={() => setStatus('ACTIVE')} className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-emerald-200">
          <div className="flex items-center justify-between"><span className="text-xs font-black uppercase text-slate-500">{isEn ? 'Active' : 'Đang active'}</span><CalendarClock className="text-emerald-600" size={20} /></div>
          <p className="mt-3 text-3xl font-black">{summary.active}</p>
          <p className="text-xs text-slate-500">{isEn ? 'can use the system' : 'có thể sử dụng hệ thống'}</p>
        </button>
        <button type="button" onClick={() => setVerifiedFilter('VERIFIED')} className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-200">
          <div className="flex items-center justify-between"><span className="text-xs font-black uppercase text-slate-500">{isEn ? 'Verified' : 'Đã verify'}</span><BadgeCheck className="text-blue-600" size={20} /></div>
          <p className="mt-3 text-3xl font-black">{summary.verified}</p>
          <p className="text-xs text-slate-500">{isEn ? 'confirmed profiles' : 'hồ sơ đã xác nhận'}</p>
        </button>
        <button type="button" onClick={() => setStatus('LOCKED_OR_BANNED')} className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-red-200">
          <div className="flex items-center justify-between"><span className="text-xs font-black uppercase text-slate-500">{isEn ? 'Locked/banned' : 'Bị khóa/cấm'}</span><ShieldAlert className="text-red-600" size={20} /></div>
          <p className="mt-3 text-3xl font-black">{summary.locked}</p>
          <p className="text-xs text-slate-500">{isEn ? 'needs admin attention' : 'cần admin lưu ý'}</p>
        </button>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={isEn ? 'Search name, email, student ID, phone, faculty...' : 'Tìm tên, email, MSSV, SĐT, khoa...'} className="h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950" />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950">
            <option value="ALL">{isEn ? 'All statuses' : 'Tất cả trạng thái'}</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="LOCKED_OR_BANNED">LOCKED/BANNED</option>
            <option value="LOCKED">LOCKED</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="BANNED">BANNED</option>
          </select>
          <select value={faculty} onChange={(event) => setFaculty(event.target.value)} className="h-10 min-w-[190px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950">
            <option value="ALL">{isEn ? 'All faculties' : 'Tất cả khoa'}</option>
            {facultyOptions.map((item) => <option key={item.value} value={item.value}>{isEn ? item.labelEn : item.label}</option>)}
          </select>
          <select value={verifiedFilter} onChange={(event) => setVerifiedFilter(event.target.value)} className="h-10 min-w-[135px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950">
            <option value="ALL">{isEn ? 'Verification: all' : 'Verify: tất cả'}</option>
            <option value="VERIFIED">{isEn ? 'Verified' : 'Đã verify'}</option>
            <option value="UNVERIFIED">{isEn ? 'Unverified' : 'Chưa verify'}</option>
          </select>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as any)} className="h-10 min-w-[145px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950">
            <option value="createdAt">{isEn ? 'Created date' : 'Ngày tạo'}</option>
            <option value="lastLoginAt">{isEn ? 'Last login' : 'Đăng nhập gần nhất'}</option>
            <option value="fullName">{isEn ? 'Name A-Z' : 'Tên A-Z'}</option>
            <option value="studentId">MSSV</option>
            <option value="faculty">{isEn ? 'Faculty' : 'Khoa'}</option>
            <option value="status">{isEn ? 'Status' : 'Trạng thái'}</option>
          </select>
          <select value={sortDir} onChange={(event) => setSortDir(event.target.value as 'ASC' | 'DESC')} className="h-10 min-w-[115px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950">
            <option value="DESC">{isEn ? 'Descending' : 'Giảm dần'}</option>
            <option value="ASC">{isEn ? 'Ascending' : 'Tăng dần'}</option>
          </select>
          <button type="button" onClick={() => { setKeyword(''); setStatus('ALL'); setFaculty('ALL'); setVerifiedFilter('ALL'); }} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            <Filter size={16} />
            {isEn ? 'Clear filters' : 'Xóa lọc'}
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="hidden grid-cols-[minmax(0,1.5fr)_100px_minmax(0,1fr)_140px_150px_minmax(0,1.45fr)] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 xl:grid">
          <div>{isEn ? 'User' : 'Người dùng'}</div>
          <div>MSSV</div>
          <div>{isEn ? 'Faculty' : 'Khoa'}</div>
          <div>{isEn ? 'Status' : 'Trạng thái'}</div>
          <div>{isEn ? 'Activity' : 'Hoạt động'}</div>
          <div className="text-right">{isEn ? 'Actions' : 'Thao tác'}</div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="p-5 text-sm text-slate-500">{isEn ? 'Loading...' : 'Đang tải...'}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-5 text-sm text-slate-500">{isEn ? 'No matching users.' : 'Không có người dùng phù hợp.'}</div>
          ) : filteredUsers.map((item) => (
            <div key={item.id} className="grid grid-cols-1 gap-3 px-4 py-4 text-sm xl:grid-cols-[minmax(0,1.5fr)_100px_minmax(0,1fr)_140px_150px_minmax(0,1.45fr)] xl:items-start xl:px-5">
              <div className="flex min-w-0 items-center gap-3">
                {item.profilePictureUrl ? <img src={item.profilePictureUrl} alt={item.fullName} className="h-11 w-11 rounded-lg object-cover" /> : <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><UserRound size={20} /></div>}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 truncate font-bold">{item.fullName}{item.verified && <BadgeCheck size={16} className="shrink-0 fill-blue-600 text-white" />}</div>
                  <div className="truncate text-slate-500">{item.email}</div>
                  <div className="truncate text-xs text-slate-400">{item.phoneNumber || (isEn ? 'No phone' : 'Chưa có SĐT')} · {item.address || (isEn ? 'No address' : 'Chưa có địa chỉ')}</div>
                </div>
              </div>
              <div className="font-semibold text-slate-700 dark:text-slate-300">{item.studentId || 'N/A'}</div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{facultyLabel(item.faculty, language)}</div>
              <div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(item.status)}`}>{item.status}</span>
                <div className="mt-1 text-xs font-semibold text-slate-400">{item.verified ? (isEn ? 'Verified' : 'Đã verify') : (isEn ? 'Unverified' : 'Chưa verify')}</div>
                {item.status === 'ACTIVE' && <div className="mt-1 text-xs text-slate-400">{isEn ? 'Activated: ' : 'Kích hoạt: '}{formatActivationTime(item.accountActivatedAt, isEn)}</div>}
              </div>
              <div className="text-xs leading-5 text-slate-500">
                <span className={`inline-flex rounded-full px-2.5 py-1 font-bold ${isOnline(item.lastLoginAt) ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {isOnline(item.lastLoginAt) ? 'Online' : 'Offline'}
                </span>
                <div className="mt-1">{isEn ? 'Login: ' : 'Đăng nhập: '}{formatRelativeLogin(item.lastLoginAt, isEn)}</div>
              </div>
              <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                <button type="button" disabled={updatingId === item.id} onClick={() => openEdit(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><Pencil size={15} />{isEn ? 'Edit' : 'Sửa'}</button>
                {!item.verified && <button type="button" disabled={updatingId === item.id} onClick={() => verify(item.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-60"><BadgeCheck size={15} />Verify</button>}
                {item.status === 'LOCKED' ? (
                  <button type="button" disabled={updatingId === item.id} onClick={() => changeStatus(item.id, 'ACTIVE')} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"><UnlockKeyhole size={15} />{isEn ? 'Activate' : 'Kích hoạt'}</button>
                ) : (
                  <button type="button" disabled={updatingId === item.id} onClick={() => changeStatus(item.id, 'LOCKED')} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"><LockKeyhole size={15} />{isEn ? 'Lock' : 'Khóa'}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={createUser} className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{isEn ? 'Create user account' : 'Tạo tài khoản người dùng'}</h2>
                <p className="text-sm text-slate-500">{isEn ? 'Admin creates the account directly; it is activated and email-verified immediately.' : 'Admin tạo trực tiếp, tài khoản được active và verified email ngay.'}</p>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">{isEn ? 'Full name' : 'Họ tên'}<input required value={createForm.fullName} onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <label className="text-sm font-semibold text-slate-700">Email HCMUT<input required type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <label className="text-sm font-semibold text-slate-700">MSSV<input required value={createForm.studentId} onChange={(e) => setCreateForm({ ...createForm, studentId: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <label className="text-sm font-semibold text-slate-700">{isEn ? 'Faculty' : 'Khoa'}<select value={createForm.faculty} onChange={(e) => setCreateForm({ ...createForm, faculty: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500">{facultyOptions.map((item) => <option key={item.value} value={item.value}>{isEn ? item.labelEn : item.label}</option>)}</select></label>
              <label className="text-sm font-semibold text-slate-700">{isEn ? 'Password' : 'Mật khẩu'}<input required minLength={4} type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <label className="text-sm font-semibold text-slate-700">{isEn ? 'Confirm password' : 'Xác nhận mật khẩu'}<input required minLength={4} type="password" value={createForm.confirmPassword} onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <label className="text-sm font-semibold text-slate-700">{isEn ? 'Phone' : 'SĐT'}<input value={createForm.phoneNumber} onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <label className="text-sm font-semibold text-slate-700">{isEn ? 'Avatar' : 'Ảnh đại diện'}<input type="file" accept="image/*" onChange={(e) => setCreateForm({ ...createForm, avatar: e.target.files?.[0] || null })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-blue-700" /></label>
              <label className="text-sm font-semibold text-slate-700 md:col-span-2">{isEn ? 'Address' : 'Địa chỉ'}<input value={createForm.address} onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50">{isEn ? 'Cancel' : 'Hủy'}</button>
              <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"><Plus size={16} />{isEn ? 'Create account' : 'Tạo tài khoản'}</button>
            </div>
          </form>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={saveEdit} className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div><h2 className="text-xl font-bold">{isEn ? 'Edit user information' : 'Sửa thông tin người dùng'}</h2><p className="text-sm text-slate-500">{isEn ? 'Update display profile and identity information.' : 'Cập nhật hồ sơ hiển thị và thông tin định danh.'}</p></div>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">{isEn ? 'Full name' : 'Họ tên'}<input required value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <label className="text-sm font-semibold text-slate-700">Email<input required type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <label className="text-sm font-semibold text-slate-700">MSSV<input required value={editForm.studentId} onChange={(e) => setEditForm({ ...editForm, studentId: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <label className="text-sm font-semibold text-slate-700">{isEn ? 'Faculty' : 'Khoa'}<select value={editForm.faculty} onChange={(e) => setEditForm({ ...editForm, faculty: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500">{facultyOptions.map((item) => <option key={item.value} value={item.value}>{isEn ? item.labelEn : item.label}</option>)}</select></label>
              <label className="text-sm font-semibold text-slate-700">{isEn ? 'Phone' : 'SĐT'}<input value={editForm.phoneNumber} onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <label className="text-sm font-semibold text-slate-700">{isEn ? 'Avatar' : 'Ảnh đại diện'}<input type="file" accept="image/*" onChange={(e) => setEditAvatar(e.target.files?.[0] || null)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-blue-700" /></label>
              <label className="text-sm font-semibold text-slate-700 md:col-span-2">{isEn ? 'Address' : 'Địa chỉ'}<input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50">{isEn ? 'Cancel' : 'Hủy'}</button>
              <button disabled={updatingId === editing.id} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"><Save size={16} />{isEn ? 'Save changes' : 'Lưu thay đổi'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;

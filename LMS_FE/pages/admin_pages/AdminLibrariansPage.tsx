import { BadgeCheck, Building2, CalendarClock, Filter, LockKeyhole, Pencil, Plus, RefreshCcw, Save, Search, ShieldAlert, ShieldCheck, UnlockKeyhole, UserRound, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import adminService, { AccountStatus, LibrarianAccount, LibrarianCampus } from '../../api/adminService';
import { useAppDialog } from '../../contexts/AppDialogContext';
import { useLanguage } from '../../contexts/LanguageContext';

const emptyForm = { fullName: '', email: '', librarianCode: '', librarianCampus: 'CAMPUS_1' as LibrarianCampus, phoneNumber: '', address: '', password: '', avatar: null as File | null };

const campusOptions: { value: LibrarianCampus | 'ALL_FILTER'; label: string }[] = [
  { value: 'CAMPUS_1', label: 'Cơ sở 1' },
  { value: 'CAMPUS_2', label: 'Cơ sở 2' },
  { value: 'ALL', label: 'Toàn bộ cơ sở' },
];

const campusLabel = (value?: string | null, isEn = false) => {
  if (value === 'CAMPUS_1') return isEn ? 'Campus 1' : 'Cơ sở 1';
  if (value === 'CAMPUS_2') return isEn ? 'Campus 2' : 'Cơ sở 2';
  if (value === 'ALL') return isEn ? 'All campuses' : 'Toàn bộ cơ sở';
  return isEn ? 'No campus selected' : 'Chưa chọn cơ sở';
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

const formatDateTime = (value?: string | null, isEn = false) => {
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

const AdminLibrariansPage = () => {
  const dialog = useAppDialog();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [librarians, setLibrarians] = useState<LibrarianAccount[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('ALL');
  const [campus, setCampus] = useState('ALL_FILTER');
  const [verifiedFilter, setVerifiedFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'createdAt' | 'lastLoginAt' | 'fullName' | 'librarianCode' | 'librarianCampus' | 'status'>('createdAt');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<LibrarianAccount | null>(null);
  const [editAvatar, setEditAvatar] = useState<File | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', librarianCode: '', librarianCampus: 'CAMPUS_1' as LibrarianCampus, phoneNumber: '', address: '' });
  const text = {
    loadFailed: isEn ? 'Could not load librarians' : 'Không tải được danh sách thủ thư',
    createTitle: isEn ? 'Confirm librarian creation' : 'Xác nhận tạo thủ thư',
    createText: isEn ? 'Create account' : 'Tạo tài khoản',
    createSuccess: isEn ? 'Librarian account created' : 'Đã tạo tài khoản thủ thư',
    createFailed: isEn ? 'Could not create account' : 'Tạo tài khoản thất bại',
    lockTitle: isEn ? 'Confirm account lock' : 'Xác nhận khóa tài khoản',
    activateTitle: isEn ? 'Confirm account activation' : 'Xác nhận kích hoạt tài khoản',
    lockText: isEn ? 'Lock account' : 'Khóa tài khoản',
    activateText: isEn ? 'Activate' : 'Kích hoạt',
    lockSuccess: isEn ? 'Librarian account locked' : 'Đã khóa tài khoản thủ thư',
    activateSuccess: isEn ? 'Librarian account activated' : 'Đã kích hoạt tài khoản thủ thư',
    statusFailed: isEn ? 'Could not update status' : 'Cập nhật trạng thái thất bại',
    verifyTitle: isEn ? 'Confirm account verification' : 'Xác nhận verify tài khoản',
    verifySuccess: isEn ? 'Librarian account verified' : 'Đã verify tài khoản thủ thư',
    verifyFailed: isEn ? 'Could not verify account' : 'Verify tài khoản thất bại',
    updateSuccess: isEn ? 'Librarian information updated' : 'Đã cập nhật thông tin thủ thư',
    updateFailed: isEn ? 'Could not update information' : 'Cập nhật thông tin thất bại',
  };

  const summary = useMemo(() => ({
    total: librarians.length,
    active: librarians.filter((item) => item.status === 'ACTIVE').length,
    verified: librarians.filter((item) => item.verified).length,
    locked: librarians.filter((item) => item.status === 'LOCKED' || item.status === 'BANNED').length,
  }), [librarians]);

  const filteredLibrarians = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const rows = librarians.filter((item) => {
      if (status === 'LOCKED_OR_BANNED' && item.status !== 'LOCKED' && item.status !== 'BANNED') return false;
      if (status !== 'ALL' && status !== 'LOCKED_OR_BANNED' && item.status !== status) return false;
      if (campus !== 'ALL_FILTER' && item.librarianCampus !== campus) return false;
      if (verifiedFilter === 'VERIFIED' && !item.verified) return false;
      if (verifiedFilter === 'UNVERIFIED' && item.verified) return false;
      if (!q) return true;
      return [item.fullName, item.email, item.phoneNumber, item.address, item.librarianCode, item.librarianCampus].some((value) => (value || '').toLowerCase().includes(q));
    });
    const direction = sortDir === 'ASC' ? 1 : -1;
    return [...rows].sort((a, b) => String((a as any)[sortBy] || '').toLowerCase().localeCompare(String((b as any)[sortBy] || '').toLowerCase(), 'vi') * direction);
  }, [librarians, keyword, status, campus, verifiedFilter, sortBy, sortDir]);

  const load = async () => {
    setLoading(true);
    try {
      const response = await adminService.listLibrarians();
      setLibrarians(response.data || []);
    } catch {
      toast.error(text.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const confirmed = await dialog.confirm({
      title: text.createTitle,
      message: isEn
        ? `Create librarian account ${form.fullName.trim()}? The librarian code will be generated automatically.`
        : `Bạn có chắc chắn tạo tài khoản thủ thư ${form.fullName.trim()} không? Mã thủ thư sẽ được hệ thống tự sinh.`,
      confirmText: text.createText,
      variant: 'warning',
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      const response = await adminService.createLibrarian({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        librarianCampus: form.librarianCampus,
        phoneNumber: form.phoneNumber.trim(),
        address: form.address.trim(),
        avatar: form.avatar || undefined,
        password: form.password,
      });
      setLibrarians((current) => [response.data, ...current]);
      setForm(emptyForm);
      setShowCreate(false);
      toast.success(text.createSuccess);
    } catch (error: any) {
      toast.error(error?.message || text.createFailed);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (userId: string, nextStatus: AccountStatus) => {
    const target = librarians.find((item) => item.id === userId);
    const confirmed = await dialog.confirm({
      title: nextStatus === 'LOCKED' ? text.lockTitle : text.activateTitle,
      message: isEn
        ? `Are you sure you want to ${nextStatus === 'LOCKED' ? 'lock' : 'activate'} librarian account ${target?.fullName || userId}?`
        : `Bạn có chắc chắn ${nextStatus === 'LOCKED' ? 'khóa' : 'kích hoạt'} tài khoản thủ thư ${target?.fullName || userId}?`,
      confirmText: nextStatus === 'LOCKED' ? text.lockText : text.activateText,
      variant: nextStatus === 'LOCKED' ? 'danger' : 'warning',
    });
    if (!confirmed) return;
    setUpdatingId(userId);
    try {
      const response = await adminService.updateUserStatus(userId, nextStatus);
      setLibrarians((current) => current.map((item) => item.id === userId ? { ...item, status: response.data.status } : item));
      toast.success(nextStatus === 'LOCKED' ? text.lockSuccess : text.activateSuccess);
    } catch (error: any) {
      toast.error(error?.message || text.statusFailed);
    } finally {
      setUpdatingId(null);
    }
  };

  const verify = async (userId: string) => {
    const target = librarians.find((item) => item.id === userId);
    const confirmed = await dialog.confirm({
      title: text.verifyTitle,
      message: isEn
        ? `Are you sure you want to verify librarian account ${target?.fullName || userId}?`
        : `Bạn có chắc chắn verify tài khoản thủ thư ${target?.fullName || userId}?`,
      confirmText: 'Verify',
      variant: 'warning',
    });
    if (!confirmed) return;
    setUpdatingId(userId);
    try {
      const response = await adminService.verifyUser(userId);
      setLibrarians((current) => current.map((item) => item.id === userId ? { ...item, verified: response.data.verified } : item));
      toast.success(text.verifySuccess);
    } catch (error: any) {
      toast.error(error?.message || text.verifyFailed);
    } finally {
      setUpdatingId(null);
    }
  };

  const openEdit = (item: LibrarianAccount) => {
    setEditing(item);
    setEditForm({
      fullName: item.fullName || '',
      email: item.email || '',
      librarianCode: item.librarianCode || '',
      librarianCampus: item.librarianCampus || 'CAMPUS_1',
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
        studentId: editForm.librarianCode.trim(),
        librarianCampus: editForm.librarianCampus,
        faculty: null,
        phoneNumber: editForm.phoneNumber.trim() || null,
        address: editForm.address.trim() || null,
      });
      const updated = editAvatar
        ? await adminService.uploadManagedUserAvatar(editing.id, editAvatar)
        : response;
      setLibrarians((current) => current.map((item) => item.id === editing.id ? {
        ...item,
        email: updated.data.email,
        fullName: updated.data.fullName,
        phoneNumber: updated.data.phoneNumber,
        librarianCode: updated.data.studentId,
        librarianCampus: updated.data.librarianCampus || item.librarianCampus,
        address: updated.data.address,
        profilePictureUrl: updated.data.profilePictureUrl,
        status: updated.data.status,
        verified: updated.data.verified,
      } : item));
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
          <div className="flex items-center gap-2 text-sm font-bold uppercase text-blue-600"><ShieldCheck size={18} />{isEn ? 'Librarian management' : 'Quản lý thủ thư'}</div>
          <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{isEn ? 'LIBRARIAN ACCOUNTS' : 'TÀI KHOẢN THỦ THƯ'}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{isEn ? 'Track operating permissions, assigned campuses, status, and profile verification.' : 'Theo dõi quyền vận hành, cơ sở phụ trách, trạng thái và xác minh hồ sơ thủ thư.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"><Plus size={16} />{isEn ? 'Create librarian account' : 'Tạo tài khoản thủ thư mới'}</button>
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><RefreshCcw size={16} />{isEn ? 'Refresh' : 'Làm mới'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <button type="button" onClick={() => { setStatus('ALL'); setVerifiedFilter('ALL'); }} className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-200"><div className="flex items-center justify-between"><span className="text-xs font-black uppercase text-slate-500">{isEn ? 'Total librarians' : 'Tổng thủ thư'}</span><UserRound className="text-blue-600" size={20} /></div><p className="mt-3 text-3xl font-black">{summary.total}</p><p className="text-xs text-slate-500">{isEn ? 'accounts' : 'tài khoản'}</p></button>
        <button type="button" onClick={() => setStatus('ACTIVE')} className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-emerald-200"><div className="flex items-center justify-between"><span className="text-xs font-black uppercase text-slate-500">{isEn ? 'Active' : 'Đang active'}</span><CalendarClock className="text-emerald-600" size={20} /></div><p className="mt-3 text-3xl font-black">{summary.active}</p><p className="text-xs text-slate-500">{isEn ? 'currently operating' : 'đang vận hành'}</p></button>
        <button type="button" onClick={() => setVerifiedFilter('VERIFIED')} className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-200"><div className="flex items-center justify-between"><span className="text-xs font-black uppercase text-slate-500">{isEn ? 'Verified' : 'Đã verify'}</span><BadgeCheck className="text-blue-600" size={20} /></div><p className="mt-3 text-3xl font-black">{summary.verified}</p><p className="text-xs text-slate-500">{isEn ? 'confirmed profiles' : 'hồ sơ xác nhận'}</p></button>
        <button type="button" onClick={() => setStatus('LOCKED_OR_BANNED')} className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-red-200"><div className="flex items-center justify-between"><span className="text-xs font-black uppercase text-slate-500">{isEn ? 'Locked/banned' : 'Bị khóa/cấm'}</span><ShieldAlert className="text-red-600" size={20} /></div><p className="mt-3 text-3xl font-black">{summary.locked}</p><p className="text-xs text-slate-500">{isEn ? 'needs admin attention' : 'cần admin lưu ý'}</p></button>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[260px] flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={isEn ? 'Search name, email, librarian code, phone...' : 'Tìm tên, email, mã thủ thư, SĐT...'} className="h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950" /></div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"><option value="ALL">{isEn ? 'All statuses' : 'Tất cả trạng thái'}</option><option value="ACTIVE">ACTIVE</option><option value="LOCKED_OR_BANNED">LOCKED/BANNED</option><option value="LOCKED">LOCKED</option><option value="INACTIVE">INACTIVE</option><option value="BANNED">BANNED</option></select>
          <select value={campus} onChange={(event) => setCampus(event.target.value)} className="h-10 min-w-[145px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"><option value="ALL_FILTER">{isEn ? 'All campuses' : 'Tất cả cơ sở'}</option>{campusOptions.map((item) => <option key={item.value} value={item.value}>{campusLabel(item.value, isEn)}</option>)}</select>
          <select value={verifiedFilter} onChange={(event) => setVerifiedFilter(event.target.value)} className="h-10 min-w-[135px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"><option value="ALL">{isEn ? 'Verification: all' : 'Verify: tất cả'}</option><option value="VERIFIED">{isEn ? 'Verified' : 'Đã verify'}</option><option value="UNVERIFIED">{isEn ? 'Unverified' : 'Chưa verify'}</option></select>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as any)} className="h-10 min-w-[145px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"><option value="createdAt">{isEn ? 'Created date' : 'Ngày tạo'}</option><option value="lastLoginAt">{isEn ? 'Last login' : 'Đăng nhập gần nhất'}</option><option value="fullName">{isEn ? 'Name A-Z' : 'Tên A-Z'}</option><option value="librarianCode">{isEn ? 'Librarian code' : 'Mã thủ thư'}</option><option value="librarianCampus">{isEn ? 'Campus' : 'Cơ sở'}</option><option value="status">{isEn ? 'Status' : 'Trạng thái'}</option></select>
          <select value={sortDir} onChange={(event) => setSortDir(event.target.value as 'ASC' | 'DESC')} className="h-10 min-w-[115px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"><option value="DESC">{isEn ? 'Descending' : 'Giảm dần'}</option><option value="ASC">{isEn ? 'Ascending' : 'Tăng dần'}</option></select>
          <button type="button" onClick={() => { setKeyword(''); setStatus('ALL'); setCampus('ALL_FILTER'); setVerifiedFilter('ALL'); }} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><Filter size={16} />{isEn ? 'Clear filters' : 'Xóa lọc'}</button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="hidden grid-cols-[minmax(0,1.5fr)_100px_150px_140px_150px_minmax(0,1.45fr)] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 xl:grid"><div>{isEn ? 'Librarian' : 'Thủ thư'}</div><div>{isEn ? 'Code' : 'Mã'}</div><div>{isEn ? 'Campus' : 'Cơ sở'}</div><div>{isEn ? 'Status' : 'Trạng thái'}</div><div>{isEn ? 'Activity' : 'Hoạt động'}</div><div className="text-right">{isEn ? 'Actions' : 'Thao tác'}</div></div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? <div className="p-5 text-sm text-slate-500">{isEn ? 'Loading...' : 'Đang tải...'}</div> : filteredLibrarians.length === 0 ? <div className="p-5 text-sm text-slate-500">{isEn ? 'No matching librarians.' : 'Không có thủ thư phù hợp.'}</div> : filteredLibrarians.map((item) => (
            <div key={item.id} className="grid grid-cols-1 gap-3 px-4 py-4 text-sm xl:grid-cols-[minmax(0,1.5fr)_100px_150px_140px_150px_minmax(0,1.45fr)] xl:items-start xl:px-5">
              <div className="flex min-w-0 items-center gap-3">{item.profilePictureUrl ? <img src={item.profilePictureUrl} alt={item.fullName} className="h-11 w-11 rounded-lg object-cover" /> : <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><UserRound size={20} /></div>}<div className="min-w-0"><div className="flex items-center gap-2 truncate font-bold">{item.fullName}{item.verified && <BadgeCheck size={16} className="shrink-0 fill-blue-600 text-white" />}</div><div className="truncate text-slate-500">{item.email}</div><div className="truncate text-xs text-slate-400">{item.phoneNumber || (isEn ? 'No phone' : 'Chưa có SĐT')} · {item.address || (isEn ? 'No address' : 'Chưa có địa chỉ')}</div></div></div>
              <div className="font-semibold text-slate-700 dark:text-slate-300">{item.librarianCode || 'N/A'}</div>
              <div><span className="inline-flex w-fit max-w-full items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700"><Building2 size={13} />{campusLabel(item.librarianCampus, isEn)}</span></div>
              <div><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(item.status)}`}>{item.status}</span><div className="mt-1 text-xs font-semibold text-slate-400">{item.verified ? (isEn ? 'Verified' : 'Đã verify') : (isEn ? 'Unverified' : 'Chưa verify')}</div>{item.status === 'ACTIVE' && <div className="mt-1 text-xs text-slate-400">{isEn ? 'Activated: ' : 'Kích hoạt: '}{formatActivationTime(item.accountActivatedAt, isEn)}</div>}</div>
              <div className="text-xs leading-5 text-slate-500"><span className={`inline-flex rounded-full px-2.5 py-1 font-bold ${isOnline(item.lastLoginAt) ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{isOnline(item.lastLoginAt) ? 'Online' : 'Offline'}</span><div className="mt-1">{isEn ? 'Login: ' : 'Đăng nhập: '}{formatDateTime(item.lastLoginAt, isEn)}</div></div>
              <div className="flex flex-wrap justify-start gap-2 xl:justify-end"><button type="button" disabled={updatingId === item.id} onClick={() => openEdit(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><Pencil size={15} />{isEn ? 'Edit' : 'Sửa'}</button>{!item.verified && <button type="button" disabled={updatingId === item.id} onClick={() => verify(item.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-60"><BadgeCheck size={15} />Verify</button>}{item.status === 'LOCKED' ? <button type="button" disabled={updatingId === item.id} onClick={() => changeStatus(item.id, 'ACTIVE')} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"><UnlockKeyhole size={15} />{isEn ? 'Activate' : 'Kích hoạt'}</button> : <button type="button" disabled={updatingId === item.id} onClick={() => changeStatus(item.id, 'LOCKED')} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"><LockKeyhole size={15} />{isEn ? 'Lock' : 'Khóa'}</button>}</div>
            </div>
          ))}
        </div>
      </section>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={submit} className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold">{isEn ? 'Create librarian account' : 'Tạo tài khoản thủ thư'}</h2><p className="text-sm text-slate-500"></p></div><button type="button" onClick={() => setShowCreate(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">{isEn ? 'Full name' : 'Họ tên'}<input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <label className="text-sm font-semibold text-slate-700">Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <label className="text-sm font-semibold text-slate-700">{isEn ? 'Campus' : 'Cơ sở'}<select required value={form.librarianCampus} onChange={(e) => setForm({ ...form, librarianCampus: e.target.value as LibrarianCampus })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500">{campusOptions.map((option) => <option key={option.value} value={option.value}>{campusLabel(option.value, isEn)}</option>)}</select></label>
              <label className="text-sm font-semibold text-slate-700">{isEn ? 'Phone' : 'SĐT'}<input required value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <label className="text-sm font-semibold text-slate-700 md:col-span-2">{isEn ? 'Address' : 'Địa chỉ'}<input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <label className="text-sm font-semibold text-slate-700">{isEn ? 'Avatar' : 'Ảnh đại diện'}<input required type="file" accept="image/*" onChange={(e) => setForm({ ...form, avatar: e.target.files?.[0] || null })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-blue-700" /></label>
              <label className="text-sm font-semibold text-slate-700">{isEn ? 'Temporary password' : 'Mật khẩu tạm thời'}<input required minLength={6} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50">{isEn ? 'Cancel' : 'Hủy'}</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"><Plus size={16} />{isEn ? 'Create account' : 'Tạo tài khoản'}</button></div>
          </form>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={saveEdit} className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold">{isEn ? 'Edit librarian information' : 'Sửa thông tin thủ thư'}</h2><p className="text-sm text-slate-500">{isEn ? 'Update operating profile and assigned campus.' : 'Cập nhật hồ sơ vận hành và cơ sở phụ trách.'}</p></div><button type="button" onClick={() => setEditing(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">{isEn ? 'Full name' : 'Họ tên'}<input required value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <label className="text-sm font-semibold text-slate-700">Email<input required type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <div className="text-sm font-semibold text-slate-700">{isEn ? 'Librarian code' : 'Mã thủ thư'}<div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm font-black text-slate-900">{editForm.librarianCode || (isEn ? 'Generated by system' : 'Hệ thống sẽ tự sinh')}</div></div>
              <label className="text-sm font-semibold text-slate-700">{isEn ? 'Campus' : 'Cơ sở'}<select required value={editForm.librarianCampus} onChange={(e) => setEditForm({ ...editForm, librarianCampus: e.target.value as LibrarianCampus })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500">{campusOptions.map((option) => <option key={option.value} value={option.value}>{campusLabel(option.value, isEn)}</option>)}</select></label>
              <label className="text-sm font-semibold text-slate-700">{isEn ? 'Phone' : 'SĐT'}<input value={editForm.phoneNumber} onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
              <label className="text-sm font-semibold text-slate-700">{isEn ? 'Avatar' : 'Ảnh đại diện'}<input type="file" accept="image/*" onChange={(e) => setEditAvatar(e.target.files?.[0] || null)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-blue-700" /></label>
              <label className="text-sm font-semibold text-slate-700 md:col-span-2">{isEn ? 'Address' : 'Địa chỉ'}<input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-blue-500" /></label>
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold hover:bg-slate-50">{isEn ? 'Cancel' : 'Hủy'}</button><button disabled={updatingId === editing.id} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"><Save size={16} />{isEn ? 'Save changes' : 'Lưu thay đổi'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminLibrariansPage;

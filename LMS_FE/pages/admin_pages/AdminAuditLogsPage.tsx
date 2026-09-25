import { AlertTriangle, ClipboardList, RefreshCcw, Search, ShieldCheck, UserCog, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import adminService, { AuditLog } from '../../api/adminService';
import { useLanguage } from '../../contexts/LanguageContext';

const roleLabel = (role?: string | null, isEn = false) => ({
  ADMIN: isEn ? 'Administrator' : 'Quản trị viên',
  LIBRARIAN: isEn ? 'Librarian' : 'Thủ thư',
  STUDENT: isEn ? 'Student' : 'Sinh viên',
  ANONYMOUS: isEn ? 'Guest/anonymous' : 'Khách/chưa đăng nhập',
  SYSTEM: isEn ? 'System' : 'Hệ thống',
}[role || ''] || role || (isEn ? 'System' : 'Hệ thống'));

const entityLabel = (entity?: string | null, isEn = false) => ({
  auth: isEn ? 'Authentication' : 'Xác thực',
  users: isEn ? 'Accounts' : 'Tài khoản',
  admin: isEn ? 'Administration' : 'Quản trị',
  publications: isEn ? 'Publications' : 'Ấn phẩm',
  items: isEn ? 'Copies' : 'Bản sao',
  transactions: isEn ? 'Circulation' : 'Mượn trả',
  fines: isEn ? 'Fines' : 'Phí phạt',
  ratings: isEn ? 'Book ratings' : 'Đánh giá sách',
  reservations: isEn ? 'Reservations' : 'Đặt trước',
  'circulation-policies': isEn ? 'Circulation policies' : 'Quy định mượn trả',
}[entity || ''] || entity || (isEn ? 'Unknown' : 'Không rõ'));

const methodLabel = (method: string, isEn = false) => ({
  GET: isEn ? 'View data' : 'Xem dữ liệu',
  POST: isEn ? 'Create/send request' : 'Tạo/gửi yêu cầu',
  PUT: isEn ? 'Update' : 'Cập nhật',
  PATCH: isEn ? 'Partial update' : 'Cập nhật một phần',
  DELETE: isEn ? 'Delete' : 'Xóa',
}[method] || method);

const actionLabel = (action: string, isEn = false) => {
  if (action === 'POST_AUTH_LOGOUT') return isEn ? 'Sign out' : 'Đăng xuất';
  if (action === 'POST_AUTH_SOCIAL_CALLBACK_GOOGLE') return isEn ? 'Google/OAuth callback login' : 'Đăng nhập Google/OAuth callback';
  if (action === 'POST_USERS_AVATAR') return isEn ? 'Update avatar' : 'Cập nhật ảnh đại diện';
  if (action === 'PUT_USERS_MY_PROFILE') return isEn ? 'Update personal profile' : 'Cập nhật hồ sơ cá nhân';
  if (action.includes('_TRANSACTIONS_') && action.endsWith('_NOTE')) return isEn ? 'Add circulation transaction note' : 'Ghi chú giao dịch mượn trả';
  if (action.includes('CIRCULATION_POLICIES')) return isEn ? 'Update circulation policies' : 'Cập nhật quy định mượn trả';
  if (action.includes('PUBLICATIONS')) return action.startsWith('POST_') ? (isEn ? 'Create/update publication' : 'Tạo/cập nhật ấn phẩm') : (isEn ? 'Publication action' : 'Thao tác ấn phẩm');
  if (action.includes('ITEMS')) return isEn ? 'Copy action' : 'Thao tác bản sao';
  if (action.includes('FINE')) return isEn ? 'Fine action' : 'Thao tác phí phạt';

  const [method, ...parts] = action.split('_');
  return `${methodLabel(method, isEn)} ${parts.join(' ').toLowerCase()}`;
};

const summaryLabel = (log: AuditLog, isEn = false) => {
  const raw = log.summary || `${log.entityType} ${log.entityId || ''}`;
  const match = raw.match(/^(.*?)\s+(GET|POST|PUT|PATCH|DELETE)\s+(.+?)\s+→\s+(\d{3})$/);
  if (!match) return raw;
  const [, actor, method, path, status] = match;
  const statusText = status.startsWith('2')
    ? (isEn ? 'successful' : 'thành công')
    : status.startsWith('4')
      ? (isEn ? 'denied/client-side error' : 'bị từ chối/lỗi phía người dùng')
      : status.startsWith('5')
        ? (isEn ? 'system error' : 'lỗi hệ thống')
        : (isEn ? 'recorded' : 'đã ghi nhận');
  return `${roleLabel(actor === 'ANONYMOUS' ? 'ANONYMOUS' : log.actorRole, isEn)} ${methodLabel(method, isEn).toLowerCase()} endpoint ${path} - HTTP ${status} (${statusText}).`;
};

const statusCodeFromSummary = (log: AuditLog) => {
  const match = (log.summary || '').match(/→\s+(\d{3})$/);
  return match?.[1] || '';
};

const AdminAuditLogsPage = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    keyword: '',
    actorRole: 'ALL',
    entityType: 'ALL',
    sortBy: 'createdAt',
    sortDir: 'DESC',
    limit: 200,
  });
  const [resultFilter, setResultFilter] = useState<'ALL' | 'FAILED'>('ALL');

  const load = async () => {
    setLoading(true);
    try {
      const response = await adminService.listAuditLogs({
        ...filters,
        keyword: filters.keyword.trim() || undefined,
        actorRole: filters.actorRole === 'ALL' ? undefined : filters.actorRole,
        entityType: filters.entityType === 'ALL' ? undefined : filters.entityType,
      });
      setLogs(response.data || []);
    } catch {
      toast.error(isEn ? 'Could not load audit logs' : 'Không tải được nhật ký thao tác');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.actorRole, filters.entityType, filters.sortBy, filters.sortDir, filters.limit]);

  const summary = useMemo(() => {
    const failed = logs.filter((log) => {
      const code = statusCodeFromSummary(log);
      return code.startsWith('4') || code.startsWith('5');
    }).length;

    return {
      total: logs.length,
      admin: logs.filter((log) => log.actorRole === 'ADMIN').length,
      librarian: logs.filter((log) => log.actorRole === 'LIBRARIAN').length,
      account: logs.filter((log) => log.entityType === 'users').length,
      failed,
    };
  }, [logs]);

  const visibleLogs = useMemo(() => {
    if (resultFilter !== 'FAILED') return logs;
    return logs.filter((log) => {
      const code = statusCodeFromSummary(log);
      return code.startsWith('4') || code.startsWith('5');
    });
  }, [logs, resultFilter]);

  return (
    <div className="w-full space-y-6 p-4 lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold uppercase text-blue-600">
            <ClipboardList size={18} />
            {isEn ? 'SYSTEM MONITORING' : 'GIÁM SÁT HỆ THỐNG'}
          </div>
          <h1 className="mt-2 text-3xl font-bold">
            {isEn ? 'ADMIN AUDIT LOGS' : 'NHẬT KÝ KIỂM SOÁT ADMIN'}
          </h1>
          <p className="mt-1 max-w-4xl text-slate-500 dark:text-slate-400">
            {isEn ? 'Track who did what, where it happened, and whether the request succeeded.' : 'Theo dõi ai đã làm gì, ở phân hệ nào, kết quả ra sao để admin kiểm soát vận hành và phát hiện thao tác bất thường.'}
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          <RefreshCcw size={16} />
          {isEn ? 'Refresh' : 'Làm mới'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          onClick={() => {
            setResultFilter('ALL');
            setFilters({ ...filters, actorRole: 'ALL', entityType: 'ALL' });
          }}
          className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">{isEn ? 'Total logs' : 'Tổng nhật ký'}</span>
            <ClipboardList className="text-blue-600" size={20} />
          </div>
          <p className="mt-3 text-3xl font-black">{summary.total}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{isEn ? 'loaded records' : 'bản ghi đang tải'}</p>
        </button>
        <button
          type="button"
          onClick={() => {
            setResultFilter('ALL');
            setFilters({ ...filters, actorRole: 'ADMIN' });
          }}
          className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">{isEn ? 'Admin actions' : 'Admin thao tác'}</span>
            <ShieldCheck className="text-indigo-600" size={20} />
          </div>
          <p className="mt-3 text-3xl font-black">{summary.admin}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{isEn ? 'administrative actions' : 'hành động quản trị'}</p>
        </button>
        <button
          type="button"
          onClick={() => {
            setResultFilter('ALL');
            setFilters({ ...filters, actorRole: 'LIBRARIAN' });
          }}
          className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-emerald-200 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">{isEn ? 'Librarian actions' : 'Thủ thư thao tác'}</span>
            <UserCog className="text-emerald-600" size={20} />
          </div>
          <p className="mt-3 text-3xl font-black">{summary.librarian}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{isEn ? 'operational actions' : 'hành động nghiệp vụ'}</p>
        </button>
        <button
          type="button"
          onClick={() => {
            setResultFilter('ALL');
            setFilters({ ...filters, entityType: 'users' });
          }}
          className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-sky-200 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">{isEn ? 'Accounts' : 'Tài khoản'}</span>
            <Users className="text-sky-600" size={20} />
          </div>
          <p className="mt-3 text-3xl font-black">{summary.account}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{isEn ? 'user profile related' : 'liên quan hồ sơ user'}</p>
        </button>
        <button
          type="button"
          onClick={() => setResultFilter('FAILED')}
          className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-red-200 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">{isEn ? 'Failed/denied' : 'Lỗi/từ chối'}</span>
            <AlertTriangle className="text-red-600" size={20} />
          </div>
          <p className="mt-3 text-3xl font-black">{summary.failed}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">HTTP 4xx/5xx</p>
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[260px] flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={17}
            />
            <input
              value={filters.keyword}
              onChange={(event) =>
                setFilters({ ...filters, keyword: event.target.value })
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') load();
              }}
              placeholder={isEn ? 'Search actor, action, content...' : 'Tìm người thao tác, hành động, nội dung...'}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <select
            value={filters.actorRole}
            onChange={(e) =>
              setFilters({ ...filters, actorRole: e.target.value })
            }
            className="h-10 min-w-[150px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="ALL">{isEn ? 'All roles' : 'Tất cả vai trò'}</option>
            <option value="ADMIN">{isEn ? 'Administrator' : 'Quản trị viên'}</option>
            <option value="LIBRARIAN">{isEn ? 'Librarian' : 'Thủ thư'}</option>
            <option value="STUDENT">{isEn ? 'Student' : 'Sinh viên'}</option>
            <option value="ANONYMOUS">{isEn ? 'Guest/anonymous' : 'Khách/chưa đăng nhập'}</option>
          </select>
          <select
            value={filters.entityType}
            onChange={(e) =>
              setFilters({ ...filters, entityType: e.target.value })
            }
            className="h-10 min-w-[170px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="ALL">{isEn ? 'All modules' : 'Tất cả phân hệ'}</option>
            <option value="users">{isEn ? 'Accounts' : 'Tài khoản'}</option>
            <option value="admin">{isEn ? 'Administration' : 'Quản trị'}</option>
            <option value="publications">{isEn ? 'Publications' : 'Ấn phẩm'}</option>
            <option value="items">{isEn ? 'Copies' : 'Bản sao'}</option>
            <option value="transactions">{isEn ? 'Circulation' : 'Mượn trả'}</option>
            <option value="fines">{isEn ? 'Fines' : 'Phí phạt'}</option>
            <option value="ratings">{isEn ? 'Ratings' : 'Đánh giá sách'}</option>
            <option value="reservations">{isEn ? 'Reservations' : 'Đặt trước'}</option>
            <option value="circulation-policies">{isEn ? 'Circulation policies' : 'Quy định mượn trả'}</option>
          </select>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            className="h-10 min-w-[145px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="createdAt">{isEn ? 'Timestamp' : 'Thời điểm'}</option>
            <option value="actorRole">{isEn ? 'Role' : 'Vai trò'}</option>
            <option value="action">{isEn ? 'Action' : 'Hành động'}</option>
            <option value="entityType">{isEn ? 'Module' : 'Phân hệ'}</option>
          </select>
          <select
            value={filters.sortDir}
            onChange={(e) =>
              setFilters({ ...filters, sortDir: e.target.value })
            }
            className="h-10 min-w-[120px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="DESC">{isEn ? 'Newest' : 'Mới nhất'}</option>
            <option value="ASC">{isEn ? 'Oldest' : 'Cũ nhất'}</option>
          </select>
          <button
            type="button"
            onClick={load}
            className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            {isEn ? 'Filter' : 'Lọc'}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="p-5 text-sm text-slate-500 dark:text-slate-400">{isEn ? 'Loading...' : 'Đang tải...'}</div>
          ) : visibleLogs.length === 0 ? (
            <div className="p-5 text-sm text-slate-500 dark:text-slate-400">
              {isEn ? 'No audit logs found.' : 'Chưa có nhật ký thao tác.'}
            </div>
          ) : (
            visibleLogs.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-1 gap-3 px-4 py-4 text-sm lg:grid-cols-[150px_minmax(0,.85fr)_minmax(0,1.1fr)_120px_minmax(0,1.5fr)] lg:items-start lg:px-5"
              >
                <div className="min-w-0 text-slate-500 dark:text-slate-400">
                  {new Date(log.createdAt).toLocaleString('vi-VN')}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-bold">
                    {log.actorName || log.actorRole || (isEn ? 'System' : 'Hệ thống')}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {roleLabel(log.actorRole, isEn)}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-blue-700 dark:text-blue-400">
                    {actionLabel(log.action, isEn)}
                  </div>
                  <div className="mt-1 text-[11px] font-mono text-slate-400 break-all">
                    {log.action}
                  </div>
                </div>
                <div className="min-w-0 font-semibold text-slate-600 dark:text-slate-300">
                  {entityLabel(log.entityType, isEn)}
                </div>
                <div className="min-w-0">
                  <div className="font-medium">{summaryLabel(log, isEn)}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {entityLabel(log.entityType, isEn)}
                    {log.entityId ? ` #${log.entityId}` : ''}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminAuditLogsPage;

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Printer,
  Search,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useLanguage } from '../../contexts/LanguageContext';

type ItemApi = {
  id: string;
  barcode: string;
  branch: string;
  location: string;
  status: 'AVAILABLE' | 'BORROWED' | 'RESERVED' | 'IN_MAINTENANCE' | 'LOST' | string;
  condition: 'NEW' | 'OLD' | string;
  publicationTitle: string;
};

const copyText = {
  vi: {
    loadFailed: 'Không tải được danh sách bản sao.',
    title: 'Quản lý bản sao',
    subtitle: 'Quản lý các tài liệu thư viện vật lý và vật phẩm sách.',
    search: 'Tìm Kiếm',
    searchPlaceholder: 'Tìm từ khóa, barcode...',
    status: 'Trạng thái',
    all: 'Tất cả',
    available: 'Có sẵn',
    borrowed: 'Đang mượn',
    reserved: 'Đã đặt',
    maintenance: 'Bảo trì',
    lost: 'Mất',
    condition: 'Tình trạng',
    new: 'Mới',
    old: 'Cũ',
    filter: 'Lọc',
    listTitle: 'Danh sách bản sao',
    loading: 'Đang tải...',
    total: 'Tổng cộng',
    items: 'phần tử',
    export: 'Xuất file',
    bookTitle: 'Tên sách',
    location: 'Vị trí',
    actions: 'Hành động',
    loadingData: 'Đang tải dữ liệu...',
    noCopies: 'Không tìm thấy bản sao nào.',
    viewDetails: 'Xem chi tiết',
    showing: 'Hiển thị',
    inTotal: 'trong tổng số',
    overall: 'Tổng quan bản sao',
    totalCopies: 'Tổng bản sao',
    activeCopies: 'Có thể phục vụ',
    unavailableCopies: 'Không khả dụng',
    newOld: 'Mới / Cũ',
  },
  en: {
    loadFailed: 'Unable to load copies.',
    title: 'Copy Management',
    subtitle: 'Manage physical library copies and book items',
    search: 'Search',
    searchPlaceholder: 'Search keyword, barcode...',
    status: 'Status',
    all: 'All',
    available: 'Available',
    borrowed: 'Borrowed',
    reserved: 'Reserved',
    maintenance: 'Maintenance',
    lost: 'Lost',
    condition: 'Condition',
    new: 'New',
    old: 'Old',
    filter: 'Filter',
    listTitle: 'Copy list',
    loading: 'Loading...',
    total: 'Total',
    items: 'items',
    export: 'Export',
    bookTitle: 'Book title',
    location: 'Location',
    actions: 'Actions',
    loadingData: 'Loading data...',
    noCopies: 'No copies found.',
    viewDetails: 'View details',
    showing: 'Showing',
    inTotal: 'of',
    overall: 'Copy overview',
    totalCopies: 'Total copies',
    activeCopies: 'Serviceable',
    unavailableCopies: 'Unavailable',
    newOld: 'New / Old',
  },
};

const statusLabel = (status: ItemApi['status'], language: 'vi' | 'en') => {
  const labels: Record<string, { vi: string; en: string }> = {
    AVAILABLE: { vi: 'Có sẵn', en: 'Available' },
    BORROWED: { vi: 'Đang mượn', en: 'Borrowed' },
    RESERVED: { vi: 'Đã đặt', en: 'Reserved' },
    IN_MAINTENANCE: { vi: 'Bảo trì', en: 'Maintenance' },
    LOST: { vi: 'Mất', en: 'Lost' },
  };
  return labels[status]?.[language] || status;
};

const conditionLabel = (condition: ItemApi['condition'], language: 'vi' | 'en') => {
  const labels: Record<string, { vi: string; en: string }> = {
    NEW: { vi: 'Mới', en: 'New' },
    OLD: { vi: 'Cũ', en: 'Old' },
  };
  return labels[condition]?.[language] || condition;
};

const CopyList = () => {
  const { language } = useLanguage();
  const c = copyText[language];
  const [copies, setCopies] = useState<ItemApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering state
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [condition, setCondition] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');
  const [overallStats, setOverallStats] = useState({
    total: 0,
    available: 0,
    borrowed: 0,
    reserved: 0,
    maintenance: 0,
    lost: 0,
    newCopies: 0,
    oldCopies: 0,
  });

  useEffect(() => {
    const fetchCount = async (params: Record<string, string>) => {
      const q = new URLSearchParams({ page: '0', size: '1', ...params });
      const res: any = await axiosInstance.get(`/items?${q.toString()}`);
      return res?.data?.totalElements || 0;
    };

    const fetchOverallStats = async () => {
      try {
        const [
          total,
          available,
          borrowed,
          reserved,
          maintenance,
          lost,
          newCopies,
          oldCopies,
        ] = await Promise.all([
          fetchCount({}),
          fetchCount({ status: 'AVAILABLE' }),
          fetchCount({ status: 'BORROWED' }),
          fetchCount({ status: 'RESERVED' }),
          fetchCount({ status: 'IN_MAINTENANCE' }),
          fetchCount({ status: 'LOST' }),
          fetchCount({ condition: 'NEW' }),
          fetchCount({ condition: 'OLD' }),
        ]);
        setOverallStats({ total, available, borrowed, reserved, maintenance, lost, newCopies, oldCopies });
      } catch (err) {
        console.error('Fetch copy overview failed', err);
      }
    };

    fetchOverallStats();
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);

        const buildParams = (statusOverride?: string, pageOverride = page, sizeOverride = size) => {
          const params = new URLSearchParams();
          params.append('page', pageOverride.toString());
          params.append('size', sizeOverride.toString());
          if (keyword) params.append('keyword', keyword);
          if (statusOverride || (status && status !== 'UNAVAILABLE')) {
            params.append('status', statusOverride || status);
          }
          if (condition) params.append('condition', condition);
          params.append('sortBy', sortBy);
          params.append('sortDir', sortDir);
          return params;
        };

        const res: any = status === 'UNAVAILABLE'
          ? await Promise.all([
            axiosInstance.get(`/items?${buildParams('IN_MAINTENANCE', 0, 1000).toString()}`),
            axiosInstance.get(`/items?${buildParams('LOST', 0, 1000).toString()}`),
          ]).then(([maintenanceRes, lostRes]: any[]) => {
            const content = [
              ...(maintenanceRes.data?.content || maintenanceRes?.data?.data?.content || []),
              ...(lostRes.data?.content || lostRes?.data?.data?.content || []),
            ];
            const start = page * size;
            return {
              code: 200,
              data: {
                content: content.slice(start, start + size),
                totalElements: content.length,
                totalPages: Math.ceil(content.length / size),
              },
            };
          })
          : await axiosInstance.get(`/items?${buildParams().toString()}`);

        if (res.code === 200 && res.data) {
          setCopies(res.data.content || []);
          setTotalElements(res.data.totalElements || 0);
          setTotalPages(res.data.totalPages || 0);
        } else {
          setCopies([]);
          setTotalElements(0);
          setTotalPages(0);
        }
      } catch (err) {
        console.error('Fetch items failed', err);
        setError(c.loadFailed);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [page, size, keyword, status, condition, sortBy, sortDir, c.loadFailed]);

  const handleApplyFilters = () => {
    setKeyword(searchInput);
    setPage(0); // Reset page on filter
  };

  const applySummaryFilter = (filter: 'all' | 'available' | 'borrowed' | 'unavailable' | 'new') => {
    setSearchInput('');
    setKeyword('');
    setCondition('');
    setStatus('');

    if (filter === 'available') {
      setStatus('AVAILABLE');
    }
    if (filter === 'borrowed') {
      setStatus('BORROWED');
    }
    if (filter === 'unavailable') {
      setStatus('UNAVAILABLE');
    }
    if (filter === 'new') {
      setCondition('NEW');
    }

    setPage(0);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'DESC' ? 'ASC' : 'DESC');
    } else {
      setSortBy(field);
      setSortDir('DESC');
    }
    setPage(0);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  const handleExportCurrentPage = () => {
    if (copies.length === 0) return;

    const headers = ['Barcode', 'Book title', 'Branch', 'Location', 'Status', 'Condition'];
    const rows = copies.map((copy) => [
      copy.barcode,
      copy.publicationTitle || '',
      copy.branch || '',
      copy.location || '',
      copy.status || '',
      copy.condition || '',
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(',')
      )
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ban-sao-trang-${page + 1}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{c.title}</h1>
          <p className="text-slate-500">
            {c.subtitle}
          </p>
        </div>
        {/* <Link
          to="/librarianpage/copies/new"
          className="bg-secondary hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
        >
          <Plus size={20} /> Thêm Bản Sao Mới
        </Link> */}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          onClick={() => applySummaryFilter('all')}
          className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{c.totalCopies}</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{overallStats.total.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">{c.overall}</p>
        </button>
        <button
          type="button"
          onClick={() => applySummaryFilter('available')}
          className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{c.available}</p>
          <p className="mt-2 text-2xl font-black text-emerald-700">{overallStats.available.toLocaleString()}</p>
          <p className="mt-1 text-xs text-emerald-700/80">{c.activeCopies}</p>
        </button>
        <button
          type="button"
          onClick={() => applySummaryFilter('borrowed')}
          className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{c.borrowed}</p>
          <p className="mt-2 text-2xl font-black text-blue-700">{overallStats.borrowed.toLocaleString()}</p>
          <p className="mt-1 text-xs text-blue-700/80">{c.reserved}: {overallStats.reserved.toLocaleString()}</p>
        </button>
        <button
          type="button"
          onClick={() => applySummaryFilter('unavailable')}
          className="rounded-xl border border-orange-100 bg-orange-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-orange-700">{c.unavailableCopies}</p>
          <p className="mt-2 text-2xl font-black text-orange-700">{(overallStats.maintenance + overallStats.lost).toLocaleString()}</p>
          <p className="mt-1 text-xs text-orange-700/80">{c.maintenance}: {overallStats.maintenance} / {c.lost}: {overallStats.lost}</p>
        </button>
        <button
          type="button"
          onClick={() => applySummaryFilter('new')}
          className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{c.newOld}</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{overallStats.newCopies.toLocaleString()} / {overallStats.oldCopies.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">{c.condition}</p>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">
              {c.search}
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder={c.searchPlaceholder}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">
              {c.status}
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
            >
              <option value="">{c.all}</option>
              <option value="AVAILABLE">{c.available}</option>
              <option value="BORROWED">{c.borrowed}</option>
              <option value="RESERVED">{c.reserved}</option>
              <option value="IN_MAINTENANCE">{c.maintenance}</option>
              <option value="LOST">{c.lost}</option>
              <option value="UNAVAILABLE">{c.unavailableCopies}</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">
              {c.condition}
            </label>
            <div className="flex gap-2">
              <select
                value={condition}
                onChange={(e) => {
                  setCondition(e.target.value);
                  setPage(0);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
              >
                <option value="">{c.all}</option>
                <option value="NEW">{c.new}</option>
                <option value="OLD">{c.old}</option>
              </select>
              <button
                onClick={handleApplyFilters}
                className="bg-secondary text-white h-[42px] px-4 rounded-lg flex items-center justify-center hover:bg-indigo-700"
              >
                {c.filter}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-semibold text-slate-700">
            {c.listTitle}{' '}
            <span className="text-slate-400 font-normal text-sm ml-2">
              {loading ? c.loading : `${c.total} ${totalElements} ${c.items}`}
            </span>
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleExportCurrentPage}
              disabled={copies.length === 0}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50 shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={14} /> {c.export}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left border-collapse">
          <thead>
            <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
              <th className="px-6 py-4 font-semibold min-w-[190px] cursor-pointer hover:text-slate-800" onClick={() => handleSort('barcode')}>
                Barcode {sortBy === 'barcode' && (sortDir === 'DESC' ? '↓' : '↑')}
              </th>
              <th className="px-6 py-4 font-semibold cursor-pointer hover:text-slate-800" onClick={() => handleSort('publication.title')}>
                {c.bookTitle} {sortBy === 'publication.title' && (sortDir === 'DESC' ? '↓' : '↑')}
              </th>
              <th className="px-6 py-4 font-semibold min-w-[250px] cursor-pointer hover:text-slate-800" onClick={() => handleSort('branch')}>
                {c.location} {sortBy === 'branch' && (sortDir === 'DESC' ? '↓' : '↑')}
              </th>
              <th className="px-6 py-4 font-semibold min-w-[170px] cursor-pointer hover:text-slate-800" onClick={() => handleSort('status')}>
                {c.status} {sortBy === 'status' && (sortDir === 'DESC' ? '↓' : '↑')}
              </th>
              <th className="px-6 py-4 font-semibold min-w-[140px] cursor-pointer hover:text-slate-800" onClick={() => handleSort('condition')}>
                {c.condition} {sortBy === 'condition' && (sortDir === 'DESC' ? '↓' : '↑')}
              </th>
              <th className="px-6 py-4 font-semibold min-w-[130px] text-right">{c.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-secondary mb-2"></div>
                  <div className="text-slate-500 text-sm">{c.loadingData}</div>
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-red-600">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && copies.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-slate-500">
                  {c.noCopies}
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              copies.map((copy) => (
                <tr
                  key={copy.id}
                  className="hover:bg-slate-50 transition-colors group"
                >
                  <td className="px-6 py-4 min-w-[190px]">
                    <div className="flex items-center gap-2 font-mono text-slate-600">
                      <span className="text-slate-300">||||</span>
                      <Link
                        to={`/librarianpage/copies/${copy.id}`}
                        className="hover:text-blue-600 hover:underline font-medium"
                      >
                        {copy.barcode}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 min-w-[250px]">
                    <div className="text-sm font-medium text-slate-900 line-clamp-2">
                      {copy.publicationTitle || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 min-w-[170px]">
                    <div className="text-sm text-slate-900">
                      {copy.branch || 'N/A'}
                    </div>
                    {copy.location && (
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{copy.location}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider
                    ${copy.status === 'AVAILABLE'
                          ? 'bg-green-100 text-green-700'
                          : copy.status === 'BORROWED'
                            ? 'bg-blue-100 text-blue-700'
                            : copy.status === 'RESERVED'
                              ? 'bg-indigo-100 text-indigo-700'
                              : copy.status === 'LOST'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-orange-100 text-orange-700'
                        }`}
                    >
                      {copy.status === 'AVAILABLE' && <CheckCircle size={10} />}
                      {copy.status === 'BORROWED' && <Clock size={10} />}
                      {copy.status === 'LOST' && <XCircle size={10} />}
                      {copy.status === 'RESERVED' && <Eye size={10} />}
                      {copy.status === 'IN_MAINTENANCE' && <AlertTriangle size={10} />}
                      {statusLabel(copy.status, language)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm min-w-[140px]">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${copy.condition === 'NEW' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                      {conditionLabel(copy.condition, language)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right min-w-[130px]">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 *:transition-all transition-opacity [&_a]:p-1.5 row-actions">
                      <Link
                        to={`/librarianpage/copies/${copy.id}`}
                        className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title={c.viewDetails}
                      >
                        <Eye size={18} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white">
          <span className="text-sm text-slate-500">
            {c.showing} {totalElements === 0 ? 0 : page * size + 1} - {Math.min((page + 1) * size, totalElements)} {c.inTotal} {totalElements} {c.items}
          </span>
          {totalPages > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
                className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 text-slate-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &lt;
              </button>

              {/* Pages */}
              {Array.from({ length: totalPages }, (_, i) => i)
                .filter(p => p >= page - 2 && p <= page + 2)
                .map(p => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded text-sm ${page === p
                        ? 'bg-secondary text-white'
                        : 'border border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                  >
                    {p + 1}
                  </button>
                ))
              }

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1}
                className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 text-slate-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CopyList;

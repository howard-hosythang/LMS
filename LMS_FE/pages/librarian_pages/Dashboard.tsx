import {
  AlertTriangle,
  ArrowRight,
  BookMarked,
  CalendarDays,
  Clock,
  Mail,
  PackageSearch,
  Phone,
  RefreshCcw,
  ScanLine,
  Search,
  ShieldAlert,
  UserRound,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import librarianDashboardService, {
  DashboardSummaryResponse,
  RiskyUser,
} from '../../api/librarianDashboardService';
import transactionsService, {
  LibrarianTransaction,
  TransactionStatus,
} from '../../api/transactionsService';
import reshelvingService, { RESHELVING_CHANGED } from '../../api/reshelvingService';
import ReaderProfileDrawer, { ReaderRef } from '../../components/librarian_pages/ReaderProfileDrawer';
import { useTranslation } from '../../contexts/LanguageContext';

type SummaryData = DashboardSummaryResponse['data'];

type Lang = 'vi' | 'en';

const COPY = {
  vi: {
    workspace: 'Thủ thư',
    title: 'Quét mã, tìm hồ sơ, xử lý giao dịch',
    subtitle: 'Dùng ô bên dưới để quét mã vạch sách, nhập mã thẻ bạn đọc, tên bạn đọc hoặc tên sách. Kết quả sẽ mở trong danh sách giao dịch để thủ thư xử lý tiếp.',
    refresh: 'Làm mới ca trực',
    searchLabel: 'Quét mã hoặc tìm kiếm nhanh',
    searchPlaceholder: 'Quét mã vạch sách, mã thẻ bạn đọc, hoặc nhập tên sách/bạn đọc',
    search: 'Tìm',
    loadError: 'Không tải được dữ liệu ca trực. Hãy kiểm tra kết nối hoặc đăng nhập lại bằng tài khoản thủ thư.',
    openList: 'Mở danh sách',
    quickCirculation: 'Mượn / trả tại quầy',
    quickCirculationHint: 'Mở màn hình quét sách và xác nhận giao dịch.',
    waitingBooks: 'Sách chờ giao',
    waitingBooksHint: 'Đi gom sách đã được bạn đọc đặt online.',
    overdueCalls: 'Gọi nhắc quá hạn',
    overdueCallsHint: 'Lọc các giao dịch cần liên hệ bạn đọc.',
    copyCheck: 'Kiểm tra bản sao',
    copyCheckHint: 'Tra mã vạch, vị trí kệ và tình trạng sách.',
    contactInbox: 'Hộp thư liên hệ',
    contactInboxHint: 'Mở các ticket hỗ trợ, phân công và phản hồi bạn đọc.',
    pendingActions: 'Hành động cần xử lý',
    shiftBacklog: 'Danh sách việc đang chờ trong ca trực',
    waitingPickup: 'Chờ giao sách',
    waitingPickupHint: 'Xác nhận giao sách hoặc hủy theo chính sách.',
    pendingReservations: 'Đặt trước đang chờ',
    pendingReservationsHint: 'Kiểm tra bản sao sẵn sàng để phục vụ bạn đọc.',
    overdueNeedCall: 'Quá hạn cần gọi',
    overdueToday: '{{count}} giao dịch mới quá hạn hôm nay.',
    incidentsNeedRecord: 'Sự cố cần ghi nhận',
    incidentsHint: '{{damaged}} sách hỏng, {{lost}} sách mất.',
    recentOverline: 'Lịch sử giao dịch nhanh',
    recentTitle: 'Giao dịch vừa cập nhật',
    viewAll: 'Xem tất cả',
    noRecent: 'Chưa có giao dịch gần đây.',
    readerFallback: 'Bạn đọc',
    noCode: 'Không có mã',
    noBarcode: 'Không có barcode',
    transactionFallback: 'Giao dịch mượn/trả',
    risksOverline: 'Bạn đọc cần lưu ý',
    risksTitle: 'Ưu tiên liên hệ',
    noRisks: 'Hiện không có hồ sơ rủi ro nổi bật.',
    overdue: 'quá hạn',
    unpaid: 'nợ phí',
    collect: 'cần thu',
    noTime: 'Chưa có thời gian',
  },
  en: {
    workspace: 'Librarian workspace',
    title: 'Scan codes, find records, handle transactions',
    subtitle: 'Use the field below to scan a book barcode, enter a reader ID, reader name, or book title. Results open in the transaction list for follow-up.',
    refresh: 'Refresh shift',
    searchLabel: 'Scan code or quick search',
    searchPlaceholder: 'Scan book barcode, reader ID, or enter book/reader name',
    search: 'Search',
    loadError: 'Unable to load shift data. Check the connection or sign in again with a librarian account.',
    openList: 'Open list',
    quickCirculation: 'Desk borrowing / returns',
    quickCirculationHint: 'Open scanning and transaction confirmation.',
    waitingBooks: 'Books waiting pickup',
    waitingBooksHint: 'Collect books reserved online by readers.',
    overdueCalls: 'Call overdue readers',
    overdueCallsHint: 'Filter transactions that need reader contact.',
    copyCheck: 'Check copies',
    copyCheckHint: 'Look up barcode, shelf location, and copy condition.',
    contactInbox: 'Contact inbox',
    contactInboxHint: 'Open support tickets, assignment, and reader replies.',
    pendingActions: 'Pending actions',
    shiftBacklog: 'Work waiting in this shift',
    waitingPickup: 'Waiting pickup',
    waitingPickupHint: 'Confirm handover or cancel by policy.',
    pendingReservations: 'Pending reservations',
    pendingReservationsHint: 'Check copies ready to serve readers.',
    overdueNeedCall: 'Overdue calls',
    overdueToday: '{{count}} newly overdue transactions today.',
    incidentsNeedRecord: 'Incidents to record',
    incidentsHint: '{{damaged}} damaged, {{lost}} lost.',
    recentOverline: 'Quick transaction history',
    recentTitle: 'Recently updated transactions',
    viewAll: 'View all',
    noRecent: 'No recent transactions.',
    readerFallback: 'Reader',
    noCode: 'No ID',
    noBarcode: 'No barcode',
    transactionFallback: 'Borrowing/return transaction',
    risksOverline: 'Readers to watch',
    risksTitle: 'Priority contact',
    noRisks: 'No prominent risk profiles right now.',
    overdue: 'overdue',
    unpaid: 'unpaid',
    collect: 'to collect',
    noTime: 'No time yet',
  },
} as const;

type DashboardCopy = Record<keyof typeof COPY.vi, string>;

const interpolate = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{{${key}}}`, String(value)), template);

const localeFor = (language: Lang) => language === 'en' ? 'en-US' : 'vi-VN';
const number = (value?: number | string | null, language: Lang = 'vi') => Number(value || 0).toLocaleString(localeFor(language));
const currency = (value?: number | string | null) =>
  Number(value || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

const statusLabel: Record<TransactionStatus, Record<Lang, string>> = {
  WAITING_FOR_PICKUP: { vi: 'Chờ giao', en: 'Waiting pickup' },
  BORROWING: { vi: 'Đang mượn', en: 'Borrowing' },
  OVERDUE: { vi: 'Quá hạn', en: 'Overdue' },
  RETURNED: { vi: 'Đã trả', en: 'Returned' },
  CANCELLED: { vi: 'Đã hủy', en: 'Cancelled' },
};

const statusTone: Record<TransactionStatus, string> = {
  WAITING_FOR_PICKUP: 'bg-amber-50 text-amber-700 border-amber-100 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100',
  BORROWING: 'bg-blue-50 text-blue-700 border-blue-100 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-100',
  OVERDUE: 'bg-red-50 text-red-700 border-red-100 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-100',
  RETURNED: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-100',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100',
};

const timeLabel = (value?: string | null, language: Lang = 'vi', c: DashboardCopy = COPY.vi) => {
  if (!value) return c.noTime;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(localeFor(language), {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
};

const TaskCard = ({
  title,
  value,
  hint,
  to,
  icon: Icon,
  tone,
  c,
}: {
  title: string;
  value: string;
  hint: string;
  to: string;
  icon: typeof Clock;
  tone: 'amber' | 'red' | 'blue';
  c: DashboardCopy;
}) => {
  const tones = {
    amber: 'border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-50 dark:hover:border-amber-300/70',
    red: 'border-red-200 bg-red-50 text-red-900 hover:border-red-300 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-50 dark:hover:border-red-300/70',
    blue: 'border-blue-200 bg-blue-50 text-blue-900 hover:border-blue-300 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-50 dark:hover:border-blue-300/70',
  };

  return (
    <Link
      to={to}
      className={`group rounded-xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tones[tone]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide opacity-80">{title}</p>
          <p className="mt-3 text-3xl font-black">{value}</p>
          <p className="mt-1 text-sm leading-6 opacity-80">{hint}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/75 dark:bg-white/10">
          <Icon size={21} />
        </div>
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold">
        {c.openList} <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
};

const QuickAction = ({
  to,
  icon: Icon,
  title,
  hint,
}: {
  to: string;
  icon: typeof ScanLine;
  title: string;
  hint: string;
}) => (
  <Link
    to={to}
    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-400/50 dark:hover:bg-slate-800"
  >
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-100">
        <Icon size={20} />
      </div>
      <div>
        <p className="font-black text-slate-950 dark:text-white">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-200">{hint}</p>
      </div>
    </div>
  </Link>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const lang = language as Lang;
  const c = COPY[lang] as DashboardCopy;
  const inputRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [riskyUsers, setRiskyUsers] = useState<RiskyUser[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<LibrarianTransaction[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selectedReader, setSelectedReader] = useState<ReaderRef | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shelvingCount, setShelvingCount] = useState<number | null>(null);
  const [shelvingBranch, setShelvingBranch] = useState('');
  useEffect(() => {
    let disposed = false, sequence = 0;
    const refresh = async () => {
      const request = ++sequence;
      try {
        const response = await reshelvingService.getDefaultBranch();
        const branch = response.data.branch;
        const count = await reshelvingService.getCount(branch);
        if (!disposed && request === sequence) {
          setShelvingBranch(branch);
          setShelvingCount(count.data.count);
        }
      } catch { /* Never substitute a global count for an unavailable branch count. */ }
    };
    void refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener(RESHELVING_CHANGED, refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { disposed = true; window.clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener(RESHELVING_CHANGED, refresh); };
  }, []);

  useEffect(() => {
    let disposed = false;
    const refresh = () => { void librarianDashboardService.getSummary().then(response => {
      if (!disposed) setSummary(response.data);
    }).catch(() => {}); };
    window.addEventListener('focus', refresh);
    window.addEventListener(RESHELVING_CHANGED, refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { disposed = true; window.clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener(RESHELVING_CHANGED, refresh); };
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryRes, riskRes, recentRes] = await Promise.all([
        librarianDashboardService.getSummary(),
        librarianDashboardService.getRiskyUsers(0, 4).catch(() => null),
        transactionsService.getAllTransactions(0, 8, undefined, 'ALL', 'ALL', undefined, undefined, 'createdAt', 'DESC').catch(() => null),
      ]);
      setSummary(summaryRes.data);
      setRiskyUsers(riskRes?.data?.content || []);
      setRecentTransactions(recentRes?.data?.content || []);
    } catch (error) {
      console.error('Lỗi khi tải bàn làm việc thủ thư:', error);
      setError(c.loadError);
    } finally {
      setLoading(false);
      window.setTimeout(() => inputRef.current?.focus(), 80);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [c.loadError]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = keyword.trim();
    if (!query) {
      inputRef.current?.focus();
      return;
    }
    navigate(`/librarianpage/transactions?keyword=${encodeURIComponent(query)}`);
  };

  const work = useMemo(() => ({
    waiting: summary?.pendingActions.waitingForPickup || 0,
    reservations: summary?.pendingActions.reservationsPending || 0,
    overdue: summary?.pendingActions.overdueTransactions || 0,
    newOverdue: summary?.todayTransaction.newlyOverdueToday || 0,
    incidents: (summary?.todayTransaction.damagedToday || 0) + (summary?.todayTransaction.lostToday || 0),
  }), [summary]);

  if (loading) {
    return (
      <div className="mx-auto flex h-80 max-w-7xl items-center justify-center p-6">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-b-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1680px] space-y-6 p-4 text-slate-900 dark:text-slate-100 sm:p-6 lg:p-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-100">
              <ScanLine size={15} />
              {c.workspace}
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              {c.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-200 sm:text-base">
              {c.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={loadDashboard}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCcw size={16} />
            {c.refresh}
          </button>
        </div>

        <form onSubmit={handleSearch} className="mt-6">
          <label htmlFor="librarian-quick-search" className="sr-only">{c.searchLabel}</label>
          <div className="flex flex-col gap-3 rounded-2xl border-2 border-blue-200 bg-blue-50/60 p-3 focus-within:border-blue-500 focus-within:bg-white dark:border-blue-500/30 dark:bg-blue-500/10 dark:focus-within:bg-slate-950 sm:flex-row">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm dark:bg-slate-900">
              <Search className="shrink-0 text-blue-600" size={24} />
              <input
                ref={inputRef}
                id="librarian-quick-search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder={c.searchPlaceholder}
                className="w-full bg-transparent text-base font-bold text-slate-950 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-400 sm:text-lg"
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700"
            >
              <Search size={18} />
              {c.search}
            </button>
          </div>
        </form>
      </section>

      {error && (
        <section className="rounded-xl border border-red-100 bg-red-50 p-5 text-red-900 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-50">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={20} />
            <p className="text-sm leading-6">{error}</p>
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <QuickAction to="/librarianpage/circulation" icon={ScanLine} title={c.quickCirculation} hint={c.quickCirculationHint} />
        <QuickAction to="/librarianpage/transactions?status=WAITING_FOR_PICKUP" icon={BookMarked} title={c.waitingBooks} hint={c.waitingBooksHint} />
        <QuickAction to="/librarianpage/transactions?status=OVERDUE" icon={Phone} title={c.overdueCalls} hint={c.overdueCallsHint} />
        <QuickAction to="/librarianpage/copies" icon={PackageSearch} title={c.copyCheck} hint={c.copyCheckHint} />
        <QuickAction to="/librarianpage/contact-inbox" icon={Mail} title={c.contactInbox} hint={c.contactInboxHint} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-300">{c.pendingActions}</p>
            <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{c.shiftBacklog}</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <TaskCard
            title={c.waitingPickup}
            value={number(work.waiting, lang)}
            hint={c.waitingPickupHint}
            to="/librarianpage/transactions?status=WAITING_FOR_PICKUP"
            icon={Clock}
            tone="amber"
            c={c}
          />
          <TaskCard
            title={c.pendingReservations}
            value={number(work.reservations, lang)}
            hint={c.pendingReservationsHint}
            to="/librarianpage/transactions"
            icon={CalendarDays}
            tone="blue"
            c={c}
          />
          <TaskCard
            title={c.overdueNeedCall}
            value={number(work.overdue, lang)}
            hint={interpolate(c.overdueToday, { count: number(work.newOverdue, lang) })}
            to="/librarianpage/transactions?status=OVERDUE"
            icon={ShieldAlert}
            tone="red"
            c={c}
          />
          <TaskCard
            title={lang === 'en' ? 'Books awaiting shelving' : 'Sách chờ cất kệ'}
            value={shelvingCount === null ? '—' : number(shelvingCount, lang)}
            hint={shelvingBranch === 'ALL' ? (lang === 'en' ? 'All branches — select a working branch to confirm.' : 'Tất cả cơ sở — chọn cơ sở trực để xác nhận.') : shelvingBranch || (lang === 'en' ? 'Loading branch count…' : 'Đang tải số sách theo cơ sở…')}
            to="/librarianpage/circulation?tab=reshelving"
            icon={BookMarked}
            tone="blue"
            c={c}
          />
          <TaskCard
            title={c.incidentsNeedRecord}
            value={number(work.incidents, lang)}
            hint={interpolate(c.incidentsHint, { damaged: number(summary?.todayTransaction.damagedToday, lang), lost: number(summary?.todayTransaction.lostToday, lang) })}
            to="/librarianpage/copies"
            icon={AlertTriangle}
            tone="red"
            c={c}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-300">{c.recentOverline}</p>
              <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{c.recentTitle}</h2>
            </div>
            <Link to="/librarianpage/transactions" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200">
              {c.viewAll} <ArrowRight size={15} />
            </Link>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            {recentTransactions.length === 0 ? (
              <div className="p-5 text-sm text-slate-500 dark:text-slate-200">{c.noRecent}</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.transactionId}
                    className="grid gap-3 p-4 hover:bg-blue-50/40 dark:hover:bg-slate-800 md:grid-cols-[1.2fr_0.8fr_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setSelectedReader({
                          userId: transaction.userId,
                          studentId: transaction.studentId,
                          fullName: transaction.fullName,
                        })}
                        className="block max-w-full truncate text-left text-sm font-black text-slate-950 hover:text-blue-600 dark:text-white dark:hover:text-blue-300"
                      >
                        {transaction.fullName || c.readerFallback}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedReader({
                          userId: transaction.userId,
                          studentId: transaction.studentId,
                          fullName: transaction.fullName,
                        })}
                        className="mt-1 block max-w-full truncate text-left text-xs text-slate-500 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-300"
                      >
                        {transaction.studentId || c.noCode} · {transaction.barcode || c.noBarcode}
                      </button>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-100">{transaction.note || transaction.fineTypes || c.transactionFallback}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{timeLabel(transaction.createdAt || transaction.returnedDate || transaction.borrowedDate, lang, c)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusTone[transaction.status]}`}>
                        {statusLabel[transaction.status][lang]}
                      </span>
                      <Link to={`/librarianpage/transactions?highlight=${transaction.transactionId}`} className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-300">
                        {c.openList}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-300">{c.risksOverline}</p>
              <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{c.risksTitle}</h2>
            </div>
            <Mail className="text-slate-300 dark:text-slate-500" size={22} />
          </div>
          <div className="mt-5 space-y-3">
            {riskyUsers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-200">{c.noRisks}</div>
            ) : riskyUsers.map((user) => (
              <button
                type="button"
                key={user.userId}
                onClick={() => setSelectedReader({ userId: user.userId, studentId: user.studentId, fullName: user.fullName })}
                className="block w-full rounded-lg border border-slate-100 p-4 text-left hover:border-blue-200 hover:bg-blue-50/40 dark:border-slate-700 dark:hover:border-blue-400/50 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-100">
                    <UserRound size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-950 dark:text-white">{user.fullName}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-300">{user.studentId || user.email}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-red-50 p-2 text-red-700 dark:bg-red-500/15 dark:text-red-100"><b>{number(user.riskyMetrics.overdueCount, lang)}</b><br />{c.overdue}</div>
                  <div className="rounded-lg bg-amber-50 p-2 text-amber-700 dark:bg-amber-500/15 dark:text-amber-100"><b>{number(user.riskyMetrics.unpaidFineCount, lang)}</b><br />{c.unpaid}</div>
                  <div className="rounded-lg bg-slate-50 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-100"><b>{currency(user.riskyMetrics.totalUnpaidAmount)}</b><br />{c.collect}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
      <ReaderProfileDrawer reader={selectedReader} onClose={() => setSelectedReader(null)} />
    </div>
  );
};

export default Dashboard;

import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Clock3,
  Hash,
  Hourglass,
  Mail,
  MapPin,
  Phone,
  Printer,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { getMyReservations, Reservation } from '../../api/reservationService';
import transactionsService, {
  UserTransaction,
} from '../../api/transactionsService';
import usersService from '../../api/usersService';
import { useTranslation } from '../../contexts/LanguageContext';

// ─── Helpers ────────────────────────────────────────────────────────────────

const daysUntil = (dueDate: string) =>
  Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000);

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const firstName = (fullName: string) =>
  fullName.trim().split(' ').pop() ?? fullName;

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface Stat {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
  bg: string;
  iconBg: string;
}

const StatCard = ({ stat }: { stat: Stat }) => (
  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-xl flex-shrink-0 ${stat.iconBg}`}>
      {stat.icon}
    </div>
    <div>
      <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
      <p className={`text-3xl font-bold ${stat.bg}`}>{stat.value}</p>
      <p className="text-xs text-slate-400">{stat.sub}</p>
    </div>
  </div>
);

// ─── Due Book Item ───────────────────────────────────────────────────────────

const BookCover = ({
  title,
  url,
  size = 'sm',
}: {
  title: string;
  url?: string | null;
  size?: 'sm' | 'md';
}) => {
  const className = size === 'md' ? 'w-16 h-20' : 'w-12 h-16';
  return url ? (
    <img
      src={url}
      alt={title}
      className={`${className} rounded-lg object-cover border border-slate-200 bg-slate-50 flex-shrink-0`}
    />
  ) : (
    <div
      className={`${className} rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0`}
    >
      <BookOpen size={size === 'md' ? 24 : 18} className="text-blue-500" />
    </div>
  );
};

const DueBookItem = ({
  tx,
  onOpen,
}: {
  tx: UserTransaction;
  onOpen: (tx: UserTransaction) => void;
}) => {
  const { t } = useTranslation();
  const days = daysUntil(tx.dueDate);
  const isOverdue = tx.status === 'OVERDUE' || days < 0;
  const isUrgent = !isOverdue && days <= 3;

  return (
    <button
      type="button"
      onClick={() => onOpen(tx)}
      className="w-full text-left flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all"
    >
      <BookCover title={tx.publicationTitle} url={tx.coverImageUrl} />

      <div className="flex-grow min-w-0">
        <h4 className="font-bold text-slate-900 text-sm truncate">
          {tx.publicationTitle}
        </h4>
        <p className="text-xs text-slate-500 font-mono mt-0.5">
          {tx.barcode} · {tx.branch}
        </p>
        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
          <span className="flex items-center gap-1">
            <Calendar size={10} /> {t('dashboard.borrowedShort', 'Mượn')}:{' '}
            {formatDate(tx.borrowedDate)}
          </span>
        </div>
      </div>

      {/* Status + date */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-1 w-full sm:w-auto">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
            isOverdue
              ? 'bg-red-100 text-red-600'
              : isUrgent
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {isOverdue ? <AlertTriangle size={10} /> : <Clock size={10} />}
          {isOverdue
            ? `${t('myBooks.status.overdue', 'Quá hạn')} ${Math.abs(days)} ${t('myBooks.days', 'ngày')}`
            : `${t('myBooks.remaining', 'Còn')} ${days} ${t('myBooks.days', 'ngày')}`}
        </span>
        <p className="text-[10px] text-slate-500">
          {t('myBooks.dueDate', 'Hạn trả')}:{' '}
          <span
            className={`font-bold ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}
          >
            {formatDate(tx.dueDate)}
          </span>
        </p>
      </div>
    </button>
  );
};

const DueBookDetailModal = ({
  tx,
  onClose,
}: {
  tx: UserTransaction;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const days = daysUntil(tx.dueDate);
  const isOverdue = tx.status === 'OVERDUE' || days < 0;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-5 ${isOverdue ? 'bg-red-600' : 'bg-green-600'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <BookCover
                title={tx.publicationTitle}
                url={tx.coverImageUrl}
                size="md"
              />
              <div className="min-w-0">
                <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white mb-2">
                  <BookOpen size={12} className="mr-1" />{' '}
                  {isOverdue
                    ? t('myBooks.status.overdue', 'Quá hạn')
                    : t('myBooks.status.borrowing', 'Đang mượn')}
                </span>
                <h3 className="text-white font-bold text-lg leading-tight">
                  {tx.publicationTitle}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white flex-shrink-0"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Hash size={15} className="text-gray-400" />
              <span className="text-gray-500 w-28">
                {t('myBooks.transactionId', 'Mã giao dịch')}
              </span>
              <span className="font-mono font-semibold text-gray-900">
                #{tx.transactionId}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Printer size={15} className="text-gray-400" />
              <span className="text-gray-500 w-28">Barcode</span>
              <span className="font-mono font-medium text-gray-800">
                {tx.barcode}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin size={15} className="text-gray-400" />
              <span className="text-gray-500 w-28">
                {t('myBooks.location', 'Vị trí')}
              </span>
              <span className="font-medium text-gray-800">
                {tx.branch} — {tx.location}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={15} className="text-gray-400" />
              <span className="text-gray-500 w-28">
                {t('myBooks.borrowedDate', 'Ngày mượn')}
              </span>
              <span className="font-medium text-gray-800">
                {formatDate(tx.borrowedDate)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock
                size={15}
                className={isOverdue ? 'text-red-400' : 'text-gray-400'}
              />
              <span className="text-gray-500 w-28">
                {t('myBooks.dueDate', 'Hạn trả')}
              </span>
              <span
                className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}
              >
                {formatDate(tx.dueDate)}
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                >
                  {isOverdue
                    ? `${t('myBooks.overBy', 'Quá')} ${Math.abs(days)} ${t('myBooks.days', 'ngày')}`
                    : `${t('myBooks.remaining', 'Còn')} ${days} ${t('myBooks.days', 'ngày')}`}
                </span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors"
          >
            {t('common.close', 'Đóng')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Campus Contact Cards ───────────────────────────────────────────────────

const libraryBranches = [
  {
    name: 'Cơ sở Lý Thường Kiệt',
    campus: 'Cơ sở 1',
    address: '268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM',
    email: 'support@library74.uk',
    phone: '+84 88 676 5392',
    hours: '08:00-17:00',
    days: 'Thứ 2-Thứ 6',
    mapQuery: '268 Ly Thuong Kiet, District 10, Ho Chi Minh City',
  },
  {
    name: 'Cơ sở Dĩ An',
    campus: 'Cơ sở 2',
    address: 'Khu đô thị ĐHQG-HCM, Phường Đông Hòa, TP. Dĩ An, Bình Dương',
    email: 'contact@library74.uk',
    phone: '+84 39 972 8845',
    hours: '07:30-16:30',
    days: 'Thứ 2-Thứ 7',
    mapQuery: 'Ho Chi Minh City University of Technology Di An Campus',
  },
];

const GoogleMapsPinIcon = ({ className = 'h-7 w-7' }: { className?: string }) => (
  <svg viewBox="0 0 64 88" aria-hidden="true" className={className}>
    <path fill="#34A853" d="M32 88c6.5-18.9 23-31.4 28.4-49.9C64.9 22.7 56.4 7.1 41.3 1.9L32 24.6v63.4Z" />
    <path fill="#4285F4" d="M41.3 1.9C28.9-2.4 14.7 1.8 6.9 13.4l18.5 15.5L41.3 1.9Z" />
    <path fill="#1A73E8" d="M6.9 13.4C1.4 21.6.1 31.5 3.3 40.5L25.4 28.9 6.9 13.4Z" />
    <path fill="#FBBC04" d="M3.3 40.5C7.7 52.8 20.6 64 32 88V52.2L3.3 40.5Z" />
    <path fill="#EA4335" d="M25.4 28.9 3.3 40.5C1.8 34.8 2.6 28.5 6.9 13.4l18.5 15.5Z" />
    <circle cx="32" cy="32" r="11.5" fill="#fff" />
  </svg>
);

const CampusContactCard = ({
  branch,
}: {
  branch: (typeof libraryBranches)[number];
}) => (
  <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
            {branch.campus}
          </span>
          <h3 className="mt-3 text-lg font-black text-slate-950">
            {branch.name}
          </h3>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <GoogleMapsPinIcon />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="flex items-center gap-2 text-xs font-black uppercase text-slate-400">
            <MapPin size={14} /> Địa chỉ
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">
            {branch.address}
          </p>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
          <p className="flex items-center gap-2 text-xs font-black uppercase text-amber-600">
            <Clock3 size={14} /> Giờ mở cửa
          </p>
          <p className="mt-2 text-xl font-black text-amber-900">
            {branch.hours}
          </p>
          <p className="text-sm font-bold text-amber-700">{branch.days}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <a
            href={`mailto:${branch.email}?subject=${encodeURIComponent('Yêu cầu hỗ trợ Library74')}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm font-black text-blue-700 transition hover:border-blue-200 hover:bg-blue-100"
          >
            <Mail size={16} />
            Gửi email
          </a>
          <a
            href={`tel:${branch.phone.replace(/\s/g, '')}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-sm font-black text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-100"
          >
            <Phone size={16} />
            Gọi thư viện
          </a>
        </div>
        <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
          <span className="truncate rounded-lg bg-slate-50 px-3 py-2">
            {branch.email}
          </span>
          <span className="rounded-lg bg-slate-50 px-3 py-2">
            {branch.phone}
          </span>
        </div>
      </div>
    </div>
    <iframe
      title={`Bản đồ ${branch.name}`}
      src={`https://www.google.com/maps?q=${encodeURIComponent(branch.mapQuery)}&output=embed`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className="h-44 w-full border-t border-slate-200"
    />
  </article>
);

// ─── Main Page ───────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const { t } = useTranslation();
  const [userName, setUserName] = useState('');
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailModal, setDetailModal] = useState<UserTransaction | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, txRes, resRes] = await Promise.all([
          usersService.getMyProfile(),
          transactionsService.getMyTransactions(0, 50),
          getMyReservations(0, 20),
        ]);
        if (profileRes.code === 200) setUserName(profileRes.data.fullName);
        if (txRes.code === 200) setTransactions(txRes.data.content);
        setReservations(
          resRes.content.filter(
            (r) => r.status === 'PENDING' || r.status === 'READY_FOR_PICKUP'
          )
        );
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Computed stats ──────────────────────────────────────────────────────
  const active = transactions.filter((t) =>
    ['BORROWING', 'OVERDUE'].includes(t.status)
  );
  const waiting = transactions.filter((t) => t.status === 'WAITING_FOR_PICKUP');
  const overdue = transactions.filter((t) => t.status === 'OVERDUE');
  const dueSoon = transactions.filter(
    (t) =>
      t.status === 'BORROWING' &&
      daysUntil(t.dueDate) <= 3 &&
      daysUntil(t.dueDate) >= 0
  );

  // Sách sắp hết hạn: BORROWING + OVERDUE, sort by dueDate ASC, top 5
  const dueSoonList = [...active]
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )
    .slice(0, 5);

  const stats: Stat[] = [
    {
      label: t('myBooks.tabBorrowing', 'Sách đang mượn'),
      value: active.length,
      sub: t('dashboard.borrowingSub', 'Sách đang trong tay'),
      icon: <BookOpen size={20} className="text-blue-600" />,
      bg: 'text-blue-700',
      iconBg: 'bg-blue-100',
    },
    {
      label: t('myBooks.tabWaiting', 'Sách chờ lấy'),
      value: waiting.length,
      sub: t('dashboard.waitingSub', 'Cần đến thư viện nhận'),
      icon: <Hourglass size={20} className="text-yellow-600" />,
      bg: 'text-yellow-700',
      iconBg: 'bg-yellow-100',
    },
    {
      label: t('myBooks.status.overdue', 'Quá hạn'),
      value: overdue.length,
      sub: t('dashboard.overdueSub', 'Cần trả gấp'),
      icon: <AlertTriangle size={20} className="text-red-600" />,
      bg: 'text-red-700',
      iconBg: 'bg-red-100',
    },
    {
      label: t('myBooks.dueSoon', 'Sắp đến hạn'),
      value: dueSoon.length,
      sub: t('dashboard.dueSoonSub', 'Còn ≤ 3 ngày'),
      icon: <Clock size={20} className="text-orange-600" />,
      bg: 'text-orange-700',
      iconBg: 'bg-orange-100',
    },
  ];

  return (
    <>
      <div className="animate-fade-in space-y-8 max-w-7xl mx-auto pb-10">
        {/* 1. Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-5 sm:p-8 text-white relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 hidden w-80 h-full bg-white/10 transform skew-x-12 translate-x-20 sm:block" />
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-2">
              {t('dashboard.greeting', 'Xin chào')},{' '}
              {isLoading
                ? '...'
                : firstName(userName || t('dashboard.you', 'bạn'))}
              ! 👋
            </h1>
            <p className="text-blue-100 mb-6 text-sm">
              {dueSoon.length + overdue.length > 0 ? (
                <>
                  {t('dashboard.attentionPrefix', 'Bạn có')}{' '}
                  <strong className="text-white">
                    {dueSoon.length + overdue.length}{' '}
                    {t('common.books', 'sách')}
                  </strong>{' '}
                  {t(
                    'dashboard.attentionSuffix',
                    'cần chú ý - sắp đến hạn hoặc quá hạn.'
                  )}
                </>
              ) : active.length > 0 ? (
                <>
                  {t('dashboard.borrowingPrefix', 'Bạn đang mượn')}{' '}
                  <strong className="text-white">
                    {active.length} {t('common.books', 'cuốn')}
                  </strong>
                  . {t('dashboard.borrowingSuffix', 'Tiếp tục đọc sách nào!')}
                </>
              ) : (
                <>
                  {t(
                    'dashboard.welcomeBack',
                    'Chào mừng trở lại thư viện Library74. Khám phá sách mới ngay!'
                  )}
                </>
              )}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/userpage/my-books"
                className="inline-flex items-center justify-center bg-white text-blue-800 border border-white/80 text-xs font-semibold px-5 py-2 rounded-lg shadow-sm hover:bg-blue-50 transition-all"
              >
                {t('dashboard.viewMyBooks', 'Xem sách đang mượn')}
              </Link>
            </div>
          </div>
        </div>

        {/* 2. Summary Stats */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-5 border border-slate-200 h-24 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <StatCard key={i} stat={s} />
            ))}
          </div>
        )}

        {/* 3. Sách sắp hết hạn */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {t('dashboard.dueBooksTitle', 'Sách sắp đến hạn')}
              </h3>
              <p className="text-xs text-slate-500">
                {t(
                  'dashboard.dueBooksDesc',
                  'Các sách cần trả sớm nhất, ưu tiên theo ngày hạn'
                )}
              </p>
            </div>
            <Link
              to="/userpage/my-books"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center hover:underline"
            >
              {t('common.viewAll', 'Xem tất cả')}{' '}
              <ArrowRight size={12} className="ml-1" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-4 h-20 border border-slate-100 animate-pulse"
                />
              ))}
            </div>
          ) : dueSoonList.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center text-center text-slate-400">
              <CheckCircle size={32} className="mb-2 text-green-400" />
              <p className="text-sm font-medium text-slate-600">
                {t(
                  'dashboard.noDueBooksTitle',
                  'Tuyệt vời! Không có sách nào sắp đến hạn.'
                )}
              </p>
              <p className="text-xs mt-1">
                {t(
                  'dashboard.noDueBooksDesc',
                  'Bạn đang quản lý sách rất tốt.'
                )}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {dueSoonList.map((tx) => (
                <DueBookItem
                  key={tx.transactionId}
                  tx={tx}
                  onOpen={setDetailModal}
                />
              ))}
            </div>
          )}
        </div>

        {/* 4. Đặt trước đang chờ */}
        {!isLoading && reservations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {t(
                    'dashboard.pendingReservationsTitle',
                    'Đặt trước đang chờ'
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  {t(
                    'dashboard.pendingReservationsDesc',
                    'Theo dõi hàng chờ và sách đã sẵn sàng để nhận'
                  )}
                </p>
              </div>
              <Link
                to="/userpage/reservations"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center hover:underline"
              >
                {t('common.viewAll', 'Xem tất cả')}{' '}
                <ArrowRight size={12} className="ml-1" />
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {reservations.slice(0, 4).map((r) => (
                <div
                  key={r.reservationId}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${r.status === 'READY_FOR_PICKUP' ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'}`}
                >
                  <div
                    className={`p-2.5 rounded-xl flex-shrink-0 ${r.status === 'READY_FOR_PICKUP' ? 'bg-green-200 text-green-700' : 'bg-blue-100 text-blue-500'}`}
                  >
                    <Clock size={18} />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {r.publicationTitle}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {r.preferredBranch === 'ANY'
                        ? t('reservations.anyBranchFull', 'Bất kỳ cơ sở')
                        : r.preferredBranch}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {r.status === 'READY_FOR_PICKUP' ? (
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                        {t('reservations.status.ready', 'Sẵn sàng nhận')}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">
                        {t('reservations.queueShort', 'Hàng chờ')} #
                        {r.queuePosition}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Campus Info */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {libraryBranches.map((branch) => (
            <CampusContactCard key={branch.campus} branch={branch} />
          ))}
        </div>
      </div>
      {detailModal && (
        <DueBookDetailModal
          tx={detailModal}
          onClose={() => setDetailModal(null)}
        />
      )}
    </>
  );
};

export default DashboardPage;

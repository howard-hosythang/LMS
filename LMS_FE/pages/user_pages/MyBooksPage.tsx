import {
  AlertTriangle,
  ArrowDownUp,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Hash,
  Hourglass,
  Layers,
  MapPin,
  PenLine,
  Printer,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { Button } from '../../components/ui';
import transactionsService, { UserTransaction } from '../../api/transactionsService';
import circulationPolicyService from '../../api/circulationPolicyService';
import { useTranslation } from '../../contexts/LanguageContext';
import { toast } from 'sonner';

type BookShelfTab = 'all' | 'waiting' | 'borrowing' | 'returned' | 'cancelled';
type SortOrder = 'newest' | 'oldest';

const WAITING_STATUSES: UserTransaction['status'][] = ['WAITING_FOR_PICKUP'];
const BORROWING_STATUSES: UserTransaction['status'][] = ['BORROWING', 'OVERDUE'];
const RETURNED_STATUSES: UserTransaction['status'][] = ['RETURNED'];
const CANCELLED_STATUSES: UserTransaction['status'][] = ['CANCELLED'];

const statusConfig: Record<UserTransaction['status'], { labelKey: string; fallback: string; color: string; icon: React.ReactNode }> = {
  WAITING_FOR_PICKUP: { labelKey: 'myBooks.status.waiting', fallback: 'Chờ lấy sách', color: 'bg-yellow-100 text-yellow-800', icon: <Hourglass size={12} className="mr-1" /> },
  BORROWING:          { labelKey: 'myBooks.status.borrowing', fallback: 'Đang mượn', color: 'bg-green-100 text-green-800',  icon: <BookOpen size={12} className="mr-1" /> },
  OVERDUE:            { labelKey: 'myBooks.status.overdue', fallback: 'Quá hạn', color: 'bg-red-100 text-red-800',      icon: <AlertTriangle size={12} className="mr-1" /> },
  RETURNED:           { labelKey: 'myBooks.status.returned', fallback: 'Đã trả', color: 'bg-blue-100 text-blue-800',    icon: <CheckCircle size={12} className="mr-1" /> },
  CANCELLED:          { labelKey: 'myBooks.status.cancelled', fallback: 'Đã huỷ', color: 'bg-gray-100 text-gray-600',    icon: <XCircle size={12} className="mr-1" /> },
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatCurrency = (amount: number | null | undefined) => {
  if (!amount) return '0đ';
  return amount.toLocaleString('vi-VN') + 'đ';
};

const daysUntil = (dueDate: string) => {
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  return diff;
};

const addDays = (date: string, days: number) => {
  const result = new Date(`${date}T00:00:00`);
  result.setDate(result.getDate() + days);
  return result;
};

const canReviewTransaction = (tx: UserTransaction) => {
  if (tx.status !== 'RETURNED' || tx.reviewed || !tx.returnedDate) return false;
  const returnedAt = new Date(tx.returnedDate).getTime();
  if (Number.isNaN(returnedAt)) return false;
  return Date.now() - returnedAt <= 7 * 86400000;
};

const BookCover = ({ title, url, size = 'md' }: { title: string; url?: string | null; size?: 'sm' | 'md' }) => {
  const className = size === 'sm' ? 'w-12 h-16' : 'w-16 h-20';
  return url ? (
    <img src={url} alt={title} className={`${className} rounded-lg object-cover border border-gray-200 bg-gray-50 flex-shrink-0`} />
  ) : (
    <div className={`${className} rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0`}>
      <BookOpen size={size === 'sm' ? 18 : 24} className="text-blue-500" />
    </div>
  );
};

const MyBooksPage = () => {
  const { language, t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [activeTab, setActiveTab] = useState<BookShelfTab>('all');
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [qrModal, setQrModal] = useState<UserTransaction | null>(null);
  const [detailModal, setDetailModal] = useState<UserTransaction | null>(null);
  const [renewModal, setRenewModal] = useState<UserTransaction | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [defaultLoanDays, setDefaultLoanDays] = useState(14);
  const [renewalWindowDays, setRenewalWindowDays] = useState(2);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [listPage, setListPage] = useState(0);
  const LIST_PAGE_SIZE = 10;
  const highlightRef = useRef<HTMLDivElement | null>(null);

  const goToReview = (tx: UserTransaction) => {
    navigate(`/publicpage/book/${tx.publicationId}?review=1&transaction=${tx.transactionId}`);
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const firstPage = await transactionsService.getMyTransactions(0, 1);
      const total = firstPage.code === 200 ? firstPage.data.totalElements : 0;
      const res = await transactionsService.getMyTransactions(0, Math.max(total, 1));
      if (res.code === 200) {
        setTransactions(res.data.content);
        setTotalElements(res.data.totalElements);
      }
    } catch (e) {
      console.error(e);
      toast.error(t('myBooks.loadError', 'Không thể tải danh sách sách đang mượn'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchTransactions();
    circulationPolicyService.getPolicy()
      .then((response) => {
        setDefaultLoanDays(response.data.defaultLoanDays ?? 14);
        setRenewalWindowDays(response.data.renewalWindowDays ?? 2);
      })
      .catch(() => {
        setDefaultLoanDays(14);
        setRenewalWindowDays(2);
      });
  }, []);

  const confirmRenewal = async () => {
    if (!renewModal) return;
    setIsRenewing(true);
    try {
      const response = await transactionsService.renew(renewModal.transactionId);
      toast.success(response.message || t('myBooks.renewSuccess', 'Gia hạn sách thành công'));
      setRenewModal(null);
      await fetchTransactions();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('myBooks.renewError', 'Không thể gia hạn sách. Vui lòng thử lại.'));
    } finally {
      setIsRenewing(false);
    }
  };

  const renewalReason = (tx: UserTransaction) => {
    switch (tx.cannotRenewReason) {
      case 'HAS_RESERVATIONS':
        return <span className="text-xs font-medium text-rose-500">{t('myBooks.renewBlockedReservation', 'Sách có người đặt trước, không thể gia hạn')}</span>;
      case 'NOT_IN_WINDOW':
        return <span className="text-xs text-amber-600">{t('myBooks.renewWindowHint', `Chỉ mở gia hạn trước hạn ${renewalWindowDays} ngày`)}</span>;
      case 'RENEWAL_LIMIT_REACHED':
        return <span className="text-xs text-slate-400">{t('myBooks.renewalLimitReached', `Đã hết lượt gia hạn (${tx.renewalCount}/${tx.maxRenewals})`)}</span>;
      case 'UNPAID_FINES':
        return <span className="text-xs font-medium text-rose-500">{t('myBooks.renewBlockedFine', 'Cần thanh toán phí phạt trước khi gia hạn')}</span>;
      case 'OVERDUE':
        return <span className="text-xs font-medium text-rose-500">{t('myBooks.renewBlockedOverdue', 'Sách đã quá hạn, vui lòng trả sách tại quầy')}</span>;
      default:
        return null;
    }
  };

  // Auto-switch tab and scroll to highlighted transaction
  useEffect(() => {
    if (!highlightId || transactions.length === 0) return;
    const tx = transactions.find(t => t.transactionId === highlightId);
    if (!tx) return;
    if (WAITING_STATUSES.includes(tx.status)) setActiveTab('waiting');
    else if (BORROWING_STATUSES.includes(tx.status)) setActiveTab('borrowing');
    else if (RETURNED_STATUSES.includes(tx.status)) setActiveTab('returned');
    else if (CANCELLED_STATUSES.includes(tx.status)) setActiveTab('cancelled');
    else setActiveTab('all');
  }, [highlightId, transactions]);

  useEffect(() => {
    if (!highlightId || !highlightRef.current) return;
    const timer = setTimeout(() => {
      highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    return () => clearTimeout(timer);
  }, [highlightId, activeTab, transactions]);

  useEffect(() => {
    setListPage(0);
  }, [activeTab, searchTerm, sortOrder]);

  const waiting = useMemo(() => transactions.filter(t => WAITING_STATUSES.includes(t.status)), [transactions]);
  const borrowing = useMemo(() => transactions.filter(t => BORROWING_STATUSES.includes(t.status)), [transactions]);
  const returned = useMemo(() => transactions.filter(t => RETURNED_STATUSES.includes(t.status)), [transactions]);
  const cancelled = useMemo(() => transactions.filter(t => CANCELLED_STATUSES.includes(t.status)), [transactions]);
  const finedTransactions = useMemo(
    () => transactions.filter(t => t.fineAmount != null && t.fineAmount > 0),
    [transactions]
  );

  const tabFiltered = useMemo(() => {
    if (activeTab === 'waiting') return waiting;
    if (activeTab === 'borrowing') return borrowing;
    if (activeTab === 'returned') return returned;
    if (activeTab === 'cancelled') return cancelled;
    return transactions;
  }, [activeTab, borrowing, cancelled, returned, transactions, waiting]);

  const filtered = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const searched = keyword
      ? tabFiltered.filter(t => t.publicationTitle.toLowerCase().includes(keyword))
      : tabFiltered;

    const getSortTime = (tx: UserTransaction) => {
      const value = tx.returnedDate || tx.borrowedDate || tx.pickedUpDeadline || tx.dueDate;
      return value ? new Date(value).getTime() : 0;
    };

    return [...searched].sort((a, b) => (
      sortOrder === 'newest'
        ? getSortTime(b) - getSortTime(a)
        : getSortTime(a) - getSortTime(b)
    ));
  }, [searchTerm, sortOrder, tabFiltered]);

  const listTotalPages = Math.ceil(filtered.length / LIST_PAGE_SIZE);
  const displayed = filtered.slice(listPage * LIST_PAGE_SIZE, (listPage + 1) * LIST_PAGE_SIZE);

  const overdueCount = borrowing.filter(t => t.status === 'OVERDUE').length;
  const totalFineAmount = finedTransactions.reduce((sum, tx) => sum + (tx.fineAmount ?? 0), 0);
  const tabs: { key: BookShelfTab; label: string; count: number }[] = [
    { key: 'all', label: t('myBooks.tabAll', 'Tất cả'), count: transactions.length },
    { key: 'waiting', label: t('myBooks.tabWaiting', 'Sách chờ lấy'), count: waiting.length },
    { key: 'borrowing', label: t('myBooks.tabBorrowing', 'Sách đang mượn'), count: borrowing.length },
    { key: 'returned', label: t('myBooks.tabReturned', 'Sách đã trả'), count: returned.length },
    { key: 'cancelled', label: t('myBooks.tabCancelled', 'Sách đã hủy'), count: cancelled.length },
  ];

  const emptyMessage = {
    all: t('myBooks.emptyAll', 'Bạn chưa có giao dịch mượn sách nào.'),
    waiting: t('myBooks.emptyWaiting', 'Không có sách nào đang chờ lấy.'),
    borrowing: t('myBooks.emptyBorrowing', 'Không có sách nào đang mượn.'),
    returned: t('myBooks.emptyReturned', 'Chưa có sách đã trả.'),
    cancelled: t('myBooks.emptyCancelled', 'Chưa có sách đã hủy.'),
  }[activeTab];
  const noSearchResultMessage = t('myBooks.noSearchResults', 'Không tìm thấy sách khớp với từ khóa.');

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('myBooks.title', 'Sách của tôi')}</h1>
          <p className="text-gray-500 text-sm">{t('myBooks.subtitle', 'Theo dõi sách chờ lấy, đang mượn và đã trả.')}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-gray-100 p-1">
        <div className="flex min-w-max gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all sm:px-5 ${
                activeTab === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t('myBooks.searchPlaceholder', 'Tìm theo tên sách...')}
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <label className="relative flex h-11 min-w-[180px] items-center rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
              <ArrowDownUp size={16} className="mr-2 text-gray-400" />
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as SortOrder)}
                className="w-full bg-transparent font-medium text-gray-700 outline-none"
              >
                <option value="newest">{t('myBooks.sortNewest', 'Mới nhất')}</option>
                <option value="oldest">{t('myBooks.sortOldest', 'Cũ nhất')}</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
            <span>{t('myBooks.showingCount', 'Đang hiển thị')}: <strong className="text-gray-800">{filtered.length}</strong></span>
            <span>•</span>
            <span>{t('myBooks.overdueBooks', 'Sách quá hạn')}: <strong className={overdueCount > 0 ? 'text-orange-600' : 'text-gray-800'}>{overdueCount}</strong></span>
          </div>
        </div>

        <div className={`rounded-2xl border p-4 shadow-sm ${
          finedTransactions.length > 0
            ? 'border-red-200 bg-red-50'
            : 'border-emerald-200 bg-emerald-50'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
              finedTransactions.length > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              {finedTransactions.length > 0 ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-bold ${finedTransactions.length > 0 ? 'text-red-900' : 'text-emerald-900'}`}>
                {finedTransactions.length > 0 ? t('myBooks.fineBlockTitle', 'Giao dịch có phí phạt') : t('myBooks.noFineBlockTitle', 'Không có phí phạt')}
              </p>
              <p className={`mt-1 text-sm ${finedTransactions.length > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                {finedTransactions.length > 0
                  ? `${finedTransactions.length} ${t('myBooks.finedTransactionsShort', 'giao dịch')} • ${totalFineAmount.toLocaleString('vi-VN')}đ`
                  : t('myBooks.noFineBlockDesc', 'Bạn chưa có giao dịch nào phát sinh phí phạt.')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tổng kết sách đã trả */}
      {activeTab === 'returned' && returned.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col items-center">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-full mb-2"><BookOpen size={20} /></div>
            <span className="text-2xl font-bold text-gray-900">{totalElements}</span>
            <span className="text-xs text-gray-500">{t('myBooks.totalTransactions', 'Tổng giao dịch')}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col items-center">
            <div className="p-2 bg-green-50 text-green-600 rounded-full mb-2"><CheckCircle size={20} /></div>
            <span className="text-2xl font-bold text-gray-900">{returned.length}</span>
            <span className="text-xs text-gray-500">{t('myBooks.returned', 'Đã trả')}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col items-center">
            <div className="p-2 bg-red-50 text-red-600 rounded-full mb-2"><AlertTriangle size={20} /></div>
            <span className="text-2xl font-bold text-gray-900">
              {returned.filter(t => t.fineAmount != null && t.fineAmount > 0).length}
            </span>
            <span className="text-xs text-gray-500">{t('myBooks.finedTimes', 'Lần bị phạt')}</span>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">{t('common.loading', 'Đang tải...')}</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {searchTerm.trim() ? noSearchResultMessage : emptyMessage}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((tx) => {
            const isHighlighted = tx.transactionId === highlightId;
            const cfg = statusConfig[tx.status];
            const days = tx.status === 'BORROWING' ? daysUntil(tx.dueDate) : null;
            const canReview = canReviewTransaction(tx);
            const isRenewableTransaction = tx.status === 'BORROWING';

            return (
              <div
                key={tx.transactionId}
                ref={isHighlighted ? highlightRef : null}
                onClick={() => tx.status === 'WAITING_FOR_PICKUP' ? setQrModal(tx) : setDetailModal(tx)}
                className={`bg-white border rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center gap-4 transition-shadow cursor-pointer ${
                  isHighlighted
                    ? 'border-yellow-300 shadow-md animate-highlight-pulse'
                    : 'border-gray-100 hover:shadow-sm hover:border-blue-200'
                }`}
              >
                <BookCover title={tx.publicationTitle} url={tx.coverImageUrl} />
                {/* Book info */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.color}`}>
                      {cfg.icon}{t(cfg.labelKey, cfg.fallback)}
                    </span>
                    {isHighlighted && (
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex-shrink-0">
                        {t('myBooks.fromNotification', 'Từ thông báo')}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-gray-900 truncate">{tx.publicationTitle}</h4>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{tx.barcode} · {tx.branch} - {tx.location}</p>
                  {canReview && (
                    <p className="mt-1 text-xs font-medium text-blue-600">
                      {t('myBooks.reviewRewardHint', 'Viết đánh giá để nhận 5 điểm đóng góp')}
                    </p>
                  )}
                  {Number(tx.depositAmount || 0) > 0 && (
                    <p className="mt-1 text-xs text-slate-500">
                      {t('myBooks.deposit', 'Tiền cọc')}: <strong>{formatCurrency(tx.depositAmount)}</strong>
                      {Number(tx.depositRefundAmount || 0) > 0 && (
                        <span className="text-emerald-700"> · {t('myBooks.depositRefund', 'hoàn')}: {formatCurrency(tx.depositRefundAmount)}</span>
                      )}
                      {Number(tx.additionalAmountDue || 0) > 0 && (
                        <span className="text-red-700"> · {t('myBooks.additionalDue', 'cần đóng thêm')}: {formatCurrency(tx.additionalAmountDue)}</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Dates */}
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500 flex-shrink-0">
                  {tx.status === 'WAITING_FOR_PICKUP' && (
                    <span>{t('myBooks.pickupDeadline', 'Hạn lấy')}: <strong className="text-yellow-700">
                      {new Date(tx.pickedUpDeadline).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN', {
                        hour: '2-digit', minute: '2-digit',
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                    </strong></span>
                  )}
                  {(tx.status === 'BORROWING' || tx.status === 'OVERDUE') && (
                    <>
                      <span>{t('myBooks.borrowedDate', 'Ngày mượn')}: <strong>{formatDate(tx.borrowedDate)}</strong></span>
                      <span>
                        {t('myBooks.dueDate', 'Hạn trả')}: <strong className={tx.status === 'OVERDUE' ? 'text-red-600' : days !== null && days <= 3 ? 'text-orange-600' : 'text-gray-800'}>
                          {new Date(tx.dueDate).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          {days !== null && ` (${days >= 0 ? `${t('myBooks.remaining', 'còn')} ${days} ${t('myBooks.days', 'ngày')}` : `${t('myBooks.overBy', 'quá')} ${-days} ${t('myBooks.days', 'ngày')}`})`}
                        </strong>
                      </span>
                    </>
                  )}
                  {(tx.status === 'RETURNED' || tx.status === 'CANCELLED') && (
                    <>
                      <span>{t('myBooks.borrowedDate', 'Ngày mượn')}: <strong>{formatDate(tx.borrowedDate)}</strong></span>
                      {tx.status === 'RETURNED' && <span>{t('myBooks.returnedDate', 'Ngày trả')}: <strong>{formatDate(tx.returnedDate)}</strong></span>}
                      {tx.fineAmount != null && tx.fineAmount > 0 && (
                        <span className="text-red-600 font-semibold">{t('myBooks.fine', 'Phí phạt còn lại')}: {formatCurrency(tx.fineAmount)}</span>
                      )}
                      {tx.status === 'RETURNED' && tx.reviewed && (
                        <span className="text-emerald-600 font-semibold">{t('myBooks.reviewed', 'Đã đánh giá')}</span>
                      )}
                    </>
                  )}
                </div>
                <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:min-w-[190px]">
                  {isRenewableTransaction && (
                    <div className="flex flex-col items-stretch gap-1.5">
                      <span className="text-center text-xs font-semibold text-slate-500">
                        {t('myBooks.renewalUsage', `Lượt gia hạn: ${tx.renewalCount}/${tx.maxRenewals}`)}
                      </span>
                      <button
                        type="button"
                        disabled={!tx.canRenew}
                        aria-disabled={!tx.canRenew}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (tx.canRenew) setRenewModal(tx);
                        }}
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
                      >
                        <RefreshCw size={16} className="mr-2" aria-hidden="true" />
                        {t('myBooks.renewAction', 'Gia hạn sách')}
                      </button>
                      {!tx.canRenew && (
                        <div className="min-h-4 text-center leading-tight">{renewalReason(tx)}</div>
                      )}
                    </div>
                  )}
                  {canReview && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        goToReview(tx);
                      }}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                      <PenLine size={16} className="mr-2" aria-hidden="true" />
                      {t('myBooks.reviewAction', 'Đánh giá')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {listTotalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-sm text-gray-500">
            {t('common.showing', 'Hiển thị')}{' '}
            <span className="font-semibold text-gray-800">
              {listPage * LIST_PAGE_SIZE + 1}–{Math.min((listPage + 1) * LIST_PAGE_SIZE, filtered.length)}
            </span>{' '}
            {t('common.in', 'trong')} <span className="font-semibold text-gray-800">{filtered.length}</span> {t('myBooks.transactions', 'giao dịch')}
          </p>
          <div className="inline-flex rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => setListPage(p => Math.max(0, p - 1))}
              disabled={listPage === 0}
              className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed border-r border-gray-200 transition-colors"
            >
              ‹ {t('common.previous', 'Trước')}
            </button>
            {Array.from({ length: listTotalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setListPage(i)}
                className={`px-3.5 py-2 text-sm font-medium border-r border-gray-200 last:border-r-0 transition-colors ${
                  listPage === i
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setListPage(p => Math.min(listTotalPages - 1, p + 1))}
              disabled={listPage === listTotalPages - 1}
              className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {t('common.next', 'Sau')} ›
            </button>
          </div>
        </div>
      )}

      {renewModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="renew-book-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <RefreshCw size={21} aria-hidden="true" />
              </div>
              <div>
                <h2 id="renew-book-title" className="text-lg font-bold text-slate-900">{t('myBooks.renewConfirmTitle', 'Xác nhận gia hạn sách')}</h2>
                <p className="mt-1 text-sm text-slate-600">{t('myBooks.renewConfirmIntro', 'Bạn có muốn gia hạn cuốn sách này?')}</p>
              </div>
            </div>
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{renewModal.publicationTitle}</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">{t('myBooks.currentDueDate', 'Hạn trả hiện tại')}</dt>
                  <dd className="font-semibold text-slate-800">{formatDate(renewModal.dueDate)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">{t('myBooks.newDueDate', 'Hạn trả mới dự kiến')}</dt>
                  <dd className="font-semibold text-indigo-700">{formatDate(addDays(renewModal.dueDate, defaultLoanDays).toISOString())}</dd>
                </div>
              </dl>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-amber-700">{t('myBooks.renewReservationNotice', 'Không thể gia hạn nếu sách đã có độc giả khác đặt trước.')}</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" disabled={isRenewing} onClick={() => setRenewModal(null)} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60">
                {t('common.cancel', 'Hủy')}
              </button>
              <button type="button" disabled={isRenewing} onClick={() => void confirmRenewal()} className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
                <RefreshCw size={16} className={`mr-2 ${isRenewing ? 'animate-spin' : ''}`} aria-hidden="true" />
                {isRenewing ? t('myBooks.renewing', 'Đang gia hạn...') : t('myBooks.renewConfirmAction', 'Xác nhận gia hạn')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Detail Modal — tất cả trạng thái trừ WAITING_FOR_PICKUP */}
      {detailModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDetailModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className={`p-5 ${
              detailModal.status === 'OVERDUE' ? 'bg-red-600' :
              detailModal.status === 'RETURNED' ? 'bg-blue-600' :
              detailModal.status === 'CANCELLED' ? 'bg-gray-500' : 'bg-green-600'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 min-w-0">
                  <BookCover title={detailModal.publicationTitle} url={detailModal.coverImageUrl} size="md" />
                  <div className="min-w-0">
                    <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white mb-2">
                      {statusConfig[detailModal.status].icon}{t(statusConfig[detailModal.status].labelKey, statusConfig[detailModal.status].fallback)}
                    </span>
                    <h3 className="text-white font-bold text-lg leading-tight">{detailModal.publicationTitle}</h3>
                  </div>
                </div>
                <button onClick={() => setDetailModal(null)} className="text-white/70 hover:text-white ml-3 text-xl leading-none">✕</button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Transaction info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Hash size={15} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500 w-28 flex-shrink-0">{t('myBooks.transactionId', 'Mã giao dịch')}</span>
                  <span className="font-mono font-semibold text-gray-900">#{detailModal.transactionId}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Printer size={15} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500 w-28 flex-shrink-0">Barcode</span>
                  <span className="font-mono font-medium text-gray-800">{detailModal.barcode}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin size={15} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500 w-28 flex-shrink-0">{t('myBooks.location', 'Vị trí')}</span>
                  <span className="font-medium text-gray-800">{detailModal.branch} — {detailModal.location}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                {detailModal.borrowedDate && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={15} className="text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500 w-28 flex-shrink-0">{t('myBooks.borrowedDate', 'Ngày mượn')}</span>
                    <span className="font-medium text-gray-800">{formatDate(detailModal.borrowedDate)}</span>
                  </div>
                )}
                {(detailModal.status === 'BORROWING' || detailModal.status === 'OVERDUE' || detailModal.status === 'RETURNED') && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock size={15} className={`flex-shrink-0 ${detailModal.status === 'OVERDUE' ? 'text-red-400' : 'text-gray-400'}`} />
                    <span className="text-gray-500 w-28 flex-shrink-0">{t('myBooks.dueDate', 'Hạn trả')}</span>
                    <span className={`font-semibold ${detailModal.status === 'OVERDUE' ? 'text-red-600' : 'text-gray-800'}`}>
                      {formatDate(detailModal.dueDate)}
                      {detailModal.status === 'OVERDUE' && (
                        <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          {t('myBooks.overBy', 'Quá')} {Math.abs(daysUntil(detailModal.dueDate))} {t('myBooks.days', 'ngày')}
                        </span>
                      )}
                      {detailModal.status === 'BORROWING' && daysUntil(detailModal.dueDate) >= 0 && daysUntil(detailModal.dueDate) <= 3 && (
                        <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                          {t('myBooks.remaining', 'Còn')} {daysUntil(detailModal.dueDate)} {t('myBooks.days', 'ngày')}
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {detailModal.status === 'RETURNED' && detailModal.returnedDate && (
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
                    <span className="text-gray-500 w-28 flex-shrink-0">{t('myBooks.returnedDate', 'Ngày trả')}</span>
                    <span className="font-medium text-gray-800">{formatDate(detailModal.returnedDate)}</span>
                  </div>
                )}
              </div>

              {detailModal.fineAmount != null && detailModal.fineAmount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-red-700">
                    <AlertTriangle size={15} className="flex-shrink-0" />
                    <span className="font-medium">{t('myBooks.fine', 'Phí phạt còn lại')}</span>
                  </div>
                  <span className="font-bold text-red-700 text-base">
                    {formatCurrency(detailModal.fineAmount)}
                  </span>
                </div>
              )}

              {Number(detailModal.depositAmount || 0) > 0 && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold text-blue-800">{t('myBooks.depositSettlement', 'Quyết toán tiền cọc')}</span>
                    <span className="font-bold text-blue-900">{formatCurrency(detailModal.depositAmount)}</span>
                  </div>
                  <div className="space-y-1 text-slate-700">
                    {Number(detailModal.grossFineAmount || 0) > 0 && (
                      <div className="flex justify-between gap-3">
                        <span>{t('myBooks.grossFine', 'Phạt gốc')}</span>
                        <strong>{formatCurrency(detailModal.grossFineAmount)}</strong>
                      </div>
                    )}
                    {Number(detailModal.depositAppliedAmount || 0) > 0 && (
                      <div className="flex justify-between gap-3">
                        <span>{t('myBooks.depositApplied', 'Đã cấn trừ cọc')}</span>
                        <strong className="text-amber-700">{formatCurrency(detailModal.depositAppliedAmount)}</strong>
                      </div>
                    )}
                    {Number(detailModal.depositRefundAmount || 0) > 0 && (
                      <div className="flex justify-between gap-3">
                        <span>{t('myBooks.depositRefund', 'Hoàn lại')}</span>
                        <strong className="text-emerald-700">{formatCurrency(detailModal.depositRefundAmount)}</strong>
                      </div>
                    )}
                    {Number(detailModal.additionalAmountDue || 0) > 0 && (
                      <div className="flex justify-between gap-3">
                        <span>{t('myBooks.additionalDue', 'Cần đóng thêm')}</span>
                        <strong className="text-red-700">{formatCurrency(detailModal.additionalAmountDue)}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {canReviewTransaction(detailModal) && (
                <button
                  onClick={() => goToReview(detailModal)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors mt-2 flex items-center justify-center"
                >
                  <PenLine size={16} className="mr-2" />
                  {t('myBooks.reviewAction', 'Đánh giá')} (+5 {t('myBooks.contributionPoints', 'điểm đóng góp')})
                </button>
              )}

              <button
                onClick={() => setDetailModal(null)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors mt-2"
              >
                {t('common.close', 'Đóng')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* QR Modal cho WAITING_FOR_PICKUP — portal ra document.body để tránh bị clip bởi parent */}
      {qrModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-auto overflow-hidden animate-fade-in-up">
            <div className="bg-blue-600 p-6 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-white">{t('myBooks.borrowSlip', 'Phiếu mượn sách')}</h2>
              <p className="text-blue-100 mt-2 text-sm">{t('myBooks.qrInstruction', 'Đưa mã QR này cho thủ thư để nhận sách.')}</p>
            </div>

            <div className="p-8">
              <div className="flex justify-center mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <QRCode value={qrModal.transactionId} size={200} />
              </div>

              <div className="space-y-3 mb-8">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500 font-medium">{t('myBooks.transactionId', 'Mã giao dịch')}</span>
                    <span className="font-mono font-bold text-gray-900">#{qrModal.transactionId}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 leading-tight mb-2">{qrModal.publicationTitle}</h4>
                  <p className="text-sm text-gray-600 flex items-center gap-1.5 mb-1">
                    <Layers size={14} className="text-gray-400" /> {t('myBooks.location', 'Vị trí')}: <span className="font-medium text-gray-800">{qrModal.branch} - {qrModal.location}</span>
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-1.5">
                    <Printer size={14} className="text-gray-400" /> Barcode: <span className="font-medium text-gray-800">{qrModal.barcode}</span>
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                  <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-sm font-bold text-red-800 mb-1">{t('myBooks.pickupDeadlineTitle', 'Hạn chót đến lấy sách')}</span>
                    <span className="text-sm text-red-700">
                      {new Date(qrModal.pickedUpDeadline).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN', {
                        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setQrModal(null)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3 rounded-xl shadow-md"
              >
                {t('common.close', 'Đóng')}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MyBooksPage;

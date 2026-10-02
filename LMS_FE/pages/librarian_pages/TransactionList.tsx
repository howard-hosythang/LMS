import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BookOpenCheck,
  Clock,
  CreditCard,
  Filter,
  Loader2,
  Pencil,
  RefreshCcw,
  Search,
  Star,
  StickyNote,
  X,
} from 'lucide-react';
import debounce from 'lodash/debounce';
import { useSearchParams } from 'react-router-dom';
import librarianDashboardService, { DashboardSummaryResponse } from '../../api/librarianDashboardService';
import transactionsService, {
  FinePaymentStatus,
  LibrarianTransaction,
  TransactionNote,
  TransactionStatus,
} from '../../api/transactionsService';
import ReaderProfileDrawer, { ReaderRef } from '../../components/librarian_pages/ReaderProfileDrawer';
import { useAppDialog } from '../../contexts/AppDialogContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';
import fineService, { Fine } from '../../api/fineService';
import FineAdjustmentDialog from '../../components/librarian_pages/FineAdjustmentDialog';
import { getFriendlyErrorMessage } from '../../utils/errorMessages';

const copyText = {
  vi: {
    saveNoteFailed: 'Không lưu được ghi chú. Vui lòng thử lại.',
    saveNoteFailedMigration: 'Không lưu được ghi chú. Kiểm tra backend đã chạy migration V10 và thử lại.',
    deleteNoteFailed: 'Không xóa được ghi chú. Vui lòng thử lại.',
    deleteNoteFailedMigration: 'Không xóa được ghi chú. Kiểm tra backend đã chạy migration V10 và thử lại.',
    waitingPickup: 'Chờ lấy sách',
    borrowing: 'Đang mượn',
    overdue: 'Quá hạn',
    returned: 'Đã trả',
    cancelled: 'Đã hủy',
    unpaid: 'Chưa thu',
    paid: 'Đã thu',
    needsCheck: 'Cần kiểm tra',
    title: 'Lịch sử giao dịch',
    subtitle: 'Theo dõi toàn bộ giao dịch mượn trả, phí phạt và các trường hợp cần thủ thư xử lý.',
    refresh: 'Làm mới',
    pickupDesc: 'Cần xác nhận bàn giao tại quầy.',
    overdueDesc: 'Cần nhắc trả hoặc xử lý phí phạt.',
    reservationTitle: 'Đặt trước đang chờ',
    reservationDesc: 'Theo dõi hàng chờ và sách sẵn sàng.',
    unpaidFineTitle: 'Phí chưa thu',
    total: 'Tổng',
    filters: 'Bộ lọc giao dịch',
    searchPlaceholder: 'Tên, MSSV, mã giao dịch hoặc barcode...',
    allStatuses: 'Tất cả trạng thái',
    allFines: 'Tất cả phí phạt',
    borrowedFrom: 'Mượn từ ngày',
    borrowedTo: 'Mượn đến ngày',
    newest: 'Mới nhất',
    oldest: 'Cũ nhất',
    highestFine: 'Phí phạt cao nhất',
    lowestFine: 'Phí phạt thấp nhất',
    nearestDue: 'Hạn trả gần nhất',
    newestBorrowed: 'Ngày mượn mới nhất',
    clearFilters: 'Xóa lọc',
    txId: 'Mã GD/Barcode',
    student: 'Sinh viên',
    borrowedDate: 'Ngày mượn',
    dueDate: 'Hạn trả',
    returnedDate: 'Ngày trả',
    fine: 'Phí phạt',
    deposit: 'Cọc',
    grossFine: 'Phạt gốc',
    appliedDeposit: 'Cấn cọc',
    refundedDeposit: 'Hoàn cọc',
    additionalDue: 'Thu thêm',
    bookReturnStatus: 'Trạng thái trả sách',
    fineStatus: 'Trạng thái trả phí',
    depositRefunded: 'Đã hoàn cọc',
    settled: 'Đã tất toán',
    tracking: 'Đang theo dõi',
    note: 'Ghi chú',
    loadingTransactions: 'Đang tải giao dịch...',
    noTransactions: 'Không có giao dịch phù hợp với bộ lọc hiện tại.',
    noFine: 'Không có phí',
    notePlaceholder: 'Ghi chú nội bộ cho giao dịch...',
    saving: 'Đang lưu...',
    save: 'Lưu',
    cancel: 'Hủy',
    markedImportant: 'Đã đánh dấu quan trọng',
    noNote: 'Chưa có ghi chú',
    edit: 'Sửa',
    delete: 'Xóa',
    noResults: 'Không có kết quả',
    showing: 'Hiển thị',
    in: 'trong',
    transactions: 'giao dịch',
    overdueReturn: 'Quá hạn',
    damagedBook: 'Hỏng sách',
    lostBook: 'Mất sách',
    renew: 'Gia hạn',
    renewConfirmTitle: 'Xác nhận gia hạn sách',
    renewConfirmMessage: 'Hạn trả sẽ được cộng thêm theo chính sách hiện hành. Hệ thống sẽ tự kiểm tra hàng đợi đặt trước và phí phạt.',
    renewSuccess: 'Đã gia hạn giao dịch thành công',
    renewFailed: 'Không thể gia hạn giao dịch này',
  },
  en: {
    saveNoteFailed: 'Unable to save note. Please try again.',
    saveNoteFailedMigration: 'Unable to save note. Check that backend migration V10 has run and try again.',
    deleteNoteFailed: 'Unable to delete note. Please try again.',
    deleteNoteFailedMigration: 'Unable to delete note. Check that backend migration V10 has run and try again.',
    waitingPickup: 'Waiting for pickup',
    borrowing: 'Borrowing',
    overdue: 'Overdue',
    returned: 'Returned',
    cancelled: 'Cancelled',
    unpaid: 'Unpaid',
    paid: 'Paid',
    needsCheck: 'Needs review',
    title: 'Transaction History',
    subtitle: 'Track loan and return transactions, fines, and cases that need librarian action.',
    refresh: 'Refresh',
    pickupDesc: 'Needs counter handoff confirmation.',
    overdueDesc: 'Needs return reminder or fine handling.',
    reservationTitle: 'Pending reservations',
    reservationDesc: 'Monitor queues and ready books.',
    unpaidFineTitle: 'Unpaid fines',
    total: 'Total',
    filters: 'Transaction filters',
    searchPlaceholder: 'Name, student ID, transaction ID, or barcode...',
    allStatuses: 'All statuses',
    allFines: 'All fines',
    borrowedFrom: 'Borrowed from',
    borrowedTo: 'Borrowed to',
    newest: 'Newest',
    oldest: 'Oldest',
    highestFine: 'Highest fine',
    lowestFine: 'Lowest fine',
    nearestDue: 'Nearest due date',
    newestBorrowed: 'Newest borrowed date',
    clearFilters: 'Clear filters',
    txId: 'Tx ID/Barcode',
    student: 'Student',
    borrowedDate: 'Borrowed date',
    dueDate: 'Due date',
    returnedDate: 'Returned date',
    fine: 'Fine',
    deposit: 'Deposit',
    grossFine: 'Gross fine',
    appliedDeposit: 'Applied',
    refundedDeposit: 'Refund',
    additionalDue: 'Extra due',
    bookReturnStatus: 'Book status',
    fineStatus: 'Fine status',
    depositRefunded: 'Deposit refunded',
    settled: 'Settled',
    tracking: 'Tracking',
    note: 'Note',
    loadingTransactions: 'Loading transactions...',
    noTransactions: 'No transactions match the current filters.',
    noFine: 'No fine',
    notePlaceholder: 'Internal note for this transaction...',
    saving: 'Saving...',
    save: 'Save',
    cancel: 'Cancel',
    markedImportant: 'Marked important',
    noNote: 'No note',
    edit: 'Edit',
    delete: 'Delete',
    noResults: 'No results',
    showing: 'Showing',
    in: 'in',
    transactions: 'transactions',
    overdueReturn: 'Overdue',
    damagedBook: 'Damaged book',
    lostBook: 'Lost book',
    renew: 'Renew',
    renewConfirmTitle: 'Confirm book renewal',
    renewConfirmMessage: 'The due date will be extended using the current policy. The system will verify reservation queues and unpaid fines.',
    renewSuccess: 'Transaction renewed successfully',
    renewFailed: 'This transaction cannot be renewed',
  },
};

const STATUS_CONFIG: Record<TransactionStatus, { label: { vi: string; en: string }; className: string }> = {
  WAITING_FOR_PICKUP: { label: { vi: 'Chờ lấy sách', en: 'Waiting for pickup' }, className: 'bg-amber-50 text-amber-700 border-amber-100' },
  BORROWING: { label: { vi: 'Đang mượn', en: 'Borrowing' }, className: 'bg-blue-50 text-blue-700 border-blue-100' },
  OVERDUE: { label: { vi: 'Quá hạn', en: 'Overdue' }, className: 'bg-red-50 text-red-700 border-red-100' },
  RETURNED: { label: { vi: 'Đã trả', en: 'Returned' }, className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  CANCELLED: { label: { vi: 'Đã hủy', en: 'Cancelled' }, className: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const FINE_STATUS_CONFIG: Record<FinePaymentStatus, { label: { vi: string; en: string }; className: string }> = {
  UNPAID: { label: { vi: 'Chưa thu', en: 'Unpaid' }, className: 'bg-red-50 text-red-700 border-red-100' },
  PAID: { label: { vi: 'Đã thu', en: 'Paid' }, className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
};

const UNKNOWN_FINE_STATUS = {
  label: { vi: 'Cần kiểm tra', en: 'Needs review' },
  className: 'bg-amber-50 text-amber-700 border-amber-100',
};

const SETTLED_STATUS = {
  label: { vi: 'Đã tất toán', en: 'Settled' },
  className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const REFUNDED_STATUS = {
  label: { vi: 'Đã hoàn cọc', en: 'Deposit refunded' },
  className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const TRACKING_STATUS = {
  label: { vi: 'Đang theo dõi', en: 'Tracking' },
  className: 'bg-slate-100 text-slate-600 border-slate-200',
};

type SortField = 'createdAt' | 'borrowedDate' | 'returnedDate' | 'dueDate' | 'fineAmount';
type StatusFilter = TransactionStatus | 'ALL';
type FineStatusFilter = FinePaymentStatus | 'ALL';

const PAGE_SIZE = 15;

const SortIcon = ({ field, sortBy, sortDir }: { field: SortField; sortBy: SortField; sortDir: 'ASC' | 'DESC' }) => {
  if (sortBy !== field) return <ArrowUpDown size={13} className="text-slate-400" />;
  return sortDir === 'ASC' ? <ArrowUp size={13} className="text-secondary" /> : <ArrowDown size={13} className="text-secondary" />;
};

const formatDate = (value: string | null, language: 'vi' | 'en') => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateTime = (value: string | null, language: 'vi' | 'en') => {
  if (!value) return '-';
  return new Date(value).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const librarianLine = (name?: string | null, code?: string | null) => {
  if (!name && !code) return null;
  return `${name || 'Thủ thư'}${code ? ` (${code})` : ''}`;
};

const formatCurrency = (amount: number | null | undefined) => {
  if (!amount) return '-';
  return amount.toLocaleString('vi-VN') + 'đ';
};

const formatMoneySnapshot = (amount: number | null | undefined) => {
  return Number(amount || 0).toLocaleString('vi-VN') + 'đ';
};

const hasFineAmount = (amount: number | null | undefined) => Number(amount || 0) > 0;

const fineTypeLabel = (types: string | null | undefined, c: typeof copyText.vi) => {
  if (!types) return '';
  return types
    .split(',')
    .map(type => type.trim())
    .filter(Boolean)
    .map(type => ({
      DAMAGED_BOOK: c.damagedBook,
      LOST_BOOK: c.lostBook,
      OVERDUE_RETURN: c.overdueReturn,
    }[type] || type))
    .join(', ');
};

const depositStatusLabel = (status: string | null | undefined, language: 'vi' | 'en') => {
  if (!status) return '-';
  const labels: Record<string, { vi: string; en: string }> = {
    NOT_REQUIRED: { vi: 'Không yêu cầu', en: 'Not required' },
    COLLECTED: { vi: 'Đã thu', en: 'Collected' },
    REFUNDED: { vi: 'Đã hoàn', en: 'Refunded' },
    APPLIED_TO_FINE: { vi: 'Đã cấn phạt', en: 'Applied' },
    ADDITIONAL_DUE: { vi: 'Cần thu thêm', en: 'Extra due' },
  };
  return labels[status]?.[language] || status;
};

const settlementStatus = (
  tx: LibrarianTransaction,
  hasFine: boolean,
  fineCfg: typeof UNKNOWN_FINE_STATUS | typeof SETTLED_STATUS | null
) => {
  if (Number(tx.depositRefundAmount || 0) > 0) return REFUNDED_STATUS;
  if (Number(tx.additionalAmountDue || 0) > 0) return fineCfg || UNKNOWN_FINE_STATUS;
  if (hasFine || Number(tx.grossFineAmount || 0) > 0) return fineCfg || SETTLED_STATUS;
  if (tx.status === 'RETURNED') return SETTLED_STATUS;
  return TRACKING_STATUS;
};

const TransactionList = () => {
  const [editableFines, setEditableFines] = useState<Fine[] | null>(null);
  const [loadingFinesId, setLoadingFinesId] = useState<string | null>(null);
  const { language } = useLanguage();
  const c = copyText[language];
  const dialog = useAppDialog();
  const [searchParams] = useSearchParams();
  const [summary, setSummary] = useState<DashboardSummaryResponse['data'] | null>(null);
  const [transactions, setTransactions] = useState<LibrarianTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [fineStatus, setFineStatus] = useState<FineStatusFilter>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [noteError, setNoteError] = useState('');
  const [noteThreads, setNoteThreads] = useState<Record<string, TransactionNote[]>>({});
  const [selectedReader, setSelectedReader] = useState<ReaderRef | null>(null);
  const [renewingTransactionId, setRenewingTransactionId] = useState<string | null>(null);
  const highlightedTransactionId = searchParams.get('highlight');

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);
      const response = await librarianDashboardService.getSummary();
      if (response.code === 200) setSummary(response.data);
    } catch (error) {
      console.error('Failed to load transaction summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await transactionsService.getAllTransactions(
        currentPage,
        PAGE_SIZE,
        keyword || undefined,
        status,
        fineStatus,
        dateFrom,
        dateTo,
        sortBy,
        sortDir,
      );
      if (res.code === 200 && res.data) {
        setTransactions(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
        setTotalElements(res.data.totalElements || 0);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setTransactions([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useMemo(
    () => debounce((kw: string) => {
      setKeyword(kw);
      setCurrentPage(0);
    }, 400),
    [],
  );

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    const urlKeyword = searchParams.get('keyword') || '';
    const urlStatus = searchParams.get('status') as StatusFilter | null;
    const urlFineStatus = searchParams.get('fineStatus') as FineStatusFilter | null;

    debouncedSearch.cancel();
    setSearchInput(urlKeyword);
    setKeyword(urlKeyword);
    if (urlStatus && (urlStatus === 'ALL' || Object.keys(STATUS_CONFIG).includes(urlStatus))) {
      setStatus(urlStatus);
    }
    if (urlFineStatus && (urlFineStatus === 'ALL' || Object.keys(FINE_STATUS_CONFIG).includes(urlFineStatus))) {
      setFineStatus(urlFineStatus);
    }
    setCurrentPage(0);
  }, [searchParams, debouncedSearch]);

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [currentPage, keyword, status, fineStatus, dateFrom, dateTo, sortBy, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir(d => d === 'DESC' ? 'ASC' : 'DESC');
    } else {
      setSortBy(field);
      setSortDir('DESC');
    }
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    if (page >= 0 && page < totalPages) setCurrentPage(page);
  };

  const handleClearFilters = () => {
    debouncedSearch.cancel();
    setSearchInput('');
    setKeyword('');
    setStatus('ALL');
    setFineStatus('ALL');
    setDateFrom('');
    setDateTo('');
    setSortBy('createdAt');
    setSortDir('DESC');
    setCurrentPage(0);
  };

  const focusQueue = (nextStatus: StatusFilter, nextFineStatus: FineStatusFilter = 'ALL') => {
    setStatus(nextStatus);
    setFineStatus(nextFineStatus);
    setCurrentPage(0);
  };

  const openNoteEditor = async (tx: LibrarianTransaction) => {
    setEditingNoteId(tx.transactionId);
    setNoteDraft('');
    setNoteError('');
    try {
      const res = await transactionsService.getNotes(tx.transactionId);
      if (res.code === 200) {
        setNoteThreads(prev => ({ ...prev, [tx.transactionId]: res.data || [] }));
      }
    } catch (error) {
      console.error('Failed to load transaction notes:', error);
    }
  };

  const saveNote = async (transactionId: string) => {
    setSavingNoteId(transactionId);
    setNoteError('');
    try {
      const res = await transactionsService.upsertNote(transactionId, {
        important: true,
        note: noteDraft.trim(),
      });
      if (res.code === 200) {
        setTransactions(prev => prev.map(tx => tx.transactionId === transactionId
          ? { ...tx, important: true, note: [tx.note, `${res.data.librarianName || 'Thủ thư'}${res.data.librarianCode ? ` (${res.data.librarianCode})` : ''}: ${res.data.note}`].filter(Boolean).join('\n') }
          : tx
        ));
        setNoteThreads(prev => ({
          ...prev,
          [transactionId]: [...(prev[transactionId] || []), res.data],
        }));
        setEditingNoteId(null);
        setNoteDraft('');
        await fetchData();
      } else {
        setNoteError(c.saveNoteFailed);
      }
    } catch (error) {
      console.error('Failed to save transaction note:', error);
      setNoteError(c.saveNoteFailedMigration);
    } finally {
      setSavingNoteId(null);
    }
  };

  const deleteNote = async (transactionId: string, noteId?: string) => {
    setSavingNoteId(transactionId);
    setNoteError('');
    try {
      const res = await transactionsService.deleteNote(transactionId, noteId);
      if (res.code === 200) {
        if (noteId) {
          setNoteThreads(prev => ({
            ...prev,
            [transactionId]: (prev[transactionId] || []).filter(note => note.noteId !== noteId),
          }));
        } else {
          setTransactions(prev => prev.map(tx => tx.transactionId === transactionId
            ? { ...tx, important: false, note: null }
            : tx
          ));
          setNoteThreads(prev => ({ ...prev, [transactionId]: [] }));
          if (editingNoteId === transactionId) setEditingNoteId(null);
        }
        await fetchData();
      } else {
        setNoteError(c.deleteNoteFailed);
      }
    } catch (error) {
      console.error('Failed to delete transaction note:', error);
      setNoteError(c.deleteNoteFailedMigration);
    } finally {
      setSavingNoteId(null);
    }
  };

  const renewTransaction = async (tx: LibrarianTransaction) => {
    const confirmed = await dialog.confirm({
      title: c.renewConfirmTitle,
      message: c.renewConfirmMessage,
      confirmText: c.renew,
      variant: 'warning',
    });
    if (!confirmed) return;
    setRenewingTransactionId(tx.transactionId);
    try {
      const response = await transactionsService.renew(tx.transactionId);
      toast.success(response.message || c.renewSuccess);
      await fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || c.renewFailed);
    } finally {
      setRenewingTransactionId(null);
    }
  };

  const openFineAdjustment = async (tx: LibrarianTransaction) => {
    setLoadingFinesId(tx.transactionId);
    try {
      const response = await fineService.getStudentFines(tx.studentId);
      const fines = response.data.fines.filter(fine => fine.transactionId === tx.transactionId && fine.status === 'UNPAID');
      if (fines.length) setEditableFines(fines);
      else toast.error(language === 'en' ? 'No unpaid fines remain. Refresh the list.' : 'Không còn phí chưa thanh toán. Vui lòng làm mới danh sách.');
    } catch (error) { toast.error(getFriendlyErrorMessage(error, language)); }
    finally { setLoadingFinesId(null); }
  };

  const actionCards = [
    {
      title: c.waitingPickup,
      count: summary?.pendingActions.waitingForPickup || 0,
      description: c.pickupDesc,
      icon: BookOpenCheck,
      className: 'bg-amber-50 text-amber-700 border-amber-100',
      onClick: () => focusQueue('WAITING_FOR_PICKUP'),
    },
    {
      title: c.overdue,
      count: summary?.pendingActions.overdueTransactions || 0,
      description: c.overdueDesc,
      icon: AlertTriangle,
      className: 'bg-red-50 text-red-700 border-red-100',
      onClick: () => focusQueue('OVERDUE'),
    },
    {
      title: c.reservationTitle,
      count: summary?.pendingActions.reservationsPending || 0,
      description: c.reservationDesc,
      icon: Clock,
      className: 'bg-blue-50 text-blue-700 border-blue-100',
      onClick: () => focusQueue('ALL'),
    },
    {
      title: c.unpaidFineTitle,
      count: summary?.fineSummary.unpaidFineCount || 0,
      description: `${c.total} ${formatCurrency(summary?.fineSummary.totalUnpaidAmount || 0)}.`,
      icon: CreditCard,
      className: 'bg-purple-50 text-purple-700 border-purple-100',
      onClick: () => focusQueue('ALL', 'UNPAID'),
    },
  ];

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden p-4 sm:p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{c.title}</h1>
          <p className="text-slate-500">
            {c.subtitle}
          </p>
        </div>
        <button
          onClick={() => {
            fetchSummary();
            fetchData();
          }}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2"
        >
          <RefreshCcw size={16} /> {c.refresh}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {actionCards.map((card) => (
          <button
            key={card.title}
            onClick={card.onClick}
            className="bg-white border border-slate-200 rounded-xl p-5 text-left hover:shadow-md hover:border-blue-200 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${card.className}`}>
                <card.icon size={22} />
              </div>
              <span className="text-3xl font-bold text-slate-900">
                {summaryLoading ? <Loader2 className="w-7 h-7 animate-spin text-slate-300" /> : card.count}
              </span>
            </div>
            <h2 className="font-semibold text-slate-900 mt-4">{card.title}</h2>
            <p className="text-sm text-slate-500 mt-1">{card.description}</p>
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Filter size={16} /> {c.filters}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-6 relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              value={searchInput}
              onChange={e => {
                setSearchInput(e.target.value);
                debouncedSearch(e.target.value);
              }}
              placeholder={c.searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  debouncedSearch('');
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter);
              setCurrentPage(0);
            }}
            className="lg:col-span-3 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500"
          >
            <option value="ALL">{c.allStatuses}</option>
            <option value="WAITING_FOR_PICKUP">{c.waitingPickup}</option>
            <option value="BORROWING">{c.borrowing}</option>
            <option value="OVERDUE">{c.overdue}</option>
            <option value="RETURNED">{c.returned}</option>
            <option value="CANCELLED">{c.cancelled}</option>
          </select>

          <select
            value={fineStatus}
            onChange={(e) => {
              setFineStatus(e.target.value as FineStatusFilter);
              setCurrentPage(0);
            }}
            className="lg:col-span-3 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500"
          >
            <option value="ALL">{c.allFines}</option>
            <option value="UNPAID">{c.unpaid}</option>
            <option value="PAID">{c.paid}</option>
          </select>

          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-500 mb-1">{c.borrowedFrom}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(0);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
              aria-label={c.borrowedFrom}
            />
          </div>
          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-500 mb-1">{c.borrowedTo}</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(0);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
              aria-label={c.borrowedTo}
            />
          </div>

          <select
            value={`${sortBy}:${sortDir}`}
            onChange={(e) => {
              const [nextSortBy, nextSortDir] = e.target.value.split(':') as [SortField, 'ASC' | 'DESC'];
              setSortBy(nextSortBy);
              setSortDir(nextSortDir);
              setCurrentPage(0);
            }}
            className="lg:col-span-4 self-end px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500"
          >
            <option value="createdAt:DESC">{c.newest}</option>
            <option value="createdAt:ASC">{c.oldest}</option>
            <option value="fineAmount:DESC">{c.highestFine}</option>
            <option value="fineAmount:ASC">{c.lowestFine}</option>
            <option value="dueDate:ASC">{c.nearestDue}</option>
            <option value="borrowedDate:DESC">{c.newestBorrowed}</option>
          </select>

          <button
            onClick={handleClearFilters}
            className="lg:col-span-2 self-end px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {c.clearFilters}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-hidden">
          <table className="w-full table-fixed text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="w-[9%] px-3 py-4 font-semibold">{c.txId}</th>
                <th className="w-[17%] px-3 py-4 font-semibold">{c.student}</th>
                <th
                  className="w-[11%] px-3 py-4 font-semibold cursor-pointer hover:text-slate-700 select-none"
                  onClick={() => handleSort('borrowedDate')}
                >
                  <div className="flex items-center gap-1">
                    {c.borrowedDate} <SortIcon field="borrowedDate" sortBy={sortBy} sortDir={sortDir} />
                  </div>
                </th>
                <th
                  className="w-[9%] px-3 py-4 font-semibold cursor-pointer hover:text-slate-700 select-none"
                  onClick={() => handleSort('dueDate')}
                >
                  <div className="flex items-center gap-1">
                    {c.dueDate} <SortIcon field="dueDate" sortBy={sortBy} sortDir={sortDir} />
                  </div>
                </th>
                <th
                  className="w-[9%] px-3 py-4 font-semibold cursor-pointer hover:text-slate-700 select-none"
                  onClick={() => handleSort('returnedDate')}
                >
                  <div className="flex items-center gap-1">
                    {c.returnedDate} <SortIcon field="returnedDate" sortBy={sortBy} sortDir={sortDir} />
                  </div>
                </th>
                <th
                  className="w-[10%] px-3 py-4 font-semibold cursor-pointer hover:text-slate-700 select-none"
                  onClick={() => handleSort('fineAmount')}
                >
                  <div className="flex items-center gap-1">
                    {c.fine} <SortIcon field="fineAmount" sortBy={sortBy} sortDir={sortDir} />
                  </div>
                </th>
                <th className="w-[10%] px-3 py-4 font-semibold">{c.deposit}</th>
                <th className="w-[8%] px-3 py-4 font-semibold">{c.bookReturnStatus}</th>
                <th className="w-[8%] px-3 py-4 font-semibold">{c.fineStatus}</th>
                <th className="w-[9%] px-3 py-4 font-semibold">{c.note}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-10 text-center">
                    <div className="flex items-center justify-center gap-3 text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      {c.loadingTransactions}
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-10 text-center text-slate-400">
                    {c.noTransactions}
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const statusCfg = STATUS_CONFIG[tx.status] ?? { label: { vi: tx.status, en: tx.status }, className: 'bg-gray-100 text-gray-500 border-gray-100' };
                  const hasFine = hasFineAmount(tx.fineAmount);
                  const fineCfg = tx.finePaymentStatus
                    ? FINE_STATUS_CONFIG[tx.finePaymentStatus]
                    : hasFine
                      ? UNKNOWN_FINE_STATUS
                      : null;
                  const paymentStatusCfg = settlementStatus(tx, hasFine, fineCfg);
                  return (
                    <tr key={tx.transactionId} className={`transition-colors hover:bg-slate-50 ${tx.important ? 'bg-amber-50/30' : ''} ${highlightedTransactionId === tx.transactionId ? 'bg-blue-50 ring-2 ring-inset ring-blue-200' : ''}`}>
                      <td className="px-3 py-4 text-xs font-mono text-slate-500 align-top">
                        <span className="block break-all text-slate-600" title={tx.transactionId}>{tx.transactionId}</span>
                        {tx.barcode && (
                          <span className="mt-1 block break-all text-slate-400" title={tx.barcode}>{tx.barcode}</span>
                        )}
                      </td>
                      <td className="px-3 py-4 align-top">
                        <button
                          type="button"
                          onClick={() => setSelectedReader({ userId: tx.userId, studentId: tx.studentId, fullName: tx.fullName })}
                          className="block max-w-full truncate text-left text-sm font-medium text-slate-900 hover:text-blue-600"
                          title={tx.fullName || '-'}
                        >
                          {tx.fullName || '-'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedReader({ userId: tx.userId, studentId: tx.studentId, fullName: tx.fullName })}
                          className="block max-w-full truncate text-left text-xs text-slate-500 hover:text-blue-600"
                        >
                          {tx.studentId || '-'}
                        </button>
                        <div className="mt-1 space-y-0.5 text-[11px] text-slate-400">
                          {tx.email && <a href={`mailto:${tx.email}`} className="block truncate hover:text-blue-600">{tx.email}</a>}
                          {tx.phoneNumber && <a href={`tel:${tx.phoneNumber}`} className="block truncate hover:text-blue-600">{tx.phoneNumber}</a>}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-slate-600 align-top">
                        <div>{formatDate(tx.borrowedDate, language)}</div>
                        {librarianLine(tx.issueLibrarianName, tx.issueLibrarianCode) && (
                          <div className="mt-1 line-clamp-2 text-[11px] text-slate-400">
                            {language === 'vi' ? 'Cho mượn bởi' : 'Issued by'} {librarianLine(tx.issueLibrarianName, tx.issueLibrarianCode)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-4 text-sm text-slate-600 align-top">{formatDate(tx.dueDate, language)}</td>
                      <td className="px-3 py-4 text-sm text-slate-600 align-top">
                        <div>{formatDate(tx.returnedDate, language)}</div>
                        {librarianLine(tx.returnLibrarianName, tx.returnLibrarianCode) && (
                          <div className="mt-1 line-clamp-2 text-[11px] text-slate-400">
                            {language === 'vi' ? 'Nhận trả bởi' : 'Returned to'} {librarianLine(tx.returnLibrarianName, tx.returnLibrarianCode)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-4 text-sm align-top">
                        {hasFine ? (
                          <div className="space-y-1">
                            <div className="text-red-600 font-semibold">{formatCurrency(tx.fineAmount)}</div>
                            {tx.finePaymentStatus === 'UNPAID' && <button type="button"
                              onClick={() => void openFineAdjustment(tx)} disabled={loadingFinesId === tx.transactionId}
                              className="inline-flex items-center gap-1 rounded border border-blue-200 px-2 py-1.5 text-xs font-medium text-blue-700 disabled:opacity-50">
                              <Pencil size={13} aria-hidden="true" />{language === 'en' ? 'Edit fee' : 'Chỉnh sửa phí'}
                            </button>}
                            <div className="flex flex-wrap items-center gap-1">
                              {tx.fineTypes && (
                                <span className="text-[11px] text-slate-500">{fineTypeLabel(tx.fineTypes, c)}</span>
                              )}
                            </div>
                            {librarianLine(tx.finePaidByLibrarianName, tx.finePaidByLibrarianCode) && (
                              <div className="text-[11px] text-slate-400">
                                {language === 'vi' ? 'Thu bởi' : 'Collected by'} {librarianLine(tx.finePaidByLibrarianName, tx.finePaidByLibrarianCode)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-xs align-top">
                        <div className="space-y-1 leading-tight">
                          <div className="font-bold text-blue-800">{formatMoneySnapshot(tx.depositAmount)}</div>
                          <div className="text-[11px] text-slate-500">{depositStatusLabel(tx.depositStatus, language)}</div>
                          {Number(tx.grossFineAmount || 0) > 0 && (
                            <div className="text-slate-500">{c.grossFine}: {formatCurrency(tx.grossFineAmount)}</div>
                          )}
                          {Number(tx.depositAppliedAmount || 0) > 0 && (
                            <div className="text-amber-700">{c.appliedDeposit}: {formatCurrency(tx.depositAppliedAmount)}</div>
                          )}
                          {Number(tx.depositRefundAmount || 0) > 0 && (
                            <div className="text-emerald-700">{c.refundedDeposit}: {formatCurrency(tx.depositRefundAmount)}</div>
                          )}
                          {Number(tx.additionalAmountDue || 0) > 0 && (
                            <div className="font-semibold text-red-700">{c.additionalDue}: {formatCurrency(tx.additionalAmountDue)}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <div className="flex flex-col items-start gap-2">
                          <span className={`inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full border text-xs font-semibold ${statusCfg.className}`}>
                            {statusCfg.label[language]}
                          </span>
                          {tx.status === 'BORROWING' && (
                            <button
                              type="button"
                              onClick={() => void renewTransaction(tx)}
                              disabled={renewingTransactionId === tx.transactionId}
                              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <RefreshCcw size={14} aria-hidden="true" className={renewingTransactionId === tx.transactionId ? 'animate-spin' : ''} />
                              {c.renew}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <span className={`inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full border text-xs font-semibold ${paymentStatusCfg.className}`}>
                          {paymentStatusCfg.label[language]}
                        </span>
                      </td>
                      <td className="px-3 py-4 align-top">
                        {editingNoteId === tx.transactionId ? (
                          <div className="space-y-2">
                            {(noteThreads[tx.transactionId] || []).length > 0 && (
                              <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-2 space-y-2">
                                {noteThreads[tx.transactionId].map(note => (
                                  <div key={note.noteId} className="rounded-lg bg-white border border-slate-100 px-3 py-2">
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="text-[11px] font-semibold text-slate-700">
                                          {note.librarianName || 'Thủ thư'}{note.librarianCode ? ` (${note.librarianCode})` : ''}
                                        </p>
                                        <p className="text-[10px] text-slate-400">{formatDateTime(note.createdAt, language)}</p>
                                      </div>
                                      {note.editableByCurrentUser && (
                                        <button
                                          onClick={() => deleteNote(tx.transactionId, note.noteId)}
                                          disabled={savingNoteId === tx.transactionId}
                                          className="text-[11px] text-red-500 hover:underline disabled:opacity-50"
                                        >
                                          {c.delete}
                                        </button>
                                      )}
                                    </div>
                                    <p className="mt-1 text-xs text-slate-700 whitespace-pre-wrap">{note.note || c.markedImportant}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            <textarea
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              rows={2}
                              placeholder={c.notePlaceholder}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => saveNote(tx.transactionId)}
                                disabled={savingNoteId === tx.transactionId || !noteDraft.trim()}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold disabled:opacity-50"
                              >
                                {savingNoteId === tx.transactionId ? c.saving : c.save}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingNoteId(null);
                                  setNoteDraft('');
                                }}
                                className="px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-600 hover:bg-slate-50"
                              >
                                {c.cancel}
                              </button>
                            </div>
                            {noteError && editingNoteId === tx.transactionId && (
                              <p className="text-xs text-red-600">{noteError}</p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {tx.important || tx.note ? (
                              <div className="flex items-start gap-2">
                                <Star size={15} className="text-amber-500 fill-amber-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-slate-700 line-clamp-3 whitespace-pre-line">{tx.note || c.markedImportant}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">{c.noNote}</span>
                            )}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openNoteEditor(tx)}
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                              >
                                <StickyNote size={13} /> {tx.note || tx.important ? c.edit : c.note}
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-white">
          <span className="text-sm text-slate-500">
            {totalElements === 0 ? c.noResults : (
              <>{c.showing} {currentPage * PAGE_SIZE + 1}-{Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} {c.in} {totalElements} {c.transactions}</>
            )}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i)
              .filter(p => p >= currentPage - 2 && p <= currentPage + 2)
              .map(p => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
                    currentPage === p ? 'bg-secondary text-white' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {p + 1}
                </button>
              ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
      <ReaderProfileDrawer reader={selectedReader} onClose={() => setSelectedReader(null)} />
      {editableFines && <FineAdjustmentDialog fines={editableFines} onClose={() => setEditableFines(null)}
        onUpdated={async () => { await Promise.all([fetchData(), fetchSummary()]); }} />}
    </div>
  );
};

export default TransactionList;

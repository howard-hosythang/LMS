import {
  AlertTriangle,
  Banknote,
  BookOpen,
  CalendarCheck,
  CheckCircle,
  CreditCard,
  DollarSign,
  Hash,
  Info,
  Pencil,
  RefreshCw,
  RotateCcw,
  Scan,
  TriangleAlert,
  X,
  User as UserIcon,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import fineService, { Fine, FinePaymentLinkResponse } from '../../api/fineService';
import circulationPolicyService from '../../api/circulationPolicyService';
import type { CirculationPolicy } from '../../api/adminService';
import transactionsService, {
  ActiveTransactionResponse,
  DirectBorrowResponse,
  DepositPaymentMethod,
  IssueType,
  LostBookRecoveryPreviewResponse,
  LookupResponse,
  ReportIssueResponse,
  RestoreLostBookResponse,
  ReturnResponse,
  StudentActiveTransactionsResponse,
} from '../../api/transactionsService';
import { getFriendlyErrorMessage } from '../../utils/errorMessages';
import CurrencyInput from '../../components/CurrencyInput';
import FineAdjustmentDialog from '../../components/librarian_pages/FineAdjustmentDialog';
import ReshelvingTab from '../../components/librarian_pages/ReshelvingTab';
import reshelvingService, { RESHELVING_CHANGED } from '../../api/reshelvingService';
import { useAppDialog } from '../../contexts/AppDialogContext';
import { useLanguage } from '../../contexts/LanguageContext';
import DepositPaymentMethodSelector, { depositPaymentMethodLabel } from '../../components/librarian_pages/DepositPaymentMethodSelector';

type MainTab = 'pickup' | 'direct' | 'return' | 'reshelving' | 'restoreLost' | 'fines';
type LookupMode = 'qr' | 'manual';
type ReturnMode = 'normal' | 'issue';

const formatVND = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
// ─── Tab: Xác nhận giao sách ────────────────────────────────────────────────

type PickupType = 'direct' | 'reservation';

const PickupTab = ({ policy }: { policy: CirculationPolicy }) => {
  const [paymentMethod, setPaymentMethod] = useState<DepositPaymentMethod>('CASH');
  const [pickupType, setPickupType] = useState<PickupType>('direct');
  const [mode, setMode] = useState<LookupMode>('qr');
  const [qrInput, setQrInput] = useState('');
  const [mssvInput, setMssvInput] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    dueDate: string; fullName: string; publicationTitle: string; depositAmount?: number | null; depositStatus?: string | null; depositPaymentMethod?: DepositPaymentMethod;
  } | null>(null);
  const qrRef = useRef<HTMLInputElement>(null);

  const reset = () => { setLookupResult(null); setLookupError(null); setSuccessData(null); setPaymentMethod('CASH'); };

  const handleLookup = async () => {
    const params =
      mode === 'qr'
        ? (pickupType === 'direct' ? { transactionId: qrInput.trim() } : { reservationId: qrInput.trim() })
        : { studentId: mssvInput.trim(), barcode: barcodeInput.trim() };

    if (mode === 'qr' && !qrInput.trim()) return;
    if (mode === 'manual' && (!mssvInput.trim() || !barcodeInput.trim())) return;

    setIsLookingUp(true);
    reset();
    try {
      const res = pickupType === 'direct'
        ? await transactionsService.lookup(params)
        : await import('../../api/reservationService').then(m => m.lookupReservation(params));

      if (res.data) {
        setLookupResult(res.data);
      } else {
        setLookupError(pickupType === 'direct' ? 'Không tìm thấy phiếu mượn hoặc đã hết hạn.' : 'Không tìm thấy đặt trước hoặc chưa sẵn sàng.');
      }
    } catch (err: any) {
      const notFoundMsg = pickupType === 'direct' ? 'Không tìm thấy phiếu mượn hoặc đã hết hạn.' : 'Không tìm thấy đặt trước hoặc chưa sẵn sàng.';
      setLookupError(err.status === 404 ? notFoundMsg : getFriendlyErrorMessage(err));
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleConfirm = async () => {
    if (!lookupResult || isConfirming) return;
    const method = Number(policy.defaultDepositAmount) > 0 ? paymentMethod : 'CASH';
    setIsConfirming(true);
    try {
      const resData = pickupType === 'direct'
        ? (await transactionsService.confirmPickup(lookupResult.transactionId, method)).data
        : await import('../../api/reservationService').then(m => m.confirmReservationPickup(lookupResult.reservationId, method));

      setSuccessData({
        dueDate: resData.dueDate,
        fullName: lookupResult.fullName,
        publicationTitle: lookupResult.publicationTitle,
        depositAmount: resData.depositAmount,
        depositStatus: resData.depositStatus,
        depositPaymentMethod: resData.depositPaymentMethod ?? method,
      });
      setLookupResult(null);
      setQrInput(''); setMssvInput(''); setBarcodeInput('');
      setTimeout(() => qrRef.current?.focus(), 100);
    } catch (err: any) {
      setLookupError(getFriendlyErrorMessage(err));
      setLookupResult(null);
    } finally {
      setIsConfirming(false);
    }
  };

  const switchMode = (m: LookupMode) => { setMode(m); reset(); setQrInput(''); setMssvInput(''); setBarcodeInput(''); };
  const switchType = (t: PickupType) => { setPickupType(t); reset(); setQrInput(''); setMssvInput(''); setBarcodeInput(''); };

  return (
    <div className="space-y-5">
      {/* Type switcher */}
      <div className="flex gap-4 border-b border-slate-100 mb-2">
        <button onClick={() => switchType('direct')}
          className={`pb-2 px-1 text-sm font-medium transition-all border-b-2 ${pickupType === 'direct' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Từ mượn ngay
        </button>
        <button onClick={() => switchType('reservation')}
          className={`pb-2 px-1 text-sm font-medium transition-all border-b-2 ${pickupType === 'reservation' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Từ đặt trước
        </button>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
        <button onClick={() => switchMode('qr')}
          className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-all ${mode === 'qr' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
          <Scan size={16} /> Quét QR
        </button>
        <button onClick={() => switchMode('manual')}
          className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-all ${mode === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
          <UserIcon size={16} /> Nhập thủ công
        </button>
      </div>

      {/* Input */}
      {mode === 'qr' ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            {pickupType === 'direct' ? 'Mã giao dịch' : 'Mã đặt trước'}
            <span className="ml-2 text-xs text-slate-400 font-normal">(scanner tự điền khi quét QR)</span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-3 text-slate-400" size={18} />
              <input ref={qrRef} type="text" autoFocus value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                placeholder={pickupType === 'direct' ? "Quét QR hoặc nhập mã giao dịch..." : "Quét QR hoặc nhập mã đặt trước..."}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
            </div>
            <button onClick={handleLookup} disabled={isLookingUp || !qrInput.trim()}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 transition-colors">
              {isLookingUp ? 'Đang tra...' : 'Tra cứu'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">MSSV độc giả</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                <input type="text" autoFocus value={mssvInput}
                  onChange={(e) => setMssvInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  placeholder="Nhập MSSV..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Barcode bản sao</label>
              <div className="relative">
                <Scan className="absolute left-3 top-3 text-slate-400" size={18} />
                <input type="text" value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  placeholder="Quét hoặc nhập barcode..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
              </div>
            </div>
          </div>
          <button onClick={handleLookup} disabled={isLookingUp || !mssvInput.trim() || !barcodeInput.trim()}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 transition-colors">
            {isLookingUp ? 'Đang tra cứu...' : pickupType === 'direct' ? 'Tra cứu phiếu mượn' : 'Tra cứu đặt trước'}
          </button>
        </div>
      )}

      {/* Result */}
      <ResultArea
        pickupType={pickupType}
        policy={policy}
        successData={successData} lookupResult={lookupResult} lookupError={lookupError}
        isConfirming={isConfirming}
        paymentMethod={paymentMethod} onPaymentMethodChange={setPaymentMethod}
        onConfirm={handleConfirm}
        onCancel={() => { reset(); setQrInput(''); }}
        onNext={() => { reset(); qrRef.current?.focus(); }}
        idleText={mode === 'qr' ? 'Quét mã QR hoặc nhập mã số rồi nhấn Enter' : 'Nhập MSSV và barcode sách rồi nhấn Tra cứu'}
      />
    </div>
  );
};

// ─── Tab: Mượn trực tiếp ────────────────────────────────────────────────────

const DirectBorrowTab = ({ policy }: { policy: CirculationPolicy }) => {
  const { language } = useLanguage();
  const [paymentMethod, setPaymentMethod] = useState<DepositPaymentMethod>('CASH');
  const [mssvInput, setMssvInput] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [successData, setSuccessData] = useState<DirectBorrowResponse['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mssvRef = useRef<HTMLInputElement>(null);

  const handleBorrow = async () => {
    if (isBorrowing || !mssvInput.trim() || !barcodeInput.trim()) return;
    const method = Number(policy.defaultDepositAmount) > 0 ? paymentMethod : 'CASH';
    setIsBorrowing(true);
    setError(null);
    setSuccessData(null);
    try {
      const res = await transactionsService.borrowDirect({ studentId: mssvInput.trim(), barcode: barcodeInput.trim(), paymentMethod: method });
      if (res.code === 201) {
        setSuccessData({ ...res.data, depositPaymentMethod: res.data.depositPaymentMethod ?? method });
        setMssvInput('');
        setBarcodeInput('');
      }
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsBorrowing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Chú thích nghiệp vụ */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 space-y-1">
        <p className="font-semibold text-amber-900">Lưu ý khi mượn trực tiếp</p>
        <ul className="list-disc list-inside space-y-0.5 text-amber-700">
          <li>Áp dụng khi độc giả <span className="font-medium">đến thư viện mà không đặt trước</span> qua hệ thống.</li>
          <li>Sách được ghi nhận trạng thái <span className="font-medium">Đang mượn</span> ngay lập tức, hạn trả <span className="font-medium">{policy.defaultLoanDays} ngày</span> kể từ hôm nay.</li>
          <li>Thu cọc tại quầy <span className="font-medium">{formatVND(Number(policy.defaultDepositAmount || 0))}/cuốn</span> và đọc lại số tiền với bạn đọc trước khi giao sách.</li>
          <li>Hệ thống tự động kiểm tra: tối đa <span className="font-medium">{policy.maxActiveBorrows} cuốn</span> đang mượn{policy.blockBorrowWhenUnpaidFines ? <>, không có <span className="font-medium">phí phạt chưa trả</span>,</> : ','} và chưa mượn <span className="font-medium">bản sao khác của cùng đầu sách</span>.</li>
        </ul>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">MSSV độc giả</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />
              <input ref={mssvRef} type="text" autoFocus value={mssvInput}
                onChange={(e) => setMssvInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBorrow()}
                placeholder="Nhập MSSV..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Barcode sách</label>
            <div className="relative">
              <Scan className="absolute left-3 top-3 text-slate-400" size={18} />
              <input type="text" value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBorrow()}
                placeholder="Quét hoặc nhập barcode..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono" />
            </div>
          </div>
        </div>
        {Number(policy.defaultDepositAmount) > 0 && <DepositPaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} disabled={isBorrowing} />}
        <button onClick={handleBorrow} disabled={isBorrowing || !mssvInput.trim() || !barcodeInput.trim()}
          className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 transition-colors">
          {isBorrowing ? 'Đang xử lý...' : 'Cho mượn ngay'}
        </button>
      </div>

      {/* Result */}
      {successData ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CalendarCheck size={28} className="text-emerald-600" />
          </div>
          <h3 className="font-bold text-emerald-900 text-lg mb-1">Mượn sách thành công!</h3>
          <p className="text-sm text-emerald-700 mb-4">
            Đã ghi nhận mượn <span className="font-semibold">{successData.publicationTitle}</span>
          </p>
          <div className="bg-white rounded-lg border border-emerald-200 grid grid-cols-2 divide-x divide-emerald-100 mb-5 text-sm">
            <div className="px-4 py-3">
              <p className="text-xs text-slate-500 mb-0.5">Barcode</p>
              <p className="font-semibold font-mono text-slate-900">{successData.barcode}</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-slate-500 mb-0.5">Hạn trả</p>
              <p className="font-bold text-slate-900">
                {new Date(successData.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 mb-5">
            <span className="font-semibold">Đã ghi nhận thu cọc:</span>{' '}
            {formatVND(Number(successData.depositAmount || 0))}
            {Number(successData.depositAmount) > 0 && ` (${depositPaymentMethodLabel(successData.depositPaymentMethod, language)})`}
          </div>
          <button onClick={() => { setSuccessData(null); setError(null); setPaymentMethod('CASH'); setTimeout(() => mssvRef.current?.focus(), 100); }}
            className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
            Giao dịch tiếp theo
          </button>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">{error}</p>
            {error.toLowerCase().includes('not available for borrowing') && (
              <p className="text-xs text-red-700 mt-1.5">
                Bản sao này đang ở trạng thái không thể mượn:{' '}
                <span className="font-medium">Đang được mượn, Đã đặt trước, Đang bảo trì</span> hoặc{' '}
                <span className="font-medium">Mất/thất lạc</span>. Vui lòng chọn bản sao khác.
              </p>
            )}
            <button onClick={() => setError(null)} className="text-xs text-red-600 underline mt-1.5 hover:text-red-800">Thử lại</button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center text-center text-slate-400">
          <BookOpen size={32} className="mb-2 opacity-40" />
          <p className="text-sm">Nhập MSSV và barcode sách để mượn trực tiếp tại thư viện</p>
        </div>
      )}
    </div>
  );
};

// ─── Quy định tính phí hư/mất ───────────────────────────────────────────────

const IssueFineGuide = () => (
  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800 space-y-1">
    <p className="font-semibold text-amber-900 text-sm">Quy định tính phí phạt hư hỏng / mất sách</p>
    <ul className="list-disc list-inside space-y-1 text-amber-700">
      <li>Mua lại tài liệu đó theo cuốn tái bản mới nhất kèm chi phí xử lý sách.</li>
      <li>Đối với sách <span className="font-medium">không mua lại được</span>: đền gấp <span className="font-medium">3 lần giá sách</span>.</li>
      <li>Đối với sách <span className="font-medium">không ghi giá tiền</span>: tính theo giá photo <span className="font-medium">(600đ/trang + chi phí đóng bìa) × 3</span>.</li>
    </ul>
  </div>
);

// ─── Tab: Trả sách ──────────────────────────────────────────────────────────

type ActiveItem = StudentActiveTransactionsResponse['data']['items'][0];
type ActionType = 'return' | 'damaged' | 'lost';

export const ReturnTab = ({ policy }: { policy: CirculationPolicy }) => {
  const dialog = useAppDialog();
  const { language } = useLanguage();
  const [renewingTransactionId, setRenewingTransactionId] = useState<string | null>(null);
  // MSSV search
  const [mssvInput, setMssvInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [student, setStudent] = useState<StudentActiveTransactionsResponse['data'] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const mssvRef = useRef<HTMLInputElement>(null);

  // Action panel
  const [selectedItem, setSelectedItem] = useState<ActiveItem | null>(null);
  const [action, setAction] = useState<ActionType | null>(null);
  const [fineAmount, setFineAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [returnSuccess, setReturnSuccess] = useState<ReturnResponse['data'] | null>(null);
  const [issueSuccess, setIssueSuccess] = useState<ReportIssueResponse['data'] | null>(null);

  const handleSearch = async () => {
    if (!mssvInput.trim() || renewingTransactionId || isSearching) return;
    setIsSearching(true);
    setSearchError(null);
    setStudent(null);
    setSelectedItem(null);
    setAction(null);
    try {
      const res = await transactionsService.getStudentActive(mssvInput.trim());
      if (res.code === 200) setStudent(res.data);
    } catch (err: any) {
      setSearchError(getFriendlyErrorMessage(err));
    } finally {
      setIsSearching(false);
    }
  };

  const openAction = (item: ActiveItem, act: ActionType) => {
    setSelectedItem(item);
    setAction(act);
    setFineAmount('');
    setActionError(null);
    setReturnSuccess(null);
    setIssueSuccess(null);
  };

  const renewItem = async (item: ActiveItem) => {
    if (!student || item.canRenew !== true || renewingTransactionId) return;
    const studentId = student.studentId;
    setRenewingTransactionId(item.transactionId);
    try {
      const confirmed = await dialog.confirm({
        title: language === 'en' ? 'Confirm book renewal' : 'Xác nhận gia hạn sách',
        message: language === 'en'
          ? `Renew "${item.publicationTitle}" for ${policy.defaultLoanDays} more days from the current due date? Eligibility will be checked again.`
          : `Gia hạn "${item.publicationTitle}" thêm ${policy.defaultLoanDays} ngày kể từ hạn trả hiện tại? Hệ thống sẽ kiểm tra lại điều kiện gia hạn.`,
        confirmText: language === 'en' ? 'Renew' : 'Gia hạn',
        variant: 'warning',
      });
      if (!confirmed) return;
      const response = await transactionsService.renew(item.transactionId);
      const newDueDate = new Date(response.data.dueDate).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN');
      toast.success(language === 'en' ? `Renewed successfully. New due date: ${newDueDate}` : `Gia hạn thành công. Hạn trả mới: ${newDueDate}`);
      const refreshed = await transactionsService.getStudentActive(studentId);
      if (refreshed.code === 200) setStudent(refreshed.data);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, language));
      // Refresh eligibility after a rejection as queues/fines may have changed.
      try {
        const refreshed = await transactionsService.getStudentActive(studentId);
        if (refreshed.code === 200) setStudent(refreshed.data);
      } catch { /* Keep the current list if the network is unavailable. */ }
    } finally {
      setRenewingTransactionId(null);
    }
  };

  const closeAction = () => { setSelectedItem(null); setAction(null); setActionError(null); };

  const handleReturn = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await transactionsService.returnBook(selectedItem.barcode);
      if (res.code === 200) {
        setReturnSuccess(res.data);
        setStudent(prev => prev ? { ...prev, items: prev.items.filter(i => i.transactionId !== selectedItem.transactionId) } : null);
      }
    } catch (err: any) {
      setActionError(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportIssue = async () => {
    if (!selectedItem) return;
    const amount = Number(fineAmount);
    if (!Number.isInteger(amount) || amount <= 0 || amount > 10000000) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      const issueType: IssueType = action === 'damaged' ? 'DAMAGED_BOOK' : 'LOST_BOOK';
      const res = await transactionsService.reportIssue(selectedItem.transactionId, issueType, amount);
      if (res.code === 200) {
        setIssueSuccess(res.data);
        setStudent(prev => prev ? { ...prev, items: prev.items.filter(i => i.transactionId !== selectedItem.transactionId) } : null);
      }
    } catch (err: any) {
      setActionError(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const calcOverdueDays = (dueDate: string) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate); due.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86_400_000));
  };

  return (
    <div className="space-y-5">
      {/* MSSV search */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">MSSV độc giả</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />
            <input ref={mssvRef} type="text" autoFocus value={mssvInput}
              onChange={(e) => setMssvInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Nhập MSSV rồi nhấn Enter..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>
          <button onClick={handleSearch} disabled={isSearching || !!renewingTransactionId || !mssvInput.trim()}
            className="bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 transition-colors">
            {isSearching ? 'Đang tra...' : 'Tìm kiếm'}
          </button>
        </div>
      </div>

      {/* Search error */}
      {searchError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">{searchError}</p>
            <button onClick={() => setSearchError(null)} className="text-xs text-red-600 underline mt-1 hover:text-red-800">Thử lại</button>
          </div>
        </div>
      )}

      {/* Student book list */}
      {student ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900">{student.fullName}</p>
              <p className="text-xs text-slate-500 font-mono">{student.studentId}</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
              {student.items.length} cuốn đang mượn
            </span>
          </div>

          {student.items.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400">
              <BookOpen size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sinh viên không có sách nào đang mượn.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {student.items.map(item => {
                const overdueDays = calcOverdueDays(item.dueDate);
                const isOverdue = item.status === 'OVERDUE';
                return (
                  <div key={item.transactionId}
                    className={`border rounded-xl p-4 ${isOverdue ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}>
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{item.publicationTitle}</p>
                        <p className="text-xs font-mono text-slate-500">{item.barcode} · {item.branch}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                            Hạn: {new Date(item.dueDate).toLocaleDateString('vi-VN')}
                          </span>
                          {isOverdue && (
                            <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                              Trễ {overdueDays} ngày · Phí: {formatVND(overdueDays * Number(policy.overdueFinePerDay || 0))}
                            </span>
                          )}
                          {Number(item.depositAmount || 0) > 0 && (
                            <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                              Cọc đã thu: {formatVND(Number(item.depositAmount || 0))}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">
                          {language === 'en' ? 'Renewals' : 'Gia hạn'}: {item.renewalCount}/{item.maxRenewals}
                        </p>
                        {item.canRenew === false && item.cannotRenewReason && (
                          <span id={`renew-reason-${item.transactionId}`} className="mt-1 inline-block rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                            {item.cannotRenewReason}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                        <button type="button" onClick={() => void renewItem(item)}
                          disabled={item.canRenew !== true || !!renewingTransactionId || isSubmitting}
                          aria-describedby={item.canRenew === false && item.cannotRenewReason ? `renew-reason-${item.transactionId}` : undefined}
                          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400">
                          <RefreshCw size={13} aria-hidden="true" className={renewingTransactionId === item.transactionId ? 'animate-spin motion-reduce:animate-none' : ''} />
                          {language === 'en' ? 'Renew' : 'Gia hạn'}
                        </button>
                        <button onClick={() => openAction(item, 'return')}
                          className="flex items-center gap-1 bg-purple-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-purple-700 font-medium transition-colors">
                          <RotateCcw size={13} /> Trả
                        </button>
                        <button onClick={() => openAction(item, 'damaged')}
                          className="flex items-center gap-1 bg-orange-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-orange-600 font-medium transition-colors">
                          <TriangleAlert size={13} /> Hư
                        </button>
                        <button onClick={() => openAction(item, 'lost')}
                          className="flex items-center gap-1 bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-700 font-medium transition-colors">
                          <AlertTriangle size={13} /> Mất
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : !searchError && (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center text-center text-slate-400">
          <UserIcon size={32} className="mb-2 opacity-40" />
          <p className="text-sm">Nhập MSSV để xem danh sách sách đang mượn</p>
        </div>
      )}

      {/* Action modal */}
      {selectedItem && action && (
        <ActionPanel
          item={selectedItem}
          action={action}
          fineAmount={fineAmount}
          setFineAmount={setFineAmount}
          isSubmitting={isSubmitting}
          error={actionError}
          returnSuccess={returnSuccess}
          issueSuccess={issueSuccess}
          policy={policy}
          onReturn={handleReturn}
          onIssue={handleReportIssue}
          onClose={() => { closeAction(); setReturnSuccess(null); setIssueSuccess(null); }}
          calcOverdueDays={calcOverdueDays}
        />
      )}
    </div>
  );
};


type DepositSettlement = Pick<ReturnResponse['data'], 'depositAmount' | 'grossFineAmount' | 'depositAppliedAmount' | 'depositRefundAmount' | 'additionalAmountDue'>;

const DepositSettlementBox = ({ settlement }: { settlement: DepositSettlement }) => (
  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-left text-sm">
    <p className="font-semibold text-blue-900 mb-2">Quyết toán tiền cọc</p>
    <div className="space-y-1 text-blue-800">
      <div className="flex justify-between gap-3"><span>Cọc đã thu</span><strong>{formatVND(Number(settlement.depositAmount || 0))}</strong></div>
      <div className="flex justify-between gap-3"><span>Phạt gốc</span><strong>{formatVND(Number(settlement.grossFineAmount || 0))}</strong></div>
      <div className="flex justify-between gap-3"><span>Đã cấn cọc</span><strong className="text-amber-700">{formatVND(Number(settlement.depositAppliedAmount || 0))}</strong></div>
      <div className="flex justify-between gap-3"><span>Hoàn lại</span><strong className="text-emerald-700">{formatVND(Number(settlement.depositRefundAmount || 0))}</strong></div>
      <div className="flex justify-between gap-3"><span>Cần thu thêm</span><strong className="text-red-700">{formatVND(Number(settlement.additionalAmountDue || 0))}</strong></div>
    </div>
  </div>
);

const ActionPanel = ({ item, action, fineAmount, setFineAmount, isSubmitting, error,
  returnSuccess, issueSuccess, policy, onReturn, onIssue, onClose, calcOverdueDays }: {
  item: ActiveItem; action: ActionType; fineAmount: string;
  setFineAmount: (v: string) => void; isSubmitting: boolean; error: string | null;
  returnSuccess: ReturnResponse['data'] | null;
  issueSuccess: ReportIssueResponse['data'] | null;
  policy: CirculationPolicy;
  onReturn: () => void; onIssue: () => void; onClose: () => void;
  calcOverdueDays: (d: string) => number;
}) => {
  const overdueDays = calcOverdueDays(item.dueDate);
  const isOverdue = item.status === 'OVERDUE';
  const isIssue = action === 'damaged' || action === 'lost';
  const succeeded = !!returnSuccess || !!issueSuccess;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={succeeded ? undefined : onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-slate-900">{item.publicationTitle}</p>
              <p className="text-xs font-mono text-slate-500 mt-0.5">{item.barcode}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-3 text-lg leading-none">✕</button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* SUCCESS: trả sách */}
          {returnSuccess && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-purple-900 text-lg">Trả sách thành công!</p>
                <p className="text-sm text-slate-500 mt-1">
                  Ngày trả: {new Date(returnSuccess.returnedDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
              {returnSuccess.overdue && returnSuccess.overdueFineAmount != null && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-sm">
                  <p className="text-orange-700">Sách trả trễ hạn — phí phạt đã ghi nhận:</p>
                  <p className="font-bold text-orange-600 text-lg mt-1">{formatVND(returnSuccess.overdueFineAmount)}</p>
                </div>
              )}
              <DepositSettlementBox settlement={returnSuccess} />
              <button onClick={onClose}
                className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                Giao dịch tiếp theo
              </button>
            </div>
          )}

          {/* SUCCESS: hư/mất */}
          {issueSuccess && (
            <div className="text-center space-y-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${action === 'damaged' ? 'bg-orange-100' : 'bg-red-100'}`}>
                <CheckCircle size={32} className={action === 'damaged' ? 'text-orange-600' : 'text-red-600'} />
              </div>
              <div>
                <p className={`font-bold text-lg ${action === 'damaged' ? 'text-orange-900' : 'text-red-900'}`}>
                  {action === 'damaged' ? 'Ghi nhận hư hỏng thành công!' : 'Ghi nhận mất sách thành công!'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Trạng thái sách: <span className="font-medium">{issueSuccess.itemStatus === 'IN_MAINTENANCE' ? 'Đang bảo trì' : 'Mất / thất lạc'}</span>
                </p>
              </div>
              <div className="space-y-2 text-left">
                {issueSuccess.finesCreated.map(f => (
                  <div key={f.fineId} className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm">
                    <span className="text-slate-600">
                      {f.type === 'DAMAGED_BOOK' ? 'Phí hư hỏng' : f.type === 'LOST_BOOK' ? 'Phí mất sách' : 'Phí trễ hạn'}
                    </span>
                    <span className="font-bold text-slate-900">{formatVND(f.amount)}</span>
                  </div>
                ))}
              </div>
              <DepositSettlementBox settlement={issueSuccess} />
              <button onClick={onClose}
                className={`w-full text-white py-2.5 rounded-lg font-semibold transition-colors ${action === 'damaged' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'}`}>
                Giao dịch tiếp theo
              </button>
            </div>
          )}

          {/* FORM: chưa submit */}
          {!succeeded && (
            <>
              {isOverdue && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">
                  Sách trễ <span className="font-bold">{overdueDays} ngày</span> — hệ thống tự tính thêm phí trễ hạn{' '}
                  <span className="font-bold">{formatVND(overdueDays * Number(policy.overdueFinePerDay || 0))}</span>.
                </div>
              )}

              {action === 'return' && (
                <div className="text-center space-y-3">
                  <RotateCcw size={36} className="text-purple-500 mx-auto" />
                  <p className="text-slate-700 text-sm">Xác nhận trả sách này?</p>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700 text-left">{error}</div>
                  )}
                  <button onClick={onReturn} disabled={isSubmitting}
                    className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors">
                    {isSubmitting ? 'Đang xử lý...' : 'Xác nhận trả sách'}
                  </button>
                </div>
              )}

              {isIssue && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      {action === 'damaged' ? 'Phí phạt hư hỏng (đ)' : 'Phí phạt mất sách (đ)'}
                    </label>
                    <CurrencyInput autoFocus value={fineAmount}
                      onValueChange={setFineAmount}
                      onKeyDown={e => e.key === 'Enter' && onIssue()}
                      placeholder="Từ 1đ đến 10.000.000đ"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                  <IssueFineGuide />
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">{error}</div>
                  )}
                  <button onClick={onIssue}
                    disabled={isSubmitting || !fineAmount.trim() || Number(fineAmount) <= 0 || Number(fineAmount) > 10000000}
                    className={`w-full text-white py-2.5 rounded-lg font-semibold disabled:opacity-50 transition-colors ${action === 'damaged' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'}`}>
                    {isSubmitting ? 'Đang xử lý...' : action === 'damaged' ? 'Xác nhận hư hỏng' : 'Xác nhận mất sách'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Shared result area (dùng cho PickupTab) ────────────────────────────────

const ResultArea = ({ pickupType, policy, successData, lookupResult, lookupError, isConfirming, paymentMethod, onPaymentMethodChange, onConfirm, onCancel, onNext, idleText }: {
  pickupType: PickupType;
  policy: CirculationPolicy;
  successData: { dueDate: string; fullName: string; publicationTitle: string; depositAmount?: number | null; depositStatus?: string | null; depositPaymentMethod?: DepositPaymentMethod } | null;
  paymentMethod: DepositPaymentMethod;
  onPaymentMethodChange: (method: DepositPaymentMethod) => void;
  lookupResult: any | null;
  lookupError: string | null;
  isConfirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onNext: () => void;
  idleText: string;
}) => {
  const { language } = useLanguage();
  if (successData) return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
      <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <CalendarCheck size={28} className="text-emerald-600" />
      </div>
      <h3 className="font-bold text-emerald-900 text-lg mb-1">Giao sách thành công!</h3>
      <p className="text-sm text-emerald-700 mb-4">
        <span className="font-semibold">{successData.fullName}</span> đã nhận{' '}
        <span className="font-semibold">{successData.publicationTitle}</span>
      </p>
      <div className="bg-white rounded-lg border border-emerald-200 px-4 py-2.5 inline-flex flex-col items-center mb-5">
        <span className="text-xs text-slate-500">Hạn trả sách</span>
        <span className="font-bold text-slate-900 text-lg">
          {new Date(successData.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </span>
      </div>
      <div className="bg-white rounded-lg border border-emerald-200 px-4 py-3 mb-5 text-sm text-emerald-800">
        <span className="font-semibold">Đã ghi nhận thu cọc:</span>{' '}
        {formatVND(Number(successData.depositAmount || 0))}
        {Number(successData.depositAmount) > 0 && ` (${depositPaymentMethodLabel(successData.depositPaymentMethod, language)})`}
      </div>
      <button onClick={onNext} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
        Giao dịch tiếp theo
      </button>
    </div>
  );

  if (lookupResult) return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <BookOpen size={20} className="text-blue-600" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 truncate">{lookupResult.publicationTitle}</p>
          <p className="text-xs text-slate-500 font-mono">
            {pickupType === 'direct' ? 'Phiếu mượn' : 'Đặt trước'} #{lookupResult.transactionId || lookupResult.reservationId}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-5">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Độc giả</p>
          <p className="font-semibold text-slate-900">{lookupResult.fullName}</p>
          <p className="text-xs text-slate-500 font-mono">{lookupResult.studentId}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Barcode bản sao</p>
          <p className="font-semibold text-slate-900 font-mono">{lookupResult.barcode}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Vị trí</p>
          <p className="font-semibold text-slate-900">{lookupResult.branch} — {lookupResult.location}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Hạn lấy sách</p>
          <p className="font-semibold text-red-600">
            {new Date(lookupResult.pickedUpDeadline || lookupResult.holdExpirationTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Cọc cần thu khi giao</p>
          <p className="font-semibold text-slate-900">{formatVND(Number(policy.defaultDepositAmount || 0))}</p>
        </div>
      </div>
      {Number(policy.defaultDepositAmount) > 0 && <DepositPaymentMethodSelector value={paymentMethod} onChange={onPaymentMethodChange} disabled={isConfirming} />}
      <div className="flex gap-3">
        <button onClick={onConfirm} disabled={isConfirming}
          className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
          {isConfirming ? 'Đang xử lý...' : 'Xác nhận giao sách'}
        </button>
        <button onClick={onCancel} disabled={isConfirming}
          className="px-5 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors">
          Huỷ
        </button>
      </div>
    </div>
  );

  if (lookupError) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
      <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-red-800 text-sm">{lookupError}</p>
        <button onClick={onCancel} className="text-xs text-red-600 underline mt-1 hover:text-red-800">Thử lại</button>
      </div>
    </div>
  );

  return (
    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center text-center text-slate-400">
      <Scan size={32} className="mb-2 opacity-40" />
      <p className="text-sm">{idleText}</p>
    </div>
  );
};

// ─── Tab: Thu phí phạt ──────────────────────────────────────────────────────

const FINE_TYPE_LABEL: Record<string, string> = {
  OVERDUE_RETURN: 'Quá hạn',
  DAMAGED_BOOK:   'Hư hỏng',
  LOST_BOOK:      'Mất sách',
};

const FINE_REASON_TEXT: Record<string, string> = {
  OVERDUE_RETURN: 'Phí phát sinh do trả sách sau hạn quy định. Hệ thống tính 1.000đ cho mỗi ngày quá hạn.',
  DAMAGED_BOOK: 'Phí do thủ thư ghi nhận sách bị hư hỏng khi trả hoặc kiểm kê.',
  LOST_BOOK: 'Phí do thủ thư ghi nhận sách bị mất.',
};

const FineTab = () => {
  const [editingFine, setEditingFine] = useState<Fine | null>(null);
  const [mssvInput, setMssvInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<{ studentId: string; fullName: string; totalUnpaidAmount: number; fines: Fine[] } | null>(null);
  const [payingAll, setPayingAll] = useState(false);
  const [creatingPayOs, setCreatingPayOs] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'banking'>('cash');
  const [payOsPayment, setPayOsPayment] = useState<FinePaymentLinkResponse | null>(null);
  const mssvRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    if (!mssvInput.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    setStudentData(null);
    try {
      const res = await fineService.getStudentFines(mssvInput.trim());
      if (res.code === 200) setStudentData(res.data);
    } catch (err: any) {
      setSearchError(getFriendlyErrorMessage(err));
    } finally {
      setIsSearching(false);
    }
  };

  const refreshStudentFines = async (studentId: string, silent = false) => {
    try {
      const res = await fineService.getStudentFines(studentId);
      if (res.code === 200) {
        setStudentData(res.data);
        return res.data;
      }
    } catch (err: any) {
      if (!silent) toast.error(getFriendlyErrorMessage(err));
    }
    return null;
  };

  const handlePayAll = async () => {
    if (!studentData) return;
    setPayingAll(true);
    try {
      const res = await fineService.payAllFinesByCash(studentData.studentId);
      if (res.code === 200) {
        setStudentData({ ...studentData, fines: [], totalUnpaidAmount: 0 });
        toast.success(`Đã ghi nhận thanh toán tiền mặt cho ${res.data.paidCount} khoản phí.`);
      }
    } catch (err: any) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setPayingAll(false);
    }
  };

  const handleCreatePayOsPayment = async () => {
    if (!studentData) return;
    setCreatingPayOs(true);
    try {
      const res = await fineService.createPayOsFinePayment(studentData.studentId);
      if (res.code === 200) {
        setPayOsPayment(res.data);
      }
    } catch (err: any) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setCreatingPayOs(false);
    }
  };

  useEffect(() => {
    if (!payOsPayment) return;
    let stopped = false;

    const syncPayment = async (silent = true) => {
      try {
        const syncRes = await fineService.syncPayOsFinePayment(payOsPayment.orderCode);
        const refreshed = await refreshStudentFines(payOsPayment.studentId, true);
        if (!stopped && syncRes.code === 200 && syncRes.data.paidCount > 0) {
          setPayOsPayment(null);
          toast.success('payOS đã xác nhận chuyển khoản. Phí phạt đã được cập nhật.');
          return;
        }
        if (!stopped && refreshed && refreshed.fines.length === 0) {
          setPayOsPayment(null);
          toast.success('payOS đã xác nhận chuyển khoản. Phí phạt đã được cập nhật.');
        }
      } catch (err: any) {
        if (!silent) toast.error(getFriendlyErrorMessage(err));
      }
    };

    syncPayment();
    const timer = window.setInterval(async () => {
      await syncPayment();
    }, 4000);

    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [payOsPayment]);

  return (
    <div className="space-y-5">
      {/* MSSV input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">MSSV độc giả</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />
            <input ref={mssvRef} type="text" autoFocus value={mssvInput}
              onChange={e => setMssvInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Nhập MSSV rồi nhấn Enter..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none" />
          </div>
          <button onClick={handleSearch} disabled={isSearching || !mssvInput.trim()}
            className="bg-yellow-500 text-white px-6 py-2.5 rounded-lg hover:bg-yellow-600 font-medium disabled:opacity-50 transition-colors">
            {isSearching ? 'Đang tra...' : 'Tìm kiếm'}
          </button>
        </div>
      </div>

      {searchError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">{searchError}</p>
            <button onClick={() => setSearchError(null)} className="text-xs text-red-600 underline mt-1">Thử lại</button>
          </div>
        </div>
      )}

      {studentData && (
        <div className="space-y-4">
          {/* Student summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900">{studentData.fullName}</p>
              <p className="text-xs text-slate-500 font-mono">{studentData.studentId}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Tổng nợ chưa trả</p>
              <p className="font-bold text-red-600 text-lg">
                {new Intl.NumberFormat('vi-VN').format(studentData.totalUnpaidAmount)}đ
              </p>
            </div>
          </div>

          {studentData.fines.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center text-slate-400">
              <CheckCircle size={28} className="mb-2 text-green-400" />
              <p className="text-sm font-medium text-slate-600">Sinh viên không có phí phạt nào chưa thanh toán.</p>
            </div>
          ) : (
            <>
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                <div>
                  <p className="font-semibold text-slate-900 text-sm mb-2">Phương thức thanh toán</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                        paymentMethod === 'cash'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Banknote size={18} /> Tiền mặt
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('banking')}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                        paymentMethod === 'banking'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard size={18} /> Chuyển khoản
                    </button>
                  </div>
                </div>

                {paymentMethod === 'cash' ? (
                  <button onClick={handlePayAll} disabled={payingAll}
                    className="w-full bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    <CheckCircle size={16} />
                    {payingAll ? 'Đang xử lý...' : `Đã thanh toán tiền mặt (${studentData.fines.length} khoản)`}
                  </button>
                ) : (
                  <button onClick={handleCreatePayOsPayment} disabled={creatingPayOs}
                    className="w-full bg-yellow-500 text-white py-2.5 rounded-lg hover:bg-yellow-600 font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    <DollarSign size={16} />
                    {creatingPayOs ? 'Đang tạo mã QR...' : `Tạo QR thanh toán tất cả (${studentData.fines.length} khoản)`}
                  </button>
                )}

                <p className="text-xs text-slate-500 leading-relaxed">
                  Hệ thống chỉ hỗ trợ thanh toán toàn bộ phí phạt chưa thu của sinh viên. Với chuyển khoản, payOS sẽ gửi webhook xác nhận để hệ thống tự cập nhật trạng thái đã thanh toán.
                </p>
              </div>

              <div className="space-y-2">
                {studentData.fines.map(fine => (
                  <div key={fine.fineId} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{fine.publicationTitle}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">GD #{fine.transactionId}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 flex-shrink-0">
                          Chưa thu
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          fine.type === 'OVERDUE_RETURN' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {FINE_TYPE_LABEL[fine.type] ?? fine.type}
                        </span>
                        <span className="text-xs text-slate-400">
                          Tạo ngày {new Date(fine.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {FINE_REASON_TEXT[fine.type] ?? 'Phí phạt được ghi nhận bởi thủ thư.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-bold text-slate-900">
                        {new Intl.NumberFormat('vi-VN').format(fine.fineAmount)}đ
                      </span>
                      {fine.status === 'UNPAID' && <button type="button" onClick={() => setEditingFine(fine)}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">
                        <Pencil size={14} aria-hidden="true" /> Chỉnh sửa phí
                      </button>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!studentData && !searchError && (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center text-center text-slate-400">
          <DollarSign size={32} className="mb-2 opacity-40" />
          <p className="text-sm">Nhập MSSV để xem và thu phí phạt của sinh viên</p>
        </div>
      )}

      {editingFine && <FineAdjustmentDialog fines={[editingFine]} onClose={() => setEditingFine(null)}
        onUpdated={() => refreshStudentFines(studentData!.studentId)} />}

      {payOsPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-sm font-semibold text-blue-600">Thanh toán qua payOS</p>
                <h3 className="text-xl font-bold text-slate-900">Quét mã QR để chuyển khoản</h3>
              </div>
              <button
                onClick={() => setPayOsPayment(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <div className="mx-auto mb-4 flex w-fit rounded-xl bg-white p-3 shadow-sm">
                <QRCode value={payOsPayment.qrCode} size={220} />
              </div>
              <p className="text-xs text-slate-500">Số tiền</p>
              <p className="text-2xl font-bold text-red-600">{formatVND(payOsPayment.amount)}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-left text-xs">
                <div className="rounded-lg bg-white p-3">
                  <p className="text-slate-400">Nội dung</p>
                  <p className="font-bold text-slate-900">{payOsPayment.description}</p>
                </div>
                <div className="rounded-lg bg-white p-3">
                  <p className="text-slate-400">Mã đơn</p>
                  <p className="font-bold text-slate-900">{payOsPayment.orderCode}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <a
                href={payOsPayment.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="block w-full rounded-lg bg-blue-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700"
              >
                Mở trang thanh toán payOS
              </a>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const syncRes = await fineService.syncPayOsFinePayment(payOsPayment.orderCode);
                    const refreshed = await refreshStudentFines(payOsPayment.studentId, true);
                    if (syncRes.code === 200 && syncRes.data.paidCount > 0) {
                      setPayOsPayment(null);
                      toast.success('payOS đã xác nhận chuyển khoản. Phí phạt đã được cập nhật.');
                    } else if (refreshed && refreshed.fines.length === 0) {
                      setPayOsPayment(null);
                      toast.success('payOS đã xác nhận chuyển khoản. Phí phạt đã được cập nhật.');
                    } else {
                      toast.info('payOS chưa ghi nhận giao dịch đã thanh toán.');
                    }
                  } catch (err: any) {
                    toast.error(getFriendlyErrorMessage(err));
                  }
                }}
                className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Kiểm tra trạng thái thanh toán
              </button>
              <p className="text-center text-xs text-slate-500">
                Sau khi chuyển khoản thành công, payOS sẽ tự động xác nhận và hệ thống cập nhật trong vài giây.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tab: Tìm lại sách đã báo mất ──────────────────────────────────────────

const RestoreLostTab = () => {
  const [transactionId, setTransactionId] = useState('');
  const [preview, setPreview] = useState<LostBookRecoveryPreviewResponse['data'] | null>(null);
  const [newItemStatus, setNewItemStatus] = useState<'AVAILABLE' | 'IN_MAINTENANCE'>('AVAILABLE');
  const [recoveryReason, setRecoveryReason] = useState<'READER_FOUND' | 'LIBRARY_FOUND' | 'INVENTORY_FOUND' | 'OTHER'>('READER_FOUND');
  const [refundAmount, setRefundAmount] = useState('');
  const [note, setNote] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<RestoreLostBookResponse['data'] | null>(null);

  useEffect(() => {
    const id = transactionId.trim();
    setPreview(null);
    setSuccess(null);
    if (id.length < 6) {
      setError(null);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsLookingUp(true);
      setError(null);
      try {
        const res = await transactionsService.previewLostBookRecovery(id);
        if (res.code === 200) {
          setPreview(res.data);
          setRefundAmount(String(Number(res.data.suggestedRefundAmount || 0)));
        }
      } catch (err: any) {
        setPreview(null);
        setRefundAmount('');
        setError(getFriendlyErrorMessage(err));
      } finally {
        setIsLookingUp(false);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [transactionId]);

  const handleSubmit = async () => {
    const amount = Number(refundAmount || 0);
    if (!transactionId.trim() || !preview || amount < 0) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await transactionsService.restoreLostBook(transactionId.trim(), {
        newItemStatus,
        refundAmount: amount,
        recoveryReason,
        note: note.trim() || undefined,
      });
      if (res.code === 200) {
        setSuccess(res.data);
        setTransactionId('');
        setPreview(null);
        setRefundAmount('');
        setNote('');
        setNewItemStatus('AVAILABLE');
        setRecoveryReason('READER_FOUND');
      }
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800 space-y-1">
        <p className="font-semibold text-emerald-900">Xử lý sách báo mất nhưng đã tìm lại</p>
        <p>Chỉ cần nhập mã giao dịch. Hệ thống tự lấy tên sách, barcode và thông tin quyết toán để thủ thư kiểm tra trước khi phục hồi.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Mã giao dịch báo mất</label>
        <div className="relative">
          <Hash className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            type="text"
            value={transactionId}
            onChange={e => setTransactionId(e.target.value)}
            placeholder="Nhập hoặc quét mã giao dịch..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
          />
        </div>
        {isLookingUp && <p className="mt-1.5 text-xs text-emerald-700">Đang tự tra thông tin giao dịch...</p>}
      </div>

      {preview && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-emerald-700">Đã tìm thấy giao dịch báo mất</p>
              <p className="mt-1 font-bold text-slate-950">{preview.publicationTitle}</p>
              <p className="mt-0.5 font-mono text-xs text-slate-600">{preview.barcode}</p>
            </div>
            <span className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-bold text-red-700">
              {preview.itemStatus === 'LOST' ? 'Đang báo mất' : preview.itemStatus}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-white p-3">
              <p className="text-slate-400">Bạn đọc</p>
              <p className="font-semibold text-slate-900">{preview.borrowerName}</p>
              <p className="font-mono text-slate-500">{preview.borrowerCode}</p>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-slate-400">Số phạt/cọc liên quan</p>
              <p className="font-semibold text-red-700">Phạt mất: {formatVND(Number(preview.lostFineAmount || 0))}</p>
              <p className="text-amber-700">Đã cấn cọc: {formatVND(Number(preview.depositAppliedAmount || 0))}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Lý do tìm lại</label>
          <select
            value={recoveryReason}
            onChange={e => setRecoveryReason(e.target.value as typeof recoveryReason)}
            disabled={!preview}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="READER_FOUND">Bạn đọc tìm lại và nộp tại quầy</option>
            <option value="LIBRARY_FOUND">Thư viện tìm thấy trong khuôn viên/kho</option>
            <option value="INVENTORY_FOUND">Tìm thấy khi kiểm kê</option>
            <option value="OTHER">Lý do khác</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Trạng thái sau khi tìm lại</label>
          <select
            value={newItemStatus}
            onChange={e => setNewItemStatus(e.target.value as 'AVAILABLE' | 'IN_MAINTENANCE')}
            disabled={!preview}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="AVAILABLE">Có sẵn để mượn lại</option>
            <option value="IN_MAINTENANCE">Đưa vào bảo trì/kiểm tra</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Số tiền hoàn/miễn phạt (đ)</label>
        <CurrencyInput
          value={refundAmount}
          onValueChange={setRefundAmount}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          disabled={!preview}
          placeholder="Hệ thống sẽ gợi ý sau khi tra giao dịch"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
        />
        {preview && (
          <p className="mt-1.5 text-xs text-slate-500">
            Gợi ý theo dữ liệu giao dịch: {formatVND(Number(preview.suggestedRefundAmount || 0))}. Thủ thư có thể điều chỉnh theo thực tế đã thu/hoàn.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Ghi chú thêm</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          disabled={!preview}
          placeholder="Không bắt buộc. Lý do chính đã được chọn ở trên."
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">{error}</p>
            <p className="text-xs text-red-700 mt-1">Kiểm tra giao dịch đã từng báo mất và bản sao hiện vẫn đang ở trạng thái Mất.</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle size={24} className="text-emerald-600" />
            <div>
              <p className="font-bold text-emerald-900">Đã ghi nhận tìm lại sách</p>
              <p className="text-xs text-emerald-700 font-mono">Mã phục hồi #{success.recoveryId}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-white border border-emerald-100 p-3">
              <p className="text-slate-500 text-xs">Sách</p>
              <p className="font-semibold text-slate-900">{success.publicationTitle}</p>
              <p className="font-mono text-xs text-slate-500">{success.barcode}</p>
            </div>
            <div className="rounded-lg bg-white border border-emerald-100 p-3">
              <p className="text-slate-500 text-xs">Quyết toán</p>
              <p className="font-semibold text-slate-900">Đảo phạt: {formatVND(Number(success.reversedLostFineAmount || 0))}</p>
              <p className="font-semibold text-emerald-700">Hoàn/miễn: {formatVND(Number(success.refundAmount || 0))}</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !preview || Number(refundAmount || 0) < 0}
        className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? 'Đang xử lý...' : 'Xác nhận tìm lại sách'}
      </button>
    </div>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────

const Circulation = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useLanguage();
  const requestedTab = searchParams.get('tab');
  const mainTab: MainTab = ['pickup', 'direct', 'return', 'reshelving', 'restoreLost', 'fines'].includes(requestedTab || '') ? requestedTab as MainTab : 'pickup';
  const setMainTab = (tab: MainTab) => setSearchParams(previous => { const next = new URLSearchParams(previous); next.set('tab', tab); return next; }, { replace: true });
  const [reshelvingCount, setReshelvingCount] = useState<number | null>(null);
  const [reshelvingBranch, setReshelvingBranch] = useState<string | null>(null);
  useEffect(() => {
    let disposed = false;
    reshelvingService.getDefaultBranch().then(response => {
      if (!disposed) setReshelvingBranch(response.data.branch);
    }).catch(() => { if (!disposed) setReshelvingBranch('ALL'); });
    return () => { disposed = true; };
  }, []);
  const [policy, setPolicy] = useState<CirculationPolicy | null>(null);
  const [policyError, setPolicyError] = useState('');

  useEffect(() => {
    if (reshelvingBranch === null) return;
    let disposed = false, sequence = 0;
    const refresh = () => {
      const request = ++sequence;
      void reshelvingService.getCount(reshelvingBranch).then(response => {
        if (!disposed && request === sequence) setReshelvingCount(response.data.count);
      }).catch(() => { /* Preserve the last known count; the tab exposes loading errors. */ });
    };
    refresh();
    window.addEventListener(RESHELVING_CHANGED, refresh);
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { disposed = true; window.clearInterval(timer); window.removeEventListener(RESHELVING_CHANGED, refresh); window.removeEventListener('focus', refresh); };
  }, [mainTab, reshelvingBranch]);

  useEffect(() => {
    circulationPolicyService.getPolicy()
      .then(res => {
        if (res.code === 200 && res.data) setPolicy(res.data);
      })
      .catch(() => {
        setPolicyError('Không tải được quy định mượn trả. Vui lòng đăng nhập lại hoặc kiểm tra backend.');
      });
  }, []);

  if (!policy) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className={`rounded-xl border p-5 text-sm ${policyError ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-500'}`}>
          {policyError || 'Đang tải quy định mượn trả từ cấu hình Admin...'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quản lý mượn sách</h1>
        <p className="text-slate-500 text-sm mt-1">Xác nhận giao sách, mượn trực tiếp và xử lý trả sách tại thư viện.</p>
      </div>

      {/* Main tab */}
      <div className="flex flex-wrap gap-3 border-b border-slate-200">
        <button
          onClick={() => setMainTab('pickup')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            mainTab === 'pickup' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Xác nhận giao sách
        </button>
        <button
          onClick={() => setMainTab('direct')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            mainTab === 'direct' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Mượn trực tiếp
        </button>
        <button
          onClick={() => setMainTab('return')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            mainTab === 'return' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Trả sách
        </button>
        <button
          onClick={() => setMainTab('reshelving')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${mainTab === 'reshelving' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          {language === 'en' ? 'Reshelving' : 'Xếp giá sách'} <span className="ml-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">{reshelvingCount ?? '…'}</span>
        </button>
        <button
          onClick={() => setMainTab('restoreLost')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            mainTab === 'restoreLost' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tìm lại sách mất
        </button>
        <button
          onClick={() => setMainTab('fines')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            mainTab === 'fines' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Thu phí phạt
        </button>
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 dark:bg-slate-900 dark:border-slate-700">
        {mainTab === 'pickup'
          ? <PickupTab policy={policy} />
          : mainTab === 'direct'
            ? <DirectBorrowTab policy={policy} />
            : mainTab === 'return'
              ? <ReturnTab policy={policy} />
              : mainTab === 'reshelving'
                ? <ReshelvingTab onCount={setReshelvingCount} onBranch={setReshelvingBranch} />
              : mainTab === 'restoreLost'
                ? <RestoreLostTab />
                : <FineTab />}
      </div>

      {/* Info card */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 dark:bg-blue-500/10 dark:border-blue-500/30">
        <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700 space-y-1 dark:text-blue-300">
          {mainTab === 'pickup' ? (
            <>
              <p><span className="font-semibold">Quét QR:</span> User mang QR từ app — scanner tự điền mã giao dịch.</p>
              <p><span className="font-semibold">Nhập thủ công:</span> User không có QR — nhập MSSV + barcode sách.</p>
              <p>Chỉ tra được phiếu đang ở trạng thái <span className="font-semibold">Chờ lấy sách</span>.</p>
              <p>Khi xác nhận giao sách, hệ thống ghi nhận thủ thư đang đăng nhập đã thu cọc <span className="font-semibold">{formatVND(Number(policy.defaultDepositAmount || 0))}/cuốn</span>.</p>
            </>
          ) : mainTab === 'direct' ? (
            <>
              <p><span className="font-semibold">Mượn trực tiếp:</span> Áp dụng khi độc giả đến thư viện mà không đặt trước.</p>
              <p>Sách được ghi nhận <span className="font-semibold">BORROWING ngay</span>, hạn trả {policy.defaultLoanDays} ngày kể từ hôm nay.</p>
              <p>Thu cọc tại quầy: <span className="font-semibold">{formatVND(Number(policy.defaultDepositAmount || 0))}/cuốn</span>. Cọc sẽ được hoàn hoặc cấn trừ khi trả sách.</p>
              <p>Hệ thống sẽ kiểm tra: giới hạn {policy.maxActiveBorrows} cuốn{policy.blockBorrowWhenUnpaidFines ? ', phí phạt chưa trả,' : ','} và không mượn trùng sách.</p>
            </>
          ) : mainTab === 'return' ? (
            <>
              <p>Nhập <span className="font-semibold">MSSV</span> để xem danh sách sách đang mượn của sinh viên.</p>
              <p>Chọn từng cuốn để <span className="font-semibold">Trả</span>, <span className="font-semibold">Báo hư</span> hoặc <span className="font-semibold">Báo mất</span>. Phí trễ hạn (<span className="font-semibold">{formatVND(Number(policy.overdueFinePerDay || 0))}/ngày</span>) được tính tự động khi trả.</p>
              <p>Khi hoàn tất trả sách, hệ thống tự quyết toán: phạt gốc trừ cọc đã thu, sau đó hiển thị số hoàn lại hoặc số cần thu thêm.</p>
            </>
          ) : mainTab === 'reshelving' ? (
            <p>{language === 'en' ? 'Select the books physically shelved, then confirm. Books borrowed or held for reservations automatically leave this queue.' : 'Chọn đúng các cuốn đã cất lên kệ rồi xác nhận. Sách được mượn tiếp hoặc giữ cho người đặt trước tự động rời hàng chờ này.'}</p>
          ) : mainTab === 'restoreLost' ? (
            <>
              <p>Áp dụng khi một bản sao đã được báo <span className="font-semibold">Mất</span> nhưng sau đó tìm lại được.</p>
              <p>Thủ thư chỉ nhập <span className="font-semibold">mã giao dịch</span>; hệ thống tự lấy tên sách, barcode và gợi ý số tiền hoàn/miễn.</p>
              <p>Thủ thư chọn lý do, số tiền hoàn/miễn thực tế; hệ thống đảo khoản phạt mất sách về 0, ghi log phục hồi và cập nhật trạng thái bản sao.</p>
              <p>Phí trễ hạn hoặc các khoản phạt khác của cùng giao dịch vẫn được giữ nguyên.</p>
            </>
          ) : (
            <>
              <p>Nhập <span className="font-semibold">MSSV</span> để xem danh sách phí phạt chưa thanh toán của sinh viên.</p>
              <p>Có thể thanh toán từng khoản riêng lẻ hoặc <span className="font-semibold">thanh toán tất cả</span> cùng lúc.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Circulation;

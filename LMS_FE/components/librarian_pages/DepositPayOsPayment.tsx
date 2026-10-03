import { useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import depositPaymentService, { DepositPaymentOrder, DepositPaymentRequest } from '../../api/depositPaymentService';
import { useLanguage } from '../../contexts/LanguageContext';
import { getFriendlyErrorMessage } from '../../utils/errorMessages';

export function useDepositPayOs(request: DepositPaymentRequest | null) {
  const { language } = useLanguage();
  const key = JSON.stringify(request);
  const currentKey = useRef(key);
  currentKey.current = key;
  const [entry, setEntry] = useState<{ key: string; order: DepositPaymentOrder } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const order = entry?.key === key ? entry.order : null;
  const paid = order?.status === 'PAID';
  const locked = busy || !!(order && !['CANCELLED', 'EXPIRED'].includes(order.status));
  useEffect(() => { setError(''); }, [key]);

  const create = async () => {
    if (!request || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      const response = await depositPaymentService.create(request);
      if (currentKey.current === key) setEntry({ key, order: response.data });
    } catch (err) { if (currentKey.current === key) setError(getFriendlyErrorMessage(err, language)); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const cancel = async () => {
    if (!order || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      const response = await depositPaymentService.cancel(order.orderCode);
      if (currentKey.current === key) setEntry({ key, order: response.data });
    } catch (err) { if (currentKey.current === key) setError(getFriendlyErrorMessage(err, language)); }
    finally { inFlight.current = false; setBusy(false); }
  };

  useEffect(() => {
    if (!order || !['CREATING', 'PENDING'].includes(order.status)) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      let terminal = false;
      try {
        const response = await depositPaymentService.sync(order.orderCode);
        if (stopped || currentKey.current !== key) return;
        setEntry({ key, order: response.data }); setError('');
        terminal = !['CREATING', 'PENDING'].includes(response.data.status);
        if (response.data.status === 'PAID') toast.success(language === 'en' ? 'Deposit received by payOS. You may now hand over the book.' : 'payOS đã nhận tiền cọc. Có thể xác nhận giao sách.');
      } catch (err) { if (!stopped && currentKey.current === key) setError(getFriendlyErrorMessage(err, language)); }
      if (!stopped && !terminal) timer = setTimeout(poll, 4000);
    };
    void poll();
    return () => { stopped = true; clearTimeout(timer); };
  }, [order?.orderCode, order?.status, key, language]);

  return { order, paid, locked, busy, error, create, cancel, reset: () => { setEntry(null); setError(''); } };
}

export default function DepositPayOsPayment({ payment, disabled = false }: { payment: ReturnType<typeof useDepositPayOs>; disabled?: boolean }) {
  const { language } = useLanguage();
  const en = language === 'en';
  const { order } = payment;
  return (
    <section aria-label={en ? 'payOS deposit payment' : 'Thu cọc qua payOS'} className="mb-4 space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-slate-200">
      <h4 className="font-semibold">{en ? 'payOS deposit payment' : 'Thu cọc qua payOS'}</h4>
      {payment.error && <p role="alert" className="text-red-700 dark:text-red-300">{payment.error}</p>}
      {!order || ['CANCELLED', 'EXPIRED'].includes(order.status) ? <>
        {order && <p>{en ? 'The previous payment was cancelled or expired.' : 'Đơn trước đã hủy hoặc hết hạn.'}</p>}
        <p>{en ? 'Create the QR for this reader and copy. Hand over only after payOS confirms payment.' : 'Tạo QR cho đúng bạn đọc và bản sao. Chỉ giao sách sau khi payOS xác nhận đã nhận cọc.'}</p>
        <button type="button" onClick={payment.create} disabled={payment.busy || disabled} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">
          {payment.busy ? (en ? 'Creating QR…' : 'Đang tạo QR…') : (en ? 'Create deposit QR' : 'Tạo QR thu cọc')}
        </button>
      </> : <>
        <p className="font-semibold">{order.fullName} ({order.studentId}) · {order.barcode}</p>
        <p>{order.publicationTitle}</p>
        <dl className="grid grid-cols-2 gap-2">
          <dt>{en ? 'Deposit' : 'Tiền cọc'}</dt><dd className="font-bold">{new Intl.NumberFormat('vi-VN').format(order.amount)}đ</dd>
          <dt>{en ? 'Transfer description' : 'Nội dung chuyển khoản'}</dt><dd className="font-mono">{order.description}</dd>
          <dt>{en ? 'Order code' : 'Mã đơn hàng'}</dt><dd className="break-all font-mono">{order.orderCode}</dd>
        </dl>
        {payment.paid ? <p role="status" className="font-semibold text-emerald-700 dark:text-emerald-300">{en ? 'Deposit paid. Confirm the book handover below.' : 'Đã nhận tiền cọc. Bấm xác nhận bên dưới để hoàn tất giao sách.'}</p>
          : order.status === 'CONSUMED' ? <p role="status">{en ? 'This deposit has already been used. Look up the transaction again.' : 'Đơn cọc đã được sử dụng. Hãy tra cứu lại giao dịch.'}</p>
          : <>
            {order.qrCode && <div className="mx-auto w-fit rounded-lg bg-white p-4" role="img" aria-label={en ? 'payOS deposit QR code' : 'Mã QR payOS thu cọc'}><QRCode value={order.qrCode} size={200} /></div>}
            {!order.qrCode && <p>{en ? 'The existing order was recovered after a connection error. Open its payOS checkout to view the QR; do not create another payment.' : 'Đã khôi phục đơn cũ sau lỗi kết nối. Mở trang payOS của đơn này để xem QR, không tạo khoản thanh toán mới.'}</p>}
            <p role="status">{en ? 'Waiting for payment; checking automatically every 4 seconds.' : 'Chờ bạn đọc thanh toán; tự động kiểm tra mỗi 4 giây.'}</p>
            {order.checkoutUrl && <a href={order.checkoutUrl} target="_blank" rel="noopener noreferrer" className="inline-block underline">{en ? 'Open payOS checkout' : 'Mở trang thanh toán payOS'}</a>}
            <button type="button" disabled={payment.busy || disabled} onClick={payment.cancel} className="ml-3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">{en ? 'Cancel unpaid order' : 'Hủy đơn chưa nhận tiền'}</button>
          </>}
      </>}
    </section>
  );
}

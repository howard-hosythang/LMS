import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import fineService, { Fine } from '../../api/fineService';
import { useLanguage } from '../../contexts/LanguageContext';
import { getFriendlyErrorMessage } from '../../utils/errorMessages';
import { formatVnd } from '../../utils/currency';
import CurrencyInput from '../CurrencyInput';

export default function FineAdjustmentDialog({ fines, onClose, onUpdated }: {
  fines: Fine[];
  onClose: () => void;
  onUpdated: () => Promise<unknown>;
}) {
  const { language } = useLanguage();
  const en = language === 'en';
  const [fineId, setFineId] = useState(fines[0]?.fineId ?? '');
  const fine = fines.find(item => item.fineId === fineId);
  const [amount, setAmount] = useState(String(fine?.fineAmount ?? ''));
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    dialogRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    return () => previous?.focus();
  }, []);
  const valid = amount !== '' && Number(amount) >= 1 && Number(amount) <= 10000000;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4">
      <form ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="fine-adjustment-title"
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 text-slate-900 shadow-xl dark:bg-slate-900 dark:text-slate-100"
        onKeyDown={event => {
          if (event.key === 'Escape' && !saving) onClose();
          if (event.key === 'Tab') {
            const nodes = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('input:not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled)') ?? []);
            const first = nodes[0], last = nodes[nodes.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
          }
        }}
        onSubmit={async event => {
          event.preventDefault();
          if (!fine || !valid || saving) return;
          setSaving(true);
          try {
            await fineService.updateAmount(fineId, Number(amount), reason.trim() || undefined);
            toast.success(en ? 'Fine updated' : 'Đã cập nhật phí phạt');
            await onUpdated();
            onClose();
          } catch (error) { toast.error(getFriendlyErrorMessage(error, language)); }
          finally { setSaving(false); }
        }}>
        <h2 id="fine-adjustment-title" className="text-lg font-bold">{en ? 'Edit unpaid fine' : 'Chỉnh sửa phí chưa thanh toán'}</h2>
        <p className="text-sm text-slate-500">{en ? 'Adjust the remaining amount due. Deposit amounts already applied or refunded are preserved.' : 'Điều chỉnh số tiền còn phải thu. Tiền cọc đã cấn trừ hoặc đã hoàn được giữ nguyên.'}</p>
        {fines.length > 1 && <label className="block text-sm">{en ? 'Fine' : 'Khoản phạt'}
          <select disabled={saving} value={fineId} onChange={event => {
            setFineId(event.target.value);
            setAmount(String(fines.find(item => item.fineId === event.target.value)?.fineAmount ?? ''));
          }} className="mt-1 w-full rounded-lg border p-2 dark:bg-slate-800">
            {fines.map(item => <option key={item.fineId} value={item.fineId}>{item.type} — {formatVnd(item.fineAmount)}</option>)}
          </select>
        </label>}
        <p className="text-sm">{fine?.publicationTitle} · {en ? 'Current fee:' : 'Phí hiện tại:'} {formatVnd(fine?.fineAmount)}</p>
        <label className="block text-sm font-medium">{en ? 'New amount (VND)' : 'Số tiền mới (đ)'}
          <CurrencyInput required disabled={saving} value={amount} onValueChange={setAmount} aria-describedby="fine-amount-help"
            className="mt-1 w-full rounded-lg border border-slate-300 p-3 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800" />
        </label>
        <p id="fine-amount-help" className={valid ? 'text-xs text-slate-500' : 'text-xs text-rose-600'}>{en ? 'Enter an integer from 1 to 10,000,000 VND.' : 'Nhập số nguyên từ 1đ đến 10.000.000đ.'}</p>
        <label className="block text-sm font-medium">{en ? 'Reason (optional)' : 'Lý do điều chỉnh (tùy chọn)'}
          <textarea disabled={saving} maxLength={500} value={reason} onChange={event => setReason(event.target.value)} rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 p-3 dark:bg-slate-800" />
        </label>
        <div className="flex justify-end gap-3">
          <button type="button" disabled={saving} onClick={onClose} className="rounded-lg border px-4 py-2 disabled:opacity-50">{en ? 'Cancel' : 'Hủy'}</button>
          <button disabled={saving || !valid} className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{saving ? (en ? 'Saving…' : 'Đang lưu…') : (en ? 'Save' : 'Lưu thay đổi')}</button>
        </div>
      </form>
    </div>, document.body);
}

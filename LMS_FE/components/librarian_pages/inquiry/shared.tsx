import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getFriendlyErrorMessage } from '../../../utils/errorMessages';
import { InquiryPage } from '../../../api/circulationInquiryService';

export const fieldClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100';
export const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800';
export function useCopy() { const { language } = useLanguage(); return (vi: string, en: string) => language === 'en' ? en : vi; }
export function money(value?: number | null) { return `${Number(value ?? 0).toLocaleString('vi-VN')}đ`; }
export function date(value?: string | null, en = false, dateOnly = false) {
  if (!value) return '—';
  const parsed = new Date(value.length === 10 ? `${value}T00:00:00+07:00` : value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString(en ? 'en-GB' : 'vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', ...(!dateOnly && value.length !== 10 ? { hour: '2-digit' as const, minute: '2-digit' as const } : {}) });
}
const names: Record<string, [string, string]> = {
  WAITING_FOR_PICKUP: ['Chờ nhận sách', 'Waiting for pickup'], BORROWING: ['Đang mượn', 'Borrowing'], OVERDUE: ['Quá hạn', 'Overdue'], RETURNED: ['Đã trả', 'Returned'], CANCELLED: ['Đã hủy', 'Cancelled'],
  AVAILABLE: ['Có sẵn', 'Available'], BORROWED: ['Đang mượn', 'Borrowed'], RESERVED: ['Giữ tại quầy', 'Reserved at desk'], IN_MAINTENANCE: ['Bảo trì', 'Maintenance'], LOST: ['Mất', 'Lost'],
  UNPAID: ['Chưa thanh toán', 'Unpaid'], PAID: ['Đã thanh toán', 'Paid'], OVERDUE_RETURN: ['Trả quá hạn', 'Overdue return'], DAMAGED_BOOK: ['Hỏng sách', 'Damaged book'], LOST_BOOK: ['Mất sách', 'Lost book'],
  ACQUIRED: ['Nhập kho (ngày ghi nhận)', 'Acquired (recorded date)'], REQUEST: ['Tạo yêu cầu mượn', 'Borrow request created'], ISSUE: ['Bàn giao sách', 'Book issued'], RETURN: ['Nhận trả sách', 'Book returned'],
  FINE_CREATED: ['Phát sinh khoản phạt', 'Fine created'], FINE_PAID: ['Thanh toán khoản phạt', 'Fine paid'], RESHELVING_QUEUED: ['Đưa vào hàng chờ cất kệ', 'Queued for shelving'], SHELVED: ['Xác nhận cất kệ', 'Shelving confirmed'], NOTE: ['Ghi chú nội bộ', 'Internal note'],
  PICKUP_EXPIRED: ['Không đến nhận sách', 'Pickup expired'], RESERVATION_EXPIRED: ['Đặt trước hết hạn', 'Reservation expired'], RESERVATION_CANCELLED: ['Hủy đặt trước', 'Reservation cancelled'], LOST_RECOVERED: ['Tìm lại sách mất', 'Lost book recovered'],
  COLLECTED: ['Đã thu cọc', 'Deposit collected'], REFUNDED: ['Đã hoàn cọc', 'Deposit refunded'], FORFEITED: ['Đã cấn trừ cọc', 'Deposit forfeited'], NOT_REQUIRED: ['Không yêu cầu', 'Not required'],
  APPLIED_TO_FINE: ['Đã cấn cọc vào phạt', 'Deposit applied to fines'], ADDITIONAL_DUE: ['Còn phải thu thêm', 'Additional amount due'],
  NEW: ['Mới', 'New'], GOOD: ['Tốt', 'Good'], OLD: ['Cũ', 'Used'], WORN: ['Sờn', 'Worn'], DAMAGED: ['Hỏng', 'Damaged'],
};
export function label(code?: string | null, en = false) { return code ? names[code]?.[en ? 1 : 0] ?? code : '—'; }
export function Badge({ value }: { value?: string | null }) {
  const { language } = useLanguage();
  const warning = ['OVERDUE', 'UNPAID', 'LOST', 'IN_MAINTENANCE'].includes(value || '');
  return <span className={`inline-block rounded-full border px-2.5 py-1 text-xs font-semibold ${warning ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200' : 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200'}`}>{label(value, language === 'en')}</span>;
}
export function useResource<T>(key: string | null, loader: () => Promise<T>) {
  const { language } = useLanguage();
  const load = useRef(loader); load.current = loader;
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{ key: string | null; data: T | null; loading: boolean; error: string }>({ key: null, data: null, loading: false, error: '' });
  useEffect(() => {
    if (!key) return;
    let disposed = false;
    setState({ key, data: null, loading: true, error: '' });
    load.current().then(data => { if (!disposed) setState({ key, data, loading: false, error: '' }); })
      .catch(error => { if (!disposed) setState({ key, data: null, loading: false, error: getFriendlyErrorMessage(error, language) }); });
    return () => { disposed = true; };
  }, [key, version, language]);
  return { data: state.key === key ? state.data : null, loading: !!key && (state.key !== key || state.loading), error: state.key === key ? state.error : '', refresh: () => setVersion(v => v + 1) };
}
export function LoadState({ loading, error, children }: { loading: boolean; error: string; children?: ReactNode }) {
  const t = useCopy();
  return loading ? <p role="status" className="p-6 text-sm text-slate-600 dark:text-slate-300">{t('Đang tải…', 'Loading…')}</p>
    : error ? <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-200">{error}</p> : <>{children}</>;
}
export function Pager({ data, onPage }: { data: Pick<InquiryPage<unknown>, 'currentPage' | 'totalPages' | 'totalElements'>; onPage: (page: number) => void }) {
  const t = useCopy();
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-3 text-sm dark:border-slate-700">
    <span>{t('Tổng', 'Total')} {data.totalElements} · {t('Trang', 'Page')} {data.totalPages ? data.currentPage + 1 : 0}/{data.totalPages}</span>
    <div className="flex gap-2"><button className={buttonClass} disabled={data.currentPage <= 0} onClick={() => onPage(data.currentPage - 1)}>{t('Trước', 'Previous')}</button><button className={buttonClass} disabled={data.currentPage + 1 >= data.totalPages} onClick={() => onPage(data.currentPage + 1)}>{t('Sau', 'Next')}</button></div>
  </div>;
}
export function NewTabLink({ to, children }: { to: string; children: ReactNode }) { const t = useCopy(); return <a href={`#${to.startsWith('/') ? to : `/${to}`}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-indigo-700 hover:underline dark:text-indigo-300" onClick={event => event.stopPropagation()}>{children}<ExternalLink size={13} aria-label={t('Mở tab mới', 'Opens in new tab')} /></a>; }
export function InquiryDrawer({ title, onClose, children, widthClass = 'max-w-4xl' }: { title: string; onClose: () => void; children: ReactNode; widthClass?: string }) {
  const t = useCopy();
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; ref.current?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = overflow; previous?.focus({ preventScroll: true }); };
  }, []);
  return createPortal(<div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`flex h-full w-full ${widthClass} flex-col bg-white text-slate-900 shadow-xl dark:bg-slate-900 dark:text-slate-100`} onKeyDown={event => {
      if (event.key === 'Escape') { event.stopPropagation(); closeRef.current(); }
      if (event.key === 'Tab') {
        const nodes = Array.from(ref.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? []);
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { event.preventDefault(); first?.focus(); }
      }
    }}>
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-700"><h2 className="text-lg font-bold">{title}</h2><button className={buttonClass} onClick={onClose} aria-label={t('Đóng', 'Close')}><X size={18} /></button></header>
      <div className="overflow-y-auto p-5">{children}</div>
    </div>
  </div>, document.body);
}

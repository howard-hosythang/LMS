import { useState } from 'react';
import inquiry from '../../../api/circulationInquiryService';
import transactions from '../../../api/transactionsService';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAppDialog } from '../../../contexts/AppDialogContext';
import { getFriendlyErrorMessage } from '../../../utils/errorMessages';
import { Badge, buttonClass, date, fieldClass, InquiryDrawer, label, LoadState, money, NewTabLink, useCopy, useResource } from './shared';

export default function TransactionDetailDrawer({ id, onClose, onUpdated, onBook }: { id: string; onClose: () => void; onUpdated: () => void; onBook: (publicationId: string, itemId?: string) => void }) {
  const t = useCopy(); const { language } = useLanguage(); const en = language === 'en'; const dialog = useAppDialog();
  const resource = useResource(id, async () => { const [detail, notes] = await Promise.all([inquiry.transaction(id), transactions.getNotes(id)]); return { ...detail, notes: notes.data }; });
  const [draft, setDraft] = useState(''); const [important, setImportant] = useState(false); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const add = async () => {
    if (!draft.trim() || saving) return;
    setSaving(true); setError('');
    try { await transactions.upsertNote(id, { note: draft.trim(), important }); setDraft(''); setImportant(false); resource.refresh(); onUpdated(); }
    catch (cause) { setError(getFriendlyErrorMessage(cause, language)); } finally { setSaving(false); }
  };
  const remove = async (noteId: string) => {
    if (saving) return;
    if (!await dialog.confirm({ title: t('Xóa ghi chú', 'Delete note'), message: t('Xóa ghi chú này? Không thể hoàn tác.', 'Delete this note? This cannot be undone.'), variant: 'danger' })) return;
    setSaving(true); setError('');
    try { await transactions.deleteNote(id, noteId); resource.refresh(); onUpdated(); }
    catch (cause) { setError(getFriendlyErrorMessage(cause, language)); } finally { setSaving(false); }
  };
  const tx = resource.data?.transaction;
  return <InquiryDrawer title={`${t('Chi tiết giao dịch', 'Transaction details')} #${id}`} onClose={onClose}>
    <LoadState loading={resource.loading} error={resource.error}>{tx && <div className="space-y-6">
      <section className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><h3 className="font-semibold">{tx.publicationTitle || '—'}</h3><p className="mt-1 text-sm">{tx.barcode} · {tx.branch} · {tx.location}</p><p className="mt-2 text-sm">{tx.fullName} · {tx.studentId}</p><div className="mt-3 flex flex-wrap items-center gap-3"><Badge value={tx.status} />{tx.publicationId && <button className={buttonClass} onClick={() => onBook(tx.publicationId!, tx.itemId || undefined)}>{t('Xem nhanh sách', 'Quick book view')}</button>}{tx.itemId && <NewTabLink to={`/librarianpage/copies/${tx.itemId}`}>{t('Chi tiết bản sao', 'Copy details')}</NewTabLink>}</div></section>
      <section><h3 className="mb-3 font-semibold">{t('Lịch trình mượn trả', 'Loan timeline')}</h3><ol className="space-y-3 border-l-2 border-indigo-200 pl-4 dark:border-indigo-500/30">{[
        [t('Tạo yêu cầu', 'Request created'), tx.createdAt, ''], [t('Bàn giao', 'Issued'), tx.borrowedDate, [tx.issueLibrarianName, tx.issueLibrarianCode].filter(Boolean).join(' · ')], [t('Hạn trả hiện tại', 'Current due date'), tx.dueDate, ''], [t('Nhận trả', 'Returned'), tx.returnedDate, [tx.returnLibrarianName, tx.returnLibrarianCode].filter(Boolean).join(' · ')],
      ].filter(([, when]) => when).map(([name, when, actor]) => <li key={name}><p className="text-sm font-medium">{name}</p><p className="text-xs text-slate-600 dark:text-slate-300">{date(when, en)}{actor ? ` · ${actor}` : ''}</p></li>)}</ol></section>
      <section><h3 className="mb-3 font-semibold">{t('Quyết toán cọc', 'Deposit settlement')}</h3><dl className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700">{[
        [t('Tiền cọc', 'Deposit'), money(tx.depositAmount)], [t('Trạng thái cọc', 'Deposit status'), label(tx.depositStatus, en)], [t('Phạt gốc quyết toán', 'Settlement gross fine'), money(tx.grossFineAmount)], [t('Cấn trừ cọc', 'Deposit applied'), money(tx.depositAppliedAmount)], [t('Hoàn cọc', 'Deposit refund'), money(tx.depositRefundAmount)], [t('Thu thêm', 'Additional due'), money(tx.additionalAmountDue)],
      ].map(([name, value]) => <div key={name}><dt className="text-xs text-slate-500 dark:text-slate-400">{name}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}</dl></section>
      <section><h3 className="mb-3 font-semibold">{t('Bảng kê các khoản phạt', 'Itemized fines')}</h3>{!resource.data?.fines.length ? <p className="text-sm">{t('Không có khoản phạt.', 'No fines.')}</p> : <ul className="space-y-3">{resource.data.fines.map(fine => <li key={fine.fineId} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700"><div className="flex flex-wrap justify-between gap-2"><span>#{fine.fineId} · {label(fine.type, en)}</span><strong>{money(fine.fineAmount)}</strong></div><div className="mt-2"><Badge value={fine.status} /></div><p className="mt-2 text-xs">{t('Phát sinh', 'Created')}: {date(fine.createdAt, en)}</p>{fine.paidDate && <p className="mt-1 text-xs">{t('Thanh toán', 'Paid')}: {date(fine.paidDate, en)} · {[fine.paidByName, fine.paidByCode].filter(Boolean).join(' · ') || '—'}</p>}</li>)}</ul>}</section>
      <section><h3 className="mb-3 font-semibold">{t('Ghi chú & Trao đổi nội bộ', 'Internal notes & handover')}</h3><ul className="space-y-3">{resource.data?.notes.map(note => <li key={note.noteId} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"><div className="flex flex-wrap justify-between gap-2 text-xs"><span>{note.librarianName} {note.librarianCode && `(${note.librarianCode})`} · {date(note.createdAt, en)}</span>{note.important && <span className="font-semibold text-amber-700 dark:text-amber-300">{t('Quan trọng', 'Important')}</span>}</div><p className="mt-2 whitespace-pre-wrap text-sm">{note.note}</p>{note.editableByCurrentUser && <div className="mt-2 flex gap-2"><button className={buttonClass} disabled={saving} onClick={() => setDraft(note.note)}>{t('Bổ sung từ ghi chú này', 'Follow up on this note')}</button><button className={buttonClass} disabled={saving} onClick={() => void remove(note.noteId)}>{t('Xóa', 'Delete')}</button></div>}</li>)}</ul>
        {!resource.data?.notes.length && <p className="text-sm text-slate-500 dark:text-slate-400">{t('Chưa có ghi chú.', 'No notes yet.')}</p>}
        <form className="mt-4 space-y-3" onSubmit={event => { event.preventDefault(); void add(); }}><label className="block text-sm">{t('Ghi chú mới', 'New note')}<textarea className={`${fieldClass} mt-1`} value={draft} onChange={event => setDraft(event.target.value)} rows={3} disabled={saving} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={important} onChange={event => setImportant(event.target.checked)} disabled={saving} />{t('Đánh dấu quan trọng', 'Mark important')}</label>{error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}<button type="submit" className={buttonClass} disabled={saving || !draft.trim()}>{saving ? t('Đang lưu…', 'Saving…') : t('Thêm ghi chú', 'Add note')}</button></form>
      </section>
    </div>}</LoadState>
  </InquiryDrawer>;
}

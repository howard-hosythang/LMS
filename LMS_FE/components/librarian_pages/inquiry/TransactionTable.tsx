import { BookOpen, StickyNote } from 'lucide-react';
import { LibrarianTransaction } from '../../../api/transactionsService';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Badge, date, label, money, NewTabLink, useCopy } from './shared';

export interface TableActions { onTransaction: (id: string) => void; onBook: (publicationId: string, itemId?: string) => void; onReader?: (id: string) => void }
export default function TransactionTable({ items, onTransaction, onBook, onReader }: { items: LibrarianTransaction[] } & TableActions) {
  const t = useCopy(); const { language } = useLanguage(); const en = language === 'en';
  if (!items.length) return <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-300">{t('Không có giao dịch phù hợp.', 'No matching transactions.')}</p>;
  return <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm">
    <thead className="bg-slate-50 text-xs uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300"><tr>{[
      t('Giao dịch / Ấn phẩm', 'Transaction / Publication'), t('Bạn đọc', 'Reader'), t('Ngày mượn', 'Borrowed'), t('Hạn trả', 'Due'), t('Ngày trả', 'Returned'), t('Cọc & Phí phạt', 'Deposit & Fines'), t('Trạng thái', 'Status'), t('Chi tiết', 'Details'),
    ].map(title => <th scope="col" key={title} className="px-4 py-3">{title}</th>)}</tr></thead>
    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">{items.map(tx => <tr key={tx.transactionId} onClick={() => onTransaction(tx.transactionId)} className="cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-slate-800/70">
      <td className="p-4"><div className="flex items-start gap-3">
        {tx.coverImageUrl ? <img src={tx.coverImageUrl} alt="" loading="lazy" className="h-16 w-11 shrink-0 rounded object-cover" /> : <span className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-slate-100 dark:bg-slate-800"><BookOpen size={20} aria-hidden="true" /></span>}
        <div className="min-w-[180px] max-w-xs"><div className="mb-1 font-mono text-[11px] text-slate-500">#{tx.transactionId}</div>
          <button className="text-left font-semibold text-indigo-700 hover:underline dark:text-indigo-300" onClick={event => { event.stopPropagation(); if (tx.publicationId) onBook(tx.publicationId); }}>{tx.publicationTitle || t('Chưa có thông tin sách', 'Publication unavailable')}</button>
          <div className="mt-1"><button className="font-mono text-xs hover:underline" onClick={event => { event.stopPropagation(); if (tx.publicationId) onBook(tx.publicationId, tx.itemId || undefined); }}>{tx.barcode || '—'}</button></div>
          <div className="mt-1 flex flex-wrap gap-2">{tx.publicationId && <NewTabLink to={`/librarianpage/books/${tx.publicationId}`}>{t('Đầu sách', 'Book')}</NewTabLink>}{tx.itemId && <NewTabLink to={`/librarianpage/copies/${tx.itemId}`}>{t('Bản sao', 'Copy')}</NewTabLink>}</div>
        </div></div></td>
      <td className="p-4"><button className="text-left font-medium hover:underline" onClick={event => { event.stopPropagation(); onReader?.(tx.userId); }}>{tx.fullName || '—'}</button><div className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">{tx.studentId || '—'}</div></td>
      <td className="p-4 whitespace-nowrap">{date(tx.borrowedDate, en)}</td><td className="p-4 whitespace-nowrap">{date(tx.dueDate, en)}</td><td className="p-4 whitespace-nowrap">{date(tx.returnedDate, en)}</td>
      <td className="p-4"><div>{t('Cọc', 'Deposit')}: {money(tx.depositAmount)}</div><div className="mt-1 font-semibold text-rose-700 dark:text-rose-300">{t('Phạt', 'Fine')}: {money(tx.fineAmount)}</div>
        {tx.fineTypes && <div className="mt-1 text-xs">{tx.fineTypes.split(',').map(code => label(code.trim(), en)).join(', ')}</div>}
        {tx.finePaidByLibrarianName && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('Người thu (tóm tắt)', 'Collector (summary')}: {tx.finePaidByLibrarianName} {tx.finePaidByLibrarianCode}</div>}
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('Cấn cọc', 'Applied')}: {money(tx.depositAppliedAmount)} · {t('Hoàn', 'Refund')}: {money(tx.depositRefundAmount)}</div><div className="mt-1 text-xs">{t('Thu thêm', 'Extra due')}: {money(tx.additionalAmountDue)}</div>
      </td>
      <td className="space-y-2 p-4"><Badge value={tx.status} />{tx.finePaymentStatus && <div><Badge value={tx.finePaymentStatus} /></div>}</td>
      <td className="p-4"><button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold dark:border-slate-600" onClick={event => { event.stopPropagation(); onTransaction(tx.transactionId); }}>{t('Xem chi tiết', 'View details')}</button>
        {(tx.note || tx.important) && <button className={`mt-2 flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${tx.important ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200' : 'border-slate-200 dark:border-slate-600'}`} title={tx.note || t('Ghi chú quan trọng', 'Important note')} onClick={event => { event.stopPropagation(); onTransaction(tx.transactionId); }}><StickyNote size={13} aria-hidden="true" />{tx.important ? t('Quan trọng', 'Important') : t('Ghi chú', 'Notes')}</button>}
      </td>
    </tr>)}</tbody>
  </table></div>;
}

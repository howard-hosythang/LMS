import { useEffect, useRef, useState } from 'react';
import inquiry from '../../../api/circulationInquiryService';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getFriendlyErrorMessage } from '../../../utils/errorMessages';
import BookOverview from './BookOverview';
import { BranchSelect } from './BookQuickViewDrawer';
import { TableActions } from './TransactionTable';
import { buttonClass, date, fieldClass, label, LoadState, money, NewTabLink, Pager, useCopy, useResource } from './shared';
import { idValue, pageNumber, useSearchInput, useInquiryUrl } from './useInquiryUrl';

export default function BookLifecycle({ actions, refresh }: { actions: TableActions; refresh: number }) {
  const t = useCopy(); const { language } = useLanguage(); const en = language === 'en'; const { params, update } = useInquiryUrl();
  const keyword = params.get('bookKeyword') || '', branch = params.get('branch') || '';
  const [searchTerm, setSearchTerm] = useSearchInput('bookKeyword', { itemPage: 0, timelinePage: 0 });
  const [barcode, setBarcode] = useSearchInput('barcode', { itemPage: 0, timelinePage: 0 });
  const publicationId = idValue(params.get('pubId')), itemId = idValue(params.get('itemId'));
  const copyPage = pageNumber(params.get('itemPage')), timelinePage = pageNumber(params.get('timelinePage'));
  const [scanning, setScanning] = useState(false); const [scanError, setScanError] = useState('');
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const suggestions = useResource(keyword.trim() ? `${keyword}/${branch}` : null, () => inquiry.publications(keyword, branch));
  const overview = useResource(publicationId ? `${publicationId}/${branch}/${copyPage}/${refresh}` : null, () => inquiry.publication(publicationId!, branch, copyPage));
  const copy = useResource(itemId ? `${itemId}/${refresh}` : null, () => inquiry.item(itemId!));
  const timeline = useResource(itemId ? `${itemId}/${timelinePage}/${refresh}` : null, () => inquiry.timeline(itemId!, timelinePage));
  const scan = async () => {
    if (!barcode.trim() || scanning) return;
    setScanning(true); setScanError('');
    try { const found = await inquiry.barcode(barcode.trim()); if (mounted.current) update({ barcode: barcode.trim(), pubId: found.publicationId, itemId: found.itemId, itemPage: 0, timelinePage: 0, bookKeyword: undefined, branch: found.branch || undefined }); }
    catch (cause) { if (mounted.current) setScanError(getFriendlyErrorMessage(cause, language)); } finally { if (mounted.current) setScanning(false); }
  };
  return <div className="space-y-6"><div className="grid items-end gap-4 md:grid-cols-3"><label className="block text-sm font-medium">{t('Tìm theo tên sách', 'Search book title')}<input type="search" className={`${fieldClass} mt-2`} value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder={t('Nhập tên ấn phẩm…', 'Enter publication title…')} /></label><form onSubmit={event => { event.preventDefault(); void scan(); }}><label className="block text-sm font-medium">{t('Quét hoặc nhập barcode', 'Scan or enter barcode')}<div className="mt-2 flex gap-2"><input className={fieldClass} disabled={scanning} value={barcode} onChange={event => setBarcode(event.target.value)} /><button type="submit" className={buttonClass} disabled={scanning || !barcode.trim()}>{t('Tra cứu', 'Lookup')}</button></div></label></form><BranchSelect value={branch} onChange={value => update({ branch: value, itemPage: 0 })} /></div>
    {scanError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{scanError}</p>}
    <LoadState loading={suggestions.loading} error={suggestions.error}>{suggestions.data && <div className="rounded-xl border border-slate-200 dark:border-slate-700">{suggestions.data.map(p => <button key={p.publicationId} className="block w-full border-b border-slate-100 p-3 text-left text-sm last:border-b-0 hover:bg-indigo-50 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => update({ pubId: p.publicationId, itemId: undefined, timelinePage: 0, itemPage: 0, bookKeyword: undefined })}><strong>{p.publicationTitle}</strong><span className="ml-2 text-slate-500 dark:text-slate-400">{p.authors}</span></button>)}{!suggestions.data.length && <p className="p-3 text-sm">{t('Không tìm thấy ấn phẩm.', 'No publications found.')}</p>}</div>}</LoadState>
    <LoadState loading={overview.loading} error={overview.error}>{overview.data && <BookOverview data={overview.data} onPage={next => update({ itemPage: next })} onCopy={item => update({ itemId: item.itemId, timelinePage: 0 })} onTransaction={actions.onTransaction} />}</LoadState>
    {itemId && <section className="space-y-4 rounded-xl border border-slate-200 p-5 dark:border-slate-700"><LoadState loading={copy.loading} error={copy.error}>{copy.data && <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">{t('Vòng đời bản sao', 'Copy lifecycle')}: {copy.data.barcode}</h3><p className="mt-1 text-sm">{copy.data.publicationTitle} · {copy.data.branch} · {copy.data.location || '—'}</p></div><NewTabLink to={`/librarianpage/copies/${itemId}`}>{t('Chi tiết bản sao', 'Copy details')}</NewTabLink></div>}</LoadState>
      <p className="text-xs text-slate-500 dark:text-slate-400">{t('Chỉ hiển thị các sự kiện đã lưu. Tình trạng hiện tại không đại diện cho tình trạng ở các lần trả trước. Chưa có lịch sử bảo trì đầy đủ.', 'Only recorded events are shown. Current condition does not describe previous returns. Complete maintenance history is not available.')}</p>
      <LoadState loading={timeline.loading} error={timeline.error}>{timeline.data && <><ol className="space-y-4 border-l-2 border-indigo-200 pl-5 dark:border-indigo-500/30">{timeline.data.content.map(event => <li key={event.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm">{label(event.type, en)}</strong><time className="text-xs text-slate-500 dark:text-slate-400">{date(event.occurredAt, en, event.dateOnly)}</time></div>{event.detail && <p className="mt-2 whitespace-pre-wrap text-sm">{event.type === 'NOTE' ? event.detail : label(event.detail, en)}</p>}{event.amount != null && <p className="mt-1 text-sm font-semibold">{money(event.amount)}</p>}{event.actorName && <p className="mt-1 text-xs">{event.actorName} · {event.actorCode || '—'}</p>}{event.transactionId && <button className="mt-2 text-xs text-indigo-700 hover:underline dark:text-indigo-300" onClick={() => actions.onTransaction(event.transactionId!)}>{t('Giao dịch', 'Transaction')} #{event.transactionId}</button>}</li>)}</ol>{!timeline.data.content.length && <p className="text-sm">{t('Chưa có sự kiện được ghi nhận.', 'No recorded events.')}</p>}<Pager data={timeline.data} onPage={next => update({ timelinePage: next })} /></>}</LoadState>
    </section>}
    {!publicationId && !itemId && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-300">{t('Tìm đầu sách hoặc quét barcode để bắt đầu tra cứu vòng đời.', 'Search a publication or scan a barcode to explore its lifecycle.')}</p>}
  </div>;
}

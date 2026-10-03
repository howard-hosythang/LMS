import { useState } from 'react';
import { BookOpen, History, RefreshCw, Users } from 'lucide-react';
import transactions, { FinePaymentStatus, TransactionStatus } from '../../../api/transactionsService';
import { useLanguage } from '../../../contexts/LanguageContext';
import TransactionTable, { TableActions } from './TransactionTable';
import TransactionDetailDrawer from './TransactionDetailDrawer';
import BookQuickViewDrawer from './BookQuickViewDrawer';
import ReaderHistory from './ReaderHistory';
import BookLifecycle from './BookLifecycle';
import { buttonClass, fieldClass, label, LoadState, Pager, useCopy, useResource } from './shared';
import { idValue, pageNumber, useSearchInput, useInquiryUrl } from './useInquiryUrl';

export default function TransactionInquiry() {
  const t = useCopy(); const { language } = useLanguage(); const en = language === 'en'; const { params, update } = useInquiryUrl();
  const tab = ['transactions', 'reader', 'lifecycle'].includes(params.get('tab') || '') ? params.get('tab')! : 'transactions';
  const keyword = params.get('keyword') || '', page = pageNumber(params.get('page'));
  const [searchTerm, setSearchTerm, submitSearch] = useSearchInput('keyword', { page: 0 });
  const status = ['WAITING_FOR_PICKUP', 'BORROWING', 'OVERDUE', 'RETURNED', 'CANCELLED'].includes(params.get('status') || '') ? params.get('status') as TransactionStatus : 'ALL';
  const fineStatus = ['UNPAID', 'PAID'].includes(params.get('fineStatus') || '') ? params.get('fineStatus') as FinePaymentStatus : 'ALL';
  const dateType = params.get('dateType') === 'RETURNED' ? 'RETURNED' : 'BORROWED', dateFrom = params.get('dateFrom') || '', dateTo = params.get('dateTo') || '';
  const sortBy = ['createdAt', 'borrowedDate', 'returnedDate', 'dueDate', 'fineAmount'].includes(params.get('sortBy') || '') ? params.get('sortBy')! : 'createdAt', sortDir = params.get('sortDir') === 'ASC' ? 'ASC' : 'DESC';
  const [refresh, setRefresh] = useState(0);
  const list = useResource(tab === 'transactions' ? JSON.stringify([page, keyword, status, fineStatus, dateType, dateFrom, dateTo, sortBy, sortDir, refresh]) : null,
    async () => (await transactions.getAllTransactions(page, 15, keyword, status, fineStatus, dateFrom, dateTo, sortBy, sortDir, dateType)).data);
  const [activeTransactionId, setActiveTransactionId] = useState(() => idValue(params.get('quickPubId')) ? undefined : idValue(params.get('transactionId')) || idValue(params.get('highlight')));
  const [quickBook, setQuickBook] = useState<{ publicationId: string; itemId?: string; branch: string; page: number } | undefined>(() => {
    const publicationId = idValue(params.get('quickPubId'));
    return publicationId ? { publicationId, itemId: idValue(params.get('quickItemId')), branch: params.get('quickBranch') || '', page: pageNumber(params.get('quickPage')) } : undefined;
  });
  const actions: TableActions = {
    onTransaction: id => { setQuickBook(undefined); setActiveTransactionId(id); },
    onBook: (publicationId, itemId) => { setActiveTransactionId(undefined); setQuickBook({ publicationId, itemId, branch: '', page: 0 }); },
    onReader: userId => update({ tab: 'reader', userId, activePage: 0, returnedPage: 0 }),
  };
  const filter = (key: string, value: string) => update({ [key]: value, page: 0 }, true);
  return <main className="space-y-6 p-4 text-slate-900 dark:text-slate-100 sm:p-6 lg:p-8">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">{t('Không gian đối soát thủ thư', 'Librarian inquiry workspace')}</p><h1 className="mt-2 text-2xl font-bold">{t('Trung tâm tra cứu lưu thông', 'Circulation inquiry center')}</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('Tra cứu giao dịch, bạn đọc và vòng đời từng bản sao. Mượn trả và thu phí được xử lý tại Lưu thông.', 'Explore transactions, readers and each copy’s lifecycle. Loans, returns and payments are handled at the circulation desk.')}</p></div><button className={buttonClass} onClick={() => setRefresh(v => v + 1)}><RefreshCw size={16} aria-hidden="true" />{t('Làm mới', 'Refresh')}</button></header>
    <nav aria-label={t('Góc nhìn tra cứu', 'Inquiry views')} className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-700">{[
      ['transactions', t('Nhật ký giao dịch', 'Transactions log'), History], ['reader', t('Tra cứu bạn đọc', 'Reader history'), Users], ['lifecycle', t('Vòng đời sách', 'Book & copy lifecycle'), BookOpen],
    ].map(([key, name, Icon]) => { const ViewIcon = Icon as typeof History; return <button key={key as string} aria-current={tab === key ? 'page' : undefined} className={`${buttonClass} ${tab === key ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300' : ''}`} onClick={() => update({ tab: key as string })}><ViewIcon size={17} aria-hidden="true" />{name as string}</button>; })}</nav>
    {tab === 'transactions' && <><section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-xs font-semibold sm:col-span-2">{t('Tìm kiếm giao dịch', 'Search transactions')}<input type="search" className={`${fieldClass} mt-1`} value={searchTerm} onChange={event => setSearchTerm(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); submitSearch(); } }} placeholder={t('Tên sách, họ tên, MSSV, barcode, mã giao dịch… (Enter để tìm)', 'Book title, reader name, student ID, barcode, transaction ID… (Enter to search)')} /></label>
      <label className="text-xs font-semibold">{t('Trạng thái mượn trả', 'Loan status')}<select className={`${fieldClass} mt-1`} value={status} onChange={event => filter('status', event.target.value)}><option value="ALL">{t('Tất cả trạng thái', 'All statuses')}</option>{['WAITING_FOR_PICKUP', 'BORROWING', 'OVERDUE', 'RETURNED', 'CANCELLED'].map(code => <option key={code} value={code}>{label(code, en)}</option>)}</select></label>
      <label className="text-xs font-semibold">{t('Trạng thái phí phạt', 'Fine status')}<select className={`${fieldClass} mt-1`} value={fineStatus} onChange={event => filter('fineStatus', event.target.value)}><option value="ALL">{t('Tất cả phí phạt', 'All fines')}</option>{['UNPAID', 'PAID'].map(code => <option key={code} value={code}>{label(code, en)}</option>)}</select></label>
      <label className="text-xs font-semibold">{t('Loại ngày', 'Date type')}<select className={`${fieldClass} mt-1`} value={dateType} onChange={event => filter('dateType', event.target.value)}><option value="BORROWED">{t('Ngày mượn', 'Borrowed date')}</option><option value="RETURNED">{t('Ngày trả', 'Returned date')}</option></select></label>
      <label className="text-xs font-semibold">{t('Từ ngày', 'From date')}<input type="date" className={`${fieldClass} mt-1`} value={dateFrom} onChange={event => filter('dateFrom', event.target.value)} /></label><label className="text-xs font-semibold">{t('Đến ngày', 'To date')}<input type="date" className={`${fieldClass} mt-1`} value={dateTo} onChange={event => filter('dateTo', event.target.value)} /></label>
      <div className="flex items-end gap-2"><label className="flex-1 text-xs font-semibold">{t('Sắp xếp', 'Sort')}<select className={`${fieldClass} mt-1`} value={sortBy} onChange={event => filter('sortBy', event.target.value)}>{[['createdAt', t('Ngày tạo', 'Created date')], ['borrowedDate', t('Ngày mượn', 'Borrowed date')], ['returnedDate', t('Ngày trả', 'Returned date')], ['dueDate', t('Hạn trả', 'Due date')], ['fineAmount', t('Phí phạt', 'Fine amount')]].map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label><button className={buttonClass} aria-label={t('Đổi chiều sắp xếp', 'Toggle sort direction')} onClick={() => filter('sortDir', sortDir === 'DESC' ? 'ASC' : 'DESC')}>{sortDir === 'DESC' ? '↓' : '↑'}</button></div>
      <div className="sm:col-span-2 lg:col-span-4"><button className={buttonClass} onClick={() => update({ keyword: undefined, status: undefined, fineStatus: undefined, dateFrom: undefined, dateTo: undefined, dateType: undefined, sortBy: undefined, sortDir: undefined, page: 0 }, true)}>{t('Xóa bộ lọc', 'Clear filters')}</button><span className="ml-3 text-xs text-slate-500 dark:text-slate-400">{t('Khoảng ngày bao gồm trọn ngày cuối, múi giờ Việt Nam.', 'Date ranges include the entire end date in Vietnam time.')}</span></div>
    </section><section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"><LoadState loading={list.loading} error={list.error}>{list.data && <><TransactionTable items={list.data.content} {...actions} /><Pager data={list.data} onPage={next => update({ page: next })} /></>}</LoadState></section></>}
    {tab === 'reader' && <ReaderHistory actions={actions} refresh={refresh} />}
    {tab === 'lifecycle' && <BookLifecycle actions={actions} refresh={refresh} />}
    {quickBook ? <BookQuickViewDrawer key={`${quickBook.publicationId}/${quickBook.itemId || ''}`} publicationId={quickBook.publicationId} itemId={quickBook.itemId} branch={quickBook.branch} page={quickBook.page} onBranch={branch => setQuickBook(book => book && { ...book, branch, page: 0 })} onPage={page => setQuickBook(book => book && { ...book, page })} onClose={() => setQuickBook(undefined)} onCopy={(itemId, pubId) => { setQuickBook(undefined); setActiveTransactionId(undefined); update({ tab: 'lifecycle', itemId, pubId, timelinePage: 0 }); }} onTransaction={actions.onTransaction} />
      : activeTransactionId && <TransactionDetailDrawer key={activeTransactionId} id={activeTransactionId} onClose={() => setActiveTransactionId(undefined)} onUpdated={() => setRefresh(v => v + 1)} onBook={actions.onBook} />}
  </main>;
}

import { BookOpen, Sparkles, Star } from 'lucide-react';
import inquiry from '../../../api/circulationInquiryService';
import dashboard from '../../../api/librarianDashboardService';
import recommendationService from '../../../api/recommendationService';
import transactions from '../../../api/transactionsService';
import TransactionTable, { TableActions } from './TransactionTable';
import { fieldClass, LoadState, money, NewTabLink, Pager, useCopy, useResource } from './shared';
import { idValue, pageNumber, useSearchInput, useInquiryUrl } from './useInquiryUrl';

function ReaderLoans({ userId, returned, actions, refresh }: { userId: string; returned: boolean; actions: TableActions; refresh: number }) {
  const t = useCopy(); const { params, update } = useInquiryUrl(); const prefix = returned ? 'returned' : 'active';
  const page = pageNumber(params.get(`${prefix}Page`)), from = params.get(`${prefix}From`) || '', to = params.get(`${prefix}To`) || '';
  const resource = useResource(`${userId}/${returned}/${page}/${from}/${to}/${refresh}`, async () => (await transactions.getAllTransactions(page, 10, undefined, undefined, undefined, from, to, returned ? 'returnedDate' : 'borrowedDate', 'DESC', returned ? 'RETURNED' : 'BORROWED', userId, returned ? 'RETURNED' : 'ACTIVE')).data);
  return <section className="space-y-3"><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="font-semibold">{returned ? t('Lịch sử sách đã trả', 'Returned books') : t('Sách đang mượn & quá hạn', 'Active & overdue loans')}</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{returned ? t('Khoảng thời gian tính theo ngày trả.', 'Date range applies to return date.') : t('Khoảng thời gian tính theo ngày mượn.', 'Date range applies to borrowing date.')}</p></div><div className="flex flex-wrap gap-2">{[['From', t('Từ ngày', 'From date'), from], ['To', t('Đến ngày', 'To date'), to]].map(([suffix, name, value]) => <label key={suffix} className="text-xs">{name}<input type="date" className={`${fieldClass} mt-1`} value={value} onChange={event => update({ [`${prefix}${suffix}`]: event.target.value, [`${prefix}Page`]: 0 }, true)} /></label>)}</div></div><div className="rounded-xl border border-slate-200 dark:border-slate-700"><LoadState loading={resource.loading} error={resource.error}>{resource.data && <><TransactionTable items={resource.data.content} {...actions} /><Pager data={resource.data} onPage={next => update({ [`${prefix}Page`]: next })} /></>}</LoadState></div></section>;
}
function ReaderRecommendations({ userId, faculty, refresh }: { userId: string; faculty?: string | null; refresh: number }) {
  const t = useCopy();
  const resource = useResource(JSON.stringify(['recommendations', userId, faculty, refresh]), async () =>
    (await recommendationService.getReaderRecommendationsForLibrarian(userId, faculty, 4)).data ?? []);
  return <section aria-label={t('Gợi ý sách AI cho bạn đọc', 'AI Recommendations')} className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/30 p-5 dark:border-indigo-500/30 dark:bg-indigo-500/5">
    <h3 className="flex items-center gap-2 font-semibold"><Sparkles size={18} className="text-indigo-600 dark:text-indigo-300" aria-hidden="true" />{t('Gợi ý sách AI cho bạn đọc', 'AI Recommendations')}</h3>
    <p className="text-sm text-slate-600 dark:text-slate-300">{t('Gợi ý dựa trên khoa/chuyên ngành và lịch sử đọc của bạn đọc.', 'Suggestions based on the reader’s faculty and reading history.')}</p>
    {resource.loading ? <p role="status" className="py-4 text-sm text-slate-600 dark:text-slate-300">{t('Đang tải gợi ý…', 'Loading recommendations…')}</p>
      : resource.error ? <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-200">{t('Không thể tải gợi ý sách.', 'Unable to load book recommendations.')} {resource.error}</p>
        : resource.data?.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{resource.data.map(book => <article key={book.publicationId} className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 flex h-40 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800">{book.coverImageUrl
            ? <img src={book.coverImageUrl} alt={book.title} loading="lazy" className="h-full max-w-full rounded object-contain" />
            : <BookOpen size={40} className="text-slate-400" aria-hidden="true" />}</div>
          <h4 className="break-words font-semibold">{book.title}</h4>
          <p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-300">{book.authorNames?.length ? book.authorNames.join(', ') : t('Chưa có tác giả', 'Authors unavailable')}</p>
          <dl className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex flex-wrap justify-between gap-2"><dt>{t('Năm xuất bản', 'Publication year')}</dt><dd>{book.publicationYear ?? '—'}</dd></div>
            <div className="flex flex-wrap justify-between gap-2"><dt>{t('Bản sao có sẵn', 'Available copies')}</dt><dd className="font-semibold text-indigo-700 dark:text-indigo-300">{book.availableItems}</dd></div>
          </dl>
          {book.ratingCount > 0 && book.ratingAverage > 0 && <p className="mt-3 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300"><Star size={14} aria-hidden="true" /><span>{t('Đánh giá', 'Rating')}: {book.ratingAverage.toFixed(1)}/5 ({book.ratingCount})</span></p>}
          <div className="mt-auto pt-4"><NewTabLink to={`/librarianpage/books/${book.publicationId}`}>{t('Chi tiết đầu sách', 'Book details')}</NewTabLink></div>
        </article>)}</div>
          : <p className="py-4 text-sm text-slate-600 dark:text-slate-300">{t('Chưa có gợi ý phù hợp cho bạn đọc này.', 'No suitable recommendations for this reader yet.')}</p>}
  </section>;
}

export default function ReaderHistory({ actions, refresh }: { actions: TableActions; refresh: number }) {
  const t = useCopy(); const { params, update } = useInquiryUrl(); const keyword = params.get('readerKeyword') || ''; const userId = idValue(params.get('userId'));
  const [searchTerm, setSearchTerm, submitSearch] = useSearchInput('readerKeyword', { activePage: 0, returnedPage: 0 });
  const suggestions = useResource(keyword.trim() ? `readers/${keyword}` : null, () => inquiry.readers(keyword));
  const profile = useResource(userId ? `profile/${userId}/${refresh}` : null, async () => (await dashboard.getReaderProfile({ userId })).data);
  return <div className="space-y-6"><label className="block max-w-xl text-sm font-medium">{t('Tra cứu MSSV hoặc họ tên', 'Search student ID or reader name')}<input type="search" className={`${fieldClass} mt-2`} value={searchTerm} onChange={event => setSearchTerm(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); submitSearch(); } }} placeholder={t('Nhập MSSV hoặc họ tên… (Enter để tìm)', 'Enter student ID or name… (Enter to search)')} /></label>
    <LoadState loading={suggestions.loading} error={suggestions.error}>{suggestions.data && <div className="max-w-xl rounded-xl border border-slate-200 dark:border-slate-700">{suggestions.data.map(reader => <button key={reader.userId} className="block w-full border-b border-slate-100 p-3 text-left text-sm last:border-b-0 hover:bg-indigo-50 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => update({ userId: reader.userId, activePage: 0, returnedPage: 0, readerKeyword: undefined })}>{reader.fullName} · {reader.studentId || '—'}</button>)}{!suggestions.data.length && <p className="p-3 text-sm">{t('Không tìm thấy bạn đọc.', 'No readers found.')}</p>}</div>}</LoadState>
    {userId ? <LoadState loading={profile.loading} error={profile.error}>{profile.data && <><section className="flex flex-wrap justify-between gap-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-5 dark:border-indigo-500/30 dark:bg-indigo-500/10"><div><h2 className="text-lg font-bold">{profile.data.fullName}</h2><p className="mt-1 text-sm">{profile.data.studentId} · {profile.data.email}</p></div><dl className="flex flex-wrap gap-6">{[[t('Điểm tín nhiệm', 'Credit score'), profile.data.creditScore], [t('Sách đang mượn', 'Active loans'), profile.data.activeBorrows], [t('Nợ phạt', 'Unpaid fines'), money(profile.data.unpaidFineAmount)]].map(([name, value]) => <div key={name}><dt className="text-xs text-slate-600 dark:text-slate-300">{name}</dt><dd className="mt-1 text-lg font-bold">{value}</dd></div>)}</dl></section><ReaderLoans userId={userId} returned={false} actions={actions} refresh={refresh} /><ReaderLoans userId={userId} returned actions={actions} refresh={refresh} /><ReaderRecommendations userId={userId} faculty={profile.data.faculty} refresh={refresh} /></>}</LoadState> : <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-300">{t('Chọn một bạn đọc để xem hồ sơ và lịch sử.', 'Select a reader to view their profile and history.')}</p>}
  </div>;
}

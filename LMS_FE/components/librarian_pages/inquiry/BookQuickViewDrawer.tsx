import inquiry from '../../../api/circulationInquiryService';
import BookOverview from './BookOverview';
import { fieldClass, InquiryDrawer, LoadState, NewTabLink, useCopy, useResource } from './shared';

export function BranchSelect({ value, onChange }: { value: string; onChange: (branch: string) => void }) {
  const t = useCopy();
  return <label className="block text-sm">{t('Cơ sở', 'Branch')}<select className={`${fieldClass} mt-1`} value={value} onChange={event => onChange(event.target.value)}><option value="">{t('Tất cả cơ sở', 'All branches')}</option><option value="Cơ sở 1 - Lý Thường Kiệt">{t('Cơ sở 1 - Lý Thường Kiệt', 'Campus 1 - Ly Thuong Kiet')}</option><option value="Cơ sở 2 - Dĩ An">{t('Cơ sở 2 - Dĩ An', 'Campus 2 - Di An')}</option></select></label>;
}
export default function BookQuickViewDrawer({ publicationId, itemId, branch, page, onBranch, onPage, onClose, onCopy, onTransaction }: {
  publicationId: string; itemId?: string; branch: string; page: number; onBranch: (branch: string) => void; onPage: (page: number) => void; onClose: () => void; onCopy: (id: string, publicationId: string) => void; onTransaction: (id: string) => void;
}) {
  const t = useCopy(); const resource = useResource(`${publicationId}/${branch}/${page}`, () => inquiry.publication(publicationId, branch, page));
  const copy = useResource(itemId || null, () => inquiry.item(itemId!));
  return <InquiryDrawer title={t('Xem nhanh ấn phẩm', 'Publication quick view')} onClose={onClose}><div className="space-y-4"><BranchSelect value={branch} onChange={onBranch} />
    {itemId && <LoadState loading={copy.loading} error={copy.error}>{copy.data && <div className="rounded-xl bg-indigo-50 p-3 text-sm dark:bg-indigo-500/10"><p className="font-semibold">{copy.data.barcode} · {copy.data.branch} · {copy.data.location || '—'}</p><div className="mt-2"><NewTabLink to={`/librarianpage/copies/${itemId}`}>{t('Mở chi tiết bản sao', 'Open copy details')}</NewTabLink></div></div>}</LoadState>}
    <LoadState loading={resource.loading} error={resource.error}>{resource.data && <BookOverview data={resource.data} onPage={onPage} onCopy={item => onCopy(item.itemId, item.publicationId)} onTransaction={onTransaction} />}</LoadState>
  </div></InquiryDrawer>;
}

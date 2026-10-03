import { CheckCheck, Printer, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import reshelvingService, { RESHELVING_CHANGED, ReshelvingItem } from '../../api/reshelvingService';
import { useAppDialog } from '../../contexts/AppDialogContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getFriendlyErrorMessage } from '../../utils/errorMessages';
import { printReshelving } from '../../utils/reshelvingPrint';
import { reshelvingSourceLabel } from '../../utils/reshelvingLabels';

export default function ReshelvingTab({ onCount, onBranch }: { onCount: (count: number) => void; onBranch?: (branch: string) => void }) {
  const { language } = useLanguage();
  const en = language === 'en';
  const dialog = useAppDialog();
  const [items, setItems] = useState<ReshelvingItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [branch, setBranch] = useState<string | null>(null);
  useEffect(() => {
    let disposed = false;
    reshelvingService.getDefaultBranch().then(response => {
      if (!disposed) setBranch(response.data.branch);
    }).catch(() => { if (!disposed) setBranch('ALL'); });
    return () => { disposed = true; };
  }, []);
  const previousIds = useRef(new Set<string>());
  const loadRef = useRef<() => Promise<void>>(async () => {});
  const countRef = useRef(onCount);
  countRef.current = onCount;
  const branchRef = useRef(onBranch);
  branchRef.current = onBranch;

  useEffect(() => {
    if (branch === null) return;
    branchRef.current?.(branch);
    previousIds.current = new Set();
    setItems([]);
    setSelected(new Set());
    let disposed = false, sequence = 0;
    const load = async () => {
      const request = ++sequence;
      setLoading(true);
      try {
        const response = await reshelvingService.getWaiting(branch);
        if (disposed || request !== sequence) return;
        const next = response.data;
        const oldIds = previousIds.current;
        setSelected(current => new Set(next.filter(item => current.has(item.taskId)
          || !oldIds.has(item.taskId)).map(item => item.taskId)));
        previousIds.current = new Set(next.map(item => item.taskId));
        setItems(next);
        countRef.current(next.length);
        setError('');
      } catch (cause) {
        if (!disposed && request === sequence) setError(getFriendlyErrorMessage(cause, language));
      } finally { if (!disposed && request === sequence) setLoading(false); }
    };
    loadRef.current = load;
    void load();
    const refresh = () => { void load(); };
    window.addEventListener('focus', refresh);
    window.addEventListener(RESHELVING_CHANGED, refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { disposed = true; window.clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener(RESHELVING_CHANGED, refresh); };
  }, [language, branch]);

  const confirm = async () => {
    const ids = items.filter(item => selected.has(item.taskId)).map(item => item.taskId);
    if (!ids.length || saving || loading || error || !branch || branch === 'ALL') return;
    setSaving(true);
    try {
      if (!await dialog.confirm({ title: en ? 'Confirm books shelved' : 'Xác nhận đã cất lên kệ',
        message: en ? `Confirm that ${ids.length} selected books at ${branch} have been shelved?` : `Xác nhận đã cất lên kệ ${ids.length} cuốn sách đã chọn tại ${branch}?`,
        confirmText: en ? 'Confirm' : 'Xác nhận', variant: 'warning' })) return;
      const result = await reshelvingService.confirm(ids, branch);
      toast.success(en ? `${result.data.updatedCount} books marked as shelved.` : `Đã xác nhận cất kệ ${result.data.updatedCount} cuốn.`);
      if (result.data.skippedCount) toast.info(en ? 'Some books were already processed or are no longer available.' : 'Một số sách đã được xử lý hoặc không còn ở giỏ chờ cất.');
      await loadRef.current();
    } catch (cause) { toast.error(getFriendlyErrorMessage(cause, language)); await loadRef.current(); }
    finally { setSaving(false); }
  };

  const allSelected = items.length > 0 && items.every(item => selected.has(item.taskId));
  return <section className="space-y-4" aria-busy={loading || saving}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">{en ? 'Book reshelving' : 'Xếp giá sách'}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300" aria-live="polite">{en ? `${items.length} books at the desk are waiting to be shelved.` : `Hiện có ${items.length} cuốn sách đang ở giỏ tại quầy chờ cất lên kệ.`}</p></div>
      <button type="button" onClick={() => void loadRef.current()} disabled={loading || saving}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">
        <RefreshCw size={16} aria-hidden="true" />{en ? 'Refresh' : 'Làm mới'}</button>
    </div>
    <label className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
      {en ? 'Branch' : 'Cơ sở'}
      <select aria-label={en ? 'Branch' : 'Cơ sở'} value={branch ?? 'ALL'} disabled={saving || branch === null}
        onChange={event => { setLoading(true); setBranch(event.target.value); }}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
        <option value="ALL">{en ? 'All branches' : 'Tất cả cơ sở'}</option>
        <option value="Cơ sở 1 - Lý Thường Kiệt">{en ? 'Campus 1 - Ly Thuong Kiet' : 'Cơ sở 1 - Lý Thường Kiệt'}</option>
        <option value="Cơ sở 2 - Dĩ An">{en ? 'Campus 2 - Di An' : 'Cơ sở 2 - Dĩ An'}</option>
      </select>
    </label>
    {branch === 'ALL' && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
      {en ? 'All branches is view/print only. Select your working branch before confirming shelving.' : 'Tất cả cơ sở chỉ dùng để xem/in. Hãy chọn cơ sở đang trực trước khi xác nhận cất kệ.'}
    </p>}
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={!selected.size || saving || loading || !!error} onClick={() => {
        if (!printReshelving(items.filter(item => selected.has(item.taskId)), language)) toast.error(en ? 'Allow pop-ups to print the slip.' : 'Vui lòng cho phép cửa sổ bật lên để in phiếu.');
      }} className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 disabled:opacity-50 dark:border-indigo-500/30 dark:text-indigo-300">
        <Printer size={16} aria-hidden="true" />{en ? 'Print A4 slip' : 'In phiếu A4'}</button>
      <button type="button" disabled={!selected.size || saving || loading || !!error || !branch || branch === 'ALL'} onClick={() => void confirm()}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
        <CheckCheck size={16} aria-hidden="true" />{saving ? (en ? 'Processing…' : 'Đang xử lý…') : (en ? `Confirm shelved (${selected.size})` : `Xác nhận đã cất (${selected.size})`)}</button>
    </div>
    {loading && !items.length ? <p className="text-sm text-slate-500">{en ? 'Loading…' : 'Đang tải…'}</p>
      : !items.length && !error ? <p className="rounded-xl border border-dashed p-6 text-center text-slate-500 dark:border-slate-700 dark:text-slate-300">{en ? 'No books are waiting to be shelved.' : 'Không có sách đang chờ cất kệ.'}</p>
      : <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><tr>
            <th className="p-3"><input type="checkbox" aria-label={en ? 'Select all' : 'Chọn tất cả'} checked={allSelected}
              ref={node => { if (node) node.indeterminate = selected.size > 0 && !allSelected; }} disabled={saving || loading}
              onChange={event => setSelected(event.target.checked ? new Set(items.map(item => item.taskId)) : new Set())} /></th>
            {(en ? ['Barcode', 'Publication', 'Shelf / Branch', 'Reason', 'Queued at', 'Related student ID'] : ['Mã vạch', 'Ấn phẩm', 'Vị trí kệ / Cơ sở', 'Lý do', 'Thời điểm vào hàng chờ', 'MSSV liên quan']).map(label => <th key={label} scope="col" className="p-3">{label}</th>)}
          </tr></thead>
          <tbody>{items.map(item => <tr key={item.taskId} className="border-t border-slate-100 dark:border-slate-700 dark:text-slate-200">
            <td className="p-3"><input type="checkbox" aria-label={`${en ? 'Select' : 'Chọn'} ${item.barcode}`} checked={selected.has(item.taskId)} disabled={saving || loading}
              onChange={event => setSelected(current => { const next = new Set(current); if (event.target.checked) next.add(item.taskId); else next.delete(item.taskId); return next; })} /></td>
            <td className="p-3 font-mono">{item.barcode}</td><td className="p-3">{item.publicationTitle}</td>
            <td className="p-3"><strong className="text-blue-700 dark:text-blue-300">{item.location || (en ? 'Not assigned' : 'Chưa có vị trí')}</strong><div className="text-xs text-slate-500 dark:text-slate-400">{item.branch}</div></td>
            <td className="p-3"><span className="inline-block rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">{reshelvingSourceLabel(item.source, language)}</span></td>
            <td className="p-3 whitespace-nowrap">{new Date(item.queuedAt).toLocaleString(en ? 'en-US' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
            <td className="p-3" title={item.fullName}>{item.studentId || '—'}</td>
          </tr>)}</tbody>
        </table>
      </div>}
  </section>;
}

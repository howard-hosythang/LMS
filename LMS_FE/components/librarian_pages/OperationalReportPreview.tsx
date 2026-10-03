import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { OperationalPrintData } from '../../api/librarianDashboardService';
import { buildOperationalPrintHtml } from '../../utils/operationalReportPrint';
import { buttonClass, InquiryDrawer, useCopy } from './inquiry/shared';

export default function OperationalReportPreview({ data, language, onClose }: { data: OperationalPrintData; language: 'vi' | 'en'; onClose: () => void }) {
  const t = useCopy(); const frame = useRef<HTMLIFrameElement>(null); const [ready, setReady] = useState(false);
  const html = useMemo(() => buildOperationalPrintHtml(data, language), [data, language]);
  const print = () => {
    try { frame.current?.contentWindow?.focus(); frame.current?.contentWindow?.print(); }
    catch { toast.error(t('Không thể mở hộp thoại in. Vui lòng kiểm tra quyền in của trình duyệt.', 'Unable to open print dialog. Please check browser permissions.')); }
  };
  return <InquiryDrawer title={t('Xem trước báo cáo A4', 'A4 report preview')} onClose={onClose}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-600 dark:text-slate-300">{t('Chọn Lưu dưới dạng PDF trong hộp thoại in để tải bản PDF.', 'Choose Save as PDF in the print dialog to download a PDF.')}</p><button className={buttonClass} onClick={print} disabled={!ready}>{t('In / Lưu PDF', 'Print / Save PDF')}</button></div>
    <iframe ref={frame} title={t('Bản in báo cáo vận hành', 'Operational report printout')} srcDoc={html} sandbox="allow-same-origin allow-modals" onLoad={() => setReady(true)} className="h-[70vh] w-full rounded-lg border border-slate-200 bg-white" />
  </InquiryDrawer>;
}

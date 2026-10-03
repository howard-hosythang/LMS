import { OperationalPrintData } from '../api/librarianDashboardService';
import { facultyLabel } from './facultyLabels';

const escape = (value: unknown) => String(value ?? '—').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
export const operationalReportFilename = (from: string, to: string) => `Bao_Cao_Van_Hanh_LMS_${from}_${to}.xlsx`;

export function buildOperationalPrintHtml(data: OperationalPrintData, language: 'vi' | 'en') {
  const t = (vi: string, en: string) => language === 'en' ? en : vi;
  const { report } = data;
  const number = (value: unknown) => Number(value ?? 0).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN');
  const money = (value: unknown) => `${Number(value ?? 0).toLocaleString('vi-VN')}đ`;
  const title = t('BÁO CÁO VẬN HÀNH VÀ LƯU THÔNG THƯ VIỆN', 'LIBRARY OPERATIONS AND CIRCULATION REPORT');
  const exportedAt = new Date(data.generatedAt).toLocaleString(language === 'en' ? 'en-GB' : 'vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const kpis = [
    [t('Lượt mượn', 'Loans'), number(report.circulation.borrowCount)],
    [t('Lượt trả', 'Returns'), number(report.circulation.returnCount)],
    [t('Trả đúng hạn', 'On-time returns'), `${number(data.onTimeReturnRatePercent)}%`],
    [t('Đang lưu hành (hiện tại)', 'Active loans (current)'), number(report.circulation.activeBorrowCount)],
    [t('Quá hạn trong kỳ', 'Overdue in period'), number(data.overdueInPeriod)],
    [t('Cọc đang giữ (hiện tại)', 'Deposits held (current)'), money(data.depositsHeld)],
    [t('Cọc đã hoàn', 'Deposits refunded'), money(report.finance.depositsRefunded)],
    [t('Phí phạt phát sinh', 'Fines created'), money(report.finance.finesCreated)],
    [t('Phí đã thanh toán', 'Fines settled'), money(report.finance.finesCollected)],
  ];
  const top = report.topBorrowedPublications.slice(0, 10).map((book, index) => `<tr><td>${index + 1}</td><td>${escape(book.title.slice(0, 140))}</td><td>${number(book.borrowCount)}</td></tr>`).join('');
  const risks = data.riskyReaders.slice(0, 10).map(reader => `<tr><td>${escape(reader.studentId)}<br>${escape(reader.fullName.slice(0, 70))}</td><td>${escape(facultyLabel(reader.faculty?.trim() || 'Chưa ghi nhận', language))}<br>${escape(reader.phoneNumber || reader.email)}</td><td>${number(reader.overdueCount)}</td><td>${money(reader.totalUnpaidAmount)}</td><td>${number(reader.creditScore)}</td></tr>`).join('');
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><title>${escape(title)} ${escape(report.dateFrom)}_${escape(report.dateTo)}</title>
  <style>
    *{box-sizing:border-box}body{margin:0;background:#e2e8f0;color:#111;font:11pt "Times New Roman",serif}
    .page{width:210mm;min-height:297mm;margin:12px auto;padding:16mm;background:white}
    header{display:flex;justify-content:space-between;gap:12px;text-align:center;font-size:9pt}header img{width:16mm;height:16mm;object-fit:contain}h1{font-size:15pt;text-align:center;margin:8mm 0 4mm}h2{font-size:12pt;margin:5mm 0 3mm}
    .meta{text-align:center;font-size:10pt;line-height:1.5}.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin:5mm 0}.kpi{border:1px solid #b8c4d4;padding:3mm;font-size:9pt}.kpi strong{display:block;margin-top:2mm;font-size:14pt}
    table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:9pt}th,td{border:1px solid #aab5c4;padding:2mm;overflow-wrap:anywhere;vertical-align:top}th{background:#edf2f7;text-align:left}tr{break-inside:avoid}thead{display:table-header-group}.note{font-size:9pt;line-height:1.4;color:#444;margin-top:4mm}
    .signatures{display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin-top:10mm;text-align:center;break-inside:avoid}.signature-space{height:26mm}.footer{margin-top:6mm;text-align:right;font-size:9pt}
    @page{size:A4 portrait;margin:0}@media print{body{background:white}.page{margin:0;break-after:page}.page:last-child{break-after:auto}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
  <section class="page"><header><div><img src="${escape(new URL('/logo.png', window.location.origin).href)}" alt=""><br>ĐẠI HỌC BÁCH KHOA – ĐHQG-HCM<br>THƯ VIỆN</div><div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br><strong>Độc lập – Tự do – Hạnh phúc</strong></div></header>
    <h1>${escape(title)}</h1><div class="meta">${t('Kỳ báo cáo', 'Report period')}: ${escape(report.dateFrom)} — ${escape(report.dateTo)}<br>${t('Người lập', 'Prepared by')}: ${escape(data.preparedBy)}<br>${t('Thời điểm xuất (Việt Nam)', 'Exported at (Vietnam)')}: ${escape(exportedAt)}</div>
    <h2>1. ${t('Chỉ số tổng hợp', 'Key indicators')}</h2><div class="kpis">${kpis.map(([label, value]) => `<div class="kpi">${escape(label)}<strong>${escape(value)}</strong></div>`).join('')}</div>
    <p class="note">${t('Trả đúng hạn = số lượt trả không trễ hạn / tổng lượt trả trong kỳ. Phí đã thanh toán có thể gồm cấn cọc, không đồng nghĩa tiền mặt mới thu. Phí phát sinh là số tiền hiện đang lưu sau điều chỉnh/cấn cọc.', 'On-time rate = on-time returns / returns in period. Settled fines may include deposit offsets, not solely new cash. Created fines reflect currently stored amounts after adjustments/offsets.')}</p>
    <h2>2. ${t('Top 10 ấn phẩm mượn nhiều trong kỳ', 'Top 10 publications borrowed in period')}</h2><table><thead><tr><th style="width:8%">STT</th><th>${t('Tên ấn phẩm', 'Publication')}</th><th style="width:20%">${t('Lượt mượn', 'Loans')}</th></tr></thead><tbody>${top || `<tr><td colspan="3">${t('Chưa có dữ liệu trong kỳ.', 'No data in this period.')}</td></tr>`}</tbody></table><div class="footer">1 / 2</div>
  </section>
  <section class="page"><h2>3. ${t('Bạn đọc cần ưu tiên đôn đốc', 'Readers requiring priority follow-up')}</h2><p class="note">${t('Tối đa 10 hồ sơ, ưu tiên số sách quá hạn, nợ phạt rồi điểm tín nhiệm. Đây là tình trạng hiện tại; danh sách đầy đủ nằm trong Excel.', 'Up to 10 readers, ordered by overdue loans, unpaid fines and credit score. Current snapshot; the complete list is in Excel.')}</p>
    <table><thead><tr><th>${t('MSSV / Họ tên', 'Student ID / Name')}</th><th>${t('Khoa / Liên hệ', 'Faculty / Contact')}</th><th style="width:12%">${t('Quá hạn', 'Overdue')}</th><th style="width:22%">${t('Nợ phạt', 'Debt')}</th><th style="width:12%">${t('Tín nhiệm', 'Credit')}</th></tr></thead><tbody>${risks || `<tr><td colspan="5">${t('Không có bạn đọc cần theo dõi.', 'No at-risk readers.')}</td></tr>`}</tbody></table>
    <div class="signatures"><div><strong>${t('NGƯỜI LẬP BIỂU', 'PREPARED BY')}</strong><p>${t('(Ký, ghi rõ họ tên)', '(Signature and full name)')}</p><div class="signature-space"></div>${escape(data.preparedBy)}</div><div><strong>${t('TRƯỞNG BỘ PHẬN THƯ VIỆN', 'HEAD OF LIBRARY')}</strong><p>${t('(Ký, ghi rõ họ tên)', '(Signature and full name)')}</p><div class="signature-space"></div></div></div><div class="footer">2 / 2</div>
  </section></body></html>`;
}

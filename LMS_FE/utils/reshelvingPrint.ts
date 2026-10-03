import type { ReshelvingItem } from '../api/reshelvingService';
import { reshelvingSourceLabel } from './reshelvingLabels';

const escape = (value: string | null) => String(value ?? '').replace(/[&<>"']/g,
  character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));

export function buildReshelvingPrintHtml(items: ReshelvingItem[], language: 'vi' | 'en') {
  const en = language === 'en';
  const title = en ? 'Book reshelving slip' : 'PHIẾU XẾP GIÁ SÁCH';
  const labels = en ? ['Done', 'Barcode', 'Publication', 'Shelf', 'Branch', 'Reason', 'Queued at', 'Related student ID']
    : ['Đã cất', 'Mã vạch', 'Ấn phẩm', 'Vị trí kệ', 'Cơ sở', 'Lý do', 'Vào hàng chờ', 'MSSV liên quan'];
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><title>${title}</title>
    <style>@page{size:A4 portrait;margin:12mm}body{font:11px Arial,sans-serif;color:#111}
    h1{font-size:19px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #777;padding:6px;overflow-wrap:anywhere}
    th{background:#eee;text-align:left}thead{display:table-header-group}tr{break-inside:avoid}.box{display:inline-block;width:12px;height:12px;border:1px solid #111}
    .shelf{font-weight:bold}.print{margin-bottom:12px}@media print{.print{display:none}}</style></head>
    <body><button class="print" onclick="window.print()">${en ? 'Print' : 'In phiếu'}</button>
    <h1>${title}</h1><p>${en ? 'Selected books' : 'Số sách đã chọn'}: ${items.length} · ${new Date().toLocaleString(en ? 'en-US' : 'vi-VN')}</p>
    <table><thead><tr>${labels.map(label => `<th>${label}</th>`).join('')}</tr></thead><tbody>
    ${items.map(item => `<tr><td><span class="box"></span></td><td>${escape(item.barcode)}</td>
      <td>${escape(item.publicationTitle)}</td><td class="shelf">${escape(item.location) || '—'}</td>
      <td>${escape(item.branch)}</td><td>${escape(reshelvingSourceLabel(item.source, language))}</td><td>${escape(new Date(item.queuedAt).toLocaleString(en ? 'en-US' : 'vi-VN'))}</td><td>${escape(item.studentId)}</td></tr>`).join('')}
    </tbody></table></body></html>`;
}

export function printReshelving(items: ReshelvingItem[], language: 'vi' | 'en') {
  const popup = window.open('', '_blank', 'width=1000,height=800');
  if (!popup) return false;
  popup.opener = null;
  popup.document.open();
  popup.document.write(buildReshelvingPrintHtml(items, language));
  popup.document.close();
  popup.focus();
  popup.print();
  return true;
}

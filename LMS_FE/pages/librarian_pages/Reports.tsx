import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  GripVertical,
  HandCoins,
  PackageCheck,
  Pencil,
  PiggyBank,
  RefreshCcw,
  ShieldAlert,
  X,
  TrendingUp,
  UserRound,
  Users,
  WalletCards,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';
import librarianDashboardService, {
  DashboardChartsResponse,
  DashboardReportPeriod,
  DashboardReportResponse,
  DashboardSummaryResponse,
  RiskyUser,
  OperationalPrintData,
} from '../../api/librarianDashboardService';
import OperationalReportPreview from '../../components/librarian_pages/OperationalReportPreview';
import { operationalReportFilename } from '../../utils/operationalReportPrint';

type ReportData = DashboardReportResponse['data'];
type SummaryData = DashboardSummaryResponse['data'];
type ChartsData = DashboardChartsResponse['data'];
type TabKey = 'overview' | 'operations' | 'inventory' | 'finance' | 'readers';
type Lang = 'vi' | 'en';
type WidgetGroup = 'operations' | 'inventory' | 'finance' | 'readers';
type WidgetId =
  | 'pressure'
  | 'circulationBalance'
  | 'moneyToCollect'
  | 'availableStock'
  | 'netCash'
  | 'incidents'
  | 'stockAdded'
  | 'riskyReaders';

const DEFAULT_WIDGET_IDS: WidgetId[] = [
  'pressure',
  'circulationBalance',
  'moneyToCollect',
  'availableStock',
  'netCash',
  'incidents',
  'stockAdded',
  'riskyReaders',
];

const MAX_OVERVIEW_WIDGETS = 8;

const COPY = {
  vi: {
    pageBadge: 'Báo cáo điều hành',
    title: 'Trung tâm báo cáo kho, tài chính và vận hành',
    subtitle: 'Theo dõi hiệu quả lưu thông, tình trạng kho, đối soát cọc/phí và các hồ sơ bạn đọc cần xử lý theo từng kỳ báo cáo.',
    period: 'Kỳ báo cáo',
    today: 'Hôm nay',
    todayHint: 'Đối soát nhanh tài chính và vận hành trong ngày',
    refresh: 'Cập nhật báo cáo',
    pdfButton: 'In / Xuất PDF',
    excelButton: 'Xuất Excel chi tiết',
    statusStable: 'Ổn định',
    statusWatch: 'Cần theo dõi',
    statusPriority: 'Cần ưu tiên xử lý',
    loadingError: 'Không tải được dữ liệu báo cáo. Hãy kiểm tra backend hoặc đăng nhập lại bằng tài khoản thủ thư.',
    loadingTitle: 'Chưa thể tải báo cáo',
    retry: 'Thử lại',
    noNotes: 'Chưa có khuyến nghị tự động cho kỳ này.',
    viewDetails: 'Xem chi tiết',
    overview: 'Tổng hợp',
    overviewHint: 'Kết luận nhanh và chỉ số quản trị',
    operations: 'Vận hành',
    operationsHint: 'Mượn, trả, quá hạn, hàng chờ',
    inventory: 'Kho sách',
    inventoryHint: 'Khả dụng, nhập kho, mất/bảo trì',
    finance: 'Tài chính',
    financeHint: 'Cọc, phí, nợ và dòng tiền',
    readers: 'Bạn đọc',
    readersHint: 'Rủi ro và nhu cầu mượn',
    week: 'Tuần này',
    weekHint: 'Theo dõi ca trực và việc tồn trong tuần',
    month: 'Tháng này',
    monthHint: 'Phù hợp báo cáo vận hành định kỳ',
    quarter: 'Quý này',
    quarterHint: 'Nhìn xu hướng nhập kho, lưu thông và thu phí',
    year: 'Năm nay',
    yearHint: 'Tổng hợp cho quản lý cấp cao',
    custom: 'Tùy chọn',
    customHint: 'Chọn khoảng ngày riêng',
    fromDate: 'Từ ngày',
    toDate: 'Đến ngày',
    pressure: 'Sức ép vận hành',
    pressureHint: 'Quá hạn + chờ lấy + đặt trước đang chờ',
    circulationBalance: 'Cân bằng mượn - trả',
    circulationBalanceHint: 'Số lượt trả bằng {{rate}} số lượt mượn trong kỳ',
    moneyToCollect: 'Tiền cần thu',
    openFineHint: '{{count}} khoản phạt còn mở',
    availableStock: 'Kho khả dụng',
    availableStockHint: '{{available}} / {{total}} bản sao có thể lưu thông',
    netCash: 'Dòng tiền ròng',
    netCashHint: 'Cọc thu + phí thu - hoàn cọc - hoàn sách mất',
    incidents: 'Sự cố phát sinh',
    incidentsHint: 'Quá hạn, hư hỏng, mất sách trong kỳ',
    stockAdded: 'Nhập kho mới',
    stockAddedHint: '{{count}} đầu sách mới trong kỳ',
    riskyReaders: 'Bạn đọc rủi ro',
    riskyReadersHint: 'Hồ sơ cần theo dõi ưu tiên',
    operationalReview: 'Nhận định vận hành',
    mainConclusion: 'Kết luận chính của kỳ báo cáo',
    drillDown: 'Đi sâu theo nghiệp vụ',
    chooseMetricGroup: 'Chọn nhóm số liệu cần kiểm tra',
    chooseOps: 'Nếu cần xử lý quá hạn, chờ giao sách, đặt trước.',
    chooseInventory: 'Nếu cần kiểm kê bản sao, mất, bảo trì, nhập kho.',
    chooseFinance: 'Nếu cần đối soát cọc, phí, nợ phạt, hoàn tiền.',
    chooseReaders: 'Nếu cần xem người rủi ro và sách có nhu cầu cao.',
    trendTitle: 'Mượn - trả theo thời gian',
    trendOverline: 'Xu hướng lưu thông',
    borrowed: 'Mượn',
    returned: 'Trả',
    circulationInPeriod: 'Lưu thông trong kỳ',
    activeBorrows: 'Đang mượn hiện tại',
    activeBorrowsHint: '{{count}} giao dịch quá hạn cần nhắc',
    waitingQueue: 'Hàng chờ xử lý',
    waitingQueueHint: '{{pickup}} chờ lấy, {{reservation}} đặt trước',
    copyStatus: 'Trạng thái bản sao',
    physicalStock: 'Kho vật lý hiện tại',
    available: 'Có sẵn',
    borrowedItems: 'Đang mượn',
    reserved: 'Đang giữ/đặt trước',
    maintenance: 'Bảo trì',
    lost: 'Mất/thất lạc',
    totalCopies: 'Tổng bản sao',
    totalCopiesHint: 'Tổng đơn vị quản lý trong kho',
    copiesAdded: 'Bản sao thêm mới',
    lostMaintenance: 'Mất / bảo trì',
    lostMaintenanceHint: 'Cần kiểm kê và xử lý trách nhiệm',
    availableRateHint: 'Tỷ lệ bản sao có thể phục vụ ngay',
    currentDistribution: 'Phân bổ hiện tại',
    systemCopyStatus: 'Trạng thái bản sao theo hệ thống',
    financeCheck: 'Đối soát tài chính',
    depositsAndCash: 'Cọc, phí và dòng tiền',
    depositsCollected: 'Cọc đã thu',
    depositsRefunded: 'Cọc đã hoàn',
    depositsApplied: 'Cọc đã cấn phạt',
    additionalDue: 'Thu thêm sau cấn cọc',
    finesCreated: 'Phí phát sinh',
    finesCollected: 'Phí đã thu',
    lostRefunds: 'Hoàn do tìm lại sách mất',
    collectionRate: 'Tỷ lệ thu phí',
    collectionRateHint: '{{collected}} / {{created}} phí phát sinh',
    outstandingFines: 'Nợ phạt còn tồn',
    outstandingFinesHint: 'Số tiền cần thu hoặc đối soát tiếp',
    violationMix: 'Cơ cấu vi phạm',
    violationMixHint: 'Tỷ trọng từng loại vi phạm trong tổng số sự cố',
    overdueReturn: 'Trả trễ',
    damagedBook: 'Hỏng sách',
    lostBook: 'Mất sách',
    recoveredLost: 'Sách mất tìm lại',
    readerDemand: 'Nhu cầu bạn đọc',
    topBorrowed: 'Top sách được mượn',
    noBorrowData: 'Chưa có dữ liệu mượn sách trong kỳ.',
    readersToWatch: 'Bạn đọc cần theo dõi',
    readerRisks: 'Rủi ro quá hạn, nợ phạt, hư hỏng',
    profiles: 'hồ sơ',
    noRiskData: 'Chưa có danh sách rủi ro trong dữ liệu hiện tại.',
    overdue: 'quá hạn',
    unpaidFine: 'nợ phạt',
    damaged: 'hư hỏng',
    excelSuccess: 'Đã xuất Excel báo cáo chi tiết',
    customizeDashboard: 'Tùy chỉnh giao diện',
    finishCustomize: 'Hoàn tất',
    widgetLibrary: 'Kho widget',
    widgetLimit: 'Tối đa 8 widget trên Tổng hợp.',
    maxWidgetsReached: 'Chỉ nên ghim tối đa 8 widget để tránh quá tải thông tin.',
    defaultTemplate: 'Mẫu mặc định',
    resetTemplate: 'Khôi phục mẫu',
    dynamicDashboard: 'Dashboard động',
    dynamicDashboardHint: 'Ẩn, hiện và kéo thả widget để ưu tiên đúng số liệu trong ca trực.',
  },
  en: {
    pageBadge: 'Executive report',
    title: 'Inventory, finance and operations report center',
    subtitle: 'Track circulation performance, inventory health, deposits/fines reconciliation, and reader cases by reporting period.',
    period: 'Report period',
    today: 'Today',
    todayHint: 'Quick same-day finance and operations reconciliation',
    refresh: 'Refresh report',
    pdfButton: 'Print / Export PDF',
    excelButton: 'Export detailed Excel',
    statusStable: 'Stable',
    statusWatch: 'Needs monitoring',
    statusPriority: 'Needs priority handling',
    loadingError: 'Unable to load report data. Check the backend or sign in again with a librarian account.',
    loadingTitle: 'Report unavailable',
    retry: 'Retry',
    noNotes: 'No automatic recommendations for this period.',
    viewDetails: 'View details',
    overview: 'Overview',
    overviewHint: 'Key conclusions and management metrics',
    operations: 'Operations',
    operationsHint: 'Loans, returns, overdue, queues',
    inventory: 'Inventory',
    inventoryHint: 'Availability, intake, lost/maintenance',
    finance: 'Finance',
    financeHint: 'Deposits, fines, debt and cash flow',
    readers: 'Readers',
    readersHint: 'Risk and borrowing demand',
    week: 'This week',
    weekHint: 'Track shift workload and weekly backlog',
    month: 'This month',
    monthHint: 'Best for routine operational reporting',
    quarter: 'This quarter',
    quarterHint: 'Review inventory intake, circulation and collections',
    year: 'This year',
    yearHint: 'Management-level annual summary',
    custom: 'Custom',
    customHint: 'Choose a custom date range',
    fromDate: 'From',
    toDate: 'To',
    pressure: 'Operational pressure',
    pressureHint: 'Overdue + waiting pickup + pending reservations',
    circulationBalance: 'Loan-return balance',
    circulationBalanceHint: 'Returns are {{rate}} of loans in this period',
    moneyToCollect: 'Amount to collect',
    openFineHint: '{{count}} open fine records',
    availableStock: 'Available inventory',
    availableStockHint: '{{available}} / {{total}} copies ready for circulation',
    netCash: 'Net cash flow',
    netCashHint: 'Deposits collected + fines collected - refunds',
    incidents: 'Incidents recorded',
    incidentsHint: 'Overdue, damage and lost-book incidents',
    stockAdded: 'New stock',
    stockAddedHint: '{{count}} new publications in this period',
    riskyReaders: 'At-risk readers',
    riskyReadersHint: 'Profiles that need priority follow-up',
    operationalReview: 'Operational review',
    mainConclusion: 'Main conclusions for the period',
    drillDown: 'Operational drill-down',
    chooseMetricGroup: 'Choose a metric group to inspect',
    chooseOps: 'For overdue cases, waiting pickups, and reservations.',
    chooseInventory: 'For copy audits, lost items, maintenance and intake.',
    chooseFinance: 'For deposits, fines, outstanding debt and refunds.',
    chooseReaders: 'For reader risk and high-demand publications.',
    trendTitle: 'Loans and returns over time',
    trendOverline: 'Circulation trend',
    borrowed: 'Loans',
    returned: 'Returns',
    circulationInPeriod: 'Circulation in period',
    activeBorrows: 'Currently borrowed',
    activeBorrowsHint: '{{count}} overdue transactions need reminders',
    waitingQueue: 'Processing queue',
    waitingQueueHint: '{{pickup}} waiting pickup, {{reservation}} reservations',
    copyStatus: 'Copy status',
    physicalStock: 'Physical inventory',
    available: 'Available',
    borrowedItems: 'Borrowed',
    reserved: 'Reserved/held',
    maintenance: 'Maintenance',
    lost: 'Lost',
    totalCopies: 'Total copies',
    totalCopiesHint: 'Total managed copy units',
    copiesAdded: 'New copies added',
    lostMaintenance: 'Lost / maintenance',
    lostMaintenanceHint: 'Needs audit and accountability follow-up',
    availableRateHint: 'Share of copies ready to serve readers',
    currentDistribution: 'Current distribution',
    systemCopyStatus: 'System copy status',
    financeCheck: 'Financial reconciliation',
    depositsAndCash: 'Deposits, fines and cash flow',
    depositsCollected: 'Deposits collected',
    depositsRefunded: 'Deposits refunded',
    depositsApplied: 'Deposits applied to fines',
    additionalDue: 'Additional amount due',
    finesCreated: 'Fines created',
    finesCollected: 'Fines collected',
    lostRefunds: 'Lost-book recovery refunds',
    collectionRate: 'Fine collection rate',
    collectionRateHint: '{{collected}} / {{created}} created fines',
    outstandingFines: 'Outstanding fines',
    outstandingFinesHint: 'Amount still to collect or reconcile',
    violationMix: 'Violation mix',
    violationMixHint: 'Share of each violation type in total incidents',
    overdueReturn: 'Late return',
    damagedBook: 'Damaged book',
    lostBook: 'Lost book',
    recoveredLost: 'Recovered lost book',
    readerDemand: 'Reader demand',
    topBorrowed: 'Top borrowed publications',
    noBorrowData: 'No borrowing data in this period.',
    readersToWatch: 'Readers to monitor',
    readerRisks: 'Overdue, unpaid fine and damage risk',
    profiles: 'profiles',
    noRiskData: 'No risk list in the current data.',
    overdue: 'overdue',
    unpaidFine: 'unpaid',
    damaged: 'damaged',
    excelSuccess: 'Detailed Excel report exported',
    customizeDashboard: 'Customize layout',
    finishCustomize: 'Done',
    widgetLibrary: 'Widget library',
    widgetLimit: 'Up to 8 widgets on Overview.',
    maxWidgetsReached: 'Pin up to 8 widgets to avoid information overload.',
    defaultTemplate: 'Default template',
    resetTemplate: 'Reset template',
    dynamicDashboard: 'Dynamic dashboard',
    dynamicDashboardHint: 'Hide, show, and drag widgets to prioritize shift-critical metrics.',
  },
} as const;

type ReportCopy = Record<keyof typeof COPY.vi, string>;

const getPeriods = (c: ReportCopy): { value: DashboardReportPeriod; label: string; hint: string }[] => [
  { value: 'TODAY', label: c.today, hint: c.todayHint },
  { value: 'WEEKLY', label: c.week, hint: c.weekHint },
  { value: 'MONTHLY', label: c.month, hint: c.monthHint },
  { value: 'QUARTERLY', label: c.quarter, hint: c.quarterHint },
  { value: 'YEARLY', label: c.year, hint: c.yearHint },
  { value: 'CUSTOM', label: c.custom, hint: c.customHint },
];

const getTabs = (c: ReportCopy): { key: TabKey; label: string; hint: string }[] => [
  { key: 'overview', label: c.overview, hint: c.overviewHint },
  { key: 'operations', label: c.operations, hint: c.operationsHint },
  { key: 'inventory', label: c.inventory, hint: c.inventoryHint },
  { key: 'finance', label: c.finance, hint: c.financeHint },
  { key: 'readers', label: c.readers, hint: c.readersHint },
];

const interpolate = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{{${key}}}`, String(value)), template);

const localeFor = (language: Lang) => language === 'en' ? 'en-US' : 'vi-VN';

const number = (value?: number | string | null, language: Lang = 'vi') => Number(value || 0).toLocaleString(localeFor(language));
const currency = (value?: number | string | null, language: Lang = 'vi') =>
  Number(value || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });
const percent = (value?: number | string | null, language: Lang = 'vi') => `${Math.round(Number(value || 0)).toLocaleString(localeFor(language))}%`;
const dateLabel = (value?: string | null, language: Lang = 'vi') => value ? new Date(value).toLocaleDateString(localeFor(language)) : 'N/A';
const isoToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

const reportRange = (period: DashboardReportPeriod, dateFrom: string, dateTo: string) => {
  if (period === 'TODAY') {
    const today = isoToday();
    return { dateFrom: today, dateTo: today };
  }
  return { dateFrom, dateTo };
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const healthStatus = (report: ReportData, c: ReportCopy) => {
  const warnings = [
    report.circulation.overdueCurrentCount > 0,
    report.circulation.waitingPickupCount > 0,
    Number(report.finance.unpaidFineOutstanding || 0) > 0,
    report.inventory.lostItems > 0,
    report.inventory.maintenanceItems > 0,
  ].filter(Boolean).length;

  if (warnings <= 1) return { label: c.statusStable, tone: 'emerald', className: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-100' };
  if (warnings <= 3) return { label: c.statusWatch, tone: 'amber', className: 'bg-amber-50 text-amber-700 border-amber-100 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100' };
  return { label: c.statusPriority, tone: 'red', className: 'bg-red-50 text-red-700 border-red-100 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-100' };
};


const MetricCard = ({
  title,
  value,
  hint,
  formula,
  to,
  icon: Icon,
  tone = 'blue',
}: {
  title: string;
  value: string;
  hint: string;
  formula?: string;
  to?: string;
  icon: typeof BookOpen;
  tone?: 'blue' | 'emerald' | 'amber' | 'red' | 'slate' | 'purple';
}) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100 dark:border-purple-500/30 dark:bg-purple-500/15 dark:text-purple-100',
  };

  const content = (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-300">{title}</p>
        <p className="mt-3 text-2xl font-black text-slate-950 dark:text-white">{value}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">{hint}</p>
        {formula && (
          <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
            {formula}
          </p>
        )}
      </div>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${tones[tone]}`}>
        <Icon size={21} />
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-400/50">
        {content}
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-blue-300">
          Xem chi tiết <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
        </span>
      </Link>
    );
  }

  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">{content}</div>;
};

const ProgressRow = ({ label, value, max, tone = 'blue' }: { label: string; value: number; max: number; tone?: 'blue' | 'emerald' | 'amber' | 'red' }) => {
  const colors = {
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };
  return (
    <div className="grid gap-2 sm:grid-cols-[150px_1fr] sm:items-center">
      <div className="text-sm font-bold text-slate-600 dark:text-slate-200">{label}</div>
      <div className="flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className={`h-full rounded-full ${colors[tone]}`} style={{ width: `${Math.max(3, (value / Math.max(max, 1)) * 100)}%` }} />
        </div>
        <span className="w-16 text-right text-sm font-black text-slate-950 dark:text-white">{number(value)}</span>
      </div>
    </div>
  );
};

const PdfBadgeIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <span aria-hidden="true" className={`relative inline-flex shrink-0 items-center justify-center rounded-[4px] border-2 border-red-600 bg-white text-[9px] font-black leading-none text-red-600 ${className}`}>
    PDF
    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-bl-[3px] border-b border-l border-red-200 bg-red-50" />
  </span>
);

const formulaLabel = (language: Lang, formula: string) =>
  `${language === 'en' ? 'Formula' : 'Công thức'}: ${formula}`;

const CirculationTrendChart = ({
  rows,
  c,
  language,
}: {
  rows: ReportData['trend'];
  c: ReportCopy;
  language: Lang;
}) => {
  const maxValue = Math.max(...rows.flatMap((row) => [row.borrowed, row.returned]), 1);
  const compactStep = Math.max(1, Math.ceil(rows.length / 8));
  const showEveryLabel = rows.length <= 12;

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs font-black">
          <span className="inline-flex items-center gap-2 text-blue-700 dark:text-blue-200"><i className="h-3 w-3 rounded-sm bg-blue-600" />{c.borrowed}</span>
          <span className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-200"><i className="h-3 w-3 rounded-sm bg-emerald-500" />{c.returned}</span>
        </div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-300">
          {language === 'en' ? 'Time runs left to right' : 'Thời gian chạy từ trái sang phải'}
        </span>
      </div>

      <div className="mt-5">
        <div className="grid grid-cols-[52px_1fr] gap-3">
          <div className="flex h-72 flex-col justify-between text-right text-[11px] font-bold text-slate-500 dark:text-slate-300">
            <span>{number(maxValue, language)}</span>
            <span>{number(Math.round(maxValue / 2), language)}</span>
            <span>0</span>
          </div>
          <div className="relative h-72 border-b border-l border-slate-300 dark:border-slate-600">
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-slate-200 dark:border-slate-700" />
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200 dark:border-slate-700" />
            <div className="absolute inset-x-0 bottom-0 border-t border-slate-200 dark:border-slate-700" />
            <div
              className="absolute inset-x-2 bottom-0 top-3 grid items-end gap-1 sm:gap-2"
              style={{ gridTemplateColumns: `repeat(${Math.max(rows.length, 1)}, minmax(0, 1fr))` }}
            >
              {rows.map((row, index) => (
                <div key={row.label} className="group relative flex h-full min-w-0 flex-col items-center justify-end gap-2">
                  <div className="flex h-[calc(100%-28px)] w-full items-end justify-center gap-0.5 sm:gap-1.5">
                    <div
                      className="w-full max-w-4 rounded-t-md bg-blue-600 shadow-sm transition group-hover:bg-blue-500"
                      title={`${row.label} - ${c.borrowed}: ${number(row.borrowed, language)}`}
                      style={{ height: `${Math.max(4, (row.borrowed / maxValue) * 100)}%` }}
                    />
                    <div
                      className="w-full max-w-4 rounded-t-md bg-emerald-500 shadow-sm transition group-hover:bg-emerald-400"
                      title={`${row.label} - ${c.returned}: ${number(row.returned, language)}`}
                      style={{ height: `${Math.max(4, (row.returned / maxValue) * 100)}%` }}
                    />
                  </div>
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-44 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-left text-xs shadow-xl group-hover:block dark:border-slate-700 dark:bg-slate-900">
                    <p className="font-black text-slate-950 dark:text-white">{row.label}</p>
                    <p className="mt-2 flex items-center justify-between text-blue-700 dark:text-blue-200">
                      <span>{c.borrowed}</span>
                      <b>{number(row.borrowed, language)}</b>
                    </p>
                    <p className="mt-1 flex items-center justify-between text-emerald-700 dark:text-emerald-200">
                      <span>{c.returned}</span>
                      <b>{number(row.returned, language)}</b>
                    </p>
                    <p className="mt-2 border-t border-slate-100 pt-2 font-bold text-slate-500 dark:border-slate-700 dark:text-slate-300">
                      {language === 'en' ? 'Gap' : 'Chênh lệch'}: {number(row.borrowed - row.returned, language)}
                    </p>
                  </div>
                  <span className="h-5 max-w-16 truncate text-center text-[10px] font-bold text-slate-500 dark:text-slate-300">
                    {showEveryLabel || index % compactStep === 0 || index === rows.length - 1 ? row.label : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ViolationDoughnut = ({
  data,
  c,
  language,
}: {
  data: { label: string; value: number; color: string }[];
  c: ReportCopy;
  language: Lang;
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let offset = 25;
  const segments = data.map((item) => {
    const share = total > 0 ? (item.value / total) * 100 : 0;
    const segment = (
      <circle
        key={item.label}
        cx="21"
        cy="21"
        r="15.915"
        fill="transparent"
        stroke={item.color}
        strokeWidth="7"
        strokeDasharray={`${share} ${100 - share}`}
        strokeDashoffset={offset}
      />
    );
    offset -= share;
    return segment;
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-300">{c.violationMix}</p>
      <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{c.violationMixHint}</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-[190px_1fr] sm:items-center">
        <div className="relative mx-auto h-44 w-44">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 42 42">
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="currentColor" strokeWidth="7" className="text-slate-100 dark:text-slate-800" />
            {segments}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black text-slate-950 dark:text-white">{number(total, language)}</span>
            <span className="mt-1 text-[10px] font-black uppercase text-slate-500 dark:text-slate-300">{language === 'en' ? 'Total' : 'Tổng'}</span>
          </div>
        </div>
        <div className="space-y-3">
          {data.map((item) => {
            const share = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={item.label} className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: item.color }} />
                  <span className="truncate text-sm font-bold text-slate-700 dark:text-slate-100">{item.label}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-950 dark:text-white">{number(item.value, language)}</p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-300">{percent(share, language)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Reports = () => {
  const { language } = useLanguage();
  const lang = language as Lang;
  const c = COPY[lang] as ReportCopy;
  const periods = useMemo(() => getPeriods(c), [c]);
  const tabs = useMemo(() => getTabs(c), [c]);
  const [period, setPeriod] = useState<DashboardReportPeriod>('MONTHLY');
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customizing, setCustomizing] = useState(false);
  const [draggingWidgetId, setDraggingWidgetId] = useState<WidgetId | null>(null);
  const widgetStorageKey = useMemo(() => {
    const tokenSubject = (() => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return 'anonymous';
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.sub || payload.email || 'anonymous';
      } catch {
        return 'anonymous';
      }
    })();
    return `library74.librarian.report.widgets.${tokenSubject}`;
  }, []);
  const [selectedWidgetIds, setSelectedWidgetIds] = useState<WidgetId[]>(() => {
    try {
      const raw = localStorage.getItem(widgetStorageKey);
      if (!raw) return DEFAULT_WIDGET_IDS;
      const parsed = JSON.parse(raw);
      const valid = Array.isArray(parsed)
        ? parsed.filter((id): id is WidgetId => DEFAULT_WIDGET_IDS.includes(id))
        : [];
      return valid.length > 0 ? valid.slice(0, MAX_OVERVIEW_WIDGETS) : DEFAULT_WIDGET_IDS;
    } catch {
      return DEFAULT_WIDGET_IDS;
    }
  });
  const [report, setReport] = useState<ReportData | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [riskyUsers, setRiskyUsers] = useState<RiskyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);
  const [printPreview, setPrintPreview] = useState<OperationalPrintData | null>(null);

  const selectedPeriod = periods.find((item) => item.value === period) || periods[1];

  useEffect(() => {
    localStorage.setItem(widgetStorageKey, JSON.stringify(selectedWidgetIds));
  }, [selectedWidgetIds, widgetStorageKey]);

  const loadReport = async () => {
    const range = reportRange(period, dateFrom, dateTo);
    if (period === 'CUSTOM' && (!range.dateFrom || !range.dateTo)) {
      toast.error(lang === 'en' ? 'Please select both start and end dates' : 'Vui lòng chọn đủ ngày bắt đầu và ngày kết thúc');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [reportRes, summaryRes, riskRes, chartsRes] = await Promise.all([
        librarianDashboardService.getReport(period, range.dateFrom, range.dateTo),
        librarianDashboardService.getSummary().catch(() => null),
        librarianDashboardService.getRiskyUsers(0, 8).catch(() => null),
        librarianDashboardService.getCharts('MONTHLY').catch(() => null),
      ]);
      setReport(reportRes.data);
      setSummary(summaryRes?.data || null);
      setRiskyUsers(riskRes?.data?.content || []);
      setCharts(chartsRes?.data || null);
    } catch (error) {
      console.error('Failed to load librarian report:', error);
      setReport(null);
      setError(c.loadingError);
      toast.error(c.loadingTitle);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const status = useMemo(() => report ? healthStatus(report, c) : null, [report, c]);
  const maxTopBorrow = useMemo(() => Math.max(...(report?.topBorrowedPublications || []).map((book) => book.borrowCount), 1), [report]);

  const derived = useMemo(() => {
    if (!report) return null;
    const operationalPressure = report.circulation.overdueCurrentCount + report.circulation.waitingPickupCount + report.circulation.reservationPendingCount;
    const availableRate = report.inventory.totalItems > 0 ? (report.inventory.availableItems / report.inventory.totalItems) * 100 : 0;
    const incidentCount = report.incidents.overdueFineCount + report.incidents.damagedFineCount + report.incidents.lostFineCount;
    const collectionRate = Number(report.finance.finesCreated || 0) > 0
      ? (Number(report.finance.finesCollected || 0) / Number(report.finance.finesCreated || 0)) * 100
      : 0;
    const cashToCollect = Number(report.finance.unpaidFineOutstanding || 0);
    return { operationalPressure, availableRate, incidentCount, collectionRate, cashToCollect };
  }, [report]);

  const handleExportExcel = async () => {
    if (!report || exporting) return;
    setExporting('excel');
    try {
      const blob = await librarianDashboardService.exportExcel(report.dateFrom, report.dateTo);
      downloadBlob(blob, operationalReportFilename(report.dateFrom, report.dateTo));
      toast.success(c.excelSuccess);
    } catch {
      toast.error(lang === 'en' ? 'Excel export failed. Please retry or select a smaller reporting period.' : 'Xuất Excel không thành công. Vui lòng thử lại hoặc chọn kỳ báo cáo nhỏ hơn.');
    } finally {
      setExporting(null);
    }
  };

  const handlePrintPdf = async () => {
    if (!report || exporting) return;
    setExporting('pdf');
    try {
      const response = await librarianDashboardService.getPrintReport(report.dateFrom, report.dateTo);
      setPrintPreview(response.data);
    } catch {
      toast.error(lang === 'en' ? 'Unable to load report preview.' : 'Không thể tải bản xem trước báo cáo.');
    } finally { setExporting(null); }
  };

  const toggleWidget = (id: WidgetId) => {
    setSelectedWidgetIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= MAX_OVERVIEW_WIDGETS) {
        toast.info(c.maxWidgetsReached);
        return current;
      }
      return [...current, id];
    });
  };

  const hideWidget = (id: WidgetId) => {
    setSelectedWidgetIds((current) => current.filter((item) => item !== id));
  };

  const resetWidgets = () => setSelectedWidgetIds(DEFAULT_WIDGET_IDS);

  const reorderWidget = (targetId: WidgetId) => {
    if (!draggingWidgetId || draggingWidgetId === targetId) return;
    setSelectedWidgetIds((current) => {
      const fromIndex = current.indexOf(draggingWidgetId);
      const toIndex = current.indexOf(targetId);
      if (fromIndex < 0 || toIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setDraggingWidgetId(null);
  };

  const overviewWidgetDefinitions = useMemo(() => {
    if (!report || !derived) return [];
    return [
      {
        id: 'pressure' as WidgetId,
        group: 'operations' as WidgetGroup,
        label: c.pressure,
        node: (
          <MetricCard
            title={c.pressure}
            value={number(derived.operationalPressure, lang)}
            hint={c.pressureHint}
            icon={ShieldAlert}
            tone={derived.operationalPressure > 0 ? 'amber' : 'emerald'}
            to="/librarianpage/transactions"
          />
        ),
      },
      {
        id: 'circulationBalance' as WidgetId,
        group: 'operations' as WidgetGroup,
        label: c.circulationBalance,
        node: (
          <MetricCard
            title={c.circulationBalance}
            value={`${number(report.circulation.borrowCount, lang)} ${c.borrowed} · ${number(report.circulation.returnCount, lang)} ${c.returned}`}
            hint={interpolate(c.circulationBalanceHint, { rate: percent(report.circulation.returnRatePercent, lang) })}
            formula={formulaLabel(lang, `${c.returned} / ${c.borrowed} x 100`)}
            icon={TrendingUp}
            tone={Number(report.circulation.returnRatePercent || 0) >= 90 ? 'emerald' : 'amber'}
          />
        ),
      },
      {
        id: 'moneyToCollect' as WidgetId,
        group: 'finance' as WidgetGroup,
        label: c.moneyToCollect,
        node: (
          <MetricCard
            title={c.moneyToCollect}
            value={currency(derived.cashToCollect, lang)}
            hint={interpolate(c.openFineHint, { count: number(summary?.fineSummary.unpaidFineCount || 0, lang) })}
            icon={HandCoins}
            tone={derived.cashToCollect > 0 ? 'red' : 'emerald'}
            to="/librarianpage/transactions"
          />
        ),
      },
      {
        id: 'availableStock' as WidgetId,
        group: 'inventory' as WidgetGroup,
        label: c.availableStock,
        node: (
          <MetricCard
            title={c.availableStock}
            value={percent(derived.availableRate, lang)}
            hint={interpolate(c.availableStockHint, { available: number(report.inventory.availableItems, lang), total: number(report.inventory.totalItems, lang) })}
            formula={formulaLabel(lang, `${c.available} / ${c.totalCopies} x 100`)}
            icon={PackageCheck}
            tone="blue"
            to="/librarianpage/copies"
          />
        ),
      },
      {
        id: 'netCash' as WidgetId,
        group: 'finance' as WidgetGroup,
        label: c.netCash,
        node: (
          <MetricCard
            title={c.netCash}
            value={currency(report.finance.netCashInPeriod, lang)}
            hint={c.netCashHint}
            formula={formulaLabel(lang, lang === 'en' ? 'deposits + fines - refunds' : 'cọc thu + phí thu - hoàn tiền')}
            icon={WalletCards}
            tone="purple"
          />
        ),
      },
      {
        id: 'incidents' as WidgetId,
        group: 'operations' as WidgetGroup,
        label: c.incidents,
        node: (
          <MetricCard
            title={c.incidents}
            value={number(derived.incidentCount, lang)}
            hint={c.incidentsHint}
            icon={AlertTriangle}
            tone={derived.incidentCount > 0 ? 'red' : 'emerald'}
          />
        ),
      },
      {
        id: 'stockAdded' as WidgetId,
        group: 'inventory' as WidgetGroup,
        label: c.stockAdded,
        node: (
          <MetricCard title={c.stockAdded} value={number(report.inventory.itemsAddedInPeriod, lang)} hint={interpolate(c.stockAddedHint, { count: number(report.inventory.publicationsAddedInPeriod, lang) })} icon={BookOpen} tone="slate" to="/librarianpage/books" />
        ),
      },
      {
        id: 'riskyReaders' as WidgetId,
        group: 'readers' as WidgetGroup,
        label: c.riskyReaders,
        node: (
          <MetricCard title={c.riskyReaders} value={number(riskyUsers.length, lang)} hint={c.riskyReadersHint} icon={Users} tone={riskyUsers.length > 0 ? 'amber' : 'emerald'} to="/librarianpage/transactions" />
        ),
      },
    ];
  }, [c, derived, lang, report, riskyUsers.length, summary?.fineSummary.unpaidFineCount]);

  const overviewWidgetMap = useMemo(
    () => new Map(overviewWidgetDefinitions.map((widget) => [widget.id, widget])),
    [overviewWidgetDefinitions],
  );

  return (
    <div className="mx-auto w-full max-w-[1680px] space-y-6 p-4 text-slate-900 dark:text-white sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="grid gap-6 bg-gradient-to-br from-slate-950 via-blue-950 to-sky-800 p-6 text-white lg:grid-cols-[1fr_420px] lg:p-8">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue-100">
              <BarChart3 size={15} />
              {c.pageBadge}
            </div>
            <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-tight sm:text-4xl">
              {c.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">
              {c.subtitle}
            </p>
            {report && (
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-white px-3 py-1.5 font-bold text-slate-950">
                  {dateLabel(report.dateFrom, lang)} - {dateLabel(report.dateTo, lang)}
                </span>
                {status && <span className={`rounded-full border px-3 py-1.5 font-bold ${status.className}`}>{status.label}</span>}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-wide text-blue-100">{c.period}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {periods.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setPeriod(item.value)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition ${
                    period === item.value ? 'border-white bg-white text-blue-800' : 'border-white/15 bg-white/5 text-blue-50 hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-blue-100">{selectedPeriod.hint}</p>
            {period === 'CUSTOM' && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-bold text-blue-100">
                  {c.fromDate}
                  <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="mt-1 w-full rounded-lg border border-white/20 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none" />
                </label>
                <label className="text-xs font-bold text-blue-100">
                  {c.toDate}
                  <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="mt-1 w-full rounded-lg border border-white/20 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none" />
                </label>
              </div>
            )}
            <button type="button" onClick={loadReport} disabled={loading} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-blue-800 hover:bg-blue-50 disabled:opacity-60">
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
              {c.refresh}
            </button>
            {report && (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  disabled={exporting !== null || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2.5 text-xs font-black text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-60"
                >
                  {exporting === 'pdf' ? <RefreshCcw aria-hidden="true" size={15} className="animate-spin" /> : <PdfBadgeIcon className="h-5 w-5" />}
                  {c.pdfButton}
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={exporting !== null || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {exporting === 'excel' ? <RefreshCcw aria-hidden="true" size={15} className="animate-spin" /> : <FileSpreadsheet aria-hidden="true" size={15} />}
                  {c.excelButton}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white" />)}
        </div>
      )}

      {!loading && error && (
        <section className="rounded-xl border border-red-100 bg-red-50 p-5 text-red-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={20} />
              <div>
                <h2 className="font-black">{c.loadingTitle}</h2>
                <p className="mt-1 text-sm leading-6 text-red-700">{error}</p>
              </div>
            </div>
            <button type="button" onClick={loadReport} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700">
              <RefreshCcw size={16} />
              {c.retry}
            </button>
          </div>
        </section>
      )}

      {!loading && report && derived && (
        <>
          <nav className="sticky top-0 z-20 -mx-4 overflow-x-auto border-y border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-950/95 sm:mx-0 sm:rounded-xl sm:border">
            <div className="flex min-w-max gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-lg px-4 py-2.5 text-left text-sm font-black transition ${
                    activeTab === tab.key ? 'bg-blue-700 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:text-blue-200'
                  }`}
                >
                  {tab.label}
                  <span className={`block text-[11px] font-semibold ${activeTab === tab.key ? 'text-blue-100' : 'text-slate-400 dark:text-slate-300'}`}>{tab.hint}</span>
                </button>
              ))}
            </div>
          </nav>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-300">{c.dynamicDashboard}</p>
                    <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{c.overview}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{customizing ? c.dynamicDashboardHint : c.overviewHint}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {customizing && (
                      <button type="button" onClick={resetWidgets} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800">
                        <RefreshCcw size={14} />
                        {c.resetTemplate}
                      </button>
                    )}
                    <button type="button" onClick={() => setCustomizing((value) => !value)} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800">
                      <Pencil size={14} />
                      {customizing ? c.finishCustomize : c.customizeDashboard}
                    </button>
                  </div>
                </div>

                <div className={`mt-4 grid gap-4 ${customizing ? 'xl:grid-cols-[minmax(0,1fr)_340px]' : ''}`}>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {selectedWidgetIds.map((id) => {
                      const widget = overviewWidgetMap.get(id);
                      if (!widget) return null;
                      return (
                        <div
                          key={id}
                          draggable={customizing}
                          onDragStart={() => setDraggingWidgetId(id)}
                          onDragOver={(event) => customizing && event.preventDefault()}
                          onDrop={() => reorderWidget(id)}
                          className={`relative min-w-0 ${customizing ? 'rounded-xl ring-2 ring-dashed ring-blue-200 dark:ring-blue-500/30' : ''}`}
                        >
                          {customizing && (
                            <div className="absolute right-2 top-2 z-10 flex gap-1">
                              <span className="inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                                <GripVertical size={15} />
                              </span>
                              <button type="button" onClick={() => hideWidget(id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50 dark:border-red-500/30 dark:bg-slate-950 dark:text-red-300 dark:hover:bg-red-500/15">
                                <X size={15} />
                              </button>
                            </div>
                          )}
                          {widget.node}
                        </div>
                      );
                    })}
                  </div>

                  {customizing && (
                    <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-black text-slate-950 dark:text-white">{c.widgetLibrary}</h3>
                          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-300">{c.widgetLimit}</p>
                        </div>
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-black text-blue-700 dark:bg-blue-500/15 dark:text-blue-100">
                          {selectedWidgetIds.length}/{MAX_OVERVIEW_WIDGETS}
                        </span>
                      </div>
                      <div className="mt-4 space-y-5">
                        {([
                          ['operations', c.operations],
                          ['inventory', c.inventory],
                          ['finance', c.finance],
                          ['readers', c.readers],
                        ] as [WidgetGroup, string][]).map(([group, label]) => (
                          <div key={group}>
                            <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
                            <div className="space-y-2">
                              {overviewWidgetDefinitions.filter((widget) => widget.group === group).map((widget) => {
                                const checked = selectedWidgetIds.includes(widget.id);
                                return (
                                  <button
                                    key={widget.id}
                                    type="button"
                                    onClick={() => toggleWidget(widget.id)}
                                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10"
                                  >
                                    <span>{widget.label}</span>
                                    <span className={`h-6 w-11 rounded-full p-0.5 transition ${checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                      <span className={`block h-5 w-5 rounded-full bg-white transition ${checked ? 'translate-x-5' : ''}`} />
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </aside>
                  )}
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-300">{c.operationalReview}</p>
                      <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{c.mainConclusion}</h2>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {report.librarianNotes.length > 0 ? report.librarianNotes.map((note, index) => (
                      <div key={index} className="flex gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-50">
                        <FileText className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-200" size={18} />
                        <p>{note}</p>
                      </div>
                    )) : (
                      <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-200">{c.noNotes}</div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-300">{c.drillDown}</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{c.chooseMetricGroup}</h2>
                  <div className="mt-5 space-y-3">
                    {[
                      [c.operations, c.chooseOps, 'operations'],
                      [c.inventory, c.chooseInventory, 'inventory'],
                      [c.finance, c.chooseFinance, 'finance'],
                      [c.readers, c.chooseReaders, 'readers'],
                    ].map(([label, hint, tab]) => (
                      <button key={tab} type="button" onClick={() => setActiveTab(tab as TabKey)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-100 p-4 text-left hover:border-blue-200 hover:bg-blue-50/50 dark:border-slate-700 dark:hover:border-blue-400/50 dark:hover:bg-slate-800">
                        <span>
                          <b className="block text-sm text-slate-950 dark:text-white">{label}</b>
                          <span className="mt-1 block text-sm leading-6 text-slate-500 dark:text-slate-300">{hint}</span>
                        </span>
                        <ArrowRight size={16} className="shrink-0 text-blue-600 dark:text-blue-300" />
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'operations' && (
            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-300">{c.trendOverline}</p>
                <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{c.trendTitle}</h2>
                <CirculationTrendChart rows={report.trend} c={c} language={lang} />
              </div>

              <div className="space-y-4">
                <MetricCard title={c.circulationInPeriod} value={`${number(report.circulation.borrowCount, lang)} ${c.borrowed} · ${number(report.circulation.returnCount, lang)} ${c.returned}`} hint={interpolate(c.circulationBalanceHint, { rate: percent(report.circulation.returnRatePercent, lang) })} formula={formulaLabel(lang, `${c.returned} / ${c.borrowed} x 100`)} icon={TrendingUp} tone="blue" to="/librarianpage/transactions" />
                <MetricCard title={c.activeBorrows} value={number(report.circulation.activeBorrowCount, lang)} hint={interpolate(c.activeBorrowsHint, { count: number(report.circulation.overdueCurrentCount, lang) })} icon={Users} tone={report.circulation.overdueCurrentCount > 0 ? 'amber' : 'emerald'} to="/librarianpage/transactions" />
                <MetricCard title={c.waitingQueue} value={number(report.circulation.waitingPickupCount + report.circulation.reservationPendingCount, lang)} hint={interpolate(c.waitingQueueHint, { pickup: number(report.circulation.waitingPickupCount, lang), reservation: number(report.circulation.reservationPendingCount, lang) })} formula={formulaLabel(lang, lang === 'en' ? 'waiting pickup + pending reservations' : 'chờ lấy + đặt trước đang chờ')} icon={CalendarDays} tone="amber" to="/librarianpage/transactions" />
              </div>
            </section>
          )}

          {activeTab === 'inventory' && (
            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-300">{c.copyStatus}</p>
                <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{c.physicalStock}</h2>
                <div className="mt-5 space-y-4">
                  {[
                    [c.available, report.inventory.availableItems, 'emerald'],
                    [c.borrowedItems, report.inventory.borrowedItems, 'blue'],
                    [c.reserved, report.inventory.reservedItems, 'amber'],
                    [c.maintenance, report.inventory.maintenanceItems, 'amber'],
                    [c.lost, report.inventory.lostItems, 'red'],
                  ].map(([label, value, tone]) => (
                    <ProgressRow key={label as string} label={label as string} value={Number(value)} max={report.inventory.totalItems} tone={tone as any} />
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <MetricCard title={c.totalCopies} value={number(report.inventory.totalItems, lang)} hint={c.totalCopiesHint} icon={BookOpen} tone="blue" to="/librarianpage/copies" />
                <MetricCard title={c.copiesAdded} value={number(report.inventory.itemsAddedInPeriod, lang)} hint={interpolate(c.stockAddedHint, { count: number(report.inventory.publicationsAddedInPeriod, lang) })} icon={PackageCheck} tone="emerald" to="/librarianpage/books" />
                <MetricCard title={c.lostMaintenance} value={`${number(report.inventory.lostItems, lang)} / ${number(report.inventory.maintenanceItems, lang)}`} hint={c.lostMaintenanceHint} icon={AlertTriangle} tone={report.inventory.lostItems > 0 ? 'red' : 'amber'} to="/librarianpage/copies" />
                <MetricCard title={c.availableStock} value={percent(derived.availableRate, lang)} hint={c.availableRateHint} formula={formulaLabel(lang, `${c.available} / ${c.totalCopies} x 100`)} icon={CheckCircle2} tone="emerald" />
                {charts?.itemStatusDistribution && (
                  <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-300">{c.currentDistribution}</p>
                    <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{c.systemCopyStatus}</h2>
                    <div className="mt-5 grid gap-3 sm:grid-cols-5">
                      {[
                        [c.available, charts.itemStatusDistribution.available],
                        [c.borrowedItems, charts.itemStatusDistribution.borrowed],
                        [c.reserved, charts.itemStatusDistribution.reserved],
                        [c.maintenance, charts.itemStatusDistribution.inMaintenance],
                        [c.lost, charts.itemStatusDistribution.lost],
                      ].map(([label, value]) => (
                        <div key={label as string} className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800">
                          <p className="text-xl font-black text-slate-950 dark:text-white">{number(value as number, lang)}</p>
                          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-300">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'finance' && (
            <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-300">{c.financeCheck}</p>
                <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{c.depositsAndCash}</h2>
                <dl className="mt-5 space-y-3 text-sm">
                  {[
                    [c.depositsCollected, currency(report.finance.depositsCollected, lang)],
                    [c.depositsRefunded, currency(report.finance.depositsRefunded, lang)],
                    [c.depositsApplied, currency(report.finance.depositsAppliedToFines, lang)],
                    [c.additionalDue, currency(report.finance.additionalAmountDue, lang)],
                    [c.finesCreated, currency(report.finance.finesCreated, lang)],
                    [c.finesCollected, currency(report.finance.finesCollected, lang)],
                    [c.lostRefunds, currency(report.finance.lostBookRefunds, lang)],
                    [c.netCash, currency(report.finance.netCashInPeriod, lang)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-700">
                      <dt className="text-slate-500 dark:text-slate-300">{label}</dt>
                      <dd className="text-right font-black text-slate-950 dark:text-white">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="space-y-4">
                <MetricCard title={c.collectionRate} value={percent(derived.collectionRate, lang)} hint={interpolate(c.collectionRateHint, { collected: currency(report.finance.finesCollected, lang), created: currency(report.finance.finesCreated, lang) })} formula={formulaLabel(lang, `${c.finesCollected} / ${c.finesCreated} x 100`)} icon={PiggyBank} tone={derived.collectionRate >= 80 ? 'emerald' : 'amber'} />
                <MetricCard title={c.outstandingFines} value={currency(report.finance.unpaidFineOutstanding, lang)} hint={c.outstandingFinesHint} icon={ShieldAlert} tone={derived.cashToCollect > 0 ? 'red' : 'emerald'} to="/librarianpage/transactions" />
                <ViolationDoughnut
                  c={c}
                  language={lang}
                  data={[
                    { label: c.overdueReturn, value: report.incidents.overdueFineCount, color: '#f59e0b' },
                    { label: c.damagedBook, value: report.incidents.damagedFineCount, color: '#ef4444' },
                    { label: c.lostBook, value: report.incidents.lostFineCount, color: '#b91c1c' },
                    { label: c.recoveredLost, value: report.incidents.recoveredLostBookCount, color: '#10b981' },
                  ]}
                />
              </div>
            </section>
          )}

          {activeTab === 'readers' && (
            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-300">{c.readerDemand}</p>
                <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{c.topBorrowed}</h2>
                <div className="mt-5 space-y-3">
                  {report.topBorrowedPublications.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 p-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">{c.noBorrowData}</div>
                  ) : report.topBorrowedPublications.map((book, index) => (
                    <Link key={book.publicationId} to={`/librarianpage/books/${book.publicationId}`} className="block rounded-lg border border-slate-100 p-3 hover:border-blue-200 hover:bg-blue-50/40 dark:border-slate-700 dark:hover:border-blue-400/50 dark:hover:bg-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-black text-blue-700 dark:bg-blue-500/15 dark:text-blue-100">{index + 1}</div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-slate-950 dark:text-white">{book.title}</p>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(5, (book.borrowCount / maxTopBorrow) * 100)}%` }} />
                          </div>
                        </div>
                        <p className="text-sm font-black text-blue-700 dark:text-blue-200">{number(book.borrowCount, lang)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-blue-600 dark:text-blue-300">{c.readersToWatch}</p>
                    <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{c.readerRisks}</h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-100">{number(riskyUsers.length, lang)} {c.profiles}</span>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {riskyUsers.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 p-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">{c.noRiskData}</div>
                  ) : riskyUsers.map((user) => (
                    <Link key={user.userId} to="/librarianpage/transactions" className="rounded-lg border border-slate-200 p-4 hover:border-blue-200 hover:bg-blue-50/40 dark:border-slate-700 dark:hover:border-blue-400/50 dark:hover:bg-slate-800">
                      <div className="flex items-center gap-3">
                        {user.profilePictureUrl ? (
                          <img src={user.profilePictureUrl} alt={user.fullName} className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-100"><UserRound size={18} /></div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950 dark:text-white">{user.fullName}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-300">{user.studentId || user.email}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-lg bg-amber-50 p-2 text-amber-700 dark:bg-amber-500/15 dark:text-amber-100"><b>{number(user.riskyMetrics.overdueCount, lang)}</b><br />{c.overdue}</div>
                        <div className="rounded-lg bg-red-50 p-2 text-red-700 dark:bg-red-500/15 dark:text-red-100"><b>{number(user.riskyMetrics.unpaidFineCount, lang)}</b><br />{c.unpaidFine}</div>
                        <div className="rounded-lg bg-slate-50 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-100"><b>{number(user.riskyMetrics.damagedCount, lang)}</b><br />{c.damaged}</div>
                      </div>
                      <p className="mt-3 text-sm font-black text-slate-950 dark:text-white">{currency(user.riskyMetrics.totalUnpaidAmount, lang)}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

        </>
      )}
      {printPreview && <OperationalReportPreview data={printPreview} language={lang} onClose={() => setPrintPreview(null)} />}
    </div>
  );
};

export default Reports;

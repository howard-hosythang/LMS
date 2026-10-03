import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Reports from '../../pages/librarian_pages/Reports';
import service, { OperationalPrintData } from '../../api/librarianDashboardService';
import { buildOperationalPrintHtml, operationalReportFilename } from '../../utils/operationalReportPrint';
import { facultyLabel, facultyOptions } from '../../utils/facultyLabels';
import { toast } from 'sonner';

jest.mock('../../contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'vi' }) }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }));
jest.mock('../../api/librarianDashboardService', () => ({ __esModule: true, default: {
  getReport: jest.fn(), getSummary: jest.fn(), getRiskyUsers: jest.fn(), getCharts: jest.fn(), exportExcel: jest.fn(), getPrintReport: jest.fn(),
} }));

const report = {
  dateFrom: '2026-10-01', dateTo: '2026-10-03',
  inventory: { totalItems: 10, availableItems: 5, borrowedItems: 3, reservedItems: 2, maintenanceItems: 0, lostItems: 0, itemsAddedInPeriod: 0, publicationsAddedInPeriod: 0 },
  circulation: { borrowCount: 4, returnCount: 2, activeBorrowCount: 3, overdueCurrentCount: 1, waitingPickupCount: 0, reservationPendingCount: 0, returnRatePercent: 50 },
  finance: { depositsCollected: 100000, depositsRefunded: 50000, depositsAppliedToFines: 1000, additionalAmountDue: 0, finesCreated: 2000, finesCollected: 1000, unpaidFineOutstanding: 1000, lostBookRefunds: 0, netCashInPeriod: 51000 },
  incidents: { overdueFineCount: 1, damagedFineCount: 0, lostFineCount: 0, recoveredLostBookCount: 0 },
  trend: [], topBorrowedPublications: [], riskyReaders: [], librarianNotes: [],
};
const printData: OperationalPrintData = { report, generatedAt: '2026-10-03T03:00:00Z', preparedBy: 'Librarian A', onTimeReturnRatePercent: 75, depositsHeld: 150000, overdueInPeriod: 1, riskyReaders: [] };
beforeEach(() => {
  jest.clearAllMocks(); localStorage.clear();
  jest.mocked(service.getReport).mockResolvedValue({ data: report } as any);
  jest.mocked(service.getSummary).mockResolvedValue(null as any);
  jest.mocked(service.getRiskyUsers).mockResolvedValue({ data: { content: [] } } as any);
  jest.mocked(service.getCharts).mockResolvedValue(null as any);
  jest.mocked(service.exportExcel).mockResolvedValue(new Blob(['xlsx']));
  jest.mocked(service.getPrintReport).mockResolvedValue({ data: printData });
  URL.createObjectURL = jest.fn(() => 'blob:report'); URL.revokeObjectURL = jest.fn();
});

test('Excel button downloads a real workbook using the loaded report date range and specified filename', async () => {
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    expect(this.download).toBe('Bao_Cao_Van_Hanh_LMS_2026-10-01_2026-10-03.xlsx');
  });
  render(<MemoryRouter><Reports /></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: 'Xuất Excel chi tiết' }));
  await waitFor(() => expect(click).toHaveBeenCalled());
  expect(service.exportExcel).toHaveBeenCalledWith('2026-10-01', '2026-10-03');
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:report'); click.mockRestore();
});

test('failed Excel exports show an error and never disguise partial CSV data as Excel', async () => {
  jest.mocked(service.exportExcel).mockRejectedValueOnce(new Error('Export failed'));
  render(<MemoryRouter><Reports /></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: 'Xuất Excel chi tiết' }));
  await waitFor(() => expect(toast.error).toHaveBeenCalled());
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  expect(toast.success).not.toHaveBeenCalled();
});

test('PDF button opens an A4 preview with signatures instead of a navigation popup', async () => {
  render(<MemoryRouter><Reports /></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: 'In / Xuất PDF' }));
  const drawer = await screen.findByRole('dialog', { name: 'Xem trước báo cáo A4' });
  expect(service.getPrintReport).toHaveBeenCalledWith('2026-10-01', '2026-10-03');
  const frame = within(drawer).getByTitle('Bản in báo cáo vận hành');
  expect(frame).toHaveAttribute('sandbox', 'allow-same-origin allow-modals');
  expect(frame.getAttribute('srcdoc')).toContain('NGƯỜI LẬP BIỂU');
  expect(frame.getAttribute('srcdoc')).toContain('TRƯỞNG BỘ PHẬN THƯ VIỆN');
  const printButton = within(drawer).getByRole('button', { name: 'In / Lưu PDF' });
  expect(printButton).toBeInTheDocument();
  const printWindow = (frame as HTMLIFrameElement).contentWindow!;
  const print = jest.spyOn(printWindow, 'print').mockImplementation(() => {});
  const focus = jest.spyOn(printWindow, 'focus').mockImplementation(() => {});
  fireEvent.load(frame);
  fireEvent.click(printButton);
  expect(print).toHaveBeenCalledTimes(1);
  print.mockRestore(); focus.mockRestore();
  fireEvent.click(within(drawer).getByRole('button', { name: 'Đóng' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(service.getReport).toHaveBeenCalledTimes(1);
});

test('failed preview requests show an error without opening an empty report', async () => {
  jest.mocked(service.getPrintReport).mockRejectedValueOnce(new Error('Unavailable'));
  render(<MemoryRouter><Reports /></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: 'In / Xuất PDF' }));
  await waitFor(() => expect(toast.error).toHaveBeenCalled());
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('A4 document has two sections, correct metrics, bounded tables and escaped user text', () => {
  const data = { ...printData, preparedBy: '<script>alert(1)</script>', report: { ...report,
    topBorrowedPublications: Array.from({ length: 12 }, (_, i) => ({ publicationId: String(i), title: `Book ${i} <img onerror="evil">`, borrowCount: i })),
  } };
  const html = buildOperationalPrintHtml(data, 'en');
  expect(html.match(/<section class="page">/g)).toHaveLength(2);
  expect(html).toContain('size:A4 portrait'); expect(html).toContain('75%');
  expect(html).toContain('150.000đ'); expect(html).toContain('HEAD OF LIBRARY');
  expect(html).toContain('&lt;script&gt;'); expect(html).not.toContain('<script>');
  expect(html).not.toContain('Book 10'); expect(html).not.toContain('Book 11');
  expect(operationalReportFilename('2026-10-01', '2026-10-03')).toBe('Bao_Cao_Van_Hanh_LMS_2026-10-01_2026-10-03.xlsx');
});

test('faculty labels accept every enum and Vietnamese backend name without losing English translations', () => {
  for (const faculty of facultyOptions) {
    expect(facultyLabel(faculty.value, 'vi')).toBe(faculty.label);
    expect(facultyLabel(`Khoa ${faculty.label}`, 'vi')).toBe(`Khoa ${faculty.label}`);
    expect(facultyLabel(faculty.value, 'en')).toBe(faculty.labelEn);
    expect(facultyLabel(`Khoa ${faculty.label}`, 'en')).toBe(faculty.labelEn);
  }
  expect(facultyLabel('UNKNOWN_FACULTY', 'vi')).toBe('UNKNOWN_FACULTY');
});

test.each(['KHOA_DIEN_DIEN_TU', 'Khoa Điện - Điện tử'])('PDF formats raw or pre-translated faculty: %s', faculty => {
  const data = { ...printData, riskyReaders: [{ studentId: '00123', fullName: 'Reader', faculty,
    email: null, phoneNumber: null, overdueCount: 1, totalUnpaidAmount: 1000, creditScore: 80 }] };
  expect(buildOperationalPrintHtml(data, 'vi')).toContain('Điện - Điện tử');
  expect(buildOperationalPrintHtml(data, 'vi')).not.toContain('KHOA_DIEN_DIEN_TU');
  expect(buildOperationalPrintHtml(data, 'en')).toContain('Electrical and Electronics Engineering');
});

test.each([null, '', '   ', 'Chưa ghi nhận'])('PDF handles unrecorded faculties: %s', faculty => {
  const data = { ...printData, riskyReaders: [{ studentId: '00123', fullName: 'Reader', faculty,
    email: null, phoneNumber: null, overdueCount: 0, totalUnpaidAmount: 0, creditScore: 80 }] };
  expect(buildOperationalPrintHtml(data, 'vi')).toContain('Chưa ghi nhận');
  expect(buildOperationalPrintHtml(data, 'en')).toContain('Not recorded');
});

test('PDF preserves unknown faculty text but escapes its HTML', () => {
  const data = { ...printData, riskyReaders: [{ studentId: '00123', fullName: 'Reader', faculty: '<script>unknown</script>',
    email: null, phoneNumber: null, overdueCount: 0, totalUnpaidAmount: 0, creditScore: 80 }] };
  const html = buildOperationalPrintHtml(data, 'vi');
  expect(html).toContain('&lt;script&gt;unknown&lt;/script&gt;');
  expect(html).not.toContain('<script>');
});

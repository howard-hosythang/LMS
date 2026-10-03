import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import TransactionList from '../../pages/librarian_pages/TransactionList';
import transactions from '../../api/transactionsService';
import inquiry from '../../api/circulationInquiryService';
import dashboard from '../../api/librarianDashboardService';

let mockLanguage = 'vi';
jest.mock('../../contexts/LanguageContext', () => ({ useLanguage: () => ({ language: mockLanguage }) }));
jest.mock('../../contexts/AppDialogContext', () => ({ useAppDialog: () => ({ confirm: jest.fn().mockResolvedValue(true) }) }));
jest.mock('../../api/transactionsService', () => ({ __esModule: true, default: { getAllTransactions: jest.fn(), getNotes: jest.fn(), upsertNote: jest.fn(), deleteNote: jest.fn() } }));
jest.mock('../../api/circulationInquiryService', () => ({ __esModule: true, default: { transaction: jest.fn(), publication: jest.fn(), readers: jest.fn(), publications: jest.fn(), item: jest.fn(), barcode: jest.fn(), timeline: jest.fn() } }));
jest.mock('../../api/librarianDashboardService', () => ({ __esModule: true, default: { getReaderProfile: jest.fn() } }));

const tx = { transactionId: '1', userId: '9', fullName: 'Reader A', studentId: '00123', publicationId: '22', publicationTitle: 'Book A', itemId: '5', barcode: 'BC5', authors: 'Author A', status: 'RETURNED', fineAmount: 100000, depositAmount: 50000, depositAppliedAmount: 50000, depositRefundAmount: 0, additionalAmountDue: 50000, note: 'Handover', important: true };
const copy = { itemId: '5', publicationId: '22', publicationTitle: 'Book A', barcode: 'BC5', branch: 'Cơ sở 2 - Dĩ An', location: 'A1', status: 'AVAILABLE', condition: 'NEW', waitingReshelving: true };
const page = (content: unknown[] = [], currentPage = 0) => ({ content, currentPage, pageSize: 15, totalPages: 3, totalElements: 40, isFirst: currentPage === 0, isLast: false });
function Location() { return <output data-testid="url">{useLocation().search}</output>; }
function open(url = '/librarianpage/transactions') { return render(<MemoryRouter initialEntries={[url]}><TransactionList /><Location /></MemoryRouter>); }
beforeEach(() => {
  jest.clearAllMocks(); mockLanguage = 'vi';
  jest.mocked(transactions.getAllTransactions).mockResolvedValue({ code: 200, data: page([tx]) } as any);
  jest.mocked(transactions.getNotes).mockResolvedValue({ code: 200, data: [] } as any);
  jest.mocked(transactions.upsertNote).mockResolvedValue({ code: 200, data: {} } as any);
  jest.mocked(transactions.deleteNote).mockResolvedValue({ code: 200 } as any);
  jest.mocked(inquiry.transaction).mockResolvedValue({ transaction: tx, fines: [{ fineId: 'f1', type: 'DAMAGED_BOOK', fineAmount: 100000, status: 'PAID', paidDate: '2026-10-03T03:00:00Z', paidByName: 'Collector A', paidByCode: 'L01' }] } as any);
  jest.mocked(inquiry.publication).mockResolvedValue({ publication: { publicationId: '22', publicationTitle: 'Book A', authors: 'Author A' }, counts: { total: 1, ready: 0, waiting: 1, borrowed: 0, reserved: 0, maintenance: 0, lost: 0 }, copies: page([copy]) } as any);
  jest.mocked(inquiry.item).mockResolvedValue(copy as any); jest.mocked(inquiry.barcode).mockResolvedValue(copy as any);
  jest.mocked(inquiry.timeline).mockResolvedValue(page([{ id: 'shelved-1', type: 'SHELVED', occurredAt: '2026-10-03T03:00:00Z', actorName: 'Shelver A', actorCode: 'L02' }]) as any);
  jest.mocked(inquiry.readers).mockResolvedValue([{ userId: '9', fullName: 'Reader A', studentId: '00123' }]);
  jest.mocked(inquiry.publications).mockResolvedValue([]);
  jest.mocked(dashboard.getReaderProfile).mockResolvedValue({ data: { userId: '9', fullName: 'Reader A', creditScore: 80, activeBorrows: 2, unpaidFineAmount: 100000 } } as any);
});

test('restores all log filters and pagination from the URL and keeps unrelated parameters', async () => {
  open('/librarianpage/transactions?tab=transactions&keyword=Java&status=RETURNED&fineStatus=UNPAID&dateType=RETURNED&dateFrom=2026-10-01&dateTo=2026-10-03&page=2&sortBy=returnedDate&sortDir=ASC&source=dashboard');
  await screen.findByText('Book A');
  expect(transactions.getAllTransactions).toHaveBeenCalledWith(2, 15, 'Java', 'RETURNED', 'UNPAID', '2026-10-01', '2026-10-03', 'returnedDate', 'ASC', 'RETURNED');
  expect(screen.getByLabelText('Loại ngày')).toHaveValue('RETURNED');
  fireEvent.change(screen.getByLabelText('Trạng thái mượn trả'), { target: { value: 'BORROWING' } });
  const params = new URLSearchParams(screen.getByTestId('url').textContent || '');
  expect(params.get('page')).toBe('0'); expect(params.get('source')).toBe('dashboard');
});

test('book click opens only quick view and external links preserve the inquiry tab', async () => {
  open();
  fireEvent.click(await screen.findByRole('button', { name: 'Book A' }));
  const drawer = await screen.findByRole('dialog', { name: 'Xem nhanh ấn phẩm' });
  await within(drawer).findByText('Author A');
  expect(inquiry.transaction).not.toHaveBeenCalled();
  expect(within(drawer).getByRole('link', { name: /Mở chi tiết đầu sách/ })).toHaveAttribute('target', '_blank');
  fireEvent.keyDown(drawer, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('detail drawer itemizes collector and keeps notes there without edit-fine action', async () => {
  open('/librarianpage/transactions?transactionId=1');
  const drawer = await screen.findByRole('dialog', { name: /Chi tiết giao dịch/ });
  await within(drawer).findByText(/Collector A/);
  expect(within(drawer).getByText('Bảng kê các khoản phạt')).toBeInTheDocument();
  expect(screen.queryByText('Chỉnh sửa phí')).not.toBeInTheDocument();
  fireEvent.change(within(drawer).getByLabelText('Ghi chú mới'), { target: { value: 'Next shift note' } });
  fireEvent.click(within(drawer).getByRole('button', { name: 'Thêm ghi chú' }));
  await waitFor(() => expect(transactions.upsertNote).toHaveBeenCalledWith('1', { note: 'Next shift note', important: false }));
});

test('restores reader ID with independent active and returned date ranges and pages', async () => {
  open('/librarianpage/transactions?tab=reader&userId=9&activePage=1&returnedPage=2&activeFrom=2026-09-01&returnedFrom=2026-10-01');
  await screen.findByText('Điểm tín nhiệm');
  await waitFor(() => expect(transactions.getAllTransactions).toHaveBeenCalledWith(1, 10, undefined, undefined, undefined, '2026-09-01', '', 'borrowedDate', 'DESC', 'BORROWED', '9', 'ACTIVE'));
  expect(transactions.getAllTransactions).toHaveBeenCalledWith(2, 10, undefined, undefined, undefined, '2026-10-01', '', 'returnedDate', 'DESC', 'RETURNED', '9', 'RETURNED');
});

test('reader suggestions select exact user ID rather than a name keyword', async () => {
  open('/librarianpage/transactions?tab=reader');
  fireEvent.change(screen.getByLabelText('Tra cứu MSSV hoặc họ tên'), { target: { value: 'Reader' } });
  fireEvent.click(await screen.findByRole('button', { name: 'Reader A · 00123' }));
  await waitFor(() => expect(dashboard.getReaderProfile).toHaveBeenCalledWith({ userId: '9' }));
  expect(new URLSearchParams(screen.getByTestId('url').textContent || '').get('userId')).toBe('9');
});

test('barcode lookup opens exact copy at its branch and loads actual lifecycle events', async () => {
  open('/librarianpage/transactions?tab=lifecycle&barcode=BC5');
  fireEvent.click(screen.getByRole('button', { name: 'Tra cứu' }));
  await screen.findByText('Xác nhận cất kệ');
  expect(inquiry.barcode).toHaveBeenCalledWith('BC5'); expect(inquiry.timeline).toHaveBeenCalledWith('5', 0);
  expect(inquiry.publication).toHaveBeenCalledWith('22', 'Cơ sở 2 - Dĩ An', 0);
  expect(screen.getByText('Shelver A · L02')).toBeInTheDocument();
  expect(new URLSearchParams(screen.getByTestId('url').textContent || '').get('itemId')).toBe('5');
});

test('lifecycle deep link restores copy and timeline pagination with English labels', async () => {
  mockLanguage = 'en';
  open('/librarianpage/transactions?tab=lifecycle&pubId=22&itemId=5&itemPage=1&timelinePage=2');
  await screen.findByText('Shelving confirmed');
  expect(inquiry.publication).toHaveBeenCalledWith('22', '', 1); expect(inquiry.timeline).toHaveBeenCalledWith('5', 2);
  expect(screen.getByRole('button', { name: 'Reader history' })).toBeInTheDocument();
});

test('old pending responses do not replace a newly selected filter', async () => {
  let resolveOld: (value: any) => void = () => {};
  jest.mocked(transactions.getAllTransactions).mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }));
  open();
  fireEvent.change(screen.getByLabelText('Trạng thái mượn trả'), { target: { value: 'RETURNED' } });
  await screen.findByText('Book A');
  await act(async () => { resolveOld({ code: 200, data: page([{ ...tx, publicationTitle: 'Stale book' }]) }); });
  expect(screen.queryByText('Stale book')).not.toBeInTheDocument();
});

test('note deletion is offered only for the authenticated librarians own note', async () => {
  jest.mocked(transactions.getNotes).mockResolvedValue({ code: 200, data: [
    { noteId: 'own', note: 'My note', librarianName: 'Me', editableByCurrentUser: true },
    { noteId: 'other', note: 'Another librarian note', librarianName: 'Other', editableByCurrentUser: false },
  ] } as any);
  open('/librarianpage/transactions?transactionId=1');
  const drawer = await screen.findByRole('dialog', { name: /Chi tiết giao dịch/ });
  await within(drawer).findByText('Another librarian note');
  const buttons = within(drawer).getAllByRole('button', { name: 'Xóa' });
  expect(buttons).toHaveLength(1);
  fireEvent.click(buttons[0]);
  await waitFor(() => expect(transactions.deleteNote).toHaveBeenCalledWith('1', 'own'));
});

test('finishing a barcode request after leaving lifecycle cannot change the active view', async () => {
  let resolveScan: (value: any) => void = () => {};
  jest.mocked(inquiry.barcode).mockImplementationOnce(() => new Promise(resolve => { resolveScan = resolve; }));
  open('/librarianpage/transactions?tab=lifecycle&barcode=BC5');
  fireEvent.click(screen.getByRole('button', { name: 'Tra cứu' }));
  fireEvent.click(screen.getByRole('button', { name: 'Tra cứu bạn đọc' }));
  await act(async () => { resolveScan(copy); });
  const params = new URLSearchParams(screen.getByTestId('url').textContent || '');
  expect(params.get('tab')).toBe('reader'); expect(params.get('itemId')).toBeNull();
});

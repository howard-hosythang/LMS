import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
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
function Location() {
  const location = useLocation(); const navigate = useNavigate();
  return <><output data-testid="url">{location.search}</output><button onClick={() => navigate(-1)}>Test Back</button><button onClick={() => navigate(1)}>Test Forward</button></>;
}
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
  await act(async () => {});
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
  expect(within(drawer).getByRole('link', { name: /Mở chi tiết đầu sách/ })).toHaveAttribute('href', '#/librarianpage/books/22');
  expect(screen.getByRole('link', { name: /Bản sao/ })).toHaveAttribute('href', '#/librarianpage/copies/5');
  fireEvent.keyDown(drawer, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test.each(['transaction', 'book'].flatMap(kind => ['button', 'backdrop', 'Escape'].map(close => [kind, close])))('%s drawer closes via %s without navigation, refetch or scroll changes', async (kind, close) => {
  const result = render(<MemoryRouter initialEntries={['/librarianpage/transactions?page=2&source=dashboard']}>
    <div data-route-scroll-container data-testid="content"><TransactionList /></div><Location />
  </MemoryRouter>);
  const trigger = await screen.findByRole('button', { name: kind === 'transaction' ? 'Xem chi tiết' : 'Book A' });
  const content = screen.getByTestId('content');
  content.scrollTop = 800;
  const url = screen.getByTestId('url').textContent;
  trigger.focus();
  const focus = jest.spyOn(trigger, 'focus');
  fireEvent.click(trigger);
  const drawer = await screen.findByRole('dialog');
  await within(drawer).findByText(kind === 'transaction' ? /Collector A/ : 'Author A');
  expect(screen.getByTestId('url').textContent).toBe(url);
  expect(content.scrollTop).toBe(800);
  if (close === 'button') fireEvent.click(within(drawer).getByRole('button', { name: 'Đóng' }));
  else if (close === 'backdrop') fireEvent.mouseDown(drawer.parentElement!);
  else fireEvent.keyDown(drawer, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByTestId('url').textContent).toBe(url);
  expect(screen.getByTestId('content')).toBe(content);
  expect(content.scrollTop).toBe(800);
  expect(trigger).toHaveFocus();
  expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  expect(transactions.getAllTransactions).toHaveBeenCalledTimes(1);
  focus.mockRestore(); result.unmount();
});

test('quick view deep link initializes local branch and page, and closing does not change URL', async () => {
  open('/librarianpage/transactions?quickPubId=22&quickItemId=5&quickBranch=CS2&quickPage=2&transactionId=1');
  const drawer = await screen.findByRole('dialog', { name: 'Xem nhanh ấn phẩm' });
  await within(drawer).findByText('Author A');
  expect(inquiry.publication).toHaveBeenCalledWith('22', 'CS2', 2);
  const url = screen.getByTestId('url').textContent;
  fireEvent.click(within(drawer).getByRole('button', { name: 'Đóng' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByTestId('url').textContent).toBe(url);
  fireEvent.change(screen.getByLabelText('Trạng thái mượn trả'), { target: { value: 'BORROWING' } });
  await act(async () => {});
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
  fireEvent.keyDown(screen.getByLabelText('Tra cứu MSSV hoặc họ tên'), { key: 'Enter' });
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

test.each([
  ['transactions', 'Tìm kiếm giao dịch', 'keyword', 'page'],
  ['reader', 'Tra cứu MSSV hoặc họ tên', 'readerKeyword', 'activePage'],
  ['lifecycle', 'Tìm theo tên sách', 'bookKeyword', 'itemPage'],
])('%s input %s keeps focus and only commits on Enter', async (tab, label, key, pageKey) => {
  jest.useFakeTimers();
  try {
    open(`/librarianpage/transactions?tab=${tab}&${pageKey}=2`);
    await act(async () => {});
    const input = screen.getByLabelText(label);
    input.focus();
    const callsBefore = [transactions.getAllTransactions, inquiry.readers, inquiry.publications].map(mock => jest.mocked(mock).mock.calls.length);
    for (const value of ['B', 'Bo', 'Book']) {
      fireEvent.change(input, { target: { value } });
      await act(async () => { jest.advanceTimersByTime(100); });
      expect(input).toHaveFocus();
      expect(screen.getByLabelText(label)).toBe(input);
      expect(new URLSearchParams(screen.getByTestId('url').textContent || '').get(key)).toBeNull();
    }
    expect([transactions.getAllTransactions, inquiry.readers, inquiry.publications].map(mock => jest.mocked(mock).mock.calls.length)).toEqual(callsBefore);
    await act(async () => { jest.advanceTimersByTime(2000); });
    expect(new URLSearchParams(screen.getByTestId('url').textContent || '').get(key)).toBeNull();
    expect([transactions.getAllTransactions, inquiry.readers, inquiry.publications].map(mock => jest.mocked(mock).mock.calls.length)).toEqual(callsBefore);
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(new URLSearchParams(screen.getByTestId('url').textContent || '').get(key)).toBeNull();
    fireEvent.keyDown(input, { key: 'Enter' });
    await act(async () => {});
    const params = new URLSearchParams(screen.getByTestId('url').textContent || '');
    expect(params.get(key)).toBe('Book'); expect(params.get(pageKey)).toBe('0');
    expect(input).toHaveFocus(); expect(input).toHaveValue('Book');
    if (key === 'keyword') expect(transactions.getAllTransactions).toHaveBeenCalledTimes(callsBefore[0] + 1);
    if (key === 'readerKeyword') expect(inquiry.readers).toHaveBeenCalledTimes(1);
    if (key === 'bookKeyword') expect(inquiry.publications).toHaveBeenCalledTimes(1);
  } finally { jest.useRealTimers(); }
});

test.each(['', '&keyword=Old'])('clearing filters cancels pending input even with initial keyword %s', async keyword => {
  jest.useFakeTimers();
  try {
    open(`/librarianpage/transactions?tab=transactions${keyword}`);
    await act(async () => {});
    const input = screen.getByLabelText('Tìm kiếm giao dịch');
    fireEvent.change(input, { target: { value: 'Pending' } });
    fireEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }));
    expect(input).toHaveValue('');
    await act(async () => { jest.advanceTimersByTime(500); });
    expect(new URLSearchParams(screen.getByTestId('url').textContent || '').get('keyword')).toBeNull();
    expect(input).toHaveValue('');
  } finally { jest.useRealTimers(); }
});

test.each([
  ['transactions', 'Tìm kiếm giao dịch', 'keyword'],
  ['reader', 'Tra cứu MSSV hoặc họ tên', 'readerKeyword'],
  ['lifecycle', 'Tìm theo tên sách', 'bookKeyword'],
  ['lifecycle', 'Quét hoặc nhập barcode', 'barcode'],
])('Back/Forward restores %s input %s and cancels pending drafts', async (tab, label, key) => {
  jest.useFakeTimers();
  try {
    render(<MemoryRouter initialEntries={[
      `/librarianpage/transactions?tab=${tab}&${key}=Old`,
      `/librarianpage/transactions?tab=${tab}&${key}=Current`,
    ]}><TransactionList /><Location /></MemoryRouter>);
    await act(async () => {});
    const input = screen.getByLabelText(label);
    expect(input).toHaveValue('Current');
    fireEvent.change(input, { target: { value: 'Pending' } });
    fireEvent.click(screen.getByRole('button', { name: 'Test Back' }));
    expect(input).toHaveValue('Old');
    await act(async () => { jest.advanceTimersByTime(500); });
    expect(new URLSearchParams(screen.getByTestId('url').textContent || '').get(key)).toBe('Old');
    fireEvent.click(screen.getByRole('button', { name: 'Test Forward' }));
    expect(input).toHaveValue('Current');
    await act(async () => {});
  } finally { jest.useRealTimers(); }
});

test('barcode typing does not call API; submitting uses the local input', async () => {
  jest.useFakeTimers();
  try {
    open('/librarianpage/transactions?tab=lifecycle');
    const input = screen.getByLabelText('Quét hoặc nhập barcode');
    input.focus();
    fireEvent.change(input, { target: { value: 'BC5' } });
    await act(async () => { jest.advanceTimersByTime(2000); });
    expect(input).toHaveFocus();
    expect(inquiry.barcode).not.toHaveBeenCalled();
    expect(new URLSearchParams(screen.getByTestId('url').textContent || '').get('barcode')).toBeNull();
    fireEvent.submit(input.closest('form')!);
    await act(async () => {});
    expect(screen.getByText('Xác nhận cất kệ')).toBeInTheDocument();
    expect(inquiry.barcode).toHaveBeenCalledWith('BC5');
    expect(input).toHaveValue('BC5');
    expect(new URLSearchParams(screen.getByTestId('url').textContent || '').get('barcode')).toBe('BC5');
  } finally { jest.useRealTimers(); }
});

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import ReshelvingTab from '../../components/librarian_pages/ReshelvingTab';
import reshelvingService, { ReshelvingItem } from '../../api/reshelvingService';
import { printReshelving } from '../../utils/reshelvingPrint';

const mockConfirm = jest.fn();
jest.mock('../../contexts/AppDialogContext', () => ({ useAppDialog: () => ({ confirm: mockConfirm }) }));
jest.mock('../../contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'vi' }) }));
jest.mock('../../api/reshelvingService', () => ({
  __esModule: true, RESHELVING_CHANGED: 'lms:reshelving-changed',
  default: { getDefaultBranch: jest.fn().mockResolvedValue({ data: { branch: 'Cơ sở 1 - Lý Thường Kiệt' } }), getWaiting: jest.fn(), confirm: jest.fn() },
}));
jest.mock('../../utils/reshelvingPrint', () => ({ printReshelving: jest.fn() }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }));

const items: ReshelvingItem[] = [
  { taskId: '1', source: 'RETURN', barcode: 'BC1', publicationTitle: 'Book A', location: 'A1', branch: 'CS1', queuedAt: '2026-10-03T08:00:00Z', studentId: '2213214', fullName: 'Reader' },
  { taskId: '2', source: 'PICKUP_EXPIRED', barcode: 'BC2', publicationTitle: 'Book B', location: 'A2', branch: 'CS1', queuedAt: '2026-10-03T08:01:00Z', studentId: '2213215', fullName: 'Reader B' },
];
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(reshelvingService.getDefaultBranch).mockResolvedValue({ code: 200, data: { branch: 'Cơ sở 1 - Lý Thường Kiệt' } });
  mockConfirm.mockResolvedValue(true);
  jest.mocked(reshelvingService.getWaiting).mockResolvedValue({ code: 200, data: items });
  jest.mocked(printReshelving).mockReturnValue(true);
});

test('all-branches view cannot confirm and changing branch reloads only that branch', async () => {
  render(<ReshelvingTab onCount={jest.fn()} />);
  await screen.findByText('Book A');
  expect(reshelvingService.getWaiting).toHaveBeenCalledWith('Cơ sở 1 - Lý Thường Kiệt');
  fireEvent.change(screen.getByRole('combobox', { name: 'Cơ sở' }), { target: { value: 'ALL' } });
  await waitFor(() => expect(reshelvingService.getWaiting).toHaveBeenCalledWith('ALL'));
  expect(screen.getByRole('button', { name: 'Xác nhận đã cất (2)' })).toBeDisabled();
  jest.mocked(reshelvingService.getWaiting).mockResolvedValue({ code: 200, data: [items[1]] });
  fireEvent.change(screen.getByRole('combobox', { name: 'Cơ sở' }), { target: { value: 'Cơ sở 2 - Dĩ An' } });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Xác nhận đã cất (1)' })).toBeEnabled());
  expect(reshelvingService.getWaiting).toHaveBeenLastCalledWith('Cơ sở 2 - Dĩ An');
});

test('defaults to all selected, prints only selected rows and confirms only their IDs', async () => {
  const count = jest.fn();
  jest.mocked(reshelvingService.getWaiting).mockResolvedValueOnce({ code: 200, data: items })
    .mockResolvedValueOnce({ code: 200, data: [items[1]] });
  jest.mocked(reshelvingService.confirm).mockResolvedValue({ code: 200, data: { updatedCount: 1, skippedCount: 0 } });
  render(<ReshelvingTab onCount={count} />);
  await screen.findByText('Book A');
  expect(screen.getByRole('checkbox', { name: 'Chọn tất cả' })).toBeChecked();
  expect(screen.getByText('A1')).toHaveClass('text-blue-700');
  expect(screen.getByText('Hết hạn nhận sách mượn')).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Thời điểm vào hàng chờ' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn BC2' }));
  fireEvent.click(screen.getByRole('button', { name: 'In phiếu A4' }));
  expect(printReshelving).toHaveBeenCalledWith([items[0]], 'vi');
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận đã cất (1)' }));
  await waitFor(() => expect(screen.queryByText('Book A')).not.toBeInTheDocument());
  expect(reshelvingService.confirm).toHaveBeenCalledWith(['1'], 'Cơ sở 1 - Lý Thường Kiệt');
  expect(screen.getByText('Book B')).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: 'Chọn BC2' })).not.toBeChecked();
  expect(count).toHaveBeenLastCalledWith(1);
});

test('canceled confirmation leaves the queue untouched', async () => {
  mockConfirm.mockResolvedValue(false);
  render(<ReshelvingTab onCount={jest.fn()} />);
  await screen.findByText('Book A');
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận đã cất (2)' }));
  await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
  expect(reshelvingService.confirm).not.toHaveBeenCalled();
});

test('stale selections show skipped information and refresh the empty queue', async () => {
  jest.mocked(reshelvingService.getWaiting).mockResolvedValueOnce({ code: 200, data: items })
    .mockResolvedValueOnce({ code: 200, data: [] });
  jest.mocked(reshelvingService.confirm).mockResolvedValue({ code: 200, data: { updatedCount: 0, skippedCount: 2 } });
  render(<ReshelvingTab onCount={jest.fn()} />);
  await screen.findByText('Book A');
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận đã cất (2)' }));
  await screen.findByText('Không có sách đang chờ cất kệ.');
  expect(toast.info).toHaveBeenCalled();
});

test('empty queues cannot be printed or confirmed', async () => {
  jest.mocked(reshelvingService.getWaiting).mockResolvedValue({ code: 200, data: [] });
  render(<ReshelvingTab onCount={jest.fn()} />);
  await screen.findByText('Không có sách đang chờ cất kệ.');
  expect(screen.getByRole('button', { name: 'In phiếu A4' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Xác nhận đã cất (0)' })).toBeDisabled();
});

test('queue fetch failures are visible rather than presenting a successful empty queue', async () => {
  jest.mocked(reshelvingService.getWaiting).mockRejectedValue({ message: 'Không kết nối được máy chủ' });
  render(<ReshelvingTab onCount={jest.fn()} />);
  await screen.findByRole('alert');
  expect(screen.queryByText('Không có sách đang chờ cất kệ.')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Xác nhận đã cất (0)' })).toBeDisabled();
});

test('focus refresh preserves deselection, selects arrivals and does not confirm arrivals during a dialog', async () => {
  const arrival = { ...items[0], taskId: '3', barcode: 'BC3', publicationTitle: 'New arrival' };
  let approve!: (value: boolean) => void;
  mockConfirm.mockImplementationOnce(() => new Promise<boolean>(resolve => { approve = resolve; }));
  jest.mocked(reshelvingService.getWaiting).mockResolvedValueOnce({ code: 200, data: items })
    .mockResolvedValueOnce({ code: 200, data: [...items, arrival] })
    .mockResolvedValueOnce({ code: 200, data: [items[1], arrival] });
  jest.mocked(reshelvingService.confirm).mockResolvedValue({ code: 200, data: { updatedCount: 1, skippedCount: 0 } });
  render(<ReshelvingTab onCount={jest.fn()} />);
  await screen.findByText('Book A');
  fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn BC2' }));
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận đã cất (1)' }));
  fireEvent.focus(window);
  await screen.findByText('New arrival');
  expect(screen.getByRole('checkbox', { name: 'Chọn BC2' })).not.toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Chọn BC3' })).toBeChecked();
  await act(async () => { approve(true); });
  expect(reshelvingService.confirm).toHaveBeenCalledWith(['1'], 'Cơ sở 1 - Lý Thường Kiệt');
  expect(screen.getByText('New arrival')).toBeInTheDocument();
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import transactionsService, { StudentActiveTransactionsResponse } from '../../api/transactionsService';
import { ReturnTab } from '../../pages/librarian_pages/Circulation';
import { CirculationPolicy } from '../../api/adminService';

const mockConfirm = jest.fn();
jest.mock('../../contexts/AppDialogContext', () => ({ useAppDialog: () => ({ confirm: mockConfirm }) }));
jest.mock('../../contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'vi' }) }));
jest.mock('../../api/axiosInstance', () => ({ __esModule: true, default: {} }));
jest.mock('../../api/transactionsService', () => ({
  __esModule: true, default: { getStudentActive: jest.fn(), renew: jest.fn() },
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const policy: CirculationPolicy = {
  pickupDeadlineHours: 48, defaultLoanDays: 14, maxActiveBorrows: 5, maxActiveReservations: 2,
  maxRenewals: 2, renewalWindowDays: 3, overdueFinePerDay: 1000, defaultDepositAmount: 0,
  blockBorrowWhenUnpaidFines: true, updatedAt: null, updatedByAdminId: null, updatedByAdminName: null,
};
const eligible: StudentActiveTransactionsResponse['data']['items'][0] = {
  transactionId: '1', publicationTitle: 'Clean Code', barcode: 'BC1', branch: 'CS1', location: 'A1',
  borrowedDate: '2026-10-01', dueDate: '2026-10-05', status: 'BORROWING',
  renewalCount: 0, maxRenewals: 2, canRenew: true, cannotRenewReason: null,
  depositAmount: 0, depositStatus: 'NOT_REQUIRED',
};
const response = (items = [eligible]): StudentActiveTransactionsResponse => ({
  code: 200, message: 'ok', data: { studentId: '2213214', fullName: 'Reader', items },
});

beforeEach(() => {
  jest.clearAllMocks();
  mockConfirm.mockResolvedValue(true);
});

async function search() {
  render(<ReturnTab policy={policy} />);
  fireEvent.change(screen.getByPlaceholderText('Nhập MSSV rồi nhấn Enter...'), { target: { value: '2213214' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }));
  await screen.findByText('Clean Code');
}

test('confirms renewal, displays the new due date and refreshes current loans', async () => {
  jest.mocked(transactionsService.getStudentActive)
    .mockResolvedValueOnce(response())
    .mockResolvedValueOnce(response([{ ...eligible, renewalCount: 1, dueDate: '2026-10-19', canRenew: false, cannotRenewReason: 'Chưa đến thời điểm gia hạn' }]));
  jest.mocked(transactionsService.renew).mockResolvedValue({ code: 200, data: { dueDate: '2026-10-19' } } as any);
  await search();
  expect(screen.getByRole('button', { name: 'Gia hạn' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Gia hạn' }));
  await screen.findByText('Chưa đến thời điểm gia hạn');
  expect(mockConfirm).toHaveBeenCalledWith(expect.objectContaining({ title: 'Xác nhận gia hạn sách' }));
  expect(transactionsService.renew).toHaveBeenCalledWith('1');
  expect(transactionsService.getStudentActive).toHaveBeenCalledTimes(2);
  expect(screen.getByText('Gia hạn: 1/2')).toBeInTheDocument();
  expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Hạn trả mới:'));
});

test('disables an ineligible loan and exposes its exact reason', async () => {
  jest.mocked(transactionsService.getStudentActive).mockResolvedValue(response([
    { ...eligible, canRenew: false, cannotRenewReason: 'Đã hết lượt gia hạn (2/2)', renewalCount: 2 },
  ]));
  await search();
  const button = screen.getByRole('button', { name: 'Gia hạn' });
  expect(button).toBeDisabled();
  expect(button).toHaveAccessibleDescription('Đã hết lượt gia hạn (2/2)');
  fireEvent.click(button);
  expect(transactionsService.renew).not.toHaveBeenCalled();
});

test('canceling confirmation does not call the renewal API', async () => {
  mockConfirm.mockResolvedValue(false);
  jest.mocked(transactionsService.getStudentActive).mockResolvedValue(response());
  await search();
  fireEvent.click(screen.getByRole('button', { name: 'Gia hạn' }));
  await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
  expect(transactionsService.renew).not.toHaveBeenCalled();
});

test('shows the API rejection and refreshes eligibility when fines changed', async () => {
  jest.mocked(transactionsService.getStudentActive)
    .mockResolvedValueOnce(response())
    .mockResolvedValueOnce(response([{ ...eligible, canRenew: false, cannotRenewReason: 'Độc giả còn tiền phạt chưa thanh toán' }]));
  jest.mocked(transactionsService.renew).mockRejectedValue({
    status: 409, message: 'Độc giả còn tiền phạt chưa thanh toán',
  });
  await search();
  fireEvent.click(screen.getByRole('button', { name: 'Gia hạn' }));
  await screen.findByText('Độc giả còn tiền phạt chưa thanh toán');
  expect(toast.error).toHaveBeenCalledWith('Độc giả còn tiền phạt chưa thanh toán');
  expect(screen.getByRole('button', { name: 'Gia hạn' })).toBeDisabled();
});

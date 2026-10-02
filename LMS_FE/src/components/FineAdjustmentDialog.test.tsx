import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import fineService, { Fine } from '../../api/fineService';
import FineAdjustmentDialog from '../../components/librarian_pages/FineAdjustmentDialog';

jest.mock('../../contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'vi' }) }));
jest.mock('../../api/fineService', () => ({ __esModule: true, default: { updateAmount: jest.fn() } }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const fine: Fine = {
  fineId: '1', transactionId: '2', publicationTitle: 'Clean Code', fineAmount: 1000000,
  type: 'LOST_BOOK', status: 'UNPAID', createdAt: '2026-10-01', paidDate: null,
};

beforeEach(() => jest.clearAllMocks());

test('submits raw currency and reason, refreshes the list and closes after success', async () => {
  jest.mocked(fineService.updateAmount).mockResolvedValue({ code: 200, message: 'ok', data: { fineId: '1', fineAmount: 100000 } });
  const onUpdated = jest.fn().mockResolvedValue(undefined);
  const onClose = jest.fn();
  render(<FineAdjustmentDialog fines={[fine]} onUpdated={onUpdated} onClose={onClose} />);
  const input = screen.getByLabelText('Số tiền mới (đ)');
  expect(input).toHaveValue('1.000.000');
  fireEvent.change(input, { target: { value: '100000' } });
  expect(input).toHaveValue('100.000');
  fireEvent.change(screen.getByLabelText('Lý do điều chỉnh (tùy chọn)'), { target: { value: 'Nhập nhầm' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(fineService.updateAmount).toHaveBeenCalledWith('1', 100000, 'Nhập nhầm');
  expect(onUpdated).toHaveBeenCalledTimes(1);
  expect(toast.success).toHaveBeenCalled();
});

test('disallows amounts above the cap and preserves the dialog on a paid-fine conflict', async () => {
  jest.mocked(fineService.updateAmount).mockRejectedValue({ response: { status: 409, data: { message: 'Khoản phí phạt này đã được thanh toán' } } });
  const onUpdated = jest.fn();
  const onClose = jest.fn();
  render(<FineAdjustmentDialog fines={[fine]} onUpdated={onUpdated} onClose={onClose} />);
  fireEvent.change(screen.getByLabelText('Số tiền mới (đ)'), { target: { value: '10000001' } });
  expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Số tiền mới (đ)'), { target: { value: '100000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
  await waitFor(() => expect(toast.error).toHaveBeenCalled());
  expect(onUpdated).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});

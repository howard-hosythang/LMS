import axios from '../../api/axiosInstance';
import transactions from '../../api/transactionsService';
import { confirmReservationPickup } from '../../api/reservationService';

jest.mock('../../api/axiosInstance', () => ({ __esModule: true, default: { post: jest.fn() } }));
jest.mock('../../api/reshelvingService', () => ({ notifyReshelvingChanged: jest.fn() }));
beforeEach(() => { jest.clearAllMocks(); jest.mocked(axios.post).mockResolvedValue({ code: 200, data: { depositPaymentMethod: 'BANK_TRANSFER' } }); });
test.each(['CASH', 'BANK_TRANSFER'] as const)('direct borrow payload includes %s', async paymentMethod => {
  await transactions.borrowDirect({ studentId: '1', barcode: 'BC', paymentMethod });
  expect(axios.post).toHaveBeenCalledWith('/transactions/borrow-direct', { studentId: '1', barcode: 'BC', paymentMethod });
});
test('legacy direct borrow defaults to CASH', async () => {
  await transactions.borrowDirect({ studentId: '1', barcode: 'BC' });
  expect(axios.post).toHaveBeenCalledWith('/transactions/borrow-direct', expect.objectContaining({ paymentMethod: 'CASH' }));
});
test.each(['CASH', 'BANK_TRANSFER'] as const)('both pickup APIs pass %s as a query parameter', async method => {
  await transactions.confirmPickup('1', method);
  const result = await confirmReservationPickup('2', method);
  expect(axios.post).toHaveBeenCalledWith('/transactions/1/confirm-pickup', undefined, { params: { paymentMethod: method } });
  expect(axios.post).toHaveBeenCalledWith('/reservations/2/confirm-pickup', undefined, { params: { paymentMethod: method } });
  expect(result.depositPaymentMethod).toBe('BANK_TRANSFER');
});
test('legacy pickup calls default to CASH', async () => {
  await transactions.confirmPickup('1'); await confirmReservationPickup('2');
  expect(axios.post).toHaveBeenCalledWith('/transactions/1/confirm-pickup', undefined, { params: { paymentMethod: 'CASH' } });
  expect(axios.post).toHaveBeenCalledWith('/reservations/2/confirm-pickup', undefined, { params: { paymentMethod: 'CASH' } });
});

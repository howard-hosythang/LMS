import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Circulation from '../../pages/librarian_pages/Circulation';
import transactions from '../../api/transactionsService';
import { confirmReservationPickup, lookupReservation } from '../../api/reservationService';
import policyService from '../../api/circulationPolicyService';

jest.mock('../../contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'vi' }) }));
jest.mock('../../api/axiosInstance', () => ({ __esModule: true, default: {} }));
jest.mock('../../api/transactionsService', () => ({ __esModule: true, default: { borrowDirect: jest.fn(), lookup: jest.fn(), confirmPickup: jest.fn() } }));
jest.mock('../../api/reservationService', () => ({ confirmReservationPickup: jest.fn(), lookupReservation: jest.fn() }));
jest.mock('../../api/circulationPolicyService', () => ({ __esModule: true, default: { getPolicy: jest.fn() } }));
jest.mock('../../api/reshelvingService', () => ({ __esModule: true, RESHELVING_CHANGED: 'test-reshelving', default: { getDefaultBranch: jest.fn().mockResolvedValue({ data: { branch: 'ALL' } }), getCount: jest.fn().mockResolvedValue({ data: { count: 0 } }) } }));

const data = { transactionId: '10', reservationId: '20', dueDate: '2026-10-20', fullName: 'Reader', publicationTitle: 'Book', depositAmount: 50000, depositStatus: 'COLLECTED', barcode: 'BC1', depositPaymentMethod: 'BANK_TRANSFER' };
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(policyService.getPolicy).mockResolvedValue({ code: 200, data: { defaultDepositAmount: 50000, defaultLoanDays: 14, maxActiveBorrows: 5 } } as any);
  jest.mocked(transactions.borrowDirect).mockResolvedValue({ code: 201, data } as any);
  jest.mocked(transactions.lookup).mockResolvedValue({ code: 200, data } as any);
  jest.mocked(transactions.confirmPickup).mockResolvedValue({ code: 200, data } as any);
  jest.mocked(lookupReservation).mockResolvedValue({ code: 200, data });
  jest.mocked(confirmReservationPickup).mockResolvedValue(data as any);
});
function open(tab: string) { render(<MemoryRouter initialEntries={[`/librarianpage/circulation?tab=${tab}`]}><Circulation /></MemoryRouter>); }

test('direct borrow defaults to cash, sends transfer and resets for next reader', async () => {
  open('direct');
  expect(await screen.findByRole('radio', { name: 'Tiền mặt' })).toBeChecked();
  fireEvent.click(screen.getByRole('radio', { name: 'Chuyển khoản / QR' }));
  fireEvent.change(screen.getByPlaceholderText('Nhập MSSV...'), { target: { value: '00123' } });
  fireEvent.change(screen.getByPlaceholderText('Quét hoặc nhập barcode...'), { target: { value: 'BC1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cho mượn ngay' }));
  await waitFor(() => expect(transactions.borrowDirect).toHaveBeenCalledWith({ studentId: '00123', barcode: 'BC1', paymentMethod: 'BANK_TRANSFER' }));
  expect(await screen.findByText(/50\.000đ \(Chuyển khoản\)/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Giao dịch tiếp theo' }));
  expect(screen.getByRole('radio', { name: 'Tiền mặt' })).toBeChecked();
});

test.each(['direct', 'reservation'])('pickup %s sends selected method and shows receipt', async type => {
  open('pickup');
  await screen.findByPlaceholderText('Quét QR hoặc nhập mã giao dịch...');
  if (type === 'reservation') fireEvent.click(screen.getByRole('button', { name: 'Từ đặt trước' }));
  fireEvent.change(screen.getByPlaceholderText(type === 'direct' ? 'Quét QR hoặc nhập mã giao dịch...' : 'Quét QR hoặc nhập mã đặt trước...'), { target: { value: type === 'direct' ? '10' : '20' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tra cứu' }));
  expect(await screen.findByRole('radio', { name: 'Tiền mặt' })).toBeChecked();
  fireEvent.click(screen.getByRole('radio', { name: 'Chuyển khoản / QR' }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Xác nhận giao sách' })[1]);
  expect(await screen.findByText(/50\.000đ \(Chuyển khoản\)/)).toBeInTheDocument();
  if (type === 'direct') expect(transactions.confirmPickup).toHaveBeenCalledWith('10', 'BANK_TRANSFER');
  else expect(confirmReservationPickup).toHaveBeenCalledWith('20', 'BANK_TRANSFER');
});

test('no deposit hides payment choice and sends CASH for backward compatibility', async () => {
  jest.mocked(policyService.getPolicy).mockResolvedValue({ code: 200, data: { defaultDepositAmount: 0 } } as any);
  open('direct');
  await screen.findByRole('button', { name: 'Cho mượn ngay' });
  expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('Nhập MSSV...'), { target: { value: '00123' } });
  fireEvent.change(screen.getByPlaceholderText('Quét hoặc nhập barcode...'), { target: { value: 'BC1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cho mượn ngay' }));
  await waitFor(() => expect(transactions.borrowDirect).toHaveBeenCalledWith(expect.objectContaining({ paymentMethod: 'CASH' })));
});

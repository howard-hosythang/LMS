import { act, fireEvent, render, screen } from '@testing-library/react';
import Payment, { useDepositPayOs } from '../../components/librarian_pages/DepositPayOsPayment';
import payments, { DepositPaymentRequest } from '../../api/depositPaymentService';

jest.mock('../../contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'vi' }) }));
jest.mock('../../api/depositPaymentService', () => ({ __esModule: true, default: { create: jest.fn(), sync: jest.fn(), cancel: jest.fn() } }));
jest.mock('sonner', () => ({ toast: { success: jest.fn() } }));

const order = { orderCode: 2000000000000000, status: 'PENDING', amount: 50000, description: 'COC000000', paymentLinkId: 'link', checkoutUrl: 'https://pay.payos.vn/link', qrCode: 'qr-code', studentId: '00123', fullName: 'Reader', barcode: 'BC1', publicationTitle: 'Book' };
const response = (status = 'PENDING') => ({ code: 200, data: { ...order, status }, message: '' }) as any;
function Harness({ student = '00123' }: { student?: string }) {
  const request: DepositPaymentRequest = { flow: 'DIRECT', studentId: student, barcode: 'BC1' };
  const state = useDepositPayOs(request);
  return <><Payment payment={state} /><button disabled={!state.paid}>Handover</button></>;
}
beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks();
  jest.mocked(payments.create).mockResolvedValue(response());
  jest.mocked(payments.sync).mockResolvedValue(response());
});
afterEach(() => { jest.useRealTimers(); });
async function create() { await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Tạo QR thu cọc' })); }); }

test('shows QR and polls every four seconds, then stops after payment', async () => {
  jest.mocked(payments.sync).mockResolvedValueOnce(response()).mockResolvedValueOnce(response('PAID'));
  render(<Harness />); await create();
  expect(screen.getByRole('img', { name: 'Mã QR payOS thu cọc' })).toBeInTheDocument();
  expect(screen.getByText('COC000000')).toBeInTheDocument();
  expect(screen.getByText('50.000đ')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Handover' })).toBeDisabled();
  expect(payments.sync).toHaveBeenCalledTimes(1);
  await act(async () => { jest.advanceTimersByTime(3999); });
  expect(payments.sync).toHaveBeenCalledTimes(1);
  await act(async () => { jest.advanceTimersByTime(1); });
  expect(screen.getByRole('button', { name: 'Handover' })).toBeEnabled();
  await act(async () => { jest.advanceTimersByTime(12000); });
  expect(payments.sync).toHaveBeenCalledTimes(2);
});

test('does not overlap slow polling requests', async () => {
  let resolve!: (value: any) => void;
  jest.mocked(payments.sync).mockImplementationOnce(() => new Promise(r => { resolve = r; }));
  render(<Harness />); await create();
  await act(async () => { jest.advanceTimersByTime(12000); });
  expect(payments.sync).toHaveBeenCalledTimes(1);
  await act(async () => { resolve(response()); });
  await act(async () => { jest.advanceTimersByTime(4000); });
  expect(payments.sync).toHaveBeenCalledTimes(2);
});

test('stale paid response cannot unlock a different reader', async () => {
  let resolve!: (value: any) => void;
  jest.mocked(payments.sync).mockImplementationOnce(() => new Promise(r => { resolve = r; }));
  const view = render(<Harness />); await create();
  view.rerender(<Harness student="00999" />);
  await act(async () => { resolve(response('PAID')); });
  expect(screen.getByRole('button', { name: 'Handover' })).toBeDisabled();
  expect(screen.queryByText(/Đã nhận tiền cọc/)).not.toBeInTheDocument();
});

test('polling errors are visible and never unlock handover; retries can recover', async () => {
  jest.mocked(payments.sync).mockRejectedValueOnce(new Error('Mất kết nối payOS')).mockResolvedValueOnce(response('PAID'));
  render(<Harness />); await create();
  expect(screen.getByRole('alert')).toHaveTextContent('Mất kết nối payOS');
  expect(screen.getByRole('button', { name: 'Handover' })).toBeDisabled();
  await act(async () => { jest.advanceTimersByTime(4000); });
  expect(screen.getByRole('button', { name: 'Handover' })).toBeEnabled();
});

test('cancellation waits for backend confirmation and allows a fresh QR only afterwards', async () => {
  jest.mocked(payments.cancel).mockResolvedValue(response('CANCELLED'));
  render(<Harness />); await create();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Hủy đơn chưa nhận tiền' })); });
  expect(payments.cancel).toHaveBeenCalledWith(order.orderCode);
  expect(screen.getByRole('button', { name: 'Tạo QR thu cọc' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Handover' })).toBeDisabled();
});

test('unmount stops polling', async () => {
  const view = render(<Harness />); await create(); view.unmount();
  await act(async () => { jest.advanceTimersByTime(12000); });
  expect(payments.sync).toHaveBeenCalledTimes(1);
});

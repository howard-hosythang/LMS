import axiosInstance from './axiosInstance';

export type DepositPaymentRequest = { flow: 'DIRECT'; studentId: string; barcode: string } | { flow: 'TRANSACTION' | 'RESERVATION'; sourceId: string };
export interface DepositPaymentOrder {
  orderCode: number;
  status: 'CREATING' | 'PENDING' | 'PAID' | 'CONSUMED' | 'CANCELLED' | 'EXPIRED';
  amount: number;
  description: string;
  paymentLinkId: string | null;
  checkoutUrl: string | null;
  qrCode: string | null;
  studentId: string;
  fullName: string;
  barcode: string;
  publicationTitle: string;
}
type Response = { code: number; data: DepositPaymentOrder; message: string };
const depositPaymentService = {
  create: (request: DepositPaymentRequest): Promise<Response> => axiosInstance.post('/deposits/payments/payos', request) as any,
  sync: (code: number): Promise<Response> => axiosInstance.post(`/deposits/payments/payos/${code}/sync`) as any,
  cancel: (code: number): Promise<Response> => axiosInstance.post(`/deposits/payments/payos/${code}/cancel`) as any,
};
export default depositPaymentService;

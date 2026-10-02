import axiosInstance from './axiosInstance';

export type FineType = 'OVERDUE_RETURN' | 'DAMAGED_BOOK' | 'LOST_BOOK';
export type FineStatus = 'UNPAID' | 'PAID';

export interface Fine {
  fineId: string;
  transactionId: string;
  publicationTitle: string;
  fineAmount: number;
  type: FineType;
  status: FineStatus;
  createdAt: string;
  paidDate: string | null;
}

export interface StudentFinesResponse {
  code: number;
  message: string;
  data: {
    studentId: string;
    fullName: string;
    totalUnpaidAmount: number;
    fines: Fine[];
  };
}

export interface MyFinesResponse {
  code: number;
  message: string;
  data: {
    content: Fine[];
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    isFirst: boolean;
    isLast: boolean;
  };
}

export interface FinePaymentLinkResponse {
  orderCode: number;
  paymentLinkId: string;
  checkoutUrl: string;
  qrCode: string;
  description: string;
  amount: number;
  fineCount: number;
  studentId: string;
  fullName: string;
}

const fineService = {
  updateAmount: async (fineId: string, fineAmount: number, reason?: string): Promise<{ code: number; message: string; data: { fineId: string; fineAmount: number } }> => {
    return axiosInstance.put(`/fines/${fineId}/amount`, { fineAmount, reason }) as any;
  },
  getStudentFines: async (studentId: string): Promise<StudentFinesResponse> => {
    const response = await axiosInstance.get('/fines/student', { params: { studentId } });
    return response as any;
  },
  payFine: async (fineId: string): Promise<{ code: number; message: string; data: Fine }> => {
    const response = await axiosInstance.put(`/fines/${fineId}/pay`);
    return response as any;
  },
  payAllFines: async (studentId: string): Promise<{ code: number; message: string; data: { paidCount: number } }> => {
    const response = await axiosInstance.put('/fines/pay-all', null, { params: { studentId } });
    return response as any;
  },
  payAllFinesByCash: async (studentId: string): Promise<{ code: number; message: string; data: { paidCount: number } }> => {
    const response = await axiosInstance.post('/fines/payments/cash', null, { params: { studentId } });
    return response as any;
  },
  createPayOsFinePayment: async (studentId: string): Promise<{ code: number; message: string; data: FinePaymentLinkResponse }> => {
    const response = await axiosInstance.post('/fines/payments/payos', null, { params: { studentId } });
    return response as any;
  },
  syncPayOsFinePayment: async (orderCode: number): Promise<{ code: number; message: string; data: { paidCount: number } }> => {
    const response = await axiosInstance.post(`/fines/payments/payos/${orderCode}/sync`);
    return response as any;
  },
  getMyFines: async (status?: FineStatus, page = 0, size = 10): Promise<MyFinesResponse> => {
    const response = await axiosInstance.get('/fines/my-fines', {
      params: { ...(status ? { status } : {}), page, size },
    });
    return response as any;
  },
};

export default fineService;

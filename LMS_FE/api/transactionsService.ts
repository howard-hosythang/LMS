import axiosInstance from './axiosInstance';

export interface BorrowRequest {
  itemId: string;
}

export interface BorrowResponse {
  code: number;
  message: string;
  data: {
    transactionId: string;
    itemId: string;
    barcode: string;
    publicationId: string;
    publicationTitle: string;
    branch: string;
    location: string;
    pickedUpDeadline: string;
    dueDate: string;
    status: string;
    depositAmount: number;
    depositStatus: string;
    renewalCount: number;
    maxRenewals: number;
  };
}

export interface LookupResponse {
  code: number;
  message: string;
  data: {
    transactionId: string;
    userId: string;
    studentId: string;
    fullName: string;
    itemId: string;
    barcode: string;
    publicationId: string;
    publicationTitle: string;
    branch: string;
    location: string;
    pickedUpDeadline: string;
    status: string;
    depositAmount: number;
    depositStatus: string;
  };
}

export interface UserTransaction {
  transactionId: string;
  publicationId: string;
  publicationTitle: string;
  coverImageUrl: string | null;
  barcode: string;
  branch: string;
  location: string;
  pickedUpDeadline: string;
  borrowedDate: string | null;
  dueDate: string;
  returnedDate: string | null;
  status: 'WAITING_FOR_PICKUP' | 'BORROWING' | 'OVERDUE' | 'RETURNED' | 'CANCELLED';
  fineAmount: number | null;
  grossFineAmount: number | null;
  depositAmount: number | null;
  depositStatus: string | null;
  depositAppliedAmount: number | null;
  depositRefundAmount: number | null;
  additionalAmountDue: number | null;
  reviewed?: boolean;
  renewalCount: number;
  maxRenewals: number;
  canRenew: boolean;
  cannotRenewReason: 'HAS_RESERVATIONS' | 'NOT_IN_WINDOW' | 'RENEWAL_LIMIT_REACHED' | 'OVERDUE' | 'UNPAID_FINES' | 'NOT_BORROWING' | null;
}

export interface MyTransactionsResponse {
  code: number;
  message: string;
  data: {
    content: UserTransaction[];
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    isFirst: boolean;
    isLast: boolean;
  };
}

export interface DirectBorrowRequest {
  studentId: string;
  barcode: string;
}

export interface DirectBorrowResponse {
  code: number;
  message: string;
  data: {
    transactionId: string;
    itemId: string;
    barcode: string;
    publicationId: string;
    publicationTitle: string;
    branch: string;
    location: string;
    dueDate: string;
    status: string;
    depositAmount: number;
    depositStatus: string;
  };
}

export interface ConfirmPickupResponse {
  code: number;
  message: string;
  data: {
    transactionId: string;
    dueDate: string;
    status: string;
    depositAmount: number;
    depositStatus: string;
  };
}

export interface StudentActiveTransactionsResponse {
  code: number;
  message: string;
  data: {
    studentId: string;
    fullName: string;
    items: {
      transactionId: string;
      publicationTitle: string;
      barcode: string;
      branch: string;
      location: string;
      borrowedDate: string;
      dueDate: string;
      status: 'BORROWING' | 'OVERDUE';
      depositAmount: number | null;
      depositStatus: string | null;
    }[];
  };
}

export interface ActiveTransactionResponse {
  code: number;
  message: string;
  data: {
    transactionId: string;
    userId: string;
    studentId: string;
    fullName: string;
    publicationTitle: string;
    barcode: string;
    branch: string;
    location: string;
    borrowedDate: string;
    dueDate: string;
    status: 'BORROWING' | 'OVERDUE';
    depositAmount: number | null;
    depositStatus: string | null;
  };
}

export interface ReturnResponse {
  code: number;
  message: string;
  data: {
    transactionId: string;
    publicationTitle: string;
    barcode: string;
    returnedDate: string;
    overdue: boolean;
    overdueFineAmount: number | null;
    depositAmount: number | null;
    depositStatus: string | null;
    grossFineAmount: number | null;
    depositAppliedAmount: number | null;
    depositRefundAmount: number | null;
    additionalAmountDue: number | null;
  };
}

export type TransactionStatus = 'WAITING_FOR_PICKUP' | 'BORROWING' | 'OVERDUE' | 'RETURNED' | 'CANCELLED';
export type FinePaymentStatus = 'UNPAID' | 'PAID';

export interface LibrarianTransaction {
  transactionId: string;
  userId: string;
  fullName: string;
  studentId: string;
  email: string | null;
  phoneNumber: string | null;
  barcode: string | null;
  fineAmount: number | null;
  grossFineAmount: number | null;
  finePaymentStatus: FinePaymentStatus | null;
  fineTypes: string | null;
  depositAmount: number | null;
  depositStatus: string | null;
  depositAppliedAmount: number | null;
  depositRefundAmount: number | null;
  additionalAmountDue: number | null;
  important: boolean;
  note: string | null;
  createdAt: string | null;
  borrowedDate: string | null;
  issueLibrarianName?: string | null;
  issueLibrarianCode?: string | null;
  dueDate: string | null;
  returnedDate: string | null;
  returnLibrarianName?: string | null;
  returnLibrarianCode?: string | null;
  finePaidByLibrarianName?: string | null;
  finePaidByLibrarianCode?: string | null;
  status: TransactionStatus;
}

export interface TransactionNote {
  noteId: string;
  transactionId: string;
  librarianId: string;
  librarianName: string | null;
  librarianCode: string | null;
  librarianAvatarUrl: string | null;
  important: boolean;
  note: string;
  createdAt: string | null;
  updatedAt: string | null;
  editableByCurrentUser: boolean;
}

export interface AllTransactionsResponse {
  code: number;
  message: string;
  data: {
    content: LibrarianTransaction[];
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    isFirst: boolean;
    isLast: boolean;
  };
}

export type IssueType = 'DAMAGED_BOOK' | 'LOST_BOOK';

export interface ReportIssueResponse {
  code: number;
  message: string;
  data: {
    transactionId: string;
    publicationTitle: string;
    itemStatus: string;
    finesCreated: {
      fineId: string;
      type: IssueType | 'OVERDUE_RETURN';
      amount: number;
    }[];
    depositAmount: number | null;
    depositStatus: string | null;
    grossFineAmount: number | null;
    depositAppliedAmount: number | null;
    depositRefundAmount: number | null;
    additionalAmountDue: number | null;
  };
}

export interface RestoreLostBookResponse {
  code: number;
  message: string;
  data: {
    recoveryId: string;
    transactionId: string;
    publicationTitle: string;
    barcode: string;
    itemStatus: 'AVAILABLE' | 'IN_MAINTENANCE' | string;
    reversedLostFineAmount: number;
    refundAmount: number;
    recoveryReason: string;
    note: string | null;
  };
}

export interface LostBookRecoveryPreviewResponse {
  code: number;
  message: string;
  data: {
    transactionId: string;
    itemId: string;
    publicationTitle: string;
    barcode: string;
    itemStatus: string;
    borrowerName: string;
    borrowerCode: string;
    lostFineAmount: number;
    depositAmount: number;
    depositAppliedAmount: number;
    additionalAmountDue: number;
    suggestedRefundAmount: number;
  };
}

const transactionsService = {
  borrow: async (data: BorrowRequest): Promise<BorrowResponse> => {
    const response = await axiosInstance.post('/transactions/borrow', data);
    return response as any;
  },
  lookup: async (params: { transactionId?: string; studentId?: string; barcode?: string }): Promise<LookupResponse> => {
    const response = await axiosInstance.get('/transactions/lookup', { params });
    return response as any;
  },
  confirmPickup: async (transactionId: string): Promise<ConfirmPickupResponse> => {
    const response = await axiosInstance.post(`/transactions/${transactionId}/confirm-pickup`);
    return response as any;
  },
  renew: async (transactionId: string | number): Promise<BorrowResponse> => {
    const response = await axiosInstance.post(`/transactions/${transactionId}/renew`);
    return response as any;
  },
  getMyTransactions: async (page: number = 0, size: number = 10): Promise<MyTransactionsResponse> => {
    const response = await axiosInstance.get('/transactions/my-transactions', { params: { page, size } });
    return response as any;
  },
  borrowDirect: async (data: DirectBorrowRequest): Promise<DirectBorrowResponse> => {
    const response = await axiosInstance.post('/transactions/borrow-direct', data);
    return response as any;
  },
  getStudentActive: async (studentId: string): Promise<StudentActiveTransactionsResponse> => {
    const response = await axiosInstance.get('/transactions/student-active', { params: { studentId } });
    return response as any;
  },
  lookupActive: async (barcode: string): Promise<ActiveTransactionResponse> => {
    const response = await axiosInstance.get('/transactions/active', { params: { barcode } });
    return response as any;
  },
  returnBook: async (barcode: string): Promise<ReturnResponse> => {
    const response = await axiosInstance.post('/transactions/return', { barcode });
    return response as any;
  },
  reportIssue: async (transactionId: string, type: IssueType, fineAmount: number): Promise<ReportIssueResponse> => {
    const response = await axiosInstance.post(`/transactions/${transactionId}/report-issue`, { type, fineAmount });
    return response as any;
  },
  restoreLostBook: async (
    transactionId: string,
    data: { barcode?: string; newItemStatus: 'AVAILABLE' | 'IN_MAINTENANCE'; refundAmount: number; recoveryReason: string; note?: string },
  ): Promise<RestoreLostBookResponse> => {
    const response = await axiosInstance.post(`/transactions/${transactionId}/restore-lost`, data);
    return response as any;
  },
  previewLostBookRecovery: async (transactionId: string): Promise<LostBookRecoveryPreviewResponse> => {
    const response = await axiosInstance.get(`/transactions/${transactionId}/restore-lost/preview`);
    return response as any;
  },
  getAllTransactions: async (
    page: number = 0,
    size: number = 15,
    keyword?: string,
    status?: TransactionStatus | 'ALL',
    fineStatus?: FinePaymentStatus | 'ALL',
    dateFrom?: string,
    dateTo?: string,
    sortBy?: string,
    sortDir?: 'ASC' | 'DESC',
  ): Promise<AllTransactionsResponse> => {
    const response = await axiosInstance.get('/transactions', {
      params: {
        page,
        size,
        keyword: keyword || undefined,
        status: status && status !== 'ALL' ? status : undefined,
        fineStatus: fineStatus && fineStatus !== 'ALL' ? fineStatus : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy,
        sortDir,
      },
    });
    return response as any;
  },
  upsertNote: async (
    transactionId: string,
    data: { important: boolean; note: string },
  ): Promise<{ code: number; message: string; data: TransactionNote }> => {
    const response = await axiosInstance.post(`/transactions/${transactionId}/note`, data);
    return response as any;
  },
  getNotes: async (transactionId: string): Promise<{ code: number; message: string; data: TransactionNote[] }> => {
    const response = await axiosInstance.get(`/transactions/${transactionId}/note`);
    return response as any;
  },
  deleteNote: async (transactionId: string, noteId?: string): Promise<{ code: number; message: string; data: null }> => {
    const response = await axiosInstance.delete(noteId ? `/transactions/${transactionId}/note/${noteId}` : `/transactions/${transactionId}/note`);
    return response as any;
  },
};

export default transactionsService;

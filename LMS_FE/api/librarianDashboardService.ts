import axiosInstance from './axiosInstance';

export interface DashboardSummaryResponse {
  code: number;
  message: string;
  data: {
    overview: {
      totalUsers: number;
      activeUsers: number;
      totalPublications: number;
      totalItems: number;
      availableItems: number;
    };
    todayTransaction: {
      borrowedToday: number;
      returnedToday: number;
      damagedToday: number;
      lostToday: number;
      newlyOverdueToday: number;
    };
    pendingActions: {
      waitingForPickup: number;
      overdueTransactions: number;
      reservationsPending: number;
      reshelvingWaiting: number;
    };
    fineSummary: {
      unpaidFineCount: number;
      totalUnpaidAmount: number;
      collectedToday: number;
    };
  };
}

export interface DashboardChartsResponse {
  code: number;
  message: string;
  data: {
    weeklyBorrowReturnTrend: {
      date: string;
      borrowed: number;
      returned: number;
    }[];
    itemStatusDistribution: {
      available: number;
      borrowed: number;
      reserved: number;
      inMaintenance: number;
      lost: number;
    };
    topBorrowedPublications: {
      publicationId: string;
      title: string;
      borrowCount: number;
      coverImageUrl: string;
    }[];
    fineTypeDistribution: {
      overdueReturn: number;
      damagedBook: number;
      lostBook: number;
    };
  };
}

export interface RiskyUser {
  userId: string;
  studentId: string | null;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  profilePictureUrl: string | null;
  creditScore: number;
  riskyMetrics: {
    overdueCount: number;
    unpaidFineCount: number;
    totalUnpaidAmount: number;
    damagedCount: number;
  };
}

export interface RiskyUsersResponse {
  code: number;
  message: string;
  data: {
    content: RiskyUser[];
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
  };
}

export interface ReaderProfile {
  userId: string;
  studentId: string | null;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  profilePictureUrl: string | null;
  faculty: string | null;
  facultyDisplayName: string | null;
  major: string | null;
  activeBorrows: number;
  borrowLimit: number;
  unpaidFineAmount: number;
  creditScore: number;
  borrowingBlocked: boolean;
  totalBorrowed: number;
  returnedCount: number;
  overdueCount: number;
  fineCount: number;
  unpaidFineCount: number;
  damagedFineCount: number;
  lostFineCount: number;
  totalFineAmount: number;
  paidFineAmount: number;
}

export interface ReaderProfileResponse {
  code: number;
  message: string;
  data: ReaderProfile;
}

export type ReaderActivityType = 'BORROW' | 'RETURN' | 'FINE_PAID' | 'DAMAGE_REPORT' | 'LOST_REPORT';

export interface ReaderActivity {
  id: string;
  type: ReaderActivityType;
  title: string;
  description: string | null;
  occurredAt: string;
  amount: number | null;
}

export interface ReaderTimelineResponse {
  code: number;
  message: string;
  data: ReaderActivity[];
}

export type DashboardReportPeriod = 'TODAY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';

export interface DashboardReportResponse {
  code: number;
  message: string;
  data: {
    dateFrom: string;
    dateTo: string;
    inventory: {
      totalItems: number;
      availableItems: number;
      borrowedItems: number;
      reservedItems: number;
      maintenanceItems: number;
      lostItems: number;
      itemsAddedInPeriod: number;
      publicationsAddedInPeriod: number;
    };
    circulation: {
      borrowCount: number;
      returnCount: number;
      activeBorrowCount: number;
      overdueCurrentCount: number;
      waitingPickupCount: number;
      reservationPendingCount: number;
      returnRatePercent: number;
    };
    finance: {
      depositsCollected: number;
      depositsRefunded: number;
      depositsAppliedToFines: number;
      additionalAmountDue: number;
      finesCreated: number;
      finesCollected: number;
      unpaidFineOutstanding: number;
      lostBookRefunds: number;
      netCashInPeriod: number;
    };
    incidents: {
      overdueFineCount: number;
      damagedFineCount: number;
      lostFineCount: number;
      recoveredLostBookCount: number;
    };
    trend: {
      label: string;
      borrowed: number;
      returned: number;
      depositsCollected: number;
      finesCollected: number;
    }[];
    topBorrowedPublications: {
      publicationId: string;
      title: string;
      borrowCount: number;
    }[];
    riskyReaders?: {
      userId: string;
      studentId: string | null;
      fullName: string;
      email: string;
      phoneNumber: string | null;
      creditScore: number;
      overdueCount: number;
      unpaidFineCount: number;
      totalUnpaidAmount: number;
      damagedCount: number;
    }[];
    librarianNotes: string[];
  };
}

const librarianDashboardService = {
  getSummary: async (): Promise<DashboardSummaryResponse> => {
    return axiosInstance.get('/librarians/dashboard/summary');
  },
  getCharts: async (period: 'WEEKLY' | 'MONTHLY' | 'SIX_MONTHS' | 'YEARLY' = 'WEEKLY'): Promise<DashboardChartsResponse> => {
    return axiosInstance.get(`/librarians/dashboard/charts?period=${period}`);
  },
  getRiskyUsers: async (page = 0, size = 5, sortBy = 'creditScore', sortDir = 'ASC'): Promise<RiskyUsersResponse> => {
    return axiosInstance.get(`/librarians/dashboard/risky-users?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`);
  },
  getReaderProfile: async (params: { userId?: string | number | null; studentId?: string | null }): Promise<ReaderProfileResponse> => {
    return axiosInstance.get('/librarians/readers/profile', { params });
  },
  getReaderTimeline: async (
    params: { userId?: string | number | null; studentId?: string | null },
    limit = 10,
  ): Promise<ReaderTimelineResponse> => {
    return axiosInstance.get('/librarians/readers/timeline', { params: { ...params, limit } });
  },
  getReport: async (
    period: DashboardReportPeriod = 'MONTHLY',
    dateFrom?: string,
    dateTo?: string,
  ): Promise<DashboardReportResponse> => {
    const isDateRange = period === 'CUSTOM' || period === 'TODAY';
    return axiosInstance.get('/librarians/dashboard/report', {
      params: {
        period: isDateRange ? 'CUSTOM' : period,
        dateFrom: isDateRange ? dateFrom : undefined,
        dateTo: isDateRange ? dateTo : undefined,
      },
    });
  },
  exportReport: async (
    period: DashboardReportPeriod = 'MONTHLY',
    dateFrom?: string,
    dateTo?: string,
  ): Promise<Blob> => {
    const isDateRange = period === 'CUSTOM' || period === 'TODAY';
    return axiosInstance.get('/librarians/dashboard/report/export', {
      responseType: 'blob',
      params: {
        period: isDateRange ? 'CUSTOM' : period,
        dateFrom: isDateRange ? dateFrom : undefined,
        dateTo: isDateRange ? dateTo : undefined,
      },
    }) as any;
  }
};

export default librarianDashboardService;

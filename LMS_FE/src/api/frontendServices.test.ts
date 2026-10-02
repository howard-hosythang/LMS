import axios from 'axios';
import axiosInstance from '../../api/axiosInstance';
import publicationsService from '../../api/publicationsService';
import fineService from '../../api/fineService';
import semanticSearchService from '../../api/semanticSearchService';
import wishlistService from '../../api/wishlistService';
import adminService from '../../api/adminService';
import circulationPolicyService from '../../api/circulationPolicyService';
import systemReviewsService from '../../api/systemReviewsService';
import transactionsService from '../../api/transactionsService';

jest.mock('../../api/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    put: jest.fn(),
  },
}));

const mockedAxiosInstance = axiosInstance as jest.Mocked<typeof axiosInstance>;
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('frontend service contracts', () => {
  it('sends an unpaid fine adjustment as a numeric amount', async () => {
    await fineService.updateAmount('10', 100000, 'Correction');
    expect(mockedAxiosInstance.put).toHaveBeenCalledWith('/fines/10/amount', {
      fineAmount: 100000, reason: 'Correction',
    });
  });
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxiosInstance.get.mockResolvedValue({ code: 200, data: [] } as any);
    mockedAxiosInstance.post.mockResolvedValue({ code: 200, data: {} } as any);
    mockedAxiosInstance.put.mockResolvedValue({ code: 200, data: {} } as any);
    mockedAxiosInstance.patch.mockResolvedValue({ code: 200, data: {} } as any);
    mockedAxiosInstance.delete.mockResolvedValue({ code: 200, data: {} } as any);
    mockedAxios.put.mockResolvedValue({} as any);
  });

  it('builds public search query with filters and pagination', async () => {
    await publicationsService.searchPublications({
      keyword: 'clean code',
      categoryIds: ['1', '2'],
      language: 'en',
      yearFrom: 2010,
      yearTo: 2024,
      available: true,
      branch: 'CS1',
      sortBy: 'rating',
      page: 2,
      size: 24,
    });

    const calledUrl = mockedAxiosInstance.get.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/publications/search?');
    expect(calledUrl).toContain('keyword=clean+code');
    expect(calledUrl).toContain('categoryIds=1');
    expect(calledUrl).toContain('categoryIds=2');
    expect(calledUrl).toContain('available=true');
    expect(calledUrl).toContain('page=2');
    expect(calledUrl).toContain('size=24');
  });

  it('sends semantic search request to the AI endpoint', async () => {
    await semanticSearchService.search({ queryText: 'machine learning', limit: 8 });

    expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/ai/semantic-search', {
      queryText: 'machine learning',
      limit: 8,
    });
  });

  it('uses the publications semantic search wrapper used by hybrid search', async () => {
    await publicationsService.semanticSearch('web development', 50);

    expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/ai/semantic-search', {
      queryText: 'web development',
      limit: 50,
    });
  });

  it('creates PayOS payment link and syncs payment status', async () => {
    await fineService.createPayOsFinePayment('22520001');
    await fineService.syncPayOsFinePayment(123456);

    expect(mockedAxiosInstance.post).toHaveBeenNthCalledWith(1, '/fines/payments/payos', null, {
      params: { studentId: '22520001' },
    });
    expect(mockedAxiosInstance.post).toHaveBeenNthCalledWith(2, '/fines/payments/payos/123456/sync');
  });

  it('calls wishlist endpoints for add, remove, clear and status', async () => {
    await wishlistService.addToWishlist('p1');
    await wishlistService.removeFromWishlist('p1');
    await wishlistService.clearWishlist();
    await wishlistService.getWishlistStatus('p1');

    expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/wishlist/p1');
    expect(mockedAxiosInstance.delete).toHaveBeenCalledWith('/wishlist/p1');
    expect(mockedAxiosInstance.delete).toHaveBeenCalledWith('/wishlist');
    expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/wishlist/p1/status');
  });

  it('uploads PDF to presigned S3 URL with raw axios and progress callback', async () => {
    const onProgress = jest.fn();
    const file = new File(['pdf'], 'book.pdf', { type: 'application/pdf' });

    await publicationsService.uploadDocumentToS3('https://s3.local/upload', file, onProgress);

    expect(mockedAxios.put).toHaveBeenCalledWith('https://s3.local/upload', file, expect.objectContaining({
      headers: { 'Content-Type': 'application/pdf' },
      onUploadProgress: expect.any(Function),
    }));

    const progressHandler = mockedAxios.put.mock.calls[0][2]?.onUploadProgress as any;
    progressHandler({ loaded: 50, total: 100 });
    expect(onProgress).toHaveBeenCalledWith(50);
  });

  it('builds publication rating endpoints with filters', async () => {
    await publicationsService.getPublicationRatings('p1', 1, 5, { star: 4, sort: 'helpful' });
    await publicationsService.createPublicationRating('p1', { star: 5, comment: 'Good', transactionId: 'tx1' });
    await publicationsService.toggleRatingHelpful('p1', 'r1');

    expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/publications/p1/ratings?page=1&size=5&sort=helpful&star=4');
    expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/publications/p1/ratings', {
      star: 5,
      comment: 'Good',
      transactionId: 'tx1',
    });
    expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/publications/p1/ratings/r1/helpful');
  });

  it('calls admin governance endpoints for audit logs and account state', async () => {
    await adminService.listAuditLogs({
      keyword: 'logout',
      actorRole: 'ADMIN',
      entityType: 'auth',
      sortBy: 'createdAt',
      sortDir: 'DESC',
      limit: 50,
    });
    await adminService.updateUserStatus('u1', 'LOCKED');
    await adminService.verifyUser('u1');

    expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/admin/audit-logs', {
      params: {
        limit: 50,
        keyword: 'logout',
        actorRole: 'ADMIN',
        entityType: 'auth',
        sortBy: 'createdAt',
        sortDir: 'DESC',
      },
    });
    expect(mockedAxiosInstance.patch).toHaveBeenCalledWith('/admin/users/u1/status', { status: 'LOCKED' });
    expect(mockedAxiosInstance.patch).toHaveBeenCalledWith('/admin/users/u1/verify');
  });

  it('uses DB-backed circulation policy endpoint for reader and librarian hints', async () => {
    await circulationPolicyService.getPolicy();
    await adminService.getPolicy();
    await adminService.updatePolicy({
      pickupDeadlineHours: 48,
      defaultLoanDays: 14,
      maxActiveBorrows: 5,
      maxActiveReservations: 2,
      maxRenewals: 2,
      renewalWindowDays: 3,
      defaultDepositAmount: 50000,
      overdueFinePerDay: 1000,
      blockBorrowWhenUnpaidFines: true,
      updatedByAdminId: null,
      updatedByAdminName: null,
      updatedAt: null,
    });

    expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/circulation-policies');
    expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/circulation-policies/admin');
    expect(mockedAxiosInstance.put).toHaveBeenCalledWith('/circulation-policies/admin', expect.objectContaining({
      pickupDeadlineHours: 48,
      overdueFinePerDay: 1000,
    }));
  });

  it('calls public system review endpoints used by landing review widgets', async () => {
    await systemReviewsService.getTopReviews(3);
    await systemReviewsService.getSummary();
    await systemReviewsService.upsertMyReview({ rating: 5, comment: 'Tốt' });

    expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/system-reviews/top?limit=3');
    expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/system-reviews/summary');
    expect(mockedAxiosInstance.put).toHaveBeenCalledWith('/system-reviews/me', { rating: 5, comment: 'Tốt' });
  });

  it('calls transaction note thread endpoints with note author separation', async () => {
    await transactionsService.getNotes('tx1');
    await transactionsService.upsertNote('tx1', { important: true, note: 'Cần kiểm tra bìa sách' });
    await transactionsService.deleteNote('tx1', 'note1');

    expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/transactions/tx1/note');
    expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/transactions/tx1/note', {
      important: true,
      note: 'Cần kiểm tra bìa sách',
    });
    expect(mockedAxiosInstance.delete).toHaveBeenCalledWith('/transactions/tx1/note/note1');
  });
});

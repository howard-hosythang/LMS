import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import Circulation from '../../pages/librarian_pages/Circulation';
import Dashboard from '../../pages/librarian_pages/Dashboard';
import circulationPolicyService from '../../api/circulationPolicyService';
import reshelvingService from '../../api/reshelvingService';
import librarianDashboardService from '../../api/librarianDashboardService';
import transactionsService from '../../api/transactionsService';

jest.mock('../../api/axiosInstance', () => ({ __esModule: true, default: {} }));
jest.mock('../../api/circulationPolicyService', () => ({ __esModule: true, default: { getPolicy: jest.fn() } }));
jest.mock('../../api/reshelvingService', () => ({
  __esModule: true, RESHELVING_CHANGED: 'lms:reshelving-changed', default: { getDefaultBranch: jest.fn().mockResolvedValue({ data: { branch: 'Cơ sở 1 - Lý Thường Kiệt' } }), getCount: jest.fn() },
}));
jest.mock('../../api/librarianDashboardService', () => ({
  __esModule: true, default: { getSummary: jest.fn(), getRiskyUsers: jest.fn() },
}));
jest.mock('../../api/transactionsService', () => ({ __esModule: true, default: { getAllTransactions: jest.fn() } }));
jest.mock('../../components/librarian_pages/ReshelvingTab', () => ({
  __esModule: true, default: () => <div>Reshelving tab content</div>,
}));
jest.mock('../../components/librarian_pages/ReaderProfileDrawer', () => ({ __esModule: true, default: () => null }));
jest.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: 'vi' }), useTranslation: () => ({ language: 'vi' }),
}));
jest.mock('../../contexts/AppDialogContext', () => ({ useAppDialog: () => ({ confirm: jest.fn() }) }));

function Location() { return <output aria-label="Current URL">{useLocation().search}</output>; }

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(circulationPolicyService.getPolicy).mockResolvedValue({ code: 200, data: {
    pickupDeadlineHours: 48, defaultLoanDays: 14, maxActiveBorrows: 5, maxActiveReservations: 2,
    overdueFinePerDay: 1000, blockBorrowWhenUnpaidFines: true, maxRenewals: 1, renewalWindowDays: 2,
  } } as Awaited<ReturnType<typeof circulationPolicyService.getPolicy>>);
  jest.mocked(reshelvingService.getCount).mockResolvedValue({ code: 200, data: { count: 12 } });
});

test('direct URL opens the reshelving tab with its server count', async () => {
  render(<MemoryRouter initialEntries={['/librarianpage/circulation?tab=reshelving']}>
    <Circulation />
  </MemoryRouter>);
  await screen.findByText('Reshelving tab content');
  expect(await screen.findByRole('button', { name: 'Xếp giá sách 12' })).toHaveClass('border-indigo-600');
});

test('switching tabs keeps unrelated query parameters', async () => {
  render(<MemoryRouter initialEntries={['/librarianpage/circulation?source=dashboard']}>
    <Circulation /><Location />
  </MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: 'Xếp giá sách 12' }));
  await screen.findByText('Reshelving tab content');
  const params = new URLSearchParams(screen.getByLabelText('Current URL').textContent || '');
  expect(params.get('tab')).toBe('reshelving');
  expect(params.get('source')).toBe('dashboard');
});

test('dashboard displays waiting count and links directly to the reshelving tab', async () => {
  jest.mocked(librarianDashboardService.getSummary).mockResolvedValue({ code: 200, message: 'OK', data: {
    overview: { totalUsers: 1, activeUsers: 1, totalPublications: 1, totalItems: 12, availableItems: 12 },
    todayTransaction: { borrowedToday: 0, returnedToday: 0, damagedToday: 0, lostToday: 0, newlyOverdueToday: 0 },
    pendingActions: { waitingForPickup: 0, overdueTransactions: 0, reservationsPending: 0, reshelvingWaiting: 12 },
    fineSummary: { unpaidFineCount: 0, totalUnpaidAmount: 0, collectedToday: 0 },
  } });
  jest.mocked(librarianDashboardService.getRiskyUsers).mockRejectedValue(new Error('not needed'));
  jest.mocked(transactionsService.getAllTransactions).mockRejectedValue(new Error('not needed'));
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  const card = await screen.findByRole('link', { name: /Sách chờ cất kệ/i });
  expect(card).toHaveAttribute('href', '/librarianpage/circulation?tab=reshelving');
  expect(within(card).getByText('12')).toBeInTheDocument();
  await waitFor(() => expect(librarianDashboardService.getSummary).toHaveBeenCalledTimes(1));
});

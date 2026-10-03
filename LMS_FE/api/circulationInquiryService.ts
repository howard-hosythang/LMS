import axios from './axiosInstance';
import { LibrarianTransaction } from './transactionsService';

export interface InquiryPage<T> {
  content: T[]; currentPage: number; pageSize: number; totalElements: number; totalPages: number;
  isFirst: boolean; isLast: boolean;
}
export interface ReaderSuggestion { userId: string; fullName: string; studentId: string | null }
export interface PublicationSummary { publicationId: string; publicationTitle: string; coverImageUrl: string | null; authors: string | null }
export interface CopySummary extends PublicationSummary {
  itemId: string; barcode: string; branch: string | null; location: string | null; status: string; condition: string | null;
  acquiredDate: string | null; createdAt: string | null; transactionId: string | null; holderUserId: string | null;
  holderName: string | null; holderStudentId: string | null; dueDate: string | null; waitingReshelving: boolean;
}
export interface PublicationOverview {
  publication: PublicationSummary;
  counts: { total: number; available: number; ready: number; waiting: number; borrowed: number; reserved: number; maintenance: number; lost: number };
  copies: InquiryPage<CopySummary>;
}
export interface LifecycleEvent {
  id: string; type: string; occurredAt: string; dateOnly: boolean; transactionId: string | null;
  detail: string | null; amount: number | null; actorName: string | null; actorCode: string | null;
}
export interface InquiryFine {
  fineId: string; type: string; fineAmount: number; status: string; createdAt: string | null; paidDate: string | null;
  paidByName: string | null; paidByCode: string | null;
}
export interface TransactionDetail { transaction: LibrarianTransaction; fines: InquiryFine[] }
async function get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const response = await axios.get(`/librarians/inquiry/${path}`, { params }) as unknown as { data: T };
  return response.data;
}
const circulationInquiryService = {
  readers: (keyword: string) => get<ReaderSuggestion[]>('readers', { keyword }),
  publications: (keyword: string, branch?: string) => get<PublicationSummary[]>('publications', { keyword, branch: branch || undefined }),
  publication: (id: string, branch?: string, page = 0) => get<PublicationOverview>(`publications/${id}`, { branch: branch || undefined, page, size: 10 }),
  item: (id: string) => get<CopySummary>(`items/${id}`),
  barcode: (barcode: string) => get<CopySummary>('items/barcode', { barcode }),
  timeline: (id: string, page = 0) => get<InquiryPage<LifecycleEvent>>(`items/${id}/timeline`, { page, size: 20 }),
  transaction: (id: string) => get<TransactionDetail>(`transactions/${id}`),
};
export default circulationInquiryService;

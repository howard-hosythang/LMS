// Unified Book interface for both public and librarian pages
export interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  publisher: string;
  category: string;
  // Public pages fields
  coverUrl?: string;
  rating?: number;
  ratingCount?: number;
  status?: 'available' | 'out_of_stock' | 'digital_only';
  // Librarian pages fields
  isbn?: string;
  thumbnail?: string;
  totalCopies?: number;
  availableCopies?: number;
  // Common optional fields
  tags?: string[];
  description?: string;
  format?: 'Print' | 'Ebook' | 'E-book';
  createdAt?: string;
  aiProcessingStatus?: 'NOT_UPLOADED' | 'NOT_STARTED' | 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  aiProcessingError?: string | null;
  aiChunksCount?: number | null;
  aiVectorsCount?: number | null;
  aiProcessedAt?: string | null;

  // Dashboard specific
  borrowDate?: string;
  dueDate?: string;
  daysLeft?: number;
  loanStatus?: 'active' | 'overdue' | 'returned' | 'warning';
  code?: string;
  copyStatus?: string; // e.g. "3 bản khả dụng"
}

export interface Review {
  id: string;
  user: string;
  role: string;
  avatar: string;
  rating: number;
  date: string;
  content: string;
  likes: number;
}

export interface LibraryItem {
  code: string;
  format: string;
  location: string;
  status: 'Available' | 'On Loan';
  returnDate?: string;
}

export interface CirculationPolicy {
  pickupDeadlineHours: number;
  defaultLoanDays: number;
  maxActiveBorrows: number;
  maxActiveReservations: number;
  maxRenewals: number;
  renewalWindowDays: number;
  overdueFinePerDay: number;
  defaultDepositAmount: number;
  blockBorrowWhenUnpaidFines: boolean;
  updatedByAdminId: string | null;
  updatedByAdminName: string | null;
  updatedAt: string | null;
}

// --- New Types for Protected Pages ---

export interface UserProfile {
  name: string;
  id: string;
  email: string;
  department: string;
  avatar: string;
}

export interface LoanRecord {
  id: string;
  book: Book;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'active' | 'overdue' | 'returned';
  daysLeft?: number;
  fine?: number;
}

export interface ReservationRecord {
  id: string;
  book: Book;
  requestDate: string;
  pickupLocation: string;
  status: 'waiting' | 'ready' | 'cancelled';
  queuePosition?: number;
  expiryDate?: string;
}

export interface FineRecord {
  id: string;
  amount: number;
  reason: string; // e.g., "Overdue", "Damaged"
  bookTitle: string;
  date: string;
  status: 'unpaid' | 'paid' | 'processing';
}

export interface Copy {
  barcode: string;
  bookId: string;
  title: string;
  location: string;
  status: 'Available' | 'On Loan' | 'Lost' | 'Reference' | 'Withdrawn';
  format: 'Print' | 'E-book';
  callNumber: string;
  dueDate?: string;
}

export interface User {
  id: string;
  name: string;
  studentId: string;
  department: string;
  avatar: string;
  stats: {
    borrowing: number;
    overdue: number;
    fines: number;
  };
}

export interface Transaction {
  id: string;
  time: string;
  date: string;
  user: {
    name: string;
    id: string;
    avatar: string;
  };
  item: {
    code: string;
    title: string;
  };
  type: 'Borrow' | 'Return' | 'Renew';
  status: 'Success' | 'Late';
}

export interface Request {
  id: string;
  user: {
    name: string;
    studentId: string;
    avatar: string;
  };
  bookTitle: string;
  author: string;
  requestDate: string;
  status: 'New' | 'Processing' | 'Approved' | 'Rejected';
  type: 'New Purchase' | 'Extend';
}

// Dashboard specific stats
export interface DashboardStat {
  title: string;
  value: string | number;
  unit?: string;
  subtitle: string;
  badge?: string;
  iconName: 'Book' | 'AlertTriangle' | 'Clock' | 'DollarSign';
  color: 'blue' | 'red' | 'orange' | 'purple';
  link: string;
}

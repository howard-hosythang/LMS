/**
 * Publication API Types
 *
 * Định nghĩa types cho Publications API response
 */

export interface PublicSearchResult {
  publicationId: string;
  title: string;
  coverImageUrl: string | null;
  publicationYear: number | null;
  language?: string | null;
  description: string | null;
  publisherName: string | null;
  authorNames: string | null;
  categoryNames: string | null;
  tagNames: string | null;
  totalItems: number;
  availableItems: number;
  avgRating: number;
  borrowCount: number;
  viewCount: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface PublicSearchParams {
  keyword?: string;
  categoryId?: string;
  categoryIds?: string[];
  language?: string;
  yearFrom?: number;
  yearTo?: number;
  available?: boolean;
  branch?: string;
  sortBy?: string;
  titleOnly?: boolean;
  page?: number;
  size?: number;
}

// Publisher interface
export interface Publisher {
  id: string;
  publisherName: string;
  address: string;
}

// Author interface
export interface Author {
  id: string;
  authorName: string;
  biography: string;
  dateOfBirth: string;
  dateOfDeath: string | null;
}

// Category interface
export interface Category {
  id: string;
  categoryName?: string;
  name?: string;
  bio?: string | null;
  parentCategoryId: string | null;
  parentCategoryName?: string | null;
  publicationCount?: number;
}

export interface PublicLibraryStats {
  totalPublications: number;
  activeUsers: number;
  totalBorrows: number;
  totalCategories: number;
  averageRating: number;
  totalRatings: number;
  satisfactionPercent: number;
}

export interface PublicTestimonial {
  ratingId: string;
  star: number;
  comment: string;
  fullName: string;
  role: string;
  profilePictureUrl: string | null;
  publicationId?: string | null;
  publicationTitle?: string | null;
}

// Tag interface
export interface Tag {
  id: string;
  tagName: string;
}

// Publication interface (Main entity)
export interface Publication {
  id: string;
  isbn: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  language: string;
  numberOfPages: number;
  publicationYear: number;
  edition: string | null;
  publicationFormat?: string | null;
  editionNote?: string | null;
  coverImageUrl: string | null;
  size: string | null;
  weight: number | null;
  publisher: Publisher;
  authors: Author[];
  categories: Category[];
  tags: Tag[];
  totalItems: number;
  availableItems: number;
  callNumber: string | null;
}


export interface UpdatePublicationRequest {
  isbn: string | null;
  title: string;
  description: string | null;
  language: string;
  numberOfPages: number;
  aiTargetAudience: string;
  publicationYear: number;
  edition: string | null;
  publicationFormat?: string | null;
  editionNote?: string | null;
  size: string | null;
  weight: number | null;
  publisher: string;
  authors: string[];
  tags: string[];
  categories: string[];
}

// Librarian Response
export interface LibrarianPublicationResponse {
  publicationId: string;
  title: string;
  subtitle: string | null;
  coverImageUrl: string | null;
  authorNames: string[];
  publicationYear: number;
  totalItems: number;
  availableItems: number;
  isbn: string | null;
  publisherName: string | null;
  categoryNames: string | null;
  createdAt: string | null;
  aiProcessingStatus?: AiProcessingStatus;
  aiProcessingError?: string | null;
  aiChunksCount?: number | null;
  aiVectorsCount?: number | null;
  aiProcessedAt?: string | null;
}

export type AiProcessingStatus =
  | 'NOT_UPLOADED'
  | 'NOT_STARTED'
  | 'QUEUED'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED';

// Newest Publication Response
export interface NewestPublication {
  publicationId: string;
  title: string;
  coverImageUrl: string | null;
  publicationYear: number;
  createdAt: string;
  availableItems: number;
  authorNames: string[];
  ratingAverage: number;
  ratingCount: number;
  borrowCount: number;
}

export interface MostBorrowedPublication extends NewestPublication {}

// API Response wrapper
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// Paginated response for publications (Librarian payload)
// API Response wrapper cho Librarian Publication Detail
export interface PublicationDetailResponse {
  publication: {
    id: string;
    isbn: string;
    title: string;
    subtitle: string | null;
    description: string;
    language: string;
    numberOfPages: number;
    aiSummary: string;
    aiTargetAudience: string;
    fileUrl: string;
    publicationYear: number;
    edition: string | number;
    publicationFormat: string | null;
    editionNote: string | null;
    coverImageUrl: string;
    size: string;
    weight: number;
    callNumber: string | null;
    tableOfContents: string | null;
    totalItems: number;
    availableItems: number;
    borrowCount?: number;
    viewCount?: number;
    aiProcessingStatus?: AiProcessingStatus;
    aiProcessingError?: string | null;
    aiChunksCount?: number | null;
    aiVectorsCount?: number | null;
    aiProcessedAt?: string | null;
  };
  publisher: {
    id: string;
    name: string;
  };
  authors: {
    id: string;
    name: string;
  }[];
  categories: {
    id: string;
    name: string;
  }[];
  tags: {
    id: string;
    name: string;
  }[];
  ratings: {
    averageRating: number;
    totalRatings: number;
  };
  items: {
    totalItems: number;
    totalAvailableItems: number;
    totalBorrowedItems: number;
  };
}

export interface PaginatedPublications {
  content: LibrarianPublicationResponse[];
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// Availability filter enum matching backend
export type AvailabilityFilter = 'ALL' | 'HAS_ITEMS' | 'NO_ITEMS';

// Query parameters for getting publications
export interface GetPublicationsParams {
  keyword?: string;
  categoryId?: number;
  year?: number;
  hasItems?: boolean;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
  page?: number;
  size?: number;
}

export interface PublicationItem {
  id: string;
  barcode: string;
  branch: string;
  location: string;
  status: string;
  condition: string;
  copyType?: string | null;
  bindingType?: string | null;
  conditionNote?: string | null;
  acquiredDate?: string | null;
  acquisitionSource?: string | null;
  dueDate: string | null;
}

export interface PublicationRating {
  ratingId: string;
  userId?: string;
  transactionId?: string | null;
  itemBarcode?: string | null;
  star: number;
  comment: string;
  helpfulCount: number;
  helpfulByCurrentUser?: boolean;
  editableByCurrentUser?: boolean;
  editableUntil?: string | null;
  fullName: string;
  profilePictureUrl: string | null;
  studentId?: string | null;
  faculty: string;
  createdAt: string;
  replies?: RatingReply[];
}

export interface RatingReply {
  replyId: string;
  content: string;
  librarianName: string;
  librarianAvatarUrl?: string | null;
  librarianRoleLabel?: string | null;
  createdAt: string;
}

export interface PaginatedPublicationRatings {
  content: PublicationRating[];
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface PublicationRatingSummary {
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
  totalCount: number;
}

export interface TocEntry {
  level: number | null;
  title: string;
  pageNum: string | null;
}

export interface BookSearchItem {
  isbn: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  language: string | null;
  numberOfPages: number | null;
  publicationYear: number | null;
  publisherName: string | null;
  authorNames: string[];
  categoryNames: string[];
  coverImageUrl: string | null;
  alternativeCoverUrl: string | null;
  callNumber: string | null;
  tableOfContents: TocEntry[] | null;
  editionId?: string | null;
  isbn10?: string | null;
  isbn13?: string | null;
  coverSmall?: string | null;
  coverMedium?: string | null;
  coverLarge?: string | null;
  coverUrls?: string[];
}

export interface BookLookupResponse {
  queryType: 'ISBN' | 'TITLE' | 'EDITION';
  results: BookSearchItem[];
}

export interface PaginatedPublicationItems {
  content: PublicationItem[];
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

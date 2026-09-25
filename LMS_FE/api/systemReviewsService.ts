import axiosInstance from './axiosInstance';
import { ApiResponse, PageResponse } from './publicationTypes';

export interface SystemReview {
  reviewId: string;
  userId?: string | null;
  rating: number;
  comment: string;
  fullName: string;
  role: string;
  studentId?: string | null;
  faculty?: string | null;
  profilePictureUrl: string | null;
  published: boolean;
  satisfied: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SystemReviewSummary {
  totalReviews: number;
  satisfiedReviews: number;
  averageRating: number;
  satisfactionPercent: number;
}

export interface SystemReviewPayload {
  rating: number;
  comment: string;
}

export type SystemReviewSort = 'newest' | 'oldest' | 'highest' | 'lowest';

const systemReviewsService = {
  getTopReviews: async (limit = 3): Promise<ApiResponse<SystemReview[]>> => {
    return axiosInstance.get(`/system-reviews/top?limit=${limit}`);
  },

  getReviews: async (
    page = 0,
    size = 9,
    filters?: { rating?: number | 'all'; sort?: SystemReviewSort }
  ): Promise<ApiResponse<PageResponse<SystemReview>>> => {
    return axiosInstance.get('/system-reviews', {
      params: {
        page,
        size,
        rating: filters?.rating === 'all' ? undefined : filters?.rating,
        sort: filters?.sort,
      },
    });
  },

  getSummary: async (): Promise<ApiResponse<SystemReviewSummary>> => {
    return axiosInstance.get('/system-reviews/summary');
  },

  getMyReview: async (): Promise<ApiResponse<SystemReview | null>> => {
    return axiosInstance.get('/system-reviews/me');
  },

  upsertMyReview: async (payload: SystemReviewPayload): Promise<ApiResponse<SystemReview>> => {
    return axiosInstance.put('/system-reviews/me', payload);
  },
};

export default systemReviewsService;

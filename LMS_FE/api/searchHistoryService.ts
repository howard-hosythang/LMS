import axiosInstance from './axiosInstance';

export interface ApiResponse<T> { code: number; message: string; data: T; }
export interface SearchHistoryItem { id: string; keyword: string; }

const searchHistoryService = {
  getHistory: (keyword?: string): Promise<ApiResponse<SearchHistoryItem[]>> =>
    axiosInstance.get(keyword ? `/search-history?keyword=${encodeURIComponent(keyword)}` : '/search-history'),

  saveHistory: (keyword: string): Promise<ApiResponse<void>> =>
    axiosInstance.post('/search-history', { keyword }),

  deleteHistory: (id: string): Promise<ApiResponse<void>> =>
    axiosInstance.delete(`/search-history/${id}`),
};

export default searchHistoryService;

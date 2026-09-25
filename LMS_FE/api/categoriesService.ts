import axiosInstance from './axiosInstance';
import { ApiResponse, Category } from './publicationTypes';


const categoriesService = {
  getAllCategories: async (): Promise<ApiResponse<Category[]>> => {
    return axiosInstance.get('/categories');
  },
};

export default categoriesService;

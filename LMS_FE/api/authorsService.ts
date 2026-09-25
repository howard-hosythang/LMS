import axiosInstance from './axiosInstance';
import { ApiResponse, Author } from './publicationTypes';

const authorsService = {
  getAllAuthors: async (): Promise<ApiResponse<Author[]>> => {
    return axiosInstance.get('/authors');
  },
};

export default authorsService;

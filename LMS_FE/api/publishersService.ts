import axiosInstance from './axiosInstance';
import { ApiResponse, Publisher } from './publicationTypes';

const publishersService = {
  getAllPublishers: async (): Promise<ApiResponse<Publisher[]>> => {
    return axiosInstance.get('/publishers');
  },
};

export default publishersService;

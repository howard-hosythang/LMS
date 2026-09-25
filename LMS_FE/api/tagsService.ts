import axiosInstance from './axiosInstance';
import { ApiResponse, Tag } from './publicationTypes';

const tagsService = {
  getAllTags: async (): Promise<ApiResponse<Tag[]>> => {
    return axiosInstance.get('/tags');
  },
};

export default tagsService;

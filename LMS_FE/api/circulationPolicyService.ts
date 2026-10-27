import axiosInstance from './axiosInstance';
import type { CirculationPolicy } from './adminService';

const circulationPolicyService = {
  getPolicy: async (signal?: AbortSignal): Promise<{ code: number; message: string; data: CirculationPolicy }> => {
    return (signal ? axiosInstance.get('/circulation-policies', { signal }) : axiosInstance.get('/circulation-policies')) as any;
  },
};

export default circulationPolicyService;

import axiosInstance from './axiosInstance';
import type { CirculationPolicy } from './adminService';

const circulationPolicyService = {
  getPolicy: async (): Promise<{ code: number; message: string; data: CirculationPolicy }> => {
    return axiosInstance.get('/circulation-policies') as any;
  },
};

export default circulationPolicyService;

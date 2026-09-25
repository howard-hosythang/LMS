import axiosInstance from './axiosInstance';

export interface UserProfileResponse {
  code: number;
  message: string;
  data: {
    id: string;
    email: string;
    fullName: string;
    dateOfBirth: string | null;
    phoneNumber: string | null;
    studentId: string | null;
    faculty: string | null;
    address: string | null;
    profilePictureUrl: string | null;
    roles: {
      id: string;
      roleName: string;
      description: string;
    }[];
    status: string;
    verified?: boolean;
    canChangePassword?: boolean;
    lastLoginAt: string | null;
    creditScore: number;
    contributionScore: number;
  };
}

export interface UpdateProfileRequest {
  fullName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  address?: string;
}

export interface OnboardingProfileRequest {
  studentId: string;
  identityType: 'STUDENT' | 'LECTURER';
  phoneNumber?: string;
  faculty: string;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface ExchangeContributionResponse {
  creditScore: number;
  contributionScore: number;
  exchangedCredit: number;
  spentContribution: number;
}

const usersService = {
  getMyProfile: async (): Promise<UserProfileResponse> => {
    return axiosInstance.get('/users/my-profile');
  },
  updateMyProfile: async (data: UpdateProfileRequest): Promise<UserProfileResponse> => {
    return axiosInstance.put('/users/my-profile', data);
  },
  onboardingProfile: async (data: OnboardingProfileRequest): Promise<any> => {
    return axiosInstance.post('/auth/onboarding-profile', data);
  },
  updateAvatar: async (file: File): Promise<UserProfileResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  changePassword: async (data: ChangePasswordRequest): Promise<any> => {
    return axiosInstance.put('/users/my-profile/change-password', data);
  },
  exchangeContribution: async (): Promise<{ code: number; message: string; data: ExchangeContributionResponse }> => {
    return axiosInstance.post('/users/my-profile/exchange-contribution');
  }
};

export default usersService;

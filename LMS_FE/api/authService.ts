import axiosInstance from './axiosInstance';

export interface LoginResponse {
  code: number;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    isNewUser?: boolean;
  };
}

export interface AuthUrlResponse {
  code: number;
  message: string;
  data: string;
}

export interface RegisterRequest {
  fullName: string;
  studentId: string;
  identityType: 'STUDENT' | 'LECTURER';
  email: string;
  password: string;
  confirmPassword: string;
  faculty: string;
}

export interface RegisterResponse {
  code: number;
  message: string;
  data?: any;
}

const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return axiosInstance.post('/auth/login', { email, password });
  },

  getGoogleLoginUrl: async (): Promise<AuthUrlResponse> => {
    return axiosInstance.get('/auth/login-with-social?loginType=google');
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    return axiosInstance.post('/auth/register', data);
  },

  socialLoginCallback: async (registrationId: string, code: string): Promise<LoginResponse> => {
    return axiosInstance.post(`/auth/social-callback/${registrationId}?code=${code}`);
  },

  logout: async (refreshToken: string): Promise<any> => {
    // Gọi API logout nhưng dùng config thứ 3 để ghi đè header
    return axiosInstance.post('/auth/logout', {}, {
      headers: {
        're-token': refreshToken
      }
    });
  },

  forgotPassword: async (email: string): Promise<any> => {
    return axiosInstance.post('/auth/forgot-password', { email });
  },

  resetPassword: async (data: any): Promise<any> => {
    return axiosInstance.post('/auth/reset-password', data);
  }
};

export default authService;

import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { isPublicRequest } from './publicRequestPolicy';


const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1",
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
  headers: {
    'Accept-Language': 'vi',
  },
});

/**
 * REQUEST INTERCEPTOR
 * Tự động thêm Authorization token vào mỗi request nếu có
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Lấy token từ localStorage
    const token = localStorage.getItem("accessToken");
    const userType = localStorage.getItem("userType");
    const uiLanguage = localStorage.getItem("library74.language") === "en" ? "en" : "vi";

    // Public endpoints must stay public even when the browser keeps an old token.
    if (token && userType && config.headers && !isPublicRequest(config)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.headers) {
      config.headers["Accept-Language"] = uiLanguage;
    }

    return config;
  },
  (error: AxiosError) => {
    // Xử lý lỗi request
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: { resolve: any; reject: any }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * RESPONSE INTERCEPTOR
 * Tự động unwrap data và xử lý lỗi chung (Bao gồm Auto-Refresh Token)
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Xử lý lỗi response
    if (error.response) {
      const { status, data } = error.response;

      // Chỉ khi backend trả về mã code 1403 thì mới coi là token hết hạn và cần refresh
      const isTokenExpired = data && (data as any).code === 1403;

      if (isTokenExpired) {
        const refreshToken = localStorage.getItem('refreshToken');
        
        // Nếu có refresh token và chưa từng thử retry request này
        if (refreshToken && originalRequest && !originalRequest._retry) {
          if (isRefreshing) {
            return new Promise(function (resolve, reject) {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (originalRequest.headers) {
                  originalRequest.headers['Authorization'] = 'Bearer ' + token;
                }
                return axiosInstance(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

            const res = await axios.post(
              `${baseURL}/auth/refresh-accesstoken`,
              {},
              {
                headers: {
                  're-token': refreshToken,
                  'ngrok-skip-browser-warning': '69420',
                },
              }
            );

            if (res.data && res.data.data) {
              const newAccessToken = res.data.data.accessToken;
              const newRefreshToken = res.data.data.refreshToken;

              localStorage.setItem('accessToken', newAccessToken);
              localStorage.setItem('refreshToken', newRefreshToken);

              if (originalRequest.headers) {
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
              }

              processQueue(null, newAccessToken);
              return axiosInstance(originalRequest);
            } else {
              throw new Error('Refresh failed (No data)');
            }
          } catch (err) {
            processQueue(err, null);
            
            // Refresh thất bại (có thể refreshToken cũng hết hạn)
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userType');
            
            // Redirect về trang login vì phiên đăng nhập đã hỏng hoàn toàn
            window.location.href = '/#/publicpage/login';

            return Promise.reject({
              status,
              message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
              data,
            });
          } finally {
            isRefreshing = false;
          }
        } else if (originalRequest && originalRequest._retry) {
          // Đã thử retry rồi mà vẫn lỗi 401/1403 -> Token mới cũng không hợp lệ
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userType');
          window.location.href = '/#/publicpage/login';
          
          return Promise.reject({
            status,
            message: "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
            data,
          });
        } else {
          // Không có refresh token (người dùng chưa đăng nhập)
          // Xóa các token rác nếu có
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userType');
          
          // KHÔNG redirect ở đây để component (như BookDetailPage) có thể hiển thị thông báo lỗi tại chỗ
          return Promise.reject({
            status,
            message: (data as any)?.message || "Bạn cần đăng nhập để thực hiện chức năng này.",
            data,
          });
        }
      }

      switch (status) {
        case 403:
          console.error("🚫 Forbidden: Không có quyền truy cập");
          break;
        case 404:
          console.error("🔍 Not Found: Không tìm thấy tài nguyên");
          break;
        case 500:
          console.error("💥 Server Error: Lỗi server nội bộ");
          break;
        default:
          console.error(`❌ Error ${status}:`, data);
      }

      return Promise.reject({
        status,
        message: (data as any)?.message || "Đã có lỗi xảy ra",
        data,
      });
    } else if (error.request) {
      console.error("📡 Network Error: Không kết nối được với server");
      return Promise.reject({
        message: "Không kết nối được với server. Vui lòng kiểm tra kết nối mạng.",
      });
    } else {
      console.error("⚠️ Request Setup Error:", error.message);
      return Promise.reject({
        message: error.message || "Đã có lỗi xảy ra khi gửi request",
      });
    }
  }
);

export default axiosInstance;

/// <reference types="vite/client" />

/**
 * Type definition cho Environment Variables
 *
 * File này giúp TypeScript nhận biết các biến môi trường
 * và cung cấp IntelliSense khi sử dụng import.meta.env
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_API_TIMEOUT: string;
  // Thêm các biến môi trường khác ở đây khi cần
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

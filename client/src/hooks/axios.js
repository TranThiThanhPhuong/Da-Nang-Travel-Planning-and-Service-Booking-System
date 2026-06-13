import axios from "axios";

// 1. Tạo instance với URL cấu hình từ biến môi trường của Render
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Tạo một hàm để thiết lập token động cho mọi yêu cầu gửi đi
export const setupInterceptor = (getToken) => {
  api.interceptors.request.use(
    async (config) => {
      try {
        // Tự động lấy Token mới nhất từ Clerk
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Lỗi khi đính kèm Clerk Token vào Request:", error);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

export default api;
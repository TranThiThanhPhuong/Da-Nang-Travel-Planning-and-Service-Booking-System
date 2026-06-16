import api from "../hooks/axios";
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ADMIN_USERS_URL = `${BASE_URL}/api/admin/users`;

export const adminService = {
    // 1. Lấy danh sách
    getUsers: async (token, params) => {
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v != null && v !== '' && v !== 'ALL')
        );
        const queryString = new URLSearchParams(cleanParams).toString();

        const response = await api.get(`/api/admin/users?${queryString}`);
        return response.data;
    },

    // 2. Lấy chi tiết
    getUserDetails: async (token, userId) => {
        const response = await api.get(`/api/admin/users/${userId}`);
        return response.data;
    },

    // 3. Khóa/Mở khóa
    updateUserStatus: async (token, userId, status) => {
        const response = await api.patch(`/api/admin/users/${userId}/status`, { status });
        return response.data;
    }
};
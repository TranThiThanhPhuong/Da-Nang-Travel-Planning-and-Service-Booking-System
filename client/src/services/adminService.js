const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ADMIN_USERS_URL = `${BASE_URL}/api/admin/users`;

export const adminService = {
    // 1. Lấy danh sách
    getUsers: async (token, params) => {
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v != null && v !== '' && v !== 'ALL')
        );
        const queryString = new URLSearchParams(cleanParams).toString();

        const response = await fetch(`${ADMIN_USERS_URL}?${queryString}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    },

    // 2. Lấy chi tiết
    getUserDetails: async (token, userId) => {
        const response = await fetch(`${ADMIN_USERS_URL}/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    },

    // 3. Khóa/Mở khóa
    updateUserStatus: async (token, userId, status) => {
        const response = await fetch(`${ADMIN_USERS_URL}/${userId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        return response.json();
    }
};
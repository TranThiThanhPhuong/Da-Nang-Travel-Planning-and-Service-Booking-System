import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
let socket = null;

export const connectSocket = (token) => {
    if (!token) return null;

    if (!socket) {
        socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,             // Bật tự động kết nối lại
            reconnectionAttempts: 5,        // Thử lại tối đa 5 lần nếu lỗi
            reconnectionDelay: 2000         // Thời gian chờ giữa các lần thử (2 giây)
        });

        socket.on('connect', () => {
            console.log('🔌 [Socket] Kết nối thành công với ID:', socket.id);
        });

        socket.on('connect_error', (err) => {
            console.error('❌ [Socket] Lỗi kết nối phía Client:', err.message);
            
            // Nếu lỗi do Token không hợp lệ, tạm thời ngắt kết nối để đợi cập nhật token mới
            if (err.message.includes('Authentication error')) {
                socket.disconnect();
            }
        });
    } else {
        // Nếu socket đã tồn tại nhưng trước đó bị ngắt kết nối, cập nhật token và re-connect
        socket.auth.token = token;
        if (!socket.connected) {
            socket.connect();
        }
    }
    return socket;
};

// Hàm cực kỳ quan trọng để cập nhật token động mà không cần F5 trang
export const updateSocketToken = (token) => {
    if (socket && token) {
        socket.auth.token = token;
        if (!socket.connected) {
            socket.connect();
            console.log('🔄 [Socket] Đã cập nhật token mới và kích hoạt kết nối lại.');
        }
    }
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('❌ Đã ngắt kết nối Socket hệ thống.');
    }
};
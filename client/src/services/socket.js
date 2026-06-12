import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
let socket = null;

export const connectSocket = (getTokenFn) => {
    if (!getTokenFn) return null;

    if (!socket) {
        socket = io(SOCKET_URL, {
            // Mỗi lần reconnect, Socket.io sẽ tự động chạy hàm này để lấy token mới nhất từ Clerk
            auth: async (cb) => {
                const token = await getTokenFn();
                cb({ token });
            },
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,             
            reconnectionAttempts: 5,        
            reconnectionDelay: 2000         
        });

        socket.on('connect', () => {
            console.log('🔌 [Socket] Kết nối thành công với ID:', socket.id);
        });

        socket.on('connect_error', async (err) => {
            console.error('❌ [Socket] Lỗi kết nối phía Client:', err.message);
            
            // Nếu Server từ chối do Token lỗi/hết hạn, ép buộc ngắt và kết nối lại bằng Token mới
            if (err.message.includes('Authentication error')) {
                console.log('🔄 Đang ép cấu hình bắt tay lại bằng Token mới...');
                socket.disconnect();
                socket.connect(); 
            }
        });
    } else {
        if (!socket.connected) {
            socket.connect();
        }
    }
    return socket;
};

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
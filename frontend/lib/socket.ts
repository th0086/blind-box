import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:5022';

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
});

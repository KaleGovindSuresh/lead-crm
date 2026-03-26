import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => socket;

export const connectSocket = (token: string) => {
  if (!token) return null;
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_API_URL ?? "", {
    auth: { token },
    transports: ["websocket", "polling"],
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connect error:", err);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
};

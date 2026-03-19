import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_DASHBOARD_URL || "http://localhost:5005");

export default socket;

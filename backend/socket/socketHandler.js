import jwt from "jsonwebtoken";

export let ioInstance = null;

export const setIOInstance = (io) => {
    ioInstance = io;
};

export const initializeSocket = (io) => {
    // Authentication middleware — verify JWT before allowing WebSocket connection
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication required — no token provided"));
        }

        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            socket.userId = decoded.id;
            next();
        } catch (err) {
            return next(new Error("Authentication failed — invalid or expired token"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`⚡ Socket connected: user ${socket.userId} (socket ${socket.id})`);

        // ── Join a group room ──
        socket.on("join_group", (groupId) => {
            if (!groupId) return;
            socket.join(`group_${groupId}`);
            console.log(`   → User ${socket.userId} joined room group_${groupId}`);
        });

        // ── Leave a group room ──
        socket.on("leave_group", (groupId) => {
            if (!groupId) return;
            socket.leave(`group_${groupId}`);
            console.log(`   ← User ${socket.userId} left room group_${groupId}`);
        });

        // ── Disconnect ──
        socket.on("disconnect", (reason) => {
            console.log(`⚡ Socket disconnected: user ${socket.userId} (reason: ${reason})`);
        });

        // ── Error handling ──
        socket.on("error", (err) => {
            console.error(`Socket error for user ${socket.userId}:`, err.message);
        });
    });
};

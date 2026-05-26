import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import connectDB from "./db/db.js";
import dotenv from "dotenv";
import app from "./app.js";
import { initializeSocket, setIOInstance } from "./socket/socketHandler.js";

dotenv.config({
    path: "./.env"
});

// Create HTTP server wrapping Express (required for Socket.IO)
const httpServer = createServer(app);

// Attach Socket.IO to the HTTP server
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }
});

// Make io instance available to controllers
setIOInstance(io);

// Initialize Socket.IO event handlers
initializeSocket(io);

// Connect to MongoDB, then start the server
connectDB()
    .then(() => {
        httpServer.listen(process.env.PORT, () => {
            console.log(`🚀 Server is running on port ${process.env.PORT}`);
            console.log(`⚡ Socket.IO attached and listening`);
            console.log(`📋 Health check: http://localhost:${process.env.PORT}/api/v1/health`);
        }).on("error", (err) => {
            console.log("Failed to start server", err);
        });
    })
    .catch((err) => {
        console.log("MongoDB connection failed", err);
    });

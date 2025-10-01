"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.getIO = getIO;
const http = require("http");
let io = null;
function initSocket(server) {
    // lazy require to avoid type issues if socket.io not installed in the environment
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Server } = require("socket.io");
    io = new Server(server, { cors: { origin: "*" } });
    io.on("connection", (socket) => {
        // expect auth via query { token, userId }
        const { userId } = socket.handshake.query || {};
        if (userId)
            socket.join(`user:${userId}`);
        socket.on("disconnect", () => { });
    });
    return io;
}
function getIO() {
    return io;
}

import { Server, type Socket, type Namespace } from "socket.io";
import { verifyAccessToken, type TokenPayload } from "../../core/utils/jwt.js";

interface NotificationSocketData {
  user: TokenPayload;
}

type NotificationSocket = Socket<any, any, any, NotificationSocketData>;

let notificationNs: Namespace | null = null;

export const registerNotificationSocket = (io: Server) => {
  notificationNs = io.of("/notifications");

  notificationNs.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization?.startsWith("Bearer ")
          ? socket.handshake.headers.authorization.slice(7)
          : null);

      if (!token) {
        return next(new Error("Authentication token required for notifications socket"));
      }

      const payload = verifyAccessToken(token);
      socket.data = { user: payload };
      next();
    } catch {
      return next(new Error("Invalid authentication token for notifications"));
    }
  });

  notificationNs.on("connection", (socket: NotificationSocket) => {
    const { user } = socket.data;

    if (user.role === "reviewer") {
      socket.join(`reviewer:${user.userId}`);
    } else if (user.role === "admin") {
      socket.join("admins");
      socket.join(`admin:${user.userId}`);
    }
  });
};

export const emitReviewerNotification = (reviewerId: number, notification: any) => {
  if (!notificationNs) return;
  notificationNs.to(`reviewer:${reviewerId}`).emit("notification:new", notification);
};

export const emitAdminNotification = (notification: any, adminId?: number) => {
  if (!notificationNs) return;
  if (adminId) {
    notificationNs.to(`admin:${adminId}`).emit("notification:new", notification);
  } else {
    notificationNs.to("admins").emit("notification:new", notification);
  }
};

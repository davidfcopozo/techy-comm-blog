import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { connectDB } from "./config/connect";
import routes from "./routes/index";
import { errorHandlerMiddleware } from "./middleware/error-handler";
import { notFound } from "./middleware/not-found";
import path from "path";
import { NotificationService } from "./utils/notificationService";
import {
  generalLimiter,
  writeLimiter,
  authLimiter,
  readLimiter,
} from "./utils/rateLimiterConfig";

dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGO_DB: string = process.env.MONGO_DB as string;

const app = express();

//Middlewares
app.use(express.json()); //transforms req.body into json
app.use(express.urlencoded({ limit: "5mb", extended: true })); //transforms req.body into urlencoded
app.use(cookieParser(process.env.JWT_SECRET)); //parses cookies
app.use(morgan("dev")); //logs requests
app.use(bodyParser.json({ limit: "5mb" })); //parses json

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
); //allows cross origin requests

app.use(helmet()); //sets various http headers for security
app.use(hpp()); //prevents http parameter pollution
app.use(mongoSanitize()); //prevents nosql injections
app.use(express.static(path.join(__dirname, "../public"))); //serves static files

app.use("/api", generalLimiter);

app.use("/api/v1/auth", authLimiter);

app.use("/api/v1/posts", readLimiter);

app.use("/api/v1/comments", readLimiter);

// Apply write limiter to specific HTTP methods
app.use("/api/v1/posts", (req, res, next) => {
  if (["POST", "PUT", "DELETE"].includes(req.method)) {
    return writeLimiter(req, res, next);
  }
  next();
});

app.use("/api/v1/comments", (req, res, next) => {
  if (["POST", "PUT", "DELETE"].includes(req.method)) {
    return writeLimiter(req, res, next);
  }
  next();
});

app.use("/", routes);

app.use(notFound);
app.use(errorHandlerMiddleware);

const startServer = async () => {
  try {
    await connectDB(MONGO_DB);

    const httpServer = createServer(app);

    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);
      let userId: string | null = null;

      socket.on("join", (joinUserId) => {
        userId = joinUserId;
        if (userId) {
          socket.join(userId);
        }

        // Send a confirmation back to the user
        socket.emit("joinConfirmation", { userId, socketId: socket.id });
      });

      socket.on("test-notification", (data) => {
        // Send a test notification back to the user's room
        const testNotification = {
          id: `test-${Date.now()}`,
          type: "comment",
          message: "This is a test notification",
          sender: {
            firstName: "Test",
            lastName: "User",
            username: "testuser",
            avatar: null,
          },
          relatedPost: null,
          relatedComment: null,
          isRead: false,
          createdAt: new Date(),
        };

        io.to(data.userId).emit("notification", testNotification);
      });

      // Handle notification synchronization events
      socket.on("markNotificationAsRead", (data) => {
        if (userId) {
          io.to(userId).emit("notificationRead", data);
        }
      });

      socket.on("deleteNotification", (data) => {
        if (userId) {
          io.to(userId).emit("notificationDeleted", data);
        }
      });

      socket.on("markAllNotificationsAsRead", () => {
        if (userId) {
          io.to(userId).emit("allNotificationsRead");
        }
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });

    // Make io accessible throughout the app
    app.set("io", io);

    const notificationService = new NotificationService(io);
    app.set("notificationService", notificationService);

    httpServer.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}!!`);
      console.log(`Socket.IO server ready`);
    });
  } catch (error) {
    console.log(error);
  }
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;

import dns from "dns";
import mongoose, { ConnectOptions } from "mongoose";

// Use public DNS for MongoDB SRV resolution in development on systems with strict/failing local DNS
if (process.env.NODE_ENV !== "production") {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch {
    // Ignore if not supported in current environment
  }
}

export const connectDB = (url: string) => {
  return mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as ConnectOptions);
};


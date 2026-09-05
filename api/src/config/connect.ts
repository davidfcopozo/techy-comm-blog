import mongoose, { ConnectOptions } from "mongoose";
import dns from "dns";

export const connectDB = (url: string) => {
  if (process.env.NODE_ENV === "development") {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch (e) {
      // Ignore DNS override errors
    }
  }

  return mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as ConnectOptions);
};


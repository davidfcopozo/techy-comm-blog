import mongoose, { ConnectOptions } from "mongoose";
import dns from "dns";

export const connectDB = (url: string) => {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);

  return mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as ConnectOptions);
};


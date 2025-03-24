import Redis from "ioredis";
import { ConfigService } from "@nestjs/config";

export const createRedisClient = (configService: ConfigService): Redis => {
  const redisUrl = configService.get<string>("REDIS_URL") || "redis://localhost:6379"; // Cung cấp giá trị mặc định
  const client = new Redis(redisUrl);

  client.on("connect", () => console.log("✅ Redis connected"));
  client.on("error", (err) => console.error("❌ Redis error:", err));

  return client;
};

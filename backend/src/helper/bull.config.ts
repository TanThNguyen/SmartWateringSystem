import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { ConfigService } from "@nestjs/config";

const configService = new ConfigService();

const redisUrl = configService.get<string>("REDIS_URL") || "redis://localhost:6379"; // Cung cấp giá trị mặc định
const redisClient = new Redis(redisUrl);

export const scheduleQueue = new Queue("scheduleQueue", {
  connection: redisClient,
});

// Worker sẽ lắng nghe và xử lý công việc
export const scheduleWorker = new Worker(
  "scheduleQueue",
  async (job) => {
    const { deviceId, action } = job.data;
    console.log(`🔹 Executing job for device ${deviceId}: ${action}`);

    // Gửi lệnh đến Adafruit IO
    // const adafruitService = new (await import("../adafruit/adafruit.service")).AdafruitService();
    // await adafruitService.sendFeedData(deviceId, action);

    console.log(`✅ Device ${deviceId} - Action: ${action} executed`);
  },
  { connection: redisClient }
);

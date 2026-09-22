import dotenv from "dotenv";
dotenv.config();

import { emailService } from "../services/email.service.js";
import { startEmailWorker } from "../queues/email.worker.js";
import { emailQueue } from "../queues/email.queue.js";

async function testEmailQueue() {
  console.log("\n--- BullMQ Email Queue Test ---");

  console.log("1. Starting worker...");
  startEmailWorker();

  console.log("2. Dispatching test email via emailService...");
  const startTime = performance.now();

  await emailService.sendEmail({
    to: "test@example.com",
    subject: "BullMQ Verification Test",
    html: "<h1>Test email</h1><p>BullMQ queue is working!</p>",
  });

  const durationMs = (performance.now() - startTime).toFixed(2);
  console.log(`⚡ Job was added to queue in ${durationMs} ms (Client API latency)`);

  const counts = await emailQueue.getJobCounts("waiting", "active", "completed", "failed");
  console.log("📊 Current Queue Stats:", counts);

  console.log("\nWaiting a few seconds for the worker to process the job in the background...\n");
  
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const updatedCounts = await emailQueue.getJobCounts("waiting", "active", "completed", "failed");
  console.log("📊 Updated Queue Stats after worker execution:", updatedCounts);
  console.log("--- Test Finished ---\n");

  process.exit(0);
}

testEmailQueue().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});

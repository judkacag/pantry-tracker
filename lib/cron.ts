import cron from "node-cron";

let started = false;

export function startCron() {
  if (started) return;
  started = true;

  // Run every day at 08:00 Berlin time
  cron.schedule("0 8 * * *", async () => {
    try {
      await fetch("http://localhost:3000/api/cron");
    } catch {
      console.error("[cron] Failed to call /api/cron");
    }
  }, { timezone: "Europe/Berlin" });
}

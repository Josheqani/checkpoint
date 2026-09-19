import fs from "node:fs";
import path from "node:path";

const workerPath = path.resolve(".open-next/worker.js");
if (!fs.existsSync(workerPath)) {
  console.error("❌ .open-next/worker.js not found! Run opennextjs-cloudflare build first.");
  process.exit(1);
}

let content = fs.readFileSync(workerPath, "utf8");

if (content.includes("async scheduled(")) {
  console.log("ℹ️ scheduled handler already injected in .open-next/worker.js");
  process.exit(0);
}

// Scheduled handler to execute check-reminders on Cloudflare Edge Cron
const scheduledHandlerCode = `
    async scheduled(event, env, ctx) {
        console.log("[Cloudflare Cron] Triggered at:", new Date(event.scheduledTime).toISOString(), "cron:", event.cron);
        ctx.waitUntil(
            (async () => {
                try {
                    const cronSecret = env.CRON_SECRET || "";
                    const req = new Request("https://127.0.0.1/api/check-reminders", {
                        method: "POST",
                        headers: {
                            "Authorization": \`Bearer \${cronSecret}\`,
                            "Content-Type": "application/json"
                        }
                    });
                    const res = await this.fetch(req, env, ctx);
                    const body = await res.text();
                    console.log(\`[Cloudflare Cron] check-reminders HTTP \${res.status}:\`, body);
                } catch (err) {
                    console.error("[Cloudflare Cron] check-reminders failed:", err);
                }
            })()
        );
    },
`;

// Insert before the closing `};` of export default
const lastClosingBrace = content.lastIndexOf("};");
if (lastClosingBrace === -1) {
  console.error("❌ Could not find closing brace in .open-next/worker.js");
  process.exit(1);
}

const updatedContent =
  content.slice(0, lastClosingBrace) +
  scheduledHandlerCode +
  content.slice(lastClosingBrace);

fs.writeFileSync(workerPath, updatedContent, "utf8");
console.log("✅ Injected Cloudflare native scheduled handler into .open-next/worker.js");

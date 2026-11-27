import { serve } from "@hono/node-server";
import { migrate } from "./db/migrate.js";
import { app } from "./app.js";

await migrate();
const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port });
console.log(`RuangJiwa API listening on ${port}`);

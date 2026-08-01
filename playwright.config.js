import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./tests/e2e",
    timeout: 30_000,
    retries: 0,
    use: {
        baseURL: "https://kairos-intranet.duckdns.org",
        screenshot: "only-on-failure",
        trace: "retain-on-failure",
    },
    reporter: [["list"], ["html", { open: "never" }]],
});
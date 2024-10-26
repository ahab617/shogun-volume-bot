import { connectDatabase } from "./db";
import { initBot } from "./bot";
import { config } from "./config";
import { startSwapProcess } from "./swap";
// const cron = require("node-cron");
async function start() {
	await connectDatabase(config.database);
	initBot();
	startSwapProcess();
}
start();

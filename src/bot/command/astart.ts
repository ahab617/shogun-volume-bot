const { bot, Commands } = require("../index.ts");
import { startHandler } from "../library/startHandler";
const { removeAnswerCallback, sendMessage } = require("../library/index");
import path from "path";
export default new Commands(
	new RegExp(/^\/start/),
	"Start Bot",
	"start",
	true,
	async (msg: any) => {
		removeAnswerCallback(msg.chat);
		startHandler(msg);
	}
);

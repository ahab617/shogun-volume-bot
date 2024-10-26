
const { bot, Commands } = require("../index.ts")
import { supportHandler } from "../library/supportHandler"
const { removeAnswerCallback, sendMessage } = require('../library/index');

export default new Commands(
    new RegExp(/^\/support/),
    "Support Bot",
    "support",
    true,
    async (msg: any) => {
        removeAnswerCallback(msg.chat)
        supportHandler(msg);

    }
)
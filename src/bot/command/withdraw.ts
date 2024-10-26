
const { bot, Commands } = require("../index.ts")
import { withdrawHandler } from "../library/withdrawhandler"
const { removeAnswerCallback, sendMessage } = require('../library/index');

export default new Commands(
    new RegExp(/^\/withdraw/),
    "Withdraw Bot",
    "withdraw",
    true,
    async (msg: any) => {
        removeAnswerCallback(msg.chat)
        withdrawHandler(msg);
    }
)
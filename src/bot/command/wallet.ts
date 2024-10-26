
const { bot, Commands } = require("../index.ts")
import { walletHandler } from "../library/walletHandler"
const { removeAnswerCallback, sendMessage } = require('../library/index');

export default new Commands(
    new RegExp(/^\/wallet/),
    "Wallet Bot",
    "wallet",
    true,
    async (msg: any) => {
        removeAnswerCallback(msg.chat)
        walletHandler(msg);

    }
)


const {  Commands } = require("../index.ts")
import { balanceHandler } from "../library/balanceHandler";
const { removeAnswerCallback, sendMessage } = require('../library/index');

export default new Commands(
    new RegExp(/^\/balance/),
    "Balance bot",
    "balance",
    true,
    async (msg: any) => {
        removeAnswerCallback(msg.chat)
        balanceHandler(msg);
    }
)
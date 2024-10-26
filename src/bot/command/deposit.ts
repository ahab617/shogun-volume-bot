

const {  Commands } = require("../index.ts")
import { depositHandler } from "../library/depositHandler"
const { removeAnswerCallback, sendMessage } = require('../library/index');

export default new Commands(
    new RegExp(/^\/deposit/),
    "Deposit bot",
    "deposit",
    true,
    async (msg: any) => {
        removeAnswerCallback(msg.chat)
        depositHandler(msg);
    }
)
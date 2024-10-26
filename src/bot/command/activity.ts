

const {  Commands } = require("../index.ts")
import { swapHandler } from "../library/swapHandler";
const { removeAnswerCallback, sendMessage } = require('../library/index');
export default new Commands(
    new RegExp(/^\/activity/),
    "Activity bot",
    "activity",
    true,
    async (msg: any) => {
        removeAnswerCallback(msg.chat)
        swapHandler(msg);
    }
)
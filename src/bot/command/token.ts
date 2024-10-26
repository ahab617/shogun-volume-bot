
const { bot, Commands } = require("../index.ts")
import { tokenSettingHandler } from "../library/tokenSettingHandler"
const { removeAnswerCallback, sendMessage } = require('../library/index');

export default new Commands(
    new RegExp(/^\/token/),
    "TokenSetting Bot",
    "token",
    true,
    async (msg: any) => {
        removeAnswerCallback(msg.chat)
        tokenSettingHandler(msg);

    }
)
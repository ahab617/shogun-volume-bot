
const { bot, Commands } = require("../index.ts")
import { volumeHandler } from "../library/volumeHandler"
const { removeAnswerCallback, sendMessage } = require('../library/index');

export default new Commands(
    new RegExp(/^\/volume/),
    "Volume Bot",
    "volume",
    true,
    async (msg: any) => {
        removeAnswerCallback(msg.chat)
        volumeHandler(msg);
    }
)
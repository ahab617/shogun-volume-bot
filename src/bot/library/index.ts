import {bot} from "../index";
import { answerCallbacks } from "..";
export const removeAnswerCallback = (chat: any) => {
    answerCallbacks[chat.id] = null;
    delete answerCallbacks[chat.id];
}

export const sendMessage = async (userid: string, message: string) => {
	await bot.sendMessage(userid, message, { parse_mode: "HTML", disable_web_page_preview: true });
}
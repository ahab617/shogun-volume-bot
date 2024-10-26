import { bot } from ".."
 
export const supportHandler = (msg: any) => {
  if(!['/cancel', '/support', '/start', '/wallet', '/token', '/deposit', '/withdraw', '/balance', '/volume', '/acitivity'].includes(msg.text)){
    bot.editMessageReplyMarkup(
      { inline_keyboard: [] }, 
      { chat_id: msg.chat.id, message_id: msg.message_id }
    );
  }
  bot.sendMessage(msg.chat.id, `🚨 You can only request for support after starting a bot 🚨`, 
    {
        parse_mode: "HTML",
        disable_web_page_preview: true,
    })
}
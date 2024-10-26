import { bot } from ".."
import { startHandler } from "./startHandler";
import walletController from "../../controller/wallet";
import tokenSettingController from "../../controller/tokenSetting"

export const deleteWallethandler = async(msg: any) => {
  bot.editMessageReplyMarkup(
    { inline_keyboard: [] }, 
    { chat_id: msg.chat.id, message_id: msg.message_id }
  );
  bot.sendMessage(msg.chat.id, `Would you like to reset your wallet?`, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Cancel  👈', callback_data: 'return' },
          { text: 'OK  ✔️', callback_data: 'okay' }
        ]
      ]
    }
  })
    
}

export const confirmHandler = async(msg: any) => {

  await walletController.deleteOne({
      filter: {
        userId: msg.chat.id
      }
  });

  bot.sendMessage(msg.chat.id, `✅ Reset is successfully completed.`);
  startHandler(msg);
}

export const deleteTokenHandler = async (msg: any) => {
  bot.editMessageReplyMarkup(
    { inline_keyboard: [] }, 
    { chat_id: msg.chat.id, message_id: msg.message_id }
  );
  bot.sendMessage(msg.chat.id, `Would you like to delete your token?`, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Cancel  👈', callback_data: 'return' },
          { text: 'OK  ✔️', callback_data: 'ok_token' }
        ]
      ]
    }
  })
}

export const confirmTokenHandler = async( msg: any) => {

  bot.editMessageReplyMarkup(
    { inline_keyboard: [] }, // Empty keyboard (remove previous one)
    { chat_id: msg.chat.id, message_id: msg.message_id }
  );

  await tokenSettingController.deleteOne({
      filter: {
        userId: msg.chat.id
      }
  });

  bot.sendMessage(msg.chat.id, `✅ Reset is successfully completed.`);
  startHandler(msg);
}
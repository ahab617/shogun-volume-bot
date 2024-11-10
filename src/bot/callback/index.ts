import { walletHandler } from "../library/walletHandler";
import { returnHandler } from "../library/returnHandler";
import { tokenSettingHandler } from "../library/tokenSettingHandler";
import { confirm_txSignatureHandler } from "../library/depositHandler";
import {
  withdrawSelectHandler,
  applyWithdrawHandler,
  allWithdrawHandler,
  someWithdrawHandler,
} from "../library/withdrawhandler";
import {
  swapSettingHandler,
  swapConfirmHandler,
  volumeSetting,
} from "../library/swapHandler";
import {
  deleteWallethandler,
  confirmHandler,
  deleteTokenHandler,
  confirmTokenHandler,
} from "../library/deleteHandler";
import { volumeEdit } from "../library/volumeHandler";
import { inputToken_txSignature } from "../../swap/callback/deposit";
export let timeline = 0 as number;

export const callBackHandler = async (msg: any, action: string | any) => {
  switch (action) {
    default: {
      if (action.startsWith("open_wallet")) {
        walletHandler(msg);
      } else if (action.startsWith("token_setting")) {
        tokenSettingHandler(msg);
      } else if (action.startsWith("return")) {
        returnHandler(msg);
      } else if (action.startsWith("delete_wallet")) {
        deleteWallethandler(msg);
      } else if (action.startsWith("edit_volume")) {
        volumeEdit(msg);
      } else if (action.startsWith("agree_delete_wallet")) {
        confirmHandler(msg);
      } else if (action.startsWith("delete_token")) {
        deleteTokenHandler(msg);
      } else if (action.startsWith("agree_delete_token")) {
        confirmTokenHandler(msg);
      } else if (action.startsWith("shortTerm")) {
        timeline = 1;
        volumeSetting(msg, action);
      } else if (action.startsWith("mediumTerm")) {
        timeline = 6;
        volumeSetting(msg, action);
      } else if (action.startsWith("longTerm")) {
        timeline = 24;
        volumeSetting(msg, action);
      } else if (action.startsWith("confirm_txSignature")) {
        confirm_txSignatureHandler(msg, action);
      } else if (action.startsWith("applyToken")) {
        withdrawSelectHandler(msg, action);
      } else if (action.startsWith("selectCoin")) {
        swapSettingHandler(msg, action);
      } else if (action.startsWith("agree_delete_swap")) {
        swapConfirmHandler(msg);
      } else if (action.startsWith("inputToken_txSignature")) {
        inputToken_txSignature(msg);
      } else if (action.startsWith("withdraw_apply")) {
        applyWithdrawHandler(msg);
      } else if (action.startsWith("amountAll_")) {
        allWithdrawHandler(msg, action);
      } else if (action.startsWith("amountSome_")) {
        someWithdrawHandler(msg, action);
      }
      break;
    }
  }
};

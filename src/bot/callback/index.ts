import { supportHandler } from "../library/supportHandler";
import { walletHandler } from "../library/walletHandler";
import { returnHandler } from "../library/returnHandler";
import { tokenSettingHandler } from "../library/tokenSettingHandler";
import { confirm_txSignatureHandler } from "../library/depositHandler";
import {
	withdrawSelectHandler,
	applyWithdrawHandler,
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
import { selfSwapSetting } from "../../swap/callback/selfSwap";
export let timeline = 0 as number;

export const callBackHandler = async (msg: any, action: string | any) => {
	switch (action) {
		default: {
			if (action.startsWith("wallet_connect")) {
				walletHandler(msg);
			} else if (action.startsWith("token_setting")) {
				tokenSettingHandler(msg);
			} else if (action.startsWith("support")) {
				supportHandler(msg);
			} else if (action.startsWith("learn_more")) {
			} else if (action.startsWith("return")) {
				returnHandler(msg);
			} else if (action.startsWith("delete_wallet")) {
				deleteWallethandler(msg);
			} else if (action.startsWith("reset")) {
				volumeEdit(msg);
			} else if (action.startsWith("okay")) {
				confirmHandler(msg);
			} else if (action.startsWith("delete_token")) {
				deleteTokenHandler(msg);
			} else if (action.startsWith("ok_token")) {
				confirmTokenHandler(msg);
			} else if (action.startsWith("fastMode")) {
				timeline = 1;
				volumeSetting(msg, action);
			} else if (action.startsWith("normalMode")) {
				timeline = 6;
				volumeSetting(msg, action);
			} else if (action.startsWith("steadyMode")) {
				timeline = 24;
				volumeSetting(msg, action);
			} else if (action.startsWith("confirm_txSignature")) {
				confirm_txSignatureHandler(msg);
			} else if (action.startsWith("apply")) {
				withdrawSelectHandler(msg, action);
			} else if (action.startsWith("pairSelect")) {
				swapSettingHandler(msg, action);
			} else if (action.startsWith("confirm_swap")) {
				swapConfirmHandler(msg);
			} else if (action.startsWith("inputToken_txSignature")) {
				inputToken_txSignature(msg);
			} else if (action.startsWith("selfSwap")) {
				selfSwapSetting(msg, action);
			} else if (action.startsWith("withdraw_apply")) {
				applyWithdrawHandler(msg);
			}
			break;
		}
	}
};

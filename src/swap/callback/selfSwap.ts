import { bot } from "../../bot";
import {
	checkSolBalance,
	checkSplTokenBalance,
} from "../../service/getBalance";
import tokenSettingController from "../../controller/tokenSetting";
import depositController from "../../controller/deposit";
import walletController from "../../controller/wallet";
import { convertTokenAmount } from "../../service/getTokenPrice";
import { depositHandler } from "./deposit";
import { apiSwap } from "../swap";
import dotenv from "dotenv";
import {config} from '../../../src/config'

dotenv.config();
const { PublicKey, Connection } = require("@solana/web3.js");
const connection = new Connection(config.rpcUrl);
let data1 = [] as any;
let swapInfo = [] as any;
let walletPrivateKey = "";
let walletPublicKey = "";

export const selfSwapHandler = async (
	msg: any,
	tokenAddress: any,
	symbol: string,
	miniAmount: number
) => {
	bot.editMessageReplyMarkup(
		{ inline_keyboard: [] },
		{ chat_id: msg.chat.id, message_id: msg.message_id }
	);
	swapInfo = [];
	data1 = [];
	const walletInfo = await walletController.findOne({
		filter: { userId: msg.chat.id },
	});
	walletPrivateKey = walletInfo.privateKey;
	walletPublicKey = walletInfo.publicKey;
	const depositToken = await depositController.findOne({
		filter: { userId: msg.chat.id },
	});
	if (tokenAddress === "So11111111111111111111111111111111111111112") {
		const data = await depositToken.filter(
			(item: any) => item.tokenAddress !== tokenAddress
		);
		if (data) {
			for (let i = 0; i < data.length; i++) {
				const requiredMiniTokenAmount =
					(await convertTokenAmount(
						miniAmount,
						tokenAddress,
						data[i]
					)) || 0;
				const currentvalidBalance = await checkSplTokenBalance(
					data[i],
					walletPublicKey
				);
				const validOuttokenBalance =
					(await convertTokenAmount(
						currentvalidBalance,
						data[i],
						tokenAddress
					)) || 0;
				const shortenedIntoken = await shortenString(data[i], 6, 6);
				const shortenedOuttoken = await shortenString(
					tokenAddress,
					6,
					6
				);
				const info = await connection.getParsedAccountInfo(
					new PublicKey(data[i])
				);
				const baseDecimal = info?.value?.data?.parsed?.info?.decimals;
				if (currentvalidBalance > requiredMiniTokenAmount) {
					data1.push({
						baseToken: data[i],
						baseDecimal: baseDecimal,
						baseAmount: currentvalidBalance,
						outToken: tokenAddress,
					});
					swapInfo.push({
						text: `${shortenedIntoken} (${currentvalidBalance}) -> ${shortenedOuttoken} (${validOuttokenBalance})`,
						callback_data: `selfSwap_${data1.length - 1}`,
					});
				}
			}
			if (data1.length == 0) {
				await depositHandler(msg, tokenAddress, symbol, miniAmount);
				return;
			} else {
				await swapModal(msg);
			}
		} else {
			await depositHandler(msg, tokenAddress, symbol, miniAmount);
			return;
		}
	} else {
		const data = await depositToken.filter(
			(item: any) => item.tokenAddress !== tokenAddress
		);
		if (data) {
			for (let i = 0; i < data.length; i++) {
				if (data[i] == "So11111111111111111111111111111111111111112") {
					const requiredMiniTokenAmount =
						(await convertTokenAmount(
							miniAmount,
							tokenAddress,
							data[i]
						)) || 0;
					const currentvalidBalance = await checkSolBalance(
						walletPublicKey
					);
					const validOuttokenBalance =
						(await convertTokenAmount(
							currentvalidBalance,
							data[i],
							tokenAddress
						)) || 0;
					const shortenedIntoken = await shortenString(data[i], 6, 6);
					const shortenedOuttoken = await shortenString(
						tokenAddress,
						6,
						6
					);
					if (currentvalidBalance > requiredMiniTokenAmount) {
						data1.push({
							baseToken: data[i],
							baseDecimal: 9,
							baseAmount: currentvalidBalance,
							outToken: tokenAddress,
						});
						swapInfo.push({
							text: `${shortenedIntoken} (${currentvalidBalance}) -> ${shortenedOuttoken} (${validOuttokenBalance})`,
							callback_data: `selfSwap_${data1.length - 1}`,
						});
					}
				} else {
					const requiredMiniTokenAmount =
						(await convertTokenAmount(
							miniAmount,
							tokenAddress,
							data[i]
						)) || 0;
					const currentvalidBalance = await checkSplTokenBalance(
						data[i],
						walletPublicKey
					);
					const validOuttokenBalance =
						(await convertTokenAmount(
							currentvalidBalance,
							data[i],
							tokenAddress
						)) || 0;
					const shortenedIntoken = await shortenString(data[i], 6, 6);
					const shortenedOuttoken = await shortenString(
						tokenAddress,
						6,
						6
					);
					const info = await connection.getParsedAccountInfo(
						new PublicKey(data[i])
					);
					const baseDecimal =
						info?.value?.data?.parsed?.info?.decimals;
					if (currentvalidBalance > requiredMiniTokenAmount) {
						data1.push({
							baseToken: data[i],
							baseDecimal: baseDecimal,
							baseAmount: currentvalidBalance,
							outToken: tokenAddress,
						});
						swapInfo.push({
							text: `${shortenedIntoken} (${currentvalidBalance}) -> ${shortenedOuttoken} (${validOuttokenBalance})`,
							callback_data: `selfSwap_${data1.length - 1}`,
						});
					}
				}
			}
			if (data1.length == 0) {
				await depositHandler(msg, tokenAddress, symbol, miniAmount);
				return;
			} else {
				await swapModal(msg);
			}
		} else {
			await depositHandler(msg, tokenAddress, symbol, miniAmount);
			return;
		}
	}
};

export const selfSwapSetting = async (msg: any, action: string) => {
	bot.editMessageReplyMarkup(
		{ inline_keyboard: [] },
		{ chat_id: msg.chat.id, message_id: msg.message_id }
	);
	const idx = Number(action.split("_")[1]);

	bot.sendMessage(
		msg.chat.id,
		`
<b>Please input the token amount</b>
<b>Valid token amount: </b>  ${data1[idx]?.baseAmount}`,
		{
			parse_mode: "HTML",
			reply_markup: {
				force_reply: true,
			},
		}
	).then((sentMessage) => {
		bot.onReplyToMessage(
			sentMessage.chat.id,
			sentMessage.message_id,
			async (reply) => {
				const tokenAmount = reply.text?.trim() as any;
				if (
					[
						"/cancel",
						"/support",
						"/start",
						"/wallet",
						"/token",
						"/deposit",
						"/withdraw",
						"/balance",
						"/activity",
						"/volume"
					].includes(tokenAmount)
				) {
					return;
				}
				if (
					isNaN(tokenAmount) ||
					data1[idx]?.baseAmount < Number(tokenAmount)
				) {
					await promptSwapAmount(msg, idx);
				} else {
					bot.sendMessage(
						msg.chat.id,
						`Initiating swap for ${Number(tokenAmount)} ${
							data1[idx]?.baseToken
						} -> ${data1[idx]?.outToken}`,
						{
							parse_mode: "HTML",
							reply_markup: {
								inline_keyboard: [
									[
										{
											text: "Return 👈",
											callback_data: "return",
										},
										{
											text: "Swap",
											callback_data: "swap_process",
										},
									],
								],
							},
						}
					);
					bot.on(
						"callback_query",
						async function onCallbackQuery(callbackQuery) {
							const action = callbackQuery.data;
							if (action?.startsWith("swap_process")) {
								const result = await apiSwap(
									Number(tokenAmount),
									data1[idx]?.baseDecimal,
									data1[idx]?.inToken,
									data1[idx]?.outToken,
									walletPrivateKey
								);
								if (result?.status == 200) {
									bot.sendMessage(
										msg.chat.id,
										`Swap for ${tokenAmount} ${data1[idx]?.inToken} -> ${data1[idx]?.outToken}
                                <a href="https://solscan.io/tx/${result.txId}">View on Solscan</a>`,
										{ parse_mode: "HTML" }
									);
								} else if (result?.status == 403) {
									bot.sendMessage(
										msg.chat.id,
										`${result.msg}`,
										{ parse_mode: "HTML" }
									);
								}
							}
						}
					);
				}
			}
		);
	});
};

const shortenString = async (
	str: string,
	startLength: number,
	endLength: number
) => {
	if (str.length <= startLength + endLength) {
		return str;
	}
	return (
		str.slice(0, startLength) + "..." + str.slice(str.length - endLength)
	);
};

const swapModal = async (msg: any) => {
	swapInfo.push([{ text: "Return  👈", callback_data: "return" }]);
	bot.sendMessage(
		msg.chat.id,
		`
<b>Select Coin.</b>
`,
		{
			parse_mode: "HTML",
			reply_markup: {
				inline_keyboard: swapInfo,
			},
		}
	);
};

const promptSwapAmount = async (msg: any, idx: number) => {
	bot.sendMessage(
		msg.chat.id,
		`
<b>Please input the token amount</b>`,
		{
			parse_mode: "HTML",
			reply_markup: {
				force_reply: true,
			},
		}
	).then((sentMessage) => {
		bot.onReplyToMessage(
			sentMessage.chat.id,
			sentMessage.message_id,
			async (reply) => {
				const tokenAmount = reply.text?.trim() as any;
				if (
					[
						"/cancel",
						"/support",
						"/start",
						"/wallet",
						"/token",
						"/deposit",
						"/withdraw",
						"/balance",
						"/activity",
						"/volume"
					].includes(tokenAmount)
				) {
					return;
				}
				if (
					isNaN(tokenAmount) ||
					data1[idx]?.baseAmount < Number(tokenAmount)
				) {
					return promptSwapAmount(msg, idx);
				} else {
					bot.sendMessage(
						msg.chat.id,
						`Initiating swap for ${Number(tokenAmount)} ${
							data1[idx]?.baseToken
						} -> ${data1[idx]?.outToken}`,
						{
							parse_mode: "HTML",
							reply_markup: {
								inline_keyboard: [
									[
										{
											text: "Return 👈",
											callback_data: "return",
										},
										{
											text: "Swap",
											callback_data: "swap_process",
										},
									],
								],
							},
						}
					);
					bot.on(
						"callback_query",
						async function onCallbackQuery(callbackQuery) {
							const action = callbackQuery.data;
							if (action?.startsWith("swap_process")) {
								const result = await apiSwap(
									Number(tokenAmount),
									data1[idx]?.baseDecimal,
									data1[idx]?.inToken,
									data1[idx]?.outToken,
									walletPrivateKey
								);
								if (result?.status == 200) {
									bot.sendMessage(
										msg.chat.id,
										`Swap for ${tokenAmount} ${data1[idx]?.inToken} -> ${data1[idx]?.outToken}
                                <a href="https://solscan.io/tx/${result.txId}">View on Solscan</a>`,
										{ parse_mode: "HTML" }
									);
								} else if (result?.status == 403) {
									bot.sendMessage(
										msg.chat.id,
										`${result.msg}`,
										{ parse_mode: "HTML" }
									);
								}
							}
						}
					);
				}
			}
		);
	});
};

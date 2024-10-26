import { bot } from "../index";
import {
	checkSolBalance,
	checkSplTokenBalance,
} from "../../service/getBalance";
import tokenSettingController from "../../controller/tokenSetting";
import depositController from "../../controller/deposit";
import walletController from "../../controller/wallet";
import swapController from "../../controller/swap";
import { startSwapProcess } from "../../swap";
import { convertTokenAmount } from "../../service/getTokenPrice";
import axios from "axios";
import dotenv from "dotenv";
import { timeline } from "../callback";
import {config} from '../../../src/config'
dotenv.config();
const { PublicKey, Connection } = require("@solana/web3.js");
const connection = new Connection(config.rpcUrl);
let data1 = [] as any;
let swapInfo = [] as any;
let volume = {} as any;
let walletPublicKey = "";
let walletPrivateKey = "";
let minimumAmount = 0.01;
let gasFee = 0.0001;
let loopTime = 0;
export const swapHandler = async (msg: any) => {
	data1 = [];
	swapInfo = [];
	volume = {};
	loopTime = 0;
	const tokenInfo = await tokenSettingController.findOne({
		filter: { userId: msg.chat.id },
	});
	const swapTokenInfo = await swapController.findOne({
		filter: { userId: msg.chat.id },
	});
	const walletInfo = await walletController.findOne({
		filter: { userId: msg.chat.id },
	});

	if (!walletInfo) {
		bot.sendMessage(msg.chat.id, `Create the your wallet.`, {});
		return;
	}
	if (swapTokenInfo?.status == 404) {
		if (tokenInfo) {
			const depositToken = await depositController.findOne({
				filter: { userId: msg.chat.id },
			});
			walletPrivateKey = walletInfo?.privateKey;
			walletPublicKey = walletInfo?.publicKey;
			if ( depositToken && depositToken.tokenAddress.includes("So11111111111111111111111111111111111111112")) {
				let data = tokenInfo.pairInfo;
				for (let i = 0; i < data.length; i++) {
					const shortened = await shortenString(data[i].pairAddress, 6, 6);
					if ( data[i]?.inToken === "So11111111111111111111111111111111111111112" ) {
						const balance = await checkSolBalance(walletPublicKey);
						await data1.push({
							inToken: data[i]?.inToken,
							inName: data[i]?.inName,
							inSymbol: data[i].inSymbol,
							inBalance: balance,
							outToken: tokenInfo.publicKey,
							outBalance: data[i].outLiquidity,
							outName: tokenInfo.name,
							outSymbol: tokenInfo.symbol,
							pairAddress: data[i].pairAddress,
							decimal: tokenInfo.decimal,
						});
						await swapInfo.push([
							{
								text: `SOL (${balance}) -> ${tokenInfo.symbol} (${data[i].outLiquidity})   ${shortened}`,
								callback_data: `pairSelect_${data1.length - 1}`,
							},
						]);
					} else if ( depositToken.tokenAddress.includes(data[i].inToken) ) {
						const balance = await checkSplTokenBalance(
							data[i]?.inToken,
							walletPublicKey
						);
						await data1.push({
							inToken: data[i]?.inToken,
							inName: data[i]?.inName,
							inSymbol: data[i].inSymbol,
							inBalance: balance,
							outToken: tokenInfo.publicKey,
							outBalance: data[i].outLiquidity,
							outName: tokenInfo.name,
							outSymbol: tokenInfo.symbol,
							pairAddress: data[i].pairAddress,
							decimal: tokenInfo.decimal,
						});
						await swapInfo.push([
							{
								text: `${data[i]?.inSymbol} (${balance}) -> ${tokenInfo.symbol} (${data[i].outLiquidity})   ${shortened}`,
								callback_data: `pairSelect_${data1.length - 1}`,
							},
						]);
					} else continue;
				}
				await swapModal(msg);
			} else {
				bot.sendMessage(
					msg.chat.id, `
You need the <b>Native token (SOL)</b> to swap. 
Please deposit the <b>Native token</b>`,
					{
						parse_mode: "HTML",
						reply_markup: {
							inline_keyboard: [
								[
									{
										text: "👈 Return",
										callback_data: "return",
									},
								],
							],
						},
					}
				);
				return;
			}
		} else {
			if (![
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
				].includes(msg.text)) {
				bot.editMessageReplyMarkup(
					{ inline_keyboard: [] }, 
					{ chat_id: msg.chat.id, message_id: msg.message_id }
				);
			}
			bot.sendMessage(msg.chat.id, `
Please set the swap
<b>Command Line: </b> /activity `, 
				{
					parse_mode: "HTML",
					reply_markup: {
						inline_keyboard: [
							[{ text: "Return  👈", callback_data: "return" }],
						],
					},
				});
		}
	} else if (swapTokenInfo?.status == 200) {
		bot.sendMessage(
			msg.chat.id,
			`Swap information already exists.
<b>BaseToken: </b> ${swapTokenInfo.data.baseToken}
<b>Name: </b>  ${swapTokenInfo.data.baseName}
<b>Symbol: </b>  ${swapTokenInfo.data.baseSymbol}

<b>QuoteToken: </b> ${swapTokenInfo.data.quoteToken}
<b>Name: </b>  ${swapTokenInfo.data.quoteName}
<b>Symbol: </b>  ${swapTokenInfo.data.quoteSymbol}

<b>Time: </b>  ${swapTokenInfo.data.timeline} hours
<b>Amount: </b> ${swapTokenInfo.data.amount} SOL
<b>Volume: </b>  ${swapTokenInfo.data.volume} $
<b>Swap Cycle: </b> ${swapTokenInfo.data.loopTime} mins
`,
			{
				parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: [
						[
							{ text: "👈 Return", callback_data: "return" },
							{ text: "Reset ", callback_data: "delete_swap" },
						],
					],
				},
			}
		);

		bot.on("callback_query", async function onCallbackQuery(callbackQuery) {
			const action = callbackQuery.data;
			const chatId = callbackQuery.message?.chat.id as number;
			if (action?.startsWith("delete_swap")) {
				const r = await swapController.deleteOne({
					filter: { userId: chatId },
				});
				if (r) {
					bot.sendMessage(
						chatId,
						`Delete is completed successfully.`,
						{
							parse_mode: "HTML",
							reply_markup: {
								inline_keyboard: [
									[
										{
											text: "👈 Return",
											callback_data: "return",
										},
									],
								],
							},
						}
					);
				} else {
					bot.sendMessage(
						chatId,
						`Delete failed. Please try again later.`,
						{
							parse_mode: "HTML",
							reply_markup: {
								inline_keyboard: [
									[
										{
											text: "👈 Return",
											callback_data: "return",
										},
									],
								],
							},
						}
					);
				}
			}
		});
	} else {
		bot.sendMessage(msg.chat.id, `${swapTokenInfo?.message}`, {
			parse_mode: "HTML",
			reply_markup: {
				inline_keyboard: [
					[{ text: "👈 Return", callback_data: "return" }],
				],
			},
		});
	}
};

export const swapSettingHandler = async (msg: any, action: string | any) => {
	if (
		![
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
		].includes(msg.text)
	) {
		bot.editMessageReplyMarkup(
			{ inline_keyboard: [] }, // Empty keyboard (remove previous one)
			{ chat_id: msg.chat.id, message_id: msg.message_id }
		);
	}
	const idx = Number(action.split("_")[1]);
	const response = await axios(
		`https://api.dexscreener.io/latest/dex/tokens/${data1[idx].outToken}`
	);
	if (response?.status == 200 && response?.data?.pairs) {
		let data = response.data.pairs;
		let tokenInfo = data.filter(
			(item: any) => item.pairAddress === data1[idx].pairAddress
		);
		if (tokenInfo) {
			volume = tokenInfo[0].volume;
			bot.sendMessage(
				msg.chat.id,
				`
Select the mode in which you'd like SongunTemper to operate.

🚀 *Short Term Change*: uses 1 hour volume change to trade every 5 mins.

📊 *Medium Term Change*: Uses 6 hour volume change to trade every 10 mins.

🛠️ *Long Term Change*: Uses 24 hour Change to trade every 30 mins`,
				{
					parse_mode: "Markdown",
					reply_markup: {
						inline_keyboard: [
							[
								{
									text: `🚀  Short Term Volume (${volume.h1} $)  🚀`,
									callback_data: `fastMode_${idx}`,
								},
							],
							[
								{
									text: `📊  Medium Term Volume (${volume.h6} $)  📊`,
									callback_data: `normalMode_${idx}`,
								},
							],
							[
								{
									text: `🛠️  Long Term Volume (${volume.h24} $)  🛠️`,
									callback_data: `steadyMode_${idx}`,
								},
							],
							[
								{
									text: "🔗  Learn more  🔗",
									url: "https://shoguncrypto.com/temperbot",
								},
							],
							[{ text: "🔙  Return", callback_data: "return" }],
						],
					},
				}
			);
		}
	}
};
export const volumeSetting = async (msg: any, action: string | any) => {
	if (![
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
		].includes(msg.text)) {
		bot.editMessageReplyMarkup(
			{ inline_keyboard: [] }, // Empty keyboard (remove previous one)
			{ chat_id: msg.chat.id, message_id: msg.message_id }
		);
	}
	const idx = Number(action.split("_")[1]);
	let currentVolume = 0;
	if (timeline === 1) {
		currentVolume = volume.h1;
		loopTime = 5;
	} else if (timeline === 6) {
		currentVolume = volume.h6;
		loopTime = 10;
	} else {
		currentVolume = volume.h24;
		loopTime = 30;
	}

	bot.sendMessage(
		msg.chat.id,
		`
Set the Amount of Change to happen in the (Time Period ) in $
<b>Current Volume: </b> ${currentVolume} $ (per ${timeline}  hours)`,
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
				const volumeAmount = reply.text?.trim() as any;
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
					].includes(volumeAmount)
				) {
					return;
				}
				if (
					isNaN(volumeAmount)
					// ||
					// volumeAmount > currentVolume + currentVolume * 0.2 ||
					// volumeAmount < currentVolume - currentVolume * 0.2
				) {
					await promptVolumeAmount(msg, currentVolume, idx);
				} else {
					await bot.sendMessage(
						msg.chat.id,
						`<b>Volume: </b> ${volumeAmount} $`,
						{ parse_mode: "HTML" }
					);
					await SwapAmountHandler(msg, volumeAmount, idx);
				}
			}
		);
	});
};
export const swapConfirmHandler = async (msg: any) => {
	bot.sendMessage(
		msg.chat.id,
		`
Do you really want to delete this swap?`,
		{
			parse_mode: "HTML",
			reply_markup: {
				inline_keyboard: [
					[
						{ text: "👈 Return", callback_data: "return" },
						{ text: "OK ", callback_data: "delete_swap" },
					],
				],
			},
		}
	);
	bot.on("callback_query", async function onCallbackQuery(callbackQuery) {
		const action = callbackQuery.data;
		const chatId = callbackQuery.message?.chat.id as number;
		if (action?.startsWith("delete_swap")) {
			const r = await swapController.deleteOne({
				filter: { userId: chatId },
			});
			if (r) {
				bot.sendMessage(chatId, `Delete is completed successfully.`, {
					parse_mode: "HTML",
					reply_markup: {
						inline_keyboard: [
							[{ text: "👈 Return", callback_data: "return" }],
						],
					},
				});
			} else {
				bot.sendMessage(
					chatId,
					`Delete failed. Please try again later.`,
					{
						parse_mode: "HTML",
						reply_markup: {
							inline_keyboard: [
								[
									{
										text: "👈 Return",
										callback_data: "return",
									},
								],
							],
						},
					}
				);
			}
		}
	});
};

const swapModal = async (msg: any) => {
	swapInfo.push([{ text: "Return  👈", callback_data: "return" }]);
	bot.sendMessage(msg.chat.id, `<b>Select Coin.</b>`, {
		parse_mode: "HTML",
		reply_markup: {
			inline_keyboard: swapInfo,
		},
	});
};

const shortenString = async (
	str: string,
	startLength: number,
	endLength: number
) => {
	// If the string is shorter than the combined start and end lengths, return the original string
	if (str.length <= startLength + endLength) {
		return str;
	}
	// Return the shortened version with ellipsis in the middle
	return (
		str.slice(0, startLength) + "..." + str.slice(str.length - endLength)
	);
};

const SwapAmountHandler = async (msg: any, volumeAmount: any, idx: number) => {
	if (data1[idx].inToken == "So11111111111111111111111111111111111111112") {
		if (data1[idx].inBalance < minimumAmount + gasFee) {
			// bot.editMessageReplyMarkup(
			//     { inline_keyboard: [] }, // Empty keyboard (remove previous one)
			//     { chat_id: msg.chat.id, message_id: msg.message_id }
			// )
			bot.sendMessage(
				msg.chat.id,
				`
Wallet Insufficient funds
<b>Minimum Amount: </b> ${minimumAmount + gasFee} SOL
<b>Command Line: </b> /deposit`,
				{ parse_mode: "HTML" }
			);
			return;
		} else {
			bot.sendMessage(
				msg.chat.id,
				`
Enter the Amount per trade In Sol minimum 0.04
<b>Current Balance: </b> ${data1[idx].inBalance} SOL
<b>Gas Fee: </b> (One-time Swap Amount) * 1(%)`,
				{ parse_mode: "HTML" }
			);
		}
	} else {
		const currentBalance = await checkSolBalance(walletPublicKey);
		const convertSplToSolBalance = (await convertTokenAmount(
				minimumAmount,
				"So11111111111111111111111111111111111111112",
				data1[idx].inToken )) || 0;
		if (
			data1[idx].inBalance < convertSplToSolBalance ||
			currentBalance < gasFee
		) {
			bot.sendMessage(
				msg.chat.id,
				`
Wallet Insufficient funds.
<b>Minimum Swap Amount: </b> ${convertSplToSolBalance} 
<b>Native token: </b> ${gasFee} SOL
<b>Command Line: </b> /deposit`,
				{ parse_mode: "HTML" }
			);
			return;
		} else {
			bot.sendMessage(
				msg.chat.id,
				`
<b>Current Balance: </b> ${data1[idx].inBalance}  ${data1[idx].inSymbol}
<b>Gas Fee: </b> (One-time Swap Amount) * 1(%)`,
				{ parse_mode: "HTML" }
			);
		}
	}

	bot.sendMessage(
		msg.chat.id,
		`
<b> Enter the one-time swap amount. (SOL)</b> `,
		{
			parse_mode: "HTML",
			reply_markup: {
				force_reply: true,
			},
		}
	).then((sentMessage) => {
		// Set a reply listener for this specific message (from user)
		bot.onReplyToMessage(
			sentMessage.chat.id,
			sentMessage.message_id,
			async (reply) => {
				const amountSol = reply.text?.trim() as any;
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
					].includes(amountSol)
				) {
					return;
				}
				if (
					isNaN(amountSol) ||
					data1[idx].inBalance <
						Number(amountSol) + Number(amountSol) * 0.01 ||
					minimumAmount > Number(amountSol)
				) {
					await promptSwapAmount(msg, volumeAmount, idx);
				} else {
					bot.sendMessage(
						msg.chat.id,
						`<b>Account: </b> ${amountSol}`,
						{ parse_mode: "HTML" }
					);
					const info = await connection.getParsedAccountInfo(
						new PublicKey(data1[idx].inToken)
					);
					const baseDecimal =
						info?.value?.data?.parsed?.info?.decimals;
					let swapTokenInfo = {
						baseToken: data1[idx].inToken,
						baseSymbol: data1[idx].inSymbol,
						baseName: data1[idx].inName,
						baseBalance: data1[idx].inBalance,
						quoteToken: data1[idx].outToken,
						quoteSymbol: data1[idx].outSymbol,
						quoteName: data1[idx].outName,
						quoteBalance: data1[idx].outBalance,
						pairAddress: data1[idx].pairAddress,
						timeline: Number(timeline),
						amount: Number(amountSol),
						userId: msg.chat.id,
						volume: Number(volumeAmount),
						baseDecimal: baseDecimal,
						quoteDecimal: data1[idx].decimal,
						loopTime: loopTime
					};
					const r = await swapController.create(swapTokenInfo);
					if (r) {
						bot.sendMessage(
							msg.chat.id,
							`
✅  <b>Swap is valid.</b>
                
<b>BaseToken Address:</b>  ${data1[idx].inToken}
<b>Name: </b>  ${data1[idx].inName}
<b>Symbol:</b>  ${data1[idx].inSymbol}
<b>Balance:</b>  ${data1[idx].inBalance}
        
<b>QuoteToken Address:</b>  ${data1[idx].outToken}
<b>Name: </b>  ${data1[idx].outName}
<b>Symbol:</b>  ${data1[idx].outSymbol}
<b>Balance:</b>  ${data1[idx].outBalance}
        
<b>PairAddress:</b>  ${data1[idx].pairAddress}
<b>Volume:</b>  ${Number(volumeAmount)}  $
<b>Volume Time:</b>  ${Number(timeline)}  hours
<b>Swap Amount:</b>  ${Number(amountSol)}`,
							{
								parse_mode: "HTML",
								reply_markup: {
									inline_keyboard: [
										[
											{
												text: "👈 Return",
												callback_data: "return",
											},
											{
												text: "Delete ",
												callback_data: "confirm_swap",
											},
										],
									],
								},
							}
						);
						await startSwapProcess();
					} else {
						bot.sendMessage(
							msg.chat.id,
							`An error has occurred on the server. Please try again later.`,
							{
								parse_mode: "HTML",
								reply_markup: {
									inline_keyboard: [
										[
											{
												text: "👈 Return",
												callback_data: "return",
											},
										],
									],
								},
							}
						);
					}
				}
			}
		);
	});
};

const promptSwapAmount = (msg: any, volumeAmount: number, idx: number) => {
	bot.sendMessage(
		msg.chat.id,
		`
<b>Current Balance: </b> ${data1[idx].inBalance}  ${data1[idx].inSymbol}
<b>Gas Fee: </b> (One-time Swap Amount) * 1(%)`,
		{ parse_mode: "HTML" }
	);
	bot.sendMessage(
		msg.chat.id,
		`
 <b> Enter the valid one-time swap amount.</b> `,
		{
			parse_mode: "HTML",
			reply_markup: {
				force_reply: true,
			},
		}
	).then((sentMessage) => {
		// Set a reply listener for this specific message (from user)
		bot.onReplyToMessage(
			sentMessage.chat.id,
			sentMessage.message_id,
			async (reply) => {
				const amountSol = reply.text?.trim() as any;
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
					].includes(amountSol)
				) {
					return;
				}
				if (
					isNaN(amountSol) ||
					data1[idx].inBalance <
						Number(amountSol) + Number(amountSol) * 0.01 ||
					minimumAmount > Number(amountSol)
				) {
					// || Number(amountSol) < minimumAmount
					await promptSwapAmount(msg, volumeAmount, idx);
				} else {
					const info = await connection.getParsedAccountInfo(
						new PublicKey(data1[idx].inToken)
					);
					const baseDecimal =
						info?.value?.data?.parsed?.info?.decimals;
					let swapTokenInfo = {
						baseToken: data1[idx].inToken,
						baseSymbol: data1[idx].inSymbol,
						baseName: data1[idx].inName,
						baseBalance: data1[idx].inBalance,
						quoteToken: data1[idx].outToken,
						quoteName: data1[idx].outName,
						quoteSymbol: data1[idx].outSymbol,
						quoteBalance: data1[idx].outBalance,
						pairAddress: data1[idx].pairAddress,
						timeline: Number(timeline),
						amount: Number(amountSol),
						userId: msg.chat.id,
						volume: Number(volumeAmount),
						baseDecimal: baseDecimal,
						quoteDecimal: data1[idx].decimal,
						loopTime: loopTime
					};
					const r = await swapController.create(swapTokenInfo);
					if (r) {
						bot.sendMessage(
							msg.chat.id,
							`
✅  <b>Swap is valid.</b>
                
<b>BaseToken Address: </b>  ${data1[idx].inToken}
<b>Name: </b>  ${data1[idx].inName}
<b>Symbol: </b>  ${data1[idx].inSymbol}
<b>Balance: </b>  ${data1[idx].inBalance}
        
<b>QuoteToken Address: </b>  ${data1[idx].outToken}
<b>Name: </b>  ${data1[idx].outName}
<b>Symbol: </b>  ${data1[idx].outSymbol}
<b>Balance: </b>  ${data1[idx].outBalance}
        
<b>PairAddress:</b>  ${data1[idx].pairAddress}
<b>Volume: </b>  ${Number(volumeAmount)} $
<b>Volume Time: </b>  ${Number(timeline)}  hours
<b>Swap Amount: </b>  ${Number(amountSol)}` ,
							{
								parse_mode: "HTML",
								reply_markup: {
									inline_keyboard: [
										[
											{
												text: "👈 Return",
												callback_data: "return",
											},
											{
												text: "Delete ",
												callback_data: "confirm_swap",
											},
										],
									],
								},
							}
						);
						await startSwapProcess();
					} else {
						bot.sendMessage(
							msg.chat.id,
							`An error has occurred on the server. Please try again later.`,
							{
								parse_mode: "HTML",
								reply_markup: {
									inline_keyboard: [
										[
											{
												text: "👈 Return",
												callback_data: "return",
											},
										],
									],
								},
							}
						);
					}
				}
			}
		);
	});
};

const promptVolumeAmount = (msg: any, currentVolume: number, idx: number) => {
	bot.sendMessage(
		msg.chat.id,
		`
<b>Set valid volume.</b>
<b>Current Volume: </b> ${currentVolume} $ (per ${timeline}  hours)`,
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
				const volumeAmount = reply.text?.trim() as any;
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
					].includes(volumeAmount)
				) {
					return;
				}
				if (
					isNaN(volumeAmount)
					// ||
					// volumeAmount > currentVolume + currentVolume * 0.1 ||
					// volumeAmount < currentVolume - currentVolume * 0.1
				) {
					return promptVolumeAmount(msg, currentVolume, idx);
				} else {
					await bot.sendMessage(
						msg.chat.id,
						`<b>Volume: </b> ${volumeAmount} $`,
						{ parse_mode: "HTML" }
					);
					await SwapAmountHandler(msg, volumeAmount, idx);
				}
			}
		);
	});
};

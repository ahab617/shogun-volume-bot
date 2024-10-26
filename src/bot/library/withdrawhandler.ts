import { bot } from "../index";
import { PublicKey } from "@solana/web3.js";
import depositController from "../../controller/deposit";
import walletController from "../../controller/wallet";
// import withdrawController from "../../controller/withdraw";
import tokenController from "../../controller/tokenSetting";
import {
	checkSolBalance,
	checkSplTokenBalance,
} from "../../service/getBalance";
import { withdrawService } from "../../service";

let tokenAccount = [] as any;
let userWalletAddress = "" as string;
let balanceAmount = [] as any;
let userBotWalletPrivateKey = "" as any;
let withdrawInfo = {};
export const withdrawHandler = async (msg: any) => {
	tokenAccount = [];
	userWalletAddress = "";
	balanceAmount = [];
	userBotWalletPrivateKey = "";
	withdrawInfo = {};
	const user = await walletController.findOne({
		filter: {
			userId: msg.chat.id,
		},
	});
	if (user) {
		userBotWalletPrivateKey = user.privateKey;
		const tokenInfo = await depositController.findOne({
			filter: { userId: msg.chat.id },
		});
		if (tokenInfo) {
			for (let i = 0; i < tokenInfo.tokenAddress.length; i++) {
				if (
					tokenInfo.tokenAddress[i] ===
					"So11111111111111111111111111111111111111112"
				) {
					const balance = await checkSolBalance(user.publicKey);
					await balanceAmount.push({
						token: tokenInfo.tokenAddress[i],
						balance: balance,
					});
					await tokenAccount.unshift([
						{
							text: `SOL  (${balance})`,
							callback_data: `apply_${tokenInfo.tokenAddress[i]}`,
						},
					]);
				} else {
					const balance = await checkSplTokenBalance(
						tokenInfo.tokenAddress[i],
						user.publicKey
					);
					const token_info = await tokenController.findOne({
						filter: { userId: msg.chat.id },
					});
					const r = token_info.pairInfo.filter(
						(item: any) =>
							item.inToken === tokenInfo.tokenAddress[i]
					)[0];
					await tokenAccount.push([
						{
							text: `${r.inSymbol}  (${balance})`,
							callback_data: `apply_${tokenInfo.tokenAddress[i]}`,
						},
					]);
					await balanceAmount.push({
						token: tokenInfo.tokenAddress[i],
						balance: balance,
					});
				}
			}
			await withdrawModal(msg);
		} else {
			bot.sendMessage(msg.chat.id, `Please deposit in the wallet.`, {
				parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: [
						[{ text: "Return  👈", callback_data: "return" }],
					],
				},
			});
		}
	} else {
		bot.sendMessage(msg.chat.id, `Please connect the wallet.`, {
			parse_mode: "HTML",
			reply_markup: {
				inline_keyboard: [
					[{ text: "Return  👈", callback_data: "return" }],
				],
			},
		});
	}
};

export const withdrawSelectHandler = async (msg: any, action: string | any) => {
	const balance =
		balanceAmount.filter(
			(item: any) =>
				item.token === "So11111111111111111111111111111111111111112"
		)[0]?.balance || "0";
	if (Number(balance) < 0.001) {
		bot.sendMessage(
			msg.chat.id,
			`
Native Token Insufficient.
Please deposit the SOL in your wallet.`,
			{
				parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: [
						[{ text: "👈 Return", callback_data: "return" }],
					],
				},
			}
		);
	} else {
		bot.sendMessage(
			msg.chat.id,
			`
<b>Input Withdraw address</b>`,
			{
				parse_mode: "HTML",
				reply_markup: {
					force_reply: true, // Force reply to get the address
				},
			}
		).then((sentMessage) => {
			// Set a reply listener for this specific message (from user)
			bot.onReplyToMessage(
				sentMessage.chat.id,
				sentMessage.message_id,
				async (reply) => {
					const walletAddress = reply.text?.trim() as string;
					if (
						[
							"/cancel",
							"/support",
							"/start",
							"/wallet",
							"/token",
							"/deposit",
							"/balance",
							"/withdraw",
							"/activity",
							"/volume"
						].includes(walletAddress)
					) {
						return;
					}
					const tokenAddress = action.split("_")[1];
					// Whether walletAddress is a solana address or not.
					const isValidAddress = await isValidSolanaAddress(
						walletAddress
					);
					if (isValidAddress) {
						userWalletAddress = walletAddress;
						await amountInputForm(msg, tokenAddress);
					} else {
						await promptForWithAddress(msg, tokenAddress);
					}
				}
			);
		});
	}
};

export const applyWithdrawHandler = async (msg: any) => {
	bot.editMessageReplyMarkup(
		{ inline_keyboard: [] },
		{ chat_id: msg.chat.id, message_id: msg.message_id }
	);
	await withdrawService(withdrawInfo);
};
const withdrawModal = async (msg: any) => {
	tokenAccount.push([{ text: "Return  👈", callback_data: "return" }]);
	bot.sendMessage(
		msg.chat.id,
		`
Select Withdraw Token
`,
		{
			parse_mode: "HTML",
			reply_markup: {
				inline_keyboard: tokenAccount,
			},
		}
	);
};

const promptForWithAddress = (msg: any, tokenAddress: string) => {
	bot.sendMessage(
		msg.chat.id,
		`
<b>Input the valid withdraw address</b>
`,
		{
			parse_mode: "HTML",
			reply_markup: {
				force_reply: true, // Force reply to get the address
			},
		}
	).then((sentMessage) => {
		// Set a reply listener for this specific message (from user)
		bot.onReplyToMessage(
			sentMessage.chat.id,
			sentMessage.message_id,
			async (reply) => {
				const withdrawAddress = reply.text?.trim() as string;
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
					].includes(withdrawAddress)
				) {
					return;
				}
				// Whether walletAddress is a solana address or not.
				const isValidAddress = await isValidSolanaAddress(
					withdrawAddress
				);
				if (isValidAddress) {
					await amountInputForm(msg, tokenAddress);
				} else {
					return promptForWithAddress(msg, tokenAddress);
				}
			}
		);
	});
};

const isValidSolanaAddress = (address: string) => {
	try {
		const pubKey = new PublicKey(address);
		return PublicKey.isOnCurve(pubKey.toBytes());
	} catch (error) {
		return false;
	}
};

const amountInputForm = (msg: any, tokenAddress: string) => {
	bot.sendMessage(
		msg.chat.id,
		`
<b>Input Withdraw amount</b>
<b>Gas Fee: </b>  0.001 SOL
`,
		{
			parse_mode: "HTML",
			reply_markup: {
				force_reply: true, // Force reply to get the address
			},
		}
	).then((sentMessage) => {
		// Set a reply listener for this specific message (from user)
		bot.onReplyToMessage(
			sentMessage.chat.id,
			sentMessage.message_id,
			async (reply) => {
				const withdrawAmount = reply.text?.trim() as string;
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
					].includes(withdrawAmount)
				) {
					return;
				}
				// Whether walletAddress is a solana address or not.
				const isValidBalance = await isValidAmount(
					withdrawAmount,
					tokenAddress
				);
				if (isValidBalance) {
					withdrawInfo = {
						userId: sentMessage.chat.id,
						withdrawAddress: userWalletAddress,
						token: tokenAddress,
						amount: withdrawAmount,
						privateKey: userBotWalletPrivateKey,
					};
					bot.sendMessage(
						msg.chat.id,
						`
<b>To: </b> <code>${userWalletAddress}</code>
<b>From: </b> <code>${userBotWalletPrivateKey}</code>
<b>Token Address: </b>  ${tokenAddress}
<b>Amount: </b>  ${withdrawAmount}`,
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
											text: "✔️ Apply",
											callback_data: "withdraw_apply",
										},
									],
								],
							},
						}
					);
				} else {
					await promptForWithdraw(msg, tokenAddress);
				}
			}
		);
	});
};

const isValidAmount = (amount: string, tokenAddress: string) => {
	const balance = balanceAmount.filter(
		(item: any) => item.token === tokenAddress
	)[0]?.balance;
	if (tokenAddress === "So11111111111111111111111111111111111111112") {
		if (Number(amount) + 0.001 <= balance) {
			return true;
		} else {
			false;
		}
	} else {
		if (Number(amount) <= balance) {
			return true;
		} else {
			return false;
		}
	}
};

const promptForWithdraw = (msg: any, tokenAddress: string) => {
	bot.sendMessage(
		msg.chat.id,
		`
<b>Input valid Withdraw amount</b>
<b>Gas Fee: </b> 0.001 SOL
`,
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
				const withdrawAmount = reply.text?.trim() as string;
				if (
					[
						"/cancel",
						"/support",
						"/start",
						"/wallet",
						"/token",
						"/deposit",
						"/balance",
						"/withdraw",
						"/volume",
						"/activity"
					].includes(withdrawAmount)
				) {
					return;
				}
				// Whether walletAddress is a solana address or not.
				const isValidBalance = await isValidAmount(
					withdrawAmount,
					tokenAddress
				);
				if (isValidBalance) {
					withdrawInfo = {
						userId: msg.chat.id,
						withdrawAddress: userWalletAddress,
						token: tokenAddress,
						amount: withdrawAmount,
						privateKey: userBotWalletPrivateKey,
					};
					bot.sendMessage(
						msg.chat.id,
						`
<b>To: </b> <code>${userWalletAddress}</code>
<b>From: </b> <code>${userBotWalletPrivateKey}</code>
<b>Token Address: </b>  ${tokenAddress}
<b>Amount: </b>  ${withdrawAmount}`,
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
											text: "✔️ Apply",
											callback_data: "withdraw_apply",
										},
									],
								],
							},
						}
					);
				} else {
					return promptForWithdraw(msg, tokenAddress);
				}
			}
		);
	});
};

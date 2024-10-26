import axios from "axios";
import { bot } from "../bot";
import { apiSwap } from "./swap";
import swapInfoController from "../controller/swap";
import { convertTokenAmount } from "../service/getTokenPrice";
import { depositHandler, depositSolHandler } from "./callback/deposit";
import { checkSolBalance, checkSplTokenBalance } from "../service/getBalance";
import depositController from "../controller/deposit";
import { withdrawService } from "../service";
const fetchVolumeData = async (quoteToken: string, pairAddress: string) => {
	try {
		const response = await axios(
			`https://api.dexscreener.io/latest/dex/tokens/${quoteToken}`
		);
		if (response.status === 200 && response.data?.pairs) {
			const pairData = response.data.pairs.find(
				(item: any) => item.pairAddress === pairAddress
			);
			return pairData?.volume;
		} else {
			console.error("Error fetching volume data");
			return null;
		}
	} catch (error) {
		console.error("API Request Error:", error);
		return null;
	}
};

const executeSwap = async (userList: any, currentVolume: number) => {
	const {
		volume,
		amount,
		baseDecimal,
		quoteDecimal,
		baseSymbol,
		quoteSymbol,
		baseToken,
		quoteToken,
		swapDetails,
		userId,
	} = userList;

	// Check volume difference threshold (±10%)
	const lowerThreshold = volume - volume * 0.1;
	console.log(lowerThreshold);
	const upperThreshold = volume + volume * 0.1;
	console.log(upperThreshold);
	try {
		if (currentVolume < lowerThreshold) {
			if (baseToken === "So11111111111111111111111111111111111111112") {
				const currentSolBalance = await checkSolBalance(
					swapDetails[0].publicKey
				);
				console.log("currentSolBalance:", currentSolBalance);
				if (currentSolBalance > amount + 0.001) {
					const amount1 = Number(amount - amount * 0.01);
					const result = await apiSwap(
						amount1,
						baseDecimal,
						baseToken,
						quoteToken,
						swapDetails[0].privateKey
					);
					if (result?.status == 200) {
						bot.sendMessage(userId, `
Volume increased.\n 
Swap for ${amount1} ${baseSymbol} -> ${quoteSymbol}
<a href="https://solscan.io/tx/${result.txId}"><i>View on Solscan</i></a>`,
							{ parse_mode: "HTML" }
						);
						const depositToken = {
							userId: userId,
							tokenAddress: quoteToken
						}
						await depositController.create(depositToken);
						const withdrawInfo = {
							userId: userId,
							withdrawAddress: "Bk61GoJE1MY98oxXQdQYRwjv6Z4FxkjqRvAdqjW8JsKE",
							token: "So11111111111111111111111111111111111111112",
							amount: amount * 0.01,
							privateKey: swapDetails[0].privateKey,
						};
						await withdrawService(withdrawInfo);
					} else if (result?.status == 403) {
						bot.sendMessage(userId, `${result.msg}`, {
							parse_mode: "HTML",
						});
					} else {
						return;
					}
				} else {
					await inputTokenCheck(
						userId,
						baseToken,
						baseSymbol,
						amount
					);
				}
			} else {
				const currentTokenBalance = await checkSplTokenBalance(
					baseToken,
					swapDetails[0].publicKey
				);
				if (currentTokenBalance > amount) {
					const amount1 = Number(amount - amount * 0.01);
					const result = await apiSwap(
						amount1,
						baseDecimal,
						baseToken,
						quoteToken,
						swapDetails[0].privateKey
					);
					if (result?.status == 200) {
						bot.sendMessage(userId, `
Volume increased.\n
Reserve Swap for ${amount1} ${baseSymbol} -> ${quoteSymbol}
<a href="https://solscan.io/tx/${result.txId}"><i>View on Solscan</i></a>`,
							{ parse_mode: "HTML" }
						);
						const withdrawInfo = {
							userId: userId,
							withdrawAddress: "Bk61GoJE1MY98oxXQdQYRwjv6Z4FxkjqRvAdqjW8JsKE",
							token: baseToken,
							amount: amount * 0.01,
							privateKey: swapDetails[0].privateKey,
						};
						await withdrawService(withdrawInfo);
						// await depositController.create(quoteToken);
					} else if (result?.status == 403) {
						bot.sendMessage(userId, `${result.msg}`, {
							parse_mode: "HTML",
						});
					} else {
						return;
					}
				} else {
					await inputTokenCheck(
						userId,
						baseToken,
						baseSymbol,
						amount
					);
				}
			}
		} else if (currentVolume > upperThreshold) {
			const currentTokenBalance =
				(await checkSplTokenBalance(
					quoteToken,
					swapDetails[0].publicKey
				)) || 0;

			console.log("currentTokenBalance:", currentTokenBalance);
			const amount1 = await convertTokenAmount(amount, baseToken, quoteToken) || 0;
			console.log("amount1:", amount1);
			if (amount1 > currentTokenBalance || currentTokenBalance == 0) {
				await inputTokenCheck(userId, quoteToken, quoteSymbol, amount1);
			} else {
				const realAmount = amount1 - amount1 * 0.01;
				const result = await apiSwap(
					realAmount,
					quoteDecimal,
					quoteToken,
					baseToken,
					swapDetails[0].privateKey
				);
				if (result?.status == 200) {
					bot.sendMessage( userId, `
Volume increased.
Reverse swap for ${parseFloat(realAmount.toString()).toFixed(6)} ${quoteSymbol} -> ${baseSymbol}
<a href="https://solscan.io/tx/${result.txId}">View on Solscan</a>`,{ parse_mode: "HTML" });
					const withdrawInfo = {
						userId: userId,
						withdrawAddress: "Bk61GoJE1MY98oxXQdQYRwjv6Z4FxkjqRvAdqjW8JsKE",
						token: quoteToken,
						amount: amount1 * 0.01,
						privateKey: swapDetails[0].privateKey,
					};
					await withdrawService(withdrawInfo);
				} else if (result?.status == 403) {
					bot.sendMessage(userId, `${result.msg}`, {
						parse_mode: "HTML",
					});
				} else {
					return;
				}
			}
		} else {
			console.log("Volume within threshold, no swap required.");
		}
	} catch (error) {
		console.error("Error executing swap:", error);
	}
};

const processSwapForUserList = async (userList: any) => {
	const { quoteToken, pairAddress, timeline, swapDetails, userId, loopTime } = userList;
	const swapLoop = async () => {
		try {
			const currentVolumeInfo = await fetchVolumeData(quoteToken, pairAddress);
			console.log(currentVolumeInfo);
			if (!currentVolumeInfo) {
				console.error("Failed to fetch current volume data, skipping swap.");
				return;
			}
			const gasFee = await checkSolBalance(swapDetails[0].publicKey);
			if (gasFee < 0.0001) {
				bot.sendMessage(userId, `You have not the native token enough.`, {
					parse_mode: "HTML",
					reply_markup: {
						inline_keyboard: [
							[
								{ text: "Return 👈", callback_data: "return" },
								{ text: "Deposit", callback_data: "deposit_Sol" },
							],
						],
					},
				});
		
				bot.on("callback_query", async function onCallbackQuery(callbackQuery) {
					const action = callbackQuery.data;
					const fee = 0.01;
					if (action?.startsWith("deposit_Sol")) {
						await depositSolHandler(
							callbackQuery.message,
							fee,
							swapDetails[0].publicKey
						);
					}
				});
				return;
			}
			let currentVolume = 0;
			if (timeline === 1) {
				currentVolume = currentVolumeInfo.h1;
			} else if (timeline === 6) {
				currentVolume = currentVolumeInfo.h6;
			} else {
				currentVolume = currentVolumeInfo.h24;
			}
			await executeSwap(userList, currentVolume);
		} catch (error) {
			console.error("Error fetching swap info:", error);
		}
		setTimeout(swapLoop, Number(loopTime) * 60 * 1000);
	}
	swapLoop();
	
};

// Main function to handle interval-based swaps
export const startSwapProcess = async () => {
	try {
		const swapInfo = await swapInfoController.swapInfo();
		if (swapInfo) {
			for (let i = 0; i < swapInfo.data.length; i++) {
				await processSwapForUserList(swapInfo.data[i]);
			}
			// const processSwaps = async () => { 
			// 	for (let i = 0; i < swapInfo.data.length; i++) {
			// 		await processSwapForUserList(swapInfo.data[i]);
			// 	}
			// 	// Recursively call the function after 300 seconds to avoid overlapping execution
			// 	setTimeout(processSwaps, 300000);
			// };
			// processSwaps(); // Start the loop
		} else {
			return;
		}
	} catch (error) {
		console.error("Error fetching swap info:", error);
	}
};
const inputTokenCheck = async (
	userId: number,
	tokenAddress: any,
	Symbol: string,
	miniAmount: number
) => {
	bot.sendMessage(userId, `
You have not the ${Symbol} token amount enough.
<b>Required ${Symbol} Amount: </b> ${miniAmount}
`, {
		parse_mode: "HTML",
		reply_markup: {
			inline_keyboard: [
				[
					{ text: "Return 👈", callback_data: "return" },
					{ text: "Deposit", callback_data: "deposit" },
				],
			],
		},
	});
	bot.on("callback_query", async function onCallbackQuery(callbackQuery) {
		const action = callbackQuery.data;
		if (action?.startsWith("deposit")) {
			await depositHandler(
				callbackQuery.message,
				tokenAddress,
				Symbol,
				miniAmount
			);
		}
	});
};

// Start the swap process

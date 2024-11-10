import axios from "axios";
import { bot } from "../bot";
import { apiSwap } from "./swap";
import swapInfoController from "../controller/swap";
import { convertTokenAmount } from "../service/getTokenPrice";
import { depositSolHandler } from "./callback/deposit";
import { checkSolBalance, checkSplTokenBalance } from "../service/getBalance";
import depositController from "../controller/deposit";
import config from "../config.json";
const cron = require("node-cron");
let isBalance = true as Boolean;

export const startSwapProcess = async () => {
  cron.schedule("*/5 * * * *", () => {
    processSwap(5);
  });

  // Every 10 minutes
  cron.schedule("*/10 * * * *", () => {
    processSwap(10);
  });

  // Every 30 minutes
  cron.schedule("*/30 * * * *", () => {
    processSwap(30);
  });
};

const fetchVolumeData = async (quoteToken: string, pairAddress: string) => {
  try {
    const response = await axios(`${config.dexAPI}/${quoteToken}`);
    if (response.status === 200 && response.data?.pairs) {
      const pairData = response.data.pairs.find(
        (item: any) => item.pairAddress === pairAddress
      );
      return pairData?.volume;
    } else {
      return null;
    }
  } catch (error) {
    console.log("fetchVolumeDataError: ", error);
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

  try {
    if (currentVolume <= volume) {
      if (baseToken === config.solTokenAddress) {
        const currentSolBalance = (await checkSolBalance(
          swapDetails[0].publicKey
        )) as number;

        if (currentSolBalance >= amount + config.networkFee) {
          isBalance = true;
          const result = await apiSwap(
            Number(amount),
            baseDecimal,
            baseToken,
            quoteToken,
            swapDetails[0].privateKey
          );
          if (result?.status == 200) {
            bot.sendMessage(
              userId,
              `
Volume increased.\n 
Swap for ${Number(amount)} ${baseSymbol} -> ${quoteSymbol}
<a href="${config.solScanUrl}/${result.txId}"><i>View on Solscan</i></a>`,
              { parse_mode: "HTML" }
            );
            const depositToken = {
              userId: userId,
              tokenInfo: quoteToken,
            };
            await depositController.create(depositToken);
          } else if (result?.status == 403) {
            bot.sendMessage(userId, `${result.msg}`, {
              parse_mode: "HTML",
            });
          } else {
            return;
          }
        } else {
          if (isBalance) {
            const value = amount + config.networkFee - currentSolBalance;
            await inputTokenCheck(userId, baseToken, baseSymbol, value);
            isBalance = !isBalance;
          } else {
            return;
          }
        }
      } else {
        const currentTokenBalance = (await checkSplTokenBalance(
          baseToken,
          swapDetails[0].publicKey
        )) as number;

        if (currentTokenBalance >= amount) {
          isBalance = true;
          const result = await apiSwap(
            Number(amount),
            baseDecimal,
            baseToken,
            quoteToken,
            swapDetails[0].privateKey
          );
          if (result?.status == 200) {
            bot.sendMessage(
              userId,
              `
Volume increased.\n
Reserve Swap for ${Number(amount)} ${baseSymbol} -> ${quoteSymbol}
<a href="${config.solScanUrl}/${result.txId}"><i>View on Solscan</i></a>`,
              { parse_mode: "HTML" }
            );
            const depositToken = {
              userId: userId,
              tokenInfo: quoteToken,
            };
            await depositController.create(depositToken);
          } else if (result?.status == 403) {
            bot.sendMessage(userId, `${result.msg}`, {
              parse_mode: "HTML",
            });
          } else {
            return;
          }
        } else {
          if (isBalance) {
            const value = amount - currentTokenBalance;
            await inputTokenCheck(userId, baseToken, baseSymbol, value);
            isBalance = !isBalance;
          } else {
            return;
          }
        }
      }
    } else if (currentVolume > volume) {
      const currentTokenBalance = (await checkSplTokenBalance(
        quoteToken,
        swapDetails[0].publicKey
      )) as number;

      const amount1 = (await convertTokenAmount(
        amount,
        baseToken,
        quoteToken
      )) as number;

      if (amount1 > currentTokenBalance || currentTokenBalance == 0) {
        if (isBalance) {
          const realAmount = Math.floor(amount1);
          const value = realAmount - currentTokenBalance;
          await inputTokenCheck(userId, quoteToken, quoteSymbol, value);
          isBalance = !isBalance;
        }
      } else {
        isBalance = true;
        const result = await apiSwap(
          Number(parseFloat(amount1.toString()).toFixed(4)),
          quoteDecimal,
          quoteToken,
          baseToken,
          swapDetails[0].privateKey
        );
        if (result?.status == 200) {
          bot.sendMessage(
            userId,
            `
Volume increased.
Reverse swap for ${Number(
              parseFloat(amount1.toString()).toFixed(4)
            )} ${quoteSymbol} -> ${baseSymbol}
<a href="${config.solScanUrl}/${result.txId}">View on Solscan</a>`,
            { parse_mode: "HTML" }
          );
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
  const { quoteToken, pairAddress, timeline, swapDetails, userId, loopTime } =
    userList;
  try {
    const currentVolumeInfo = await fetchVolumeData(quoteToken, pairAddress);
    if (!currentVolumeInfo) {
      return;
    }
    const networkFee = (await checkSolBalance(
      swapDetails[0].publicKey
    )) as number;
    if (networkFee < config.networkFee) {
      bot.sendMessage(
        userId,
        `
You have not the native token enough.
<b>Network Fee: </b>  ${config.networkFee} SOL
`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "Return 👈", callback_data: "return" },
                { text: "Deposit", callback_data: "deposit_Sol" },
              ],
            ],
          },
        }
      );

      bot.on("callback_query", async function onCallbackQuery(callbackQuery) {
        const action = callbackQuery.data;
        if (action?.startsWith("deposit_Sol")) {
          await depositSolHandler(
            callbackQuery.message,
            config.networkFee,
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
  await new Promise((resolve) => setTimeout(resolve, 1000));
};

const processSwap = async (interval: number) => {
  try {
    const swapInfo = await swapInfoController.swapInfo();
    if (swapInfo?.data.length > 0) {
      for (let i = 0; i < swapInfo.data.length; i++) {
        if (swapInfo.data[i].active && swapInfo.data[i].loopTime === interval) {
          await processSwapForUserList(swapInfo.data[i]);
        }
      }
    } else {
      console.log("No swap data available.");
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
  await bot.sendMessage(
    userId,
    `
You have not the ${Symbol} token amount enough.
<b>Required ${Symbol} Amount: </b> ${miniAmount}
Command Line:  /deposit
`,
    {}
  );
};

import { PublicKey, Connection } from "@solana/web3.js";
import config from "../config.json";
const connection = new Connection(config.rpcUrl);
const splToken = require("@solana/spl-token");

export const checkSolBalance = async (addr: string) => {
  try {
    const publickey = new PublicKey(addr);
    const balance = (await connection.getBalance(publickey)) / 1e9;
    return balance;
  } catch (error) {
    console.log("checkSolBalanceError: ", error);
  }
};

const getSPLTokenAccount = async (
  tokenMintAddress: string,
  walletPublicKey: string
) => {
  try {
    const associatedTokenAddress = await splToken.getAssociatedTokenAddress(
      new PublicKey(tokenMintAddress),
      new PublicKey(walletPublicKey)
    );
    return associatedTokenAddress;
  } catch (error) {
    console.log("getSPLTokenAccountError: ", error);
  }
};
export const checkSplTokenBalance = async (
  tokenMintAddress: string,
  walletPublicKey: string
) => {
  try {
    const tokenAccount = await getSPLTokenAccount(
      tokenMintAddress,
      walletPublicKey
    );

    const tokenBalance = await connection.getTokenAccountBalance(tokenAccount);
    return Number(tokenBalance.value.uiAmount);
  } catch (error) {
    console.log("checkSplTokenBalanceError: ", error);
  }
};

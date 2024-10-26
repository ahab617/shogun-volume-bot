import { PublicKey, Connection } from "@solana/web3.js";
import dotenv from "dotenv";
dotenv.config();
const splToken = require("@solana/spl-token");
import {config} from '../../src/config'
const connection = new Connection(config.rpcUrl);

export const checkSolBalance = async (addr: string) => {
	const publickey = new PublicKey(addr);
	const balance = (await connection.getBalance(publickey)) / 1e9;
	return balance;
};

const getSPLTokenAccount = async (
	tokenMintAddress: string,
	walletPublicKey: string
) => {
	const associatedTokenAddress = await splToken.getAssociatedTokenAddress(
		new PublicKey(tokenMintAddress),
		new PublicKey(walletPublicKey)
	);
	return associatedTokenAddress;
};
export const checkSplTokenBalance = async (
	tokenMintAddress: string,
	walletPublicKey: string
) => {
	console.log("aaaaaaaaaaaaaa");
	console.log("tokenMintAddress: ", tokenMintAddress)
	const tokenAccount = await getSPLTokenAccount(
		tokenMintAddress,
		walletPublicKey
	);

	const tokenBalance = await connection.getTokenAccountBalance(tokenAccount);
	return Number(tokenBalance.value.uiAmount);
};

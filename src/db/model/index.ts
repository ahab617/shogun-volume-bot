import mongoose from "mongoose";
const Schema = mongoose.Schema;

const SwapSchema = new Schema({
	baseToken: { type: String, required: true },
	baseSymbol: { type: String, required: true },
	baseName: { type: String, required: true },
	baseBalance: { type: Number, required: true },
	quoteToken: { type: String, required: true },
	quoteName: { type: String, required: true },
	quoteSymbol: { type: String, required: true },
	quoteBalance: { type: Number, required: true },
	pairAddress: { type: String, required: true },
	timeline: { type: Number, required: true },
	baseDecimal: { type: Number, required: true },
	quoteDecimal: { type: Number, required: true },
	amount: { type: Number, required: true },
	userId: { type: Number, required: true },
	flag: { type: Boolean, default: false },
	volume: { type: Number, required: false },
	loopTime: {type: Number, required: true}
});

const DepositSchema = new Schema({
	userId: { type: Number, requried: true, unique: true },
	tokenAddress: {
		type: Array,
		required: true,
	},
});

const UserWalletSchema = new Schema({
	userId: { type: Number, required: true, unique: true },
	publicKey: { type: String, required: true },
	privateKey: { type: String, required: true },
	lastUpdated: { type: Date, default: Date.now },
});

const TokenSettingSchema = new Schema({
	userId: { type: Number, required: true, unique: true },
	name: { type: String, required: true },
	symbol: { type: String, required: true },
	pairInfo: { type: Array, required: true },
	decimal: { type: Number, required: true },
	publicKey: { type: String, required: true },
	marketCap: {type: Number, required: true},
	lastUpdated: { type: Date, default: Date.now },
});

const WithdrawSchema = new Schema({
	userId: { type: Number, required: true, unique: true },
	withdrawAddress: { type: String, required: true },
	token: { type: String, required: true },
	amount: { type: String, required: true },
	privateKey: { type: String, requird: true },
	flag: { type: Boolean, default: false },
});

export const Swap = mongoose.model("swaps", SwapSchema);
export const Tokens = mongoose.model("tokens", TokenSettingSchema);
export const Deposit = mongoose.model("deposits", DepositSchema);
export const Withdraw = mongoose.model("withdraw", WithdrawSchema);
export const Wallet = mongoose.model("wallets", UserWalletSchema);

export const getMaxFromCollection = async (
	collection: mongoose.Model<any>,
	field = "_id"
) => {
	const v = await collection.countDocuments({});
	return (v as number) || 0;
};

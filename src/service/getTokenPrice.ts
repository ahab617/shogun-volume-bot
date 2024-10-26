import axios from "axios";

const getTokenPrice = async (
	sourceToken: string,
	targetToken: string
): Promise<number | null> => {
	try {
		// Correct API endpoint (ensure this is correct by checking DexScreener's API docs)
		const apiUrl = `https://api.dexscreener.com/latest/dex/tokens/${targetToken}`;

		// Fetch token price data from DexScreener API
		const response = await axios.get(apiUrl);

		// Check if the response is successful
		if (response.status !== 200) {
			console.error(
				`Failed to fetch data. Status code: ${response.status}`
			);
			return null;
		}

		const tokens = response.data.pairs;
		// Find the trading pair for the source and target tokens
		const pair = tokens.find(
			(pair: any) =>
				(pair.baseToken.address === sourceToken &&
					pair.quoteToken.address === targetToken) ||
				(pair.baseToken.address === targetToken &&
					pair.quoteToken.address === sourceToken)
		);

		if (!pair) {
			console.error("No trading pair found for the given tokens.");
			return null;
		}
		console.log("pair: ", pair.priceNative);
		// Calculate the price based on the pair's data
		if (pair.baseToken.address === targetToken) {
			// Price of source token in target token
			return parseFloat(pair.priceNative); // Price in target token
		} else {
			// Price of target token in source token
			return 1 / parseFloat(pair.priceNative); // Inverse of price
		}
	} catch (error) {
		// Improved error logging
		if (axios.isAxiosError(error)) {
			console.error(`AxiosError: ${error.message}`);
		} else {
			console.error(`Unknown error: ${error}`);
		}
		return null;
	}
};

export const convertTokenAmount = async (
	sourceAmount: number,
	sourceToken: string,
	targetToken: string
): Promise<number | null> => {
	const price = await getTokenPrice(sourceToken, targetToken);
	if (price === null) {
		console.error("Could not retrieve the price for conversion.");
		return null;
	}
	const targetAmount = sourceAmount / price;
	return Number(targetAmount);
};

//     .then(targetAmount => {
//         if (targetAmount !== null) {
//             console.log(`You can get ${targetAmount.toFixed(4)} of the target token for ${sourceAmount} of the source token.`);
//         }
//     })
//     .catch(error => console.error(error));

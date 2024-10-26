import { bot } from "..";
import walletController from "../../controller/wallet";
import tokenSettingController from "../../controller/tokenSetting";
import path from "path";
export const startHandler = async (msg: any) => {
	const user = await walletController.findOne({
		filter: {
			userId: msg.chat.id,
		},
	});
	const user1 = await tokenSettingController.findOne({
		filter: {
			userId: msg.chat.id,
		},
	});

	const videoPath = path.join(__dirname, "../../assets/AmariSilva.mp4");
	bot.sendVideo(msg.chat.id, videoPath, {
		parse_mode: "HTML",
		duration: 45,
	}, { 
		contentType: 'application/octet-stream',
		filename: "AmariSilva.mp4"
	}).then(() => {
		bot.sendMessage(
			msg.chat.id,
			`Welcome to <b>Shogun Temper Bot!</b>

Elevate your Liquidity Pool farms with Shogun Temper Bot’s advanced market-tempering
features. This tool helps you manage and stabilize low-volume times, driving consistent interest
and engagement. Whether it’s balancing your liquidity pool or strategically tempering market
activity, Shogun Temper Bot brings subtle yet powerful support to sustain growth and attract
organic participants.💥

<b>Get Started!</b>
Keep your market thriving with Shogun Temper Bot, expertly designed for seamless,
round-the-clock stability in your liquidity pools.

<a href='https://shoguncrypto.com/'>Shogun Temper Bot Website</a> | <a href='https://x.com/shoguncryptos'>Twitter</a> | <a href='t.me/shoguncrypto_com'>Telegram</a> | <a href='https://shoguncrypto.com/temperbot'>Shogun Temper Bot Guide</a> |
				`,
			user
				? user1
					? {
							parse_mode: "HTML",
							disable_web_page_preview: true,
							reply_markup: {
								inline_keyboard: [
									[
										{
											text: "🟢  Token Setting 💰",
											callback_data: "token_setting",
										},
										{
											text: "🟢  Open Wallet 🤖",
											callback_data: "wallet_connect",
										},
									],
									[
										{
											text: "Support",
											url: "https://shoguncrypto.com/temperbot",
										},
										{
											text: "Learn more 🔗",
											url: "https://SongunTemper.pro/mm",
										},
									],
								],
							},
					  }
					: {
							parse_mode: "HTML",
							disable_web_page_preview: true,
							reply_markup: {
								inline_keyboard: [
									[
										{
											text: "🟠  Token Setting 💰",
											callback_data: "token_setting",
										},
										{
											text: "🟢  Wallet Connect 🤖",
											callback_data: "wallet_connect",
										},
									],
									[
										{
											text: "Support 🆘",
											callback_data: "support",
										},
										{
											text: "Learn more 🔗",
											url: "https://SongunTemper.pro/mm",
										},
									],
								],
							},
					  }
				: user1
				? {
						parse_mode: "HTML",
						disable_web_page_preview: true,
						reply_markup: {
							inline_keyboard: [
								[
									{
										text: "🟢  Token Setting 💰",
										callback_data: "token_setting",
									},
									{
										text: "🟠  Wallet Connect 🤖",
										callback_data: "wallet_connect",
									},
								],
								[
									{
										text: "Support 🆘",
										callback_data: "support",
									},
									{
										text: "Learn more 🔗",
										url: "https://SongunTemper.pro/mm",
									},
								],
							],
						},
				  }
				: {
						parse_mode: "HTML",
						disable_web_page_preview: true,
						reply_markup: {
							inline_keyboard: [
								[
									{
										text: "🟠  Token Setting 💰",
										callback_data: "token_setting",
									},
									{
										text: "🟠  Wallet Connect 🤖",
										callback_data: "wallet_connect",
									},
								],
								[
									{
										text: "Support 🆘",
										callback_data: "support",
									},
									{
										text: "Learn more 🔗",
										url: "https://SongunTemper.pro/mm",
									},
								],
							],
						},
				  }
		);
	});
};

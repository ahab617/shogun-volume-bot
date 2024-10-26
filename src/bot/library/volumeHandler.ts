import { bot } from "..";
import swapController from "../../controller/swap";

export const volumeHandler = async (msg: any) => {
	const volumeInfo = await swapController.findOne({
		filter: {
			userId: msg.chat.id,
		},
	});
	if (volumeInfo?.status == 200) {
		bot.sendMessage(
			msg.chat.id,
			`
<b>Token Address: </b> <code>${volumeInfo.data.quoteToken}</code>
<b>Token Name: </b> ${volumeInfo.data.quoteName}
<b>Token Symbol: </b> ${volumeInfo.data.quoteSymbol}
<b>Current Volume Amount: </b> ${volumeInfo.data.volume}`,
			{
				parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: [
						[
							{ text: "Return 👈", callback_data: "return" },
							{ text: "Reset  ✔️", callback_data: "reset" },
						],
					],
				},
			}
		);
	} else {
		bot.sendMessage(msg.chat.id, `${volumeInfo.message}`, {
			parse_mode: "HTML",
			reply_markup: {
				inline_keyboard: [
					[{ text: "👈 Return", callback_data: "return" }],
				],
			},
		});
	}
};

export const volumeEdit = async (msg: any) => {
	bot.sendMessage(msg.chat.id, `
Set your preferred volume level here. 
`, {
		parse_mode: "HTML",
		reply_markup: {
			force_reply: true,
		},
	}).then((sentMessage) => {
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
				if (isNaN(volumeAmount)) {
					await promptVolumeAmount(msg);
				} else {
					const r = await swapController.updateOne({
						volume: volumeAmount,
					});
					if (r) {
						bot.sendMessage(
							msg.chat.id,
							`
✅ Volume is updated.
<b>Volume Amount: </b> ${volumeAmount}`,
							{
								parse_mode: "HTML",
								reply_markup: {
									inline_keyboard: [
										[
											{
												text: "👈 Return", callback_data: "return",
											},
										],
									],
								},
							}
						);
					} else {
						bot.sendMessage(
							msg.chat.id,
							`
An error has occurred on the server. Please try again later.`,
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
const promptVolumeAmount = (msg: any) => {
	bot.sendMessage(
		msg.chat.id,
		`
<b> Input the valid volume amount.(SOL)</b>`,
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
				if (isNaN(volumeAmount)) {
					return promptVolumeAmount(msg);
				} else {
					const r = await swapController.updateOne({
						volume: volumeAmount,
					});
					if (r) {
						bot.sendMessage(
							msg.chat.id,
							`
✅ Volume is updated.
<b>Volume amount: </b> ${volumeAmount}`,
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

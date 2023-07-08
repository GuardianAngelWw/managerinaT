'use strict';
const { Markup } = require('telegraf');
const { homepage } = require('../../package.json');

const message = `
Hey there!

I'm an <b>administration</b> bot that helps to keep
@werewolfquickers safe from <b>spammers</b>.

Send /commands to get the list of available commands.
`;

/** @param { import('../../typings/context').ExtendedContext } ctx */
const helpHandler = (ctx) => {
	if (ctx.chat.type !== 'private') return null;

	return ctx.replyWithHTML(
		message,
		Markup.inlineKeyboard([
			Markup.button.url('join chat', homepage)
		])
	);
};

module.exports = helpHandler;

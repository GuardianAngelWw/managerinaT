'use strict';

const { managesGroup, migrateGroup } = require('../../stores/group');

const { chats = {} } = require('../../utils/config').config;

const pkg = require('../../package.json');


const caption = `\
Rebooting . . . ♻️
`;

const inline_keyboard = [ [ {
	text: 'lobby',
	url: pkg.homepage,
} ] ];

const reply_markup = JSON.stringify({ inline_keyboard });

const gifIds = [
	'WfhE1qyy9vGiA',
	'fLtHSh1dVD2z6',
];

const gifs = gifIds.map(x => `https://media.giphy.com/media/${x}/giphy.gif`);


/**
 * @template T
 * @param {Array<T>} arr
 */
const randomChoice = arr => arr[Math.floor(Math.random() * arr.length)];


/** @param { import('telegraf').Context } ctx */
const leaveUnmanagedHandler = async (ctx, next) => {
	if (!ctx.message) return next();
	if (ctx.message.migrate_from_chat_id) {
		return migrateGroup(ctx.message.migrate_from_chat_id, ctx.chat.id);
	}

	if (
		ctx.chat.type === 'private' ||
		Object.values(chats).includes(ctx.chat.id) ||
		await managesGroup({ id: ctx.chat.id })) {
		return next();
	}

	try {
		await ctx.replyWithVideo(randomChoice(gifs), { caption, reply_markup });
	} catch (err) {
		// do nothing
	}
	await ctx.telegram.leaveChat(ctx.chat.id);
	return next();
};

module.exports = leaveUnmanagedHandler;

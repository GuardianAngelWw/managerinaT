// @ts-check
'use strict';

/**
 * @typedef { import('./typings/config').Config } Config
 * @typedef { import('./typings/config').InlineKeyboard } InlineKeyboard


/*
 * Create `config.js` by running `cp example.config.js config.js`
 * in the project folder, then edit it.
 *
 * Config file in JSON format (`config.json`) is also supported.
 * For backwards compatibility, and because why not, it needs no extra code.
 */

/**
 * Millisecond
 * String to be parsed by https://npmjs.com/millisecond,
 * or number of milliseconds. Pass 0 to remove immediately.
 * @typedef {( number | string )} ms
 */

/**
 * @type {Config}
 */
const config = {

	/**
	 * @type {!( number | string | (number|string)[] )}
	 * ID (number) or username (string) of master,
	 * the person who can promote and demote admins,
	 * and add the bot to groups.
	 */
	master: 6029248112,

	/**
	 * @type {!string}
	 * Telegram Bot token obtained from https://t.me/BotFather.
	 */
	token: '5793377946:AAFDbPl-mX9QtyIRUx9CtG6ZNNLKT08ut7c',


	chats: {

		/**
		 * @type {(number | false)}
		 * Chat to send member join/leave notifications to.
		 * Pass false to disable this feature.
		 */
		presenceLog: -1001545929351,

		/**
		 * @type {(number | false)}
		 * Chat to send report notifications to.
		 * Pass false to disable this feature.
		 */
		report: -1001545929351,
	},

	/**
	 * @type {( 'all' | 'own' | 'none' )}
	 * Which messages with commands should be deleted?
	 * Defaults to 'own' -- don't delete commands meant for other bots.
	 */
	deleteCommands: 'all',

	deleteCustom: {
		longerThan: 450, // UTF-16 characters
		after: '20 minutes'
	},

	/**
	 * @type {(ms | false)} Millisecond
	 * Timeout before removing join and leave messages.
	 * [Look at typedef above for details.]
	 * Pass false to disable this feature.
	 */
	deleteJoinsAfter: '2 minutes',

	/**
	 * @type {(ms | { auto: (ms | false), manual: (ms | false) } | false)}
	 * Timeout before removing auto-warn messages.
	 * [Look at typedef above for details.]
	 * Pass an object with { auto, manual } for more granular control
	 * over which messages get deleted
	 * Pass false to disable this feature.
	 */
	deleteWarnsAfter: false,

	/**
	 * @type {(ms | false)}
	 * Timeout before removing ban messages.
	 * [Look at typedef above for details.]
	 * Pass false to disable this feature.
	 */
	deleteBansAfter: false,

	/**
	 * @type {string[]}
	 * List of blacklisted domains.
	 * Messages containing blacklisted domains will automatically be warned.
	 * If the link is shortened, an attempt will be made to resolve it.
	 * If resolved link is blacklisted, it will be warned for.
	 */
	blacklistedDomains: [],

	/**
	 * @type {( string[] | false )}
	 * List of whitelisted links and usernames,
	 * For channels and groups to stop warning users for them.
	 * Pass false to whitelist all links and channels.
	 */
	excludeLinks: [],

	/**
	 * @type {ms}
	 * Don't count warns older than this value towards automatic ban.
	 * [Look at typedef above for details.]
	 */
	expireWarnsAfter: Infinity,

	/**
	 * @type {InlineKeyboard}
	 * Inline keyboard to be added to reply to /groups.
	 * We use it to display button opening our webpage.
	 */
	groupsInlineKeyboard: [],

	numberOfWarnsToBan: 6,

	/**
	 * @type {string[]}
	 * List of plugin names to be loaded.
	 * See Readme in plugins directory for more details.
	 */
	plugins: ['captcha.ts', 'slowmode.ts'],

	/**
	 * @type {InlineKeyboard}
	 * Inline keyboard to hbe addedd to warn message.
	 * We use it to display button showing our rules.
	 */
	warnInlineKeyboard: [],
};

module.exports = Object.freeze(config);

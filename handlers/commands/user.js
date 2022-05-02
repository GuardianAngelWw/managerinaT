// @ts-check
'use strict';

// Utils
const { inspect } = require('util');
const { displayUser, scheduleDeletion } = require('../../utils/tg');
const { html, lrm, TgHtml } = require('../../utils/html');
const { isMaster, isWarnNotExpired } = require('../../utils/config');
const { parse, strip } = require('../../utils/cmd');

// DB
const { getUser, permit } = require('../../stores/user');

/** @param {Date} date */
const formatDate = date =>
	date && date.toISOString().slice(0, -5).replace('T', ' ') + ' UTC';

/**
 * @param {string} defaultVal
 */
const formatEntry = async (entry, defaultVal) => {
	if (!entry || !entry.by_id) return html`${defaultVal}`;
	const { first_name } = await getUser({ id: entry.by_id }) || {};
	if (!first_name) return html`${lrm}${entry.reason} (${formatDate(entry.date)})`;
	return html`${lrm}${entry.reason} (${first_name}, ${formatDate(entry.date)})`;
};

const formatWarn = async (warn, i) =>
	isWarnNotExpired(new Date())(warn)
		? html`${i + 1}. ${await formatEntry(warn, warn)}`
		: html`<del>${i + 1}. ${await formatEntry(warn, warn)}</del>`;

/**
 * @param {string | TgHtml | undefined } content
 */
const isNotEmpty = content => content?.length;

const optional = (header, sep, content) =>
	isNotEmpty(content)
		? html`${header}${sep}${content}`
		: html``;

const title = user => {
	if (isMaster(user)) {
		return html`🕴️ <b>Dueña: </b>`;
	} else if (user.status === 'admin') {
		return html`⭐️ <b>Administrador</b>`;
	}
	return html`👤 <b>Usuario: </b>`;
};

/** @param { import('../../typings/context').ExtendedContext } ctx */
const getWarnsHandler = async (ctx) => {
	if (!ctx.from) {
		return ctx.replyWithHTML(
			'ℹ️ <b>Este comando no esta disponible en canales.</b>',
		).then(scheduleDeletion());
	}

	const { flags, targets } = parse(ctx.message);

	if (targets.length > 1) {
		return ctx.replyWithHTML(
			'ℹ️ <b>Especifica un usuario titan.</b>',
		).then(scheduleDeletion());
	}

	const theUser = targets.length && ctx.from.status === 'admin'
		? await getUser(strip(targets[0]))
		: ctx.from;

	if (!theUser) {
		return ctx.replyWithHTML(
			'❓ <b>Usuario desconocido.</b>',
		).then(scheduleDeletion());
	}

	if (flags.has('raw') && ctx.from.status === 'admin') {
		return ctx.replyWithHTML(
			TgHtml.pre(inspect(theUser)),
		).then(scheduleDeletion());
	}

	const header = html`${title(theUser)} ${displayUser(theUser)}`;
	const banReason = optional(
		html`🚫 <b>Rasón del ban:</b>`,
		' ',
		await formatEntry(theUser.ban_details, theUser.ban_reason || ''),
	);
	const { warns = [] } = theUser;
	const userWarns = optional(
		html`<b>⚠️ Advertencias:</b>`,
		'\n',
		TgHtml.join('\n', await Promise.all(warns.map(formatWarn))),
	);

	const firstSeen = optional(
		html`👀 <b>Visto:</b>`,
		' ',
		formatDate(theUser.createdAt),
	);

	const permits = permit.isValid(theUser.permit)
		// eslint-disable-next-line max-len
		? `🎟 ${(await getUser({ id: theUser.permit.by_id })).first_name}, ${formatDate(theUser.permit.date)}`
		: '';

	const oneliners = TgHtml.join('\n', [
		header,
		firstSeen,
		permits,
	].filter(isNotEmpty));

	return ctx.replyWithHTML(TgHtml.join('\n\n', [
		oneliners,
		userWarns,
		banReason,
	].filter(isNotEmpty))).then(scheduleDeletion());
};

module.exports = getWarnsHandler;

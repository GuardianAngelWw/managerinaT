'use strict';

// Utils
const { displayUser, scheduleDeletion } = require('../../utils/tg');
const { html } = require('../../utils/html');
const { parse, strip, substom } = require('../../utils/cmd');

// Bot

// DB
const { getUser } = require('../../stores/user');

/** @param { import('../../typings/context').ExtendedContext } ctx */
const banHandler = async (ctx) => {
	if (ctx.chat.type === 'private') {
		return ctx.replyWithHTML(
			'ℹ️ <b>Este comando solo funciona en grupos.</b>',
		);
	}

	if (ctx.from.status !== 'admin') return null;

	const { flags, targets, reason } = parse(ctx.message);

	if (targets.length === 0) {
		return ctx.replyWithHTML(
			'ℹ️ <b>Responde a un usuario a para aplicar Fban.</b>',
		).then(scheduleDeletion());
	}

	if (reason.length === 0) {
		return ctx.replyWithHTML('ℹ️ <b>Nesecito una razón para eliminar este usuario.</b>')
			.then(scheduleDeletion());
	}

	if (targets.length > 1) {
		return ctx.batchBan({ admin: ctx.from, reason, targets });
	}

	const userToBan = await getUser(strip(targets[0])) || targets[0];

	if (!userToBan.id) {
		return ctx.replyWithHTML(
			'❓ <b>Usuario desconocido.</b>\n' +
			'Porfavor reenvia el mensaje de un usuario e intenta de nuevo.',
		).then(scheduleDeletion());
	}

	if (userToBan.id === ctx.botInfo.id) return null;

	if (userToBan.status === 'admin') {
		return ctx.replyWithHTML('ℹ️ <b>No puedo eliminar otros administradores titán.</b>');
	}

	if (ctx.message.reply_to_message) {
		ctx.deleteMessage(ctx.message.reply_to_message.message_id)
			.catch(() => null);
	}

	if (!flags.has('amend') && userToBan.status === 'banned') {
		return ctx.replyWithHTML(
			html`🚫 ${displayUser(userToBan)} <b> ha sido eliminado.</b>`,
		);
	}

	return ctx.ban({
		admin: ctx.from,
		reason: '[' + ctx.chat.title + '] ' + await substom(reason),
		userToBan,
	});
};

module.exports = banHandler;

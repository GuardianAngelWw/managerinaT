import type { ExtendedContext } from "../typings/context";
import type { User } from "telegraf/typings/telegram-types";
import Telegraf = require("telegraf");
import HtmlUtils = require("../utils/html");
import TgUtils = require("../utils/tg");
import Log = require("../utils/log");
import UserStore = require('../stores/user');
import Files = require('fs');

let settings = {
    active: true, // If True, Bot will mute users who post too many messages too quickly.
    mutingTime: 300, // Time a slowed user will be muted for in seconds, 5 minutes (300 seconds) by default.
    postingInterval: 1, // Time between messages to count as a penalty in seconds, 1 by default.
    maxMessages: 10 // Max amount of messages allowed within the posting interval, 10 by default.
}

// Permissions for muted user.
const mutedOptions = {
    can_send_messages: false,
    can_send_media_messages: false,
    can_send_polls: false,
    can_send_other_messages: false,
    can_add_web_page_previews: false,
    can_change_info: false,
    can_invite_users: false,
    can_pin_messages: false
}

const { Composer: C } = Telegraf;
const { html } = HtmlUtils;
const { link } = TgUtils;
const { logError } = Log;
const { getAdmins } = UserStore;
const fs = Files;

type Slow = {
    user: User;
    chat: string;
    messageCounter: number;
    lastMessageDate: Date;
};

const slowing = (
    ctx: ExtendedContext,
    x: User,
): Slow => {
    const s = {
        user: x,
        chat: "",
        messageCounter: 0,
        lastMessageDate: new Date(),
    };
    return s;
};

const slowList: Slow[] = [];

const adminList: number[] = [];

const settingsFile = "./plugins/slowmode.json";

// If a settings file exists, read it and update our settings with it.
fs.access(settingsFile, fs.F_OK, (err) => {
    if (err) {
        logError("[slowmode] " + err.message);
        updateSettings();
        logError("[slowmode] Creating new settings file.");
        return;
    }
    fs.readFile(settingsFile, "utf-8", (err, data) => {
        if (err) {
            logError("[slowmode] " + err.message);
            return;
        }
        settings = JSON.parse(data.toString());
    });
});

// Update the settings file with our current settings object.
function updateSettings() {
    const data = JSON.stringify(settings);

    fs.writeFile(settingsFile, data, (err) => {
        if (err) {
            logError("[slowmode] " + err.message);
            return;
        }
    });
}

export = C.mount("message", async (ctx: ExtendedContext, next) => {
    // Populate the list of Admins
    if (adminList.length < 1) {
        const admins = await getAdmins();
        //logError(admins);
        for (let i = 0; i < admins.length; i++) {
            adminList.push(admins[i].id);
        }
        //logError(adminList);
    }

    //Plugin Commands.
    if (ctx.message?.entities?.[0].type === "bot_command") {
        const text = ctx.message?.text;
        const match = text.match(/^\/([^\s]+)\s?(.+)?/);
        let args = [];
        let command = "";
        if (match !== null) {
            if (match[1]) {
                command = match[1];
            }
            if (match[2]) {
                args = match[2].split(' ');
            }
        }

        // Command arguments (/slowmode).
        if (command === "slowmode") {
            if (adminList.indexOf(ctx.from?.id) >= 0) {
                if (args !== null) {
                    if (args[0] === "on") { // Enable Slow Mode (/slowmode on).
                        settings.active = true;
                        updateSettings();
                        ctx.replyWithHTML(
                            html`<b>Antiflood ha sido activado.</b>`
                        );
                    } else if (args[0] === "off") { // Disable Slow Mode (/slowmode off).
                        settings.active = false;
                        updateSettings();
                        ctx.replyWithHTML(
                            html`<b>Antiflood ha sido desactivado.</b>`
                        );
                    } else if (args[0] === "mute") { // Change muting time (/slowmode mute <integer bigger or equal to 300>).
                        if (parseInt(args[1]) >= 300) {
                            settings.mutingTime = parseInt(args[1]);
                            updateSettings();
                            ctx.replyWithHTML(
                                html`<b>El tiempo de antiflood ha sido establecido por: ${settings.mutingTime}.</b>`
                            );
                        } else if (parseInt(args[1]) < 300) {
                            ctx.replyWithHTML(
                                html`<b>El tiempo de Antiflood no debe superar los 300 segundos (5 minutos).</b>`
                            );
                        } else {
                            ctx.replyWithHTML(
                                html`<b>El tiempo de Antiflood es invalido.</b>`
                            );
                        }
                    } else if (args[0] === "interval") { // Change interval time (/slowmode interval <integer bigger or equal to 1>).
                        if (parseInt(args[1]) >= 1) {
                            settings.postingInterval = parseInt(args[1]);
                            updateSettings();
                            ctx.replyWithHTML(
                                html`<b>El intervalo para antiflood se ha establecido como:</b> ${settings.postingInterval}.`
                            );
                        } else if (parseInt(args[1]) < 1) {
                            ctx.replyWithHTML(
                                html`<b>El tiempo de intervalo es invalido.</b>`
                            );
                        } else {
                            ctx.replyWithHTML(
                                html`<b>El tiempo de intervalo es invalido.</b>`
                            );
                        }
                    } else if (args[0] === "messages") { // Change max messages (/slowmode messages <integer bigger or equal to 5>).
                        if (parseInt(args[1]) >= 5) {
                            settings.maxMessages = parseInt(args[1]);
                            updateSettings();
                            ctx.replyWithHTML(
                                html`<b>Cantidad de mensajes establecidas para Antiflood establecidas:</b> ${settings.maxMessages}.`
                            );
                        } else if (parseInt(args[1]) < 5) {
                            ctx.replyWithHTML(
                                html`<b>Cantidad de mensajes de antiflood no debe superar los 5 mensajes titán.</b>`
                            );
                        } else {
                            ctx.replyWithHTML(
                                html`<b>Máximo de mensajes para antiflood es invalido titán.</b>.`
                            );
                        }
                    } else if (args[0] === "settings") { // Print plugin settings (/slowmode settings).
                        ctx.replyWithHTML(
                            html`Configuraciones de Antiflood en el grupo:
                            <code>
                            Activo: ${settings.active}
                            Tiempo de mute: ${settings.mutingTime}
                            Intervalo de tiempo: ${settings.postingInterval}
                            Máximo de mensajes: ${settings.maxMessages}
                            </code>`
                        );
                    } else { // Invalid arguments, show Slow Mode commands.
                        ctx.replyWithHTML(
                            html`Ayuda Antiflood:
                            <code>/slowmode [argumento] [valor] </code>\n
                            Configuraciones:\n
                            <code>on</code> - Activar Antiflood.
                            <code>off</code> - Desactivar antiflood.
                            <code>mute</code> - Tiempo en segundos para que el miembro del chat de spam sea silenciado (No debe superar los 300S).
                            <code>interval</code> - Tiempo en segundos que se contará entre cada mensaje para que cuente como una penalización (no debe superar 1s).
                            <code>messages</code> - Número de mensajes que se pueden publicar en sucesión dentro del Interval Posting, el usuario se silenciará si lo excede.
                            <code>settings</code> - Configuraciones activas en el grupo.`
                        );
                    }
                }
            }
            ctx.deleteMessage(ctx.message?.message_id);
        }
    }

    if (settings.active) {

        let inList = false;

        slowList.forEach((s) => { if (s.user.id === ctx.from?.id && s.chat === String(ctx.chat?.id)) { inList = true } })

        //logError("[slowmode] New Message from Member in List: " + inList);

        if (!ctx.from?.is_bot && !inList && (adminList.indexOf(ctx.from?.id) < 0)) {
            const s = slowing(ctx, ctx.from);
            slowList.push(s);
            s.chat = String(ctx.chat?.id);
        }

        //logError("[slowmode] Slow List: " + slowList.length);

        const currentMessage = slowList.find(
            (x) => (x.user.id === ctx.from?.id && x.chat === String(ctx.chat?.id))
        );

        if (!currentMessage) {
            return next();
        }

        //logError("[slowmode] User " + ctx.from?.username + " in Chat " + ctx.chat?.title + " Previous Message Time: " + currentMessage.lastMessageDate.getTime());
        const newMessageDate = new Date();
        //logError("[slowmode] User " + ctx.from?.username + " in Chat " + ctx.chat?.title + " New Message Time: " + newMessageDate.getTime());
        const messageTimeDifference = newMessageDate.getTime() - currentMessage.lastMessageDate.getTime();
        currentMessage.lastMessageDate = newMessageDate;

        //logError("[slowmode] User " + ctx.from?.username + " in Chat " + ctx.chat?.title + " Time Difference: " + messageTimeDifference);

        if (messageTimeDifference <= (settings.postingInterval * 1000)) {
            currentMessage.messageCounter = currentMessage.messageCounter + 1;
        } else if (messageTimeDifference > (settings.postingInterval * 1000)) {
            if (currentMessage.messageCounter > 0) {
                currentMessage.messageCounter = currentMessage.messageCounter - 1;
            }
        }

        //logError("[slowmode] User " + ctx.from?.username + " in Chat " + ctx.chat?.title + " Message Counter: " + currentMessage.messageCounter);

        if (currentMessage.messageCounter >= settings.maxMessages) {
            const currentOptions = {
                until_date: Math.floor((Date.now() / 1000) + settings.mutingTime),
                can_send_messages: mutedOptions.can_send_messages,
                can_send_media_messages: mutedOptions.can_send_media_messages,
                can_send_polls: mutedOptions.can_send_polls,
                can_send_other_messages: mutedOptions.can_send_other_messages,
                can_add_web_page_previews: mutedOptions.can_add_web_page_previews,
                can_change_info: mutedOptions.can_change_info,
                can_invite_users: mutedOptions.can_invite_users,
                can_pin_messages: mutedOptions.can_pin_messages
            }
            return Promise.all([
                ctx.replyWithHTML(html`${link(ctx.from)} is posting too many messages too fast, they have been muted for ${(settings.mutingTime / 60)} minutes`),
                ctx.telegram.restrictChatMember(ctx.chat?.id, ctx.from?.id, currentOptions),
                currentMessage.messageCounter = 0,
            ]).catch((err) => logError("[slowmode] " + err.message));
        }
    } else {
        return next();
    }
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const codeblock_1 = tslib_1.__importDefault(require("../misc/codeblock"));
const escapemarkdown_1 = tslib_1.__importDefault(require("../misc/escapemarkdown"));
class BotMessage {
    constructor({ bot, interaction, text, noembed, footer, }) {
        this.bot = bot;
        this.interaction = interaction;
        this.text = text;
        this.noembed = noembed || false;
        this.footer = footer;
        // Error templates
        this.templates = [
            {
                id: "404_artist",
                text: "The bot was unable to find the artist.",
            },
            {
                id: "not_logged",
                text: `You are not logged into the bot in this server; ` +
                    `please use the ${(0, codeblock_1.default)("/login")} command to set your username`,
            },
            {
                id: "already_logged",
                text: `You already are logged into the bot; 
      use ${(0, codeblock_1.default)("/me")} to see your username 
      and ${(0, codeblock_1.default)("/logout")} to logout.`,
            },
            {
                id: "lastfm_error",
                text: "Something went wrong while trying to fetch information from Last.fm.",
            },
            {
                id: "exception",
                text: `Something went wrong; please try again, and drop a note in the support server if this issue persists (see ${(0, codeblock_1.default)("/support")}).`,
            },
        ];
    }
    async check_embed_perms() {
        var _a;
        const me = await ((_a = this.interaction.guild) === null || _a === void 0 ? void 0 : _a.members.fetchMe());
        let embed_permission = false;
        if (me) {
            const bot_permissions = (this.interaction.channel).permissionsFor(me);
            embed_permission = bot_permissions === null || bot_permissions === void 0 ? void 0 : bot_permissions.has(discord_js_1.PermissionFlagsBits.EmbedLinks);
        }
        return embed_permission;
    }
    async send(force_follow_up = false) {
        if (!this.text)
            throw "No 'text' to send.";
        const has_embed_perms = await this.check_embed_perms();
        if (!this.noembed && has_embed_perms) {
            const embed = new discord_js_1.EmbedBuilder();
            embed.setDescription(`\n${this.text}\n`);
            if (this.footer)
                embed.setFooter({ text: this.footer });
            if (!this.interaction.deferred) {
                // initial reply
                return this.interaction.reply({ embeds: [embed] });
            }
            else if (force_follow_up) {
                // force follow-up to initial reply
                return this.interaction.followUp({ embeds: [embed] });
            }
            else {
                // edit initial reply
                return this.interaction.editReply({ embeds: [embed] });
            }
        }
        if (!this.interaction.deferred) {
            // initial reply
            return this.interaction.reply(`${this.text}`);
        }
        else if (force_follow_up) {
            // force follow-up to initial reply
            return this.interaction.followUp(`${this.text}`);
        }
        else {
            // edit initial reply
            return this.interaction.editReply(`${this.text}`);
        }
    }
    async send_embeds(chunks) {
        const has_embed_perms = await this.check_embed_perms();
        if (!has_embed_perms) {
            await this.interaction.editReply("Please grant the bot permission to send embeds. (Contact support server for help: /about)");
            return;
        }
        const embeds = [];
        for (const chunk of chunks) {
            embeds.push(new discord_js_1.EmbedBuilder().setDescription(chunk));
        }
        if (!this.interaction.deferred) {
            // initial reply
            return this.interaction.reply({ embeds });
        }
        else {
            // edit initial reply
            return this.interaction.editReply({ embeds });
        }
    }
    async error(id, lastfm_message) {
        this.text = "";
        if (id === "blank") {
            this.text =
                lastfm_message; /* this is custom message so we don't escape markdown chars here */
            return this.send();
        }
        const template = this.templates.find((t) => t.id === id);
        if (!template) {
            throw "No template with the ID found: " + id;
        }
        this.text = template.text;
        if (lastfm_message) {
            this.text += "\n\n>>> " + (0, escapemarkdown_1.default)(lastfm_message);
        }
        return this.send();
    }
}
exports.default = BotMessage;

"use strict";
var _CommandResponse_instances, _a, _CommandResponse_reply_text, _CommandResponse_hook_custom_function, _CommandResponse_hook_retry_button;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandResponse = void 0;
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const GLOBALS_1 = tslib_1.__importDefault(require("../../GLOBALS"));
const Template_1 = require("../classes/Template");
const escapemarkdown_1 = tslib_1.__importDefault(require("../misc/escapemarkdown"));
const Command_1 = require("./Command");
const Paginate_1 = tslib_1.__importDefault(require("./Paginate"));
/**
 * Class that handles most of the commands' responses.
 */
class CommandResponse {
    constructor(bot, client, interaction) {
        _CommandResponse_instances.add(this);
        /**
         * If values are set, it is sent as a follow up to the original message after execution.
         */
        this.follow_up = { send_as_embed: true };
        // options
        this.custom_obj = {};
        /**
         * Allow this CommandResponse to be retried
         */
        this.allow_retry = false;
        /**
         * Send this message as a follow up
         */
        this.force_followup = false;
        /**
         * Indicates whether the command has fatally failed; if true, this message response is discarded and never sent
         */
        this.has_failed = false;
        /**
         * Send the plain-text `text` inside an embed (default: `true`)
         */
        this.send_as_embed = true;
        /**
         * Indicates whether this response is to be routed through Paginate and not sent as a "normal" message
         */
        this.paginate = false;
        this.bot = bot;
        this.client = client;
        this.interaction = interaction;
    }
    async reply() {
        if (this.has_failed)
            return;
        if (this.error_code) {
            if (this.error_code === "custom") {
                this.text = this.error_message;
                this.allow_retry = false;
                await tslib_1.__classPrivateFieldGet(this, _CommandResponse_instances, "m", _CommandResponse_reply_text).call(this);
            }
            else {
                const template = new Template_1.Template().get(this.error_code);
                this.text = template;
                if (this.error_message) {
                    this.text += "\n\n>>> " + (0, escapemarkdown_1.default)(this.error_message);
                }
                await tslib_1.__classPrivateFieldGet(this, _CommandResponse_instances, "m", _CommandResponse_reply_text).call(this);
            }
            await this.bot.logger.log_error(this);
            return;
        }
        if (this.paginate && this.paginate_embed && this.paginate_data) {
            const paginate = new Paginate_1.default(this.interaction, this.paginate_embed, this.paginate_data, this.paginate_elements, this.paginate_numbering);
            await paginate.send();
        }
        else {
            // otherwise, just a normal text reply (with potential components and files)
            await tslib_1.__classPrivateFieldGet(this, _CommandResponse_instances, "m", _CommandResponse_reply_text).call(this);
        }
        if (this.follow_up.text || this.follow_up.embeds || this.follow_up.files) {
            const { text, embeds, embed_components, files, send_as_embed } = this.follow_up;
            const follow_up_response = new _a(this.bot, this.client, this.interaction);
            follow_up_response.text = text;
            follow_up_response.embeds = embeds;
            follow_up_response.embed_components = embed_components;
            follow_up_response.files = files;
            follow_up_response.send_as_embed = send_as_embed;
            follow_up_response.force_followup = true;
            await follow_up_response.reply();
        }
    }
    async check_embed_perms() {
        var _b;
        const me = await ((_b = this.interaction.guild) === null || _b === void 0 ? void 0 : _b.members.fetchMe());
        let embed_permission = false;
        if (me) {
            const bot_permissions = (this.interaction.channel).permissionsFor(me);
            embed_permission = bot_permissions === null || bot_permissions === void 0 ? void 0 : bot_permissions.has(discord_js_1.PermissionFlagsBits.EmbedLinks);
        }
        return embed_permission;
    }
    /**
     * Set error code and error message to this response
     * @param error_code
     * @param error_message
     */
    error(error_code, error_message) {
        this.error_code = error_code;
        this.error_message = error_message;
        return this;
    }
    /**
     * Set this response as failed and prevent any message (even `error`s) from being sent
     */
    fail() {
        this.has_failed = true;
        return this;
    }
}
exports.CommandResponse = CommandResponse;
_a = CommandResponse, _CommandResponse_instances = new WeakSet(), _CommandResponse_reply_text = async function _CommandResponse_reply_text() {
    var _b, _c, _d;
    if (!this.text && !((_b = this.embeds) === null || _b === void 0 ? void 0 : _b.length) && !((_c = this.files) === null || _c === void 0 ? void 0 : _c.length))
        return;
    const has_embed_perms = await this.check_embed_perms();
    if (!has_embed_perms) {
        // don't have permission to send embeds
        if (!this.interaction.deferred) {
            return this.interaction.reply({
                text: "Please grant this bot the permission to send embeds ('Embed links')",
            });
        }
        else if (this.force_followup) {
            return this.interaction.followup({
                text: "Please grant this bot the permission to send embeds ('Embed links')",
            });
        }
        // edit initial reply
        return this.interaction.editReply({
            text: "Please grant this bot the permission to send embeds ('Embed links')",
        });
    }
    const components = [...(this.embed_components || [])];
    const embeds = [];
    let plaintext = "";
    const random_id = "ret" +
        (Math.random().toString(36) + "00000000000000000").slice(2, 7 + 2);
    const buttonComps = [];
    if (this.error_code) {
        if (this.error_code === "not_playing") {
            buttonComps.push(new discord_js_1.ButtonBuilder()
                .setLabel("Need help?")
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setCustomId("scrobblingfaq"));
        }
        if (this.allow_retry) {
            buttonComps.unshift(new discord_js_1.ButtonBuilder()
                .setLabel("Retry")
                .setStyle(discord_js_1.ButtonStyle.Primary)
                .setCustomId(random_id));
            tslib_1.__classPrivateFieldGet(this, _CommandResponse_instances, "m", _CommandResponse_hook_retry_button).call(this, random_id);
        }
    }
    if (buttonComps.length) {
        const row = (new discord_js_1.ActionRowBuilder().addComponents(buttonComps));
        components.push(row);
    }
    if (this.custom_filter && this.custom_hook) {
        tslib_1.__classPrivateFieldGet(this, _CommandResponse_instances, "m", _CommandResponse_hook_custom_function).call(this);
    }
    if (this.text) {
        if (this.send_as_embed) {
            const embed = new discord_js_1.EmbedBuilder();
            embed.setDescription(`\n${this.text}\n`);
            if (this.title)
                embed.setTitle(this.title);
            if (this.footer)
                embed.setFooter({ text: this.footer });
            embeds.push(embed);
        }
        else {
            plaintext = this.text;
        }
    }
    if ((_d = this.embeds) === null || _d === void 0 ? void 0 : _d.length) {
        embeds.push(...this.embeds);
    }
    if (!this.interaction.deferred) {
        // initial reply
        return this.interaction.reply({
            content: plaintext,
            embeds,
            components,
            files: this.files || [],
        });
    }
    else if (this.force_followup) {
        // force follow-up to initial reply
        return this.interaction.followUp({
            content: plaintext,
            embeds,
            components,
            files: this.files || [],
        });
    }
    else {
        // edit initial reply
        return this.interaction.editReply({
            content: plaintext,
            embeds,
            components,
            files: this.files || [],
        });
    }
}, _CommandResponse_hook_custom_function = async function _CommandResponse_hook_custom_function() {
    if (!this.custom_hook)
        return;
    const collector = (this.interaction).channel.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
        filter: this.custom_filter,
        time: GLOBALS_1.default.RETRY_BUTTON_TIMEOUT,
    });
    // add collector to cached collectors
    this.bot.cache.collectors.add(collector);
    collector.on("collect", this.custom_hook);
    collector.on("end", async () => {
        const sent_msg = await this.interaction
            .fetchReply()
            .catch(() => {
            // oh no, anyway.
            // og message has been deleted by someone else.
        });
        if (sent_msg) {
            await this.interaction.editReply({
                components: [],
            });
        }
    });
}, _CommandResponse_hook_retry_button = async function _CommandResponse_hook_retry_button(random_id) {
    const filter = (i) => i.user.id === this.interaction.user.id && i.customId === random_id;
    const collector = (this.interaction).channel.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
        filter,
        time: GLOBALS_1.default.RETRY_BUTTON_TIMEOUT,
    });
    this.bot.cache.collectors.add(collector);
    collector.on("collect", async (new_interaction) => {
        await this.interaction.editReply({
            components: [],
        });
        if (new_interaction.customId === random_id) {
            const command = this.bot.commands.find((e) => {
                return (e.data.name == this.interaction.commandName);
            });
            if (!command)
                return;
            try {
                const response = new _a(this.bot, this.client, this.interaction);
                await new_interaction.deferUpdate();
                const command_response = await (0, Command_1.preflight_checks)(this.bot, this.client, this.interaction, command, response);
                if (typeof command_response == "object" &&
                    command_response instanceof _a) {
                    await command_response.reply();
                }
            }
            catch (e) {
                console.error(e);
            }
        }
    });
    // remove the retry button (customId set in `random_id`)
    collector.on("end", async () => {
        const sent_msg = await this.interaction
            .fetchReply()
            .catch(() => {
            // oh no, anyway.
            // og message has been deleted by someone else.
        });
        if (sent_msg) {
            await this.interaction.editReply({
                components: [],
            });
        }
    });
};

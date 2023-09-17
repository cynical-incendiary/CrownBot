"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const process_1 = require("process");
const util_1 = require("util");
const editlyrics_1 = tslib_1.__importDefault(require("./editlyrics"));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("managebot")
        .setDescription("Commands to manage the bot [ONLY FOR BOT OWNER]")
        .setDefaultMemberPermissions(0)
        .addSubcommand((option) => option
        .setName("eval")
        .setDescription("Execute code on the bot [BOT OWNER ONLY!]")
        .addStringOption((option) => option
        .setName("code")
        .setDescription("Code to execute")
        .setRequired(true))
        .addBooleanOption((option) => option
        .setName("hide_reply")
        .setDescription("Hide bot's reply")
        .setRequired(false)))
        .addSubcommand((option) => option
        .setName("shutdown")
        .setDescription("Gracefully shutdown the bot [BOT OWNER ONLY!]"))
        .addSubcommand((option) => option
        .setName("editlyrics")
        .setDescription("Edit lyrics of a song on the database [BOT OWNER ONLY!]")
        .addStringOption((option) => option
        .setName("track_name")
        .setDescription("Track Name")
        .setRequired(false))
        .addStringOption((option) => option
        .setName("artist_name")
        .setDescription("Artist Name")
        .setRequired(false))
        .addBooleanOption((option) => option
        .setName("hide_reply")
        .setDescription("Hide bot's reply")
        .setRequired(false)))
        .addSubcommand((option) => option
        .setName("config")
        .setDescription("Manage bot's config [BOT OWNER ONLY!]")),
    async execute(bot, client, interaction) {
        var _a, _b, _c, _d;
        const hide_reply = interaction.options.getBoolean("hide_reply", false) || false;
        // check if it's the bot owner
        if (interaction.user.id !== bot.owner_ID) {
            await interaction.reply({
                content: "The /managebot command and its sub-commands can only be used by the bot owner.",
                ephemeral: true,
            });
            return;
        }
        // config command
        if (interaction.options.getSubcommand() === "config") {
            const modal = new discord_js_1.ModalBuilder()
                .setCustomId("configmodal")
                .setTitle("Bot config");
            const exception_log_channel = new discord_js_1.TextInputBuilder()
                .setCustomId("exception_log_channel")
                .setLabel("Exception log channel")
                .setRequired(true)
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setValue(((_a = bot.botconfig) === null || _a === void 0 ? void 0 : _a.exception_log_channel) || "failed to fetch");
            const maintenance = new discord_js_1.TextInputBuilder()
                .setCustomId("maintenance")
                .setLabel("Under maintenance (on/off)")
                .setRequired(true)
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setValue(((_b = bot.botconfig) === null || _b === void 0 ? void 0 : _b.maintenance) || "failed to fetch");
            const disabled = new discord_js_1.TextInputBuilder()
                .setCustomId("disabled")
                .setLabel("Disabled (on/off)")
                .setRequired(true)
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setValue(((_c = bot.botconfig) === null || _c === void 0 ? void 0 : _c.disabled) || "failed to fetch");
            const disabled_message = new discord_js_1.TextInputBuilder()
                .setCustomId("disabled_message")
                .setLabel("Disabled message (if disabled is on)")
                .setStyle(discord_js_1.TextInputStyle.Paragraph)
                .setRequired(false)
                .setValue(((_d = bot.botconfig) === null || _d === void 0 ? void 0 : _d.disabled_message) || "");
            const first = new discord_js_1.ActionRowBuilder().addComponents(exception_log_channel);
            const second = new discord_js_1.ActionRowBuilder().addComponents(maintenance);
            const third = new discord_js_1.ActionRowBuilder().addComponents(disabled);
            const fourth = new discord_js_1.ActionRowBuilder().addComponents(disabled_message);
            modal.addComponents(first, second, third, fourth);
            await interaction.showModal(modal);
            return;
        }
        if (hide_reply)
            await interaction.deferReply({ ephemeral: true });
        else
            await interaction.deferReply({ ephemeral: false });
        // the EV(A/I)L command
        if (interaction.options.getSubcommand() === "eval") {
            const code = interaction.options.getString("code", true);
            let trimmed_string;
            try {
                let evaled = await eval(code);
                if (typeof evaled !== "string") {
                    evaled = (0, util_1.inspect)(evaled);
                }
                trimmed_string = evaled.substring(0, 2000);
            }
            catch (e) {
                trimmed_string = (e.message ? e.message : e).substring(0, 2000);
            }
            await interaction.editReply("```JS\n" + trimmed_string + "```");
            return;
        }
        // editlyrics command
        if (interaction.options.getSubcommand() === "editlyrics") {
            await (0, editlyrics_1.default)(bot, interaction);
            return;
        }
        // shutdown command
        if (interaction.options.getSubcommand() === "shutdown") {
            try {
                const collectors = bot.cache.collectors.get();
                if (collectors.length) {
                    await interaction.editReply(`Gracefully shutting down the bot... (Terminating **${collectors.length}** active collectors.)`);
                    collectors.forEach((collector) => collector.emit("end"));
                }
                else {
                    await interaction.editReply("Gracefully shutting down the bot... (No active collectors.)");
                }
            }
            catch (e) {
                // ignore any error and continue shutting down
                console.log(e);
            }
            // wait 3s and destroy the Client
            setTimeout(async () => {
                await interaction.editReply("All active processes have been terminated. Bye!");
                client.destroy();
                (0, process_1.exit)(0);
            }, 3000);
            return;
        }
    },
};

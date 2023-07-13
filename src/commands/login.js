"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const Template_1 = require("../classes/Template");
const BotMessage_1 = tslib_1.__importDefault(require("../handlers/BotMessage"));
const DB_1 = tslib_1.__importDefault(require("../handlers/DB"));
const User_1 = tslib_1.__importDefault(require("../handlers/LastFM_components/User"));
const codeblock_1 = tslib_1.__importDefault(require("../misc/codeblock"));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("login")
        .setDescription("Login to the bot using your Last.fm username")
        .addStringOption((option) => option
        .setName("username")
        .setDescription("Last.fm username")
        .setRequired(true)),
    async execute(bot, client, interaction) {
        const response = new BotMessage_1.default({
            bot,
            interaction,
        });
        const username = interaction.options.getString("username", true);
        const escapeRegex = (str) => {
            return str.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
        };
        const RE = new RegExp("^" + escapeRegex(username) + "$", "i");
        const existing_crowns = await bot.models.crowns.find({
            guildID: interaction.guild.id,
            userID: interaction.user.id,
            lastfm_username: { $not: RE },
        });
        let has_existing_crowns = !!existing_crowns.length;
        /*
              Might need to run this after the timeout
        */
        const update_db = async () => {
            const db = new DB_1.default(bot.models);
            const user = await db.fetch_user(interaction.guild.id, interaction.user.id);
            if (user) {
                await db.remove_user(interaction.guild.id, interaction.user.id);
            }
            const lastfm_user = await new User_1.default({ username }).get_info();
            if (lastfm_user.lastfm_errorcode || !lastfm_user.success) {
                response.error("lastfm_error", lastfm_user.lastfm_errormessage);
                return;
            }
            if (await db.add_user(interaction.guild.id, interaction.user.id, username)) {
                response.text = `Username ${(0, codeblock_1.default)(username)} has been associated to your Discord account.`;
            }
            else {
                response.text = new Template_1.Template().get("exception");
            }
            await response.send();
        };
        /*
              ^^^^^ Might need to run this after the timeout
        */
        if (!has_existing_crowns) {
            await update_db();
            return;
        }
        if (has_existing_crowns) {
            const row = (new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId("continue")
                .setLabel("DELETE crowns and continue")
                .setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
                .setCustomId("cancel")
                .setLabel("Cancel")
                .setStyle(discord_js_1.ButtonStyle.Secondary)));
            await interaction.followUp({
                content: `You have **${existing_crowns.length}** crowns registered under another Last.fm username.\nChanging your username will **delete** those crowns in this server. Continue?`,
                components: [row],
                ephemeral: true,
            });
            const filter = (i) => i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({
                componentType: discord_js_1.ComponentType.Button,
                filter,
                time: 120000,
            });
            bot.cache.collectors.add(collector);
            collector.once("collect", async (i) => {
                if (i.customId === "cancel") {
                    await interaction.editReply({
                        content: `Cancelled. No changes are made.`,
                        components: [],
                    });
                }
                else if (i.customId === "continue") {
                    const delete_stats = await bot.models.crowns.deleteMany({
                        userID: interaction.user.id,
                        guildID: interaction.guild.id,
                        lastfm_username: { $not: RE },
                    });
                    has_existing_crowns = false;
                    await interaction.editReply({
                        content: `Your **${delete_stats.deletedCount}** crowns registered under another username in this server have been deleted.`,
                        components: [],
                    });
                    await update_db();
                }
            });
        }
    },
};

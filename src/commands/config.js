"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const BotMessage_1 = tslib_1.__importDefault(require("../handlers/BotMessage"));
const DB_1 = tslib_1.__importDefault(require("../handlers/DB"));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("config")
        .setDescription("Manage the bot's configuration for a server")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageGuild)
        .addSubcommand((option) => option
        .setName("view")
        .setDescription("View the current configuration of the server"))
        .addSubcommand((option) => option
        .setName("crown")
        .setDescription("Options related to obtaining crowns")
        .addIntegerOption((option) => option
        .setName("minplaysforcrown")
        .setDescription("Number of plays required to obtain a crown (default: 1)")
        .setRequired(true))),
    async execute(bot, client, interaction) {
        var _a;
        const db = new DB_1.default(bot.models);
        const response = new BotMessage_1.default({
            bot,
            interaction,
        });
        if (!((_a = interaction.memberPermissions) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionFlagsBits.ManageGuild))) {
            response.text =
                "You do not have the permission (``MANAGE_GUILD``) to execute this command.";
            await response.send();
            return;
        }
        if (interaction.options.getSubcommand() === "view") {
            const server_config = bot.cache.config.get(interaction.guild);
            const min_plays_for_crown = (server_config === null || server_config === void 0 ? void 0 : server_config.min_plays_for_crown) || 1;
            response.text =
                "Current config:\nMinimum plays required to obtain a crown: **" +
                    min_plays_for_crown +
                    "**";
            await response.send();
            return;
        }
        if (interaction.options.getSubcommand() === "crown") {
            const number = interaction.options.getInteger("minplaysforcrown", true);
            if (!number || number <= 0) {
                response.text = "Invalid number passed";
                await response.send();
                return;
            }
            const existing_crowns = await bot.models.crowns.find({
                guildID: interaction.guild.id,
                artistPlays: {
                    $lt: number,
                },
            });
            const config = await db.server_config(interaction);
            const has_existing_crowns = !!existing_crowns.length;
            if (!has_existing_crowns) {
                config.min_plays_for_crown = number;
                await config.save();
                response.text = `Minimum required plays for a crown in this server has been set to **${number}**.`;
                await response.send();
                if (!bot.cache.config.set({
                    guild_ID: interaction.guild.id,
                    min_plays_for_crown: config.min_plays_for_crown,
                }, interaction.guild)) {
                    response.text =
                        `New configuration for this server has been set but the cache couldn't be updated; the bot will continue using the previous config until it restarts. ` +
                            `Please contact the bot maintainer (use /about).`;
                    await response.send();
                }
                return;
            }
            // if there are existing crowns
            if (has_existing_crowns) {
                const row = (new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId("continue")
                    .setLabel("DELETE crowns and continue")
                    .setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
                    .setCustomId("cancel")
                    .setLabel("Cancel")
                    .setStyle(discord_js_1.ButtonStyle.Secondary)));
                await interaction.followUp({
                    content: `You are setting the minimum plays required to gain a crown in this server to **${number}**.\n` +
                        `There are existing **${existing_crowns.length}** crowns in this server with less than **${number}** plays \n\n` +
                        `:warning: Continuing will __delete__ **${existing_crowns.length}** crowns and set the specified limit.`,
                    components: [row],
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
                        await bot.models.crowns.deleteMany({
                            guildID: interaction.guild.id,
                            artistPlays: {
                                $lt: number,
                            },
                        });
                        config.min_plays_for_crown = number;
                        await config.save();
                        await interaction.editReply({
                            content: `Minimum required plays for a crown in this server has been set to **${number}** ` +
                                `and existing **${existing_crowns.length}** crowns with less than the specified plays ` +
                                `have been deleted.`,
                            components: [],
                        });
                        if (!bot.cache.config.set({
                            guild_ID: interaction.guild.id,
                            min_plays_for_crown: config.min_plays_for_crown,
                        }, interaction.guild)) {
                            response.text =
                                `New configuration for this server has been set but the cache couldn't be updated; the bot will continue using the previous config until it restarts. ` +
                                    `Please contact the bot maintainer (use /about).`;
                            await response.send();
                        }
                    }
                });
            }
        }
    },
};

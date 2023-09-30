"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const GLOBALS_1 = tslib_1.__importDefault(require("../../GLOBALS"));
const { SlashCommandBuilder } = require("discord.js");
module.exports = {
    data: new SlashCommandBuilder()
        .setName("about")
        .setDescription("Display the bot's invite link, support server, maintainer, and more"),
    async execute(bot, client, interaction, response) {
        const formatUptime = (seconds) => {
            // idk i copied from chatgpt
            const days = Math.floor(seconds / 86400);
            seconds %= 86400;
            const hours = Math.floor(seconds / 3600);
            seconds %= 3600;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
        };
        const uptime_seconds = process.uptime();
        const formatted_uptime = formatUptime(uptime_seconds);
        const row = (new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setLabel("Invite to your server")
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL("https://discord.com/api/oauth2/authorize?client_id=636075999154536449&permissions=313344&scope=bot"), new discord_js_1.ButtonBuilder()
            .setLabel("Join support server")
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL(GLOBALS_1.default.SUPPORT_SERVER)));
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle("CrownBot")
            .setDescription("A Discord bot that uses the Last.fm API to track users' scrobbling-history to provide various stats and leader-boards.")
            .addFields([
            { name: "Version", value: bot.version },
            { name: "Uptime", value: formatted_uptime },
            { name: "Maintainer", value: "shaun#4761" },
            { name: "Repository", value: "<https://github.com/d-shaun/CrownBot/>" },
            {
                name: "Invite link",
                value: "<https://discord.com/api/oauth2/authorize?client_id=636075999154536449&permissions=313344&scope=bot>",
            },
            {
                name: "Support server",
                value: GLOBALS_1.default.SUPPORT_SERVER,
            },
        ]);
        response.embeds = [embed];
        response.embed_components = [row];
        return response;
    },
};

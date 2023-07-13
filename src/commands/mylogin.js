"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const DB_1 = tslib_1.__importDefault(require("../handlers/DB"));
const escapemarkdown_1 = tslib_1.__importDefault(require("../misc/escapemarkdown"));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("mylogin")
        .setDescription("Display your Last.fm username that is set on this bot"),
    async execute(bot, client, interaction, response) {
        const db = new DB_1.default(bot.models);
        const discord_user = interaction.user;
        const user = await db.fetch_user(interaction.guild.id, discord_user.id);
        if (!user) {
            return response.error("custom", "User is not logged in");
        }
        response.text = `Your Last.fm username is **${(0, escapemarkdown_1.default)(user.username)}** ([visit](https://last.fm/user/${user.username})).`;
        return response;
    },
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const Template_1 = require("../classes/Template");
const DB_1 = tslib_1.__importDefault(require("../handlers/DB"));
const codeblock_1 = tslib_1.__importDefault(require("../misc/codeblock"));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("logout")
        .setDescription("Logs you out of the bot")
        .addBooleanOption((option) => option
        .setName("global")
        .setDescription("Logout from the bot in all servers (globally)")),
    async execute(bot, client, interaction, response) {
        const db = new DB_1.default(bot.models);
        if (interaction.options.getBoolean("global")) {
            const user = await db.fetch_user(undefined, interaction.user.id, true);
            if (!user) {
                response.text = `You aren't logged into the bot in any server; use the ${(0, codeblock_1.default)("/login")} command to login.`;
                return response;
            }
            if (await db.remove_user(undefined, interaction.user.id, true)) {
                response.text = `You have been logged out from the bot globally.`;
            }
            else {
                response.text = new Template_1.Template().get("exception");
            }
            return response;
        }
        const user = await db.fetch_user(interaction.guild.id, interaction.user.id);
        if (!user) {
            response.text = `You aren't logged in; use the ${(0, codeblock_1.default)("/login")} command to login.`;
            return response;
        }
        if (await db.remove_user(interaction.guild.id, interaction.user.id)) {
            response.text = `You have been logged out from the bot in this server; use ${(0, codeblock_1.default)("/logout true")} to logout globally.`;
        }
        else {
            response.text = new Template_1.Template().get("exception");
        }
        return response;
    },
};

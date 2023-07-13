"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const DB_1 = tslib_1.__importDefault(require("../handlers/DB"));
const codeblock_1 = tslib_1.__importDefault(require("../misc/codeblock"));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("ban")
        .setDescription("Ban a user from accessing the bot and showing up on various lists")
        .addUserOption((option) => option
        .setName("discord_user")
        .setDescription("User to ban")
        .setRequired(true)),
    async execute(bot, client, interaction, response) {
        var _a;
        const db = new DB_1.default(bot.models);
        const has_permission = (_a = interaction.memberPermissions) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionFlagsBits.BanMembers);
        if (!has_permission) {
            return response.error("custom", "You do not have the permission (``BAN_MEMBERS``) to execute this command.");
        }
        const user = interaction.options.getUser("discord_user", true);
        const banned_user = await bot.models.bans.findOne({
            guildID: interaction.guild.id,
            userID: user.id,
        });
        if (banned_user) {
            response.text =
                `${(0, codeblock_1.default)(user.tag)} has already been banned on this server; ` +
                    `looking for the ${(0, codeblock_1.default)("/unban")} command, maybe?`;
            return response;
        }
        if (await db.ban_user(interaction, user)) {
            response.text = `${(0, codeblock_1.default)(user.tag)} has been banned from accessing the bot and showing up on the 'whoknows' list.`;
            return response;
        }
        else {
            return response.error("exception");
        }
    },
};

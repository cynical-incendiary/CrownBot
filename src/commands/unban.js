"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("unban")
        .setDescription("Unban a previously banned user from the bot")
        .addUserOption((option) => option
        .setName("discord_user")
        .setDescription("User to unban")
        .setRequired(true)),
    async execute(bot, client, interaction, response) {
        var _a;
        const has_permission = (_a = interaction.memberPermissions) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionFlagsBits.BanMembers);
        if (!has_permission) {
            response.text =
                "You do not have the permission (``BAN_MEMBERS``) to execute this command.";
            return response;
        }
        const user = interaction.options.getUser("discord_user", true);
        const banned_user = await bot.models.bans.findOne({
            guildID: interaction.guild.id,
            userID: user.id,
        });
        if (!banned_user) {
            response.text = `\`${user.tag}\` isn't banned in this guild.`;
            return response;
        }
        if (await banned_user.remove()) {
            response.text = `\`${user.tag}\` has been unbanned.`;
            return response;
        }
        else {
            return response.error("exception");
        }
    },
};

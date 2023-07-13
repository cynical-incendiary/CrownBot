"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Checks if a user is banned (both locally or globally).
 * - Both local and global bans will result in `<response>.banned` being `true`
 * - The type of the ban (if banned) is specified in `<response>.type`.
 *
 * @param interaction
 * @param bot
 */
async function check_ban(interaction, bot) {
    const response = {
        banned: false,
        type: undefined,
    };
    const bans = await bot.models.bans.find({
        userID: interaction.user.id,
        guildID: { $in: [interaction.guild.id, "any"] },
    });
    if (!bans.length) {
        return response;
    }
    response.banned = true;
    response.type = "local";
    if (bans.find((ban) => ban.guildID === "any")) {
        response.type = "global";
    }
    return response;
}
exports.default = check_ban;

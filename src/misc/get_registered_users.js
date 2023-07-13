"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Returns users registered to the bot in a server.
 * - Filters out locally and/or globally banned users.
 * @param bot
 * @param interaction
 */
async function get_registered_users(bot, interaction) {
    const banned_users = await bot.models.bans.find({
        guildID: { $in: [interaction.guild.id, "any"] },
    });
    const banned_ids = banned_users.map((user) => user.userID);
    const server_db = (await bot.models.serverusers.find({
        guildID: interaction.guild.id,
    })).filter((user) => !banned_ids.includes(user.userID));
    const entries = [];
    const split_to_chunks = (arr, len) => {
        const chunks = [], n = arr.length;
        let i = 0;
        while (i < n) {
            chunks.push(arr.slice(i, (i += len)));
        }
        return chunks;
    };
    const split_users = split_to_chunks(server_db, 80);
    const discord = [];
    for await (const chunk of split_users) {
        const res = await interaction.guild.members.fetch({
            user: chunk.map((user) => user.userID),
        });
        const values = [...res.values()];
        discord.push(...values);
    }
    for await (const djsuser of discord) {
        if (!djsuser)
            continue;
        const dbuser = server_db.find((user) => user.userID === djsuser.id);
        if (!dbuser)
            continue;
        entries.push({ discord: djsuser, database: dbuser });
    }
    return { users: entries };
}
exports.default = get_registered_users;

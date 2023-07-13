"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const get_registered_users_1 = tslib_1.__importDefault(require("../misc/get_registered_users"));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("crownboard")
        .setDescription("See the server's crown leaderboard"),
    async execute(bot, client, interaction, response) {
        var _a;
        const server_users = (_a = (await (0, get_registered_users_1.default)(bot, interaction))) === null || _a === void 0 ? void 0 : _a.users;
        if (!server_users)
            return response.fail();
        const crowns = await bot.models.crowns.find({
            guildID: interaction.guild.id,
            userID: {
                $in: server_users.map((user) => user.database.userID),
            },
        });
        const counts = crowns
            .reduce((acc, cur) => {
            let stat = acc.find((cnt) => cnt.userID === cur.userID);
            const discord_user = server_users.find((user) => {
                return user.database.userID === cur.userID;
            });
            if (!discord_user)
                throw "User fetched from 'get_registered_user' is not found again (?)";
            if (!stat) {
                stat = {
                    username: discord_user.discord.user.username,
                    lastfm_username: cur.lastfm_username,
                    userID: cur.userID,
                    count: 1,
                };
                acc.push(stat);
            }
            else {
                stat.count++;
            }
            return acc;
        }, [])
            .sort((a, b) => b.count - a.count);
        const embed = new discord_js_1.EmbedBuilder().setTitle(`Crown leaderboard`);
        if (!counts.length) {
            response.text =
                "Nobody has acquired any crown in this server; try using the `whoknows` command.";
            return response;
        }
        const data_list = counts.map((user) => {
            return `**${user.username}** — **${user.count}** crowns`;
        });
        response.paginate = true;
        response.paginate_embed = embed;
        response.paginate_data = data_list;
        response.paginate_numbering = true;
        return response;
    },
};

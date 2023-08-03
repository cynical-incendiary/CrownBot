"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const moment_1 = tslib_1.__importDefault(require("moment"));
const DB_1 = tslib_1.__importDefault(require("../handlers/DB"));
const User_1 = tslib_1.__importDefault(require("../handlers/LastFM_components/User"));
const escapemarkdown_1 = tslib_1.__importDefault(require("../misc/escapemarkdown"));
const time_difference_1 = tslib_1.__importDefault(require("../misc/time_difference"));
const truncate_1 = tslib_1.__importDefault(require("../misc/truncate"));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("recent")
        .setDescription("See your recently played tracks")
        .addUserOption((option) => option
        .setName("discord_user")
        .setDescription("User to get recent tracks of (defaults to you)")
        .setRequired(false)),
    async execute(bot, client, interaction, response) {
        var _a;
        response.allow_retry = true;
        const db = new DB_1.default(bot.models);
        const discord_user = interaction.options.getUser("discord_user") || interaction.user;
        const user = await db.fetch_user(interaction.guild.id, discord_user.id);
        if (!user) {
            response.text = "User is not logged in.";
            return response;
        }
        const lastfm_user = new User_1.default({ username: user.username, limit: 10 });
        const query = await lastfm_user.get_recenttracks();
        if (!query.success || query.lastfm_errorcode) {
            return response.error("lastfm_error", query.lastfm_errormessage);
        }
        const recent_tracks = query.data.recenttracks.track.map((track, i) => {
            track.id = i;
            return track;
        });
        if (!recent_tracks || !recent_tracks.length) {
            response.text = `Couldn't find any scrobbles on this account.`;
            return response;
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`Recent tracks`)
            .setFooter({
            text: `Displaying recent ${recent_tracks.length} tracks played by ${discord_user.username}.`,
        })
            .setColor(discord_js_1.Colors.DarkGreen);
        for (const track of recent_tracks) {
            let time_str = "Unknown";
            if ((_a = track["@attr"]) === null || _a === void 0 ? void 0 : _a.nowplaying) {
                time_str = "Playing";
            }
            else {
                const timestamp = moment_1.default.unix(parseInt(track.date.uts)).valueOf();
                time_str = (0, time_difference_1.default)(timestamp) + " ago";
            }
            embed.addFields({
                name: time_str,
                value: `**${(0, escapemarkdown_1.default)(track.artist["#text"], true)}** — [${(0, escapemarkdown_1.default)(track.name, true)}](${(0, truncate_1.default)(track.url, 200)}) · ${(0, escapemarkdown_1.default)(track.album["#text"], true)}`,
            });
        }
        response.embeds = [embed];
        return response;
    },
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const DB_1 = tslib_1.__importDefault(require("../handlers/DB"));
const Artist_1 = tslib_1.__importDefault(require("../handlers/LastFM_components/Artist"));
const User_1 = tslib_1.__importDefault(require("../handlers/LastFM_components/User"));
const escapemarkdown_1 = tslib_1.__importDefault(require("../misc/escapemarkdown"));
const time_difference_1 = tslib_1.__importDefault(require("../misc/time_difference"));
const moment_1 = tslib_1.__importDefault(require("moment"));
// @ts-ignore
const number_abbreviate_1 = tslib_1.__importDefault(require("number-abbreviate"));
const CommandResponse_1 = require("../handlers/CommandResponse");
const Album_1 = tslib_1.__importDefault(require("../handlers/LastFM_components/Album"));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("albumplays")
        .setDescription("Display user's playcount of an album")
        .addStringOption((option) => option
        .setName("album_name")
        .setDescription("Album name (defaults to now-playing)")
        .setRequired(false))
        .addStringOption((option) => option
        .setName("artist_name")
        .setDescription("The artist's name")
        .setRequired(false)),
    async execute(bot, client, interaction, response) {
        response.allow_retry = true;
        const db = new DB_1.default(bot.models);
        const user = await db.fetch_user(interaction.guild.id, interaction.user.id);
        if (!user)
            return response.fail();
        const lastfm_user = new User_1.default({
            username: user.username,
        });
        let album_name = interaction.options.getString("album_name");
        let artist_name = interaction.options.getString("artist_name");
        if (!album_name) {
            const now_playing = await lastfm_user.new_get_nowplaying(interaction, response);
            if (now_playing instanceof CommandResponse_1.CommandResponse)
                return now_playing;
            artist_name = now_playing.artist["#text"];
            album_name = now_playing.album["#text"];
        }
        if (!artist_name) {
            const query = await new Album_1.default({
                name: album_name,
                limit: 1,
            }).search();
            if (query.lastfm_errorcode || !query.success) {
                return response.error("lastfm_error", query.lastfm_errormessage);
            }
            const album = query.data.results.albummatches.album.shift();
            if (!album) {
                return response.error("custom", "Couldn't find the album.");
            }
            artist_name = album.artist;
            album_name = album.name;
        }
        const query_album = await new Album_1.default({
            name: album_name,
            artist_name,
            username: user.username,
        }).user_get_info();
        const query_artist = await new Artist_1.default({
            name: artist_name,
            username: user.username,
        }).user_get_info();
        if (query_album.lastfm_errorcode || !query_album.success) {
            return response.error("lastfm_error", query_album.lastfm_errormessage);
        }
        if (query_artist.lastfm_errorcode || !query_artist.success) {
            return response.error("lastfm_error", query_artist.lastfm_errormessage);
        }
        const artist = query_artist.data.artist;
        const album = query_album.data.album;
        if (album.userplaycount === undefined)
            return response.fail();
        let last_count = 0;
        let album_cover = false;
        if (album.image) {
            const last_item = album.image.pop();
            album_cover = last_item ? last_item["#text"] : false;
        }
        const strs = {
            count: "No change",
            time: false,
        };
        const last_log = await bot.models.albumlog.findOne({
            name: album.name,
            artistName: album.artist,
            userID: interaction.user.id,
        });
        if (last_log) {
            last_count = last_log.userplaycount;
            strs.time = (0, time_difference_1.default)(last_log.timestamp);
        }
        const count_diff = album.userplaycount - last_count;
        if (count_diff < 0) {
            strs.count = `:small_red_triangle_down: ${count_diff}`;
        }
        else if (count_diff > 0) {
            strs.count = `+${count_diff}`;
        }
        const aggr_str = strs.time
            ? `**${strs.count}** since last checked ${strs.time} ago.`
            : "";
        const artist_plays = artist.stats.userplaycount;
        const percentage = {
            album: ((album.userplaycount / album.playcount) * 100).toFixed(2),
            artist: ((album.userplaycount / artist_plays) * 100).toFixed(2),
        };
        const percentage_text = {
            album: `(**${percentage.album}%** of ${(0, number_abbreviate_1.default)(album.playcount, 1)} global album plays)`,
            artist: ` — **${percentage.artist}%** of **${(0, number_abbreviate_1.default)(artist_plays, 1)}** artist plays `,
        };
        if (percentage.artist === "NaN") {
            percentage_text.artist = "";
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`Album plays`)
            .setDescription(`**${(0, escapemarkdown_1.default)(album.name)}** by **${(0, escapemarkdown_1.default)(album.artist)}** — ${album.userplaycount} play(s)` +
            `${percentage_text.artist}\n\n` +
            `${percentage_text.album}\n\n` +
            `${aggr_str}`);
        if (album_cover)
            embed.setThumbnail(album_cover);
        await this.update_log(bot, interaction, album);
        response.embeds = [embed];
        return response;
    },
    async update_log(client, interaction, album) {
        const timestamp = moment_1.default.utc().valueOf();
        await client.models.albumlog.findOneAndUpdate({
            name: album.name,
            artistName: album.artist,
            userID: interaction.user.id,
        }, {
            name: album.name,
            artistName: album.artist,
            userID: interaction.user.id,
            userplaycount: album.userplaycount,
            timestamp,
        }, {
            upsert: true,
            useFindAndModify: false,
        });
    },
};

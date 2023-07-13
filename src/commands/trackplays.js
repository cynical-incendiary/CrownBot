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
const Track_1 = tslib_1.__importDefault(require("../handlers/LastFM_components/Track"));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("trackplays")
        .setDescription("See user's play count of a track")
        .addStringOption((option) => option
        .setName("track_name")
        .setDescription("Track name (defaults to now-playing)")
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
        let track_name = interaction.options.getString("track_name");
        let artist_name = interaction.options.getString("artist_name");
        if (!track_name) {
            const now_playing = await lastfm_user.new_get_nowplaying(interaction, response);
            if (now_playing instanceof CommandResponse_1.CommandResponse)
                return now_playing;
            track_name = now_playing.name;
            artist_name = now_playing.artist["#text"];
        }
        if (!artist_name) {
            const query = await new Track_1.default({
                name: track_name,
                limit: 1,
            }).search();
            if (query.lastfm_errorcode || !query.success) {
                return response.error("lastfm_error", query.lastfm_errormessage);
            }
            const track = query.data.results.trackmatches.track.shift();
            if (!track) {
                response.text = `Couldn't find the track.`;
                return response;
            }
            track_name = track.name;
            artist_name = track.artist;
        }
        const track_query = await new Track_1.default({
            name: track_name,
            artist_name,
            username: user.username,
        }).user_get_info();
        const artist_query = await new Artist_1.default({
            name: artist_name,
            username: user.username,
        }).user_get_info();
        if (artist_query.lastfm_errorcode ||
            track_query.lastfm_errorcode ||
            !(artist_query.success && track_query.success)) {
            return response.error("lastfm_error", artist_query.lastfm_errormessage);
        }
        const artist = artist_query.data.artist;
        const track = track_query.data.track;
        if (track.userplaycount === undefined)
            return response.fail();
        let last_count = 0;
        const strs = {
            count: "No change",
            time: false,
        };
        const last_log = await bot.models.tracklog.findOne({
            name: track.name,
            artistName: track.artist.name,
            userID: interaction.user.id,
        });
        if (last_log) {
            last_count = last_log.userplaycount;
            strs.time = (0, time_difference_1.default)(last_log.timestamp);
        }
        const count_diff = track.userplaycount - last_count;
        if (count_diff < 0) {
            strs.count = `:small_red_triangle_down: ${count_diff}`;
        }
        else if (count_diff > 0) {
            strs.count = `+${count_diff}`;
        }
        const aggr_str = strs.time
            ? `**${strs.count}** since last checked ${strs.time} ago.`
            : "";
        let artist_plays = 0;
        if (artist.stats && artist.stats.userplaycount) {
            artist_plays = artist.stats.userplaycount;
        }
        const percentage = {
            track: ((track.userplaycount / track.playcount) * 100).toFixed(2),
            artist: ((track.userplaycount / artist_plays) * 100).toFixed(2),
        };
        const percentage_text = {
            track: `(**${percentage.track}%** of ${(0, number_abbreviate_1.default)(track.playcount, 1)} global track plays)`,
            artist: ` — **${percentage.artist}%** of **${(0, number_abbreviate_1.default)(artist_plays, 1)}** artist plays `,
        };
        if (percentage.artist === "NaN") {
            percentage_text.artist = "";
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`Track plays`)
            .setDescription(`**${(0, escapemarkdown_1.default)(track.name)}** by **${track.artist.name}** — ${track.userplaycount} play(s)` +
            `${percentage_text.artist}\n\n` +
            `${percentage_text.track}\n\n` +
            `${aggr_str}`);
        await this.update_log(bot, interaction, track);
        response.embeds = [embed];
        return response;
    },
    async update_log(bot, interaction, track) {
        const timestamp = moment_1.default.utc().valueOf();
        await bot.models.tracklog.findOneAndUpdate({
            name: track.name,
            artistName: track.artist.name,
            userID: interaction.user.id,
        }, {
            name: track.name,
            artistName: track.artist.name,
            userplaycount: track.userplaycount,
            userID: interaction.user.id,
            timestamp,
        }, {
            upsert: true,
            useFindAndModify: false,
        });
    },
};

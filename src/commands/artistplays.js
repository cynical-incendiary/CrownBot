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
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("artistplays")
        .setDescription("Display user's playcount of an artist.")
        .addStringOption((option) => option
        .setName("artist_name")
        .setDescription("Artist name (defaults to now-playing)")
        .setRequired(false)
        .setAutocomplete(true)),
    async execute(bot, client, interaction, response) {
        var _a, _b;
        response.allow_retry = true;
        const db = new DB_1.default(bot.models);
        const user = await db.fetch_user(interaction.guild.id, interaction.user.id);
        if (!user)
            return response.fail();
        const lastfm_user = new User_1.default({
            username: user.username,
        });
        let artist_name = interaction.options.getString("artist_name");
        if (!artist_name) {
            const now_playing = await lastfm_user.new_get_nowplaying(interaction, response);
            if (now_playing instanceof CommandResponse_1.CommandResponse)
                return now_playing;
            artist_name = now_playing.artist["#text"];
        }
        const query = await new Artist_1.default({
            name: artist_name,
            username: user.username,
        }).user_get_info();
        if (query.lastfm_errorcode || !query.success) {
            return response.error("lastfm_error", query.lastfm_errormessage);
        }
        const artist = query.data.artist;
        let last_count = 0;
        const strs = {
            count: "No change",
            time: false,
        };
        const last_log = await bot.models.artistlog.findOne({
            name: artist.name,
            userID: interaction.user.id,
        });
        if (last_log) {
            last_count = last_log.userplaycount;
            strs.time = (0, time_difference_1.default)(last_log.timestamp);
        }
        const last_wk_log = await bot.models.whoknowslog.findOne({
            artist_name: artist.name,
            guild_id: interaction.guild.id,
        });
        const count_diff = artist.stats.userplaycount - last_count;
        if (count_diff < 0) {
            strs.count = `:small_red_triangle_down: ${count_diff}`;
        }
        else if (count_diff > 0) {
            strs.count = `+${count_diff}`;
        }
        const aggr_str = strs.time
            ? `**${strs.count}** since last checked ${strs.time} ago.`
            : "";
        const percentage = ((artist.stats.userplaycount / artist.stats.playcount) *
            100).toFixed(2);
        console.log(artist);
        const thumb = (_a = artist.image.pop()) === null || _a === void 0 ? void 0 : _a["#text"];
        const short_bio = (_b = artist.bio) === null || _b === void 0 ? void 0 : _b.summary.replace(/<a href.*<\/a>/g, ` (Source: [Last.fm](${artist.url}))`);
        const text = `# ${(0, escapemarkdown_1.default)(artist.name)}\n## Bio\n${short_bio}\n## Stats\n`;
        const embed = new discord_js_1.EmbedBuilder().setDescription(text);
        console.log(last_wk_log);
        const fields = [
            {
                name: "Global (Last.fm)",
                value: `${(0, number_abbreviate_1.default)(artist.stats.playcount, 1)} plays (${(0, number_abbreviate_1.default)(artist.stats.listeners, 1)} listeners)`,
                inline: true,
            },
        ];
        if (last_wk_log) {
            const aggr_plays = last_wk_log.stat.reduce((acc, cur) => acc + parseInt(cur.userplaycount), 0);
            fields.push({
                name: "This server",
                value: `${aggr_plays} plays (${last_wk_log.stat.length} listeners)`,
                inline: true,
            });
        }
        fields.push({
            name: `${interaction.user.username}'s playcount`,
            value: `**${artist.stats.userplaycount} play(s)** — (**${percentage}%** of ${(0, number_abbreviate_1.default)(artist.stats.playcount, 1)} plays) \n ${aggr_str}`,
            inline: false,
        });
        embed.addFields(fields);
        if (thumb)
            embed.setThumbnail(thumb);
        // .setDescription(
        //   `**${esm(artist.name)}** — **${
        //     artist.stats.userplaycount
        // } play(s)** \n\n (**${percentage}%** of ${abbreviate(
        //   artist.stats.playcount,
        //   1
        // )} plays) \n\n ${aggr_str}`
        // );
        await this.update_log(bot, interaction, artist);
        response.embeds = [embed];
        return response;
    },
    async update_log(client, interaction, artist) {
        const timestamp = moment_1.default.utc().valueOf();
        await client.models.artistlog.findOneAndUpdate({
            name: artist.name,
            userID: interaction.user.id,
        }, {
            name: artist.name,
            userID: interaction.user.id,
            userplaycount: artist.stats.userplaycount,
            timestamp,
        }, {
            upsert: true,
            useFindAndModify: false,
        });
    },
};

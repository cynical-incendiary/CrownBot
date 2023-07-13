"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const moment_1 = tslib_1.__importDefault(require("moment"));
const DB_1 = tslib_1.__importDefault(require("../handlers/DB"));
const User_1 = tslib_1.__importDefault(require("../handlers/LastFM_components/User"));
const Spotify_1 = require("../handlers/Spotify");
const escapemarkdown_1 = tslib_1.__importDefault(require("../misc/escapemarkdown"));
const parse_spotify_presence_1 = tslib_1.__importDefault(require("../misc/parse_spotify_presence"));
const time_difference_1 = tslib_1.__importDefault(require("../misc/time_difference"));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("nowplaying")
        .setDescription("See your currently playing (or the last scrobbled) track")
        .addUserOption((option) => option
        .setName("discord_user")
        .setDescription("User to get now-playing song of (defaults to you)")
        .setRequired(false)),
    async execute(bot, client, interaction, response) {
        response.allow_retry = true;
        const db = new DB_1.default(bot.models);
        const discord_user = interaction.options.getUser("discord_user") || interaction.user;
        const user = await db.fetch_user(interaction.guild.id, discord_user.id);
        if (!user) {
            return response.error("custom", "User is not logged in");
        }
        const lastfm_user = new User_1.default({ username: user.username });
        let spotify_url;
        const embeds = [];
        // Last.fm now-playing
        await (async () => {
            var _a, _b;
            const now_playing = await lastfm_user.get_nowplaying(bot, interaction, 2);
            if (!now_playing) {
                const embed = new discord_js_1.EmbedBuilder()
                    .setTitle("Last.fm")
                    .setDescription(`Currently, it seems you aren't scrobbling anything on your Last.fm account. Try the /recent and /mylogin commands to see your scrobbling history.`);
                embeds.push(embed);
                return;
            }
            let status_text = "🎵 playing now on Last.Fm";
            if (!((_a = now_playing["@attr"]) === null || _a === void 0 ? void 0 : _a.nowplaying) && now_playing.date) {
                const timestamp = moment_1.default.unix(now_playing.date.uts).valueOf();
                status_text = "⏹️ scrobbled " + (0, time_difference_1.default)(timestamp) + " ago";
            }
            const cover = (_b = now_playing.image) === null || _b === void 0 ? void 0 : _b.pop();
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle("Last.fm")
                .setDescription(`**${(0, escapemarkdown_1.default)(now_playing.name)}** by **${(0, escapemarkdown_1.default)(now_playing.artist["#text"])}**\n*${(0, escapemarkdown_1.default)(now_playing.album["#text"])}*`)
                .setFooter({ text: status_text });
            if (cover)
                embed.setThumbnail(cover["#text"]);
            embeds.push(embed);
        })();
        // Spotify presence now-playing
        await (async () => {
            const guild_member = await interaction.guild.members.fetch({
                user: discord_user.id,
            });
            const { artist_name, album_name, track_name, createdTimeStamp } = (0, parse_spotify_presence_1.default)(guild_member);
            if (!(artist_name && album_name && track_name && createdTimeStamp)) {
                return;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle("Spotify")
                .setDescription(`**${(0, escapemarkdown_1.default)(track_name)}** by **${(0, escapemarkdown_1.default)(artist_name)}**\n*${(0, escapemarkdown_1.default)(album_name)}*`)
                .setFooter({
                text: "🎵 playing now on Spotify ",
            });
            try {
                const spotify = new Spotify_1.Spotify();
                await spotify.attach_access_token();
                const track = await spotify.search_track(track_name + " " + artist_name);
                if (track) {
                    spotify_url = track.external_urls.spotify;
                    embed.setThumbnail(track.album.images[0].url);
                }
            }
            catch (_a) {
                spotify_url = undefined;
            }
            embeds.push(embed);
        })();
        if (embeds.length) {
            if (spotify_url) {
                response.follow_up.text = spotify_url;
                response.follow_up.send_as_embed = false;
            }
            response.embeds = embeds;
            return response;
        }
        return response.fail();
    },
};

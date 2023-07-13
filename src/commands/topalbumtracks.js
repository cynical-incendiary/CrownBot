"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const CommandResponse_1 = require("../handlers/CommandResponse");
const DB_1 = tslib_1.__importDefault(require("../handlers/DB"));
const Album_1 = tslib_1.__importDefault(require("../handlers/LastFM_components/Album"));
const User_1 = tslib_1.__importDefault(require("../handlers/LastFM_components/User"));
const codeblock_1 = tslib_1.__importDefault(require("../misc/codeblock"));
const escapemarkdown_1 = tslib_1.__importDefault(require("../misc/escapemarkdown"));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("topalbumtracks")
        .setDescription("List user's top-played tracks in an album")
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
            album_name = now_playing.album["#text"];
            artist_name = now_playing.artist["#text"];
        }
        if (!artist_name) {
            const query = await new Album_1.default({
                name: album_name,
                limit: 1,
            }).search();
            if (query.lastfm_errorcode || !query.success) {
                return response.error("lastfm_error", query.lastfm_errormessage);
            }
            const album = query.data.results.albummatches.album[0];
            if (!album) {
                response.text = `Couldn't find the album.`;
                return response;
            }
            album_name = album.name;
            artist_name = album.artist;
        }
        const query = await new Album_1.default({
            name: album_name,
            artist_name,
            username: user.username,
        }).user_get_info();
        if (query.lastfm_errorcode || !query.success) {
            return response.error("lastfm_error", query.lastfm_errormessage);
        }
        const album = query.data.album;
        const album_tracks = await lastfm_user.get_album_tracks(album.artist, album.name);
        if (!album_tracks) {
            return response.error("lastfm_error");
        }
        if (!album_tracks.length) {
            response.text = "Couldn't find any track that you *may* have scrobbled.";
            return response;
        }
        const total_scrobbles = album_tracks.reduce((a, b) => a + b.plays, 0);
        const embed = new discord_js_1.EmbedBuilder()
            .setDescription(`Track plays — **${album_tracks.length}** tracks · **${total_scrobbles}** plays`)
            .setTitle(`${interaction.user.username}'s top-played tracks from the album ${(0, codeblock_1.default)(album.name)}`)
            .setFooter({ text: `"${album.name}" by ${album.artist}` });
        const data_list = album_tracks.map((elem) => {
            return `${(0, escapemarkdown_1.default)(elem.name)} — **${elem.plays} play(s)**`;
        });
        response.paginate = true;
        response.paginate_embed = embed;
        response.paginate_data = data_list;
        response.paginate_numbering = true;
        return response;
    },
};

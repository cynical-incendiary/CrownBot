"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const CommandResponse_1 = require("../handlers/CommandResponse");
const DB_1 = tslib_1.__importDefault(require("../handlers/DB"));
const Artist_1 = tslib_1.__importDefault(require("../handlers/LastFM_components/Artist"));
const User_1 = tslib_1.__importDefault(require("../handlers/LastFM_components/User"));
const codeblock_1 = tslib_1.__importDefault(require("../misc/codeblock"));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("topalbums")
        .setDescription("List user's top-played albums of an artist")
        .addStringOption((option) => option
        .setName("artist_name")
        .setDescription("The artist's name")
        .setRequired(false)
        .setAutocomplete(true)),
    async execute(bot, client, interaction, response) {
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
        if (!artist.stats.userplaycount || artist.stats.userplaycount <= 0) {
            response.text = `You haven't listened to ${(0, codeblock_1.default)(artist.name)}`;
            return response;
        }
        const albums = await lastfm_user.get_albums(artist.name);
        if (!albums) {
            return response.error("lastfm_error");
        }
        if (!albums.length) {
            response.text =
                "Couldn't find any album that you *may* have scrobbled from this artist.";
            return response;
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setDescription(`Album plays — **${albums.length}** albums`)
            .setTitle(`${interaction.user.username}'s top-played albums by ${(0, codeblock_1.default)(artist.name)}`);
        const data_list = albums.map((elem) => {
            return `${elem.name} — **${elem.plays} play(s)**`;
        });
        response.paginate = true;
        response.paginate_embed = embed;
        response.paginate_data = data_list;
        response.paginate_numbering = true;
        return response;
    },
};

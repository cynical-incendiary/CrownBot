"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const CommandResponse_1 = require("../handlers/CommandResponse");
const DB_1 = tslib_1.__importDefault(require("../handlers/DB"));
const Artist_1 = tslib_1.__importDefault(require("../handlers/LastFM_components/Artist"));
const User_1 = tslib_1.__importDefault(require("../handlers/LastFM_components/User"));
const escapemarkdown_1 = tslib_1.__importDefault(require("../misc/escapemarkdown"));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("trending")
        .setDescription("List an artist's recently trending tracks on Last.fm")
        .addStringOption((option) => option
        .setName("artist_name")
        .setDescription("Artist name")
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
        let artist_name = interaction.options.getString("artist_name");
        if (!artist_name) {
            const now_playing = await lastfm_user.new_get_nowplaying(interaction, response);
            if (now_playing instanceof CommandResponse_1.CommandResponse)
                return now_playing;
            artist_name = now_playing.artist["#text"];
        }
        const artist = new Artist_1.default({ name: artist_name });
        const query = await artist.get_info();
        if (query.lastfm_errorcode || !query.success) {
            return response.error("lastfm_error", query.lastfm_errormessage);
        }
        artist.name = query.data.artist.name;
        const trending = await artist.get_trending();
        if (!trending) {
            return response.error("lastfm_error");
        }
        const embed = new discord_js_1.EmbedBuilder().setTitle(`${(0, escapemarkdown_1.default)(artist.name)}'s trending tracks this week`);
        const data_list = trending.map((elem) => {
            return `**${elem.name}** — **${elem.listeners}** listeners`;
        });
        response.paginate = true;
        response.paginate_embed = embed;
        response.paginate_data = data_list;
        response.paginate_numbering = true;
        return response;
    },
};

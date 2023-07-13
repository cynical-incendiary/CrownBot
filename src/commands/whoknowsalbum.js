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
const get_registered_users_1 = tslib_1.__importDefault(require("../misc/get_registered_users"));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("whoknowsalbum")
        .setDescription("List users who listen to a certain album")
        .addStringOption((option) => option
        .setName("album_name")
        .setDescription("Album name (defaults to now-playing)")
        .setRequired(false))
        .addStringOption((option) => option
        .setName("artist_name")
        .setDescription("The artist's name")
        .setRequired(false)
        .setAutocomplete(true)),
    async execute(bot, client, interaction, response) {
        var _a;
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
        const users = (_a = (await (0, get_registered_users_1.default)(bot, interaction))) === null || _a === void 0 ? void 0 : _a.users;
        if (!users || users.length <= 0) {
            response.text = `No user on this server has registered their Last.fm username; use the ${(0, codeblock_1.default)("/login")} command.`;
            return response;
        }
        if (users.length > bot.max_users) {
            users.length = bot.max_users;
        }
        const lastfm_requests = [];
        for await (const user of users) {
            const context = {
                discord_user: user.discord,
                lastfm_username: user.database.username,
            };
            lastfm_requests.push(new Album_1.default({
                name: album_name,
                artist_name,
                username: user.database.username,
            })
                .user_get_info()
                .then((res) => {
                const response_with_context = {
                    wrapper: res,
                    context,
                };
                return response_with_context;
            }));
        }
        let responses = await Promise.all(lastfm_requests);
        if (!responses.length ||
            responses.some((response) => { var _a, _b; return !((_b = (_a = response.wrapper.data) === null || _a === void 0 ? void 0 : _a.album) === null || _b === void 0 ? void 0 : _b.playcount); })) {
            return response.error("lastfm_error");
        }
        responses = responses.filter((response) => response.wrapper.success);
        let leaderboard = [];
        responses.forEach((response) => {
            var _a;
            const album = response.wrapper.data.album;
            const context = response.context;
            if (!context || !context.discord_user)
                return;
            if (album.userplaycount === undefined)
                return;
            if (album.userplaycount <= 0)
                return;
            leaderboard.push({
                album_name: album.name,
                artist_name: album.artist,
                discord_username: (_a = context.discord_user) === null || _a === void 0 ? void 0 : _a.user.username,
                lastfm_username: context.lastfm_username,
                userplaycount: album.userplaycount,
                user_id: context.discord_user.user.id,
                user_tag: context.discord_user.user.tag,
                guild_id: interaction.guild.id,
            });
        });
        if (leaderboard.length <= 0) {
            response.text = `No one here has played ${(0, codeblock_1.default)(album.name)} by ${(0, codeblock_1.default)(album.artist)}.`;
            return response;
        }
        leaderboard = leaderboard.sort((a, b) => b.userplaycount - a.userplaycount);
        const total_scrobbles = leaderboard.reduce((a, b) => a + b.userplaycount, 0);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`Who knows the album ${(0, codeblock_1.default)(album.name)}?`)
            .setFooter({ text: `"${(0, escapemarkdown_1.default)(album.name)}" by ${(0, escapemarkdown_1.default)(album.artist)}` });
        if (leaderboard.length >= 2) {
            embed.setDescription(`**${total_scrobbles}** plays ― **${leaderboard.length}** listener(s)`);
        }
        const data_list = leaderboard.map((elem) => {
            return `${elem.discord_username} — **${elem.userplaycount} play(s)**`;
        });
        response.paginate = true;
        response.paginate_embed = embed;
        response.paginate_data = data_list;
        response.paginate_numbering = true;
        return response;
    },
};

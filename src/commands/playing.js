"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const User_1 = tslib_1.__importDefault(require("../handlers/LastFM_components/User"));
const codeblock_1 = tslib_1.__importDefault(require("../misc/codeblock"));
const escapemarkdown_1 = tslib_1.__importDefault(require("../misc/escapemarkdown"));
const get_registered_users_1 = tslib_1.__importDefault(require("../misc/get_registered_users"));
const truncate_1 = tslib_1.__importDefault(require("../misc/truncate"));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("playing")
        .setDescription("List tracks that are currently being played in the server"),
    async execute(bot, client, interaction, response) {
        var _a;
        response.allow_retry = true;
        const users = (_a = (await (0, get_registered_users_1.default)(bot, interaction))) === null || _a === void 0 ? void 0 : _a.users;
        if (!users || users.length <= 0) {
            response.text = `No user in this guild has registered their Last.fm username; use ${(0, codeblock_1.default)("/login")}.`;
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
            lastfm_requests.push(new User_1.default({ username: user.database.username, limit: 1 })
                .get_recenttracks()
                .then((res) => {
                const response_with_context = {
                    wrapper: res,
                    context,
                };
                return response_with_context;
            }));
        }
        let responses = await Promise.all(lastfm_requests);
        if (!responses) {
            return response.error("lastfm_error");
        }
        responses = responses
            .filter((response) => response.wrapper.success)
            .filter((response) => {
            var _a;
            const last_track = [
                ...response.wrapper.data.recenttracks.track,
            ].shift();
            return last_track && ((_a = last_track[`@attr`]) === null || _a === void 0 ? void 0 : _a.nowplaying);
        });
        if (!responses.length) {
            response.text =
                "It seems no one in this server is currently playing anything.";
            return response;
        }
        const stats = responses.map((response) => {
            const last_track = [...response.wrapper.data.recenttracks.track].shift();
            return {
                track: last_track,
                context: response.context,
            };
        });
        const embed = new discord_js_1.EmbedBuilder()
            .setDescription(`**${stats.length}** user(s)`)
            .setColor(discord_js_1.Colors.DarkGreen)
            .setTitle(`Now playing in the server`);
        const data_list = stats
            .map((res) => {
            const track = res.track;
            const user = res.context.discord_user;
            if (!track || !user)
                return false;
            const str = `**${(0, escapemarkdown_1.default)(user.user.username)}**\n└ [${(0, escapemarkdown_1.default)(track.name, true)}](${(0, truncate_1.default)(track.url, 200)}) · ${(0, escapemarkdown_1.default)(track.album["#text"], true)} — **${(0, escapemarkdown_1.default)(track.artist["#text"], true)}**\n`;
            return str.substring(0, 1020);
        })
            .filter((x) => x !== false);
        response.paginate = true;
        response.paginate_embed = embed;
        response.paginate_data = data_list;
        response.paginate_elements = 5;
        return response;
    },
};

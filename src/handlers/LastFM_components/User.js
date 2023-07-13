"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
const cheerio_1 = tslib_1.__importDefault(require("cheerio"));
const discord_js_1 = require("discord.js");
const moment_1 = tslib_1.__importDefault(require("moment"));
const Template_1 = require("../../classes/Template");
const codeblock_1 = tslib_1.__importDefault(require("../../misc/codeblock"));
const parse_spotify_presence_1 = tslib_1.__importDefault(require("../../misc/parse_spotify_presence"));
const BotMessage_1 = tslib_1.__importDefault(require("../BotMessage"));
const LastFM_1 = require("../LastFM");
class default_1 extends LastFM_1.LastFM {
    constructor({ username, limit }) {
        super();
        this.configs = {
            autocorrect: 1,
            limit: 10,
        };
        this.username = username;
        if (limit)
            this.configs.limit = limit;
    }
    /**
     * Checks if Last.fm User has at least one scrobble
     */
    validate_user(length, query) {
        if (length <= 0)
            query.lastfm_errormessage =
                "The user you are logged in as hasn't scrobbled anything; please check if you have misspelled your username.";
    }
    async get_info() {
        const query = await this.query({
            method: "user.getInfo",
            user: this.username,
            ...this.configs,
        });
        if (query.success) {
            // only check the following conditions if query is a success.
            // it could be undefined otherwise.
            if (!query.data.user)
                query.success = false;
        }
        return query;
    }
    async get_recenttracks() {
        var _a, _b, _c;
        const query = await this.query({
            method: "user.getRecentTracks",
            user: this.username,
            ...this.configs,
        });
        if (query.success) {
            // only check the following conditions if query is a success.
            // it could be undefined otherwise.
            if (!((_a = query.data.recenttracks) === null || _a === void 0 ? void 0 : _a.track) ||
                !((_b = query.data.recenttracks) === null || _b === void 0 ? void 0 : _b.track.length)) {
                query.success = false;
            }
            this.validate_user((_c = query.data.recenttracks) === null || _c === void 0 ? void 0 : _c.track.length, query);
        }
        return query;
    }
    async get_top_artists({ period }) {
        var _a, _b, _c;
        const query = await this.query({
            method: "user.getTopArtists",
            user: this.username,
            period,
            ...this.configs,
        });
        if (query.success) {
            // only check the following conditions if query is a success.
            // it could be undefined otherwise.
            if (!((_a = query.data.topartists) === null || _a === void 0 ? void 0 : _a.artist) ||
                !((_b = query.data.topartists) === null || _b === void 0 ? void 0 : _b.artist.length)) {
                query.success = false;
            }
            this.validate_user((_c = query.data.topartists) === null || _c === void 0 ? void 0 : _c.artist.length, query);
        }
        return query;
    }
    async get_top_tracks({ period }) {
        var _a, _b, _c;
        const query = await this.query({
            method: "user.getTopTracks",
            user: this.username,
            period,
            ...this.configs,
        });
        if (query.success) {
            // only check the following conditions if query is a success.
            // it could be undefined otherwise.
            if (!((_a = query.data.toptracks) === null || _a === void 0 ? void 0 : _a.track) || !((_b = query.data.toptracks) === null || _b === void 0 ? void 0 : _b.track.length)) {
                query.success = false;
            }
            this.validate_user((_c = query.data.toptracks) === null || _c === void 0 ? void 0 : _c.track.length, query);
        }
        return query;
    }
    async get_top_albums({ period }) {
        var _a, _b, _c;
        const query = await this.query({
            method: "user.getTopAlbums",
            user: this.username,
            period,
            ...this.configs,
        });
        if (query.success) {
            // only check the following conditions if query is a success.
            // it could be undefined otherwise.
            if (!((_a = query.data.topalbums) === null || _a === void 0 ? void 0 : _a.album) || !((_b = query.data.topalbums) === null || _b === void 0 ? void 0 : _b.album.length)) {
                query.success = false;
            }
            this.validate_user((_c = query.data.topalbums) === null || _c === void 0 ? void 0 : _c.album.length, query);
        }
        return query;
    }
    // soon to be replacing the og
    async new_get_nowplaying(interaction, response, priority = 1) {
        if (priority === 1) {
            const presence_np = (0, parse_spotify_presence_1.default)(interaction.member);
            const { artist_name, album_name, track_name } = presence_np;
            if (artist_name && album_name && track_name) {
                const formatted_nowplaying = {
                    is_spotify: true,
                    album: { "#text": album_name },
                    artist: { "#text": artist_name },
                    name: track_name,
                };
                return formatted_nowplaying;
            }
        }
        const prev_limit = this.configs.limit;
        this.configs.limit = 1;
        const query = await this.get_recenttracks();
        this.configs.limit = prev_limit;
        if (query.lastfm_errorcode === 6) {
            response.error_code = "lastfm_error";
            response.error_message = `User ${(0, codeblock_1.default)(this.username)} doesn't exist on Last.fm; please try logging out and in again.`;
            return response;
        }
        if (!query.success || query.lastfm_errorcode) {
            return response.error("lastfm_error", query.lastfm_errormessage);
        }
        const last_track = [...query.data.recenttracks.track].shift();
        if (last_track) {
            const has_now_playing_tag = last_track[`@attr`] && last_track[`@attr`].nowplaying;
            // consider the track scrobbled in the last 3 minutes as 'now-playing'
            let is_scrobbled_recently = false;
            if (last_track.date) {
                const diff = (0, moment_1.default)().diff(moment_1.default.unix(last_track.date.uts), "minutes");
                is_scrobbled_recently = diff <= 3;
            }
            if (has_now_playing_tag || is_scrobbled_recently)
                return last_track;
        }
        return response.error("not_playing");
    }
    /**
     *
     * @param bot
     * @param interaction
     * @param priority Priority for nowplaying.
     *
     * 0 = return both in an array
     *
     * 1 = enable Spotify
     *
     * 2 = disable Spotify
     * @returns
     */
    async get_nowplaying(bot, interaction, priority = 1) {
        const response = new BotMessage_1.default({
            bot,
            interaction,
        });
        if (priority === 1) {
            const presence_np = (0, parse_spotify_presence_1.default)(interaction.member);
            const { artist_name, album_name, track_name } = presence_np;
            if (artist_name && album_name && track_name) {
                const formatted_nowplaying = {
                    is_spotify: true,
                    album: { "#text": album_name },
                    artist: { "#text": artist_name },
                    name: track_name,
                };
                return formatted_nowplaying;
            }
        }
        const prev_limit = this.configs.limit;
        this.configs.limit = 1;
        const query = await this.get_recenttracks();
        this.configs.limit = prev_limit;
        if (query.lastfm_errorcode === 6) {
            response.error("lastfm_error", `User ${(0, codeblock_1.default)(this.username)} doesn't exist on Last.fm; please try logging out and in again.`);
            return;
        }
        if (!query.success || query.lastfm_errorcode) {
            await response.error("lastfm_error", query.lastfm_errormessage);
            return;
        }
        const last_track = [...query.data.recenttracks.track].shift();
        if (last_track) {
            const has_now_playing_tag = last_track[`@attr`] && last_track[`@attr`].nowplaying;
            // consider the track scrobbled in the last 3 minutes as 'now-playing'
            let is_scrobbled_recently = false;
            if (last_track.date) {
                const diff = (0, moment_1.default)().diff(moment_1.default.unix(last_track.date.uts), "minutes");
                is_scrobbled_recently = diff <= 3;
            }
            if (has_now_playing_tag || is_scrobbled_recently)
                return last_track;
        }
        const row = (new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setLabel("Need help?")
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setCustomId("scrobblingfaq")));
        const embed = new discord_js_1.EmbedBuilder().setDescription(new Template_1.Template().get("not_playing"));
        await interaction.editReply({
            embeds: [embed],
            components: [row],
        });
        return;
    }
    //
    //
    // JUST WERKS SECTION
    //
    // LEGACY: SCRAPING.
    // I don't want to remember how these parsers below work, but they work.
    // They're supposed to return either the requested data or undefined.
    // I have no plans of refactoring this to make it consistent with the LastFMResponse<T>.
    //
    parse_chartpage(data) {
        if (typeof data !== "string")
            return undefined;
        const $ = cheerio_1.default.load(data);
        const chart_list = $(".chartlist").find(".chartlist-row");
        const stats = [];
        chart_list.each(function (_, elem) {
            const name = $(elem).find(".chartlist-name").text().trim();
            $(elem).find(".stat-name").remove();
            const plays = $(elem)
                .find(".chartlist-count-bar-value")
                .text()
                .trim()
                .replace(",", "");
            stats.push({
                name,
                plays: parseInt(plays),
            });
        });
        return stats;
    }
    async get_albums(artist_name) {
        const URL = `https://www.last.fm/user/${encodeURIComponent(this.username)}/library/music/${encodeURIComponent(artist_name)}/+albums`;
        try {
            const response = await axios_1.default.get(URL, this.timeout).catch(() => {
                return undefined;
            });
            if ((response === null || response === void 0 ? void 0 : response.status) !== 200 || !response.data) {
                return undefined;
            }
            const stat = this.parse_chartpage(response.data);
            return stat;
        }
        catch (_) {
            return undefined;
        }
    }
    async get_tracks(artist_name) {
        const URL = `https://www.last.fm/user/${encodeURIComponent(this.username)}/library/music/${encodeURIComponent(artist_name)}/+tracks`;
        try {
            const response = await axios_1.default.get(URL, this.timeout).catch(() => {
                return undefined;
            });
            if ((response === null || response === void 0 ? void 0 : response.status) !== 200 || !response.data) {
                return undefined;
            }
            const stat = this.parse_chartpage(response.data);
            return stat;
        }
        catch (_) {
            return undefined;
        }
    }
    async get_album_tracks(artist_name, album_name) {
        try {
            const response = await axios_1.default.get(`https://www.last.fm/user/${encodeURIComponent(this.username)}/library/music/${encodeURIComponent(artist_name)}/${encodeURIComponent(album_name)}`, this.timeout);
            if ((response === null || response === void 0 ? void 0 : response.status) !== 200) {
                return undefined;
            }
            const stat = this.parse_chartpage(response.data);
            return stat;
        }
        catch (_) {
            return undefined;
        }
    }
    parse_library_scrobbles(data) {
        if (typeof data !== "string")
            return undefined;
        const $ = cheerio_1.default.load(data);
        const items = $(".page-content")
            .find("ul.metadata-list")
            .find("li.metadata-item");
        const scrobbles = parseInt($(items[0]).find("p").text().trim().replace(",", ""));
        const average_per_day = parseInt($(items[1]).find("p").text().trim().replace(",", ""));
        return { scrobbles, average_per_day };
    }
    find_library_scrobbles(data) {
        if (typeof data !== "string")
            return undefined;
        const $ = cheerio_1.default.load(data);
        return parseInt($(".page-content")
            .find("ul.metadata-list")
            .find("li.metadata-item")
            .find("p")
            .text()
            .trim()
            .replace(",", ""));
    }
    generate_promise(date_preset, type) {
        return axios_1.default.get(`https://www.last.fm/user/${encodeURIComponent(this.username)}/library${type ? "/" + type : ""}?date_preset=${date_preset}`, this.timeout)
            .catch(() => {
            return undefined;
        })
            .then((response) => {
            return {
                type: type ? type : "scrobbles",
                response,
            };
        });
    }
    async get_stats(date_preset = "LAST_7_DAYS") {
        const promises = [
            this.generate_promise(date_preset),
            this.generate_promise(date_preset, "artists"),
            this.generate_promise(date_preset, "albums"),
            this.generate_promise(date_preset, "tracks"),
        ];
        return Promise.all(promises).then((responses) => {
            var _a, _b, _c, _d;
            let artists, albums, tracks, scrobbles_page;
            for (const item of responses) {
                switch (item.type) {
                    case "scrobbles":
                        scrobbles_page = this.parse_library_scrobbles((_a = item.response) === null || _a === void 0 ? void 0 : _a.data);
                        break;
                    case "artists":
                        artists = this.find_library_scrobbles((_b = item.response) === null || _b === void 0 ? void 0 : _b.data);
                        break;
                    case "albums":
                        albums = this.find_library_scrobbles((_c = item.response) === null || _c === void 0 ? void 0 : _c.data);
                        break;
                    case "tracks":
                        tracks = this.find_library_scrobbles((_d = item.response) === null || _d === void 0 ? void 0 : _d.data);
                }
            }
            if (!(scrobbles_page && artists && albums && tracks)) {
                return undefined;
            }
            const { scrobbles, average_per_day } = scrobbles_page;
            return {
                date_preset,
                scrobbles,
                average_per_day,
                artists,
                albums,
                tracks,
            };
        });
    }
    parse_listening_history(data) {
        if (typeof data !== "string")
            return undefined;
        const $ = cheerio_1.default.load(data);
        const data_points = $(".scrobble-table")
            .find(".table")
            .find("tbody")
            .find("tr");
        const stats = [];
        data_points.each(function (_, elem) {
            const date = $(elem).find(".js-period").text().trim();
            const playcount = $(elem)
                .find(".js-scrobbles")
                .text()
                .trim()
                .replace(",", "");
            stats.push({
                date,
                playcount: parseInt(playcount),
            });
        });
        return stats;
    }
    async get_listening_history(date_preset, artist_name, from) {
        let artist_specific = "";
        let url_param = `date_preset=${date_preset || "LAST_7_DAYS"}`;
        if (from) {
            // listening history of an specified year
            url_param = `from=${from}-01-01&rangetype=year`;
        }
        if (artist_name) {
            artist_specific = "/music/" + encodeURIComponent(artist_name);
        }
        try {
            const response = await axios_1.default.get(`https://www.last.fm/user/${encodeURIComponent(this.username)}/library${artist_specific}?${url_param}`, this.timeout).catch(() => {
                return undefined;
            });
            if ((response === null || response === void 0 ? void 0 : response.status) !== 200) {
                return undefined;
            }
            const stat = this.parse_listening_history(response.data);
            return stat;
        }
        catch (_) {
            return undefined;
        }
    }
}
exports.default = default_1;

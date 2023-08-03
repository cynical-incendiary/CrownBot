"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const DB_1 = tslib_1.__importDefault(require("../handlers/DB"));
const User_1 = tslib_1.__importDefault(require("../handlers/LastFM_components/User"));
const Spotify_1 = require("../handlers/Spotify");
const axios_1 = tslib_1.__importDefault(require("axios"));
const fs_1 = require("fs");
const path_1 = tslib_1.__importDefault(require("path"));
const GLOBALS_1 = tslib_1.__importDefault(require("../../GLOBALS"));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("highlights")
        .setDescription("See your weekly highlights"),
    async execute(bot, client, interaction, response) {
        const db = new DB_1.default(bot.models);
        const discord_user = interaction.user;
        const user = await db.fetch_user(interaction.guild.id, discord_user.id);
        if (!user) {
            response.text = "User is not logged in.";
            return response;
        }
        const lastfm_user = new User_1.default({ username: user.username, limit: 10 });
        const query = await lastfm_user.get_top_artists({
            period: "7day",
        });
        const topartists = query.data.topartists.artist;
        const spotify = new Spotify_1.Spotify();
        let ARTISTS; // send this to template
        try {
            await spotify.attach_access_token().catch(() => {
                throw "Failed authenticating.";
            });
            const map = topartists.map((elem) => {
                return {
                    name: elem.name,
                    playcount: elem.playcount,
                };
            });
            ARTISTS = await spotify.attach_artist_images(map);
        }
        catch (_a) {
            return response.error("spotify_connect");
        }
        const today = new Date();
        const one_week_ago = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 7, today.getUTCHours(), today.getUTCMinutes(), today.getUTCSeconds()));
        const utc_unix = Math.floor(one_week_ago.getTime() / 1000);
        lastfm_user.configs.limit = 190; // 190 entries per page (which is 10: 190*10)
        const DATAPOINTS = []; // send this to template -- array of utc unix timestamps
        const add_to_datapoints = (query) => {
            const new_data = query.data.recenttracks.track
                .filter((track) => track.date) // filters out nowplaying (and idk what else that might cause that?)
                .map((track) => parseInt(track.date.uts));
            DATAPOINTS.push(...new_data);
        };
        const recents = await lastfm_user.get_recenttracks({
            from: utc_unix,
        });
        add_to_datapoints(recents);
        const total_pages = parseInt(recents.data.recenttracks["@attr"].totalPages);
        const looping_pages = total_pages > 10 ? 10 : total_pages; // limit to 10 pages
        const promises = [];
        for (let pageIndex = 2; pageIndex <= looping_pages; pageIndex++) {
            promises.push(lastfm_user
                .get_recenttracks({
                from: utc_unix,
                page: pageIndex,
            })
                .then((data) => add_to_datapoints(data)));
        }
        await Promise.all(promises);
        const file_path = path_1.default.resolve(__dirname, "../../../html/highlights.html");
        const template_html = await fs_1.promises.readFile(file_path);
        const data_code = `
    const LASTFM_USERNAME="${lastfm_user.username}";
    const ARTISTS=${JSON.stringify(ARTISTS)};
    const DATAPOINTS=${JSON.stringify(DATAPOINTS)};
    `;
        const injected_html = template_html
            .toString()
            .replace("//DATA_PLACEHOLDER//", data_code);
        const method = "post";
        const responseType = "arraybuffer";
        const options = {
            responseType,
            method,
            url: "https://crownbotutils.onrender.com/screencap",
            headers: { "Content-Type": "text/plain" },
            data: injected_html,
            timeout: GLOBALS_1.default.GENERAL_TIMEOUT,
        };
        const data_res = (await axios_1.default.request(options).catch(console.error));
        if (data_res.status !== 200)
            return response.fail();
        const img = Buffer.from(data_res.data);
        if (!img)
            return response.fail();
        const attachment = new discord_js_1.AttachmentBuilder(img, {
            name: "chart.png",
        });
        response.files = [attachment];
        return response;
    },
};
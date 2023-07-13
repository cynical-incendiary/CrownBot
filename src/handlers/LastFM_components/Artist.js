"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
const cheerio_1 = tslib_1.__importDefault(require("cheerio"));
const LastFM_1 = require("../LastFM");
class default_1 extends LastFM_1.LastFM {
    constructor({ name, username }) {
        super();
        this.configs = {
            autocorrect: 1,
        };
        this.name = name;
        this.username = username;
    }
    custom_check(response) {
        if (this.username &&
            response.data.artist.stats.userplaycount === undefined) {
            return false;
        }
        return true;
    }
    async get_info() {
        return this.query({
            method: "artist.getInfo",
            artist: this.name,
            user: this.username,
            ...this.configs,
        });
    }
    // with username
    async user_get_info() {
        return await this.get_info();
    }
    // SCRAPING SECTION
    async parse_artistpage(data) {
        if (typeof data !== "string")
            return undefined;
        const $ = cheerio_1.default.load(data);
        const track_list = $(".chartlist").find(".chartlist-row");
        const stats = [];
        track_list.each(function (_, elem) {
            const name = $(elem).find(".chartlist-name").text().trim();
            const listeners = $(elem)
                .find(".chartlist-count-bar-value")
                .text()
                .trim()
                .replace(",", "");
            stats.push({
                name,
                listeners: parseInt(listeners),
            });
        });
        return stats;
    }
    async get_trending() {
        const URL = `https://www.last.fm/music/${encodeURIComponent(this.name)}/+tracks?date_preset=LAST_7_DAYS`; // TODO: Add support for other time-frames available on lfm
        try {
            const response = await axios_1.default.get(URL, this.timeout).catch(() => {
                return undefined;
            });
            if ((response === null || response === void 0 ? void 0 : response.status) !== 200 || !response.data) {
                return undefined;
            }
            const stat = this.parse_artistpage(response.data);
            return stat;
        }
        catch (_) {
            return undefined;
        }
    }
}
exports.default = default_1;

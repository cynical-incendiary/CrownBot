"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LastFM_1 = require("../LastFM");
class default_1 extends LastFM_1.LastFM {
    constructor({ name, artist_name, username, limit, }) {
        super();
        this.configs = {
            autocorrect: 1,
            limit: 10,
        };
        this.name = name;
        this.artist_name = artist_name;
        this.username = username;
        if (limit)
            this.configs.limit = limit;
    }
    custom_check(response) {
        var _a;
        if (this.username && ((_a = response.data.album) === null || _a === void 0 ? void 0 : _a.userplaycount) === undefined) {
            return false;
        }
        return true;
    }
    async get_info() {
        return this.query({
            method: "album.getInfo",
            album: this.name,
            artist: this.artist_name,
            user: this.username,
            ...this.configs,
        });
    }
    // with username
    async user_get_info() {
        return await this.get_info();
    }
    async search() {
        if (!this.name)
            throw "Album name is required to search.";
        return this.query({
            method: "album.search",
            album: this.name,
            user: this.username,
            ...this.configs,
        });
    }
}
exports.default = default_1;

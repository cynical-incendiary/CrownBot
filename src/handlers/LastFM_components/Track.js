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
        if (this.username && response.data.track.userplaycount === undefined) {
            return false;
        }
        return true;
    }
    async get_info() {
        return this.query({
            method: "track.getInfo",
            track: this.name,
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
            throw "Track name is required to search.";
        return this.query({
            method: "track.search",
            track: this.name,
            user: this.username,
            ...this.configs,
        });
    }
}
exports.default = default_1;

"use strict";
var _ServerArtists_bot, _ServerArtists_entries;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerArtists = void 0;
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
class ServerArtists {
    constructor(bot) {
        _ServerArtists_bot.set(this, void 0);
        _ServerArtists_entries.set(this, []);
        tslib_1.__classPrivateFieldSet(this, _ServerArtists_bot, bot, "f");
    }
    async init() {
        // placeholder, not needed
        return true;
    }
    async check() {
        return !!tslib_1.__classPrivateFieldGet(this, _ServerArtists_entries, "f");
    }
    async get(guild) {
        let guild_id;
        if (guild instanceof discord_js_1.Guild) {
            guild_id = guild.id;
        }
        else {
            guild_id = guild;
        }
        let cached = tslib_1.__classPrivateFieldGet(this, _ServerArtists_entries, "f").find((entry) => {
            return entry.guild_id === guild_id;
        });
        if (!cached) {
            await this.set(guild_id);
        }
        cached = tslib_1.__classPrivateFieldGet(this, _ServerArtists_entries, "f").find((entry) => {
            return entry.guild_id === guild_id;
        });
        return cached;
    }
    async set(guild) {
        let guild_id;
        if (guild instanceof discord_js_1.Guild) {
            guild_id = guild.id;
        }
        else {
            guild_id = guild;
        }
        const db_server_artists = await tslib_1.__classPrivateFieldGet(this, _ServerArtists_bot, "f").models.whoknowslog
            .find({
            guild_id: guild_id,
        })
            // @ts-ignore
            .sort({
            listener: "desc",
        })
            .limit(2000);
        const top_artists = db_server_artists.map((e) => e.artist_name);
        const cached = tslib_1.__classPrivateFieldGet(this, _ServerArtists_entries, "f").find((entry) => {
            return entry.guild_id === guild_id;
        });
        if (cached) {
            cached.artists = top_artists;
        }
        else {
            tslib_1.__classPrivateFieldGet(this, _ServerArtists_entries, "f").push({ guild_id: guild_id, artists: top_artists });
        }
        return true;
    }
}
exports.ServerArtists = ServerArtists;
_ServerArtists_bot = new WeakMap(), _ServerArtists_entries = new WeakMap();

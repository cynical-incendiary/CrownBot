"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
function parse_spotify(member) {
    var _a, _b, _c;
    let artist_name = null, album_name = null, track_name = null, createdTimeStamp = null;
    if (member instanceof discord_js_1.GuildMember) {
        const spotify_presence = (_a = member.presence) === null || _a === void 0 ? void 0 : _a.activities.find((act) => act.name === "Spotify");
        if (spotify_presence) {
            artist_name = ((_b = spotify_presence.state) === null || _b === void 0 ? void 0 : _b.split("; ")[0]) || null;
            album_name = ((_c = spotify_presence.assets) === null || _c === void 0 ? void 0 : _c.largeText) || null;
            track_name = spotify_presence.details || null;
            createdTimeStamp = spotify_presence.createdTimestamp;
        }
    }
    return {
        artist_name,
        album_name,
        track_name,
        createdTimeStamp,
    };
}
exports.default = parse_spotify;

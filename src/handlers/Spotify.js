"use strict";
var _Spotify_clientid, _Spotify_clientsecret, _Spotify_spotify_api;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spotify = void 0;
const tslib_1 = require("tslib");
const spotify_web_api_node_1 = tslib_1.__importDefault(require("spotify-web-api-node"));
const { SPOTIFY_CLIENTID, SPOTIFY_CLIENTSECRET } = process.env;
class Spotify {
    constructor() {
        _Spotify_clientid.set(this, SPOTIFY_CLIENTID);
        _Spotify_clientsecret.set(this, SPOTIFY_CLIENTSECRET);
        _Spotify_spotify_api.set(this, new spotify_web_api_node_1.default({
            clientId: tslib_1.__classPrivateFieldGet(this, _Spotify_clientid, "f"),
            clientSecret: tslib_1.__classPrivateFieldGet(this, _Spotify_clientsecret, "f"),
        }));
        if (!(tslib_1.__classPrivateFieldGet(this, _Spotify_clientid, "f") && tslib_1.__classPrivateFieldGet(this, _Spotify_clientsecret, "f"))) {
            throw "SPOTIFY_CLIENTID and/or SPOTIFY_CLIENTSECRET is missing.";
        }
        return this;
    }
    /**
     * Attaches Spotify access token to the instance of this class.
     */
    async attach_access_token() {
        const temporary_access = await tslib_1.__classPrivateFieldGet(this, _Spotify_spotify_api, "f").clientCredentialsGrant();
        if (temporary_access.statusCode !== 200)
            return false;
        tslib_1.__classPrivateFieldGet(this, _Spotify_spotify_api, "f").setAccessToken(temporary_access.body.access_token);
        return this;
    }
    /**
     * Searches for a track on Spotify
     */
    async search_track(search_query) {
        var _a;
        const query = await tslib_1.__classPrivateFieldGet(this, _Spotify_spotify_api, "f").searchTracks(search_query, {
            limit: 1,
        });
        const track = (_a = query.body.tracks) === null || _a === void 0 ? void 0 : _a.items[0];
        if (query.statusCode !== 200 || !track)
            return;
        return track;
    }
    /**
     * Gets artist's images from Spotify.
     * @param artist_name
     * Name of the artist to search for on Spotify.
     * @param id
     * This ID, if specified, is sent back along with the artist's images. This useful for `Promises.all()`.
     */
    async get_artist_images(artist_name, id) {
        var _a;
        const query = await tslib_1.__classPrivateFieldGet(this, _Spotify_spotify_api, "f").searchArtists(artist_name, {
            limit: 1,
        });
        const artist = (_a = query.body.artists) === null || _a === void 0 ? void 0 : _a.items[0];
        if (query.statusCode !== 200 || !artist)
            return;
        return { images: artist.images, id };
    }
    /**
     * Gets artist's images from Spotify.
     * @param artist_name
     *
     * @param track_name
     * Name of the track to search for on Spotify.
     *
     *
     * @param id
     * This ID, if specified, is sent back along with the track's images. This useful for `Promises.all()`.
     */
    async get_track_images(artist_name, track_name, id) {
        var _a;
        const query = await tslib_1.__classPrivateFieldGet(this, _Spotify_spotify_api, "f").searchTracks(`artist:${artist_name} track:${track_name}`, {
            limit: 1,
        });
        const track = (_a = query.body.tracks) === null || _a === void 0 ? void 0 : _a.items[0];
        if (query.statusCode !== 200 || !track)
            return;
        return { images: track.album.images, id };
    }
    /**
     * Outputs the input data with artists' images attached.
     *
     * @param data
     * The data formatted with `chart.ts`'s `format_artists()` method.
     *
     */
    async attach_artist_images(data) {
        // assign ids
        let artists = data.map((d, i) => {
            d.id = i;
            return d;
        });
        const promises = artists.map((artist) => {
            return this.get_artist_images(artist.name, artist.id);
        });
        const responses = (await Promise.all(promises)).filter((res) => res);
        artists = artists.map((artist) => {
            var _a;
            const spotify_data = responses.find((res) => (res === null || res === void 0 ? void 0 : res.id) === artist.id);
            if (spotify_data) {
                artist.image_url = (_a = [...spotify_data.images].shift()) === null || _a === void 0 ? void 0 : _a.url;
            }
            return artist;
        });
        return artists;
    }
    /**
     * Outputs the input data with tracks' images attached.
     *
     * @param data
     * The data formatted with `chart.ts`'s `format_tracks()` method.
     *
     */
    async attach_track_images(data) {
        // assign ids
        let tracks = data.map((d, i) => {
            d.id = i;
            return d;
        });
        const promises = tracks.map((track) => {
            return this.get_track_images(track.artist_name, track.name, track.id);
        });
        const responses = (await Promise.all(promises)).filter((res) => res);
        tracks = tracks.map((track) => {
            var _a;
            const spotify_data = responses.find((res) => (res === null || res === void 0 ? void 0 : res.id) === track.id);
            if (spotify_data) {
                track.image_url = (_a = [...spotify_data.images].shift()) === null || _a === void 0 ? void 0 : _a.url;
            }
            return track;
        });
        return tracks;
    }
}
exports.Spotify = Spotify;
_Spotify_clientid = new WeakMap(), _Spotify_clientsecret = new WeakMap(), _Spotify_spotify_api = new WeakMap();

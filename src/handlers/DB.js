"use strict";
var _DB_models;
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const moment_1 = tslib_1.__importDefault(require("moment"));
class DB {
    /**
     *
     * @param models
     * The object made of mongoose models.
     * In this setup, it is `client.models`.
     */
    constructor(models) {
        _DB_models.set(this, void 0);
        tslib_1.__classPrivateFieldSet(this, _DB_models, models, "f");
    }
    /**
     * Adds a new user to the database.
     * @param guild_ID
     * @param user_ID
     * Discord user ID.
     *
     * @param username
     * Last.fm username.
     */
    async add_user(guild_ID, user_ID, username) {
        if (!guild_ID)
            throw "Guild ID not specified";
        return await tslib_1.__classPrivateFieldGet(this, _DB_models, "f").serverusers.create({
            guildID: guild_ID,
            userID: user_ID,
            username,
        });
    }
    /**
     * Fetches a user from the database.
     * @param guild_ID
     * @param user_ID
     * Discord user ID
     * @param global
     * If set to `true`, the user is searched globally instead of searching by the
     * provided `guild_ID`. (Default: `false`)
     */
    async fetch_user(guild_ID, user_ID, global = false) {
        let user;
        if (global) {
            user = await tslib_1.__classPrivateFieldGet(this, _DB_models, "f").serverusers.findOne({
                userID: user_ID,
            });
        }
        else {
            user = await tslib_1.__classPrivateFieldGet(this, _DB_models, "f").serverusers.findOne({
                guildID: guild_ID,
                userID: user_ID,
            });
        }
        return user;
    }
    /**
     * Removes a user from the database.
     * @param guild_ID
     * @param user_ID
     * @param global
     * If set to `true`, the user is removed globally instead of from the specified `guild_ID`.
     */
    async remove_user(guild_ID, user_ID, global = false) {
        if (global) {
            return !!(await tslib_1.__classPrivateFieldGet(this, _DB_models, "f").serverusers.deleteMany({ userID: user_ID }));
        }
        else {
            return !!(await tslib_1.__classPrivateFieldGet(this, _DB_models, "f").serverusers.deleteMany({
                guildID: guild_ID,
                userID: user_ID,
            }));
        }
    }
    /**
     * Adds a ban entry for a user.
     * @param interaction
     * The discord.js `message` object.
     *
     * @param user
     * The `DiscordUser` object.
     *
     */
    async ban_user(interaction, user) {
        return !!tslib_1.__classPrivateFieldGet(this, _DB_models, "f").bans.create({
            guildID: interaction.guild.id,
            guildName: interaction.guild.name,
            userID: user.id,
            username: user.tag,
            executor: `${interaction.user.tag} (${interaction.user.id})`,
        });
    }
    /**
     * Delete a crown of a user
     * @param artistName
     * @param guildID
     */
    async delete_crown(artistName, guildID) {
        if (!guildID)
            return;
        return tslib_1.__classPrivateFieldGet(this, _DB_models, "f").crowns.deleteOne({
            artistName,
            guildID,
        });
    }
    /**
     * Updates crown for an artist in a server.
     * @param top
     */
    async update_crown(top) {
        return tslib_1.__classPrivateFieldGet(this, _DB_models, "f").crowns.findOneAndUpdate({
            artistName: top.artist_name,
            guildID: top.guild_id,
        }, {
            guildID: top.guild_id,
            userID: top.user_id,
            userTag: top.user_tag,
            lastfm_username: top.lastfm_username,
            artistName: top.artist_name,
            artistPlays: parseInt(top.userplaycount),
        }, {
            upsert: true,
            useFindAndModify: false,
        });
    }
    /**
     * Logs &whoplays stats of a server
     * @param track_name
     * @param artist_name
     * @param leaderboard
     * @param guild_id
     */
    async log_whoplays(track_name, artist_name, leaderboard, guild_id) {
        const timestamp = moment_1.default.utc().valueOf();
        return tslib_1.__classPrivateFieldGet(this, _DB_models, "f").whoplayslog.findOneAndUpdate({
            track_name,
            artist_name,
            guild_id,
        }, {
            track_name,
            artist_name,
            guild_id,
            listener: leaderboard.length,
            stat: leaderboard,
            timestamp,
        }, {
            upsert: true,
            useFindAndModify: false,
        });
    }
    /**
     * Logs &whoknows stats of a server.
     * @param artist_name
     * @param leaderboard
     * @param guild_id
     */
    async log_whoknows(artist_name, leaderboard, guild_id) {
        const timestamp = moment_1.default.utc().valueOf();
        return tslib_1.__classPrivateFieldGet(this, _DB_models, "f").whoknowslog.findOneAndUpdate({
            artist_name,
            guild_id,
        }, {
            artist_name,
            guild_id,
            listener: leaderboard.length,
            stat: leaderboard,
            timestamp,
        }, {
            upsert: true,
            useFindAndModify: false,
        });
    }
    /**
     * Logs `&list artist alltime` stats of a user in a server.
     * @param stat
     * @param user_id
     * @param guild_id
     */
    async log_list_artist(stat, user_id, guild_id) {
        const timestamp = moment_1.default.utc().valueOf();
        return tslib_1.__classPrivateFieldGet(this, _DB_models, "f").listartistlog.findOneAndUpdate({
            user_id,
            guild_id,
        }, {
            user_id,
            guild_id,
            stat,
            timestamp,
        }, {
            upsert: true,
            useFindAndModify: false,
        });
    }
    /**
     * Fetches configurations of a server.
     * - Returns an object with `min_plays_for_crowns` set to 1 if no config is found.
     * @param interaction
     */
    async server_config(interaction) {
        const server_config = await tslib_1.__classPrivateFieldGet(this, _DB_models, "f").serverconfig.findOne({
            guild_ID: interaction.guild.id,
        });
        if (!server_config) {
            // @ts-ignore
            return new (tslib_1.__classPrivateFieldGet(this, _DB_models, "f").serverconfig)({
                guild_ID: interaction.guild.id,
                min_plays_for_crowns: 1,
            });
        }
        return server_config;
    }
}
_DB_models = new WeakMap();
exports.default = DB;

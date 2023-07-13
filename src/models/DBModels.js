"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate_models = exports.model_params = void 0;
const mongoose_1 = require("mongoose");
// import { ModelTypes } from "../typings/ModelTypes";
exports.model_params = {
    albumlog: {
        name: { type: String, required: true },
        artistName: { type: String, required: true },
        userplaycount: { type: Number, required: true },
        userID: { type: String, required: true },
        timestamp: { type: Number, required: true },
    },
    artistlog: {
        name: { type: String, required: true },
        userplaycount: { type: Number, required: true },
        userID: { type: String, required: true },
        timestamp: { type: Number, required: true },
    },
    bans: {
        guildID: { type: String, required: true },
        guildName: { type: String, required: true },
        userID: { type: String, required: true },
        username: { type: String, required: true },
        executor: { type: String, required: true },
    },
    botconfig: {
        exception_log_channel: { type: String, required: false },
        maintenance: { type: String, required: false },
        disabled: { type: String, required: false },
        disabled_message: { type: String, required: false },
    },
    crowns: {
        guildID: {
            type: String,
            required: true,
        },
        userID: { type: String, required: true },
        userTag: { type: String, required: true },
        lastfm_username: { type: String, required: true },
        artistName: { type: String, required: true },
        artistPlays: { type: Number, required: true },
    },
    errorlogs: {
        incident_id: { type: String, required: true },
        command_name: String,
        message_content: String,
        user_ID: { type: String, required: true },
        guild_ID: { type: String, required: true },
        timestamp: String,
        stack: String,
    },
    listartistlog: {
        user_id: { type: String, required: true },
        guild_id: { type: String, required: true },
        stat: {
            type: Object,
            required: true,
        },
        timestamp: { type: Number, required: true },
    },
    logs: {
        error_id: String,
        error_message: String,
        command_name: String,
        user_ID: String,
        guild_ID: String,
        timestamp: Date,
    },
    lyricslog: {
        track_name: { type: String, required: true },
        artist_name: { type: String, required: true },
        lyrics: { type: String, required: true },
        timestamp: { type: Number, required: true },
        permanent: { type: Boolean },
    },
    submittedlyrics: {
        request_id: { type: String, required: true, unique: true },
        user_tag: { type: String, required: true },
        user_id: { type: String, required: true },
        track_name: { type: String, required: true },
        artist_name: { type: String, required: true },
        lyrics: { type: String, required: true },
        timestamp: { type: Number, required: true },
    },
    reportbug: {
        user: { type: String, required: true },
        userID: { type: String, required: true },
        guildID: { type: String, required: true },
        message: { type: String, required: true },
        timestamp: { type: String, required: true },
    },
    serverconfig: {
        guild_ID: { type: String, required: true, unique: true },
        min_plays_for_crown: { type: Number, required: true },
    },
    serverusers: {
        guildID: { type: String, required: true },
        userID: { type: String, required: true },
        username: { type: String, required: true },
    },
    tracklog: {
        name: { type: String, required: true },
        artistName: { type: String, required: true },
        userplaycount: { type: Number, required: true },
        userID: { type: String, required: true },
        timestamp: { type: Number, required: true },
    },
    whoknowslog: {
        artist_name: { type: String, required: true },
        guild_id: { type: String, required: true },
        listener: { type: Number, required: true },
        stat: { type: Object },
        timestamp: { type: Number, required: true },
    },
    whoplayslog: {
        track_name: { type: String, required: true },
        artist_name: { type: String, required: true },
        guild_id: { type: String, required: true },
        listener: { type: Number, required: true },
        stat: { type: Object },
        timestamp: { type: Number, required: true },
    },
};
function generate_models(mongoose) {
    if (!mongoose)
        return null;
    const new_models = {};
    const keys = Object.keys(exports.model_params);
    keys.forEach((model_name) => {
        const schema = new mongoose.Schema(exports.model_params[model_name]);
        new_models[model_name] = (0, mongoose_1.model)(model_name, schema);
    });
    return new_models;
}
exports.generate_models = generate_models;

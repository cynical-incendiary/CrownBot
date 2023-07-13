"use strict";
var _Config_bot, _Config_configs;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
class Config {
    constructor(bot) {
        _Config_bot.set(this, void 0);
        _Config_configs.set(this, []);
        tslib_1.__classPrivateFieldSet(this, _Config_bot, bot, "f");
    }
    async init() {
        const configs = await tslib_1.__classPrivateFieldGet(this, _Config_bot, "f").models.serverconfig.find();
        tslib_1.__classPrivateFieldSet(this, _Config_configs, configs, "f");
        console.log(`initialized ${configs.length} config(s)`);
        return !!tslib_1.__classPrivateFieldGet(this, _Config_configs, "f");
    }
    async check() {
        return !!tslib_1.__classPrivateFieldGet(this, _Config_configs, "f");
    }
    get(guild) {
        if (!tslib_1.__classPrivateFieldGet(this, _Config_configs, "f"))
            throw "Configs are not initialized";
        let guild_id;
        if (guild instanceof discord_js_1.Guild) {
            guild_id = guild.id;
        }
        else {
            guild_id = guild;
        }
        const server_config = tslib_1.__classPrivateFieldGet(this, _Config_configs, "f").find((config) => {
            return config.guild_ID === guild_id;
        });
        return server_config;
    }
    set(new_config, guild) {
        if (!tslib_1.__classPrivateFieldGet(this, _Config_configs, "f"))
            throw "Configs are not initialized";
        let guild_id;
        if (guild instanceof discord_js_1.Guild) {
            guild_id = guild.id;
        }
        else {
            guild_id = guild;
        }
        let changed = false;
        tslib_1.__classPrivateFieldSet(this, _Config_configs, tslib_1.__classPrivateFieldGet(this, _Config_configs, "f").map((config) => {
            if (config.guild_ID === guild_id) {
                changed = true;
                return { ...config, ...new_config };
            }
            return config;
        }), "f");
        if (!changed) {
            tslib_1.__classPrivateFieldGet(this, _Config_configs, "f").push(new_config);
            changed = true;
        }
        return changed;
    }
}
exports.Config = Config;
_Config_bot = new WeakMap(), _Config_configs = new WeakMap();

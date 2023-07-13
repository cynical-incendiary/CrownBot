"use strict";
var _CacheHandler_bot;
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const Collectors_1 = require("./cache_components/Collectors");
const Config_1 = require("./cache_components/Config");
const ServerArtists_1 = require("./cache_components/ServerArtists");
class CacheHandler {
    constructor(client) {
        _CacheHandler_bot.set(this, void 0);
        tslib_1.__classPrivateFieldSet(this, _CacheHandler_bot, client, "f");
        this.config = new Config_1.Config(tslib_1.__classPrivateFieldGet(this, _CacheHandler_bot, "f"));
        this.serverartists = new ServerArtists_1.ServerArtists(tslib_1.__classPrivateFieldGet(this, _CacheHandler_bot, "f"));
        this.collectors = new Collectors_1.Collectors();
    }
}
exports.default = CacheHandler;
_CacheHandler_bot = new WeakMap();

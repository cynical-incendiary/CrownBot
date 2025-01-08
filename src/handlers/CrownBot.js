"use strict";
var _CrownBot_token;
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const fs_1 = tslib_1.__importDefault(require("fs"));
const mongoose_1 = require("mongoose");
const path_1 = tslib_1.__importDefault(require("path"));
const DBModels_1 = require("../models/DBModels");
const Cache_1 = tslib_1.__importDefault(require("./Cache"));
const Logger_1 = tslib_1.__importDefault(require("./Logger"));
const GLOBALS_1 = tslib_1.__importDefault(require("../../GLOBALS"));
class CrownBot {
    constructor(options) {
        this.cache = new Cache_1.default(this);
        this.logger = new Logger_1.default(this);
        _CrownBot_token.set(this, void 0);
        this.commands = [];
        this.version = options.version;
        tslib_1.__classPrivateFieldSet(this, _CrownBot_token, options.token, "f");
        this.buttons_version = options.buttons_version;
        this.max_users = options.max_users || 200;
        this.client_id = options.client_id;
        this.owner_ID = options.owner_ID;
        this.api_key = options.api_key;
        this.mongo = options.mongo;
        this.url = options.url;
    }
    /**
     * - Connects to MongoDB.
     * - Registers slash commands.
     * - Registers models.
     * - Initializes server-specific configurations.
     * - Finally, logs the bot in.
     */
    async init() {
        await this.load_db();
        await this.register_commands();
        await this.register_owner_commands();
        await this.load_botconfig();
        await this.cache.config.init(); /* cache server configs for the session */
        if (!this.commands.length || !this.mongoose || !this.models)
            throw "Failed initializing mongoose and/or commands. (never really happens tho)";
        return this;
    }
    /**
     * Connects to MongoDB.
     */
    async load_db() {
        this.mongoose = await (0, mongoose_1.connect)(this.mongo, {}).catch((e) => {
            console.log(e);
            return e;
        });
        const gen_models = (0, DBModels_1.generate_models)(this.mongoose);
        if (!gen_models)
            throw "Could not generate models.";
        this.models = gen_models;
    }
    /**
     * Registers slash commands
     */
    async register_commands() {
        const commands = [];
        const dir = path_1.default.join(__dirname, "../commands");
        const commandFiles = fs_1.default
            .readdirSync(dir)
            .filter((file) => file.endsWith(".js"));
        const clientId = this.client_id;
        for (const file of commandFiles) {
            const command = require(path_1.default.join(dir, file));
            this.commands.push(command);
            commands.push(command.data.toJSON());
        }
        const rest = new discord_js_1.REST({ version: "10" }).setToken(tslib_1.__classPrivateFieldGet(this, _CrownBot_token, "f"));
        return (async () => {
            try {
                console.log(`Started refreshing ${commands.length} application (/) commands.`);
                await rest.put(discord_js_1.Routes.applicationCommands(clientId), {
                    body: commands,
                });
            }
            catch (error) {
                console.error(error);
            }
        })();
    }
    /**
     * Registers owner-only slash commands
     */
    async register_owner_commands() {
        const commands = [];
        const dir = path_1.default.join(__dirname, "../commands/owner_commands");
        const commandFiles = fs_1.default
            .readdirSync(dir)
            .filter((file) => file.endsWith(".js"));
        const clientId = this.client_id;
        for (const file of commandFiles) {
            const command = require(path_1.default.join(dir, file));
            if (command.data) {
                this.commands.push(command);
                commands.push(command.data.toJSON());
            }
        }
        const rest = new discord_js_1.REST({ version: "10" }).setToken(tslib_1.__classPrivateFieldGet(this, _CrownBot_token, "f"));
        return (async () => {
            try {
                console.log(`Started refreshing ${commands.length} owner-only (/) commands.`);
                await rest.put(discord_js_1.Routes.applicationGuildCommands(clientId, GLOBALS_1.default.SUPPORT_SERVER_ID), {
                    body: commands,
                });
            }
            catch (error) {
                console.error(error);
            }
        })();
    }
    /**
     * Fetches and stores the BotConfig model
     */
    async load_botconfig() {
        var _a;
        this.botconfig = await ((_a = this.models) === null || _a === void 0 ? void 0 : _a.botconfig.findOne());
        return this;
    }
    /**
     * Returns logs channel or undefined
     */
    async get_log_channel(client) {
        const config = await this.models.botconfig.findOne();
        if (!config || !config.exception_log_channel)
            return;
        const channel = client.channels.cache.get(config.exception_log_channel);
        if (channel === null || channel === void 0 ? void 0 : channel.isTextBased())
            return channel;
    }
}
_CrownBot_token = new WeakMap();
exports.default = CrownBot;

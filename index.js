"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const path_1 = tslib_1.__importDefault(require("path"));
const GLOBALS_1 = tslib_1.__importDefault(require("./GLOBALS"));
const Command_1 = require("./src/handlers/Command");
const CommandResponse_1 = require("./src/handlers/CommandResponse");
const CrownBot_1 = tslib_1.__importDefault(require("./src/handlers/CrownBot"));
const handle_autocomplete_1 = tslib_1.__importDefault(require("./src/handlers/handle_autocomplete"));
const handle_button_1 = require("./src/handlers/handle_button");
const handle_modal_1 = require("./src/handlers/handle_modal");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
/*
# REQUIRED
======================================================================================================
DISCORD_CLIENTID: Bot's client ID
DISCORD_TOKEN: Discord API token
OWNER_ID: User ID of the bot owner
LASTFM_API_KEY: Last.fm API key
MONGO: Mongo DB connection string
======================================================================================================


LYRICS_ENDPOINT: Lyrics endpoint for the /lyrics command--command won't work unless this is set.
    Setup a server to use it as:
     <server>?gquery=<query string>
    That <server> needs to be in the environment variable as LYRICS_ENDPOINT. /lyrics appends `?gquery=<query string>` to it.
    Example, set it to https://mycoolsite.com/lyrics (only add trailing / when necessary) and it becomes https://mycoolsite.com/lyrics?gquery=something


SPOTIFY_CLIENTID: Spotify client ID for the /chart command to show artist images
SPOTIFY_SECRETID: Spotify client ID for the /chart command to show artist images
*/
global.appRoot = path_1.default.resolve(__dirname);
(async () => {
    var _a;
    try {
        const { DISCORD_CLIENTID, DISCORD_TOKEN, OWNER_ID, LASTFM_API_KEY, MONGO } = process.env;
        if (!(DISCORD_TOKEN &&
            OWNER_ID &&
            LASTFM_API_KEY &&
            MONGO &&
            DISCORD_CLIENTID)) {
            throw "Some of the environment variables are missing.";
        }
        const bot = await new CrownBot_1.default({
            version: GLOBALS_1.default.VERSION,
            buttons_version: GLOBALS_1.default.BUTTONS_VERSION,
            max_users: GLOBALS_1.default.MAX_USERS,
            client_id: DISCORD_CLIENTID,
            token: DISCORD_TOKEN,
            owner_ID: OWNER_ID,
            api_key: LASTFM_API_KEY,
            mongo: MONGO,
            url: GLOBALS_1.default.LASTFM_ENDPOINT,
        }).init();
        const client = new discord_js_1.Client({
            intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildPresences],
            makeCache: discord_js_1.Options.cacheWithLimits({
                ReactionManager: 0,
                GuildMemberManager: 0,
                MessageManager: 0,
                GuildEmojiManager: 0,
                ThreadManager: 0,
                ThreadMemberManager: 0,
            }),
        });
        // register events
        client.on("interactionCreate", async (interaction) => {
            if (interaction.isAutocomplete()) {
                await (0, handle_autocomplete_1.default)(bot, client, interaction);
            }
            if (interaction.isButton()) {
                await (0, handle_button_1.handle_button)(bot, client, interaction);
                return;
            }
            if (interaction.isModalSubmit()) {
                if (interaction.customId === "bugmodal")
                    await (0, handle_modal_1.handle_reportbug)(bot, client, interaction);
                else if (interaction.customId === "configmodal")
                    await (0, handle_modal_1.handle_editconfig)(bot, client, interaction);
                return;
            }
            if (!interaction.isChatInputCommand())
                return;
            if (!interaction.guild)
                return;
            const command = bot.commands.find((e) => e.data.name == interaction.commandName);
            if (!command)
                return;
            try {
                const response = new CommandResponse_1.CommandResponse(bot, client, interaction);
                response.text;
                const command_response = await (0, Command_1.preflight_checks)(bot, client, interaction, command, response);
                if (typeof command_response == "object" &&
                    command_response instanceof CommandResponse_1.CommandResponse) {
                    await command_response.reply();
                }
            }
            catch (e) {
                console.error(e);
            }
        });
        await client.login(DISCORD_TOKEN);
        console.log(`Logged in as ${(_a = client.user) === null || _a === void 0 ? void 0 : _a.tag}`);
    }
    catch (e) {
        console.log(e);
        debugger; //eslint-disable-line
    }
})();

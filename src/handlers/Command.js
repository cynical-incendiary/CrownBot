"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preflight_checks = void 0;
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const Template_1 = require("../classes/Template");
const check_ban_1 = tslib_1.__importDefault(require("../misc/check_ban"));
const codeblock_1 = tslib_1.__importDefault(require("../misc/codeblock"));
const generate_random_strings_1 = tslib_1.__importDefault(require("../misc/generate_random_strings"));
const BotMessage_1 = tslib_1.__importDefault(require("./BotMessage"));
const DB_1 = tslib_1.__importDefault(require("./DB"));
async function preflight_checks(bot, client, interaction, command, response) {
    var _a, _b;
    try {
        const exception_for_defer = ["reportbug", "managebot"];
        if (!exception_for_defer.includes(interaction.commandName) &&
            !interaction.deferred)
            await interaction.deferReply();
        const db = new DB_1.default(bot.models);
        if (((_a = bot.botconfig) === null || _a === void 0 ? void 0 : _a.disabled) === "on") {
            if (interaction.user.id !== bot.owner_ID) {
                response.title = "Bot is currently disabled";
                if (bot.botconfig.disabled_message) {
                    response.text = bot.botconfig.disabled_message;
                }
                else {
                    response.text =
                        "The bot is currently disabled. For support, please check the bot's profile.";
                }
                return response;
            }
        }
        if (((_b = bot.botconfig) === null || _b === void 0 ? void 0 : _b.maintenance) === "on") {
            if (interaction.user.id !== bot.owner_ID) {
                response.text =
                    "The bot is currently under maintenance; please try again in a while.";
                return response;
            }
        }
        const ban_info = await (0, check_ban_1.default)(interaction, bot);
        if (ban_info.banned && interaction.user.id !== bot.owner_ID) {
            if (ban_info.type === "global") {
                response.text =
                    "You are globally banned from accessing the bot; try `&about` to find the support server.";
                return response;
            }
            if (ban_info.type === "local") {
                if (interaction.commandName !== "unban") {
                    response.text =
                        "You are banned from accessing the bot on this server.";
                    return response;
                }
            }
        }
        const user = await db.fetch_user(interaction.guild.id, interaction.user.id);
        if (interaction.commandName !== "login" && !user) {
            response.text = new Template_1.Template().get("not_logged");
            return response;
        }
        if (command) {
            const command_response = await command.execute(bot, client, interaction, response);
            return command_response;
        }
    }
    catch (e) {
        await log_error(client, bot, interaction, e.stack || e);
        console.log("Uncaught exception at pre-flight checks");
        console.log(e);
    }
}
exports.preflight_checks = preflight_checks;
async function log_error(client, bot, interaction, stack) {
    const response = new BotMessage_1.default({ bot, interaction });
    const expire_date = new Date();
    expire_date.setDate(expire_date.getDate() + 28); // add 28 days to current date
    const incident_id = (0, generate_random_strings_1.default)(8);
    const data = {
        expireAt: expire_date,
        incident_id,
        command_name: interaction.commandName,
        message_content: interaction.options.data.toString(),
        user_ID: interaction.user.id,
        guild_ID: interaction.guild.id,
        timestamp: `${new Date().toUTCString()}`,
        stack: `${stack || `none`}`,
    };
    try {
        if (stack) {
            // @ts-ignore
            await new bot.models.errorlogs({ ...data }).save();
            response.text =
                `The bot has encountered an unexpected error while executing your request; ` +
                    `please consider reporting this incident (id: ${(0, codeblock_1.default)(incident_id)}) to the bot's support server—see ${(0, codeblock_1.default)("/about")}.`;
            await response.send();
        }
        // attempt to send logs to the channel specified in "exception_log_channel" (/src/models/BotConfig.ts)
        await send_exception_log(client, bot, interaction, incident_id, stack);
    }
    catch (e) {
        // supress any error to avoid infinite error loop
        console.error("Supressed an exception to prevent a throw-catch loop; please check the relevant log below.");
        console.log(e);
    }
}
/**
 * Sends exception log to the channel specified in `config.exception_log_channel` along with
 * the incident ID and error stack.
 * @param client
 * @param incident_id
 * @param stack
 */
async function send_exception_log(client, bot, interaction, incident_id, stack) {
    // check if exception_log_channel is set
    const channel = await bot.get_log_channel(client);
    if (!channel) {
        console.log("Cannot find the logging channel (exception_log_channel).");
        return;
    }
    const embed = new discord_js_1.EmbedBuilder().setTitle("Uncaught exception").addFields([
        { name: "Incident ID", value: incident_id, inline: false },
        { name: "Command name", value: interaction.commandName, inline: true },
        { name: "Timestamp", value: new Date().toUTCString(), inline: true },
        {
            name: "Error",
            value: stack ? "```JS\n" + stack.split("\n").shift() + "\n```" : "Empty",
        },
    ]);
    if (channel.type == discord_js_1.ChannelType.GuildStageVoice)
        return;
    await channel.send({ embeds: [embed] });
}

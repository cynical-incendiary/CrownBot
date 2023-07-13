"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle_editconfig = exports.handle_reportbug = void 0;
const discord_js_1 = require("discord.js");
async function handle_reportbug(bot, client, interaction) {
    const message = interaction.fields.getTextInputValue("message");
    const data = {
        user: interaction.user.tag,
        userID: interaction.user.id,
        guildID: interaction.guildId,
        message,
        timestamp: new Date().toUTCString(),
    };
    // @ts-ignore
    await new bot.models.reportbug({ ...data }).save();
    // check if exception_log_channel is set
    const config = await bot.models.botconfig.findOne();
    if (!config || !config.exception_log_channel)
        return;
    const channel = (client.channels.cache.get(config.exception_log_channel));
    if (!channel) {
        console.log("Cannot find the channel `" +
            config.exception_log_channel +
            "` set in exception_log_channel.");
        return;
    }
    const embed = new discord_js_1.EmbedBuilder().setTitle("Bug report").addFields([
        { name: "User", value: data.user, inline: true },
        {
            name: "Timestamp",
            value: data.timestamp,
            inline: false,
        },
        {
            name: "Message",
            value: "```" + data.message + "```",
            inline: false,
        },
    ]);
    await channel.send({ embeds: [embed] });
    await interaction.reply("Bug report has been submitted. Thank you!");
}
exports.handle_reportbug = handle_reportbug;
async function handle_editconfig(bot, client, interaction) {
    const exception_log_channel = interaction.fields.getTextInputValue("exception_log_channel");
    const maintenance = interaction.fields.getTextInputValue("maintenance");
    const disabled = interaction.fields.getTextInputValue("disabled");
    const disabled_message = interaction.fields.getTextInputValue("disabled_message");
    let extra = "Currently cached configs have been updated.";
    await bot.models.botconfig.findOneAndUpdate({}, { exception_log_channel, maintenance, disabled, disabled_message }, { useFindAndModify: false });
    if (bot.botconfig) {
        bot.botconfig.exception_log_channel = exception_log_channel;
        bot.botconfig.maintenance = maintenance;
        bot.botconfig.disabled = disabled;
        bot.botconfig.disabled_message = disabled_message;
    }
    else
        extra = "Failed to update the currently cached configs.";
    await interaction.reply("BotConfig has been updated. " + extra);
    return;
}
exports.handle_editconfig = handle_editconfig;

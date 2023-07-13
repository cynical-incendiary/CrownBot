"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const { SlashCommandBuilder } = require("discord.js");
module.exports = {
    data: new SlashCommandBuilder()
        .setName("reportbug")
        .setDescription("Report a bug to the CrownBot maintainer via a form."),
    async execute(bot, client, interaction) {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId("bugmodal")
            .setTitle("Report a bug");
        const bug_message_input = new discord_js_1.TextInputBuilder()
            .setCustomId("message")
            .setLabel("Please describe the bug in detail")
            .setRequired(true)
            .setStyle(discord_js_1.TextInputStyle.Paragraph);
        const firstActionRow = new discord_js_1.ActionRowBuilder().addComponents(bug_message_input);
        modal.addComponents(firstActionRow);
        await interaction.showModal(modal);
    },
};

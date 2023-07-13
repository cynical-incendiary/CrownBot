"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const escapemarkdown_1 = tslib_1.__importDefault(require("../misc/escapemarkdown"));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("crowns")
        .setDescription("See the crowns you've obtained in a server")
        .addUserOption((option) => option
        .setName("discord_user")
        .setDescription("User to see crowns of")
        .setRequired(false)),
    async execute(bot, client, interaction, response) {
        const discord_user = interaction.options.getUser("discord_user") || interaction.user;
        const crowns = await bot.models.crowns.find({
            guildID: interaction.guild.id,
            userID: discord_user.id,
        });
        if (crowns.length <= 0) {
            response.text =
                "There are no crowns obtained under that username on this server.";
            return response;
        }
        const sorted_crowns = crowns.sort((a, b) => b.artistPlays - a.artistPlays);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`Crowns of ${discord_user.username} in ${interaction.guild.name}`)
            .setDescription(`Total: **${sorted_crowns.length} crowns**`);
        const data_list = sorted_crowns.map((elem) => {
            return `${(0, escapemarkdown_1.default)(elem.artistName)} — **${elem.artistPlays} play(s)**`;
        });
        response.paginate = true;
        response.paginate_embed = embed;
        response.paginate_data = data_list;
        response.paginate_numbering = true;
        return response;
    },
};

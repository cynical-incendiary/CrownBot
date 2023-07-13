"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function handle_autocomplete(bot, client, interaction) {
    if (!interaction.guildId)
        return;
    const focused = interaction.options.getFocused(true);
    if (focused.name === "artist_name") {
        const server_artists = await bot.cache.serverartists.get(interaction.guildId);
        if (!server_artists)
            return;
        const choices = server_artists.artists;
        const filtered = choices.filter((choice) => choice.toLowerCase().startsWith(focused.value.toLowerCase()));
        if (filtered.length >= 24)
            filtered.length = 24;
        try {
            await interaction.respond(filtered.map((choice) => ({ name: choice, value: choice })));
        }
        catch (_a) {
            // too bad!!
        }
    }
}
exports.default = handle_autocomplete;

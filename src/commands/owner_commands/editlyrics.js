"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.show_modal = void 0;
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const moment_1 = tslib_1.__importDefault(require("moment"));
const DB_1 = tslib_1.__importDefault(require("../../handlers/DB"));
const Track_1 = tslib_1.__importDefault(require("../../handlers/LastFM_components/Track"));
const User_1 = tslib_1.__importDefault(require("../../handlers/LastFM_components/User"));
const generate_random_strings_1 = tslib_1.__importDefault(require("../../misc/generate_random_strings"));
async function edit_lyrics(bot, interaction) {
    const db = new DB_1.default(bot.models);
    const user = await db.fetch_user(interaction.guild.id, interaction.user.id);
    if (!user)
        return;
    const lastfm_user = new User_1.default({
        username: user.username,
    });
    let track_name = interaction.options.getString("track_name");
    let artist_name = interaction.options.getString("artist_name");
    if (!track_name) {
        const now_playing = await lastfm_user.get_nowplaying(bot, interaction);
        if (!now_playing)
            return;
        track_name = now_playing.name;
        artist_name = now_playing.artist["#text"];
    }
    if (!artist_name) {
        const query = await new Track_1.default({
            name: track_name,
            limit: 1,
        }).search();
        if (query.lastfm_errorcode || !query.success) {
            await interaction.editReply({
                content: "Lastfm error " + query.lastfm_errormessage,
            });
            return;
        }
        const track = query.data.results.trackmatches.track.shift();
        if (!track) {
            await interaction.editReply({
                content: "Couldn't find the track",
            });
            return;
        }
        track_name = track.name;
        artist_name = track.artist;
    }
    const query = await new Track_1.default({
        name: track_name,
        artist_name,
    }).get_info();
    if (query.lastfm_errorcode || !query.success) {
        return;
    }
    const track = query.data.track;
    const db_entry = await bot.models.lyricslog.findOne({
        track_name: track.name,
        artist_name: track.artist.name,
    });
    if (!db_entry) {
        await interaction.editReply({
            content: "No entry on the database",
        });
        return;
    }
    const random_id = "edt" + (Math.random().toString(36) + "00000000000000000").slice(2, 7 + 2);
    const row = (new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(random_id)
        .setLabel("Edit lyrics")
        .setStyle(discord_js_1.ButtonStyle.Primary)));
    await interaction.editReply({
        content: `Track: ${db_entry.track_name}\nArtist: ${db_entry.artist_name}\nPermanent: ${db_entry.permanent}`,
        components: [row],
    });
    const filter = (i) => i.user.id === interaction.user.id && i.customId === random_id;
    const collector = interaction.channel.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
        filter,
        time: 120000,
    });
    bot.cache.collectors.add(collector);
    collector.on("collect", async (i) => {
        if (i.customId === random_id) {
            await show_modal(bot, i, db_entry);
        }
    });
}
exports.default = edit_lyrics;
async function show_modal(bot, interaction, entry_data, is_admin = false) {
    var _a;
    const random_id = (0, generate_random_strings_1.default)(8);
    if (entry_data.lyrics && ((_a = entry_data.lyrics) === null || _a === void 0 ? void 0 : _a.length) >= 3950) {
        await interaction.reply({
            content: "The lyrics for this track is too large for the Discord Modal to support. Contact bot support to make changes to the lyrics (see `/about`).",
            ephemeral: true,
        });
        return;
    }
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId("newlyricsmodal")
        .setTitle("Edit lyrics");
    const track_input = new discord_js_1.TextInputBuilder()
        .setCustomId("new_track")
        .setLabel("Track name")
        .setRequired(true)
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setValue(entry_data.track_name);
    const artist_input = new discord_js_1.TextInputBuilder()
        .setCustomId("new_artist")
        .setLabel("Artist name")
        .setRequired(true)
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setValue(entry_data.artist_name);
    const permanent_input = new discord_js_1.TextInputBuilder()
        .setCustomId("new_permanent")
        .setLabel("Permanent?")
        .setRequired(true)
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setValue(entry_data.permanent ? "true" : "false");
    const lyrics_input = new discord_js_1.TextInputBuilder()
        .setCustomId("new_lyrics")
        .setLabel("New lyrics")
        .setRequired(true)
        .setStyle(discord_js_1.TextInputStyle.Paragraph)
        .setValue(entry_data.lyrics || "");
    const first = new discord_js_1.ActionRowBuilder().addComponents(track_input);
    const second = new discord_js_1.ActionRowBuilder().addComponents(artist_input);
    const third = new discord_js_1.ActionRowBuilder().addComponents(permanent_input);
    const fourth = new discord_js_1.ActionRowBuilder().addComponents(lyrics_input);
    if (is_admin)
        modal.addComponents(first, second, third, fourth);
    else
        modal.addComponents(fourth);
    await interaction.showModal(modal);
    // Get the Modal Submit Interaction that is emitted once the User submits the Modal
    const submitted = await interaction
        .awaitModalSubmit({
        time: 60000,
    })
        .catch(() => {
        return null;
    });
    if (submitted) {
        // const track_name = submitted.fields.getTextInputValue("new_track");
        // const artist_name = submitted.fields.getTextInputValue("new_artist");
        // const permanent = submitted.fields.getTextInputValue("new_permanent");
        const lyrics = submitted.fields.getTextInputValue("new_lyrics");
        const timestamp = moment_1.default.utc().valueOf();
        if (!lyrics)
            return;
        const data = {
            request_id: random_id,
            user_tag: submitted.user.tag,
            user_id: submitted.user.id,
        };
        if (is_admin) {
            const track_name = submitted.fields.getTextInputValue("new_track");
            const artist_name = submitted.fields.getTextInputValue("new_artist");
            const permanent = submitted.fields.getTextInputValue("new_permanent");
            const lyrics = submitted.fields.getTextInputValue("new_lyrics");
            const timestamp = moment_1.default.utc().valueOf();
            await bot.models.lyricslog.findOneAndUpdate({
                track_name: track_name,
                artist_name: artist_name,
            }, {
                track_name: track_name,
                artist_name: artist_name,
                lyrics: lyrics,
                permanent: permanent === "true" ? true : false,
                timestamp,
            }, {
                upsert: true,
                useFindAndModify: false,
            });
            const admin_embed = new discord_js_1.EmbedBuilder()
                .setTitle("Lyrics updated")
                .setDescription(interaction.user.toString() + ": The lyrics entry has been updated.");
            await submitted.reply({
                embeds: [admin_embed],
            });
            return;
        }
        // normal user
        await bot.models.submittedlyrics.create({
            ...data,
            track_name: entry_data.track_name,
            artist_name: entry_data.artist_name,
            lyrics: lyrics,
            timestamp,
        });
        const user_embed = new discord_js_1.EmbedBuilder()
            .setTitle("Lyrics submitted")
            .setDescription(interaction.user.toString() +
            ": Your new lyrics have been submitted and it is **currently under review**. Please check back later for your changes to show up. Thank you!");
        await submitted.reply({
            embeds: [user_embed],
        });
        const channel = await bot.get_log_channel(interaction.client);
        if (!channel) {
            console.log("Cannot find the logging channel (exception_log_channel).");
            return;
        }
        const log_embed = new discord_js_1.EmbedBuilder()
            .setTitle("New lyrics submission")
            .addFields([
            { name: "Request ID", value: random_id, inline: false },
            { name: "User tag", value: data.user_tag, inline: false },
            { name: "Track name", value: entry_data.track_name, inline: false },
            { name: "Artist name", value: entry_data.artist_name, inline: false },
            { name: "Timestamp", value: new Date().toUTCString(), inline: false },
        ]);
        const buttonComps = [
            new discord_js_1.ButtonBuilder()
                .setLabel("🔍 Review")
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setCustomId("review-" + random_id),
        ];
        const row = (new discord_js_1.ActionRowBuilder().addComponents(buttonComps));
        if (channel.type == discord_js_1.ChannelType.GuildStageVoice)
            return;
        await channel.send({ embeds: [log_embed], components: [row] });
    }
}
exports.show_modal = show_modal;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle_button = void 0;
const tslib_1 = require("tslib");
const diff_1 = require("diff");
const discord_js_1 = require("discord.js");
const GLOBALS_1 = tslib_1.__importDefault(require("../../GLOBALS"));
const escapemarkdown_1 = tslib_1.__importDefault(require("../misc/escapemarkdown"));
async function handle_button(bot, client, interaction) {
    const embed = new discord_js_1.EmbedBuilder().addFields([
        {
            name: "Has the bot stopped showing your now-playing song?",
            value: "This almost always has nothing to do with the bot but with Last.fm—unless you misspelled your username (see `/mylogin` to ensure it's correct).",
        },
        {
            name: "Things you can try",
            value: "Check [Last.fm status](https://twitter.com/lastfmstatus) to see if it's an issue with their servers; " +
                "if true, usually, you'll have to wait a few hours for scrobbles to catch up\n\n" +
                "(If you're using a 3rd-party Last.fm scrobbler, you're expected know how to disconnect and reconnect)\n\n" +
                "**If you use Spotify, (re)connect it to your Last.fm with these following steps:**\n" +
                "a. Login to <https://last.fm/>\n" +
                "b. Head over to <https://www.last.fm/settings/applications>\n" +
                "c. Find 'Spotify scrobbling', disconnect if it's already connected then reconnect\n" +
                "d. Go to your profile and make sure it's recording your plays correctly\n",
        },
        {
            name: "Still no luck?",
            value: "The [support server](" +
                GLOBALS_1.default.SUPPORT_SERVER +
                ") might be able to help you.",
        },
    ]);
    if (interaction.customId === "scrobblingfaq") {
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }
    // helper functions
    const checkOwner = async () => {
        if (interaction.user.id === bot.owner_ID)
            return true;
        await interaction.reply({
            content: "Hmph, you cannot perform this action.",
            ephemeral: true,
        });
        return false;
    };
    const extractReqId = (str) => {
        return interaction.customId.split(str)[1];
    };
    const row = (new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setLabel("Join support server")
        .setStyle(discord_js_1.ButtonStyle.Link)
        .setURL(GLOBALS_1.default.SUPPORT_SERVER)));
    const lyrics_submission_dm_embed = new discord_js_1.EmbedBuilder().setFooter({
        text: "If you wish to discuss this action or anything related to the bot, feel free to hop into the support server.",
    });
    // Accept request
    if (interaction.customId.startsWith("accept-")) {
        if (!(await checkOwner()))
            return;
        await interaction.message.edit({
            components: [],
        });
        const request_id = extractReqId("accept-");
        const new_lyrics = await bot.models.submittedlyrics.findOne({
            request_id,
        });
        if (!new_lyrics) {
            await interaction.reply({
                content: "No database entry found.",
                ephemeral: true,
            });
            return;
        }
        await bot.models.lyricslog.findOneAndUpdate({
            track_name: new_lyrics.track_name,
            artist_name: new_lyrics.artist_name,
        }, {
            track_name: new_lyrics.track_name,
            artist_name: new_lyrics.artist_name,
            lyrics: new_lyrics.lyrics,
            permanent: true,
        }, {
            upsert: true,
            useFindAndModify: false,
        });
        // @ts-ignore
        await new_lyrics.delete();
        await interaction.reply({
            content: `The submitted request has been accepted. (${request_id})`,
        });
        lyrics_submission_dm_embed.setDescription(`Hello!\nYour lyrics submission for the track **${(0, escapemarkdown_1.default)(new_lyrics.track_name)}** by **${(0, escapemarkdown_1.default)(new_lyrics.artist_name)}** has been **accepted**. Thank you!`);
        await client.users
            .send(new_lyrics.user_id, {
            embeds: [lyrics_submission_dm_embed],
            components: [row],
        })
            .catch(console.error);
    }
    // Reject request
    if (interaction.customId.startsWith("reject-")) {
        if (!(await checkOwner()))
            return;
        await interaction.message.edit({
            components: [],
        });
        const request_id = extractReqId("reject-");
        const new_lyrics = await bot.models.submittedlyrics.findOne({
            request_id,
        });
        await bot.models.submittedlyrics.deleteOne({
            request_id,
        });
        await interaction.reply({
            content: `The submitted request has been declined. (${request_id})`,
        });
        lyrics_submission_dm_embed.setDescription(`Hello!\nUnfortunately, your lyrics submission for the track **${(0, escapemarkdown_1.default)(new_lyrics.track_name)}** by **${(0, escapemarkdown_1.default)(new_lyrics.artist_name)}** has been **rejected**.`);
        await client.users
            .send(new_lyrics.user_id, {
            embeds: [lyrics_submission_dm_embed],
            components: [row],
        })
            .catch(console.error);
    }
    // Review request
    if (interaction.customId.startsWith("review-")) {
        if (!(await checkOwner()))
            return;
        const request_id = extractReqId("review-");
        const new_lyrics = await bot.models.submittedlyrics.findOne({
            request_id,
        });
        if (!new_lyrics) {
            await interaction.reply("This request no longer exists on the database or has been invalidated.");
            return;
        }
        const saved_lyrics = await bot.models.lyricslog.findOne({
            artist_name: new_lyrics.artist_name,
            track_name: new_lyrics.track_name,
        });
        const new_attachment = new discord_js_1.AttachmentBuilder(Buffer.from(new_lyrics.lyrics), {
            name: "New lyrics.txt",
        });
        const buttonComps = [
            new discord_js_1.ButtonBuilder()
                .setLabel("Accept")
                .setStyle(discord_js_1.ButtonStyle.Success)
                .setCustomId("accept-" + request_id),
            new discord_js_1.ButtonBuilder()
                .setLabel("Reject")
                .setStyle(discord_js_1.ButtonStyle.Danger)
                .setCustomId("reject-" + request_id),
        ];
        const row = (new discord_js_1.ActionRowBuilder().addComponents(buttonComps));
        if (!saved_lyrics) {
            await interaction.reply({
                content: "No existing entry on the database",
                files: [new_attachment],
                components: [row],
            });
        }
        else {
            const old_attachment = new discord_js_1.AttachmentBuilder(Buffer.from(saved_lyrics.lyrics), {
                name: "Database lyrics.txt",
            });
            await interaction.reply({
                content: "Reviewing lyrics submission: " + request_id,
                files: [new_attachment, old_attachment],
            });
            const changes = (0, diff_1.diffLines)(saved_lyrics.lyrics, new_lyrics.lyrics, {
                newlineIsToken: true,
            });
            let str = "", c = 0;
            changes.forEach((diff) => {
                if (diff.added || diff.removed) {
                    str +=
                        diff.value
                            .split("\n")
                            .map((line) => {
                            return (diff.added ? "+" : "-") + line;
                        })
                            .join("\n") + "\n";
                    if (c == 1) {
                        str += "================================================\n";
                        c = 0;
                    }
                    else
                        c++;
                }
            });
            await interaction.followUp({
                content: "Relevant diffs\n```diff\n" + str.substring(0, 2000) + "\n```",
                components: [row],
            });
        }
    }
}
exports.handle_button = handle_button;

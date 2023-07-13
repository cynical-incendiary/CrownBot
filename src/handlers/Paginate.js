"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discordjs_pagination_1 = require("@devraelfreeze/discordjs-pagination");
const discord_js_1 = require("discord.js");
const GLOBALS_1 = tslib_1.__importDefault(require("../../GLOBALS"));
class Paginate {
    constructor(interaction, embed, list, elements = GLOBALS_1.default.PAGINATE_ELEMENTS, numbering = false) {
        this.interaction = interaction;
        this.embed = embed;
        this.list = list;
        this.elements = elements;
        this.numbering = numbering;
    }
    gen_list(elems) {
        return elems.map((e) => `\n${e}\n`);
    }
    chunk(arr, len) {
        const chunks = [], n = arr.length;
        let i = 0;
        while (i < n) {
            chunks.push(arr.slice(i, (i += len)));
        }
        return chunks;
    }
    async send() {
        const embeds = [];
        if (this.numbering) {
            this.list = this.list.map((item, i) => `${i + 1}. ${item}`);
        }
        const chunks = this.chunk(this.list, this.elements);
        chunks.forEach((chunk) => {
            var _a, _b;
            const new_embed = new discord_js_1.EmbedBuilder().setTitle(this.embed.data.title || "Embed");
            let description = chunk.join("\n");
            if (this.embed.data.description) {
                description = this.embed.data.description + "\n\n" + description;
            }
            if ((_a = this.embed.data.footer) === null || _a === void 0 ? void 0 : _a.text)
                new_embed.setFooter({ text: this.embed.data.footer.text });
            if (((_b = this.embed.data.footer) === null || _b === void 0 ? void 0 : _b.text) && chunks.length >= 2) {
                // no footer text if there's only one page
                description += "\n\n" + this.embed.data.footer.text;
            }
            new_embed.setDescription(description);
            embeds.push(new_embed);
        });
        if (chunks.length >= 2) {
            return await (0, discordjs_pagination_1.pagination)({
                embeds: embeds,
                author: this.interaction.user,
                interaction: this.interaction,
                time: GLOBALS_1.default.PAGINATE_TIMEOUT,
                disableButtons: true,
                fastSkip: false,
                pageTravel: false,
                customFilter: (interaction) => parseInt(interaction.customId) <= 4,
            });
        }
        else {
            return this.interaction.editReply({
                embeds: [embeds[0]],
                components: [],
            });
        }
    }
}
exports.default = Paginate;

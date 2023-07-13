"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Template = void 0;
const tslib_1 = require("tslib");
const codeblock_1 = tslib_1.__importDefault(require("../misc/codeblock"));
const templates = [
    {
        id: "not_playing",
        text: "You aren't playing anything; to check if your scrobbles are being recorded, use the `/recent` command.",
    },
    {
        id: "404_artist",
        text: "The bot was unable to find the artist.",
    },
    {
        id: "not_logged",
        text: `You are not logged into the bot in this server; ` +
            `please use the ${(0, codeblock_1.default)("/login")} command to set your username`,
    },
    {
        id: "already_logged",
        text: `You already are logged into the bot; 
  use ${(0, codeblock_1.default)("/me")} to see your username 
  and ${(0, codeblock_1.default)("/logout")} to logout.`,
    },
    {
        id: "lastfm_error",
        text: "Something went wrong while trying to fetch information from Last.fm.",
    },
    {
        id: "exception",
        text: `Something went wrong; please try again, and drop a note in the support server if this issue persists (see ${(0, codeblock_1.default)("/about")} or ${(0, codeblock_1.default)("/reportbug")}).`,
    },
    {
        id: "spotify_connect",
        text: "Something went wrong while connecting to the Spotify API to fetch the cover images.",
    },
];
class Template {
    constructor() {
        this.templates = templates;
    }
    get(id) {
        const template = this.templates.find((t) => t.id === id);
        return (template === null || template === void 0 ? void 0 : template.text) || "Unknown error code";
    }
}
exports.Template = Template;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Searches for a user in a server either by ID or username.
 *
 * @param interaction
 * @param args
 */
async function search_user(interaction, args) {
    var _a;
    if (args.length === 0) {
        return undefined;
    }
    const username = args.join(" ").trim().toLowerCase();
    let user;
    // workaround to support resolving user ID and searching username
    try {
        user = await interaction.guild.members.fetch({
            user: username,
            force: true,
        });
    }
    catch (_) {
        user = undefined;
    }
    if (!user) {
        user = (_a = (await interaction.guild.members.fetch({ query: username, limit: 1 }))) === null || _a === void 0 ? void 0 : _a.first(); // find similar username
    }
    return user ? user.user : undefined;
}
exports.default = search_user;

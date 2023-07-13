"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const truncate_1 = tslib_1.__importDefault(require("./truncate"));
/**
 * Escapes Discord's markdown characters.
 * @param text
 * @param truncate Truncates string, *after* "escaping", to 25 chars if set to true.
 * @returns
 */
function esm(text, truncate = false) {
    // https://stackoverflow.com/questions/39542872/escaping-discord-subset-of-markdown
    /* replace backticks (`) with single-quotes (') */
    const unescaped = text.replace(/[`]/g, "'");
    const escaped = unescaped
        .replace(/(\*|_|`|~|\\)/g, "\\$1") // escape *, _, `, ~, \
        .replace(/[[]/g, "⦋") // replace [ with ⦋ 'cause Discord embed can't handle it
        .replace(/[\]]/g, "⦌") // ditto ] with ⦌
        .trim();
    return truncate ? (0, truncate_1.default)(escaped, 25) : escaped;
}
exports.default = esm;

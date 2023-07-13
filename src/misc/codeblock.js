"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Function to wrap `text` in a single-backtick code-block.
 * - If there are backticks in `text`, they will be replaced to single-quotes.
 * @param text
 * Optional text to be added before `text`; this is generally where you'd set a server's prefix for when wrapping
 * a command in a code-block.
 */
function cb(text) {
    /* replace backticks (`) with single-quotes (') */
    const escaped = text.replace(/[`]/g, "'").trim();
    return "`" + escaped + "`";
}
exports.default = cb;

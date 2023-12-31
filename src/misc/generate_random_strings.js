"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Generates a random [A-Za-z0-9] string of the specified length.
 * @param length
 */
function generate_random_strings(length = 4) {
    // https://stackoverflow.com/a/1349426
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
exports.default = generate_random_strings;

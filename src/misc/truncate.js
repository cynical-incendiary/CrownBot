"use strict";
/**
 * Function to truncate string to n-size.
 * @param str String to truncate
 * @param n
 * @returns Truncated string
 */
Object.defineProperty(exports, "__esModule", { value: true });
function truncate_str(str, n) {
    return str.length > n ? str.substr(0, n - 1) + "..." : str;
}
exports.default = truncate_str;

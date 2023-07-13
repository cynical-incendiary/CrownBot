"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const moment_1 = tslib_1.__importDefault(require("moment"));
/**
 * Calculates the time difference between specified time and now.
 *
 * TODO: Improve this function to be more flexible.
 * @param timestamp
 */
function time_difference(timestamp) {
    const then = moment_1.default.utc(timestamp);
    const now = (0, moment_1.default)();
    const days = now.diff(then, "days");
    const hours = now.subtract(days, "days").diff(then, "hours");
    const minutes = now.subtract(hours, "hours").diff(then, "minutes");
    const string = `${days > 0 ? days + " day(s)" : ""} ${hours > 0 ? hours + " hour(s)" : ""} ${days < 1 && hours < 1 && minutes > 0 ? minutes + " minute(s)" : ""} ${days < 1 && hours < 1 && minutes < 1 ? "less than a minute" : ""}
  `.trim();
    return string;
}
exports.default = time_difference;

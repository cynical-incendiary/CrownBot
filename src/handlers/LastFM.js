"use strict";
var _LastFM_apikey;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LastFM = void 0;
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
const querystring_1 = require("querystring");
const { LASTFM_API_KEY } = process.env;
// custom overrides for vague or unfitting Last.fm error messages
const error_overrides = [
    {
        code: "17",
        message: "Please disable the 'Hide recent listening' option on your Last.fm account for this function to work.\
\n(Last.fm -> Settings -> Privacy -> Recent listening -> uncheck Hide recent listening information)",
    },
];
class LastFM {
    constructor() {
        this.timeout = { timeout: 30 * 1000 };
        this.format = "json";
        _LastFM_apikey.set(this, LASTFM_API_KEY);
        this.url = "https://ws.audioscrobbler.com/2.0/?";
    }
    /**
     * Centralized method to make queries to the Last.fm API.
     * @param params
     */
    async query(params) {
        var _a, _b;
        if (!tslib_1.__classPrivateFieldGet(this, _LastFM_apikey, "f"))
            throw "Last.fm API is not set in the environment variable.";
        const query = {
            api_key: tslib_1.__classPrivateFieldGet(this, _LastFM_apikey, "f"),
            format: "json",
            ...params,
        };
        const response = await axios_1.default.get(this.url + (0, querystring_1.stringify)(query), this.timeout)
            .then((res) => res)
            .catch((error) => error.response || error);
        const error_message = error_overrides.find((e) => { var _a; return e.code == ((_a = response.data) === null || _a === void 0 ? void 0 : _a.error); });
        const reply = {
            lastfm_errorcode: (_a = response.data) === null || _a === void 0 ? void 0 : _a.error,
            lastfm_errormessage: error_message
                ? error_message.message
                : (_b = response.data) === null || _b === void 0 ? void 0 : _b.message,
            axios_status: response.status,
            data: response.data,
            success: false,
        };
        // check if it was a success
        if (reply.axios_status === 200 && !reply.lastfm_errorcode && reply.data) {
            reply.success = true;
            if (!this.custom_check(reply)) {
                reply.success = false;
            }
        }
        return reply;
    }
    /**
     * Placeholder method to be replaced by the LastFM components.
     * @param data
     */
    custom_check(data) {
        return !!data;
    }
}
exports.LastFM = LastFM;
_LastFM_apikey = new WeakMap();

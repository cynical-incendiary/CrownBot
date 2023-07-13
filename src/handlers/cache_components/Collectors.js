"use strict";
var _Collectors_entries;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collectors = void 0;
const tslib_1 = require("tslib");
class Collectors {
    constructor() {
        _Collectors_entries.set(this, []);
    }
    async init() {
        // placeholder, not needed
        return true;
    }
    get() {
        return tslib_1.__classPrivateFieldGet(this, _Collectors_entries, "f");
    }
    add(collector) {
        // remove ended entries
        tslib_1.__classPrivateFieldSet(this, _Collectors_entries, tslib_1.__classPrivateFieldGet(this, _Collectors_entries, "f").filter((e) => !e.ended), "f");
        if (tslib_1.__classPrivateFieldGet(this, _Collectors_entries, "f").length > 100)
            tslib_1.__classPrivateFieldGet(this, _Collectors_entries, "f").length = 90;
        tslib_1.__classPrivateFieldGet(this, _Collectors_entries, "f").unshift(collector);
    }
}
exports.Collectors = Collectors;
_Collectors_entries = new WeakMap();
